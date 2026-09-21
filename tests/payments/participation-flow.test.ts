import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  beginParticipation,
  deliverParticipation,
  participationEmail,
  participationView,
  verifyParticipation
} from '../../src/lib/server/participation';
import * as store from '../../src/lib/server/participation-store';
import * as database from '../../src/lib/server/payment-store';
import * as genie from '../../src/lib/server/genie';
import { encryptDetails } from '../../src/lib/server/payment-security';
import { PaymentError } from '../../src/lib/server/payment-config';

vi.mock('../../src/lib/server/participation-store');
vi.mock('../../src/lib/server/payment-store');
vi.mock('../../src/lib/server/genie', async (original) => ({
  ...(await original<typeof import('../../src/lib/server/genie')>()),
  getTransaction: vi.fn(),
  createTransaction: vi.fn()
}));
const reference = '4f07dbbb-f612-4f46-96db-cf8823ffc395';
const details = {
  website: 'example.com',
  name: 'Test Entrant',
  email: 'stored@example.com',
  organisation: 'Example Ltd',
  phone: '0770000000'
};
let record: store.ParticipationRecord;
const sql = vi.fn();
const fetchMock = vi.fn();
const transaction = () => ({
  id: '65c509dcf003980008fbb808',
  localId: reference,
  amount: record.amount,
  currency: 'LKR',
  state: 'CONFIRMED',
  merchantId: 'merchant',
  originatorApp: 'app',
  url: 'https://transaction.geniebiz.lk/pay'
});
beforeEach(() => {
  vi.stubEnv('PAYMENT_DATA_KEY', 'ab'.repeat(32));
  vi.stubEnv(
    'GENIE_API_KEY',
    `eyJ.${Buffer.from(JSON.stringify({ appId: 'app', companyId: 'merchant' })).toString('base64url')}.signature`
  );
  vi.stubEnv('GENIE_APP_ID', 'app');
  vi.stubEnv('GENIE_API_BASE_URL', 'https://api.geniebiz.lk');
  vi.stubEnv('PAYMENT_SITE_URL', 'https://bestwebsiteaward.com');
  vi.stubEnv('CONTACT_TO_EMAIL', 'team@example.com');
  vi.stubEnv('RESEND_API_KEY', 'test-key');
  record = {
    id: reference,
    nomination_id: reference,
    website_key: 'ab'.repeat(32),
    owner_hash: 'owner',
    details: encryptDetails(details, `participation:${reference}`),
    package_code: 'C',
    extra_trophy: true,
    attendees: 3,
    amount: 7_885_000,
    currency: 'LKR',
    terms_version: '2026-09-22',
    app_id: 'app',
    merchant_id: 'merchant',
    sandbox: false,
    transaction_id: '65c509dcf003980008fbb808',
    checkout_url: 'https://transaction.geniebiz.lk/pay',
    state: 'pending',
    provider_state: 'INITIATED',
    paid_at: null,
    customer_email_id: null,
    team_email_id: null
  };
  vi.mocked(store.findParticipation).mockImplementation(async () => record);
  vi.mocked(store.insertParticipation).mockImplementation(async () => ({ record, created: true }));
  vi.mocked(store.saveParticipationTransaction).mockImplementation(async (_record, t, state) => {
    record = { ...record, transaction_id: t.id, state };
    return record;
  });
  sql.mockResolvedValue([]);
  vi.mocked(database.db).mockReturnValue(sql as never);
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ id: 'email-id' }), { status: 200 }));
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetAllMocks();
});

describe('participation payment integrity', () => {
  it('keeps personal nomination details off the browser response', () => {
    const view = JSON.stringify(participationView(record));
    for (const privateValue of [details.email, details.name, details.phone, details.organisation])
      expect(view).not.toContain(privateValue);
  });
  it('does not create another transaction when the database finds an active payment', async () => {
    vi.mocked(store.insertParticipation).mockResolvedValue({ record, created: false });
    await beginParticipation(reference, 'owner', {
      packageCode: 'C',
      extraTrophy: true,
      attendees: 3
    });
    expect(genie.createTransaction).not.toHaveBeenCalled();
  });
  it('does not trust a CONFIRMED claim from transaction creation', async () => {
    vi.mocked(genie.createTransaction).mockResolvedValue(transaction());
    const view = await beginParticipation(reference, 'owner', {
      packageCode: 'C',
      extraTrophy: true,
      attendees: 3
    });
    expect(view.state).toBe('pending');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(genie.createTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 7_885_000,
        webhook: 'https://bestwebsiteaward.com/api/participation/webhook',
        allowRetry: false
      })
    );
  });
  it('holds ambiguous creation for recovery instead of allowing another charge', async () => {
    record.state = 'creating';
    record.transaction_id = null;
    vi.mocked(genie.createTransaction).mockRejectedValue(new Error('timeout'));
    expect(
      (
        await beginParticipation(reference, 'owner', {
          packageCode: 'C',
          extraTrophy: true,
          attendees: 3
        })
      ).state
    ).toBe('creating');
    expect(sql).not.toHaveBeenCalled();
  });
  it('marks only definitive provider rejection as a failed creation', async () => {
    vi.mocked(genie.createTransaction).mockRejectedValue(new PaymentError('rejected', 502, true));
    await beginParticipation(reference, 'owner', {
      packageCode: 'C',
      extraTrophy: true,
      attendees: 3
    });
    expect(sql).toHaveBeenCalledOnce();
  });
  it.each([
    { amount: 1 },
    { currency: 'USD' },
    { merchantId: 'wrong' },
    { originatorApp: 'wrong' },
    { localId: 'wrong' },
    { id: '111111111111111111111111' }
  ])('rejects provider mismatch %j before changing payment state', async (mismatch) => {
    vi.mocked(genie.getTransaction).mockResolvedValue({ ...transaction(), ...mismatch });
    await expect(verifyParticipation(record)).rejects.toThrow('could not be verified');
    expect(store.saveParticipationTransaction).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('sends refunds to review', async () => {
    vi.mocked(genie.getTransaction).mockResolvedValue({ ...transaction(), state: 'REFUNDED' });
    expect((await verifyParticipation(record)).state).toBe('review');
  });
  it('never uses a checkout link from an untrusted host', () => {
    expect(
      participationView({
        ...record,
        checkout_url: 'https://transaction.geniebiz.lk.evil.test/pay'
      }).checkoutUrl
    ).toBeUndefined();
  });
});
describe('participation confirmation emails', () => {
  it.each(['pending', 'creating', 'failed', 'review'] as const)(
    'never emails an unconfirmed payment in %s state',
    async (state) => {
      await deliverParticipation({ ...record, state });
      expect(sql).not.toHaveBeenCalled();
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );
  it('uses only the stored nomination email and configured team address', () => {
    const customer = participationEmail(record, details, false);
    const team = participationEmail(record, details, true);
    expect(customer.to).toEqual(['stored@example.com']);
    expect(team.to).toEqual(['team@example.com']);
    expect(customer.text).toContain('Total paid: LKR 78,850');
    expect(customer.text).toContain('Total attendees: 3');
    expect(team.text).toContain('Nomination email: stored@example.com');
    expect(
      participationEmail(record, { ...details, organisation: '<script>alert(1)</script>' }, true)
        .html
    ).not.toContain('<script>');
  });
  it('does not send while another request owns the email lease', async () => {
    await deliverParticipation({ ...record, state: 'paid' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('uses separate stable recipient idempotency keys', async () => {
    record.state = 'paid';
    sql.mockResolvedValueOnce([record]);
    fetchMock.mockImplementation(
      async () => new Response(JSON.stringify({ id: 'email-id' }), { status: 200 })
    );
    await deliverParticipation(record);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map((call) => call[1].headers['Idempotency-Key']).sort()).toEqual([
      `bwa-participation-customer-${reference}`,
      `bwa-participation-team-${reference}`
    ]);
  });
  it('retries only the missing recipient after a partial email success', async () => {
    record.state = 'paid';
    record.customer_email_id = 'already-sent';
    sql.mockResolvedValueOnce([record]);
    await deliverParticipation(record);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(JSON.parse(fetchMock.mock.calls[0]![1].body).to).toEqual(['team@example.com']);
  });
  it('preserves confirmed payment on email failure', async () => {
    record.state = 'paid';
    sql.mockResolvedValueOnce([record]);
    fetchMock.mockRejectedValue(new Error('network'));
    const result = await deliverParticipation(record);
    expect(result.state).toBe('paid');
    expect(participationView(result).message).toContain('do not pay again');
  });
  it('never resends once both confirmations have provider IDs', async () => {
    await deliverParticipation({
      ...record,
      state: 'paid',
      customer_email_id: 'c',
      team_email_id: 't'
    });
    expect(sql).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

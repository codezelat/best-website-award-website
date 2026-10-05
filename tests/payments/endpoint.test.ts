import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST, GET } from '../../src/pages/api/nomination/[action]';
import * as genie from '../../src/lib/server/genie';
import * as store from '../../src/lib/server/payment-store';
import * as payments from '../../src/lib/server/payments';
import * as leads from '../../src/lib/server/nomination-leads';
import * as delivery from '../../src/lib/server/contact-delivery';
import type { PaymentRecord } from '../../src/lib/server/payment-store';

vi.mock('../../src/lib/server/genie');
vi.mock('../../src/lib/server/payment-store');
vi.mock('../../src/lib/server/payments');
vi.mock('../../src/lib/server/nomination-leads');
vi.mock('../../src/lib/server/contact-delivery');
vi.mock('../../src/lib/server/payment-config', async (original) => ({
  ...(await original<typeof import('../../src/lib/server/payment-config')>()),
  assertPaymentEnabled: vi.fn()
}));
const reference = '4f07dbbb-f612-4f46-96db-cf8823ffc395';
const transactionId = '65c509dcf003980008fbb808';
const record = {
  id: reference,
  state: 'pending',
  transaction_id: transactionId,
  email_sent_at: null
} as PaymentRecord;
const webhook = (body: unknown) =>
  ({
    params: { action: 'webhook' },
    request: new Request('https://bestwebsiteaward.com/api/nomination/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  }) as never;
beforeEach(() => {
  vi.mocked(genie.validWebhookSignature).mockReturnValue(true);
  vi.mocked(store.findPayment).mockResolvedValue(record);
  vi.mocked(store.findPaymentByTransaction).mockResolvedValue(record);
  vi.mocked(payments.verifyPayment).mockResolvedValue(record);
  vi.mocked(payments.deliverPaidNomination).mockResolvedValue(record);
});
afterEach(() => vi.resetAllMocks());

describe('nomination endpoint boundaries', () => {
  const formContext = (action: string, privacy = true) => {
    const body = new FormData();
    Object.entries({
      submissionId: reference,
      enquiryType: 'present',
      name: 'Test Entrant',
      email: 'test@example.com',
      organisation: 'Example Studio',
      website: 'https://example.com',
      privacyAccepted: privacy ? 'yes' : '',
      'cf-turnstile-response': 'token',
      paymentTerms: '2026-09-09'
    }).forEach(([key, value]) => body.set(key, value));
    return {
      params: { action },
      request: new Request(`https://bestwebsiteaward.com/api/nomination/${action}`, {
        method: 'POST',
        headers: { Origin: 'https://bestwebsiteaward.com' },
        body
      }),
      cookies: { get: () => ({ value: 'ab'.repeat(32) }) }
    } as never;
  };
  it('closes all public nomination intake actions for the completed 2026 programme', async () => {
    for (const action of ['session', 'lead', 'start']) {
      const response = await POST(formContext(action));
      expect(response.status, action).toBe(410);
      expect(await response.json()).toMatchObject({
        ok: false,
        message: 'Nominations for 2026 are closed.'
      });
    }
    expect(leads.captureLead).not.toHaveBeenCalled();
    expect(payments.beginPayment).not.toHaveBeenCalled();
    expect(delivery.verifyTurnstile).not.toHaveBeenCalled();
  });
  it('rejects unsigned callbacks without querying the database or provider', async () => {
    vi.mocked(genie.validWebhookSignature).mockReturnValue(false);
    const response = await POST(webhook({ transactionId, localId: reference }));
    expect(response.status).toBe(401);
    expect(store.findPayment).not.toHaveBeenCalled();
    expect(payments.verifyPayment).not.toHaveBeenCalled();
  });
  it('uses transactionId, not the webhook event id or its untrusted paid claim', async () => {
    const response = await POST(
      webhook({ id: 'event-id', transactionId, localId: reference, state: 'CONFIRMED', amount: 1 })
    );
    expect(response.status).toBe(200);
    expect(payments.verifyPayment).toHaveBeenCalledWith(record, transactionId);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
  });
  it('supports events without a local reference', async () => {
    const response = await POST(webhook({ transactionId }));
    expect(response.status).toBe(200);
    expect(store.findPaymentByTransaction).toHaveBeenCalledWith(transactionId);
  });
  it('recovers ambiguous creation using the authoritative local reference', async () => {
    vi.mocked(store.findPaymentByTransaction).mockResolvedValue(undefined);
    vi.mocked(genie.getTransaction).mockResolvedValue({ localId: reference });
    await POST(webhook({ transactionId }));
    expect(genie.getTransaction).toHaveBeenCalledWith(transactionId);
    expect(payments.verifyPayment).toHaveBeenCalledWith(record, transactionId);
  });
  it('requests a provider retry if the confirmed nomination is still waiting for email', async () => {
    vi.mocked(payments.deliverPaidNomination).mockResolvedValue({ ...record, state: 'paid' });
    expect((await POST(webhook({ transactionId, localId: reference }))).status).toBe(503);
  });
  it('does not expose a nomination to a browser without its secure session', async () => {
    const response = await GET({
      params: { action: 'status' },
      url: new URL(`https://bestwebsiteaward.com/api/nomination/status?reference=${reference}`),
      cookies: { get: () => undefined }
    } as never);
    expect(response.status).toBe(401);
    expect(store.ownedPayment).not.toHaveBeenCalled();
  });
  it('does not let the public run reconciliation', async () => {
    const response = await GET({
      params: { action: 'reconcile' },
      request: new Request('https://bestwebsiteaward.com/api/nomination/reconcile')
    } as never);
    expect(response.status).toBe(401);
    expect(store.recoveryCandidates).not.toHaveBeenCalled();
  });
});

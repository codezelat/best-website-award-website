import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '../../src/pages/api/participation/[action]';
import * as store from '../../src/lib/server/participation-store';
import * as payments from '../../src/lib/server/participation';
import * as genie from '../../src/lib/server/genie';
import * as delivery from '../../src/lib/server/contact-delivery';
import { encryptDetails, hash } from '../../src/lib/server/payment-security';
import { PaymentError } from '../../src/lib/server/payment-config';

vi.mock('../../src/lib/server/participation-store');
vi.mock('../../src/lib/server/participation');
vi.mock('../../src/lib/server/genie');
vi.mock('../../src/lib/server/contact-delivery');
vi.mock('../../src/lib/server/payment-config', async (original) => ({
  ...(await original<typeof import('../../src/lib/server/payment-config')>()),
  assertPaymentEnabled: vi.fn()
}));
const reference = '4f07dbbb-f612-4f46-96db-cf8823ffc395';
const session = 'ab'.repeat(32);
let cookieValues: Record<string, string>;
const setCookie = vi.fn();
function context(action: string, data?: unknown, origin = 'https://bestwebsiteaward.com') {
  const url = new URL(`https://bestwebsiteaward.com/api/participation/${action}`);
  const request = new Request(url, {
    method: data === undefined ? 'GET' : 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    ...(data === undefined ? {} : { body: JSON.stringify(data) })
  });
  return {
    params: { action: action.split('?')[0] },
    url,
    request,
    clientAddress: '127.0.0.1',
    cookies: {
      get: (name: string) => (cookieValues[name] ? { value: cookieValues[name] } : undefined),
      set: setCookie
    }
  } as never;
}
beforeEach(() => {
  vi.stubEnv('PARTICIPATION_PAYMENTS_ENABLED', 'true');
  vi.stubEnv('ACCEPT_DEMO', '');
  vi.stubEnv('PAYMENT_DATA_KEY', 'ab'.repeat(32));
  cookieValues = {
    bwa_accept_session: session,
    bwa_accept_grant: encryptDetails(
      { nomination: reference, owner: hash(session), expires: Date.now() + 60000 },
      'participation-grant'
    )
  };
  vi.mocked(store.findPaidNomination).mockResolvedValue({ id: reference } as never);
  vi.mocked(store.activeParticipation).mockResolvedValue(undefined);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});
describe('participation API boundaries', () => {
  it('canonicalises addresses and issues a short-lived grant only after verification', async () => {
    const response = await POST(
      context('lookup', {
        website: 'HTTP://WWW.Example.COM/shop?utm_source=mail',
        token: 'verified-token'
      })
    );
    expect(response.status).toBe(200);
    expect(store.findPaidNomination).toHaveBeenCalledWith('example.com');
    expect(delivery.verifyTurnstile).toHaveBeenCalledOnce();
    expect(setCookie).toHaveBeenCalledWith(
      'bwa_accept_grant',
      expect.any(String),
      expect.objectContaining({ httpOnly: true, secure: true, sameSite: 'lax', maxAge: 1800 })
    );
    expect(await response.json()).toEqual({ ok: true, website: 'example.com' });
  });
  it('does not grant checkout when no paid nomination exists', async () => {
    vi.mocked(store.findPaidNomination).mockRejectedValue(
      new PaymentError('No paid nomination.', 404)
    );
    expect((await POST(context('lookup', { website: 'example.com', token: 'token' }))).status).toBe(
      404
    );
    expect(setCookie).not.toHaveBeenCalled();
    expect(payments.beginParticipation).not.toHaveBeenCalled();
  });
  it('fails closed when bot verification fails', async () => {
    vi.mocked(delivery.verifyTurnstile).mockRejectedValue(
      new PaymentError('Verification failed.', 403)
    );
    expect((await POST(context('lookup', { website: 'example.com' }))).status).toBe(403);
    expect(store.findPaidNomination).not.toHaveBeenCalled();
  });
  it('rejects cross-origin mutation before lookup', async () => {
    expect(
      (await POST(context('lookup', { website: 'example.com' }, 'https://evil.test'))).status
    ).toBe(403);
    expect(store.findPaidNomination).not.toHaveBeenCalled();
  });
  it('requires a valid server-issued grant', async () => {
    cookieValues.bwa_accept_grant = 'forged';
    expect(
      (
        await POST(
          context('start', {
            packageCode: 'A',
            attendees: 1,
            extraTrophy: false,
            terms: '2026-09-22'
          })
        )
      ).status
    ).toBe(401);
    expect(payments.beginParticipation).not.toHaveBeenCalled();
  });
  it('rejects expired grants', async () => {
    cookieValues.bwa_accept_grant = encryptDetails(
      { nomination: reference, owner: hash(session), expires: Date.now() - 1000 },
      'participation-grant'
    );
    expect(
      (
        await POST(
          context('start', {
            packageCode: 'A',
            attendees: 1,
            extraTrophy: false,
            terms: '2026-09-22'
          })
        )
      ).status
    ).toBe(401);
  });
  it.each([
    { packageCode: 'C', attendees: 1, extraTrophy: false },
    { packageCode: 'A', attendees: 11, extraTrophy: false },
    { packageCode: 'B', attendees: 1, extraTrophy: true }
  ])('rejects invalid choices at the HTTP boundary: %j', async (choice) => {
    expect((await POST(context('start', { ...choice, terms: '2026-09-22' }))).status).toBe(400);
    expect(payments.beginParticipation).not.toHaveBeenCalled();
  });
  it('ignores forged client price and email values', async () => {
    const response = await POST(
      context('start', {
        packageCode: 'C',
        attendees: 2,
        extraTrophy: false,
        terms: '2026-09-22',
        amount: 1,
        email: 'attacker@example.com'
      })
    );
    expect(response.status).toBe(200);
    expect(payments.beginParticipation).toHaveBeenCalledWith(reference, hash(session), {
      packageCode: 'C',
      attendees: 2,
      extraTrophy: false
    });
  });
  it('prevents another browser from starting a second active payment', async () => {
    vi.mocked(store.activeParticipation).mockResolvedValue({
      owner_hash: 'other',
      state: 'pending'
    } as never);
    expect((await POST(context('lookup', { website: 'example.com', token: 'token' }))).status).toBe(
      409
    );
    expect(setCookie).not.toHaveBeenCalled();
  });
  it('requires the browser session before a status database lookup', async () => {
    cookieValues = {};
    expect((await GET(context(`status?reference=${reference}`))).status).toBe(401);
    expect(store.findParticipation).not.toHaveBeenCalled();
  });
  it('rejects unsigned callbacks before using their paid claim', async () => {
    vi.mocked(genie.validWebhookSignature).mockReturnValue(false);
    expect(
      (
        await POST(
          context('webhook', {
            transactionId: '65c509dcf003980008fbb808',
            localId: reference,
            state: 'CONFIRMED'
          })
        )
      ).status
    ).toBe(401);
    expect(payments.verifyParticipation).not.toHaveBeenCalled();
    expect(store.findParticipation).not.toHaveBeenCalled();
  });
  it('does not expose the local demo on a public host even when its environment flag is set', async () => {
    vi.stubEnv('ACCEPT_DEMO', 'true');
    expect((await POST(context('demo-confirm', {}))).status).toBe(404);
    expect(payments.deliverParticipation).not.toHaveBeenCalled();
  });
  it('catches local demo rejection as a clean JSON response instead of an Astro error page', async () => {
    vi.stubEnv('ACCEPT_DEMO', 'true');
    const url = new URL('http://127.0.0.1:4322/api/participation/lookup');
    const local = {
      params: { action: 'lookup' },
      url,
      cookies: { get: () => undefined, set: vi.fn() },
      request: new Request(url, {
        method: 'POST',
        headers: { Origin: url.origin, 'Content-Type': 'application/json' },
        body: JSON.stringify({ website: 'not-eligible.example.com' })
      })
    };
    const response = await POST(local as never);
    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toEqual({
      ok: false,
      message: 'This website is not eligible for an award. Please try again next time.'
    });
  });
  it('returns no-store/noindex headers and rejects unauthenticated recovery', async () => {
    const response = await GET(context('reconcile'));
    expect(response.status).toBe(401);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
  });
});

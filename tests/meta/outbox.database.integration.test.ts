import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../../src/lib/server/payment-store';
import { hash, encryptDetails } from '../../src/lib/server/payment-security';
import {
  queueMetaEvent,
  revokeMetaConsent,
  trackPaidMeta,
  type MetaContext
} from '../../src/lib/server/meta-conversions';
import type { PaymentRecord } from '../../src/lib/server/payment-store';

// Real database, mocked Meta transport: never creates events in the actual dataset.
describe.skipIf(process.env.BWA_DB_TEST !== '1')('Meta durable event outbox', () => {
  let consent: string;
  let reference: string;
  let context: MetaContext;
  let deliveries: Array<Record<string, unknown>>;
  let accept: boolean;
  beforeEach(() => {
    consent = randomUUID();
    reference = randomUUID();
    deliveries = [];
    accept = true;
    context = {
      consentId: hash(consent),
      sourceUrl: 'https://bestwebsiteaward.com/contact',
      userData: { client_user_agent: 'BWA isolated integration test' }
    };
    vi.stubEnv('META_CAPI_ENABLED', 'true');
    vi.stubEnv('META_TEST_EVENT_CODE', 'MOCK_ONLY');
    vi.stubEnv('META_CAPI_ACCESS_TOKEN', 'mock-only');
    const originalFetch = globalThis.fetch;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, options) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.startsWith('https://graph.facebook.com/')) {
        deliveries.push(JSON.parse(String(options?.body)).data[0]);
        return new Response(
          JSON.stringify(accept ? { events_received: 1 } : { error: { code: 2 } }),
          { status: accept ? 200 : 503 }
        );
      }
      return originalFetch(input, options);
    });
  });
  afterEach(async () => {
    await db()`DELETE FROM bwa.meta_events WHERE consent_id = ${context.consentId}`;
    await db()`DELETE FROM bwa.meta_consents WHERE id = ${context.consentId}`;
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });
  it('stores failures encrypted and retries the same event once across concurrent callers', async () => {
    accept = false;
    await queueMetaEvent(context, 'Lead', reference);
    const id = `bwa:Lead:${reference}`;
    const rows = await db()`SELECT * FROM bwa.meta_events WHERE id = ${id}`;
    expect(rows[0]?.payload).not.toContain('BWA isolated');
    expect(rows[0]?.sent_at).toBeNull();
    expect(rows[0]?.attempts).toBe(1);
    accept = true;
    await db()`UPDATE bwa.meta_events SET retry_after = now() WHERE id = ${id}`;
    await Promise.all([
      queueMetaEvent(context, 'Lead', reference),
      queueMetaEvent(context, 'Lead', reference)
    ]);
    expect(deliveries).toHaveLength(2);
    expect(deliveries[1]).toEqual(deliveries[0]);
    const sent = await db()`SELECT sent_at, payload FROM bwa.meta_events WHERE id = ${id}`;
    expect(sent[0]?.sent_at).toBeTruthy();
    expect(sent[0]?.payload).toBe('');
  }, 30_000);
  it('revocation prevents queued and later server events', async () => {
    accept = false;
    await queueMetaEvent(context, 'Lead', reference);
    await revokeMetaConsent(new Request('https://bestwebsiteaward.com/api/meta'), consent);
    accept = true;
    await queueMetaEvent(context, 'Contact', reference);
    expect(deliveries).toHaveLength(1);
    expect(
      await db()`SELECT id FROM bwa.meta_events WHERE consent_id = ${context.consentId}`
    ).toHaveLength(0);
  }, 30_000);
  it('records verified paid registrations and revenue once using the original payment time', async () => {
    const time = new Date(Date.now() - 10_000).toISOString();
    const record = {
      id: reference,
      state: 'paid',
      paid_at: time,
      sandbox: false,
      amount: 285000,
      currency: 'LKR',
      details: encryptDetails({ meta: context }, reference)
    } as PaymentRecord;
    await trackPaidMeta(record);
    await trackPaidMeta(record);
    expect(deliveries.map((event) => event.event_name)).toEqual([
      'CompleteRegistration',
      'Purchase'
    ]);
    expect(deliveries[1]?.custom_data).toEqual({ value: 2850, currency: 'LKR' });
    expect(deliveries[0]?.event_time).toBe(Math.floor(new Date(time).getTime() / 1000));
  }, 30_000);
});

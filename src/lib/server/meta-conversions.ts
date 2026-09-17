import { isIP } from 'node:net';
import { META_CONSENT_COOKIE, META_PIXEL_ID, metaEventId, type MetaEventName } from '../meta';
import { validReference } from '../payments/policy';
import { env } from './payment-config';
import { decryptDetails, encryptDetails, hash } from './payment-security';
import { db, type PaymentRecord } from './payment-store';
import type { DeliveryDetails } from './contact-delivery';

export interface MetaContext {
  consentId: string;
  sourceUrl: string;
  userData: Record<string, string | string[]>;
}
export interface MetaEvent {
  event_name: MetaEventName;
  event_time: number;
  event_id: string;
  event_source_url: string;
  action_source: 'website';
  user_data: MetaContext['userData'];
  custom_data?: Record<string, string | number>;
}

export function metaEnabled() {
  return (
    env('META_CAPI_ENABLED') === 'true' &&
    Boolean(env('META_CAPI_ACCESS_TOKEN')) &&
    (env('VERCEL_ENV') === 'production' || Boolean(env('META_TEST_EVENT_CODE')))
  );
}

function cookie(request: Request, name: string) {
  return (
    (request.headers.get('cookie') || '')
      .split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`))
      ?.slice(name.length + 1) || ''
  );
}

export function metaContext(
  request: Request,
  address?: string,
  person?: { email: string; phone?: string }
): MetaContext | undefined {
  const consent = cookie(request, META_CONSENT_COOKIE);
  if (!metaEnabled() || !validReference(consent)) return;
  const origin = new URL(request.url).origin;
  let source: URL;
  try {
    source = new URL(request.headers.get('referer') || origin);
  } catch {
    return;
  }
  if (source.origin !== origin) return;
  // Never forward query strings, payment references, fragments or form contents.
  const sourceUrl = `${origin}${source.pathname}`;
  const agent = request.headers.get('user-agent')?.slice(0, 1024);
  if (!agent) return;
  const userData: MetaContext['userData'] = { client_user_agent: agent };
  if (address && isIP(address)) userData.client_ip_address = address;
  for (const name of ['fbp', 'fbc']) {
    const value = cookie(request, `_${name}`);
    if (/^fb\.\d\.\d{13}\.[A-Za-z0-9_-]{1,500}$/.test(value)) userData[name] = value;
  }
  if (person?.email) userData.em = [hash(person.email.trim().toLowerCase())];
  // The form has no country selector. Only hash explicit international numbers.
  const phone = person?.phone?.trim();
  if (phone && /^(\+|00)[\d\s().-]+$/.test(phone)) {
    const digits = phone.replace(/^00/, '').replace(/\D/g, '');
    if (/^[1-9]\d{7,14}$/.test(digits)) userData.ph = [hash(digits)];
  }
  return { consentId: hash(consent), sourceUrl, userData };
}

export function buildMetaEvent(
  context: MetaContext,
  name: MetaEventName,
  reference: string,
  time = Date.now(),
  custom?: MetaEvent['custom_data']
): MetaEvent {
  return {
    event_name: name,
    event_time: Math.floor(time / 1000),
    event_id: metaEventId(name, reference),
    event_source_url: context.sourceUrl,
    action_source: 'website',
    user_data: context.userData,
    ...(custom ? { custom_data: custom } : {})
  };
}

export async function sendMetaEvent(event: MetaEvent): Promise<boolean> {
  const response = await fetch(`https://graph.facebook.com/v26.0/${META_PIXEL_ID}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env('META_CAPI_ACCESS_TOKEN')}`
    },
    body: JSON.stringify({
      data: [event],
      ...(env('META_TEST_EVENT_CODE') ? { test_event_code: env('META_TEST_EVENT_CODE') } : {})
    }),
    signal: AbortSignal.timeout(3000)
  });
  const result = (await response.json()) as { events_received?: number; error?: { code?: number } };
  if (!response.ok || result.events_received !== 1) {
    console.warn('Meta event delivery deferred', {
      status: response.status,
      code: result.error?.code
    });
    return false;
  }
  return true;
}

async function deliverEvent(id: string) {
  const rows =
    await db()`UPDATE bwa.meta_events SET attempts = attempts + 1, retry_after = now() + interval '5 minutes'
    WHERE id = ${id} AND sent_at IS NULL AND retry_after <= now() AND attempts < 12
    AND created_at > now() - interval '6 days'
    AND EXISTS (SELECT 1 FROM bwa.meta_consents c WHERE c.id = consent_id AND NOT c.revoked)
    RETURNING payload`;
  if (!rows[0]) return;
  const event = decryptDetails<MetaEvent>(rows[0].payload, `meta:${id}`);
  if (await sendMetaEvent(event))
    await db()`UPDATE bwa.meta_events SET sent_at = now(), payload = '' WHERE id = ${id}`;
}

// Analytics failures never change a successful form submission or payment outcome.
export async function queueMetaEvent(
  context: MetaContext | undefined,
  name: MetaEventName,
  reference: string,
  time = Date.now(),
  custom?: MetaEvent['custom_data']
) {
  if (!context || !metaEnabled()) return;
  try {
    if (!Number.isFinite(time) || time < Date.now() - 6 * 86400_000) return;
    await db()`INSERT INTO bwa.meta_consents (id) VALUES (${context.consentId}) ON CONFLICT DO NOTHING`;
    const event = buildMetaEvent(context, name, reference, time, custom);
    const payload = encryptDetails(event, `meta:${event.event_id}`);
    await db()`INSERT INTO bwa.meta_events (id, consent_id, payload)
      SELECT ${event.event_id}, ${context.consentId}, ${payload}
      WHERE EXISTS (SELECT 1 FROM bwa.meta_consents WHERE id = ${context.consentId} AND NOT revoked)
      AND (SELECT count(*) FROM bwa.meta_events WHERE consent_id = ${context.consentId} AND created_at > now() - interval '1 minute') < 30
      ON CONFLICT DO NOTHING`;
    await deliverEvent(event.event_id);
  } catch {
    console.warn('Meta event delivery deferred');
  }
}

export async function revokeMetaConsent(request: Request, supplied?: unknown) {
  const value = typeof supplied === 'string' ? supplied : cookie(request, META_CONSENT_COOKIE);
  if (!validReference(value) || !metaEnabled()) return;
  const id = hash(value);
  await db()`INSERT INTO bwa.meta_consents (id, revoked) VALUES (${id}, true) ON CONFLICT (id) DO UPDATE SET revoked = true`;
  await db()`DELETE FROM bwa.meta_events WHERE consent_id = ${id} AND sent_at IS NULL`;
}

export async function trackPaidMeta(record: PaymentRecord) {
  if (
    !metaEnabled() ||
    record.state !== 'paid' ||
    !record.paid_at ||
    (record.sandbox && !env('META_TEST_EVENT_CODE'))
  )
    return;
  try {
    const details = decryptDetails<DeliveryDetails>(record.details, record.id);
    if (!details.meta) return;
    const time = new Date(record.paid_at).getTime();
    await queueMetaEvent(details.meta, 'CompleteRegistration', record.id, time);
    await queueMetaEvent(details.meta, 'Purchase', record.id, time, {
      value: record.amount / 100,
      currency: record.currency
    });
  } catch {
    console.warn('Meta payment event deferred');
  }
}

export async function recoverMetaEvents() {
  if (!metaEnabled()) return { checked: 0 };
  // Retain delivered IDs for deduplication, but remove matching data after delivery.
  await db()`DELETE FROM bwa.meta_events WHERE created_at < now() - interval '30 days'`;
  await db()`UPDATE bwa.meta_events SET payload = '' WHERE sent_at IS NULL AND created_at < now() - interval '6 days'`;
  const rows = await db()`SELECT id FROM bwa.meta_events WHERE sent_at IS NULL AND attempts < 12
    AND retry_after <= now() AND created_at > now() - interval '6 days' ORDER BY created_at LIMIT 20`;
  await Promise.allSettled(rows.map((row) => deliverEvent(row.id)));
  return { checked: rows.length };
}

import { randomUUID } from 'node:crypto';
import {
  normaliseWebsite,
  participationQuote,
  PARTICIPATION_TERMS,
  type ParticipationChoice
} from '../participation/policy';
import { db, findPayment, type PaymentRecord } from './payment-store';
import { decryptDetails, encryptDetails, hash } from './payment-security';
import { paymentConfig, PaymentError } from './payment-config';
import type { DeliveryDetails } from './contact-delivery';
import { eligibleNomination, INELIGIBLE_MESSAGE } from './participation-eligibility';

export interface ParticipationDetails {
  website: string;
  name: string;
  email: string;
  organisation: string;
  phone: string;
}
export interface ParticipationRecord {
  id: string;
  nomination_id: string;
  website_key: string;
  owner_hash: string;
  details: string;
  package_code: ParticipationChoice['packageCode'];
  extra_trophy: boolean;
  attendees: number;
  amount: number;
  currency: string;
  terms_version: string;
  app_id: string;
  merchant_id: string;
  sandbox: boolean;
  transaction_id: string | null;
  checkout_url: string | null;
  state: PaymentRecord['state'];
  provider_state: string | null;
  paid_at: string | null;
  customer_email_id: string | null;
  team_email_id: string | null;
}
export async function indexPaidNominations() {
  const config = paymentConfig();
  const rows = await db()`SELECT p.id, p.details FROM bwa.nomination_payments p
    LEFT JOIN bwa.participation_nomination_index i ON i.nomination_id = p.id
    WHERE p.state = 'paid' AND p.app_id = ${config.appId} AND p.sandbox = ${config.sandbox}
    AND i.nomination_id IS NULL ORDER BY p.created_at LIMIT 1001`;
  const entries = rows.slice(0, 1000).map((row) => {
    const details = decryptDetails<DeliveryDetails>(row.details, row.id);
    return { id: row.id, key: hash(normaliseWebsite(details.submission.website)) };
  });
  if (entries.length)
    await db()`INSERT INTO bwa.participation_nomination_index (nomination_id, website_key)
    SELECT (item->>'id')::uuid, item->>'key' FROM jsonb_array_elements(${JSON.stringify(entries)}::jsonb) item
    ON CONFLICT DO NOTHING`;
  if (rows.length > 1000)
    throw new PaymentError(
      'We are preparing nomination records. Please check your website again shortly.'
    );
  return entries.length;
}
export async function limitLookup(key: string) {
  const rows = await db()`INSERT INTO bwa.participation_lookup_limits (key) VALUES (${key})
    ON CONFLICT (key) DO UPDATE SET
      hits = CASE WHEN bwa.participation_lookup_limits.reset_at < now() THEN 1 ELSE bwa.participation_lookup_limits.hits + 1 END,
      reset_at = CASE WHEN bwa.participation_lookup_limits.reset_at < now() THEN now() + interval '15 minutes' ELSE bwa.participation_lookup_limits.reset_at END
    RETURNING hits`;
  if (rows[0].hits > 15)
    throw new PaymentError('Please wait 15 minutes before checking more websites.', 429);
}
export async function findPaidNomination(website: string) {
  const config = paymentConfig();
  await indexPaidNominations();
  const rows = await db()`SELECT p.* FROM bwa.nomination_payments p
    JOIN bwa.participation_nomination_index i ON i.nomination_id = p.id
    WHERE i.website_key = ${hash(website)} AND p.state = 'paid'
    AND p.app_id = ${config.appId} AND p.merchant_id = ${config.merchantId} AND p.sandbox = ${config.sandbox}
    ORDER BY p.created_at DESC, p.paid_at DESC NULLS LAST, p.id DESC LIMIT 1`;
  if (!eligibleNomination(rows[0] as PaymentRecord | undefined))
    throw new PaymentError(INELIGIBLE_MESSAGE, 404);
  return rows[0] as PaymentRecord;
}
export async function findParticipation(id: string) {
  const rows = await db()`SELECT * FROM bwa.participation_payments WHERE id = ${id}::uuid`;
  return rows[0] as ParticipationRecord | undefined;
}
export async function activeParticipation(websiteKey: string) {
  const config = paymentConfig();
  const rows = await db()`SELECT * FROM bwa.participation_payments WHERE website_key = ${websiteKey}
    AND app_id = ${config.appId} AND sandbox = ${config.sandbox} AND state IN ('creating','pending','paid','review') LIMIT 1`;
  return rows[0] as ParticipationRecord | undefined;
}
export function assertOwner(
  record: ParticipationRecord | undefined,
  owner: string
): asserts record is ParticipationRecord {
  const config = paymentConfig();
  if (
    !record ||
    record.owner_hash !== owner ||
    record.app_id !== config.appId ||
    record.merchant_id !== config.merchantId ||
    record.sandbox !== config.sandbox
  )
    throw new PaymentError(
      'This payment is not available in this browser. Contact info@gbeaward.com if you have already paid.',
      404
    );
}
export async function insertParticipation(
  nominationId: string,
  owner: string,
  choice: ParticipationChoice
) {
  const config = paymentConfig();
  const nomination = await findPayment(nominationId);
  if (
    !nomination ||
    nomination.state !== 'paid' ||
    nomination.app_id !== config.appId ||
    nomination.merchant_id !== config.merchantId ||
    nomination.sandbox !== config.sandbox
  )
    throw new PaymentError(INELIGIBLE_MESSAGE, 409);
  // Refresh at checkout in case another nomination was paid after the lookup.
  const original = decryptDetails<DeliveryDetails>(nomination.details, nomination.id);
  const latest = await findPaidNomination(normaliseWebsite(original.submission.website));
  const { submission } = decryptDetails<DeliveryDetails>(latest.details, latest.id);
  const website = normaliseWebsite(submission.website);
  const quote = participationQuote(choice);
  const id = randomUUID();
  const details: ParticipationDetails = {
    website,
    name: submission.name,
    email: submission.email,
    organisation: submission.organisation,
    phone: submission.phone
  };
  const encrypted = encryptDetails(details, `participation:${id}`);
  const rows = await db()`INSERT INTO bwa.participation_payments
    (id, nomination_id, website_key, owner_hash, details, package_code, extra_trophy, attendees, amount, currency, terms_version, app_id, merchant_id, sandbox)
    VALUES (${id}::uuid, ${latest.id}::uuid, ${hash(website)}, ${owner}, ${encrypted}, ${choice.packageCode}, ${choice.extraTrophy}, ${choice.attendees}, ${quote.total}, 'LKR', ${PARTICIPATION_TERMS}, ${config.appId}, ${config.merchantId}, ${config.sandbox})
    ON CONFLICT DO NOTHING RETURNING *`;
  if (rows[0]) return { record: rows[0] as ParticipationRecord, created: true };
  const existing = await activeParticipation(hash(website));
  if (!existing)
    throw new PaymentError('Please check your participation status before trying again.', 409);
  assertOwner(existing, owner);
  return { record: existing, created: false };
}
export async function saveParticipationTransaction(
  record: ParticipationRecord,
  transaction: { id: string; state: string },
  state: ParticipationRecord['state'],
  checkout?: string
) {
  const rows = await db()`UPDATE bwa.participation_payments SET
    transaction_id = ${transaction.id}, checkout_url = COALESCE(${checkout || null}, checkout_url),
    state = CASE WHEN state = 'review' OR ${state} = 'review' THEN 'review' WHEN state = 'paid' THEN 'paid' ELSE ${state} END,
    provider_state = CASE WHEN state = 'paid' AND ${state} NOT IN ('paid','review') THEN provider_state ELSE ${transaction.state} END,
    paid_at = CASE WHEN ${state} = 'paid' THEN COALESCE(paid_at, now()) ELSE paid_at END,
    check_after = now() + interval '15 seconds'
    WHERE id = ${record.id}::uuid AND (transaction_id IS NULL OR transaction_id = ${transaction.id}) RETURNING *`;
  if (!rows[0])
    throw new PaymentError('The payment reference needs a review by the awards team.', 409);
  return rows[0] as ParticipationRecord;
}

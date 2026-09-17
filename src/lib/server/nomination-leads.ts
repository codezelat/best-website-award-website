import type { ContactSubmission } from '../contact';
import {
  deliveryDetails,
  sendContactEmail,
  verifyTurnstile,
  type DeliveryDetails
} from './contact-delivery';
import { paymentConfig, PaymentError } from './payment-config';
import { decryptDetails, encryptDetails } from './payment-security';
import { db } from './payment-store';
import { metaContext, queueMetaEvent } from './meta-conversions';

export interface LeadRecord {
  id: string;
  owner_hash: string;
  details: string;
  app_id: string;
  sandbox: boolean;
  created_at: string;
  email_sent_at: string | null;
}

export async function findLead(id: string): Promise<LeadRecord | undefined> {
  const rows = await db()`SELECT * FROM bwa.nomination_leads WHERE id = ${id}::uuid`;
  return rows[0] as LeadRecord | undefined;
}

function ownsLead(lead: LeadRecord, owner: string) {
  const config = paymentConfig();
  return (
    lead.owner_hash === owner && lead.app_id === config.appId && lead.sandbox === config.sandbox
  );
}

// Turnstile tokens are single-use. Only the exact, recently verified submission
// in the same browser may proceed without consuming its token a second time.
export async function verifiedLead(submission: ContactSubmission, owner: string) {
  const lead = await findLead(submission.submissionId);
  if (
    !lead ||
    !ownsLead(lead, owner) ||
    Date.now() - new Date(lead.created_at).getTime() > 30 * 60_000
  )
    return false;
  const saved = decryptDetails<DeliveryDetails>(lead.details, `lead:${lead.id}`);
  return (
    JSON.stringify(saved.submission) === JSON.stringify(deliveryDetails(submission).submission)
  );
}

export async function claimLeadDelivery(id: string): Promise<LeadRecord | undefined> {
  const rows = await db()`UPDATE bwa.nomination_leads SET
    email_first_attempt_at = COALESCE(email_first_attempt_at, now()),
    email_lock_until = now() + interval '60 seconds'
    WHERE id = ${id}::uuid AND email_sent_at IS NULL
    AND (email_lock_until IS NULL OR email_lock_until < now())
    AND (email_first_attempt_at IS NULL OR email_first_attempt_at > now() - interval '23 hours')
    AND NOT EXISTS (SELECT 1 FROM bwa.nomination_payments p WHERE p.id = bwa.nomination_leads.id AND p.state IN ('paid', 'review'))
    RETURNING *`;
  return rows[0] as LeadRecord | undefined;
}

export async function deliverLead(lead: LeadRecord) {
  if (lead.email_sent_at) return;
  const claimed = await claimLeadDelivery(lead.id);
  if (!claimed) return;
  const details = decryptDetails<DeliveryDetails>(claimed.details, `lead:${claimed.id}`);
  const emailId = await sendContactEmail(details, undefined, true);
  await db()`UPDATE bwa.nomination_leads SET email_sent_at = now(), email_id = ${emailId}, email_lock_until = NULL WHERE id = ${lead.id}::uuid AND email_sent_at IS NULL`;
}

export async function captureLead(
  submission: ContactSubmission,
  owner: string,
  request: Request,
  address?: string
) {
  let lead = await findLead(submission.submissionId);
  if (lead && !ownsLead(lead, owner))
    throw new PaymentError(
      'This nomination reference is unavailable. Refresh the form to continue.',
      409
    );
  if (!lead) {
    await verifyTurnstile(submission.turnstileToken, request, address);
    const config = paymentConfig();
    const details = encryptDetails(deliveryDetails(submission), `lead:${submission.submissionId}`);
    const rows =
      await db()`INSERT INTO bwa.nomination_leads (id, owner_hash, details, app_id, sandbox)
      SELECT ${submission.submissionId}::uuid, ${owner}, ${details}, ${config.appId}, ${config.sandbox}
      WHERE (SELECT count(*) FROM bwa.nomination_leads WHERE owner_hash = ${owner} AND created_at > now() - interval '30 minutes') < 5
      ON CONFLICT (id) DO NOTHING RETURNING *`;
    lead = rows[0] as LeadRecord | undefined;
    if (!lead) {
      lead = await findLead(submission.submissionId);
      if (!lead)
        throw new PaymentError(
          'Several entries have been started recently. Please wait a little and try again.',
          429
        );
      if (!ownsLead(lead, owner))
        throw new PaymentError('This nomination reference is unavailable.', 409);
    }
  }
  try {
    await deliverLead(lead);
  } catch {
    // The encrypted lead is durable. Email recovery must not block a card payment.
  }
  await queueMetaEvent(
    metaContext(request, address, submission),
    'Lead',
    lead.id,
    new Date(lead.created_at).getTime()
  );
  return { captured: true };
}

export async function recoverLeads() {
  const config = paymentConfig();
  const rows = await db()`SELECT l.* FROM bwa.nomination_leads l
    WHERE l.email_sent_at IS NULL AND l.app_id = ${config.appId} AND l.sandbox = ${config.sandbox}
    AND (l.email_lock_until IS NULL OR l.email_lock_until < now())
    AND (l.email_first_attempt_at IS NULL OR l.email_first_attempt_at > now() - interval '23 hours')
    AND NOT EXISTS (SELECT 1 FROM bwa.nomination_payments p WHERE p.id = l.id AND p.state IN ('paid', 'review'))
    ORDER BY l.created_at LIMIT 5`;
  let pending = 0;
  await Promise.all(
    (rows as LeadRecord[]).map(async (lead) => {
      try {
        await deliverLead(lead);
      } catch {
        pending++;
      }
    })
  );
  return { checked: rows.length, pending };
}

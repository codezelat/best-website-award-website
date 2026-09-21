import { participationContent } from '../../data/participation';
import {
  money,
  participationQuote,
  type ParticipationChoice,
  type ParticipationView
} from '../participation/policy';
import { paymentState } from '../payments/policy';
import { escapeHtml } from '../contact';
import { env, paymentConfig, PaymentError } from './payment-config';
import { decryptDetails } from './payment-security';
import { db } from './payment-store';
import { createTransaction, getTransaction, safeCheckoutUrl, verifyTransaction } from './genie';
import {
  findParticipation,
  insertParticipation,
  saveParticipationTransaction,
  type ParticipationDetails,
  type ParticipationRecord
} from './participation-store';

export function participationView(record: ParticipationRecord): ParticipationView {
  const details = decryptDetails<ParticipationDetails>(
    record.details,
    `participation:${record.id}`
  );
  const emailed = Boolean(record.customer_email_id && record.team_email_id);
  const messages = {
    creating: 'Your payment request is being checked. Please do not start another payment.',
    pending:
      'Your payment is not confirmed yet. Continue the same secure checkout or check again shortly.',
    paid: emailed
      ? 'Your participation is confirmed. Confirmation emails have been sent to your nomination email and the awards team.'
      : 'Your payment is confirmed and your participation is safely saved. We are completing the confirmation emails. Please do not pay again.',
    failed:
      'This payment was not completed. You can choose your package again. If your bank shows a debit, contact the awards team before paying again.',
    review:
      'Your payment needs a review by the awards team. Please contact info@gbeaward.com with your reference and do not pay again.'
  };
  return {
    reference: record.id,
    state: record.state,
    emailed,
    message: messages[record.state],
    website: details.website,
    amount: record.amount,
    choice: {
      packageCode: record.package_code,
      extraTrophy: record.extra_trophy,
      attendees: record.attendees
    },
    ...(record.state === 'pending'
      ? { checkoutUrl: safeCheckoutUrl(record.checkout_url || undefined, record.sandbox) }
      : {})
  };
}
export async function beginParticipation(
  nomination: string,
  owner: string,
  choice: ParticipationChoice
) {
  const config = paymentConfig();
  const { record, created } = await insertParticipation(nomination, owner, choice);
  if (!created) return participationView(record);
  const returnUrl = `${config.site}/accept?reference=${record.id}`;
  try {
    const response = await createTransaction({
      amount: record.amount,
      currency: record.currency,
      localId: record.id,
      customerReference: `BWA-P-${record.id}`,
      redirectUrl: returnUrl,
      paymentAttemptFailureUrl: returnUrl,
      webhook: `${config.site}/api/participation/webhook`,
      expires: new Date(Date.now() + 30 * 60_000).toISOString(),
      allowRetry: false,
      sendCustomerEmailReceipt: true
    });
    const transaction = verifyTransaction(response, {
      reference: record.id,
      amount: record.amount,
      currency: record.currency,
      appId: record.app_id,
      merchantId: record.merchant_id
    });
    // Creation never proves payment, even if the provider's initial response says CONFIRMED.
    const saved = await saveParticipationTransaction(
      record,
      transaction,
      'pending',
      safeCheckoutUrl(transaction.url, record.sandbox)
    );
    return participationView(saved);
  } catch (error) {
    if (error instanceof PaymentError && error.definitive)
      await db()`UPDATE bwa.participation_payments SET state = 'failed' WHERE id = ${record.id}::uuid AND transaction_id IS NULL AND state = 'creating'`;
    return participationView((await findParticipation(record.id))!);
  }
}
export async function verifyParticipation(
  record: ParticipationRecord,
  transactionId = record.transaction_id
) {
  if (!transactionId) return record;
  const config = paymentConfig();
  if (
    record.app_id !== config.appId ||
    record.merchant_id !== config.merchantId ||
    record.sandbox !== config.sandbox
  )
    throw new PaymentError('This payment belongs to another payment environment.', 409);
  const response = await getTransaction(transactionId);
  const transaction = verifyTransaction(response, {
    id: transactionId,
    reference: record.id,
    amount: record.amount,
    currency: record.currency,
    appId: record.app_id,
    merchantId: record.merchant_id
  });
  return saveParticipationTransaction(
    record,
    transaction,
    paymentState(transaction.state),
    safeCheckoutUrl(transaction.url, record.sandbox)
  );
}

export function participationEmail(
  record: ParticipationRecord,
  details: ParticipationDetails,
  team: boolean
) {
  const quote = participationQuote({
    packageCode: record.package_code,
    extraTrophy: record.extra_trophy,
    attendees: record.attendees
  });
  const selected = participationContent.packages.find((item) => item.code === record.package_code)!;
  const rows = [
    ['Website', details.website],
    ['Name', details.name],
    ['Organisation', details.organisation],
    ['Package', `${record.package_code}: ${selected.title}`],
    ['Package fee', money(quote.base)],
    ['Additional trophy', record.extra_trophy ? money(quote.trophyAmount) : 'Not selected'],
    ['Total attendees', String(record.attendees)],
    ['Included attendees', String(quote.included)],
    ['Additional attendees', `${quote.additional} (${money(quote.attendeeAmount)})`],
    ['Attendee inclusion', 'Full dinner buffet ticket'],
    ['Total paid', money(record.amount)],
    ['Participation reference', record.id],
    ['Nomination reference', record.nomination_id],
    ['Transaction ID', record.transaction_id || ''],
    ...(team
      ? [
          ['Nomination email', details.email],
          ['Phone', details.phone || 'Not supplied']
        ]
      : [])
  ];
  const intro = team
    ? 'Participation payment confirmed. The selected arrangement is saved below.'
    : 'Thank you. Your participation payment is confirmed. The awards team will follow up with your event instructions.';
  const title = 'Participation confirmed';
  return {
    from: env('CONTACT_FROM_EMAIL') || 'Best Website Awards <website@access.gbeaward.com>',
    to: [team ? env('CONTACT_TO_EMAIL') || 'info@gbeaward.com' : details.email],
    reply_to: team ? details.email : env('CONTACT_TO_EMAIL') || 'info@gbeaward.com',
    subject: `[Best Website Awards] Participation confirmed: ${details.website}`,
    text: [title, '', intro, '', ...rows.map(([label, value]) => `${label}: ${value}`)].join('\n'),
    html: `<div style="padding:28px;background:#f6f8fc;font-family:Arial,sans-serif"><div style="max-width:640px;margin:auto;padding:30px;background:white;border-top:4px solid #1746d1"><p style="color:#1746d1;font-size:12px;font-weight:700">BEST WEBSITE AWARDS 2026</p><h1 style="font-size:26px">${title}</h1><p style="line-height:1.6">${intro}</p><table style="width:100%;border-collapse:collapse">${rows.map(([label, value]) => `<tr><th style="text-align:left;vertical-align:top;padding:10px 18px 10px 0;font-size:13px;color:#59616e">${escapeHtml(label!)}</th><td style="padding:10px 0;font-size:14px;overflow-wrap:anywhere">${escapeHtml(value!)}</td></tr>`).join('')}</table></div></div>`
  };
}
export async function deliverParticipation(record: ParticipationRecord) {
  if (record.state !== 'paid' || (record.customer_email_id && record.team_email_id)) return record;
  const rows = await db()`UPDATE bwa.participation_payments SET
    email_first_attempt_at = COALESCE(email_first_attempt_at, now()), email_lock_until = now() + interval '60 seconds'
    WHERE id = ${record.id}::uuid AND state = 'paid' AND (customer_email_id IS NULL OR team_email_id IS NULL)
    AND (email_lock_until IS NULL OR email_lock_until < now())
    AND (email_first_attempt_at IS NULL OR email_first_attempt_at > now() - interval '23 hours') RETURNING *`;
  const claimed = rows[0] as ParticipationRecord | undefined;
  if (!claimed) return (await findParticipation(record.id))!;
  const details = decryptDetails<ParticipationDetails>(
    claimed.details,
    `participation:${claimed.id}`
  );
  await Promise.allSettled(
    ['customer', 'team'].map(async (recipient) => {
      const team = recipient === 'team';
      if (team ? claimed.team_email_id : claimed.customer_email_id) return;
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `bwa-participation-${recipient}-${claimed.id}`
        },
        signal: AbortSignal.timeout(5000),
        body: JSON.stringify(participationEmail(claimed, details, team))
      });
      const result = (await response.json()) as { id?: string };
      if (!response.ok || !result.id) throw new PaymentError('Confirmation email is pending.', 502);
      if (team)
        await db()`UPDATE bwa.participation_payments SET team_email_id = ${result.id} WHERE id = ${claimed.id}::uuid`;
      else
        await db()`UPDATE bwa.participation_payments SET customer_email_id = ${result.id} WHERE id = ${claimed.id}::uuid`;
    })
  );
  return (await findParticipation(record.id))!;
}
export async function checkParticipation(record: ParticipationRecord) {
  if (
    record.transaction_id &&
    !['failed', 'review'].includes(record.state) &&
    !(record.customer_email_id && record.team_email_id)
  ) {
    const lease =
      await db()`UPDATE bwa.participation_payments SET check_after = now() + interval '15 seconds' WHERE id = ${record.id}::uuid AND check_after <= now() RETURNING id`;
    if (lease.length) {
      try {
        record = await verifyParticipation(record);
      } catch {
        return {
          ...participationView(record),
          message:
            'We could not refresh the payment status just now. Please check again before making another payment.'
        };
      }
    }
  }
  try {
    record = await deliverParticipation(record);
  } catch {
    /* Confirmed payment stays durable. */
  }
  return participationView(record);
}

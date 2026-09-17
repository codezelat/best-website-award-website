import {
  NOMINATION_AMOUNT,
  NOMINATION_CURRENCY,
  PAYMENT_TERMS_VERSION,
  paymentState,
  type PaymentView
} from '../payments/policy';
import type { ContactSubmission } from '../contact';
import { deliveryDetails, sendContactEmail, type DeliveryDetails } from './contact-delivery';
import { assertPaymentEnabled, paymentConfig, PaymentError } from './payment-config';
import { decryptDetails, encryptDetails } from './payment-security';
import { trackPaidMeta, type MetaContext } from './meta-conversions';
import { createTransaction, getTransaction, safeCheckoutUrl, verifyTransaction } from './genie';
import {
  claimDelivery,
  claimStatusCheck,
  completeDelivery,
  db,
  findPayment,
  insertPayment,
  ownedPayment,
  saveTransaction,
  type PaymentRecord
} from './payment-store';

export function paymentView(record: PaymentRecord): PaymentView {
  const submitted = Boolean(record.email_sent_at);
  const messages = {
    creating:
      'Your payment request is being checked. Do not start another payment. If this does not update, contact the awards team with your reference.',
    pending:
      'Your payment is not confirmed yet. You can continue the same secure checkout or check again shortly.',
    paid: submitted
      ? 'Your payment is confirmed and your nomination has been sent to the awards team.'
      : 'Your payment is confirmed and your nomination is safely saved. We are completing its delivery to the awards team. Please do not pay again.',
    failed:
      'This payment was not completed. You can return to the form and try again. If your bank shows a debit, contact the awards team before making another payment.',
    review:
      'Your payment needs a review by the awards team. Your details are saved. Please contact info@gbeaward.com with your reference and do not pay again.'
  };
  return {
    reference: record.id,
    state: record.state,
    submitted,
    message: messages[record.state],
    ...(record.state === 'pending'
      ? { checkoutUrl: safeCheckoutUrl(record.checkout_url || undefined, record.sandbox) }
      : {})
  };
}

export async function beginPayment(
  submission: ContactSubmission,
  ownerHash: string,
  meta?: MetaContext
): Promise<PaymentView> {
  const config = assertPaymentEnabled();
  const existing = await findPayment(submission.submissionId);
  if (existing) return paymentView(await ownedPayment(existing.id, ownerHash));
  const row = await insertPayment({
    id: submission.submissionId,
    owner_hash: ownerHash,
    details: encryptDetails(
      { ...deliveryDetails(submission), ...(meta ? { meta } : {}) },
      submission.submissionId
    ),
    amount: NOMINATION_AMOUNT,
    currency: NOMINATION_CURRENCY,
    terms_version: PAYMENT_TERMS_VERSION,
    app_id: config.appId,
    merchant_id: config.merchantId,
    sandbox: config.sandbox
  });
  if (!row) {
    const duplicate = await findPayment(submission.submissionId);
    if (duplicate) return paymentView(await ownedPayment(duplicate.id, ownerHash));
    throw new PaymentError(
      'Several nominations have been started recently. Please wait a little before starting another.',
      429
    );
  }
  const returnUrl = `${config.site}/nomination-status?reference=${row.id}`;
  try {
    const value = await createTransaction({
      amount: row.amount,
      currency: row.currency,
      localId: row.id,
      customerReference: `BWA-${row.id}`,
      redirectUrl: returnUrl,
      paymentAttemptFailureUrl: returnUrl,
      webhook: `${config.site}/api/nomination/webhook`,
      expires: new Date(Date.now() + 30 * 60_000).toISOString(),
      allowRetry: false,
      sendCustomerEmailReceipt: true
    });
    const t = verifyTransaction(value, {
      reference: row.id,
      amount: row.amount,
      currency: row.currency,
      appId: row.app_id,
      merchantId: row.merchant_id
    });
    const checkout = safeCheckoutUrl(t.url, row.sandbox);
    // Create Transaction is not proof of payment, even if its response says CONFIRMED.
    const saved = await saveTransaction(row, t, 'pending', checkout);
    return paymentView(saved);
  } catch (error) {
    if (error instanceof PaymentError && error.definitive) {
      await db()`UPDATE bwa.nomination_payments SET state = 'failed', updated_at = now() WHERE id = ${row.id}::uuid AND transaction_id IS NULL AND state = 'creating'`;
    }
    // A timeout may happen after Genie created the transaction. Never create another
    // automatically. The signed webhook can attach and recover that transaction.
    return paymentView((await findPayment(row.id))!);
  }
}

export async function deliverPaidNomination(record: PaymentRecord): Promise<PaymentRecord> {
  await trackPaidMeta(record);
  if (record.state !== 'paid' || record.email_sent_at) return record;
  const claimed = await claimDelivery(record.id);
  if (!claimed) return (await findPayment(record.id))!;
  const details = decryptDetails<DeliveryDetails>(claimed.details, claimed.id);
  const emailId = await sendContactEmail(details, {
    reference: claimed.id,
    transactionId: claimed.transaction_id!,
    amount: claimed.amount,
    currency: claimed.currency
  });
  await completeDelivery(claimed.id, emailId);
  return (await findPayment(claimed.id))!;
}

export async function verifyPayment(
  record: PaymentRecord,
  transactionId = record.transaction_id
): Promise<PaymentRecord> {
  if (!transactionId) return record;
  const config = paymentConfig();
  if (
    record.app_id !== config.appId ||
    record.merchant_id !== config.merchantId ||
    record.sandbox !== config.sandbox
  )
    throw new PaymentError('This payment belongs to another payment environment.', 409);
  const value = await getTransaction(transactionId);
  const t = verifyTransaction(value, {
    id: transactionId,
    reference: record.id,
    amount: record.amount,
    currency: record.currency,
    appId: record.app_id,
    merchantId: record.merchant_id
  });
  return saveTransaction(record, t, paymentState(t.state), safeCheckoutUrl(t.url, record.sandbox));
}

export async function checkPayment(record: PaymentRecord): Promise<PaymentView> {
  if (record.transaction_id && !record.email_sent_at && (await claimStatusCheck(record.id))) {
    try {
      record = await verifyPayment(record);
    } catch {
      return {
        ...paymentView(record),
        message:
          'We could not refresh the payment status just now. Your details are saved. Please check again before making another payment.'
      };
    }
  }
  try {
    record = await deliverPaidNomination(record);
  } catch {
    /* Paid state stays durable while email waits for a later retry. */
  }
  return paymentView(record);
}

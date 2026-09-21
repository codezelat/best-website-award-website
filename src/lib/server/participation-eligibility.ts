import type { PaymentRecord } from './payment-store';
export const INELIGIBLE_MESSAGE =
  'This website is not eligible for an award. Please try again next time.';
export const INVALID_WEBSITE_MESSAGE = 'Enter a valid website address.';
export const ALREADY_COMPLETED_MESSAGE =
  'Participation has already been completed for this website. For any enquiries, please contact info@gbeaward.com.';
export function eligibleNomination(
  record: Pick<PaymentRecord, 'state' | 'paid_at'> | undefined,
  now = Date.now()
) {
  if (!record || record.state !== 'paid' || !record.paid_at) return false;
  const paidAt = new Date(record.paid_at).getTime();
  return Number.isFinite(paidAt) && paidAt <= now - 12 * 60 * 60 * 1000;
}

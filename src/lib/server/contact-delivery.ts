import { enquiryLabels, escapeHtml, type ContactSubmission } from '../contact';
import { env, PaymentError } from './payment-config';
import type { MetaContext } from './meta-conversions';

export interface DeliveryDetails {
  meta?: MetaContext;
  submission: Omit<ContactSubmission, 'turnstileToken' | 'websiteConfirmation'>;
  from: string;
  to: string;
}
export function deliveryDetails(submission: ContactSubmission): DeliveryDetails {
  const { turnstileToken: _token, websiteConfirmation: _honeypot, ...safe } = submission;
  return {
    submission: safe,
    from: env('CONTACT_FROM_EMAIL') || 'Best Website Awards <website@access.gbeaward.com>',
    to: env('CONTACT_TO_EMAIL') || 'info@gbeaward.com'
  };
}
export async function verifyTurnstile(token: string, request: Request, address?: string) {
  const secret = env('TURNSTILE_SECRET_KEY');
  if (!secret) throw new PaymentError('Secure verification is temporarily unavailable.');
  const body = new URLSearchParams({ secret, response: token });
  if (address) body.set('remoteip', address);
  let response: Response;
  try {
    response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(5_000)
    });
  } catch {
    throw new PaymentError('Secure verification is unavailable right now. Please try again.', 502);
  }
  const result = (await response.json()) as {
    success?: boolean;
    action?: string;
    hostname?: string;
    metadata?: { result_with_testing_key?: boolean };
  };
  const hostname = new URL(request.url).hostname;
  const localSandboxTest =
    ['127.0.0.1', 'localhost'].includes(hostname) &&
    env('GENIE_API_BASE_URL') === 'https://api.uat.geniebiz.lk' &&
    secret === '1x0000000000000000000000000000000AA' &&
    result.metadata?.result_with_testing_key === true;
  if (
    !response.ok ||
    !result.success ||
    (result.action && result.action !== 'contact_form') ||
    (!localSandboxTest &&
      result.hostname &&
      ![hostname, 'bestwebsiteaward.com', 'www.bestwebsiteaward.com'].includes(result.hostname))
  )
    throw new PaymentError(
      'Secure verification expired or was unsuccessful. Please try again.',
      400
    );
}
export async function sendContactEmail(
  details: DeliveryDetails,
  payment?: { reference: string; transactionId: string; amount: number; currency: string },
  unpaidLead = false
): Promise<string> {
  const { submission, from, to } = details;
  const label = enquiryLabels[submission.enquiryType];
  const rows = [
    ['Enquiry', label],
    ['Name', submission.name],
    ['Email', submission.email],
    ['Organisation', submission.organisation],
    ['Phone', submission.phone],
    ['Website', submission.website],
    ['Message', submission.message],
    ['Submission ID', submission.submissionId],
    ...(unpaidLead
      ? [
          [
            'Status at capture',
            'UNPAID: payment popup opened. This is a lead, not a confirmed nomination.'
          ],
          [
            'Follow-up',
            'Check for a paid confirmation with this same submission ID before following up. Payment may have completed after this email was sent.'
          ]
        ]
      : []),
    ...(payment
      ? [
          ['Payment', `CONFIRMED: ${payment.currency} ${(payment.amount / 100).toFixed(2)}`],
          ['Transaction ID', payment.transactionId],
          ['Nomination reference', payment.reference]
        ]
      : [])
  ];
  const title = payment
    ? 'Paid website nomination'
    : unpaidLead
      ? 'Unpaid nomination lead'
      : 'New website enquiry';
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': payment
        ? `bwa-paid-${payment.reference}`
        : unpaidLead
          ? `bwa-lead-${submission.submissionId}`
          : `bwa-contact-${submission.submissionId}`
    },
    signal: AbortSignal.timeout(5_000),
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: submission.email,
      subject: `[Best Website Awards] ${payment ? 'Paid nomination' : unpaidLead ? 'UNPAID nomination lead' : label}: ${submission.organisation}`,
      text: [title, '', ...rows.map(([name, value]) => `${name}: ${value || 'Not supplied'}`)].join(
        '\n'
      ),
      html: `<div style="padding:28px;background:#f6f8fc;font-family:Arial,sans-serif"><div style="max-width:680px;margin:auto;padding:30px;background:#fff;border-top:4px solid #1746d1"><p style="color:#1746d1;font-size:12px;font-weight:700">BEST WEBSITE AWARDS</p><h1 style="font-size:26px;color:#0d1117">${title}</h1><table style="width:100%;border-collapse:collapse">${rows.map(([name, value]) => `<tr><th style="text-align:left;vertical-align:top;padding:10px 16px 10px 0;color:#59616e;font-size:13px">${escapeHtml(name!)}</th><td style="padding:10px 0;font-size:14px;line-height:1.55;word-break:break-word;white-space:pre-wrap">${escapeHtml(value || 'Not supplied')}</td></tr>`).join('')}</table></div></div>`
    })
  });
  if (!response.ok) throw new PaymentError('We could not deliver the message just now.', 502);
  const result = (await response.json()) as { id?: string };
  if (!result.id) throw new PaymentError('Email delivery confirmation is pending.', 502);
  return result.id;
}

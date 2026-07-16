import type { APIRoute } from 'astro';
import { enquiryLabels, escapeHtml, parseContactSubmission } from '../../lib/contact';

export const prerender = false;

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const RESEND_EMAIL_URL = 'https://api.resend.com/emails';
const CONTACT_TO_EMAIL = import.meta.env.CONTACT_TO_EMAIL || 'info@gbeaward.com';
const CONTACT_FROM_EMAIL =
  import.meta.env.CONTACT_FROM_EMAIL || 'Best Website Awards <website@access.gbeaward.com>';

const json = (status: number, message: string, ok = false) =>
  new Response(JSON.stringify({ ok, message }), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow'
    }
  });

const isTrustedOrigin = (request: Request) => {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    return (
      originUrl.hostname === requestUrl.hostname ||
      ['bestwebsiteaward.com', 'www.bestwebsiteaward.com', 'localhost', '127.0.0.1'].includes(
        originUrl.hostname
      )
    );
  } catch {
    return false;
  }
};

const textRow = (label: string, value: string) => `${label}: ${value || 'Not supplied'}`;
const htmlRow = (label: string, value: string) => `
  <tr>
    <th style="padding:10px 16px 10px 0;text-align:left;vertical-align:top;color:#59616e;font-size:13px;font-weight:600;">${label}</th>
    <td style="padding:10px 0;color:#0d1117;font-size:14px;line-height:1.55;word-break:break-word;">${escapeHtml(value || 'Not supplied')}</td>
  </tr>`;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!isTrustedOrigin(request)) return json(403, 'This request could not be verified.');

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 30_000) return json(413, 'The submitted information is too large.');

  const turnstileSecret = import.meta.env.TURNSTILE_SECRET_KEY;
  const resendApiKey = import.meta.env.RESEND_API_KEY;
  if (!turnstileSecret || !resendApiKey) {
    return json(503, 'The contact service is temporarily unavailable. Please try again shortly.');
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return json(400, 'The submitted information could not be read.');
  }

  const parsed = parseContactSubmission(formData);
  if (!parsed.data) return json(400, parsed.error || 'Check the information and try again.');
  const submission = parsed.data;

  if (submission.websiteConfirmation) {
    return json(200, 'Thank you. Your enquiry has been received.', true);
  }

  const verificationBody = new URLSearchParams({
    secret: turnstileSecret,
    response: submission.turnstileToken
  });
  const forwardedAddress = request.headers.get('CF-Connecting-IP') || clientAddress;
  if (forwardedAddress) verificationBody.set('remoteip', forwardedAddress);

  let verification: { success?: boolean; action?: string };
  try {
    const verificationResponse = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: verificationBody,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    if (!verificationResponse.ok) throw new Error('Turnstile request failed');
    verification = (await verificationResponse.json()) as typeof verification;
  } catch {
    return json(502, 'Secure verification is unavailable right now. Please try again.');
  }

  if (!verification.success || (verification.action && verification.action !== 'contact_form')) {
    return json(400, 'Secure verification expired or was unsuccessful. Please try again.');
  }

  const enquiryLabel = enquiryLabels[submission.enquiryType];
  const text = [
    'New Best Website Awards website enquiry',
    '',
    textRow('Enquiry', enquiryLabel),
    textRow('Name', submission.name),
    textRow('Email', submission.email),
    textRow('Organisation', submission.organisation),
    textRow('Phone', submission.phone),
    textRow('Website', submission.website),
    '',
    'Message:',
    submission.message || 'Not supplied',
    '',
    textRow('Submission ID', submission.submissionId)
  ].join('\n');

  const html = `
    <div style="margin:0;padding:28px;background:#f6f8fc;font-family:Arial,sans-serif;">
      <div style="max-width:680px;margin:0 auto;padding:30px;background:#ffffff;border-top:4px solid #1746d1;">
        <p style="margin:0 0 8px;color:#1746d1;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Best Website Awards</p>
        <h1 style="margin:0 0 20px;color:#0d1117;font-size:26px;line-height:1.15;">New website enquiry</h1>
        <table role="presentation" style="width:100%;border-collapse:collapse;border-top:1px solid #dde3ed;border-bottom:1px solid #dde3ed;">
          ${htmlRow('Enquiry', enquiryLabel)}
          ${htmlRow('Name', submission.name)}
          ${htmlRow('Email', submission.email)}
          ${htmlRow('Organisation', submission.organisation)}
          ${htmlRow('Phone', submission.phone)}
          ${htmlRow('Website', submission.website)}
        </table>
        <h2 style="margin:24px 0 8px;color:#0d1117;font-size:16px;">Message</h2>
        <p style="margin:0;white-space:pre-wrap;color:#303743;font-size:14px;line-height:1.65;">${escapeHtml(submission.message || 'Not supplied')}</p>
        <p style="margin:26px 0 0;color:#7b8492;font-size:11px;">Submission ID: ${escapeHtml(submission.submissionId)}</p>
      </div>
    </div>`;

  try {
    const emailResponse = await fetch(RESEND_EMAIL_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `bwa-contact-${submission.submissionId}`
      },
      body: JSON.stringify({
        from: CONTACT_FROM_EMAIL,
        to: [CONTACT_TO_EMAIL],
        reply_to: submission.email,
        subject: `[Best Website Awards] ${enquiryLabel}: ${submission.organisation}`,
        text,
        html
      })
    });

    if (!emailResponse.ok) throw new Error('Resend request failed');
  } catch {
    return json(502, 'We could not send your enquiry just now. Please try again shortly.');
  }

  return json(
    200,
    'Thank you. Your website details are now with the awards team. We’ll reply by email.',
    true
  );
};

export const ALL: APIRoute = () => json(405, 'Method not allowed.');

import type { APIRoute } from 'astro';
import { parseContactSubmission } from '../../lib/contact';
import {
  deliveryDetails,
  sendContactEmail,
  verifyTurnstile
} from '../../lib/server/contact-delivery';
import { apiError, json, readForm, requireSameOrigin } from '../../lib/server/http';
import { env, PaymentError } from '../../lib/server/payment-config';
import { metaContext, queueMetaEvent } from '../../lib/server/meta-conversions';

export const prerender = false;
export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    requireSameOrigin(request);
    if (!env('RESEND_API_KEY'))
      throw new PaymentError('The contact service is temporarily unavailable.');
    const parsed = parseContactSubmission(await readForm(request));
    if (!parsed.data) throw new PaymentError(parsed.error || 'Check your information.', 400);
    const submission = parsed.data;
    // A nomination can only be accepted through a verified payment.
    if (submission.enquiryType === 'present')
      throw new PaymentError(
        'Please complete the nomination fee payment to submit your website.',
        402
      );
    if (submission.websiteConfirmation)
      return json(200, { ok: true, message: 'Thank you. Your enquiry has been received.' });
    await verifyTurnstile(submission.turnstileToken, request, clientAddress);
    await sendContactEmail(deliveryDetails(submission));
    await queueMetaEvent(
      metaContext(request, clientAddress, submission),
      'Contact',
      submission.submissionId
    );
    return json(200, {
      ok: true,
      message: 'Thank you. Your enquiry is now with the awards team. We’ll reply by email.'
    });
  } catch (error) {
    return apiError(error);
  }
};
export const ALL: APIRoute = () => json(405, { ok: false, message: 'Method not allowed.' });

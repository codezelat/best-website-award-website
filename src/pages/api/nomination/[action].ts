import type { APIRoute, APIContext } from 'astro';
import { timingSafeEqual } from 'node:crypto';
import { parseContactSubmission } from '../../../lib/contact';
import { PAYMENT_TERMS_VERSION, validReference } from '../../../lib/payments/policy';
import { apiError, json, readForm, requireSameOrigin, smallBody } from '../../../lib/server/http';
import { assertPaymentEnabled, env, PaymentError } from '../../../lib/server/payment-config';
import { hash, newSession, validSession } from '../../../lib/server/payment-security';
import { verifyTurnstile } from '../../../lib/server/contact-delivery';
import { getTransaction, validWebhookSignature } from '../../../lib/server/genie';
import { captureLead, recoverLeads, verifiedLead } from '../../../lib/server/nomination-leads';
import { metaContext, recoverMetaEvents } from '../../../lib/server/meta-conversions';
import {
  findPayment,
  findPaymentByTransaction,
  ownedPayment,
  recoveryCandidates
} from '../../../lib/server/payment-store';
import {
  beginPayment,
  checkPayment,
  deliverPaidNomination,
  paymentView,
  verifyPayment
} from '../../../lib/server/payments';

export const prerender = false;
const COOKIE = 'bwa_payment_session';
function owner(context: APIContext) {
  const value = context.cookies.get(COOKIE)?.value || '';
  if (!validSession(value))
    throw new PaymentError(
      'Your secure session is unavailable. Return to the form or contact the awards team if you have already paid.',
      401
    );
  return hash(value);
}

export const POST: APIRoute = async (context) => {
  const { request, params, cookies } = context;
  try {
    if (params.action === 'webhook') {
      if (!validWebhookSignature(request.headers))
        throw new PaymentError('Invalid signature.', 401);
      const event = JSON.parse(new TextDecoder().decode(await smallBody(request, 50_000)));
      const transaction = event.data || event;
      const transactionId = transaction.transactionId;
      if (!/^[a-f0-9]{24}$/i.test(transactionId || '')) return json(200, { ok: true });
      let record = validReference(transaction.localId || '')
        ? await findPayment(transaction.localId)
        : await findPaymentByTransaction(transactionId);
      if (!record) {
        // Recover a missing webhook localId from the authenticated provider response.
        const authoritative = (await getTransaction(transactionId)) as { localId?: string };
        if (validReference(authoritative.localId || ''))
          record = await findPayment(authoritative.localId!);
      }
      if (!record) return json(200, { ok: true });
      const verified = await verifyPayment(record, transactionId);
      const delivered = await deliverPaidNomination(verified);
      if (delivered.state === 'paid' && !delivered.email_sent_at)
        return json(503, { ok: false, message: 'Delivery pending.' });
      return json(200, { ok: true });
    }
    requireSameOrigin(request);
    if (params.action === 'session') {
      assertPaymentEnabled();
      const current = cookies.get(COOKIE)?.value || '';
      if (!validSession(current))
        cookies.set(COOKIE, newSession(), {
          httpOnly: true,
          secure: new URL(request.url).protocol === 'https:',
          sameSite: 'lax',
          path: '/',
          maxAge: 7 * 86400
        });
      return json(200, { ok: true });
    }
    if (!['start', 'lead'].includes(params.action || ''))
      return json(404, { ok: false, message: 'Not found.' });
    assertPaymentEnabled();
    const ownerHash = owner(context);
    const form = await readForm(request);
    const parsed = parseContactSubmission(form);
    if (!parsed.data) throw new PaymentError(parsed.error || 'Check your information.', 400);
    if (parsed.data.enquiryType !== 'present')
      throw new PaymentError('Use the enquiry form for general questions.', 400);
    if (params.action === 'start' && form.get('paymentTerms') !== PAYMENT_TERMS_VERSION)
      throw new PaymentError('Confirm the nomination fee and terms to continue.', 400);
    if (parsed.data.websiteConfirmation)
      throw new PaymentError('This request could not be verified.', 400);
    if (params.action === 'lead')
      return json(200, {
        ok: true,
        ...(await captureLead(parsed.data, ownerHash, request, context.clientAddress))
      });
    const existing = await findPayment(parsed.data.submissionId);
    if (existing)
      return json(200, {
        ok: true,
        payment: paymentView(await ownedPayment(existing.id, ownerHash))
      });
    if (!(await verifiedLead(parsed.data, ownerHash)))
      await verifyTurnstile(parsed.data.turnstileToken, request, context.clientAddress);
    return json(200, {
      ok: true,
      payment: await beginPayment(
        parsed.data,
        ownerHash,
        metaContext(request, context.clientAddress, parsed.data)
      )
    });
  } catch (error) {
    return apiError(error);
  }
};

export const GET: APIRoute = async (context) => {
  try {
    if (context.params.action === 'reconcile') {
      const expected = env('CRON_SECRET');
      const supplied = context.request.headers.get('authorization') || '';
      if (
        expected.length < 32 ||
        supplied.length !== `Bearer ${expected}`.length ||
        !timingSafeEqual(Buffer.from(supplied), Buffer.from(`Bearer ${expected}`))
      )
        throw new PaymentError('Unauthorised.', 401);
      const reference = context.url.searchParams.get('reference');
      const transaction = context.url.searchParams.get('transaction');
      if (reference || transaction) {
        if (!validReference(reference || '') || !/^[a-f0-9]{24}$/i.test(transaction || ''))
          throw new PaymentError('Invalid recovery references.', 400);
        const record = await findPayment(reference!);
        if (!record) throw new PaymentError('Not found.', 404);
        const recovered = await deliverPaidNomination(await verifyPayment(record, transaction));
        return json(200, { ok: true, payment: paymentView(recovered) });
      }
      const leadRecovery = recoverLeads().catch(() => ({ checked: 0, pending: 1 }));
      const candidates = await recoveryCandidates();
      let pending = 0;
      // Two bounded batches. No public page renders or polls the database.
      for (let index = 0; index < candidates.length; index += 5) {
        await Promise.all(
          candidates.slice(index, index + 5).map(async (record) => {
            const result = await checkPayment(record);
            if (result.state === 'paid' && !result.submitted) pending++;
          })
        );
      }
      const leads = await leadRecovery;
      const meta = await recoverMetaEvents().catch(() => ({ checked: 0, pending: true }));
      return json(pending || leads.pending ? 503 : 200, {
        ok: !pending && !leads.pending,
        checked: candidates.length,
        pending,
        leads,
        meta
      });
    }
    if (context.params.action !== 'status') return json(404, { ok: false, message: 'Not found.' });
    const reference = context.url.searchParams.get('reference') || '';
    if (!validReference(reference)) throw new PaymentError('Invalid nomination reference.', 400);
    const record = await ownedPayment(reference, owner(context));
    return json(200, { ok: true, payment: await checkPayment(record) });
  } catch (error) {
    return apiError(error);
  }
};
export const ALL: APIRoute = () => json(405, { ok: false, message: 'Method not allowed.' });

import type { APIRoute, APIContext } from 'astro';
import { timingSafeEqual } from 'node:crypto';
import {
  normaliseWebsite,
  participationQuote,
  PARTICIPATION_TERMS,
  type ParticipationChoice
} from '../../../lib/participation/policy';
import { validReference } from '../../../lib/payments/policy';
import { apiError, json, requireSameOrigin, smallBody } from '../../../lib/server/http';
import {
  assertPaymentEnabled,
  env,
  paymentConfig,
  PaymentError
} from '../../../lib/server/payment-config';
import {
  decryptDetails,
  encryptDetails,
  hash,
  newSession,
  validSession
} from '../../../lib/server/payment-security';
import { verifyTurnstile } from '../../../lib/server/contact-delivery';
import { getTransaction, validWebhookSignature } from '../../../lib/server/genie';
import { db } from '../../../lib/server/payment-store';
import {
  activeParticipation,
  assertOwner,
  findPaidNomination,
  findParticipation,
  limitLookup,
  type ParticipationRecord
} from '../../../lib/server/participation-store';
import {
  beginParticipation,
  checkParticipation,
  deliverParticipation,
  participationView,
  verifyParticipation
} from '../../../lib/server/participation';
import {
  ALREADY_COMPLETED_MESSAGE,
  INVALID_WEBSITE_MESSAGE
} from '../../../lib/server/participation-eligibility';

export const prerender = false;
const SESSION = 'bwa_accept_session';
const GRANT = 'bwa_accept_grant';
function enabled() {
  assertPaymentEnabled();
  if (env('PARTICIPATION_PAYMENTS_ENABLED') !== 'true')
    throw new PaymentError(
      'Participation payments are temporarily unavailable. Please contact info@gbeaward.com.'
    );
}
function owner(context: APIContext) {
  const value = context.cookies.get(SESSION)?.value || '';
  if (!validSession(value))
    throw new PaymentError('Please check your website again to continue.', 401);
  return hash(value);
}
const demoAllowed = (context: APIContext) =>
  import.meta.env.DEV &&
  env('ACCEPT_DEMO') === 'true' &&
  ['127.0.0.1', 'localhost'].includes(context.url.hostname);
async function body(request: Request) {
  try {
    return JSON.parse(new TextDecoder().decode(await smallBody(request, 5000)));
  } catch (error) {
    if (error instanceof PaymentError) throw error;
    throw new PaymentError('The request could not be read.', 400);
  }
}

export const POST: APIRoute = async (context) => {
  const { request, cookies, params } = context;
  try {
    if (import.meta.env.DEV && demoAllowed(context))
      return await (
        await import('../../../lib/server/participation-demo')
      ).demoParticipation(context);
    if (params.action === 'webhook') {
      if (!validWebhookSignature(request.headers))
        throw new PaymentError('Invalid signature.', 401);
      const event = await body(request);
      const value = event?.data || event;
      const transactionId = value?.transactionId;
      if (!/^[a-f0-9]{24}$/i.test(transactionId || '')) return json(200, { ok: true });
      let record: ParticipationRecord | undefined;
      if (validReference(value.localId || '')) record = await findParticipation(value.localId);
      else {
        const rows =
          await db()`SELECT * FROM bwa.participation_payments WHERE transaction_id = ${transactionId}`;
        record = rows[0] as ParticipationRecord | undefined;
      }
      if (!record) {
        const authoritative = (await getTransaction(transactionId)) as { localId?: string };
        if (validReference(authoritative.localId || ''))
          record = await findParticipation(authoritative.localId!);
      }
      if (!record) return json(200, { ok: true });
      const verified = await verifyParticipation(record, transactionId);
      const delivered = await deliverParticipation(verified);
      const pending =
        delivered.state === 'paid' && !(delivered.customer_email_id && delivered.team_email_id);
      return json(pending ? 503 : 200, { ok: !pending });
    }
    requireSameOrigin(request);
    enabled();
    const data = await body(request);
    if (params.action === 'lookup') {
      if (typeof data?.website !== 'string') throw new PaymentError(INVALID_WEBSITE_MESSAGE, 400);
      let website: string;
      try {
        website = normaliseWebsite(data.website);
      } catch {
        throw new PaymentError(INVALID_WEBSITE_MESSAGE, 400);
      }
      await limitLookup(hash(`accept:${context.clientAddress}`));
      await verifyTurnstile(
        String(data.token || '').slice(0, 2048),
        request,
        context.clientAddress
      );
      const active = await activeParticipation(hash(website));
      if (active?.state === 'paid') throw new PaymentError(ALREADY_COMPLETED_MESSAGE, 409);
      const nomination = await findPaidNomination(website);
      const current = cookies.get(SESSION)?.value || '';
      const session = validSession(current) ? current : newSession();
      const ownerHash = hash(session);
      if (active && active.owner_hash !== ownerHash)
        throw new PaymentError(
          'A participation payment is already in progress for this website. Continue in the original browser or contact info@gbeaward.com.',
          409
        );
      const options = {
        httpOnly: true,
        secure: context.url.protocol === 'https:',
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 7 * 86400
      };
      cookies.set(SESSION, session, options);
      cookies.set(
        GRANT,
        encryptDetails(
          { nomination: nomination.id, owner: ownerHash, expires: Date.now() + 30 * 60_000 },
          'participation-grant'
        ),
        { ...options, maxAge: 1800 }
      );
      return json(200, {
        ok: true,
        website,
        ...(active ? { payment: participationView(active) } : {})
      });
    }
    if (params.action === 'start') {
      const ownerHash = owner(context);
      let grant: { nomination: string; owner: string; expires: number };
      try {
        grant = decryptDetails(cookies.get(GRANT)?.value || '', 'participation-grant');
      } catch {
        throw new PaymentError('Please check your website again before paying.', 401);
      }
      if (grant.owner !== ownerHash || grant.expires < Date.now())
        throw new PaymentError('Your verification expired. Please check your website again.', 401);
      if (data?.terms !== PARTICIPATION_TERMS)
        throw new PaymentError('Confirm your package, attendee count and total to continue.', 400);
      const choice = {
        packageCode: data.packageCode,
        extraTrophy: data.extraTrophy,
        attendees: data.attendees
      } as ParticipationChoice;
      try {
        participationQuote(choice);
      } catch (error) {
        throw new PaymentError((error as Error).message, 400);
      }
      return json(200, {
        ok: true,
        payment: await beginParticipation(grant.nomination, ownerHash, choice)
      });
    }
    return json(404, { ok: false });
  } catch (error) {
    return apiError(error);
  }
};
export const GET: APIRoute = async (context) => {
  try {
    if (import.meta.env.DEV && demoAllowed(context))
      return await (
        await import('../../../lib/server/participation-demo')
      ).demoParticipation(context);
    if (context.params.action === 'reconcile') {
      const secret = env('CRON_SECRET');
      const auth = context.request.headers.get('authorization') || '';
      if (
        secret.length < 32 ||
        auth.length !== `Bearer ${secret}`.length ||
        !timingSafeEqual(Buffer.from(auth), Buffer.from(`Bearer ${secret}`))
      )
        throw new PaymentError('Unauthorised.', 401);
      const config = paymentConfig();
      // Explicit recovery of an ambiguous transaction, using provider verification only.
      const reference = context.url.searchParams.get('reference');
      if (reference) {
        const transaction = context.url.searchParams.get('transaction') || '';
        if (!validReference(reference) || !/^[a-f0-9]{24}$/i.test(transaction))
          throw new PaymentError('Invalid recovery references.', 400);
        const record = await findParticipation(reference);
        if (!record) throw new PaymentError('Not found.', 404);
        return json(200, {
          ok: true,
          payment: participationView(
            await deliverParticipation(await verifyParticipation(record, transaction))
          )
        });
      }
      await db()`DELETE FROM bwa.participation_lookup_limits WHERE reset_at < now() - interval '1 day'`;
      const rows =
        await db()`SELECT * FROM bwa.participation_payments WHERE app_id = ${config.appId} AND sandbox = ${config.sandbox}
        AND transaction_id IS NOT NULL AND (state = 'pending' OR (state = 'paid' AND (customer_email_id IS NULL OR team_email_id IS NULL)))
        AND check_after <= now() ORDER BY check_after LIMIT 4`;
      const results = await Promise.allSettled(
        (rows as ParticipationRecord[]).map(checkParticipation)
      );
      const pending = results.filter(
        (result) =>
          result.status === 'rejected' || (result.value.state === 'paid' && !result.value.emailed)
      ).length;
      return json(pending ? 503 : 200, { ok: !pending, checked: results.length, pending });
    }
    if (context.params.action !== 'status') return json(404, { ok: false });
    const reference = context.url.searchParams.get('reference') || '';
    if (!validReference(reference)) throw new PaymentError('Invalid payment reference.', 400);
    const ownerHash = owner(context);
    const record = await findParticipation(reference);
    assertOwner(record, ownerHash);
    return json(200, { ok: true, payment: await checkParticipation(record) });
  } catch (error) {
    return apiError(error);
  }
};
export const ALL: APIRoute = () => json(405, { ok: false });

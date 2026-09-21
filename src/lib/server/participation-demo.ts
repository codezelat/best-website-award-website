// Imported only behind DEV + ACCEPT_DEMO + loopback guards. No provider or database writes.
import type { APIContext } from 'astro';
import { randomUUID } from 'node:crypto';
import {
  normaliseWebsite,
  participationQuote,
  PARTICIPATION_TERMS,
  type ParticipationView,
  type ParticipationChoice
} from '../participation/policy';
import { json, requireSameOrigin, smallBody } from './http';
import { env, PaymentError } from './payment-config';
import {
  eligibleNomination,
  INELIGIBLE_MESSAGE,
  INVALID_WEBSITE_MESSAGE
} from './participation-eligibility';

const sessions = new Map<
  string,
  { website?: string; payment?: ParticipationView; expires: number }
>();
export async function demoParticipation(context: APIContext) {
  if (
    !import.meta.env.DEV ||
    env('ACCEPT_DEMO') !== 'true' ||
    !['localhost', '127.0.0.1'].includes(context.url.hostname)
  )
    return json(404, { ok: false });
  const { request, cookies, params } = context;
  if (request.method === 'POST') requireSameOrigin(request);
  for (const [id, session] of sessions) if (session.expires < Date.now()) sessions.delete(id);
  const sessionId = cookies.get('bwa_accept_demo')?.value || randomUUID();
  const session = sessions.get(sessionId) || { expires: Date.now() + 86400_000 };
  sessions.set(sessionId, session);
  cookies.set('bwa_accept_demo', sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 86400
  });
  if (request.method === 'GET' && params.action === 'status') {
    if (!session.payment || session.payment.reference !== context.url.searchParams.get('reference'))
      throw new PaymentError('This test payment is not available. Start a new preview.', 404);
    return json(200, { ok: true, payment: session.payment });
  }
  if (request.method !== 'POST') return json(404, { ok: false });
  let data;
  try {
    data = JSON.parse(new TextDecoder().decode(await smallBody(request, 5000)));
  } catch {
    throw new PaymentError('Invalid test request.', 400);
  }
  if (params.action === 'lookup') {
    let website;
    try {
      website = normaliseWebsite(data.website);
    } catch {
      throw new PaymentError(INVALID_WEBSITE_MESSAGE, 400);
    }
    const nomination =
      website === 'example.com' || website === 'recent.example.com'
        ? {
            state: 'paid' as const,
            paid_at: new Date(
              Date.now() - (website === 'example.com' ? 24 : 6) * 3600_000
            ).toISOString()
          }
        : undefined;
    if (!eligibleNomination(nomination)) throw new PaymentError(INELIGIBLE_MESSAGE, 404);
    session.website = website;
    return json(200, {
      ok: true,
      website,
      ...(session.payment ? { payment: session.payment } : {})
    });
  }
  if (params.action === 'start') {
    if (!session.website) throw new PaymentError('Check your website first.', 401);
    if (data.terms !== PARTICIPATION_TERMS)
      throw new PaymentError('Confirm your selection first.', 400);
    const choice: ParticipationChoice = {
      packageCode: data.packageCode,
      extraTrophy: data.extraTrophy,
      attendees: data.attendees
    };
    let quote;
    try {
      quote = participationQuote(choice);
    } catch (error) {
      throw new PaymentError((error as Error).message, 400);
    }
    session.payment ||= {
      reference: randomUUID(),
      state: 'pending',
      emailed: false,
      message:
        'Preview checkout created. Simulate a successful payment below to see the confirmation.',
      website: session.website,
      choice,
      amount: quote.total
    };
    return json(200, { ok: true, payment: session.payment });
  }
  if (params.action === 'demo-confirm' && session.payment) {
    session.payment.state = 'paid';
    session.payment.message =
      'Your participation is confirmed. This was a test payment; no money was charged and no email was sent.';
    return json(200, { ok: true, payment: session.payment });
  }
  if (params.action === 'demo-reset') {
    session.payment = undefined;
    session.website = undefined;
    return json(200, { ok: true });
  }
  return json(404, { ok: false });
}

import type { APIRoute } from 'astro';
import { META_CONTENT_PATHS } from '../../lib/meta';
import { validReference } from '../../lib/payments/policy';
import { apiError, json, requireSameOrigin, smallBody } from '../../lib/server/http';
import { metaContext, queueMetaEvent, revokeMetaConsent } from '../../lib/server/meta-conversions';

export const prerender = false;
export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    requireSameOrigin(request);
    const body = JSON.parse(new TextDecoder().decode(await smallBody(request, 2000)));
    if (body.action === 'revoke') {
      await revokeMetaConsent(request, body.consent);
      return json(200, { ok: true });
    }
    const context = metaContext(request, clientAddress);
    if (!context) return json(200, { ok: true });
    const path = new URL(context.sourceUrl).pathname;
    // This public collector can never manufacture a lead, registration or purchase.
    if (
      !validReference(body.reference || '') ||
      !(
        (body.name === 'ViewContent' && META_CONTENT_PATHS.includes(path)) ||
        (body.name === 'Contact' &&
          ['email', 'phone', 'whatsapp'].includes(body.channel) &&
          !path.startsWith('/api/') &&
          path !== '/nomination-status')
      )
    )
      return json(400, { ok: false });
    await queueMetaEvent(
      context,
      body.name,
      body.reference,
      Date.now(),
      body.name === 'Contact' ? { contact_channel: body.channel } : undefined
    );
    return json(200, { ok: true });
  } catch (error) {
    return apiError(error);
  }
};
export const ALL: APIRoute = () => json(405, { ok: false });

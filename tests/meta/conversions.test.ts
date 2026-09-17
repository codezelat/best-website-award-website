import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildMetaEvent,
  metaContext,
  metaEnabled,
  sendMetaEvent,
  trackPaidMeta
} from '../../src/lib/server/meta-conversions';
import { hash } from '../../src/lib/server/payment-security';
import type { PaymentRecord } from '../../src/lib/server/payment-store';
import { POST } from '../../src/pages/api/meta';

const reference = '4f07dbbb-f612-4f46-96db-cf8823ffc395';
const request = (cookie = `bwa_meta_consent=${reference}`) =>
  new Request('https://bestwebsiteaward.com/api/contact', {
    headers: {
      cookie,
      referer: 'https://bestwebsiteaward.com/contact?email=private@example.com#secret',
      'user-agent': 'Test browser'
    }
  });
beforeEach(() => {
  vi.stubEnv('META_CAPI_ENABLED', 'true');
  vi.stubEnv('META_CAPI_ACCESS_TOKEN', 'test-secret');
  vi.stubEnv('VERCEL_ENV', 'production');
  vi.stubEnv('META_TEST_EVENT_CODE', '');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('Meta matching and event delivery', () => {
  it('requires separate analytics permission, never just form privacy acceptance', () => {
    expect(metaContext(request(''))).toBeUndefined();
    expect(metaContext(request('bwa_meta_consent=granted'))).toBeUndefined();
  });
  it('hashes matching data and removes sensitive query strings', () => {
    const context = metaContext(request(), '203.0.113.7', {
      email: ' Entrant@Example.com ',
      phone: '+94 (77) 123-4567'
    })!;
    expect(context.sourceUrl).toBe('https://bestwebsiteaward.com/contact');
    expect(context.userData).toEqual({
      client_ip_address: '203.0.113.7',
      client_user_agent: 'Test browser',
      em: [hash('entrant@example.com')],
      ph: [hash('94771234567')]
    });
    expect(context.consentId).toBe(hash(reference));
  });
  it('does not guess phone country codes or invent click IDs', () => {
    const context = metaContext(request(), 'invalid', {
      email: 'x@example.com',
      phone: '0771234567'
    })!;
    expect(context.userData.ph).toBeUndefined();
    expect(context.userData.fbc).toBeUndefined();
    expect(context.userData.client_ip_address).toBeUndefined();
  });
  it('preserves valid Meta cookies without hashing', () => {
    const fbc = 'fb.1.1789661902000.real_click';
    const fbp = 'fb.1.1789661902000.123456';
    expect(
      metaContext(request(`bwa_meta_consent=${reference}; _fbc=${fbc}; _fbp=${fbp}`))?.userData
    ).toMatchObject({ fbc, fbp });
  });
  it('keeps local and preview events out of production reporting', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    expect(metaEnabled()).toBe(false);
    vi.stubEnv('META_TEST_EVENT_CODE', 'TEST123');
    expect(metaEnabled()).toBe(true);
  });
  it('uses stable IDs, original event time and major currency units', async () => {
    const event = buildMetaEvent(metaContext(request())!, 'Purchase', reference, 1789661902000, {
      value: 2850,
      currency: 'LKR'
    });
    expect(event).toMatchObject({
      event_id: `bwa:Purchase:${reference}`,
      event_time: 1789661902,
      action_source: 'website',
      custom_data: { value: 2850, currency: 'LKR' }
    });
    const fetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{"events_received":1}'));
    expect(await sendMetaEvent(event)).toBe(true);
    const [url, options] = fetch.mock.calls[0]!;
    expect(url).toBe('https://graph.facebook.com/v26.0/1382406717339611/events');
    expect(options?.headers).toMatchObject({ Authorization: 'Bearer test-secret' });
    expect(String(options?.body)).not.toContain('test-secret');
  });
  it('does not report pending, failed or sandbox payments', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch');
    for (const state of ['pending', 'failed', 'review'])
      await trackPaidMeta({ state } as PaymentRecord);
    await trackPaidMeta({
      state: 'paid',
      paid_at: new Date().toISOString(),
      sandbox: true
    } as PaymentRecord);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('rejects forged paid events on the public endpoint', async () => {
    const req = new Request('https://bestwebsiteaward.com/api/meta', {
      method: 'POST',
      headers: {
        ...Object.fromEntries(request().headers),
        origin: 'https://bestwebsiteaward.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'Purchase', reference })
    });
    expect((await POST({ request: req } as never)).status).toBe(400);
  });
  it('rejects cross-origin tracking requests', async () => {
    const req = new Request('https://bestwebsiteaward.com/api/meta', {
      method: 'POST',
      headers: { Origin: 'https://other.example' },
      body: '{}'
    });
    expect((await POST({ request: req } as never)).status).toBe(403);
  });
});

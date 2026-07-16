import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../../src/pages/api/contact';

const formRequest = () => {
  const formData = new FormData();
  formData.set('submissionId', '4f07dbbb-f612-4f46-96db-cf8823ffc395');
  formData.set('enquiryType', 'present');
  formData.set('name', 'Test Entrant');
  formData.set('email', 'entrant@example.com');
  formData.set('organisation', 'Example Studio');
  formData.set('website', 'https://example.com');
  formData.set('privacyAccepted', 'yes');
  formData.set('cf-turnstile-response', 'verified-token');

  return new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { Origin: 'http://localhost' },
    body: formData
  });
};

describe('contact API endpoint', () => {
  beforeEach(() => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-turnstile-secret');
    vi.stubEnv('RESEND_API_KEY', 'test-resend-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('verifies the submission and sends a structured email through Resend', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true, action: 'contact_form' }), { status: 200 })
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'email-id' }), { status: 200 }));

    const response = await POST({ request: formRequest(), clientAddress: '127.0.0.1' } as never);
    const result = (await response.json()) as { ok: boolean; message: string };

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('cdn-cache-control')).toBe('no-store');
    expect(response.headers.get('vercel-cdn-cache-control')).toBe('no-store');
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(result.ok).toBe(true);
    expect(result.message).toContain('awards team');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const resendCall = fetchMock.mock.calls[1];
    const resendOptions = resendCall?.[1] as RequestInit;
    const payload = JSON.parse(String(resendOptions.body));
    expect(payload).toMatchObject({
      to: ['info@gbeaward.com'],
      reply_to: 'entrant@example.com'
    });
    expect(payload.subject).toContain('Example Studio');
  });

  it('stops before email delivery when secure verification fails', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ success: false, 'error-codes': ['invalid-input-response'] }), {
        status: 200
      })
    );

    const response = await POST({ request: formRequest(), clientAddress: '127.0.0.1' } as never);
    const result = (await response.json()) as { ok: boolean; message: string };

    expect(response.status).toBe(400);
    expect(result.ok).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

import { describe, expect, it } from 'vitest';
import { parseContactSubmission } from '../../src/lib/contact';

const validSubmission = () => {
  const formData = new FormData();
  formData.set('submissionId', '4f07dbbb-f612-4f46-96db-cf8823ffc395');
  formData.set('enquiryType', 'present');
  formData.set('name', 'Test Entrant');
  formData.set('email', 'entrant@example.com');
  formData.set('organisation', 'Example Studio');
  formData.set('website', 'https://example.com');
  formData.set('privacyAccepted', 'yes');
  formData.set('cf-turnstile-response', 'verified-token');
  return formData;
};

describe('contact submission validation', () => {
  it('accepts a complete website presentation through the server contract', () => {
    const result = parseContactSubmission(validSubmission());

    expect(result.error).toBeUndefined();
    expect(result.data).toMatchObject({
      enquiryType: 'present',
      email: 'entrant@example.com',
      website: 'https://example.com'
    });
  });

  it('requires a website for presentation enquiries', () => {
    const formData = validSubmission();
    formData.delete('website');

    expect(parseContactSubmission(formData).error).toContain('website');
  });

  it('rejects unsafe URL schemes and submissions without verification', () => {
    const formData = validSubmission();
    formData.set('website', 'javascript:alert(1)');
    expect(parseContactSubmission(formData).error).toContain('website address');

    formData.set('website', 'https://example.com');
    formData.delete('cf-turnstile-response');
    expect(parseContactSubmission(formData).error).toContain('verification');
  });
});

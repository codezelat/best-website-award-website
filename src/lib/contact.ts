export const enquiryLabels = {
  present: 'Present a website',
  eligibility: 'Eligibility or evaluation question',
  programme: 'Programme information',
  media: 'Media or partnership enquiry',
  other: 'Other enquiry'
} as const;

export type EnquiryType = keyof typeof enquiryLabels;

export interface ContactSubmission {
  submissionId: string;
  enquiryType: EnquiryType;
  name: string;
  email: string;
  organisation: string;
  phone: string;
  website: string;
  message: string;
  websiteConfirmation: string;
  privacyAccepted: boolean;
  turnstileToken: string;
}

export interface ContactValidationResult {
  data?: ContactSubmission;
  error?: string;
}

const trimField = (formData: FormData, name: string, maximum: number) =>
  String(formData.get(name) ?? '')
    .trim()
    .slice(0, maximum);

const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validSubmissionId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const parseContactSubmission = (formData: FormData): ContactValidationResult => {
  const enquiryType = trimField(formData, 'enquiryType', 30) as EnquiryType;
  const name = trimField(formData, 'name', 100);
  const email = trimField(formData, 'email', 254).toLowerCase();
  const organisation = trimField(formData, 'organisation', 140);
  const phone = trimField(formData, 'phone', 40);
  const website = trimField(formData, 'website', 500);
  const message = trimField(formData, 'message', 2000);
  const websiteConfirmation = trimField(formData, 'websiteConfirmation', 200);
  const privacyAccepted = formData.get('privacyAccepted') === 'yes';
  const turnstileToken = trimField(formData, 'cf-turnstile-response', 2048);
  const suppliedSubmissionId = trimField(formData, 'submissionId', 80);
  const submissionId = validSubmissionId.test(suppliedSubmissionId)
    ? suppliedSubmissionId
    : crypto.randomUUID();

  if (!(enquiryType in enquiryLabels)) return { error: 'Choose the type of enquiry.' };
  if (name.length < 2) return { error: 'Enter your name.' };
  if (!validEmail.test(email)) return { error: 'Enter a valid email address.' };
  if (organisation.length < 2) return { error: 'Enter your organisation or studio.' };

  if (website) {
    try {
      const url = new URL(website);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Unsupported protocol');
    } catch {
      return { error: 'Enter a complete website address beginning with http:// or https://.' };
    }
  } else if (enquiryType === 'present') {
    return { error: 'Enter the website you would like to present.' };
  }

  if (!privacyAccepted) return { error: 'Confirm that we may use these details to respond.' };
  if (!turnstileToken) return { error: 'Complete the secure verification.' };

  return {
    data: {
      submissionId,
      enquiryType,
      name,
      email,
      organisation,
      phone,
      website,
      message,
      websiteConfirmation,
      privacyAccepted,
      turnstileToken
    }
  };
};

export const escapeHtml = (value: string) =>
  value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ??
      character
  );

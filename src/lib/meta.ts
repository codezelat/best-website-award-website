export const META_PIXEL_ID = '1382406717339611';
export const META_CONSENT_COOKIE = 'bwa_meta_consent';
export const META_CONTENT_PATHS = [
  '/',
  '/awards',
  '/standard',
  '/process',
  '/work',
  '/recognition',
  '/contact'
];
export type MetaEventName =
  'ViewContent' | 'Contact' | 'Lead' | 'CompleteRegistration' | 'Purchase';
export const metaEventId = (name: MetaEventName, reference: string) => `bwa:${name}:${reference}`;

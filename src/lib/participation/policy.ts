export const PARTICIPATION_TERMS = '2026-09-22';
export const PARTICIPATION_CURRENCY = 'LKR';
export const EXTRA_ATTENDEE_AMOUNT = 635_000;
export const EXTRA_TROPHY_AMOUNT = 1_250_000;
export const PACKAGES = {
  A: { amount: 3_750_000, included: 1 },
  B: { amount: 3_750_000, included: 1 },
  C: { amount: 6_000_000, included: 2 }
} as const;
export type PackageCode = keyof typeof PACKAGES;
export interface ParticipationChoice {
  packageCode: PackageCode;
  extraTrophy: boolean;
  attendees: number;
}
export function participationQuote(choice: ParticipationChoice) {
  if (!Object.hasOwn(PACKAGES, choice.packageCode))
    throw new Error('Choose a participation package.');
  const selected = PACKAGES[choice.packageCode];
  if (
    !Number.isSafeInteger(choice.attendees) ||
    choice.attendees < selected.included ||
    choice.attendees > 10
  )
    throw new Error(
      `Enter a total of at least ${selected.included} attendees, and no more than 10, including your included places.`
    );
  if (typeof choice.extraTrophy !== 'boolean' || (choice.extraTrophy && choice.packageCode !== 'C'))
    throw new Error('The additional trophy is available with Package C.');
  const additional = choice.attendees - selected.included;
  return {
    base: selected.amount,
    included: selected.included,
    additional,
    attendeeAmount: additional * EXTRA_ATTENDEE_AMOUNT,
    trophyAmount: choice.extraTrophy ? EXTRA_TROPHY_AMOUNT : 0,
    total:
      selected.amount +
      additional * EXTRA_ATTENDEE_AMOUNT +
      (choice.extraTrophy ? EXTRA_TROPHY_AMOUNT : 0)
  };
}
export const money = (minor: number) => `LKR ${(minor / 100).toLocaleString('en-LK')}`;

// Awards are nominated per website domain. Page paths and tracking parameters
// do not change the website. Keep other subdomains distinct; never fuzzy-match.
export function normaliseWebsite(value: string) {
  const input = value.trim();
  if (!input || input.length > 500) throw new Error('Enter your nominated website address.');
  let url: URL;
  if (/\s|\\/.test(input)) throw new Error('Enter a valid website address.');
  try {
    url = new URL(
      input.startsWith('//')
        ? `https:${input}`
        : /^[a-z][a-z\d+.-]*:\/\//i.test(input)
          ? input
          : `https://${input}`
    );
  } catch {
    throw new Error('Enter a valid website address.');
  }
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.port ||
    !url.hostname.includes('.')
  )
    throw new Error('Enter a public website address beginning with https://.');
  const host = url.hostname
    .toLowerCase()
    .replace(/^www\./, '')
    .replace(/\.$/, '');
  const labels = host.split('.');
  if (
    labels.length < 2 ||
    labels.some((label) => !/^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(label)) ||
    /^\d+$/.test(labels.at(-1)!)
  )
    throw new Error('Enter a valid public website domain.');
  return host;
}

export interface ParticipationView {
  reference: string;
  state: 'creating' | 'pending' | 'paid' | 'failed' | 'review';
  emailed: boolean;
  message: string;
  checkoutUrl?: string;
  choice: ParticipationChoice;
  amount: number;
  website: string;
}

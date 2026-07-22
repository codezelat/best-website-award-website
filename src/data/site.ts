import type { ContactDetails, NavigationItem, SocialLink } from '../lib/content/types';

export const siteNavigation = [
  { label: 'The awards', href: '/awards' },
  { label: 'Work we recognise', href: '/work' },
  { label: 'The standard', href: '/standard' },
  { label: 'Gallery', href: '/gallery' },
  { label: 'About', href: '/about' }
] satisfies NavigationItem[];

export const legalNavigation = [
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy', href: '/privacy-policy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Cookies', href: '/cookies' }
] satisfies NavigationItem[];

export const contactDetails = {
  email: 'info@gbeaward.com',
  location: 'London, United Kingdom',
  parentOrganisation: 'Global Business Excellence Awards',
  parentWebsite: 'https://gbeaward.com/'
} satisfies ContactDetails;

export const programmeDetails = {
  status: 'Entries now open',
  date: '28 August 2026',
  whatsappHref: 'https://wa.link/4f21fy',
  feeGuidance: 'Confirm the applicable entry fee directly with the awards team on WhatsApp.'
} as const;

export const socialLinks = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/gbeaward/',
    network: 'facebook'
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/gbeaward/',
    network: 'instagram'
  },
  { label: 'X', href: 'https://www.x.com/gbeaward/', network: 'x' },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/gbeaward/',
    network: 'linkedin'
  },
  { label: 'WhatsApp', href: programmeDetails.whatsappHref, network: 'whatsapp' }
] satisfies SocialLink[];

export const publicRoutes = [
  '/',
  '/about',
  '/awards',
  '/contact',
  '/cookies',
  '/faq',
  '/gallery',
  '/privacy-policy',
  '/process',
  '/standard',
  '/terms',
  '/work'
] as const;

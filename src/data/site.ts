import type { ContactDetails, NavigationItem, SocialLink } from '../lib/content/types';

export const siteNavigation = [
  { label: 'The awards', href: '/awards' },
  { label: 'Work we recognise', href: '/work', showInHeader: false },
  { label: 'The standard', href: '/standard' },
  { label: 'Recognition', href: '/recognition' },
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
  parentWebsite: 'https://gbeaward.com/',
  offices: [
    {
      label: 'UK HQ',
      lines: ['20 Wenlock Road', 'London, N1 7GU', 'United Kingdom']
    },
    {
      label: 'UK Branch',
      lines: ['71-75 Shelton Street', 'London, WC2H 9JQ', 'United Kingdom']
    },
    {
      label: 'LK HQ',
      lines: ['Level 26, East Tower', 'World Trade Center', 'Colombo 01, Sri Lanka']
    },
    {
      label: 'LK Branch',
      lines: ['345/35, R. I. T. Alles Mawatha', 'Borella, Colombo 08', 'Sri Lanka']
    }
  ]
} satisfies ContactDetails;

export const programmeDetails = {
  status: 'Nominations are closed',
  acceptingNominations: false,
  date: '2026',
  whatsappHref: 'https://wa.link/qnfbkz'
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
  '/recognition',
  '/standard',
  '/terms',
  '/work'
] as const;

import type { NavigationItem } from '../lib/content/types';

export const siteNavigation = [
  { label: 'The awards', href: '/awards' },
  { label: 'Work we recognise', href: '/work' },
  { label: 'The standard', href: '/standard' },
  { label: 'About', href: '/about' }
] satisfies NavigationItem[];

export const legalNavigation = [
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy', href: '/privacy-policy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Cookies', href: '/cookies' }
] satisfies NavigationItem[];

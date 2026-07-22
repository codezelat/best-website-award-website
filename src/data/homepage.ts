import heroArchitecture from '../assets/generated/hero-architecture.png';
import workBrand from '../assets/generated/work-brand.png';
import workDigitalProducts from '../assets/generated/work-digital-products.png';
import workOrganisations from '../assets/generated/work-organisations.png';
import workPortfolios from '../assets/generated/work-portfolios.png';
import type { HomepageContent } from '../lib/content/types';
import { featuredEventGalleryItems } from './gallery';
import { programmeDetails, siteNavigation } from './site';

export const homepageContent = {
  seo: {
    title: 'Best Website Awards Sri Lanka 2026 | Global Recognition',
    description: `Entries are open for Best Website Awards Sri Lanka 2026 on ${programmeDetails.date}, recognising outstanding websites across design, experience, accessibility and impact.`
  },
  navigation: siteNavigation,
  hero: {
    title: 'Best Website Awards 2026.',
    summary: `${programmeDetails.status} for the ${programmeDetails.date} programme. Earn global recognition for exceptional digital work shaped with purpose and measurable impact.`,
    primaryAction: { label: 'Apply now', href: '/contact' },
    secondaryAction: { label: 'View the standard', href: '#standard' },
    image: {
      src: heroArchitecture,
      alt: 'Sculptural white architecture beneath a clear blue sky',
      position: 'center 54%'
    }
  },
  introduction: {
    index: '01',
    title: 'A standard for meaningful digital work.',
    statements: [
      'Best Website Awards connects Sri Lanka’s digital excellence with global recognition while welcoming work from every market.',
      `${programmeDetails.status} for the official programme date of ${programmeDetails.date}.`
    ]
  },
  work: {
    title: 'The work we recognise',
    summary:
      'Digital work takes many forms. What matters is how clearly it serves its purpose and the people using it.',
    items: [
      {
        id: 'organisations',
        index: '01',
        title: 'Websites for organisations',
        summary: 'Purpose-led experiences built to inform, serve and earn trust.',
        image: {
          src: workOrganisations,
          alt: 'Contemporary glass and timber headquarters in a landscaped setting'
        },
        layout: 'wide'
      },
      {
        id: 'brands',
        index: '02',
        title: 'Brand-led experiences',
        summary: 'Distinctive work that turns strategy into something people remember.',
        image: {
          src: workBrand,
          alt: 'Sculptural blue glass form in a precise campaign still life'
        },
        layout: 'standard'
      },
      {
        id: 'portfolios',
        index: '03',
        title: 'Independent portfolios',
        summary: 'Focused websites that make skill, thinking and point of view visible.',
        image: {
          src: workPortfolios,
          alt: 'Creative studio table with paper studies and a blue architectural model'
        },
        layout: 'standard'
      },
      {
        id: 'products',
        index: '04',
        title: 'Digital products',
        summary: 'Useful interfaces that solve real problems with clarity.',
        image: {
          src: workDigitalProducts,
          alt: 'Modular blue glass and graphite forms arranged as a connected system'
        },
        layout: 'wide'
      }
    ]
  },
  evaluation: {
    title: 'Four measures of excellence',
    summary:
      'A clear framework keeps attention on the qualities that make a website genuinely effective.',
    items: [
      {
        id: 'design-experience',
        index: '01',
        title: 'Design & Experience',
        summary: 'Clarity, craft and intuitive use across every interaction.'
      },
      {
        id: 'performance-accessibility',
        index: '02',
        title: 'Performance & Accessibility',
        summary: 'Fast, reliable and inclusive across devices and abilities.'
      },
      {
        id: 'content-purpose',
        index: '03',
        title: 'Content & Purpose',
        summary: 'Clear communication aligned with a meaningful objective.'
      },
      {
        id: 'innovation-impact',
        index: '04',
        title: 'Innovation & Impact',
        summary: 'Original thinking that creates useful, measurable outcomes.'
      }
    ]
  },
  process: {
    title: 'A clear path to recognition',
    summary: 'A focused journey that keeps the work and the thinking behind it at the centre.',
    items: [
      {
        id: 'present',
        index: '01',
        title: 'Present the work',
        summary: 'Share the website and the thinking behind it.'
      },
      {
        id: 'review',
        index: '02',
        title: 'Independent review',
        summary: 'Work is considered against a clear evaluation framework.'
      },
      {
        id: 'recognition',
        index: '03',
        title: 'Recognition',
        summary: 'Exceptional work earns a place in the awards.'
      }
    ]
  },
  gallery: {
    title: 'Recognition in view.',
    summary:
      'Authentic moments from the wider awards programme, where achievement is presented and shared.',
    items: featuredEventGalleryItems,
    action: { label: 'View the gallery', href: '/gallery' }
  },
  parentBrand: {
    title: 'Global perspective. Business credibility.',
    summary:
      'Best Website Awards 2026 is powered by Global Business Excellence Awards, connecting digital craft with a wider standard of business excellence.',
    attribution: 'Powered by Global Business Excellence Awards'
  },
  closing: {
    title: 'Present your website for 2026.',
    summary: `${programmeDetails.status} for ${programmeDetails.date}. ${programmeDetails.feeGuidance}`,
    primaryAction: { label: 'Apply now', href: '/contact' },
    secondaryAction: { label: 'Confirm fee on WhatsApp', href: programmeDetails.whatsappHref }
  }
} satisfies HomepageContent;

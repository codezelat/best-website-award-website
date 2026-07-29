import decLogo from '../assets/recognition/dec-logo.webp';
import gbeAwardsLogo from '../assets/recognition/gbe-awards-logo.png';
import londonBusinessConsultancyLogo from '../assets/recognition/london-business-consultancy-logo.webp';
import recognitionAudience from '../assets/recognition/recognition-audience.webp';
import recognitionCommunity from '../assets/recognition/recognition-community.webp';
import recognitionGlassAward from '../assets/recognition/recognition-glass-award-v3.png';
import recognitionRecipient from '../assets/recognition/recognition-recipient.webp';
import recognitionVenue from '../assets/recognition/recognition-venue.webp';
import sitcCampusLogo from '../assets/recognition/sitc-campus-logo.webp';
import type { RecognitionPageContent } from '../lib/content/types';
import { programmeDetails } from './site';

export const recognitionPageContent = {
  slug: 'recognition',
  seo: {
    title: 'Recognition Framework | Best Website Awards 2026',
    description:
      'Explore the four-part recognition framework behind Best Website Awards 2026, including GBE Awards, DEC, SITC Campus Business Faculty and the UK organiser.',
    pageType: 'CollectionPage'
  },
  hero: {
    title: 'Recognition with every role made clear.',
    summary:
      'A focused website awards programme connected to a wider framework of recognition, research and responsible administration.',
    primaryAction: { label: 'Understand the roles', href: '#recognition-framework' },
    secondaryAction: { label: 'See recognition in action', href: '#recognition-in-action' },
    image: {
      src: recognitionGlassAward,
      alt: 'Elegant optical-crystal Best Website Awards recognition trophy',
      position: 'center'
    },
    frameLabel: 'Recognition framework',
    visualIndex: 'BWA / 07'
  },
  introduction: {
    title: 'Four organisations. Four defined roles.',
    body: [
      'Global Business Excellence Awards provides the wider awards platform behind Best Website Awards.',
      'DEC, SITC Campus Business Faculty and London Business Consultancy each hold a separate role in the broader framework. Recognition, research and programme administration are not presented as the same responsibility.'
    ]
  },
  framework: {
    title: 'The framework, clearly stated',
    summary:
      'Each organisation contributes through a specific role. Keeping those responsibilities distinct makes the recognition easier to understand.',
    items: [
      {
        id: 'gbe-awards',
        index: '01',
        eyebrow: 'Wider awards platform',
        name: 'Global Business Excellence Awards',
        role: 'Parent awards programme',
        summary:
          'Best Website Awards is powered by Global Business Excellence Awards, connecting focused digital recognition to a broader view of business excellence.',
        detail:
          'GBE Awards provides the parent awards identity and recognition context. The institutional recognition, research and programme administration roles below remain clearly separate.',
        logo: {
          src: gbeAwardsLogo,
          alt: 'Global Business Excellence Awards logo'
        },
        logoPresentation: 'portrait'
      },
      {
        id: 'dec',
        index: '02',
        eyebrow: 'Sri Lankan institutional recognition',
        name: 'DEC',
        role: 'Institutional recognition',
        summary:
          'The Global Business Excellence Awards programme is institutionally recognised in Sri Lanka through DEC.',
        highlight:
          'DEC is identified under the Ministry of Industry of the Democratic Socialist Republic of Sri Lanka, Gazette No. 2387/25.',
        detail:
          "DEC's role is institutional recognition of the GBE Awards programme in Sri Lanka. DEC is not presented as the programme's education provider, awarding body or academic accreditor.",
        logo: {
          src: decLogo,
          alt: 'DEC Sri Lanka logo'
        },
        logoPresentation: 'wide-light'
      },
      {
        id: 'sitc-campus',
        index: '03',
        eyebrow: 'Research and academic review',
        name: 'SITC Campus Business Faculty',
        role: 'Business research support',
        summary:
          'SITC Campus Business Faculty contributes business-focused research and academic review to the GBE Awards recognition framework.',
        detail:
          'Its role supports informed review by bringing an academic and business research perspective to the awards programme.',
        logo: {
          src: sitcCampusLogo,
          alt: 'SITC Campus logo'
        },
        logoPresentation: 'wide-light'
      },
      {
        id: 'london-business-consultancy',
        index: '04',
        eyebrow: 'United Kingdom organiser',
        name: 'London Business Consultancy',
        role: 'Programme administration',
        summary:
          'London Business Consultancy organises and administers the Global Business Excellence Awards from London, United Kingdom.',
        detail:
          'As the UK organiser, London Business Consultancy manages programme administration, award records and authorised certificate issuance from London.',
        logo: {
          src: londonBusinessConsultancyLogo,
          alt: 'London Business Consultancy logo'
        },
        logoPresentation: 'wide-dark'
      }
    ]
  },
  gallery: {
    title: 'Recognition in action',
    summary:
      'Authentic moments from Global Business Excellence Awards ceremonies, showing the people, setting and presentation behind the wider programme.',
    attribution: 'Global Business Excellence Awards ceremony archive',
    items: [
      {
        id: 'recognition-audience',
        index: '01',
        title: 'A programme witnessed',
        summary: 'Recipients, representatives and guests gathered for the awards programme.',
        image: {
          src: recognitionAudience,
          alt: 'Guests seated together at a Global Business Excellence Awards ceremony'
        },
        layout: 'wide'
      },
      {
        id: 'recognition-recipient',
        index: '02',
        title: 'Achievement held clearly',
        summary: 'A recipient photographed with the award presented during the programme.',
        image: {
          src: recognitionRecipient,
          alt: 'Global Business Excellence Awards recipient holding a presentation trophy',
          position: 'center 25%'
        },
        layout: 'standard'
      },
      {
        id: 'recognition-venue',
        index: '03',
        title: 'A visible public setting',
        summary: 'The programme identity presented at the ceremony venue.',
        image: {
          src: recognitionVenue,
          alt: 'Global Business Excellence Awards banners outside the ceremony venue'
        },
        layout: 'standard'
      },
      {
        id: 'recognition-community',
        index: '04',
        title: 'Recognition shared',
        summary: 'A recipient and guests together after the formal presentation.',
        image: {
          src: recognitionCommunity,
          alt: 'Global Business Excellence Awards recipient and guests holding an award and certificate'
        },
        layout: 'wide'
      }
    ]
  },
  record: {
    eyebrow: 'Certificate authenticity',
    title: 'A certificate connected to a real award record.',
    summary:
      'Within the wider GBE Awards framework, the certificate is an awards programme record. It is not a certificate issued by the UK Government.',
    statement:
      "Authenticity comes from the match between the recipient, award title, category, year, authorised signature and the organiser's published record.",
    steps: [
      {
        id: 'issued',
        index: '01',
        title: 'Issued',
        summary:
          'The certificate records the recipient, award title, category and award year as maintained by the awards organiser.'
      },
      {
        id: 'signed',
        index: '02',
        title: 'Signed',
        summary:
          'Each certificate is signed by an authorised representative of London Business Consultancy, the UK organiser.'
      },
      {
        id: 'recorded',
        index: '03',
        title: 'Recorded',
        summary:
          'Published award records provide a public reference connecting the recipient to the relevant award and year.'
      }
    ]
  },
  closing: {
    title: 'Present work that can stand up to review.',
    summary: `${programmeDetails.status} for the 2026 programme. Make the website, its purpose and the evidence behind it clear.`,
    primaryAction: { label: 'Apply now', href: '/contact' },
    secondaryAction: { label: 'See the process', href: '/process' }
  }
} satisfies RecognitionPageContent;

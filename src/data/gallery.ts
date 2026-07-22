import awardPresentation from '../assets/event/award-presentation.webp';
import ceremonyAudience from '../assets/event/ceremony-audience.webp';
import ceremonyHosts from '../assets/event/ceremony-hosts.webp';
import ceremonyHonour from '../assets/event/ceremony-honour.webp';
import ceremonyOpening from '../assets/event/ceremony-opening.webp';
import culturalWelcome from '../assets/event/cultural-welcome.webp';
import groupRecognition from '../assets/event/group-recognition.webp';
import leadershipRecognition from '../assets/event/leadership-recognition.webp';
import recipientCommunity from '../assets/event/recipient-community.webp';
import recipientPortraitBlack from '../assets/event/recipient-portrait-black.webp';
import recipientPortraitBlue from '../assets/event/recipient-portrait-blue.webp';
import recipientRecognition from '../assets/event/recipient-recognition.webp';
import recipientTable from '../assets/event/recipient-table.webp';
import stageHosts from '../assets/event/stage-hosts.webp';
import stageWinners from '../assets/event/stage-winners.webp';
import winnerCertificates from '../assets/event/winner-certificates.webp';
import womenWinners from '../assets/event/women-winners.webp';
import type { EventGalleryItem, GalleryPageContent } from '../lib/content/types';
import { programmeDetails } from './site';

export const eventGalleryItems = [
  {
    id: 'award-presentation',
    index: '01',
    title: 'Recognition on stage',
    summary:
      'A previous Global Business Excellence Awards presentation with recipients and programme representatives.',
    image: {
      src: awardPresentation,
      alt: 'Global Business Excellence Awards recipients and programme representatives during a stage presentation'
    },
    layout: 'wide'
  },
  {
    id: 'recipient-portrait-blue',
    index: '02',
    title: 'A personal record',
    summary: 'A recipient photographed with the award and certificate presented at the programme.',
    image: {
      src: recipientPortraitBlue,
      alt: 'Global Business Excellence Awards recipient holding a trophy and certificate'
    },
    layout: 'standard'
  },
  {
    id: 'ceremony-welcome',
    index: '03',
    title: 'A ceremonial welcome',
    summary: 'Traditional performance welcoming guests as the awards programme begins.',
    image: {
      src: culturalWelcome,
      alt: 'Traditional dancers welcoming guests at a Global Business Excellence Awards ceremony'
    },
    layout: 'standard'
  },
  {
    id: 'stage-hosts',
    index: '04',
    title: 'Guiding the programme',
    summary: 'The ceremony hosts addressing guests from the awards stage.',
    image: {
      src: stageHosts,
      alt: 'Two hosts speaking from the Global Business Excellence Awards stage'
    },
    layout: 'wide'
  },
  {
    id: 'stage-winners',
    index: '05',
    title: 'Winners together',
    summary:
      'Recipients and programme representatives gathered at the close of an award presentation.',
    image: {
      src: stageWinners,
      alt: 'Global Business Excellence Awards recipients and representatives gathered on stage'
    },
    layout: 'wide'
  },
  {
    id: 'winner-certificates',
    index: '06',
    title: 'Achievement shared',
    summary: 'Recipients together with the awards and certificates presented to them.',
    image: {
      src: winnerCertificates,
      alt: 'Three Global Business Excellence Awards recipients holding trophies and certificates'
    },
    layout: 'standard'
  },
  {
    id: 'ceremony-honour',
    index: '07',
    title: 'Honouring achievement',
    summary: 'An award presentation bringing recipients and programme representatives together.',
    image: {
      src: ceremonyHonour,
      alt: 'Global Business Excellence Awards recipient receiving a trophy on stage'
    },
    layout: 'wide'
  },
  {
    id: 'recipient-portrait-black',
    index: '08',
    title: 'Achievement documented',
    summary: 'A recipient displaying the award and certificate received at the programme.',
    image: {
      src: recipientPortraitBlack,
      alt: 'Global Business Excellence Awards recipient displaying a trophy and certificate'
    },
    layout: 'standard'
  },
  {
    id: 'leadership-recognition',
    index: '09',
    title: 'Leadership recognised',
    summary: 'A recipient and programme representatives sharing the stage after presentation.',
    image: {
      src: leadershipRecognition,
      alt: 'Global Business Excellence Awards recipient and programme representatives on stage'
    },
    layout: 'wide'
  },
  {
    id: 'women-winners',
    index: '10',
    title: 'Women in recognition',
    summary: 'Award recipients and guests photographed together at the programme.',
    image: {
      src: womenWinners,
      alt: 'Women recipients and guests with a Global Business Excellence Award and certificate'
    },
    layout: 'standard'
  },
  {
    id: 'ceremony-audience',
    index: '11',
    title: 'The wider community',
    summary: 'Guests and recipients gathered around the wider awards programme.',
    image: {
      src: ceremonyAudience,
      alt: 'Global Business Excellence Awards recipient seated among ceremony guests'
    },
    layout: 'standard'
  },
  {
    id: 'group-recognition',
    index: '12',
    title: 'A collective achievement',
    summary: 'Recipients and programme representatives sharing a formal recognition moment.',
    image: {
      src: groupRecognition,
      alt: 'Global Business Excellence Awards recipients and representatives holding an award and certificate'
    },
    layout: 'wide'
  }
] satisfies EventGalleryItem[];

export const featuredEventGalleryItems = [
  {
    id: 'recipient-table',
    index: '01',
    title: 'Recognition received',
    summary: 'A recipient with the trophy and certificate presented during the programme.',
    image: {
      src: recipientTable,
      alt: 'Global Business Excellence Awards recipient seated with a trophy and certificate'
    },
    layout: 'wide'
  },
  {
    id: 'ceremony-hosts',
    index: '02',
    title: 'The programme in motion',
    summary: 'Ceremony hosts guiding guests through the awards programme.',
    image: {
      src: ceremonyHosts,
      alt: 'Global Business Excellence Awards ceremony hosts speaking from a lectern'
    },
    layout: 'standard'
  },
  {
    id: 'recipient-community',
    index: '03',
    title: 'A shared occasion',
    summary: 'Recipients gathered with the recognition presented during the ceremony.',
    image: {
      src: recipientCommunity,
      alt: 'Global Business Excellence Awards recipients seated together with trophies'
    },
    layout: 'standard'
  },
  {
    id: 'recipient-recognition',
    index: '04',
    title: 'Achievement on stage',
    summary: 'A formal award presentation shared with the wider programme community.',
    image: {
      src: recipientRecognition,
      alt: 'Global Business Excellence Awards recipient and representatives during a stage presentation'
    },
    layout: 'wide'
  }
] satisfies EventGalleryItem[];

export const galleryPageContent = {
  slug: 'gallery',
  seo: {
    title: 'Awards Ceremony Gallery | Best Website Awards 2026',
    description:
      'View authentic Global Business Excellence Awards ceremony moments that bring achievement, presentation and the wider recognition experience into focus.',
    pageType: 'CollectionPage'
  },
  hero: {
    title: 'Recognition, seen clearly.',
    summary:
      'A considered record of ceremony, achievement and the people who give recognition its meaning.',
    primaryAction: { label: 'Explore the awards', href: '/awards' },
    secondaryAction: { label: 'Apply now', href: '/contact' },
    image: {
      src: ceremonyOpening,
      alt: 'Ceremonial lamp lighting at a Global Business Excellence Awards programme',
      position: 'center 50%'
    },
    frameLabel: 'Awards gallery',
    visualIndex: 'BWA / 06'
  },
  introduction: {
    title: 'A record with a human centre.',
    body: [
      'Recognition becomes real through the people, work and shared moments that surround it.',
      'These photographs document previous Global Business Excellence Awards ceremonies and the wider platform behind Best Website Awards.'
    ]
  },
  gallery: {
    title: 'Moments of recognition',
    summary:
      'Selected ceremony moments from the wider Global Business Excellence Awards programme.',
    attribution: 'Global Business Excellence Awards ceremony archive',
    items: eventGalleryItems
  },
  closing: {
    title: 'Place your work in the next chapter.',
    summary: `${programmeDetails.status} for the 2026 programme. Present the website, its purpose and the evidence behind it.`,
    primaryAction: { label: 'Apply now', href: '/contact' },
    secondaryAction: { label: 'See the process', href: '/process' }
  }
} satisfies GalleryPageContent;

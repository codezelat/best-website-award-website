import type { ImageMetadata } from 'astro';

export type ManagedImageSource = ImageMetadata | string;

export interface ManagedImage {
  src: ManagedImageSource;
  alt: string;
  width?: number;
  height?: number;
  position?: string;
}

export interface NavigationItem {
  label: string;
  href: string;
  showInHeader?: boolean;
}

export type SocialNetwork = 'facebook' | 'instagram' | 'x' | 'linkedin' | 'whatsapp';

export interface SocialLink {
  label: string;
  href: string;
  network: SocialNetwork;
}

export interface ContactDetails {
  email: string;
  location: string;
  parentOrganisation: string;
  parentWebsite: string;
}

export interface PageSeo {
  title: string;
  description: string;
  pageType?: 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage' | 'FAQPage';
  noIndex?: boolean;
}

export interface StructuredOrganization {
  id: string;
  name: string;
  description: string;
  url?: string;
  image?: {
    url: URL;
    caption: string;
    width?: number;
    height?: number;
  };
}

export interface EditorialItem {
  id: string;
  index: string;
  title: string;
  summary: string;
  image?: ManagedImage;
}

export interface EditorialCollection {
  title: string;
  summary?: string;
  variant: 'columns' | 'rows' | 'media';
  items: EditorialItem[];
}

export interface EditorialFeature {
  title: string;
  body: string[];
  image?: ManagedImage;
  imagePosition?: 'left' | 'right';
  tone: 'white' | 'soft';
}

export interface EditorialPageContent {
  slug: string;
  seo: PageSeo;
  hero: {
    title: string;
    summary: string;
    primaryAction: NavigationItem;
    secondaryAction?: NavigationItem;
    image: ManagedImage;
    frameLabel: string;
    visualIndex: string;
  };
  introduction: {
    title: string;
    body: string[];
  };
  primaryCollection: EditorialCollection;
  secondaryCollection?: EditorialCollection;
  feature?: EditorialFeature;
  statement: {
    title: string;
    summary: string;
  };
  closing: {
    title: string;
    summary: string;
    primaryAction: NavigationItem;
    secondaryAction?: NavigationItem;
  };
}

export interface UtilitySection {
  title: string;
  body: string[];
}

export interface UtilityPageContent {
  slug: string;
  seo: PageSeo;
  title: string;
  introduction: string;
  sections: UtilitySection[];
  action?: NavigationItem;
}

export interface WorkStudy {
  id: string;
  index: string;
  title: string;
  summary: string;
  image: ManagedImage;
  layout: 'wide' | 'standard';
}

export interface EvaluationArea {
  id: string;
  index: string;
  title: string;
  summary: string;
}

export interface RecognitionStep {
  id: string;
  index: string;
  title: string;
  summary: string;
}

export interface EventGalleryItem {
  id: string;
  index: string;
  title: string;
  summary: string;
  image: ManagedImage;
  layout: 'wide' | 'standard';
}

export interface EventGalleryContent {
  title: string;
  summary: string;
  attribution?: string;
  items: EventGalleryItem[];
  action?: NavigationItem;
}

export interface GalleryPageContent {
  slug: string;
  seo: PageSeo;
  hero: {
    title: string;
    summary: string;
    primaryAction: NavigationItem;
    secondaryAction: NavigationItem;
    image: ManagedImage;
    frameLabel: string;
    visualIndex: string;
  };
  introduction: {
    title: string;
    body: string[];
  };
  gallery: EventGalleryContent;
  closing: {
    title: string;
    summary: string;
    primaryAction: NavigationItem;
    secondaryAction: NavigationItem;
  };
}

export interface RecognitionOrganisation {
  id: string;
  index: string;
  eyebrow: string;
  name: string;
  role: string;
  summary: string;
  detail: string;
  highlight?: string;
  logo: ManagedImage;
  logoPresentation: 'portrait' | 'wide-light' | 'wide-dark';
}

export interface RecognitionRecordStep {
  id: string;
  index: string;
  title: string;
  summary: string;
}

export interface RecognitionPageContent {
  slug: string;
  seo: PageSeo;
  hero: EditorialPageContent['hero'];
  introduction: EditorialPageContent['introduction'];
  framework: {
    title: string;
    summary: string;
    items: RecognitionOrganisation[];
  };
  gallery: EventGalleryContent;
  record: {
    eyebrow: string;
    title: string;
    summary: string;
    statement: string;
    steps: RecognitionRecordStep[];
  };
  closing: EditorialPageContent['closing'];
}

export interface HomepageContent {
  seo: {
    title: string;
    description: string;
  };
  navigation: NavigationItem[];
  hero: {
    title: string;
    summary: string;
    primaryAction: NavigationItem;
    secondaryAction: NavigationItem;
    images: readonly [ManagedImage, ...ManagedImage[]];
  };
  introduction: {
    index: string;
    title: string;
    statements: string[];
  };
  work: {
    title: string;
    summary: string;
    items: WorkStudy[];
  };
  evaluation: {
    title: string;
    summary: string;
    items: EvaluationArea[];
  };
  process: {
    title: string;
    summary: string;
    items: RecognitionStep[];
  };
  gallery: EventGalleryContent;
  parentBrand: {
    title: string;
    summary: string;
    attribution: string;
  };
  closing: {
    title: string;
    summary: string;
    primaryAction: NavigationItem;
    secondaryAction: NavigationItem;
  };
}

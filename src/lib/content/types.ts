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
}

export interface PageSeo {
  title: string;
  description: string;
  pageType?: 'WebPage' | 'AboutPage' | 'ContactPage';
  noIndex?: boolean;
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
    image: ManagedImage;
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

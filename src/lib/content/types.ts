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
  href: `#${string}`;
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

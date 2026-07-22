import { galleryPageContent } from '../../data/gallery';
import type { GalleryPageContent } from './types';

/**
 * Gallery content stays behind the public content-source boundary so a future
 * Neon and R2 implementation can replace the static source without changing the page.
 */
export interface GalleryContentSource {
  getGallery(): Promise<GalleryPageContent>;
}

class StaticGalleryContentSource implements GalleryContentSource {
  async getGallery(): Promise<GalleryPageContent> {
    return galleryPageContent;
  }
}

const galleryContentSource: GalleryContentSource = new StaticGalleryContentSource();

export function getGalleryContent(): Promise<GalleryPageContent> {
  return galleryContentSource.getGallery();
}

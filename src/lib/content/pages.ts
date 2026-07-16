import { editorialPages, utilityPages } from '../../data/pages';
import type { EditorialPageContent, UtilityPageContent } from './types';

export interface PublicPageContentSource {
  getEditorialPage(slug: string): Promise<EditorialPageContent | undefined>;
  getUtilityPage(slug: string): Promise<UtilityPageContent | undefined>;
}

class StaticPublicPageContentSource implements PublicPageContentSource {
  async getEditorialPage(slug: string): Promise<EditorialPageContent | undefined> {
    return editorialPages[slug as keyof typeof editorialPages];
  }

  async getUtilityPage(slug: string): Promise<UtilityPageContent | undefined> {
    return utilityPages[slug as keyof typeof utilityPages];
  }
}

const pageContentSource: PublicPageContentSource = new StaticPublicPageContentSource();

export function getEditorialPage(slug: string): Promise<EditorialPageContent | undefined> {
  return pageContentSource.getEditorialPage(slug);
}

export function getUtilityPage(slug: string): Promise<UtilityPageContent | undefined> {
  return pageContentSource.getUtilityPage(slug);
}

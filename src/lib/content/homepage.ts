import { homepageContent } from '../../data/homepage';
import type { HomepageContent } from './types';

/**
 * The page renders against this contract, not a concrete storage provider.
 * A Neon-backed source can replace this implementation without changing UI components.
 */
export interface HomepageContentSource {
  getHomepage(): Promise<HomepageContent>;
}

class StaticHomepageContentSource implements HomepageContentSource {
  async getHomepage(): Promise<HomepageContent> {
    return homepageContent;
  }
}

const contentSource: HomepageContentSource = new StaticHomepageContentSource();

export function getHomepageContent(): Promise<HomepageContent> {
  return contentSource.getHomepage();
}

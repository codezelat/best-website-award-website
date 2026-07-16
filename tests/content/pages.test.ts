import { describe, expect, it } from 'vitest';
import { editorialPages, utilityPages } from '../../src/data/pages';
import { getEditorialPage, getUtilityPage } from '../../src/lib/content/pages';
import type {
  EditorialCollection,
  EditorialPageContent,
  ManagedImage
} from '../../src/lib/content/types';

describe('public page content contract', () => {
  it('publishes the complete editorial route set through the content source', async () => {
    const slugs = ['awards', 'work', 'standard', 'process', 'about'] as const;

    await Promise.all(
      slugs.map(async (slug) => {
        const page = await getEditorialPage(slug);
        expect(page?.slug).toBe(slug);
        expect(page?.hero.title.trim().length).toBeGreaterThan(0);
        expect(page?.primaryCollection.items.length).toBeGreaterThan(0);
      })
    );
  });

  it('publishes every supporting page through the content source', async () => {
    const slugs = ['contact', 'privacy', 'terms', 'cookies', 'notFound'] as const;

    await Promise.all(
      slugs.map(async (slug) => {
        const page = await getUtilityPage(slug);
        expect(page?.title.trim().length).toBeGreaterThan(0);
        expect(page?.seo.description.trim().length).toBeGreaterThan(0);
      })
    );
  });

  it('keeps managed editorial images accessible and item identifiers unique per page', () => {
    (Object.values(editorialPages) as EditorialPageContent[]).forEach((page) => {
      const collections = [page.primaryCollection, page.secondaryCollection].filter(
        (collection): collection is EditorialCollection => Boolean(collection)
      );
      const ids = collections.flatMap(
        (collection) => collection?.items.map((item) => item.id) ?? []
      );
      const images = [
        page.hero.image,
        page.feature?.image,
        ...collections.flatMap(
          (collection) => collection?.items.map((item) => item.image).filter(Boolean) ?? []
        )
      ].filter((image): image is ManagedImage => Boolean(image));

      expect(new Set(ids).size).toBe(ids.length);
      expect(images.every((image) => image?.alt.trim().length)).toBe(true);
    });
  });

  it('contains no draft markers or manufactured programme specifics', () => {
    const copy = JSON.stringify({ editorialPages, utilityPages }).toLowerCase();

    expect(copy).not.toMatch(/lorem ipsum|coming soon|sample winner|dummy|placeholder|vote now/);
    expect(copy).not.toMatch(/entry fee is|award ceremony on|our judges are|our sponsors are/);
  });
});

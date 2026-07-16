import { describe, expect, it } from 'vitest';
import { editorialPages, utilityPages } from '../../src/data/pages';
import { getEditorialPage, getUtilityPage } from '../../src/lib/content/pages';
import type {
  EditorialCollection,
  EditorialPageContent,
  ManagedImage,
  UtilityPageContent
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
    const slugs = ['contact', 'faq', 'privacy', 'terms', 'cookies', 'notFound'] as const;

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

  it('publishes a complete, non-repetitive programme FAQ', () => {
    const questions = utilityPages.faq.sections.map((section) => section.title);

    expect(questions.length).toBeGreaterThanOrEqual(20);
    expect(new Set(questions).size).toBe(questions.length);
    expect(utilityPages.faq.seo.pageType).toBe('FAQPage');
    expect(JSON.stringify(utilityPages.faq).toLowerCase()).toContain('does not use public voting');
    expect(JSON.stringify(utilityPages.faq)).toContain('Best Website Awards Sri Lanka');
    expect(editorialPages.standard.seo.title).toContain('Best Web 2026');
  });

  it('keeps indexable page metadata unique and descriptive', () => {
    const pages = [
      ...(Object.values(editorialPages) as EditorialPageContent[]),
      ...(Object.values(utilityPages) as UtilityPageContent[])
    ].filter((page) => !page.seo.noIndex);
    const titles = pages.map((page) => page.seo.title);
    const descriptions = pages.map((page) => page.seo.description);

    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    expect(titles.every((title) => title.length >= 30 && title.length <= 65)).toBe(true);
    expect(
      descriptions.every((description) => description.length >= 100 && description.length <= 170)
    ).toBe(true);
  });

  it('maps priority search themes to relevant public pages', () => {
    expect(utilityPages.faq.seo.description).toContain('Best Website Awards Sri Lanka 2026');
    expect(editorialPages.standard.seo.title).toContain('Best Web 2026');
    expect(editorialPages.awards.seo.title).toContain('Best Website Awards 2026');
    expect(editorialPages.about.seo.description).toContain('Global Business Excellence Awards');
    expect(editorialPages.about.seo.description).toContain('GBE Awards 2026');
  });

  it('keeps legal utility pages out of the search index', () => {
    expect(utilityPages.privacy.seo.noIndex).toBe(true);
    expect(utilityPages.terms.seo.noIndex).toBe(true);
    expect(utilityPages.cookies.seo.noIndex).toBe(true);
  });

  it('publishes accurate analytics and consent disclosures', () => {
    const privacyCopy = JSON.stringify(utilityPages.privacy);
    const cookieCopy = JSON.stringify(utilityPages.cookies);

    expect(privacyCopy).toContain('Google Analytics 4');
    expect(cookieCopy).toContain('G-L2FR8JR6ZJ');
    expect(cookieCopy).toContain('90 days');
    expect(cookieCopy).toContain('Cookie settings');
  });

  it('contains no draft markers or manufactured programme specifics', () => {
    const copy = JSON.stringify({ editorialPages, utilityPages }).toLowerCase();

    expect(copy).not.toMatch(/lorem ipsum|coming soon|sample winner|dummy|placeholder|vote now/);
    expect(copy).not.toMatch(/entry fee is|award ceremony on|our judges are|our sponsors are/);
  });
});

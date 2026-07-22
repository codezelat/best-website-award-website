import { describe, expect, it } from 'vitest';
import {
  eventGalleryItems,
  featuredEventGalleryItems,
  galleryPageContent
} from '../../src/data/gallery';
import { homepageContent } from '../../src/data/homepage';
import { editorialPages, utilityPages } from '../../src/data/pages';
import { publicRoutes } from '../../src/data/site';
import { programmeDetails } from '../../src/data/site';
import { getEditorialPage, getUtilityPage } from '../../src/lib/content/pages';
import { getGalleryContent } from '../../src/lib/content/gallery';
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

  it('publishes the authentic gallery through its content source', async () => {
    const gallery = await getGalleryContent();

    expect(gallery.slug).toBe('gallery');
    expect(gallery.gallery.items).toHaveLength(12);
    expect(new Set(eventGalleryItems.map((item) => item.id)).size).toBe(eventGalleryItems.length);
    expect(eventGalleryItems.every((item) => item.image.alt.trim().length > 0)).toBe(true);
  });

  it('gives every ceremony photograph one deliberate public placement', () => {
    const editorialCeremonyImages = [
      editorialPages.awards.feature?.image,
      editorialPages.process.feature?.image,
      editorialPages.about.feature?.image
    ].filter((image) => image !== undefined);
    const ceremonyImages = [
      ...homepageContent.hero.images,
      galleryPageContent.hero.image,
      ...editorialCeremonyImages,
      ...featuredEventGalleryItems.map((item) => item.image),
      ...eventGalleryItems.map((item) => item.image)
    ];
    const imageSources = ceremonyImages.map((image) => image.src);

    expect(new Set(imageSources).size).toBe(imageSources.length);
  });

  it('keeps pre-footer programme calls to action date-free', () => {
    const closingSummaries = [
      homepageContent.closing.summary,
      galleryPageContent.closing.summary,
      ...(Object.values(editorialPages) as EditorialPageContent[]).map(
        (page) => page.closing.summary
      )
    ];

    expect(closingSummaries.every((summary) => !summary.includes(programmeDetails.date))).toBe(
      true
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
    expect(JSON.stringify(utilityPages.faq)).toContain(programmeDetails.date);
    expect(utilityPages.faq.action).toEqual({
      label: 'Confirm fee on WhatsApp',
      href: programmeDetails.whatsappHref
    });
  });

  it('publishes the confirmed 2026 programme state consistently', () => {
    const copy = JSON.stringify({ homepageDate: programmeDetails, editorialPages, utilityPages });

    expect(programmeDetails.status).toBe('Entries now open');
    expect(programmeDetails.date).toBe('28 August 2026');
    expect(programmeDetails.whatsappHref).toBe('https://wa.link/4f21fy');
    expect(copy).toContain('live, functional website');
    expect(copy).not.toMatch(
      /will be published|only confirmed when|when the relevant programme is open/i
    );
  });

  it('keeps indexable page metadata unique and descriptive', () => {
    const pages = [
      ...(Object.values(editorialPages) as EditorialPageContent[]),
      ...(Object.values(utilityPages) as UtilityPageContent[]),
      galleryPageContent
    ].filter((page) => !('noIndex' in page.seo && page.seo.noIndex));
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

  it('keeps substantive legal utility pages discoverable', () => {
    expect('noIndex' in utilityPages.privacy.seo).toBe(false);
    expect('noIndex' in utilityPages.terms.seo).toBe(false);
    expect('noIndex' in utilityPages.cookies.seo).toBe(false);
  });

  it('publishes every indexable page through the direct public sitemap contract', () => {
    expect(publicRoutes).toHaveLength(12);
    expect(publicRoutes).toEqual(
      expect.arrayContaining(['/privacy-policy', '/terms', '/cookies', '/contact', '/gallery'])
    );
  });

  it('publishes accurate analytics and consent disclosures', () => {
    const privacyCopy = JSON.stringify(utilityPages.privacy);
    const cookieCopy = JSON.stringify(utilityPages.cookies);

    expect(privacyCopy).toContain('Google Analytics 4');
    expect(cookieCopy).toContain('G-L2FR8JR6ZJ');
    expect(cookieCopy).toContain('90 days');
    expect(cookieCopy).toContain('Cookie settings');
    expect(privacyCopy).toContain('Cloudflare Turnstile');
    expect(privacyCopy).toContain('Resend');
  });

  it('contains no draft markers or manufactured programme specifics', () => {
    const sourceCopy = JSON.stringify({ editorialPages, utilityPages, galleryPageContent });
    const copy = sourceCopy.toLowerCase();

    expect(copy).not.toMatch(/lorem ipsum|coming soon|sample winner|dummy|placeholder|vote now/);
    expect(copy).not.toMatch(/entry fee is|award ceremony on|our judges are|our sponsors are/);
    expect(sourceCopy).not.toMatch(/[\u2013\u2014]/);
  });
});

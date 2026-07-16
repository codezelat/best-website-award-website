import { describe, expect, it } from 'vitest';
import { homepageContent } from '../../src/data/homepage';
import { programmeDetails } from '../../src/data/site';

describe('homepage content contract', () => {
  it('keeps managed collection identifiers unique', () => {
    const ids = [
      ...homepageContent.work.items.map((item) => item.id),
      ...homepageContent.evaluation.items.map((item) => item.id),
      ...homepageContent.process.items.map((item) => item.id)
    ];

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps every generated image accessible', () => {
    const images = [
      homepageContent.hero.image,
      ...homepageContent.work.items.map((item) => item.image)
    ];

    expect(images.every((image) => image.alt.trim().length > 0)).toBe(true);
  });

  it('does not introduce voting or placeholder programme claims', () => {
    const sourceCopy = JSON.stringify(homepageContent);
    const copy = sourceCopy.toLowerCase();

    expect(copy).not.toMatch(/public voting|vote now|lorem ipsum|coming soon|sample winner/);
    expect(sourceCopy).not.toMatch(/[\u2013\u2014]/);
  });

  it('publishes concise, descriptive homepage search metadata', () => {
    expect(homepageContent.seo.title.length).toBeGreaterThanOrEqual(30);
    expect(homepageContent.seo.title.length).toBeLessThanOrEqual(65);
    expect(homepageContent.seo.description.length).toBeGreaterThanOrEqual(100);
    expect(homepageContent.seo.description.length).toBeLessThanOrEqual(170);
    expect(homepageContent.hero.title).toContain('Best Website Awards 2026');
    expect(homepageContent.introduction.statements.join(' ')).toContain('Sri Lanka');
    expect(JSON.stringify(homepageContent)).toContain(programmeDetails.date);
    expect(homepageContent.hero.primaryAction).toEqual({ label: 'Apply now', href: '/contact' });
  });
});

import { describe, expect, it } from 'vitest';
import { GET } from '../../src/pages/sitemap.xml';

describe('direct public sitemap', () => {
  it('serves all indexable routes with an immediately revalidated cache policy', async () => {
    const response = await GET({ site: new URL('https://bestwebsiteaward.com') } as never);
    const xml = await response.text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

    expect(response.headers.get('content-type')).toContain('application/xml');
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=0, must-revalidate, no-transform'
    );
    expect(urls).toHaveLength(11);
    expect(urls).toEqual(
      expect.arrayContaining([
        'https://bestwebsiteaward.com/privacy-policy',
        'https://bestwebsiteaward.com/terms',
        'https://bestwebsiteaward.com/cookies'
      ])
    );
  });
});

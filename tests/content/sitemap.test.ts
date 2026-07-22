import { describe, expect, it } from 'vitest';
import { GET } from '../../src/pages/sitemap.xml';

describe('direct public sitemap', () => {
  it('serves all indexable routes with layered browser and CDN caching', async () => {
    const response = await GET({ site: new URL('https://bestwebsiteaward.com') } as never);
    const xml = await response.text();
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

    expect(response.headers.get('content-type')).toContain('application/xml');
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=300, must-revalidate, no-transform'
    );
    expect(response.headers.get('cdn-cache-control')).toBe(
      'public, s-maxage=3600, stale-while-revalidate=86400'
    );
    expect(response.headers.get('vercel-cdn-cache-control')).toBe(
      'public, s-maxage=86400, stale-while-revalidate=604800'
    );
    expect(urls).toHaveLength(12);
    expect(urls).toEqual(
      expect.arrayContaining([
        'https://bestwebsiteaward.com/gallery',
        'https://bestwebsiteaward.com/privacy-policy',
        'https://bestwebsiteaward.com/terms',
        'https://bestwebsiteaward.com/cookies'
      ])
    );
  });
});

import type { APIRoute } from 'astro';
import { publicRoutes } from '../data/site';
import { getGalleryContent } from '../lib/content/gallery';
import { getHomepageContent } from '../lib/content/homepage';
import { getEditorialPage } from '../lib/content/pages';
import type { ManagedImage } from '../lib/content/types';
import { resolveManagedImages } from '../lib/seo/images';

export const prerender = true;

const escapeXml = (value: string) =>
  value.replace(/[<>&'"]/g, (character) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      "'": '&apos;',
      '"': '&quot;'
    };
    return entities[character] ?? character;
  });

const editorialRoutes = ['/about', '/awards', '/process', '/standard', '/work'] as const;

const editorialImages = async (route: (typeof editorialRoutes)[number]) => {
  const content = await getEditorialPage(route.slice(1));
  if (!content) return [];

  return [
    content.hero.image,
    ...content.primaryCollection.items.flatMap((item) => (item.image ? [item.image] : [])),
    ...(content.secondaryCollection?.items.flatMap((item) => (item.image ? [item.image] : [])) ??
      []),
    ...(content.feature?.image ? [content.feature.image] : [])
  ];
};

export const GET: APIRoute = async ({ site }) => {
  const origin = site ?? new URL('https://bestwebsiteaward.com');
  const [homepage, gallery, ...editorialImageGroups] = await Promise.all([
    getHomepageContent(),
    getGalleryContent(),
    ...editorialRoutes.map((route) => editorialImages(route))
  ]);
  const imagesByRoute = new Map<string, readonly ManagedImage[]>([
    [
      '/',
      [
        ...homepage.hero.images,
        ...homepage.work.items.map((item) => item.image),
        ...homepage.gallery.items.map((item) => item.image)
      ]
    ],
    ['/gallery', [gallery.hero.image, ...gallery.gallery.items.map((item) => item.image)]],
    ...editorialRoutes.map(
      (route, index) => [route, editorialImageGroups[index]] as [string, readonly ManagedImage[]]
    )
  ]);
  const urls = publicRoutes
    .map((route) => {
      const images = resolveManagedImages(imagesByRoute.get(route) ?? [], origin)
        .map(
          (image) =>
            `<image:image><image:loc>${escapeXml(image.url.href)}</image:loc></image:image>`
        )
        .join('');

      return `<url><loc>${escapeXml(new URL(route, origin).href)}</loc>${images}</url>`;
    })
    .join('');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${urls}</urlset>`,
    {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300, must-revalidate, no-transform',
        'CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800'
      }
    }
  );
};

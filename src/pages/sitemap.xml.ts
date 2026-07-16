import type { APIRoute } from 'astro';
import { publicRoutes } from '../data/site';

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

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('https://bestwebsiteaward.com');
  const urls = publicRoutes
    .map((route) => `<url><loc>${escapeXml(new URL(route, origin).href)}</loc></url>`)
    .join('');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=0, must-revalidate, no-transform'
      }
    }
  );
};

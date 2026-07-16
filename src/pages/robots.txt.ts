import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('https://bestwebsiteaward.com');

  return new Response(
    `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /_image\nDisallow: /_server-islands/\n\nSitemap: ${new URL('/sitemap.xml', origin)}\n`,
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=300, must-revalidate, no-transform',
        'CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800'
      }
    }
  );
};

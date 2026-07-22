import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const origin = 'https://bestwebsiteaward.com';
const root = resolve(import.meta.dirname, '..');
const buildRoot = resolve(root, 'dist/client');
const indexableRoutes = [
  '/',
  '/about',
  '/awards',
  '/contact',
  '/cookies',
  '/faq',
  '/gallery',
  '/privacy-policy',
  '/process',
  '/standard',
  '/terms',
  '/work'
];

const fail = (message) => {
  throw new Error(`[SEO verification] ${message}`);
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const routeFile = (route) =>
  route === '/' ? resolve(buildRoot, 'index.html') : resolve(buildRoot, `.${route}/index.html`);

const readRoute = async (route) => readFile(routeFile(route), 'utf8');

const getMetaContent = (html, selector) => {
  const match = html.match(new RegExp(`<meta ${escapeRegExp(selector)} content="([^"]*)"`));
  return match?.[1];
};

const getStructuredData = (html) => {
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];

  if (scripts.length !== 1) fail(`expected one JSON-LD graph, found ${scripts.length}`);
  return JSON.parse(scripts[0][1]);
};

const pageDocuments = [];

for (const route of indexableRoutes) {
  const html = await readRoute(route);
  const canonical = route === '/' ? `${origin}/` : `${origin}${route}`;
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = getMetaContent(html, 'name="description"');
  const robots = getMetaContent(html, 'name="robots"');
  const openGraphImage = getMetaContent(html, 'property="og:image"');
  const openGraphAlt = getMetaContent(html, 'property="og:image:alt"');
  const h1Count = [...html.matchAll(/<h1\b/g)].length;
  const images = [...html.matchAll(/<img\b[^>]*>/g)].map((match) => match[0]);
  const internalLinks = [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((href) => href.startsWith('/'))
    .map((href) => href.split('#')[0] || '/');

  pageDocuments.push({ route, title, description, internalLinks });

  if (!title || title.length < 30 || title.length > 70) {
    fail(`${route} has an invalid title length`);
  }
  if (!description || description.length < 100 || description.length > 170) {
    fail(`${route} has an invalid description length`);
  }
  if (robots !== 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1') {
    fail(`${route} has an unexpected robots directive`);
  }
  if (!html.includes(`<link rel="canonical" href="${canonical}">`)) {
    fail(`${route} is missing its canonical URL`);
  }
  if (!openGraphImage?.startsWith(`${origin}/`) || !openGraphAlt) {
    fail(`${route} is missing complete social image metadata`);
  }
  if (!html.includes('<html lang="en-GB">')) {
    fail(`${route} does not declare the site language as en-GB`);
  }
  if (h1Count !== 1) fail(`${route} has ${h1Count} h1 elements instead of exactly one`);
  if (images.some((image) => !/\salt="[^"]*"/.test(image))) {
    fail(`${route} contains an image without alt text`);
  }
  if (images.some((image) => !/\swidth="\d+"/.test(image) || !/\sheight="\d+"/.test(image))) {
    fail(`${route} contains an image without explicit dimensions`);
  }
  if (internalLinks.some((href) => !indexableRoutes.includes(href))) {
    fail(`${route} contains an internal link to an unpublished route`);
  }
  if (html.includes('@fs') || html.includes('/Users/')) {
    fail(`${route} exposes a local filesystem path`);
  }
  if (/[\u2013\u2014]|&(?:en|em)dash;|&#0*821[12];|&#x0*201[34];/i.test(html)) {
    fail(`${route} contains an en dash or em dash`);
  }

  const structuredData = getStructuredData(html);
  const graph = structuredData['@graph'];
  if (!Array.isArray(graph)) fail(`${route} has no structured-data graph`);
  if (!graph.some((item) => item['@type'] === 'WebSite')) {
    fail(`${route} has no WebSite node`);
  }
  if (!graph.some((item) => item['@type'] === 'Organization')) {
    fail(`${route} has no Organization node`);
  }
  if (route !== '/' && !graph.some((item) => item['@type'] === 'BreadcrumbList')) {
    fail(`${route} has no breadcrumb structured data`);
  }

  if (route === '/faq') {
    const faqPage = graph.find((item) => item['@type'] === 'FAQPage');
    if (!faqPage || faqPage.mainEntity?.length !== 24) {
      fail('/faq structured data does not match the 24 visible questions');
    }
  }

  if (route === '/gallery') {
    const galleryPage = graph.find((item) => item['@type'] === 'CollectionPage');
    const galleryImages = graph.filter((item) => item['@type'] === 'ImageObject');
    if (!galleryPage || galleryPage.hasPart?.length !== 10 || galleryImages.length !== 10) {
      fail('/gallery structured data does not match the 10 visible ceremony images');
    }
  }
}

const titles = pageDocuments.map((page) => page.title);
const descriptions = pageDocuments.map((page) => page.description);
if (new Set(titles).size !== titles.length) fail('indexable pages contain duplicate titles');
if (new Set(descriptions).size !== descriptions.length) {
  fail('indexable pages contain duplicate descriptions');
}

for (const route of indexableRoutes) {
  const incomingLinks = pageDocuments.filter(
    (page) => page.route !== route && page.internalLinks.includes(route)
  );
  if (incomingLinks.length === 0) fail(`${route} has no incoming internal link from another page`);
}

const sitemap = await readFile(resolve(buildRoot, 'sitemap-0.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const expectedUrls = indexableRoutes.map((route) => (route === '/' ? origin : `${origin}${route}`));

if (sitemapUrls.length !== expectedUrls.length) {
  fail(`sitemap contains ${sitemapUrls.length} URLs instead of ${expectedUrls.length}`);
}

for (const url of expectedUrls) {
  if (!sitemapUrls.includes(url)) fail(`sitemap is missing ${url}`);
}

const robots = await readFile(resolve(buildRoot, 'robots.txt'), 'utf8');
if (!robots.includes(`Sitemap: ${origin}/sitemap.xml`)) {
  fail('robots.txt does not advertise the public sitemap');
}
for (const privatePath of ['Disallow: /api/', 'Disallow: /_image', 'Disallow: /_server-islands/']) {
  if (!robots.includes(privatePath)) fail(`robots.txt is missing ${privatePath}`);
}

const homepage = await readRoute('/');
if (homepage.includes('src="https://www.googletagmanager.com')) {
  fail('Google Analytics loads before visitor consent');
}
for (const consentSignal of [
  "analytics_storage: 'denied'",
  "ad_storage: 'denied'",
  "ad_user_data: 'denied'",
  "ad_personalization: 'denied'"
]) {
  if (!homepage.includes(consentSignal)) {
    fail(`homepage is missing the default consent signal ${consentSignal}`);
  }
}

const assetDirectory = resolve(buildRoot, '_astro');
const scriptFiles = (await readdir(assetDirectory)).filter((file) => file.endsWith('.js'));
const bundledScripts = [
  homepage,
  ...(await Promise.all(scriptFiles.map((file) => readFile(resolve(assetDirectory, file), 'utf8'))))
].join('\n');

for (const analyticsContract of [
  'G-L2FR8JR6ZJ',
  'www.googletagmanager.com/gtag/js',
  'allow_google_signals',
  'allow_ad_personalization_signals',
  'cookie_expires'
]) {
  if (!bundledScripts.includes(analyticsContract)) {
    fail(`production scripts are missing analytics contract ${analyticsContract}`);
  }
}

const vercel = JSON.parse(await readFile(resolve(root, 'vercel.json'), 'utf8'));
const rootHeaders = vercel.headers?.find((rule) => rule.source === '/(.*)')?.headers ?? [];
const rootHeader = (key) => rootHeaders.find((header) => header.key === key)?.value;
const contentSecurityPolicy = vercel.headers
  ?.flatMap((rule) => rule.headers ?? [])
  .find((header) => header.key === 'Content-Security-Policy')?.value;
const documentCacheControl = vercel.headers
  ?.find((rule) => rule.source === '/(.*)')
  ?.headers?.find((header) => header.key === 'Cache-Control')?.value;

for (const analyticsOrigin of [
  'https://www.googletagmanager.com',
  'https://www.google-analytics.com'
]) {
  if (!contentSecurityPolicy?.includes(analyticsOrigin)) {
    fail(`Content Security Policy does not permit ${analyticsOrigin}`);
  }
}

for (const turnstileDirective of ['script-src', 'frame-src https://challenges.cloudflare.com']) {
  if (!contentSecurityPolicy?.includes(turnstileDirective)) {
    fail(`Content Security Policy is missing Turnstile directive ${turnstileDirective}`);
  }
}

if (!documentCacheControl?.includes('no-transform')) {
  fail('document cache policy must prevent CDN script injection with no-transform');
}
if (rootHeader('Cache-Control') !== 'public, max-age=300, must-revalidate, no-transform') {
  fail('public pages are missing the short browser cache policy');
}
if (rootHeader('CDN-Cache-Control') !== 'public, s-maxage=3600, stale-while-revalidate=86400') {
  fail('public pages are missing the shared CDN cache policy');
}
if (
  rootHeader('Vercel-CDN-Cache-Control') !== 'public, s-maxage=86400, stale-while-revalidate=604800'
) {
  fail('public pages are missing the Vercel CDN cache policy');
}

const apiHeaders = vercel.headers?.find((rule) => rule.source === '/api/(.*)')?.headers ?? [];
for (const key of ['Cache-Control', 'CDN-Cache-Control', 'Vercel-CDN-Cache-Control']) {
  if (apiHeaders.find((header) => header.key === key)?.value !== 'no-store') {
    fail(`/api routes are missing ${key}: no-store`);
  }
}

console.log(
  `SEO, privacy and analytics verification passed for ${indexableRoutes.length} indexable routes and ${sitemapUrls.length} sitemap URLs.`
);

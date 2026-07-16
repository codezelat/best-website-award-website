import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const origin = 'https://bestwebsiteaward.com';
const root = resolve(import.meta.dirname, '..');
const indexableRoutes = [
  '/',
  '/about',
  '/awards',
  '/contact',
  '/faq',
  '/process',
  '/standard',
  '/work'
];
const noIndexRoutes = ['/privacy-policy', '/terms', '/cookies'];

const fail = (message) => {
  throw new Error(`[SEO verification] ${message}`);
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const routeFile = (route) =>
  route === '/' ? resolve(root, 'dist/index.html') : resolve(root, `dist${route}/index.html`);

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

for (const route of indexableRoutes) {
  const html = await readRoute(route);
  const canonical = route === '/' ? `${origin}/` : `${origin}${route}`;
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = getMetaContent(html, 'name="description"');
  const robots = getMetaContent(html, 'name="robots"');
  const openGraphImage = getMetaContent(html, 'property="og:image"');
  const openGraphAlt = getMetaContent(html, 'property="og:image:alt"');

  if (!title || title.length < 30 || title.length > 70) {
    fail(`${route} has an invalid title length`);
  }
  if (!description || description.length < 100 || description.length > 170) {
    fail(`${route} has an invalid description length`);
  }
  if (robots !== 'index, follow, max-image-preview:large') {
    fail(`${route} has an unexpected robots directive`);
  }
  if (!html.includes(`<link rel="canonical" href="${canonical}">`)) {
    fail(`${route} is missing its canonical URL`);
  }
  if (!openGraphImage?.startsWith(`${origin}/`) || !openGraphAlt) {
    fail(`${route} is missing complete social image metadata`);
  }
  if (html.includes('@fs') || html.includes('/Users/')) {
    fail(`${route} exposes a local filesystem path`);
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
}

for (const route of noIndexRoutes) {
  const html = await readRoute(route);
  if (getMetaContent(html, 'name="robots"') !== 'noindex, follow') {
    fail(`${route} must remain noindex`);
  }
}

const sitemap = await readFile(resolve(root, 'dist/sitemap-0.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const expectedUrls = indexableRoutes.map((route) => (route === '/' ? origin : `${origin}${route}`));

if (sitemapUrls.length !== expectedUrls.length) {
  fail(`sitemap contains ${sitemapUrls.length} URLs instead of ${expectedUrls.length}`);
}

for (const url of expectedUrls) {
  if (!sitemapUrls.includes(url)) fail(`sitemap is missing ${url}`);
}

for (const route of noIndexRoutes) {
  if (new RegExp(`${escapeRegExp(origin + route)}(?:<|/)`).test(sitemap)) {
    fail(`sitemap includes noindex route ${route}`);
  }
}

const robots = await readFile(resolve(root, 'dist/robots.txt'), 'utf8');
if (!robots.includes(`Sitemap: ${origin}/sitemap-index.xml`)) {
  fail('robots.txt does not advertise the sitemap index');
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

const assetDirectory = resolve(root, 'dist/_astro');
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
const contentSecurityPolicy = vercel.headers
  ?.flatMap((rule) => rule.headers ?? [])
  .find((header) => header.key === 'Content-Security-Policy')?.value;

for (const analyticsOrigin of [
  'https://www.googletagmanager.com',
  'https://www.google-analytics.com'
]) {
  if (!contentSecurityPolicy?.includes(analyticsOrigin)) {
    fail(`Content Security Policy does not permit ${analyticsOrigin}`);
  }
}

console.log(
  `SEO and analytics verification passed for ${indexableRoutes.length} indexable routes, ${noIndexRoutes.length} noindex routes and ${sitemapUrls.length} sitemap URLs.`
);

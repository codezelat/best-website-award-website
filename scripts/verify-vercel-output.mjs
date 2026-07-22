import { access, readFile, readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const outputRoot = resolve(root, '.vercel/output');
const staticRoot = resolve(outputRoot, 'static');
const functionsRoot = resolve(outputRoot, 'functions');
const publicRoutes = [
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
  throw new Error(`[Vercel output verification] ${message}`);
};

const exists = async (path) =>
  access(path)
    .then(() => true)
    .catch(() => false);

const directorySize = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const sizes = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name);
      return entry.isDirectory() ? directorySize(path) : (await stat(path)).size;
    })
  );
  return sizes.reduce((total, size) => total + size, 0);
};

for (const route of publicRoutes) {
  const path =
    route === '/' ? resolve(staticRoot, 'index.html') : resolve(staticRoot, `.${route}/index.html`);
  if (!(await exists(path))) fail(`${route} was not emitted as a static HTML file`);
}

for (const staticEndpoint of ['sitemap.xml', 'robots.txt', '404.html']) {
  if (!(await exists(resolve(staticRoot, staticEndpoint)))) {
    fail(`/${staticEndpoint} was not emitted as a static file`);
  }
}

const config = JSON.parse(await readFile(resolve(outputRoot, 'config.json'), 'utf8'));
const functionRoutes = config.routes.filter((route) => route.dest === '_render');
if (functionRoutes.length !== 1 || functionRoutes[0]?.src !== '^/api/contact$') {
  fail(`expected only /api/contact to map to _render, found ${JSON.stringify(functionRoutes)}`);
}

for (const forbiddenRoute of ['/_image', '/_server-islands', '/sitemap.xml']) {
  if (config.routes.some((route) => route.src?.includes(forbiddenRoute.slice(1)))) {
    fail(`${forbiddenRoute} still maps to a Vercel Function`);
  }
}

const renderFunction = resolve(functionsRoot, '_render.func');
if (!(await exists(renderFunction))) fail('the contact function was not emitted');
if (await exists(resolve(renderFunction, 'node_modules/sharp'))) {
  fail('Sharp was bundled into the contact function');
}
if (await exists(resolve(renderFunction, 'node_modules/@img'))) {
  fail('Sharp native image binaries were bundled into the contact function');
}

const functionSize = await directorySize(renderFunction);
if (functionSize > 5_000_000) {
  fail(`contact function is unexpectedly large at ${functionSize} bytes`);
}

const sourceFiles = await readdir(resolve(root, 'src'));
if (sourceFiles.some((file) => /^middleware\.(?:js|ts|mjs|mts)$/.test(file))) {
  fail('unexpected top-level middleware requires an auth and database import audit');
}

const packageJson = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const runtimePackages = Object.keys(packageJson.dependencies ?? {});
if (
  runtimePackages.some((name) => /auth|neon|drizzle|prisma|supabase|postgres|database/i.test(name))
) {
  fail('an auth or database dependency has entered the public site runtime');
}

console.log(
  `Vercel output verification passed: ${publicRoutes.length} static public pages, one ${(functionSize / 1_000_000).toFixed(2)} MB contact function, and no public runtime image or server-island routes.`
);

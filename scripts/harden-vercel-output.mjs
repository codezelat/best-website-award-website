import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const outputRoot = resolve(root, '.vercel/output');
const configPath = resolve(outputRoot, 'config.json');
const staticRoot = resolve(outputRoot, 'static');

const fail = (message) => {
  throw new Error(`[Vercel output hardening] ${message}`);
};

const listFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = resolve(directory, entry.name);
      return entry.isDirectory() ? listFiles(path) : [path];
    })
  );
  return files.flat();
};

const publicAssets = (await listFiles(staticRoot)).filter((file) =>
  /\.(?:html|css|js)$/i.test(file)
);
for (const file of publicAssets) {
  const content = await readFile(file, 'utf8');
  if (content.includes('/_image')) fail(`${file} still depends on the runtime image endpoint`);
  if (content.includes('/_server-islands/')) fail(`${file} still depends on a server island`);
}

const config = JSON.parse(await readFile(configPath, 'utf8'));
const removedRoutes = [];

config.routes = config.routes.filter((route) => {
  const isUnusedRuntimeRoute =
    route.src === '^/_image$' || route.src?.startsWith('^/_server-islands/');
  if (isUnusedRuntimeRoute) removedRoutes.push(route.src);
  return !isUnusedRuntimeRoute;
});

for (const expectedRoute of ['^/_image$', '^/_server-islands/']) {
  if (!removedRoutes.some((route) => route === expectedRoute || route.startsWith(expectedRoute))) {
    fail(`expected generated route ${expectedRoute} was not found`);
  }
}

await writeFile(configPath, `${JSON.stringify(config, null, '\t')}\n`);

const renderFunction = resolve(outputRoot, 'functions/_render.func');
const unusedImageDependencies = [
  resolve(renderFunction, 'node_modules/@emnapi'),
  resolve(renderFunction, 'node_modules/@img'),
  resolve(renderFunction, 'node_modules/sharp')
];
for (const dependency of unusedImageDependencies) {
  await rm(dependency, { recursive: true, force: true });
}

const serverChunks = resolve(renderFunction, 'dist/server/chunks');
for (const file of await readdir(serverChunks)) {
  if (file.startsWith('sharp_')) await rm(resolve(serverChunks, file), { force: true });
}

console.log(
  `Removed ${removedRoutes.length} unused runtime routes and their image dependencies from Vercel output.`
);

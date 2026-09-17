// Manual asset preparation, never run in a request or production build.
// Preserve the approved header artwork instead of redrawing the brand mark.
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { chromium } from '@playwright/test';

const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'public');
await mkdir(resolve(output, 'images/brand'), { recursive: true });
const crop = await sharp(resolve(root, 'src/assets/brand/header-logo.webp'))
  .extract({ left: 0, top: 0, width: 100, height: 133 })
  .png()
  .toBuffer();
const mark = await sharp(crop).trim().png().toBuffer();

const square = (size, inset = 0.08) => {
  const inner = Math.round(size * (1 - inset * 2));
  return sharp(mark)
    .resize(inner, inner, { fit: 'contain', background: '#ffffff' })
    .extend({
      top: Math.floor((size - inner) / 2),
      bottom: Math.ceil((size - inner) / 2),
      left: Math.floor((size - inner) / 2),
      right: Math.ceil((size - inner) / 2),
      background: '#ffffff'
    })
    .flatten({ background: '#ffffff' })
    .png({ palette: true, quality: 90 });
};

for (const [name, size] of [
  ['favicon-16x16.png', 16],
  ['favicon-32x32.png', 32],
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['favicon.png', 512]
]) {
  await square(size).toFile(resolve(output, name));
}
await square(512, 0.2).toFile(resolve(output, 'icon-maskable-512.png'));
await writeFile(resolve(output, 'images/brand/mark.png'), mark);
await copyFile(
  resolve(root, 'src/assets/brand/header-logo.webp'),
  resolve(root, 'docs/readme/logo.webp')
);

// An ICO directory containing independent 16, 32 and 48 pixel PNG frames.
const sizes = [16, 32, 48];
const frames = await Promise.all(sizes.map((size) => square(size).toBuffer()));
const directory = Buffer.alloc(6 + frames.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(frames.length, 4);
let offset = directory.length;
for (const [index, frame] of frames.entries()) {
  const position = 6 + index * 16;
  directory[position] = sizes[index];
  directory[position + 1] = sizes[index];
  directory.writeUInt16LE(1, position + 4);
  directory.writeUInt16LE(32, position + 6);
  directory.writeUInt32LE(frame.length, position + 8);
  directory.writeUInt32LE(offset, position + 12);
  offset += frame.length;
}
await writeFile(resolve(output, 'favicon.ico'), Buffer.concat([directory, ...frames]));

// Native typesetting keeps exact spelling and the existing brand artwork.
const font = await readFile(
  resolve(
    root,
    'node_modules/@fontsource-variable/funnel-display/files/funnel-display-latin-wght-normal.woff2'
  )
);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1
  });
  await page.setContent(`<!doctype html><html lang="en"><head><style>
    @font-face{font-family:Funnel;src:url(data:font/woff2;base64,${font.toString('base64')}) format('woff2');font-weight:300 800}
    *{box-sizing:border-box}body{margin:0;width:1200px;height:630px;background:#fff;color:#17191d;font-family:Funnel,sans-serif;border-bottom:10px solid #1746d1;display:flex;align-items:center;justify-content:center}
    main{width:900px}section{display:flex;align-items:center;gap:48px}img{width:168px;height:224px;object-fit:contain}
    h1{font-size:92px;line-height:.98;letter-spacing:-4px;font-weight:600;margin:0}p{font-size:23px;line-height:1.4;margin:30px 0 0;color:#555e6b;letter-spacing:-.25px}strong{font-weight:500;color:#8a712d}
    footer{margin-top:54px;border-top:1px solid #e5e8ee;padding-top:22px;color:#1746d1;font-size:21px;letter-spacing:.3px}
  </style></head><body><main><section><img alt="" src="data:image/png;base64,${mark.toString('base64')}"><div><h1>Best Website<br>Awards</h1><p>Powered by <strong>Global Business Excellence Awards</strong></p></div></section><footer>bestwebsiteaward.com</footer></main></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  const screenshot = await page.screenshot();
  await sharp(screenshot)
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(resolve(output, 'images/brand/social-preview-v2.jpg'));
} finally {
  await browser.close();
}
console.log('Prepared current-brand favicon, app icons and 1200 x 630 social preview.');

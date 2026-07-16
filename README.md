# Best Website Awards

The public homepage for Best Website Awards, powered by Global Business Excellence Awards. The current release is intentionally static, with production-oriented content and image boundaries ready for a future Neon and Cloudflare R2-backed admin application.

## Stack

- Astro 7 static output
- TypeScript strict mode
- Astro image pipeline with AVIF/WebP output
- Self-hosted Funnel Display and Funnel Sans variable fonts
- Motion for progressive, reduced-motion-safe interaction
- Vitest and Playwright for content and browser verification

## Local development

```sh
npm install
npm run dev
```

The site is served at `http://localhost:4321`.

## Verification

```sh
npm run format:check
npm run check
npm run test
npm run build
npm run test:e2e
```

## Content and media architecture

Page components consume the typed `HomepageContent` contract in `src/lib/content/types.ts`. The current `StaticHomepageContentSource` in `src/lib/content/homepage.ts` returns versioned content from `src/data/homepage.ts`.

When the admin application is connected, replace that source with a Neon-backed adapter. Images already accept either Astro image metadata or a remote URL, allowing an R2-backed media source without rewriting presentation components. Keep content retrieval server-side or build-time, validate remote asset hosts, and continue supplying explicit dimensions and alt text.

## Deployment

The build output is generated in `dist/`. `vercel.json` provides clean URLs, immutable asset caching, and baseline security headers. The production domain is `https://bestwebsiteaward.com`.

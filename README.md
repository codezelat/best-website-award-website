# Best Website Awards

The public website for Best Website Awards, powered by Global Business Excellence Awards. The current release is static and production-oriented, with typed content and managed-image boundaries ready for a future Neon and Cloudflare R2-backed admin application.

## Stack

- Astro 7 static output
- Tailwind CSS 4 utilities with the `tw:` prefix and no preflight reset
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

Page components consume typed contracts from `src/lib/content/types.ts`. The homepage source in `src/lib/content/homepage.ts` and public-page source in `src/lib/content/pages.ts` currently return versioned content from `src/data/`.

When the admin application is connected, replace those static sources with Neon-backed adapters. Images already accept either Astro image metadata or a remote URL through `ManagedPicture.astro`, allowing an R2-backed media source without rewriting presentation components. Keep content retrieval server-side or build-time, validate remote asset hosts, and continue supplying explicit dimensions and alt text.

## Public routes

- `/` — homepage
- `/awards` — award purpose and principles
- `/work` — types of work recognised
- `/standard` — four-measure evaluation framework
- `/process` — recognition journey
- `/about` — organisation and parent-brand context
- `/faq`, `/contact`, `/privacy-policy`, `/terms`, `/cookies` — supporting pages
- `404.astro` — branded, non-indexable not-found experience

The public site contains no public-voting flow. Programme facts such as dates, fees, winners, judges and sponsors must only be added from an approved source.

## Deployment

The build output is generated in `dist/`. `vercel.json` provides clean URLs, immutable asset caching, and baseline security headers. The production domain is `https://bestwebsiteaward.com`.

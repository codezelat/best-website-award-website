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
npm run verify:full
```

The release gate checks formatting, Astro and TypeScript diagnostics, content tests, the production
build, rendered SEO metadata and structured data, sitemap/noindex rules, the analytics contract,
and desktop/mobile browser behavior.

## Analytics and consent

Google Analytics 4 uses measurement ID `G-L2FR8JR6ZJ`. The tag is not requested until a visitor
selects **Allow analytics**. Consent Mode v2 defaults analytics and advertising storage to denied;
advertising signals and Google Signals remain disabled after analytics consent. Visitors can reopen
the consent control through **Cookie settings** in the footer.

The measurement contract is implemented in `src/components/AnalyticsConsent.astro`, default consent
is established in `src/layouts/BaseLayout.astro`, and the required production origins are restricted
through the Content Security Policy in `vercel.json`. Privacy and cookie disclosures are supplied
through the typed page-content source.

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

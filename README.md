# Best Website Awards

The public website for Best Website Awards, powered by Global Business Excellence Awards. Public pages are pre-rendered for speed and search visibility, while the contact endpoint runs on Vercel. Typed content and managed-image boundaries are ready for a future Neon and Cloudflare R2-backed admin application.

## Stack

- Astro 7 pre-rendered pages with one isolated Vercel server function for contact delivery
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
build, generated Vercel function routing and size, rendered SEO metadata and structured data,
sitemap/noindex rules, the analytics contract, and desktop/mobile browser behavior.

## Analytics and consent

Google Analytics 4 uses measurement ID `G-L2FR8JR6ZJ`. The tag is not requested until a visitor
selects **Yes, help improve**. Consent Mode v2 defaults analytics and advertising storage to denied;
advertising signals and Google Signals remain disabled after analytics consent. Visitors can reopen
the consent control through **Cookie settings** in the footer.

The measurement contract is implemented in `src/components/AnalyticsConsent.astro`, default consent
is established in `src/layouts/BaseLayout.astro`, and the required production origins are restricted
through the Content Security Policy in `vercel.json`. Privacy and cookie disclosures are supplied
through the typed page-content source. The document cache policy includes `no-transform` so proxy
services cannot inject a second analytics beacon or browser-side bot-detection script into the
production HTML.

## Contact delivery

`/api/contact` validates all fields, rejects cross-origin and automated submissions, verifies
Cloudflare Turnstile on the server, and delivers accepted enquiries through Resend. Configure these
variables locally in an ignored `.env` file and as encrypted Vercel environment variables:

- `PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL`
- `CONTACT_FROM_EMAIL`

Use `.env.example` as the non-secret template. The API response is never cached and is explicitly
excluded from indexing.

## Content and media architecture

Page components consume typed contracts from `src/lib/content/types.ts`. The homepage source in `src/lib/content/homepage.ts` and public-page source in `src/lib/content/pages.ts` currently return versioned content from `src/data/`.

When the admin application is connected, replace those static sources with Neon-backed adapters. Images already accept either Astro image metadata or a remote URL through `ManagedPicture.astro`, allowing an R2-backed media source without rewriting presentation components. Keep content retrieval server-side or build-time, validate remote asset hosts, and continue supplying explicit dimensions and alt text.

The current public content source is static, so all public pages and the direct sitemap are explicitly
pre-rendered. Future Neon-backed or CMS-backed pages must opt out of prerendering until an invalidation
strategy exists. They should return a short browser cache, a longer shared CDN cache, and
`stale-while-revalidate` through `Cache-Control`, `CDN-Cache-Control`, and
`Vercel-CDN-Cache-Control`.

## Public routes

- `/`: homepage
- `/awards`: award purpose and principles
- `/work`: types of work recognised
- `/standard`: four-measure evaluation framework
- `/process`: recognition journey
- `/about`: organisation and parent-brand context
- `/faq`, `/contact`, `/privacy-policy`, `/terms`, `/cookies`: supporting pages
- `404.astro`: branded, non-indexable not-found experience

All 11 public routes are indexable, linked from the site, and published at
`https://bestwebsiteaward.com/sitemap.xml`. The 404 page and `/api/*` remain non-indexable.

The public site contains no public-voting flow. Programme facts such as dates, fees, winners, judges and sponsors must only be added from an approved source.

## Deployment

The build output is generated in `dist/`, with pre-rendered files under `dist/client` and the contact
server function in the Vercel output. A post-build hardening step removes unused runtime image and
server-island routes because every current programme image is transformed at build time. The release
gate proves that only `/api/contact` maps to the Vercel function and that Sharp native binaries are
not included in that function.

`vercel.json` provides clean URLs, layered browser and CDN caching, immutable asset caching, fresh
sitemap and robots policies, and security headers. The production domain is
`https://bestwebsiteaward.com` and is proxied through Cloudflare. Cloudflare must have a Cache Rule
that makes successful GET and HEAD responses for public HTML and `/_astro/*` eligible for caching,
respects origin cache headers, and bypasses `/api/*`. Without that provider rule, Cloudflare reports
`DYNAMIC` even though Vercel correctly serves the static pages from its own edge cache.

# Participation payments

`/accept` is sent manually after a recipient accepts their selection by email. It is not linked from public navigation or included in either sitemap. It has a noindex meta tag, a route-specific `X-Robots-Tag`, no-store headers and no analytics. Other pages retain their existing indexing and behaviour. Noindex is not authentication: knowing the URL permits visiting the page, while the server requires a paid nomination before checkout.

## Eligibility and website matching

- Only `paid` nomination records in the configured merchant/application and payment environment qualify, at least 12 hours after payment confirmation. Unpaid submissions, authorised-only transactions, failures and records under review do not qualify.
- Match by domain, ignoring HTTP/HTTPS, leading `www`, capitalisation, default ports, terminal domain dots, page paths, query parameters and fragments. Unicode and punycode forms match consistently. Different domains and non-www subdomains remain distinct. Domain aliases or redirects are not followed or guessed.
- If several paid nominations use that domain, the most recently submitted paid nomination supplies the details. A later unpaid submission does not override those details. If the latest paid entry is under 12 hours old, it is ineligible; an older entry is not used to bypass the delay. Missing, unpaid and too-recent nominations all receive the same generic ineligibility message. Checkout refreshes eligibility and the latest paid nomination before saving an immutable participation snapshot.
- No nomination name, email or phone is returned to the browser. Lookup uses Turnstile and an IP-based rate limit. A short-lived encrypted grant and an HttpOnly browser session authorise checkout.
- A saved active participation payment is reused in its original browser. Another browser cannot create a second payment for the same website. The awards team handles lost-browser recovery using the payment reference.

## Approved prices

| Package | Participation                  |        Fee | Included attendees | Total attendee limits |
| ------- | ------------------------------ | ---------: | -----------------: | --------------------- |
| A       | Company                        | LKR 37,500 |                  1 | 1 to 10               |
| B       | Developer / agency             | LKR 37,500 |                  1 | 1 to 10               |
| C       | Company and developer / agency | LKR 60,000 |                  2 | 2 to 10               |

Package C alone offers an additional trophy for LKR 12,500, with separate company and developer presentations. Every additional attendee costs LKR 6,350. Full dinner buffet tickets are included for all attendees; extra attendee places are dinner buffet tickets only. Amounts use integer minor units throughout. The browser, server and database each enforce the limits; the server ignores client-supplied totals.

## Local preview

```sh
npm run dev:accept
```

Open <http://127.0.0.1:4322/accept> and enter **example.com** (or a URL variation). `recent.example.com` demonstrates a nomination paid six hours ago; other domains demonstrate a missing nomination. Both show the same ineligibility message. Choose a package, optional C trophy, attendee count and agreement; continue to the simulated payment and click **Simulate successful payment**. To repeat a completed preview, clear the localhost browser cookie or use a private window.

The mock uses an in-memory session and cannot read/write the database, call Genie or send email. It requires all three conditions: Astro development mode, `ACCEPT_DEMO=true` and a loopback request hostname. It is absent from the production server bundle. Never set `ACCEPT_DEMO` in Vercel. A server restart clears preview transactions.

## Deployment

1. Apply the additive schema using the intended existing database: `npm run payments:migrate`. Migration 004 adds separate participation tables and indexes; it does not rewrite nomination records. Paid nomination domain hashes are indexed on demand.
2. Set `PARTICIPATION_PAYMENTS_ENABLED=true` in the existing Vercel project's Production environment. Existing `NOMINATION_PAYMENTS_ENABLED`, Genie credentials, `PAYMENT_SITE_URL`, `DATABASE_URL`, `PAYMENT_DATA_KEY`, Turnstile, Resend and `CRON_SECRET` values are reused. Never change the encryption key, which protects existing nominations.
3. Run `npm run verify` and `PLAYWRIGHT_PORT=4397 npm run test:e2e`, then push and deploy through the existing project.
4. Verify `/accept` has a noindex meta tag and `X-Robots-Tag`, is absent from both sitemaps and contains no local preview. Ensure any external CDN cache rule respects its no-store headers.
5. Check a known paid website and an unpaid website. Complete an authorised gateway test in the correct payment environment and verify the actual customer and team receipts before distributing the link widely. A local simulation does not prove external payment or email delivery.

No new secrets or provider accounts are required. The added daily cron is `/api/participation/reconcile` at 04:00 UTC. Existing nomination recovery is unchanged.

## Confirmation and recovery

The server creates one durable record before requesting a hosted checkout. Return URLs and transaction-creation responses never prove payment. Both signed webhooks and status checks fetch the transaction from Genie and verify its ID, local reference, amount, currency, merchant and application. Confirmed payments remain confirmed despite stale failure callbacks; explicit refunds and voids enter review.

After confirmation, Resend sends a package, trophy, attendee, total and reference summary to the stored nomination email and the configured team inbox. Each recipient has a separate stable idempotency key and saved delivery ID. A failed email does not undo payment or ask the customer to pay again. Webhook retries, browser status checks and the daily reconciliation endpoint can retry missing receipts. Automatic sends stop after the 23-hour safety window; investigate Resend delivery logs before any manual resend to avoid duplicates. Provider acceptance is recorded; inbox placement cannot be guaranteed.

If transaction creation times out ambiguously, the record stays `creating` and blocks duplicate checkout. A signed webhook can recover it. Otherwise, an operator can find the transaction by its local reference in Genie and call the authenticated reconciliation endpoint with `?reference=<participation UUID>&transaction=<Genie transaction ID>`, using the existing `CRON_SECRET` bearer token. It re-verifies the provider transaction before updating anything. Never mark a payment paid from a browser claim or redirect query parameter.

For a failed or expired payment, an authoritative Genie result must establish failure before a new payment is permitted. Do not delete pending records to let someone pay again while a charge is uncertain. Paid records under review or lost-browser cases require the awards team's reconciliation.

Setting `PARTICIPATION_PAYMENTS_ENABLED=false` blocks new lookups/checkouts. Existing authenticated status checks, signed callbacks and recovery remain available so in-flight payments can settle.

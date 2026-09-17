# Meta conversions

Dataset/pixel: `1382406717339611`. The browser pixel and server API share stable event IDs for Contact forms and Lead submissions. PageView is browser-only. ViewContent and contact-link clicks use matching browser/server IDs. CompleteRegistration and Purchase are server-only, generated from verified paid records, including webhook confirmations when the visitor has closed the browser. The payment-status page still loads no advertising scripts.

## Production environment

In the existing GBE-owned Vercel project, set these variables in Production before deploying:

| Variable                 | Value                                    |
| ------------------------ | ---------------------------------------- |
| `META_CAPI_ENABLED`      | `true`                                   |
| `META_CAPI_ACCESS_TOKEN` | The supplied private access token        |
| `META_TEST_EVENT_CODE`   | Leave unset for normal production events |

Keep the existing `DATABASE_URL` and `PAYMENT_DATA_KEY` unchanged. Vercel's `VERCEL_ENV` must be `production` (normally supplied automatically). Local and preview sends require an explicit Meta test event code. No access token belongs in browser code or a `PUBLIC_` variable. The Dataset Quality token is used as a Conversions API credential; quality metrics require actual event traffic and are reviewed in Events Manager.

Apply `migrations/003_meta_events.sql` to the existing `bwa` schema before release. It creates only the consent and encrypted event-outbox tables and an index. Run `npm run verify` and `npm run test:e2e` before deploying.

## Event definitions

| Event                | Trigger                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------- |
| ViewContent          | Consented visit to home, awards, standard, process, work, recognition or contact              |
| Contact              | Successful enquiry delivery, or an email/phone/WhatsApp link click (contact intent)           |
| Lead                 | Nomination details durably captured before checkout                                           |
| CompleteRegistration | Server-confirmed paid nomination, regardless of email delivery delay                          |
| Purchase             | Same confirmed payment, with the stored amount converted from minor units and stored currency |

Failed, pending, review-state and ordinary sandbox payments do not become paid conversion events. The public collector accepts only ViewContent and contact-link intent; it cannot create a registration, purchase or lead.

## Consent, matching and recovery

The existing optional analytics choice controls both browser and server events. Form privacy acceptance alone never grants tracking permission. The consent cookie lasts up to 90 days. Withdrawal revokes queued events and suppresses later paid events associated with that consent identifier. Server matching uses the request's browser agent and client address, available Meta cookies, SHA-256-normalised email and explicitly international phone numbers. Local phone numbers are omitted because their country code is unknown. No message body, website submission, payment query string or raw email/phone is sent to Meta.

Events are encrypted at rest and delivered with a bounded timeout. An atomic lease prevents concurrent delivery; retries keep the original event ID and event time. Successful delivery erases the stored matching payload. The existing authenticated daily reconciliation job retries a bounded batch, stopping before Meta's seven-day event limit. It clears expired payloads and removes event records after 30 days. API failures do not change form or payment success. Failed enqueue operations are logged without credentials or personal information; check hosting logs for `Meta event delivery deferred`.

The production CSP permits only the required Meta script and measurement origins in addition to existing services. Pages remain statically rendered; consented measurement uses `/api/meta` with no-store responses.

## Verification after deployment

Obtain a Test Event Code in Meta Events Manager, temporarily set `META_TEST_EVENT_CODE` and redeploy. Use consented test interactions to confirm browser/server matching, the correct event ID and event names. Verify no events when declining or withdrawing. Remove the test code and redeploy for normal reporting. Never create fake production purchases to test transport.

The real-database outbox tests mock all Meta transport and clean up only their own synthetic records:

```sh
BWA_DB_TEST=1 node --env-file=.env node_modules/vitest/vitest.mjs run tests/meta/outbox.database.integration.test.ts
```

The token's dataset permissions and live receipt remain unverified until an event is accepted in Meta Test Events.

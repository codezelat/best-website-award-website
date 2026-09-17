import { expect, test, type Page } from '@playwright/test';

const reference = '4f07dbbb-f612-4f46-96db-cf8823ffc395';
test('verification errors and expiry recover without losing form details', async ({ page }) => {
  await prepare(page);
  const invoke = (name: string) =>
    page.evaluate((key) => (window as unknown as Record<string, () => unknown>)[key](), name);
  expect(await invoke('bwaVerificationError')).toBe(true);
  await expect(page.locator('[data-form-status]')).toContainText(
    'Secure verification could not load'
  );
  await invoke('bwaVerificationComplete');
  await expect(page.locator('[data-form-status]')).toBeHidden();
  await invoke('bwaVerificationExpired');
  await expect(page.locator('[data-form-status]')).toContainText('Your details are still here');
  await expect(page.locator('#contact-name')).toHaveValue('Test Entrant');
  await invoke('bwaVerificationComplete');
  await expect(page.locator('[data-form-status]')).toBeHidden();
});

async function prepare(page: Page) {
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `window.turnstile={reset(){}};const i=document.createElement('input');i.name='cf-turnstile-response';i.type='hidden';i.value='test-token';document.querySelector('.cf-turnstile').append(i);`
    })
  );
  await page.route('**/api/nomination/session', (route) => route.fulfill({ json: { ok: true } }));
  await page.route('**/api/nomination/lead', (route) =>
    route.fulfill({ json: { ok: true, captured: true } })
  );
  await page.goto('/contact');
  await page.locator('#contact-name').fill('Test Entrant');
  await page.locator('#contact-email').fill('entrant@example.com');
  await page.locator('#contact-organisation').fill('Example Studio');
  await page.locator('#contact-website').fill('https://example.com');
  await page.locator('input[name="privacyAccepted"]').check();
}

test('fee popup is clear, accessible and cancellable without losing the form', async ({
  page
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await prepare(page);
  await page.getByRole('button', { name: 'Continue nomination' }).click();
  const modal = page.locator('[data-payment-dialog]');
  await expect(modal).toBeVisible();
  await expect(modal.getByText('Rs. 2,850', { exact: true })).toBeVisible();
  await expect(modal.locator('li')).toHaveCount(3);
  await expect(modal.getByRole('button', { name: 'Pay Rs. 2,850 by card' })).toBeDisabled();
  await modal.getByRole('checkbox').check();
  await expect(modal.getByRole('button', { name: 'Pay Rs. 2,850 by card' })).toBeEnabled();
  await page.screenshot({ path: `/tmp/bwa-payment-${testInfo.project.name}.png`, fullPage: false });
  expect(await modal.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
  await expect(page.locator('#contact-name')).toHaveValue('Test Entrant');
  expect(errors).toEqual([]);
});

test('nomination starts checkout only after explicit fee agreement', async ({ page }) => {
  await prepare(page);
  let started = 0;
  await page.route('**/api/contact', () => {
    throw new Error('Paid nomination must not use free contact API');
  });
  await page.route('**/api/nomination/start', async (route) => {
    started++;
    expect(route.request().postData()).toContain('2026-09-09');
    await route.fulfill({
      json: {
        ok: true,
        payment: {
          reference,
          state: 'pending',
          submitted: false,
          checkoutUrl: 'https://transaction.uat.geniebiz.lk/test-checkout'
        }
      }
    });
  });
  await page.route('https://transaction.uat.geniebiz.lk/test-checkout', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<h1>Hosted test checkout</h1>' })
  );
  await page.getByRole('button', { name: 'Continue nomination' }).click();
  expect(started).toBe(0);
  await expect(page.locator('[data-payment-feedback]')).toBeHidden();
  // An expired widget does not lose the already verified, unchanged submission.
  await page.locator('input[name="cf-turnstile-response"]').evaluate((input) => {
    (input as HTMLInputElement).value = '';
  });
  await page.getByRole('dialog').getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Pay Rs. 2,850 by card' }).click();
  await expect(page).toHaveURL('https://transaction.uat.geniebiz.lk/test-checkout');
  expect(started).toBe(1);
});

test('opening and dismissing payment saves one unpaid lead without starting checkout', async ({
  page
}) => {
  await page.addInitScript(() => localStorage.setItem('bwa_analytics_consent_v1', 'granted'));
  await page.route('https://connect.facebook.net/**', (route) =>
    route.fulfill({ body: '', contentType: 'application/javascript' })
  );
  await page.route('https://www.googletagmanager.com/**', (route) =>
    route.fulfill({ body: '', contentType: 'application/javascript' })
  );
  await page.route('**/api/meta', (route) => route.fulfill({ json: { ok: true } }));
  await prepare(page);
  const submission = await page.locator('[data-submission-id]').inputValue();
  let leads = 0;
  let starts = 0;
  await page.route('**/api/nomination/lead', async (route) => {
    leads++;
    expect(route.request().postData()).toContain('entrant@example.com');
    expect(route.request().postData()).toContain('Example Studio');
    await route.fulfill({ json: { ok: true, captured: true } });
  });
  await page.route('**/api/nomination/start', () => {
    starts++;
  });
  await page.getByRole('button', { name: 'Continue nomination' }).click();
  await expect.poll(() => leads).toBe(1);
  await expect(page.locator('[data-payment-feedback]')).toBeHidden();
  await page.getByRole('button', { name: 'Back to your details' }).click();
  await page.getByRole('button', { name: 'Continue nomination' }).click();
  await expect(page.locator('[data-payment-feedback]')).toBeHidden();
  expect(leads).toBe(1);
  expect(starts).toBe(0);
  const events = await page.evaluate(
    () => (window as typeof window & { fbq: { queue: unknown[][] } }).fbq.queue
  );
  expect(events.filter((entry) => entry[1] === 'Lead')).toEqual([
    ['track', 'Lead', {}, { eventID: `bwa:Lead:${submission}` }]
  ]);
  expect(
    events.some((entry) => ['Purchase', 'CompleteRegistration'].includes(String(entry[1])))
  ).toBe(false);
});

test('lead storage failure keeps card payment disabled and supports retry', async ({ page }) => {
  await prepare(page);
  await page.route('**/api/nomination/lead', (route) =>
    route.fulfill({
      status: 503,
      json: { ok: false, message: 'We could not save your details. Please try again.' }
    })
  );
  await page.getByRole('button', { name: 'Continue nomination' }).click();
  await expect(page.locator('[data-payment-feedback]')).toContainText('could not save');
  await page.locator('[data-payment-agreement]').check();
  await expect(page.locator('[data-pay-card]')).toBeDisabled();
  await page.getByRole('button', { name: 'Back to your details' }).click();
  await expect(page.locator('#contact-name')).toHaveValue('Test Entrant');
  await page.route('**/api/nomination/lead', (route) =>
    route.fulfill({ json: { ok: true, captured: true } })
  );
  await page.getByRole('button', { name: 'Continue nomination' }).click();
  await page.locator('[data-payment-agreement]').check();
  await expect(page.locator('[data-pay-card]')).toBeEnabled();
});

test('paid nomination confirmation offers another submission and stays noindex', async ({
  page
}) => {
  await page.route('**/api/nomination/status?*', (route) =>
    route.fulfill({
      json: {
        ok: true,
        payment: {
          reference,
          state: 'paid',
          submitted: true,
          message: 'Your nomination has been sent to the awards team.'
        }
      }
    })
  );
  await page.goto(`/nomination-status?reference=${reference}`);
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('heading')).toHaveText(
    'Your nomination is received.'
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page).toHaveURL(/\/nomination-status$/);
  await page.getByRole('dialog').getByRole('link', { name: 'Submit another website' }).click();
  await expect(page).toHaveURL(/\/contact#nomination-form$/);
  expect(await page.evaluate(() => sessionStorage.getItem('bwaPaymentReference'))).toBeNull();
});

test('paid email delay does not show another payment option or false success', async ({ page }) => {
  await page.route('**/api/nomination/status?*', (route) =>
    route.fulfill({
      json: {
        ok: true,
        payment: {
          reference,
          state: 'paid',
          submitted: false,
          message: 'Your payment is confirmed. Please do not pay again.'
        }
      }
    })
  );
  await page.goto(`/nomination-status?reference=${reference}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Payment confirmed.');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.locator('[data-resume-payment]')).not.toBeVisible();
  await expect(page.locator('main [data-another-nomination]')).not.toBeVisible();
});

test('unavailable checkout leaves the form recoverable without taking payment', async ({
  page
}) => {
  await prepare(page);
  await page.route('**/api/nomination/session', (route) =>
    route.fulfill({
      status: 503,
      json: { ok: false, message: 'Online nominations are temporarily unavailable.' }
    })
  );
  await page.getByRole('button', { name: 'Continue nomination' }).click();
  await expect(page.locator('[data-payment-feedback]')).toHaveText(
    'Online nominations are temporarily unavailable.'
  );
  await page.getByRole('dialog').getByRole('checkbox').check();
  await expect(page.getByRole('button', { name: 'Pay Rs. 2,850 by card' })).toBeDisabled();
  await page.getByRole('button', { name: 'Back to your details' }).click();
  await expect(page.locator('#contact-website')).toHaveValue('https://example.com');
});

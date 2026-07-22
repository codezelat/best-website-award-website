import { expect, test } from '@playwright/test';

const editorialRoutes = [
  ['/awards', 'Recognition built on the work.'],
  ['/work', 'Different websites. One serious standard.'],
  ['/standard', 'A standard designed to see the whole website.'],
  ['/process', 'Make the work understandable.'],
  ['/about', 'Digital excellence in a wider business world.'],
  ['/gallery', 'Recognition, seen clearly.']
] as const;

const utilityRoutes = [
  ['/faq', 'Questions, answered with clarity.'],
  ['/contact', 'Present your website for 2026.'],
  ['/privacy-policy', 'Privacy, explained clearly.'],
  ['/terms', 'Terms built for clarity.'],
  ['/cookies', 'A minimal approach to cookies.']
] as const;

for (const [route, heading] of [...editorialRoutes, ...utilityRoutes]) {
  test(`${route} renders as a complete, responsive public page`, async ({ page }) => {
    await page.goto(route);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      `https://bestwebsiteaward.com${route}`
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /\S/);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /\S/);
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', /\S/);
    await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveAttribute('content', /\S/);
    await expect(page.getByRole('contentinfo')).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);

    if (utilityRoutes.some(([utilityRoute]) => utilityRoute === route)) {
      const collisions = await page.locator('main section').evaluateAll((sections) =>
        sections
          .map((section) => {
            const heading = section.querySelector('[data-utility-heading]');
            const copy = section.querySelector('[data-utility-copy]');
            if (!(heading instanceof HTMLElement) || !(copy instanceof HTMLElement)) return null;

            const headingBox = heading.getBoundingClientRect();
            const copyBox = copy.getBoundingClientRect();
            const overlaps = !(
              headingBox.right <= copyBox.left ||
              headingBox.left >= copyBox.right ||
              headingBox.bottom <= copyBox.top ||
              headingBox.top >= copyBox.bottom
            );
            return overlaps ? heading.textContent?.trim() : null;
          })
          .filter(Boolean)
      );
      expect(collisions).toEqual([]);
    }
  });
}

test('gallery publishes authentic ceremony imagery and matching image structured data', async ({
  page
}) => {
  await page.goto('/gallery');

  await expect(page.locator('main figure')).toHaveCount(10);
  await expect(page.getByRole('heading', { name: 'Moments of recognition' })).toBeVisible();

  const structuredDataText = await page.locator('script[type="application/ld+json"]').textContent();
  const structuredData = JSON.parse(structuredDataText ?? '{}');
  const imageNodes = structuredData['@graph']?.filter(
    (item: { '@type'?: string }) => item['@type'] === 'ImageObject'
  );

  expect(imageNodes).toHaveLength(10);
});

test('FAQ publishes complete visible answers and matching structured data', async ({ page }) => {
  await page.goto('/faq');

  const questions = page.locator('main details');
  await expect(questions).toHaveCount(24);
  await expect(questions.filter({ hasText: 'What is Best Website Awards 2026?' })).toHaveAttribute(
    'open',
    ''
  );

  const structuredDataText = await page.locator('script[type="application/ld+json"]').textContent();
  const structuredData = JSON.parse(structuredDataText ?? '{}');
  const faqPage = structuredData['@graph']?.find(
    (item: { '@type'?: string }) => item['@type'] === 'FAQPage'
  );

  expect(faqPage?.mainEntity).toHaveLength(24);
  expect(faqPage?.mainEntity?.[0]?.name).toBe('What is Best Website Awards 2026?');
  expect(faqPage?.mainEntity?.[10]?.acceptedAnswer?.text).toContain('does not use public voting');
});

test('optional analytics remains off until consent and preference can be changed', async ({
  page
}) => {
  await page.route('https://www.googletagmanager.com/**', (route) =>
    route.fulfill({ contentType: 'application/javascript', body: '' })
  );
  await page.goto('/');

  const consent = page.getByRole('dialog', { name: 'A better website, with your help.' });
  await expect(consent).toBeVisible();
  await expect(page.locator('script[data-google-analytics]')).toHaveCount(0);

  await page.getByRole('button', { name: 'Yes, help improve' }).click({ force: true });
  await expect(consent).toBeHidden();
  await expect(page.locator('script[data-google-analytics]')).toHaveCount(1);
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('bwa_analytics_consent_v1')))
    .toBe('granted');

  await page.getByRole('button', { name: 'Cookie settings' }).click();
  await expect(consent).toBeVisible();
  await page.getByRole('button', { name: 'Not now' }).click({ force: true });
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('bwa_analytics_consent_v1')))
    .toBe('denied');
});

for (const route of ['/privacy-policy', '/terms', '/cookies']) {
  test(`${route} is indexable and available to search engines`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1'
    );
  });
}

test('contact page publishes official channels and completes a website enquiry', async ({
  page
}) => {
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `
        window.turnstile = { reset() {} };
        document.querySelectorAll('.cf-turnstile').forEach((container) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = 'cf-turnstile-response';
          input.value = 'test-token';
          container.append(input);
        });
      `
    })
  );
  await page.route('**/api/contact', async (route) => {
    const request = route.request();
    expect(request.method()).toBe('POST');
    expect(request.postData()).toContain('example.com');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        message: 'Thank you. Your website details are now with the awards team.'
      })
    });
  });
  await page.goto('/contact');

  await expect(
    page.locator('.contact-application__social').getByRole('link', { name: /Facebook/ })
  ).toHaveAttribute('href', 'https://www.facebook.com/gbeaward/');
  await expect(page.locator('.contact-application__details')).toContainText('28 August 2026');
  await expect(page.getByRole('link', { name: /Confirm on WhatsApp/ }).first()).toHaveAttribute(
    'href',
    'https://wa.link/4f21fy'
  );
  await page.getByLabel('Your name *').fill('Test Entrant');
  await page.getByLabel('Work email *').fill('entrant@example.com');
  await page.getByLabel('Organisation *').fill('Example Studio');
  await page.getByLabel('Website address *').fill('https://example.com');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Send website details' }).click();

  await expect(page.getByRole('status')).toContainText(
    'Thank you. Your website details are now with the awards team.'
  );
});

test('unknown routes use the branded, non-indexable not-found page', async ({ page }) => {
  const response = await page.goto('/a-page-that-does-not-exist');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page is out of view.');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
});

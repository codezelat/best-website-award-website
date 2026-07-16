import { expect, test } from '@playwright/test';

const editorialRoutes = [
  ['/awards', 'Recognition built on the work.'],
  ['/work', 'Different websites. One serious standard.'],
  ['/standard', 'A standard designed to see the whole website.'],
  ['/process', 'Make the work understandable.'],
  ['/about', 'Digital excellence in a wider business world.']
] as const;

const utilityRoutes = [
  ['/faq', 'Questions, answered with clarity.'],
  ['/contact', 'Start a clear conversation.'],
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
  });
}

test('FAQ publishes complete visible answers and matching structured data', async ({ page }) => {
  await page.goto('/faq');

  const questions = page.locator('main section');
  await expect(questions).toHaveCount(22);

  const structuredDataText = await page
    .locator('script[type="application/ld+json"]')
    .textContent();
  const structuredData = JSON.parse(structuredDataText ?? '{}');
  const faqPage = structuredData['@graph']?.find(
    (item: { '@type'?: string }) => item['@type'] === 'FAQPage'
  );

  expect(faqPage?.mainEntity).toHaveLength(22);
  expect(faqPage?.mainEntity?.[0]?.name).toBe('What is Best Website Awards?');
  expect(faqPage?.mainEntity?.[8]?.acceptedAnswer?.text).toContain(
    'does not use public voting'
  );
});

for (const route of ['/privacy-policy', '/terms', '/cookies']) {
  test(`${route} is deliberately excluded from search indexing`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
  });
}

test('sitemap contains only indexable public routes', async ({ request }) => {
  const response = await request.get('/sitemap-0.xml');
  const sitemap = await response.text();

  expect(response.ok()).toBe(true);
  expect(sitemap).toContain('https://bestwebsiteaward.com/faq');
  expect(sitemap).toContain('https://bestwebsiteaward.com/standard');
  expect(sitemap).not.toContain('/privacy-policy');
  expect(sitemap).not.toContain('/terms');
  expect(sitemap).not.toContain('/cookies');
});

test('unknown routes use the branded, non-indexable not-found page', async ({ page }) => {
  const response = await page.goto('/a-page-that-does-not-exist');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page is out of view.');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
});

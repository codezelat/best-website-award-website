import { expect, test } from '@playwright/test';

test('renders the complete homepage and its landmark content', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Best Website Awards/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Best Website Awards 2026.');
  await expect(page.locator('.hero__summary')).toContainText(
    'Entries now open for the 2026 programme.'
  );
  await expect(page.getByRole('heading', { name: 'The work we recognise' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Four measures of excellence' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recognition in view.' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Global perspective. Business credibility.' })
  ).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test('rotates four authentic ceremony images in the hero', async ({ page }) => {
  await page.goto('/');

  const slides = page.locator('[data-browser-slideshow] [data-browser-slide]');
  await expect(slides).toHaveCount(4);

  const initialActiveIndex = await slides.evaluateAll((elements) =>
    elements.findIndex((element) => element.getAttribute('data-active') === 'true')
  );
  expect(initialActiveIndex).toBeGreaterThanOrEqual(0);

  await page.waitForTimeout(4400);

  const nextActiveIndex = await slides.evaluateAll((elements) =>
    elements.findIndex((element) => element.getAttribute('data-active') === 'true')
  );
  expect(nextActiveIndex).not.toBe(initialActiveIndex);
});

test('connects primary navigation to the full standard page', async ({ page, isMobile }) => {
  await page.goto('/');

  if (isMobile) {
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await expect(page.getByRole('navigation', { name: 'Mobile navigation' })).toBeVisible();
    await page
      .getByRole('navigation', { name: 'Mobile navigation' })
      .getByRole('link', { name: /The standard/ })
      .click();
    await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible();
  } else {
    await page
      .getByRole('navigation', { name: 'Primary navigation' })
      .getByRole('link', { name: 'The standard' })
      .click();
  }

  await expect(page).toHaveURL(/\/standard$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'A standard designed to see the whole website.'
  );
});

test('publishes canonical, social and structured metadata', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://bestwebsiteaward.com/'
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /https:\/\//);
  const structuredData = await page.locator('script[type="application\/ld\+json"]').textContent();
  expect(structuredData).toContain('Best Website Awards');
  expect(structuredData).toContain('ImageObject');
});

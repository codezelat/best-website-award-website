import { expect, test } from '@playwright/test';

test('renders the complete homepage and its landmark content', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Best Website Awards/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Exceptional websites belong in view.'
  );
  await expect(page.getByRole('heading', { name: 'The work we recognise' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Four measures of excellence' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Global perspective. Business credibility.' })
  ).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
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
    'A clear standard for exceptional work.'
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
});

import { expect, test } from '@playwright/test';

const editorialRoutes = [
  ['/awards', 'Recognition with meaning.'],
  ['/work', 'Digital work, seen in context.'],
  ['/standard', 'A clear standard for exceptional work.'],
  ['/process', 'A considered path to recognition.'],
  ['/about', 'Digital excellence, viewed in a wider context.']
] as const;

const utilityRoutes = [
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
    await expect(page.getByRole('contentinfo')).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test('unknown routes use the branded, non-indexable not-found page', async ({ page }) => {
  const response = await page.goto('/a-page-that-does-not-exist');

  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page is out of view.');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
});

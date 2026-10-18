import { test, expect } from '@playwright/test';

test.describe('Search Refresh Regression Tests', () => {
  test('URE-late refresh fix: renders result cards within ~15s when ure-modules requests are time-gated by 8s', async ({ page }) => {
    test.setTimeout(25000);

    const startTime = Date.now();
    await page.route('**/ure-modules/**', async (route) => {
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, 8000 - elapsed);
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      await route.continue();
    });

    await page.goto('/search/?q=heart', { waitUntil: 'domcontentloaded' });

    const cards = page.locator('.result-card');
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
  });

  test('Data outage refresh fix: renders result cards within ~25s when assets/db requests are time-gated by 12s', async ({ page }) => {
    test.setTimeout(35000);

    const startTime = Date.now();
    await page.route('**/assets/db/**', async (route) => {
      const elapsed = Date.now() - startTime;
      const delay = Math.max(0, 12000 - elapsed);
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      await route.continue();
    });

    await page.goto('/search/?q=heart', { waitUntil: 'domcontentloaded' });

    const cards = page.locator('.result-card');
    await expect(cards.first()).toBeVisible({ timeout: 25000 });
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('result cards render at distinct positions (no transform-override stacking)', async ({ page }) => {
    await page.goto('/search/?q=heart', { waitUntil: 'domcontentloaded' });

    const cards = page.locator('.result-card');
    await expect(cards.first()).toBeVisible({ timeout: 20000 });
    await expect(cards.nth(1)).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(600); // allow appear animations to finish

    const positions = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.result-card')).map((c) => {
        const r = c.getBoundingClientRect();
        return `${Math.round(r.x)},${Math.round(r.y)}`;
      });
    });
    expect(positions.length).toBeGreaterThan(1);
    const unique = new Set(positions);
    expect(unique.size).toBe(positions.length);
  });
});

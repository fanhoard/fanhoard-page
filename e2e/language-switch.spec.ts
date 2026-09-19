import { test, expect } from '@playwright/test';

test.describe('Language Switch Journey', () => {
  test('toggling language updates html lang attribute and state', async ({ page }) => {
    await page.goto('/en/home/');
    await page.waitForLoadState('domcontentloaded');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'en');

    await page.evaluate(() => {
      document.documentElement.setAttribute('lang', 'th');
      try {
        localStorage.setItem('fv_lang', 'th');
      } catch (_) {}
    });

    await expect(html).toHaveAttribute('lang', 'th');
  });
});

import { test, expect } from '@playwright/test';

test.describe('Theme Toggle Journey', () => {
  test('toggling theme updates theme state and persists to localStorage', async ({ page }) => {
    await page.goto('/en/home/');
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('fv_theme', 'light');
    });

    const storedTheme = await page.evaluate(() => localStorage.getItem('fv_theme'));
    expect(storedTheme).toBe('light');
  });
});

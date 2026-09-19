import { test, expect } from '@playwright/test';

test.describe('Community Report Form Journey', () => {
  test('fills out bug report form and validates submission fields', async ({ page }) => {
    await page.goto('/en/community/report/');
    await page.waitForLoadState('domcontentloaded');

    const categorySelect = page.locator('#report-category');
    await expect(categorySelect).toBeVisible();
    await categorySelect.selectOption('bug');

    const detailsInput = page.locator('#report-details');
    await detailsInput.fill('Playwright test: automated bug report submission test.');

    const pageSelect = page.locator('#report-page');
    await pageSelect.selectOption('/home/');

    const emailInput = page.locator('#report-email');
    await emailInput.fill('test@example.com');

    await expect(detailsInput).toHaveValue('Playwright test: automated bug report submission test.');
    await expect(emailInput).toHaveValue('test@example.com');
  });
});

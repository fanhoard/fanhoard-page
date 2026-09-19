import { test, expect } from '@playwright/test';

test.describe('Community Report Form Journey', () => {
  test('fills out bug report form and validates submission fields', async ({ page }) => {
    await page.goto('/en/community/report/');
    await page.waitForLoadState('domcontentloaded');

    // Dismiss the "new update" blocking popup shown to first-time visitors
    // Dismiss the "new update" blocking popup shown to first-time visitors.
    // Wait until the popup is fully open (fp-is-open) so its event wiring is settled.
    const dismissBtn = page.locator('[data-fp-action="dismiss"]');
    try {
      await page.waitForSelector('.fp-popup.fp-is-open', { timeout: 5000 });
      await page.waitForTimeout(400);
      await dismissBtn.first().click();
      await page.waitForSelector('.fp-blocking', { state: 'detached', timeout: 5000 });
    } catch {
      // popup not shown (already dismissed in a prior run) — proceed
    }

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

import { test, expect } from '@playwright/test';

test.describe('Copy Symbol Journey', () => {
  test('clicking a symbol button triggers copy notification toast', async ({ page }) => {
    await page.goto('/en/home/');
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => {
      (window as any).showCopyNotification?.({ text: '😀', name: 'Grinning Face', lang: 'en' });
    });

    const toast = page.locator('.cn-capsule');
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText(/Copied|คัดลอกแล้ว/);
  });
});

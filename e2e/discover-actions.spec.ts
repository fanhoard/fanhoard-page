import { test, expect } from '@playwright/test';

test.describe('Discover Main & Sub Action Scoped Loading & Hit-Testing', () => {
  const contentSelector = '#content-loading .cm-group, #content-loading .card, #content-loading .button-content, #content-loading [data-content], #content-loading *';
  const mainButtonSelector = '#nav-list button.main-button, header nav button.main-button';
  const subButtonSelector = '#sub-buttons-container button.button-sub, #sub-nav button.button-sub';
  const contentContainerId = 'content-loading';

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('fv_noupdate', '1');
      localStorage.setItem('fv_dismissed_v2.3.0', '1');
    });
  });

  test('Desktop (1280x720): Content-scoped loading on main/sub click preserves button visibility and hit-testing without fullscreen overlay interception', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // 1. Initial navigation & wait for boot completion
    await page.goto('/data/verse/discover/index.html');
    await page.waitForSelector('#fv-boot-loader', { state: 'detached', timeout: 10000 });
    await page.waitForSelector(contentSelector, { timeout: 10000 });

    // 2. Introduce deterministic delayed content transitions for action clicks
    await page.route('**/*.json*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.continue();
    });

    // 3. Locate target main button (non-active second button)
    const mainButtons = page.locator(mainButtonSelector);
    const mainCount = await mainButtons.count();
    expect(mainCount).toBeGreaterThan(1);

    // Pick the second main button (e.g. Emojis or Symbols)
    const targetMainBtn = mainButtons.nth(1);
    await expect(targetMainBtn).toBeVisible();

    // 4. Trigger main button click
    await targetMainBtn.click();

    // 5. Assert target main button remains visible and hit-testable during active loading
    await expect(targetMainBtn).toBeVisible();

    const mainHitResult = await page.evaluate((sel) => {
      const btn = document.querySelectorAll('#nav-list button.main-button, header nav button.main-button')[1];
      if (!btn) return { hit: false, reason: 'Target main button element not found' };
      const rect = btn.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const topEl = document.elementFromPoint(x, y);
      if (!topEl) return { hit: false, reason: 'elementFromPoint returned null' };
      const matches = btn === topEl || btn.contains(topEl);
      return {
        hit: matches,
        topTag: topEl.tagName,
        topClass: topEl.className,
        topId: topEl.id
      };
    }, mainButtonSelector);

    expect(mainHitResult.hit).toBe(true);

    // 6. Assert no active fullscreen overlay intercepts interactions
    const fullscreenOverlayCount = await page.locator('.fvl-fullscreen:not(.fvl-hidden)').count();
    expect(fullscreenOverlayCount).toBe(0);

    // 7. Assert content settles on container
    await page.waitForSelector(contentSelector, { timeout: 10000 });
    const contentMounted = await page.evaluate((containerId) => {
      const el = document.getElementById(containerId);
      return el ? el.children.length > 0 : false;
    }, contentContainerId);
    expect(contentMounted).toBe(true);

    // 8. Test sub-button action if sub-buttons exist
    const subButtons = page.locator(subButtonSelector);
    if ((await subButtons.count()) > 0) {
      const targetSubBtn = subButtons.nth(0);
      if (await targetSubBtn.isVisible()) {
        await targetSubBtn.click();

        await expect(targetSubBtn).toBeVisible();

        const subHitResult = await page.evaluate(() => {
          const btn = document.querySelector('#sub-buttons-container button.button-sub, #sub-nav button.button-sub');
          if (!btn) return { hit: false, reason: 'Sub button not found' };
          const rect = btn.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          const topEl = document.elementFromPoint(x, y);
          if (!topEl) return { hit: false, reason: 'elementFromPoint returned null' };
          return { hit: btn === topEl || btn.contains(topEl), topTag: topEl.tagName };
        });

        expect(subHitResult.hit).toBe(true);

        await page.waitForSelector(contentSelector, { timeout: 10000 });
      }
    }
  });

  test('Release update modal dismiss path functional when modal is open', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Ensure fv_noupdate is cleared so release modal opens legitimately
    await page.addInitScript(() => {
      localStorage.removeItem('fv_noupdate');
      localStorage.removeItem('fv_dismissed_v2.3.0');
    });

    await page.goto('/data/verse/discover/index.html');

    // Wait for the release modal to appear
    const dismissBtn = page.locator('button[data-fp-action="dismiss"]');
    await expect(dismissBtn).toBeVisible({ timeout: 10000 });

    // Click dismiss button
    await dismissBtn.click();

    // Verify modal overlay closes and dismiss token is written
    await expect(dismissBtn).toBeHidden({ timeout: 10000 });

    const isDismissed = await page.evaluate(() => {
      return localStorage.getItem('fv_dismissed_v2.3.0') === '1';
    });
    expect(isDismissed).toBe(true);
  });

  test('Mobile (375x812): Content-scoped loading on main/sub click preserves button visibility and hit-testing without fullscreen overlay interception', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    // 1. Initial navigation & wait for boot completion
    await page.goto('/data/verse/discover/index.html');
    await page.waitForSelector('#fv-boot-loader', { state: 'detached', timeout: 10000 });
    await page.waitForSelector(contentSelector, { timeout: 10000 });

    // 2. Introduce deterministic delayed content transitions for action clicks
    await page.route('**/*.json*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.continue();
    });

    // 3. Locate target main button
    const mainButtons = page.locator(mainButtonSelector);
    const mainCount = await mainButtons.count();
    expect(mainCount).toBeGreaterThan(1);

    const targetMainBtn = mainButtons.nth(1);
    await expect(targetMainBtn).toBeVisible();

    // 4. Trigger main button click
    await targetMainBtn.click();

    // 5. Assert target main button remains visible and hit-testable during active loading
    await expect(targetMainBtn).toBeVisible();

    const mainHitResult = await page.evaluate(() => {
      const btn = document.querySelectorAll('#nav-list button.main-button, header nav button.main-button')[1];
      if (!btn) return { hit: false, reason: 'Target main button element not found' };
      const rect = btn.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const topEl = document.elementFromPoint(x, y);
      if (!topEl) return { hit: false, reason: 'elementFromPoint returned null' };
      const matches = btn === topEl || btn.contains(topEl);
      return {
        hit: matches,
        topTag: topEl.tagName,
        topClass: topEl.className,
        topId: topEl.id
      };
    });

    expect(mainHitResult.hit).toBe(true);

    // 6. Assert no active fullscreen overlay intercepts interactions
    const fullscreenOverlayCount = await page.locator('.fvl-fullscreen:not(.fvl-hidden)').count();
    expect(fullscreenOverlayCount).toBe(0);

    // 7. Assert content settles on container
    await page.waitForSelector(contentSelector, { timeout: 10000 });
    const contentMounted = await page.evaluate((containerId) => {
      const el = document.getElementById(containerId);
      return el ? el.children.length > 0 : false;
    }, contentContainerId);
    expect(contentMounted).toBe(true);

    // 8. Test sub-button action if sub-buttons exist
    const subButtons = page.locator(subButtonSelector);
    if ((await subButtons.count()) > 0) {
      const targetSubBtn = subButtons.nth(0);
      if (await targetSubBtn.isVisible()) {
        await targetSubBtn.click();

        await expect(targetSubBtn).toBeVisible();

        const subHitResult = await page.evaluate(() => {
          const btn = document.querySelector('#sub-buttons-container button.button-sub, #sub-nav button.button-sub');
          if (!btn) return { hit: false, reason: 'Sub button not found' };
          const rect = btn.getBoundingClientRect();
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          const topEl = document.elementFromPoint(x, y);
          if (!topEl) return { hit: false, reason: 'elementFromPoint returned null' };
          return { hit: btn === topEl || btn.contains(topEl), topTag: topEl.tagName };
        });

        expect(subHitResult.hit).toBe(true);

        await page.waitForSelector(contentSelector, { timeout: 10000 });
      }
    }
  });
});

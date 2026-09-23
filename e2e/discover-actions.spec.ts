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

    // 0. Intercept buttons.json to inject deterministic subButtons into Symbols main button
    // Retain main button jsonFile and include isDefault: true on default sub-button
    await page.route('**/assets/json/buttons.json', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      if (json.mainButtons && json.mainButtons.length > 0) {
        json.mainButtons[0].jsonFile = '/assets/json/content/symbols.json';
        json.mainButtons[0].subButtons = [
          {
            en_label: 'Sub Default',
            th_label: 'ซับ ค่าเริ่มต้น',
            url: 'default',
            jsonFile: '/assets/json/content/symbols.json',
            isDefault: true
          },
          {
            en_label: 'Sub Target',
            th_label: 'ซับ เป้าหมาย',
            url: 'target',
            jsonFile: '/assets/json/content/fancy.json'
          }
        ];
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(json)
      });
    });

    // 1. Initial navigation & wait for boot completion
    await page.goto('/data/verse/discover/index.html');
    await page.waitForSelector('#fv-boot-loader', { state: 'detached', timeout: 10000 });
    await page.waitForSelector(contentSelector, { timeout: 10000 });

    // 2. Set up deterministic deferred route ONLY for actual main action navigation request (/assets/json/content/symbols.json)
    let unblockMainRoute: (() => void) | null = null;
    let mainRouteDeferred = false;

    await page.route('**/assets/json/content/symbols.json', async (route) => {
      if (mainRouteDeferred) {
        await route.continue();
        return;
      }
      mainRouteDeferred = true;
      await new Promise<void>((resolve) => {
        unblockMainRoute = resolve;
      });
      await route.continue();
    });

    // 3. Locate target main button (Symbols is mainButtons.nth(1) after "All" system button injection)
    const mainButtons = page.locator(mainButtonSelector);
    const mainCount = await mainButtons.count();
    expect(mainCount).toBeGreaterThan(1);

    const targetMainBtn = mainButtons.nth(1);
    await expect(targetMainBtn).toBeVisible();

    // 4. Trigger main button click (starts navigation to symbols)
    const mainClickPromise = targetMainBtn.click();

    // 5. Wait for active loading state: actual symbols.json request intercepted and held
    await expect.poll(() => mainRouteDeferred, { timeout: 5000 }).toBe(true);

    // Assert target main button remains visible and hit-testable DURING active loading
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

    // Assert aria-busy is "true" on container during active loading
    const mainLoadingBusy = await page.evaluate((id) => document.getElementById(id)?.getAttribute('aria-busy'), contentContainerId);
    expect(mainLoadingBusy).toBe('true');

    // Assert no active fullscreen overlay intercepts interactions
    const fullscreenOverlayCount = await page.locator('.fvl-fullscreen:not(.fvl-hidden)').count();
    expect(fullscreenOverlayCount).toBe(0);

    // 6. Release navigation route and settle main transition
    unblockMainRoute?.();
    await mainClickPromise;

    await page.waitForSelector(contentSelector, { timeout: 10000 });
    await page.waitForFunction((id) => document.getElementById(id)?.getAttribute('aria-busy') !== 'true', contentContainerId);

    const mainBusyAfter = await page.evaluate((id) => document.getElementById(id)?.getAttribute('aria-busy'), contentContainerId);
    expect(mainBusyAfter).not.toBe('true');

    const contentMounted = await page.evaluate((containerId) => {
      const el = document.getElementById(containerId);
      return el ? el.children.length > 0 : false;
    }, contentContainerId);
    expect(contentMounted).toBe(true);

    // 7. Test sub-button action with deterministic subButtons fixture
    const subButtons = page.locator(subButtonSelector);
    expect(await subButtons.count()).toBeGreaterThan(1);

    const targetSubBtn = subButtons.nth(1);
    await expect(targetSubBtn).toBeVisible();

    let unblockSubRoute: (() => void) | null = null;
    let subRouteDeferred = false;

    await page.route('**/assets/json/content/fancy.json', async (route) => {
      if (subRouteDeferred) {
        await route.continue();
        return;
      }
      subRouteDeferred = true;
      await new Promise<void>((resolve) => {
        unblockSubRoute = resolve;
      });
      await route.continue();
    });

    const subClickPromise = targetSubBtn.click();

    await expect.poll(() => subRouteDeferred, { timeout: 5000 }).toBe(true);

    await expect(targetSubBtn).toBeVisible();

    const subHitResult = await page.evaluate(() => {
      const btn = document.querySelectorAll('#sub-buttons-container button.button-sub, #sub-nav button.button-sub')[1];
      if (!btn) return { hit: false, reason: 'Sub button not found' };
      const rect = btn.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const topEl = document.elementFromPoint(x, y);
      if (!topEl) return { hit: false, reason: 'elementFromPoint returned null' };
      return { hit: btn === topEl || btn.contains(topEl), topTag: topEl.tagName };
    });

    expect(subHitResult.hit).toBe(true);

    const subLoadingBusy = await page.evaluate((id) => document.getElementById(id)?.getAttribute('aria-busy'), contentContainerId);
    expect(subLoadingBusy).toBe('true');

    unblockSubRoute?.();
    await subClickPromise;

    await page.waitForSelector(contentSelector, { timeout: 10000 });
    await page.waitForFunction((id) => document.getElementById(id)?.getAttribute('aria-busy') !== 'true', contentContainerId);

    const subBusyAfter = await page.evaluate((id) => document.getElementById(id)?.getAttribute('aria-busy'), contentContainerId);
    expect(subBusyAfter).not.toBe('true');
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

    // 0. Intercept buttons.json to inject deterministic subButtons into Symbols main button
    await page.route('**/assets/json/buttons.json', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      if (json.mainButtons && json.mainButtons.length > 0) {
        json.mainButtons[0].jsonFile = '/assets/json/content/symbols.json';
        json.mainButtons[0].subButtons = [
          {
            en_label: 'Sub Default',
            th_label: 'ซับ ค่าเริ่มต้น',
            url: 'default',
            jsonFile: '/assets/json/content/symbols.json',
            isDefault: true
          },
          {
            en_label: 'Sub Target',
            th_label: 'ซับ เป้าหมาย',
            url: 'target',
            jsonFile: '/assets/json/content/fancy.json'
          }
        ];
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(json)
      });
    });

    // 1. Initial navigation & wait for boot completion
    await page.goto('/data/verse/discover/index.html');
    await page.waitForSelector('#fv-boot-loader', { state: 'detached', timeout: 10000 });
    await page.waitForSelector(contentSelector, { timeout: 10000 });

    // 2. Set up deterministic deferred route ONLY for actual main action navigation request (/assets/json/content/symbols.json)
    let unblockMainRoute: (() => void) | null = null;
    let mainRouteDeferred = false;

    await page.route('**/assets/json/content/symbols.json', async (route) => {
      if (mainRouteDeferred) {
        await route.continue();
        return;
      }
      mainRouteDeferred = true;
      await new Promise<void>((resolve) => {
        unblockMainRoute = resolve;
      });
      await route.continue();
    });

    // 3. Locate target main button
    const mainButtons = page.locator(mainButtonSelector);
    const mainCount = await mainButtons.count();
    expect(mainCount).toBeGreaterThan(1);

    const targetMainBtn = mainButtons.nth(1);
    await expect(targetMainBtn).toBeVisible();

    // 4. Trigger main button click
    const mainClickPromise = targetMainBtn.click();

    // 5. Wait for active loading state
    await expect.poll(() => mainRouteDeferred, { timeout: 5000 }).toBe(true);

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

    const mainLoadingBusy = await page.evaluate((id) => document.getElementById(id)?.getAttribute('aria-busy'), contentContainerId);
    expect(mainLoadingBusy).toBe('true');

    const fullscreenOverlayCount = await page.locator('.fvl-fullscreen:not(.fvl-hidden)').count();
    expect(fullscreenOverlayCount).toBe(0);

    // 6. Release navigation route and settle main transition
    unblockMainRoute?.();
    await mainClickPromise;

    await page.waitForSelector(contentSelector, { timeout: 10000 });
    await page.waitForFunction((id) => document.getElementById(id)?.getAttribute('aria-busy') !== 'true', contentContainerId);

    const mainBusyAfter = await page.evaluate((id) => document.getElementById(id)?.getAttribute('aria-busy'), contentContainerId);
    expect(mainBusyAfter).not.toBe('true');

    const contentMounted = await page.evaluate((containerId) => {
      const el = document.getElementById(containerId);
      return el ? el.children.length > 0 : false;
    }, contentContainerId);
    expect(contentMounted).toBe(true);

    // 7. Test sub-button action with deterministic subButtons fixture
    const subButtons = page.locator(subButtonSelector);
    expect(await subButtons.count()).toBeGreaterThan(1);

    const targetSubBtn = subButtons.nth(1);
    await expect(targetSubBtn).toBeVisible();

    let unblockSubRoute: (() => void) | null = null;
    let subRouteDeferred = false;

    await page.route('**/assets/json/content/fancy.json', async (route) => {
      if (subRouteDeferred) {
        await route.continue();
        return;
      }
      subRouteDeferred = true;
      await new Promise<void>((resolve) => {
        unblockSubRoute = resolve;
      });
      await route.continue();
    });

    const subClickPromise = targetSubBtn.click();

    await expect.poll(() => subRouteDeferred, { timeout: 5000 }).toBe(true);

    await expect(targetSubBtn).toBeVisible();

    const subHitResult = await page.evaluate(() => {
      const btn = document.querySelectorAll('#sub-buttons-container button.button-sub, #sub-nav button.button-sub')[1];
      if (!btn) return { hit: false, reason: 'Sub button not found' };
      const rect = btn.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const topEl = document.elementFromPoint(x, y);
      if (!topEl) return { hit: false, reason: 'elementFromPoint returned null' };
      return { hit: btn === topEl || btn.contains(topEl), topTag: topEl.tagName };
    });

    expect(subHitResult.hit).toBe(true);

    const subLoadingBusy = await page.evaluate((id) => document.getElementById(id)?.getAttribute('aria-busy'), contentContainerId);
    expect(subLoadingBusy).toBe('true');

    unblockSubRoute?.();
    await subClickPromise;

    await page.waitForSelector(contentSelector, { timeout: 10000 });
    await page.waitForFunction((id) => document.getElementById(id)?.getAttribute('aria-busy') !== 'true', contentContainerId);

    const subBusyAfter = await page.evaluate((id) => document.getElementById(id)?.getAttribute('aria-busy'), contentContainerId);
    expect(subBusyAfter).not.toBe('true');
  });
});

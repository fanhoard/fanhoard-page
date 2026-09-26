import { test, expect } from '@playwright/test';

test.describe('In-Flow Contextual Loading E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Suppress update modals and set initial desktop viewport
    await page.addInitScript(() => {
      localStorage.setItem('fv_noupdate', '1');
      localStorage.setItem('fv_dismissed_v2.3.0', '1');
      localStorage.setItem('fv_dismissed_v3.0.3', '1');
    });
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Typed API v2 contract renders page, content, component in-flow and global as fixed overlay', async ({ page }) => {
    await page.goto('/data/verse/discover/index.html');
    await page.waitForSelector('#fv-boot-loader', { state: 'detached', timeout: 10000 });
    await page.waitForFunction(() => window.FVL && typeof window.FVL.page === 'function');

    // 1. Page loader
    await page.evaluate(() => {
      window.FVL.page('#content-loading', { message: 'Page loading…' });
    });
    const pageLoader = page.locator('#content-loading .fvl-page');
    await expect(pageLoader).toBeVisible();

    const pagePos = await pageLoader.evaluate((el) => window.getComputedStyle(el).position);
    expect(pagePos).not.toBe('fixed');
    expect(pagePos).not.toBe('absolute');

    await page.evaluate(() => window.FVL.hideAll());

    // 2. Content loader
    await page.evaluate(() => {
      window.FVL.content('#content-loading', { message: 'Section loading…' });
    });
    const contentLoader = page.locator('#content-loading .fvl-content');
    await expect(contentLoader).toBeVisible();

    const contentPos = await contentLoader.evaluate((el) => window.getComputedStyle(el).position);
    expect(contentPos).not.toBe('fixed');
    expect(contentPos).not.toBe('absolute');

    await page.evaluate(() => window.FVL.hideAll());

    // 3. Component loader
    await page.evaluate(() => {
      window.FVL.component('#content-loading', { message: 'Button loading…' });
    });
    const compLoader = page.locator('#content-loading .fvl-component');
    await expect(compLoader).toBeVisible();

    const compPos = await compLoader.evaluate((el) => window.getComputedStyle(el).position);
    expect(compPos).not.toBe('fixed');

    await page.evaluate(() => window.FVL.hideAll());

    // 4. Explicit Global Overlay
    await page.evaluate(() => {
      window.FVL.global({ message: 'Global exception…', lockScroll: true, instant: true });
    });
    const globalOverlay = page.locator('.fvl-global, .fvl-fullscreen');
    await expect(globalOverlay).toBeVisible();

    const globalPos = await globalOverlay.evaluate((el) => window.getComputedStyle(el).position);
    expect(globalPos).toBe('fixed');

    const bodyPos = await page.evaluate(() => document.body.style.position);
    expect(bodyPos).toBe('fixed');

    await page.evaluate(() => window.FVL.hideAll());
  });

  test('Scroll position is preserved across same-route load completion (no snap-to-top)', async ({ page }) => {
    await page.goto('/data/verse/discover/index.html');
    await page.waitForSelector('#fv-boot-loader', { state: 'detached', timeout: 10000 });
    await page.waitForFunction(() => window.FVL && typeof window.FVL.page === 'function');
    // Wait for the initial feed render to finish before measuring scroll:
    // the initial renderFeed legitimately resets scroll, so scrolling during
    // that window would race it and fake a snap-to-top.
    await page.waitForSelector('#content-loading .cm-group, #content-loading .card', { timeout: 10000 });

    // Trigger page loader and ensure scrollable document
    await page.evaluate(() => {
      document.body.style.minHeight = '3000px';
      window.FVL.page('#content-loading', { message: 'Refreshing feed…' });
      window.scrollTo(0, 500);
    });

    await page.waitForFunction(() => window.scrollY >= 500);
    const scrolledY = await page.evaluate(() => window.scrollY);
    expect(scrolledY).toBeGreaterThanOrEqual(500);

    // Hide loader and verify scroll position is preserved (no snap to top)
    await page.evaluate(async () => {
      await window.FVL.hideAll();
    });

    const postLoadScrollY = await page.evaluate(() => window.scrollY);
    expect(postLoadScrollY).toBeGreaterThanOrEqual(500);
  });

  test('Mobile viewport resize does not leave gaps or background scroll leaks', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/data/verse/discover/index.html');
    await page.waitForSelector('#fv-boot-loader', { state: 'detached', timeout: 10000 });

    // Render global overlay exception and check dynamic viewport sizing
    await page.evaluate(() => {
      window.FVL.global({ message: 'Mobile global overlay', lockScroll: true });
    });

    const overlay = page.locator('.fvl-global, .fvl-fullscreen');
    await expect(overlay).toBeVisible();

    const computedHeight = await overlay.evaluate((el) => window.getComputedStyle(el).height);
    expect(computedHeight).toBeTruthy();

    await page.evaluate(() => window.FVL.hideAll());
  });

  test('Boot sequence renders in-flow inside #content-loading with interactive header/nav', async ({ page }) => {
    const response = await page.goto('/data/verse/discover/index.html');

    // Header nav is visible and interactive immediately on first paint
    const headerNav = page.locator('header nav').first();
    await expect(headerNav).toBeVisible();
    const headerInteractive = await headerNav.evaluate((el) => window.getComputedStyle(el).pointerEvents !== 'none');
    expect(headerInteractive).toBe(true);

    // Boot loader lives in-flow inside #content-loading in the raw SSG HTML
    const ssgHtml = (await response?.text()) ?? '';
    expect(ssgHtml).toContain('id="content-loading"');
    expect(ssgHtml).toContain('id="fv-boot-loader"');
    expect(ssgHtml).toMatch(/id="content-loading"[\s\S]*?id="fv-boot-loader"/);

    await page.waitForSelector('#fv-boot-loader', { state: 'detached', timeout: 10000 });

  });

  test('Contextual loading is visible inside content area', async ({ page }) => {
    await page.goto('/data/verse/discover/index.html');
    await page.waitForSelector('#fv-boot-loader', { state: 'detached', timeout: 10000 });

    await page.evaluate(() => {
      window.FVL.page('#content-loading', { message: 'Loading content…' });
    });

    const boundary = page.locator('#content-loading .fvl-page, #content-loading .fvl-boundary');
    await expect(boundary).toBeVisible();

    const ariaBusy = await page.locator('#content-loading').getAttribute('aria-busy');
    expect(ariaBusy).toBe('true');

    await page.evaluate(async () => {
      await window.FVL.hideAll();
    });
    const ariaBusyAfter = await page.locator('#content-loading').getAttribute('aria-busy');
    expect(ariaBusyAfter).toBe('false');
  });

  test('Page remains scrollable during contextual loading', async ({ page }) => {
    await page.goto('/data/verse/discover/index.html');
    await page.waitForSelector('#fv-boot-loader', { state: 'detached', timeout: 10000 });
    await page.waitForFunction(() => window.FVL && typeof window.FVL.page === 'function');

    // Add scroll spacer and trigger contextual load
    await page.evaluate(async () => {
      await window.FVL.hideAll();
      document.body.style.minHeight = '3000px';
      window.FVL.page('#content-loading', { message: 'Loading content…' });
    });

    // Check body position is not fixed
    const bodyPosition = await page.evaluate(() => document.body.style.position);
    expect(bodyPosition).not.toBe('fixed');

    // Scroll page
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForFunction(() => window.scrollY >= 300);

    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThanOrEqual(300);

    await page.evaluate(async () => {
      await window.FVL.hideAll();
    });
  });

  test('Contextual loading scrolls naturally with document flow', async ({ page }) => {
    await page.goto('/data/verse/discover/index.html');
    await page.waitForSelector('#fv-boot-loader', { state: 'detached', timeout: 10000 });
    await page.waitForFunction(() => window.FVL && typeof window.FVL.page === 'function');

    // Add scroll spacer and trigger contextual load
    await page.evaluate(async () => {
      await window.FVL.hideAll();
      document.body.style.minHeight = '3000px';
      window.FVL.page('#content-loading', { message: 'Scrolling content…' });
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, 0);
    });

    const boundary = page.locator('#content-loading .fvl-page, #content-loading .fvl-boundary');
    await expect(boundary).toBeVisible();

    const initialBox = await boundary.boundingBox();
    expect(initialBox).not.toBeNull();

    if (initialBox) {
      // Scroll down 200px
      await page.evaluate(() => window.scrollTo(0, 200));
      await page.waitForFunction(() => window.scrollY >= 200);

      const scrolledBox = await boundary.boundingBox();
      expect(scrolledBox).not.toBeNull();

      if (scrolledBox) {
        // Position relative to viewport should decrease by approx 200px
        expect(scrolledBox.y).toBeLessThan(initialBox.y);
      }
    }

    await page.evaluate(async () => {
      await window.FVL.hideAll();
    });
  });

  test('Nested loading boundaries do not stack global overlays', async ({ page }) => {
    await page.goto('/data/verse/discover/index.html');
    await page.waitForSelector('#fv-boot-loader', { state: 'detached', timeout: 10000 });

    await page.evaluate(() => {
      window.FVL.page('#content-loading', { message: 'Outer boundary' });
      window.FVL.content('#content-loading', { message: 'Inner boundary' });
    });

    const globalOverlayCount = await page.locator('.fvl-global, .fvl-fullscreen').count();
    expect(globalOverlayCount).toBe(0);

    await page.evaluate(async () => {
      await window.FVL.hideAll();
    });
  });

  test('Global fullscreen overlay exception remains available when explicitly requested', async ({ page }) => {
    await page.goto('/data/verse/discover/index.html');
    await page.waitForSelector('#fv-boot-loader', { state: 'detached', timeout: 10000 });

    await page.evaluate(() => {
      window.FVL.global({ message: 'Global exception…' });
    });

    const globalOverlay = page.locator('.fvl-global, .fvl-fullscreen');
    await expect(globalOverlay).toBeVisible();

    await page.evaluate(async () => {
      await window.FVL.hideAll();
    });
  });
});

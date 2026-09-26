import { test, expect } from '@playwright/test';

test.describe('In-Flow Contextual Loading E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Grant permissions and set initial desktop viewport
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
      const btn = document.createElement('button');
      btn.id = 'e2e-btn';
      btn.textContent = 'Action';
      document.body.appendChild(btn);
      window.FVL.component('#e2e-btn', { message: 'Syncing…' });
    });
    const compLoader = page.locator('#e2e-btn .fvl-component, #e2e-btn .fvl-inline');
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
    await page.waitForFunction(() => window.FVL && typeof window.FVL.global === 'function');

    // Test explicit global overlay on mobile viewport resize
    await page.evaluate(() => {
      window.FVL.global({ message: 'Syncing…', lockScroll: true, instant: true });
    });

    const globalOverlay = page.locator('.fvl-global, .fvl-fullscreen');
    await expect(globalOverlay).toBeVisible();

    // Simulate URL bar toggle (height change 667 -> 600)
    await page.setViewportSize({ width: 375, height: 600 });

    const overlayBox = await globalOverlay.boundingBox();
    expect(overlayBox).not.toBeNull();
    if (overlayBox) {
      expect(overlayBox.height).toBeGreaterThanOrEqual(600);
    }

    await page.evaluate(async () => {
      await window.FVL.hideAll();
    });
  });

  test('Boot sequence renders in-flow inside #content-loading with interactive header/nav', async ({ page }) => {
    const response = await page.goto('/data/verse/discover/index.html');
    const html = await response?.text();

    // Boot loader exists inside #content-loading in SSG HTML
    expect(html).toContain('id="content-loading"');
    expect(html).toContain('id="fv-boot-loader"');
    expect(html).toMatch(/id="content-loading"[\s\S]*?id="fv-boot-loader"/);

    // Wait for page hydration
    await page.waitForSelector('#fv-boot-loader', { state: 'detached', timeout: 10000 });

    // Header and navigation controls are interactive
    const headerNav = page.locator('.fv-nav');
    await expect(headerNav).toBeVisible();

    const pointerEvents = await headerNav.evaluate((el) => window.getComputedStyle(el).pointerEvents);
    expect(pointerEvents).not.toBe('none');
  });

  test('Contextual loading is visible inside content area', async ({ page }) => {
    await page.goto('/data/verse/discover/index.html');
    await page.waitForSelector('#fv-boot-loader', { state: 'detached', timeout: 10000 });
    await page.waitForFunction(() => window.FVL && typeof window.FVL.page === 'function');

    // Trigger contextual loading inside content area via FVL API
    await page.evaluate(() => {
      window.FVL.page('#content-loading', { message: 'Loading section…' });
    });

    // Verify page loader element is rendered inside target container
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

    // Get initial bounding rect relative to viewport
    const initialBox = await boundary.boundingBox();
    expect(initialBox).not.toBeNull();

    if (initialBox) {
      const initialY = initialBox.y;

      // Scroll down 200px
      await page.evaluate(() => window.scrollTo(0, 200));
      await page.waitForFunction(() => window.scrollY >= 200);

      const scrolledBox = await boundary.boundingBox();
      expect(scrolledBox).not.toBeNull();

      if (scrolledBox) {
        // Element's viewport Y should decrease as page scrolls down
        expect(scrolledBox.y).toBeLessThan(initialY);
      }
    }

    await page.evaluate(async () => {
      await window.FVL.hideAll();
    });
  });

  test('Nested loading boundaries do not stack global overlays', async ({ page }) => {
    await page.goto('/data/verse/discover/index.html');
    await page.waitForSelector('#fv-boot-loader', { state: 'detached', timeout: 10000 });
    await page.waitForFunction(() => window.FVL && typeof window.FVL.page === 'function');

    // Setup nested DOM structure
    await page.evaluate(() => {
      const parent = document.querySelector('#content-loading');
      if (parent) {
        const child = document.createElement('div');
        child.id = 'nested-child-container';
        parent.appendChild(child);
      }

      // Trigger parent page loader
      window.FVL.page('#content-loading', { message: 'Parent loading…' });
      // Trigger nested child content loader
      window.FVL.content('#nested-child-container', { message: 'Child loading…' });
    });

    // Ensure no fullscreen/global overlay exists
    const fullscreenOverlay = page.locator('.fvl-fullscreen, .fvl-global');
    await expect(fullscreenOverlay).not.toBeAttached();

    // Both loader elements should exist in their respective containers
    const parentBoundary = page.locator('#content-loading > .fvl-page, #content-loading > .fvl-boundary');
    const childBoundary = page.locator('#nested-child-container > .fvl-content, #nested-child-container > .fvl-boundary');
    await expect(parentBoundary).toBeVisible();
    await expect(childBoundary).toBeVisible();

    await page.evaluate(async () => {
      await window.FVL.hideAll();
    });
  });

  test('Global fullscreen overlay exception remains available when explicitly requested', async ({ page }) => {
    await page.goto('/data/verse/discover/index.html');
    await page.waitForSelector('#fv-boot-loader', { state: 'detached', timeout: 10000 });
    await page.waitForFunction(() => window.FVL && typeof window.FVL.global === 'function');

    // Explicitly invoke global exception
    await page.evaluate(() => {
      window.FVL.global({ message: 'Critical Sync…', instant: true });
    });

    const fullscreenOverlay = page.locator('.fvl-global, .fvl-fullscreen');
    await expect(fullscreenOverlay).toBeVisible();

    const zIndex = await fullscreenOverlay.evaluate((el) => window.getComputedStyle(el).zIndex);
    expect(parseInt(zIndex, 10)).toBeGreaterThanOrEqual(17000);

    const bodyPos = await page.evaluate(() => document.body.style.position);
    expect(bodyPos).toBe('fixed');

    await page.evaluate(async () => {
      await window.FVL.hideAll();
    });
  });
});

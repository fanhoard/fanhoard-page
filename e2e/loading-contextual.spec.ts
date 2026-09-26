import { test, expect } from '@playwright/test';

test.describe('In-Flow Contextual Loading E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('fv_noupdate', '1');
      localStorage.setItem('fv_dismissed_v2.3.0', '1');
    });
  });

  test('Contextual loading is visible inside content area', async ({ page }) => {
    await page.goto('/data/verse/discover/index.html');
    await page.waitForSelector('#fv-boot-loader', { state: 'detached', timeout: 10000 });

    // Trigger contextual loading inside content area via FVL API
    await page.evaluate(() => {
      window.FVL.boundary('#content-loading', { message: 'Loading section…' });
    });

    // Verify boundary element is rendered inside target container
    const boundary = page.locator('#content-loading .fvl-boundary');
    await expect(boundary).toBeVisible();

    const ariaBusy = await page.locator('#content-loading').getAttribute('aria-busy');
    expect(ariaBusy).toBe('true');

    // Clean up loading state
    await page.evaluate(() => {
      window.FVL.hideAll();
    });
    await expect(boundary).not.toBeAttached();
  });

  test('Page remains scrollable during contextual loading', async ({ page }) => {
    await page.goto('/data/verse/discover/index.html');
    await page.waitForSelector('#fv-boot-loader', { state: 'detached', timeout: 10000 });

    // Set page content height so page is scrollable
    await page.evaluate(() => {
      const spacer = document.createElement('div');
      spacer.id = 'e2e-scroll-spacer';
      spacer.style.height = '2000px';
      document.body.appendChild(spacer);

      window.FVL.boundary('#content-loading', { message: 'Loading content…' });
    });

    // Check body position is not fixed
    const bodyPos = await page.evaluate(() => document.body.style.position);
    expect(bodyPos).not.toBe('fixed');

    // Attempt scrolling
    await page.evaluate(() => window.scrollTo(0, 400));
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBe(400);

    await page.evaluate(() => window.FVL.hideAll());
  });

  test('Contextual loading scrolls naturally with document flow', async ({ page }) => {
    await page.goto('/data/verse/discover/index.html');
    await page.waitForSelector('#fv-boot-loader', { state: 'detached', timeout: 10000 });

    await page.evaluate(() => {
      const spacer = document.createElement('div');
      spacer.id = 'e2e-scroll-spacer';
      spacer.style.height = '2000px';
      document.body.appendChild(spacer);

      window.FVL.boundary('#content-loading', { message: 'Scrolling content…' });
      window.scrollTo(0, 0);
    });

    const boundary = page.locator('#content-loading .fvl-boundary');
    await expect(boundary).toBeVisible();

    // Get initial bounding rect relative to viewport
    const initialBox = await boundary.boundingBox();
    expect(initialBox).not.toBeNull();

    // Scroll down 250px
    await page.evaluate(() => window.scrollTo(0, 250));

    // Get new bounding rect
    const scrolledBox = await boundary.boundingBox();
    expect(scrolledBox).not.toBeNull();

    // In normal document flow, box.y decreases by exactly the scroll amount (~250px)
    if (initialBox && scrolledBox) {
      expect(Math.round(scrolledBox.y)).toBe(Math.round(initialBox.y - 250));
    }

    await page.evaluate(() => window.FVL.hideAll());
  });

  test('Nested loading boundaries do not stack global overlays', async ({ page }) => {
    await page.goto('/data/verse/discover/index.html');
    await page.waitForSelector('#fv-boot-loader', { state: 'detached', timeout: 10000 });

    await page.evaluate(() => {
      // Create child nested container inside #content-loading
      const parent = document.querySelector('#content-loading');
      if (parent) {
        const child = document.createElement('div');
        child.id = 'nested-child-container';
        parent.appendChild(child);
      }

      // Trigger parent boundary
      window.FVL.boundary('#content-loading', { message: 'Parent loading…' });
      // Trigger nested child boundary
      window.FVL.boundary('#nested-child-container', { message: 'Child loading…' });
    });

    // Ensure no fullscreen overlay exists
    const fullscreenOverlay = page.locator('.fvl-fullscreen');
    await expect(fullscreenOverlay).not.toBeAttached();

    // Both boundary elements should exist in their respective containers
    const parentBoundary = page.locator('#content-loading > .fvl-boundary');
    const childBoundary = page.locator('#nested-child-container > .fvl-boundary');
    await expect(parentBoundary).toBeVisible();
    await expect(childBoundary).toBeVisible();

    await page.evaluate(() => window.FVL.hideAll());
  });

  test('Global fullscreen overlay exception remains available when explicitly requested', async ({ page }) => {
    await page.goto('/data/verse/discover/index.html');
    await page.waitForSelector('#fv-boot-loader', { state: 'detached', timeout: 10000 });

    // Explicitly invoke fullscreen exception
    await page.evaluate(() => {
      window.FVL.fullscreen({ message: 'Critical Sync…', instant: true });
    });

    const fullscreenOverlay = page.locator('.fvl-fullscreen');
    await expect(fullscreenOverlay).toBeVisible();

    const zIndex = await fullscreenOverlay.evaluate((el) => window.getComputedStyle(el).zIndex);
    expect(parseInt(zIndex, 10)).toBeGreaterThanOrEqual(17000);

    await page.evaluate(() => window.FVL.hideAll());
    await expect(fullscreenOverlay).not.toBeAttached();
  });
});

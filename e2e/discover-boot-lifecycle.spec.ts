import { test, expect } from '@playwright/test';

test.describe('Discover Initial Navigation & Refresh Loading Lifecycle', () => {
  async function setupBootMonitor(page: any) {
    await page.addInitScript(() => {
      window.__bootOverlayEvents = [];
      const logEvent = (name: string, detail?: any) => {
        window.__bootOverlayEvents.push({ time: performance.now(), name, detail });
      };

      const observer = new MutationObserver(mutations => {
        for (const m of mutations) {
          for (const node of Array.from(m.addedNodes)) {
            if (node instanceof HTMLElement) {
              if (node.id === 'nc-early-overlay') {
                logEvent('nc-early-overlay-added');
              }
              if (node.id === 'fv-boot-loader') {
                logEvent('fv-boot-loader-added');
              }
              if (node.classList?.contains('fvl-fullscreen')) {
                logEvent('fvl-fullscreen-added');
              }
            }
          }
          for (const node of Array.from(m.removedNodes)) {
            if (node instanceof HTMLElement) {
              if (node.id === 'nc-early-overlay') logEvent('nc-early-overlay-removed');
              if (node.id === 'fv-boot-loader') logEvent('fv-boot-loader-removed');
              if (node.classList?.contains('fvl-fullscreen')) {
                logEvent('fvl-fullscreen-removed');
              }
            }
          }
        }
      });

      const observeRoot = () => {
        if (document.documentElement) {
          observer.observe(document.documentElement, { childList: true, subtree: true });
        }
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', observeRoot, { once: true });
      } else {
        observeRoot();
      }
    });
  }

  const contentSelector = '#content-loading .cm-group, #content-loading .card, #content-loading .button-content, #content-loading [data-content], #content-loading .pl-grid-skeleton';

  test('Desktop: Single continuous boot overlay phase through ready content on initial load and refresh', async ({ page }) => {
    await setupBootMonitor(page);

    // 1. Initial Boot Navigation
    await page.goto('/data/verse/discover/index.html');
    await page.waitForSelector(contentSelector, { timeout: 10000 });

    const contentHTML = await page.locator('#content-loading').innerHTML();
    expect(contentHTML.trim().length).toBeGreaterThan(0);

    await page.waitForSelector('#fv-boot-loader', { state: 'detached', timeout: 5000 });

    let events = await page.evaluate(() => window.__bootOverlayEvents || []);
    expect(events.filter((e: any) => e.name === 'nc-early-overlay-added')).toHaveLength(0);
    expect(events.filter((e: any) => e.name === 'fvl-fullscreen-added')).toHaveLength(0);
    expect(events.filter((e: any) => e.name === 'fv-boot-loader-added')).toHaveLength(0);

    // 2. Refresh Navigation
    await page.evaluate(() => { window.__bootOverlayEvents = []; });
    await page.reload();

    await page.waitForSelector(contentSelector, { timeout: 10000 });
    const refreshContentHTML = await page.locator('#content-loading').innerHTML();
    expect(refreshContentHTML.trim().length).toBeGreaterThan(0);

    await page.waitForSelector('#fv-boot-loader', { state: 'detached', timeout: 5000 });

    events = await page.evaluate(() => window.__bootOverlayEvents || []);
    expect(events.filter((e: any) => e.name === 'nc-early-overlay-added')).toHaveLength(0);
    expect(events.filter((e: any) => e.name === 'fvl-fullscreen-added')).toHaveLength(0);
    expect(events.filter((e: any) => e.name === 'fv-boot-loader-added')).toHaveLength(0);
  });

  test('Mobile Viewport: Single continuous boot overlay phase through ready content', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await setupBootMonitor(page);

    await page.goto('/data/verse/discover/index.html');
    await page.waitForSelector(contentSelector, { timeout: 10000 });

    const contentHTML = await page.locator('#content-loading').innerHTML();
    expect(contentHTML.trim().length).toBeGreaterThan(0);

    await page.waitForSelector('#fv-boot-loader', { state: 'detached', timeout: 5000 });

    const events = await page.evaluate(() => window.__bootOverlayEvents || []);
    expect(events.filter((e: any) => e.name === 'nc-early-overlay-added')).toHaveLength(0);
    expect(events.filter((e: any) => e.name === 'fvl-fullscreen-added')).toHaveLength(0);
    expect(events.filter((e: any) => e.name === 'fv-boot-loader-added')).toHaveLength(0);
  });
});

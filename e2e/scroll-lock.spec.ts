/**
 * e2e/scroll-lock.spec.ts — Unified Scroll-Lock Core verification.
 *
 * Verifies the EFFECTIVE DOM state (not internal flags) that every
 * screen-covering overlay locks background scroll and releases it
 * correctly — including stacked overlays, where one system's close
 * must not destroy another system's still-open lock.
 *
 * Covers: FVL fullscreen (LoadingService), PopupSystem, Search overlay.
 */
import { test, expect } from '@playwright/test';

const BOOT_SETTLE = 30000;

/** First-time visitors get the "new update" blocking popup — a legitimate
 *  screen-covering overlay. Dismiss it so the tests measure OUR overlays. */
async function dismissUpdatePopup(page: any) {
  try {
    await page.waitForSelector('.fp-popup.fp-is-open', { timeout: 4000 });
    await page.locator('[data-fp-action="dismiss"]').first().click();
    await page.waitForSelector('.fp-blocking', { state: 'detached', timeout: 5000 });
  } catch {
    // popup not shown on this visit — proceed
  }
}

/** Wait until the page's content height is stable — loading overlays must
 *  not fight an inflating/deflating document when they restore scroll. */
async function waitContentStable(page: any) {
  await page.waitForFunction(() => document.readyState === 'complete', null, { timeout: BOOT_SETTLE });
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        let last = -1;
        let stable = 0;
        const id = setInterval(() => {
          const h = document.documentElement.scrollHeight;
          if (h === last) {
            stable += 100;
            if (stable >= 700) { clearInterval(id); resolve(null); }
          } else { stable = 0; last = h; }
        }, 100);
        setTimeout(() => { clearInterval(id); resolve(null); }, 10000);
      })
  );
}

/** Scroll to target and return the actual settled offset. The page has an
 *  async scroll-adjust (snap/anchor) — an immediate read returns a
 *  mid-transition value, so wait for the offset to settle first. */
async function scrollToCapture(page: any, target: number) {
  await page.evaluate((t) => { window.scrollTo(0, t); }, target);
  await page.waitForTimeout(400);
  return page.evaluate(() => window.scrollY);
}

async function waitForUnlocked(page: any, timeout = BOOT_SETTLE) {
  await page.waitForFunction(
    () => !document.documentElement.hasAttribute('data-scroll-locked'),
    null,
    { timeout }
  );
}

async function expectLocked(page: any, minCount = 1) {
  await page.waitForFunction(
    () => document.documentElement.hasAttribute('data-scroll-locked'),
    null,
    { timeout: 5000 }
  );
  const state = await page.evaluate((min: number) => {
    const core = (window as any).ScrollLockCore;
    return {
      bodyPosition: getComputedStyle(document.body).position,
      htmlOverflow: getComputedStyle(document.documentElement).overflow,
      coreCount: core ? core.getLockCount() : -1,
      coreOwners: core ? core.getState().owners : [],
    };
  }, minCount);
  expect(state.bodyPosition).toBe('fixed');
  expect(state.htmlOverflow).toBe('hidden');
  expect(state.coreCount).toBeGreaterThanOrEqual(minCount);
  return state;
}

async function expectScrollFrozen(page: any) {
  // While locked, body is position:fixed — scroll position must be pinned
  // and immune to wheel / keyboard scroll attempts (effective behavior).
  const y = await page.evaluate(() => {
    window.dispatchEvent(new WheelEvent('wheel', { deltaY: 800, cancelable: true }));
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'PageDown', keyCode: 34, cancelable: true, bubbles: true,
      })
    );
    return window.scrollY;
  });
  expect(y).toBe(0);
}

test.describe('Unified Scroll-Lock Core', () => {
  test('fullscreen loading overlay locks scroll and restores position after hide', async ({ page }) => {
    await page.goto('/data/verse/discover/');
    await page.waitForFunction(
      () => (window as any).showInstantLoadingOverlay !== undefined,
      null, { timeout: BOOT_SETTLE }
    );
    await dismissUpdatePopup(page);
    await waitForUnlocked(page);
    await waitContentStable(page);

    const savedY = await scrollToCapture(page, 600);
    expect(savedY).toBeGreaterThan(0);

    const handleId = await page.evaluate(() => {
      const h = (window as any).showInstantLoadingOverlay({ message: 'e2e-lock-probe' });
      return h && h.id ? h.id : 'fvl-default-fullscreen';
    });
    const st = await expectLocked(page, 1);
    expect(st.coreOwners).toContain('fvl');
    await expectScrollFrozen(page);

    await page.evaluate((id: string) =>
      (window as any).removeInstantLoadingOverlay(id)
    , handleId);
    await waitForUnlocked(page, 10000);
    // Scroll position restored after unlock — no lost reading position.
    await expect
      .poll(() => page.evaluate((s) => Math.abs(window.scrollY - s) <= 2, savedY), { timeout: 5000 })
      .toBe(true);
  });

  test('popup close must not destroy the still-open loading overlay lock', async ({ page }) => {
    await page.goto('/data/verse/discover/');
    await page.waitForFunction(
      () =>
        (window as any).showInstantLoadingOverlay !== undefined &&
        (window as any).PopupSystem !== undefined,
      null, { timeout: BOOT_SETTLE }
    );
    await dismissUpdatePopup(page);
    await waitForUnlocked(page);
    await waitContentStable(page);

    const savedY = await scrollToCapture(page, 600);
    expect(savedY).toBeGreaterThan(0);

    // Layer 1: fullscreen loading overlay owns a lock.
    const handleId = await page.evaluate(() => {
      const h = (window as any).showInstantLoadingOverlay({ message: 'e2e-stack-base' });
      return h && h.id ? h.id : 'fvl-default-fullscreen';
    });
    await expectLocked(page, 1);

    // Layer 2: popup stacks on top — two live lock references.
    await page.evaluate(async () => {
      (window as any).__e2ePopup = await (window as any).PopupSystem.open({
        type: 'dialog',
        title: 'E2E Stack Probe',
        content: 'Stacked scroll-lock verification',
      });
    });
    await page.waitForSelector('.fp-popup.fp-is-open', { timeout: 5000 });
    const stacked = await expectLocked(page, 2);
    expect(stacked.coreOwners).toEqual(expect.arrayContaining(['fvl', 'popup']));
    await expectScrollFrozen(page);

    // THE regression class: closing the popup used to reset body/html
    // styles outright, destroying the loading overlay's lock. It must
    // still be locked here.
    await page.evaluate(async () => {
      const h = (window as any).__e2ePopup;
      if (h && typeof h.close === 'function') await h.close();
    });
    await page.waitForSelector('.fp-popup.fp-is-open', { state: 'detached', timeout: 5000 });
    const afterPopupClose = await expectLocked(page, 1);
    expect(afterPopupClose.coreOwners).toContain('fvl');
    expect(afterPopupClose.coreOwners).not.toContain('popup');
    await expectScrollFrozen(page);

    // Final unlock restores scroll.
    await page.evaluate((id: string) =>
      (window as any).removeInstantLoadingOverlay(id)
    , handleId);
    await waitForUnlocked(page, 10000);
    await expect
      .poll(() => page.evaluate((s) => Math.abs(window.scrollY - s) <= 2, savedY), { timeout: 5000 })
      .toBe(true);
  });

  test('search overlay locks scroll through the shared core and restores position', async ({ page }) => {
    await page.goto('/search/');
    await page.waitForFunction(
      () =>
        (window as any).SearchModules?.OverlayService &&
        (window as any).ScrollLockCore,
      null, { timeout: BOOT_SETTLE }
    );
    await dismissUpdatePopup(page);
    await waitForUnlocked(page);
    await waitContentStable(page);

    const savedY = await scrollToCapture(page, 600);
    expect(savedY).toBeGreaterThan(0);

    await page.evaluate(() => (window as any).SearchModules.OverlayService.open());
    await page.waitForFunction(
      () => document.querySelector('#search-overlay-container') !== null,
      null, { timeout: 5000 }
    );
    const st = await expectLocked(page, 1);
    expect(st.coreOwners).toContain('search');

    await page.evaluate(() => (window as any).SearchModules.OverlayService.close('manual'));
    await waitForUnlocked(page, 10000);
    // The search page is short at boot, so restore is checked with a small
    // layout-shift tolerance instead of pixel-exact matching.
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 5000 })
      .toBeGreaterThan(Math.max(0, savedY - 60));
  });
});

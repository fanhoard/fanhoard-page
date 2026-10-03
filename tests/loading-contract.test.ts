import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Central Loader Architecture & Loading Contract (FVL)', () => {
  beforeEach(() => {
    // Reset window and document DOM
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.documentElement.style.overflow = '';
    document.documentElement.style.overscrollBehavior = '';
    if ((window as any).FVLModules && (window as any).FVLModules.Utils && (window as any).FVLModules.Utils.ScrollLockManager) {
      (window as any).FVLModules.Utils.ScrollLockManager.reset();
    }

    // Clear globals
    delete (window as any).FVL;
    delete (window as any).FLV;
    delete (window as any).FVLModules;
    delete (window as any).NavCoreModules;
    delete (window as any).showInstantLoadingOverlay;
    delete (window as any).removeInstantLoadingOverlay;
    delete (window as any)._navCore_contentLoadingManager;

    // Load fvl.js source code into window scope
    const fvlCode = fs.readFileSync(path.resolve(__dirname, '../assets/js/loading-system/fvl.js'), 'utf-8');
    const runScript = new Function('window', 'document', 'localStorage', fvlCode);
    runScript(window, document, window.localStorage);

    // Load loading.js source code into window scope
    const loadingCode = fs.readFileSync(path.resolve(__dirname, '../assets/js/nav-core-modules/loading.js'), 'utf-8');
    const runLoading = new Function('window', 'document', 'localStorage', loadingCode);
    runLoading(window, document, window.localStorage);
  });

  afterEach(() => {
    if ((window as any).FVL && typeof (window as any).FVL.hideAll === 'function') {
      (window as any).FVL.hideAll();
    }
  });

  describe('Namespace & Alias Contract', () => {
    it('provides window.FVL and window.FLV alias', () => {
      expect((window as any).FVL).toBeDefined();
      expect((window as any).FLV).toBeDefined();
      expect((window as any).FLV).toBe((window as any).FVL);
    });

    it('exports version, show, hide, hideInstant, scoped, inline, topbar, readinessHandshake', () => {
      const FVL = (window as any).FVL;
      expect(typeof FVL.show).toBe('function');
      expect(typeof FVL.hide).toBe('function');
      expect(typeof FVL.hideInstant).toBe('function');
      expect(typeof FVL.scoped).toBe('function');
      expect(typeof FVL.inline).toBe('function');
      expect(typeof FVL.topbar).toBe('function');
      expect(typeof FVL.readinessHandshake).toBe('function');
    });
  });


  describe('Boot Loader Adoption & Scroll Lock Contract (Inverted Bug Fix)', () => {
    it('locks page DURING boot loader adoption and UNLOCKS page after readinessHandshake', async () => {
      // 1. Setup boot loader in DOM before show() adoption
      const bootLoader = document.createElement('div');
      bootLoader.id = 'fv-boot-loader';
      document.body.appendChild(bootLoader);

      const LoadingService = (window as any).NavCoreModules.LoadingService;
      const ScrollLockManager = (window as any).FVLModules.Utils.ScrollLockManager;

      // Adopt boot loader via LoadingService.show()
      const handle = LoadingService.show({ mode: 'fullscreen' });
      expect(handle).toBeDefined();

      // Assert locked DURING loading phase
      expect(ScrollLockManager.getLockCount()).toBeGreaterThan(0);
      expect(document.body.style.position).toBe('fixed');
      expect(document.documentElement.style.overflow).toBe('hidden');

      // Call readinessHandshake to finish loading
      await LoadingService.readinessHandshake();

      // Assert UNLOCKED AFTER loading phase disappears
      expect(ScrollLockManager.getLockCount()).toBe(0);
      expect(document.body.style.position).toBe('');
      expect(document.documentElement.style.overflow).toBe('');
      expect(document.getElementById('fv-boot-loader')).toBeNull();
    });

    it('handles double-show adoption with a single handshake without leaking scroll lock', async () => {
      const bootLoader = document.createElement('div');
      bootLoader.id = 'fv-boot-loader';
      document.body.appendChild(bootLoader);

      const LoadingService = (window as any).NavCoreModules.LoadingService;
      const ScrollLockManager = (window as any).FVLModules.Utils.ScrollLockManager;

      // Two show calls adopting boot loader
      const h1 = LoadingService.show({ mode: 'fullscreen' });
      const h2 = LoadingService.show({ mode: 'fullscreen' });

      expect(ScrollLockManager.getLockCount()).toBeGreaterThan(0);
      expect(document.body.style.position).toBe('fixed');

      // First hide decrements session count, boot remains active
      await h1.hide();
      expect(ScrollLockManager.getLockCount()).toBeGreaterThan(0);
      expect(document.body.style.position).toBe('fixed');

      // Second hide triggers readinessHandshake and unlocks
      await h2.hide();
      expect(ScrollLockManager.getLockCount()).toBe(0);
      expect(document.body.style.position).toBe('');
      expect(document.documentElement.style.overflow).toBe('');
      expect(document.getElementById('fv-boot-loader')).toBeNull();
    });

    it('locks page as early as module init when boot loader is visible without any show() call, then unlocks on handshake', async () => {
      // Clear DOM and add boot loader BEFORE module load
      document.body.innerHTML = '';
      const bootLoader = document.createElement('div');
      bootLoader.id = 'fv-boot-loader';
      document.body.appendChild(bootLoader);

      const LoadingService = (window as any).NavCoreModules.LoadingService;
      const ScrollLockManager = (window as any).FVLModules.Utils.ScrollLockManager;

      // Trigger early lock (simulating module load lock check)
      LoadingService._ensureBootLock();

      // Assert locked DURING boot phase
      expect(ScrollLockManager.getLockCount()).toBeGreaterThan(0);
      expect(document.body.style.position).toBe('fixed');
      expect(document.documentElement.style.overflow).toBe('hidden');

      // Handshake without any show() call
      await LoadingService.readinessHandshake();

      // Assert page is unlocked after
      expect(ScrollLockManager.getLockCount()).toBe(0);
      expect(document.body.style.position).toBe('');
      expect(document.documentElement.style.overflow).toBe('');
      expect(document.getElementById('fv-boot-loader')).toBeNull();
    });

    it('locks DURING normal FVL.show() and unlocks AFTER FVL.hide() when no boot loader is present', async () => {
      const FVL = (window as any).FVL;
      const ScrollLockManager = (window as any).FVLModules.Utils.ScrollLockManager;

      // Ensure no boot loader in DOM
      expect(document.getElementById('fv-boot-loader')).toBeNull();

      const handle = FVL.show({ instant: true });
      expect(ScrollLockManager.getLockCount()).toBeGreaterThan(0);
      expect(document.body.style.position).toBe('fixed');
      expect(document.documentElement.style.overflow).toBe('hidden');

      await handle.hideInstant();
      expect(ScrollLockManager.getLockCount()).toBe(0);
      expect(document.body.style.position).toBe('');
      expect(document.documentElement.style.overflow).toBe('');
    });
  });

  describe('Readiness Handshake Contract', () => {
    it('cleans up competing boot overlays in a single phase handshake', async () => {
      // Set up competing boot elements in DOM
      const bootLoader = document.createElement('div');
      bootLoader.id = 'fv-boot-loader';
      document.body.appendChild(bootLoader);

      const earlyOverlay = document.createElement('div');
      earlyOverlay.id = 'nc-early-overlay';
      const earlyMsg = document.createElement('div');
      earlyMsg.id = 'nc-early-msg';
      earlyMsg.textContent = 'Loading…';
      earlyOverlay.appendChild(earlyMsg);
      document.body.appendChild(earlyOverlay);

      const FVL = (window as any).FVL;
      // Active default loader
      FVL.show({ instant: true });
      expect(FVL.isActive()).toBe(true);

      // Perform readiness handshake
      const result = await FVL.readinessHandshake();

      expect(result.success).toBe(true);
      expect(document.getElementById('fv-boot-loader')).toBeNull();
      expect(document.getElementById('nc-early-overlay')).toBeNull();
      expect(document.getElementById('nc-early-msg')).toBeNull();
      expect(FVL.isActive()).toBe(false);
    });
  });

  describe('Scoped & Inline Loading with ARIA busy attributes', () => {
    it('sets aria-busy="true" on target during scoped loading and resets to "false" on hide', async () => {
      const target = document.createElement('div');
      target.id = 'content-loading';
      document.body.appendChild(target);

      const FVL = (window as any).FVL;
      const handle = FVL.scoped({ target: '#content-loading', instant: true });

      expect(handle).not.toBeNull();
      expect(target.getAttribute('aria-busy')).toBe('true');

      await handle.hide();
      expect(target.getAttribute('aria-busy')).toBe('false');
    });

    it('clears target aria-busy attribute from "true" to "false" on hideInstant', async () => {
      const target = document.createElement('div');
      target.id = 'content-loading';
      document.body.appendChild(target);

      const LoadingService = (window as any).NavCoreModules.LoadingService;
      const handle = LoadingService.showInContent({ message: 'Loading symbols…' });

      expect(handle).toBeDefined();
      expect(target.getAttribute('aria-busy')).toBe('true');

      await LoadingService.hideInstant(handle.id);
      expect(target.getAttribute('aria-busy')).toBe('false');
    });

    it('FVL.hideInstant is idempotent and clears target aria-busy', async () => {
      const target = document.createElement('div');
      target.id = 'content-loading';
      document.body.appendChild(target);

      const FVL = (window as any).FVL;
      const handle = FVL.scoped({ target: '#content-loading', instant: true });

      expect(target.getAttribute('aria-busy')).toBe('true');

      await FVL.hideInstant(handle.id);
      expect(target.getAttribute('aria-busy')).toBe('false');

      // Second call should be idempotent without throwing
      await FVL.hideInstant(handle.id);
      expect(target.getAttribute('aria-busy')).toBe('false');
    });

    it('supports string target parameter in FVL.scoped and FVL.inline shortcuts', async () => {
      const btn = document.createElement('button');
      btn.id = 'symbols-btn';
      btn.textContent = 'Symbols';
      document.body.appendChild(btn);

      const FVL = (window as any).FVL;
      const handle = FVL.inline('#symbols-btn');

      expect(handle).not.toBeNull();
      expect(btn.getAttribute('aria-busy')).toBe('true');

      await handle.hide();
      expect(btn.getAttribute('aria-busy')).toBe('false');
    });
  });

  describe('Z-Index Hierarchy Tokens', () => {
    it('uses unified z-index tokens matching design contract', () => {
      const FVL = (window as any).FVL;
      const config = FVL.config();
      expect(config.Z_INDEX.topbar).toBe(17500);
      expect(config.Z_INDEX.fullscreen).toBe(17000);
      expect(config.Z_INDEX.scoped).toBe(1600);
      expect(config.Z_INDEX.inline).toBe(0);
    });
  });

  describe('Backward Compatibility Proxy Layer', () => {
    it('preserves LoadingService proxy and window legacy functions', async () => {
      const LoadingService = (window as any).NavCoreModules?.LoadingService || (window as any)._navCore_contentLoadingManager;
      expect(LoadingService).toBeDefined();

      LoadingService.show({ instant: true });
      expect(LoadingService.isShown()).toBe(true);

      await LoadingService.hide();
      expect(LoadingService.isShown()).toBe(false);

      expect(typeof (window as any).showInstantLoadingOverlay).toBe('function');
      expect(typeof (window as any).removeInstantLoadingOverlay).toBe('function');
    });

    it('supports content-scoped action loading via LoadingService.showInContent without body lock', async () => {
      const target = document.createElement('div');
      target.id = 'content-loading';
      document.body.appendChild(target);

      const LoadingService = (window as any).NavCoreModules.LoadingService;
      const handle = LoadingService.showInContent({ message: 'Loading symbols…' });

      expect(handle).toBeDefined();
      expect(target.getAttribute('aria-busy')).toBe('true');
      expect(document.body.style.position).not.toBe('fixed');

      await LoadingService.hideFromContent();
      expect(target.getAttribute('aria-busy')).toBe('false');
    });
  });

  describe('Router Nav-Loading Isolation Contract', () => {
    it('keeps header nav buttons visible and interactive when _setNavLoading is called', () => {
      const headerNav = document.createElement('nav');
      headerNav.className = 'fv-nav';
      const subNav = document.createElement('div');
      subNav.id = 'sub-nav';

      const header = document.createElement('header');
      header.appendChild(headerNav);
      document.body.appendChild(header);
      document.body.appendChild(subNav);

      // Load router.js
      (window as any).NavCoreModules = { CONFIG: { ALL_BUTTON: { URL: 'all' } }, State: { buttons: {} }, Utils: {} };
      const routerCode = fs.readFileSync(path.resolve(__dirname, '../assets/js/nav-core-modules/router.js'), 'utf-8');
      const runRouter = new Function('window', 'document', 'localStorage', routerCode);
      runRouter(window, document, window.localStorage);

      const RouterService = (window as any).NavCoreModules.RouterService;
      RouterService._setNavLoading(true);

      expect(document.body.classList.contains('nav-loading')).toBe(false);
      expect(headerNav.style.opacity).not.toBe('0');
      expect(headerNav.style.pointerEvents).not.toBe('none');
      expect(subNav.style.opacity).not.toBe('0');
      expect(subNav.style.pointerEvents).not.toBe('none');
    });
  });

  describe("FVL Part 1 Polish: Scroll Lock, Centered Spinners & Accessibility Polish", () => {
    // WHY previous tests gave false confidence:
    // Previous tests asserted internal flags and body.style.position = 'fixed' alone without asserting actual effective DOM state
    // on html/documentElement (which is the actual scrolling element in standard mode <!DOCTYPE html>), missing overflow: hidden
    // and overscroll-behavior: none on documentElement, missing touch-action: none on the overlay, missing non-passive wheel/touchmove
    // event prevention, and failing to verify all show entry paths.

    it("engages scroll-lock on BOTH html and body during fullscreen overlay and restores exact original state on hide", async () => {
      document.documentElement.style.overflow = "visible";
      document.body.style.position = "relative";
      document.body.style.color = "rgb(255, 0, 0)";

      const FVL = (window as any).FVL;
      FVL.show({ instant: true });

      // Effective DOM state check on both html (documentElement) and body
      expect(document.documentElement.style.overflow).toBe("hidden");
      expect(document.documentElement.style.overscrollBehavior).toBe("none");
      expect(document.body.style.position).toBe("fixed");
      expect(document.body.style.overflow).toBe("hidden");
      expect(document.body.style.width).toBe("100%");
      expect(document.body.style.overscrollBehavior).toBe("none");

      const overlay = document.querySelector('.fvl-fullscreen') as HTMLElement;
      expect(overlay).not.toBeNull();
      expect(overlay.style.touchAction).toBe("none");
      expect(overlay.style.overscrollBehavior).toBe("none");

      await FVL.hideInstant();

      expect(document.documentElement.style.overflow).toBe("visible");
      expect(document.body.style.position).toBe("relative");
      expect(document.body.style.overflow).toBe("");
      expect(document.body.style.top).toBe("");
    });

    it("engages scroll-lock on every fullscreen show() entry path", async () => {
      const FVL = (window as any).FVL;
      const LoadingService = (window as any).NavCoreModules.LoadingService;
      const showInstantOverlay = (window as any).showInstantLoadingOverlay;

      // Entry path 1: FVL.show() default fullscreen
      FVL.show({ instant: true });
      expect(document.documentElement.style.overflow).toBe("hidden");
      expect(document.body.style.position).toBe("fixed");
      await FVL.hideInstant();
      expect(document.documentElement.style.overflow).toBe("");
      expect(document.body.style.position).toBe("");

      // Entry path 2: FVL.show({ mode: 'fullscreen' })
      FVL.show({ mode: 'fullscreen', instant: true });
      expect(document.documentElement.style.overflow).toBe("hidden");
      expect(document.body.style.position).toBe("fixed");
      await FVL.hideInstant();
      expect(document.documentElement.style.overflow).toBe("");

      // Entry path 3: LoadingService.show()
      LoadingService.show({ instant: true });
      expect(document.documentElement.style.overflow).toBe("hidden");
      expect(document.body.style.position).toBe("fixed");
      await LoadingService.hideInstant();
      expect(document.documentElement.style.overflow).toBe("");

      // Entry path 4: showInstantLoadingOverlay()
      showInstantOverlay({ instant: true });
      expect(document.documentElement.style.overflow).toBe("hidden");
      expect(document.body.style.position).toBe("fixed");
      await FVL.hideInstant();
      expect(document.documentElement.style.overflow).toBe("");
    });

    it("intercepts wheel, touchmove, and keydown scroll events when scroll-locked", async () => {
      const FVL = (window as any).FVL;
      FVL.show({ instant: true });

      let wheelPrevented = false;
      const wheelEvent = new Event("wheel", { cancelable: true });
      wheelEvent.preventDefault = () => { wheelPrevented = true; };
      document.dispatchEvent(wheelEvent);
      expect(wheelPrevented).toBe(true);

      let touchPrevented = false;
      const touchEvent = new Event("touchmove", { cancelable: true });
      touchEvent.preventDefault = () => { touchPrevented = true; };
      document.dispatchEvent(touchEvent);
      expect(touchPrevented).toBe(true);

      let keyPrevented = false;
      const keyEvent = new KeyboardEvent("keydown", { key: "PageDown", cancelable: true });
      keyEvent.preventDefault = () => { keyPrevented = true; };
      document.dispatchEvent(keyEvent);
      expect(keyPrevented).toBe(true);

      await FVL.hideInstant();
    });

    it("handles nested overlays and ref-counting for scroll-lock", async () => {
      const FVL = (window as any).FVL;

      const h1 = FVL.show({ id: "fvl-1", instant: true });
      expect(document.body.style.position).toBe("fixed");
      expect(document.documentElement.style.overflow).toBe("hidden");

      const h2 = FVL.show({ id: "fvl-2", instant: true });
      expect(document.body.style.position).toBe("fixed");
      expect(document.documentElement.style.overflow).toBe("hidden");

      await h1.hideInstant();
      expect(document.body.style.position).toBe("fixed"); // still locked by h2
      expect(document.documentElement.style.overflow).toBe("hidden");

      await h2.hideInstant();
      expect(document.body.style.position).toBe(""); // unlocked
      expect(document.documentElement.style.overflow).toBe("");
    });

    it("centers mounted spinners by default and supports opt-out via options", () => {
      const FVLSpinner = (window as any).FVLSpinner;

      const c1 = document.createElement("div");
      c1.id = "c1";
      document.body.appendChild(c1);

      const h1 = FVLSpinner.mount("#c1");
      expect(h1.element.classList.contains("fvl-spinner--center")).toBe(true);

      const c2 = document.createElement("div");
      c2.id = "c2";
      document.body.appendChild(c2);

      const h2 = FVLSpinner.mount("#c2", { center: false });
      expect(h2.element.classList.contains("fvl-spinner--center")).toBe(false);

      const c3 = document.createElement("div");
      c3.id = "c3";
      document.body.appendChild(c3);

      const h3 = FVLSpinner.mount("#c3", { align: "left" });
      expect(h3.element.classList.contains("fvl-spinner--align-left")).toBe(true);
      expect(h3.element.classList.contains("fvl-spinner--center")).toBe(false);
    });

    it("renders centered spinner for bare scoped loader in #content-loading", () => {
      const target = document.createElement("div");
      target.id = "content-loading";
      document.body.appendChild(target);

      const FVL = (window as any).FVL;
      FVL.scoped({ target: "#content-loading", bare: true, instant: true });

      const spinner = target.querySelector(".fvl-spinner");
      expect(spinner?.classList.contains("fvl-spinner--center")).toBe(true);
    });

    it("sets role=\"dialog\" and aria-modal=\"true\" on fullscreen overlays and hides background siblings", async () => {
      const mainEl = document.createElement("main");
      mainEl.id = "main-content";
      document.body.appendChild(mainEl);

      const FVL = (window as any).FVL;
      FVL.show({ instant: true });

      const overlay = document.querySelector(".fvl-fullscreen");
      expect(overlay?.getAttribute("role")).toBe("dialog");
      expect(overlay?.getAttribute("aria-modal")).toBe("true");
      expect(mainEl.getAttribute("aria-hidden")).toBe("true");

      await FVL.hideInstant();
      expect(mainEl.getAttribute("aria-hidden")).toBeNull();
    });

    it("dismisses closable fullscreen overlay on Escape key press", async () => {
      const FVL = (window as any).FVL;
      FVL.show({ instant: true, closable: true });

      expect(FVL.isActive()).toBe(true);

      const event = new KeyboardEvent("keydown", { key: "Escape", keyCode: 27, bubbles: true });
      document.dispatchEvent(event);
      await Promise.resolve();

      expect(FVL.isActive()).toBe(false);
    });

    it("safely handles error paths during show/mount without leaking scroll lock", async () => {
      const FVL = (window as any).FVL;

      try {
        FVL.show({
          instant: true,
          onMount: () => {
            throw new Error("mount error");
          },
        });
      } catch (_) {}

      await FVL.hideAll();
      expect(document.body.style.position).toBe("");
    });
  });

});

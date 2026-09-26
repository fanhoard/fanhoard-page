import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Central Loader Architecture & Loading Contract (FVL & PLSys)', () => {
  beforeEach(() => {
    vi.useRealTimers();
    // Reset window and document DOM
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';

    // Clear globals
    delete (window as any).PLSys;
    delete (window as any).FVL;
    delete (window as any).FLV;
    delete (window as any).FVLModules;
    delete (window as any).NavCoreModules;
    delete (window as any).showInstantLoadingOverlay;
    delete (window as any).removeInstantLoadingOverlay;
    delete (window as any)._navCore_contentLoadingManager;
    delete (window as any).__PL_DEBUG__;
    try { localStorage.clear(); } catch (_) {}

    // Load plsys.js source code into window scope
    const plsysCode = fs.readFileSync(path.resolve(__dirname, '../assets/js/loading-system/plsys.js'), 'utf-8');
    const runPlsys = new Function('window', 'document', 'localStorage', 'globalThis', plsysCode);
    runPlsys(window, document, window.localStorage, window);

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
    if ((window as any).PLSys && typeof (window as any).PLSys.reset === 'function') {
      (window as any).PLSys.reset();
    }
    if ((window as any).FVL && typeof (window as any).FVL.hideAll === 'function') {
      (window as any).FVL.hideAll();
    }
    vi.useRealTimers();
  });

  describe('PLSys Core & FSM Transition Matrix', () => {
    it('exposes window.PLSys with required public API', () => {
      const PLSys = (window as any).PLSys;
      expect(PLSys).toBeDefined();
      expect(typeof PLSys.attach).toBe('function');
      expect(typeof PLSys.load).toBe('function');
      expect(typeof PLSys.invalidate).toBe('function');
      expect(typeof PLSys.getStatus).toBe('function');
      expect(typeof PLSys.reset).toBe('function');
      expect(PLSys.FSM_STATES).toBeDefined();
    });

    it('enforces deterministic states and rejects illegal state transitions', () => {
      const PLSys = (window as any).PLSys;
      const target = document.createElement('div');
      target.id = 'content-loading';
      document.body.appendChild(target);

      const ctrl = PLSys.attach(target);
      expect(ctrl.getState()).toBe('IDLE');

      // Attempt illegal transition from IDLE directly to CONTENT_READY
      const illegalResult = ctrl.transitionTo('CONTENT_READY', 'Illegal test');
      expect(illegalResult).toBe(false);
      expect(ctrl.getState()).toBe('IDLE');

      // Valid transition from IDLE to STAGED_SKELETON
      const validResult = ctrl.transitionTo('STAGED_SKELETON', 'Valid start');
      expect(validResult).toBe(true);
      expect(ctrl.getState()).toBe('STAGED_SKELETON');
      expect(target.getAttribute('aria-busy')).toBe('true');
    });

    it('transitions through STAGED_SKELETON -> CONTENT_READY on successful load', async () => {
      const PLSys = (window as any).PLSys;
      const container = document.createElement('div');
      container.id = 'test-container';
      document.body.appendChild(container);

      const fetcher = vi.fn().mockResolvedValue({ items: [1, 2, 3] });
      const renderer = vi.fn((data) => {
        container.textContent = `Rendered ${data.items.length} items`;
      });

      const promise = PLSys.load(container, fetcher, renderer, { key: 'test:load' });
      expect(PLSys.getStatus(container).state).toBe('STAGED_SKELETON');
      expect(container.getAttribute('aria-busy')).toBe('true');

      await promise;

      expect(PLSys.getStatus(container).state).toBe('CONTENT_READY');
      expect(container.getAttribute('aria-busy')).toBe('false');
      expect(container.textContent).toBe('Rendered 3 items');
      expect(renderer).toHaveBeenCalledWith({ items: [1, 2, 3] });
    });
  });

  describe('PLSys Timeout Manager & AbortController', () => {
    it('transitions to TIMEOUT_FALLBACK on soft timeout (3.5s)', async () => {
      vi.useFakeTimers();
      const PLSys = (window as any).PLSys;
      const container = document.createElement('div');
      container.id = 'test-timeout-soft';
      document.body.appendChild(container);

      const fetcher = () => new Promise((resolve) => setTimeout(resolve, 5000));
      const renderer = vi.fn();

      PLSys.load(container, fetcher, renderer, { key: 'test:soft', softTimeoutMs: 3500 });
      expect(PLSys.getStatus(container).state).toBe('STAGED_SKELETON');

      vi.advanceTimersByTime(3600);

      expect(PLSys.getStatus(container).state).toBe('TIMEOUT_FALLBACK');
      const topBar = document.getElementById('pl-top-progress');
      expect(topBar).not.toBeNull();
      expect(topBar?.style.display).toBe('block');

      vi.useRealTimers();
    });

    it('aborts fetch and transitions to ERROR_RETRYABLE on hard timeout cap (8.0s)', async () => {
      vi.useFakeTimers();
      const PLSys = (window as any).PLSys;
      const container = document.createElement('div');
      container.id = 'test-timeout-hard';
      document.body.appendChild(container);

      let signalReceived: any = null;
      const fetcher = (signal: AbortSignal) => {
        signalReceived = signal;
        return new Promise((_, reject) => {
          if (signal.aborted) {
            reject(new Error('Aborted'));
            return;
          }
          signal.addEventListener('abort', () => reject(new Error('Aborted')));
        });
      };
      const renderer = vi.fn();

      const loadPromise = PLSys.load(container, fetcher, renderer, { key: 'test:hard', softTimeoutMs: 3500, hardTimeoutMs: 8000 });
      loadPromise.catch(() => {});

      await vi.advanceTimersByTimeAsync(8100);

      expect(PLSys.getStatus(container).state).toBe('ERROR_RETRYABLE');
      expect(signalReceived?.aborted).toBe(true);

      const errBoundary = container.querySelector('.pl-error-boundary');
      expect(errBoundary).not.toBeNull();
      expect(errBoundary?.getAttribute('role')).toBe('alert');

      const retryBtn = container.querySelector('.pl-retry-btn') as HTMLButtonElement;
      expect(retryBtn).not.toBeNull();

      vi.useRealTimers();
    });

    it('allows retry from ERROR_RETRYABLE state via retry button click', async () => {
      const PLSys = (window as any).PLSys;
      const container = document.createElement('div');
      container.id = 'test-retry';
      document.body.appendChild(container);

      let fail = true;
      const fetcher = vi.fn().mockImplementation(() => {
        if (fail) {
          fail = false;
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({ ok: true });
      });
      const renderer = vi.fn((data) => {
        container.textContent = 'Success!';
      });

      await PLSys.load(container, fetcher, renderer, { key: 'test:retry', useSWR: false, softTimeoutMs: 10000, hardTimeoutMs: 20000 }).catch(() => {});

      expect(PLSys.getStatus(container).state).toBe('ERROR_RETRYABLE');
      const retryBtn = container.querySelector('.pl-retry-btn') as HTMLButtonElement;
      expect(retryBtn).not.toBeNull();

      // Click retry
      retryBtn.click();
      expect(PLSys.getStatus(container).state).toBe('STAGED_SKELETON');

      await new Promise((r) => setTimeout(r, 50));

      expect(PLSys.getStatus(container).state).toBe('CONTENT_READY');
      expect(container.textContent).toBe('Success!');
    });
  });

  describe('PLSys SWR Cache & Invalidation', () => {
    it('serves cached data immediately via PARTIAL_COMMIT and revalidates in background', async () => {
      const PLSys = (window as any).PLSys;
      const container = document.createElement('div');
      container.id = 'test-swr';
      document.body.appendChild(container);

      PLSys.SWRCache.set('cache:key', { version: 1 });

      const fetcher = vi.fn().mockResolvedValue({ version: 2 });
      const renderer = vi.fn();

      const loadPromise = PLSys.load(container, fetcher, renderer, { key: 'cache:key', useSWR: true });

      expect(renderer).toHaveBeenCalledWith({ version: 1 });
      expect(PLSys.getStatus(container).state).toBe('PARTIAL_COMMIT');

      await loadPromise;

      expect(renderer).toHaveBeenLastCalledWith({ version: 2 });
      expect(PLSys.getStatus(container).state).toBe('CONTENT_READY');
      expect(PLSys.SWRCache.get('cache:key')).toEqual({ version: 2 });
    });

    it('invalidates cache entry on PLSys.invalidate call', () => {
      const PLSys = (window as any).PLSys;
      PLSys.SWRCache.set('invalidate:key', { value: 123 });
      expect(PLSys.SWRCache.get('invalidate:key')).toEqual({ value: 123 });

      PLSys.invalidate('invalidate:key');
      expect(PLSys.SWRCache.get('invalidate:key')).toBeNull();
    });
  });

  describe('PLSys Accessibility & Zero-Text Skeleton Contract', () => {
    it('mounts zero-text skeleton with aria-hidden="true" and role="presentation"', async () => {
      const PLSys = (window as any).PLSys;
      const container = document.createElement('div');
      container.id = 'test-skeleton-a11y';
      document.body.appendChild(container);

      const fetcher = () => new Promise((resolve) => setTimeout(resolve, 50));
      const renderer = vi.fn();

      const loadPromise = PLSys.load(container, fetcher, renderer, { key: 'test:a11y' });

      const skel = container.querySelector('.pl-card-skeleton');
      expect(skel).not.toBeNull();
      expect(skel?.getAttribute('aria-hidden')).toBe('true');
      expect(skel?.getAttribute('role')).toBe('presentation');
      expect(skel?.textContent?.trim()).toBe('');

      await loadPromise;
    });
  });

  describe('PLSys Observability & Debug Flag', () => {
    it('records performance marks and measures', async () => {
      const markSpy = vi.spyOn(performance, 'mark');
      const measureSpy = vi.spyOn(performance, 'measure');

      const PLSys = (window as any).PLSys;
      const container = document.createElement('div');
      container.id = 'test-telemetry';
      document.body.appendChild(container);

      await PLSys.load(container, () => Promise.resolve('ok'), () => {}, { key: 'telemetry:test' });

      expect(markSpy).toHaveBeenCalledWith('plsys:start:telemetry:test');
      expect(markSpy).toHaveBeenCalledWith('plsys:ready:telemetry:test');
      expect(measureSpy).toHaveBeenCalledWith('plsys:duration:telemetry:test', 'plsys:start:telemetry:test', 'plsys:ready:telemetry:test');

      markSpy.mockRestore();
      measureSpy.mockRestore();
    });

    it('logs state transitions when window.__PL_DEBUG__ is true', async () => {
      (window as any).__PL_DEBUG__ = true;
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const PLSys = (window as any).PLSys;
      const container = document.createElement('div');
      container.id = 'test-debug-log';
      document.body.appendChild(container);

      await PLSys.load(container, () => Promise.resolve('ok'), () => {}, { key: 'debug:test' });

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[PLSys]'));

      consoleSpy.mockRestore();
    });
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

  describe('Readiness Handshake Contract', () => {
    it('cleans up competing boot overlays in a single phase handshake', async () => {
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
      FVL.show({ instant: true });
      expect(FVL.isActive()).toBe(true);

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
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

  describe('In-Flow Contextual Boundary Mode', () => {
    it('mounts inside target container in document flow without fixed/absolute positioning', async () => {
      const container = document.createElement('div');
      container.id = 'content-loading';
      document.body.appendChild(container);

      const FVL = (window as any).FVL;
      const handle = FVL.boundary('#content-loading', { message: 'Loading content…' });

      expect(handle).not.toBeNull();
      expect(container.getAttribute('aria-busy')).toBe('true');

      const boundaryEl = container.querySelector<HTMLElement>('.fvl-boundary');
      expect(boundaryEl).not.toBeNull();
      expect(boundaryEl?.getAttribute('data-fvl-mode')).toBe('boundary');
      expect(boundaryEl?.style.position).not.toBe('fixed');
      expect(boundaryEl?.style.position).not.toBe('absolute');
      expect(document.body.style.position).not.toBe('fixed');

      await handle.hide();
      expect(container.getAttribute('aria-busy')).toBe('false');
      expect(container.querySelector('.fvl-boundary')).toBeNull();
    });

    it('handles per-boundary ref counting for concurrent requests on same target', async () => {
      const container = document.createElement('div');
      container.id = 'content-loading';
      document.body.appendChild(container);

      const FVL = (window as any).FVL;
      const h1 = FVL.boundary('#content-loading', { message: 'Request 1' });
      const h2 = FVL.boundary('#content-loading', { message: 'Request 2' });

      expect(container.getAttribute('aria-busy')).toBe('true');
      expect(container.querySelector('.fvl-boundary')).not.toBeNull();

      // First hide should decrement ref count but leave boundary visible
      await h1.hide();
      expect(container.getAttribute('aria-busy')).toBe('true');
      expect(container.querySelector('.fvl-boundary')).not.toBeNull();

      // Second hide unmounts boundary and resets aria-busy
      await h2.hide();
      expect(container.getAttribute('aria-busy')).toBe('false');
      expect(container.querySelector('.fvl-boundary')).toBeNull();
    });

    it('cleans up boundary instances on hideAll', async () => {
      const container = document.createElement('div');
      container.id = 'content-loading';
      document.body.appendChild(container);

      const FVL = (window as any).FVL;
      FVL.boundary('#content-loading', { message: 'Loading…' });
      expect(container.getAttribute('aria-busy')).toBe('true');

      await FVL.hideAll();
      expect(container.getAttribute('aria-busy')).toBe('false');
      expect(container.querySelector('.fvl-boundary')).toBeNull();
    });
  });

  describe('Typed Loading v2 Contract', () => {
    it('exports typed API shortcuts FVL.page, FVL.content, FVL.component, FVL.global', () => {
      const FVL = (window as any).FVL;
      expect(typeof FVL.page).toBe('function');
      expect(typeof FVL.content).toBe('function');
      expect(typeof FVL.component).toBe('function');
      expect(typeof FVL.global).toBe('function');
    });

    it('mounts type "page" in-flow inside target with fvl-page class, data-fvl-type="page", no fixed/absolute pos, no body scroll lock', async () => {
      const container = document.createElement('div');
      container.id = 'page-container';
      document.body.appendChild(container);

      const FVL = (window as any).FVL;
      const handle = FVL.show({ type: 'page', target: '#page-container', message: 'Loading page...' });

      expect(container.getAttribute('aria-busy')).toBe('true');

      const pageEl = container.querySelector<HTMLElement>('.fvl-page');
      expect(pageEl).not.toBeNull();
      expect(pageEl?.getAttribute('data-fvl-type')).toBe('page');
      expect(pageEl?.style.position).not.toBe('fixed');
      expect(pageEl?.style.position).not.toBe('absolute');
      expect(document.body.style.position).not.toBe('fixed');

      await handle.hide();
      expect(container.getAttribute('aria-busy')).toBe('false');
      expect(container.querySelector('.fvl-page')).toBeNull();
    });

    it('mounts type "content" inside target with fvl-content class, data-fvl-type="content", and sets aria-busy', async () => {
      const container = document.createElement('div');
      container.id = 'content-container';
      document.body.appendChild(container);

      const FVL = (window as any).FVL;
      const handle = FVL.content('#content-container', { message: 'Loading feed...' });

      expect(container.getAttribute('aria-busy')).toBe('true');

      const contentEl = container.querySelector<HTMLElement>('.fvl-content');
      expect(contentEl).not.toBeNull();
      expect(contentEl?.getAttribute('data-fvl-type')).toBe('content');

      await FVL.hideInstant(handle.id);
      expect(container.getAttribute('aria-busy')).toBe('false');
      expect(container.querySelector('.fvl-content')).toBeNull();
    });

    it('mounts type "component" inside target with fvl-component class and data-fvl-type="component"', async () => {
      const button = document.createElement('button');
      button.id = 'submit-btn';
      document.body.appendChild(button);

      const FVL = (window as any).FVL;
      const handle = FVL.component('#submit-btn', { message: 'Saving...' });

      expect(button.getAttribute('aria-busy')).toBe('true');

      const compEl = button.querySelector<HTMLElement>('.fvl-component');
      expect(compEl).not.toBeNull();
      expect(compEl?.getAttribute('data-fvl-type')).toBe('component');

      await handle.hide();
      expect(button.getAttribute('aria-busy')).toBe('false');
    });

    it('renders type "global" as a viewport overlay with data-fvl-type="global"', async () => {
      const FVL = (window as any).FVL;
      const handle = FVL.global({ message: 'Global overlay...' });

      const globalEl = document.querySelector<HTMLElement>('.fvl-global') || document.querySelector<HTMLElement>('[data-fvl-type="global"]');
      expect(globalEl).not.toBeNull();
      expect(globalEl?.getAttribute('data-fvl-type')).toBe('global');

      await FVL.hideInstant(handle.id);
      expect(document.querySelector('[data-fvl-type="global"]')).toBeNull();
    });

    it('maps legacy API modes to correct typed instances (fullscreen -> global, scoped -> content, boundary -> page, inline -> component)', async () => {
      const target = document.createElement('div');
      target.id = 'legacy-target';
      document.body.appendChild(target);

      const FVL = (window as any).FVL;

      // fullscreen -> global
      const hFullscreen = FVL.fullscreen({ instant: true });
      const globalEl = document.querySelector<HTMLElement>('[data-fvl-type="global"]');
      expect(globalEl).not.toBeNull();
      await FVL.hideInstant(hFullscreen.id);

      // scoped -> content
      const hScoped = FVL.scoped({ target: '#legacy-target', instant: true });
      const contentEl = target.querySelector<HTMLElement>('[data-fvl-type="content"]');
      expect(contentEl).not.toBeNull();
      await FVL.hideInstant(hScoped.id);

      // boundary -> page
      const hBoundary = FVL.boundary('#legacy-target', { instant: true });
      const pageEl = target.querySelector<HTMLElement>('[data-fvl-type="page"]');
      expect(pageEl).not.toBeNull();
      await FVL.hideInstant(hBoundary.id);

      // inline -> component
      const hInline = FVL.inline('#legacy-target');
      const compEl = target.querySelector<HTMLElement>('[data-fvl-type="component"]');
      expect(compEl).not.toBeNull();
      await FVL.hideInstant(hInline.id);
    });

    it('resets aria-busy attribute to "false" on hide and hideInstant', async () => {
      const target = document.createElement('div');
      target.id = 'aria-target';
      document.body.appendChild(target);

      const FVL = (window as any).FVL;
      const handle1 = FVL.page('#aria-target');
      expect(target.getAttribute('aria-busy')).toBe('true');
      await handle1.hide();
      expect(target.getAttribute('aria-busy')).toBe('false');

      const handle2 = FVL.content('#aria-target');
      expect(target.getAttribute('aria-busy')).toBe('true');
      await FVL.hideInstant(handle2.id);
      expect(target.getAttribute('aria-busy')).toBe('false');
    });

    it('does NOT call window.scrollTo during _cleanup for contextual typed loaders', async () => {
      const target = document.createElement('div');
      target.id = 'scroll-target';
      document.body.appendChild(target);

      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

      const FVL = (window as any).FVL;
      const handle = FVL.page('#scroll-target');

      await FVL.hideInstant(handle.id);

      expect(scrollToSpy).not.toHaveBeenCalled();
      scrollToSpy.mockRestore();
    });

    it('clears boundary references via clearAllBoundaryRefs', async () => {
      const container = document.createElement('div');
      container.id = 'boundary-container';
      document.body.appendChild(container);

      const FVL = (window as any).FVL;
      FVL.page('#boundary-container');

      expect(container.getAttribute('aria-busy')).toBe('true');

      const State = FVL.modules ? FVL.modules().State : (window as any).FVLModules?.State;
      expect(State).toBeDefined();
      expect(typeof State.clearAllBoundaryRefs).toBe('function');

      State.clearAllBoundaryRefs();

      await FVL.hideAll();
      expect(container.getAttribute('aria-busy')).toBe('false');
    });
  });
});

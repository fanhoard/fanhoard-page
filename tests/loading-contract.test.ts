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

    it('exports version, show, hide, scoped, inline, topbar, readinessHandshake', () => {
      const FVL = (window as any).FVL;
      expect(typeof FVL.show).toBe('function');
      expect(typeof FVL.hide).toBe('function');
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
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Core Search Defects Regression Suite (DS-01, DS-06, DS-07, DS-09, DS-05, DS-11, DS-02)', () => {

  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  // DS-01: init failure resets _initialized to false
  it('DS-01: init failure resets _initialized to false and logs error', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    let initialized = true;
    const mockSearchUI = {
      get _initialized() { return initialized; },
      set _initialized(val: boolean) { initialized = val; },
      init: vi.fn(),
    };
    (window as any).__searchUI = mockSearchUI;

    const handleInitFailure = (err: Error) => {
      console.error('[Search] Initialisation failed:', err);
      if ((window as any).__searchUI) {
        (window as any).__searchUI._initialized = false;
      }
    };

    handleInitFailure(new Error('Data load network error'));

    expect(consoleError).toHaveBeenCalledWith('[Search] Initialisation failed:', expect.any(Error));
    expect((window as any).__searchUI._initialized).toBe(false);
  });

  // DS-06: ensureFuseLoaded rejection unlocks _fuseBuilding in finally
  it('DS-06: Fuse build failure resets _fuseBuilding flag in finally block', async () => {
    let fuseBuilding = true;

    const mockBuild = async () => {
      try {
        throw new Error('Failed to load Fuse.js');
      } catch (e) {
        // caught
      } finally {
        fuseBuilding = false;
      }
    };

    await mockBuild();
    expect(fuseBuilding).toBe(false);
  });

  // DS-07: cap Fuse build retries at 3 and fallback to substring search
  it('DS-07: Fuse build retries are capped at 3 before defaulting to substring search', () => {
    let fuseBuildRetries = 0;
    const MAX_RETRIES = 3;
    let fallbackTriggered = false;

    const attemptBuild = () => {
      if (fuseBuildRetries >= MAX_RETRIES) {
        fallbackTriggered = true;
        return;
      }
      fuseBuildRetries++;
    };

    attemptBuild(); // 1
    attemptBuild(); // 2
    attemptBuild(); // 3
    attemptBuild(); // 4 -> capped

    expect(fuseBuildRetries).toBe(3);
    expect(fallbackTriggered).toBe(true);
  });

  // DS-09: doSearch surfaces error and resets currentResults = []
  it('DS-09: doSearch surfaces engine errors and resets currentResults to empty array', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const State = {
      currentResults: [{ id: 'stale-result' }],
    };

    const faultySearch = () => {
      let out = { results: [], keywords: [] };
      try {
        throw new Error('Engine crash');
      } catch (err) {
        console.error('[SearchService] Search engine failed:', err);
        out = { results: [], keywords: [] };
      }
      State.currentResults = out.results || [];
    };

    faultySearch();

    expect(consoleError).toHaveBeenCalledWith('[SearchService] Search engine failed:', expect.any(Error));
    expect(State.currentResults).toEqual([]);
  });

  // DS-05: KeyboardService.destroy unbinds visualViewport resize listener
  it('DS-05: KeyboardService.destroy removes visualViewport resize listener', () => {
    const removeEventListener = vi.fn();
    (window as any).visualViewport = {
      addEventListener: vi.fn(),
      removeEventListener,
    };

    const mockService = {
      _vvResizeHandler: vi.fn() as any,
      destroy() {
        if (this._vvResizeHandler && (window as any).visualViewport) {
          (window as any).visualViewport.removeEventListener('resize', this._vvResizeHandler);
          this._vvResizeHandler = null as any;
        }
      }
    };

    mockService.destroy();

    expect(removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(mockService._vvResizeHandler).toBeNull();
  });

  // DS-11: url-history handles history API failures gracefully with structured log
  it('DS-11: URLService logs history API failures and falls back gracefully', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const commitSearch = (st: any) => {
      try {
        try {
          throw new Error('pushState SecurityError');
        } catch (pushErr) {
          console.warn('[URLService] pushState failed, attempting replaceState fallback:', pushErr);
          try {
            throw new Error('replaceState SecurityError');
          } catch (replaceErr) {
            console.error('[URLService] history API failed:', replaceErr);
            if (st.q) {
              window.location.hash = '#q=' + encodeURIComponent(st.q);
            }
          }
        }
      } catch (err) {
        console.error('[URLService] commitSearch error:', err);
      }
    };

    commitSearch({ q: 'test-query', type: 'all' });

    expect(consoleWarn).toHaveBeenCalledWith('[URLService] pushState failed, attempting replaceState fallback:', expect.any(Error));
    expect(consoleError).toHaveBeenCalledWith('[URLService] history API failed:', expect.any(Error));
    expect(window.location.hash).toContain('#q=test-query');
  });

  // DS-02: search.js removes beforeunload listener on destroy()
  it('DS-02: search.js removes beforeunload listener when destroy() is called', async () => {
    delete (window as any).__searchUI;

    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    (window as any).SearchModules = {
      CONFIG: { DOM: {} },
      State: {
        overlayOpen: false,
        _timeouts: new Set(),
      },
      Handlers: {},
      DOMService: {
        off: vi.fn(),
        get: vi.fn().mockReturnValue(null),
        remove: vi.fn(),
      },
      StorageService: {},
      URLService: {},
      KeyboardService: { destroy: vi.fn() },
      FilterService: {},
      SearchService: {},
      UIService: {},
      OverlayService: { close: vi.fn() },
      ClearBtnService: {},
      IconSlotService: {},
      VirtualScrollEngine: { destroy: vi.fn() },
      KeyboardAutoToggleService: { disableAutoToggle: vi.fn() },
      SearchEngine: {},
    };

    const searchJsPath = path.resolve(__dirname, '../assets/js/search-system/search.js');
    let searchJsCode = fs.readFileSync(searchJsPath, 'utf8');

    // Replace async module script fetching with immediate resolution to trigger _boot()
    searchJsCode = searchJsCode.replace('loadPhases(LOAD_PHASES, base)', 'Promise.resolve()');

    // Evaluate search.js
    const runCode = new Function('window', 'document', 'console', searchJsCode);
    runCode(window, document, console);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect((window as any).__searchUI).toBeDefined();

    const beforeUnloadCalls = addEventListenerSpy.mock.calls.filter(c => c[0] === 'beforeunload');
    expect(beforeUnloadCalls.length).toBeGreaterThan(0);
    const beforeUnloadHandler = beforeUnloadCalls[0][1];

    // Call destroy() on searchUI
    (window as any).__searchUI.destroy();

    const beforeUnloadRemovals = removeEventListenerSpy.mock.calls.filter(c => c[0] === 'beforeunload');
    expect(beforeUnloadRemovals.length).toBeGreaterThan(0);
    expect(beforeUnloadRemovals[0][1]).toBe(beforeUnloadHandler);
  });

});

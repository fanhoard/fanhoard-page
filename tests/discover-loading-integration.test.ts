import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Discover Page FVL Flexible Spinner Integration', () => {
  let contentLoadingCtr: HTMLElement;
  let searchResultsCtr: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    document.body.innerHTML = '';
    document.head.innerHTML = '';

    contentLoadingCtr = document.createElement('div');
    contentLoadingCtr.id = 'content-loading';
    document.body.appendChild(contentLoadingCtr);

    searchResultsCtr = document.createElement('div');
    searchResultsCtr.id = 'searchResults';
    document.body.appendChild(searchResultsCtr);

    delete (window as any).FVL;
    delete (window as any).FVLSpinner;
    delete (window as any).FVLModules;
    delete (window as any).NavCoreModules;
    delete (window as any).SearchModules;

    const spinnerCode = fs.readFileSync(
      path.resolve(__dirname, '../assets/js/loading-system/fvl-spinner.js'),
      'utf-8'
    );
    new Function('window', 'document', spinnerCode)(window, document);

    const fvlCode = fs.readFileSync(
      path.resolve(__dirname, '../assets/js/loading-system/fvl.js'),
      'utf-8'
    );
    new Function('window', 'document', fvlCode)(window, document);
  });

  afterEach(() => {
    vi.useRealTimers();
    if ((window as any).FVL && typeof (window as any).FVL.hideAll === 'function') {
      (window as any).FVL.hideAll();
    }
  });

  describe('Point A & B: Category/Tab Switch and Feed Refresh', () => {
    it('mounts bare FVL spinner into #content-loading and sets aria-busy=true on clearContent()', async () => {
      const contentCode = fs.readFileSync(
        path.resolve(__dirname, '../assets/js/nav-core-modules/content.js'),
        'utf-8'
      );
      
      const M: any = {
        CONFIG: { DOM: { CONTENT_LOADING_ID: 'content-loading' } },
        DataService: { loadApiDatabase: async () => {} },
      };
      (window as any).NavCoreModules = M;

      new Function('window', contentCode)(window);

      await (window as any).NavCoreModules.ContentService.clearContent({});

      expect(contentLoadingCtr.getAttribute('aria-busy')).toBe('true');
      const spinner = contentLoadingCtr.querySelector('.fvl-spinner');
      expect(spinner).not.toBeNull();
    });

    it('guards against double-spinners on duplicate clearContent() calls', async () => {
      const contentCode = fs.readFileSync(
        path.resolve(__dirname, '../assets/js/nav-core-modules/content.js'),
        'utf-8'
      );
      
      const M: any = {
        CONFIG: { DOM: { CONTENT_LOADING_ID: 'content-loading' } },
        DataService: { loadApiDatabase: async () => {} },
      };
      (window as any).NavCoreModules = M;

      new Function('window', contentCode)(window);

      await (window as any).NavCoreModules.ContentService.clearContent({});
      await (window as any).NavCoreModules.ContentService.clearContent({});

      const spinners = contentLoadingCtr.querySelectorAll('.fvl-spinner');
      expect(spinners.length).toBe(1);
    });

    it('removes spinner and sets aria-busy=false when _appendFeedGroups runs', async () => {
      const contentCode = fs.readFileSync(
        path.resolve(__dirname, '../assets/js/nav-core-modules/content.js'),
        'utf-8'
      );

      const M: any = {
        CONFIG: { DOM: { CONTENT_LOADING_ID: 'content-loading' } },
      };
      (window as any).NavCoreModules = M;

      new Function('window', contentCode)(window);

      const ContentService = (window as any).NavCoreModules.ContentService;
      await ContentService.clearContent({});
      expect(contentLoadingCtr.querySelector('.fvl-spinner')).not.toBeNull();

      ContentService._resolveAll = async (groups: any[]) => groups;
      ContentService._tpl = () => '<div class="card">Item</div>';

      await ContentService._appendFeedGroups(contentLoadingCtr, [{ id: 1 }], 'en', null);

      expect(contentLoadingCtr.getAttribute('aria-busy')).toBe('false');
      expect(contentLoadingCtr.querySelector('.fvl-spinner')).toBeNull();
    });

    it('auto-cleans spinner after 10-second safety fallback timer if fetch stalls', async () => {
      const contentCode = fs.readFileSync(
        path.resolve(__dirname, '../assets/js/nav-core-modules/content.js'),
        'utf-8'
      );

      const M: any = {
        CONFIG: { DOM: { CONTENT_LOADING_ID: 'content-loading' } },
      };
      (window as any).NavCoreModules = M;

      new Function('window', contentCode)(window);

      const ContentService = (window as any).NavCoreModules.ContentService;
      await ContentService.clearContent({});
      expect(contentLoadingCtr.querySelector('.fvl-spinner')).not.toBeNull();

      vi.advanceTimersByTime(10000);

      expect(contentLoadingCtr.querySelector('.fvl-spinner')).toBeNull();
      expect(contentLoadingCtr.getAttribute('aria-busy')).toBeNull();
    });
  });

  describe('Point C: Infinite Scroll Sentinel Loading', () => {
    it('mounts FVLSpinner on sentinel during infinite scroll fetch and destroys it in finally block', async () => {
      let observerCb: any = null;
      (window as any).IntersectionObserver = class {
        cb: any;
        constructor(cb: any) { observerCb = cb; this.cb = cb; }
        observe() {}
        disconnect() {}
      };

      const contentCode = fs.readFileSync(
        path.resolve(__dirname, '../assets/js/nav-core-modules/content.js'),
        'utf-8'
      );

      let loadPageResolver: any = null;
      const loadPagePromise = new Promise((resolve) => { loadPageResolver = resolve; });

      const M: any = {
        CONFIG: { DOM: { CONTENT_LOADING_ID: 'content-loading' } },
        FeedService: {
          loadNextPage: vi.fn().mockImplementation(() => loadPagePromise)
        }
      };
      (window as any).NavCoreModules = M;

      new Function('window', contentCode)(window);

      const ContentService = (window as any).NavCoreModules.ContentService;

      // First clear content to increment internal _sess
      await ContentService.clearContent({});

      ContentService._attachFeedSentinel(contentLoadingCtr, 'en', 1);

      const sentinel = contentLoadingCtr.querySelector('#nc-feed-sentinel') as HTMLElement;
      expect(sentinel).not.toBeNull();

      const observePromise = observerCb([{ isIntersecting: true }]);

      expect(sentinel.getAttribute('aria-busy')).toBe('true');
      expect(sentinel.querySelector('.fvl-spinner')).not.toBeNull();

      loadPageResolver({ groups: [{ id: 101 }], hasMore: true });
      await observePromise;

      expect(sentinel.getAttribute('aria-busy')).toBe('false');
      expect(sentinel.querySelector('.fvl-spinner')).toBeNull();
    });

    it('ensures spinner is cleaned up even if FeedService.loadNextPage fails with error', async () => {
      let observerCb: any = null;
      (window as any).IntersectionObserver = class {
        constructor(cb: any) { observerCb = cb; }
        observe() {}
        disconnect() {}
      };

      const contentCode = fs.readFileSync(
        path.resolve(__dirname, '../assets/js/nav-core-modules/content.js'),
        'utf-8'
      );

      const M: any = {
        CONFIG: { DOM: { CONTENT_LOADING_ID: 'content-loading' } },
        FeedService: {
          loadNextPage: vi.fn().mockRejectedValue(new Error('Network error'))
        }
      };
      (window as any).NavCoreModules = M;

      new Function('window', contentCode)(window);

      const ContentService = (window as any).NavCoreModules.ContentService;

      // Clear content to increment _sess
      await ContentService.clearContent({});

      ContentService._attachFeedSentinel(contentLoadingCtr, 'en', 1);

      const sentinel = contentLoadingCtr.querySelector('#nc-feed-sentinel') as HTMLElement;

      await observerCb([{ isIntersecting: true }]);

      expect(sentinel.getAttribute('aria-busy')).toBe('false');
      expect(sentinel.querySelector('.fvl-spinner')).toBeNull();
    });
  });

  describe('Point D: Search & Re-render Loading State', () => {
    it('mounts bare FVL spinner into #searchResults when pending URE in renderResults()', async () => {
      delete (window as any).URE;

      const renderingCode = fs.readFileSync(
        path.resolve(__dirname, '../assets/js/search-system/search-modules/rendering.js'),
        'utf-8'
      );

      const M: any = {
        CONFIG: { DOM: { searchResultsId: 'searchResults' } },
        State: { selectedCategory: 'all' },
        Handlers: {},
        DOMService: { get: (id: string) => document.getElementById(id) },
        LanguageService: { getLang: () => 'en', t: (k: string) => k },
        StringService: { escapeHtml: (s: string) => s, encodeUrl: (s: string) => s },
        NotificationService: {}
      };
      (window as any).SearchModules = M;

      new Function('window', renderingCode)(window);

      M.RenderingService.renderResults([]);

      expect(searchResultsCtr.getAttribute('aria-busy')).toBe('true');
      const spinner = searchResultsCtr.querySelector('.fvl-spinner');
      expect(spinner).not.toBeNull();
    });
  });
});

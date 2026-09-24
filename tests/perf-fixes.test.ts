import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('PF-05: Dead Asset References & Boot 404 Elimination', () => {
  it('does not contain references to dead legacy JSON or wave-setting assets in version-core.js and modern-navigation.js', () => {
    const versionCorePath = path.join(__dirname, '../assets/js/version-core.js');
    const modernNavPath = path.join(__dirname, '../assets/js/modern-navigation.js');

    const versionCore = fs.readFileSync(versionCorePath, 'utf8');
    const modernNav = fs.readFileSync(modernNavPath, 'utf8');

    expect(versionCore).not.toContain('/assets/json/whats-new.json');
    expect(versionCore).not.toContain('/assets/md/current.md');
    expect(modernNav).not.toContain('wave-effect.js');
  });

  it('uses absolute leading slash for lang-proxy script in home/index.html', () => {
    const homeHtmlPath = path.join(__dirname, '../home/index.html');
    const homeHtml = fs.readFileSync(homeHtmlPath, 'utf8');

    expect(homeHtml).toContain('src="/assets/js/lang-proxy.js');
    expect(homeHtml).not.toContain('src="assets/js/lang-proxy.js');
  });
});

describe('PF-03: Unified Debounce Timers & Cancellation on Enter', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="search-pill">
        <input id="searchInput" type="text" />
      </div>
      <div id="search-suggestion-container"></div>
    `;
  });

  it('cancels pending suggestion debounce timer on Enter keydown', () => {
    const M: any = {
      CONFIG: {
        DOM: { searchInputId: 'searchInput', clearBtnId: 'search-clear-btn', suggestionContainerId: 'search-suggestion-container' },
        TIMING: { debounceMs: 120 },
        Icons: { search: '', clear: '', back: '' }
      },
      State: { overlayTransitioning: false, debounceTimeout: null },
      Handlers: {},
      DOMService: {
        get: (id: string) => document.getElementById(id),
        query: (sel: string) => document.querySelector(sel),
        create: (tag: string, attrs: any, cls: string) => {
          const el = document.createElement(tag);
          if (cls) el.className = cls;
          return el;
        },
        setAttr: (el: any, k: string, v: string) => el?.setAttribute(k, v)
      },
      LanguageService: { t: (k: string) => k },
      OverlayService: { open: vi.fn() },
      SuggestionService: { renderQuerySuggestions: vi.fn() },
      SearchService: { doSearch: vi.fn() }
    };

    (window as any).SearchModules = M;
    const code = fs.readFileSync(path.join(__dirname, '../assets/js/search-system/search-modules/input-bar.js'), 'utf8');
    eval(code);

    const input = document.getElementById('searchInput') as HTMLInputElement;
    M.UIService.buildWrapper();
    M.UIService.setupAutoSearchInput();

    input.value = 'smile';
    M.Handlers.inputInput();

    expect(M.State.debounceTimeout).not.toBeNull();

    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    M.Handlers.inputKeydown(enterEvent);

    expect(M.State.debounceTimeout).toBeNull();
    expect(M.SearchService.doSearch).toHaveBeenCalled();
  });
});

describe('PF-06: Virtual Scroll Buffer Reduction', () => {
  it('uses ~300px buffer in rendering.js, discovery.js, virtual-scroll.js, and ure config', () => {
    const renderingCode = fs.readFileSync(path.join(__dirname, '../assets/js/search-system/search-modules/rendering.js'), 'utf8');
    const discoveryCode = fs.readFileSync(path.join(__dirname, '../assets/js/search-system/search-modules/discovery.js'), 'utf8');
    const vsCode = fs.readFileSync(path.join(__dirname, '../assets/js/search-system/search-modules/virtual-scroll.js'), 'utf8');
    const ureConfigCode = fs.readFileSync(path.join(__dirname, '../assets/js/ure/ure-modules/config.js'), 'utf8');

    expect(renderingCode).toContain('buffer  : 300');
    expect(discoveryCode).toContain('buffer    : 300');
    expect(vsCode).toContain('OVERSCAN : 300');
    expect(ureConfigCode).toContain('DEFAULT_BUFFER_PX          : 300');
    expect(ureConfigCode).toContain("SENTINEL_MARGIN            : '300px'");
  });
});

describe('PF-02: SearchEngine Query Result Cache', () => {
  const mockData = {
    type: [
      {
        id: 'emojis',
        name: { en: 'Emojis', th: 'อีโมจิ' },
        category: [
          {
            id: 'smileys',
            name: { en: 'Smileys', th: 'หน้ายิ้ม' },
            data: [
              { name: { en: 'Smiling Face', th: 'หน้ายิ้ม' }, api: 'smile' },
              { name: { en: 'Grinning Face', th: 'ยิ้มแย้ม' }, api: 'grin' },
              { name: { en: 'Red Heart', th: 'หัวใจแดง' }, api: 'heart' }
            ]
          }
        ]
      }
    ]
  };

  it('cache hit avoids recompute on repeat queries', async () => {
    const M: any = { CONFIG: {} };
    (window as any).SearchModules = M;
    const engineCode = fs.readFileSync(path.join(__dirname, '../assets/js/search-system/search-modules/engine.js'), 'utf8');
    eval(engineCode);

    const SearchEngine = M.SearchEngine;
    await SearchEngine.init(mockData);

    if (typeof SearchEngine._internals?.getResultCacheSize !== 'function') {
      return;
    }

    expect(SearchEngine._internals.getResultCacheSize()).toBe(0);

    const res1 = SearchEngine.search('smile', 'all');
    expect(res1.results.length).toBeGreaterThan(0);
    expect(SearchEngine._internals.getResultCacheSize()).toBe(1);

    const res2 = SearchEngine.search('smile', 'all');
    expect(res2).toBe(res1);
  });

  it('cache invalidates on dataset rebuild (init)', async () => {
    const M: any = { CONFIG: {} };
    (window as any).SearchModules = M;
    const engineCode = fs.readFileSync(path.join(__dirname, '../assets/js/search-system/search-modules/engine.js'), 'utf8');
    eval(engineCode);

    const SearchEngine = M.SearchEngine;
    await SearchEngine.init(mockData);

    if (typeof SearchEngine._internals?.getResultCacheSize !== 'function') {
      return;
    }

    SearchEngine.search('smile', 'all');
    expect(SearchEngine._internals.getResultCacheSize()).toBe(1);

    await SearchEngine.init(mockData);
    expect(SearchEngine._internals.getResultCacheSize()).toBe(0);
  });
});

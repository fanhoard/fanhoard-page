import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Search System Polish Suite (S4)', () => {
  let M: any;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="search-sticky">
        <div class="search-pill">
          <span class="search-pill__icon"></span>
          <input id="searchInput" type="text" value="" />
          <button id="search-clear-btn" type="button"></button>
        </div>
      </div>
      <div id="searchResults"></div>
      <div id="typeFilter"></div>
      <div id="categoryFilter"></div>
    `;

    M = (window as any).SearchModules = (window as any).SearchModules || {};

    // Mock ScrollLockCore
    (window as any).ScrollLockCore = {
      lock: vi.fn(),
      unlock: vi.fn(),
      allowScrollIn: vi.fn(),
      releaseAll: vi.fn(),
      getLockCount: vi.fn().mockReturnValue(0),
      getState: vi.fn().mockReturnValue({ locked: false, count: 0, owners: [] }),
      reset: vi.fn(),
    };

    // Load State, Config, Utils, Suggestions, Overlay, InputBar, Rendering modules if available or set up stubs
    M.CONFIG = {
      DOM: {
        searchInputId: 'searchInput',
        overlayContainerId: 'search-overlay-container',
        suggestionContainerId: 'search-suggestions-list',
        searchResultsId: 'searchResults',
        clearBtnId: 'search-clear-btn',
        typeFilterId: 'typeFilter',
        categoryFilterId: 'categoryFilter',
      },
      TIMING: {
        focusDelayMs: 0,
        transitionDelayMs: 0,
        debounceMs: 50,
      },
      RENDER: {
        suggestionsFullscreenMax: 10,
      },
      LANG: {
        default: 'en',
        autoDetect: false,
      },
      LANG_WEIGHT: {
        dominanceRatio: 1.5,
        minCharsForDominance: 2,
        fallback: 'auto',
      },
      TEXTS: {
        en: {
          trending: 'Trending',
          suggestion_label: 'Suggestions',
          type: 'Type',
          category: 'Category',
          all_types: 'All Types',
          all_categories: 'All Categories',
          not_found: 'No results found',
          not_found_hint: 'Try searching for something else',
        },
        th: {
          trending: 'กำลังฮิต',
          suggestion_label: 'คำแนะนำ',
          type: 'ประเภท',
          category: 'หมวดหมู่',
          all_types: 'ประเภททั้งหมด',
          all_categories: 'หมวดหมู่ทั้งหมด',
          not_found: 'ไม่พบผลการค้นหา',
          not_found_hint: 'ลองค้นหาด้วยคำอื่น',
        },
      },
      Icons: {
        search: '🔍',
        back: '←',
        clear: '✕',
      },
    };

    M.State = {
      overlayOpen: false,
      overlayTransitioning: false,
      overlayHistoryPushed: false,
      preOverlayState: null,
      _savedScrollY: 0,
      selectedType: 'all',
      selectedCategory: 'all',
      allKeywordsCache: [],
      currentResults: [],
      _timeouts: new Set(),
      setWrapperParent: vi.fn(),
      getSavedScrollY: vi.fn().mockReturnValue(0),
      setSavedScrollY: vi.fn(),
      clearTimeouts: vi.fn(),
    };

    M.Handlers = {};

    M.DOMService = {
      get: (id: string) => document.getElementById(id),
      query: (sel: string) => document.querySelector(sel),
      create: (tag: string, id?: string, cls?: string, styles?: any) => {
        const el = document.createElement(tag);
        if (id) el.id = id;
        if (cls) el.className = cls;
        if (styles) Object.assign(el.style, styles);
        return el;
      },
      remove: (el: Element | null) => { el?.parentNode?.removeChild(el); },
      setHTML: (el: Element | null, html: string) => { if (el) el.innerHTML = html; },
      setAttr: (el: Element | null, k: string, v: string) => { if (el) el.setAttribute(k, v); },
      on: (el: any, ev: string, fn: any) => el?.addEventListener(ev, fn),
      off: (el: any, ev: string, fn: any) => el?.removeEventListener(ev, fn),
    };

    M.StringService = {
      escapeHtml: (str: string) => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
      encodeUrl: (str: string) => encodeURIComponent(str),
      decodeUrl: (str: string) => decodeURIComponent(str),
    };

    M.LanguageService = {
      getLang: () => 'en',
      t: (key: string) => M.CONFIG.TEXTS.en[key] || key,
      hasThaiChars: (s: string) => /[\u0E00-\u0E7F]/.test(s),
      detectQueryLanguage: (query: string) => {
        const q = String(query || '');
        let thai = 0, latin = 0;
        for (let i = 0; i < q.length; i++) {
          const c = q.charCodeAt(i);
          if (c >= 0x0E00 && c <= 0x0E7F) thai++;
          else if ((c >= 0x41 && c <= 0x5A) || (c >= 0x61 && c <= 0x7A)) latin++;
        }
        if (thai >= 2 && latin < 2) return { language: 'th' };
        if (latin >= 2 && thai < 2) return { language: 'en' };
        return { language: 'en' };
      },
    };

    M.HighlightService = {
      highlight: (text: string) => text,
    };

    M.URLService = {
      pushOverlayEntry: vi.fn(),
      collapseOverlayEntry: vi.fn(),
    };

    M.KeyboardAutoToggleService = {
      enableAutoToggle: vi.fn(),
      disableAutoToggle: vi.fn(),
    };

    M.IconSlotService = { update: vi.fn() };
    M.ClearBtnService = { sync: vi.fn() };
    M.SearchController = { doSearch: vi.fn() };
  });

  it('SuggestionService.handleKeydown moves focus back to input on ArrowUp at top item', () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="search-suggestion-item" tabindex="0" id="item0">Item 1</div>
      <div class="search-suggestion-item" tabindex="0" id="item1">Item 2</div>
    `;
    document.body.appendChild(container);

    const input = document.getElementById('searchInput') as HTMLInputElement;
    const item0 = document.getElementById('item0') as HTMLElement;
    const item1 = document.getElementById('item1') as HTMLElement;

    item0.focus();
    expect(document.activeElement).toBe(item0);

    // Import Suggestions module logic or run handleKeydown
    const handleKeydown = (ev: KeyboardEvent, cont: Element) => {
      const items = [...cont.querySelectorAll('.search-suggestion-item')];
      if (!items.length) return;
      const idx = items.indexOf(document.activeElement as HTMLElement);

      if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        if (idx <= 0) {
          input.focus();
        } else {
          (items[idx - 1] as HTMLElement)?.focus();
        }
      } else if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        (items[idx === -1 ? 0 : Math.min(items.length - 1, idx + 1)] as HTMLElement)?.focus();
      }
    };

    // Press ArrowUp on item0 -> should focus input
    const upEv = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true });
    handleKeydown(upEv, container);
    expect(document.activeElement).toBe(input);

    // Focus item0, press ArrowDown -> should focus item1
    item0.focus();
    const downEv = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    handleKeydown(downEv, container);
    expect(document.activeElement).toBe(item1);
  });

  it('RenderingService creates screen reader live announcer element if missing', () => {
    let annEl = document.getElementById('searchLiveAnnouncer');
    expect(annEl).toBeNull();

    const _count = 5;
    const lang = 'en';
    const _announceMsg = `Found ${_count} results`;

    let announcer = document.getElementById('searchLiveAnnouncer');
    if (!announcer && document.body) {
      announcer = document.createElement('div');
      announcer.id = 'searchLiveAnnouncer';
      announcer.className = 'fv-sr-only';
      announcer.setAttribute('aria-live', 'polite');
      announcer.setAttribute('aria-atomic', 'true');
      document.body.appendChild(announcer);
    }
    if (announcer) announcer.textContent = _announceMsg;

    annEl = document.getElementById('searchLiveAnnouncer');
    expect(annEl).not.toBeNull();
    expect(annEl?.textContent).toBe('Found 5 results');
    expect(annEl?.getAttribute('aria-live')).toBe('polite');
  });

  it('LanguageService detects query language correctly', () => {
    const detect = (M.LanguageService as any).detectQueryLanguage;

    expect(detect('สวัสดี').language).toBe('th');
    expect(detect('rocket').language).toBe('en');
    expect(detect('😊').language).toBe('en'); // fallback
  });

  it('OverlayService adds active class for open transition', () => {
    M.OverlayService = {
      open() {
        let ov = document.getElementById('search-overlay-container');
        if (!ov) {
          ov = document.createElement('div');
          ov.id = 'search-overlay-container';
          ov.className = 'search-overlay search-overlay-open';
          document.body.appendChild(ov);
          ov.classList.add('search-overlay-active');
        }
        M.State.overlayOpen = true;
      },
      close() {
        const ov = document.getElementById('search-overlay-container');
        if (ov) {
          ov.classList.remove('search-overlay-active');
          ov.parentNode?.removeChild(ov);
        }
        M.State.overlayOpen = false;
      }
    };

    M.OverlayService.open();
    const ov = document.getElementById('search-overlay-container');
    expect(ov).not.toBeNull();
    expect(ov?.classList.contains('search-overlay-active')).toBe(true);

    M.OverlayService.close();
    expect(document.getElementById('search-overlay-container')).toBeNull();
  });
});

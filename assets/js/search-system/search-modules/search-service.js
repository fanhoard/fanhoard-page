// @ts-check
/**
 * @file search-service.js
 * SearchService — private state store and search execution orchestrator.
 *
 * Merges: state.js and search-service.js
 * Fixes: URL reload/refresh bug, category wipes, data race timeouts.
 *
 * @module search-service
 */

import { CONFIG, DB } from './config.js';
import { DOMService, LanguageService } from './utils.js';
import { SearchEngine } from './engine.js';
import { SuggestionService, ReadyModeService, DiscoveryService } from './suggestions.js';
import { RenderingService, FilterService, OverlayService, UIService, IconSlotService, ClearBtnService } from './ui.js';
import { URLService } from './url-history.js';

// ── Private State Store ───────────────────────────────────────────────────
export const State = {
  /** @type {any} */
  apiData: null,
  /** @type {any[]} */
  allKeywordsCache: [],
  /** @type {any[]} */
  currentResults: [],
  /** @type {any[]} */
  currentFilteredResults: [],

  selectedType: 'all',
  selectedCategory: 'all',
  /** @type {any} */
  lastCommittedSearchState: null,

  /** @type {any[]} */
  currentDiscovery: [],
  discoveryActive: false,
  /** @type {any} */
  discoveryHandle: null,

  overlayOpen: false,
  overlayTransitioning: false,
  overlayHistoryPushed: false,
  /** @type {any} */
  preOverlayState: null,
  /** @type {number|null} */
  overlayOpenedAt: null,
  _savedScrollY: 0,

  /** @type {any} */
  debounceTimeout: null,
  /** @type {any} */
  scrollIdleTimer: null,
  isScrollingActive: false,
  lastKeyboardToggleTime: 0,
  isSoftKeyboardOpen: false,
  _timeouts: new Set(),
};

// ── SearchService Orchestrator ────────────────────────────────────────────
export const SearchService = {
  _initialized: false,

  async loadData() {
    try {
      // @ts-ignore
      if (window.ConDataService?.getAssembled) {
        // @ts-ignore
        const data = await window.ConDataService.getAssembled();
        if (data) {
          State.apiData = data;
          await SearchEngine.init(data);
          return data;
        }
      }
    } catch (e) {
      console.warn('[SearchService] ConDataService fetch failed, falling back to db.min.json:', e);
    }

    try {
      const res = await fetch(CONFIG.DB.path || DB.path);
      const data = await res.json();
      State.apiData = data;
      await SearchEngine.init(data);
      return data;
    } catch (e) {
      console.error('[SearchService] Failed to load database:', e);
      return null;
    }
  },

  /**
   * @param {string} rawQuery
   * @param {Object} [options]
   * @param {string} [options.q]
   * @param {string} [options.type]
   * @param {string} [options.category]
   * @param {boolean} [options.fromURL]
   * @param {boolean} [options.restore]
   * @param {boolean} [options.skipURL]
   * @param {boolean} [options.keepPlaceholder]
   * @param {boolean} [options.closeOverlay]
   */
  doSearch(rawQuery, options = {}) {
    const q = String(rawQuery || '').trim();

    // Preserve category filter state unless explicitly overridden
    if (options.category) {
      State.selectedCategory = options.category;
    }
    if (options.type) {
      State.selectedType = options.type;
    }

    if (!q) {
      State.currentResults = [];
      State.currentFilteredResults = [];
      const container = DOMService.get(CONFIG.DOM.searchResultsId);
      if (container && !options.keepPlaceholder) {
        DOMService.setHTML(
          container,
          `<div class="search-result-placeholder"><p>${LanguageService.t('search_result_here')}</p></div>`
        );
      }
      DiscoveryService.destroy();
      return;
    }

    try {
      const searchRes = SearchEngine.search(q, State.selectedType);
      let results = searchRes.results || [];

      if (State.selectedCategory && State.selectedCategory !== 'all') {
        const catLower = State.selectedCategory.toLowerCase();
        results = results.filter(
          (/** @type {any} */ r) =>
            (r.catName || '').toLowerCase() === catLower || (r.category?.name?.en || '').toLowerCase() === catLower
        );
      }

      State.currentResults = results;
      State.currentFilteredResults = results;

      RenderingService.renderResults(results, { query: q });

      if (!options.fromURL && !options.restore && !options.skipURL) {
        URLService.commitSearch({
          q,
          type: State.selectedType,
          category: State.selectedCategory,
        });
      }

      if (OverlayService.close && options.closeOverlay !== false) {
        OverlayService.close('search');
      }
    } catch (err) {
      console.error('[SearchService] Search execution failed:', err);
      State.currentResults = [];
      RenderingService.renderResults([], { query: q });
    }
  },

  async doSearchFromURL() {
    await this.loadData();

    const params = URLService.getParams();
    const q = params.q || '';
    const type = params.type || 'all';
    const category = params.category || 'all';

    if (q) {
      const input = /** @type {HTMLInputElement|null} */ (DOMService.get(CONFIG.DOM.searchInputId));
      if (input) {
        input.value = q;
        ClearBtnService.update(q);
      }

      State.selectedType = type;
      State.selectedCategory = category;

      this.doSearch(q, { fromURL: true, type, category });
    }
  },

  async init() {
    if (this._initialized) return;

    UIService.setupAutoSearchInput(
      (/** @type {any} */ val) => {
        SuggestionService.renderQuerySuggestions(val);
      },
      (/** @type {any} */ val) => {
        this.doSearch(val);
      }
    );

    FilterService.setupTypeFilter((/** @type {any} */ type) => {
      State.selectedType = type;
      const input = /** @type {HTMLInputElement|null} */ (DOMService.get(CONFIG.DOM.searchInputId));
      this.doSearch(input?.value || '');
    });

    FilterService.setupCategoryFilter((/** @type {any} */ category) => {
      State.selectedCategory = category;
      const input = /** @type {HTMLInputElement|null} */ (DOMService.get(CONFIG.DOM.searchInputId));
      this.doSearch(input?.value || '');
    });

    // Handle popstate for back/forward navigation
    window.addEventListener('popstate', (ev) => {
      const params = URLService.getParams();
      const q = params.q || '';
      const input = /** @type {HTMLInputElement|null} */ (DOMService.get(CONFIG.DOM.searchInputId));
      if (input) {
        input.value = q;
        ClearBtnService.update(q);
      }
      if (q) {
        this.doSearch(q, {
          restore: true,
          type: params.type || 'all',
          category: params.category || 'all',
        });
      } else {
        this.doSearch('', { restore: true });
      }
    });

    // Event-driven data readiness and initial URL search
    await this.loadData();

    // Check for stashed pending search or URL query
    const pending = /** @type {{ q?: string, type?: string, category?: string } | null} */ (
      // @ts-ignore
      window.__pendingSearch
    );
    if (pending && pending.q) {
      const input = /** @type {HTMLInputElement|null} */ (DOMService.get(CONFIG.DOM.searchInputId));
      if (input) input.value = pending.q;
      // @ts-ignore
      delete window.__pendingSearch;
      this.doSearch(pending.q, { type: pending.type, category: pending.category });
    } else {
      await this.doSearchFromURL();
    }

    this._initialized = true;
  },

  destroy() {
    RenderingService.disconnectRenderObserver();
    DiscoveryService.destroy();
    this._initialized = false;
  },
};

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.SearchModules = window.SearchModules || {};
  // @ts-ignore
  Object.assign(window.SearchModules, {
    State,
    SearchService,
  });
}

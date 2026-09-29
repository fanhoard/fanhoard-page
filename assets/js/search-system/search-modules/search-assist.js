// @ts-check
/**
 * @file search-assist.js
 * SuggestionService  — query suggestions as user types
 * ReadyModeService   — trending suggestions when search input is empty
 * DiscoveryService   — post-search related content cards (YouTube-style)
 *
 * @module search-assist
 */

import { CONFIG } from './config.js';
import { DOMService, StringService, LanguageService, HighlightService, NotificationService } from './utils.js';
import { renderResultItem } from './ui.js';
import { SearchEngine } from './engine.js';

// Helper to ensure URE is loaded before discovery rendering
function ensureURE() {
  // @ts-ignore
  if (window.URE && window.URE.mount) return Promise.resolve(window.URE);
  return new Promise((resolve) => {
    const onReady = () => {
      window.removeEventListener('ure:ready', onReady);
      clearInterval(interval);
      // @ts-ignore
      resolve(window.URE);
    };
    window.addEventListener('ure:ready', onReady);
    const interval = setInterval(() => {
      // @ts-ignore
      if (window.URE && window.URE.mount) {
        window.removeEventListener('ure:ready', onReady);
        clearInterval(interval);
        // @ts-ignore
        resolve(window.URE);
      }
    }, 20);
  });
}

// ── ReadyModeService ────────────────────────────────────────────────────────
export const ReadyAssistService = {
  extractSmartNames() {
    try {
      const all = SearchEngine.generateAllKeywords();
      if (!all || !all.length) return [];

      const seen = new Set();
      const rawCandidates = [];

      for (let i = 0; i < all.length; i++) {
        const name = all[i]?.raw || all[i]?.itemName || '';
        if (!name) continue;

        if (/^[a-zA-Z0-9_\-\s]+$/.test(name)) continue;

        const norm = name.toLowerCase().trim();
        if (seen.has(norm)) continue;
        seen.add(norm);

        rawCandidates.push(name);
      }

      if (rawCandidates.length === 0) {
        for (let i = 0; i < Math.min(all.length, 30); i++) {
          const name = all[i]?.raw || all[i]?.itemName || '';
          if (name && !seen.has(name.toLowerCase())) {
            seen.add(name.toLowerCase());
            rawCandidates.push(name);
          }
        }
      }

      const activeLang = LanguageService.getLang();
      const primaryList = [];
      const secondaryList = [];

      for (let i = 0; i < rawCandidates.length; i++) {
        const cand = rawCandidates[i];
        const isThai = LanguageService.hasThaiChars(cand);
        const matchesPrimary = activeLang === 'th' ? isThai : !isThai;

        if (matchesPrimary) {
          primaryList.push(cand);
        } else {
          secondaryList.push(cand);
        }
      }

      const orderedNames = [...primaryList, ...secondaryList];

      const out = [];
      const limit = Math.min(orderedNames.length, 12);
      for (let i = 0; i < limit; i++) {
        const raw = orderedNames[i];
        out.push({
          raw,
          highlightedHtml: StringService.escapeHtml(raw),
        });
      }

      return out;
    } catch (e) {
      console.error('[ReadyAssistService] extractSmartNames failed:', e);
      return [];
    }
  },

  renderTrendingSuggestions(state = {}) {
    const container = DOMService.get(CONFIG.DOM.suggestionContainerId);
    if (!container) return;

    const names = this.extractSmartNames();
    if (!names.length) {
      DOMService.setHTML(container, '');
      return;
    }

    const itemsHtml = names
      .map((item) => {
        const rawEsc = StringService.escapeHtml(item.raw);
        return `
        <li class="suggestion-item suggestion-item--trending" data-val="${rawEsc}">
          <span class="suggestion-icon suggestion-icon--trending" aria-hidden="true">
            <svg width="16" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
          </span>
          <span class="suggestion-text">${item.highlightedHtml}</span>
        </li>
      `;
      })
      .join('');

    const trendingLabel = LanguageService.t('trending');
    const fullHtml = `
      <div class="suggestion-group suggestion-group--trending">
        <div class="suggestion-group__label">
          <span class="suggestion-group__label-text">${StringService.escapeHtml(trendingLabel)}</span>
        </div>
        <ul class="suggestion-list">${itemsHtml}</ul>
      </div>
    `;

    DOMService.setHTML(container, fullHtml);

    const list = container.querySelector('.suggestion-list');
    if (list) {
      list.addEventListener('click', (ev) => {
        const target = /** @type {HTMLElement} */ (ev.target);
        const itemEl = target.closest('.suggestion-item');
        if (!itemEl) return;

        const val = itemEl.getAttribute('data-val');
        if (val) {
          const input = /** @type {HTMLInputElement|null} */ (DOMService.get(CONFIG.DOM.searchInputId));
          if (input) {
            input.value = val;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          }
        }
      });
    }
  },
};

// ── SuggestionService ───────────────────────────────────────────────────────
export const SearchAssistService = {
  /**
   * @param {string} [query]
   * @param {number} [maxCount]
   */
  renderQuerySuggestions(query, maxCount) {
    const container = DOMService.get(CONFIG.DOM.suggestionContainerId);
    if (!container) return;

    const q = String(query || '').trim();
    if (!q) {
      ReadyAssistService.renderTrendingSuggestions();
      return;
    }

    maxCount = maxCount || CONFIG.RENDER.suggestionMax;
    const rawSuggestions = SearchEngine.querySuggestions(q, maxCount * 2) || [];
    if (!rawSuggestions.length) {
      DOMService.setHTML(container, '');
      return;
    }

    const langInfo = LanguageService.detectQueryLanguage(q);
    const queryLang = langInfo.language;

    const primaryList = [];
    const secondaryList = [];

    for (let i = 0; i < rawSuggestions.length; i++) {
      const sug = rawSuggestions[i];
      const text = sug.display || sug.raw || '';
      const isThai = LanguageService.hasThaiChars(text);
      const matchesQueryLang = queryLang === 'th' ? isThai : !isThai;

      if (matchesQueryLang) {
        primaryList.push(sug);
      } else {
        secondaryList.push(sug);
      }
    }

    const orderedSuggestions = [...primaryList, ...secondaryList].slice(0, maxCount);

    const labelText = LanguageService.t('suggestion_label');
    const itemsHtml = orderedSuggestions
      .map((sug) => {
        const text = sug.display || sug.raw || '';
        const highlighted = HighlightService.highlightMatches(text, q);
        const rawEsc = StringService.escapeHtml(text);
        const sourceClass = sug.source ? ` suggestion-item--${sug.source}` : '';

        let badgeHtml = '';
        if (sug.source === 'type' && sug.typeName) {
          badgeHtml = `<span class="suggestion-badge suggestion-badge--type">${StringService.escapeHtml(
            sug.typeName
          )}</span>`;
        } else if (sug.source === 'category' && sug.catName) {
          badgeHtml = `<span class="suggestion-badge suggestion-badge--category">${StringService.escapeHtml(
            sug.catName
          )}</span>`;
        }

        return `
        <li class="suggestion-item${sourceClass}" data-val="${rawEsc}">
          <span class="suggestion-icon" aria-hidden="true">${CONFIG.Icons.search}</span>
          <span class="suggestion-text">${highlighted}</span>
          ${badgeHtml}
        </li>
      `;
      })
      .join('');

    const fullHtml = `
      <div class="suggestion-group">
        <div class="suggestion-group__label">
          <span class="suggestion-group__label-text">${StringService.escapeHtml(labelText)}</span>
        </div>
        <ul class="suggestion-list">${itemsHtml}</ul>
      </div>
    `;

    DOMService.setHTML(container, fullHtml);

    const list = container.querySelector('.suggestion-list');
    if (list) {
      list.addEventListener('click', (ev) => {
        const target = /** @type {HTMLElement} */ (ev.target);
        const itemEl = target.closest('.suggestion-item');
        if (!itemEl) return;

        const val = itemEl.getAttribute('data-val');
        if (val) {
          const input = /** @type {HTMLInputElement|null} */ (DOMService.get(CONFIG.DOM.searchInputId));
          if (input) {
            input.value = val;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
          }
        }
      });
    }
  },
};

// ── DiscoveryService ────────────────────────────────────────────────────────
export const DiscoveryAssistService = {
  /** @type {any} */
  _handle: null,

  /**
   * @param {string} [query]
   * @param {any[]} [primaryResults]
   */
  async renderDiscovery(query, primaryResults) {
    const resultsContainer = DOMService.get(CONFIG.DOM.searchResultsId);
    if (!resultsContainer) return;

    let discoveryContainer = DOMService.get(CONFIG.DOM.discoveryContainerId);
    if (!discoveryContainer) {
      discoveryContainer = DOMService.create('div', CONFIG.DOM.discoveryContainerId, 'search-discovery-section');
      if (resultsContainer.parentNode) {
        if (discoveryContainer) resultsContainer.after(discoveryContainer);
      }
    }

    const items = SearchEngine.queryRelated(query, primaryResults, CONFIG.DISCOVERY.maxRelatedItems);
    if (!items || !items.length) {
      this.destroy();
      return;
    }

    const title = LanguageService.t('discovery_label');
    const hint = LanguageService.t('discovery_hint');

    if (discoveryContainer) {
      DOMService.setHTML(
        /** @type {any} */ (discoveryContainer),
        `
        <div class="discovery-header">
          <h3 class="discovery-title">${StringService.escapeHtml(title)}</h3>
          <p class="discovery-hint">${StringService.escapeHtml(hint)}</p>
        </div>
        <div class="discovery-list" id="${CONFIG.DOM.discoverySentinelId}"></div>
      `
      );
    }

    if (!discoveryContainer) return;
    const listEl = discoveryContainer.querySelector('.discovery-list');
    if (!listEl) return;

    const ure = await ensureURE();
    if (!ure) return;

    if (this._handle) {
      try {
        /** @type {any} */ (this._handle).setData(items);
        return;
      } catch (e) {
        console.error('[DiscoveryAssistService] URE setData failed, re-mounting:', e);
        this.destroy();
      }
    }

    this._handle = ure.mount({
      container: listEl,
      data: items,
      keyField: 'api',
      buffer: 300,
      template: (/** @type {any} */ item, /** @type {string} */ [lang]) => renderResultItem(item, lang),
    });

    const htmlListEl = /** @type {HTMLElement} */ (listEl);
    if (!htmlListEl.dataset.copyBound) {
      htmlListEl.dataset.copyBound = 'true';
      const handleCopy = (/** @type {Event} */ ev) => {
        const target = /** @type {HTMLElement} */ (ev.target);
        const card = target.closest('.result-card');
        if (!card) return;
        if (ev.type === 'keydown') {
          const ke = /** @type {KeyboardEvent} */ (ev);
          if (ke.key !== 'Enter' && ke.key !== ' ') return;
          ke.preventDefault();
        }
        const rawText = card.getAttribute('data-text');
        const copyText = rawText ? StringService.decodeUrl(rawText) : (card.getAttribute('data-copy') || '');
        if (copyText) {
          NotificationService.copyToClipboard(copyText);
        }
      };
      htmlListEl.addEventListener('click', handleCopy);
      htmlListEl.addEventListener('keydown', handleCopy);
    }
  },

  destroy() {
    if (this._handle) {
      try {
        /** @type {any} */ (this._handle).destroy?.();
      } catch (e) {
        console.error('[DiscoveryAssistService] URE teardown error:', e);
      }
      this._handle = null;
    }
    const el = DOMService.get(CONFIG.DOM.discoveryContainerId);
    if (el) DOMService.remove(el);
  },
};

// Backward-compatibility aliases
export const SuggestionService = SearchAssistService;
export const ReadyModeService = ReadyAssistService;
export const DiscoveryService = DiscoveryAssistService;

export const SearchAssist = {
  SearchAssistService,
  ReadyAssistService,
  DiscoveryAssistService,
  SuggestionService,
  ReadyModeService,
  DiscoveryService,
};

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.SearchModules = window.SearchModules || {};
  // @ts-ignore
  Object.assign(window.SearchModules, {
    SearchAssistService,
    ReadyAssistService,
    DiscoveryAssistService,
    SearchAssist,
    ReadyModeService,
    SuggestionService,
    DiscoveryService,
  });
}

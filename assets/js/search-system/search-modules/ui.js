// @ts-check
/**
 * @file ui.js
 * Unified UI Controller: rendering, filter pills, input bar, overlay transitions, soft keyboard.
 *
 * Merges: rendering.js, overlay.js, input-bar.js, keyboard.js
 *
 * @module ui
 */

import { CONFIG } from './config.js';
import { DOMService, StringService, LanguageService, NotificationService } from './utils.js';
import { SuggestionService, ReadyModeService, DiscoveryService } from './suggestions.js';

// URE Readiness Guard
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

// ── IconSlotService ────────────────────────────────────────────────────────
export const IconSlotService = {
  /** @type {EventListener|null} */
  _clickHandler: null,
  /** @type {EventListener|null} */
  _keyHandler: null,

  _slot: () => DOMService.query('.search-pill__icon'),

  update() {
    const slot = this._slot();
    if (!slot) return;

    const overlayContainer = DOMService.get(CONFIG.DOM.overlayContainerId);
    const isOverlayOpen = overlayContainer && overlayContainer.classList.contains('active');

    if (isOverlayOpen) {
      slot.innerHTML = CONFIG.Icons.back;
      DOMService.setAttr(slot, 'aria-label', LanguageService.t('back'));
      DOMService.setAttr(slot, 'role', 'button');
      DOMService.setAttr(slot, 'tabindex', '0');

      if (!this._clickHandler) {
        this._clickHandler = () => OverlayService.close('manual');
        this._keyHandler = (/** @type {any} */ e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            OverlayService.close('manual');
          }
        };
        DOMService.on(slot, 'click', this._clickHandler);
        DOMService.on(slot, 'keydown', this._keyHandler);
      }
    } else {
      slot.innerHTML = CONFIG.Icons.search;
      DOMService.setAttr(slot, 'aria-label', LanguageService.t('type'));
      slot.removeAttribute('role');
      slot.removeAttribute('tabindex');

      if (this._clickHandler) {
        if (this._clickHandler) DOMService.off(slot, 'click', this._clickHandler);
        if (this._keyHandler) DOMService.off(slot, 'keydown', this._keyHandler);
        this._clickHandler = null;
        this._keyHandler = null;
      }
    }
  },
};

// ── ClearBtnService ─────────────────────────────────────────────────────────
export const ClearBtnService = {
  _btn: () => DOMService.get(CONFIG.DOM.clearBtnId),

  /** @param {string} [val] */
  update(val) {
    const btn = this._btn();
    if (!btn) return;
    const hasVal = Boolean(val && String(val).trim().length > 0);
    if (hasVal) {
      btn.classList.add('visible');
      DOMService.setAttr(btn, 'aria-hidden', 'false');
    } else {
      btn.classList.remove('visible');
      DOMService.setAttr(btn, 'aria-hidden', 'true');
    }
  },

  /** @param {Function} [onClear] */
  setupListener(onClear) {
    const btn = this._btn();
    if (!btn) return;
    // @ts-ignore
    if (btn._clearListenerAttached) return;
    // @ts-ignore
    btn._clearListenerAttached = true;

    DOMService.on(btn, 'click', (/** @type {any} */ e) => {
      e.preventDefault();
      const input = /** @type {HTMLInputElement|null} */ (DOMService.get(CONFIG.DOM.searchInputId));
      if (input) {
        input.value = '';
        input.focus();
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      this.update('');
      if (typeof onClear === 'function') onClear();
    });
  },
};

// ── Keyboard & Gap Services ─────────────────────────────────────────────────
export const GapBasedKeyboardService = {
  lastToggleTime: 0,
  isScrollingActive: false,
  /** @type {any} */
  scrollIdleTimer: null,

  isGapExpired() {
    return Date.now() - this.lastToggleTime >= CONFIG.TIMING.keyboardGapMinMs;
  },
  recordToggle() {
    this.lastToggleTime = Date.now();
  },
  markScroll() {
    this.isScrollingActive = true;
    if (this.scrollIdleTimer) clearTimeout(this.scrollIdleTimer);
    this.scrollIdleTimer = setTimeout(() => {
      this.isScrollingActive = false;
    }, CONFIG.TIMING.keyboardIdleTimeMs);
  },
};

export const KeyboardService = {
  /** @type {EventListener|null} */
  _vvResizeHandler: null,
  isSoftKeyboardOpen: false,

  init() {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    let initialHeight = window.visualViewport.height;

    this._vvResizeHandler = () => {
      if (!window.visualViewport) return;
      const currentHeight = window.visualViewport.height;
      const heightDiff = initialHeight - currentHeight;

      if (heightDiff > 150) {
        this.isSoftKeyboardOpen = true;
      } else if (heightDiff < 50) {
        this.isSoftKeyboardOpen = false;
      }
    };

    window.visualViewport.addEventListener('resize', this._vvResizeHandler);
  },

  destroy() {
    if (this._vvResizeHandler && typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this._vvResizeHandler);
      this._vvResizeHandler = null;
    }
  },
};

export const KeyboardAutoToggleService = {
  /** @type {EventListener|null} */
  _scrollHandler: null,

  enableAutoToggle() {
    if (typeof window === 'undefined') return;

    this._scrollHandler = () => {
      GapBasedKeyboardService.markScroll();
      if (KeyboardService.isSoftKeyboardOpen && GapBasedKeyboardService.isGapExpired()) {
        const active = document.activeElement;
        if (active && active.id === CONFIG.DOM.searchInputId) {
          /** @type {HTMLElement} */ (active).blur();
          GapBasedKeyboardService.recordToggle();
        }
      }
    };

    window.addEventListener('scroll', this._scrollHandler, { passive: true });
  },

  disableAutoToggle() {
    if (this._scrollHandler && typeof window !== 'undefined') {
      window.removeEventListener('scroll', this._scrollHandler);
      this._scrollHandler = null;
    }
  },
};

// ── OverlayService ──────────────────────────────────────────────────────────
export const OverlayService = {
  _savedScrollY: 0,

  open() {
    let container = DOMService.get(CONFIG.DOM.overlayContainerId);
    if (!container) {
      container = DOMService.create('div', CONFIG.DOM.overlayContainerId, 'search-overlay-container');
      DOMService.setHTML(
        /** @type {any} */ (container),
        `
        <div id="overlay-header-bar" class="overlay-header-bar"></div>
        <div class="search-overlay-scrollable-content">
          <div id="${CONFIG.DOM.suggestionContainerId}"></div>
        </div>
      `
      );
      if (container) document.body.appendChild(container);
    }

    this._savedScrollY = window.scrollY;
    if (container) {
      container.classList.add('active');
    }
    document.body.classList.add('search-overlay-open');

    IconSlotService.update();
    KeyboardService.init();
    KeyboardAutoToggleService.enableAutoToggle();

    const input = DOMService.get(CONFIG.DOM.searchInputId);
    if (input) {
      setTimeout(() => input.focus(), CONFIG.TIMING.focusDelayMs);
    }

    ReadyModeService.renderTrendingSuggestions();
  },

  close(reason = 'manual') {
    const container = DOMService.get(CONFIG.DOM.overlayContainerId);
    if (container) {
      container.classList.remove('active');
    }
    document.body.classList.remove('search-overlay-open');

    IconSlotService.update();
    KeyboardService.destroy();
    KeyboardAutoToggleService.disableAutoToggle();

    if (this._savedScrollY > 0) {
      window.scrollTo(0, this._savedScrollY);
      this._savedScrollY = 0;
    }
  },
};

// ── RenderingService & FilterService ───────────────────────────────────────
export const RenderingService = {
  /** @type {any} */
  _searchHandle: null,

  disconnectRenderObserver() {
    if (this._searchHandle) {
      try {
        /** @type {any} */ (this._searchHandle).destroy?.();
      } catch (e) {
        console.error('[RenderingService] URE teardown error:', e);
      }
      this._searchHandle = null;
    }
  },

  /**
   * @param {any[]} [results]
   * @param {Object} [options]
   * @param {string} [options.query]
   */
  async renderResults(results, options = {}) {
    const container = DOMService.get(CONFIG.DOM.searchResultsId);
    if (!container) return;

    const list = Array.isArray(results) ? results : [];

    if (!list.length) {
      const notFoundMsg = LanguageService.t('not_found');
      const hintMsg = LanguageService.t('not_found_hint');
      DOMService.setHTML(
        container,
        `
        <div class="search-no-results">
          <p class="search-no-results__title">${StringService.escapeHtml(notFoundMsg)}</p>
          <p class="search-no-results__hint">${StringService.escapeHtml(hintMsg)}</p>
        </div>
      `
      );
      DiscoveryService.renderDiscovery(options.query || '', []);
      return;
    }

    const ure = await ensureURE();
    if (!ure) return;

    if (this._searchHandle) {
      try {
        /** @type {any} */ (this._searchHandle).setData(list);
        DiscoveryService.renderDiscovery(options.query || '', list);
        return;
      } catch (e) {
        console.error('[RenderingService] URE setData failed, re-mounting:', e);
        this.disconnectRenderObserver();
      }
    }

    try {
      this._searchHandle = ure.mount({
        container: container,
        data: list,
        keyField: 'api',
        buffer: 300,
        template: (/** @type {any} */ item) => {
          const raw = item.item || item;
          const name = item.itemName || raw.name || '';
          const api = raw.api || '';
          const text = raw.text || '';
          const copyVal = text || api || name;
          const escCopy = StringService.escapeHtml(copyVal);
          const escName = StringService.escapeHtml(name);

          return `
            <div class="search-card" data-copy="${escCopy}">
              <div class="search-card-main">
                <span class="search-card-symbol">${StringService.escapeHtml(api || text)}</span>
                <span class="search-card-name">${escName}</span>
              </div>
            </div>
          `;
        },
      });

      // Delegate copy click handler
      if (!container.dataset.copyBound) {
        container.dataset.copyBound = 'true';
        container.addEventListener('click', (ev) => {
          const target = /** @type {HTMLElement} */ (ev.target);
          const card = target.closest('.search-card');
          if (!card) return;
          const copyText = card.getAttribute('data-copy');
          if (copyText) {
            NotificationService.copyToClipboard(copyText);
          }
        });
      }

      DiscoveryService.renderDiscovery(options.query || '', list);
    } catch (e) {
      console.error('[RenderingService] URE mount failed:', e);
    }
  },
};

export const FilterService = {
  /** @param {Function} [onSelect] */
  setupTypeFilter(onSelect) {
    const container = DOMService.get(CONFIG.DOM.typeFilterContainerId);
    if (!container) return;

    container.addEventListener('click', (ev) => {
      const target = /** @type {HTMLElement} */ (ev.target);
      const pill = target.closest('.filter-pill');
      if (!pill) return;

      const type = pill.getAttribute('data-type') || 'all';

      container.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');

      if (typeof onSelect === 'function') onSelect(type);
    });
  },

  /** @param {Function} [onSelect] */
  setupCategoryFilter(onSelect) {
    const container = DOMService.get(CONFIG.DOM.categoryFilterContainerId);
    if (!container) return;

    container.addEventListener('click', (ev) => {
      const target = /** @type {HTMLElement} */ (ev.target);
      const pill = target.closest('.filter-pill');
      if (!pill) return;

      const category = pill.getAttribute('data-category') || 'all';

      container.querySelectorAll('.filter-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');

      if (typeof onSelect === 'function') onSelect(category);
    });
  },
};

// ── UIService ───────────────────────────────────────────────────────────────
export const UIService = {
  buildWrapper() {},

  /**
   * @param {Function} [onInput]
   * @param {Function} [onEnter]
   */
  setupAutoSearchInput(onInput, onEnter) {
    const input = /** @type {HTMLInputElement|null} */ (DOMService.get(CONFIG.DOM.searchInputId));
    if (!input) return;

    ClearBtnService.setupListener(() => {
      if (typeof onInput === 'function') onInput('');
    });

    /** @type {any} */
    let debounceTimer = null;

    input.addEventListener('input', () => {
      const val = input.value;
      ClearBtnService.update(val);

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (typeof onInput === 'function') onInput(val);
      }, CONFIG.TIMING.debounceMs);
    });

    const form = DOMService.get(CONFIG.DOM.searchFormId);
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (debounceTimer) {
          clearTimeout(debounceTimer);
          debounceTimer = null;
        }
        if (typeof onEnter === 'function') onEnter(input.value);
      });
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (debounceTimer) {
          clearTimeout(debounceTimer);
          debounceTimer = null;
        }
        if (typeof onEnter === 'function') onEnter(input.value);
      }
    });

    input.addEventListener('focus', () => {
      OverlayService.open();
    });
  },
};

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.SearchModules = window.SearchModules || {};
  // @ts-ignore
  Object.assign(window.SearchModules, {
    IconSlotService,
    ClearBtnService,
    GapBasedKeyboardService,
    KeyboardService,
    KeyboardAutoToggleService,
    OverlayService,
    RenderingService,
    FilterService,
    UIService,
  });
}

// @ts-check
/**
 * @file input-bar.js
 * Manages the .search-pill widget.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  .search-pill  (flex row)                         │
 * │  ┌──────────┐ ┌──────────────────────────┐ ┌────────────┐  │
 * │  │ icon-slot│ │     #searchInput          │ │ clear-btn  │  │
 * │  └──────────┘ └──────────────────────────┘ └────────────┘  │
 * └─────────────────────────────────────────────────────────────┘
 *
 * IconSlotService   — swaps 🔍 ↔ ← inside .search-pill__icon.
 * ClearBtnService   — shows/hides the ✕ button based on input value.
 * UIService         — attaches input/filter listeners; buildWrapper()
 *                     ensures correct DOM order on init.
 *
 * @module input-bar
 * @depends {config.js, state.js, utils.js}
 */
(function (M) {
  'use strict';

  const { CONFIG, State, Handlers, DOMService, LanguageService } = M;

  // ── IconSlotService ─────────────────────────────────────────────────────
  const IconSlotService = {
    /** @type {Function|null} */ _clickHandler : null,
    /** @type {Function|null} */ _keyHandler   : null,

    /** @returns {Element|null} */
    _slot: () => DOMService.query('.search-pill__icon'),

    /**
     * Recalculate which icon to show and rebind listeners.
     * Call after: overlay opens/closes, input value changes, clear clicked.
     */
    update() {
      const slot = this._slot();
      if (!slot) return;

      const hasQuery = (DOMService.get(CONFIG.DOM.searchInputId)?.value || '').trim().length > 0;
      const showBack = State.overlayOpen || hasQuery;

      // Remove stale listeners before adding new ones
      if (this._clickHandler) { slot.removeEventListener('click',   this._clickHandler); this._clickHandler = null; }
      if (this._keyHandler)   { slot.removeEventListener('keydown', this._keyHandler);   this._keyHandler   = null; }

      if (showBack) {
        slot.innerHTML = M.CONFIG.Icons.back;
        slot.setAttribute('role',       'button');
        slot.setAttribute('tabindex',   '0');
        slot.setAttribute('aria-label', LanguageService.t('back'));
        slot.style.cssText = 'cursor:pointer;color:var(--tx-mid,#2b4539);pointer-events:auto;';

        this._clickHandler = (e) => { e.preventDefault(); e.stopPropagation(); history.back(); };
        this._keyHandler   = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); history.back(); } };

        slot.addEventListener('click',   this._clickHandler);
        slot.addEventListener('keydown', this._keyHandler);
      } else {
        slot.innerHTML = M.CONFIG.Icons.search;
        slot.setAttribute('role', 'presentation');
        slot.removeAttribute('tabindex');
        slot.removeAttribute('aria-label');
        slot.style.cssText = 'cursor:default;pointer-events:none;';
      }
    },
  };

  // ── ClearBtnService ─────────────────────────────────────────────────────
  const ClearBtnService = {
    /** @type {HTMLElement|null} */ _btn: null,

    /**
     * Build the ✕ button and return it.
     * Safe to call multiple times — only creates the element once.
     * @returns {HTMLElement}
     */
    build() {
      let btn = DOMService.get(CONFIG.DOM.clearBtnId);
      if (!btn) {
        btn = Object.assign(document.createElement('button'), {
          id       : CONFIG.DOM.clearBtnId,
          type     : 'button',
          innerHTML: M.CONFIG.Icons.clear,
        });
        btn.setAttribute('aria-label', LanguageService.t('clear'));
        Object.assign(btn.style, {
          flexShrink            : '0',
          display               : 'none',   // shown via sync()
          alignItems            : 'center',
          justifyContent        : 'center',
          width                 : '44px',
          height                : '44px',
          minWidth              : '44px',
          minHeight             : '44px',
          borderRadius          : '50%',
          background            : 'rgba(0,0,0,.10)',
          border                : 'none',
          cursor                : 'pointer',
          color                 : 'var(--tx-lo,#637a6e)',
          padding               : '0',
          WebkitTapHighlightColor: 'transparent',
        });
      }

      if (!btn._clearListenerAttached) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (State.debounceTimeout) {
            clearTimeout(State.debounceTimeout);
            State.debounceTimeout = null;
          }
          const inp = DOMService.get(CONFIG.DOM.searchInputId);
          if (inp) { inp.value = ''; inp.focus(); }
          this.sync();
          IconSlotService.update();
          M.SearchService.doSearch(null, false);
        });
        btn._clearListenerAttached = true;
      }

      this._btn = btn;
      return btn;
    },

    /** Show or hide the ✕ button depending on whether the input has text. */
    sync() {
      const btn     = this._btn || DOMService.get(CONFIG.DOM.clearBtnId);
      if (!btn) return;
      const hasText = (DOMService.get(CONFIG.DOM.searchInputId)?.value || '').length > 0;
      btn.style.display = hasText ? 'flex' : 'none';
    },
  };

  // ── UIService ───────────────────────────────────────────────────────────
  const UIService = {
    /** @type {boolean} */ _wrapperBuilt: false,

    /**
     * Ensure .search-pill contains elements in correct flex order:
     *   [.search-pill__icon] [#searchInput] [#search-clear-btn]
     */
    buildWrapper() {
      if (this._wrapperBuilt) return;
      const wrapper = DOMService.query('.search-pill');
      const inp     = DOMService.get(CONFIG.DOM.searchInputId);
      if (!wrapper || !inp) return;

      let slot = wrapper.querySelector('.search-pill__icon');
      if (!slot) {
        slot = DOMService.create('span', null, 'search-pill__icon');
        wrapper.insertBefore(slot, wrapper.firstChild);
      }
      slot.innerHTML = M.CONFIG.Icons.search;

      if (slot.nextSibling !== inp) wrapper.insertBefore(inp, slot.nextSibling);

      const clearBtn = ClearBtnService.build();
      if (!wrapper.contains(clearBtn)) wrapper.appendChild(clearBtn);

      this._wrapperBuilt = true;
    },

    /**
     * Attach input listeners with unified debounce timer handling.
     */
    setupAutoSearchInput() {
      try {
        const inp = DOMService.get(CONFIG.DOM.searchInputId);
        if (!inp) return;
        DOMService.setAttr(inp, 'enterkeyhint', 'search');

        // Unified debounced input handler for typing, deletion, paste, and backspace
        Handlers.inputInput = () => {
          if (State.overlayTransitioning) return;
          ClearBtnService.sync();
          IconSlotService.update();
          if (State.debounceTimeout) {
            clearTimeout(State.debounceTimeout);
            State.debounceTimeout = null;
          }
          State.debounceTimeout = setTimeout(
            () => M.SuggestionService.renderQuerySuggestions(inp.value),
            CONFIG.TIMING.debounceMs
          );
        };
        inp.addEventListener('input', Handlers.inputInput);

        // Enter → run search & cancel pending suggestion timers immediately
        Handlers.inputKeydown = (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (State.debounceTimeout) {
              clearTimeout(State.debounceTimeout);
              State.debounceTimeout = null;
            }
            M.SearchService.doSearch();
            this.closeKB();
          } else if (e.key === 'ArrowDown') {
            DOMService.get(CONFIG.DOM.suggestionContainerId)?.querySelector('.search-suggestion-item')?.focus?.();
          }
        };
        inp.addEventListener('keydown', Handlers.inputKeydown);

        Handlers.inputFocus = () => { if (!State.overlayTransitioning) M.OverlayService.open(); };
        Handlers.inputClick = () => { if (!State.overlayTransitioning) M.OverlayService.open(); };
        inp.addEventListener('focus', Handlers.inputFocus);
        inp.addEventListener('click', Handlers.inputClick);

        IconSlotService.update();
        ClearBtnService.sync();
      } catch {}
    },

    setupFilters() {},
    onTypeChange() {},
    onCatChange() {},

    closeKB() {
      try {
        const inp = DOMService.get(CONFIG.DOM.searchInputId);
        if (inp && document.activeElement === inp) inp.blur();
      } catch {}
    },

    syncPlaceholder() {
      const inp = DOMService.get(CONFIG.DOM.searchInputId);
      if (inp) DOMService.setAttr(inp, 'placeholder', LanguageService.t('placeholder'));
    },
  };

  M.IconSlotService = IconSlotService;
  M.ClearBtnService = ClearBtnService;
  M.UIService       = UIService;

})(window.SearchModules = window.SearchModules || {});

// @ts-check
/**
 * @file overlay.js
 * OverlayService — opens and closes the fullscreen search overlay.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Overlay structure                                          │
 * │                                                             │
 * │  #search-overlay-container  (position:fixed, full screen)    │
 * │  ├── #overlay-header-bar                                    │
 * │  │    └── .search-pill  ← moved from header       │
 * │  └── .search-overlay-scrollable-content                     │
 * │       └── #search-suggestions-list                                │
 * │                                                             │
 * │  Results stay on the MAIN PAGE (#searchResults).           │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Close authority:
 *   OverlayService.close() is THE ONLY function that closes the overlay.
 *   Every close path routes here:
 *     Escape key   → close('escape')
 *     Back arrow   → history.back() → popstate → close('popstate')
 *     After search → close('manual')
 *     destroy()    → close('manual')
 *
 * close() owns:
 *   ① History collapse (collapseOverlayEntry or clear flag)
 *   ② VirtualScroll + keyboard auto-toggle cleanup
 *   ③ Return .search-pill to original header position
 *   ④ Remove overlay DOM
 *   ⑤ Restore page scroll
 *   ⑥ Remove document keydown listener
 *   ⑦ Reset all overlay state fields
 *   ⑧ Update icon slot
 *   ⑨ Restore nav
 *
 * Scroll restoration strategy:
 *   open()  → save history.scrollRestoration, set 'manual'.
 *             Prevents the browser's automatic scroll restore (fired after
 *             popstate returns) from overriding our explicit scrollTo() in
 *             close(). Without 'manual', the browser restores to 0 (the
 *             position recorded when the history entry was pushed while
 *             page was at top), cancelling our scrollTo(savedScrollY).
 *   close() → issue scrollTo(savedScrollY), THEN restore the original
 *             scrollRestoration mode. Order matters: restore must happen
 *             after our scrollTo so the browser does not immediately
 *             re-apply auto-restore for this entry.
 *
 * @module overlay
 * @depends {config.js, state.js, utils.js, url-history.js,
 *           keyboard.js, suggestions.js, input-bar.js}
 * Note: VirtualScrollEngine is owned by rendering.js, not imported here.
 */
(function (M) {
  'use strict';

  const {
    CONFIG, State, Handlers,
    DOMService, URLService,
    KeyboardAutoToggleService,
    ReadyModeService, SuggestionService,
    IconSlotService, ClearBtnService,
  } = M;

  // ── Scroll restoration guard ────────────────────────────────────────────
  // Saved value of history.scrollRestoration before overlay opens.
  // Set to 'manual' during overlay lifetime so the browser cannot
  // auto-restore scroll on popstate and override our explicit scrollTo.
  // Restored to original mode inside close() once our scrollTo has fired.
  let _scrollRestorationOrig = null;

  const OverlayService = {

    // ── Open ──────────────────────────────────────────────────────────────

    open() {
      try {
        if (State.overlayOpen || State.overlayTransitioning) return;
        State.overlayTransitioning = true;

        // Switch to manual scroll restoration BEFORE pushing any history entry.
        // This ensures the browser never auto-restores scroll position on
        // the popstate that fires when the overlay is closed via history.back().
        _scrollRestorationOrig = 'scrollRestoration' in history
          ? history.scrollRestoration
          : null;
        if (_scrollRestorationOrig !== null) history.scrollRestoration = 'manual';

        const inp = DOMService.get(CONFIG.DOM.searchInputId);
        if (inp) {
          inp.setAttribute('role', 'combobox');
          inp.setAttribute('aria-expanded', 'true');
          inp.setAttribute('aria-haspopup', 'listbox');
          inp.setAttribute('aria-controls', CONFIG.DOM.suggestionContainerId);
        }

        // Snapshot search state before overlay opens
        State.preOverlayState = {
          q        : inp?.value || '',
          type     : State.selectedType || 'all',
          category : State.selectedCategory || 'all',
        };
        State.overlayOpenedAt = Date.now();

        // Build or clear overlay container
        let ov = DOMService.get(CONFIG.DOM.overlayContainerId);
        if (ov) {
          ov.innerHTML = '';
          ov.className = 'search-overlay search-overlay-open search-overlay-active';
        } else {
          ov = DOMService.create('div', CONFIG.DOM.overlayContainerId, 'search-overlay search-overlay-open', {
            position       : 'fixed',
            inset          : '0',
            zIndex         : '9998',
            display        : 'flex',
            flexDirection  : 'column',
            alignItems     : 'stretch',
            overflow       : 'hidden',
            backgroundColor: 'var(--surface-base, #ffffff)',
          });
          document.body.appendChild(ov);
          if (typeof requestAnimationFrame === 'function') {
            requestAnimationFrame(() => {
              if (ov) ov.classList.add('search-overlay-active');
            });
          } else {
            ov.classList.add('search-overlay-active');
          }
        }

        // Move .search-pill into the overlay header bar
        const wrapper = DOMService.query('.search-pill');
        if (wrapper) {
          State.setWrapperParent(wrapper.parentNode, wrapper.nextSibling);

          const bar = DOMService.create('div', 'overlay-header-bar', null, {
            display      : 'flex',
            alignItems   : 'center',
            padding      : '8px 10px',
            background   : 'var(--surface-base, #ffffff)',
            borderBottom : '1px solid var(--border-subtle, rgba(0,0,0,.08))',
            flexShrink   : '0',
            width        : '100%',
            boxSizing    : 'border-box',
          });
          bar.appendChild(wrapper);
          ov.appendChild(bar);
        }

        // Suggestions scrollable area
        const sg = DOMService.create('div', CONFIG.DOM.suggestionContainerId, 'search-suggestions-fullscreen');
        sg.setAttribute('role', 'listbox');
        sg.setAttribute('aria-label', 'Search suggestions');
        const sc = DOMService.create('div', null, 'search-overlay-scrollable-content', {
          flex              : '1',
          width             : '100%',
          overflow          : 'auto',
          overscrollBehavior: 'contain',
          transform         : 'translateZ(0)',
          willChange        : 'scroll-position',
        });
        sc.appendChild(sg);
        ov.appendChild(sc);
        State.overlayScrollable = sc;

        // Delegate suggestion events onto the suggestion container
        Handlers.suggestionKeydown = (ev) => SuggestionService.handleKeydown(ev, sg);
        Handlers.suggestionClick   = (ev) => SuggestionService.handleClick(ev);
        DOMService.on(sg, 'keydown',    Handlers.suggestionKeydown);
        DOMService.on(sg, 'click',      Handlers.suggestionClick);
        DOMService.on(sg, 'mouseenter', () => { State.suggestionsLocked = true;  });
        DOMService.on(sg, 'mouseleave', () => { State.suggestionsLocked = false; });

        // ── Scroll-lock: no layout shift technique ─────────────────────────
        const _savedScrollY = window.scrollY || window.pageYOffset || 0;
        State.setSavedScrollY(_savedScrollY);

        // Bring page to top so overlay position:fixed inset:0 is correct
        if (_savedScrollY > 0) {
          window.scrollTo({ top: 0, behavior: 'instant' });
        }

        // Lock scroll — body fixed keeps it visually in place, no scrollbar jump.
        // ScrollLockCore is the only lock authority; search.js guarantees it
        // is loaded before these modules are initialized.
        const _lockCore = window.ScrollLockCore;
        if (!_lockCore) throw new Error('[Search/Overlay] ScrollLockCore unavailable');
        _lockCore.allowScrollIn('.search-overlay-scrollable-content');
        _lockCore.lock('search');

        // Escape → close (routed through OverlayService.close, the one authority)
        Handlers.documentKeydownOverlay = (e) => { if (e.key === 'Escape') OverlayService.close('escape'); };
        DOMService.on(document, 'keydown', Handlers.documentKeydownOverlay);

        State.overlayOpen = true;

        // Update icon → back arrow
        IconSlotService.update();
        ClearBtnService.sync();

        KeyboardAutoToggleService.enableAutoToggle(sc);
        this._hideNav();

        // Push overlay history entry (Stack B — see url-history.js)
        URLService.pushOverlayEntry(State.preOverlayState);

        // Clear transitioning flag BEFORE rendering suggestions.
        State.overlayTransitioning = false;

        // Show suggestions for the current input value immediately.
        const currentQ = (inp?.value || '').trim();
        if (currentQ) SuggestionService.renderQuerySuggestions(currentQ);
        else          ReadyModeService.renderReadyModeSuggestions();

        // Focus input, cursor at end, no text selection
        if (inp) {
          setTimeout(() => {
            try {
              inp.focus({ preventScroll: true });
              const l = inp.value.length;
              inp.setSelectionRange(l, l);
            } catch (e) { try { inp.focus(); } catch (err) { console.warn('[SearchModule:overlay]', err); } }
          }, CONFIG.TIMING.focusDelayMs);
        }
      } catch (e) {
        console.error('[OverlayService] open failed', e);
        State.overlayTransitioning = false;
      }
    },

    // ── Close (sole authority) ─────────────────────────────────────────────

    /**
     * Close the overlay. This is the ONLY function allowed to close it.
     *
     * @param {'escape'|'back-btn'|'popstate'|'manual'|string} src
     */
    close(src = 'manual') {
      try {
        if (!State.overlayOpen) return;
        State.overlayTransitioning = true;

        // ① History — determine the search state to commit on close
        const closingState = State.lastCommittedSearchState
          || State.preOverlayState
          || { q: '', type: 'all', category: 'all' };

        if (src === 'popstate') {
          // Browser already popped the overlay entry — just clear the flag
          State.overlayHistoryPushed = false;
        } else {
          // Replace the overlay entry with the current search state
          URLService.collapseOverlayEntry(closingState);
        }

        // ② Cleanup — VS owned by RenderingService, not overlay
        KeyboardAutoToggleService.disableAutoToggle();

        // ③ Return .search-pill to its original header position
        const wrapper = DOMService.query('.search-pill');
        if (wrapper && State._wrapperParent) {
          if (State._wrapperNext && State._wrapperNext.parentNode === State._wrapperParent) {
            State._wrapperParent.insertBefore(wrapper, State._wrapperNext);
          } else {
            State._wrapperParent.appendChild(wrapper);
          }
        }
        State._wrapperParent = null;
        State._wrapperNext   = null;

        // ④ Remove overlay DOM with active animation class cleanup
        const ovEl = DOMService.get(CONFIG.DOM.overlayContainerId);
        if (ovEl) {
          ovEl.classList.remove('search-overlay-active');
        }
        DOMService.remove(ovEl);

        // ⑤ Restore scroll-lock — reverse of the body-fixed technique
        const savedScrollY = State.getSavedScrollY() || 0;
        const _didSearch = !!window.__overlayDidSearch;
        window.__overlayDidSearch = false;

        const _sr = DOMService.get(CONFIG.DOM.searchResultsId || 'searchResults');
        if (_sr && savedScrollY > 0 && !_didSearch) _sr.style.visibility = 'hidden';

        const _lockCore = window.ScrollLockCore;
        if (!_lockCore) throw new Error('[Search/Overlay] ScrollLockCore unavailable');
        _lockCore.unlock('search');
        State.setSavedScrollY(0);

        if (savedScrollY > 0 && !_didSearch) {
          window.scrollTo({ top: savedScrollY, behavior: 'instant' });
          requestAnimationFrame(() => {
            if (_sr) _sr.style.visibility = '';
          });
        } else if (_sr) {
          _sr.style.visibility = '';
        }

        if (_scrollRestorationOrig !== null && 'scrollRestoration' in history) {
          history.scrollRestoration = _scrollRestorationOrig;
          _scrollRestorationOrig = null;
        }

        // ⑥ Remove document keydown listener
        DOMService.off(document, 'keydown', Handlers.documentKeydownOverlay);
        Handlers.documentKeydownOverlay = null;

        // ⑦ Reset overlay state fields
        State.overlayOpen       = false;
        State.overlayScrollable = null;
        State.suggestionsLocked = false;
        State.overlayOpenedAt   = null;

        const inpClose = DOMService.get(CONFIG.DOM.searchInputId);
        if (inpClose) {
          inpClose.setAttribute('aria-expanded', 'false');
          if (document.activeElement && document.activeElement !== inpClose && document.activeElement.closest && document.activeElement.closest('#' + CONFIG.DOM.overlayContainerId)) {
            try { inpClose.focus(); } catch (e) { console.warn('[SearchModule:overlay]', e); }
          }
        }
        
        // ⑧ Update icon slot
        IconSlotService.update();
        ClearBtnService.sync();

        // ⑨ Restore nav
        this._showNav();

        // Clear any pending timeouts registered during overlay lifetime
        State.clearTimeouts();

        setTimeout(() => { State.overlayTransitioning = false; }, CONFIG.TIMING.transitionDelayMs);
      } catch (e) {
        console.error('[OverlayService] close failed', e);
        State.overlayTransitioning = false;
      }
    },

    // ── Nav helpers ────────────────────────────────────────────────────────

    _hideNav() {
      try { State.navHiddenBySearch = true; window.modernNav?.hideNav?.('search-overlay'); } catch (e) { console.warn('[SearchModule:overlay]', e); }
    },

    _showNav() {
      try {
        if (window.modernNav?.showNav && State.navHiddenBySearch) {
          State.navHiddenBySearch = false;
          window.modernNav.showNav('search-overlay-closed');
        }
      } catch (e) { console.warn('[SearchModule:overlay]', e); }
    },
  };

  // ── Export ─────────────────────────────────────────────────────────────
  M.OverlayService = OverlayService;

})(window.SearchModules = window.SearchModules || {});

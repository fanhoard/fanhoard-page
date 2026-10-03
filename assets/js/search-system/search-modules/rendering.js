// @ts-check
/**
 * @file rendering.js
 * RenderingService + FilterService (v6.0 — URE-backed virtual scroll)
 *
 * Changes from v5.1:
 *   - VirtualScrollEngine replaced by URE (Universal Render Engine).
 *     URE handles virtual scroll, DOM pool, diff, lazy assets — zero config.
 *   - _searchHandle: single URE instance reused across searches.
 *     First search → URE.mount(). Subsequent searches → handle.setData()
 *     so URE's diff engine only re-renders what actually changed.
 *   - disconnectRenderObserver() → destroys the URE instance + clears handle.
 *
 * URE dependency:
 *   ure.js must be loaded before search-ui.js on search/index.html.
 *   URE exposes window.URE after its own sequential module boot.
 *
 * @module rendering
 * @depends {config.js, state.js, utils.js}
 *          window.URE (ure.js — loaded before this module)
 */
(function (M) {
  'use strict';

  const {
    CONFIG, State, Handlers,
    DOMService, StringService, LanguageService, NotificationService,
  } = M;

  // ── URE instance (one per search session, reused across queries) ──────────
  /** @type {object|null} */
  let _searchHandle = null;

  // ── Hoisted i18n cache ──────────────────────────────────────────────────
  let _lbl = { emoji: '' };
  function _refreshLabels() {
    _lbl.emoji = LanguageService.t('emoji');
  }
  _refreshLabels();

  // ── Zero-allocation helpers ─────────────────────────────────────────────

  function _wordCount(s) {
    let n = 0, inW = false;
    for (let i = 0; i < s.length; i++) {
      const ws = s.charCodeAt(i) <= 32;
      if      (!ws && !inW) { n++; inW = true; }
      else if (ws)           { inW = false; }
    }
    return n;
  }

  // ── RenderingService ──────────────────────────────────────────────────────
  function _markOverlayDidSearch() {
    if (window.SearchModules?.State?.overlayOpen) {
      window.__overlayDidSearch = true;
    }
  }

  const RenderingService = {

    /** Refresh i18n cache after language change. */
    refreshCache() { _refreshLabels(); },

    /**
     * Build card HTML string — passed to URE as the template function.
     * @param {SearchResult} item
     * @param {string} lang
     * @returns {string}
     */
    renderResultItem(item, lang) {
      try {
        const data     = item.item || item;
        const rawText  = data?.text || '';
        const itemText = rawText || data?.name?.[lang] || data?.name?.en || item.itemName || '';
        const itemApi  = data?.api || '';

        const typeName = item.typeObj?.name?.[lang]
          || item.typeObj?.name?.en
          || item.typeName
          || _lbl.emoji;

        const catName = item.category?.name?.[lang]
          || item.category?.name?.en
          || item.catName
          || '';

        const nameStr = data?.name?.[lang]
          || (lang !== 'en' ? data?.name?.en : '')
          || item.itemName
          || '';

        const text     = itemText || itemApi || '-';
        const vertical = text.length > 45
          || text.indexOf('\n') !== -1
          || _wordCount(text) > 7;
        const disp     = text.length > 300 ? text.slice(0, 300) : text;
        const esc      = StringService.escapeHtml;
        const titleStr = nameStr || data?.api || text;
        const subStr   = itemApi || typeName || '';
        const tags     = (typeName ? `<span class="result-card__tag">${esc(typeName)}</span>` : '')
                       + (catName  ? `<span class="result-card__tag">${esc(catName)}</span>`  : '');
        const encodedName = nameStr ? StringService.encodeUrl(nameStr) : '';

        return `<div class="result-card${vertical ? ' result-card--vertical' : ''}" role="button" tabindex="0" aria-label="${esc(nameStr || text)}" data-text="${StringService.encodeUrl(text)}" data-name="${encodedName}"><div class="result-card__glyph">${esc(disp)}</div><div class="result-card__body"><div class="result-card__title">${esc(titleStr)}</div><div class="result-card__subtitle">${esc(subStr)}</div>${tags ? `<div class="result-card__tags" aria-hidden="true">${tags}</div>` : ''}</div></div>`;
      } catch {
        return '<div class="result-card"><div class="result-card__glyph">-</div></div>';
      }
    },

    /**
     * Destroy the active URE instance.
     */
    disconnectRenderObserver() {
      if (_searchHandle) {
        try {
          _searchHandle.destroy();
        } catch (err) {
          console.error('[Rendering] URE handle destroy failed:', err);
          if (_searchHandle && typeof _searchHandle.unbindListeners === 'function') {
            try { _searchHandle.unbindListeners(); } catch (_) {}
          }
        }
        _searchHandle = null;
      }
      DOMService.remove(DOMService.get(CONFIG.DOM.sentinelId));
      if (M.DiscoveryService?.clearDiscovery) {
        try {
          M.DiscoveryService.clearDiscovery();
        } catch (err) {
          console.error('[Rendering] Discovery Service clear failed:', err);
        }
      }
    },

    /**
     * @param {SearchResult[]} results
     * @returns {CategoryOption[]}
     */
    extractResultCategories(results) {
      try {
        const lang = LanguageService.getLang();
        const out  = [];
        const seen = Object.create(null);
        for (const r of results) {
          const k = (r.category?.name?.[lang] || r.category?.name?.en) || '';
          if (!seen[k]) { seen[k] = 1; out.push({ key: k, displayName: k }); }
        }
        return out;
      } catch { return []; }
    },

    /**
     * Render results via URE.
     * @param {SearchResult[]} results
     * @param {boolean}        [showSuggestionsIfNoResult=false]
     */
    renderResults(results, showSuggestionsIfNoResult = false) {
      if (!window.URE) {
        const container = DOMService.get(CONFIG.DOM.searchResultsId);
        if (container) {
          container.setAttribute('aria-busy', 'true');
          if (!container.querySelector('.fvl-spinner') && !container.querySelector('.fvl-scoped')) {
            container.innerHTML = '';
            if (window.FVLSpinner) {
              window.FVLSpinner.mount(container, { size: 'md' });
            } else if (window.FVL?.scoped) {
              window.FVL.scoped({ target: container, bare: true, size: 'md' });
            }
          }
        }
        const pending = this._urePending || (this._urePending = { tries: 0 });
        if (pending.tries < 40) { // ~10s budget
          pending.tries++;
          pending.results = results;
          pending.showSuggestionsIfNoResult = showSuggestionsIfNoResult;
          setTimeout(() => {
            if (this._urePending === pending) {
              this.renderResults(pending.results, pending.showSuggestionsIfNoResult);
            }
          }, 250);
          return;
        }
      } else {
        this._urePending = null;
      }

      try {
        const container = DOMService.get(CONFIG.DOM.searchResultsId);
        if (!container) return;
        container.setAttribute('aria-busy', 'false');

        const lang     = LanguageService.getLang();
        const filtered = State.selectedCategory !== 'all'
          ? results.filter(r => ((r.category?.name?.[lang] || r.category?.name?.en) || '') === State.selectedCategory)
          : results;

        State.currentFilteredResults = filtered;
        const _count = filtered.length;
        const _announceMsg = _count === 0
          ? (lang === "th" ? "ไม่พบผลการค้นหา" : "No search results found")
          : (lang === "th" ? "พบ " + _count + " รายการ" : "Found " + _count + " " + (_count === 1 ? "result" : "results"));
        if (typeof window.announceToScreenReader === "function") {
          window.announceToScreenReader(_announceMsg, "polite");
        } else {
          let _annEl = document.getElementById("searchLiveAnnouncer");
          if (!_annEl && document.body) {
            _annEl = document.createElement("div");
            _annEl.id = "searchLiveAnnouncer";
            _annEl.className = "fv-sr-only";
            _annEl.setAttribute("aria-live", "polite");
            _annEl.setAttribute("aria-atomic", "true");
            document.body.appendChild(_annEl);
          }
          if (_annEl) _annEl.textContent = _announceMsg;
        }

        if (!filtered.length) {
          this.disconnectRenderObserver();
          DOMService.setHTML(container, '');
          this._renderEmpty(container, lang, showSuggestionsIfNoResult);
          if (!window.__isRestoringScroll) {
            _markOverlayDidSearch();
            window.scrollTo({ top: 0, behavior: 'instant' });
            if (window._revealStickyHeader) window._revealStickyHeader();
          }
          this._triggerDiscovery('');
          return;
        }

        _refreshLabels();

        if (_searchHandle) {
          _searchHandle.setLang(lang);
          _searchHandle.setData(filtered);
        } else {
          DOMService.setHTML(container, '');
          this._attachCopyHandler(container);

          _searchHandle = window.URE.mount({
            container,
            data    : filtered,
            template: (item, l) => this.renderResultItem(item, l),
            lang,
            buffer  : 300,
            recycling: true,
            keyField: 'api',
          });
        }

        if (!window.__isRestoringScroll) {
          _markOverlayDidSearch();
          window.scrollTo({ top: 0, behavior: 'instant' });
          if (window._revealStickyHeader) window._revealStickyHeader();
        }

        this._triggerDiscovery(this._currentQuery());

        if (typeof M.UIService.updateUILanguage === 'function') M.UIService.updateUILanguage();
      } catch (e) {
        console.error('[RenderingService] renderResults failed', e);
      }
    },

    _currentQuery() {
      try {
        const inp = DOMService.get(CONFIG.DOM.searchInputId);
        return inp?.value || '';
      } catch { return ''; }
    },

    _triggerDiscovery(query) {
      try {
        if (!M.DiscoveryService?.renderDiscovery) return;
        M.DiscoveryService.renderDiscovery(query, State.currentResults || []);
      } catch (e) {
        console.warn('[RenderingService] _triggerDiscovery failed:', e);
      }
    },

    _renderEmpty(container, lang, showSuggestions) {
      const notFound = LanguageService.t('not_found');
      const hint     = LanguageService.t('not_found_hint');
      let html = '<div class="no-result no-result--compact">';
      html += `<div class="no-result__title">${notFound}</div>`;
      html += `<div class="no-result__hint">${hint}</div>`;
      html += '</div>';
      DOMService.setHTML(container, html);
      const cfEl = DOMService.get(CONFIG.DOM.categoryFilterId);
      if (cfEl) cfEl.style.display = '';
      if (typeof M.UIService.updateUILanguage === 'function') M.UIService.updateUILanguage();
    },

    _attachCopyHandler(container) {
      if (!container || container._hasCopyHandler) return;

      const _copy = (card) => {
        if (!card?.hasAttribute('data-text')) return;
        const text = StringService.decodeUrl(card.getAttribute('data-text'));
        const name = StringService.decodeUrl(card.getAttribute('data-name') || '');
        const ns = M.NotificationService || NotificationService;
        if (ns && ns.copyText) ns.copyText(text, name || undefined);
      };

      const clickHandler = (e) => {
        const card = e.target.closest('.result-card');
        if (card) { e.preventDefault(); _copy(card); }
      };

      const keydownHandler = (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const card = e.target.closest('.result-card');
        if (card) { e.preventDefault(); _copy(card); }
      };

      DOMService.on(container, 'click', clickHandler);
      DOMService.on(container, 'keydown', keydownHandler);

      container._copyClickHandler = clickHandler;
      container._copyKeydownHandler = keydownHandler;
      container._hasCopyHandler = true;
      if (container.id === 'searchResults' || !window._hasCopyResultHandler) {
        window._hasCopyResultHandler = true;
      }
      if (container.id === 'searchResults') {
        Handlers.copyClick = clickHandler;
      }
    },

    _detachCopyHandler(container) {
      if (!container) return;
      if (container._copyClickHandler) {
        DOMService.off(container, 'click', container._copyClickHandler);
        delete container._copyClickHandler;
      }
      if (container._copyKeydownHandler) {
        DOMService.off(container, 'keydown', container._copyKeydownHandler);
        delete container._copyKeydownHandler;
      }
      delete container._hasCopyHandler;
    },
  };

  // ── FilterService ─────────────────────────────────────────────────────────
  const FilterService = {

    setupTypeFilter(selected = 'all') {
      try {
        const el = DOMService.get(CONFIG.DOM.typeFilterId);
        if (!el) return;
        const lang   = LanguageService.getLang();
        const active = selected || 'all';
        const pills  = [];

        pills.push(
          `<button class="filter-pill${active === 'all' ? ' active' : ''}" data-filter-type="all" aria-pressed="${active === 'all'}">`
          + StringService.escapeHtml(LanguageService.t('all_types'))
          + `</button>`
        );

        for (const t of (State.apiData?.type || [])) {
          const lbl = t.name?.[lang] || t.name?.en || '';
          if (!lbl) continue;
          const esc = StringService.escapeHtml(lbl);
          pills.push(
            `<button class="filter-pill${active === lbl ? ' active' : ''}" data-filter-type="${esc}" aria-pressed="${active === lbl}">`
            + esc
            + `</button>`
          );
        }

        el.innerHTML = pills.join('');
        State.selectedType = active;

        el._pillHandler && el.removeEventListener('click', el._pillHandler);
        el._pillHandler = (e) => {
          const btn = e.target.closest('.filter-pill');
          if (!btn) return;
          const val = btn.getAttribute('data-filter-type') || 'all';
          if (val === State.selectedType) return;
          State.selectedType = val;
          el.querySelectorAll('.filter-pill').forEach(p => {
            const isActive = p.getAttribute('data-filter-type') === val;
            p.classList.toggle('active', isActive);
            p.setAttribute('aria-pressed', isActive ? 'true' : 'false');
          });
          State.selectedCategory = 'all';
          if (window.SearchModules?.SearchController) {
            window.SearchModules.SearchController.doSearch(null, false);
          }
        };
        el.addEventListener('click', el._pillHandler);
      } catch {}
    },

    setupCategoryFilter(cats = [], selected = 'all') {
      try {
        const el = DOMService.get(CONFIG.DOM.categoryFilterId);
        if (!el) return;
        if (!cats.length) { el.innerHTML = ''; el.style.display = 'none'; return; }

        const lang   = LanguageService.getLang();
        const active = selected || 'all';
        const pills  = [];

        pills.push(
          `<button class="filter-pill filter-pill--cat${active === 'all' ? ' active' : ''}" data-filter-cat="all" aria-pressed="${active === 'all'}">`
          + StringService.escapeHtml(LanguageService.t('all_categories'))
          + `</button>`
        );

        for (const c of cats) {
          const lbl = c.displayName || c.key || '';
          if (!lbl) continue;
          const esc = StringService.escapeHtml(lbl);
          pills.push(
            `<button class="filter-pill filter-pill--cat${active === c.key ? ' active' : ''}" data-filter-cat="${StringService.escapeHtml(c.key)}" aria-pressed="${active === c.key}">`
            + esc
            + `</button>`
          );
        }

        el.innerHTML     = pills.join('');
        el.style.display = 'flex';
        State.selectedCategory = active;

        el._pillHandler && el.removeEventListener('click', el._pillHandler);
        el._pillHandler = (e) => {
          const btn = e.target.closest('.filter-pill--cat');
          if (!btn) return;
          const val = btn.getAttribute('data-filter-cat') || 'all';
          if (val === State.selectedCategory) return;
          State.selectedCategory = val;
          el.querySelectorAll('.filter-pill--cat').forEach(p => {
            const isActive = p.getAttribute('data-filter-cat') === val;
            p.classList.toggle('active', isActive);
            p.setAttribute('aria-pressed', isActive ? 'true' : 'false');
          });
          if (window.SearchModules?.SearchController) {
            window.SearchModules.SearchController.doSearch(null, false);
          }
        };
        el.addEventListener('click', el._pillHandler);
      } catch {}
    },
  };

  M.RenderingService = RenderingService;
  M.FilterService    = FilterService;

})(window.SearchModules = window.SearchModules || {});

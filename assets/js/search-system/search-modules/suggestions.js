// @ts-check
/**
 * @file suggestions.js
 * SuggestionService  — renders query-based suggestion list as user types.
 * ReadyModeService   — renders trending suggestions when the input is empty.
 *
 * Both render into #search-suggestions-list inside the overlay.
 *
 * v2.0 — Comprehensive suggestion diversity
 * v4.0 — Smart query-language detection
 * v5.0 — Polish keyboard navigation, ARIA option states & clean event delegates
 *
 * @module suggestions
 * @depends {config.js, state.js, utils.js, engine.js}
 */
(function (M) {
  'use strict';

  const {
    CONFIG, State,
    DOMService, StringService, LanguageService, HighlightService,
  } = M;

  // ── ReadyModeService ──────────────────────────────────────────────────────
  /**
   * Shows "trending" suggestions when the overlay opens with no query.
   * Filters out short Latin-only strings (likely internal API codes).
   */
  const ReadyModeService = {
    /**
     * Extract human-readable display names from allKeywordsCache,
     * re-ranked so items in the active UI language come first.
     * @returns {{raw:string, highlightedHtml:string}[]}
     */
    extractSmartNames() {
      try {
        if (!State.allKeywordsCache?.length) return [];
        const uiLang = LanguageService.getLang();
        const out    = [];
        const seen   = new Set();
        const primary   = [];
        const secondary = [];
        const max = CONFIG.RENDER.suggestionsFullscreenMax;

        for (const kw of State.allKeywordsCache) {
          if (primary.length + secondary.length >= max) break;
          if (!kw?.item) continue;

          const name = (kw.item.name && typeof kw.item.name === 'object')
            ? (kw.item.name[uiLang] || kw.item.name.en || '')
            : '';

          if (!name || name.length < 2) continue;
          if (!/[\u0E00-\u0E7F]/.test(name) && /^[A-Za-z0-9_\-]+$/.test(name) && name.length <= 20) continue;
          if (seen.has(name)) continue;

          seen.add(name);
          const entry = { raw: name, highlightedHtml: StringService.escapeHtml(name) };

          const isThaiName = LanguageService.hasThaiChars(name);
          if ((uiLang === 'th' && isThaiName) || (uiLang === 'en' && !isThaiName)) {
            primary.push(entry);
          } else {
            secondary.push(entry);
          }
        }

        for (const e of primary)   { if (out.length >= max) break; out.push(e); }
        for (const e of secondary) { if (out.length >= max) break; out.push(e); }
        return out;
      } catch (e) { console.warn('[SearchModule:suggestions]', e); return []; }
    },

    /** Render trending suggestions into #search-suggestions-list. */
    renderReadyModeSuggestions() {
      try {
        if (!State.overlayOpen) return;
        const container = DOMService.get(CONFIG.DOM.suggestionContainerId);
        if (!container) return;

        const sgs = this.extractSmartNames();
        if (!sgs.length) { container.style.display = 'none'; return; }

        let html = `<div class="search-suggestions-title">${LanguageService.t('trending')}</div>`;
        for (const s of sgs) {
          html += `<div class="search-suggestion-item" role="option" tabindex="0" data-val="${StringService.escapeHtml(StringService.encodeUrl(s.raw))}">
  <div class="search-suggestion-body">${s.highlightedHtml}</div>
</div>`;
        }
        container.innerHTML     = html;
        container.style.display = 'block';
        if (State.overlayScrollable) State.overlayScrollable.scrollTop = 0;
      } catch (e) { console.warn('[SearchModule:suggestions]', e); }
    },
  };

  // ── SuggestionService ─────────────────────────────────────────────────────
  const SuggestionService = {
    /**
     * Handle keyboard navigation inside the suggestion list.
     * Arrow keys move focus; ArrowUp on item 0 returns focus to input;
     * Enter clicks the focused item; Escape closes overlay.
     * @param {KeyboardEvent} ev
     * @param {Element}       container  The suggestion list element
     */
    handleKeydown(ev, container) {
      try {
        const items = [...container.querySelectorAll('.search-suggestion-item')];
        if (!items.length) return;
        const idx = items.indexOf(/** @type {HTMLElement} */ (document.activeElement));

        if (ev.key === 'ArrowDown') {
          ev.preventDefault();
          items[idx === -1 ? 0 : Math.min(items.length - 1, idx + 1)]?.focus?.();
        } else if (ev.key === 'ArrowUp') {
          ev.preventDefault();
          if (idx <= 0) {
            const inp = DOMService.get(CONFIG.DOM.searchInputId);
            if (inp) {
              try {
                inp.focus();
                const l = inp.value.length;
                inp.setSelectionRange(l, l);
              } catch (_) { inp.focus(); }
            }
          } else {
            items[idx - 1]?.focus?.();
          }
        } else if (ev.key === 'Enter') {
          ev.preventDefault();
          const active = document.activeElement;
          if (active && active.classList?.contains('search-suggestion-item')) {
            /** @type {HTMLElement} */ (active).click();
          }
        } else if (ev.key === 'Escape') {
          M.OverlayService.close('escape');
        }
      } catch (e) { console.warn('[SearchModule:suggestions]', e); }
    },

    /**
     * Handle click on a suggestion item — fills the input and triggers search.
     * @param {MouseEvent} ev
     */
    handleClick(ev) {
      try {
        const target = /** @type {Element|null} */ (ev.target);
        const item = target?.closest('.search-suggestion-item');
        if (!item) return;
        ev.stopPropagation?.();
        ev.preventDefault?.();

        const val = StringService.decodeUrl(item.getAttribute('data-val') || '');
        const inp = DOMService.get(CONFIG.DOM.searchInputId);
        if (inp) inp.value = val;

        State.suggestionsLocked = false;
        M.ClearBtnService.sync();
        M.SearchController.doSearch(null, false);
      } catch (e) { console.warn('[SearchModule:suggestions]', e); }
    },

    /**
     * Render query-based suggestions as the user types.
     * Falls back to ReadyModeService if no suggestions found.
     * @param {string} query
     */
    renderQuerySuggestions(query) {
      try {
        if (State.overlayTransitioning) return;
        const container = DOMService.get(CONFIG.DOM.suggestionContainerId);
        if (!container) return;

        if (!query?.trim()) {
          ReadyModeService.renderReadyModeSuggestions();
          return;
        }

        const engine = M.SearchEngine || window.SearchEngine;
        const max = CONFIG.RENDER.suggestionsFullscreenMax;
        const poolSize = Math.min(max * 2, max + 16);
        const raw = engine?.querySuggestions?.(query, poolSize) || [];
        if (!raw.length) {
          ReadyModeService.renderReadyModeSuggestions();
          return;
        }

        const langInfo = LanguageService.detectQueryLanguage(query);
        const sgs = _rerankByLanguage(raw, langInfo.language, max);

        let html = `<div class="search-suggestions-title">${LanguageService.t('suggestion_label')}</div>`;
        for (const s of sgs) {
          const badge = _sourceBadge(s.source);
          html += `<div class="search-suggestion-item" role="option" tabindex="0" data-val="${StringService.escapeHtml(StringService.encodeUrl(s.raw))}">
  <div class="search-suggestion-body">${HighlightService.highlight(s.raw, query)}</div>${badge}
</div>`;
        }
        container.innerHTML     = html;
        container.style.display = 'block';
        if (State.overlayScrollable) State.overlayScrollable.scrollTop = 0;
      } catch (e) { console.warn('[SearchModule:suggestions]', e); }
    },
  };

  // ── Language re-ranking helper (v4.0) ─────────────────────────────────────
  /**
   * Re-rank a suggestion pool so items in the target language appear first.
   * @param {Array<any>} pool
   * @param {string}     targetLang  'th' | 'en'
   * @param {number}     maxCount
   * @returns {Array<any>}
   */
  function _rerankByLanguage(pool, targetLang, maxCount) {
    const sameLang  = [];
    const otherLang = [];
    for (let i = 0; i < pool.length; i++) {
      const s = pool[i];
      if (!s) continue;
      const isThai = LanguageService.hasThaiChars(s.raw || '');
      if ((targetLang === 'th' && isThai) || (targetLang !== 'th' && !isThai)) {
        sameLang.push(s);
      } else {
        otherLang.push(s);
      }
    }
    const out = [];
    for (const s of sameLang)  { if (out.length >= maxCount) break; out.push(s); }
    for (const s of otherLang) { if (out.length >= maxCount) break; out.push(s); }
    return out;
  }

  // ── Source badge helper ─────────────────────────────────────────────────
  /**
   * Build a small badge HTML string indicating the suggestion's source.
   * @param {string} source
   * @returns {string}
   */
  function _sourceBadge(source) {
    if (!source) return '';
    let label = '';
    let cls   = 'search-suggestion-badge';
    if (source === 'type') {
      label = LanguageService.t('type');
      cls  += ' search-suggestion-badge--type';
    } else if (source === 'category') {
      label = LanguageService.t('category');
      cls  += ' search-suggestion-badge--category';
    } else if (source === 'fuse' || source === 'immediate' || source === 'keyword-contains') {
      return '';
    }
    if (!label) return '';
    return `<span class="${cls}" aria-hidden="true">${StringService.escapeHtml(label)}</span>`;
  }

  // ── Exports ───────────────────────────────────────────────────────────────
  M.ReadyModeService  = ReadyModeService;
  M.SuggestionService = SuggestionService;

})(window.SearchModules = window.SearchModules || {});

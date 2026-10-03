// @ts-check
/**
 * @file buttons.js
 * SubNavService  — ensures #sub-nav and #sub-buttons-container exist in the DOM.
 * ButtonService  — renders and manages main-nav + sub-nav buttons.
 *
 * Polish & Resilience:
 *   • ARIA tablist/tab semantics + roving tabindex + aria-selected tracking
 *   • Arrow key / Home / End keyboard navigation across navigation tabs
 *   • Smooth scroll-into-view for both main-nav and sub-nav active buttons
 *   • Robust language label updates mapped via data-url rather than array offset
 *
 * @module buttons
 * @depends {config.js, state.js, utils.js, loading.js, content.js}
 */
(function (M) {
  'use strict';

  const { CONFIG, State, Utils } = M;

  // ── "All" system button config ─────────────────────────────────────────────────
  const _ALL_BTN_CFG = Object.freeze({
    url:             CONFIG.ALL_BUTTON.URL,
    en_label:        CONFIG.ALL_BUTTON.EN_LABEL,
    th_label:        CONFIG.ALL_BUTTON.TH_LABEL,
    _isSystemButton: true,
    className:       'all-feed-button',
  });

  // ── Keyboard Navigation Helper ──────────────────────────────────────────────────

  /**
   * Attach accessible arrow-key and home/end navigation to a tablist container.
   * @param {HTMLElement|null} container
   * @param {boolean} isSub
   */
  function setupKeyboardNav(container, isSub) {
    if (!container || (/** @type {any} */ (container))._kbdNavAttached) return;
    (/** @type {any} */ (container))._kbdNavAttached = true;

    container.addEventListener('keydown', ev => {
      const buttons = Array.from(container.querySelectorAll('button:not([disabled])'));
      if (!buttons.length) return;

      const activeEl = document.activeElement;
      const currentIndex = buttons.indexOf(/** @type {HTMLButtonElement} */ (activeEl));
      if (currentIndex === -1) return;

      let targetIndex = -1;
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') {
        ev.preventDefault();
        targetIndex = (currentIndex + 1) % buttons.length;
      } else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        targetIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      } else if (ev.key === 'Home') {
        ev.preventDefault();
        targetIndex = 0;
      } else if (ev.key === 'End') {
        ev.preventDefault();
        targetIndex = buttons.length - 1;
      }

      if (targetIndex !== -1) {
        const targetBtn = /** @type {HTMLButtonElement} */ (buttons[targetIndex]);
        targetBtn.focus();
        targetBtn.click();
        if (isSub) {
          ButtonService._scrollSub(targetBtn);
        } else {
          ButtonService.scrollActiveMainButtonIntoView(targetBtn);
        }
      }
    });
  }

  // ── SubNavService ──────────────────────────────────────────────────────────────

  const SubNavService = {

    ensureSubNavContainer() {
      let sn = document.getElementById(CONFIG.DOM.SUB_NAV_ID);
      if (!sn) {
        sn            = document.createElement('div');
        sn.id         = CONFIG.DOM.SUB_NAV_ID;
        sn.className  = 'hi';
        const h = document.querySelector(CONFIG.DOM.HEADER_TAG);
        if (h?.nextSibling) h.parentNode.insertBefore(sn, h.nextSibling);
        else document.body.prepend(sn);
      }
      sn.setAttribute('role', 'navigation');
      sn.setAttribute('aria-label', 'Sub navigation');

      let hj = sn.querySelector(`.${CONFIG.DOM.SUB_NAV_CLASS}`);
      if (!hj) {
        hj           = document.createElement('div');
        hj.className = CONFIG.DOM.SUB_NAV_CLASS;
        sn.appendChild(hj);
      }

      const ext = document.querySelector(`#${CONFIG.DOM.SUB_BUTTONS_ID}`);
      if (ext && !hj.contains(ext)) try { hj.appendChild(ext); } catch (_) {}

      let sbc = hj.querySelector(`#${CONFIG.DOM.SUB_BUTTONS_ID}`);
      if (!sbc) {
        document.querySelectorAll(`#${CONFIG.DOM.SUB_BUTTONS_ID}`).forEach(el => {
          if (!sn.contains(el)) try { el.parentNode?.removeChild(el); } catch (_) {}
        });
        sbc    = document.createElement('div');
        sbc.id = CONFIG.DOM.SUB_BUTTONS_ID;
        hj.appendChild(sbc);
      }

      sbc.setAttribute('role', 'tablist');
      sbc.setAttribute('aria-label', 'Sub category options');
      setupKeyboardNav(sbc, true);

      State.elements.subNav              = sn;
      State.elements.subNavInner         = hj;
      State.elements.subButtonsContainer = sbc;

      return sbc;
    },

    hideSubNav() {
      const sn = document.getElementById(CONFIG.DOM.SUB_NAV_ID);
      if (!sn) return;
      sn.style.display = 'none';
      sn.setAttribute('aria-hidden', 'true');
      const c = sn.querySelector(`#${CONFIG.DOM.SUB_BUTTONS_ID}`);
      if (c) c.innerHTML = '';
      if (State.elements.subButtonsContainer)
        State.elements.subButtonsContainer.innerHTML = '';
    },

    showSubNav() {
      let sn = document.getElementById(CONFIG.DOM.SUB_NAV_ID);
      if (!sn) { this.ensureSubNavContainer(); sn = document.getElementById(CONFIG.DOM.SUB_NAV_ID); }
      if (sn) {
        sn.style.display = '';
        sn.setAttribute('aria-hidden', 'false');
      }
    },

    clearSubButtons() { this.ensureSubNavContainer().innerHTML = ''; },
  };

  // ── ButtonService ──────────────────────────────────────────────────────────────

  const ButtonService = {

    // ── Config + state loading ─────────────────────────────────────────────────

    async loadConfig() {
      if (State.buttons.config) { await this.renderMainButtons(); return; }

      const cached = M.DataService.getCached('buttonConfig');
      if (cached) {
        State.buttons.config = cached;
      } else {
        const res = await M.DataService.fetchWithRetry(
          CONFIG.PATHS.BUTTONS_CONFIG, {}, 2
        );
        State.buttons.config = res;
        M.DataService.setCache('buttonConfig', res);
      }

      const mbs = State.buttons.config.mainButtons;
      if (!mbs.some(b => b.url === CONFIG.ALL_BUTTON.URL)) {
        mbs.unshift(_ALL_BTN_CFG);
      }

      await this.renderMainButtons();
      try { M.RouterService?.updateButtonStates?.(); } catch (_) {}
    },

    // ── Main button rendering ──────────────────────────────────────────────────

    async renderMainButtons() {
      const lang            = localStorage.getItem('selectedLang') || 'en';
      const { mainButtons } = State.buttons.config;
      const navList         = State.elements.navList;
      navList.innerHTML     = '';
      navList.setAttribute('role', 'tablist');
      navList.setAttribute('aria-label', 'Content categories');
      setupKeyboardNav(navList, false);

      State.buttons.buttonMap = new Map();
      const frag = document.createDocumentFragment();

      for (const cfg of mainButtons) {
        const label = cfg[`${lang}_label`];
        if (!label) continue;

        const li  = document.createElement('li');
        li.setAttribute('role', 'presentation');

        const btn = document.createElement('button');
        btn.textContent = label;
        btn.className   = 'main-button';
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-controls', CONFIG.DOM.CONTENT_LOADING_ID || 'content-loading');
        btn.setAttribute('aria-selected', 'false');
        btn.setAttribute('tabindex', '-1');

        const url = cfg.url || cfg.jsonFile;
        btn.setAttribute('data-url', url);
        if (cfg.className) btn.classList.add(cfg.className);

        State.buttons.buttonMap.set(url, { button: btn, config: cfg });

        btn.addEventListener('click', async ev => {
          ev.preventDefault();
          if (btn.classList.contains('active')) return;
          this.updateButtonState(btn, false);
          State.buttons.currentMainButton    = btn;
          State.buttons.currentMainButtonUrl = url;
          await M.RouterService.navigateTo(url, {
            skipUrlUpdate: !!State.isBootstrapping,
          });
        });

        li.appendChild(btn);
        frag.appendChild(li);
      }

      navList.appendChild(frag);

      const allEntry = State.buttons.buttonMap.get(CONFIG.ALL_BUTTON.URL) || null;

      if (!State.isBootstrapping) {
        await this._handleInitialUrl(window.location.search, allEntry);
      } else if (allEntry) {
        this.updateButtonState(allEntry.button, false);
        State.buttons.currentMainButton    = allEntry.button;
        State.buttons.currentMainButtonUrl = CONFIG.ALL_BUTTON.URL;
      }
    },

    // ── Initial URL handling ───────────────────────────────────────────────────

    async _handleInitialUrl(url, def) {
      try {
        if (!url || url === '?') {
          if (def) await this.triggerMainButtonClick(def.button);
          return;
        }

        const p    = new URLSearchParams(url.startsWith('?') ? url : `?${url}`);
        const main = (p.get('type') || '').replace(/__$/, '');
        const sub  = p.get('page') || '';
        const md   = State.buttons.buttonMap.get(main);
        if (!md) { if (def) await this.triggerMainButtonClick(def.button); return; }

        const valid = await M.RouterService.validateUrl(url).catch(() => false);
        if (!valid) { if (def) await this.triggerMainButtonClick(def.button); return; }

        M.RouterService.state.currentMainRoute = main;
        M.RouterService.state.currentSubRoute  = sub || '';
        State.buttons.currentMainButton        = md.button;
        await this._activateMain(md.button, md.config);

        if (md.config.subButtons?.length) {
          if (sub) await this._handleInitialSub(md.config, main, sub);
          else     await this._handleDefaultSub(md.config, main);
          SubNavService.showSubNav();
        } else {
          SubNavService.hideSubNav();
        }

        M.RouterService.scrollActiveButtonsIntoView?.();
      } catch (_) { if (def) await this.triggerMainButtonClick(def.button); }
    },

    async _activateMain(btn, cfg) {
      this.updateButtonState(btn, false);
      State.buttons.currentMainButton = btn;
      await M.ContentService.clearContent();

      const lang = localStorage.getItem('selectedLang') || 'en';
      if (cfg.subButtons?.length) {
        SubNavService.showSubNav();
        await this.renderSubButtons(cfg.subButtons, cfg.url || cfg.jsonFile, lang);
      } else {
        SubNavService.hideSubNav();
      }

      if (cfg.jsonFile)
        await M.ContentService.renderContent([{ jsonFile: cfg.jsonFile }]);
    },

    async _handleInitialSub(cfg, main, sub) {
      await new Promise(r => setTimeout(r, 60));
      if (!cfg.subButtons?.length) { SubNavService.hideSubNav(); return; }
      SubNavService.showSubNav();

      const lang = localStorage.getItem('selectedLang') || 'en';
      await this.renderSubButtons(cfg.subButtons, main, lang);

      const fullUrl = `${main}-${sub}`;
      const el      = State.elements.subButtonsContainer?.querySelector(`button[data-url="${fullUrl}"]`);
      const scf     = cfg.subButtons.find(b => b.url === sub || b.jsonFile === sub);

      if (el && scf) {
        this.updateButtonState(el, true);
        State.buttons.currentSubButton = el;
        if (scf.jsonFile) {
          await M.ContentService.clearContent();
          await M.ContentService.renderContent([{ jsonFile: scf.jsonFile }]);
        }
        this._scrollSub(el);
      }
    },

    async _handleDefaultSub(cfg, main) {
      if (!cfg.subButtons?.length) { SubNavService.hideSubNav(); return; }
      SubNavService.showSubNav();
      const d = cfg.subButtons.find(b => b.isDefault);
      if (d) {
        await M.RouterService.navigateTo(
          `${main}-${d.url || d.jsonFile}`,
          { skipUrlUpdate: !!State.isBootstrapping }
        );
      }
    },

    // ── Click triggers ─────────────────────────────────────────────────────────

    async triggerMainButtonClick(btn) {
      if (!btn) return;
      const url = btn.getAttribute('data-url');
      this.updateButtonState(btn, false);
      State.buttons.currentMainButton    = btn;
      State.buttons.currentMainButtonUrl = url;
      try {
        await M.RouterService.navigateTo(url, { skipUrlUpdate: !!State.isBootstrapping });
      } catch (e) { console.error('[NavCore/Buttons] triggerMainButtonClick', e); }
    },

    async triggerSubButtonClick(btn) {
      if (!btn) return;
      this.updateButtonState(btn, true);
      State.buttons.currentSubButton = btn;
      const url = btn.getAttribute('data-url');
      try {
        await M.RouterService.navigateTo(url, { skipUrlUpdate: !!State.isBootstrapping });
      } catch (e) { console.error('[NavCore/Buttons] triggerSubButtonClick', e); }
    },

    // ── Sub-button rendering ───────────────────────────────────────────────────

    async renderSubButtons(subBtns, mainUrl, lang) {
      if (!subBtns?.length) { SubNavService.hideSubNav(); return; }
      SubNavService.showSubNav();

      const ctr = SubNavService.ensureSubNavContainer();
      ctr.innerHTML = '';
      ctr.setAttribute('role', 'tablist');
      ctr.setAttribute('aria-label', 'Sub category options');
      setupKeyboardNav(ctr, true);

      const p = new URLSearchParams(
        window.location.search.startsWith('?') ? window.location.search : `?${window.location.search}`
      );
      const curMain   = (p.get('type') || '').replace(/__$/, '');
      const curSub    = p.get('page') || '';
      const activeUrl = curMain && curSub ? `${curMain}-${curSub}` : '';

      let defBtn = null;
      const frag = document.createDocumentFragment();

      subBtns.forEach((cfg, idx) => {
        const label = cfg[`${lang}_label`];
        if (!label) return;

        const btn     = document.createElement('button');
        btn.className = 'button-sub sub-button';
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-controls', CONFIG.DOM.CONTENT_LOADING_ID || 'content-loading');
        btn.setAttribute('aria-selected', 'false');
        btn.setAttribute('tabindex', '-1');

        if (cfg.className) btn.classList.add(cfg.className);
        btn.textContent = label;

        const fullUrl = `${mainUrl}-${cfg.url || cfg.jsonFile}`;
        btn.setAttribute('data-url', fullUrl);
        if (cfg.isDefault || (!defBtn && idx === 0)) defBtn = btn;
        if (fullUrl === activeUrl) {
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');
          btn.setAttribute('tabindex', '0');
        }

        btn.addEventListener('click', async () => {
          if (btn.classList.contains('active')) return;
          this.updateButtonState(btn, true);
          State.buttons.currentSubButton = btn;
          await M.RouterService.navigateTo(fullUrl, {
            skipUrlUpdate: !!State.isBootstrapping,
          });
        }, { passive: true });

        frag.appendChild(btn);
      });

      ctr.appendChild(frag);

      const needDef = !activeUrl || !ctr.querySelector('.button-sub.active');
      if (needDef && defBtn) {
        this.updateButtonState(defBtn, true);
        State.buttons.currentSubButton = defBtn;
      }
    },

    // ── Utilities ──────────────────────────────────────────────────────────────

    /** @param {string} url @returns {MainButtonConfig|undefined} */
    findMainButtonConfig(url) {
      return State.buttons.config?.mainButtons?.find(b => b.url === url || b.jsonFile === url);
    },

    /** @param {HTMLElement} btn */
    _scrollSub(btn) {
      const ctr = State.elements?.subButtonsContainer;
      if (!ctr || !btn) return;
      requestAnimationFrame(() => {
        try {
          const cl = ctr.getBoundingClientRect().left;
          const cw = ctr.clientWidth;
          const bl = btn.getBoundingClientRect().left;
          const bw = btn.clientWidth;
          const t  = ctr.scrollLeft + (bl - cl) - (cw / 2) + (bw / 2);
          if (Math.abs(ctr.scrollLeft - t) > 1) ctr.scrollTo({ left: Math.max(0, t), behavior: 'smooth' });
        } catch (_) {}
      });
    },

    /** @param {HTMLElement} btn */
    scrollActiveMainButtonIntoView(btn) {
      const navList = State.elements?.navList;
      if (!navList || !btn) return;
      requestAnimationFrame(() => {
        try {
          const cl = navList.getBoundingClientRect().left;
          const cw = navList.clientWidth;
          const bl = btn.getBoundingClientRect().left;
          const bw = btn.clientWidth;
          const t  = navList.scrollLeft + (bl - cl) - (cw / 2) + (bw / 2);
          if (Math.abs(navList.scrollLeft - t) > 1) {
            navList.scrollTo({ left: Math.max(0, t), behavior: 'smooth' });
          }
        } catch (_) {}
      });
    },

    /** Update button text labels after language change safely via data-url lookup. */
    updateButtonsLanguage(lang) {
      try {
        const navList = State.elements?.navList;
        if (navList) {
          navList.querySelectorAll('button').forEach(b => {
            const url = b.getAttribute('data-url');
            if (!url) return;
            const entry = State.buttons.buttonMap.get(url);
            const cfg = entry?.config || this.findMainButtonConfig(url);
            const l = cfg?.[`${lang}_label`];
            if (l) b.textContent = l;
          });
        }
        if (State.buttons.currentMainButton) {
          const cfg = this.findMainButtonConfig(State.buttons.currentMainButton.getAttribute('data-url'));
          if (cfg?.subButtons?.length) {
            SubNavService.showSubNav();
            this.renderSubButtons(cfg.subButtons, cfg.url || cfg.jsonFile, lang);
          } else {
            SubNavService.hideSubNav();
          }
        } else {
          SubNavService.hideSubNav();
        }
      } catch (_) {}
    },

    /** @param {HTMLElement} btn @param {boolean} isSub */
    updateButtonState(btn, isSub) {
      const g = isSub
        ? State.elements.subButtonsContainer
        : State.elements.navList;
      if (!g || !btn) return;

      g.querySelectorAll('button').forEach(b => {
        const isActive = b === btn;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-selected', isActive ? 'true' : 'false');
        b.setAttribute('tabindex', isActive ? '0' : '-1');
      });

      if (isSub) {
        State.buttons.currentSubButton = btn;
        this._scrollSub(btn);
      } else {
        State.buttons.currentMainButton = btn;
        this.scrollActiveMainButtonIntoView(btn);
      }
    },

    // Backward-compat aliases
    activateMainButton(btn, cfg)        { return this._activateMain(btn, cfg); },
    handleInitialUrl(url, map, def)     { return this._handleInitialUrl(url, def); },
    handleInitialSubRoute(cfg, m, s)    { return this._handleInitialSub(cfg, m, s); },
    handleDefaultSubButton(cfg, m)      { return this._handleDefaultSub(cfg, m); },
    scrollActiveSubButtonIntoView(btn)  { return this._scrollSub(btn); },
  };

  // ── Export ─────────────────────────────────────────────────────────────────────

  M.SubNavService = SubNavService;
  M.ButtonService = ButtonService;

})(window.NavCoreModules = window.NavCoreModules || {});

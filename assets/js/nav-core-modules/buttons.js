// @ts-check
/**
 * @file buttons.js
 * SubNavService  — ensures #sub-nav and #sub-buttons-container exist in the DOM.
 * ButtonService  — renders and manages main-nav + sub-nav buttons.
 *
 * v2 — "All" system button:
 *   • isDefault สำหรับ main button ถูกยกเลิก — All button (_all) คือ default เสมอ
 *   • isDefault สำหรับ sub button ยังคงทำงานเหมือนเดิม
 *   • All button ถูก inject ที่ index 0 ของ mainButtons ตอน loadConfig()
 *
 * @module buttons
 * @depends {config.js, state.js, utils.js, loading.js, content.js}
 */
(function (M) {
  'use strict';

  const { CONFIG, State, Utils } = M;

  // ── "All" system button config ─────────────────────────────────────────────────
  // WHY: inject ที่นี่เพียงจุดเดียว ไม่ผ่าน buttons.json
  //      ผู้ดูแล buttons.json ไม่ต้องรู้เรื่องนี้ — ระบบจัดการเอง
  const _ALL_BTN_CFG = Object.freeze({
    url:             CONFIG.ALL_BUTTON.URL,
    en_label:        CONFIG.ALL_BUTTON.EN_LABEL,
    th_label:        CONFIG.ALL_BUTTON.TH_LABEL,
    _isSystemButton: true,
    className:       'all-feed-button',
  });

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

      State.elements.subNav              = sn;
      State.elements.subNavInner         = hj;
      State.elements.subButtonsContainer = sbc;

      return sbc;
    },

    hideSubNav() {
      const sn = document.getElementById(CONFIG.DOM.SUB_NAV_ID);
      if (!sn) return;
      sn.style.display = 'none';
      const c = sn.querySelector(`#${CONFIG.DOM.SUB_BUTTONS_ID}`);
      if (c) c.innerHTML = '';
      if (State.elements.subButtonsContainer)
        State.elements.subButtonsContainer.innerHTML = '';
    },

    showSubNav() {
      let sn = document.getElementById(CONFIG.DOM.SUB_NAV_ID);
      if (!sn) { this.ensureSubNavContainer(); sn = document.getElementById(CONFIG.DOM.SUB_NAV_ID); }
      if (sn) sn.style.display = '';
    },

    clearSubButtons() { this.ensureSubNavContainer().innerHTML = ''; },
  };

  // ── ButtonService ──────────────────────────────────────────────────────────────

  const ButtonService = {

    // ── Config + state loading ─────────────────────────────────────────────────

    /**
     * Load buttons.json, inject "All" system button, then render main nav.
     * Idempotent — uses DataService cache / PLSys SWR cache on repeat calls.
     * @returns {Promise<void>}
     */
    async loadConfig() {
      if (State.buttons.config) { await this.renderMainButtons(); return; }

      let cached = M.DataService.getCached('buttonConfig')
                || M.DataService.getCached(CONFIG.PATHS.BUTTONS_CONFIG)
                || (typeof window !== 'undefined' && window.PLSys && window.PLSys.SWRCache && window.PLSys.SWRCache.get(CONFIG.PATHS.BUTTONS_CONFIG));

      if (cached) {
        State.buttons.config = cached;
        const mbs = State.buttons.config.mainButtons;
        if (mbs && !mbs.some(b => b.url === CONFIG.ALL_BUTTON.URL)) {
          mbs.unshift(_ALL_BTN_CFG);
        }
        await this.renderMainButtons();
      }

      try {
        const res = await M.DataService.fetchWithRetry(
          CONFIG.PATHS.BUTTONS_CONFIG, {}, 2
        );
        State.buttons.config = res;
        M.DataService.setCache('buttonConfig', res);
        M.DataService.setCache(CONFIG.PATHS.BUTTONS_CONFIG, res);

        const mbs = State.buttons.config.mainButtons;
        if (mbs && !mbs.some(b => b.url === CONFIG.ALL_BUTTON.URL)) {
          mbs.unshift(_ALL_BTN_CFG);
        }

        await this.renderMainButtons();
        try { M.RouterService?.updateButtonStates?.(); } catch (_) {}
      } catch (err) {
        if (!cached) throw err;
      }
    },

    // ── Main button rendering ──────────────────────────────────────────────────

    /**
     * Render all main navigation buttons into #nav-list.
     * Uses DocumentFragment — single DOM write.
     * "All" button (index 0) เป็น default เสมอ — ไม่มี isDefault tracking แล้ว
     */
    async renderMainButtons() {
      const lang            = localStorage.getItem('selectedLang') || 'en';
      const { mainButtons } = State.buttons.config;
      const navList         = State.elements.navList;
      navList.innerHTML     = '';
      State.buttons.buttonMap = new Map();

      const frag = document.createDocumentFragment();

      for (const cfg of mainButtons) {
        const label = cfg[`${lang}_label`];
        if (!label) continue;

        const li  = document.createElement('li');
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.className   = 'main-button';
        const url = cfg.url || cfg.jsonFile;
        btn.setAttribute('data-url', url);
        if (cfg.className) btn.classList.add(cfg.className);

        State.buttons.buttonMap.set(url, { button: btn, config: cfg });

        btn.addEventListener('click', async ev => {
          ev.preventDefault();
          if (btn.classList.contains('active')) return;
          navList.querySelectorAll('button').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
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
        allEntry.button.classList.add('active');
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
      State.elements.navList.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
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
        State.elements.subButtonsContainer?.querySelectorAll('.button-sub')
          .forEach(b => b.classList.remove('active'));
        el.classList.add('active');
        State.buttons.currentSubButton = el;
        if (scf.jsonFile) {
          await M.ContentService.clearContent();
          await M.ContentService.renderContent([{ jsonFile: scf.jsonFile }]);
        }
      } else {
        await this._handleDefaultSub(cfg, main);
      }
    },

    async _handleDefaultSub(cfg, main) {
      if (!cfg.subButtons?.length) return;

      const lang = localStorage.getItem('selectedLang') || 'en';
      await this.renderSubButtons(cfg.subButtons, main, lang);

      const defSub = cfg.subButtons.find(sb => sb.isDefault) || cfg.subButtons[0];
      if (!defSub) return;

      const subKey  = defSub.url || defSub.jsonFile;
      const fullUrl = `${main}-${subKey}`;
      const el      = State.elements.subButtonsContainer?.querySelector(`button[data-url="${fullUrl}"]`);

      if (el) {
        State.elements.subButtonsContainer?.querySelectorAll('.button-sub')
          .forEach(b => b.classList.remove('active'));
        el.classList.add('active');
        State.buttons.currentSubButton = el;
      }

      if (defSub.jsonFile) {
        await M.ContentService.clearContent();
        await M.ContentService.renderContent([{ jsonFile: defSub.jsonFile }]);
      }
    },

    // ── Sub button rendering ───────────────────────────────────────────────────

    async renderSubButtons(subButtons, mainRoute, lang = 'en') {
      const sbc = SubNavService.ensureSubNavContainer();
      sbc.innerHTML = '';
      if (!subButtons?.length) return;

      const frag = document.createDocumentFragment();
      const defSub = subButtons.find(sb => sb.isDefault) || subButtons[0];

      for (const sb of subButtons) {
        const label = sb[`${lang}_label`];
        if (!label) continue;

        const btn     = document.createElement('button');
        btn.className = 'button-sub';
        btn.textContent = label;
        const subKey  = sb.url || sb.jsonFile;
        const fullUrl = `${mainRoute}-${subKey}`;

        btn.setAttribute('data-url', fullUrl);
        btn.setAttribute('data-sub-url', subKey);
        btn.setAttribute('data-main-url', mainRoute);

        if (sb === defSub) {
          btn.classList.add('active');
          State.buttons.currentSubButton = btn;
        }

        btn.addEventListener('click', async ev => {
          ev.preventDefault();
          if (btn.classList.contains('active')) return;
          sbc.querySelectorAll('.button-sub').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          State.buttons.currentSubButton = btn;

          await M.RouterService.navigateTo(`${mainRoute}-${subKey}`, {
            skipUrlUpdate: !!State.isBootstrapping,
          });
        });

        frag.appendChild(btn);
      }

      sbc.appendChild(frag);
    },

    updateButtonsLanguage(lang) {
      try {
        const btnCfg = State.buttons.config;
        if (!btnCfg) return;

        (btnCfg.mainButtons || []).forEach(cfg => {
          const url   = cfg.url || cfg.jsonFile;
          const label = cfg[`${lang}_label`];
          if (!url || !label) return;
          const entry = State.buttons.buttonMap?.get(url);
          if (entry?.button) entry.button.textContent = label;
        });

        const curMainUrl = State.buttons.currentMainButtonUrl;
        const mainCfg    = (btnCfg.mainButtons || []).find(b => (b.url || b.jsonFile) === curMainUrl);
        if (mainCfg?.subButtons?.length && State.elements.subButtonsContainer) {
          mainCfg.subButtons.forEach(sb => {
            const subKey  = sb.url || sb.jsonFile;
            const fullUrl = `${curMainUrl}-${subKey}`;
            const label   = sb[`${lang}_label`];
            if (!subKey || !label) return;
            const btn = State.elements.subButtonsContainer.querySelector(`button[data-url="${fullUrl}"]`);
            if (btn) btn.textContent = label;
          });
        }
      } catch (err) { console.error('[NavCore/Button] updateButtonsLanguage error:', err); }
    },

    async triggerMainButtonClick(btn) {
      if (!btn) return;
      btn.click();
    },
  };

  M.SubNavService = SubNavService;
  M.ButtonService = ButtonService;

})(window.NavCoreModules = window.NavCoreModules || {});

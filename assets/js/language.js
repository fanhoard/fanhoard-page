// @ts-check
/**
 * @file language.js
 * Language Switch Button — v6.0 (static-only)
 *
 * สิ่งที่เหลืออยู่จากระบบภาษา (Master สั่ง 18 ต.ค. 2026):
 *   เฉพาะ "ปุ่มเปลี่ยนภาษา" บนหน้า setting เท่านั้น
 *   - อ่านภาษาปัจจุบันจาก FvLang (lang-core.js)
 *   - แสดงปุ่ม + popup เลือกภาษา (ผ่าน PopupSystem)
 *   - เมื่อ user เลือกภาษา → FvLang.setLang() → redirect ไปหน้าเดียวกัน
 *     ของอีกภาษา (คำนวณจาก URL prefix)
 *
 * สิ่งที่ถูกลบออกแล้ว (ยกเลิกถาวร):
 *   - dynamic translation engine (translator/worker-pool/db/loader/markers)
 *   - browser language detection + auto-redirect
 *   - module loader แบบ phase (lang-modules/*)
 *   - script interceptor + gate + full-mode boot
 *   หน้าเว็บใช้ระบบ static เต็มรูปแบบ: ทุกหน้าถูก generate ต่อภาษา
 *   ที่ build time แล้ว
 *
 * @module language
 */
(function() {
  'use strict';

  // Guard: ไม่ init ซ้ำ
  if (window.__langUI && window.__langUI._initialized) return;

  var SUPPORTED = ['en', 'th'];
  var DEFAULT_LANG = 'en';
  var LS_KEY = 'selectedLang';

  // ── Minimal state ───────────────────────────────────────────────────────

  var State = {
    selectedLang: (window.FvLang && window.FvLang.lang) || DEFAULT_LANG,
    languagesConfig: null,
    languageButton: null,
  };

  // ── Config: อ่านจาก window.__fvStaticConfig (build script inject) ────────

  function _loadConfig() {
    var staticConfig = window.__fvStaticConfig;
    if (staticConfig && staticConfig.langs) {
      State.languagesConfig = staticConfig.langs;
    } else {
      // Fallback config
      State.languagesConfig = {};
      State.languagesConfig['en'] = { buttonText: 'English', label: 'English' };
      State.languagesConfig['th'] = { buttonText: 'ภาษาไทย', label: 'ภาษาไทย' };
    }
    if (staticConfig && staticConfig.lang) {
      State.selectedLang = staticConfig.lang;
    } else if (window.FvLang) {
      State.selectedLang = FvLang.lang;
    }
  }

  // SVG icon ของ language button
  var LANG_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="18.5" height="18.5" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h7"/><path d="M9 3v2c0 4.418 -2.239 8 -5 8"/><path d="M5 9c0 2.144 2.952 3.908 6.7 4"/><path d="M12 20l4 -9l4 9"/><path d="M19.1 18h-6.2"/></svg>';

  // ── Styles สำหรับ option ภายใน popup body ──────────────────────────────

  var _stylesInjected = false;
  function _injectStyles() {
    if (_stylesInjected) return;
    _stylesInjected = true;
    var css = `
.fv-lang-options-list {
  display: flex;
  flex-direction: column;
  gap: var(--fv-space-2, 8px);
  padding: 4px;
}
.fv-lang-option {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--fv-space-3, 10px) var(--fv-space-4, 16px);
  border-radius: var(--fv-radius-md, 8px);
  font-size: 0.95em;
  font-weight: var(--fv-font-medium, 500);
  color: var(--fv-text-primary, #1d1d1f);
  background-color: transparent;
  transition: background-color 180ms cubic-bezier(0.16, 1, 0.3, 1),
              border-color 180ms cubic-bezier(0.16, 1, 0.3, 1),
              transform 120ms ease;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.08);
  text-align: left;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  min-width: 0;
  outline: none;
}
.fv-lang-option:hover {
  border-color: #00FFAA;
  background-color: rgba(0, 255, 170, 0.05);
}
.fv-lang-option:focus-visible {
  outline: 2px solid #00FFAA;
  outline-offset: 2px;
  border-color: #00FFAA;
}
.fv-lang-option--active {
  border-color: #00FFAA;
  background-color: rgba(0, 255, 170, 0.08);
  font-weight: 600;
}
.fv-lang-option-check {
  font-size: 0.95em;
  color: #00CC88;
  font-weight: bold;
  margin-left: 8px;
}
.fp-theme-dark .fv-lang-option {
  color: var(--fv-text-primary, #f5f5f7);
  border-color: rgba(255, 255, 255, 0.12);
}
.fp-theme-dark .fv-lang-option:hover {
  border-color: #00FFAA;
  background-color: rgba(0, 255, 170, 0.08);
}
.fp-theme-dark .fv-lang-option--active {
  border-color: #00FFAA;
  background-color: rgba(0, 255, 170, 0.12);
}
`;
    var s = document.createElement("style");
    s.id = "fv-lang-picker-styles";
    s.textContent = css;
    document.head.appendChild(s);
  }

  var _popupId = null;
  var _popupHandle = null;

  // ── Language selection (static: redirect ไปหน้าเดียวกันของอีกภาษา) ─────

  function _buildStaticLangUrl(targetLang) {
    var path    = location.pathname;
    var current = path.match(/^\/(en|th)(\/|$)/);
    var currentLang = current ? current[1] : null;

    var newPath;
    if (currentLang) {
      newPath = path.replace(/^\/(en|th)(\/|$)/, '/' + targetLang + '$2');
    } else {
      newPath = '/' + targetLang + (path === '/' ? '' : path);
    }

    return newPath + location.search + location.hash;
  }

  /**
   * User เลือกภาษาจาก popup → redirect ไปหน้าเดียวกันของภาษานั้น
   * @param {string} language
   */
  async function selectLanguage(language) {
    if (SUPPORTED.indexOf(language) < 0) {
      console.warn('[LangUI] ไม่รองรับภาษา: ' + language);
      language = DEFAULT_LANG;
    }

    if (State.selectedLang === language) {
      await UIService.closeLanguagePopup();
      return;
    }

    await UIService.closeLanguagePopup();

    // แจ้ง FvLang ก่อน redirect (เผื่อบางระบบต้องทำอะไรก่อน page unload)
    if (window.FvLang) {
      FvLang.setLang(language);
    }

    try { localStorage.setItem(LS_KEY, language); } catch (e) {}

    var newUrl = _buildStaticLangUrl(language);
    window.location.replace(newUrl);
  }

  // ── UI Service (ปุ่ม + popup ผ่าน PopupSystem) ──────────────────────────

  var UIService = {

    /**
     * สร้าง/อัพเดท flex wrapper + icon + text spans ใน #language-button
     */
    async prepareAllButtonTexts() {
      State.languageButton = document.getElementById("language-button");
      if (!State.languageButton || !State.languagesConfig) return;

      // ล้าง elements เก่า
      Array.from(State.languageButton.querySelectorAll(".lang-btn-txt, .lang-btn-svg"))
        .forEach(function(e) { e.remove(); });

      // สร้าง flex wrapper (ถ้ายังไม่มี)
      var flexWrap = State.languageButton.querySelector(".lang-btn-flex");
      if (!flexWrap) {
        flexWrap = document.createElement("span");
        flexWrap.className = "lang-btn-flex";
        flexWrap.style.cssText = "display:inline-flex;align-items:center;gap:15px;vertical-align:middle;";
        State.languageButton.innerHTML = "";
        State.languageButton.appendChild(flexWrap);
      } else {
        flexWrap.innerHTML = "";
      }

      // SVG icon
      var svgWrap = document.createElement("span");
      svgWrap.className = "lang-btn-svg";
      svgWrap.innerHTML = LANG_ICON_SVG;
      svgWrap.style.cssText = "display:inline-flex;align-items:center;justify-content:center;";
      flexWrap.appendChild(svgWrap);

      // Text span สำหรับแต่ละภาษา (ซ่อนทั้งหมด แล้ว show เฉพาะที่ active)
      Object.keys(State.languagesConfig).forEach(function(lang) {
        var config = State.languagesConfig[lang];
        var span = document.createElement("span");
        span.className = "lang-btn-txt";
        span.dataset.lang = lang;
        span.textContent = config.buttonText || "Language";
        span.style.display = "none";
        span.style.lineHeight = "1";
        flexWrap.appendChild(span);
      });

      this.showButtonTextForLang(State.selectedLang || "en");
    },

    /**
     * แสดง text ของภาษาที่ active อยู่ ซ่อนอันอื่น
     * @param {string} lang
     */
    showButtonTextForLang(lang) {
      State.languageButton = document.getElementById("language-button");
      if (!State.languageButton) return;

      var flexWrap = State.languageButton.querySelector(".lang-btn-flex");
      if (!flexWrap) return;

      Array.from(flexWrap.querySelectorAll(".lang-btn-txt")).forEach(function(span) {
        span.style.display = (span.dataset.lang === lang) ? "" : "none";
      });
    },

    /** Trigger re-init (เรียกหลัง init) */
    updateLanguageSelectorUI() {
      this.prepareAllButtonTexts();
      this.showButtonTextForLang(State.selectedLang || "en");
      this._attachButtonHandler();
    },

    /**
     * ผูก click handler ให้ #language-button → เปิด popup
     * Idempotent — ใช้ flag เพื่อไม่ bind ซ้ำ
     */
    _attachButtonHandler() {
      var btn = document.getElementById("language-button");
      if (!btn || btn._fvLangPopupBound) return;
      btn._fvLangPopupBound = true;
      btn.addEventListener("click", function(e) {
        e.preventDefault();
        UIService.openLanguagePopup();
      });
    },

    /**
     * เปิด popup เลือกภาษาผ่าน PopupSystem.open()
     */
    openLanguagePopup() {
      var self = this;

      // ปิด popup เดิมถ้ามี
      if (_popupHandle) {
        _popupHandle.close().catch(function() {});
        return;
      }

      // รอ PopupSystem พร้อม
      if (typeof window.PopupSystem === "undefined" || !window.PopupSystem._initialized) {
        window.addEventListener("fp:ready", function() { self.openLanguagePopup(); }, { once: true });
        return;
      }

      _injectStyles();

      // สร้าง HTML สำหรับ options
      var lang = State.selectedLang || "en";
      var optionsHTML = '<div class="fv-lang-options-list" role="listbox" aria-label="Select language">';
      Object.keys(State.languagesConfig).forEach(function(l) {
        var config = State.languagesConfig[l];
        var isCurrent = (l === lang);
        var activeClass = isCurrent ? " fv-lang-option--active" : "";
        var checkMark = isCurrent ? '<span class="fv-lang-option-check" aria-hidden="true">&#10003;</span>' : "";
        optionsHTML += '<button type="button" class="fv-lang-option' + activeClass + '" role="option" tabindex="0" aria-selected="' + (isCurrent ? "true" : "false") + '" data-language="' + l + '"><span class="fv-lang-option-label">' + (config.label || l) + '</span>' + checkMark + '</button>';
      });
      optionsHTML += '</div>';

      _popupId = "fv-lang-picker";
      PopupSystem.open({
        id: _popupId,
        type: "dialog",
        title: null,
        body: optionsHTML,
        size: "sm",
        position: "center",
        blocking: true,
        closable: true,
        dismissOnOverlay: true,
        dismissOnEscape: true,
        triggerEl: State.languageButton,
        group: "language-picker",
        theme: "light",
        onMount: function(bodyEl, handle) {
          _popupHandle = handle;
          var options = Array.from(bodyEl.querySelectorAll(".fv-lang-option"));
          if (options.length > 0) {
            var active = bodyEl.querySelector(".fv-lang-option--active") || options[0];
            active.focus();
          }

          bodyEl.addEventListener("click", function(e) {
            var option = e.target.closest(".fv-lang-option");
            if (option && option.dataset.language) {
              selectLanguage(option.dataset.language);
            }
          });

          bodyEl.addEventListener("keydown", function(e) {
            var current = document.activeElement;
            if (!current || !current.classList.contains("fv-lang-option")) return;
            var idx = options.indexOf(current);
            if (idx === -1) return;

            if (e.key === "ArrowDown") {
              e.preventDefault();
              var next = options[(idx + 1) % options.length];
              next.focus();
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              var prev = options[(idx - 1 + options.length) % options.length];
              prev.focus();
            } else if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (current.dataset.language) {
                selectLanguage(current.dataset.language);
              }
            }
          });
        },
        onClose: function() {
          _popupHandle = null;
          _popupId = null;
        }
      });
    },

    /**
     * ปิด popup ภาษา
     */
    async closeLanguagePopup() {
      if (_popupHandle) {
        try { await _popupHandle.close(); } catch (e) {}
      }
      _popupHandle = null;
      _popupId = null;
    },
  };

  // ── Boot ────────────────────────────────────────────────────────────────

  function _boot() {
    _loadConfig();

    // Sync FvLang + localStorage (compat ให้ระบบที่ยังอ่าน selectedLang
    // เห็นภาษาของหน้าปัจจุบัน — เขียนเฉพาะค่าของหน้านี้ ไม่ใช่การ auto-redirect)
    if (window.FvLang && FvLang.lang !== State.selectedLang) {
      FvLang.lang = State.selectedLang;
    }
    try { localStorage.setItem(LS_KEY, State.selectedLang); } catch (e) {}

    if (document.getElementById("language-button")) {
      UIService.prepareAllButtonTexts();
      UIService.showButtonTextForLang(State.selectedLang);
      UIService.updateLanguageSelectorUI();
    }

    // Fade in
    if (document.body) {
      document.body.classList.add('is-loaded');
      if (document.body.style.opacity === '0') { document.body.style.opacity = '1'; }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _boot);
  } else {
    _boot();
  }

  // ── Public API ──────────────────────────────────────────────────────────
  window.__langUI = {
    _initialized: true,
    State: State,
    UIService: UIService,
    selectLanguage: selectLanguage,
  };

})();

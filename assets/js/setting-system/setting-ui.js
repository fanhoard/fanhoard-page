/**
 * setting-ui.js v1.0 — FanHoard Settings Page Control Orchestrator
 *
 * Coordinates settings page controls: theme switch, auto-update switch,
 * language selector, save feedback toasts, keyboard focus, and accessibility.
 *
 * Used by: setting/index.html
 */

(function(global) {
  'use strict';

  var CFG = {
    THEME_TOGGLE_ID   : 'theme-toggle-btn',
    THEME_SWITCH_ID   : 'theme-switch',
    THEME_DESC_ID     : 'theme-desc',
    AUTO_TOGGLE_ID    : 'auto-update-toggle-btn',
    AUTO_SWITCH_ID    : 'auto-update-switch',
    LANG_BTN_ID       : 'language-button',
    NO_UPDATE_KEY     : 'fv_noupdate'
  };

  function _getLang() {
    if (global.FvLang && global.FvLang.lang) return global.FvLang.lang;
    try {
      return localStorage.getItem('selectedLang') || localStorage.getItem('fv_lang') || 'en';
    } catch (_) {
      return 'en';
    }
  }

  function _showToast(msg, variant) {
    if (!global.PopupSystem || typeof global.PopupSystem.toast !== 'function') return;

    var opts = { duration: 2200 };
    if (variant === 'success' && typeof global.PopupSystem.toast.success === 'function') {
      global.PopupSystem.toast.success(msg, opts);
    } else {
      global.PopupSystem.toast(msg, Object.assign({ variant: variant || 'info' }, opts));
    }
  }

  // ── Theme Switch ──────────────────────────────────────────
  function setupThemeControl() {
    var themeChoices = document.querySelectorAll('input[name="theme-choice"]');
    if (themeChoices.length) {
      var ThemeCore = global.ThemeCore;
      function syncThemeChoice(theme) {
        var selected = theme || (ThemeCore ? ThemeCore.getTheme() : 'dark');
        themeChoices.forEach(function(choice) {
          choice.checked = choice.value === selected;
        });
      }
      syncThemeChoice();
      themeChoices.forEach(function(choice) {
        choice.addEventListener('change', function() {
          if (!choice.checked) return;
          if (ThemeCore && typeof ThemeCore.setTheme === 'function') {
            ThemeCore.setTheme(choice.value, { transition: true, toast: false });
          }
          _showToast('Appearance preference saved', 'success');
        });
      });
      window.addEventListener('fv:themechange', function(e) {
        if (e && e.detail && e.detail.theme) syncThemeChoice(e.detail.theme);
      });
      return;
    }

    var row = document.getElementById(CFG.THEME_TOGGLE_ID);
    var switchEl = document.getElementById(CFG.THEME_SWITCH_ID);
    var descEl = document.getElementById(CFG.THEME_DESC_ID);

    if (!switchEl) return;

    function syncUI(theme, isUserTriggered) {
      var isDark = theme === 'dark';
      switchEl.checked = isDark;
      switchEl.setAttribute('aria-checked', isDark ? 'true' : 'false');

      var isTh = _getLang() === 'th';
      if (descEl) {
        if (isTh) {
          descEl.textContent = isDark ? 'โหมดมืด (สบายตา)' : 'โหมดสว่าง (สว่างคมชัด)';
        } else {
          descEl.textContent = isDark ? 'Dark Mode (Eye comfort)' : 'Light Mode (Bright & clear)';
        }
      }

      if (isUserTriggered) {
        var msg = '';
        if (isTh) {
          msg = isDark ? 'สลับเป็นโหมดมืดแล้ว' : 'สลับเป็นโหมดสว่างแล้ว';
        } else {
          msg = isDark ? 'Switched to Dark Theme' : 'Switched to Light Theme';
        }
        _showToast(msg, 'success');
      }
    }

    // Initial sync
    var ThemeCore = global.ThemeCore;
    var currentEffective = ThemeCore ? ThemeCore.getEffectiveTheme() : 'dark';
    syncUI(currentEffective, false);

    function toggleThemeAction(e) {
      if (e) e.stopPropagation();
      var ThemeCore = global.ThemeCore;
      var newTheme = switchEl.checked ? 'dark' : 'light';

      if (ThemeCore && typeof ThemeCore.setTheme === 'function') {
        ThemeCore.setTheme(newTheme, { transition: true, toast: false });
      } else {
        document.documentElement.setAttribute('data-theme', newTheme);
        try { localStorage.setItem('fv_theme', newTheme); } catch (_) {}
      }
      syncUI(newTheme, true);
    }

    switchEl.addEventListener('change', toggleThemeAction);

    if (row) {
      row.addEventListener('click', function(e) {
        if (e.target !== switchEl && e.target.tagName !== 'LABEL' && (!e.target.parentElement || e.target.parentElement.tagName !== 'LABEL')) {
          switchEl.checked = !switchEl.checked;
          toggleThemeAction();
        }
      });

      row.addEventListener('keydown', function(e) {
        if (e.key === ' ' || e.key === 'Enter') {
          if (e.target === row) {
            e.preventDefault();
            switchEl.checked = !switchEl.checked;
            toggleThemeAction();
          }
        }
      });
    }

    window.addEventListener('fv:themechange', function(e) {
      if (e && e.detail && e.detail.effectiveTheme) {
        syncUI(e.detail.effectiveTheme, false);
      }
    });
  }

  // ── Auto-Update Switch ─────────────────────────────────────
  function setupAutoUpdateControl() {
    var row = document.getElementById(CFG.AUTO_TOGGLE_ID);
    var switchEl = document.getElementById(CFG.AUTO_SWITCH_ID);

    if (!switchEl) return;

    var isDisabled = false;
    try {
      isDisabled = localStorage.getItem(CFG.NO_UPDATE_KEY) === '1';
    } catch (_) {}

    switchEl.checked = !isDisabled;
    switchEl.setAttribute('aria-checked', switchEl.checked ? 'true' : 'false');

    function toggleAutoUpdate(isUserTriggered) {
      var enabled = switchEl.checked;
      switchEl.setAttribute('aria-checked', enabled ? 'true' : 'false');

      try {
        localStorage.setItem(CFG.NO_UPDATE_KEY, enabled ? '0' : '1');
      } catch (_) {}

      if (isUserTriggered) {
        var isTh = _getLang() === 'th';
        var msg = enabled
          ? (isTh ? 'เปิดใช้งานการอัปเดตอัตโนมัติแล้ว' : 'Auto updates enabled')
          : (isTh ? 'ปิดใช้งานการอัปเดตอัตโนมัติแล้ว' : 'Auto updates disabled');
        _showToast(msg, 'success');
      }
    }

    switchEl.addEventListener('change', function() { toggleAutoUpdate(true); });

    if (row) {
      row.addEventListener('click', function(e) {
        if (e.target !== switchEl && e.target.tagName !== 'LABEL' && (!e.target.parentElement || e.target.parentElement.tagName !== 'LABEL')) {
          switchEl.checked = !switchEl.checked;
          toggleAutoUpdate(true);
        }
      });

      row.addEventListener('keydown', function(e) {
        if (e.key === ' ' || e.key === 'Enter') {
          if (e.target === row) {
            e.preventDefault();
            switchEl.checked = !switchEl.checked;
            toggleAutoUpdate(true);
          }
        }
      });
    }
  }

  // ── Language Selector Button ──────────────────────────────
  function setupLanguageControl() {
    var btn = document.getElementById(CFG.LANG_BTN_ID);
    if (!btn) return;

    function syncLanguageUI() {
      var lang = _getLang();
      var isTh = lang === 'th';

      btn.innerHTML = `
        <span class="setting-item-inner">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M4 5h7" /><path d="M9 3v2c0 4.418 -2.239 8 -5 8" /><path d="M5 9c-.003 2.144 2.952 3.908 6.7 4" /><path d="M12 20l4 -9l4 9" /><path d="M19.1 18h-6.2" />
          </svg>
          <span>${isTh ? 'ภาษาอินเทอร์เฟซ (Language)' : 'Interface Language'}</span>
        </span>
        <span class="fv-lang-badge">${isTh ? 'ไทย (TH)' : 'English (EN)'}</span>
      `;
    }

    syncLanguageUI();

    btn.addEventListener('click', function() {
      if (global.LangUI && typeof global.LangUI.showModal === 'function') {
        global.LangUI.showModal();
      } else if (global.PopupSystem && typeof global.PopupSystem.open === 'function') {
        // Fallback: trigger language modal via event or LangUI
        var event = new CustomEvent('fv:open-lang-modal');
        window.dispatchEvent(event);
      }
    });

    window.addEventListener('fv:langchange', function(e) {
      syncLanguageUI();
      if (e && e.detail && e.detail.lang) {
        var isTh = e.detail.lang === 'th';
        var msg = isTh ? 'เปลี่ยนภาษาเป็นภาษาไทยแล้ว' : 'Language changed to English';
        _showToast(msg, 'success');
      }
    });

    window.addEventListener('languageChange', function() {
      syncLanguageUI();
    });
  }

  // ── Initialize Settings System ─────────────────────────────
  function initSettings() {
    setupThemeControl();
    setupAutoUpdateControl();
    setupLanguageControl();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSettings);
  } else {
    initSettings();
  }

  global.SettingUI = Object.freeze({
    init: initSettings,
    setupThemeControl: setupThemeControl,
    setupAutoUpdateControl: setupAutoUpdateControl,
    setupLanguageControl: setupLanguageControl
  });

})(typeof window !== 'undefined' ? window : this);

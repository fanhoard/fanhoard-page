/**
 * theme-core.js v1.0 — FanHoard Unified Theme & Persistence Core
 *
 * Handles site-wide light/dark/system theme switching, localStorage persistence,
 * system color scheme listeners, and smooth theme transitions.
 *
 * @used-by setting/index.html, header/nav, theme toggle switches
 */

(function(global) {
  'use strict';

  var LS_THEME_KEY = 'fv_theme';
  var LS_PREFS_KEY = 'fv_preferences';
  var VALID_THEMES = ['dark', 'light', 'system'];

  var _mediaQuery = null;

  function _getStoredTheme() {
    try {
      var raw = localStorage.getItem(LS_THEME_KEY);
      if (raw && VALID_THEMES.indexOf(raw) !== -1) return raw;

      var prefsRaw = localStorage.getItem(LS_PREFS_KEY);
      if (prefsRaw) {
        var parsed = JSON.parse(prefsRaw);
        if (parsed && parsed.theme && VALID_THEMES.indexOf(parsed.theme) !== -1) {
          return parsed.theme;
        }
      }
    } catch (_) {}
    return 'dark'; // FanHoard default theme is dark
  }

  function _resolveEffectiveTheme(theme) {
    if (theme === 'system') {
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'dark';
    }
    return theme === 'light' ? 'light' : 'dark';
  }

  function _applyThemeToDOM(effectiveTheme, enableTransition) {
    var root = document.documentElement;
    if (!root) return;

    if (enableTransition && typeof document !== 'undefined') {
      root.classList.add('fv-theme-transitioning');
      setTimeout(function() {
        root.classList.remove('fv-theme-transitioning');
      }, 300);
    }

    root.setAttribute('data-theme', effectiveTheme);
  }

  function _persistTheme(theme) {
    try {
      localStorage.setItem(LS_THEME_KEY, theme);

      var prefs = {};
      try {
        var raw = localStorage.getItem(LS_PREFS_KEY);
        if (raw) prefs = JSON.parse(raw) || {};
      } catch (_) {}

      prefs.theme = theme;
      localStorage.setItem(LS_PREFS_KEY, JSON.stringify(prefs));
    } catch (_) {}

    // Sync with PreferenceStore if available
    if (global.PreferenceStore && typeof global.PreferenceStore.setPreferences === 'function') {
      try {
        global.PreferenceStore.setPreferences({ theme: theme });
      } catch (_) {}
    }
  }

  function _dispatchThemeEvents(theme, effectiveTheme) {
    if (typeof window === 'undefined') return;

    var detail = { theme: theme, effectiveTheme: effectiveTheme };

    try {
      window.dispatchEvent(new CustomEvent('fv:themechange', { detail: detail }));
      window.dispatchEvent(new CustomEvent('fv:preference-change', {
        detail: { theme: theme, lang: (localStorage.getItem('fv_lang') || localStorage.getItem('selectedLang') || 'en') }
      }));
    } catch (_) {}
  }

  function _onSystemThemeChange(e) {
    if (_getStoredTheme() === 'system') {
      var effective = e.matches ? 'dark' : 'light';
      _applyThemeToDOM(effective, true);
      _dispatchThemeEvents('system', effective);
    }
  }

  function init() {
    var theme = _getStoredTheme();
    var effective = _resolveEffectiveTheme(theme);
    _applyThemeToDOM(effective, false);

    if (typeof window !== 'undefined' && window.matchMedia) {
      if (_mediaQuery) {
        try { _mediaQuery.removeEventListener('change', _onSystemThemeChange); } catch (_) {}
      }
      _mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      try {
        _mediaQuery.addEventListener('change', _onSystemThemeChange);
      } catch (_) {}
    }
  }

  function getTheme() {
    return _getStoredTheme();
  }

  function getEffectiveTheme() {
    return _resolveEffectiveTheme(_getStoredTheme());
  }

  function setTheme(themeName, opts) {
    opts = opts || {};
    var theme = VALID_THEMES.indexOf(themeName) !== -1 ? themeName : 'dark';
    var effective = _resolveEffectiveTheme(theme);

    _applyThemeToDOM(effective, opts.transition !== false);
    _persistTheme(theme);
    _dispatchThemeEvents(theme, effective);

    if (opts.toast && global.PopupSystem && typeof global.PopupSystem.toast === 'function') {
      var isTh = (global.FvLang && global.FvLang.lang === 'th') ||
                 localStorage.getItem('selectedLang') === 'th' ||
                 localStorage.getItem('fv_lang') === 'th';

      var msg = '';
      if (effective === 'dark') {
        msg = isTh ? 'สลับเป็นโหมดมืดแล้ว' : 'Switched to Dark Theme';
      } else {
        msg = isTh ? 'สลับเป็นโหมดสว่างแล้ว' : 'Switched to Light Theme';
      }

      if (typeof global.PopupSystem.toast.success === 'function') {
        global.PopupSystem.toast.success(msg, { duration: 2000 });
      } else {
        global.PopupSystem.toast(msg, { duration: 2000, variant: 'success' });
      }
    }

    return effective;
  }

  function toggleTheme(opts) {
    opts = opts || {};
    var currentEffective = getEffectiveTheme();
    var nextTheme = currentEffective === 'dark' ? 'light' : 'dark';
    return setTheme(nextTheme, opts);
  }

  // Auto-init early if DOM is loading
  if (typeof document !== 'undefined') {
    init();
  }

  global.ThemeCore = Object.freeze({
    init: init,
    getTheme: getTheme,
    getEffectiveTheme: getEffectiveTheme,
    setTheme: setTheme,
    toggleTheme: toggleTheme
  });

})(typeof window !== 'undefined' ? window : this);

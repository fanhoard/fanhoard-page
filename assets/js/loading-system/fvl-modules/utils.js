// Path:    assets/js/loading-system/fvl-modules/utils.js
// Purpose: Helper utilities for FVL (DOM helpers, option normalization, lang detection, autoTheme).

(function(window) {
  'use strict';

  var M = window.FVLModules = window.FVLModules || {};

  var Utils = (function() {

    // ── Option normalization (dedupes string -> { message: string }) ──
    function normalizeOptions(userOpts) {
      if (typeof userOpts === 'string') {
        return { message: userOpts };
      }
      return userOpts || {};
    }

    // ── DOM helpers ──
    var DOM = {
      create: function(tag, className, attrs) {
        var el = (window.document || document).createElement(tag);
        if (className) el.className = className;
        if (attrs) {
          for (var k in attrs) {
            if (attrs.hasOwnProperty(k)) el.setAttribute(k, attrs[k]);
          }
        }
        return el;
      },
      query: function(sel, parent) {
        try { return (parent || window.document || document).querySelector(sel); } catch (_) { return null; }
      },
      resolveTarget: function(target) {
        if (!target) return null;
        if (typeof target === 'string') return DOM.query(target);
        var isElem = (typeof HTMLElement !== 'undefined' && target instanceof HTMLElement) || (target && target.nodeType === 1);
        if (isElem) return target;
        return null;
      },
      remove: function(el) {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      },
    };

    // ── Option merging ──
    function mergeOptions(userOpts, mode) {
      var opts = normalizeOptions(userOpts);
      var CONFIG = M.CONFIG;

      var resolvedMode = opts.mode || mode || 'fullscreen';
      var preset = (CONFIG && CONFIG.PRESETS && CONFIG.PRESETS[resolvedMode]) || (CONFIG && CONFIG.PRESETS && CONFIG.PRESETS.fullscreen) || {};

      var o = Object.assign({}, preset, opts);
      o.mode = resolvedMode;
      o.visual = o.visual || preset.visual;
      o.theme = o.theme || preset.theme;
      o.size = o.size != null ? o.size : (CONFIG && CONFIG.SIZES && CONFIG.SIZES[resolvedMode]);

      return o;
    }

    // ── prefers-reduced-motion ──
    function prefersReducedMotion() {
      try {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      } catch (_) { return false; }
    }

    // ── Language detection ──
    function detectLang(explicit) {
      if (explicit) return explicit;
      try {
        var CONFIG = M.CONFIG;
        var key = (CONFIG && CONFIG.LANG_KEY) || 'selectedLang';
        var ls = window.localStorage || (typeof localStorage !== 'undefined' ? localStorage : null);
        return (ls && ls.getItem(key)) || 'en';
      } catch (_) { return 'en'; }
    }

    // ── i18n message resolver ──
    function getMessage(lang, key) {
      key = key || 'loading';
      var CONFIG = M.CONFIG;
      var msgs = (CONFIG && CONFIG.MESSAGES) || {};
      return (msgs[lang] && msgs[lang][key])
          || (msgs.en && msgs.en[key])
          || (msgs[Object.keys(msgs)[0]] || {})[key]
          || 'Loading...';
    }

    // ── Generate unique ID ──
    var _idCounter = 0;
    function generateId(prefix) {
      return (prefix || 'fvl') + '-' + Date.now().toString(36) + '-' + (++_idCounter).toString(36);
    }

    // ── Hex/rgb to luminance for theme auto-detection ──
    function _relLuminance(rgb) {
      var a = rgb.map(function(v) {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    }

    function _parseRgb(color) {
      if (!color) return null;
      var m = color.match(/rgba?\(([^)]+)\)/i);
      if (m) {
        var parts = m[1].split(',').map(function(s) { return parseFloat(s.trim()); });
        return [parts[0], parts[1], parts[2]];
      }
      m = color.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
      if (m) {
        var hex = m[1];
        if (hex.length === 3) hex = hex.split('').map(function(c) { return c + c; }).join('');
        return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
      }
      return null;
    }

    function autoTheme(targetEl) {
      try {
        var doc = window.document || document;
        var el = targetEl || (doc && doc.body);
        var bg = window.getComputedStyle(el).backgroundColor;
        var rgb = _parseRgb(bg);
        if (!rgb) return 'light';
        return _relLuminance(rgb) > 0.5 ? 'light' : 'dark';
      } catch (e) {
        console.warn('[FVL:utils] autoTheme failed:', e);
        return 'light';
      }
    }

    return Object.freeze({
      DOM: DOM,
      normalizeOptions: normalizeOptions,
      mergeOptions: mergeOptions,
      prefersReducedMotion: prefersReducedMotion,
      detectLang: detectLang,
      getMessage: getMessage,
      generateId: generateId,
      autoTheme: autoTheme,
    });
  })();

  M.Utils = Utils;
})(typeof window !== 'undefined' ? window : globalThis);

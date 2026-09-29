// @ts-check
/**
 * @file utils.js
 * Pure utility services — stateless helpers and fallback virtual scrolling engine.
 *
 * Exports:
 *  LanguageService    — language detection + translation
 *  DOMService         — element creation and event helpers
 *  StringService      — HTML escaping, URL encode/decode
 *  StorageService     — session history read/write
 *  NotificationService — clipboard copy + showCopyNotification bridge
 *  HighlightService   — character-level match highlighting
 *  VirtualScrollEngine — fallback virtual scroll implementation
 *
 * @module utils
 */

import { CONFIG } from './config.js';

// ── LanguageService ─────────────────────────────────────────────────────────
export const LanguageService = {
  getLang() {
    try {
      return (
        localStorage.getItem(CONFIG.STORAGE.langKey) ||
        (CONFIG.LANG.autoDetect && navigator.language?.startsWith('th') ? 'th' : CONFIG.LANG.default)
      );
    } catch {
      return CONFIG.LANG.default;
    }
  },

  /** @param {string} key */
  t(key) {
    const lang = this.getLang();
    return CONFIG.TEXTS[lang]?.[key] ?? CONFIG.TEXTS[CONFIG.LANG.default][key] ?? key;
  },

  /** @param {string} query */
  detectQueryLanguage(query) {
    const q = String(query || '');
    let thai = 0;
    let latin = 0;

    for (let i = 0; i < q.length; i++) {
      const c = q.charCodeAt(i);
      if (c >= 0x0e00 && c <= 0x0e7f) {
        thai++;
        continue;
      }
      if ((c >= 0x41 && c <= 0x5a) || (c >= 0x61 && c <= 0x7a)) {
        latin++;
        continue;
      }
    }

    const cfg = CONFIG.LANG_WEIGHT || { dominanceRatio: 1.5, minCharsForDominance: 2, fallback: 'auto' };
    const minChars = cfg.minCharsForDominance;
    const ratio = cfg.dominanceRatio;

    if (thai < minChars && latin < minChars) {
      const lang = cfg.fallback === 'auto' ? this.getLang() : cfg.fallback;
      return { language: lang, thaiChars: thai, latinChars: latin, reason: 'fallback-ui', confident: false };
    }

    if (thai >= minChars && latin < minChars) {
      return { language: 'th', thaiChars: thai, latinChars: latin, reason: 'dominant-thai', confident: true };
    }

    if (latin >= minChars && thai < minChars) {
      return { language: 'en', thaiChars: thai, latinChars: latin, reason: 'dominant-latin', confident: true };
    }

    const maxLang = thai > latin ? 'th' : 'en';
    const maxVal = Math.max(thai, latin);
    const minVal = Math.min(thai, latin);
    if (maxVal / minVal >= ratio) {
      return {
        language: maxLang,
        thaiChars: thai,
        latinChars: latin,
        reason: maxLang === 'th' ? 'dominant-thai' : 'dominant-latin',
        confident: true,
      };
    }

    const lang = cfg.fallback === 'auto' ? this.getLang() : cfg.fallback;
    return { language: lang, thaiChars: thai, latinChars: latin, reason: 'fallback-ui', confident: false };
  },

  /** @param {string} s */
  hasThaiChars(s) {
    const str = String(s || '');
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      if (c >= 0x0e00 && c <= 0x0e7f) return true;
    }
    return false;
  },
};

// ── DOMService ──────────────────────────────────────────────────────────────
export const DOMService = {
  /** @param {string} id */
  get: (id) => document.getElementById(id),

  /** @param {string} sel @param {any} [parent] */
  query: (sel, parent) =>
    // @ts-ignore
    window.NavCoreModules?.qs ? window.NavCoreModules.qs(sel, parent) : (parent || document).querySelector(sel),

  /** @param {string} sel @param {any} [parent] */
  queryAll: (sel, parent) =>
    // @ts-ignore
    window.NavCoreModules?.qsa ? window.NavCoreModules.qsa(sel, parent) : (parent || document).querySelectorAll(sel),

  getMainLandmark() {
    return (
      document.getElementById('fv-main') ||
      document.getElementById('searchResults') ||
      document.getElementById('main') ||
      document.querySelector('main.fv-main, main')
    );
  },

  getNavHeight() {
    try {
      const val = getComputedStyle(document.documentElement).getPropertyValue('--fv-nav-height').trim();
      if (val) {
        const parsed = parseFloat(val);
        if (!isNaN(parsed)) return parsed;
      }
    } catch (_) {}
    const nav = document.querySelector('header nav, nav.fv-nav, .fv-nav');
    return nav ? /** @type {HTMLElement} */ (nav).offsetHeight : 56;
  },

  getScrollOffset() {
    try {
      const val = getComputedStyle(document.documentElement).getPropertyValue('--fv-scroll-offset').trim();
      if (val && val.includes('px')) {
        const parsed = parseFloat(val);
        if (!isNaN(parsed)) return parsed;
      }
    } catch (_) {}
    return this.getNavHeight() + 12;
  },

  /** @param {string} tag @param {string} [id] @param {string} [cls] @param {any} [styles] */
  create(tag, id, cls, styles) {
    // @ts-ignore
    if (window.NavCoreModules?.createElement) {
      // @ts-ignore
      return window.NavCoreModules.createElement(tag, id, cls, styles);
    }
    const el = document.createElement(tag);
    if (id) el.id = id;
    if (cls) el.className = cls;
    if (styles) Object.assign(el.style, styles);
    return el;
  },

  /** @param {any} el */
  remove(el) {
    try {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    } catch {}
  },

  /** @param {any} el @param {any} s */
  setStyles(el, s) {
    if (!el || !s || typeof s !== 'object') return;
    try {
      Object.assign(el.style, s);
    } catch (e) {
      console.warn('[DOMService] setStyles failed:', e);
    }
  },

  /** @param {any} el @param {string} html */
  setHTML(el, html) {
    if (el) el.innerHTML = html;
  },

  /** @param {any} el @param {string} k @param {string} v */
  setAttr(el, k, v) {
    if (el) el.setAttribute(k, v);
  },

  /** @param {any} el @param {string} ev @param {any} fn @param {any} [opts] */
  on(el, ev, fn, opts) {
    if (el && fn) el.addEventListener(ev, fn, opts);
  },

  /** @param {any} el @param {string} ev @param {any} fn */
  off(el, ev, fn) {
    if (el && fn) el.removeEventListener(ev, fn);
  },
};

// ── StringService ───────────────────────────────────────────────────────────
export const StringService = {
  /** @param {any} s */
  escapeHtml(s) {
    const str = String(s ?? '');
    let out = '';
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      if (c === 38) out += '&amp;';
      else if (c === 60) out += '&lt;';
      else if (c === 62) out += '&gt;';
      else if (c === 34) out += '&quot;';
      else if (c === 39) out += '&#39;';
      else out += str[i];
    }
    return out;
  },

  /** @param {any} s */
  encodeUrl(s) {
    return encodeURIComponent(String(s || ''));
  },

  /** @param {any} s */
  decodeUrl(s) {
    try {
      return decodeURIComponent(String(s || ''));
    } catch {
      return String(s || '');
    }
  },

  /** @param {any} str @param {number} [len] */
  truncate(str, len = 60) {
    const s = String(str || '');
    return s.length <= len ? s : s.slice(0, len) + '…';
  },
};

// ── StorageService ──────────────────────────────────────────────────────────
export const StorageService = {
  readHistory() {
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE.historyKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /** @param {string[]} items */
  writeHistory(items) {
    try {
      localStorage.setItem(CONFIG.STORAGE.historyKey, JSON.stringify(items.slice(0, 20)));
    } catch {}
  },

  /** @param {string} item */
  addHistoryItem(item) {
    if (!item?.trim()) return;
    const clean = item.trim();
    const cur = this.readHistory().filter((/** @type {string} */ x) => x !== clean);
    cur.unshift(clean);
    this.writeHistory(cur);
  },
};

// ── NotificationService ─────────────────────────────────────────────────────
export const NotificationService = {
  /**
   * @param {string} text
   */
  async copyText(text) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {}

    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  },

  /**
   * @param {string} text
   */
  async copyToClipboard(text) {
    const ok = await this.copyText(text);
    if (ok) {
      const msg = LanguageService.t('copied_to_clipboard') || 'Copied to clipboard';
      this.showCopyToast(msg);
    }
  },

  /** @param {string} msg */
  showCopyToast(msg) {
    // @ts-ignore
    if (typeof window.showCopyNotification === 'function') {
      // @ts-ignore
      window.showCopyNotification(msg);
      return;
    }

    let toast = DOMService.get(CONFIG.DOM.copyToastId);
    if (!toast) {
      toast = DOMService.create('div', CONFIG.DOM.copyToastId, 'copy-toast');
      if (toast) document.body.appendChild(toast);
    }
    if (toast) {
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => {
        if (toast) toast.classList.remove('show');
      }, CONFIG.TIMING.toastDisplayMs);
    }
  },
};

// ── HighlightService ────────────────────────────────────────────────────────
export const HighlightService = {
  /**
   * @param {string} text
   * @param {string} query
   */
  highlightMatches(text, query) {
    const escapedText = StringService.escapeHtml(text);
    if (!query?.trim()) return escapedText;

    const q = query.trim().toLowerCase();
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return escapedText;

    const before = StringService.escapeHtml(text.slice(0, idx));
    const match = StringService.escapeHtml(text.slice(idx, idx + q.length));
    const after = StringService.escapeHtml(text.slice(idx + q.length));

    return `${before}<mark class="search-highlight">${match}</mark>${after}`;
  },
};

// ── VirtualScrollEngine (Fallback) ──────────────────────────────────────────
export const VirtualScrollEngine = {
  OVERSCAN: 300,
  ESTIMATED_HEIGHT: CONFIG.RENDER.vsEstimatedItemHeight,

  /** @param {any[]} [items] */
  createState(items = []) {
    return {
      items,
      startIndex: 0,
      endIndex: Math.min(items.length, 10),
      totalHeight: items.length * this.ESTIMATED_HEIGHT,
      offsetY: 0,
    };
  },

  /** @param {number} scrollTop @param {number} viewportHeight @param {number} itemCount */
  computeRange(scrollTop, viewportHeight, itemCount) {
    const start = Math.max(0, Math.floor((scrollTop - this.OVERSCAN) / this.ESTIMATED_HEIGHT));
    const end = Math.min(itemCount, Math.ceil((scrollTop + viewportHeight + this.OVERSCAN) / this.ESTIMATED_HEIGHT));
    return {
      startIndex: start,
      endIndex: end,
      totalHeight: itemCount * this.ESTIMATED_HEIGHT,
      offsetY: start * this.ESTIMATED_HEIGHT,
    };
  },

  destroy() {},
};

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.SearchModules = window.SearchModules || {};
  // @ts-ignore
  Object.assign(window.SearchModules, {
    LanguageService,
    DOMService,
    StringService,
    StorageService,
    NotificationService,
    HighlightService,
    VirtualScrollEngine,
  });
}

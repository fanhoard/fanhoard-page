// @ts-check
/**
 * @file url-history.js
 * Browser history and URL query sync via URLSearchParams.
 *
 * @module url-history
 */

import { StorageService } from './utils.js';

export const URLService = {
  /** @param {string} [qs] */
  parseQS(qs) {
    /** @type {Record<string, string>} */
    const out = {};
    if (!qs) return out;
    const params = new URLSearchParams(qs.replace(/^\?/, ''));
    params.forEach((val, key) => {
      out[key] = val;
    });
    return out;
  },

  getParams() {
    return this.parseQS(window.location.search);
  },

  /**
   * @param {Object} [state]
   * @param {string} [state.q]
   * @param {string} [state.type]
   * @param {string} [state.category]
   */
  commitSearch(state) {
    if (!state) return;
    const q = (state.q || '').trim();
    const type = state.type && state.type !== 'all' ? state.type : null;
    const category = state.category && state.category !== 'all' ? state.category : null;

    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (type) params.set('type', type);
    if (category) params.set('category', category);

    const newQS = params.toString();
    const newURL = window.location.pathname + (newQS ? '?' + newQS : '');

    try {
      if (window.location.search !== (newQS ? '?' + newQS : '')) {
        history.pushState({ q, type, category }, '', newURL);
      } else {
        history.replaceState({ q, type, category }, '', newURL);
      }
    } catch (pushErr) {
      console.warn('[URLService] pushState failed, attempting replaceState fallback:', pushErr);
      try {
        history.replaceState({ q, type, category }, '', newURL);
      } catch (replaceErr) {
        console.error('[URLService] history API failed:', replaceErr);
        if (q) {
          window.location.hash = '#q=' + encodeURIComponent(q);
        }
      }
    }

    if (q) {
      StorageService.addHistoryItem(q);
    }
  },

  pushOverlayEntry() {
    try {
      history.pushState({ overlay: true }, '', window.location.href);
    } catch (e) {
      console.warn('[URLService] pushOverlayEntry failed:', e);
    }
  },

  collapseOverlayEntry() {
    try {
      const params = this.getParams();
      const qs = new URLSearchParams(params).toString();
      const url = window.location.pathname + (qs ? '?' + qs : '');
      history.replaceState(params, '', url);
    } catch (e) {
      console.warn('[URLService] collapseOverlayEntry failed:', e);
    }
  },
};

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.SearchModules = window.SearchModules || {};
  // @ts-ignore
  window.SearchModules.URLService = URLService;
}

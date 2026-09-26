// @ts-check
/**
 * @file loading.js
 * LoadingService — thin proxy that delegates to FVL (FanHoardVerse Loader).
 *
 * v2.1 — "Always-show, render-behind-overlay, single-message"
 *
 * Simplified from v2.0 based on user feedback:
 *   • แสดงแค่ข้อความ "กำลังโหลด…" / "Loading…" เท่านั้น
 *   • ไม่มี phase indicators (เช่น "2/4 · Fetching content…")
 *   • ไม่มี topbar progress bar
 *   • ไม่มี sub-message
 *   • เหลือแค่ ring spinner + ข้อความเดียว
 *
 * สิ่งที่ยังคงไว้จาก v2.0:
 *   • ALWAYS-SHOW on every show() call (force-restart + pulse)
 *   • Session counter
 *   • MIN_VISIBLE_MS = 300ms (กัน flash บน cached loads)
 *   • RENDER-BEHIND-OVERLAY pattern (hideInstant รอ 1 rAF ให้ content paint ก่อน)
 *
 * Preserved from v1.7.2:
 *   • NO DELAY — overlay shows immediately on show() call
 *   • FORCE RESTART — show() while visible pulses the spinner
 *   • Direct forward to FVL
 *
 * @module loading
 * @depends {config.js, state.js, fvl.js (loaded separately)}
 */
(function (M) {
  'use strict';

  // ── Build ID (replaced at build time by scripts/update-version.js) ──────────
  var FV_BUILD_ID = '2.3.0-202609220313';

  /** คืน query string '?v=<buildId>' ถ้าไม่มี buildId คืน '' */
  function _v() { return FV_BUILD_ID ? '?v=' + FV_BUILD_ID : ''; }

  var DEFAULT_ID = 'fvl-default-fullscreen';

  // ── Z-index strategy ──────────────────────────────────────────────────────
  var NAV_BEHIND_Z = 15999;

  // ── Minimum visible time ──────────────────────────────────────────────────
  var MIN_VISIBLE_MS = 300;

  // ── Single loading message (localized) ─────────────────────────────────────
  var LOADING_MESSAGE = Object.freeze({
    en: 'Loading…',
    th: 'กำลังโหลด…',
  });

  // ── FVL availability check ────────────────────────────────────────────────
  function _fvl() {
    return (typeof window !== 'undefined') ? window.FVL : null;
  }

  function _ensureFVL() {
    if (window.FVL) return true;
    try {
      var scripts = document.querySelectorAll('script[src]');
      var base = null;
      for (var i = 0; i < scripts.length; i++) {
        var src = (scripts[i].getAttribute('src') || '').split('?')[0];
        if (/\/nav-core-modules\/loading\.js$/.test(src)) {
          base = src.replace('/nav-core-modules/loading.js', '');
          break;
        }
      }
      if (!base) return false;
      var s = document.createElement('script');
      s.src = base + '/loading-system/fvl.js' + _v();
      s.async = false;
      document.head.appendChild(s);
      return true;
    } catch (_) { return false; }
  }

  /**
   * Get the localized loading message.
   * @returns {string}
   */
  function _loadingMessage() {
    var lang = 'en';
    try {
      lang = localStorage.getItem('selectedLang') || 'en';
    } catch (_) {}
    return LOADING_MESSAGE[lang] || LOADING_MESSAGE.en;
  }

  // ── LoadingService ────────────────────────────────────────────────────────

  var LoadingService = {

    /** Content container ID — read by ContentService (kept for compat) */
    LOADING_CONTAINER_ID: 'content-loading',

    /** @type {HTMLElement|null} cached overlay element reference */
    _el: null,

    /** Navigation session counter — show() increments, hide() decrements */
    _sessionCount: 0,

    /** Last options passed to show() — used to update message if overlay already visible */
    _lastOpts: null,

    /** Whether a pulse animation is in progress (prevents overlapping pulses) */
    _pulseInProgress: false,

    /** Timestamp when overlay last became visible (used for MIN_VISIBLE_MS) */
    _visibleSince: 0,

    /** Pending hide timer (set when hide() arrives too soon after show) */
    _pendingHideTimer: null,

    /**
     * Initialize. Idempotent.
     */
    init: function () {
      _ensureFVL();
      var fvl = _fvl();
      if (fvl) {
        try { fvl.modules(); } catch (_) {}
      }
    },

    // ── Phase API (kept for back-compat but no-op visually) ─────────────────
    setPhase: function (phase, customMsg) {
      this._currentPhase = phase || 'initializing';
    },

    /** Internal phase state (kept for debugging) */
    _currentPhase: 'initializing',

    /**
     * Show the loading overlay (open a navigation session).
     * Supports both fullscreen navigation and content-scoped action loading.
     *
     * @param {LoadingOptions} [opts]
     */
    show: function (opts) {
      _ensureFVL();
      var fvl = _fvl();

      // Open a new session
      this._sessionCount++;

      var o = (typeof opts === 'string') ? { message: opts } : (opts || {});
      // Map to typed v2 loading API
      if (!o.type) {
        if (o.fullscreen || o.mode === 'fullscreen') {
          o.type = 'global';
        } else if (o.mode === 'boundary' || o.mode === 'scoped' || o.mode === 'page') {
          o.type = (o.target === '#content-loading' || !o.target) ? 'page' : 'content';
        } else if (o.mode === 'inline' || o.mode === 'component') {
          o.type = 'component';
        } else {
          o.type = 'page';
        }
      }
      if (o.type === 'page' && !o.target) {
        o.target = '#content-loading';
      }

      // If an inline boot loader (#fv-boot-loader) or early overlay (#nc-early-overlay) is currently visible,
      // adopt it ONLY when requested type is 'global'. Contextual page/content actions render in-flow.
      var bootEl = document.getElementById('fv-boot-loader') || document.getElementById('nc-early-overlay');
      var isBootVisible = bootEl && !bootEl.classList.contains('fv-boot-hidden') && (typeof window.getComputedStyle !== 'function' || window.getComputedStyle(bootEl).display !== 'none');

      if (isBootVisible && o.type === 'global') {
        this._visibleSince = Date.now();
        this._el = bootEl;
        var self = this;
        return {
          id: DEFAULT_ID,
          mode: 'global',
          type: 'global',
          element: bootEl,
          hide: function () { return self.readinessHandshake(); },
          update: function () {},
          setMessage: function () {},
          setProgress: function () {},
          getState: function () { return 'showing'; },
          on: function () { return function () {}; }
        };
      }

      if (!fvl) {
        console.warn('[LoadingService] FVL not available, cannot show');
        return;
      }

      if (o.type === 'global') {
        o.id = o.id || DEFAULT_ID;
        if (o.zIndex == null) o.zIndex = NAV_BEHIND_Z;
        o.lockScroll = o.lockScroll !== false; // default true
      } else if (o.type === 'page') {
        if (!o.id) {
          var targetStr = typeof o.target === 'string' ? o.target.replace(/[^a-zA-Z0-9_-]/g, '') : 'content-loading';
          o.id = 'fvl-page-' + (targetStr || 'content-loading');
        }
        o.lockScroll = false;
      } else if (o.type === 'content') {
        if (!o.id) {
          var targetStr = typeof o.target === 'string' ? o.target.replace(/[^a-zA-Z0-9_-]/g, '') : 'section';
          o.id = 'fvl-content-' + (targetStr || 'section');
        }
        o.lockScroll = false;
      } else {
        if (!o.id) {
          var targetStr = typeof o.target === 'string' ? o.target.replace(/[^a-zA-Z0-9_-]/g, '') : 'micro';
          o.id = 'fvl-component-' + (targetStr || 'micro');
        }
        o.lockScroll = false;
      }
      o.instant = o.instant !== false; // default true
      o.message = o.message || _loadingMessage();

      this._lastOpts = o;

      var targetId = o.id || DEFAULT_ID;
      var wasActive = fvl.isActive(targetId);

      var handle = fvl.show(o);
      if (handle) {
        this._el = handle.element;
        this._visibleSince = Date.now();
      }

      if (wasActive && o.mode === 'fullscreen') {
        this._pulse();
      }

      return handle;
    },

    /**
     * Pulse the overlay: briefly dip opacity + restart spinner animation.
     */
    _pulse: function () {
      if (this._pulseInProgress) return;
      if (!this._el) return;

      var el = this._el;
      this._pulseInProgress = true;

      el.classList.add('fvl-pulse');

      var arc = el.querySelector('.fvl-arc');
      if (arc) {
        var clone = arc.cloneNode(true);
        arc.parentNode.replaceChild(clone, arc);
      }

      var self = this;
      setTimeout(function() {
        el.classList.remove('fvl-pulse');
        self._pulseInProgress = false;
      }, 350);
    },

    /**
     * Readiness Handshake — cleans up boot elements and hides FVL fullscreen overlay in single phase.
     */
    readinessHandshake: function (opts) {
      this._sessionCount = 0;
      var fvl = _fvl();
      if (fvl && typeof fvl.readinessHandshake === 'function') {
        return fvl.readinessHandshake(opts);
      }
      try {
        if (typeof window.__removeBootLoader === 'function') {
          window.__removeBootLoader();
        } else {
          var bl = document.getElementById('fv-boot-loader');
          if (bl && bl.parentNode) bl.parentNode.removeChild(bl);
        }
        var eo = document.getElementById('nc-early-overlay');
        if (eo && eo.parentNode) eo.parentNode.removeChild(eo);
      } catch (_) {}
      return Promise.resolve({ success: true, timestamp: Date.now() });
    },

    /**
     * Hide the loading overlay (close one navigation session).
     * @param {string} [id] Optional instance ID
     * @returns {Promise<void>}
     */
    hide: function (id) {
      if (this._sessionCount > 0) this._sessionCount--;

      var targetId = (typeof id === 'string') ? id : DEFAULT_ID;

      if (this._sessionCount > 0 && targetId === DEFAULT_ID) {
        return Promise.resolve();
      }

      if ((document.getElementById('fv-boot-loader') || document.getElementById('nc-early-overlay')) && targetId === DEFAULT_ID) {
        return this.readinessHandshake();
      }

      var elapsed = Date.now() - this._visibleSince;
      if (this._visibleSince > 0 && elapsed < MIN_VISIBLE_MS && targetId === DEFAULT_ID) {
        var self = this;
        if (this._pendingHideTimer) clearTimeout(this._pendingHideTimer);
        return new Promise(function(resolve) {
          self._pendingHideTimer = setTimeout(function() {
            self._pendingHideTimer = null;
            var fvl = _fvl();
            if (fvl) {
              fvl.hide(DEFAULT_ID).then(function() {
                self._hideScopedInstances(fvl);
                resolve();
              }).catch(function() { resolve(); });
            } else {
              resolve();
            }
          }, MIN_VISIBLE_MS - elapsed);
        });
      }

      var fvl = _fvl();
      if (!fvl) return Promise.resolve();
      var hidePromise = fvl.hide(targetId);
      if (targetId === DEFAULT_ID) {
        this._hideScopedInstances(fvl);
      }
      return hidePromise || Promise.resolve();
    },

    _hideScopedInstances: function (fvl) {
      if (!fvl) fvl = _fvl();
      if (!fvl) return;
      try {
        ['scoped', 'boundary', 'page', 'content', 'component'].forEach(function(m) {
          var insts = typeof fvl.getByMode === 'function' ? fvl.getByMode(m) : [];
          if (Array.isArray(insts)) {
            insts.forEach(function(inst) {
              if (inst && inst.id) fvl.hide(inst.id);
            });
          }
        });
      } catch (_) {}
    },

    _hideScopedInstancesInstant: function (fvl) {
      if (!fvl) fvl = _fvl();
      if (!fvl) return;
      try {
        ['scoped', 'boundary', 'page', 'content', 'component'].forEach(function(m) {
          var insts = typeof fvl.getByMode === 'function' ? fvl.getByMode(m) : [];
          if (Array.isArray(insts)) {
            insts.forEach(function(inst) {
              if (inst && inst.id) fvl.hideInstant(inst.id);
            });
          }
        });
      } catch (_) {}
    },

    /** @param {string|null} [msg] */
    updateMessage: function (msg) {
      var fvl = _fvl();
      if (!fvl) return;
      fvl.update(DEFAULT_ID, { message: msg || _loadingMessage() });
    },

    /**
     * Check if loading is active.
     * @param {string} [id]
     * @returns {boolean}
     */
    isShown: function (id) {
      var targetId = (typeof id === 'string') ? id : DEFAULT_ID;
      if (targetId === DEFAULT_ID && this._sessionCount > 0) return true;
      var fvl = _fvl();
      if (!fvl) return false;
      return fvl.isActive(targetId);
    },

    /** @returns {typeof LOADING_MESSAGE} */
    getMessages: function () {
      var fvl = _fvl();
      if (fvl) return fvl.config().MESSAGES;
      return LOADING_MESSAGE;
    },

    // ── Internal aliases (called by Nav-Core router/init) ──────────────────
    _updateTopVar: function () {
      var fvl = _fvl();
      if (fvl && typeof fvl.updateTopVar === 'function') fvl.updateTopVar();
    },

    _setTexts: function () {
      var fvl = _fvl();
      if (fvl) fvl.modules().Engine._setTexts(DEFAULT_ID);
    },

    _getEl: function () {
      var fvl = _fvl();
      if (!fvl) return this._el;
      var handle = fvl.get(DEFAULT_ID);
      return handle ? handle.element : this._el;
    },

    /**
     * Hide loading instantly — no fade-out animation.
     * @param {string} [id]
     * @returns {Promise<void>}
     */
    hideInstant: function (id) {
      this._sessionCount = 0;
      if (this._pendingHideTimer) {
        clearTimeout(this._pendingHideTimer);
        this._pendingHideTimer = null;
      }
      var fvl = _fvl();
      if (!fvl) return Promise.resolve();
      var targetId = (typeof id === 'string') ? id : DEFAULT_ID;
      fvl.hideInstant(targetId);
      if (targetId === DEFAULT_ID) {
        this._hideScopedInstancesInstant(fvl);
      }
      return Promise.resolve();
    },

    showInContent: function (opts) {
      var o = (typeof opts === 'string') ? { message: opts } : (opts || {});
      o.type = o.type || 'page';
      o.target = o.target || '#content-loading';
      return this.show(o);
    },

    hideFromContent: function (id) {
      return this.hide(id || 'fvl-page-content-loading');
    },

    // ── Emergency reset ───────────────────────────────────────────────────
    _forceReset: function () {
      this._sessionCount = 0;
      this._pulseInProgress = false;
      this._visibleSince = 0;
      this._currentPhase = 'initializing';
      if (this._pendingHideTimer) {
        clearTimeout(this._pendingHideTimer);
        this._pendingHideTimer = null;
      }
      if (this._el && this._el.id !== 'fv-boot-loader' && this._el.id !== 'nc-early-overlay') {
        try {
          if (this._el.parentNode) this._el.parentNode.removeChild(this._el);
        } catch (_) {}
        this._el = null;
      }
      var fvl = _fvl();
      if (fvl) {
        if (typeof fvl.clearAllBoundaryRefs === 'function') {
          fvl.clearAllBoundaryRefs();
        }
        fvl.hideInstant(DEFAULT_ID);
        this._hideScopedInstancesInstant(fvl);
      }
    },

    /** Get current phase. */
    getCurrentPhase: function () {
      return this._currentPhase;
    }
  };

  // ── Auto-init ──────────────────────────────────────────────────────────────

  function _autoInit() { LoadingService.init(); }
  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', _autoInit, { once: true });
  else
    _autoInit();

  // ── Export into NavCoreModules namespace ──────────────────────────────────

  M.LoadingService = LoadingService;

  // ── Global convenience aliases (kept for back-compat with external scripts) ──
  try {
    if (!window._navCore_contentLoadingManager)
      window._navCore_contentLoadingManager = LoadingService;
    if (!window._headerV2_contentLoadingManager)
      window._headerV2_contentLoadingManager = LoadingService;
    if (!window.showInstantLoadingOverlay)
      window.showInstantLoadingOverlay = function (opts) { return LoadingService.show(opts); };
    if (!window.removeInstantLoadingOverlay)
      window.removeInstantLoadingOverlay = function (id) { return LoadingService.hide(id); };
    if (!window.__removeInstantLoadingOverlay)
      window.__removeInstantLoadingOverlay = function (id) { return LoadingService.hide(id); };
  } catch (_) {}

})(window.NavCoreModules = window.NavCoreModules || {});

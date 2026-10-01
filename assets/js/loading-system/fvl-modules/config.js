// Path:    assets/js/loading-system/fvl-modules/config.js
// Purpose: Configuration constants and presets for FVL loading system.

(function(window) {
  'use strict';

  var M = window.FVLModules = window.FVLModules || {};

  var VERSION = '1.0.0';

  var CONFIG = Object.freeze({
    VERSION: VERSION,

    // ── Z-index layers (one per mode, separated by 100 for safety) ──
    Z_INDEX: Object.freeze({
      topbar:     17500,
      fullscreen: 17000, // matches --fv-z-fullscreen-overlay (17000)
      scoped:     1600,  // matches --fv-z-scoped-overlay (1600)
      inline:     0,     // inline participates in normal flow
    }),

    // ── Animation timing (ms) ──
    TIMING: Object.freeze({
      ENTER: 140,    // fade-in duration
      LEAVE: 180,    // fade-out duration
      SPIN: 800,     // spinner rotation period
      TOPBAR_INDETERMINATE_CYCLE: 1200, // topbar back-and-forth cycle
    }),

    // ── Default spinner sizes per mode (px) ──
    SIZES: Object.freeze({
      fullscreen: 68,
      scoped: 40,
      inline: 18,
      topbar: 0, // N/A
    }),

    // ── Scoped-mode empty-target fallback ──
    // WHY: scoped overlay is absolutely positioned inside its target. If the
    //   target is emptied while loading (route swap: content cleared -> fetch),
    //   its height collapses to 0 and the spinner disappears with it, leaving
    //   the user staring at a blank content area. When the target is shorter
    //   than this threshold we hold a min-height on the target while shown so
    //   the spinner stays visible; original value restored on hide.
    SCOPED_EMPTY_MIN_HEIGHT: Object.freeze({
      THRESHOLD_PX: 240, // apply fallback only when target is shorter than this
      MIN_HEIGHT: '60vh',
    }),

    // ── DOM tokens ──
    DOM: Object.freeze({
      ROOT_CLASS: 'fvl',
      DATA_ATTR: 'data-fvl-id',
      DATA_MODE: 'data-fvl-mode',
      DEFAULT_FULLSCREEN_ID: 'fvl-default-fullscreen', // singleton for back-compat
      CSS_PATH: '/assets/css/loading-system.css',
    }),

    // ── i18n fallback messages ──
    // To add a new language: add a key here — no other changes needed.
    MESSAGES: Object.freeze({
      en: Object.freeze({ loading: 'Loading...' }),
      th: Object.freeze({ loading: 'กำลังโหลด...' }),
      ja: Object.freeze({ loading: '読み込み中...' }),
      zh: Object.freeze({ loading: '加载中...' }),
    }),

    // ── Language key in localStorage ──
    LANG_KEY: 'selectedLang',

    // ── Mode presets — defaults applied per mode ──
    PRESETS: Object.freeze({
      fullscreen: Object.freeze({
        overlay: true,
        lockScroll: false,
        theme: 'light',
        visual: 'ring',
      }),
      scoped: Object.freeze({
        overlay: true,
        theme: 'auto',
        visual: 'ring',
      }),
      inline: Object.freeze({
        overlay: false,
        theme: 'auto',
        visual: 'ring',
        replaceContent: false,
      }),
      topbar: Object.freeze({
        overlay: false,
        theme: 'brand',
        visual: 'ring', // unused but kept for consistency
      }),
    }),
  });

  M.VERSION = VERSION;
  M.CONFIG = CONFIG;
})(typeof window !== 'undefined' ? window : globalThis);

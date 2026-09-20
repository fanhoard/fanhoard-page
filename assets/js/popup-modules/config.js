// Path:    assets/js/popup-modules/config.js
// Purpose: All compile-time constants for the Popup System.
//          Preset definitions, animation timings, DOM tokens, z-index layers.
// Used by: Every popup module

(function(M) {
  'use strict';

  // ── Z-Index Layers ─────────────────────────────────────────────────────────
  // Stackable popups increment within their layer. Correctly ordered hierarchy:
  // Tooltips (900) > Toasts (800) > Popovers (700) > Dialogs/Alerts (600) > Drawers/Sheets (500).

  const Z_INDEX = Object.freeze({
    TOOLTIP       : 900,
    POPOVER       : 700,
    TOAST         : 800,
    DRAWER        : 500,
    SHEET         : 500,
    DIALOG        : 600,
    ALERT_CONFIRM : 600,
    BLOCKING      : 600,
    FULLSCREEN    : 600,
    BASE_OFFSET   : 500,  // starting point for auto-stacking
    STACK_STEP    : 1,    // each stacked popup increments by this
  });

  // ── Animation timings (ms) ────────────────────────────────────────────────

  const TIMING = Object.freeze({
    ENTER_DURATION    : 260,
    EXIT_DURATION     : 200,
    OVERLAY_FADE_IN   : 200,
    OVERLAY_FADE_OUT  : 160,
    TOAST_ENTER       : 320,
    TOAST_EXIT        : 280,
    TOAST_DISPLAY     : 3000,
    DRAWER_ENTER      : 300,
    DRAWER_EXIT       : 250,
    SHEET_ENTER       : 340,
    SHEET_EXIT        : 260,
    FULLSCREEN_ENTER  : 300,
    FULLSCREEN_EXIT   : 240,
    RAF_DOUBLE_BUFFER : 16,   // 2 frames before starting animation
    DESTROY_CLEANUP   : 50,   // ms after animation to remove DOM
    AUTO_CLOSE_GRACE  : 200,  // prevent accidental auto-close on open
  });

  // ── Easing curves (CSS values) ─────────────────────────────────────────────

  const EASING = Object.freeze({
    EASE   : 'cubic-bezier(0.4, 0, 0.2, 1)',
    SPRING : 'cubic-bezier(0.2, 0.9, 0.2, 1)',
    BOUNCE : 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    LINEAR : 'linear',
    EXIT   : 'cubic-bezier(0.4, 0, 1, 1)',  // ease-in for exit (composed feel)
  });

  // ── Size definitions (CSS max-width values) ────────────────────────────────

  const SIZES = Object.freeze({
    xs   : '320px',
    sm   : '400px',
    md   : '540px',
    lg   : '720px',
    xl   : '900px',
    full : '100vw',
  });

  // ── DOM attribute & class tokens ───────────────────────────────────────────

  const DOM = Object.freeze({
    ROOT_ATTR        : 'data-fp-root',
    OVERLAY_ATTR     : 'data-fp-overlay',
    BODY_ATTR        : 'data-fp-body',
    HEADER_ATTR      : 'data-fp-header',
    FOOTER_ATTR      : 'data-fp-footer',
    CLOSE_BTN_ATTR   : 'data-fp-close',
    INSTANCE_ID_ATTR : 'data-fp-id',
    TRIGGER_ATTR     : 'data-fp-trigger',

    ROOT_CLASS       : 'fp-popup',
    OVERLAY_CLASS    : 'fp-overlay',
    OPEN_CLASS       : 'fp-is-open',
    CLOSING_CLASS    : 'fp-is-closing',
    ENTERING_CLASS   : 'fp-is-entering',
    VISIBLE_CLASS    : 'fp-is-visible',

    // Per-type classes
    CLASS_DIALOG     : 'fp-dialog',
    CLASS_ALERT      : 'fp-alert',
    CLASS_CONFIRM    : 'fp-confirm',
    CLASS_SHEET      : 'fp-sheet',
    CLASS_TOAST      : 'fp-toast',
    CLASS_DRAWER     : 'fp-drawer',
    CLASS_TOOLTIP    : 'fp-tooltip',
    CLASS_POPOVER    : 'fp-popover',
    CLASS_FULLSCREEN : 'fp-fullscreen',

    // Fullscreen sub-classes
    FS_NO_HEADER       : 'fp-fs-no-header',
    FS_LAYOUT_STRETCH  : 'fp-fs-stretch',

    // State classes
    CLASS_BLOCKING   : 'fp-blocking',
    CLASS_PERSISTENT : 'fp-persistent',
    CLASS_Glass      : 'fp-glass',
    CLASS_BORDERLESS : 'fp-borderless',

    // Size classes
    SIZE_PREFIX      : 'fp-size-',

    // Position classes
    POS_PREFIX       : 'fp-pos-',
    ANCHOR_CLASS     : 'fp-anchored',
  });

  // ── Preset configurations ──────────────────────────────────────────────────
  // Each preset defines the DEFAULT behavior. PopupSystem.open() options
  // override these per-instance.

  const PRESETS = Object.freeze({
    dialog: Object.freeze({
      type                    : 'dialog',
      defaultSize             : 'md',
      defaultPosition         : 'center',
      hasOverlay              : true,
      hasHeader               : true,
      hasFooter               : true,
      hasCloseButton          : true,
      defaultClosable         : true,
      defaultBlocking         : true,
      defaultLockScroll       : true,
      defaultFocusTrap        : true,
      defaultStackable        : true,
      defaultDismissOnOverlay : true,
      defaultDismissOnEscape  : true,
      enterAnimation          : 'fp-enter-center',
      exitAnimation           : 'fp-exit-center',
      defaultRole             : 'dialog',
      zIndexLayer             : Z_INDEX.DIALOG,
    }),

    alert: Object.freeze({
      type                    : 'alert',
      defaultSize             : 'sm',
      defaultPosition         : 'center',
      hasOverlay              : true,
      hasHeader               : true,
      hasFooter               : false,
      hasCloseButton          : false,
      defaultClosable         : false,
      defaultBlocking         : true,
      defaultLockScroll       : true,
      defaultFocusTrap        : true,
      defaultStackable        : false,
      defaultDismissOnOverlay : false,
      defaultDismissOnEscape  : false,
      enterAnimation          : 'fp-enter-center',
      exitAnimation           : 'fp-exit-center',
      defaultRole             : 'alertdialog',
      zIndexLayer             : Z_INDEX.ALERT_CONFIRM,
    }),

    confirm: Object.freeze({
      type                    : 'confirm',
      defaultSize             : 'sm',
      defaultPosition         : 'center',
      hasOverlay              : true,
      hasHeader               : true,
      hasFooter               : true,
      hasCloseButton          : true,
      defaultClosable         : true,
      defaultBlocking         : true,
      defaultLockScroll       : true,
      defaultFocusTrap        : true,
      defaultStackable        : false,
      defaultDismissOnOverlay : false,
      defaultDismissOnEscape  : true,
      enterAnimation          : 'fp-enter-center',
      exitAnimation           : 'fp-exit-center',
      defaultRole             : 'alertdialog',
      zIndexLayer             : Z_INDEX.ALERT_CONFIRM,
    }),

    sheet: Object.freeze({
      type                    : 'sheet',
      defaultSize             : 'md',
      defaultPosition         : 'bottom',
      hasOverlay              : true,
      hasHeader               : true,
      hasFooter               : false,
      hasCloseButton          : true,
      defaultClosable         : true,
      defaultBlocking         : false,
      defaultLockScroll       : true,
      defaultFocusTrap        : true,
      defaultStackable        : false,
      defaultDismissOnOverlay : true,
      defaultDismissOnEscape  : true,
      enterAnimation          : 'fp-enter-bottom',
      exitAnimation           : 'fp-exit-bottom',
      defaultRole             : 'dialog',
      zIndexLayer             : Z_INDEX.SHEET,
    }),

    toast: Object.freeze({
      type                    : 'toast',
      defaultSize             : 'md',
      defaultPosition         : 'bottom',
      hasOverlay              : false,
      hasHeader               : false,
      hasFooter               : false,
      hasCloseButton          : false,
      defaultClosable         : false,
      defaultBlocking         : false,
      defaultLockScroll       : false,
      defaultFocusTrap        : false,
      defaultStackable        : true,
      defaultDismissOnOverlay : false,
      defaultDismissOnEscape  : false,
      enterAnimation          : 'fp-enter-bottom',
      exitAnimation           : 'fp-exit-bottom',
      defaultRole             : 'status',
      zIndexLayer             : Z_INDEX.TOAST,
    }),

    drawer: Object.freeze({
      type                    : 'drawer',
      defaultSize             : 'sm',
      defaultPosition         : 'right',
      hasOverlay              : true,
      hasHeader               : true,
      hasFooter               : false,
      hasCloseButton          : true,
      defaultClosable         : true,
      defaultBlocking         : false,
      defaultLockScroll       : true,
      defaultFocusTrap        : true,
      defaultStackable        : false,
      defaultDismissOnOverlay : true,
      defaultDismissOnEscape  : true,
      enterAnimation          : 'fp-enter-right',
      exitAnimation           : 'fp-exit-right',
      defaultRole             : 'dialog',
      zIndexLayer             : Z_INDEX.DRAWER,
    }),

    tooltip: Object.freeze({
      type                    : 'tooltip',
      defaultSize             : 'xs',
      defaultPosition         : 'top',
      hasOverlay              : false,
      hasHeader               : false,
      hasFooter               : false,
      hasCloseButton          : false,
      defaultClosable         : false,
      defaultBlocking         : false,
      defaultLockScroll       : false,
      defaultFocusTrap        : false,
      defaultStackable        : true,
      defaultDismissOnOverlay : false,
      defaultDismissOnEscape  : false,
      enterAnimation          : 'fp-enter-top',
      exitAnimation           : 'fp-exit-top',
      defaultRole             : 'tooltip',
      zIndexLayer             : Z_INDEX.TOOLTIP,
    }),

    popover: Object.freeze({
      type                    : 'popover',
      defaultSize             : 'sm',
      defaultPosition         : 'bottom',
      hasOverlay              : false,
      hasHeader               : false,
      hasFooter               : false,
      hasCloseButton          : false,
      defaultClosable         : true,
      defaultBlocking         : false,
      defaultLockScroll       : false,
      defaultFocusTrap        : false,
      defaultStackable        : true,
      defaultDismissOnOverlay : true,
      defaultDismissOnEscape  : true,
      enterAnimation          : 'fp-enter-bottom',
      exitAnimation           : 'fp-exit-bottom',
      defaultRole             : 'dialog',
      zIndexLayer             : Z_INDEX.POPOVER,
    }),

    fullscreen: Object.freeze({
      type                    : 'fullscreen',
      defaultSize             : 'full',
      defaultPosition         : 'center',
      hasOverlay              : true,
      hasHeader               : true,
      hasFooter               : true,
      hasCloseButton          : true,
      defaultClosable         : true,
      defaultBlocking         : true,
      defaultLockScroll       : true,
      defaultFocusTrap        : true,
      defaultStackable        : false,
      defaultDismissOnOverlay : false,
      defaultDismissOnEscape  : true,
      enterAnimation          : 'fp-enter-center',
      exitAnimation           : 'fp-exit-center',
      defaultRole             : 'dialog',
      zIndexLayer             : Z_INDEX.FULLSCREEN,
    }),
  });

  // ── Default shadow styles per elevation level ──────────────────────────────
  const SHADOWS = Object.freeze({
    none   : 'none',
    sm     : 'none',
    md     : 'none',
    lg     : 'none',
    xl     : 'none',
  });

  // ── Queue settings ─────────────────────────────────────────────────────────
  const QUEUE = Object.freeze({
    MAX_CONCURRENT_TOASTS : 3,
    TOAST_GAP_PX          : 12,
  });

  // ── Accessibility defaults ────────────────────────────────────────────────
  const A11Y = Object.freeze({
    FOCUS_RING_COLOR : '#009688',
    FOCUS_RING_WIDTH : '2px',
  });

  // Export
  M.CONFIG = Object.freeze({
    Z_INDEX, TIMING, EASING, SIZES, DOM, PRESETS, SHADOWS, QUEUE, A11Y,
  });

})(window.PopupModules = window.PopupModules || {});

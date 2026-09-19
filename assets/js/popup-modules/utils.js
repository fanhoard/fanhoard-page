// Path:    assets/js/popup-modules/utils.js
// Purpose: Shared utility functions for the Popup System.
//          DOM helpers, option merging, HTML sanitization/escaping, ID generation.
// Used by: engine.js, renderer.js, overlay.js, a11y.js

(function(M) {
  'use strict';

  const { CONFIG } = M;

  // ── DOM helpers ─────────────────────────────────────────────────────────────

  const DOM = {
    /**
     * Create an element with optional id, className, and inline styles.
     * @param {string} tag
     * @param {string} [id]
     * @param {string} [className]
     * @param {Object} [styles] - camelCase CSS properties
     * @returns {HTMLElement}
     */
    create(tag, id, className, styles) {
      const el = document.createElement(tag);
      if (id) el.id = id;
      if (className) el.className = className;
      if (styles) Object.assign(el.style, styles);
      return el;
    },

    /**
     * Shortcut for querySelector.
     * @param {string} selector
     * @param {Element} [parent=document]
     * @returns {Element|null}
     */
    query(selector, parent) {
      return (parent || document).querySelector(selector);
    },

    /**
     * Shortcut for querySelectorAll → Array.
     * @param {string} selector
     * @param {Element} [parent=document]
     * @returns {Element[]}
     */
    queryAll(selector, parent) {
      return Array.from((parent || document).querySelectorAll(selector));
    },

    /**
     * Remove an element from its parent.
     * @param {Element|null} el
     */
    remove(el) {
      if (el && el.parentNode) el.parentNode.removeChild(el);
    },
  };

  // ── Sanitization & Escaping ──────────────────────────────────────────────────

  /**
   * Escape HTML special characters in a string.
   * @param {string} str
   * @returns {string}
   */
  function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, function(match) {
      switch (match) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#39;';
        default: return match;
      }
    });
  }

  /**
   * Sanitize an HTML string to prevent XSS attacks while allowing safe DOM markup.
   * Strips script tags, iframes, objects, embeds, style tags, event attributes (on*),
   * and dangerous URI schemes (javascript:, vbscript:, non-image data:).
   *
   * @param {string} html
   * @returns {string} Sanitized HTML string
   */
  function sanitizeHTML(html) {
    if (typeof html !== 'string') return '';
    if (!html.trim()) return '';

    if (typeof DOMParser === 'undefined') {
      return escapeHTML(html);
    }

    try {
      var parser = new DOMParser();
      var doc = parser.parseFromString(html, 'text/html');
      var body = doc.body;

      var FORBIDDEN_TAGS = [
        'SCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'STYLE', 'LINK',
        'META', 'BASE', 'FRAME', 'FRAMESET', 'APPLET',
      ];
      var SAFE_URI_REGEX = /^(?:https?|mailto|tel|blob|data:image\/(?:png|jpe?g|gif|svg\+xml|webp);base64,|\/|#|\.\/|\.\.\/)/i;

      function cleanNode(node) {
        var children = Array.from(node.childNodes);
        for (var i = 0; i < children.length; i++) {
          var child = children[i];
          if (child.nodeType === 1) { // ELEMENT_NODE
            var tagName = child.nodeName.toUpperCase();
            if (FORBIDDEN_TAGS.indexOf(tagName) !== -1) {
              child.remove();
              continue;
            }
            var attrs = Array.from(child.attributes);
            for (var j = 0; j < attrs.length; j++) {
              var attr = attrs[j];
              var name = attr.name.toLowerCase();
              var val = attr.value;
              if (name.startsWith('on')) {
                child.removeAttribute(attr.name);
                continue;
              }
              if ((name === 'href' || name === 'src' || name === 'action' || name === 'data') && val) {
                var trimmed = val.trim().toLowerCase();
                if (
                  trimmed.startsWith('javascript:') ||
                  trimmed.startsWith('vbscript:') ||
                  (trimmed.startsWith('data:') && !SAFE_URI_REGEX.test(trimmed))
                ) {
                  child.removeAttribute(attr.name);
                }
              }
            }
            cleanNode(child);
          } else if (child.nodeType === 8) { // COMMENT_NODE
            child.remove();
          }
        }
      }

      cleanNode(body);
      return body.innerHTML;
    } catch (_) {
      return escapeHTML(html);
    }
  }

  // ── Option merging ──────────────────────────────────────────────────────────

  /**
   * Deep-merge user options with a preset configuration.
   * User options ALWAYS win over preset defaults.
   *
   * @param {PopupOptions} userOpts
   * @param {PresetConfig}  preset
   * @returns {PopupOptions} Resolved options
   */
  function mergeOptions(userOpts, preset) {
    const o = Object.assign({}, userOpts);

    // Apply preset defaults for any missing values
    if (o.type === undefined) o.type = preset.type;
    if (o.size === undefined) o.size = preset.defaultSize;
    if (o.position === undefined) o.position = preset.defaultPosition;
    if (o.closable === undefined) o.closable = preset.defaultClosable;
    if (o.blocking === undefined) o.blocking = preset.defaultBlocking;
    if (o.lockScroll === undefined) o.lockScroll = preset.defaultLockScroll;
    if (o.focusTrap === undefined) o.focusTrap = preset.defaultFocusTrap;
    if (o.stackable === undefined) o.stackable = preset.defaultStackable;
    if (o.dismissOnOverlay === undefined) o.dismissOnOverlay = preset.defaultDismissOnOverlay;
    if (o.dismissOnEscape === undefined) o.dismissOnEscape = preset.defaultDismissOnEscape;
    if (o.enterAnimation === undefined) o.enterAnimation = preset.enterAnimation;
    if (o.exitAnimation === undefined) o.exitAnimation = preset.exitAnimation;
    if (o.role === undefined) o.role = preset.defaultRole;

    // Persistent overrides closable, dismissOnOverlay, dismissOnEscape
    if (o.persistent) {
      o.closable = false;
      o.dismissOnOverlay = false;
      o.dismissOnEscape = false;
    }

    // Blocking overrides stackable
    if (o.blocking) {
      o.stackable = false;
    }

    // Resolve language
    o.lang = o.lang ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('selectedLang')) ||
      'en';

    // Easing resolution
    const easingMap = { ease: CONFIG.EASING.EASE, spring: CONFIG.EASING.SPRING, bounce: CONFIG.EASING.BOUNCE, linear: CONFIG.EASING.LINEAR };
    o._easing = easingMap[o.easing] || CONFIG.EASING.EASE;

    // Shadow resolution
    o._shadow = CONFIG.SHADOWS[o.shadow] || CONFIG.SHADOWS.md;

    // Animation duration
    o._enterDuration = o.animationDuration ||
      (o.type === 'fullscreen' ? CONFIG.TIMING.FULLSCREEN_ENTER : CONFIG.TIMING.ENTER_DURATION);
    o._exitDuration = o.animationDuration ||
      (o.type === 'fullscreen' ? CONFIG.TIMING.FULLSCREEN_EXIT : CONFIG.TIMING.EXIT_DURATION);

    return o;
  }

  /**
   * Generate z-index for a new popup based on its layer and stack position.
   * @param {number} baseZ - From preset's zIndexLayer
   * @param {number} stackPosition - 0-based position in the stack
   * @returns {number}
   */
  function resolveZIndex(baseZ, stackPosition) {
    return baseZ + (stackPosition * CONFIG.Z_INDEX.STACK_STEP);
  }

  /**
   * Get the preset config for a given type, with fallback to 'dialog'.
   * @param {PopupPreset} type
   * @returns {PresetConfig}
   */
  function getPreset(type) {
    return CONFIG.PRESETS[type] || CONFIG.PRESETS.dialog;
  }

  /**
   * Safe wrapper — runs fn, catches errors, returns fallback.
   * @param {Function} fn
   * @param {*} fallback
   * @returns {*}
   */
  function safe(fn, fallback) {
    try { return fn(); } catch (_) { return fallback; }
  }

  /**
   * Check if the current device likely prefers reduced motion.
   * @returns {boolean}
   */
  function prefersReducedMotion() {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;
  }

  M.Utils = Object.freeze({
    DOM, escapeHTML, sanitizeHTML, mergeOptions, resolveZIndex, getPreset, safe, prefersReducedMotion,
  });

})(window.PopupModules = window.PopupModules || {});
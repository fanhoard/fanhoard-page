// Path:    assets/js/popup-modules/a11y.js
// Purpose: Accessibility management for popup instances.
//          Handles focus trapping, auto-focus, return-focus,
//          and ARIA live regions.
// Used by: engine.js

(function(M) {
  'use strict';

  const { CONFIG, Utils } = M;

  var DEFAULT_FOCUS_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  /**
   * Helper to query visible focusable elements within a root container.
   * @param {HTMLElement} container
   * @returns {HTMLElement[]}
   */
  function getFocusableElements(container) {
    if (!container) return [];
    var selector = (CONFIG.A11Y && CONFIG.A11Y.AUTO_FOCUS_SELECTOR) || DEFAULT_FOCUS_SELECTOR;
    var raw = container.querySelectorAll(selector);
    var result = [];
    for (var i = 0; i < raw.length; i++) {
      var el = raw[i];
      if (el.disabled || el.getAttribute('tabindex') === '-1') continue;
      var style = window.getComputedStyle ? window.getComputedStyle(el) : null;
      if (style && (style.display === 'none' || style.visibility === 'hidden')) continue;
      var rects = el.getClientRects ? el.getClientRects() : [];
      if (rects.length > 0 || el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement) {
        result.push(el);
      }
    }
    return result;
  }

  // ── Focus trap ─────────────────────────────────────────────────────────────

  /**
   * Install a focus trap inside the popup root element.
   * Tab and Shift+Tab cycle through focusable elements within the popup.
   *
   * @param {string} instanceId - For tagging the handler
   * @param {HTMLElement} rootEl - The popup root
   * @returns {Function} Cleanup function
   */
  var _activeTraps = new Map();

  function installFocusTrap(instanceId, rootEl) {
    if (instanceId && _activeTraps.has(instanceId)) {
      try { _activeTraps.get(instanceId)(); } catch (_) {}
      _activeTraps.delete(instanceId);
    }
    var handler = function(e) {
      if (e.key !== 'Tab') return;

      var focusable = getFocusableElements(rootEl);
      if (focusable.length === 0) {
        // If no focusable elements, prevent tab from escaping and keep focus on root
        e.preventDefault();
        try { rootEl.focus({ preventScroll: true }); } catch (_) {}
        return;
      }

      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      // If active focus is outside rootEl, wrap focus inside
      if (!rootEl.contains(document.activeElement)) {
        e.preventDefault();
        if (e.shiftKey) {
          last.focus();
        } else {
          first.focus();
        }
        return;
      }

      if (e.shiftKey) {
        // Shift+Tab: if focus is on first element, wrap to last
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: if focus is on last element, wrap to first
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    handler._instanceId = instanceId;

    document.addEventListener('keydown', handler, false);

    var cleanup = function() {
      document.removeEventListener('keydown', handler, false);
      if (instanceId) _activeTraps.delete(instanceId);
    };
    if (instanceId) {
      _activeTraps.set(instanceId, cleanup);
    }

    return cleanup;
  }

  // ── Auto-focus ─────────────────────────────────────────────────────────────

  /**
   * Move focus to the first focusable element inside the popup body,
   * or the popup root itself if no focusable element exists.
   *
   * @param {HTMLElement} rootEl
   * @param {HTMLElement} bodyEl
   * @param {number} [delayMs]
   */
  function autoFocus(rootEl, bodyEl, delayMs) {
    var delay = delayMs !== undefined ? delayMs : (CONFIG.A11Y && CONFIG.A11Y.FOCUS_DELAY_MS) || 30;
    setTimeout(function() {
      if (!rootEl || !rootEl.isConnected) return;

      // Priority 1: element with autofocus attribute inside popup
      var autoFocusEl = rootEl.querySelector('[autofocus]');
      if (autoFocusEl) {
        try { autoFocusEl.focus({ preventScroll: true }); return; } catch(_) {}
      }

      // Priority 2: first focusable in body
      var focusables = getFocusableElements(bodyEl);
      if (focusables.length > 0) {
        try { focusables[0].focus({ preventScroll: true }); return; } catch(_) {}
      }

      // Priority 3: close button (if exists)
      var closeBtn = rootEl.querySelector('[data-fp-close]');
      if (closeBtn) {
        try { closeBtn.focus({ preventScroll: true }); return; } catch(_) {}
      }

      // Fallback: focus the root itself for screen readers
      if (!rootEl.hasAttribute('tabindex')) {
        rootEl.setAttribute('tabindex', '-1');
      }
      try { rootEl.focus({ preventScroll: true }); } catch(_) {}
    }, delay);
  }

  // ── Return focus ───────────────────────────────────────────────────────────

  /**
   * Return focus to the trigger element that opened the popup.
   *
   * @param {Element|null} triggerEl
   */
  function returnFocus(triggerEl) {
    if (!triggerEl) return;
    setTimeout(function() {
      try {
        // Only focus if the trigger is still in the DOM and visible
        if (triggerEl.isConnected && (triggerEl.offsetParent !== null || triggerEl.offsetWidth > 0)) {
          triggerEl.focus({ preventScroll: true });
        }
      } catch(_) {}
    }, 16); // next frame
  }

  // ── ARIA management ─────────────────────────────────────────────────────────

  /**
   * Hide all other content from screen readers when a blocking popup is open.
   * Sets aria-hidden on sibling elements.
   *
   * @param {boolean} isOpen
   * @param {HTMLElement} [popupRootEl]
   */
  function manageInertSiblings(isOpen, popupRootEl) {
    if (!isOpen) {
      // Restore: remove aria-hidden from everything we hid
      var hiddenEls = document.querySelectorAll('[data-fp-aria-hidden]');
      hiddenEls.forEach(function(el) {
        el.removeAttribute('aria-hidden');
        el.removeAttribute('data-fp-aria-hidden');
        el.removeAttribute('inert');
      });
      return;
    }

    // Hide all top-level body children except the popup and its overlay
    var children = document.body.children;
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (child === popupRootEl) continue;
      // Skip overlay elements
      if (child.hasAttribute && child.hasAttribute('data-fp-overlay')) continue;
      // Skip script, style, link, meta tags
      var tag = (child.tagName || '').toLowerCase();
      if (tag === 'script' || tag === 'style' || tag === 'link' || tag === 'meta') continue;

      child.setAttribute('aria-hidden', 'true');
      child.setAttribute('data-fp-aria-hidden', 'true');
      if ('inert' in HTMLElement.prototype) {
        child.inert = true;
      }
    }
  }

  M.A11yService = Object.freeze({
    installFocusTrap, autoFocus, returnFocus, manageInertSiblings, getFocusableElements,
  });

})(window.PopupModules = window.PopupModules || {});

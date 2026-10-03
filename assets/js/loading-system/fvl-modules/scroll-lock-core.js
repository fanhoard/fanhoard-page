// Path:    assets/js/loading-system/fvl-modules/scroll-lock-core.js
// Purpose: ScrollLockCore — THE single scroll-lock authority for every
//          screen-covering overlay system on the site (FVL loading,
//          PopupSystem, Search overlay, and future overlays).
//
// WHY THIS FILE EXISTS:
//   Each overlay system used to carry its own scroll-lock implementation
//   (FVL utils.js, popup state.js, search overlay.js). Three independent
//   reference counts meant one system's close could reset body/html styles
//   and destroy another system's still-open lock (stacked overlays = page
//   scrollable behind a full-screen overlay). This core is the ONE source
//   of truth: one ref-count, owner tags, effective-DOM observable state.
//
// LOADED BY:
//   - fvl.js        (LOAD_PHASES phase 0, before utils.js)
//   - popup.js      (ensureScrollLockCore — pages without FVL)
//   - search.js     (ensureScrollLockCore — pages without FVL)
//   Idempotent: safe to load multiple times.
//
// EFFECTIVE STATE OBSERVABILITY:
//   While locked, <html data-scroll-locked="true"> is set. E2E tests and
//   real-browser debugging verify THIS attribute, not internal flags.
//
// API (frozen):
//   lock(owner?)          — acquire one reference (owner tag for diagnostics)
//   unlock(owner?)        — release one reference; DOM restored at zero
//   releaseAll(owner)     — force-release every reference held by owner
//   getLockCount()        — total live references
//   getState()            — { locked, count, owners, savedScrollY }
//   allowScrollIn(sel)    — register a scrollable-inside-overlay selector
//   reset()               — hard teardown (tests only)
(function (window) {
  'use strict';

  if (window && window.ScrollLockCore) return;

// ── ScrollLockManager ──
var ScrollLockManager = (function() {
  var lockCount = 0;
  var ownerCounts = {};
  var extraScrollSelectors = [];
  var savedScrollY = 0;
  var origBodyStyle = null;
  var origHtmlStyle = null;
  var touchMoveHandler = null;
  var wheelHandler = null;
  var keydownHandler = null;

  function _isScrollableTarget(t) {
    if (!t || !t.closest) return false;
    if (t.closest(".fvl-scrollable")) return true;
    for (var i = 0; i < extraScrollSelectors.length; i++) {
      try { if (t.closest(extraScrollSelectors[i])) return true; } catch (_) {}
    }
    return false;
  }

  function _setAttr(locked) {
    try {
      var doc = (typeof window !== "undefined" && window.document) || document;
    // Restore the DOM too — a hard reset that leaves body position:fixed
    // would strand the page visually pinned (pinned by unit contract test).
    if (doc && doc.body && origBodyStyle) {
      var b = doc.body;
      b.style.position = origBodyStyle.position;
      b.style.top = origBodyStyle.top;
      b.style.width = origBodyStyle.width;
      b.style.overflow = origBodyStyle.overflow;
      b.style.paddingRight = origBodyStyle.paddingRight;
      b.style.overscrollBehavior = origBodyStyle.overscrollBehavior;
      if (!origBodyStyle.hasStyleAttr && b.getAttribute("style") === "") {
        b.removeAttribute("style");
      }
    }
    if (doc && doc.documentElement && origHtmlStyle) {
      var h = doc.documentElement;
      h.style.overflow = origHtmlStyle.overflow;
      h.style.overscrollBehavior = origHtmlStyle.overscrollBehavior;
      h.style.removeProperty("--fvl-scrollbar-width");
      if (!origHtmlStyle.hasStyleAttr && h.getAttribute("style") === "") {
        h.removeAttribute("style");
      }
    }
      var html = doc && doc.documentElement;
      if (!html) return;
      if (locked) html.setAttribute("data-scroll-locked", "true");
      else html.removeAttribute("data-scroll-locked");
    } catch (_) {}
  }

  function lock(owner) {
    var doc = (typeof window !== "undefined" && window.document) || document;
    if (!doc || !doc.body) {
      lockCount++;
      return;
    }

    if (owner) ownerCounts[owner] = (ownerCounts[owner] || 0) + 1;

    if (lockCount === 0) {
      var win = typeof window !== "undefined" ? window : {};
      _setAttr(true);
      var scrollbarWidth = Math.max(0, (win.innerWidth || 0) - (doc.documentElement ? doc.documentElement.clientWidth : (win.innerWidth || 0)));
      savedScrollY = win.scrollY || win.pageYOffset || (doc.documentElement && doc.documentElement.scrollTop) || (doc.body && doc.body.scrollTop) || 0;

      var body = doc.body;
      var html = doc.documentElement;

      origBodyStyle = {
        position: body.style.position || "",
        top: body.style.top || "",
        width: body.style.width || "",
        overflow: body.style.overflow || "",
        paddingRight: body.style.paddingRight || "",
        overscrollBehavior: body.style.overscrollBehavior || "",
        hasStyleAttr: body.hasAttribute("style"),
      };

      if (html) {
        origHtmlStyle = {
          overflow: html.style.overflow || "",
          overscrollBehavior: html.style.overscrollBehavior || "",
          hasStyleAttr: html.hasAttribute("style"),
        };
        html.style.overflow = "hidden";
        html.style.overscrollBehavior = "none";
      }

      body.style.position = "fixed";
      body.style.top = "-" + savedScrollY + "px";
      body.style.width = "100%";
      body.style.overflow = "hidden";
      body.style.overscrollBehavior = "none";

      if (scrollbarWidth > 0) {
        var computedPR = 0;
        try {
          var view = body.ownerDocument && body.ownerDocument.defaultView;
          if (view && typeof view.getComputedStyle === "function") {
            computedPR = parseFloat(view.getComputedStyle(body).paddingRight || "0") || 0;
          }
        } catch (_) {}
        body.style.paddingRight = (computedPR + scrollbarWidth) + "px";
      }

      if (html) {
        html.style.setProperty("--fvl-scrollbar-width", scrollbarWidth + "px");
      }

      if (!touchMoveHandler && doc.addEventListener) {
        touchMoveHandler = function(e) {
          if (_isScrollableTarget(e.target)) return;
          if (e.cancelable) e.preventDefault();
        };
        doc.addEventListener("touchmove", touchMoveHandler, { passive: false });
      }

      if (!wheelHandler && doc.addEventListener) {
        wheelHandler = function(e) {
          if (_isScrollableTarget(e.target)) return;
          if (e.cancelable) e.preventDefault();
        };
        doc.addEventListener("wheel", wheelHandler, { passive: false });
      }

      if (!keydownHandler && doc.addEventListener) {
        var SCROLL_KEYS = {
          32: 1, 33: 1, 34: 1, 35: 1, 36: 1, 37: 1, 38: 1, 39: 1, 40: 1,
          "Space": 1, "PageUp": 1, "PageDown": 1, "End": 1, "Home": 1,
          "ArrowUp": 1, "ArrowDown": 1, "ArrowLeft": 1, "ArrowRight": 1
        };
        keydownHandler = function(e) {
          var k = e.key || e.keyCode;
          if (SCROLL_KEYS[k]) {
            var tag = e.target && e.target.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target && e.target.isContentEditable)) return;
            if (_isScrollableTarget(e.target)) return;
            if (e.cancelable) e.preventDefault();
          }
        };
        doc.addEventListener("keydown", keydownHandler, { passive: false });
      }
    }

    lockCount++;
  }

  function unlock(owner) {
    if (owner && (ownerCounts[owner] || 0) > 0) {
      ownerCounts[owner]--;
      if (ownerCounts[owner] === 0) delete ownerCounts[owner];
    }
    if (lockCount <= 0) return;
    lockCount--;

    if (lockCount === 0) {
      _setAttr(false);
      var doc = (typeof window !== "undefined" && window.document) || document;
      var win = typeof window !== "undefined" ? window : {};

      if (doc && doc.body && origBodyStyle) {
        var body = doc.body;
        body.style.position = origBodyStyle.position;
        body.style.top = origBodyStyle.top;
        body.style.width = origBodyStyle.width;
        body.style.overflow = origBodyStyle.overflow;
        body.style.paddingRight = origBodyStyle.paddingRight;
        body.style.overscrollBehavior = origBodyStyle.overscrollBehavior;

        if (!origBodyStyle.hasStyleAttr && body.getAttribute("style") === "") {
          body.removeAttribute("style");
        }
        origBodyStyle = null;
      }

      if (doc && doc.documentElement && origHtmlStyle) {
        var html = doc.documentElement;
        html.style.overflow = origHtmlStyle.overflow;
        html.style.overscrollBehavior = origHtmlStyle.overscrollBehavior;
        html.style.removeProperty("--fvl-scrollbar-width");

        if (!origHtmlStyle.hasStyleAttr && html.getAttribute("style") === "") {
          html.removeAttribute("style");
        }
        origHtmlStyle = null;
      }

      if (win.scrollTo) {
        win.scrollTo(0, savedScrollY);
      }

      if (touchMoveHandler && doc && doc.removeEventListener) {
        doc.removeEventListener("touchmove", touchMoveHandler, { passive: false });
        touchMoveHandler = null;
      }

      if (wheelHandler && doc && doc.removeEventListener) {
        doc.removeEventListener("wheel", wheelHandler, { passive: false });
        wheelHandler = null;
      }

      if (keydownHandler && doc && doc.removeEventListener) {
        doc.removeEventListener("keydown", keydownHandler, { passive: false });
        keydownHandler = null;
      }
    }
  }

  function getLockCount() { return lockCount; }

  function getState() {
    return {
      locked: lockCount > 0,
      count: lockCount,
      owners: Object.keys(ownerCounts),
      savedScrollY: savedScrollY
    };
  }

  function allowScrollIn(selector) {
    if (typeof selector !== "string" || !selector) return;
    for (var i = 0; i < extraScrollSelectors.length; i++) {
      if (extraScrollSelectors[i] === selector) return;
    }
    extraScrollSelectors.push(selector);
  }

  // Remove ALL references held by one owner at once (e.g. system teardown)
  function releaseAll(owner) {
    if (!owner || !(ownerCounts[owner] > 0)) return;
    var n = ownerCounts[owner];
    delete ownerCounts[owner];
    for (var i = 0; i < n; i++) {
      unlock(null);
    }
  }

  function reset() {
    ownerCounts = {};
    _setAttr(false);
    var doc = (typeof window !== "undefined" && window.document) || document;
    // Restore the DOM too — a hard reset that leaves body position:fixed
    // would strand the page visually pinned (pinned by unit contract test).
    if (doc && doc.body && origBodyStyle) {
      var b = doc.body;
      b.style.position = origBodyStyle.position;
      b.style.top = origBodyStyle.top;
      b.style.width = origBodyStyle.width;
      b.style.overflow = origBodyStyle.overflow;
      b.style.paddingRight = origBodyStyle.paddingRight;
      b.style.overscrollBehavior = origBodyStyle.overscrollBehavior;
      if (!origBodyStyle.hasStyleAttr && b.getAttribute("style") === "") {
        b.removeAttribute("style");
      }
    }
    if (doc && doc.documentElement && origHtmlStyle) {
      var h = doc.documentElement;
      h.style.overflow = origHtmlStyle.overflow;
      h.style.overscrollBehavior = origHtmlStyle.overscrollBehavior;
      h.style.removeProperty("--fvl-scrollbar-width");
      if (!origHtmlStyle.hasStyleAttr && h.getAttribute("style") === "") {
        h.removeAttribute("style");
      }
    }
    if (touchMoveHandler && doc && doc.removeEventListener) {
      doc.removeEventListener("touchmove", touchMoveHandler, { passive: false });
    }
    if (wheelHandler && doc && doc.removeEventListener) {
      doc.removeEventListener("wheel", wheelHandler, { passive: false });
    }
    if (keydownHandler && doc && doc.removeEventListener) {
      doc.removeEventListener("keydown", keydownHandler, { passive: false });
    }
    lockCount = 0;
    savedScrollY = 0;
    origBodyStyle = null;
    origHtmlStyle = null;
    touchMoveHandler = null;
    wheelHandler = null;
    keydownHandler = null;
  }

  return Object.freeze({
    lock: lock,
    unlock: unlock,
    getLockCount: getLockCount,
    getState: getState,
    allowScrollIn: allowScrollIn,
    releaseAll: releaseAll,
    reset: reset,
  });
})();

// ── Global bridge: the ONE scroll-lock authority for every overlay system ──
// Popup/Search/Lang/Loading all lock through this single core so their
// reference counts can never destroy each other (stacked-overlay bug class).
// data-scroll-locked on <html> exposes the effective lock state in the DOM.
try {
  if (typeof window !== "undefined" && !window.ScrollLockCore) {
    window.ScrollLockCore = ScrollLockManager;
  }
} catch (_) {}

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));

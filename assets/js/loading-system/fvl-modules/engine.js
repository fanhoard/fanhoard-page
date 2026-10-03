// Path:    assets/js/loading-system/fvl-modules/engine.js
// Purpose: Core lifecycle engine, display manager, and handshake handler for FVL.

(function(window) {
  'use strict';

  var M = window.FVLModules = window.FVLModules || {};

  var Engine = (function() {

    function _setTexts(inst) {
      var opts = inst.options || {};
      if (opts.spinnerOnly || opts.bare) {
        if (inst.rootEl) {
          inst.rootEl.setAttribute('aria-label', opts.ariaLabel || opts.message || 'Loading');
        }
        return;
      }
      if (!inst.msgEl) return;
      var lang = M.Utils.detectLang(opts.lang);

      if (opts.message) {
        inst.msgEl.textContent = opts.message;
        if (inst.subEl) {
          inst.subEl.textContent = (lang !== 'en' && !opts.subMessage)
            ? M.Utils.getMessage('en', 'loading')
            : (opts.subMessage || '');
        }
        if (inst.rootEl) {
          var ariaText = inst.subEl && inst.subEl.textContent
            ? inst.msgEl.textContent + ' / ' + inst.subEl.textContent
            : inst.msgEl.textContent;
          inst.rootEl.setAttribute('aria-label', ariaText);
        }
      } else {
        var primary = M.Utils.getMessage(lang, 'loading');
        inst.msgEl.textContent = primary;
        if (inst.subEl) {
          inst.subEl.textContent = (lang !== 'en') ? M.Utils.getMessage('en', 'loading') : '';
        }
        if (inst.rootEl) {
          var ariaT = inst.subEl && inst.subEl.textContent
            ? primary + ' / ' + inst.subEl.textContent
            : primary;
          inst.rootEl.setAttribute('aria-label', ariaT);
        }
      }
    }

    var _topCache = 0;
    var _topDirty = true;
    var _topRO = null;

    function _ensureTopRO() {
      if (_topRO || typeof ResizeObserver === 'undefined') return;
      _topRO = new ResizeObserver(function() { _topDirty = true; });
      try {
        var doc = window.document || document;
        var h = doc.querySelector('header');
        var s = doc.getElementById('sub-nav');
        if (h) _topRO.observe(h);
        if (s) _topRO.observe(s);
      } catch (_) {}
    }

    function _updateTopVar() {
      try {
        if (!_topDirty) return;
        _topDirty = false;
        _ensureTopRO();
        var doc = window.document || document;
        var header = doc.querySelector('header');
        var subnav = doc.getElementById('sub-nav');
        var top = 0;
        if (header) top += header.offsetHeight;
        if (subnav && subnav.offsetHeight > 0) {
          top += subnav.offsetHeight;
        }
        _topCache = top;
        if (doc.documentElement) {
          doc.documentElement.style.setProperty('--fvl-top', top + 'px');
          doc.documentElement.style.setProperty('--clp-top', top + 'px');
        }
      } catch (_) {}
    }

    function _resolveTargetSlot(targetEl, slot) {
      if (!slot) return targetEl;
      if (typeof HTMLElement !== 'undefined' && slot instanceof HTMLElement) {
        return slot;
      }
      if (slot && slot.nodeType === 1) {
        return slot;
      }
      if (typeof slot === 'string' && targetEl && targetEl.querySelector) {
        var found = targetEl.querySelector(slot);
        if (found) return found;
      }
      var doc = (typeof window !== 'undefined' && window.document) || document;
      if (typeof slot === 'string' && doc && doc.querySelector) {
        var globalFound = doc.querySelector(slot);
        if (globalFound) return globalFound;
      }
      return targetEl;
    }

    function _attachScoped(inst) {
      var target = inst.targetEl;
      if (!target) {
        console.warn('[FVL] scoped mode requires a target');
        return false;
      }
      try {
        var view = target.ownerDocument && target.ownerDocument.defaultView;
        if (view && typeof view.getComputedStyle === 'function') {
          inst.origTargetPos = view.getComputedStyle(target).position;
        }
        if (inst.origTargetPos === 'static') {
          target.style.position = 'relative';
        }
      } catch (_) {}

      try {
        var fb = M.CONFIG.SCOPED_EMPTY_MIN_HEIGHT;
        if (fb && target.offsetHeight < fb.THRESHOLD_PX) {
          var holder = (M.State.getByMode('scoped') || []).find(function(other) {
            return other !== inst && other.targetEl === target
              && other._setScopedFallbackMinHeight
              && other.state !== 'hidden' && other.state !== 'destroyed';
          });
          if (holder) {
            inst.origTargetMinHeight = holder.origTargetMinHeight;
          } else {
            inst.origTargetMinHeight = target.style.minHeight;
            target.style.minHeight = fb.MIN_HEIGHT;
          }
          inst._setScopedFallbackMinHeight = true;
        }
      } catch (_) {}
      target.setAttribute('aria-busy', 'true');
      var mountSlot = _resolveTargetSlot(target, inst.options.targetSlot);
      mountSlot.appendChild(inst.rootEl);
      return true;
    }

    function _attachInline(inst) {
      var target = inst.targetEl;
      if (!target) {
        console.warn('[FVL] inline mode requires a target');
        return false;
      }
      target.setAttribute('aria-busy', 'true');
      var mountSlot = _resolveTargetSlot(target, inst.options.targetSlot);
      if (inst.options.replaceContent) {
        inst.origTargetHTML = mountSlot.innerHTML;
        mountSlot.textContent = '';
        mountSlot.appendChild(inst.rootEl);
      } else {
        mountSlot.insertBefore(inst.rootEl, mountSlot.firstChild);
      }
      return true;
    }

    var _ro = null;
    function _ensureResizeObserver() {
      if (_ro || typeof ResizeObserver === 'undefined') return;
      _ro = new ResizeObserver(function() { _updateTopVar(); });
      try {
        var doc = window.document || document;
        var header = doc.querySelector('header');
        var subnav = doc.getElementById('sub-nav');
        if (header) _ro.observe(header);
        if (subnav) _ro.observe(subnav);
      } catch (_) {}
    }

    
    function _shouldLockScroll(inst) {
      var opts = inst.options || {};
      if (opts.lockScroll === false) return false;
      if (opts.lockScroll === true) return true;
      if (inst.mode === "fullscreen") return true;
      if (inst.mode === "scoped" && inst.targetEl) {
        var target = inst.targetEl;
        if (target === document.body || target === document.documentElement) return true;
        var id = target.id;
        if (id === "app" || id === "main" || id === "root") return true;
        if (target.classList && target.classList.contains("fvl-viewport-covering")) return true;
      }
      return false;
    }

    function _hideSiblingsFromScreenReaders(inst) {
      try {
        var doc = (typeof window !== "undefined" && window.document) || document;
        var body = doc.body;
        if (!body) return;
        var items = [];
        for (var i = 0; i < body.children.length; i++) {
          var child = body.children[i];
          if (child !== inst.rootEl && child.tagName !== "SCRIPT" && child.tagName !== "STYLE") {
            var prev = child.getAttribute("aria-hidden");
            child.setAttribute("aria-hidden", "true");
            items.push({ el: child, prev: prev });
          }
        }
        inst._ariaHiddenElements = items;
      } catch (_) {}
    }

    function _setupFocusAndKeyboard(inst) {
      try {
        var doc = (typeof window !== "undefined" && window.document) || document;
        inst._previouslyFocusedElement = doc.activeElement;

        if (inst.rootEl) {
          if (!inst.rootEl.hasAttribute("tabindex")) {
            inst.rootEl.setAttribute("tabindex", "-1");
          }
          try { inst.rootEl.focus(); } catch (_) {}
        }

        var handleKeydown = function(e) {
          if (!inst || inst.state === "hidden" || inst.state === "destroyed") return;
          var key = e.key || e.code;
          if (key === "Escape" || e.keyCode === 27) {
            if (inst.options && inst.options.closable !== false) {
              if (typeof inst.options.onClose === "function") {
                try { inst.options.onClose(); } catch (_) {}
              } else if (typeof inst.options.onCancel === "function") {
                try { inst.options.onCancel(); } catch (_) {}
              }
              hide(inst.id);
            }
          } else if (key === "Tab" || e.keyCode === 9) {
            if (!inst.rootEl) return;
            var focusables = inst.rootEl.querySelectorAll("a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex=\"-1\"]), [contenteditable]");
            if (focusables.length > 0) {
              var first = focusables[0];
              var last = focusables[focusables.length - 1];
              if (e.shiftKey && doc.activeElement === first) {
                e.preventDefault();
                last.focus();
              } else if (!e.shiftKey && doc.activeElement === last) {
                e.preventDefault();
                first.focus();
              }
            }
          }
        };

        inst._keydownListener = handleKeydown;
        doc.addEventListener("keydown", handleKeydown);
      } catch (_) {}
    }

    function show(userOpts) {
      var opts = M.Utils.mergeOptions(userOpts);
      var mode = opts.mode;

      var id = opts.id;
      if (!id) {
        if (mode === 'fullscreen' && !M.State.getByMode('fullscreen').length) {
          id = M.CONFIG.DOM.DEFAULT_FULLSCREEN_ID;
        } else {
          id = M.Utils.generateId('fvl-' + mode);
        }
      }
      opts.id = id;

      var targetEl = null;
      if (mode === 'scoped' || mode === 'inline') {
        targetEl = M.Utils.DOM.resolveTarget(opts.target);
        if (!targetEl) {
          console.error('[FVL] ' + mode + ' mode requires valid target');
          return null;
        }
      }

      var existing = M.State.getInstance(id);
      if (existing && existing.state !== 'hidden' && existing.state !== 'destroyed') {
        if (existing.state === 'hiding') {
          try { _cleanup(existing); } catch (_) {}
        } else {
          if (existing.options.message !== opts.message && opts.message !== undefined) {
            existing.options.message = opts.message;
            _setTexts(existing);
          }
          return _makeHandle(existing);
        }
      }

      if (opts.group) {
        var existingGroupInst = M.State.getByGroup(opts.group);
        if (existingGroupInst && existingGroupInst.id !== id) {
          try { _cleanup(existingGroupInst); } catch (_) {}
          M.State.emit('group:replace', { oldId: existingGroupInst.id, newId: id, group: opts.group });
        }
      }

      var zBase = opts.zIndex != null ? opts.zIndex : M.CONFIG.Z_INDEX[mode];
      if (mode === 'topbar') zBase = opts.zIndex != null ? opts.zIndex : M.CONFIG.Z_INDEX.topbar;

      /** @type {FVLInstance} */
      var inst = {
        id: id,
        mode: mode,
        options: opts,
        rootEl: null,
        spinnerEl: null,
        msgEl: null,
        subEl: null,
        barEl: null,
        targetEl: targetEl,
        state: 'showing',
        shownAt: Date.now(),
        autoHideTimer: null,
        rafId: null,
        leaveTimer: null,
        origTargetPos: '',
        origTargetMinHeight: '',
        origTargetHTML: '',
        listeners: new Set(),
      };

      inst.rootEl = M.Renderer.build(inst);
      if (!inst.rootEl) return null;

      if (mode !== 'inline') {
        inst.rootEl.style.zIndex = zBase;
      }

      if (opts.size && inst.spinnerEl) {
        inst.spinnerEl.style.width = opts.size + 'px';
        inst.spinnerEl.style.height = opts.size + 'px';
      }

      if (mode === 'fullscreen') {
        _setTexts(inst);
        _updateTopVar();
        _ensureResizeObserver();
      } else if (mode === 'scoped' && inst.msgEl && opts.message) {
        inst.msgEl.textContent = opts.message;
      }

      var doc = window.document || document;
      switch (mode) {
        case 'scoped':
          if (!_attachScoped(inst)) return null;
          break;
        case 'inline':
          if (!_attachInline(inst)) return null;
          break;
        case 'topbar':
          doc.body.appendChild(inst.rootEl);
          break;
        case 'fullscreen':
        default:
          doc.body.appendChild(inst.rootEl);
          break;
      }

      M.State.addInstance(inst);
      M.State.emit('showing', { id: id, mode: mode });

      if (typeof opts.onMount === 'function') {
        try { opts.onMount(inst.rootEl, _makeHandle(inst)); } catch (e) { console.error('[FVL] onMount error:', e); }
      }

      if (opts.instant) {
        inst.rootEl.classList.add('fvl-shown');
        inst.state = 'shown';
        M.State.emit('shown', { id: id, mode: mode });
        if (typeof opts.onShow === 'function') {
          try { opts.onShow(id, _makeHandle(inst)); } catch (e) { console.error('[FVL] onShow error:', e); }
        }
      } else {
        M.Animator.enter(inst, function() {
          inst.state = 'shown';
          M.State.emit('shown', { id: id, mode: mode });
          if (typeof opts.onShow === 'function') {
            try { opts.onShow(id, _makeHandle(inst)); } catch (e) { console.error('[FVL] onShow error:', e); }
          }
        });
      }

      if (opts.autoHideAfterMs > 0) {
        inst.autoHideTimer = setTimeout(function() { hide(id); }, opts.autoHideAfterMs);
      }

      if (_shouldLockScroll(inst)) {
        inst._scrollLocked = true;
        var lockMgr = M.ScrollLockManager || (M.Utils && M.Utils.ScrollLockManager);
        if (lockMgr) {
          lockMgr.lock();
        }
      }

      if (mode === "fullscreen") {
        _hideSiblingsFromScreenReaders(inst);
        _setupFocusAndKeyboard(inst);
      }

      return _makeHandle(inst);
    }

    function _cleanup(inst) {
      if (!inst) return;
      if (inst.autoHideTimer) { clearTimeout(inst.autoHideTimer); inst.autoHideTimer = null; }
      if (inst.leaveTimer) { clearTimeout(inst.leaveTimer); inst.leaveTimer = null; }
      if (inst.rafId) { cancelAnimationFrame(inst.rafId); inst.rafId = null; }

      var doc = window.document || document;

      if (inst._scrollLocked) {
        inst._scrollLocked = false;
        var lockMgr = M.ScrollLockManager || (M.Utils && M.Utils.ScrollLockManager);
        if (lockMgr) {
          lockMgr.unlock();
        }
      }

      if (inst._ariaHiddenElements) {
        try {
          inst._ariaHiddenElements.forEach(function(item) {
            if (item.prev === null || item.prev === undefined) {
              item.el.removeAttribute("aria-hidden");
            } else {
              item.el.setAttribute("aria-hidden", item.prev);
            }
          });
        } catch (_) {}
        inst._ariaHiddenElements = null;
      }

      if (inst._keydownListener) {
        try {
          var doc = (typeof window !== "undefined" && window.document) || document;
          doc.removeEventListener("keydown", inst._keydownListener);
        } catch (_) {}
        inst._keydownListener = null;
      }

      if (inst._previouslyFocusedElement) {
        try {
          if (typeof inst._previouslyFocusedElement.focus === "function") {
            inst._previouslyFocusedElement.focus();
          }
        } catch (_) {}
        inst._previouslyFocusedElement = null;
      }

      if (inst.targetEl) {
        try {
          inst.targetEl.setAttribute('aria-busy', 'false');
          if (inst.origTargetPos === 'static') {
            inst.targetEl.style.position = '';
          }
          if (inst._setScopedFallbackMinHeight) {
            var fb = M.CONFIG.SCOPED_EMPTY_MIN_HEIGHT;
            var otherHolders = (M.State.getByMode('scoped') || []).filter(function(other) {
              return other !== inst && other.targetEl === inst.targetEl
                && other._setScopedFallbackMinHeight
                && other.state !== 'hidden' && other.state !== 'destroyed';
            });
            if (!otherHolders.length) {
              if (inst.origTargetMinHeight != null && inst.origTargetMinHeight !== undefined) {
                inst.targetEl.style.minHeight = inst.origTargetMinHeight;
              } else {
                inst.targetEl.style.minHeight = '';
              }
            }
          }
          if (inst.origTargetHTML) {
            inst.targetEl.innerHTML = inst.origTargetHTML;
          }
        } catch (_) {}
      }

      if (inst.rootEl && inst.rootEl.parentNode) {
        try { inst.rootEl.parentNode.removeChild(inst.rootEl); } catch (_) {}
      }

      inst.state = 'hidden';
      M.State.emit('hidden', { id: inst.id, mode: inst.mode });

      if (typeof inst.options.onHide === 'function') {
        try { inst.options.onHide(inst.id); } catch (e) { console.error('[FVL] onHide error:', e); }
      }

      inst.listeners.forEach(function(fn) {
        try { fn('hidden', { id: inst.id }); } catch (_) {}
      });

      M.State.removeInstance(inst.id);
    }

    function hide(id, options) {
      var opts = options || {};
      if (!id) id = M.CONFIG.DOM.DEFAULT_FULLSCREEN_ID;
      var inst = M.State.getInstance(id);
      if (!inst) return Promise.resolve(false);
      if (inst.state === 'hiding' || inst.state === 'hidden' || inst.state === 'destroyed') {
        return Promise.resolve(false);
      }

      var minTimerPromise = Promise.resolve();
      if (inst.options.minDurationMs > 0) {
        var elapsed = Date.now() - inst.shownAt;
        var remain = inst.options.minDurationMs - elapsed;
        if (remain > 0) {
          minTimerPromise = new Promise(function(res) { setTimeout(res, remain); });
        }
      }

      return minTimerPromise.then(function() {
        inst.state = 'hiding';
        M.State.emit('hiding', { id: inst.id, mode: inst.mode });

        if (opts.instant || inst.options.instant) {
          _cleanup(inst);
          return true;
        }

        return new Promise(function(resolve) {
          M.Animator.leave(inst, function() {
            _cleanup(inst);
            resolve(true);
          });
        });
      });
    }

    function hideInstant(id) {
      if (!id) id = M.CONFIG.DOM.DEFAULT_FULLSCREEN_ID;
      var inst = M.State.getInstance(id);
      if (!inst) return Promise.resolve(false);
      if (inst.state === 'hidden' || inst.state === 'destroyed') {
        return Promise.resolve(false);
      }
      inst.state = 'hiding';
      _cleanup(inst);
      return Promise.resolve(true);
    }

    function update(id, userOpts) {
      if (!id) id = M.CONFIG.DOM.DEFAULT_FULLSCREEN_ID;
      var inst = M.State.getInstance(id);
      if (!inst) return;
      var opts = userOpts || {};
      if (opts.message !== undefined) inst.options.message = opts.message;
      if (opts.subMessage !== undefined) inst.options.subMessage = opts.subMessage;
      if (opts.progress != null && inst.barEl) {
        inst.barEl.classList.remove('fvl-topbar-indeterminate');
        inst.barEl.classList.add('fvl-topbar-determinate');
        inst.barEl.style.width = Math.max(0, Math.min(1, opts.progress)) * 100 + '%';
      }
      if (opts.progress != null && inst.spinnerEl && M.Spinner) {
        var pVal = (opts.progress <= 1 && opts.progress > 0) ? opts.progress * 100 : opts.progress;
        M.Spinner.updateProgress(inst.spinnerEl, pVal);
      }
      _setTexts(inst);
    }

    function hideAll() {
      var all = M.State.getAll();
      var ids = all.map(function(i) { return i.id; });
      return Promise.all(ids.map(function(id) { return hideInstant(id); }));
    }

    function hideByGroup(group) {
      var inst = M.State.getByGroup(group);
      if (inst) return hideInstant(inst.id);
      return Promise.resolve(false);
    }

    function readinessHandshake(opts) {
      opts = opts || {};
      var targetId = opts.activeId || M.CONFIG.DOM.DEFAULT_FULLSCREEN_ID;

      var bootSelectors = [
        '#fv-boot-loader',
        '#nc-early-overlay',
        '#nc-early-msg',
        '[data-fv-boot]',
        '.fv-boot-spinner'
      ];

      var doc = window.document || document;
      bootSelectors.forEach(function(sel) {
        try {
          var els = doc.querySelectorAll(sel);
          for (var i = 0; i < els.length; i++) {
            if (els[i] && els[i].parentNode) {
              els[i].parentNode.removeChild(els[i]);
            }
          }
        } catch (_) {}
      });

      var activeInst = M.State.getInstance(targetId);
      if (activeInst && activeInst.id === targetId) {
        return hideInstant(targetId).then(function() {
          return { success: true, handshakedAt: Date.now() };
        });
      }

      return Promise.resolve({ success: true, handshakedAt: Date.now() });
    }

    function _makeHandle(inst) {
      return {
        id: inst.id,
        mode: inst.mode,
        get element() { return inst.rootEl; },
        hide: function(o) { return hide(inst.id, o); },
        hideInstant: function() { return hideInstant(inst.id); },
        updateMessage: function(msg) { update(inst.id, { message: msg }); },
        updateProgress: function(pct) { update(inst.id, { progress: pct }); },
        on: function(fn) { inst.listeners.add(fn); },
      };
    }

    function stats() {
      var all = M.State.getAll();
      return {
        activeCount: all.length,
        instances: all.map(function(i) { return { id: i.id, mode: i.mode, state: i.state }; })
      };
    }

    return Object.freeze({
      show: show,
      hide: hide,
      hideInstant: hideInstant,
      update: update,
      hideAll: hideAll,
      hideByGroup: hideByGroup,
      readinessHandshake: readinessHandshake,
      stats: stats,
      _updateTopVar: _updateTopVar,
      _setTexts: _setTexts,
      _makeHandle: _makeHandle,
    });
  })();

  M.Engine = Engine;
})(typeof window !== 'undefined' ? window : this);

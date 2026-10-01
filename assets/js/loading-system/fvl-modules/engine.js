// Path:    assets/js/loading-system/fvl-modules/engine.js
// Purpose: Core lifecycle engine, display manager, and handshake handler for FVL.

(function(window) {
  'use strict';

  var M = window.FVLModules = window.FVLModules || {};

  var Engine = (function() {

    function _setTexts(inst) {
      if (!inst.msgEl) return;
      var opts = inst.options;
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

    function _attachScoped(inst) {
      var target = inst.targetEl;
      if (!target) {
        console.warn('[FVL] scoped mode requires a target');
        return false;
      }
      try {
        inst.origTargetPos = window.getComputedStyle(target).position;
        if (inst.origTargetPos === 'static') {
          target.style.position = 'relative';
        }
      } catch (_) {}
      target.setAttribute('aria-busy', 'true');
      target.appendChild(inst.rootEl);
      return true;
    }

    function _attachInline(inst) {
      var target = inst.targetEl;
      if (!target) {
        console.warn('[FVL] inline mode requires a target');
        return false;
      }
      target.setAttribute('aria-busy', 'true');
      if (inst.options.replaceContent) {
        inst.origTargetHTML = target.innerHTML;
        target.textContent = '';
        target.appendChild(inst.rootEl);
      } else {
        target.insertBefore(inst.rootEl, target.firstChild);
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

      if (mode === 'fullscreen' && opts.lockScroll) {
        try {
          var prev = window.scrollY || 0;
          doc.body.style.position = 'fixed';
          doc.body.style.top = '-' + prev + 'px';
          doc.body.style.width = '100%';
          inst._lockedScrollY = prev;
        } catch (_) {}
      }

      return _makeHandle(inst);
    }

    function hide(id) {
      var inst = M.State.getInstance(id);
      if (!inst || inst.state === 'hidden' || inst.state === 'destroyed') return Promise.resolve();
      if (inst.state === 'hiding') return Promise.resolve();

      inst.state = 'hiding';
      if (inst.autoHideTimer) { clearTimeout(inst.autoHideTimer); inst.autoHideTimer = null; }
      if (inst.leaveTimer) { clearTimeout(inst.leaveTimer); inst.leaveTimer = null; }
      M.State.emit('hiding', { id: id, mode: inst.mode });

      return new Promise(function(resolve) {
        M.Animator.leave(inst, function() {
          if (inst.state === 'hidden' || inst.state === 'destroyed') {
            resolve();
            return;
          }
          _cleanup(inst);
          inst.state = 'hidden';
          M.State.emit('hidden', { id: id, mode: inst.mode });
          if (typeof inst.options.onHide === 'function') {
            try { inst.options.onHide(id); } catch (e) { console.error('[FVL] onHide error:', e); }
          }
          resolve();
        });
      });
    }

    function hideInstant(id) {
      if (!id) id = M.CONFIG.DOM.DEFAULT_FULLSCREEN_ID;
      var inst = M.State.getInstance(id);
      if (!inst || inst.state === 'hidden' || inst.state === 'destroyed') return Promise.resolve();

      if (inst.autoHideTimer) { clearTimeout(inst.autoHideTimer); inst.autoHideTimer = null; }
      if (inst.state !== 'hiding') {
        M.State.emit('hiding', { id: id, mode: inst.mode });
      }

      _cleanup(inst);
      inst.state = 'hidden';
      M.State.emit('hidden', { id: id, mode: inst.mode });
      if (typeof inst.options.onHide === 'function') {
        try { inst.options.onHide(id); } catch (e) { console.error('[FVL] onHide error:', e); }
      }
      return Promise.resolve();
    }

    function _cleanup(inst) {
      var doc = window.document || document;
      if (inst.mode === 'fullscreen' && inst._lockedScrollY != null) {
        try {
          doc.body.style.position = '';
          doc.body.style.top = '';
          doc.body.style.width = '';
          window.scrollTo(0, inst._lockedScrollY);
          inst._lockedScrollY = null;
        } catch (_) {}
      }
      if (inst.mode === 'scoped' && inst.targetEl && inst.origTargetPos) {
        if (inst.origTargetPos === 'static') {
          inst.targetEl.style.position = '';
        } else {
          inst.targetEl.style.position = inst.origTargetPos;
        }
      }
      if (inst.mode === 'inline' && inst.targetEl && inst.options.replaceContent && inst.origTargetHTML != null) {
        inst.targetEl.innerHTML = inst.origTargetHTML;
        inst.origTargetHTML = '';
      }
      if (inst.rootEl && inst.rootEl.parentNode) {
        inst.rootEl.parentNode.removeChild(inst.rootEl);
      }
      if (inst.targetEl) {
        inst.targetEl.setAttribute('aria-busy', 'false');
      }
      M.State.removeInstance(inst.id);
    }

    function update(id, newOpts) {
      var inst = M.State.getInstance(id);
      if (!inst) return;
      newOpts = newOpts || {};
      Object.assign(inst.options, newOpts);

      if (newOpts.message !== undefined || newOpts.lang !== undefined) {
        _setTexts(inst);
      }
      if (newOpts.progress !== undefined) {
        if (inst.barEl) {
          if (newOpts.progress == null) {
            inst.barEl.classList.remove('fvl-topbar-determinate');
            inst.barEl.classList.add('fvl-topbar-indeterminate');
            inst.barEl.style.width = '';
          } else {
            inst.barEl.classList.remove('fvl-topbar-indeterminate');
            inst.barEl.classList.add('fvl-topbar-determinate');
            inst.barEl.style.width = Math.max(0, Math.min(1, newOpts.progress)) * 100 + '%';
          }
        }
        if (inst.spinnerEl && M.Spinner) {
          M.Spinner.updateProgress(inst.spinnerEl, newOpts.progress);
        }
      }
      M.State.emit('updated', { id: id, mode: inst.mode });
    }

    function hideAll() {
      var all = M.State.getAllInstances().filter(function(i) {
        return i.state === 'showing' || i.state === 'shown';
      });
      return Promise.all(all.map(function(i) { return hide(i.id); }));
    }

    function hideByGroup(group) {
      var inst = M.State.getByGroup(group);
      return inst ? hide(inst.id) : Promise.resolve();
    }

    function stats() {
      var all = M.State.getAllInstances();
      return {
        active: all.length,
        modes: {
          fullscreen: all.filter(function(i) { return i.mode === 'fullscreen'; }).length,
          scoped:     all.filter(function(i) { return i.mode === 'scoped'; }).length,
          inline:     all.filter(function(i) { return i.mode === 'inline'; }).length,
          topbar:     all.filter(function(i) { return i.mode === 'topbar'; }).length,
        },
        instances: all.map(function(i) {
          return { id: i.id, mode: i.mode, state: i.state, shownAt: i.shownAt };
        }),
      };
    }

    function _makeHandle(inst) {
      return Object.freeze({
        id: inst.id,
        mode: inst.mode,
        options: inst.options,
        element: inst.rootEl,
        hide: function() { return hide(inst.id); },
        hideInstant: function() { return hideInstant(inst.id); },
        update: function(o) { update(inst.id, o); },
        setMessage: function(msg) { update(inst.id, { message: msg }); },
        setProgress: function(p) { update(inst.id, { progress: p }); },
        updateProgress: function(p) { update(inst.id, { progress: p }); },
        getState: function() { return inst.state; },
        on: function(event, fn) {
          return M.State.on('instance:' + inst.id + ':' + event, fn);
        },
      });
    }

    function readinessHandshake(opts) {
      opts = opts || {};
      var bootIds = opts.bootElementIds || ['fv-boot-loader', 'nc-early-overlay', 'nc-early-msg'];
      try {
        var doc = window.document || document;
        bootIds.forEach(function(id) {
          var el = doc.getElementById(id);
          if (el && !el.classList.contains('fv-boot-hidden')) {
            if (typeof window.__removeBootLoader === 'function' && id === 'fv-boot-loader') {
              window.__removeBootLoader();
            } else if (el.parentNode) {
              el.parentNode.removeChild(el);
            }
          }
        });
      } catch (_) {}

      var defaultId = (M.CONFIG && M.CONFIG.DOM && M.CONFIG.DOM.DEFAULT_FULLSCREEN_ID) || 'fvl-default-fullscreen';
      var fullscreenId = opts.id || defaultId;
      var inst = M.State.getInstance(fullscreenId);
      if (inst && (inst.state === 'showing' || inst.state === 'shown')) {
        return hide(fullscreenId).then(function() {
          return { success: true, timestamp: Date.now() };
        });
      }
      return Promise.resolve({ success: true, timestamp: Date.now() });
    }

    return Object.freeze({
      show: show,
      hide: hide,
      hideInstant: hideInstant,
      hideAll: hideAll,
      hideByGroup: hideByGroup,
      getByMode: function(mode) { return M.State.getByMode(mode); },
      readinessHandshake: readinessHandshake,
      update: update,
      stats: stats,
      _updateTopVar: _updateTopVar,
      _setTexts: function(id) {
        var inst = M.State.getInstance(id);
        if (inst) _setTexts(inst);
      },
      _makeHandle: function(inst) { return _makeHandle(inst); },
    });
  })();

  M.Engine = Engine;
})(typeof window !== 'undefined' ? window : globalThis);

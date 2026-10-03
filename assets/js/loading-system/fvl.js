// Path:    assets/js/loading-system/fvl.js
// Purpose: FVL (FanHoardVerse Loader) — entry point and orchestrator.
//          Loads fvl-modules/* in dependency order and exposes frozen API window.FVL.

(function() {
  'use strict';

  var win = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this);

  if (win.FVL && win.FVL._initialized) return;

  var isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
  var _req = (function() {
    try { return eval('require'); } catch (_) { return null; }
  })();

  var FV_BUILD_ID = '3.2.4-202610031541';
  function _v() { return FV_BUILD_ID ? '?v=' + FV_BUILD_ID : ''; }

  var LOAD_PHASES = [
    // Phase 0 also loads the shared scroll-lock core so utils.js (phase 1)
    // can alias window.ScrollLockCore — popup.js / search.js load the same
    // file on pages where FVL itself is not present.
    ['namespace.js', 'types.js', 'config.js', 'scroll-lock-core.js'],
    ['utils.js', 'state.js'],
    ['renderer.js', 'animator.js', 'spinner.js'],
    ['engine.js']
  ];

  function getBasePath() {
    try {
      var doc = win.document || document;
      var scripts = doc.querySelectorAll('script[src]');
      for (var i = scripts.length - 1; i >= 0; i--) {
        var s = scripts[i];
        var src = s.getAttribute('src') || '';
        if (/\/loading-system\/fvl\.js(\?|$)/.test(src)) {
          return src.replace(/\/fvl\.js(\?.*)?$/, '');
        }
      }
    } catch (e) {
      console.warn('[FVL] Path resolution fell back to default:', e);
    }
    return '/assets/js/loading-system';
  }

  function loadScriptSync(url) {
    if (isNode && _req) {
      try {
        var fs = _req('fs');
        var path = _req('path');
        var relativePath = url.replace(/^\/assets\/js\/loading-system\//, '').replace(/\?.*$/, '');
        var fullPath = path.resolve(process.cwd(), 'assets/js/loading-system', relativePath);
        if (fs.existsSync(fullPath)) {
          var code = fs.readFileSync(fullPath, 'utf-8');
          var fn = new Function('window', 'document', 'localStorage', code);
          fn(win, win.document || document, win.localStorage);
          return Promise.resolve();
        }
      } catch (e) {
        console.warn('[FVL] Sync script load failed for ' + url, e);
      }
    }

    return new Promise(function(resolve, reject) {
      var doc = win.document || document;
      var s = doc.createElement('script');
      s.src = url + _v();
      s.async = false;
      s.onload = function() { resolve(); };
      s.onerror = function() { reject(new Error('[FVL] Failed to load: ' + url + _v())); };
      doc.head.appendChild(s);
    });
  }

  function loadPhase(names, base) {
    return Promise.all(names.map(function(n) { return loadScriptSync(base + '/fvl-modules/' + n); }));
  }

  function loadPhases(phases, base) {
    return phases.reduce(
      function(chain, phase) { return chain.then(function() { return loadPhase(phase, base); }); },
      Promise.resolve()
    );
  }

  // ── Sync pre-boot for Node / test environment ──
  if (isNode) {
    try {
      var _fs = null, _path = null;
      if (typeof process !== 'undefined' && typeof process.getBuiltinModule === 'function') {
        try {
          _fs = process.getBuiltinModule('fs');
          _path = process.getBuiltinModule('path');
        } catch (_) {}
      }
      if (!_fs) {
        try { _fs = require('fs'); _path = require('path'); } catch (_) {}
      }
      if (_fs && _path) {
        var cwd = process.cwd();
        var sysDir = _path.resolve(cwd, 'assets/js/loading-system');
        if (!_fs.existsSync(sysDir)) {
          sysDir = '/app/fanhoard-page/assets/js/loading-system';
        }

        var modDir = _path.resolve(sysDir, 'fvl-modules');
        var modFiles = [
          'namespace.js', 'types.js', 'config.js', 'scroll-lock-core.js',
          'utils.js', 'state.js',
          'renderer.js', 'animator.js', 'spinner.js',
          'engine.js'
        ];
        modFiles.forEach(function(file) {
          var p = _path.join(modDir, file);
          if (_fs.existsSync(p)) {
            var c = _fs.readFileSync(p, 'utf-8');
            try {
              var fn = new Function('window', 'document', 'localStorage', c);
              fn(win, win.document || document, win.localStorage);
            } catch (err) {
              console.error('[FVL] Failed loading module file ' + file + ':', err);
            }
          }
        });

        var spinnerStandalonePath = _path.join(sysDir, 'fvl-spinner.js');
        if (_fs.existsSync(spinnerStandalonePath)) {
          try {
            var sc = _fs.readFileSync(spinnerStandalonePath, 'utf-8');
            var sfn = new Function('window', 'document', 'localStorage', sc);
            sfn(win, win.document || document, win.localStorage);
          } catch (serr) {
            console.error('[FVL] Failed loading standalone fvl-spinner.js:', serr);
          }
        }
      }
    } catch (e) {
      console.warn('[FVL] Node sync pre-boot failed:', e);
    }
  }

  var base = getBasePath();

  // ════════════════════════════════════════════════════════════════════════════
  // Compat & Init (public API registration)
  // ════════════════════════════════════════════════════════════════════════════

  function _boot() {
    var M = win.FVLModules;
    if (!M || !M.Engine) {
      console.error('[FVL] FVLModules or Engine missing after boot. M is:', M, 'win.FVLModules:', win.FVLModules);
      return;
    }

    var Engine = M.Engine;
    var State = M.State;
    var CONFIG = M.CONFIG;
    var VERSION = M.VERSION || (CONFIG && CONFIG.VERSION) || '1.0.0';

    // ── CSS auto-inject ──
    function _injectCSS() {
      var doc = win.document || document;
      if (!doc || !doc.querySelector) return;
      if (doc.querySelector('link[href*="loading-system.css"]')) return;
      var isTestEnv = typeof win !== 'undefined' && (win.happyDOM || (win.process && win.process.env && win.process.env.VITEST));
      if (isTestEnv) return;
      try {
        var link = doc.createElement('link');
        link.rel = 'stylesheet';
        link.href = (CONFIG && CONFIG.DOM && CONFIG.DOM.CSS_PATH) || '/assets/css/loading-system.css';
        doc.head.appendChild(link);
      } catch (_) {}
    }

    // ── NavCore LoadingService proxy ──
    var LoadingService = {
      LOADING_CONTAINER_ID: 'content-loading',

      init: function() {
        _injectCSS();
      },

      show: function(opts) {
        _injectCSS();
        var Utils = M.Utils;
        var o = Utils ? Utils.normalizeOptions(opts) : ((typeof opts === 'string') ? { message: opts } : (opts || {}));
        if (!o.mode) o.mode = 'fullscreen';
        if (o.mode === 'fullscreen' && !o.id) {
          o.id = CONFIG.DOM.DEFAULT_FULLSCREEN_ID;
        }
        return Engine.show(o);
      },

      hide: function() {
        return Engine.hide(CONFIG.DOM.DEFAULT_FULLSCREEN_ID);
      },

      hideInstant: function(id) {
        return Engine.hideInstant(id || CONFIG.DOM.DEFAULT_FULLSCREEN_ID);
      },

      updateMessage: function(msg) {
        Engine.update(CONFIG.DOM.DEFAULT_FULLSCREEN_ID, { message: msg });
      },

      isShown: function() {
        var inst = State.getInstance(CONFIG.DOM.DEFAULT_FULLSCREEN_ID);
        return !!(inst && (inst.state === 'showing' || inst.state === 'shown'));
      },

      getMessages: function() { return CONFIG.MESSAGES; },

      _updateTopVar: function() { Engine._updateTopVar(); },
      _setTexts: function() { Engine._setTexts(CONFIG.DOM.DEFAULT_FULLSCREEN_ID); },
      _getEl: function() {
        var inst = State.getInstance(CONFIG.DOM.DEFAULT_FULLSCREEN_ID);
        return inst ? inst.rootEl : null;
      },

      showInContent: function(opts) {
        var Utils = M.Utils;
        var o = Utils ? Utils.normalizeOptions(opts) : ((typeof opts === 'string') ? { message: opts } : (opts || {}));
        o.mode = o.mode || 'scoped';
        o.target = o.target || '#content-loading';
        return this.show(o);
      },
      hideFromContent: function(id) { return this.hide(id || 'fvl-scoped-content'); },
    };

    function installGlobalAliases() {
      try {
        if (!win.showInstantLoadingOverlay) {
          win.showInstantLoadingOverlay = function(opts) { return LoadingService.show(opts); };
        }
        if (!win.removeInstantLoadingOverlay) {
          win.removeInstantLoadingOverlay = function() { return LoadingService.hide(); };
        }
        if (!win._navCore_contentLoadingManager) {
          win._navCore_contentLoadingManager = LoadingService;
        }
        if (!win._headerV2_contentLoadingManager) {
          win._headerV2_contentLoadingManager = LoadingService;
        }
        if (!win.__removeInstantLoadingOverlay) {
          win.__removeInstantLoadingOverlay = function() { return LoadingService.hide(); };
        }
      } catch (_) {}
    }

    function installNavCoreProxy() {
      try {
        if (win.NavCoreModules && !win.NavCoreModules.LoadingService) {
          win.NavCoreModules.LoadingService = LoadingService;
        }
      } catch (_) {}
    }

    _injectCSS();
    installGlobalAliases();
    installNavCoreProxy();

    try {
      win.dispatchEvent(new CustomEvent('fvl:ready', { detail: { version: VERSION } }));
    } catch (_) {}

    var FVL_API = Object.freeze({
      _initialized: true,
      version: VERSION,

      show: function(opts) { return Engine.show(opts); },
      hide: function(id) {
        if (!id) id = CONFIG.DOM.DEFAULT_FULLSCREEN_ID;
        return Engine.hide(id);
      },
      hideInstant: function(id) {
        if (!id) id = CONFIG.DOM.DEFAULT_FULLSCREEN_ID;
        return Engine.hideInstant(id);
      },
      getByMode: function(mode) { return State.getByMode(mode); },
      hideAll: function() { return Engine.hideAll(); },
      hideByGroup: function(group) { return Engine.hideByGroup(group); },
      readinessHandshake: function(opts) { return Engine.readinessHandshake(opts); },
      boot: function(opts) { return Engine.readinessHandshake(opts); },
      update: function(id, opts) { Engine.update(id, opts); },
      get: function(id) {
        var inst = State.getInstance(id);
        return inst ? Engine._makeHandle(inst) : null;
      },
      isShown: function(id) { return this.isActive(id); },
      isActive: function(id) {
        if (!id) id = CONFIG.DOM.DEFAULT_FULLSCREEN_ID;
        var inst = State.getInstance(id);
        return !!(inst && (inst.state === 'showing' || inst.state === 'shown'));
      },
      on: function(event, fn) { return State.on(event, fn); },
      stats: function() { return Engine.stats(); },
      modules: function() { return M; },
      config: function() { return CONFIG; },

      fullscreen: function(opts) {
        opts = M.Utils.normalizeOptions(opts);
        opts.mode = 'fullscreen';
        return Engine.show(opts);
      },
      scoped: function(opts) {
        if (typeof opts === 'string' || (typeof HTMLElement !== 'undefined' && opts instanceof HTMLElement)) {
          opts = { target: opts };
        } else {
          opts = Object.assign({}, opts);
        }
        opts.mode = 'scoped';
        return Engine.show(opts);
      },
      inline: function(opts) {
        if (typeof opts === 'string' || (typeof HTMLElement !== 'undefined' && opts instanceof HTMLElement)) {
          opts = { target: opts };
        } else {
          opts = Object.assign({}, opts);
        }
        opts.mode = 'inline';
        return Engine.show(opts);
      },
      spinner: win.FVLSpinner || (function(opts) { return M.Spinner ? M.Spinner.create(opts) : null; }),
      topbar: function(opts) {
        opts = opts || {};
        opts.mode = 'topbar';
        return Engine.show(opts);
      },
    });

    win.FVL = FVL_API;
    win.FLV = FVL_API;
  }

  if (isNode) {
    _boot();
  } else {
    loadScriptSync(base + '/fvl-spinner.js')
      .catch(function() {})
      .then(function() { return loadPhases(LOAD_PHASES, base); })
      .then(function() { _boot(); })
      .catch(function(err) { console.error('[FVL] Module loading failed:', err); });
  }

})();

/**
 * Path: assets/js/loading-system/plsys.js
 * Purpose: PLSys (FanHoard Progressive Loading System) Core Engine v2.0.0
 * Deterministic FSM, AbortController timeout manager, SWR cache store,
 * zero-text skeleton rendering, accessibility ARIA busy/live management,
 * and performance telemetry.
 */
(function(global) {
  'use strict';

  if (global.PLSys && global.PLSys._initialized) return;

  // ════════════════════════════════════════════════════════════════════════════
  // 1. FSM States & Transition Matrix
  // ════════════════════════════════════════════════════════════════════════════

  var FSM_STATES = Object.freeze({
    IDLE: 'IDLE',
    STAGED_SKELETON: 'STAGED_SKELETON',
    PARTIAL_COMMIT: 'PARTIAL_COMMIT',
    TIMEOUT_FALLBACK: 'TIMEOUT_FALLBACK',
    CONTENT_READY: 'CONTENT_READY',
    ERROR_RETRYABLE: 'ERROR_RETRYABLE'
  });

  var TRANSITION_MATRIX = Object.freeze({
    IDLE: ['STAGED_SKELETON', 'PARTIAL_COMMIT', 'IDLE'],
    STAGED_SKELETON: ['STAGED_SKELETON', 'CONTENT_READY', 'TIMEOUT_FALLBACK', 'ERROR_RETRYABLE', 'IDLE'],
    PARTIAL_COMMIT: ['STAGED_SKELETON', 'CONTENT_READY', 'TIMEOUT_FALLBACK', 'ERROR_RETRYABLE', 'IDLE'],
    TIMEOUT_FALLBACK: ['STAGED_SKELETON', 'CONTENT_READY', 'ERROR_RETRYABLE', 'IDLE'],
    CONTENT_READY: ['STAGED_SKELETON', 'PARTIAL_COMMIT', 'IDLE'],
    ERROR_RETRYABLE: ['STAGED_SKELETON', 'IDLE']
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 2. SWR Cache Store
  // ════════════════════════════════════════════════════════════════════════════

  function SWRCacheStore() {
    this.memory = new Map();
    this.prefix = 'plsys:swr:';
  }

  SWRCacheStore.prototype.get = function(key) {
    if (!key) return null;
    if (this.memory.has(key)) return this.memory.get(key);
    try {
      if (typeof localStorage !== 'undefined') {
        var raw = localStorage.getItem(this.prefix + key);
        if (raw) {
          var parsed = JSON.parse(raw);
          this.memory.set(key, parsed.data);
          return parsed.data;
        }
      }
    } catch (_) {}
    return null;
  };

  SWRCacheStore.prototype.has = function(key) {
    if (!key) return false;
    if (this.memory.has(key)) return true;
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(this.prefix + key) !== null;
      }
    } catch (_) {}
    return false;
  };

  SWRCacheStore.prototype.set = function(key, data) {
    if (!key) return;
    this.memory.set(key, data);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.prefix + key, JSON.stringify({
          data: data,
          timestamp: Date.now()
        }));
      }
    } catch (_) {}
  };

  SWRCacheStore.prototype.delete = function(key) {
    if (!key) return;
    this.memory.delete(key);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(this.prefix + key);
      }
    } catch (_) {}
  };

  SWRCacheStore.prototype.clear = function() {
    this.memory.clear();
    try {
      if (typeof localStorage !== 'undefined') {
        var toRemove = [];
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (k && k.indexOf(this.prefix) === 0) toRemove.push(k);
        }
        for (var j = 0; j < toRemove.length; j++) {
          localStorage.removeItem(toRemove[j]);
        }
      }
    } catch (_) {}
  };

  var swrCache = new SWRCacheStore();

  // ════════════════════════════════════════════════════════════════════════════
  // 3. Telemetry & Debug Logging
  // ════════════════════════════════════════════════════════════════════════════

  function isDebug() {
    try {
      if (typeof window !== 'undefined' && window.__PL_DEBUG__) return true;
      if (typeof localStorage !== 'undefined' && localStorage.getItem('PL_DEBUG') === 'true') return true;
    } catch (_) {}
    return false;
  }

  function logTransition(containerId, oldState, newState, reason) {
    if (isDebug()) {
      var time = new Date().toISOString().split('T')[1].slice(0, 12);
      console.log('[PLSys] [' + time + '] Transition (' + containerId + '): ' + oldState + ' -> ' + newState + ' [' + (reason || '') + ']');
    }
  }

  function getTopProgressBar() {
    if (typeof document === 'undefined' || !document.body) return null;
    var bar = document.getElementById('pl-top-progress');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'pl-top-progress';
      bar.className = 'pl-top-progress';
      bar.setAttribute('aria-hidden', 'true');
      bar.style.cssText = 'position:fixed;top:0;left:0;right:0;height:2px;background:var(--pl-progress-color, #3b82f6);z-index:17500;display:none;transition:width 200ms ease;';
      document.body.appendChild(bar);
    }
    return bar;
  }

  function showTopProgressBar() {
    var bar = getTopProgressBar();
    if (bar) {
      bar.style.display = 'block';
      bar.style.width = '40%';
    }
  }

  function hideTopProgressBar() {
    if (typeof document === 'undefined') return;
    var bar = document.getElementById('pl-top-progress');
    if (bar) {
      bar.style.width = '100%';
      setTimeout(function() {
        if (bar.style.width === '100%') {
          bar.style.display = 'none';
          bar.style.width = '0%';
        }
      }, 200);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 4. PLController Class
  // ════════════════════════════════════════════════════════════════════════════

  function PLController(container, options) {
    this.container = typeof container === 'string' && typeof document !== 'undefined' ? document.querySelector(container) : container;
    this.options = options || {};
    this.state = FSM_STATES.IDLE;
    this.fetchToken = 0;
    this.activeAbortController = null;
    this.softTimer = null;
    this.hardTimer = null;
    this.lastLoadStart = null;
    this.lastDurationMs = null;
    this.mountedSkeletonNodes = [];
    this.lastFetcher = null;
    this.lastRenderer = null;
    this.lastLoadOptions = null;
  }

  PLController.prototype.getContainerId = function() {
    if (!this.container) return 'unattached';
    return this.container.id ? '#' + this.container.id : (this.container.className ? '.' + this.container.className : 'element');
  };

  PLController.prototype.canTransitionTo = function(newState) {
    var allowed = TRANSITION_MATRIX[this.state];
    return allowed && allowed.indexOf(newState) !== -1;
  };

  PLController.prototype.transitionTo = function(newState, reason) {
    if (!this.canTransitionTo(newState)) {
      if (isDebug()) {
        console.warn('[PLSys] Rejected illegal transition (' + this.getContainerId() + '): ' + this.state + ' -> ' + newState);
      }
      return false;
    }

    var oldState = this.state;
    this.state = newState;
    logTransition(this.getContainerId(), oldState, newState, reason);

    if (this.container) {
      if (newState === FSM_STATES.STAGED_SKELETON || newState === FSM_STATES.PARTIAL_COMMIT || newState === FSM_STATES.TIMEOUT_FALLBACK) {
        this.container.setAttribute('aria-busy', 'true');
      } else if (newState === FSM_STATES.CONTENT_READY || newState === FSM_STATES.ERROR_RETRYABLE || newState === FSM_STATES.IDLE) {
        this.container.setAttribute('aria-busy', 'false');
      }
    }

    return true;
  };

  PLController.prototype._clearTimers = function() {
    if (this.softTimer) { clearTimeout(this.softTimer); this.softTimer = null; }
    if (this.hardTimer) { clearTimeout(this.hardTimer); this.hardTimer = null; }
  };

  PLController.prototype._mountSkeleton = function(templateId) {
    if (!this.container) return;
    this._unmountSkeleton();

    if (templateId && typeof document !== 'undefined') {
      var tmpl = document.getElementById(templateId);
      if (tmpl && tmpl.content) {
        var clone = tmpl.content.cloneNode(true);
        this.container.appendChild(clone);
        return;
      }
    }

    var skel = document.createElement('div');
    skel.className = 'pl-card-skeleton';
    skel.setAttribute('aria-hidden', 'true');
    skel.setAttribute('role', 'presentation');
    this.container.appendChild(skel);
    this.mountedSkeletonNodes.push(skel);
  };

  PLController.prototype._unmountSkeleton = function() {
    if (!this.container) return;
    var skels = this.container.querySelectorAll('.pl-card-skeleton, .pl-pill-skeleton, .pl-timeline-skeleton');
    for (var i = 0; i < skels.length; i++) {
      if (skels[i].parentNode) skels[i].parentNode.removeChild(skels[i]);
    }
    this.mountedSkeletonNodes = [];
  };

  PLController.prototype._renderErrorUI = function(message, fetcher, renderer, options) {
    if (!this.container) return;
    var existingError = this.container.querySelector('.pl-error-boundary');
    if (existingError) existingError.remove();

    var errBoundary = document.createElement('div');
    errBoundary.className = 'pl-error-boundary';
    errBoundary.setAttribute('role', 'alert');
    errBoundary.setAttribute('aria-live', 'polite');

    var msgP = document.createElement('p');
    msgP.className = 'pl-error-message';
    msgP.textContent = message || 'Unable to load content.';
    errBoundary.appendChild(msgP);

    var retryBtn = document.createElement('button');
    retryBtn.className = 'pl-retry-btn';
    retryBtn.type = 'button';
    retryBtn.textContent = 'Retry';

    var self = this;
    retryBtn.addEventListener('click', function() {
      errBoundary.remove();
      self.load(fetcher, renderer, options);
    });

    errBoundary.appendChild(retryBtn);
    this.container.appendChild(errBoundary);

    try { retryBtn.focus(); } catch (_) {}
  };

  PLController.prototype._markReady = function(key) {
    if (typeof performance !== 'undefined' && performance.mark) {
      try {
        performance.mark('plsys:ready:' + key);
        performance.measure('plsys:duration:' + key, 'plsys:start:' + key, 'plsys:ready:' + key);
      } catch (_) {}
    }
  };

  PLController.prototype.load = function(fetcher, renderer, opts) {
    opts = opts || {};
    this.lastFetcher = fetcher;
    this.lastRenderer = renderer;
    this.lastLoadOptions = opts;

    this.fetchToken++;
    var currentToken = this.fetchToken;
    var key = opts.key || (this.container ? this.container.id : 'default');

    this._clearTimers();

    var controller = new AbortController();
    this.activeAbortController = controller;
    var signal = controller.signal;

    if (typeof performance !== 'undefined' && performance.mark) {
      try { performance.mark('plsys:start:' + key); } catch (_) {}
    }

    var useSWR = opts.useSWR !== false;
    var cachedData = useSWR ? swrCache.get(key) : null;

    var self = this;

    if (cachedData) {
      this.transitionTo(FSM_STATES.PARTIAL_COMMIT, 'SWR hit');
      this._unmountSkeleton();
      if (typeof renderer === 'function') {
        try { renderer(cachedData); } catch (e) { console.error('[PLSys] SWR render error:', e); }
      }
    } else {
      this.transitionTo(FSM_STATES.STAGED_SKELETON, 'Fetch trigger');
      this._mountSkeleton(opts.skeletonTemplate);
    }

    var softTimeoutMs = typeof opts.softTimeoutMs === 'number' ? opts.softTimeoutMs : 3500;
    var hardTimeoutMs = typeof opts.hardTimeoutMs === 'number' ? opts.hardTimeoutMs : 8000;

    this.softTimer = setTimeout(function() {
      if (currentToken === self.fetchToken && (self.state === FSM_STATES.STAGED_SKELETON || self.state === FSM_STATES.PARTIAL_COMMIT)) {
        self.transitionTo(FSM_STATES.TIMEOUT_FALLBACK, 'Soft timeout 3.5s');
        showTopProgressBar();
      }
    }, softTimeoutMs);

    this.hardTimer = setTimeout(function() {
      if (currentToken === self.fetchToken && self.state !== FSM_STATES.CONTENT_READY) {
        if (controller && typeof controller.abort === 'function') {
          try { controller.abort('Hard timeout cap reached'); } catch (_) {}
        }
        self.transitionTo(FSM_STATES.ERROR_RETRYABLE, 'Hard timeout 8s');
        hideTopProgressBar();
        self._unmountSkeleton();
        self._renderErrorUI('Request timed out. Please try again.', fetcher, renderer, opts);
      }
    }, hardTimeoutMs);

    return Promise.resolve().then(function() {
      return fetcher(signal);
    }).then(function(freshData) {
      if (currentToken !== self.fetchToken) return freshData;

      self._clearTimers();
      hideTopProgressBar();
      self._unmountSkeleton();

      if (useSWR && key) {
        swrCache.set(key, freshData);
      }

      var applyRender = function() {
        if (typeof renderer === 'function') {
          renderer(freshData);
        }
      };

      var prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!prefersReducedMotion && opts.useViewTransition !== false && typeof document !== 'undefined' && document.startViewTransition) {
        document.startViewTransition(applyRender);
      } else {
        applyRender();
      }

      self.transitionTo(FSM_STATES.CONTENT_READY, 'Fetch success');
      self._markReady(key);
      return freshData;
    }).catch(function(err) {
      if (currentToken !== self.fetchToken) throw err;
      self._clearTimers();
      hideTopProgressBar();
      self._unmountSkeleton();

      if (self.state !== FSM_STATES.ERROR_RETRYABLE) {
        self.transitionTo(FSM_STATES.ERROR_RETRYABLE, err ? err.message : 'Fetch error');
        self._renderErrorUI(err && err.message ? err.message : 'Unable to load content.', fetcher, renderer, opts);
      }
      throw err;
    });
  };

  PLController.prototype.invalidate = function() {
    var key = (this.lastLoadOptions && this.lastLoadOptions.key) || (this.container && this.container.id);
    if (key) swrCache.delete(key);
  };

  PLController.prototype.getState = function() {
    return this.state;
  };

  PLController.prototype.abort = function(reason) {
    this._clearTimers();
    if (this.activeAbortController && typeof this.activeAbortController.abort === 'function') {
      try { this.activeAbortController.abort(reason || 'Manual abort'); } catch (_) {}
    }
    this._unmountSkeleton();
    hideTopProgressBar();
    this.transitionTo(FSM_STATES.IDLE, 'Aborted');
  };

  PLController.prototype.reset = function() {
    this.abort('Controller reset');
    this.transitionTo(FSM_STATES.IDLE, 'Reset');
  };

  // ════════════════════════════════════════════════════════════════════════════
  // 5. Public PLSys Global Interface
  // ════════════════════════════════════════════════════════════════════════════

  var controllers = new Map();

  var PLSys = {
    _initialized: true,
    FSM_STATES: FSM_STATES,

    attach: function(container, options) {
      var el = typeof container === 'string' && typeof document !== 'undefined' ? document.querySelector(container) : container;
      if (!el) return null;
      if (controllers.has(el)) return controllers.get(el);
      var ctrl = new PLController(el, options);
      controllers.set(el, ctrl);
      return ctrl;
    },

    load: function(container, fetcher, renderer, options) {
      var ctrl = this.attach(container, options);
      if (!ctrl) {
        return Promise.reject(new Error('[PLSys] Container target not found'));
      }
      return ctrl.load(fetcher, renderer, options);
    },

    invalidate: function(keyOrContainer) {
      if (typeof keyOrContainer === 'string') {
        var el = typeof document !== 'undefined' ? document.querySelector(keyOrContainer) : null;
        if (el && controllers.has(el)) {
          controllers.get(el).invalidate();
        } else {
          swrCache.delete(keyOrContainer);
        }
      } else if (keyOrContainer && controllers.has(keyOrContainer)) {
        controllers.get(keyOrContainer).invalidate();
      }
    },

    getStatus: function(container) {
      var ctrl = this.attach(container);
      if (!ctrl) return null;
      return {
        state: ctrl.getState(),
        containerId: ctrl.getContainerId(),
        lastDurationMs: ctrl.lastDurationMs
      };
    },

    reset: function(container) {
      var el = typeof container === 'string' && typeof document !== 'undefined' ? document.querySelector(container) : container;
      if (el && controllers.has(el)) {
        controllers.get(el).reset();
      }
    },

    SWRCache: swrCache
  };

  global.PLSys = PLSys;

})(typeof window !== 'undefined' ? window : this);

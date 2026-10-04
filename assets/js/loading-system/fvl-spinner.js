// Path:    assets/js/loading-system/fvl-spinner.js
// Purpose: Standalone FVL Material Spinner subsystem.
//          Operates with zero dependency on the full FVL orchestrator (fvl.js).

(function(window) {
  'use strict';

  var win = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this);
  var doc = (win && win.document) || (typeof document !== 'undefined' ? document : null);

  var CIRCUMFERENCE = 138.23; // 2 * Math.PI * 22

  var CRITICAL_CSS = 
    '@keyframes _fvl_spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }\n' +
    '.fvl-spinner { display: flex; align-items: center; justify-content: center; flex-shrink: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; will-change: transform; }\n' +
    '.fvl-spinner svg { width: 100%; height: 100%; overflow: visible; display: block; backface-visibility: hidden; -webkit-backface-visibility: hidden; }\n' +
    '.fvl-spinner .fvl-track { stroke: var(--fvl-spinner-track-color, var(--fvl-spinner-track, rgba(0, 0, 0, 0.06))); stroke-width: var(--fvl-spinner-stroke-width, 3.5); fill: none; }\n' +
    '.fvl-spinner .fvl-arc { stroke: var(--fvl-spinner-color, var(--fvl-spinner-arc, #227258)); stroke-width: var(--fvl-spinner-stroke-width, 3.5); stroke-linecap: round; stroke-dasharray: 88 132; fill: none; transform-box: fill-box; transform-origin: center; animation: _fvl_spin 0.7s linear infinite; }\n' +
    '.fvl-spinner-inline .fvl-track, .fvl-spinner-inline .fvl-arc { stroke-width: var(--fvl-spinner-stroke-width, 5); }\n' +
    '.fvl-spinner--sm { width: 18px; height: 18px; }\n' +
    '.fvl-spinner--md { width: 32px; height: 32px; }\n' +
    '.fvl-spinner--lg { width: 48px; height: 48px; }\n' +
    '.fvl-spinner--xl { width: 64px; height: 64px; }\n' +
    '.fvl-spinner--speed-fast .fvl-arc { animation-duration: 0.4s !important; }\n' +
    '.fvl-spinner--speed-normal .fvl-arc { animation-duration: 0.7s !important; }\n' +
    '.fvl-spinner--speed-slow .fvl-arc { animation-duration: 1.2s !important; }\n' +
    '.fvl-spinner--stroke-thin .fvl-track, .fvl-spinner--stroke-thin .fvl-arc { stroke-width: 2px !important; }\n' +
    '.fvl-spinner--stroke-medium .fvl-track, .fvl-spinner--stroke-medium .fvl-arc { stroke-width: 3.5px !important; }\n' +
    '.fvl-spinner--stroke-thick .fvl-track, .fvl-spinner--stroke-thick .fvl-arc { stroke-width: 5px !important; }\n' +
    '.fvl-spinner--determinate .fvl-arc { animation: none !important; stroke-dasharray: 138.23px; stroke-dashoffset: 138.23px; transition: stroke-dashoffset 200ms cubic-bezier(0.16, 1, 0.3, 1); }\n' +
'.fvl-spinner--center { margin-left: auto; margin-right: auto; align-self: center; justify-self: center; }\n' +
'.fvl-spinner--align-left { margin-left: 0; margin-right: auto; }\n' +
'.fvl-spinner--align-right { margin-left: auto; margin-right: 0; }\n' +
'.fvl-spinner-wrapper { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; min-height: 48px; }\n' +
'@media (prefers-reduced-motion: reduce) { .fvl-spinner .fvl-arc { animation: none !important; stroke-dasharray: 60 160 !important; } }\n';

  function _ensureStyles() {
    if (!doc || !doc.head) return;
    var existingLink = doc.querySelector && doc.querySelector('link[href*="loading-system.css"]');
    var existingStyle = doc.getElementById && doc.getElementById('fvl-spinner-styles');
    if (!existingStyle) {
      try {
        var styleEl = doc.createElement('style');
        styleEl.id = 'fvl-spinner-styles';
        styleEl.textContent = CRITICAL_CSS;
        doc.head.appendChild(styleEl);
      } catch (_) {}
    }
    
    // In HappyDOM / test runner environments without a live HTTP server, avoid appending external <link> tags that trigger fetch errors
    var isTestEnv = typeof win !== 'undefined' && (win.happyDOM || (win.process && win.process.env && win.process.env.VITEST));
    if (!existingLink && !isTestEnv) {
      try {
        var link = doc.createElement('link');
        link.rel = 'stylesheet';
        link.href = '/assets/css/loading-system.css';
        doc.head.appendChild(link);
      } catch (_) {}
    }
  }

  function renderSVG() {
    return '<svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
           '<circle class="fvl-track" cx="26" cy="26" r="22"/>' +
           '<circle class="fvl-arc" cx="26" cy="26" r="22"/>' +
           '</svg>';
  }

  function resolveTarget(target) {
    if (!target) return null;
    if (typeof target === 'string') {
      return doc ? doc.querySelector(target) : null;
    }
    if (typeof HTMLElement !== 'undefined' && target instanceof HTMLElement) {
      return target;
    }
    if (target && target.nodeType === 1) {
      return target;
    }
    return null;
  }

  function applyVariant(spinnerEl, opts) {
    if (!spinnerEl) return;
    if (typeof opts === 'string') {
      opts = { size: opts };
    }
    opts = opts || {};

    try {
      if (opts.size) {
        if (typeof opts.size === 'number') {
          spinnerEl.style.width = opts.size + 'px';
          spinnerEl.style.height = opts.size + 'px';
        } else if (['sm', 'md', 'lg', 'xl'].indexOf(opts.size) !== -1) {
          ['sm', 'md', 'lg', 'xl'].forEach(function(s) {
            spinnerEl.classList.remove('fvl-spinner--' + s);
          });
          spinnerEl.classList.add('fvl-spinner--' + opts.size);
        }
      }

      if (opts.color) {
        spinnerEl.style.setProperty('--fvl-spinner-color', opts.color);
      }
      if (opts.trackColor) {
        spinnerEl.style.setProperty('--fvl-spinner-track-color', opts.trackColor);
      }

      if (opts.speed) {
        ['fast', 'normal', 'slow'].forEach(function(sp) {
          spinnerEl.classList.remove('fvl-spinner--speed-' + sp);
        });
        if (['fast', 'normal', 'slow'].indexOf(opts.speed) !== -1) {
          spinnerEl.classList.add('fvl-spinner--speed-' + opts.speed);
        }
      }

      if (opts.strokeWidth != null) {
        ['thin', 'medium', 'thick'].forEach(function(sw) {
          spinnerEl.classList.remove('fvl-spinner--stroke-' + sw);
        });
        if (typeof opts.strokeWidth === 'number') {
          spinnerEl.style.setProperty('--fvl-spinner-stroke-width', opts.strokeWidth + 'px');
        } else if (['thin', 'medium', 'thick'].indexOf(opts.strokeWidth) !== -1) {
          spinnerEl.classList.add('fvl-spinner--stroke-' + opts.strokeWidth);
        }
      }

      var extraClass = opts.class || opts.className;
      if (extraClass) {
        extraClass.split(/\s+/).forEach(function(c) {
          if (c) spinnerEl.classList.add(c);
        });
      }

      var alignOpt = opts.align;
      var centerOpt = opts.center === true && alignOpt !== "left" && alignOpt !== "right";
      if (centerOpt) {
        spinnerEl.classList.add("fvl-spinner--center");
      } else if (alignOpt === "left") {
        spinnerEl.classList.add("fvl-spinner--align-left");
      } else if (alignOpt === "right") {
        spinnerEl.classList.add("fvl-spinner--align-right");
      }

      if (opts.determinate || opts.progress != null) {
        spinnerEl.classList.add('fvl-spinner--determinate');
        var val = opts.progress != null ? Number(opts.progress) : 0;
        updateProgress(spinnerEl, val);
      }
    } catch (e) {
      console.warn('[FVLSpinner] applyVariant error:', e);
    }
  }

  function updateProgress(spinnerEl, value) {
    if (!spinnerEl) return;
    try {
      var arc = spinnerEl.querySelector('.fvl-arc');
      if (!arc) return;

      var pct = Math.max(0, Math.min(100, Number(value) || 0));
      var offset = CIRCUMFERENCE * (1 - pct / 100);

      spinnerEl.classList.add('fvl-spinner--determinate');
      arc.style.strokeDasharray = CIRCUMFERENCE + 'px';
      arc.style.strokeDashoffset = offset.toFixed(2) + 'px';
      spinnerEl.setAttribute('aria-valuenow', String(Math.round(pct)));
      spinnerEl.setAttribute('aria-valuemin', '0');
      spinnerEl.setAttribute('aria-valuemax', '100');
    } catch (e) {
      console.warn('[FVLSpinner] updateProgress error:', e);
    }
  }

  function create(opts) {
    _ensureStyles();
    opts = (typeof opts === "string") ? { size: opts } : Object.assign({}, opts);
    if (opts.center === undefined) opts.center = true;

    var el = doc ? doc.createElement('div') : null;
    if (el) {
      el.className = 'fvl-spinner';
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = renderSVG();
      applyVariant(el, opts);
    }

    var handle = {
      element: el,
      updateProgress: function(val) { updateProgress(el, val); },
      setSize: function(sz) { applyVariant(el, { size: sz }); },
      setColor: function(c) { applyVariant(el, { color: c }); },
      setTrackColor: function(tc) { applyVariant(el, { trackColor: tc }); },
      setSpeed: function(sp) { applyVariant(el, { speed: sp }); },
      setStrokeWidth: function(sw) { applyVariant(el, { strokeWidth: sw }); },
      mount: function(target) {
        var t = resolveTarget(target);
        if (t && el) {
          t.appendChild(el);
        }
        return handle;
      },
      unmount: function() {
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
      },
      destroy: function() {
        handle.unmount();
      }
    };

    return handle;
  }

  function mount(target, opts) {
    var handle = create(opts);
    return handle.mount(target);
  }

  function FVLSpinner(opts) {
    return create(opts);
  }

  FVLSpinner.create = create;
  FVLSpinner.mount = mount;
  FVLSpinner.applyVariant = applyVariant;
  FVLSpinner.updateProgress = updateProgress;
  FVLSpinner.renderSVG = renderSVG;

  win.FVLSpinner = FVLSpinner;

  if (!win.FVL) {
    win.FVL = { spinner: FVLSpinner };
  } else if (!win.FVL.spinner) {
    win.FVL.spinner = FVLSpinner;
  }

  if (win.FVLModules) {
    win.FVLModules.Spinner = FVLSpinner;
  }

})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));

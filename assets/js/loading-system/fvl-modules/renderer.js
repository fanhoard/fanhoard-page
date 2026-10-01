// Path:    assets/js/loading-system/fvl-modules/renderer.js
// Purpose: DOM structure builders for each FVL display mode.

(function() {
  'use strict';

  var M = window.FVLModules = window.FVLModules || {};

  var Renderer = (function() {

    function spinnerSVG() {
      if (M.Spinner) {
        return M.Spinner.renderSVG();
      }
      return '<svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
           +   '<circle class="fvl-track" cx="26" cy="26" r="22"/>'
           +   '<circle class="fvl-arc"   cx="26" cy="26" r="22"/>'
           + '</svg>';
    }

    function _applyVariantIfOpted(spinnerEl, inst) {
      if (!spinnerEl || !M.Spinner) return;
      var opts = inst.options || {};
      var vOpts = opts.variant || opts.spinner;
      if (!vOpts && (opts.determinate || opts.progress != null)) {
        vOpts = { determinate: opts.determinate, progress: opts.progress };
      }
      if (vOpts) {
        M.Spinner.applyVariant(spinnerEl, vOpts);
      }
    }

    function applyTheme(rootEl, theme, targetEl) {
      var resolved = theme;
      if (theme === 'auto') {
        resolved = M.Utils.autoTheme(targetEl);
      }
      rootEl.setAttribute('data-fvl-theme', resolved);
    }

    function buildFullscreen(inst) {
      var CONFIG = M.CONFIG;
      var root = M.Utils.DOM.create('div', 'fvl fvl-fullscreen', {
        'role': 'status',
        'aria-live': 'polite',
        'aria-atomic': 'true',
      });
      root.setAttribute(CONFIG.DOM.DATA_MODE, 'fullscreen');
      root.setAttribute(CONFIG.DOM.DATA_ATTR, inst.id);

      if (inst.options.coverAll) {
        root.classList.add('fvl-cover-all');
      }

      var spinner = M.Utils.DOM.create('div', 'fvl-spinner', { 'aria-hidden': 'true' });
      spinner.innerHTML = spinnerSVG();
      _applyVariantIfOpted(spinner, inst);

      var text = M.Utils.DOM.create('div', 'fvl-text');
      var msg  = M.Utils.DOM.create('div', 'fvl-msg');
      var sub  = M.Utils.DOM.create('div', 'fvl-sub');
      text.appendChild(msg);
      text.appendChild(sub);

      root.appendChild(spinner);
      root.appendChild(text);

      inst.spinnerEl = spinner;
      inst.msgEl = msg;
      inst.subEl = sub;

      return root;
    }

    function buildScoped(inst) {
      var CONFIG = M.CONFIG;
      var root = M.Utils.DOM.create('div', 'fvl fvl-scoped', {
        'role': 'status',
        'aria-live': 'polite',
        'aria-hidden': 'true',
      });
      root.setAttribute(CONFIG.DOM.DATA_MODE, 'scoped');
      root.setAttribute(CONFIG.DOM.DATA_ATTR, inst.id);

      var inner = M.Utils.DOM.create('div', 'fvl-scoped-inner');
      var spinner = M.Utils.DOM.create('div', 'fvl-spinner', { 'aria-hidden': 'true' });
      spinner.innerHTML = spinnerSVG();
      _applyVariantIfOpted(spinner, inst);

      inner.appendChild(spinner);
      if (inst.options.message) {
        var msg = M.Utils.DOM.create('div', 'fvl-msg');
        msg.textContent = inst.options.message;
        inner.appendChild(msg);
        inst.msgEl = msg;
      }
      root.appendChild(inner);

      inst.spinnerEl = spinner;

      if (inst.options.overlay) {
        root.classList.add('fvl-scoped-overlay');
      }

      return root;
    }

    function buildInline(inst) {
      var CONFIG = M.CONFIG;
      var wrap = M.Utils.DOM.create('span', 'fvl fvl-inline', { 'aria-hidden': 'true' });
      wrap.setAttribute(CONFIG.DOM.DATA_MODE, 'inline');
      wrap.setAttribute(CONFIG.DOM.DATA_ATTR, inst.id);

      var spinner = M.Utils.DOM.create('span', 'fvl-spinner fvl-spinner-inline', { 'aria-hidden': 'true' });
      spinner.innerHTML = spinnerSVG();
      _applyVariantIfOpted(spinner, inst);

      wrap.appendChild(spinner);

      if (inst.options.message) {
        var msg = M.Utils.DOM.create('span', 'fvl-inline-msg');
        msg.textContent = inst.options.message;
        wrap.appendChild(msg);
        inst.msgEl = msg;
      }

      inst.spinnerEl = spinner;
      return wrap;
    }

    function buildTopbar(inst) {
      var CONFIG = M.CONFIG;
      var root = M.Utils.DOM.create('div', 'fvl fvl-topbar', { 'role': 'status', 'aria-live': 'polite' });
      root.setAttribute(CONFIG.DOM.DATA_MODE, 'topbar');
      root.setAttribute(CONFIG.DOM.DATA_ATTR, inst.id);

      var bar = M.Utils.DOM.create('div', 'fvl-topbar-bar');
      if (inst.options.progress != null) {
        bar.classList.add('fvl-topbar-determinate');
        bar.style.width = Math.max(0, Math.min(1, inst.options.progress)) * 100 + '%';
      } else {
        bar.classList.add('fvl-topbar-indeterminate');
      }
      root.appendChild(bar);

      inst.barEl = bar;
      return root;
    }

    function build(inst) {
      var root;
      switch (inst.mode) {
        case 'scoped':    root = buildScoped(inst);    break;
        case 'inline':    root = buildInline(inst);    break;
        case 'topbar':    root = buildTopbar(inst);    break;
        case 'fullscreen':
        default:          root = buildFullscreen(inst); break;
      }
      applyTheme(root, inst.options.theme, inst.targetEl);
      return root;
    }

    return Object.freeze({ build: build, applyTheme: applyTheme, spinnerSVG: spinnerSVG });
  })();

  M.Renderer = Renderer;
})();

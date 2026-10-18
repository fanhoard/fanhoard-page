// Path:    assets/js/loading-system/fvl-modules/renderer.js
// Purpose: DOM structure builders for each FVL display mode.

(function() {
  'use strict';

  var M = window.FVLModules = window.FVLModules || {};

  var Renderer = (function() {

    
    function _applyCentering(spinnerEl, opts) {
      if (!spinnerEl || !opts) return;
      var align = opts.align;
      var isCentered = (opts.center === true || ((opts.bare || opts.spinnerOnly) && opts.center !== false)) && align !== "left" && align !== "right";
      if (isCentered) {
        spinnerEl.classList.add("fvl-spinner--center");
      } else if (align === "left") {
        spinnerEl.classList.add("fvl-spinner--align-left");
      } else if (align === "right") {
        spinnerEl.classList.add("fvl-spinner--align-right");
      }
    }

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
      if (!vOpts && (opts.determinate || opts.progress != null || opts.size || opts.color || opts.trackColor || opts.speed || opts.strokeWidth)) {
        vOpts = {
          size: opts.size,
          color: opts.color,
          trackColor: opts.trackColor,
          speed: opts.speed,
          strokeWidth: opts.strokeWidth,
          determinate: opts.determinate,
          progress: opts.progress,
          class: opts.class || opts.className
        };
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
      var opts = inst.options || {};
      var isBare = !!opts.bare;
      var isSpinnerOnly = isBare || !!opts.spinnerOnly;
      var isChromeless = isBare || !!opts.chromeless;

      var rootClasses = 'fvl fvl-fullscreen';
      if (isChromeless) rootClasses += ' fvl-chromeless';
      if (isBare) rootClasses += ' fvl-bare';

      var role = opts.role || "dialog";
      var rootAttrs = { "role": role, "aria-live": "polite", "aria-atomic": "true" };
      if (role === "dialog") rootAttrs["aria-modal"] = "true";
      var root = M.Utils.DOM.create("div", rootClasses, rootAttrs);
      root.setAttribute(CONFIG.DOM.DATA_MODE, 'fullscreen');
      root.style.touchAction = 'none';
      root.style.overscrollBehavior = 'none';
      root.setAttribute(CONFIG.DOM.DATA_ATTR, inst.id);

      if (opts.coverAll) {
        root.classList.add('fvl-cover-all');
      }

      var spinner = M.Utils.DOM.create('div', 'fvl-spinner', { 'aria-hidden': 'true' });
      spinner.innerHTML = spinnerSVG();
      _applyVariantIfOpted(spinner, inst);
      _applyCentering(spinner, opts);
      root.appendChild(spinner);
      inst.spinnerEl = spinner;

      if (isSpinnerOnly) {
        root.setAttribute('aria-label', opts.ariaLabel || opts.message || 'Loading');
      } else {
        var text = M.Utils.DOM.create('div', 'fvl-text');
        var msg  = M.Utils.DOM.create('div', 'fvl-msg');
        var sub  = M.Utils.DOM.create('div', 'fvl-sub');
        text.appendChild(msg);
        text.appendChild(sub);
        root.appendChild(text);

        inst.msgEl = msg;
        inst.subEl = sub;
      }

      return root;
    }

    function buildScoped(inst) {
      var CONFIG = M.CONFIG;
      var opts = inst.options || {};
      var isBare = !!opts.bare;
      var isSpinnerOnly = isBare || !!opts.spinnerOnly;
      var isChromeless = isBare || !!opts.chromeless;

      var rootClasses = 'fvl fvl-scoped';
      if (isChromeless) rootClasses += ' fvl-chromeless';
      if (isBare) rootClasses += ' fvl-bare';
      if (opts.overlay && !isChromeless) rootClasses += ' fvl-scoped-overlay';

      var role = opts.role || "progressbar";
      var root = M.Utils.DOM.create("div", rootClasses, {
        "role": role,
        "aria-live": "polite",
        "aria-busy": "true",
      });
      root.setAttribute(CONFIG.DOM.DATA_MODE, 'scoped');
      root.setAttribute(CONFIG.DOM.DATA_ATTR, inst.id);

      var inner = M.Utils.DOM.create('div', 'fvl-scoped-inner');
      var spinner = M.Utils.DOM.create('div', 'fvl-spinner', { 'aria-hidden': 'true' });
      spinner.innerHTML = spinnerSVG();
      _applyVariantIfOpted(spinner, inst);
      _applyCentering(spinner, opts);
      inner.appendChild(spinner);

      if (!isSpinnerOnly && opts.message) {
        var msg = M.Utils.DOM.create('div', 'fvl-msg');
        msg.textContent = opts.message;
        inner.appendChild(msg);
        inst.msgEl = msg;
      }

      root.appendChild(inner);
      inst.spinnerEl = spinner;

      if (isSpinnerOnly) {
        root.setAttribute('aria-label', opts.ariaLabel || opts.message || 'Loading');
      }

      return root;
    }

    function buildInline(inst) {
      var CONFIG = M.CONFIG;
      var opts = inst.options || {};
      var isBare = !!opts.bare;
      var isSpinnerOnly = isBare || !!opts.spinnerOnly;
      var isChromeless = isBare || !!opts.chromeless;

      var wrapClasses = 'fvl fvl-inline';
      if (isChromeless) wrapClasses += ' fvl-chromeless';
      if (isBare) wrapClasses += ' fvl-bare';

      var role = opts.role || "progressbar";
      var wrap = M.Utils.DOM.create("span", wrapClasses, { "role": role, "aria-busy": "true" });
      wrap.setAttribute(CONFIG.DOM.DATA_MODE, 'inline');
      wrap.setAttribute(CONFIG.DOM.DATA_ATTR, inst.id);

      var spinner = M.Utils.DOM.create('span', 'fvl-spinner fvl-spinner-inline', { 'aria-hidden': 'true' });
      spinner.innerHTML = spinnerSVG();
      _applyVariantIfOpted(spinner, inst);

      wrap.appendChild(spinner);

      if (!isSpinnerOnly && opts.message) {
        var msg = M.Utils.DOM.create('span', 'fvl-inline-msg');
        msg.textContent = opts.message;
        wrap.appendChild(msg);
        inst.msgEl = msg;
      }

      inst.spinnerEl = spinner;
      return wrap;
    }

    function buildTopbar(inst) {
      var CONFIG = M.CONFIG;
      var opts = inst.options || {};
      var isBare = !!opts.bare;
      var isChromeless = isBare || !!opts.chromeless;

      var rootClasses = 'fvl fvl-topbar';
      if (isChromeless) rootClasses += ' fvl-chromeless';
      if (isBare) rootClasses += ' fvl-bare';

      var root = M.Utils.DOM.create('div', rootClasses, { 'role': 'status', 'aria-live': 'polite' });
      root.setAttribute(CONFIG.DOM.DATA_MODE, 'topbar');
      root.setAttribute(CONFIG.DOM.DATA_ATTR, inst.id);

      var bar = M.Utils.DOM.create('div', 'fvl-topbar-bar');
      if (opts.progress != null) {
        bar.classList.add('fvl-topbar-determinate');
        bar.style.width = Math.max(0, Math.min(1, opts.progress)) * 100 + '%';
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

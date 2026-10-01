// Path:    assets/js/loading-system/fvl-modules/spinner.js
// Purpose: Material spinner variant subsystem (sizes, determinate, color tokens, standalone API).

(function(window) {
  'use strict';

  var M = window.FVLModules = window.FVLModules || {};

  var CIRCUMFERENCE = 138.23; // 2 * Math.PI * 22

  /**
   * @typedef {Object} SpinnerOptions
   * @property {'sm'|'md'|'lg'|'xl'|number} [size] - Spinner size variant or pixel dimension.
   * @property {boolean} [determinate=false] - Whether spinner is determinate (progress-based).
   * @property {number} [progress=0] - Progress percentage (0-100) for determinate spinner.
   * @property {string} [color] - Spinner arc color (CSS color or token).
   * @property {string} [trackColor] - Spinner background track color.
   * @property {string} [class] - Additional CSS class names.
   * @property {string} [className] - Additional CSS class names.
   */

  var Spinner = (function() {

    function renderSVG() {
      return '<svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
           +   '<circle class="fvl-track" cx="26" cy="26" r="22"/>'
           +   '<circle class="fvl-arc"   cx="26" cy="26" r="22"/>'
           + '</svg>';
    }

    /**
     * Apply variant options onto an existing spinner DOM element.
     * @param {HTMLElement} spinnerEl
     * @param {SpinnerOptions|string} [opts]
     */
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
            spinnerEl.classList.add('fvl-spinner--' + opts.size);
          }
        }

        if (opts.color) {
          spinnerEl.style.setProperty('--fvl-spinner-color', opts.color);
        }
        if (opts.trackColor) {
          spinnerEl.style.setProperty('--fvl-spinner-track-color', opts.trackColor);
        }

        var extraClass = opts.class || opts.className;
        if (extraClass) {
          extraClass.split(/\s+/).forEach(function(c) {
            if (c) spinnerEl.classList.add(c);
          });
        }

        if (opts.determinate || opts.progress != null) {
          spinnerEl.classList.add('fvl-spinner--determinate');
          var val = opts.progress != null ? Number(opts.progress) : 0;
          updateProgress(spinnerEl, val);
        }
      } catch (e) {
        console.warn('[FVL:Spinner] applyVariant error:', e);
      }
    }

    /**
     * Update progress (0-100) on a spinner element.
     * @param {HTMLElement} spinnerEl
     * @param {number} value
     */
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
        console.warn('[FVL:Spinner] updateProgress error:', e);
      }
    }

    /**
     * Programmatic factory to create a standalone spinner object.
     * @param {SpinnerOptions|string} [opts]
     * @returns {{ element: HTMLElement, updateProgress: function(number), setSize: function(string|number), setColor: function(string), setTrackColor: function(string), destroy: function() }}
     */
    function create(opts) {
      var doc = (typeof window !== 'undefined' && window.document) || document;
      var el = doc.createElement('div');
      el.className = 'fvl-spinner';
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = renderSVG();

      applyVariant(el, opts);

      return {
        element: el,
        updateProgress: function(val) { updateProgress(el, val); },
        setSize: function(sz) { applyVariant(el, { size: sz }); },
        setColor: function(c) { applyVariant(el, { color: c }); },
        setTrackColor: function(tc) { applyVariant(el, { trackColor: tc }); },
        destroy: function() {
          if (el && el.parentNode) {
            el.parentNode.removeChild(el);
          }
        }
      };
    }

    return Object.freeze({
      create: create,
      applyVariant: applyVariant,
      updateProgress: updateProgress,
      renderSVG: renderSVG,
    });
  })();

  M.Spinner = Spinner;
})(typeof window !== 'undefined' ? window : globalThis);

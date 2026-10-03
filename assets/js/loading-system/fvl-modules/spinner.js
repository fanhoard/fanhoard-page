// Path:    assets/js/loading-system/fvl-modules/spinner.js
// Purpose: Material spinner variant subsystem (sizes, determinate, color tokens, standalone API bridge).

(function(window) {
  'use strict';

  var win = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this);
  var M = win.FVLModules = win.FVLModules || {};

  if (win.FVLSpinner) {
    M.Spinner = win.FVLSpinner;
  } else {
    // If fvl-spinner.js was not loaded beforehand, M.Spinner will be bound when fvl-spinner.js loads.
    // As fallback, delegate to win.FVLSpinner if defined later or provide stub.
    M.Spinner = {
      renderSVG: function() {
        return win.FVLSpinner ? win.FVLSpinner.renderSVG() :
          '<svg viewBox="0 0 52 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
          '<circle class="fvl-track" cx="26" cy="26" r="22"/>' +
          '<circle class="fvl-arc" cx="26" cy="26" r="22"/>' +
          '</svg>';
      },
      applyVariant: function(el, opts) {
        if (win.FVLSpinner) win.FVLSpinner.applyVariant(el, opts);
      },
      updateProgress: function(el, val) {
        if (win.FVLSpinner) win.FVLSpinner.updateProgress(el, val);
      },
      create: function(opts) {
        return win.FVLSpinner ? win.FVLSpinner.create(opts) : null;
      },
      mount: function(target, opts) {
        return win.FVLSpinner ? win.FVLSpinner.mount(target, opts) : null;
      }
    };
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));

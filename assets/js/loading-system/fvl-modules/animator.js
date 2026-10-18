// Path:    assets/js/loading-system/fvl-modules/animator.js
// Purpose: Enter and exit transition animations (double-rAF, reduced-motion) for FVL.

(function(window) {
  'use strict';

  var M = window.FVLModules = window.FVLModules || {};

  var Animator = (function() {

    function _doubleRaf(fn) {
      requestAnimationFrame(function() {
        requestAnimationFrame(fn);
      });
    }

    function enter(inst, done) {
      var el = inst.rootEl;
      if (!el) { if (done) done(); return; }

      var reduced = M.Utils.prefersReducedMotion();
      el.classList.add('fvl-entering');

      if (reduced) {
        el.classList.remove('fvl-entering');
        el.classList.add('fvl-shown');
        if (done) done();
        return;
      }

      _doubleRaf(function() {
        el.classList.remove('fvl-entering');
        el.classList.add('fvl-shown');
        var onEnd = function() {
          el.removeEventListener('animationend', onEnd);
          el.removeEventListener('transitionend', onEnd);
          if (done) done();
        };
        el.addEventListener('animationend', onEnd, { once: true });
        el.addEventListener('transitionend', onEnd, { once: true });
        var enterTime = (M.CONFIG && M.CONFIG.TIMING && M.CONFIG.TIMING.ENTER) || 140;
        setTimeout(onEnd, enterTime + 80);
      });
    }

    function leave(inst, done) {
      var el = inst.rootEl;
      if (!el) { if (done) done(); return; }

      var reduced = M.Utils.prefersReducedMotion();
      el.classList.remove('fvl-shown');
      el.classList.add('fvl-leaving');

      if (reduced) {
        if (done) done();
        return;
      }

      var onEnd = function() {
        el.removeEventListener('animationend', onEnd);
        el.removeEventListener('transitionend', onEnd);
        if (done) done();
      };
      el.addEventListener('animationend', onEnd, { once: true });
      el.addEventListener('transitionend', onEnd, { once: true });
      var leaveTime = (M.CONFIG && M.CONFIG.TIMING && M.CONFIG.TIMING.LEAVE) || 180;
      setTimeout(onEnd, leaveTime + 80);
    }

    return Object.freeze({ enter: enter, leave: leave });
  })();

  M.Animator = Animator;
})(typeof window !== 'undefined' ? window : globalThis);

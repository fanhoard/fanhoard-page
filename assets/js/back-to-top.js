// Path:    assets/js/back-to-top.js
// Purpose: Back-to-top button — scroll detection, show/hide, a11y & prefers-reduced-motion.
//          CSS lives in assets/css/back-to-top.css

document.addEventListener('DOMContentLoaded', function() {
  var THRESHOLD = 120;
  var lastY = window.scrollY, ticking = false;

  var btn = document.getElementById('back-to-top');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'back-to-top';
    btn.type = 'button';
    btn.className = 'btt-hidden';
    btn.setAttribute('aria-label', 'Back to top');
    btn.setAttribute('aria-hidden', 'true');
    btn.style.touchAction = 'manipulation';
    btn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <polyline points="16.5,13.5 12,9 7.5,13.5" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
    document.body.appendChild(btn);
  } else {
    btn.type = 'button';
    if (!btn.getAttribute('aria-label')) {
      btn.setAttribute('aria-label', 'Back to top');
    }
  }

  function scrollToTop() {
    var prefersReducedMotion = typeof window !== 'undefined' &&
                                window.matchMedia &&
                                window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    });
  }

  btn.addEventListener('click', scrollToTop);
  btn.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollToTop();
    }
  });

  function updateBtt() {
    var y = window.scrollY;
    var up = y < lastY || y <= THRESHOLD;
    var over = y > THRESHOLD;

    if (over && up) {
      btn.className = 'btt-shown';
      btn.removeAttribute('aria-hidden');
    } else {
      btn.className = 'btt-hidden';
      btn.setAttribute('aria-hidden', 'true');
    }

    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', function() {
    if (!ticking) {
      requestAnimationFrame(updateBtt);
      ticking = true;
    }
  }, { passive: true });
});

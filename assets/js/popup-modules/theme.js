// Path:    assets/js/popup-modules/theme.js
// Purpose: Theme application for popup instances.
//          Applies CSS custom properties to popup elements based on the
//          selected theme ('light', 'dark', 'brand').
//          Uses FanHoard design tokens from tokens.css.
// Used by: engine.js

(function(M) {
  'use strict';

  /**
   * Theme token maps. Each key is a CSS variable, each value is the
   * token value from tokens.css. This keeps popup styling 100% aligned
   * with the rest of the FanHoard design system.
   */
  var THEMES = Object.freeze({

    light: Object.freeze({
      '--fp-bg'                : 'var(--surface-card)',
      '--fp-bg-alpha'          : 'rgba(255, 255, 255, 0.94)',
      '--fp-text'              : 'var(--fv-text-primary)',
      '--fp-text-heading'      : 'var(--text-main)',
      '--fp-text-secondary'    : 'var(--fv-text-secondary)',
      '--fp-text-muted'        : 'var(--text-faint)',
      '--fp-text-inverse'      : 'var(--fv-text-inverse)',
      '--fp-border'            : 'var(--border-subtle)',
      '--fp-border-strong'     : 'var(--color-brand-primary)',
      '--fp-accent'            : 'var(--fv-brand-teal)',
      '--fp-accent-light'      : 'var(--fv-brand-teal-light)',
      '--fp-accent-text'       : '#ffffff',
      '--fp-close-hover-bg'    : 'rgba(0, 0, 0, 0.04)',
      '--fp-overlay-bg'        : 'rgba(15, 23, 42, 0.32)',
      '--fp-overlay-bg-block'  : 'rgba(15, 23, 42, 0.45)',
      '--fp-radius'            : 'var(--radius-xl)',
      '--fp-shadow'            : 'var(--shadow-lg)',
      '--fp-divider'           : 'rgba(0, 0, 0, 0.06)',
    }),

    dark: Object.freeze({
      '--fp-bg'                : '#1E293B',
      '--fp-bg-alpha'          : 'rgba(30, 41, 59, 0.94)',
      '--fp-text'              : '#F8FAFC',
      '--fp-text-heading'      : '#F8FAFC',
      '--fp-text-secondary'    : '#CBD5E1',
      '--fp-text-muted'        : '#94A3B8',
      '--fp-text-inverse'      : '#0F172A',
      '--fp-border'            : 'rgba(255, 255, 255, 0.08)',
      '--fp-border-strong'     : 'rgba(45, 212, 191, 0.4)',
      '--fp-accent'            : 'var(--fv-brand-teal-light)',
      '--fp-accent-light'      : 'var(--color-teal-400)',
      '--fp-accent-text'       : '#0F172A',
      '--fp-close-hover-bg'    : 'rgba(255, 255, 255, 0.08)',
      '--fp-overlay-bg'        : 'rgba(0, 0, 0, 0.5)',
      '--fp-overlay-bg-block'  : 'rgba(0, 0, 0, 0.65)',
      '--fp-radius'            : 'var(--radius-xl)',
      '--fp-shadow'            : 'var(--shadow-lg)',
      '--fp-divider'           : 'rgba(255, 255, 255, 0.06)',
    }),

    brand: Object.freeze({
      '--fp-bg'                : 'var(--surface-card)',
      '--fp-bg-alpha'          : 'rgba(255, 255, 255, 0.85)',
      '--fp-text'              : 'var(--fv-text-primary)',
      '--fp-text-heading'      : 'var(--text-main)',
      '--fp-text-secondary'    : 'var(--text-muted)',
      '--fp-text-muted'        : 'var(--text-faint)',
      '--fp-text-inverse'      : '#ffffff',
      '--fp-border'            : 'rgba(13, 148, 136, 0.25)',
      '--fp-border-strong'     : 'var(--color-brand-primary)',
      '--fp-accent'            : 'var(--fv-brand-teal)',
      '--fp-accent-light'      : 'var(--fv-brand-teal-light)',
      '--fp-accent-text'       : '#ffffff',
      '--fp-close-hover-bg'    : 'rgba(19, 180, 127, 0.08)',
      '--fp-overlay-bg'        : 'rgba(19, 180, 127, 0.1)',
      '--fp-overlay-bg-block'  : 'rgba(19, 180, 127, 0.25)',
      '--fp-radius'            : 'var(--radius-xl)',
      '--fp-shadow'            : 'var(--shadow-lg)',
      '--fp-divider'           : 'rgba(19, 180, 127, 0.1)',
    }),
  });

  /**
   * Apply theme tokens to a popup root element.
   *
   * @param {HTMLElement} rootEl
   * @param {string} themeName - 'light'|'dark'|'brand'
   */
  function apply(rootEl, themeName) {
    var tokens = THEMES[themeName] || THEMES.light;
    var cssText = '';
    for (var key in tokens) {
      cssText += key + ':' + tokens[key] + ';';
    }
    rootEl.style.cssText += cssText;

    // Apply theme-specific overlay styling
    var overlayEl = rootEl.previousElementSibling;
    if (overlayEl && overlayEl.hasAttribute('data-fp-overlay')) {
      var overlayBg = rootEl.classList.contains('fp-blocking')
        ? tokens['--fp-overlay-bg-block']
        : tokens['--fp-overlay-bg'];
      overlayEl.style.backgroundColor = overlayBg;
    }
  }

  /**
   * Listen for system dark mode changes and update popups if needed.
   * Currently a no-op placeholder — can be expanded to auto-switch themes.
   */

  M.ThemeService = Object.freeze({ apply, THEMES });

})(window.PopupModules = window.PopupModules || {});
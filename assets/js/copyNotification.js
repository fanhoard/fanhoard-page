// Path:    assets/js/copyNotification.js
// Purpose: Premium copy feedback notification — clean white capsule surface, fade-only animation.
//          Optionally resolves item name from ConDataService when name is not provided.
//          Zero coupling: works with or without ConDataService present.
// Used by: home.js, search-ui.js, any system that triggers a copy action

(function(global) {
  'use strict';
  
  // ── Timing constants ──────────────────────────────────────
  const FADE_IN_MS = 260;
  const DISPLAY_MS = 1800;
  const FADE_OUT_MS = 300;
  
  const STYLE_ID = 'cn-styles-v3';
  
  // ── i18n — "Copied" label ─────────────────────────────────
  const COPIED_LABEL = { th: 'คัดลอกแล้ว', en: 'Copied' };
  
  // ── Internal state ────────────────────────────────────────
  let _activeEl = null;
  let _holdTimer = null;
  
  // ── Style injection (idempotent) ──────────────────────────
  function _injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      /* ── Clean White Capsule Surface ─────────────────────── */
      .cn-capsule {
        position: fixed;
        bottom: calc(120px + env(safe-area-inset-bottom, 0px)); 
        left: 50%;
        transform: translateX(-50%);
        z-index: var(--z-toast, 800);

        display: inline-flex;
        align-items: center;
        
        padding: 12px 20px !important;
        border-radius: 12px;

        /* Pure white canvas surface with hairline border */
        background: #ffffff;
        border: 1px solid rgba(0, 0, 0, 0.06);
        box-shadow: none;

        /* Typography */
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 14px !important;
        color: #0f172a;
        white-space: nowrap;
        pointer-events: none;
        user-select: none;
        -webkit-user-select: none;

        opacity: 0;
        will-change: opacity, transform;
      }

      /* ── Character / Icon ──────────────────────────────── */
      .cn-char {
        font-size: 1.3em !important;
        line-height: 1;
        flex-shrink: 0;
        margin-right: 12px;
      }

      /* ── Primary Label (WCAG AA Dark Teal) ─────────────── */
      .cn-label {
        font-weight: 600;
        font-size: 0.95em !important;
        letter-spacing: 0.01em;
        color: #0f766e;
        flex-shrink: 0;
      }

      /* ── Hairline Divider ──────────────────────────────── */
      .cn-divider {
        width: 1px;
        height: 14px;
        background: rgba(0, 0, 0, 0.06);
        flex-shrink: 0;
        margin: 0 12px;
      }

      /* ── Secondary Name ────────────────────────────────── */
      .cn-name {
        font-size: 0.9em !important;
        font-weight: 500;
        color: #64748b;
        letter-spacing: 0.01em;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* ── Motion ────────────────────────────────────────── */
      @media (prefers-reduced-motion: reduce) {
        .cn-capsule { transition: none !important; }
      }
    `;
    
    document.head.appendChild(s);
  }

  // ── Build the capsule DOM element ─────────────────────────
  function _buildCapsule(text, label, name) {
    const el = document.createElement('div');
    el.className = 'cn-capsule';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-atomic', 'true');
    el.setAttribute('aria-label', label + (name ? ': ' + name : ''));
    
    if (text) {
      const charEl = document.createElement('span');
      charEl.className = 'cn-char';
      charEl.setAttribute('aria-hidden', 'true');
      charEl.textContent = text;
      el.appendChild(charEl);
    }
    
    const labelEl = document.createElement('span');
    labelEl.className = 'cn-label';
    labelEl.textContent = label;
    el.appendChild(labelEl);
    
    if (name) {
      const divider = document.createElement('span');
      divider.className = 'cn-divider';
      divider.setAttribute('aria-hidden', 'true');
      el.appendChild(divider);
      
      const nameEl = document.createElement('span');
      nameEl.className = 'cn-name';
      nameEl.textContent = name;
      el.appendChild(nameEl);
    }
    
    return el;
  }
  
  // ── Dismiss the active notification ───────────────────────
  function _dismiss() {
    if (!_activeEl) return;
    
    const el = _activeEl;
    _activeEl = null;
    
    if (_holdTimer) {
      clearTimeout(_holdTimer);
      _holdTimer = null;
    }
    
    el.style.transition = `opacity ${FADE_OUT_MS}ms ease-in`;
    el.style.opacity = '0';
    
    setTimeout(() => el.parentNode?.removeChild(el), FADE_OUT_MS + 40);
  }
  
  // ── Show notification ─────────────────────────────────────
  async function showCopyNotification({ text, name, typeId, lang } = {}) {
    _injectStyles();
    
    const resolvedLang = lang ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('selectedLang')) ||
      'en';
    
    const label = COPIED_LABEL[resolvedLang] || COPIED_LABEL.en;
    let resolvedName = (typeof name === 'string') ? name.trim() : '';
    
    if (!resolvedName && text) {
      const svc = global.ConDataService;
      if (svc && typeof svc.resolveItem === 'function') {
        try {
          const item = await svc.resolveItem({ text, lang: resolvedLang });
          if (item?.displayName) resolvedName = item.displayName;
        } catch (_) {
        }
      }
    }
    
    _dismiss();
    
    const el = _buildCapsule(text, label, resolvedName);
    document.body.appendChild(el);
    _activeEl = el;
    
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (_activeEl !== el) return;
        el.style.transition = `opacity ${FADE_IN_MS}ms ease-out`;
        el.style.opacity = '1';
      });
    });
    
    _holdTimer = setTimeout(_dismiss, FADE_IN_MS + DISPLAY_MS);
  }
  
  global.showCopyNotification = showCopyNotification;
  
})(typeof window !== 'undefined' ? window : this);

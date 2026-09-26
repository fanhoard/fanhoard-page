(function () {
  // Very small early bootstrap to show UI + cached content ASAP.
  if (window._navCoreEarlyBoot) return;
  window._navCoreEarlyBoot = true;

  // Minimal helpers
  const q = s => document.querySelector(s);
  const ce = (t, attrs = {}) => {
    const el = document.createElement(t);
    Object.keys(attrs).forEach(k => {
      if (k === 'text') el.textContent = attrs[k];
      else if (k === 'html') el.innerHTML = attrs[k];
      else if (k === 'class') el.className = attrs[k];
      else el.setAttribute(k, attrs[k]);
    });
    return el;
  };

  // Ensure minimal DOM exists
  function ensureDom() {
    if (!q('header')) {
      const h = ce('header');
      const logo = ce('div', { class: 'logo' });
      h.appendChild(logo);
      document.body.prepend(h);
    }
    if (!q('#nav-list')) {
      const nav = ce('nav', { 'aria-label': 'Content type navigation' });
      const ul = ce('ul', { id: 'nav-list' });
      nav.appendChild(ul);
      const header = q('header');
      header?.appendChild(nav);
    }
    if (!q('#sub-buttons-container')) {
      const sn = ce('div', { id: 'sub-nav', style: 'display:none' });
      const inner = ce('div', { class: 'hj' });
      const sbc = ce('div', { id: 'sub-buttons-container' });
      inner.appendChild(sbc);
      sn.appendChild(inner);
      const header = q('header');
      if (header?.nextSibling) header.parentNode.insertBefore(sn, header.nextSibling);
      else document.body.insertBefore(sn, header?.nextSibling || null);
    }
    if (!q('#content-loading')) {
      const c = ce('div', { id: 'content-loading' });
      c.style.minHeight = '220px';
      c.style.padding = '16px';
      const fvApp = document.getElementById('fv-app');
      if (fvApp) fvApp.appendChild(c);
      else document.body.appendChild(c);
    }
  }

  // Lightweight inline overlay: disabled in PLSys V2 (non-blocking skeletons used instead)
  function showEarlyOverlay() {
    return;
  }

  function hideEarlyOverlay() {
    try { const e = q('#nc-early-overlay'); if (e) e.remove(); } catch (_) {}
  }

  // Try to read config from browser HTTP cache (force-cache) then network fallback.
  async function fetchButtonsConfig() {
    const url = '/assets/json/buttons.json';
    if (!navigator.onLine) {
      try {
        const resp = await fetch(url, { cache: 'force-cache' });
        if (resp && resp.ok) return resp.json();
      } catch (_) {}
      return null;
    }
    try {
      const resp = await fetch(url, { cache: 'force-cache' });
      if (resp && resp.ok) return await resp.json();
    } catch (_) {}
    try {
      const resp2 = await fetch(url, { cache: 'no-store' });
      if (resp2 && resp2.ok) return await resp2.json();
    } catch (_) {}
    return null;
  }

  // Minimal renderer: render main buttons and first content items (fast)
  async function renderMinimal(uiConfig) {
    const lang = localStorage.getItem('selectedLang') || 'en';
    const mainButtons = (uiConfig && uiConfig.mainButtons) || [];
    const ul = document.getElementById('nav-list');
    if (!ul) return;

    ul.innerHTML = '';
    let def = null;
    for (const cfg of mainButtons) {
      const label = cfg[`${lang}_label`] || cfg.en_label || cfg.url || cfg.jsonFile || '…';
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'main-button';
      btn.textContent = label;
      btn.dataset.url = cfg.url || cfg.jsonFile || '';
      btn.onclick = () => {
        try { window.location.search = `?type=${encodeURIComponent(btn.dataset.url)}__`; } catch (_) {}
      };
      li.appendChild(btn);
      ul.appendChild(li);
      if (cfg.isDefault && !def) def = cfg;
    }

    const chosen = def || mainButtons[0];
    if (!chosen) return;

    const activeBtn = ul.querySelector('button');
    if (activeBtn) activeBtn.classList.add('active');
  }

  // Fire off early bootstrap — do not block
  try {
    ensureDom();
    fetchButtonsConfig().then(cfg => {
      if (cfg) renderMinimal(cfg).catch(() => {});
    }).catch(() => {});
  } catch (e) {}
})();

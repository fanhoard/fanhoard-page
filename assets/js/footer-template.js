// Footer Injection – Simple & Non-Invasive
// ✓ ไม่แตะ <body>, ไม่สร้าง wrapper, ไม่จัด layout
// ✓ แค่ fetch template แล้ว append หรือ replace mount target เท่านั้น

(function() {
  const FOOTER_CSS_PATH = '/assets/css/footer.css';
  const FOOTER_TEMPLATE_PATH = '/assets/template-html/footer-template.html';
  
  if (window.__fanhoardFooterInjected) return;
  window.__fanhoardFooterInjected = true;
  
  /* ── Load CSS ─────────────────────────────────────── */
  function loadCSS() {
    const already = [...document.styleSheets].some(
      s => s.href && s.href.includes('footer.css')
    );
    if (already) return;
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FOOTER_CSS_PATH;
    document.head.appendChild(link);
  }
  
  /* ── Inject footer HTML ───────────────────────────── */
  function inject(html) {
    if (document.querySelector('footer.fv-footer a, footer.footer-minimal a')) return;
    
    const tmp = document.createElement('div');
    tmp.innerHTML = html.trim();
    const footerEl = tmp.querySelector('footer') || tmp.firstElementChild;
    if (!footerEl) return;

    // เติม prefix ภาษาตามภาษาของหน้า (ไม่มี = ค่าเริ่มต้น en) — ไม่มีการเปลี่ยนเส้นทางอัตโนมัติ
    try {
      const built = document.documentElement.getAttribute('data-fv-built');
      const m = (location.pathname || '').match(/^\/(en|th)(\/|$)/);
      const lang = built || (m ? m[1] : null) || 'en';
      footerEl.querySelectorAll('a[href^="/"]').forEach(a => {
        const href = a.getAttribute('href') || '';
        if (!href || /^\/(en|th)(\/|$)/.test(href)) return;
        if (/^\/(assets|api|_|\.well-known)/.test(href)) return;
        const suffix = (href.endsWith('/') || /[?#]/.test(href)) ? href : href + '/';
        a.setAttribute('href', '/' + lang + suffix);
      });
    } catch (e) {}

    const mount = document.getElementById('fv-footer-mount');
    if (mount) {
      mount.replaceWith(footerEl);
    } else {
      document.body.appendChild(footerEl);
    }
  }
  
  /* ── Fallback inline footer ───────────────────────── */
  function fallback() {
    if (document.querySelector('footer.fv-footer a, footer.footer-minimal a')) return;
    const el = document.createElement('footer');
    el.className = 'fv-footer footer-minimal';
    el.setAttribute('role', 'contentinfo');
    el.setAttribute('aria-label', 'Site footer');
    el.innerHTML = '<div class="container-full footer-inner"><p>© FanHoard</p></div>';
    
    const mount = document.getElementById('fv-footer-mount');
    if (mount) {
      mount.replaceWith(el);
    } else {
      document.body.appendChild(el);
    }
  }
  
  /* ── Boot ─────────────────────────────────────────── */
  function run() {
    loadCSS();
    
    if (
      document.documentElement.dataset.fvBuilt &&
      document.querySelector('footer.fv-footer a, footer.footer-minimal a')
    ) return;
    
    fetch(FOOTER_TEMPLATE_PATH, { cache: 'force-cache' })
      .then(r => (r.ok ? r.text() : Promise.reject()))
      .then(inject)
      .catch(fallback);
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();

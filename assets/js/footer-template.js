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
    if (document.querySelector('footer.footer-minimal')) return;
    
    const tmp = document.createElement('div');
    tmp.innerHTML = html.trim();
    const footerEl = tmp.querySelector('footer') || tmp.firstElementChild;
    if (!footerEl) return;

    const mount = document.getElementById('fv-footer-mount');
    if (mount) {
      mount.replaceWith(footerEl);
    } else {
      document.body.appendChild(footerEl);
    }
  }
  
  /* ── Fallback inline footer ───────────────────────── */
  function fallback() {
    if (document.querySelector('footer.footer-minimal')) return;
    const el = document.createElement('footer');
    el.className = 'footer-minimal';
    el.setAttribute('role', 'contentinfo');
    el.setAttribute('aria-label', 'Site footer');
    el.innerHTML = '<div class="footer-inner"><p>© FanHoard</p></div>';
    
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
      document.querySelector('footer.footer-minimal')
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

// @ts-check
/**
 * @file navigation.js
 * NavigationService — จัดการ navigation events ทั้งหมด
 *
 * ├── initBroadcastChannel()  — สร้าง BroadcastChannel สำหรับ cross-tab sync
 * ├── setupHandlers()         — attach event listeners ทั้งหมด
 * │   ├── pageshow            ← FIX: BFCache restoration
 * │   ├── popstate            ← SPA back/forward
 * │   ├── storage             ← cross-tab sync
 * │   └── visibilitychange    ← กลับมาที่ tab
 * └── _onBroadcastLang()      — รับ message จาก tab อื่น
 *
 * @module navigation
 * @depends {config.js, state.js, detector.js, url.js, translator.js, ui.js}
 */
(function(M) {
  'use strict';
  
  const NavigationService = {
    
    // ── BroadcastChannel ──────────────────────────────────────────────────────
    
    /**
     * สร้าง BroadcastChannel สำหรับ sync ภาษาระหว่าง tabs
     * เรียกครั้งเดียวตอน boot
     */
    initBroadcastChannel() {
      const { State } = M;
      try {
        State._bc = (typeof BroadcastChannel !== 'undefined') ?
          new BroadcastChannel('fv-lang-v3') :
          null;
      } catch (e) {
        State._bc = null;
      }
      
      if (State._bc) {
        State._bc.onmessage = (ev) => this._onBroadcastLang(ev.data);
      }
    },
    
    // ── Event handlers setup ──────────────────────────────────────────────────
    
    /**
     * Attach event listeners ทั้งหมดหลัง initialize เสร็จ
     * เรียกจาก LanguageManager.initialize()
     */
    setupHandlers() {
      // ยกเลิกระบบเปลี่ยนเส้นทาง/ภาษาอัตโนมัติ: เหลือเฉพาะ pageshow (BFCache content refresh)
      this._setupPageshow();
    },
    
    // ── pageshow (BFCache fix — v3.2) ─────────────────────────────────────────
    
    /**
     * จัดการ BFCache Restoration
     *
     * ปัญหา: modern browser เก็บหน้าไว้ใน bfcache เมื่อ user กด Back/Forward
     *        → browser restore JS state เดิมของหน้านั้นทั้งหมด
     *        → lang-proxy.js ไม่รัน (ไม่มี page reload)
     *        → selectedLang อาจเป็นค่าเก่า แต่ localStorage อาจถูกเปลี่ยนไปแล้ว
     *          โดยหน้าอื่นที่ user ไปเปลี่ยนภาษา
     *
     * การแก้: event.persisted=true บอกว่าหน้านี้มาจาก bfcache
     *         → อ่าน localStorage ใหม่ แล้ว reconcile กับ state ปัจจุบัน
     *
     * @private
     */
    _setupPageshow() {
      window.addEventListener('pageshow', (event) => {
        if (!event.persisted) return;
        
        try {
          // On BFCache restoration (return navigation), state is preserved via RouteCache

          if (M.ContentService) {
            const lang = localStorage.getItem('selectedLang') || 'en';
            const ctr = document.getElementById(M.CONFIG?.DOM?.CONTENT_LOADING_ID || 'content-loading');
            if (ctr) {
              const activeRoute = M.State?.navigation?.currentMainRoute || '_all';
              if (activeRoute === '_all' || !activeRoute) {
                M.ContentService.renderFeed(lang, '_all');
              }
            }
          }

          // ไม่มีการเปลี่ยนภาษา/URL อัตโนมัติจาก storage อีกต่อไป
        } catch (e) {
          console.error('[NavigationService/pageshow] handler error:', e);
        }
      });
    },
    
  };
  
  M.NavigationService = NavigationService;
  
})(window.LangModules = window.LangModules || {});
// @ts-check
/**
 * lang-core.js — v2.0.0 (static-only)
 * Central Language API for FanHoard
 *
 * โหลดก่อนทุกอย่าง (script แรกใน <head> ก่อน language.js)
 * อ่านภาษาแบบ static ทันทีจาก:
 *   1. data-fv-built attribute (production built page — บอกภาษาของหน้าที่ bake ไว้)
 *   2. URL path prefix (/en/..., /th/... — สำหรับหน้าที่ยังไม่ผ่าน build)
 *   3. ค่าเริ่มต้น 'en'
 *
 * ยกเลิกแล้ว (static เต็มรูปแบบ — Master สั่ง 18 ต.ค. 2026):
 *   - การสำรวจภาษาจาก localStorage / browser ณ ตอน resolve
 *   - ระบบ dynamic translation ทั้งหมด (คงไว้เฉพาะปุ่มเปลี่ยนภาษาใน language.js)
 *   หน้าที่ไม่มี prefix ภาษา = ไม่มีภาษา ใช้ค่าเริ่มต้นเท่านั้น
 *   ห้ามอ่าน storage/browser มาเปลี่ยนภาษาหรือแก้ URL โดยอัตโนมัติ
 *
 * Public API — window.FvLang:
 *   .lang              — ภาษาปัจจุบันของหน้า ('en' | 'th')
 *   .supportedLangs    — ['en', 'th']
 *   .isReady           — true เสมอ (resolve แบบ synchronous)
 *   .isStaticMode      — true ถ้าเป็น production built page (มี data-fv-built)
 *   .onChange(fn)      — subscribe เมื่อภาษาเปลี่ยน (return unsubscribe fn)
 *   .forceRefresh()    — dispatch fv:langchange ให้ระบบทั้งหน้า render ตามภาษาปัจจุบัน
 *   .setLang(lang)     — ตั้งค่าภาษาใหม่ + dispatch event (ใช้โดย language.js ก่อน redirect)
 *
 * Events:
 *   'fv:langchange' — CustomEvent บน window, detail: { lang, previousLang }
 *     ระบบ JS อื่นควรฟัง event นี้แทนอ่าน localStorage เอง
 *
 * Backward compat:
 *   - setLang() ยัง sync localStorage 'selectedLang' เพื่อให้ระบบที่ยังอ่านค่านี้
 *     (nav/popup/search) เห็นภาษาปัจจุบันของหน้า
 *   - window.languageReady / window.onLanguageReady ยังคงใช้ได้
 */

(function() {
  'use strict';

  // Guard: ไม่ init ซ้ำ
  if (window.FvLang && window.FvLang._v) return;

  var SUPPORTED = ['en', 'th'];
  var DEFAULT_LANG = 'en';
  var LS_KEY = 'selectedLang';

  // ── Detect language — synchronous, deterministic, static-only ──────────

  /**
   * อ่านภาษาจาก data-fv-built attribute (production only)
   * @returns {string|null}
   */
  function getBuiltLang() {
    try {
      var built = document.documentElement.getAttribute('data-fv-built');
      if (built && SUPPORTED.indexOf(built) >= 0) return built;
    } catch (e) {}
    return null;
  }

  /**
   * อ่านภาษาจาก URL prefix (/en/... /th/...) — สำหรับหน้าที่ยังไม่ผ่าน build
   * @returns {string|null}
   */
  function getUrlLang() {
    try {
      var m = location.pathname.match(/^\/(en|th)(\/|$)/);
      return m ? m[1] : null;
    } catch (e) {}
    return null;
  }

  // ── Resolve language immediately ───────────────────────────────────────

  var builtLang = getBuiltLang();
  var isStatic = !!builtLang;

  // Static mode: ยึด built language เป็นหลัก (content ถูก bake มาแล้ว)
  // ไม่มี data-fv-built → ใช้ URL prefix (dev) → ค่าเริ่มต้น
  var resolvedLang = builtLang || getUrlLang() || DEFAULT_LANG;
  if (SUPPORTED.indexOf(resolvedLang) < 0) resolvedLang = DEFAULT_LANG;

  // ── Subscriber system ──────────────────────────────────────────────────

  /** @type {Array<Function>} */
  var _subscribers = [];

  // ── FvLang API ─────────────────────────────────────────────────────────

  var FvLang = {
    _v: '2.0.0',

    /** ภาษาปัจจุบันของหน้า */
    lang: resolvedLang,

    /** ภาษาที่รองรับ */
    supportedLangs: SUPPORTED,

    /** เรียบร้อยแล้ว — เสมอ true เพราะ resolve แบบ sync */
    isReady: true,

    /** Production built page หรือไม่ (มี data-fv-built) */
    isStaticMode: isStatic,

    /**
     * Subscribe เมื่อภาษาเปลี่ยน
     * @param {Function} fn — callback(lang, previousLang)
     * @returns {Function} unsubscribe function
     */
    onChange: function(fn) {
      if (typeof fn !== 'function') return function() {};
      _subscribers.push(fn);
      return function() {
        var idx = _subscribers.indexOf(fn);
        if (idx >= 0) _subscribers.splice(idx, 1);
      };
    },

    /**
     * ตั้งภาษาใหม่ + แจ้งทุกระบบ (fv:langchange)
     * เรียกจาก language.js เมื่อ user เลือกภาษาใหม่จากปุ่มเปลี่ยนภาษา
     *
     * @param {string} newLang
     * @param {Object} [opts]
     * @param {boolean} [opts.silent] — ไม่ dispatch event (สำหรับ init sync)
     */
    setLang: function(newLang, opts) {
      if (!newLang || SUPPORTED.indexOf(newLang) < 0) return;
      if (newLang === this.lang) return;

      var previous = this.lang;
      this.lang = newLang;

      // Sync localStorage (compat ให้ระบบที่ยังอ่าน selectedLang เห็นค่าถูกต้อง)
      try { localStorage.setItem(LS_KEY, newLang); } catch (e) {}

      // Update <html lang>
      try { document.documentElement.setAttribute('lang', newLang); } catch (e) {}

      if (opts && opts.silent) return;

      // Call subscribers
      for (var i = 0; i < _subscribers.length; i++) {
        try { _subscribers[i](newLang, previous); } catch (e) {}
      }

      // Dispatch global event
      try {
        window.dispatchEvent(new CustomEvent('fv:langchange', {
          detail: { lang: newLang, previousLang: previous },
          bubbles: false,
          cancelable: false
        }));
        if (typeof window.announceToScreenReader === "function") {
          var msg = newLang === "th" ? "เปลี่ยนภาษาเป็นภาษาไทยแล้ว" : "Language changed to English";
          window.announceToScreenReader(msg, "polite");
        }
      } catch (e) {}
    },

    /**
     * Force refresh ระบบในหน้าให้ render ตามภาษาปัจจุบัน
     * (เช่น หลัง dynamic content โหลดเสร็จ)
     */
    forceRefresh: function() {
      var currentLang = this.lang;
      for (var i = 0; i < _subscribers.length; i++) {
        try { _subscribers[i](currentLang, currentLang); } catch (e) {}
      }
      try {
        window.dispatchEvent(new CustomEvent('fv:langchange', {
          detail: { lang: currentLang, previousLang: currentLang },
          bubbles: false,
          cancelable: false
        }));
      } catch (e) {}
    }
  };

  // ── Expose ─────────────────────────────────────────────────────────────

  window.FvLang = FvLang;

  // Backward compat: บางสคริปต์ยัง await window.languageReady
  if (!window.languageReady) {
    window.languageReady = Promise.resolve({ lang: FvLang.lang, translations: null });
  }
  if (!window.onLanguageReady) {
    window.onLanguageReady = function(fn) {
      if (typeof fn !== 'function') return;
      try { fn({ lang: FvLang.lang, translations: null }); } catch (e) {}
    };
  }

})();

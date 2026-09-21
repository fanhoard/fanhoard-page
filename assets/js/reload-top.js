/**
 * reload-top.js — Refresh = fresh start
 * @description หน้าที่: บังคับให้ "รีเฟรช (reload)" กลับไปอยู่ด้านบนสุดเสมอ
 *              เพื่อให้ตรงกับพฤติกรรมที่ผู้ใช้คาดหวัง (รีเฟรช = เริ่มต้นใหม่)
 *              การย้อนกลับ (back/forward) ยังใช้ restoration ปกติของเบราว์เซอร์
 *
 * ทำงานเฉพาะเมื่อ Navigation Timing ระบุว่าเป็น 'reload'
 * (ยกเว้น bfcache restore และ navigation ปกติ — ไม่แตะ)
 *
 * เหตุผลที่ต้อง re-assert: เบราว์เซอร์อาจ apply scroll restore ของตัวเอง
 * แบบ asynchronous หลัง DOMContentLoaded ทับ scrollTo(0,0) จุดเดียวไม่พอ
 *
 * @used-by ทุกหน้า (แทรกถัดจาก version-core.js ในทุก index.html)
 */
(function () {
  'use strict';
  try {
    if (typeof performance === 'undefined' || !performance.getEntriesByType) return;
    var nav = performance.getEntriesByType('navigation')[0];
    var isReload = !!(nav && nav.type === 'reload');
    // Legacy API fallback (เบราว์เซอร์เก่า)
    if (!isReload && typeof performance.navigation === 'object' && performance.navigation) {
      isReload = performance.navigation.type === 1;
    }
    if (!isReload) return;

    // หมายเหตุ: ไม่ตั้ง history.scrollRestoration = 'manual'
    //   เพราะโหมด manual จะติดกับ history entry นี้ถาวร ทำให้เวลาผู้ใช้
    //   ไปหน้าอื่นแล้วกด back กลับมา เบราว์เซอร์จะไม่ restore ตำแหน่งเอง
    //   (พฤติกรรมปกติที่ผู้ใช้คาดหวัง) — ใช้ re-assert guard อย่างเดียวพอ

    var toTop = function () {
      try { window.scrollTo(0, 0); } catch (_) {}
    };
    toTop();

    // Re-assert ช่วงแรก (~8s กว่า deferred restore) กันการแข่งกับ async restore ของเบราว์เซอร์
    window.addEventListener('load', toTop, { once: true });
    window.addEventListener('pageshow', toTop, { once: true });
    var guardId = null;
    var stopGuard = function () {
      if (guardId) { clearInterval(guardId); guardId = null; }
      window.removeEventListener('wheel', stopGuard);
      window.removeEventListener('touchstart', stopGuard);
      window.removeEventListener('keydown', onKey);
    };
    // ยกเลิก guard ทันทีที่ผู้ใช้เริ่มเลื่อนเอง — ห้ามข่ม scroll ของผู้ใช้
    var onKey = function (e) {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'PageUp' ||
          e.key === 'PageDown' || e.key === 'Home' || e.key === 'End' || e.key === ' ') stopGuard();
    };
    window.addEventListener('wheel', stopGuard, { passive: true });
    window.addEventListener('touchstart', stopGuard, { passive: true });
    window.addEventListener('keydown', onKey);
    var ticks = 0;
    guardId = setInterval(function () {
      toTop();
      if (++ticks >= 80) stopGuard();
    }, 100);
  } catch (_) {}
})();

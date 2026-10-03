# FanHoard FVL Polish & Stability Foundation Patch

วางไฟล์ทั้งหมดใน patch นี้ทับลงบน repo ตามโครงสร้างเดิม — แตก ZIP แล้ว copy ทับได้เลย

## สรุปการเปลี่ยนแปลง

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `assets/js/loading-system/fvl-modules/utils.js` | เพิ่ม `ScrollLockManager` จัดการล็อค scroll แบบ Ref-counting (`lockCount`), คำนวณชดเชย scrollbar width (`--fvl-scrollbar-width`), บันทึกและคืนค่า inline style เดิมของ `body` 100%, และป้องกันการไถหน้าจอบน iOS ด้วย non-passive `touchmove` listener |
| `assets/js/loading-system/fvl-modules/engine.js` | เปิดใช้งาน scroll lock บน `fullscreen` และ viewport-covering scoped overlays; เพิ่ม Focus Trap & Restore, ARIA attributes, และ `Escape` key handler สำหรับปิด overlay |
| `assets/js/loading-system/fvl-modules/renderer.js` | กำหนด ARIA roles (`role="dialog"`, `aria-modal="true"`, `role="progressbar"`) และประยุกต์ใช้คลาสจัดกึ่งกลาง spinner (`.fvl-spinner--center`) เป็นค่าเริ่มต้น |
| `assets/js/loading-system/fvl-modules/config.js` | กำหนด `lockScroll: true` เป็นค่าเริ่มต้นสำหรับ `fullscreen` preset |
| `assets/js/loading-system/fvl-spinner.js` | กำหนด `center: true` เป็นค่าเริ่มต้นสำหรับ standalone `FVLSpinner` และรองรับตัวเลือก alignment (`left`, `center`, `right`) |
| `assets/css/loading-system.css` | เพิ่มคลาส `.fvl-spinner--center`, `.fvl-spinner-wrapper` และเพิ่ม `@media (prefers-reduced-motion: reduce)` หยุดอนิเมชันการหมุน stroke |
| `assets/js/nav-core-modules/router.js` | เพิ่มตัวนับลำดับ `_navSequenceId` ป้องกัน Race Condition ระหว่างการนำทางแบบ `popstate` รวดเร็ว |
| `assets/js/home.js` | ครอบการดึงข้อมูลหมวดหมู่ใน `fetchIdOrder` ด้วย `try...catch` คืนค่า fallback array `[]` และ Deduplicate `fv:langchange` listener |
| `assets/js/nav-core-modules/data.js` | ตรวจจับ `AbortError` ใน `_enqueueFetch` และคืนค่า `{ ok: false, aborted: true }` โดยไม่โยน Uncaught Rejection |
| `assets/js/popup-modules/a11y.js` | เพิ่ม `_activeTraps` และถอด `keydown` listener เดิมออกก่อนผูก focus trap ใหม่ใน `installFocusTrap` ป้องกัน memory leaks |
| `assets/js/nav-core-modules/content.js` | เพิ่มตัวเลือก `{ passive: true }` บน scroll listener และเพิ่มเมธอด `_cleanupScrollPersist()` คืนทรัพยากร |
| `assets/js/nav-core-modules/init.js` | เปลี่ยน window resize listener ให้ประมวลผลผ่าน `requestAnimationFrame` ป้องกัน Layout Thrashing |
| `assets/js/search-system/search-modules/data-loader.js` | ตรวจสอบ `r.ok` ก่อนเรียก `r.json()` ใน `loadDataWithRetry` ป้องกัน `SyntaxError` เมื่อเซิร์ฟเวอร์ตอบกลับ 404/500 HTML |
| `assets/css/search.css` | เพิ่ม `@media (prefers-reduced-motion: reduce)` ปิดอนิเมชันและทรานซิชันสำหรับ Search Modal และ Result list |
| `assets/css/about.css` | เพิ่ม `@media (prefers-reduced-motion: reduce)` ปิดอนิเมชันการลอยของ modal cards |
| `assets/css/layout.css` | เพิ่ม `@media (prefers-reduced-motion: reduce)` ปิดอนิเมชันและบังคับ `scroll-behavior: auto !important` |
| `tests/loading-contract.test.ts` | เพิ่ม Unit Tests ครอบคลุม FVL scroll-lock, ref-counting, scrollbar compensation, style restore, spinner centering, ARIA, focus trap, Escape key, และ reduced motion |
| `tests/stability-defects.test.ts` | **สร้างไฟล์ใหม่** — Unit Tests ครอบคลุม site-wide stability & defect fixes ทั้ง 10 รายการ |
| `fanhoard-docs/02-Search-System.md` | อัปเดตคู่มือระบบค้นหา — เพิ่มรายละเอียด HTTP response validation ใน DataLoader และ reduced motion overrides |
| `fanhoard-docs/03-Navigation-And-Content.md` | อัปเดตคู่มือ Nav-Core & Content — เพิ่มรายละเอียด popstate sequence guard, scroll persist cleanup, rAF resize throttling, home error handling & deduplication, และ data abort safety |
| `fanhoard-docs/05-Content-Data-Service.md` | อัปเดตคู่มือ Data Service — เพิ่มรายละเอียด AbortError exception handling ใน `_enqueueFetch` |
| `fanhoard-docs/06-Popup-System.md` | อัปเดตคู่มือ Popup System — เพิ่มรายละเอียด active trap registry และ focus trap listener leak prevention (v1.2.0) |
| `fanhoard-docs/07-Loading-System.md` | อัปเดตคู่มือระบบ FVL — เพิ่มรายละเอียด ScrollLockManager, mounted spinner centering, focus trap & ARIA accessibility, และ Version History v3.2.0 |
| `fanhoard-docs/14-System-Design-And-UX.md` | อัปเดตคู่มือ UX & Motion — เพิ่มรายละเอียด reduced motion compliance ครอบคลุมทุกระบบ stylesheet |
| `fanhoard-docs/15-Loading-Contract-And-Test-Plan.md` | อัปเดตสัญญาบริการและแผนการทดสอบ — เพิ่มสัญญา FVL Scroll-Lock & Centering (Section 2.9), test seam (Seam 8), และ Implementation Slice 8 |

## รายละเอียดการปรับปรุงระบบ FVL & Stability

1. **Scroll-Lock Architecture & Exact Restore**:
   - ล็อคการเลื่อนหน้าจอเมื่อแสดง overlay แบบ fullscreen หรือ scoped overlay ที่ครอบทั้ง viewport
   - คำนวณความกว้าง scrollbar และเพิ่ม `paddingRight` ชดเชยบน `body` ป้องกันปัญหาหน้าจอกระตุก (layout jump)
   - ใช้ระบบ Ref-counting (`lockCount`) บันทึก inline style ต้นฉบับ และคืนค่า inline style + ตำแหน่ง scroll Y เดิม 100% เมื่อเคลียร์ overlay หมด
   - เพิ่ม non-passive `touchmove` listener ป้องกันการลากนิ้วบน iOS
2. **Mounted Spinner Centering**:
   - Spinners ที่ mount ในคอนเทนเนอร์ (`FVLSpinner.mount` / bare scoped spinners) จัดกึ่งกลางคอนเทนเนอร์เป็นค่าเริ่มต้น ไม่ค้างมุมซ้ายบน
   - รองรับการปรับทิศทางด้วย `align: 'left' | 'center' | 'right'` และสามารถเลือกระบุ `{ center: false }` เพื่อยกเลิกได้
3. **Overlay Details Polish (ARIA / Focus Trap / Keyboard / Motion)**:
   - Fullscreen overlays ใช้ `role="dialog"` และ `aria-modal="true"` พร้อมตั้งค่า `aria-hidden="true"` บน sibling elements
   - Scoped overlays ใช้ `role="progressbar"` และ `aria-busy="true"`
   - เพิ่ม Focus Trap ดักจับโฟกัสให้อยู่ใน overlay และคืนโฟกัสกลับไปยัง element เดิมเมื่อปิด
   - ปิด overlay เมื่อกดปุ่ม `Escape` เมื่อ `closable !== false`
   - รองรับ `@media (prefers-reduced-motion: reduce)` โดยหยุดอนิเมชันการหมุน stroke
4. **Site-wide Stability & Performance Pass**:
   - ป้องกัน Race condition จากการนำทางแบบ `popstate` รวดเร็วใน Router
   - ป้องกัน Unhandled Promise Rejections จาก AbortError ใน Data Service และ Fetch Failures ใน Homepage
   - ป้องกัน Memory Leaks จาก Event Listeners ใน Focus Trap, Scroll Persistence, และ Language Change Handlers
   - ป้องกัน Layout Thrashing โดยใช้ `requestAnimationFrame` บีบอัด Resize Listener
   - ป้องกัน SyntaxError จากการ parse JSON ของหน้า HTML 404/500 ใน Search Data Loader
   - เพิ่ม Reduced Motion overrides ครอบคลุม CSS ทั้งหมดในระบบ

## การทดสอบ

ทดสอบระบบผ่าน Vitest และ TypeScript Type Check:
1. `npx vitest run` → ยืนยันการผ่าน 27/27 test files (166/166 tests passed)
2. `npm run type-check` (`tsc --noEmit`) → ยืนยัน 0 errors
3. `npm run lint` → ยืนยัน 0 errors

# FanHoard Fullscreen Scroll-Lock Fix & User Release Notes Patch (v3.2.1)

วางไฟล์ทั้งหมดใน patch นี้ทับลงบน repo ตามโครงสร้างเดิม — แตก ZIP แล้ว copy ทับได้เลย

## สรุปการเปลี่ยนแปลง

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `assets/js/loading-system/fvl-modules/utils.js` | ปรับปรุง `ScrollLockManager` ล็อค scroll แบบ Dual-Container บนทั้ง `document.documentElement` (`html`) และ `document.body` (`overflow: hidden`, `overscroll-behavior: none`), คำนวณชดเชย `--fvl-scrollbar-width`, บันทึกและคืนค่า inline style เดิม 100%, และดักจับเหตุการณ์ `wheel`, `touchmove`, และ `keydown` แบบ non-passive บน `document` |
| `assets/js/loading-system/fvl-modules/engine.js` | เปิดใช้งาน scroll lock บน `fullscreen` และ viewport-covering scoped overlays; เพิ่ม Focus Trap & Restore, ARIA attributes, และ `Escape` key handler |
| `assets/js/loading-system/fvl-modules/renderer.js` | กำหนด ARIA roles (`role="dialog"`, `aria-modal="true"`, `role="progressbar"`) และคลาสจัดกึ่งกลาง spinner (`.fvl-spinner--center`) และบังคับ `touch-action: none` บน fullscreen overlay |
| `assets/css/loading-system.css` | กำหนดกฎ CSS `touch-action: none` และ `overscroll-behavior: none` บน `.fvl-overlay--fullscreen` และเพิ่ม `@media (prefers-reduced-motion: reduce)` |
| `assets/js/nav-core-modules/loading.js` | Sync สภาวะ scroll lock ขณะรับช่วง early boot loader และปลดล็อคอย่างปลอดภัยเมื่อ handshake สำเร็จ |
| `assets/md/en/current.md` | อัปเดต user-facing release notes สำหรับ v3.2.1 (รวม v3.1.1 และ v3.2.0) เป็นภาษาอังกฤษ |
| `assets/md/th/current.md` | อัปเดต user-facing release notes สำหรับ v3.2.1 (รวม v3.1.1 และ v3.2.0) เป็นภาษาไทย |
| `tests/loading-contract.test.ts` | เพิ่ม Unit Tests ตรวจสอบการล็อค scroll บน `html` และ `body`, การดักจับ `wheel`/`touchmove`/`keydown`, การ sync กับ boot loader, และการคืนค่า inline style สององค์ประกอบ |
| `fanhoard-docs/07-Loading-System.md` | อัปเดตคู่มือระบบ FVL — แก้ไข Scroll-Lock Architecture (html+body locking, non-passive event listeners, boot loader sync) และบันทึก Version History v3.2.1 |
| `fanhoard-docs/15-Loading-Contract-And-Test-Plan.md` | อัปเดตสัญญาบริการและแผนการทดสอบ — ปรับปรุง Scroll-Lock Contract (Section 2.9) และ Test Seam (Seam 8) ให้ตรงกับพฤติกรรมจริง |
| `fanhoard-docs/11-Release-Notes-System.md` | อัปเดตคู่มือระบบ Release Notes — เน้นย้ำกฎการอัปเดต user-facing release notes ใน `assets/md/{en,th}/current.md` ทุก release และห้ามแก้ไขไฟล์ generated |
| `PATCH_NOTES.md` | อัปเดตบันทึกแพตช์ (ฉบับนี้) |
| `CHANGES.md` | อัปเดตบันทึกการเปลี่ยนแปลงภาษาอังกฤษ |

## รายละเอียดการปรับปรุงระบบ FVL Scroll-Lock & Release Notes

1. **Fullscreen Scroll-Lock Architecture Fix**:
   - **Dual-Container Viewport Locking**: เปลี่ยน `ScrollLockManager.lock()` ให้ล็อคทั้ง `document.documentElement` (`html`) และ `document.body` พร้อมกัน ด้วย `overflow: hidden` และ `overscroll-behavior: none` เนื่องจากเบราว์เซอร์ยุคใหม่ใช้ `html` เป็น scrolling container หลัก
   - **Non-Passive Event Interception**: ผูก non-passive event listeners บน `document` สำหรับเหตุการณ์ `wheel`, `touchmove`, และ `keydown` (ปุ่มนำทาง Space, PageUp, PageDown, End, Home, Arrow keys) บล็อกการสโครลภายนอกคอนเทนเนอร์ `.fvl-scrollable` และฟิลด์กรอกข้อมูล
   - **Boot Loader Synchronization**: รองรับการ sync และจัดการสภาวะ scroll lock ขณะที่ Loading Service สดหรือรับช่วง early boot loader DOM elements
   - **Exact Style Restoration**: บันทึก inline style เดิมของทั้ง `html` และ `body` อย่างสมบูรณ์ คืนค่าสไตล์ 100% พร้อมคืนตำแหน่ง scroll Y เดิม (`window.scrollTo(0, savedScrollY)`) และถอด event listeners ออกทั้งหมดเมื่อ `lockCount === 0`

2. **User-Facing Release Notes Compliance**:
   - อัปเดต `assets/md/en/current.md` และ `assets/md/th/current.md` พร้อมกันให้เป็นเวอร์ชัน `3.2.1` รวบรวมฟีเจอร์ Discover spinner (v3.1.1), stability/accessibility polish (v3.2.0), และ fullscreen scroll-lock fix (v3.2.1)
   - ยืนยันความสอดคล้องผ่าน `node scripts/validate-release.js --staged` PASS

## การทดสอบ

ทดสอบระบบผ่าน Vitest และ TypeScript Type Check:
1. `npx vitest run` → ยืนยันการผ่าน 27/27 test files (168/168 tests passed)
2. `npm run type-check` (`tsc --noEmit`) → ยืนยัน 0 errors
3. `npm run lint` → ยืนยัน 0 errors

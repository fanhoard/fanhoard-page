# แพตช์รวมศูนย์ระบบสกอร์ล็อก (v3.2.3)

วางไฟล์ทั้งหมดใน patch นี้ทับลงบน repo ตามโครงสร้างเดิม — แตก ZIP แล้ว copy ทับได้เลย

## สรุปการเปลี่ยนแปลง (v3.2.3)

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `assets/js/loading-system/fvl-modules/scroll-lock-core.js` | มอดูลศูนย์กลางการล็อกสกอร์ (NEW): จัดการ owner tags, ref-count, `data-scroll-locked`, `allowScrollIn`, `releaseAll`, `reset()` พร้อมคืนค่า DOM style |
| `assets/js/loading-system/fvl-modules/utils.js` | ทำ Alias ชี้ไปยังมอดูลศูนย์กลางผ่าน `ScrollLockManager` |
| `assets/js/loading-system/fvl-modules/engine.js` | ระบุ owner tag 'fvl' สำหรับการล็อกสกอร์ของระบบหน้าโหลด |
| `assets/js/loading-system/fvl.js` | โหลด `scroll-lock-core.js` ใน Phase 0 และ Node modFiles chain |
| `assets/js/popup.js` | โหลดและตรวจสอบ `ScrollLockCore` พร้อมระบบสำรองแบบ Fail-soft |
| `assets/js/popup-modules/state.js` | ส่งต่อการสั่งล็อก/ปลดล็อกไปยัง `ScrollLockCore` พร้อมตัวเลือกสำรอง legacy |
| `assets/js/search-system/search.js` | โหลดและตรวจสอบ `ScrollLockCore` พร้อมระบบสำรองแบบ Fail-soft |
| `assets/js/search-system/search-modules/overlay.js` | ส่งต่อการสั่งล็อก/ปลดล็อกไปยัง `ScrollLockCore` พร้อมตัวเลือกสำรอง legacy |
| `assets/js/nav-core-modules/loading.js` | ระบุ owner tag 'fvl' สำหรับการล็อกสกอร์ของ nav loading |
| `tests/core-search-defects.test.ts` | เพิ่ม Stub สำหรับ `ScrollLockCore` สำหรับชุดทดสอบระบบค้นหา |
| `tests/scroll-lock-core.test.ts` | ชุดทดสอบ Unit Contract Tests 8 เคส (NEW) ครอบคลุมการทำงานของศูนย์กลางสกอร์ล็อกและการคืนค่า DOM |
| `e2e/scroll-lock.spec.ts` | ชุดทดสอบ Real-Browser E2E 3 เคส (NEW) สำหรับหน้าโหลดเต็มจอ, Overlay ซ้อนกัน และหน้าต่างค้นหา |

## รายละเอียดแพตช์รวมศูนย์ระบบสกอร์ล็อก (v3.2.3)

1. **รวมศูนย์ระบบสกอร์ล็อก (Unified Scroll-Lock Core)**:
   - รวมการจัดการสกอร์ล็อกของหน้าโหลด (Loading), ป๊อปอัพ (Popup) และหน้าต่างค้นหา (Search) เข้าสู่แกนกลางเดียวกัน `window.ScrollLockCore`
   - ระบบนับจำนวนอ้างอิง (Reference Counting) และระบุเจ้าของ (Owner Tags) ป้องกันไม่ให้การปิด Overlay ตัวหนึ่งไปปลดล็อกหน้าเว็บด้านหลังที่ยังถูก Overlay ตัวอื่นล็อกไว้
   - แสดง Attribute `data-scroll-locked` บนองค์ประกอบ `<html>` สำหรับตรวจสอบการทำงานใน DOM
2. **การคืนค่า DOM และความเสถียร (DOM Restore & Fail-Soft)**:
   - เมื่อเรียก `reset()` ระบบจะคืนค่า Style ดั้งเดิมของ `body` และ `documentElement` อย่างสมบูรณ์
   - หากสภาพแวดล้อมไม่พร้อม มีระบบสำรอง Fail-Soft ให้มอดูลทำงานต่อได้โดยไม่ขัดข้อง
3. **ชุดทดสอบแบบครอบคลุม**:
   - `tests/scroll-lock-core.test.ts` (8 unit contract tests) ผ่าน 100%
   - `e2e/scroll-lock.spec.ts` (3 real-browser tests) ผ่าน 100%

---

# FanHoard Fullscreen Scroll-Lock Inversion Bug Fix Patch (v3.2.2)

วางไฟล์ทั้งหมดใน patch นี้ทับลงบน repo ตามโครงสร้างเดิม — แตก ZIP แล้ว copy ทับได้เลย

## สรุปการเปลี่ยนแปลง

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `assets/js/nav-core-modules/loading.js` | บริหารจัดการสภาวะ scroll lock ขณะรับช่วง boot loader อย่างสมดุลผ่าน `_ensureBootLock()` และ `_releaseBootLock()`, ครอบ `window.__removeBootLoader` เพื่อการันตีปลดล็อค, และปลดล็อคทันทีเมื่อ `readinessHandshake()` |
| `assets/js/loading-system/fvl-modules/engine.js` | เพิ่มการตรวจสอบและล็อค scroll ล่วงหน้าขณะ IIFE มอดูลเริ่มโหลด (`engine.js:673`) หากพบ `#fv-boot-loader` หรือ `#nc-early-overlay`, และเพิ่ม `_cleanBootLock()` เพื่อปลดล็อคระหว่าง handshake |
| `tests/loading-contract.test.ts` | เพิ่มชุดทดสอบ Inverted Scroll-Lock Regression Tests ยืนยันการล็อคระหว่าง boot adoption, การปลดล็อคเมื่อ handshake, การล็อคตั้งแต่มอดูลโหลด, และความสมดุลของ reference counter |
| `fanhoard-docs/07-Loading-System.md` | อัปเดตคู่มือระบบ FVL — รายละเอียด Scroll-Lock Architecture & Boot Loader Adoption Lock Lifecycle และบันทึก Version History v3.2.2 |
| `fanhoard-docs/15-Loading-Contract-And-Test-Plan.md` | อัปเดตสัญญาและแผนการทดสอบ — ระบุ Lock/Unlock Call-Pair Invariant ใน Section 2.9 และอัปเดต Test Seam 8 ครอบคลุม regression tests |
| `PATCH_NOTES.md` | อัปเดตบันทึกแพตช์ (ฉบับนี้) สำหรับเวอร์ชัน v3.2.2 |
| `CHANGES.md` | อัปเดตบันทึกการเปลี่ยนแปลงภาษาอังกฤษสำหรับเวอร์ชัน v3.2.2 |

## รายละเอียดการแก้บั๊ก Inverted Scroll-Lock (v3.2.2)

1. **สาเหตุของปัญหา (Root Cause)**:
   - **Unlocked Early Boot Phase**: ช่วงที่ HTML หน้าเว็บเริ่มโหลดก่อนมอดูล JS ทำงาน สไลด์และพื้นหลังหน้าจอสามารถไถได้ตามปกติเนื่องจากยังไม่มีการล็อค scroll
   - **Lock Leak on Handshake**: เมื่อ `LoadingService.show()` รับช่วง boot loader ได้ทำการสั่ง `lockMgr.lock()` และตั้งค่า `_bootScrollLocked = true` แต่เมื่อโหลดเสร็จและเรียก `readinessHandshake()` ตัว `FVL Engine` ไม่พบ active FVL instance ใน `M.State` (เนื่องจาก boot adoption ส่งคืน synthetic handle โดยไม่สร้าง instance) ทำให้ไม่ได้เรียก `hideInstant()` ส่งผลให้ `lockMgr` ค้างสภาวะล็อค (`lockCount > 0`) พื้นหลังหน้าจอจึงถูกล็อคค้างถาวรหลังจาก overlay หายไป

2. **การแก้ไข (Fix Description)**:
   - **Early Boot Lock**: สั่งล็อค scroll ทันทีขณะ IIFE มอดูลเริ่มโหลด หากพบองค์ประกอบ boot loader แสดงผลอยู่
   - **Balanced Adoption & Release**: เพิ่ม `_ensureBootLock()` และ `_releaseBootLock()` ใน `LoadingService` และ `_cleanBootLock()` ใน `Engine` เพื่อติดตามและปลดล็อค scroll lock อย่างสมบูรณ์ในการเรียก `readinessHandshake()`, `hideInstant()`, `_forceReset()`, หรือ `window.__removeBootLoader`
   - **Call-Pair Invariant & Unit Tests**: ยืนยันคู่การเรียก lock/unlock อย่างสมบูรณ์ผ่าน 4 regression tests ใน `tests/loading-contract.test.ts`

## การทดสอบ

ทดสอบระบบผ่าน Vitest และ TypeScript Type Check:
1. `npx vitest run` → ยืนยันการผ่าน 27/27 test files (174/174 tests passed)
2. `npm run type-check` (`tsc --noEmit`) → ยืนยัน 0 errors
3. `npm run lint` → ยืนยัน 0 errors

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

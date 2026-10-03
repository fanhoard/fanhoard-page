# FanHoard FVL — Flexible Loading & Standalone Spinner Subsystem Patch

วางไฟล์ทั้งหมดใน patch นี้ทับลงบน repo ตามโครงสร้างเดิม — แตก ZIP แล้ว copy ทับได้เลย

## สรุปการเปลี่ยนแปลง

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `assets/js/loading-system/fvl-spinner.js` | **สร้างไฟล์ใหม่** — Standalone Material Spinner subsystem ที่ทำงานแบบ zero-dependency โดยไม่ขึ้นกับ `fvl.js` หรือ `LOAD_PHASES`, ฉีดสไตล์ CSS อัตโนมัติ (`#fvl-spinner-styles`), และส่งออก `window.FVLSpinner` พร้อมสะพานเชื่อม `window.FVL.spinner` |
| `assets/js/loading-system/fvl-modules/spinner.js` | อัปเดตให้ delegate การประมวลผลไปยัง standalone `FVLSpinner` มอดูลเมื่อมีการเรียกใช้งาน |
| `assets/js/loading-system/fvl-modules/renderer.js` | อัปเดต DOM builders ในทุก display modes (`fullscreen`, `scoped`, `inline`, `topbar`) รองรับตัวเลือก `spinnerOnly`, `bare`, และ `chromeless` เพื่อข้ามการสร้างโหนดข้อความ และใส่ modifier classes |
| `assets/js/loading-system/fvl-modules/engine.js` | เพิ่มระบบรองรับ `targetSlot` เพื่อ mount spinner เข้าไปยัง child DOM element/selector ย่อยภายใน container หลัก พร้อมคงการจัดการ `aria-busy` บน container |
| `assets/css/loading-system.css` | เพิ่ม modifier classes สำหรับ `.fvl-bare`, `.fvl-chromeless`, `.fvl-spinner--speed-*`, และ `.fvl-spinner--stroke-*` ใน CSS layer `@layer fvl` |
| `tests/loading-spinner-standalone.test.ts` | **สร้างไฟล์ใหม่** — Unit test suite ครอบคลุม standalone `fvl-spinner.js` (lifecycle, CSS injection, factory API, adjustments, unmount & destroy) |
| `tests/loading-spinner-only.test.ts` | **สร้างไฟล์ใหม่** — Unit test suite ครอบคลุมตัวเลือก `spinnerOnly`, `bare`, `chromeless`, และ `targetSlot` บน FVL ทั้ง 4 display modes |
| `fanhoard-docs/07-Loading-System.md` | อัปเดตเอกสารคู่มือระบบ FVL — เพิ่มรายละเอียด mode options ใหม่ (`spinnerOnly`, `bare`, `chromeless`, `targetSlot`), คู่มือการใช้งาน standalone spinner, สารบัญ API ใหม่ และ Version History v3.1.0 |
| `fanhoard-docs/15-Loading-Contract-And-Test-Plan.md` | อัปเดตสัญญาบริการและแผนการทดสอบ — เพิ่มสัญญา flexible display options, standalone spinner contracts, test seams (Seam 3 & 4), และ Implementation Slice 6 |

## พฤติกรรมใหม่

### ก่อนหน้า
- การแสดง loader ผ่าน FVL บังคับสร้างโหนดข้อความ (`.fvl-msg`, `.fvl-sub`, `.fvl-text`) เสมอ แม้ไม่ได้ส่ง `message`
- ไม่สามารถปลด backdrop, borders หรือ padding ออกจาก overlay ได้อย่างยืดหยุ่นใน scoped หรือ inline modes
- การใช้งาน spinner ในปุ่มหรือ widget ย่อยจำเป็นต้องโหลด FVL orchestrator เต็มรูปแบบผ่าน `fvl.js` และ 4 `LOAD_PHASES`
- การ mount spinner จะกระทำที่ root ของ target container เสมอ ไม่สามารถระบุ slot ย่อยภายใน container ได้

### ตอนนี้ (FVL Flexible Loading & Standalone Subsystem)
- **`spinnerOnly: true`**: ซ่อนข้อความ message/submessage และโหนดข้อความทั้งหมด เหลือเพียงตัว spinner พร้อมตั้งค่า `aria-label` บน root container อัตโนมัติ
- **`chromeless: true`**: ถอด backdrop overlay, border, padding และ shadow ออก (ใส่ class `.fvl-chromeless`)
- **`bare: true`**: Shorthand ผสาน `{ spinnerOnly: true, chromeless: true }` (ใส่ class `.fvl-bare` และ `.fvl-chromeless`)
- **`targetSlot`**: สามารถระบุ selector หรือ `HTMLElement` เพื่อ mount spinner ลงใน slot ย่อยภายใน container หลัก โดยที่ container หลักยังคงรับ `aria-busy="true"` ตาม lifecycle
- **Standalone `fvl-spinner.js`**: มอดูล spinner อิสระ zero-dependency ไม่ต้องรอ `fvl.js` โหลด มีระบบ auto CSS injection และส่งออก instance handle ควบคุมได้เต็มรูปแบบ (`setSize`, `setColor`, `setTrackColor`, `setSpeed`, `setStrokeWidth`, `updateProgress`, `mount`, `unmount`, `destroy`)

## การทดสอบ

ทดสอบระบบผ่าน Vitest และ TypeScript Type Check:
1. `npm run test` หรือ `npx vitest run tests/loading-*.test.ts` → ยืนยันการผ่าน 35/35 tests
2. `npm run type-check` (`tsc --noEmit`) → ยืนยัน 0 errors
3. `npm run lint` → ยืนยัน 0 errors

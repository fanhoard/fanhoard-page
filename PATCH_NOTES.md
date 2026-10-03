# FanHoard FVL — Flexible Loading & Discover Page Spinner Integration Patch

วางไฟล์ทั้งหมดใน patch นี้ทับลงบน repo ตามโครงสร้างเดิม — แตก ZIP แล้ว copy ทับได้เลย

## สรุปการเปลี่ยนแปลง

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `assets/js/nav-core-modules/content.js` | Mount bare FVL spinner ใน `clearContent()`, จัดการ 10s fallback safety timer (`_fvlSafetyTimer`), ควบคุม `aria-busy` บน `#content-loading`, และ mount standalone small `FVLSpinner` บน infinite scroll sentinels พร้อม `finally` block cleanup |
| `assets/js/nav-core-modules/loading.js` | อัปเดต `showInContent()` ให้ใช้พารามิเตอร์เริ่มต้นเป็น `{ bare: true, size: 'md' }` |
| `assets/js/nav-core-modules/router.js` | ส่งผ่าน `{ bare: true, size: 'md' }` เมื่อเรียก `showInContent()` หรือ `FVL.scoped()` ใน `navigateTo()` |
| `assets/js/search-system/search-modules/search-controller.js` | Mount bare FVL spinner ใน `#searchResults` พร้อม `aria-busy="true"` เมื่อส่งคำค้นหาขณะเอกสารดัชนียังไม่พร้อม (`!docsReady`) |
| `assets/js/search-system/search-modules/rendering.js` | Mount bare FVL spinner ใน `#searchResults` พร้อม `aria-busy="true"` ขณะรอ `window.URE` และรีเซ็ต `aria-busy="false"` เมื่อเรนเดอร์สำเร็จ |
| `tests/discover-loading-integration.test.ts` | **สร้างไฟล์ใหม่** — Integration test suite ครอบคลุม Discover page content transitions (Point A, B, C, D), double-spinner protection, 10s fallback timer, `finally` exception safety, และ search pending spinner states |
| `assets/js/loading-system/fvl-spinner.js` | Standalone Material Spinner subsystem ที่ทำงานแบบ zero-dependency โดยไม่ขึ้นกับ `fvl.js` หรือ `LOAD_PHASES`, ฉีดสไตล์ CSS อัตโนมัติ (`#fvl-spinner-styles`), และส่งออก `window.FVLSpinner` |
| `assets/js/loading-system/fvl-modules/spinner.js` | Delegate การประมวลผลไปยัง standalone `FVLSpinner` มอดูล |
| `assets/js/loading-system/fvl-modules/renderer.js` | DOM builders ในทุก display modes รองรับตัวเลือก `spinnerOnly`, `bare`, และ `chromeless` |
| `assets/js/loading-system/fvl-modules/engine.js` | เพิ่มระบบรองรับ `targetSlot` สำหรับ mount spinner เข้าไปยัง child DOM element/selector ย่อย |
| `assets/css/loading-system.css` | เพิ่ม modifier classes สำหรับ `.fvl-bare`, `.fvl-chromeless`, `.fvl-spinner--speed-*`, และ `.fvl-spinner--stroke-*` |
| `fanhoard-docs/02-Search-System.md` | อัปเดตคู่มือระบบค้นหา — เพิ่มรายละเอียด FVL bare spinner ใน `#searchResults` ขณะรอเอกสารและรอ URE |
| `fanhoard-docs/03-Navigation-And-Content.md` | อัปเดตคู่มือ Navigation & Content — เพิ่มรายละเอียด `showInContent` bare mode, `clearContent` FVL spinner lifecycle, 10s safety fallback timer, และ infinite scroll sentinel spinner |
| `fanhoard-docs/07-Loading-System.md` | อัปเดตเอกสารคู่มือระบบ FVL — เพิ่มรายละเอียด mode options, standalone spinner, การผสานกับ Discover Page (Point A-D), และ Version History v3.1.1 |
| `fanhoard-docs/15-Loading-Contract-And-Test-Plan.md` | อัปเดตสัญญาบริการและแผนการทดสอบ — เพิ่มสัญญา Discover page content transitions (Section 2.8), test seam (Seam 7), และ Implementation Slice 7 |

## พฤติกรรมใหม่บน Discover Page & Search Subsystem

1. **Point A: Category / Tab Switch Navigation**:
   - เมื่อกดเปลี่ยนแท็บหรือเปลี่ยนหมวดหมู่ `router.navigateTo()` เรียก `LoadingService.showInContent({ bare: true, size: 'md' })`
   - `ContentService.clearContent()` mount bare FVL spinner ลงใน `#content-loading` พร้อมตั้งค่า `aria-busy="true"`
   - มีระบบ 10s safety fallback timer (`_fvlSafetyTimer`) ออโต้เคลียร์ spinner หาก request ค้าง
2. **Point B: Feed / Category Refresh**:
   - `ContentService.renderFeed()` เรียก `clearContent()` mount bare FVL spinner แบบซิงโครนัส โดยมี double-spinner guard ป้องกันการ mount ซ้ำ
   - ลบ spinner และรีเซ็ต `aria-busy="false"` เมื่อ feed batch แรกเรนเดอร์สำเร็จ (`_appendFeedGroups`)
3. **Point C: Infinite Scroll Pagination**:
   - เมื่อ scroll ถึง sentinel (`#nc-feed-sentinel` / `#nc-lazy-sentinel`) ตั้งค่า `aria-busy="true"` และ mount standalone small fast spinner (`FVLSpinner.mount(sentinel, { size: 'sm', speed: 'fast' })`)
   - รับประกันการลบ spinner และรีเซ็ต `aria-busy="false"` ใน `finally` block เสมอ แม้เกิด fetch error
4. **Point D: Search & Content Re-render**:
   - ขณะรอเอกสารดัชนี (`!docsReady`) ใน `SearchController.doSearch()` แสดง bare FVL spinner ใน `#searchResults` พร้อม `aria-busy="true"`
   - ขณะรอ `window.URE` ใน `RenderingService.renderResults()` แสดง bare FVL spinner ใน `#searchResults`
   - เมื่อเรนเดอร์ผลลัพธ์สำเร็จ รีเซ็ต `aria-busy="false"` และเรนเดอร์ DOM ทับ cleanly

## การทดสอบ

ทดสอบระบบผ่าน Vitest และ TypeScript Type Check:
1. `npx vitest run` → ยืนยันการผ่าน 26/26 test files (150/150 tests passed)
2. `npm run type-check` (`tsc --noEmit`) → ยืนยัน 0 errors
3. `npm run lint` → ยืนยัน 0 errors

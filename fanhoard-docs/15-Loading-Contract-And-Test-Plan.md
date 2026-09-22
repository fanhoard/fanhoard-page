# 15 — Loading System Contract & Test Plan

> เอกสารนี้กำหนด **Loading Contract** และ **Test Plan** สำหรับระบบ Loading ส่วนกลาง (FVL), Discover page, และ Search system ของ **FanHoard** — ครอบคลุม Boot lifecycle, Scoped button loading, Cancellation & race handling, Error boundary, Reduced motion, และ Search consumers
>
> **สำหรับ:** AI และนักพัฒนาที่จะดูแลระบบ Loading, Discover และ Search
>
> **ไฟล์หลัก:** `assets/js/loading-system/fvl.js`, `assets/css/loading-system.css`, `assets/js/nav-core-early.js`, `assets/js/nav-core-modules/router.js`, `assets/js/search-system/search-modules/search-service.js`
>
> **เวอร์ชัน:** v1.0.0

---

## สารบัญ

1. [ภาพรวมและบทวิเคราะห์ปัญหาปัจจุบัน](#1-ภาพรวมและบทวิเคราะห์ปัญหาปัจจุบัน)
2. [ข้อกำหนด Loading Contract Spec](#2-ข้อกำหนด-loading-contract-spec)
3. [Test Seams และ Test Suites ที่รองรับ Red-Capable](#3-test-seams-และ-test-suites-ที่รองรับ-red-capable)
4. [แผนการแบ่ง Implementation Slices (< 30 นาที/slice)](#4-แผนการแบ่ง-implementation-slices--30-นาทีslice)
5. [ข้อสันนิษฐานและความเสี่ยง (Assumptions & Risks)](#5-ข้อสันนิษฐานและความเสี่ยง-assumptions--risks)
6. [อ้างอิงข้ามเอกสาร](#6-อ้างอิงข้ามเอกสาร)

---

## 1. ภาพรวมและบทวิเคราะห์ปัญหาปัจจุบัน

จากการตรวจสอบทั้งใน Audit Log และ Real-Browser Execution Harness พบจุดบกพร่องหลัก 5 ประการในระบบ Loading และ Search ดังนี้:

1. **Multi-Overlay Boot Competition**: ในช่วง initial load และ page refresh มี 3 ระบบแข่งขันกันทำ overlay (`nc-early-overlay` ใน `nav-core-early.js`, `fv-boot-loader` ใน `discover/index.html`, และ FVL fullscreen mount/unmount cycle ซ้ำ 2 รอบใน `init.js`) ส่งผลให้เกิดการกระพริบซ้ำซ้อน
2. **Navigation Controls Obscured**: การกดปุ่มหมวดหมู่ (เช่น "Symbols") มีการใช้ `body.fvl-nav-mode.nav-loading` ที่ตั้งค่า header nav เป็น `opacity: 0.4` และ `pointer-events: none` ร่วมกับการเปิด fullscreen FVL ทับทั้งหน้าแทนที่จะใช้ scoped loader เฉพาะส่วนเนื้อหา `#content-loading`
3. **Top-Left Unlocalized English Flash**: `nav-core-early.js` (line 76) มีการ hardcode `<div id="nc-early-msg">Loading…</div>` ที่มุมซ้ายบน (`left:0, top:0, z-index:99999`) ก่อนที่ `FvLang` หรือ FVL จะทำงาน
4. **Search Race Conditions**:
   - `_scheduleFuseUpgrade(q, type)` ใน `search-service.js` (lines 67-87) ล็อคค่า `type` ไว้ใน closure ขณะสร้าง Fuse.js index เมื่อการสร้างเสร็จสมบูรณ์ `checkFuse()` จะรันด้วย `type` เก่าทับค่าตัวกรองใหม่ที่ผู้ใช้อาจกดเลือกระหว่างนั้น
   - `__pendingSearch` ใน `search.js` เก็บเฉพาะ `{ q, type }` โดยทำตกหล่น `category` เมื่อระบบพร้อมจะสั่ง `replaceSearch` รีเซ็ต category กลับเป็น `'all'` และเกิดประวัติการท่องเว็บซ้ำซ้อนจาก `pushState` ตามด้วย `replaceState`
5. **Modal Backdrop Interaction Handling**: `.fp-overlay` ใน `popup.css` (line 636) วาง z-index: 500 ครอบทั้ง screen ซึ่งหากป๊อบอัพถูกปิดหรือไม่ได้แอกทีฟแต่ DOM ลอยอยู่ จะดักจับ click events ทั่วทั้งหน้า

---

## 2. ข้อกำหนด Loading Contract Spec

### 2.1 Initial Boot Readiness vs Content Loading
- **Single Phase Lifecycle Rule**: การโหลดเริ่มต้น (Boot/Refresh) ต้องมี Loading Phase เพียง phase เดียว ตั้งแต่เริ่มโหลดหน้าเพจจนถึงเวลารูปแบบ content DOM ใน `#content-container` พร้อมแสดงผลจริง
- **Cleanup Handshake**: เมื่อ `NavCore` / `InitService` โหลดข้อมูล async เสร็จ ให้สั่งถอด `fv-boot-loader` และ `nc-early-overlay` ออกในครั้งเดียว โดยห้ามสลับเปิด FVL fullscreen overlay ขึ้นมารับช่วงอีกรอบ เว้นแต่เป็นการเปลี่ยนเส้นทาง (Route change)
- **Top-Left Label Compliance**: ยกเลิกข้อความ hardcoded English "Loading…" ที่มุมซ้ายบน ใช้ visual ring spinner ขนาดกะทัดรัด หรือดึงข้อความจาก `FvLang.get('loading')` ให้ตรงตามภาษาที่ผู้ใช้เลือกใน `localStorage.selectedLang`

### 2.2 Scoped Button Loading & Interaction Isolation
- **Scoped Target Contract**: การคลิกปุ่มนำทาง (Main/Sub nav buttons) หรือปุ่มแอคชันบนหน้า Discover **ต้องไม่ใช้วิธี** `body.fvl-nav-mode.nav-loading` ที่ปิดการทำงานของ Header navigation
- **Scoped Feedback**: ให้ใช้ `FVL.scoped({ target: '#content-loading', overlay: false })` หรือ `FVL.inline({ target: buttonEl })` โดยปุ่มที่ถูกคลิกและ Header nav ต้องยังมองเห็นได้และตอบสนองได้ ( clickable / accessible )
- **Accessibility Attributes**: ขณะโหลดให้ตั้งค่า `aria-busy="true"` บนคอนเทนเนอร์เป้าหมาย และเปลี่ยนเป็น `aria-busy="false"` เมื่อโหลดสำเร็จหรือเกิดข้อผิดพลาด ตามมาตรฐาน W3C WAI-ARIA

### 2.3 Cancellation & Race Prevention
- **In-flight Request Abort**: เมื่อผู้ใช้เปลี่ยนหมวดหมู่หรือเปลี่ยนเส้นทางก่อนที่คำขอเดิมจะเสร็จ ให้ส่ง `AbortController.abort()` ยกเลิกคำขอ async เดิมทันที และทำลาย FVL instance ที่ผูกอยู่กับคำขอนั้น
- **Dynamic Filter State Resolution**: ใน `search-service.js` ฟังก์ชัน `checkFuse()` ต้องอ่านค่า `State.selectedType` จาก state ล่าสุด ณ เวลาที่ Fuse พร้อม ไม่ใช้ค่า `type` จาก closure parameter
- **Pending Search Envelope Contract**: `window.__pendingSearch` ต้องบันทึก context ครบถ้วน ได้แก่ `{ q: string, type: string, category: string }` และเมื่อ drain คิว ให้รันผ่าน `doSearch(null, true)` เพียงครั้งเดียวเพื่อป้องกันปัญหา history stack duplicate

### 2.4 Error Handling & Fallbacks
- **Graceful Error State**: เมื่อ fetch ข้อมูลล้มเหลว (Network Failure / Timeout) FVL ต้องเคลียร์ loader ออกทันที และแสดง inline error boundary พร้อมปุ่ม "ลองอีกครั้ง" (Retry) ในพื้นที่ content โดยมี `aria-live="assertive"`
- **Modal Backdrop Inactive Rule**: ใน `popup.css` ให้เพิ่ม rule สำหรับ `.fp-overlay` ที่ไม่อยู่ในสถานะ active หรือมี `aria-hidden="true"` ให้มี `pointer-events: none` เพื่อไม่ให้บดบังคลิกของผู้ใช้ ขณะที่ยังคงรักษาพฤติกรรม modal backdrop ที่ใช้งานจริงอยู่ (`aria-modal="true"`)

### 2.5 Accessibility & Reduced Motion (MDN / W3C Standard)
- **Accessible ARIA Standards**: Loader Container ต้องมี `role="status"` และ `aria-live="polite"`
- **Reduced Motion**: ภายใต้สื่อ `@media (prefers-reduced-motion: reduce)` ให้ระงับ CSS spin animation (`animation: none`) และการเปลี่ยนผ่าน (`transition: none`) โดยแสดง static indicator เพื่อป้องกันปัญหากับผู้ใช้ที่แพ้การเคลื่อนไหว

### 2.6 Search Consumers & Central FVL Namespace
- **Centralized Namespace**: คงความสมบูรณ์ของ `window.FVL` และ proxy `LoadingService` สำหรับย้อนหลัง
- **Unified Z-Index Hierarchy**:
  - `fullscreen`: 17000
  - `scoped`: 1600
  - `inline`: 0
  - `topbar`: 17500

---

## 3. Test Seams และ Test Suites ที่รองรับ Red-Capable

### 3.1 Unit / Integration Test Seams (Vitest + Happy-DOM)
- **Seam 1: `tests/loading-contract.test.ts`**
  - ตรวจสอบ `FVL.show()` การจัดการ lifecycle, DOM injection/cleanup
  - ตรวจสอบ `aria-busy` attribute management และ z-index resolution
  - ตรวจสอบ CSS reduced-motion declarations
  - ตรวจสอบ proxy compatibility ของ `LoadingService.show/hide`
- **Seam 2: `tests/search-races.test.ts`**
  - จำลอง async Fuse upgrade และทดสอบว่า `State.selectedType` ที่ถูกเปลี่ยนจะไม่ถูก overwrite ด้วย closure ค่าเก่า
  - ตรวจสอบว่า `window.__pendingSearch` รักษาฟิลด์ `category` ครบถ้วน
  - ตรวจสอบการส่งผลต่อ history stack (`pushState` vs `replaceState`)

### 3.2 End-to-End Browser Test Seams (Playwright Chromium)
- **Seam 3: `e2e/discover-loading-contract.spec.ts`**
  - ตรวจสอบว่าในระหว่าง boot/refresh มีการแสดง overlay เพียงเฟสเดียวจนกระทั่งคอนเทนต์พร้อม
  - ตรวจสอบการคลิกปุ่ม Symbols/Categories ว่า Header Navigation ไม่ถูกทำให้จาง (`opacity < 1`) หรือคลิกไม่ได้ (`pointer-events: none`)
  - ตรวจสอบว่าไม่มีข้อความ hardcoded English "Loading…" แสดงผลที่มุมซ้ายบนของหน้าจอ
- **Seam 4: `e2e/search-consumer-races.spec.ts`**
  - สลับแท็บตัวกรองประเภทการค้นหาอย่างรวดเร็วขณะที่ Fuse.js กำลังโหลด เพื่อยืนยันว่าผลลัพธ์การค้นหาตรงตามตัวกรองปัจจุบัน

---

## 4. แผนการแบ่ง Implementation Slices (< 30 นาที/slice)

| Slice | ขอบเขตงาน (Scope) | ไฟล์ที่แก้ไข (Target Files) | การทดสอบที่เกี่ยวข้อง (Tests) | เวลาประเมิน |
|---|---|---|---|---|
| **Slice 1** | **Central Loader Architecture & API Unification**: รวม z-index tokens, อัปเดต `aria-busy` และรองรับ `prefers-reduced-motion` ใน FVL core | `assets/js/loading-system/fvl.js`<br>`assets/css/loading-system.css`<br>`assets/js/nav-core-modules/loading.js` | `vitest run tests/loading-contract.test.ts` | 30 นาที |
| **Slice 2** | **Discover Boot Lifecycle & i18n Label Clean**: รวม boot loader ให้จบใน phase เดียว ลบ hardcoded `#nc-early-msg` Top-Left text | `assets/js/nav-core-early.js`<br>`data/verse/discover/index.html`<br>`assets/js/nav-core-modules/init.js` | `npx playwright test e2e/discover-loading-contract.spec.ts` | 25 นาที |
| **Slice 3** | **Discover Scoped Action Loading & Nav Isolation**: ยกเลิก `body.fvl-nav-mode.nav-loading` บน button click เปลี่ยนเป็น scoped loader ไม่บัง nav | `assets/js/nav-core-modules/router.js`<br>`assets/css/loading-system.css` | `npx playwright test e2e/discover-loading-contract.spec.ts` | 25 นาที |
| **Slice 4** | **Search Race Conditions & Category Preservation**: แก้ไข closure parameter ใน `_scheduleFuseUpgrade` และรักษา `category` ใน `__pendingSearch` | `assets/js/search-system/search-modules/search-service.js`<br>`assets/js/search-system/search.js` | `vitest run tests/search-races.test.ts`<br>`npx playwright test e2e/search-consumer-races.spec.ts` | 25 นาที |
| **Slice 5** | **Popup Backdrop Pointer-Events Handling**: เพิ่ม `pointer-events: none` บน `.fp-overlay` ที่ inactive/hidden | `assets/css/popup.css` | `vitest run tests/popup-backdrop.test.ts` | 20 นาที |

---

## 5. ข้อสันนิษฐานและความเสี่ยง (Assumptions & Risks)

### ข้อสันนิษฐาน (Assumptions)
1. สภาพแวดล้อมระบบทดสอบทั้ง `vitest` (happy-dom) และ `playwright` (Chromium headless) พร้อมใช้งานโดยไม่ต้องพึ่งพาบริการภายนอก
2. ผู้เรียกใช้ระบบ Loading เดิมผ่าน `LoadingService` หรือ `window._navCore_contentLoadingManager` จะถูกส่งต่อการทำงานไปยัง `FVL` อย่างราบรื่นผ่าน proxy layer

### ความเสี่ยงและการรับมือ (Risks & Mitigations)
1. **Timing Gaps จาก IIFE Scripts**: สคริปต์ IIFE ของระบบค้นหาและ navigation ปล่อยโหลดแบบแยกไฟล์ หาก `FVL` เรียกใช้ก่อน `fvl.js` ทำงานเต็มรูปแบบอาจเกิด Error  
   *การรับมือ*: คง `window.LoadingService` stub ไว้ล่วงหน้าใน `nav-core-early.js`
2. **Backdrop Class Collision บน Popup**: การปรับ `.fp-overlay` อาจกระทบ modal dialogs อื่นในแอป  
   *การรับมือ*: กำหนดเงื่อนไข `pointer-events: none` เฉพาะกรณีที่มี attribute `aria-hidden="true"` หรือไร้ class `.fp-overlay-active` เท่านั้น

---

## 6. อ้างอิงข้ามเอกสาร

- [`07-Loading-System.md`](./07-Loading-System.md) — รายละเอียดสถาปัตยกรรมระบบ Loading (FVL)
- [`02-Search-System.md`](./02-Search-System.md) — ระบบค้นหาแบบ Two-Tier และ IIFE Architecture
- [`03-Navigation-And-Content.md`](./03-Navigation-And-Content.md) — การนำทางและ Lifecycle ของ Nav-Core
- [`13-Documentation-Standard.md`](./13-Documentation-Standard.md) — มาตรฐานการเขียนเอกสารของ FanHoard
- [`AI_CODING_GUIDE.md`](./AI_CODING_GUIDE.md) — ข้อกำหนดและมาตรฐานการเขียนโค้ด
- [`AI_FORBIDDEN.md`](./AI_FORBIDDEN.md) — กฎเหล็กและข้อห้ามในการพัฒนา

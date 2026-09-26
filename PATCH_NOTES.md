# FanHoard Typed Loading System — v2.0 Patch (Typed In-Flow Architecture)

วางไฟล์ทั้งหมดใน patch นี้ทับลงบน repo ตามโครงสร้างเดิม — แตก ZIP แล้ว copy ทับได้เลย

## สรุปการเปลี่ยนแปลง (Summary of Changes)

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `assets/js/loading-system/fvl.js` | ปรับโครงสร้างเป็น Typed v2 Engine รองรับ `FVL.show({ type })` และ API shortcuts (`FVL.page`, `FVL.content`, `FVL.component`, `FVL.global`), กำหนด `data-fvl-type` และรักษาระดับ scroll (`window.scrollY`) บน contextual teardown |
| `assets/css/loading-system.css` | เพิ่ม CSS `.fvl-page`, `.fvl-content`, `.fvl-component`, `.fvl-global`, จองพื้นที่ min-height, ใช้ `100dvh` สำหรับ global overlays, และปรับเวอร์ชันใน header เป็น `v2.0.0` |
| `assets/css/loading.css` | เพิ่มกฎ CSS `min-height: calc(100dvh - 120px)` สำหรับ `#content-loading` เพื่อป้องกัน Layout Shift (CLS < 0.1) |
| `assets/js/nav-core-modules/loading.js` | ปรับ `LoadingService.showInContent()` ให้ใช้ `type: 'page'` ใน `#content-loading` |
| `assets/js/nav-core-modules/content.js` | เพิ่ม `skipScroll: true` บนการโหลดข้อมูลในหน้าเดิม เพื่อรักษาระแหน่ง scroll ของผู้ใช้ ไม่กระโดดกลับขึ้นบนสุด |
| `data/verse/discover/index.html` | ย้าย `#fv-boot-loader` จาก root body เข้ามาเป็น SSG in-flow slot ภายใน `#content-loading` |
| `fanhoard-docs/07-Loading-System.md` | อัปเดตเอกสารหลักสถาปัตยกรรม Typed Loading v2, In-Flow Boot, Scroll Preservation, และบทเรียน Anti-Patterns |
| `fanhoard-docs/15-Loading-Contract-And-Test-Plan.md` | อัปเดต Contract Specification, Display Modes Table, Test Seams, และ Implementation Plan |

## พฤติกรรมใหม่ (New Behavior Comparison)

### ก่อนหน้า (Round 1 / Legacy Overlay)
- Boot loader เป็น Viewport Cover Overlay (`position: fixed; inset: 0`) บดบัง Header Navigation
- บนมือถือเมื่อ browser URL bar ซ่อน/แสดง เกิดช่องว่างเห็นเนื้อหาข้างหลังเลื่อน
- เมื่อโหลดข้อมูลเสร็จ หน้าจอจะกระโดดกลับขึ้นบนสุด (`window.scrollTo(0, 0)`)
- ไม่มี API ระบุประเภท/ขอบเขตการโหลดที่ชัดเจน

### ตอนนี้ (Typed Loading v2 Architecture)
- ระบุขอบเขตการโหลดชัดเจนผ่าน Typed API (`page`, `content`, `component`, `global`)
- Boot loader แสดงผลแบบ In-Flow Slot อยู่ภายในพื้นที่เนื้อหา (`#content-loading`)
- แถบ Header Navigation และเมนูต่างๆ แสดงผล Unblocked สามารถกดได้ทันทีตั้งแต่วินาทีแรก
- รักษาระดับ Scroll เดิมของผู้ใช้ (`window.scrollY`) เมื่อโหลดข้อมูลในหน้าเดิม ไม่กระโดดกลับขึ้นบนสุด
- ใช้ dynamic viewport (`100dvh`) และ in-flow layout ป้องกันปัญหา URL-bar ช่องว่างบนมือถือ

---

# FanHoard Search — v6.1 Patch (Google-like non-sticky filters)

วางไฟล์ทั้งหมดใน patch นี้ทับลงบน repo ตามโครงสร้างเดิม — แตก ZIP แล้ว copy ทับได้เลย

## สรุปการเปลี่ยนแปลง

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `search/index.html` | โครงสร้างใหม่ — ย้าย filter pills ออกจาก `#search-sticky` ไปเป็น sibling `.search-filters-panel` |

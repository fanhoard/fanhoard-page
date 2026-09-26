# FanHoard Contextual Loading System — v1.0 Patch (In-Flow Loading Architecture)

วางไฟล์ทั้งหมดใน patch นี้ทับลงบน repo ตามโครงสร้างเดิม — แตก ZIP แล้ว copy ทับได้เลย

## สรุปการเปลี่ยนแปลง

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `assets/js/loading-system/fvl.js` | เพิ่ม `mode: 'boundary'`, per-boundary reference counting (`_boundaryRefs`), monotonic request tokens (`requestId`), และ `clearAllBoundaryRefs()` สำหรับ route change cleanup |
| `assets/css/loading-system.css` | เพิ่ม CSS `.fvl-boundary` สำหรับการแสดงผลแบบ in-flow ใน document flow ปกติ ไม่ใช้ `position: fixed` หรือ `z-index` ซ้อนทับ ปรับเวอร์ชันใน header เป็น `v1.0.0` ตรงกับ fvl.js |
| `assets/css/loading.css` | เพิ่มกฎ CSS `min-height: 180px` สำหรับ `#content-loading` เพื่อป้องกัน Layout Shift (CLS) |
| `assets/js/nav-core-modules/loading.js` | ปรับ `LoadingService.showInContent()` ให้เรียกใช้ `boundary` mode ใน `#content-loading` และอัปเดต `_forceReset()` ให้ล้าง boundary instances |
| `assets/js/nav-core-modules/router.js` & `init.js` | อัปเดต route transitions และ early loading ให้โหลดแบบ in-flow ในพื้นที่เนื้อหา |
| `fanhoard-docs/07-Loading-System.md` | อัปเดตเอกสารหลักสถาปัตยกรรม Contextual In-Flow Loading, Display Modes, Boundary Levels, API, และแนวปฏิบัติ |
| `fanhoard-docs/15-Loading-Contract-And-Test-Plan.md` | อัปเดต Contract, Test Plan, และแก้ข้อขัดแย้งเรื่อง Nav Dimming |

## พฤติกรรมใหม่

### ก่อนหน้า
- การเปลี่ยนหน้า/หมวดหมู่แสดง Fullscreen หรือ Scoped Overlay ทับหน้าจอ
- บังแถบ Nav ด้านบน และอาจล็อคการ Scroll ของผู้ใช้
- Header Nav ถูกจางแสง (`opacity: 0.4`) และกดไม่ได้ระหว่างโหลด

### ตอนนี้ (In-Flow Contextual Loading)
- แสดง Spinner ภายในพื้นที่เนื้อหา (`#content-loading`) ใน document flow ปกติ
- ไม่ใช้ `position: fixed` หรือ `z-index` ซ้อนทับหน้าจอ
- ผู้ใช้สามารถ Scroll หน้าจอได้อย่างอิสระ Loading area เลื่อนตามเอกสารตามธรรมชาติ
- แถบ Header Nav และ Footer ทำงานได้ตลอดเวลา สามารถกดเปลี่ยนหมวดหมู่หรือเมนูอื่นได้ทันที
- มีการจองพื้นที่ `min-height: 180px` เพื่อป้องกันหน้าจอกระตุก (CLS < 0.1)

---

# FanHoard Search — v6.1 Patch (Google-like non-sticky filters)

วางไฟล์ทั้งหมดใน patch นี้ทับลงบน repo ตามโครงสร้างเดิม — แตก ZIP แล้ว copy ทับได้เลย

## สรุปการเปลี่ยนแปลง

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `search/index.html` | โครงสร้างใหม่ — ย้าย filter pills ออกจาก `#search-sticky` ไปเป็น sibling `.search-filters-panel` |

# แพตช์แก้ไขการเรนเดอร์ผลลัพธ์ค้นหา และคืนอนิเมชั่น Active ต้นฉบับ (v3.2.13)

วางไฟล์ทั้งหมดใน patch นี้ทับลงบน repo ตามโครงสร้างเดิม — แตก ZIP แล้ว copy ทับได้เลย

## สรุปการเปลี่ยนแปลง (v3.2.13 - แก้การเรนเดอร์ Search + คืนอนิเมชั่น .active)

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `assets/js/ure/ure.css` | เพิ่ม keyframe `ure-appear-fade` (fade เฉพาะ opacity) สำหรับ wrapper `.ure-visible:not(.ure-settled)` ไม่แตะ transform ของ engine อีกต่อไป — แก้การ์ดซ้อนกันบนหน้าค้นหา; `.cm-group` / `.feed-page` ยังใช้ `ure-appear` เดิม |
| `assets/css/nav-core.css` | คืนอนิเมชั่น underline ต้นฉบับ: inactive = `transform 200ms ease-in`, `.active` = `transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)` (spring overshoot) |
| `assets/css/nav-core-ext.css` | ตัด `transform: scale(0.97)` ถาวรออกจาก `.button-sub.active` — เหลือเฉพาะตอนกด (`:active`) |
| `e2e/search-refresh-regression.spec.ts` | เพิ่มเทส guard กันการ์ดซ้อน (ตรวจตำแหน่งไม่ซ้ำกันหลัง render) |
| `assets/md/en/current.md`, `assets/md/th/current.md` | โน้ตรีลีส v3.2.13 (EN/TH) |
| `assets/md/{en,th}/releases/*`, `assets/json/version.json`, HTML/loaders | ของที่ release pipeline สร้างให้อัตโนมัติ |

## รายละเอียดบั๊กที่แก้

บนหน้า Search การ์ดผลลัพธ์เคยซ้อนกันที่ตำแหน่งเดียว เห็นเฉพาะใบบนสุด: URE virtual scroll วาง wrapper ด้วย inline `transform` แต่อนิเมชั่น appear ของ v3.2.8 animate `transform` บน `.ure-visible` ด้วย ซึ่ง CSS animation override inline style ทุกใบเลยกลายเป็น `translateY(0)` ตอนนี้ wrapper ของ URE fade opacity เท่านั้น และมี E2E guard กันเกิดซ้ำ

## ผลการทดสอบ

- Unit: 234/234 ผ่าน (37 ไฟล์) | E2E เต็มชุด: 16/16 ผ่าน (รวม scroll-lock 3/3)
- ตรวจในเบราว์เซอร์จริง: การ์ดหน้าต่างแรก 12/12 อยู่คนละตำแหน่ง มองเห็นครบ หน้า discover เรนเดอร์ตาม flow ปกติ

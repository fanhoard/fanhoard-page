# แพตช์ Data Verse ดีไซน์ใหม่ (v3.2.19)

วางไฟล์ทั้งหมดใน patch นี้ทับลงบน repo ตามโครงสร้างเดิม — แตก ZIP แล้ว copy ทับได้เลย

## สรุปการเปลี่ยนแปลง (v3.2.19 - Data Verse Redesign)

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `assets/css/nav-core-ext.css` | การ์ดฟีด radius-lg 16px (ตามสเปก ไม่ใช่ xl 24px ที่ token ยกค่าแล้ว) + hover เงา shadow-sm พร้อม transition, focus ring 3px มาตรฐานใหม่ 3 จุด, กำจัด fallback teal ยุค Material 2 จุด, ขอบ rgba(0,0,0,0.06) เก่า 3 จุด, แก้ var ซ้อนกัน 4 แบบ |
| `assets/js/ure/ure.css` | skeleton shimmer ใช้พื้นกลาง v3 + radius 12px, curve ของ ure-appear/ure-appear-fade → มาตรฐาน cubic-bezier(0.2,0,0,1), render-error ใช้พาเลตต์ danger ใหม่ |
| `assets/css/modern-styles.css` | fallback scope-card ปรับตาม v3, bottom nav กำจัด #009688 เก่า (stroke + ring), label active ใช้ --color-brand-hover |
| `assets/md/en/current.md`, `assets/md/th/current.md` | โน้ตรีลีส v3.2.19 (EN/TH) |
| `assets/md/{en,th}/releases/*`, `assets/json/version.json`, HTML/loaders | ของที่ release pipeline สร้างให้อัตโนมัติ |

## จุดสำคัญที่ต้องรู้

- **ข้อห้ามเหล็กครบ**: wrapper `.ure-visible` ยังอนิเมต opacity อย่างเดียว (กันการ์ดซ้อน) — transform reveal อยู่ที่ `.cm-group`/`.feed-page` ที่เป็นเนื้อหาข้างใน ไม่ชนการวางตำแหน่งของ engine
- **หน้า scope**: การ์ดใช้คลาสคู่ `.scope-card fv-card` — atom `fv-card` กลาง (24px, เงา 0 ตอนพัก = มาตรฐาน S-series) ชนะใน cascade และนั่นคือภาษาการ์ดทั้งเว็บ จึงยืนยันรับสถานะนี้ ส่วนที่แก้ใน modern-styles.css เป็นการปรับ fallback ให้ถูก v3

## ผลการทดสอบ

- Unit: 234/234 (37 ไฟล์) | Build: สะอาด | e2e เต็ม: 16/16 (discover suite + scroll-lock = 9 ผ่าน)
- Effective DOM จริง (Playwright, discover × light/dark × 375/768/1280 + scope × light/dark): ไทล์ 180 + การ์ด 2, radius 16px, พื้นรับธีม (dark `rgb(30,41,59)`), grid ปรับ 4→6 คอลัมน์ตามความกว้าง, scope การ์ด 24px มาตรฐาน fv-card ครบทั้งสองธีม

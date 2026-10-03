# แพตช์ระบบนำทางดีไซน์ใหม่ (v3.2.15)

วางไฟล์ทั้งหมดใน patch นี้ทับลงบน repo ตามโครงสร้างเดิม — แตก ZIP แล้ว copy ทับได้เลย

## สรุปการเปลี่ยนแปลง (v3.2.15 - Navigation Redesign)

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `assets/css/top-navigation-bar.css` | แก้บั๊ก `--fv-surface-nav` ไม่เคยถูก define (9 หน้าโชว์ top bar ขาวใน dark mode) → ใช้ `--fv-surface-page`, border → `--border-subtle`, ปุ่ม back → pill ทรงกลม + active state รับธีม, motion → 150ms มาตรฐาน |
| `assets/css/nav-core.css` | motion ท็อบหลัก 180ms hardcoded → `--transition-fast` (อนิเมชั่นเส้นใต้สปริง .active ไม่ถูกแตะ) |
| `assets/css/nav-core-ext.css` | motion ปุ่ม sub-nav / content tile / feed card รวม 10 จุด → `--transition-fast` |
| `assets/md/en/current.md`, `assets/md/th/current.md` | โน้ตรีลีส v3.2.15 (EN/TH) |
| `assets/md/{en,th}/releases/*`, `assets/json/version.json`, HTML/loaders | ของที่ release pipeline สร้างให้อัตโนมัติ |

## จุดเด่น

- **แก้บั๊กจริง 1 จุด:** top bar 9 หน้ารอง (About, License, Privacy, Roadmap, What's New, Community ×3, Data Verse Scope) เคย fallback ขาวเงียบ ๆ ใน dark mode
- **Motion ภาษาเดียว:** 15 จุด transition กระจัดกระจายถูก normalize เป็น `150ms cubic-bezier(0.2,0,0,1)` ผ่าน token
- **อนิเมชั่นสปริงรอดครบ:** assert ในสคริปต์ก่อนเขียนไฟล์ + ตรวจ computed style จริงใน browser หลังเขียน (ทั้ง 6 คอมโบธีม×breakpoint ยืนยัน `transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)`)
- ส่วนที่เหลือของภาพใหม่ (radius 12/16/24px, border จาง, canvas #FAFAFC) ไหลมาจาก token ของ r01 อัตโนมัติ — ตรวจยืนยัน ไม่ Assume

## ผลการทดสอบ

- Unit: 234/234 ผ่าน (37 ไฟล์) | Build: ผ่านสะอาด | scroll-lock e2e: 3/3
- Effective DOM จริง (Playwright): header light `rgb(250,250,252)` / dark `rgb(15,23,42)`, top bar `/platform/about` dark = `rgb(15,23,42)` + border `rgb(51,65,85)` + back pill `9999px`

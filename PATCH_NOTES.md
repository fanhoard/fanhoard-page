# แพตช์ Global Consistency Sweep (v3.2.24) — รอบโค้ดสุดท้าย

วางไฟล์ทั้งหมดใน patch นี้ทับลงบน repo ตามโครงสร้างเดิม — แตก ZIP แล้ว copy ทับได้เลย (โฟลเดอร์ `r11-shots/` คือหลักฐานสกรีนช็อต 28 ภาพ เก็บหรือทิ้งได้)

## สรุปการเปลี่ยนแปลง (v3.2.24 - Global Consistency Sweep)

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `assets/css/footer.css` | transition เก่า (--ease-in-out/--ease-out) → transition tokens v3, var ซ้อนคลาย, focus ring 3px เทล ×3 |
| `assets/css/back-to-top.css` | เทลเก่า #009688 → #0d9488, hover → #0F766E, curve → tokens, ring 3px |
| `assets/css/base.css`, `assets/css/modern-styles.css` | ghost ease-out → tokens, #757575 → #475569 |
| `assets/js/setting-system/theme-core.js` | **บั๊กจริงจาก audit**: default theme เมื่อไม่มี preference เดิม `'dark'` (มรดก v2) → `'system'` ตาม OS — หน้า setting เคยบังคับมืดทั้งที่เว็บอื่นสว่าง |
| `assets/js/setting-system/setting-ui.js` | fallback `'dark'` → `'system'` ×2 |
| `assets/js/footer-template.js` | guard การแทรก footer เปลี่ยนเป็นเช็คจากลิงก์จริง (footer ว่างไม่ block การแทรกใหม่) |
| `tests/settings-polish.test.ts` | default pin 'dark' → 'system' ตามสเปก v3 (โครงสร้าง assertion คงเดิม) |
| `assets/md/{en,th}/current.md` + releases | โน้ตรีลีส v3.2.24 ฟอร์แมต parser-compatible |

## ผลการตรวจทั้งเว็บ (14 หน้า × light+dark)

28/28 combos: พื้นตามธีมครบ, footer 12 ลิงก์ทุกหน้า ไม่ซ้ำไม่ว่าง, ไม่มี horizontal overflow ทั้ง 1280 และ 375, focus ring 3px เทลบน interactive จริงทุกหน้า (false positive ที่เคลียร์แล้ว: outline 404 มี style `none` จริง, license โดน Cookiebot iframe แฝก)

## ผลทดสอบ

- Unit: 234/234 (37 ไฟล์) | Build: สะอาด | e2e เต็ม: 16/16
- ยืนยันบั๊กแก้จริงบน browser: บริบท OS light สด → setting พื้น #FAFAFC + radio=System + data-theme=light; OS dark → #0F172A + System + dark

# แพตช์ป๊อปอัปและโมดัลดีไซน์ใหม่ (v3.2.17)

วางไฟล์ทั้งหมดใน patch นี้ทับลงบน repo ตามโครงสร้างเดิม — แตก ZIP แล้ว copy ทับได้เลย

## สรุปการเปลี่ยนแปลง (v3.2.17 - Popup & Modal Redesign)

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `assets/css/popup.css` | แก้บล็อก CSS พัง (selector `.fp-popup` เปล่า + alert/confirm rule ถูกกลืนเป็น rule เดียว ทำให้ popup ทุกอันได้ `color:#334155`), v3 ทั้งชุด: radius 24px, surface/border/shadow ใช้ token, ปุ่ม pill, motion 250ms มาตรฐาน, sheet/tooltip/popover/fullscreen รับธีม |
| `assets/js/popup-modules/theme.js` | กำจัด ghost token 8 ตัว (fv-text-heading/muted/body, fv-border-default/teal-strong, fv-brand-cyan-accent, fv-radius-md, fv-shadow-lg), พาเลตต์ dark เดิม #1a1f2e → v3 slate (#1E293B/#F8FAFC) |
| `assets/js/popup-modules/engine.js` | popup เปิดตามธีมเว็บอัตโนมัติ (data-theme → prefers-color-scheme; เดิม hardcode 'light') |
| `assets/md/en/current.md`, `assets/md/th/current.md` | โน้ตรีลีส v3.2.17 (EN/TH) |
| `assets/md/{en,th}/releases/*`, `assets/json/version.json`, HTML/loaders | ของที่ release pipeline สร้างให้อัตโนมัติ |

## บั๊กจริงที่แก้ (3 จุด)

1. **CSS malformed block**: บล็อก "WCAG AA Small Text Teal Overrides" จบด้วย `.fp-popup` เปล่าไม่มีปีกกา ทำให้ browser รวม rule ถัดไปเข้า selector เดียว — popup ทุกอันได้สี text `#334155` (อ่านยากบนการ์ดเข้ม) + padding แปลก
2. **Ghost tokens 8 ตัว** ใน theme.js: อ้าง token ที่ไม่มีอยู่จริง สไตล์เสียเงียบ (ตระกูลบั๊กเดียวกับ --fv-surface-nav ที่ r02 เจอ)
3. **พาเลตต์ dark นอกสารบบ**: #1a1f2e → slate-800/slate-50 ตรงพาเลตต์เว็บ

## ผลการทดสอบ

- Unit: 234/234 ผ่าน (37 ไฟล์) | Build: ผ่านสะอาด | scroll-lock e2e: 3/3
- Effective DOM จริง (Playwright, dialog + confirm × light + dark): radius 24px, dark = bg `rgb(30,41,59)` + text `rgb(248,250,252)`, auto-theme ทำงาน, สี text รั่ว `#334155` หาย

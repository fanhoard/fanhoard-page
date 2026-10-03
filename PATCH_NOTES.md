# แพตช์ Toast และ Feedback ดีไซน์ใหม่ (v3.2.16)

วางไฟล์ทั้งหมดใน patch นี้ทับลงบน repo ตามโครงสร้างเดิม — แตก ZIP แล้ว copy ทับได้เลย

## สรุปการเปลี่ยนแปลง (v3.2.16 - Toast Redesign)

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `assets/css/popup.css` | fp-toast → แคปซูล pill 9999px, พื้น/border/เงาใช้ token รับธีม, สี 4 สถานะย้ายจากเส้นขอบซ้าย 4px เป็นจุดสถานะผ่าน `--fp-toast-dot` |
| `assets/js/copyNotification.js` | cn-capsule → pill รับธีม แก้บั๊กขาวบอดใน dark mode, สีทุกตัว tokenize, motion 250ms curve มาตรฐาน |
| `assets/js/popup-modules/config.js` | TOAST_ENTER 320 → 250ms |
| `assets/js/popup-modules/renderer.js` | toast warning ประกาศ `aria-live="assertive"` (เดิม polite) |
| `tests/popup/popup-polish.test.ts` | อัปเดตค่า timing ที่ test pin จาก 320 เป็น 250ms ตามสเปกใหม่ |
| `assets/md/en/current.md`, `assets/md/th/current.md` | โน้ตรีลีส v3.2.16 (EN/TH) |
| `assets/md/{en,th}/releases/*`, `assets/json/version.json`, HTML/loaders | ของที่ release pipeline สร้างให้อัตโนมัติ |

## จุดเด่น

- **แก้บั๊ก dark mode 2 จุด:** toast และแคปซูล copy เคย hardcode พื้นขาวไม่รับธีม — ตอนนี้ dark = `rgb(30,41,59)` ตรวจจริงใน browser
- **สีสถานะอ่านง่าย:** จุด emerald (สำเร็จ) / แดง (error) / อำพัน (warning) / teal (info) ธีมอัตโนมัติ
- **A11y:** role=status + aria-live ครบ, warning ขยับเป็น assertive ตามความเร่งด่วน
- **Motion มาตรฐาน:** เข้าฉาก 250ms `cubic-bezier(0.2,0,0,1)` เดียวกันทั้งเว็บ

## ผลการทดสอบ

- Unit: 234/234 ผ่าน (37 ไฟล์) | Build: ผ่านสะอาด
- Effective DOM จริง (Playwright, 4 สถานะ × light+dark): radius 9999px, พื้น/border/เงารับธีม, aria-live ถูกต้องทุกตัว

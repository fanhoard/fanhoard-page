# แพตช์รากฐานดีไซน์ใหม่ FanHoard Design Language v3 (v3.2.14)

วางไฟล์ทั้งหมดใน patch นี้ทับลงบน repo ตามโครงสร้างเดิม — แตก ZIP แล้ว copy ทับได้เลย

## สรุปการเปลี่ยนแปลง (v3.2.14 - Design Token Foundation: White-First, High-Radius)

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `assets/css/tokens.css` | Design Language v3.0: `--surface-base` light เป็น `#FAFAFC`, radius scale ยกทั้งสเกล (sm 8 / md 12 / lg 16 / xl 24 / 2xl 28px), `--border-subtle` เป็น `rgba(15,23,42,0.08)`, เงานุ่มขึ้น, เพิ่ม `--ease-standard: cubic-bezier(0.2,0,0,1)` ให้ transition tokens, `--fv-surface-page` ชี้ page canvas ทั้ง light/dark |
| `assets/css/base.css` | ปุ่ม `.btn-primary` / `.btn-secondary` เป็นทรง pill (9999px) |
| `assets/md/en/current.md`, `assets/md/th/current.md` | โน้ตรีลีส v3.2.14 (EN/TH) |
| `assets/md/{en,th}/releases/*`, `assets/json/version.json`, HTML/loaders | ของที่ release pipeline สร้างให้อัตโนมัติ |

## หลักการสำคัญ

- **White-first:** พื้นหลังหน้า `#FAFAFC` การ์ดขาวบริสุทธิ์ลอยบน canvas, dark theme คง `#0F172A` / `#1E293B` ผ่าน ThemeCore เดิม
- **High-radius ทั้งระบบ:** ทุก component อ้าง token อยู่แล้ว การยก token ครั้งเดียวทำให้ทั้งเว็บโค้งมนขึ้นโดยไม่ต้องแก้ CSS รายไฟล์
- **อนิเมชั่น .active ของ nav (v3.2.13) ไม่ถูกแตะ:** เป็น hardcoded curve ไม่ได้ใช้ token จึงรอดครบ
- **Alias ทุกตัวยังใช้ได้:** ไม่มีชื่อ custom property ไหนหาย ไฟล์ CSS อื่น 20+ ไฟล์ไม่ต้องแก้เลย

## ผลการทดสอบ

- Unit: 234/234 ผ่าน (37 ไฟล์) — grep ยืนยันก่อนแก้ว่าไม่มี test ผูกค่า token
- Build: SSG + Vite ผ่านสะอาด, sitemap 16 entries
- ตรวจ effective DOM จริงบน vite preview: light body `rgb(250,250,252)`, ปุ่มหลัก radius `9999px`, dark discover body `rgb(15,23,42)`

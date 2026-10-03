# แพตช์ Settings ดีไซน์ใหม่ (v3.2.21)

วางไฟล์ทั้งหมดใน patch นี้ทับลงบน repo ตามโครงสร้างเดิม — แตก ZIP แล้ว copy ทับได้เลย

## สรุปการเปลี่ยนแปลง (v3.2.21 - Settings Redesign)

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `setting/index.html` | บล็อก Appearance ใหม่ (fieldset + radio 3 ใบ: System ◐ / Light ☀ / Dark ☾, input ซ่อนเชิงสถานะเสียง การ์ดเป็น label), โหลด theme-core.js ใน head ก่อน |
| `assets/css/setting.css` | กลุ่มการตั้งค่าเป็นการ์ดพื้นขาว/ธีมมืด 16px ขอบบางเงานุ่ม, การ์ดเลือกธีม 12px — เลือกแล้วขอบ teal + แต้มสีแบรนด์ 9% (color-mix), hover พื้น --surface-hover, focus ring 3px teal มาตรฐาน v3 ทุกตัวควบคุม, ปรับระยะบนมือถือ 480px, ปิด transition เมื่อ prefers-reduced-motion |
| `assets/js/setting-system/setting-ui.js` | เส้นทางใหม่ของ setupThemeControl: sync สถานะ checked จาก ThemeCore, เปลี่ยน = setTheme + toast แจ้งบันทึก, ฟัง event `fv:themechange`; สวิตช์เก่ายังเป็น fallback เมื่อไม่มี radio |
| `assets/md/en/current.md`, `assets/md/th/current.md` | โน้ตรีลีส v3.2.21 (EN/TH) |
| `assets/md/{en,th}/releases/*`, `assets/json/version.json`, HTML assets strings | ของที่ release pipeline สร้าง (รวมไฟล์ v3.2.20 ที่ค้างจากรอบก่อน) |

## จุดสำคัญที่ต้องรู้

- **ThemeCore ไม่ถูกแตะเลย** — การเลือก "System" ยังตาม OS (`fv_theme: "system"` + resolve เป็นธีมจริงตามเครื่อง), ค่าคงอยู่หลัง reload, no-FOUC ตามเดิม
- การเลือกธีมแล้วมี toast "Appearance preference saved" ใช้ระบบ toast r03 (pill ดีไซน์ใหม่)
- ป๊อปอัปแจ้งอัปเดตเวอร์ชัน (notify: true) ยังเด้งตามปกติและปิดได้สะอาด

## ผลการทดสอบ

- Unit: 234/234 (37 ไฟล์) | Build: สะอาด | e2e เต็ม: 16/16 (รวม theme-toggle journey)
- Effective DOM จริง (Playwright, ธีม OS dark): การ์ดกลุ่ม 16px พื้น `#FFFFFF`/dark `#1E293B`; เลือก Light → `data-theme=light` + `fv_theme=light` + toast; reload → คง light, radio=light, body `#FAFAFC`; เลือก System → `fv_theme=system` resolve เป็น dark; โฟกัสด้วยคีย์บอร์ด → ring `3px solid rgba(13,148,136,0.35)`

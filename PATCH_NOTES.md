# แพตช์ Community & Forms ดีไซน์ใหม่ (v3.2.22)

วางไฟล์ทั้งหมดใน patch นี้ทับลงบน repo ตามโครงสร้างเดิม — แตก ZIP แล้ว copy ทับได้เลย

## สรุปการเปลี่ยนแปลง (v3.2.22 - Community & Forms Redesign)

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `assets/css/report.css` | ช่องฟอร์มย้ายไปพื้น `--surface-card` (ขาวจริงบนผืน #FAFAFC), ขอบ fallback ปรับ v3, โฟกัส ring จางเก่า → `0 0 0 3px rgba(13,148,136,0.35)`, focus-visible 3px เทล, กำจัด ghost token `--color-brand-primary-hover` (ไม่มีใน tokens.css) → `--color-brand-hover`, ลูกศร select SVG เทลเก่า `#009688` → `#0d9488`, ปุ่ม submit + contact เป็น pill `--radius-full` พื้น primary hover brand-hover, transition เก่า 5 จุด → `--transition-fast` (easing v3), fallback เทา/ขอบ/เงาเก่าปรับหมด |
| `assets/md/en/current.md`, `assets/md/th/current.md` | โน้ตรีลีส v3.2.22 (EN/TH) |
| release pipeline artifacts | registry/version/HTML asset strings |

## จุดสำคัญที่ต้องรู้

- **พฤติกรรมฟอร์ม S10 ไม่ถูกแตะ**: aria-invalid / aria-describedby / focus restoration / ช่อง custom page ทำงานเหมือนเดิมทั้งหมด — ส่งฟอร์มว่างยังเด้ง error 3 จุด + โฟกัสพาไปช่องแรกที่ผิด
- เลย์เอาต์แถว hairline (unboxed) ของ community links/contact คงไว้ตั้งใจ — สไตล์ low-noise เดียวกับ settings
- ปุ่ม CTA พื้น primary #0D9488 (เดิมใช้ brand-hover เป็นพื้นพัก ซึ่งผิดบทบาท CTA)

## ผลการทดสอบ

- Unit: 234/234 (37 ไฟล์) | Build: สะอาด | **e2e เต็ม: 16/16** (รวม report-submission journey)
- Effective DOM จริง (Playwright, light+dark): ช่องกรอก 12px พื้นขาว/`#1E293B` ขอบบางตามธีม; ปุ่ม submit pill 9999px เทล (light `rgb(13,148,136)` / dark `rgb(45,212,191)`); ส่งฟอร์มว่าง → error text 3 จุด + aria-invalid 3 + โฟกัสไปช่องแรกที่ต้องแก้; โฟกัสคีย์บอร์ด → ขอบเทล + เงา 3px เทล (ยืนยันหลัง transition 150ms เซตเทิร์ม)

# แพตช์หน้า Platform ขัดเงา (v3.2.23)

วางไฟล์ทั้งหมดใน patch นี้ทับลงบน repo ตามโครงสร้างเดิม — แตก ZIP แล้ว copy ทับได้เลย

## สรุปการเปลี่ยนแปลง (v3.2.23 - Platform Pages Polish)

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `assets/css/about.css` | เทลเก่า `#009688` 4 จุด → `#0d9488`, focus ring 2px → 3px เทล v3, fallback radius/curve/ขอบปรับตาม v3 |
| `assets/css/roadmap.css` | เทาเก่า `#757575` 5 จุด (จุดไทม์ไลน์/ป้าย) → `#475569`, เส้นคั่น hairline ปรับ v3, แก้ var ซ้อน — เลย์เอาต์ Read-surface คงไว้ตั้งใจ |
| `assets/css/new.css` | เทลเก่า 6 จุด + เทา 5 จุด purge, time chip จากพื้นเขียว legacy `--teal-50` → แต้มเทล `rgba(13,148,136,0.09)` ใช้ได้ทั้งสองธีม, ป้าย/label สี → `--color-brand-hover`, focus ring 3px v3 |
| `assets/md/en/current.md`, `assets/md/th/current.md` | โน้ตรีลีส v3.2.23 (EN/TH) ฟอร์แมต bullet `- **หัวเรื่อง** — คำอธิบาย` |
| `assets/md/{en,th}/releases/v3.2.22.md` | สำเนาที่แก้ให้ parse ได้ (hotfix `47c2fc4` — รวมใน patch นี้) |

## จุดสำคัญที่ต้องรู้

- **Hotfix สำคัญ (`47c2fc4`)**: โน้ตรีลีส v3.2.22 เดิมใช้ bullet เปล่า ทำให้ parser ของโมดัลอัปเดตในแอป (`parseMD` ต้องการ `- **ตัวหนา**`) อ่านได้ 0 รายการ — ผู้ใช้จะเห็นรายการว่างในกล่อง What's New แก้ครบทั้ง current.md และสำเนา registry แล้ว และต่อจากนี้ทุกโน้ตเขียนในฟอร์แมตที่ parse ได้เสมอ
- หน้า about/license/privacy/roadmap/whats_new ไม่แตะ HTML เลย — งานทั้งหมดอยู่ที่ CSS ซึ่งพร้อมรีดีไซน์มาก่อนหน้านี้แล้ว (tokenized) รอบนี้เป็นการ purge ค่าเก่าตกค้าง + เทลเนียนธีม

## ผลการทดสอบ

- Unit: 234/234 (37 ไฟล์ รวมชุด parser) | Build: สะอาด | e2e เต็ม: 16/16
- Effective DOM จริง (Playwright, light+dark × 5 หน้า): body `#FAFAFC`/`#0F172A` ตามธีม, หัวเรื่อง/ลิงก์เทลตามธีม (light `rgb(13,148,136)` / dark `rgb(45,212,191)`), ป้ายเวอร์ชัน pill 9999px, time chip แต้มเทล `rgba(13,148,136,0.09)` ทั้งสองธีม

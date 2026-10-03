# แพตช์ระบบค้นหาดีไซน์ใหม่ (v3.2.18)

วางไฟล์ทั้งหมดใน patch นี้ทับลงบน repo ตามโครงสร้างเดิม — แตก ZIP แล้ว copy ทับได้เลย

## สรุปการเปลี่ยนแปลง (v3.2.18 - Search Redesign)

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `assets/css/search.css` | การ์ดผลลัพธ์ 16px + ขอบจาง + เงานุ่ม + hover ลอย, focus ring 3px มาตรฐานใหม่, hover surface รวมศูนย์เป็น token, กำจัด Material teal เก่า (#009688) 4 จุด, fallback เพี้ยนรีเซ็ตตาม v3 |
| `assets/js/search-system/search-system.css` | overlay + sticky header ใช้ motion มาตรฐาน (เดิม 180/160/220ms curve เก่า), คำแนะนำเป็นชิปโค้งมน 12px + focus ring ใหม่, ป้ายกำกับ pill สีแบรนด์ teal, กำจัด #009688/#13b47f เก่า |
| `assets/md/en/current.md`, `assets/md/th/current.md` | โน้ตรีลีส v3.2.18 (EN/TH) |
| `assets/md/{en,th}/releases/*`, `assets/json/version.json`, HTML/loaders | ของที่ release pipeline สร้างให้อัตโนมัติ |

## จุดเด่น

- **การ์ดไม่ซ้อน**: ตรวจใน browser จริง 12 การ์ด ตำแหน่ง top ต่างกันหมดทั้ง light/dark (guard เดิมของหน้านี้ยังแน่น) — อนิเมชั่น URE ยัง opacity-only ตามข้อห้ามเหล็ก
- **ชิปคำแนะนำ**: 12px โค้งมน + ArrowDown พา focus เข้าชุดคำแนะนำได้จริง (ตรวจ activeElement ใน DOM จริง)
- **สีตกค้างเก่าหมดสิ้น**: Material teal เดิม (#009688/rgba(0,150,136)/rgba(19,180,127)) หายจากระบบค้นหาทั้งสองไฟล์ แทนด้วยแบรนด์ teal/emerald

## ผลการทดสอบ

- Unit: 234/234 ผ่าน (37 ไฟล์) | Build: ผ่านสะอาด | e2e: 16/16 (search-refresh-regression 3/3)
- Effective DOM จริง (Playwright, light+dark): radius การ์ด 16px, พื้นการ์ดรับธีม (dark `rgb(30,41,59)`), pill 9999px, ชิป 12px, focus ring 3px `rgba(13,148,136,0.35)`

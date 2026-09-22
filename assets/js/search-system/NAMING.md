# Search Page — Naming Convention (v3.1)

> เอกสารนี้อ้างอิงชื่อ class ปัจจุบันหลัง refactor ครั้งใหญ่
> วัตถุประสงค์: กันความเข้าใจผิดระหว่างคุยงาน — เรียกชื่อเดียวกันเสมอ

## หลักการตั้งชื่อ

- 1 class = 1 ความหมาย ไม่ใช้ตัวย่อลึกลับ (`sc`/`scc`/`vs-*` ถูกแทนที่หมดแล้ว)
- ส่วนประกอบย่อยใช้ BEM: `block__element`
- ตัวแปร (variant) ใช้ BEM: `block--modifier`
- ทุก class ของหน้า search ขึ้นต้นด้วย `search-` หรืออยู่ในครอบครัว `result-card`

## ผังชื่อ class หลัก

### Search bar (แถบค้นหาด้านบน)

| Class ปัจจุบัน | คืออะไร | ชื่อเดิม (เลิกใช้) |
|---|---|---|
| `.search-pill` | หุ้มด้านนอก รูปแคปซูล ครอบ icon + input | `.search-input-wrapper` |
| `.search-pill__icon` | ไอคอนแว่นขยาย/ลูกศร ใน pill | `.search-input-icon` |
| `#searchInput` | ช่องพิมพ์จริง (id คงเดิม — JS API) | — |

⚠️ จุดที่เข้าใจผิดกันบ่อยที่สุด:
- "pill" = กรอบแคปซูลทั้งอัน (border เทาปกติ + เปลี่ยนเขียวตอนโฟกัส)
- "input" = ช่องพิมพ์ข้างใน (โปร่งใส ไม่มีกรอบของตัวเอง เห็นแค่เคอร์เซอร์)
- จะคุยเรื่อง "กรอบตอนแตะ" ต้องระบุให้ชัด: ของ **pill** หรือ **input**

### Result card (การ์ดผลลัพธ์)

| Class | คืออะไร | ชื่อเดิม |
|---|---|---|
| `.result-card` | การ์ด 1 ผลลัพธ์ (คลิกคัดลอกได้) | `.sc` |
| `.result-card--vertical` | variant ข้อความยาว/หลายบรรทัด | `.sv` |
| `.result-card__glyph` | ตัวอักษร/อีโมจิใหญ่ด้านซ้าย | `.scc` |
| `.result-card__body` | คอลัมน์ข้อความด้านขวา | `.scb` |
| `.result-card__title` | ชื่อ/หัวเรื่อง | `.sct` |
| `.result-card__subtitle` | คำอธิบายรอง | `.scs` |
| `.result-card__tags` | แถว tag ประเภท/หมวด | `.scg` |
| `.result-card__tag` | tag 1 ชิ้น | `.tag` |

### Suggestions (คำแนะนำตอนพิมพ์)

| Class | คืออะไร | ชื่อเดิม |
|---|---|---|
| `.search-suggestions-fullscreen` | ถาดคำแนะนำเต็มจอ (overlay) | คงเดิม |
| `.search-suggestions-title` | หัวข้อ ("กำลังเทรนด์" / "คำแนะนำ") | `.suggestions-head` |
| `.search-suggestion-item` | รายการคำแนะนำ 1 แถว | `.suggestion-item` |
| `.search-suggestion-body` | ข้อความของรายการ | `.suggestion-body` |
| `.search-suggestion-badge` | ป้ายกำกับประเภท | `.suggestion-badge` |
| `.search-suggestion-badge--type` / `--category` | ป้ายประเภท / หมวด | เดิม (เติม prefix) |

### Virtual scroll (สำรอง — prod ใช้ URE)

| Class | คืออะไร | ชื่อเดิม |
|---|---|---|
| `.vscroll-container` | กล่องเลื่อนเสมือน | `.vs-container` |
| `.vscroll-item` | ช่อง 1 แถวใน vscroll | `.vs-item` |

### อื่น ๆ (ชื่อชัดอยู่แล้ว ไม่แก้)

- `.search-header`, `.search-filters-panel`, `.filter-pills-row`, `.filter-pill(--cat)`
- `.search-main-layout`, `.no-result(--compact/__title/__hint)`
- `.discovery-header/-hint/-list/-section/-title`, `.copy-hint`
- `.search-result-placeholder` = ข้อความ "ผลลัพธ์จะแสดงที่นี่" (เดิม `.search-result-here`)

## กติกาเพิ่ม class ใหม่

1. อ่านผังข้างบนก่อน ห้ามตั้งชื่อซ้ำความหมายกับของเดิม
2. ใช้ BEM และ prefix `search-`/`result-card` ตามหลักการ
3. เพิ่มแถวในตารางของไฟล์นี้ทุกครั้งที่เพิ่ม class ใหม่
4. ห้ามใช้ตัวย่อที่คนนอกทีมเดาไม่ได้

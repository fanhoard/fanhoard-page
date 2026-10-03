# แพตช์ปรับปรุงระบบค้นหา แอนิเมชัน และการนำทางด้วยคีย์บอร์ด (v3.2.6)

วางไฟล์ทั้งหมดใน patch นี้ทับลงบน repo ตามโครงสร้างเดิม — แตก ZIP แล้ว copy ทับได้เลย

## สรุปการเปลี่ยนแปลง (v3.2.6 - ระบบค้นหา)

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `assets/js/search-system/search-modules/input-bar.js` | ปรับปรุงการจัดการ Event และคีย์บอร์ดอินพุตสำหรับการค้นหาอย่างเป็นศูนย์กลาง |
| `assets/js/search-system/search-modules/overlay.js` | เพิ่มแอนิเมชันเปิด/ปิด Overlay แบบนุ่มนวล (180ms cubic-bezier) และรองรับ Dark Mode |
| `assets/js/search-system/search-modules/rendering.js` | เพิ่มระบบสร้าง Screen Reader Live Announcer อัตโนมัติสำหรับอ่านจำนวนผลลัพธ์ |
| `assets/js/search-system/search-modules/suggestions.js` | ปรับปรุงการเลื่อนเคอร์เซอร์ด้วย ArrowUp/ArrowDown ในรายการคำแนะนำ พร้อม Focus Ring |
| `assets/js/search-system/search-system.css` | ปรับแต่ง Transition curves, Focus states, Hover states และ สไตล์ Live Announcer |
| `tests/search-polish.test.ts` | ชุดทดสอบหน่วยสำหรับตรวจสอบ Search Overlay, Keyboard Navigation, Suggestions และ Live Announcer (NEW) |
| `assets/md/en/current.md` | บันทึกการอัปเดตเวอร์ชัน 3.2.6 ภาษาอังกฤษ |
| `assets/md/th/current.md` | บันทึกการอัปเดตเวอร์ชัน 3.2.6 ภาษาไทย |
| `CHANGES.md` | บันทึกการเปลี่ยนแปลงเวอร์ชัน 3.2.6 ภาษาอังกฤษ (ครอบคลุม v3.2.6 และ v3.2.5) |
| `PATCH_NOTES.md` | บันทึกแพตช์สรุปภาษาไทยเวอร์ชัน 3.2.6 (ครอบคลุม v3.2.6 และ v3.2.5) |

## รายละเอียดแพตช์ (v3.2.6)

1. **การเปลี่ยนผ่าน Overlay และการรองรับ Dark Mode**:
   - เพิ่ม Transition สำหรับ Opacity และ Transform ความเร็ว 180ms `cubic-bezier(0.16, 1, 0.3, 1)` ขณะเปิดและปิด Search Overlay (`.search-overlay-active`) พร้อมปรับสีพื้นหลังให้รองรับ CSS Variables (`var(--surface-base, #ffffff)`).
2. **การนำทางด้วยคีย์บอร์ดและรายการคำแนะนำ (Suggestions Keyboard Navigation)**:
   - ปรับแต่งการตอบสนองของรายการคำแนะนำด้วยเส้นเน้น `:focus-visible` (ไฮไลต์สีแบรนด์) และ Hover state. การกด `ArrowUp` จากรายการคำแนะนำแรกจะวนกลับไปที่ช่องค้นหา และกด `ArrowDown` จากช่องค้นหาจะเข้าสู่รายการคำแนะนำอย่างสมบูรณ์.
3. **การอ่านผลลัพธ์สำหรับ Screen Reader (Accessibility)**:
   - สร้างองค์ประกอบ `#searchLiveAnnouncer` แบบ Polite ล่วงหน้าอัตโนมัติหากไม่พบใน DOM เพื่อประกาศจำนวนผลลัพธ์หรือสถานะไม่พบข้อมูลให้แก่ผู้ใช้ Screen Reader.
4. **การจัดการ Event Delegation อย่างเป็นระบบ**:
   - ย้าย Inline Event Handler บนช่องค้นหาออกอย่างสมบูรณ์ โดยรวบรวม Event Listeners ไว้ในโมดูล `input-bar` ส่วนกลาง.
5. **ชุดทดสอบระบบค้นหาแบบอัตโนมัติ**:
   - เพิ่ม `tests/search-polish.test.ts` เพื่อทดสอบพฤติกรรมของ Search Overlay, การเลื่อนรายการคำแนะนำด้วยคีย์บอร์ด, การสร้าง Live Announcer และ Event Delegation.

---

## สรุปการเปลี่ยนแปลงย้อนหลัง (v3.2.5 - ระบบการนำทาง Navigation Polish)

*(หมายเหตุ: v3.2.5 ได้ถูกบันทึกใน Release History เรียบร้อยแล้วที่ `assets/md/*/releases/v3.2.5.md` โดยในแพตช์นี้ได้รวบรวมตารางไฟล์และการปรับปรุงของ v3.2.5 เข้ามาร่วมด้วยอย่างสมบูรณ์)*

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `assets/js/nav-core-modules/buttons.js` | แก้ไขข้อผิดพลาดการสลับป้ายชื่อภาษาในเมนูให้ซิงก์ถูกต้องด้วย `data-url` Key Mapping |
| `assets/js/modern-navigation.js` | เพิ่ม ARIA tablist/tab, Roving tabindex, Keyboard Arrow Nav (Left/Right/Home/End) และ Auto Active Category Centering |
| `assets/css/nav-core.css` | ปรับปรุง Transition (180ms cubic-bezier), High-contrast Focus Rings และ Active Tab Indicator Animation |
| `assets/css/nav-core-ext.css` | ปรับแต่ง Layout และ Animation ของ extended navigation menu |
| `assets/css/top-navigation-bar.css` | ปรับแต่ง Timing และ Transitions บนแถบนำทางด้านบน |
| `tests/navigation-polish.test.ts` | ชุดทดสอบหน่วยสำหรับระบบนำทาง ARIA, การเลื่อนคีย์บอร์ด และการซิงก์ภาษา (NEW) |

## รายละเอียดแพตช์ (v3.2.5)

1. **การนำทางด้วยแป้นพิมพ์และ ARIA Semantics**:
   - เชื่อมโยงโครงสร้าง W3C ARIA tablist/tab ร่วมกับ Roving tabindex (`tabindex="0/-1"`) และสถานะ `aria-selected` รองรับการกดปุ่ม `ArrowRight`, `ArrowLeft`, `Home` และ `End`.
2. **Transition แบบ Smooth และ Focus Rings**:
   - กำหนด Transition Curves เป็น `180ms cubic-bezier(0.16, 1, 0.3, 1)` ร่วมกับเส้น Focus Outlines คมชัดตาม Brand Palette.
3. **การจัดตำแหน่ง Active Category กึ่งกลางหน้าจอ**:
   - รองรับการเลื่อนแถบเมนูนำทางหลักและย่อยเข้าสู่จุดศูนย์กลางอัตโนมัติบนอุปกรณ์เคลื่อนที่ พร้อมขนาด Touch Target ขั้นต่ำ 44px.
4. **การแก้ไขป้ายชื่อภาษาในแถบนำทาง**:
   - แก้ไข Bug การแสดงผลข้อความภาษาที่ไม่ตรงกันด้วย Canonical `data-url` Mapping.

---

# แพตช์ปรับปรุงไปป์ไลน์เวอร์ชันและระบบแจ้งเตือนอัปเดต (v3.2.4)

วางไฟล์ทั้งหมดใน patch นี้ทับลงบน repo ตามโครงสร้างเดิม — แตก ZIP แล้ว copy ทับได้เลย

## สรุปการเปลี่ยนแปลง (v3.2.4)

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `assets/js/version-core.js` | ปรับปรุงระบบแจ้งเตือนอัปเดต: ตรวจสอบภาษาที่รองรับ (`en`, `th`) พร้อมระบบสำรอง (fallback), แสดงผลวันที่อย่างถูกต้อง, และเพิ่ม Modal A11y (`<h2>`, `ariaLabel`, `type="button"`) |
| `scripts/update-version.js` | ปรับปรุงการระบุสคริปต์ Dynamic Loaders ให้ครอบคลุม `search-system/search.js` และ `loading-system/fvl.js` สำหรับใส่ Build ID |
| `assets/md/en/current.md` | บันทึกการอัปเดตเวอร์ชัน 3.2.4 ภาษาอังกฤษ |
| `assets/md/th/current.md` | บันทึกการอัปเดตเวอร์ชัน 3.2.4 ภาษาไทย |
| `tests/version-pipeline.test.ts` | ชุดทดสอบการตรวจสอบมาตรฐานไปป์ไลน์เวอร์ชัน และสัญญาการทำงานของ `version-core` / `update-version` (NEW) |
| `CHANGES.md` | บันทึกการเปลี่ยนแปลงเวอร์ชัน 3.2.4 ภาษาอังกฤษ |
| `PATCH_NOTES.md` | บันทึกแพตช์สรุปภาษาไทยเวอร์ชัน 3.2.4 |

## รายละเอียดแพตช์ (v3.2.4)

1. **ระบบสำรองภาษาและการจัดการภาษาที่ไม่รองรับ**:
   - `version-core.js` ตรวจสอบภาษาที่เลือกในระบบ (`en`, `th`) อย่างรัดกุมก่อนดึงไฟล์ markdown ป้องกันข้อผิดพลาด 404 เมื่อเลือกภาษา UI อื่นๆ
2. **การแปลงรูปแบบวันที่อัปเดต**:
   - แก้ไขการแปลง ISO timestamp ในป๊อปอัพให้แสดงผลวันที่และเวลาอย่างถูกต้องทั้งภาษาไทยและอังกฤษ
3. **การเข้าถึงสำหรับ Screen Reader (Modal Accessibility)**:
   - ปรับหัวเรื่องป๊อปอัพเป็น `<h2>`, เพิ่ม `ariaLabel`, `ariaDescribedBy` และ Attribute `type="button"`
4. **ระบบ Cache-Busting สคริปต์ Dynamic Loaders**:
   - ปรับแต่ง `scripts/update-version.js` ให้ใส่ Build ID ลงใน `search.js` และ `fvl.js` เพื่อล้างแคชสคริปต์ย่อยในเบราว์เซอร์อย่างสมบูรณ์

---

# แพตช์รวมศูนย์ระบบสกอร์ล็อก (v3.2.3)

วางไฟล์ทั้งหมดใน patch นี้ทับลงบน repo ตามโครงสร้างเดิม — แตก ZIP แล้ว copy ทับได้เลย

# แพตช์ยกระดับระบบภาษาและการแปลภาษา (v3.2.9)

วางไฟล์ทั้งหมดใน patch นี้ทับลงบน repo ตามโครงสร้างเดิม — แตก ZIP แล้ว copy ทับได้เลย

## สรุปการเปลี่ยนแปลง (v3.2.9 - ระบบภาษาและการแปลภาษา)

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `assets/js/lang-core.js` | กำจัดโค้ด IIFE ซ้ำซ้อนจำนวน 257 บรรทัด ลดขนาดไฟล์สคริปต์แต่คงประสิทธิภาพ FvLang API |
| `assets/js/lang-modules/ui.js` | ปรับปรุง Pop-up เลือกภาษาด้วย ARIA Listbox Roles, การควบคุมด้วยคีย์บอร์ด และสัญลักษณ์เครื่องหมายถูก |
| `assets/js/lang-links.js` | เพิ่มการรับฟัง `fv:langchange` Custom Event สำหรับซิงก์ Prefix ภาษาบนลิงก์ภายใน |
| `assets/js/lang-modules/translator.js` | ปรับปรุงการจัดเก็บ `data-original-html` และ Attribute เพื่อคืนค่าเนื้อหาภาษาอังกฤษได้สมบูรณ์ |
| `tests/localization-polish.test.ts` | ชุดทดสอบหน่วยสำหรับตรวจสอบระบบภาษา, ARIA Roles, คีย์บอร์ด และการคืนค่าเนื้อหา (NEW) |
| `assets/md/en/current.md` | บันทึกการอัปเดตเวอร์ชัน 3.2.9 ภาษาอังกฤษ |
| `assets/md/th/current.md` | บันทึกการอัปเดตเวอร์ชัน 3.2.9 ภาษาไทย |
| `CHANGES.md` | บันทึกการเปลี่ยนแปลงเวอร์ชัน 3.2.9 ภาษาอังกฤษ |
| `PATCH_NOTES.md` | บันทึกแพตช์สรุปภาษาไทยเวอร์ชัน 3.2.9 |

## รายละเอียดแพตช์ (v3.2.9)

1. **Pop-up เลือกภาษาที่ใช้งานง่ายและเข้าถึงได้ครอบคลุม (A11y)**:
   - อัปเกรดตัวเลือกภาษาใน `ui.js` ให้ใช้ `<button type="button">` ภายใต้ `role="listbox"` พร้อม `role="option"`, `aria-selected`, สัญลักษณ์เครื่องหมายถูก (`✓`), กรอบ Focus เส้นเด่นชัด (`outline: 2px solid #00FFAA`), Transition ขนาด 180ms และระบบนำทางด้วยปุ่มลูกศรกับ Enter/Space.
2. **กำจัดโค้ดซ้ำซ้อนใน Central Language Core API (`lang-core.js`)**:
   - ลบโค้ด IIFE ซ้ำซ้อนจำนวน 257 บรรทัดใน `lang-core.js` ออก ช่วยเพิ่มความเร็วในการโหลดสคริปต์โดยที่ `window.FvLang` ยังคงทำงานได้อย่างแม่นยำ.
3. **ซิงก์ระบบจัดการ Prefix ภาษาบนลิงก์ภายใน (`lang-links.js`)**:
   - เพิ่มการรับฟัง `fv:langchange` Custom Event นอกเหนือจาก `languageChange` เพื่อให้อัปเดต Prefix บนลิงก์ภายในทันทีเมื่อเปลี่ยนภาษา.
4. **การจัดเก็บและคืนค่าโครงสร้าง HTML และ Attributes (`translator.js`)**:
   - ปรับปรุง `storeOriginalContent` และ `resetToEnglishContent` ให้จัดเก็บและคืนค่า `data-original-html`, `data-original-placeholder`, `data-original-title` และ `data-original-aria-label` อย่างครบถ้วน.
5. **ชุดทดสอบยูนิตเทสต์ระบบภาษา (`tests/localization-polish.test.ts`)**:
   - เพิ่มไฟล์ทดสอบครอบคลุมการประมวลผลภาษา, ARIA Roles, การรับฟัง Event และการคืนค่าองค์ประกอบ HTML (ผ่านการทดสอบ 215/215 เคสใน 34 ไฟล์).

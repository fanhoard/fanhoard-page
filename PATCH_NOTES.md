# แพตช์ปรับปรุงระบบป๊อปอัพ แอนิเมชัน และการแจ้งเตือน Toast (v3.2.7)

วางไฟล์ทั้งหมดใน patch นี้ทับลงบน repo ตามโครงสร้างเดิม — แตก ZIP แล้ว copy ทับได้เลย

## สรุปการเปลี่ยนแปลง (v3.2.7 - ระบบป๊อปอัพ)

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `assets/js/popup-modules/a11y.js` | ปรับปรุง Focus Trap, การค้นหา Element ที่โฟกัสได้ และระบบประกาศ Screen Reader |
| `assets/js/popup-modules/animator.js` | ปรับจังหวะแอนิเมชันเปิด/ปิด (Timing & Cubic-Bezier) ให้ลื่นไหลและสอดคล้องกันทุกรูปแบบ |
| `assets/js/popup-modules/config.js` | ส่งออก `AUTO_FOCUS_SELECTOR` และค่าเริ่มต้นสำหรับคอนฟิกของป๊อปอัพ |
| `assets/js/popup-modules/engine.js` | เพิ่ม Helper Methods สำหรับแจ้งเตือน Toast ตามสถานะ (`toast.success`, `error`, `warning`, `info`) |
| `assets/js/popup-modules/init.js` | ปรับปรุงการจัดการคีย์ Escape และระบบป้องกัน Backdrop Click จากการลากคลุมข้อความ |
| `assets/js/popup-modules/overlay.js` | ตรวจสอบ Z-index ลำดับการซ้อนทับ และการเชื่อมต่อ ScrollLockCore |
| `assets/js/popup-modules/renderer.js` | ใส่คุณสมบัติ ARIA (`aria-modal`, `aria-live`) และการสร้าง DOM สำหรับ Toast Variants |
| `assets/js/popup-modules/utils.js` | ฟังก์ชันช่วยเหลือค้นหา DOM และตรวจสอบ Element ที่เปิดรับการโฟกัส |
| `assets/css/popup.css` | เพิ่มสไตล์ขอบสี Toast Variants, กรอบโฟกัสความคมชัดสูง และกฎรองรับ Reduced Motion |
| `tests/popup/popup-polish.test.ts` | ชุดทดสอบหน่วยสำหรับตรวจสอบ Popup Polish, Focus Trap, Toast Variants และ A11y (NEW) |
| `assets/md/en/current.md` | บันทึกการอัปเดตเวอร์ชัน 3.2.7 ภาษาอังกฤษ |
| `assets/md/th/current.md` | บันทึกการอัปเดตเวอร์ชัน 3.2.7 ภาษาไทย |
| `CHANGES.md` | บันทึกการเปลี่ยนแปลงเวอร์ชัน 3.2.7 ภาษาอังกฤษ |
| `PATCH_NOTES.md` | บันทึกแพตช์สรุปภาษาไทยเวอร์ชัน 3.2.7 |

## รายละเอียดแพตช์ (v3.2.7)

1. **จังหวะแอนิเมชันและ Easing (Animation Timing & Cubic-Bezier Easing)**:
   - ปรับระยะเวลาและกราฟความเร็วสำหรับการเปิดและปิดป๊อปอัพทุกประเภท (Dialog, Sheet, Drawer, Toast, Fullscreen) ให้สมูทสอดคล้องกันด้วย `cubic-bezier(0.4, 0, 0.2, 1)` ขณะแสดงผล และ `cubic-bezier(0.4, 0, 1, 1)` ขณะปิด.
2. **ยกระดับ Focus Trap และการนำทางด้วยคีย์บอร์ด**:
   - ปรับปรุงการค้นหาองค์ประกอบภายใน Focus Trap โดยการกรอง Element ที่ซ่อนหรือปิดการใช้งานออก ช่วยให้การกด Tab และ Shift+Tab วนลูปโฟกัสภายในหน้าต่างป๊อปอัพเป็นไปอย่างสมบูรณ์.
3. **รูปแบบแจ้งเตือน Toast แยกตามสถานะ (Toast Variants)**:
   - เพิ่ม Helper Methods สำหรับ Toast ได้แก่ `toast.success`, `toast.error`, `toast.warning`, `toast.info` พร้อมเส้นขอบสีเน้นย้ำตามสถานะ และส่งเสียงอ่านสำหรับ Screen Reader อัตโนมัติ.
4. **การป้องกันการปิดผิดพลาด (ESC Key & Backdrop Click Guard)**:
   - ปรับปรุงการรับคีย์ Escape ไม่ให้ปิดป๊อปอัพหากอยู่ใน Widget อื่นที่ยกเลิก Event และ Backdrop ตรวจสอบตำแหน่ง `mousedown` เพื่อป้องกันการปิดป๊อปอัพโดยไม่ได้ตั้งใจขณะลากคลุมข้อความ.
5. **การรองรับ Accessibility (A11y) และ Reduced Motion**:
   - เพิ่ม `aria-modal="true"`, `aria-live` และ `aria-atomic` สำหรับ Screen Reader พร้อมกรอบโฟกัสความคมชัดสูง และปิดแอนิเมชันเมื่อผู้ใช้เปิดใช้งาน Reduced Motion.
6. **ชุดทดสอบระบบป๊อปอัพแบบอัตโนมัติ**:
   - เพิ่ม `tests/popup/popup-polish.test.ts` เพื่อทดสอบ Exports, Focus Trap, Toast Variants, Backdrop Guard, Keyboard Accessibility และ Animation.

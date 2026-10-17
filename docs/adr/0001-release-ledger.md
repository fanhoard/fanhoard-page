# 0001 Release Ledger: เวลาปล่อยประทับครั้งเดียวในไฟล์ที่ commit และ Manifest คำนวณตอน build

สถานะ: ยอมรับ 18 ต.ค. 2026

## บริบท
ข้อมูลรุ่นเดียวกันเคยถูกเก็บ 4 ที่ที่ต้องตรงกัน (current.md, releases/v*.md, index.json, version.json) ทั้งหมดถูกสร้างโดย CI ที่ทำงานเฉพาะบน main แล้ว commit กลับ ผลคือ develop ไม่เคยมีประวัติหรือเวลาที่ถูกต้อง (ประวัติหยุดที่ 5.8.0, version.json ค้าง 5.8.1, รุ่นปัจจุบันไม่มีเวลา) และทุกครั้งที่แก้ที่หนึ่ง อีกที่เพี้ยน
Cloudflare Pages clone แบบตื้น 1 commit (วัดจาก build log จริง) จึงอ่านเวลารุ่นจาก git history ตอน build ไม่ได้

## ตัดสินใจ
1. **Released At** ประทับครั้งเดียวลงใน front-matter ของ Release Note โดย pre-commit hook ตอนที่ Release ใหม่ถูก commit ครั้งแรก คนห้ามพิมพ์ ห้ามแก้หลังจากนั้น (ตัวตรวจบล็อก)
2. **Ledger** คือไฟล์ `releases/v{version}.md` ต่อรุ่น เป็นแหล่งความจริงเดียว Draft ใน `current.md` ถูกย้ายเข้า Ledger โดยขั้น build ของทุกสาขา
3. **Manifest** (`index.json`, `version.json`) คำนวณตอน build ของทุกสาขาจาก Ledger ล้วนๆ ไม่อ่าน git ไม่ถูก commit
4. CI ของ main เลิก commit ไฟล์ generated กลับ (ตัดสาเหตุของ `[skip ci]` ที่ทำให้ deploy ค้าง)

## ทางเลือกที่ปฏิเสธ
- **สร้างเวลาตอน build จาก git log**: ใช้ไม่ได้บน Cloudflare เพราะ clone ตื้น
- **ให้ CI รันบน develop ด้วย**: ยังมี 4 สำเนาที่ต้องซิงก์ และสองสาขาชนกันตอนรวม
- **พิมพ์เวลาด้วยมือ**: ผิดได้ ลืมได้ และเป็นต้นเหตุที่ทำให้เวลาเป็นค่าปลอมมาก่อน

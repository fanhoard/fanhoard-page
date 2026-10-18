# S3 ค้นหาและสำรวจ

- **System Described**: หน้า Search และ Discover ของ FanHoard เป็นโครงแอป
- **Entry File**: `docs/plans/native-redesign/steps/S3-search-discover.md`
- **Dependencies**: `search/index.html`, `data/verse/discover/index.html`, `assets/css/search.css`, `assets/js/search-system/`
- **Verification**: `npm run build` | ชุดตรวจใน `scripts/design-checks/`

กลับไปที่ [แผนหลัก](../MASTER-PLAN.md) | ขั้นก่อนหน้า [S2](S2-home.md) | ขั้นถัดไป [S4](S4-settings.md)

ช่วง: กลาง (รายละเอียดบางส่วน)

## เป้าหมาย
Search และ Discover ใช้องค์ประกอบกลาง ตัวกรองเป็นแคปซูล ผลลัพธ์แสดงแบบแอป

## ผลลัพธ์ที่ตรวจได้
1. ค้นหาคำแล้วผลแสดงถูกต้อง ตัวกรองชนิดทำงาน
2. ผ่านตัวตรวจเลื่อนแนวนอน contrast พื้นที่แตะ และไม่มี error ของหน้า
3. Discover ใช้องค์ประกอบกลางเดียวกัน

## ข้อเท็จจริงที่ตรวจแล้ว
- หน้า Search มีตัวกรองชนิด: All Types, Collections, Emoji, Symbol, Fancy Text
- Discover โหลดชุด CSS ของ nav-core ต่างจากหน้าอื่น จึงเป็นระบบแยกที่ต้องตรวจว่าองค์ประกอบกลางไปถึงหรือไม่
- มี CSP error ของ Fuse.js จาก unpkg อยู่ก่อนแล้ว ไม่ใช่ผลของรีดีไซน์

## สิ่งที่ยังไม่ทราบ
- โครงของ Discover และ Scope ทำงานอย่างไร ยังไม่ได้สำรวจ
- จะแก้ CSP ของ Fuse.js ในขั้นนี้หรือไม่ ต้องให้ Master ตัดสิน เพราะอยู่นอกขอบเขตรีดีไซน์

## รายละเอียดเมื่อใกล้ถึง
ขยายเมื่อ S2 ใกล้จบ

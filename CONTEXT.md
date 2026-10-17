# FanHoard: Release Ledger Glossary

คำศัพท์ของระบบอัปเดตและประวัติรุ่น ใช้ตามนี้ทุกที่ ไม่ใช้คำอื่นแทน

**Release**: รุ่นหนึ่งที่ผู้ใช้เห็น ระบุด้วยเลขเวอร์ชันเดียว ปล่อยครั้งเดียว ไม่แก้ย้อนหลังหลังปล่อย

**Release Note**: ข้อความอธิบายสิ่งที่เปลี่ยนใน Release หนึ่ง มี 2 ภาษา (en, th) ไฟล์เดียวต่อภาษาต่อ Release อยู่ที่ `assets/md/{lang}/releases/v{version}.md`

**Draft**: Release Note ของรุ่นที่กำลังจะปล่อย อยู่ที่ `assets/md/{lang}/current.md` ผู้พัฒนาเป็นคนเขียนเพียงฝ่ายเดียว

**Released At**: เวลาจริงที่ Release ถูกบันทึกครั้งแรก เป็นข้อเท็จจริงที่ไม่เปลี่ยน ประทับครั้งเดียวโดย pre-commit hook ไม่ใช่โดยคน ไม่ใช่เวลา build และไม่ใช่เวลา commit ล่าสุด

**Ledger**: ชุดของ Release Note ทุกรุ่นที่ปล่อยแล้ว เป็นแหล่งความจริงเดียวของประวัติรุ่น

**Manifest**: ไฟล์ที่หน้าเว็บอ่านเพื่อรู้ว่ามีรุ่นอะไรบ้าง (`releases/index.json`, `version.json`) เป็นผลคำนวณจาก Ledger ทุกครั้งที่ build ไม่ใช่ข้อมูลต้นทาง ห้าม commit

**Silent Release**: Release ที่ผู้ใช้ไม่เห็นความต่าง (`notify: false`) ใช้ได้เฉพาะรุ่นที่ไม่มีการเปลี่ยนที่ผู้ใช้เห็น

_Avoid_: "snapshot" (ใช้ Release Note), "registry" (ใช้ Ledger หรือ Manifest), "release date" ที่คลุมเครือ (ใช้ Released At)

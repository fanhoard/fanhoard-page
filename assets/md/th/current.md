---
version: 3.3.4
date: 2026-10-04T08:15:36.782Z
title: แก้ไข root redirect ให้ถึงมือจริง
subtitle: root redirect ที่ประกาศไว้ใน 3.3.3 ตอนนี้ถูกสร้างลง build output จริงแล้ว — พลาดที่ build pipeline ตรงจุดเดียว เรียบร้อยแล้ว
notify: true
---

**TL;DR** — root redirect จากรีลีสก่อนไม่ขึ้นบนเว็บจริงเพราะเพิ่ม rule ผิดไฟล์ (ไฟล์ dev-only ที่ build ไม่ได้ใช้) ตอนนี้แก้ที่ตัวสร้างไฟล์ให้รวม rule นี้ใน build output ที่เว็บใช้จริง "/" จะ redirect ไป /home/ เมื่อ build นี้ขึ้นสด

### แก้ไข

- **Root redirect ขึ้นจริงแล้ว** — rule 302 จาก "/" → /home/ ถูกใส่ในไฟล์ผิด (สำเนา dev-only ที่ build ไม่ใช้) ตอนนี้สร้างลง build output ที่เว็บเสิร์ฟจริงแล้ว

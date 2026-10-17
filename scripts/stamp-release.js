#!/usr/bin/env node
// scripts/stamp-release.js — เรียกจาก pre-commit hook
// ประทับ Released At (date:) ครั้งเดียวลง Draft ของรุ่นใหม่ ทุกภาษาได้เวลาเดียวกัน แล้ว git add ไฟล์ที่ประทับ
// รุ่นที่มี date แล้วหรืออยู่ใน Ledger แล้วไม่ถูกแตะ (ล็อก) ผู้พัฒนาไม่ต้องและห้ามพิมพ์ date: เอง
'use strict';
const path = require('path');
const { spawnSync } = require('child_process');
const { stampReleasedAt, promoteDraft } = require('./release-ledger');

const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const LANGS = ['en', 'th'];
const r = stampReleasedAt(ROOT, LANGS);
if (r.stamped) {
  console.log('[stamp-release] ประทับ Released At ของรุ่น ' + r.stamped + ' = ' + r.at);
}
// ย้าย Draft เข้า Ledger ใน commit เดียวกัน (รุ่นที่อยู่ใน Ledger แล้วไม่ถูกแตะ)
for (const lang of LANGS) {
  const pr = promoteDraft(ROOT, lang);
  if (pr.promoted) {
    spawnSync('git', ['add', 'assets/md/' + lang + '/current.md', 'assets/md/' + lang + '/releases/v' + pr.promoted + '.md'], { cwd: ROOT });
    console.log('[stamp-release] สร้างไฟล์ Ledger ของรุ่น ' + pr.promoted + ' (' + lang + ')');
  }
}
if (r.stamped) {
  LANGS.forEach((l) => spawnSync('git', ['add', 'assets/md/' + l + '/current.md'], { cwd: ROOT }));
}

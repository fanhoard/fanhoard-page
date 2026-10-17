#!/usr/bin/env node
// scripts/build-ledger.js — ขั้นเดียวที่ build ของทุกสาขาเรียกเพื่อสร้างประวัติรุ่น
// (ดู CONTEXT.md และ docs/adr/0001-release-ledger.md)
//   1. ย้าย Draft ของรุ่นใหม่เข้า Ledger (releases/v{ver}.md) โดยคง Released At เดิม
//   2. คำนวณ Manifest (releases/index.json) และ version.json จาก Ledger ล้วนๆ
// ไม่อ่าน git จึงทำงานได้บน Cloudflare ที่ clone ตื้น และให้ผลเหมือนกันทุกสาขา
// usage: node scripts/build-ledger.js [root]
'use strict';
const fs = require('fs');
const path = require('path');
const { buildLedger, promoteDraft } = require('./release-ledger');

const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const LANGS = ['en', 'th'];
const MAX_HISTORY = 7;

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

try {
  const promoted = LANGS.map((l) => promoteDraft(ROOT, l).promoted).filter(Boolean);
  const ledgers = LANGS.map((l) => ({ lang: l, ...buildLedger(ROOT, l) }));

  // สองภาษาต้องมีชุดรุ่นเดียวกัน ไม่งั้นผู้ใช้เห็นประวัติคนละชุด
  const sets = ledgers.map((x) => x.manifest.versions.map((e) => e.version).join(','));
  if (new Set(sets).size > 1) {
    const [a, b] = ledgers.map((x) => new Set(x.manifest.versions.map((e) => e.version)));
    const diff = [...a].filter((v) => !b.has(v)).concat([...b].filter((v) => !a.has(v)));
    throw new Error('Ledger สองภาษาไม่ตรงกัน รุ่นที่ขาดฝั่งใดฝั่งหนึ่ง: ' + diff.join(', '));
  }
  // รุ่นล่าสุดต้องมีเวลา ไม่งั้น version.json และป๊อปอัปไม่มีเวลา
  ledgers.forEach((x) => {
    const missing = x.manifest.versions.filter((e) => !e.date).map((e) => e.version);
    if (missing.length) throw new Error('Released At หายในรุ่น ' + missing.join(', ') + ' (' + x.lang + ')');
  });

  const updatedAt = ledgers[0].version ? ledgers[0].version.date : null; // คงที่ ไม่ใช้เวลา build
  ledgers.forEach((x) => {
    const manifest = { versions: x.manifest.versions.slice(0, MAX_HISTORY), updatedAt };
    writeJson(path.join(ROOT, 'assets/md', x.lang, 'releases/index.json'), manifest);
  });
  if (ledgers[0].version) writeJson(path.join(ROOT, 'assets/json/version.json'), ledgers[0].version);

  console.log('[build-ledger] รุ่นล่าสุด ' + (ledgers[0].version ? ledgers[0].version.version + ' @ ' + ledgers[0].version.date : '(ว่าง)') +
    (promoted.length ? ' | ย้ายเข้า Ledger: ' + [...new Set(promoted)].join(', ') : ''));
} catch (e) {
  console.error('[build-ledger] ล้มเหลว: ' + e.message);
  process.exit(1);
}

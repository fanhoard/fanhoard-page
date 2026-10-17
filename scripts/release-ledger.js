// scripts/release-ledger.js — Release Ledger (ดู CONTEXT.md และ docs/adr/0001-release-ledger.md)
// อินเทอร์เฟซ: buildLedger(root, lang) -> { manifest, version }
// คำนวณ Manifest จาก Ledger (assets/md/{lang}/releases/v*.md) ล้วนๆ ไม่อ่าน git ไม่เขียนไฟล์
'use strict';
const fs = require('fs');
const path = require('path');

function cmpVersion(a, b) {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

function frontMatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fm = {};
  if (!m) return fm;
  m[1].split(/\r?\n/).forEach((line) => {
    const k = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (k) fm[k[1]] = k[2].trim().replace(/^["']|["']$/g, '');
  });
  return fm;
}

function readLedger(root, lang) {
  const dir = path.join(root, 'assets/md', lang, 'releases');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => /^v\d.*\.md$/.test(f))
    .map((f) => {
      const fm = frontMatter(fs.readFileSync(path.join(dir, f), 'utf8'));
      return { version: fm.version || f.replace(/^v|\.md$/g, ''), date: fm.date || null };
    })
    .sort((a, b) => cmpVersion(b.version, a.version));
}

function buildLedger(root, lang) {
  const entries = readLedger(root, lang);
  // หน้า What's New แสดง 7 รุ่นล่าสุด (เกณฑ์เดิมของระบบอัปเดต) — Ledger เก็บครบทุกรุ่น manifest ตัดหน้าต่าง 7
  const WINDOW = 7;
  const manifest = { versions: entries.slice(0, WINDOW).map((e) => ({ version: e.version, date: e.date, hasDetails: true })) };
  const latest = entries[0];
  const version = latest ? { version: latest.version, date: latest.date } : null;
  return { manifest, version };
}

// ย้าย Draft (current.md) เข้า Ledger ถ้ารุ่นนั้นยังไม่อยู่ใน Ledger
// - รุ่นที่อยู่ใน Ledger แล้ว: ไม่แตะ (Released At ล็อก)
// - Draft ไม่มี Released At: throw ไม่เดาเวลา (เดาเวลาคือต้นเหตุของปัญหาเดิม)
function promoteDraft(root, lang) {
  const draftPath = path.join(root, 'assets/md', lang, 'current.md');
  if (!fs.existsSync(draftPath)) return { promoted: null };
  const text = fs.readFileSync(draftPath, 'utf8');
  const fm = frontMatter(text);
  if (!fm.version) throw new Error('Draft ไม่มี version: ' + draftPath);
  const dest = path.join(root, 'assets/md', lang, 'releases', 'v' + fm.version + '.md');
  if (fs.existsSync(dest)) return { promoted: null };
  if (!fm.date) throw new Error('Draft ' + fm.version + ' (' + lang + ') ไม่มี Released At (date:) hook ต้องประทับตอน commit ห้ามเดาเวลา');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, text, 'utf8');
  return { promoted: fm.version };
}

// ประทับ Released At ครั้งเดียวลง Draft ของรุ่นใหม่ (ยังไม่อยู่ใน Ledger และยังไม่มี date)
// ทุกภาษาได้เวลาเดียวกัน; รุ่นที่มี date แล้วหรืออยู่ใน Ledger แล้ว ไม่ถูกแตะ
function stampReleasedAt(root, langs, now) {
  const at = (now || new Date()).toISOString();
  let stamped = null;
  langs.forEach((lang) => {
    const draftPath = path.join(root, 'assets/md', lang, 'current.md');
    if (!fs.existsSync(draftPath)) return;
    const text = fs.readFileSync(draftPath, 'utf8');
    const fm = frontMatter(text);
    if (!fm.version || fm.date) return;
    if (fs.existsSync(path.join(root, 'assets/md', lang, 'releases', 'v' + fm.version + '.md'))) return;
    fs.writeFileSync(draftPath, text.replace(/^(version:[^\n]*)$/m, '$1\ndate: ' + at), 'utf8');
    stamped = fm.version;
  });
  return stamped ? { stamped, at } : { stamped: null, at: null };
}

module.exports = { buildLedger, promoteDraft, stampReleasedAt, cmpVersion, frontMatter };

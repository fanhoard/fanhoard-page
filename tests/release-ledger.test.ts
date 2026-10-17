import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';
import { spawnSync } from 'child_process';

// seam: buildLedger(root) คำนวณ Manifest จาก Ledger (releases/v*.md) ล้วนๆ ไม่อ่าน git
// ทดสอบผ่านอินเทอร์เฟซสาธารณะเท่านั้น ไม่ดูไส้ใน
const require = createRequire(import.meta.url);
const { buildLedger, promoteDraft, stampReleasedAt } = require('../scripts/release-ledger.js');

let root: string;
const note = (v: string, at: string | null, extra = '') =>
  `---\nversion: ${v}\n${at ? `date: ${at}\n` : ''}title: t ${v}\nsubtitle: s\nnotify: true\n${extra}---\n\n### Fixed\n\n- x\n`;
function put(lang: string, file: string, body: string) {
  const f = path.join(root, `assets/md/${lang}/${file}`);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, body);
}

beforeEach(() => { root = fs.mkdtempSync(path.join(os.tmpdir(), 'ledger-')); });
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

describe('buildLedger: Manifest คำนวณจาก Ledger ล้วนๆ', () => {
  it('รุ่นใหม่สุดมาก่อน เรียงตามเลขเวอร์ชัน ไม่ใช่ตามวันที่', () => {
    put('en', 'releases/v5.9.0.md', note('5.9.0', '2026-10-17T12:00:00.000Z'));
    put('en', 'releases/v5.10.0.md', note('5.10.0', '2026-10-17T11:00:00.000Z')); // วันที่เก่ากว่า แต่เวอร์ชันใหม่กว่า
    put('en', 'releases/v5.8.1.md', note('5.8.1', '2026-10-17T10:00:00.000Z'));
    const { manifest } = buildLedger(root, 'en');
    expect(manifest.versions.map((e: any) => e.version)).toEqual(['5.10.0', '5.9.0', '5.8.1']);
  });

  it('เวลาของแต่ละรุ่นมาจาก Released At ในไฟล์ของรุ่นนั้น', () => {
    put('en', 'releases/v1.0.0.md', note('1.0.0', '2026-01-01T10:00:00.000Z'));
    put('en', 'releases/v1.1.0.md', note('1.1.0', '2026-02-02T11:22:33.000Z'));
    const { manifest } = buildLedger(root, 'en');
    expect(manifest.versions.find((e: any) => e.version === '1.1.0').date).toBe('2026-02-02T11:22:33.000Z');
    expect(manifest.versions.find((e: any) => e.version === '1.0.0').date).toBe('2026-01-01T10:00:00.000Z');
  });

  it('version.json = รุ่นล่าสุดของ Ledger พร้อมเวลาของรุ่นนั้น', () => {
    put('en', 'releases/v1.0.0.md', note('1.0.0', '2026-01-01T10:00:00.000Z'));
    put('en', 'releases/v1.1.0.md', note('1.1.0', '2026-02-02T11:22:33.000Z'));
    const { version } = buildLedger(root, 'en');
    expect(version).toEqual({ version: '1.1.0', date: '2026-02-02T11:22:33.000Z' });
  });
});

describe('promoteDraft: ย้าย Draft เข้า Ledger ตอน build', () => {
  it('Draft ที่มี Released At และยังไม่อยู่ใน Ledger ถูกสร้างเป็นไฟล์ของรุ่นนั้น โดยคงเวลาเดิมทุกไบต์', () => {
    put('en', 'releases/v1.0.0.md', note('1.0.0', '2026-01-01T10:00:00.000Z'));
    put('en', 'current.md', note('1.1.0', '2026-02-02T11:22:33.000Z'));
    const r = promoteDraft(root, 'en');
    expect(r).toEqual({ promoted: '1.1.0' });
    const f = fs.readFileSync(path.join(root, 'assets/md/en/releases/v1.1.0.md'), 'utf8');
    expect(f).toContain('date: 2026-02-02T11:22:33.000Z');
    expect(buildLedger(root, 'en').version).toEqual({ version: '1.1.0', date: '2026-02-02T11:22:33.000Z' });
  });

  it('ไม่เขียนทับรุ่นที่อยู่ใน Ledger แล้ว (Released At ล็อก)', () => {
    put('en', 'releases/v1.1.0.md', note('1.1.0', '2026-02-02T11:22:33.000Z'));
    put('en', 'current.md', note('1.1.0', '2099-12-31T00:00:00.000Z', '')); // พยายามเปลี่ยนเวลา
    const r = promoteDraft(root, 'en');
    expect(r).toEqual({ promoted: null });
    expect(fs.readFileSync(path.join(root, 'assets/md/en/releases/v1.1.0.md'), 'utf8')).toContain('2026-02-02T11:22:33.000Z');
  });

  it('Draft ไม่มี Released At: ล้มดังๆ ไม่เดาเวลา', () => {
    put('en', 'current.md', note('1.2.0', null));
    expect(() => promoteDraft(root, 'en')).toThrow(/Released At/);
  });
});

describe('stampReleasedAt: ประทับเวลาปล่อยครั้งเดียวตอน commit', () => {
  const NOW = new Date('2026-10-18T04:30:15.000Z');
  it('Draft รุ่นใหม่ที่ไม่มี date ได้เวลาปัจจุบัน ทั้งสองภาษาเวลาเดียวกัน', () => {
    put('en', 'current.md', note('2.0.0', null)); put('th', 'current.md', note('2.0.0', null));
    const r = stampReleasedAt(root, ['en', 'th'], NOW);
    expect(r).toEqual({ stamped: '2.0.0', at: '2026-10-18T04:30:15.000Z' });
    for (const l of ['en', 'th']) expect(fs.readFileSync(path.join(root, `assets/md/${l}/current.md`), 'utf8')).toContain('date: 2026-10-18T04:30:15.000Z');
  });
  it('Draft ที่มี date แล้ว ไม่ถูกแตะ (ล็อก)', () => {
    put('en', 'current.md', note('2.0.0', '2026-10-17T01:02:03.000Z'));
    const r = stampReleasedAt(root, ['en'], NOW);
    expect(r).toEqual({ stamped: null, at: null });
    expect(fs.readFileSync(path.join(root, 'assets/md/en/current.md'), 'utf8')).toContain('date: 2026-10-17T01:02:03.000Z');
  });
  it('รุ่นที่อยู่ใน Ledger แล้ว ไม่ถูกประทับใหม่แม้ Draft ไม่มี date', () => {
    put('en', 'releases/v2.0.0.md', note('2.0.0', '2026-10-17T01:02:03.000Z'));
    put('en', 'current.md', note('2.0.0', null));
    const r = stampReleasedAt(root, ['en'], NOW);
    expect(r).toEqual({ stamped: null, at: null });
    expect(fs.readFileSync(path.join(root, 'assets/md/en/current.md'), 'utf8')).not.toContain('date:');
  });
  it('เวลาที่ประทับมีรูปแบบ ISO มิลลิวินาที ตรงกับที่หน้าเว็บอ่าน', () => {
    put('en', 'current.md', note('2.0.1', null));
    const r = stampReleasedAt(root, ['en'], new Date('2026-10-18T04:30:15.123Z'));
    expect(r.at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});

describe('build-ledger CLI: ปลายตะเข็บจริงที่ build ของทุกสาขาเรียก', () => {
  const CLI = path.resolve(__dirname, '../scripts/build-ledger.js');
  const run = () => spawnSync('node', [CLI, root], { encoding: 'utf8' });
  const readJson = (rel: string) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));

  it('ย้าย Draft เข้า Ledger แล้วเขียน Manifest และ version.json ครบทั้งสองภาษา', () => {
    for (const l of ['en', 'th']) {
      put(l, 'releases/v1.0.0.md', note('1.0.0', '2026-01-01T10:00:00.000Z'));
      put(l, 'current.md', note('1.1.0', '2026-02-02T11:22:33.000Z'));
    }
    const r = run();
    expect(r.status).toBe(0);
    for (const l of ['en', 'th']) {
      const m = readJson(`assets/md/${l}/releases/index.json`);
      expect(m.versions.map((e: any) => e.version)).toEqual(['1.1.0', '1.0.0']);
      expect(m.versions[0].date).toBe('2026-02-02T11:22:33.000Z');
    }
    expect(readJson('assets/json/version.json')).toEqual({ version: '1.1.0', date: '2026-02-02T11:22:33.000Z' });
  });

  it('รันซ้ำกี่ครั้งก็ได้ผลเหมือนเดิมทุกไบต์ (idempotent)', () => {
    for (const l of ['en', 'th']) { put(l, 'releases/v1.0.0.md', note('1.0.0', '2026-01-01T10:00:00.000Z')); put(l, 'current.md', note('1.1.0', '2026-02-02T11:22:33.000Z')); }
    run();
    const read = () => ['assets/md/en/releases/index.json', 'assets/md/th/releases/index.json', 'assets/json/version.json'].map((f) => fs.readFileSync(path.join(root, f), 'utf8')).join('|');
    const a = read(); run(); run();
    expect(read()).toBe(a);
  });

  it('Draft ไม่มี Released At: ล้มด้วยรหัสออกไม่เป็นศูนย์ ไม่ปล่อยเงียบ', () => {
    for (const l of ['en', 'th']) put(l, 'current.md', note('3.0.0', null));
    const r = run();
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/Released At/);
  });

  it('สองภาษามีรุ่นไม่ตรงกัน: ล้มดังๆ ไม่ปล่อยให้ผู้ใช้เห็นประวัติคนละชุด', () => {
    put('en', 'releases/v1.0.0.md', note('1.0.0', '2026-01-01T10:00:00.000Z'));
    put('th', 'releases/v1.0.0.md', note('1.0.0', '2026-01-01T10:00:00.000Z'));
    put('en', 'releases/v1.1.0.md', note('1.1.0', '2026-02-02T11:22:33.000Z')); // th ไม่มี 1.1.0
    const r = run();
    expect(r.status).not.toBe(0);
    expect(r.stderr).toMatch(/1\.1\.0/);
  });
});

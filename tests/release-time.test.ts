import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';

// พฤติกรรมเวลาปล่อยในสถาปัตยกรรม Release Ledger (docs/adr/0001-release-ledger.md):
//   1. pre-commit hook (stamp-release.js) ประทับ Released At ครั้งเดียวให้รุ่นใหม่ ทุกภาษาเวลาเดียวกัน
//   2. build (build-ledger.js) ย้าย Draft เข้า Ledger คงเวลาเดิม และสร้าง Manifest
//   3. แก้โน้ตรุ่นเดิมทีหลัง: เวลาใน Ledger ไม่ขยับ
//   4. build ซ้ำ: ผลเหมือนเดิมทุกไฟล์ (idempotent)
//   5. Draft ไม่มีเวลา (ไม่ผ่าน hook): build ล้มชัดเจน ไม่เดาเวลา
// ทดสอบบน git repo ชั่วคราวด้วย hook และสคริปต์จริง

const ROOT = path.resolve(__dirname, '..');
const NOTE = (v: string, extra = '') =>
  `---\nversion: ${v}\n${extra}notify: true\ntitle: t\nsubtitle: s\n---\n\n### Fixed\n\n- **x** y\n`;

function sh(cwd: string, cmd: string, args: string[], env: Record<string, string> = {}) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', env: { ...process.env, ...env } });
  if (r.status !== 0 && cmd === 'git' && !['commit'].includes(args[0])) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
  return r;
}

let dir: string;

function writeNotes(v: string, extra = '') {
  for (const l of ['en', 'th']) fs.writeFileSync(path.join(dir, `assets/md/${l}/current.md`), NOTE(v, extra));
}
function commitThroughHook(msg: string) {
  // commit ผ่าน pre-commit hook จริง (stamp-release + validate-release)
  sh(dir, 'git', ['add', '-A']);
  return sh(dir, 'git', ['commit', '-q', '-m', msg]);
}
function ledgerBuild() {
  return sh(dir, 'node', ['scripts/build-ledger.js']);
}
const dateOf = (rel: string) => (fs.readFileSync(path.join(dir, rel), 'utf8').match(/^date:\s*(.+)$/m) || [])[1];
const nowIso = () => new Date().toISOString();

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-time-'));
  fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(dir, '.githooks'), { recursive: true });
  for (const l of ['en', 'th']) fs.mkdirSync(path.join(dir, `assets/md/${l}/releases`), { recursive: true });
  fs.mkdirSync(path.join(dir, 'assets/json'), { recursive: true });
  for (const f of ['stamp-release.js', 'release-ledger.js', 'build-ledger.js', 'validate-release.js'])
    fs.copyFileSync(path.join(ROOT, 'scripts', f), path.join(dir, 'scripts', f));
  fs.copyFileSync(path.join(ROOT, '.githooks/pre-commit'), path.join(dir, '.githooks/pre-commit'));
  // .gitignore เหมือน repo จริง: manifest เป็นของ build ห้ามติดตาม
  fs.writeFileSync(path.join(dir, '.gitignore'), 'assets/md/en/releases/index.json\nassets/md/th/releases/index.json\nassets/json/version.json\n');
  fs.writeFileSync(path.join(dir, '.release-bypass'), '1000');
  fs.writeFileSync(path.join(dir, '.release-bypass-counter'), '0');
  sh(dir, 'git', ['init', '-q']);
  sh(dir, 'git', ['config', 'user.email', 't@t']);
  sh(dir, 'git', ['config', 'user.name', 't']);
  sh(dir, 'git', ['config', 'core.hooksPath', '.githooks']);
}, 60000);

afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('Released At: hook stamps it once, build moves it to Ledger, it never moves again', () => {
  it('hook ประทับเวลาเดียวกันให้ทุกภาษาตอนปล่อยรุ่นใหม่ (ใกล้เวลา commit จริง)', () => {
    writeNotes('1.0.0');
    const before = nowIso();
    const r = commitThroughHook('release: v1.0.0');
    expect(r.status).toBe(0);
    const after = nowIso();
    const d = dateOf('assets/md/en/current.md');
    expect(d).toBeTruthy();
    expect(new Date(d).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime() - 2000);
    expect(new Date(d).getTime()).toBeLessThanOrEqual(new Date(after).getTime() + 2000);
    expect(dateOf('assets/md/th/current.md')).toBe(d);
  });

  it('build ย้าย Draft เข้า Ledger โดยคงเวลาที่ประทับไว้ และสร้าง Manifest ตรงกันทั้งสองภาษา', () => {
    expect(ledgerBuild().status).toBe(0);
    expect(dateOf('assets/md/en/releases/v1.0.0.md')).toBe(dateOf('assets/md/en/current.md'));
    const mEn = JSON.parse(fs.readFileSync(path.join(dir, 'assets/md/en/releases/index.json'), 'utf8'));
    const mTh = JSON.parse(fs.readFileSync(path.join(dir, 'assets/md/th/releases/index.json'), 'utf8'));
    expect(mEn.versions.map((e: any) => e.version)).toEqual(mTh.versions.map((e: any) => e.version));
    expect(mEn.versions[0].date).toBe(dateOf('assets/md/en/current.md'));
    const v = JSON.parse(fs.readFileSync(path.join(dir, 'assets/json/version.json'), 'utf8'));
    expect(v.version).toBe('1.0.0');
    expect(v.date).toBe(mEn.versions[0].date);
  });

  it('รุ่นถัดไปได้เวลาของตัวเอง และรุ่นก่อนไม่ขยับ', () => {
    writeNotes('1.1.0');
    const r = commitThroughHook('release: v1.1.0');
    expect(r.status).toBe(0);
    const d10 = dateOf('assets/md/en/releases/v1.0.0.md');
    const d11 = dateOf('assets/md/en/current.md');
    expect(d11).toBeTruthy();
    expect(d11).not.toBe(d10);
    expect(ledgerBuild().status).toBe(0);
    expect(dateOf('assets/md/en/releases/v1.0.0.md')).toBe(d10);
    expect(dateOf('assets/md/en/releases/v1.1.0.md')).toBe(d11);
  });

  it('แก้โน้ตรุ่นที่ปล่อยแล้วทีหลัง เวลาใน Ledger ไม่ขยับ', () => {
    const before = dateOf('assets/md/en/releases/v1.1.0.md');
    fs.appendFileSync(path.join(dir, 'assets/md/en/current.md'), '\n- **late edit** typo fix\n');
    sh(dir, 'git', ['add', '-A']);
    sh(dir, 'git', ['commit', '-q', '-m', 'docs: typo']);
    expect(ledgerBuild().status).toBe(0);
    expect(dateOf('assets/md/en/current.md')).toBe(before);
  });

  it('build ซ้ำหลายครั้ง ผลเหมือนเดิมทุกไฟล์ (idempotent)', () => {
    ledgerBuild();
    const read = () => ['assets/md/en/current.md', 'assets/md/en/releases/v1.1.0.md', 'assets/md/en/releases/index.json', 'assets/json/version.json']
      .map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n---\n');
    const first = read();
    ledgerBuild();
    ledgerBuild();
    expect(read()).toBe(first);
  });

  it('Draft ที่ไม่ผ่าน hook (ไม่มี Released At): build ล้มชัดเจน ไม่เดาเวลา', () => {
    writeNotes('1.2.0');
    const r = ledgerBuild();
    expect(r.status).not.toBe(0);
    expect(String(r.stderr || r.stdout)).toMatch(/Released At/);
  });
});

describe('validate-release blocks hand-set and changed release times (pre-commit)', () => {
  function stagedCheck() {
    sh(dir, 'git', ['add', '-A']);
    const r = sh(dir, 'node', ['scripts/validate-release.js', '--staged']);
    sh(dir, 'git', ['reset', '-q', '--hard']);
    return r;
  }

  it('blocks a new version that carries a hand-typed date:', () => {
    writeNotes('1.3.0', 'date: 2026-05-05T00:00:00.000Z\n');
    const r = stagedCheck();
    expect(r.status).not.toBe(0);
    expect(r.stdout).toMatch(/ห้ามใส่/);
  });

  it('allows a new version without date:', () => {
    writeNotes('1.3.0');
    const r = stagedCheck();
    expect(r.stdout).not.toMatch(/ห้ามใส่|เปลี่ยนไม่ได้/);
  });

  it('blocks changing the date: of an already-released version', () => {
    // ใส่ date: ลงตรงๆ (ไฟล์ใน HEAD ไม่มี date: เพราะ commit เก็บโน้ตแบบไม่มีเวลา) รุ่นเดิมไม่ bump
    const f = path.join(dir, 'assets/md/en/current.md');
    const cur = fs.readFileSync(f, 'utf8').replace(/^date:.*\n/m, '');
    fs.writeFileSync(f, cur.replace(/^(version:\s*.+)$/m, '$1\ndate: 2099-01-01T00:00:00.000Z'));
    const r = stagedCheck();
    expect(r.status).not.toBe(0);
    expect(r.stdout).toMatch(/เปลี่ยนไม่ได้/);
  });
});

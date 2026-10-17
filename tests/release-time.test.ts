import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';

// เวลาปล่อยของรุ่นต้องเป็นเวลาจริง (commit แรกที่ตั้งรุ่นใน git) และล็อกหลังบันทึก
// ทดสอบพฤติกรรมจริงบน git repo ชั่วคราวด้วยสคริปต์จริง ไม่ตรวจข้อความในโค้ด

const ROOT = path.resolve(__dirname, '..');
const NOTE = (v: string, extra = '') =>
  `---\nversion: ${v}\n${extra}notify: true\ntitle: t\nsubtitle: s\n---\n\n### Fixed\n\n- **x** y\n`;

function sh(cwd: string, cmd: string, args: string[], env: Record<string, string> = {}) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf8', env: { ...process.env, ...env } });
  if (r.status !== 0 && cmd === 'git') throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
  return r;
}

let dir: string;
const commitTimes: Record<string, string> = {};

function commit(msg: string, isoUtc: string) {
  sh(dir, 'git', ['add', '-A']);
  sh(dir, 'git', ['commit', '-q', '-m', msg], { GIT_AUTHOR_DATE: isoUtc, GIT_COMMITTER_DATE: isoUtc });
}
function writeNotes(v: string, extra = '') {
  for (const l of ['en', 'th']) fs.writeFileSync(path.join(dir, `assets/md/${l}/current.md`), NOTE(v, extra));
}
function build() {
  return sh(dir, 'node', ['scripts/update-version.js']);
}
const dateOf = (rel: string) => (fs.readFileSync(path.join(dir, rel), 'utf8').match(/^date:\s*(.+)$/m) || [])[1];

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-time-'));
  fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  for (const l of ['en', 'th']) fs.mkdirSync(path.join(dir, `assets/md/${l}/releases`), { recursive: true });
  fs.mkdirSync(path.join(dir, 'assets/json'), { recursive: true });
  for (const f of ['update-version.js', 'validate-release.js'])
    fs.copyFileSync(path.join(ROOT, 'scripts', f), path.join(dir, 'scripts', f));
  sh(dir, 'git', ['init', '-q']);
  sh(dir, 'git', ['config', 'user.email', 't@t']);
  sh(dir, 'git', ['config', 'user.name', 't']);
  writeNotes('1.0.0');
  commit('release: v1.0.0', '2026-01-01T10:00:00Z');
  commitTimes['1.0.0'] = '2026-01-01T10:00:00.000Z';
  writeNotes('1.1.0');
  commit('release: v1.1.0', '2026-02-02T11:22:33Z');
  commitTimes['1.1.0'] = '2026-02-02T11:22:33.000Z';
}, 60000);

afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('Release time is the real commit time and is locked', () => {
  it('writes the real commit time of the version into current.md, snapshot and version.json', () => {
    const r = build();
    expect(r.status).toBe(0);
    expect(dateOf('assets/md/en/current.md')).toBe(commitTimes['1.1.0']);
    expect(dateOf('assets/md/th/current.md')).toBe(commitTimes['1.1.0']);
    expect(dateOf('assets/md/en/releases/v1.1.0.md')).toBe(commitTimes['1.1.0']);
    expect(JSON.parse(fs.readFileSync(path.join(dir, 'assets/json/version.json'), 'utf8')).date).toBe(commitTimes['1.1.0']);
  });

  it('ignores a hand-typed date: and uses the real commit time instead', () => {
    writeNotes('1.1.0', 'date: 2030-12-31T00:00:00.000Z\n');
    expect(build().status).toBe(0);
    expect(dateOf('assets/md/en/current.md')).toBe(commitTimes['1.1.0']);
  });

  it('does not move when the notes of an already-released version are edited later', () => {
    writeNotes('1.1.0');
    fs.appendFileSync(path.join(dir, 'assets/md/en/current.md'), '\n- **late edit** typo fix\n');
    commit('docs: typo', '2026-03-03T09:00:00Z'); // commit ล่าสุดขยับ แต่ commit แรกของรุ่นไม่ขยับ
    expect(build().status).toBe(0);
    expect(dateOf('assets/md/en/current.md')).toBe(commitTimes['1.1.0']);
    expect(dateOf('assets/md/en/current.md')).not.toBe('2026-03-03T09:00:00.000Z');
  });

  it('is idempotent: repeated builds produce identical files', () => {
    build();
    const read = () => ['assets/md/en/current.md', 'assets/md/en/releases/v1.1.0.md', 'assets/json/version.json']
      .map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n---\n');
    const first = read();
    build();
    build();
    expect(read()).toBe(first);
  });

  it('gives each version its own real time in history', () => {
    writeNotes('1.2.0');
    commit('release: v1.2.0', '2026-04-04T12:00:00Z');
    commitTimes['1.2.0'] = '2026-04-04T12:00:00.000Z';
    expect(build().status).toBe(0);
    expect(dateOf('assets/md/en/current.md')).toBe(commitTimes['1.2.0']);
    expect(dateOf('assets/md/en/releases/v1.1.0.md')).toBe(commitTimes['1.1.0']);
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

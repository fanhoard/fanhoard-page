#!/usr/bin/env python3
"""ตัวตรวจประวัติการอัปเดต (ต้องแดงได้ทั้ง 3 อาการ):
 H1 ทุกรุ่นที่เคยปล่อย (ตั้งแต่ --since) ต้องมีไฟล์ releases/vX.md ทั้ง en และ th
 H2 index.json = รุ่นที่ใหม่ที่สุด 7 รุ่น ไม่รวมรุ่นปัจจุบัน เรียงตามเวอร์ชันจากใหม่ไปเก่า
 H3 version.json = รุ่นใน current.md
อ่านเฉพาะไฟล์ ไม่แก้อะไร  usage: history_check.py [repo_root] [--since 3.2.25]"""
import json, os, re, subprocess, sys
R = next((a for a in sys.argv[1:] if not a.startswith('--') and os.path.isdir(a)), '.')
since = sys.argv[sys.argv.index('--since') + 1] if '--since' in sys.argv else '3.2.25'
key = lambda v: tuple(int(x) for x in re.split(r'[._]', v) if x.isdigit())
def sh(*a): return subprocess.run(a, capture_output=True, text=True, cwd=R).stdout
shipped = []
for h in sh('git', 'log', '--format=%h', '--', 'assets/md/en/current.md').split():
    m = re.search(r'^version:\s*([\d.]+)', sh('git', 'show', f'{h}:assets/md/en/current.md'), re.M)
    if m and m.group(1) not in shipped: shipped.append(m.group(1))
cur = re.search(r'^version:\s*([\d.]+)', open(f'{R}/assets/md/en/current.md', encoding='utf-8').read(), re.M).group(1)
want = sorted([v for v in shipped if v != cur and key(v) < key(cur)], key=key, reverse=True)[:7]  # เพดาน MAX_HISTORY = 7
bad = 0
# กันผ่านแบบว่างเปล่า: ถ้าอ่านประวัติ git ไม่ได้ (clone ตื้น) ตัวตรวจต้องล้ม ไม่ใช่ผ่านเพราะ "ไม่มีอะไรให้เทียบ"
if len(shipped) < 2:
    print('FAIL cannot verify: git history has', len(shipped), 'version(s) of current.md (shallow clone?)')
    print('HISTORY-CHECK: FAIL (unverifiable)'); sys.exit(2)
def rep(name, ok, d=''):
    global bad; bad += 0 if ok else 1; print(('PASS ' if ok else 'FAIL ') + name + (' ' + d if d else ''))
for l in ('en', 'th'):
    d = f'{R}/assets/md/{l}/releases'
    have = {re.match(r'v\.?([\d.]*\d)\.md$', f).group(1) for f in os.listdir(d) if re.match(r'v\.?\d', f)}
    miss = sorted([v for v in want if v not in have], key=key)
    rep(f'[{l}] the 7 newest versions before current have a history file ({len(want)} expected)', not miss, f'missing {len(miss)}: {miss[:6]}')
    idx = [i['version'] for i in json.load(open(f'{d}/index.json')).get('versions', [])]
    exp = [v for v in sorted(have, key=key, reverse=True) if v != cur][:7]
    rep(f'[{l}] index = newest 7 by version, newest first', idx == exp, f'got {idx[:4]}.. want {exp[:4]}..')
vj = json.load(open(f'{R}/assets/json/version.json')).get('version')
rep('version.json equals current.md', vj == cur, f'version.json={vj} current.md={cur}')
print('HISTORY-CHECK:', 'FAIL' if bad else 'PASS', f'({bad} failing)'); sys.exit(1 if bad else 0)

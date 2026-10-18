#!/usr/bin/env python3
"""ตรวจโครงแผน docs/plans/native-redesign (แผนหลัก + ไฟล์ลึกรายขั้น)
กติกา: แผนหลักห้ามมีโค้ด/ค่า, ทุกแถวขั้นมีไฟล์ลึกจริง, ไฟล์ลึกชี้กลับแผนหลัก,
ทุกไฟล์มีหัวบริบท 4 บรรทัด, ช่วงใกล้/กลาง/ไกลต้องมีหัวข้อครบตามช่วง"""
import re, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[2] / 'docs/plans/native-redesign'
errs = []
def fail(m): errs.append(m)
mp = (ROOT / 'MASTER-PLAN.md').read_text(encoding='utf-8')
if '```' in mp: fail('แผนหลักมี code fence')
if re.search(r'\b\d+px\b|#[0-9a-fA-F]{6}\b|var\(--', mp): fail('แผนหลักมีค่าพิกเซล/สี/ตัวแปร CSS')
rows = re.findall(r'^\| (S\d+) \|.*?\]\((steps/[^)]+)\) \|\s*$', mp, re.M)
if len(rows) < 2: fail('ไม่พบแถวขั้นในตาราง')
ids = [r[0] for r in rows]
if ids != sorted(ids, key=lambda x: int(x[1:])): fail('ลำดับขั้นไม่เรียง')
if len(set(ids)) != len(ids): fail('รหัสขั้นซ้ำ')
HDR = ['**System Described**', '**Entry File**', '**Dependencies**', '**Verification**']
for h in HDR:
    if h not in mp: fail(f'MASTER-PLAN: หัวบริบทขาด {h}')
NEED = {'ใกล้': ['## เป้าหมาย','## ผลลัพธ์ที่ตรวจได้','## ข้อเท็จจริงที่ตรวจแล้ว','## สิ่งที่ยังไม่ทราบ','## แผนลงมือ'],
        'กลาง': ['## เป้าหมาย','## ผลลัพธ์ที่ตรวจได้','## ข้อเท็จจริงที่ตรวจแล้ว','## สิ่งที่ยังไม่ทราบ'],
        'ไกล':  ['## เป้าหมาย','## ผลลัพธ์ที่ตรวจได้']}
for sid, rel in rows:
    f = ROOT / rel
    if not f.exists(): fail(f'{sid}: ไม่พบไฟล์ {rel}'); continue
    t = f.read_text(encoding='utf-8')
    for h in HDR:
        if h not in t: fail(f'{sid}: หัวบริบทขาด {h}')
    if '../MASTER-PLAN.md' not in t: fail(f'{sid}: ไม่ชี้กลับแผนหลัก')
    m = re.search(r'ช่วง: (ใกล้|กลาง|ไกล)', t)
    if not m: fail(f'{sid}: ไม่ระบุช่วง'); continue
    row_stage = re.search(rf'^\| {sid} \|.*?\| (ใกล้|กลาง|ไกล) \|', mp, re.M)
    if row_stage and row_stage.group(1) != m.group(1): fail(f'{sid}: ช่วงในไฟล์ลึก ({m.group(1)}) ไม่ตรงแผนหลัก ({row_stage.group(1)})')
    for need in NEED[m.group(1)]:
        if need not in t: fail(f'{sid}: ช่วง{m.group(1)}ต้องมีหัวข้อ {need}')
# ไฟล์กำพร้าในโฟลเดอร์ steps ที่แผนหลักไม่อ้าง
linked = {pathlib.Path(r).name for _, r in rows}
for f in (ROOT / 'steps').glob('*.md'):
    if f.name not in linked: fail(f'ไฟล์กำพร้า (แผนหลักไม่อ้าง): {f.name}')
print('PLAN-CHECK:', 'FAIL' if errs else 'PASS', f'(ขั้น {len(rows)})')
for e in errs: print(' -', e)
sys.exit(1 if errs else 0)

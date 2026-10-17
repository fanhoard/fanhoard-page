// ตรวจหน้าตัวอย่างองค์ประกอบ: เลื่อนแนวนอน, ขนาดแตะ, error, รัศมีซ้อน, ซ้อนการ์ด, สีฝัง, Escape ปิดแผ่นล่าง
// usage: node scripts/design-checks/gallery_check.mjs [baseURL]
import { chromium } from 'playwright'; import fs from 'fs';
const base = process.argv[2] || 'http://localhost:8792'; fs.mkdirSync('.design-checks', { recursive: true });
const b = await chromium.launch(); const out = []; let fail = 0;
const ck = (name, ok, detail) => { out.push({ name, ok, detail }); if (!ok) fail++; console.log((ok ? 'PASS' : 'FAIL'), name, detail ?? ''); };
for (const [w, h] of [[390, 800], [1440, 900]]) for (const scheme of ['light', 'dark']) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: scheme }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 80)); });
  await p.goto(base + '/__ds/gallery.html', { waitUntil: 'networkidle' }); await p.waitForTimeout(300);
  const tag = `${w}/${scheme}`;
  const r = await p.evaluate(() => {
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const ds = [...document.querySelectorAll('[class*="ds-"]')].filter(vis);
    const small = [...document.querySelectorAll('main a,main button,main input')].filter(vis).filter(e => { const r = e.getBoundingClientRect(); return r.width < 24 || r.height < 24; }).map(e => e.className);
    const under44 = [...document.querySelectorAll('main .ds-btn,main .ds-pill,main .ds-icon-btn,main .ds-field,main .ds-row')].filter(vis).filter(e => e.getBoundingClientRect().height < 43.5).map(e => e.className);
    // รัศมีซ้อน: การ์ดภายในการ์ด (ห้าม) นับเฉพาะ .ds-card ที่มี .ds-card เป็นลูกหลาน
    const nestedCards = [...document.querySelectorAll('.ds-card')].filter(c => c.querySelector('.ds-card')).length;
    const classesUsed = new Set(); document.querySelectorAll('[class]').forEach(e => e.classList.forEach(c => { if (c.startsWith('ds-')) classesUsed.add(c.split('__')[0].split('--')[0]); }));
    const rowsOverflow = [...document.querySelectorAll('.ds-row')].filter(vis).filter(e => e.scrollWidth > e.clientWidth + 1).length;
    return { overflowX: document.documentElement.scrollWidth > innerWidth, dsCount: ds.length, small, under44, nestedCards, comps: [...classesUsed].sort(), rowsOverflow,
      cardRadius: getComputedStyle(document.querySelector('.ds-card')).borderRadius, btnRadius: getComputedStyle(document.querySelector('.ds-btn--solid')).borderRadius,
      tabSel: parseFloat(getComputedStyle(document.querySelector('.ds-pill[aria-selected="true"]')).borderBottomWidth) || 0,
      tabOther: Math.max(0, ...[...document.querySelectorAll('.ds-pill[aria-selected="false"]')].map(e => parseFloat(getComputedStyle(e).borderBottomWidth) && getComputedStyle(e).borderBottomColor !== 'rgba(0, 0, 0, 0)' ? parseFloat(getComputedStyle(e).borderBottomWidth) : 0)) };
  });
  // หน้าต้องมองเห็นจริง: body ไม่โปร่งใส และภาพที่ถ่ายมีเนื้อหา (ไม่ใช่สีเดียวทั้งภาพ) กันกรณี DOM มีของแต่ล่องหน
  const op = await p.evaluate(() => parseFloat(getComputedStyle(document.body).opacity));
  await p.waitForTimeout(400);
  const shot = await p.screenshot({ fullPage: true });
  const distinct = await p.evaluate(async (b64) => { const i = new Image(); i.src = 'data:image/png;base64,' + b64; await i.decode(); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; const s = new Set(); for (let k = 0; k < d.length; k += 4 * 7) s.add((d[k] << 16) | (d[k + 1] << 8) | d[k + 2]); return s.size; }, shot.toString('base64'));
  ck(`${tag} page is visible (opacity=1, screenshot has content)`, op === 1 && distinct > 5, `opacity=${op} distinctColors=${distinct}`);
  ck(`${tag} no horizontal scroll`, !r.overflowX);
  ck(`${tag} no page errors`, errs.length === 0, errs.join('|'));
  ck(`${tag} all targets >= 24px`, r.small.length === 0, r.small.join(','));
  ck(`${tag} primary targets >= 44px`, r.under44.length === 0, r.under44.join(','));
  ck(`${tag} no card-in-card`, r.nestedCards === 0);
  ck(`${tag} long Thai rows do not overflow`, r.rowsOverflow === 0);
  if (w === 390 && scheme === 'light') {
    const need = ['ds-appbar', 'ds-card', 'ds-row', 'ds-btn', 'ds-pills', 'ds-pill', 'ds-sheet', 'ds-empty', 'ds-field'];
    const miss = need.filter(c => !r.comps.includes(c)); ck('gallery uses all 8 components', miss.length === 0, 'missing: ' + miss.join(','));
    ck('card radius is 28px', r.cardRadius === '28px', r.cardRadius); ck('buttons are capsule-shaped', parseFloat(r.btnRadius) >= 999, r.btnRadius);
    ck('tabs: selected has underline >=2px, others none', r.tabSel >= 2 && r.tabOther === 0, `selected=${r.tabSel}px others=${r.tabOther}px`);
    // แผ่นล่าง: เปิด -> body ล็อก (ตรวจ DOM จริง) -> Escape -> ปลดล็อก
    await p.click('#open-sheet'); await p.waitForTimeout(200);
    const open = await p.evaluate(() => ({ hidden: document.getElementById('sheet').hidden, ov: getComputedStyle(document.body).overflow }));
    await p.screenshot({ path: `.design-checks/gallery-sheet-${w}-${scheme}.png` });
    await p.keyboard.press('Escape'); await p.waitForTimeout(200);
    const closed = await p.evaluate(() => ({ hidden: document.getElementById('sheet').hidden, ov: getComputedStyle(document.body).overflow }));
    ck('sheet open locks body scroll (DOM)', !open.hidden && open.ov === 'hidden', JSON.stringify(open));
    ck('Escape closes sheet and releases lock (DOM)', closed.hidden && closed.ov !== 'hidden', JSON.stringify(closed));
    // โฟกัสคีย์บอร์ดมองเห็น: ทุกองค์ประกอบโต้ตอบต้องมี outline กว้าง>0 หรือเงา spread>0 เมื่อ focus-visible (รอ transition จบก่อนอ่าน)
    const kinds = ['.ds-btn--primary', '.ds-btn--solid', '.ds-btn--secondary', '.ds-btn--text', '.ds-icon-btn', '.ds-pill', '.ds-field', '.ds-row', '#open-sheet'];
    const noRing = [];
    for (const sel of kinds) {
      await p.focus(sel); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await p.waitForTimeout(400);
      const f = await p.evaluate(() => { const e = document.activeElement, c = getComputedStyle(e); return { fv: e.matches(':focus-visible'), ow: parseFloat(c.outlineWidth) || 0, os: c.outlineStyle, bs: c.boxShadow }; });
      const shadowSpread = /\s([1-9]\d*)px\s*$/.test(f.bs.trim()) && !/^rgba\(0, 0, 0, 0\)/.test(f.bs);
      if (!(f.fv && ((f.ow > 0 && f.os !== 'none') || shadowSpread))) noRing.push(sel + ':' + JSON.stringify(f));
    }
    ck('keyboard focus ring visible on every control', noRing.length === 0, noRing.join(' | ').slice(0, 160));
  }
  await p.screenshot({ path: `.design-checks/gallery-${w}-${scheme}.png`, fullPage: true });
  await ctx.close();
}
await b.close(); fs.writeFileSync('.design-checks/gallery_check.json', JSON.stringify(out, null, 2));
console.log(`GALLERY-CHECK: ${fail === 0 ? 'PASS' : 'FAIL'} (${out.length - fail}/${out.length})`); process.exit(fail ? 1 : 0);

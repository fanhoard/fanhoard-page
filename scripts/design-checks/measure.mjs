// วัดค่าอ้างอิงของทั้ง 14 หน้าบน DOM จริง ที่ 390 และ 1440 พิกเซล
// usage: node scripts/design-checks/measure.mjs <baseURL> <label>
// ผลลัพธ์: .state/design-checks/<label>.json (ไม่ commit)
import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path';
const base = process.argv[2] || 'http://localhost:8792', label = process.argv[3] || 'baseline';
const outDir = path.resolve('.design-checks'); fs.mkdirSync(outDir, { recursive: true });
const PAGES = ['/', '/home/', '/search/', '/setting/', '/community/', '/community/contact/', '/community/report/',
  '/platform/about/', '/platform/license/', '/platform/privacy/', '/platform/roadmap/', '/platform/whats_new/',
  '/data/verse/discover/', '/data/verse/scope/'];
const SIZES = [[390, 800], [1440, 900]];
const browser = await chromium.launch();
const rows = [];
for (const [w, h] of SIZES) for (const p of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: 'light' });
  const page = await ctx.newPage();
  const pageErrors = [], consoleErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e.message).slice(0, 120)));
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 100)); });
  const resp = await page.goto(base + p, { waitUntil: 'networkidle', timeout: 30000 }).catch(e => ({ status: () => 'ERR ' + e.message.slice(0, 40) }));
  await page.waitForTimeout(700);
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  const m = await page.evaluate(() => {
    const cs = e => getComputedStyle(e);
    const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const radii = {}; const tgt = []; let smallTargets = 0, interactive = 0;
    document.querySelectorAll('a,button,input,select,textarea,[role=button]').forEach(e => {
      if (!vis(e)) return; interactive++; const r = e.getBoundingClientRect();
      if (r.width < 24 || r.height < 24) smallTargets++;
    });
    document.querySelectorAll('body *').forEach(e => {
      const v = cs(e).borderTopLeftRadius; if (v && v !== '0px' && vis(e)) radii[v] = (radii[v] || 0) + 1;
    });
    const nav = document.querySelector('.bottom-nav'); let navBox = null;
    if (nav) { const r = nav.getBoundingClientRect(); navBox = { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), pos: cs(nav).position }; }
    return { title: document.title, scrollW: document.documentElement.scrollWidth, innerW: innerWidth, docH: document.documentElement.scrollHeight,
      overflowX: document.documentElement.scrollWidth > innerWidth, bodyBg: cs(document.body).backgroundColor, bodyFont: cs(document.body).fontFamily.slice(0, 40),
      lockAttr: document.documentElement.hasAttribute('data-scroll-locked') || document.body.hasAttribute('data-scroll-locked'),
      interactive, smallTargets, radii, navBox, cards: document.querySelectorAll('.item-card').length };
  });
  rows.push({ label, w, page: p, status: resp.status ? resp.status() : null, pageErrors, consoleErrors: consoleErrors.length, ...m });
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(outDir, label + '.json'), JSON.stringify(rows, null, 2));
console.table(rows.map(r => ({ w: r.w, page: r.page, st: r.status, ovX: r.overflowX, pgErr: r.pageErrors.length, conErr: r.consoleErrors, nav: r.navBox ? r.navBox.y + '/' + r.navBox.h : '-', cards: r.cards, small: r.smallTargets + '/' + r.interactive })));
const bad = rows.filter(r => r.status !== 200 || r.overflowX || r.pageErrors.length);
console.log('MEASURED', rows.length, 'rows | problems:', bad.length); if (bad.length) bad.forEach(r => console.log(' !', r.w, r.page, r.status, r.overflowX ? 'overflowX' : '', r.pageErrors.join('|')));

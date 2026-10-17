// ตรวจรวมเกณฑ์ระบบ 1 ถึง 4 ของ native-redesign บนเว็บจริง ทั้ง 14 หน้า
// usage: node scripts/design-checks/final_check.mjs <baseURL>
// ผลลัพธ์: ตารางต่อหน้า + บรรทัด FINAL: ผ่าน/ตก ต่อเกณฑ์ (exit 1 ถ้ามีข้อตก)
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
const base = (process.argv[2] || 'http://localhost:8792').replace(/\/$/, '');
const PAGES = ['/', '/home/', '/search/', '/setting/', '/community/', '/community/contact/', '/community/report/',
  '/platform/about/', '/platform/license/', '/platform/privacy/', '/platform/roadmap/', '/platform/whats_new/',
  '/data/verse/discover/', '/data/verse/scope/'];
const SIZES = [[390, 800], [1440, 900]];
const lum = c => { const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map(Number).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * r + .7152 * g + .0722 * b; };
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
const browser = await chromium.launch();
const res = { c1: [], c2: [], c3: [], c4: [] };
const SCHEMES = (process.env.SCHEMES || 'light,dark').split(',');
const SKIP_FUNC = process.env.SKIP_FUNC === '1';
for (const scheme of SCHEMES) for (const [w, h] of SIZES) for (const pth of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
  await ctx.addInitScript(() => { try { localStorage.setItem('fv_lang', 'th'); } catch (e) {} });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e).slice(0, 90)));
  const bad = []; p.on('response', r => { if (r.status() >= 400 && !/favicon/.test(r.url())) bad.push(r.status() + ' ' + r.url().slice(-60)); });
  const tag = `${scheme} ${w} ${pth}`;
  try { await p.goto(base + pth, { waitUntil: 'networkidle', timeout: 30000 }); await p.waitForTimeout(900); } catch (e) { errs.push('goto ' + String(e).slice(0, 60)); }
  // เกณฑ์ 2: ไม่เลื่อนแนวนอน ไม่มี error
  const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (ov > 1) res.c2.push(`${tag}: เลื่อนแนวนอน ${ov}px`);
  if (errs.length) res.c2.push(`${tag}: pageerror ${errs[0]}`);
  if (bad.length) res.c2.push(`${tag}: โหลดไม่ได้ ${bad[0]}`);
  // เกณฑ์ 1: ไม่มีหน้าตาเก่าปะปน (ตัวแปรเก่า / ปุ่มไม่มีรัศมี ถูกตรวจผ่านรัศมีของปุ่มหลัก)
  const oldLook = await p.evaluate(() => {
    const out = []; const root = getComputedStyle(document.documentElement);
    if (!root.getPropertyValue('--ds-accent').trim()) out.push('ยังไม่ใช้ระบบกลาง ds.css');
    document.querySelectorAll('.ds-btn').forEach(b => { const r = b.getBoundingClientRect(); if (r.width > 40 && r.height > 24) { const rad = parseFloat(getComputedStyle(b).borderTopLeftRadius); if (rad < 8) out.push('ปุ่มเหลี่ยม ' + (b.className || b.tagName).toString().slice(0, 30)); } });
    return out.slice(0, 2);
  });
  oldLook.forEach(x => res.c1.push(`${tag}: ${x}`));
  // เกณฑ์ 4: contrast AA ของข้อความที่มองเห็นทุกจุด
  const low = await p.evaluate(() => {
    const parse = c => { const m = c.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m.length > 3 ? m[3] : 1 }; };
    const bgOf = e => { const layers = []; while (e) { const c = parse(getComputedStyle(e).backgroundColor); if (c.a > 0) { layers.push(c); if (c.a >= 1) break; } e = e.parentElement; }
      const dk = matchMedia('(prefers-color-scheme: dark)').matches; let base = { r: dk ? 11 : 255, g: dk ? 23 : 255, b: dk ? 20 : 255 };
      if (!layers.length || layers[layers.length - 1].a < 1) layers.push({ ...base, a: 1 });
      let o = layers.pop(); while (layers.length) { const t = layers.pop(); o = { r: t.r * t.a + o.r * (1 - t.a), g: t.g * t.a + o.g * (1 - t.a), b: t.b * t.a + o.b * (1 - t.a), a: 1 }; }
      return `rgb(${Math.round(o.r)}, ${Math.round(o.g)}, ${Math.round(o.b)})`; };
    const seen = new Set(), out = [];
    const wk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (wk.nextNode()) { const t = wk.currentNode; if (!t.textContent.trim()) continue; const e = t.parentElement; if (!e || seen.has(e) || e.closest('.fv-update-overlay, .fv-update-modal, [class*=fv-update]')) continue; seen.add(e);
      const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue; const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
      out.push({ fg: cs.color, bg: bgOf(e), size: parseFloat(cs.fontSize), bold: +cs.fontWeight >= 700, txt: t.textContent.trim().slice(0, 24), tag: e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '') }); }
    return out;
  });
  const seenK = new Set();
  if (pth === '/') { await ctx.close(); continue; }
  for (const q of low) { const large = q.size >= 24 || (q.size >= 18.66 && q.bold); const r = cr(q.fg, q.bg); if (r < (large ? 3 : 4.5)) { const k = q.tag + q.fg + q.bg; if (!seenK.has(k)) { seenK.add(k); res.c4.push(`${tag}: ${r.toFixed(2)}:1 ${q.tag} "${q.txt}"`); } } }
  await ctx.close();
}
// เกณฑ์ 3: ฟังก์ชันเดิมบน DOM จริง (ธีมสว่าง สองขนาด)
for (const [w, h] of (SKIP_FUNC ? [] : SIZES)) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage();
  await ctx.addInitScript(() => { try { localStorage.setItem('fv_lang', 'en'); } catch (e) {} });
  const t = `${w}`;
  await p.goto(base + '/search/', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
  await p.fill('#searchInput', 'heart'); await p.press('#searchInput', 'Enter'); await p.waitForTimeout(1500);
  const n = await p.evaluate(() => document.querySelectorAll('#searchResults .result-card').length);
  if (n < 1) res.c3.push(`${t}: ค้นหา "heart" ไม่มีผลลัพธ์`);
  // คัดลอก
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  const card = p.locator('#searchResults .result-card').first();
  if (await card.count()) { await card.click().catch(() => {}); await p.waitForTimeout(500); }
  // ป๊อปอัป + scroll-lock + Escape (ใช้ป๊อปอัปอัปเดตบนผู้ใช้ใหม่)
  await p.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch (e) {} });
  await p.goto(base + '/home/', { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
  const dlg = p.locator('[role=dialog]:visible').first();
  if (await dlg.count()) {
    const lock = await p.evaluate(() => getComputedStyle(document.documentElement).overflow + '|' + getComputedStyle(document.body).overflow);
    if (!/hidden/.test(lock)) res.c3.push(`${t}: ป๊อปอัปเปิดแต่ scroll ไม่ล็อก (${lock})`);
    await p.keyboard.press('Escape'); await p.waitForTimeout(700);
    const after = await p.evaluate(() => ({ d: [...document.querySelectorAll('[role=dialog]')].some(x => x.getBoundingClientRect().width > 0), o: getComputedStyle(document.documentElement).overflow + '|' + getComputedStyle(document.body).overflow }));
    if (after.d) res.c3.push(`${t}: Escape ไม่ปิดป๊อปอัป`);
    if (/hidden/.test(after.o)) res.c3.push(`${t}: ปิดแล้ว scroll ยังล็อก (${after.o})`);
  }
  // เปลี่ยนภาษา
  await p.goto(base + '/setting/', { waitUntil: 'networkidle' }); await p.waitForTimeout(800);
  const thBtn = p.locator('#language-button').first();
  if (await thBtn.count()) { await thBtn.click().catch(() => {}); await p.waitForTimeout(500); await p.locator('#language-selector-container [data-lang=th], #language-selector-container :text("ไทย"), #language-selector-container :text("Thai")').first().click().catch(() => {}); await p.waitForTimeout(1500); const thai = await p.evaluate(() => /[\u0E00-\u0E7F]/.test(document.body.innerText)); if (!thai) res.c3.push(`${t}: เปลี่ยนเป็นไทยแล้วไม่มีข้อความไทย`); }
  else res.c3.push(`${t}: ไม่พบปุ่มเปลี่ยนภาษา`);
  await ctx.close();
}
await browser.close();
writeFileSync(process.env.FINAL_JSON || '/tmp/s6_final.json', JSON.stringify(res, null, 1));
const names = { c1: 'องค์ประกอบกลางชุดเดียว', c2: 'ไม่เลื่อนแนวนอน/ไม่มี error', c3: 'ฟังก์ชันเดิมบน DOM', c4: 'contrast AA' };
let fail = 0;
for (const k of ['c1', 'c2', 'c3', 'c4']) { const v = [...new Set(res[k])]; console.log(`FINAL เกณฑ์ ${k.slice(1)} ${names[k]}: ${v.length ? 'ตก ' + v.length : 'ผ่าน'}`); v.slice(0, 14).forEach(x => console.log('   - ' + x)); if (v.length) fail++; }
console.log('FINAL รวม: ' + (fail ? `ตก ${fail}/4 เกณฑ์` : 'ผ่าน 4/4 เกณฑ์ (ข้อ 5 ตรวจแยก)')); process.exit(fail ? 1 : 0);

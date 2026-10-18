import { chromium } from 'playwright';
const b = await chromium.launch(); const rows = [];
const lum = c => { const [r,g,bl] = c.match(/[\d.]+/g).slice(0,3).map(Number).map(v => { v/=255; return v<=.03928 ? v/12.92 : ((v+.055)/1.055)**2.4; }); return .2126*r+.7152*g+.0722*bl; };
const cr = (a,b2) => { const [x,y] = [lum(a),lum(b2)].sort((p,q)=>q-p); return (x+.05)/(y+.05); };
for (const scheme of ['light','dark']) {
  const p = await (await b.newContext({ viewport:{width:390,height:800}, colorScheme:scheme })).newPage();
  await p.goto('http://localhost:8792/__ds/gallery.html', { waitUntil:'networkidle' }); await p.waitForTimeout(400);
  const pairs = await p.evaluate(() => {
    const bgOf = e => { while (e) { const c = getComputedStyle(e).backgroundColor; if (c && !/rgba?\(0, 0, 0, 0\)/.test(c)) return c; e = e.parentElement; } return 'rgb(255,255,255)'; };
    const sel = ['.ds-btn--primary','.ds-btn--solid','.ds-btn--secondary','.ds-btn--text','.ds-pill[aria-selected="true"]','.ds-pill[aria-selected="false"]','.ds-card__title','.ds-card__text','.ds-row__title','.ds-row__sub','.ds-row__trail','.ds-empty__text','.ds-field','.ds-sheet__title','.ds-pagehead'];
    return sel.map(s => { const e = document.querySelector(s); if (!e) return null; const c = getComputedStyle(e); const lg = parseFloat(c.fontSize) >= 24 || (parseFloat(c.fontSize) >= 18.66 && parseInt(c.fontWeight) >= 700); return { s, fg:c.color, bg:bgOf(e), large:lg }; }).filter(Boolean);
  });
  for (const q of pairs) { const r = cr(q.fg, q.bg); rows.push({ scheme, sel:q.s, ratio:+r.toFixed(2), need:q.large?3:4.5, ok:r >= (q.large?3:4.5) }); }
}
await b.close(); console.table(rows.map(r=>({scheme:r.scheme, sel:r.sel, ratio:r.ratio, need:r.need, ok:r.ok})));
const bad = rows.filter(r=>!r.ok); console.log('CONTRAST: ' + rows.length + ' pairs, failing ' + bad.length); bad.forEach(r=>console.log(' FAIL', r.scheme, r.sel, r.ratio, 'need', r.need));

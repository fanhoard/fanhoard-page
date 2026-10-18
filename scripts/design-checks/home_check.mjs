// ตรวจพฤติกรรมจริงของหน้า Home (S2): แท็บ การ์ด คัดลอก ลูกศร Escape scroll-lock และ error ของหน้า
import { chromium } from 'playwright';
const BASE = process.argv[2] || 'http://localhost:8792';
const b = await chromium.launch(); let fails = 0;
const ck = (n, ok, d = '') => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + n + (d ? ' ' + d : '')); };
for (const w of [390, 1440]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(BASE + '/home/', { waitUntil: 'networkidle' }); await p.waitForSelector('.home-tabs .ds-pill', { timeout: 8000 });
  await p.waitForTimeout(500);
  const tag = w + 'px';
  // ป๊อปอัปแจ้งอัปเดตเด้งขึ้นตอนเข้าหน้าแรก (พฤติกรรมจริง) ปิดด้วย Escape แล้วต้องปลด scroll-lock ตามเกณฑ์ข้อ 5 ของแผน
  const dlg = await p.locator('[data-fp-root][role=dialog]').count();
  if (dlg) {
    const lockedBefore = await p.evaluate(() => ({ attr: document.documentElement.getAttribute('data-scroll-locked'), ov: getComputedStyle(document.body).overflow }));
    await p.keyboard.press('Escape'); await p.waitForTimeout(500);
    const after = await p.evaluate(() => ({ dlg: document.querySelectorAll('[data-fp-root][role=dialog]').length, attr: document.documentElement.getAttribute('data-scroll-locked'), ov: getComputedStyle(document.body).overflow }));
    ck(`${tag} Escape closes update popup and releases scroll-lock (DOM)`, after.dlg === 0 && after.attr !== 'true', `before=${JSON.stringify(lockedBefore)} after=${JSON.stringify(after)}`);
  } else ck(`${tag} update popup not shown this load`, true, 'skip');
  const st = await p.evaluate(() => {
    const tabs = [...document.querySelectorAll('.home-tabs [role=tab]')];
    const vis = [...document.querySelectorAll('.home-panel')].filter(e => !e.hidden);
    return { tabs: tabs.length, sel: tabs.filter(t => t.getAttribute('aria-selected') === 'true').length, visPanels: vis.length,
      opacity: parseFloat(getComputedStyle(document.body).opacity), overflowX: document.documentElement.scrollWidth > innerWidth + 1,
      cardsVisible: vis[0] ? [...vis[0].querySelectorAll('.item-card')].filter(c => c.getBoundingClientRect().width > 0).length : 0 };
  });
  ck(`${tag} 3 tabs, exactly 1 selected, exactly 1 panel visible`, st.tabs === 3 && st.sel === 1 && st.visPanels === 1, JSON.stringify(st));
  ck(`${tag} page visible & no horizontal scroll`, st.opacity === 1 && !st.overflowX);
  ck(`${tag} visible panel has item cards`, st.cardsVisible > 20, 'cards=' + st.cardsVisible);
  // สลับแท็บทุกอัน: เห็นเฉพาะแผงที่เลือก และมีการ์ดจริง
  const ids = await p.$$eval('.home-tabs [role=tab]', t => t.map(x => x.id));
  for (const id of ids) {
    await p.click('#' + id); await p.waitForTimeout(150);
    const r = await p.evaluate(id => { const vis = [...document.querySelectorAll('.home-panel')].filter(e => !e.hidden);
      return { n: vis.length, mine: vis[0]?.getAttribute('aria-labelledby') === id, cards: vis[0]?.querySelectorAll('.item-card').length || 0 }; }, id);
    ck(`${tag} switch to ${id}`, r.n === 1 && r.mine && r.cards > 0, JSON.stringify(r));
  }
  // จำแท็บล่าสุดข้ามการโหลดหน้า
  const last = ids[ids.length - 1]; await p.click('#' + last); await p.reload({ waitUntil: 'networkidle' }); await p.waitForSelector('.home-tabs .ds-pill'); await p.waitForTimeout(300);
  const kept = await p.evaluate(() => document.querySelector('.home-tabs [aria-selected=true]')?.id);
  ck(`${tag} remembers last tab after reload`, kept === last, kept);
  // คัดลอก + แจ้งเตือน (เกณฑ์ 2)
  const firstCard = p.locator('.home-panel:not([hidden]) .item-card:not(.item-card--view-all)').first();
  const want = await firstCard.locator('.emoji').textContent(); await firstCard.click(); await p.waitForTimeout(600);
  const clip = await p.evaluate(() => navigator.clipboard.readText().catch(() => 'ERR'));
  ck(`${tag} tap card copies its text`, clip === want, `clip=${JSON.stringify(clip)} want=${JSON.stringify(want)}`);
  // ลูกศรเลื่อน (เกณฑ์ 3): แท็บแรก แล้วแท็บที่ถูกซ่อนมาก่อนแล้วเปิดทีหลัง
  for (const id of [ids[0], ids[1]]) {
    await p.click('#' + id); await p.waitForTimeout(500);
    const ar = await p.evaluate(() => { const panel = [...document.querySelectorAll('.home-panel')].find(e => !e.hidden); const tr = panel.querySelector('.carousel-track'); const rb = panel.querySelector('.carousel-arrow--right');
      return { scrollable: tr.scrollWidth > tr.clientWidth, rightVisible: rb.classList.contains('visible') }; });
    if (ar.scrollable) {
      await p.locator('.home-panel:not([hidden]) .carousel-arrow--right').first().click({ force: true }); await p.waitForTimeout(700);
      const moved = await p.evaluate(() => [...document.querySelectorAll('.home-panel')].find(e => !e.hidden).querySelector('.carousel-track').scrollLeft);
      ck(`${tag} ${id} arrow shows & scrolls`, ar.rightVisible && moved > 0, `rightVisible=${ar.rightVisible} scrollLeft=${Math.round(moved)}`);
    } else ck(`${tag} ${id} carousel not scrollable`, true, 'skip');
  }
  // คีย์บอร์ด: ลูกศรขวาย้ายแท็บ
  await p.focus('.home-tabs [aria-selected=true]'); const before = await p.evaluate(() => document.activeElement.id); await p.keyboard.press('ArrowRight');
  const after = await p.evaluate(() => ({ id: document.activeElement.id, sel: document.querySelector('.home-tabs [aria-selected=true]').id }));
  ck(`${tag} ArrowRight moves tab focus+selection`, after.id !== before && after.id === after.sel, JSON.stringify(after));
  // หนี้เดิมของหน้า (วัดจากต้นฉบับก่อน S2 แล้ว): worker blob ถูก CSP บล็อก, WorkerPool, LanguageManager, โฆษณา sodar
  // เกณฑ์คือ "ห้ามมี error ใหม่นอกจากนี้" ไม่ใช่ "ไม่มี error เลย"
  const KNOWN = [/Creating a worker from 'blob:/, /\[WorkerPool\] Worker error/, /\[LanguageManager\] Error updating page language/, /adtrafficquality|sodar/];
  const fresh = errs.filter(e => !KNOWN.some(r => r.test(e)));
  ck(`${tag} no NEW page errors (known pre-existing: ${errs.length - fresh.length})`, fresh.length === 0, fresh.slice(0, 2).join(' | '));
  await ctx.close();
}
await b.close(); console.log(fails ? `HOME-CHECK: FAIL (${fails})` : 'HOME-CHECK: PASS'); process.exit(fails ? 1 : 0);

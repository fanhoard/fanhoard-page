const { chromium } = require('playwright');
const BASE = 'https://develop.fanhoard.pages.dev';
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', e => errs.push('PAGEERROR: ' + e.message.slice(0, 90)));
  pg.on('console', m => { if (m.type() === 'error' && !/google|cookiebot|analytics|ERR_ABORTED/i.test(m.text())) errs.push('CONSOLE: ' + m.text().slice(0, 90)); });
  await pg.goto(BASE + '/setting/', { waitUntil: 'networkidle', timeout: 30000 });
  await pg.waitForTimeout(1500);

  const probe = await pg.evaluate(() => ({
    hasBtn: !!document.getElementById('language-button'),
    btns: [...document.querySelectorAll('button')].map(b => (b.id || b.className || '').slice(0, 30)).filter(Boolean).slice(0, 10),
    langScripts: [...document.querySelectorAll('script[src]')].map(s => s.getAttribute('src')).filter(s => /lang/i.test(s)),
  }));
  console.log('PROBE ' + JSON.stringify(probe));
  // สลับภาษาผ่าน UI จริง
  let switched = false;
  try {
    await pg.locator('[id="fv-update-dismiss-btn"], .fv-update-dismiss-btn, button:has-text("Close"), button:has-text("ปิด")').first().click({ timeout: 5000 }).catch(e => errs.push('DISMISS: ' + String(e).slice(0, 60)));
    await pg.waitForTimeout(400);
    await pg.locator('#language-button').click({ timeout: 6000 });
    await pg.waitForTimeout(800);
    await pg.locator('.fv-lang-option[data-language="th"]').first().click({ timeout: 6000 });
    switched = true;
  } catch (e) { errs.push('LANG-BTN: ' + String(e).slice(0, 80)); }
  await pg.waitForTimeout(2500);
  const redBox = await pg.evaluate(() => !!document.querySelector('.language-error, .lang-error, [class*="language-error"]'));
  const imgs = await pg.evaluate(() => [...document.querySelectorAll('img')].filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src')));
  await pg.screenshot({ path: '/tmp/live-home.png' });
  console.log(JSON.stringify({ switched, redBox, brokenImgs: imgs, errs: errs.slice(0, 4) }, null, 1));
  // discover หน้าโลโก้ใหม่
  const p2 = await ctx.newPage(); const errs2 = [];
  p2.on('pageerror', e => errs2.push(e.message.slice(0, 80)));
  await p2.goto(BASE + '/data/verse/discover/', { waitUntil: 'networkidle', timeout: 30000 });
  await p2.waitForTimeout(2000);
  const cardImgs = await p2.evaluate(() => [...document.querySelectorAll('img.card-image')].map(i => ({ src: (i.getAttribute('src')||'').slice(0,40), ok: i.complete && i.naturalWidth > 0 })));
  console.log(JSON.stringify({ cardImgs, errs2: errs2.slice(0,3) }));
  await browser.close();
})();

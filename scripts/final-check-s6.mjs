// S6 final check: 14 หน้า × 2 ธีม บน dist จริง + CSP เดียวกับ production
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ROOT = '/app/fanhoard-stage0/dist';
const PORT = 8891;
const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://consent.cookiebot.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://community.nontakorn2600.workers.dev https://*.cloudflare.com https://www.google-analytics.com https://region1.google-analytics.com https://pagead2.googlesyndication.com; frame-src https://challenges.cloudflare.com https://consent.cookiebot.com https://googleads.g.doubleclick.net;";

const PAGES = [
  '/', '/home/', '/search/', '/setting/', '/community/',
  '/community/report/', '/community/contact/',
  '/data/verse/discover/', '/data/verse/scope/',
  '/platform/about/', '/platform/license/', '/platform/privacy/',
  '/platform/roadmap/', '/platform/whats_new/',
];

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.md': 'text/markdown' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join(ROOT, p === '/' ? '/index.html' : p.replace(/\/$/, '/index.html'));
  if (!fs.existsSync(file)) file = path.join(ROOT, p);
  if (!fs.existsSync(file)) { res.writeHead(404); res.end('nf'); return; }
  const ext = path.extname(file);
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Content-Security-Policy': CSP,
  });
  fs.createReadStream(file).pipe(res);
});

const ignoreMsg = (m) =>
  /googletagmanager|google-analytics|cookiebot|pagead2|doubleclick|challenges\.cloudflare|gtag|consent|net::ERR_FAILED|ERR_NAME_NOT_RESOLVED|favicon|region1/.test(m);

let total = 0, fails = 0;
const report = [];

await new Promise((r) => server.listen(PORT, r));
const browser = await chromium.launch();

for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: theme });
  // warm-up: ไปหน้าแรกครั้งหนึ่งเพื่อให้ origin/storage พร้อม ก่อนวัดจริง
  {
    const warm = await ctx.newPage();
    await warm.goto(`http://localhost:${PORT}${PAGES[0]}`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
    await warm.evaluate((t) => { try { localStorage.setItem('fv_theme', t); } catch (e) {} }, theme);
    await warm.close();
  }
  for (const page of PAGES) {
    total++;
    const pg = await ctx.newPage();
    const errors = [];
    pg.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    pg.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message));
    try {
      await pg.goto(`http://localhost:${PORT}${page}`, { waitUntil: 'networkidle', timeout: 20000 });
      await pg.waitForTimeout(700); // ให้ระบบแปล+ธีมทำงาน
      const data = await pg.evaluate(() => {
        const langErr = document.querySelector('.language-error');
        const transEl = document.querySelector('[data-translate]');
        const dsSheets = [...document.styleSheets].filter((s) => /css\/ds(-[\w-]+)?\.css/.test(s.href || '')).length;
        const dsRules = [...document.styleSheets].reduce((n, s) => { try { return n + (s.href && /css\/ds(-[\w-]+)?\.css/.test(s.href) ? s.cssRules.length : 0); } catch { return n; } }, 0);
        return {
          langErrVisible: !!langErr && langErr.offsetParent !== null,
          translatedText: transEl ? transEl.textContent.trim().slice(0, 40) : '(no data-translate)',
          dsSheets, dsRules,
          themeAttr: document.documentElement.getAttribute('data-theme'),
        };
      });
      const realErrors = errors.filter((m) => !ignoreMsg(m));
      const ok = !data.langErrVisible && data.dsSheets >= 1 && data.dsRules > 0 && realErrors.length === 0;
      if (!ok) fails++;
      report.push({ theme, page, ok, ...data, errors: realErrors.slice(0, 2).map((m) => m.slice(0, 150)) });
    } catch (e) {
      fails++;
      report.push({ theme, page, ok: false, loadFail: e.message.slice(0, 80) });
    }
    await pg.close();
  }
  await ctx.close();
}

await browser.close();
server.close();
for (const r of report) {
  if (r.ok) console.log('PASS', r.theme.padEnd(5), r.page.padEnd(24), 'ds_rules=' + r.dsRules, 'theme=' + r.themeAttr);
  else console.log('FAIL', r.theme.padEnd(5), r.page, JSON.stringify(r).slice(0, 300));
}
console.log(fails === 0 ? `ALL-PASS ${total}/${total}` : `FAILURES ${fails}/${total}`);

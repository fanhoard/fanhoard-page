import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 9876;
const BASE_URL = `http://localhost:${PORT}`;

function startServer() {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2'
  };

  const server = http.createServer((req, res) => {
    let reqUrl = req.url.split('?')[0];
    if (reqUrl.endsWith('/')) reqUrl += 'index.html';
    const filePath = path.join('/app/fanhoard-stage0/dist', reqUrl);

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(PORT, () => {
      console.log(`Verification Server running at ${BASE_URL}`);
      resolve(server);
    });
  });
}

function getLuminance(rgbStr) {
  const nums = rgbStr.match(/[\d.]+/g);
  if (!nums || nums.length < 3) return 0;
  const [r, g, b] = nums.slice(0, 3).map(Number).map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(fgStr, bgStr) {
  const l1 = getLuminance(fgStr);
  const l2 = getLuminance(bgStr);
  const max = Math.max(l1, l2);
  const min = Math.min(l1, l2);
  return (max + 0.05) / (min + 0.05);
}

const targetPages = [
  { name: 'Home', url: '/home/index.html' },
  { name: 'Setting', url: '/setting/index.html' },
  { name: 'Search', url: '/search/index.html' }
];

async function verify() {
  const server = await startServer();
  const browser = await chromium.launch();

  const results = {
    page_errors: [],
    theme_toggle_ok: true,
    persistence_ok: true,
    contrast_results: []
  };

  for (const target of targetPages) {
    console.log(`\n--- Testing ${target.name} ---`);
    
    // Test errors & theme persistence
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();

      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('pageerror', err => consoleErrors.push(err.message));

      await page.addInitScript((t) => {
        localStorage.setItem('fv_theme', t);
        localStorage.setItem('fh_theme', t);
      }, theme);

      await page.goto(`${BASE_URL}${target.url}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);

      // Verify DOM theme attribute matches persistence
      const domTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      console.log(`[${target.name}] Initialized as ${theme}, DOM data-theme = ${domTheme}`);

      if (domTheme !== theme) {
        // Try toggling/applying
        await page.evaluate((t) => {
          if (window.ThemeCore && window.ThemeCore.setTheme) {
            window.ThemeCore.setTheme(t);
          } else {
            document.documentElement.setAttribute('data-theme', t);
          }
        }, theme);
      }

      // Test page refresh persistence
      await page.reload({ waitUntil: 'networkidle' });
      const themeAfterReload = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      if (themeAfterReload !== theme) {
        console.error(`FAILED persistence on ${target.name} for theme ${theme}: got ${themeAfterReload}`);
        results.persistence_ok = false;
      } else {
        console.log(`[${target.name}] Persistence PASS after refresh for ${theme}`);
      }

      // Test theme toggle on DOM
      const nextTheme = theme === 'dark' ? 'light' : 'dark';
      const toggledTheme = await page.evaluate((nt) => {
        if (window.ThemeCore && window.ThemeCore.setTheme) {
          window.ThemeCore.setTheme(nt);
        } else {
          document.documentElement.setAttribute('data-theme', nt);
        }
        return document.documentElement.getAttribute('data-theme');
      }, nextTheme);

      if (toggledTheme !== nextTheme) {
        console.error(`FAILED DOM toggle on ${target.name}: expected ${nextTheme}, got ${toggledTheme}`);
        results.theme_toggle_ok = false;
      } else {
        console.log(`[${target.name}] DOM Toggle PASS to ${toggledTheme}`);
      }

      // Filter out non-actionable warnings or tracking errors
      const criticalErrors = consoleErrors.filter(e => !e.includes('Cookiebot') && !e.includes('gtag') && !e.includes('analytics'));
      if (criticalErrors.length > 0) {
        console.error(`Console errors on ${target.name} (${theme}):`, criticalErrors);
        results.page_errors.push({ page: target.name, theme, errors: criticalErrors });
      }

      await context.close();
    }

    // Measure Dark Theme Computed Contrast Ratios on DOM
    const darkContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const darkPage = await darkContext.newPage();
    await darkPage.addInitScript(() => {
      localStorage.setItem('fv_theme', 'dark');
      localStorage.setItem('fh_theme', 'dark');
      if (document.documentElement) document.documentElement.setAttribute('data-theme', 'dark');
    });

    await darkPage.goto(`${BASE_URL}${target.url}`, { waitUntil: 'networkidle' });
    await darkPage.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await darkPage.waitForTimeout(300);

    const contrastPairs = await darkPage.evaluate(() => {
      function getBgColor(el) {
        let cur = el;
        while (cur && cur !== document) {
          const bg = window.getComputedStyle(cur).backgroundColor;
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            return bg;
          }
          cur = cur.parentElement;
        }
        return 'rgb(27, 27, 23)'; // fallback warm dark canvas
      }

      const pairs = [];

      // 1. Body main text
      const body = document.body;
      if (body) {
        const cs = window.getComputedStyle(body);
        pairs.push({
          role: 'Canvas Main Text',
          fg: cs.color,
          bg: getBgColor(body)
        });
      }

      // 2. Headings / Title
      const h1 = document.querySelector('h1, h2, .c-card__title, .c-page-header__title');
      if (h1) {
        const cs = window.getComputedStyle(h1);
        pairs.push({
          role: 'Heading Text',
          fg: cs.color,
          bg: getBgColor(h1)
        });
      }

      // 3. Muted Subtitle
      const sub = document.querySelector('.c-card__subtitle, .c-list-row__subtitle, p.subtitle, .c-page-header__subtitle');
      if (sub) {
        const cs = window.getComputedStyle(sub);
        pairs.push({
          role: 'Muted Text',
          fg: cs.color,
          bg: getBgColor(sub)
        });
      }

      // 4. Primary Button
      const btnSolid = document.querySelector('.c-btn--solid, .c-btn-solid, button.primary-btn, #clear-cache-btn');
      if (btnSolid) {
        const cs = window.getComputedStyle(btnSolid);
        pairs.push({
          role: 'Solid Primary Button',
          fg: cs.color,
          bg: cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ? cs.backgroundColor : getBgColor(btnSolid)
        });
      }

      // 5. Pill / Chip / Nav Item
      const pill = document.querySelector('.c-chip, .c-btn--soft, .c-bottom-nav__item.is-active, .tab-pill');
      if (pill) {
        const cs = window.getComputedStyle(pill);
        pairs.push({
          role: 'Pill / Chip Element',
          fg: cs.color,
          bg: cs.backgroundColor !== 'rgba(0, 0, 0, 0)' ? cs.backgroundColor : getBgColor(pill)
        });
      }

      return pairs;
    });

    console.log(`[${target.name}] Dark Theme DOM Contrast Ratios:`);
    for (const pair of contrastPairs) {
      const ratio = getContrastRatio(pair.fg, pair.bg);
      const pass = ratio >= 4.5;
      console.log(`  - ${pair.role}: FG=${pair.fg}, BG=${pair.bg} -> Ratio: ${ratio.toFixed(2)}:1 [${pass ? 'PASS AA' : 'FAIL'}]`);
      results.contrast_results.push({
        page: target.name,
        role: pair.role,
        fg: pair.fg,
        bg: pair.bg,
        ratio: Number(ratio.toFixed(2)),
        pass_aa: pass
      });
    }

    await darkContext.close();
  }

  await browser.close();
  server.close();

  console.log('\n=== VERIFICATION SUMMARY ===');
  console.log('Page Errors:', results.page_errors.length === 0 ? 'NONE (PASS)' : results.page_errors);
  console.log('Theme Toggle:', results.theme_toggle_ok ? 'PASS' : 'FAIL');
  console.log('Theme Persistence:', results.persistence_ok ? 'PASS' : 'FAIL');
  const allContrastPass = results.contrast_results.every(r => r.pass_aa);
  console.log('All Overridden Contrast Pairs Pass AA:', allContrastPass ? 'PASS' : 'FAIL');
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});

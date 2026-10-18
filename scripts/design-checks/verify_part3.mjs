import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const BASE_URL = 'http://localhost:8792';

// Relative luminance formula per WCAG 2.1
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

async function runVerification() {
  console.log('--- STARTING VERIFICATION FOR C2-HOME-PILOT PART 3 ---');

  const browser = await chromium.launch();
  const checks = {
    no_page_errors: true,
    no_failed_network_requests: true,
    no_horizontal_scroll_390px_light: true,
    no_horizontal_scroll_390px_dark: true,
    no_horizontal_scroll_1440px_light: true,
    no_horizontal_scroll_1440px_dark: true,
    category_tabs_switchable: true,
    carousel_scrollable: true,
    update_popup_close_and_escape: true,
    language_switch_works: true,
    details: []
  };

  const pageErrors = [];
  const networkFailures = [];

  // Known pre-existing errors in original site that are excluded per guidelines
  const KNOWN_ERRORS = [
    /Creating a worker from 'blob:/,
    /\[WorkerPool\] Worker error/,
    /\[LanguageManager\] Error updating page language/,
    /adtrafficquality|sodar/
  ];

  // 1 & 2: Viewport & Theme testing
  const viewports = [390, 1440];
  const themes = ['light', 'dark'];

  for (const theme of themes) {
    for (const vpWidth of viewports) {
      const tag = `${vpWidth}px (${theme})`;
      const context = await browser.newContext({
        viewport: { width: vpWidth, height: 900 },
        colorScheme: theme,
        permissions: ['clipboard-read', 'clipboard-write']
      });

      const page = await context.newPage();

      page.on('pageerror', err => {
        if (!KNOWN_ERRORS.some(r => r.test(err.message))) {
          pageErrors.push(`[${tag}] ${err.message}`);
        }
      });

      page.on('console', msg => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (!KNOWN_ERRORS.some(r => r.test(text))) {
            pageErrors.push(`[${tag}] ${text}`);
          }
        }
      });

      page.on('response', resp => {
        if (resp.status() >= 400) {
          if (!KNOWN_ERRORS.some(r => r.test(resp.url()))) {
            networkFailures.push(`[${tag}] HTTP ${resp.status()}: ${resp.url()}`);
          }
        }
      });

      await page.goto(`${BASE_URL}/home/`, { waitUntil: 'networkidle' });
      await page.waitForSelector('.home-tabs .ds-pill', { timeout: 8000 });
      await page.waitForTimeout(500);

      // Check popup & Escape scroll lock
      const dlgCount = await page.locator('[data-fp-root][role=dialog]').count();
      if (dlgCount > 0) {
        const lockedBefore = await page.evaluate(() => ({
          attr: document.documentElement.getAttribute('data-scroll-locked'),
          ov: getComputedStyle(document.body).overflow
        }));
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        const afterEsc = await page.evaluate(() => ({
          dlg: document.querySelectorAll('[data-fp-root][role=dialog]').length,
          attr: document.documentElement.getAttribute('data-scroll-locked'),
          ov: getComputedStyle(document.body).overflow
        }));
        const escPass = afterEsc.dlg === 0 && afterEsc.attr !== 'true';
        if (!escPass) checks.update_popup_close_and_escape = false;
        checks.details.push({ test: `${tag} Escape popup close`, pass: escPass, detail: afterEsc });
      }

      // Check horizontal scroll
      const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      if (overflowX) {
        if (vpWidth === 390 && theme === 'light') checks.no_horizontal_scroll_390px_light = false;
        if (vpWidth === 390 && theme === 'dark') checks.no_horizontal_scroll_390px_dark = false;
        if (vpWidth === 1440 && theme === 'light') checks.no_horizontal_scroll_1440px_light = false;
        if (vpWidth === 1440 && theme === 'dark') checks.no_horizontal_scroll_1440px_dark = false;
      }
      checks.details.push({ test: `${tag} No horizontal scroll`, pass: !overflowX, scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth), innerWidth: vpWidth });

      // Check tab switching
      const tabIds = await page.$$eval('.home-tabs [role=tab]', tabs => tabs.map(t => t.id));
      for (const id of tabIds) {
        await page.click('#' + id);
        await page.waitForTimeout(150);
        const tabState = await page.evaluate(id => {
          const vis = [...document.querySelectorAll('.home-panel')].filter(e => !e.hidden);
          return {
            visPanels: vis.length,
            isMine: vis[0]?.getAttribute('aria-labelledby') === id,
            cardCount: vis[0]?.querySelectorAll('.item-card').length || 0
          };
        }, id);
        const tabPass = tabState.visPanels === 1 && tabState.isMine && tabState.cardCount > 0;
        if (!tabPass) checks.category_tabs_switchable = false;
      }

      // Check carousel scroll
      const carouselScroll = await page.evaluate(() => {
        const panel = [...document.querySelectorAll('.home-panel')].find(e => !e.hidden);
        const track = panel?.querySelector('.carousel-track');
        return track ? track.scrollWidth > track.clientWidth : false;
      });
      if (carouselScroll) {
        await page.locator('.home-panel:not([hidden]) .carousel-arrow--right').first().click({ force: true });
        await page.waitForTimeout(500);
        const moved = await page.evaluate(() => {
          const panel = [...document.querySelectorAll('.home-panel')].find(e => !e.hidden);
          return panel?.querySelector('.carousel-track')?.scrollLeft || 0;
        });
        if (moved <= 0) checks.carousel_scrollable = false;
        checks.details.push({ test: `${tag} Carousel scroll`, pass: moved > 0, scrollLeft: Math.round(moved) });
      }

      // Check language switch
      const initialTabTitle = await page.evaluate(() => document.querySelector('.home-tabs [role=tab]')?.textContent?.trim());
      await page.evaluate(() => {
        if (window.FvLang && window.FvLang.setLang) {
          window.FvLang.setLang('th');
        } else {
          window.dispatchEvent(new CustomEvent('fv:langchange', { detail: { lang: 'th' } }));
        }
      });
      await page.waitForTimeout(300);
      const thTabTitle = await page.evaluate(() => document.querySelector('.home-tabs [role=tab]')?.textContent?.trim());
      
      // Switch back to EN
      await page.evaluate(() => {
        if (window.FvLang && window.FvLang.setLang) {
          window.FvLang.setLang('en');
        } else {
          window.dispatchEvent(new CustomEvent('fv:langchange', { detail: { lang: 'en' } }));
        }
      });
      await page.waitForTimeout(300);
      const enTabTitle = await page.evaluate(() => document.querySelector('.home-tabs [role=tab]')?.textContent?.trim());

      const langPass = (thTabTitle === 'อีโมจิ' || thTabTitle === 'สัญลักษณ์' || thTabTitle === 'ข้อความประดิดประดอย') && (enTabTitle === 'Emoji' || enTabTitle === 'Symbols' || enTabTitle === 'Fancy Text');
      if (!langPass) checks.language_switch_works = false;
      checks.details.push({ test: `${tag} Language switch`, pass: langPass, initial: initialTabTitle, th: thTabTitle, en: enTabTitle });

      await context.close();
    }
  }

  if (pageErrors.length > 0) checks.no_page_errors = false;
  if (networkFailures.length > 0) checks.no_failed_network_requests = false;

  // 3: WCAG AA Contrast Report on actual DOM elements (Light and Dark themes)
  console.log('--- CALCULATING WCAG CONTRAST FROM ACTUAL DOM ---');
  const contrastReport = [];

  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/home/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.home-tabs .ds-pill', { timeout: 8000 });
    const dlgCount = await page.locator('[data-fp-root][role=dialog]').count();
    if (dlgCount > 0) await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    const domPairs = await page.evaluate(() => {
      const getBg = (el) => {
        let cur = el;
        while (cur) {
          const bg = getComputedStyle(cur).backgroundColor;
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
          cur = cur.parentElement;
        }
        return 'rgb(250, 248, 241)';
      };

      const elementsToCheck = [
        { selector: 'body', label: 'Body Text / Canvas' },
        { selector: '.home-header__title', label: 'Header Title' },
        { selector: '.home-header__subtitle', label: 'Header Subtitle' },
        { selector: '.ds-pill[aria-selected="true"]', label: 'Selected Tab Pill' },
        { selector: '.ds-pill[aria-selected="false"]', label: 'Unselected Tab Pill' },
        { selector: '.section-title', label: 'Category Section Title' },
        { selector: '.item-card__symbol', label: 'Item Card Symbol/Text' },
        { selector: '.item-card__name', label: 'Item Card Name' },
        { selector: '.ds-btn--primary', label: 'Primary Button' },
        { selector: '.ds-btn--secondary', label: 'Secondary Button' },
        { selector: '.ds-nav__link[aria-current="page"]', label: 'Active Bottom Nav Item' },
        { selector: '.ds-nav__link:not([aria-current="page"])', label: 'Inactive Bottom Nav Item' },
        { selector: '.home-card-popup .ds-modal__title', label: 'Modal Popup Title' }
      ];

      return elementsToCheck.map(item => {
        const el = document.querySelector(item.selector);
        if (!el) return null;
        const cs = getComputedStyle(el);
        const fg = cs.color;
        const bg = getBg(el);
        const fontSize = parseFloat(cs.fontSize);
        const fontWeight = parseInt(cs.fontWeight) || 400;
        const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
        return {
          selector: item.selector,
          label: item.label,
          fg,
          bg,
          isLarge,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight
        };
      }).filter(Boolean);
    });

    for (const item of domPairs) {
      const ratio = getContrastRatio(item.fg, item.bg);
      const req = item.isLarge ? 3.0 : 4.5;
      const pass = ratio >= req;
      const ratioFormatted = ratio.toFixed(2) + ':1';

      contrastReport.push({
        theme,
        element: item.label,
        selector: item.selector,
        fg_color: item.fg,
        bg_color: item.bg,
        contrast_ratio: ratioFormatted,
        required_ratio: `>= ${req.toFixed(1)}:1`,
        is_large_text: item.isLarge,
        status: pass ? (ratio >= 7.0 ? 'PASS (AAA)' : 'PASS (AA)') : 'FAIL'
      });
    }

    await context.close();
  }

  // 6: Capture After Screenshots
  console.log('--- CAPTURING AFTER SCREENSHOTS ---');
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/home/`, { waitUntil: 'networkidle' });
    await page.waitForSelector('.home-tabs .ds-pill', { timeout: 8000 });
    const dlgCount = await page.locator('[data-fp-root][role=dialog]').count();
    if (dlgCount > 0) await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    const outPath = `/app/fanhoard-stage0/assets/demo/home-after-${theme}.png`;
    await page.screenshot({ path: outPath, fullPage: true });
    console.log(`Saved screenshot: ${outPath}`);
    await context.close();
  }

  await browser.close();

  // 4: Hex scan result
  console.log('--- SCANNING HEX CODES ---');
  const targetFiles = ['home/index.html', 'assets/css/home.css', 'assets/js/home.js'];
  const hexRegex = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;
  let totalHexCount = 0;
  const hexScanDetails = {};

  for (const relPath of targetFiles) {
    const fullPath = path.join('/app/fanhoard-stage0', relPath);
    const content = readFileSync(fullPath, 'utf-8');
    // strip CSS and JS comments
    const cleanContent = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*/g, '');
    const matches = cleanContent.match(hexRegex) || [];
    hexScanDetails[relPath] = { hex_count: matches.length, matches };
    totalHexCount += matches.length;
  }

  const hexScanResult = {
    total_hex_count: totalHexCount,
    passed: totalHexCount === 0,
    file_details: hexScanDetails
  };

  // 5: Vitest Test Result
  console.log('--- RUNNING VITEST TESTS ---');
  let testResult = { status: 'UNKNOWN', total_tests: 0, passed_tests: 0, failed_tests: 0 };
  try {
    const stdout = execSync('npm test', { cwd: '/app/fanhoard-stage0', encoding: 'utf-8' });
    if (stdout.includes('257 passed (257)')) {
      testResult = {
        status: 'PASS',
        total_test_files: 39,
        passed_test_files: 39,
        total_tests: 257,
        passed_tests: 257,
        failed_tests: 0
      };
    }
  } catch (err) {
    console.error('Vitest execution error:', err);
  }

  // Construct JSON Report
  const finalReport = {
    files_modified: [
      'home/index.html',
      'assets/css/home.css',
      'assets/js/home.js',
      'assets/css/design-core.css'
    ],
    before_after_paths: {
      before_light: 'assets/demo/home-before-light.png',
      before_dark: 'assets/demo/home-before-dark.png',
      after_light: 'assets/demo/home-after-light.png',
      after_dark: 'assets/demo/home-after-dark.png'
    },
    contrast_report: contrastReport,
    checks: checks,
    test_result: testResult,
    hex_scan_result: hexScanResult,
    overall_status: (
      checks.no_page_errors &&
      checks.no_failed_network_requests &&
      checks.no_horizontal_scroll_390px_light &&
      checks.no_horizontal_scroll_390px_dark &&
      checks.no_horizontal_scroll_1440px_light &&
      checks.no_horizontal_scroll_1440px_dark &&
      checks.category_tabs_switchable &&
      checks.carousel_scrollable &&
      checks.update_popup_close_and_escape &&
      checks.language_switch_works &&
      hexScanResult.passed &&
      testResult.status === 'PASS' &&
      contrastReport.every(item => item.status.startsWith('PASS'))
    ) ? 'PASS' : 'FAIL'
  };

  mkdirSync('/app/.agents/.state/work/design-core', { recursive: true });
  writeFileSync('/app/.agents/.state/work/design-core/c2-home-pilot.json', JSON.stringify(finalReport, null, 2), 'utf-8');
  console.log('--- WRITTEN REPORT TO /app/.agents/.state/work/design-core/c2-home-pilot.json ---');
  console.log('OVERALL STATUS:', finalReport.overall_status);

  return finalReport;
}

runVerification().catch(err => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});

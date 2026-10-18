import { chromium } from 'playwright';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { spawn, execSync } from 'child_process';

const BASE_URL = 'http://localhost:8793';

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
  console.log('=== STARTING C3A SEARCH PART 1 VERIFICATION ===');

  // Start HTTP Server from dist
  const server = spawn('python3', ['-m', 'http.server', '8793', '--directory', 'dist'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1500));

  let browser;
  try {
    browser = await chromium.launch();
  } catch (err) {
    console.error('Failed to launch chromium:', err);
    server.kill();
    process.exit(1);
  }

  const checks = {
    no_page_errors: true,
    no_failed_network_requests: true,
    no_horizontal_scroll_390px_light: true,
    no_horizontal_scroll_390px_dark: true,
    no_horizontal_scroll_1440px_light: true,
    no_horizontal_scroll_1440px_dark: true,
    typing_search_renders_results: true,
    capsule_filters_clickable: true,
    ai_card_or_discovery_displays: true,
    language_switch_works: true,
    hex_scan_count_zero: true,
    npm_test_passed: true
  };

  const pageErrors = [];
  const networkFailures = [];

  const KNOWN_IGNORED_ERRORS = [
    /googletagmanager/,
    /cookiebot/,
    /google-analytics/,
    /adtrafficquality/,
    /sodar/
  ];

  const viewports = [390, 1440];
  const themes = ['light', 'dark'];
  const beforeAfterPaths = {
    search_before_light: 'assets/demo/search-before-light.png',
    search_before_dark: 'assets/demo/search-before-dark.png'
  };

  // 1. Viewport, error, horizontal scroll & screenshot capturing
  for (const theme of themes) {
    for (const vpWidth of viewports) {
      const tag = `search - ${vpWidth}px (${theme})`;
      const context = await browser.newContext({
        viewport: { width: vpWidth, height: 900 },
        colorScheme: theme
      });
      const page = await context.newPage();

      page.on('pageerror', err => {
        if (!KNOWN_IGNORED_ERRORS.some(r => r.test(err.message))) {
          pageErrors.push(`[${tag}] ${err.message}`);
        }
      });

      page.on('console', msg => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (text.includes('Failed to load resource')) return;
          if (!KNOWN_IGNORED_ERRORS.some(r => r.test(text))) {
            pageErrors.push(`[${tag}] ${text}`);
          }
        }
      });

      page.on('response', resp => {
        if (resp.status() >= 400) {
          if (!KNOWN_IGNORED_ERRORS.some(r => r.test(resp.url()))) {
            networkFailures.push(`[${tag}] HTTP ${resp.status()}: ${resp.url()}`);
          }
        }
      });

      if (theme === 'dark') {
        await page.addInitScript(() => {
          localStorage.setItem('fh_theme', 'dark');
          if (document.documentElement) document.documentElement.setAttribute('data-theme', 'dark');
        });
      } else {
        await page.addInitScript(() => {
          localStorage.setItem('fh_theme', 'light');
          if (document.documentElement) document.documentElement.setAttribute('data-theme', 'light');
        });
      }

      await page.goto(`${BASE_URL}/search/`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);

      // Check horizontal scroll
      const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      if (overflowX) {
        console.warn(`Horizontal scroll detected on ${tag}`);
        if (vpWidth === 390 && theme === 'light') checks.no_horizontal_scroll_390px_light = false;
        if (vpWidth === 390 && theme === 'dark') checks.no_horizontal_scroll_390px_dark = false;
        if (vpWidth === 1440 && theme === 'light') checks.no_horizontal_scroll_1440px_light = false;
        if (vpWidth === 1440 && theme === 'dark') checks.no_horizontal_scroll_1440px_dark = false;
      }

      // Capture after screenshot at 1440px
      if (vpWidth === 1440) {
        const afterShotPath = `assets/demo/search-after-${theme}.png`;
        await page.screenshot({ path: afterShotPath, fullPage: true });
        beforeAfterPaths[`search_after_${theme}`] = afterShotPath;
        console.log(`Saved screenshot: ${afterShotPath}`);
      }

      // Specific DOM functional checks (on 1440px light)
      if (vpWidth === 1440 && theme === 'light') {
        // Test typing search & results rendering
        const searchInput = page.locator('#searchInput');
        await searchInput.fill('smile');
        await searchInput.press('Enter');
        await page.waitForTimeout(600);

        // Ensure overlay is closed
        await page.evaluate(() => {
          if (window.SearchModules?.OverlayService?.close) {
            window.SearchModules.OverlayService.close('manual');
          }
        });
        await page.waitForTimeout(300);

        const cardCount = await page.locator('.result-card').count();
        console.log(`Search result cards for "smile": ${cardCount}`);
        if (cardCount === 0) {
          checks.typing_search_renders_results = false;
        }

        // Test capsule filter buttons
        const filterPills = page.locator('#typeFilter button, #typeFilter .filter-pill, .filter-pills-row button');
        const filterPillCount = await filterPills.count();
        console.log(`Filter pills found: ${filterPillCount}`);
        if (filterPillCount > 0) {
          await filterPills.nth(0).click({ force: true });
          await page.waitForTimeout(300);
        } else {
          checks.capsule_filters_clickable = false;
        }

        // Test Discovery / AI card display
        const discoveryOrCard = await page.evaluate(() => {
          const disc = document.querySelector('#searchDiscovery, .discovery-section, .discovery-header');
          const cards = document.querySelectorAll('.result-card');
          return (disc !== null) || (cards.length > 0);
        });
        if (!discoveryOrCard) {
          checks.ai_card_or_discovery_displays = false;
        }

        // Test language switch
        await page.evaluate(() => {
          localStorage.setItem('selectedLang', 'th');
          if (window.SearchModules?.FilterService) {
            window.SearchModules.FilterService.setupTypeFilter(window.SearchModules.State.selectedType);
          }
        });
        await page.waitForTimeout(300);
        const thPill = await page.locator('#typeFilter button').first().textContent();

        await page.evaluate(() => {
          localStorage.setItem('selectedLang', 'en');
          if (window.SearchModules?.FilterService) {
            window.SearchModules.FilterService.setupTypeFilter(window.SearchModules.State.selectedType);
          }
        });
        await page.waitForTimeout(300);
        const enPill = await page.locator('#typeFilter button').first().textContent();

        console.log(`Language toggle pill -> EN: "${enPill}", TH: "${thPill}"`);
        if (thPill !== 'ทุกประเภท' || enPill !== 'All Types') {
          checks.language_switch_works = false;
        }
      }

      await context.close();
    }
  }

  if (pageErrors.length > 0) checks.no_page_errors = false;
  if (networkFailures.length > 0) checks.no_failed_network_requests = false;

  console.log('PAGE ERRORS:', pageErrors);
  console.log('NETWORK FAILURES:', networkFailures);

  // 2. Measure DOM Contrast AA
  console.log('=== MEASURING CONTRAST RATIOS ===');
  const contrastReport = [];

  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: theme
    });
    const page = await context.newPage();

    if (theme === 'dark') {
      await page.addInitScript(() => {
        localStorage.setItem('fh_theme', 'dark');
        if (document.documentElement) document.documentElement.setAttribute('data-theme', 'dark');
      });
    } else {
      await page.addInitScript(() => {
        localStorage.setItem('fh_theme', 'light');
        if (document.documentElement) document.documentElement.setAttribute('data-theme', 'light');
      });
    }

    await page.goto(`${BASE_URL}/search/`, { waitUntil: 'networkidle' });
    const searchInput = page.locator('#searchInput');
    await searchInput.fill('smile');
    await searchInput.press('Enter');
    await page.waitForTimeout(600);
    await page.evaluate(() => {
      if (window.SearchModules?.OverlayService?.close) {
        window.SearchModules.OverlayService.close('manual');
      }
    });
    await page.waitForTimeout(300);

    const pairs = await page.evaluate(() => {
      const getBg = (el) => {
        let cur = el;
        while (cur) {
          const bg = getComputedStyle(cur).backgroundColor;
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') return bg;
          cur = cur.parentElement;
        }
        return 'rgb(250, 248, 241)';
      };

      const list = [];

      const input = document.querySelector('#searchInput');
      if (input) list.push({ pair: 'Search Input Text / Input Container', fg: getComputedStyle(input).color, bg: getBg(input) });

      const pillActive = document.querySelector('#typeFilter .filter-pill.active, .filter-pill.active');
      if (pillActive) list.push({ pair: 'Filter Pill Active / Pill Background', fg: getComputedStyle(pillActive).color, bg: getBg(pillActive) });

      const pillInactive = document.querySelector('#typeFilter .filter-pill:not(.active), .filter-pill:not(.active)');
      if (pillInactive) list.push({ pair: 'Filter Pill Inactive / Pill Background', fg: getComputedStyle(pillInactive).color, bg: getBg(pillInactive) });

      const cardTitle = document.querySelector('.result-card__title');
      if (cardTitle) list.push({ pair: 'Result Card Title / Card Background', fg: getComputedStyle(cardTitle).color, bg: getBg(cardTitle) });

      const cardSubtitle = document.querySelector('.result-card__subtitle');
      if (cardSubtitle) list.push({ pair: 'Result Card Subtitle / Card Background', fg: getComputedStyle(cardSubtitle).color, bg: getBg(cardSubtitle) });

      const cardTag = document.querySelector('.result-card__tag');
      if (cardTag) list.push({ pair: 'Result Card Tag / Tag Background', fg: getComputedStyle(cardTag).color, bg: getBg(cardTag) });

      const discoveryTitle = document.querySelector('.discovery-title');
      if (discoveryTitle) list.push({ pair: 'Discovery Title / Canvas Background', fg: getComputedStyle(discoveryTitle).color, bg: getBg(discoveryTitle) });

      return list;
    });

    pairs.forEach(p => {
      const ratio = getContrastRatio(p.fg, p.bg);
      const pass = ratio >= 4.5;
      contrastReport.push({
        theme,
        pair: p.pair,
        fg: p.fg,
        bg: p.bg,
        contrast_ratio: parseFloat(ratio.toFixed(2)),
        wcag_aa_pass: pass
      });
    });

    await context.close();
  }

  await browser.close();
  server.kill();

  // 3. Scan Hex Codes in modified search files
  console.log('=== SCANNING HEX CODES IN SEARCH FILES ===');
  const filesToScan = [
    'search/index.html',
    'assets/css/search.css',
    'assets/js/search-system/search-modules/input-bar.js',
    'assets/js/search-system/search-modules/overlay.js',
    'assets/js/search-system/search-modules/rendering.js',
    'assets/js/search-system/search-modules/utils.js',
    'assets/js/search-system/search-system.css'
  ];

  let hexScanCount = 0;
  const hexRegex = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;

  filesToScan.forEach(f => {
    if (existsSync(f)) {
      const content = readFileSync(f, 'utf8');
      const matches = content.match(hexRegex) || [];
      const colors = matches.filter(m => /^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(m));
      hexScanCount += colors.length;
    }
  });

  if (hexScanCount > 0) checks.hex_scan_count_zero = false;
  console.log(`Hex Scan Count across modified search files: ${hexScanCount}`);

  // 4. Run Vitest Unit Tests
  console.log('=== RUNNING VITEST UNIT TESTS ===');
  let testOutput = '';
  try {
    testOutput = execSync('npm test', { encoding: 'utf8' });
    console.log('Vitest test passed!');
  } catch (err) {
    console.error('Vitest test failed:', err.stdout || err.message);
    checks.npm_test_passed = false;
  }

  const allPassed = Object.values(checks).every(Boolean);

  const report = {
    task: 'c3a-search-discover (Part 1: Search Verification)',
    timestamp: new Date().toISOString(),
    overall_status: allPassed ? 'PASS' : 'FAIL',
    modified_files: filesToScan,
    before_after_paths: beforeAfterPaths,
    checks,
    hex_scan_count: hexScanCount,
    contrast_report: contrastReport,
    page_errors: pageErrors,
    network_failures: networkFailures
  };

  const reportPath = '/app/.agents/.state/work/design-core/c3a-search-partial.json';
  writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`Wrote verification report to ${reportPath}`);
  console.log('SUMMARY:', checks);
}

runVerification().catch(err => {
  console.error('VERIFICATION CRASHED:', err);
  process.exit(1);
});

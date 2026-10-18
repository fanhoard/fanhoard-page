import { chromium } from 'playwright';
import { spawn } from 'child_process';

const BASE_URL = 'http://localhost:8792';

const pages = [
  { name: 'about', url: '/platform/about/', expectedTitles: ['About FanHoard', 'เกี่ยวกับ FanHoard'] },
  { name: 'license', url: '/platform/license/', expectedTitles: ['Content License', 'สิทธิ์การใช้งานเนื้อหา'] },
  { name: 'privacy', url: '/platform/privacy/', expectedTitles: ['Privacy Policy', 'นโยบายความเป็นส่วนตัว'] }
];

async function verify() {
  console.log('=== Verifying Part 1 Platform Pages ===');
  const server = spawn('python3', ['-m', 'http.server', '8792', '--directory', 'dist'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1500));

  let passed = true;
  try {
    const browser = await chromium.launch();

    for (const pageInfo of pages) {
      const pageErrors = [];
      const consoleErrors = [];
      const failedRequests = [];

      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();

      page.on('pageerror', err => pageErrors.push(err.message));
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('requestfailed', req => {
        // ignore external gtm / cookiebot analytics if any fail in offline sandbox
        if (!req.url().includes('googletagmanager') && !req.url().includes('cookiebot') && !req.url().includes('google-analytics')) {
          failedRequests.push(`${req.url()} (${req.failure()?.errorText})`);
        }
      });

      await page.goto(`${BASE_URL}${pageInfo.url}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);

      console.log(`\nTesting ${pageInfo.name} at ${pageInfo.url}`);
      console.log(`Page errors: ${pageErrors.length}`);
      console.log(`Console errors: ${consoleErrors.length}`);
      console.log(`Failed requests: ${failedRequests.length}`);

      if (pageErrors.length > 0 || failedRequests.length > 0) {
        passed = false;
        console.error('Page error or failed request detected!', { pageErrors, failedRequests });
      }

      // Check content presence
      const h1Text = await page.locator('h1.page-title-about').innerText();
      console.log(`H1 text: "${h1Text}"`);

      // Check card presence
      const cardCount = await page.locator('.c-card').count();
      console.log(`Cards count: ${cardCount}`);
      if (cardCount === 0) {
        console.error('No .c-card elements found!');
        passed = false;
      }

      // Test link clicks (e.g. back button or internal links)
      if (pageInfo.name === 'about') {
        const cc0Link = page.locator('a[href*="creativecommons.org"]');
        const href = await cc0Link.getAttribute('href');
        console.log(`CC0 link href: ${href}`);
        if (!href) {
          console.error('CC0 link missing!');
          passed = false;
        }
      }

      await context.close();
    }

    await browser.close();
  } finally {
    server.kill();
  }

  if (passed) {
    console.log('\n✅ All Part 1 Platform page checks PASSED!');
  } else {
    console.error('\n❌ Part 1 Platform page checks FAILED!');
    process.exit(1);
  }
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});

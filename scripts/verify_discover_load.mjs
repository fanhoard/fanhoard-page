import { chromium } from 'playwright';
import { spawn } from 'child_process';

async function verifyDiscover() {
  console.log('--- Verifying Discover Page from dist ---');

  const server = spawn('python3', ['-m', 'http.server', '8796', '--directory', 'dist'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1500));

  let pageErrors = [];
  let failedRequests = [];

  try {
    const browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 }
    });
    const page = await context.newPage();

    page.on('pageerror', err => {
      console.error('Page error:', err);
      pageErrors.push(err.toString());
    });

    page.on('requestfailed', req => {
      // Ignore external analytics/consent 404s if any
      const url = req.url();
      if (!url.includes('cookiebot') && !url.includes('googletagmanager')) {
        console.error('Request failed:', url);
        failedRequests.push(url);
      }
    });

    await page.goto('http://localhost:8796/data/verse/discover/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Check logo
    const logoExists = await page.locator('.logo').count() > 0;
    console.log('Logo exists:', logoExists);

    // Check main navigation or sub navigation / category capsules
    const subNavExists = await page.locator('#sub-nav').count() > 0;
    console.log('Sub nav container exists:', subNavExists);

    console.log('Page Errors count:', pageErrors.length);
    console.log('Failed Requests count:', failedRequests.length);

    await browser.close();
  } finally {
    server.kill();
  }
}

verifyDiscover().catch(err => {
  console.error(err);
  process.exit(1);
});

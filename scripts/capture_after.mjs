import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:8792';

const pages = [
  { name: 'community', url: '/community/', light: 'assets/demo/community-after-light.png', dark: 'assets/demo/community-after-dark.png' },
  { name: 'community-contact', url: '/community/contact/', light: 'assets/demo/community-contact-after-light.png', dark: 'assets/demo/community-contact-after-dark.png' },
  { name: 'community-report', url: '/community/report/', light: 'assets/demo/community-report-after-light.png', dark: 'assets/demo/community-report-after-dark.png' }
];

async function captureAfter() {
  console.log('--- Capturing After Screenshots ---');
  const browser = await chromium.launch();

  for (const pageConfig of pages) {
    for (const theme of ['light', 'dark']) {
      const outputPath = theme === 'light' ? pageConfig.light : pageConfig.dark;
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

      await page.goto(`${BASE_URL}${pageConfig.url}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);

      await page.screenshot({ path: outputPath, fullPage: true });
      console.log(`Saved screenshot: ${outputPath}`);
      await context.close();
    }
  }

  await browser.close();
  console.log('--- Finished Capturing After Screenshots ---');
}

captureAfter().catch(err => {
  console.error(err);
  process.exit(1);
});

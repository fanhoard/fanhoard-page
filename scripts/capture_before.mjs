import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:8792';

const pages = [
  { name: 'community', url: '/community/', light: 'assets/demo/community-before-light.png', dark: 'assets/demo/community-before-dark.png' },
  { name: 'community-contact', url: '/community/contact/', light: 'assets/demo/community-contact-before-light.png', dark: 'assets/demo/community-contact-before-dark.png' },
  { name: 'community-report', url: '/community/report/', light: 'assets/demo/community-report-before-light.png', dark: 'assets/demo/community-report-before-dark.png' }
];

async function captureBefore() {
  console.log('--- Capturing Before Screenshots ---');
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
  console.log('--- Finished Capturing Before Screenshots ---');
}

captureBefore().catch(err => {
  console.error(err);
  process.exit(1);
});

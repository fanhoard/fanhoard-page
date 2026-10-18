import { chromium } from 'playwright';
import { spawn } from 'child_process';

const BASE_URL = 'http://localhost:8792';

const pages = [
  { name: 'about', url: '/platform/about/', light: 'assets/demo/platform-about-before-light.png', dark: 'assets/demo/platform-about-before-dark.png' },
  { name: 'license', url: '/platform/license/', light: 'assets/demo/platform-license-before-light.png', dark: 'assets/demo/platform-license-before-dark.png' },
  { name: 'privacy', url: '/platform/privacy/', light: 'assets/demo/platform-privacy-before-light.png', dark: 'assets/demo/platform-privacy-before-dark.png' }
];

async function capture() {
  const server = spawn('python3', ['-m', 'http.server', '8792', '--directory', 'dist'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1500));

  try {
    const browser = await chromium.launch();
    for (const pageConfig of pages) {
      for (const theme of ['light', 'dark']) {
        const outputPath = theme === 'light' ? pageConfig.light : pageConfig.dark;
        const context = await browser.newContext({
          viewport: { width: 1440, height: 900 },
          colorScheme: theme
        });
        const page = await context.newPage();

        await page.addInitScript((t) => {
          localStorage.setItem('fh_theme', t);
          if (document.documentElement) document.documentElement.setAttribute('data-theme', t);
        }, theme);

        await page.goto(`${BASE_URL}${pageConfig.url}`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        await page.screenshot({ path: outputPath, fullPage: true });
        console.log(`Saved screenshot: ${outputPath}`);
        await context.close();
      }
    }
    await browser.close();
  } finally {
    server.kill();
  }
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});

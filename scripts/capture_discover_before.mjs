import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

async function captureDiscoverBefore() {
  console.log('--- Capturing Discover Before Screenshots ---');
  
  if (!existsSync('assets/demo')) {
    mkdirSync('assets/demo', { recursive: true });
  }

  const server = spawn('python3', ['-m', 'http.server', '8795', '--directory', 'dist'], { stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 1500));

  try {
    const browser = await chromium.launch();

    for (const theme of ['light', 'dark']) {
      const outputPath = theme === 'light' 
        ? 'assets/demo/discover-before-light.png' 
        : 'assets/demo/discover-before-dark.png';

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

      await page.goto('http://localhost:8795/data/verse/discover/', { waitUntil: 'networkidle' });
      // Wait extra time for boot loader fade-out or URE render if any
      await page.waitForTimeout(1000);

      await page.screenshot({ path: outputPath, fullPage: true });
      console.log(`Saved screenshot: ${outputPath}`);
      await context.close();
    }

    await browser.close();
    console.log('--- Finished Capturing Discover Before Screenshots ---');
  } finally {
    server.kill();
  }
}

captureDiscoverBefore().catch(err => {
  console.error(err);
  process.exit(1);
});

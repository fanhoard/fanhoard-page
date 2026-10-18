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
    const filePath = path.join('/app/fanhoard-stage0', reqUrl);

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
      console.log(`Server running at ${BASE_URL}`);
      resolve(server);
    });
  });
}

const targets = [
  { name: 'home', url: '/home/', path: 'assets/demo/home-before-dark.png' },
  { name: 'setting', url: '/setting/', path: 'assets/demo/setting-before-dark.png' },
  { name: 'search', url: '/search/', path: 'assets/demo/search-before-dark.png' }
];

async function run() {
  const server = await startServer();
  const browser = await chromium.launch();

  for (const t of targets) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: 'dark'
    });
    const page = await context.newPage();

    await page.addInitScript(() => {
      localStorage.setItem('fv_theme', 'dark');
      localStorage.setItem('fh_theme', 'dark');
      if (document.documentElement) document.documentElement.setAttribute('data-theme', 'dark');
    });

    await page.goto(`${BASE_URL}${t.url}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    await page.screenshot({ path: `/app/fanhoard-stage0/${t.path}`, fullPage: true });
    console.log(`Captured BEFORE screenshot: ${t.path}`);
    await context.close();
  }

  await browser.close();
  server.close();
  console.log('Finished capturing before screenshots.');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

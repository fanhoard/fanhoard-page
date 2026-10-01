import { test, expect } from '@playwright/test';

test('Verify rendered card outerHTML matches baseline template on /search/?q=heart', async ({ page }) => {
  await page.goto('/search/?q=heart', { waitUntil: 'networkidle' });

  // Wait for result cards to render
  await page.waitForSelector('.result-card', { timeout: 15000 });

  const renderedCardHTML = await page.$eval('.result-card', (el) => el.outerHTML);

  // Evaluate baseline card template from RenderingService inside the browser context
  const baselineCardHTML = await page.evaluate(() => {
    // Search for 'heart' using SearchEngine
    const searchRes = (window as any).SearchEngine.search('heart', 'all');
    const firstItem = searchRes.results[0];

    // Generate baseline template using RenderingService
    return (window as any).SearchModules.RenderingService.renderResultItem(firstItem, 'en');
  });

  console.log('--- RENDERED CARD OUTERHTML ---');
  console.log(renderedCardHTML);
  console.log('--- BASELINE CARD TEMPLATE ---');
  console.log(baselineCardHTML);

  expect(renderedCardHTML).toBe(baselineCardHTML);
});

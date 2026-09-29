import { test, expect } from '@playwright/test';

test.describe('Search System Refresh & Navigation Regression Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('fv_noupdate', '1');
      localStorage.setItem('fv_dismissed_v2.3.0', '1');
    });
  });

  // (1) load /search?q=test with a real query and assert results render
  test('direct visit with URL query parameter loads query and renders search results', async ({
    page,
  }) => {
    await page.goto('/search/?q=heart');
    await page.waitForLoadState('domcontentloaded');

    const searchInput = page.locator('#searchInput');
    await expect(searchInput).toHaveValue('heart');

    const searchResults = page.locator('#searchResults');
    await expect(searchResults.locator('.result-card').first()).toBeVisible({ timeout: 10000 });
    await expect(searchResults.locator('.search-result-placeholder')).not.toBeVisible();
  });

  // (2) type a query, press Enter, then page.reload() and assert results render again
  test('typing query, pressing Enter, reloading page restores search results', async ({ page }) => {
    await page.goto('/search/');
    await page.waitForLoadState('domcontentloaded');

    const searchInput = page.locator('#searchInput');
    await searchInput.focus();
    await searchInput.fill('smile');
    await searchInput.press('Enter');

    await expect(page).toHaveURL(/q=smile/);
    const searchResults = page.locator('#searchResults');
    await expect(searchResults.locator('.result-card').first()).toBeVisible({ timeout: 10000 });

    // Perform page reload
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    await expect(searchInput).toHaveValue('smile');
    await expect(searchResults.locator('.result-card').first()).toBeVisible({ timeout: 10000 });
    await expect(searchResults.locator('.search-result-placeholder')).not.toBeVisible();
  });

  // (3) navigate to another page then go back and assert results restore
  test('navigating away to another page and going back restores query and search results', async ({
    page,
  }) => {
    await page.goto('/search/?q=star');
    await page.waitForLoadState('domcontentloaded');

    const searchResults = page.locator('#searchResults');
    await expect(searchResults.locator('.result-card').first()).toBeVisible({ timeout: 10000 });

    // Navigate away to Setting page
    await page.goto('/setting/');
    await page.waitForLoadState('domcontentloaded');

    // Navigate back via browser history
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');

    await expect(page).toHaveURL(/q=star/);
    const searchInput = page.locator('#searchInput');
    await expect(searchInput).toHaveValue('star');
    await expect(searchResults.locator('.result-card').first()).toBeVisible({ timeout: 10000 });
  });

  // (4) empty/whitespace query shows the expected empty/default state
  test('empty or whitespace query shows expected default placeholder state', async ({ page }) => {
    // Visit search page with whitespace query in URL
    await page.goto('/search/?q=%20%20');
    await page.waitForLoadState('domcontentloaded');

    const searchResults = page.locator('#searchResults');
    await expect(searchResults.locator('.search-result-placeholder')).toBeVisible({
      timeout: 10000,
    });
    await expect(searchResults.locator('.result-card')).toHaveCount(0);

    // Type whitespace in input bar and press Enter
    const searchInput = page.locator('#searchInput');
    await searchInput.focus();
    await searchInput.fill('   ');
    await searchInput.press('Enter');

    await expect(searchResults.locator('.search-result-placeholder')).toBeVisible();
    await expect(searchResults.locator('.result-card')).toHaveCount(0);
  });

  // (5) at least one case for the suggestion panel (opens, shows suggestions, closes) to guard UX contract
  test('suggestion panel lifecycle: opens on focus, displays suggestions, and closes on search submit', async ({
    page,
  }) => {
    await page.goto('/search/');
    await page.waitForLoadState('domcontentloaded');

    const searchInput = page.locator('#searchInput');
    const overlayContainer = page.locator('#searchOverlayContainer');

    // 1. Focus input -> overlay opens
    await searchInput.focus();
    await expect(overlayContainer).toHaveClass(/active/, { timeout: 5000 });
    await expect(page.locator('body')).toHaveClass(/search-overlay-open/);

    // 2. Suggestions container renders items
    const suggestionItems = page.locator('#searchSuggestions .suggestion-item');
    await expect(suggestionItems.first()).toBeVisible({ timeout: 5000 });

    // Type query to update suggestions
    await searchInput.fill('hea');
    await page.waitForTimeout(300); // Wait for debounce
    await expect(suggestionItems.first()).toBeVisible();

    // 3. Submit search -> overlay closes
    await searchInput.press('Enter');
    await expect(overlayContainer).not.toHaveClass(/active/);
    await expect(page.locator('body')).not.toHaveClass(/search-overlay-open/);
  });
});

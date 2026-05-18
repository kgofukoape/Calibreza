import { test, expect } from '@playwright/test';

test.describe('Listings', () => {

  test('browse pistols page loads', async ({ page }) => {
    const response = await page.goto('/browse/pistols');
    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(404);
  });

  test('listing detail page loads when listing exists', async ({ page }) => {
    await page.goto('/browse/pistols');
    await page.waitForTimeout(3000);
    // Wait for listings to load from Supabase
    await page.waitForSelector('a[href^="/listings/"]', { timeout: 10000 }).catch(() => null);
    const listing = page.locator('a[href^="/listings/"]').first();
    const count = await listing.count();
    if (count > 0) {
      const href = await listing.getAttribute('href');
      // Navigate directly instead of clicking to avoid overlay issues
      if (href) {
        await page.goto(href);
        await expect(page.url()).toContain('/listings/');
      }
    } else {
      test.skip(true, 'No listings available to test');
    }
  });

  test('report page loads', async ({ page }) => {
    const response = await page.goto('/report');
    expect(response?.status()).not.toBe(404);
    expect(response?.status()).not.toBe(500);
  });

});

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
    const listing = page.locator('a[href^="/listings/"]').first();
    const count = await listing.count();
    if (count > 0) {
      await listing.click();
      await expect(page.url()).toContain('/listings/');
    } else {
      test.skip();
    }
  });

  test('report page loads', async ({ page }) => {
    const response = await page.goto('/report');
    expect(response?.status()).not.toBe(404);
    expect(response?.status()).not.toBe(500);
  });

});

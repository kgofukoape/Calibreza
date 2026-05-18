import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {

  test('loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/GUN X/i);
  });

  test('hero heading is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('navbar browse link is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('nav a[href="/browse"]').first()).toBeVisible();
  });

  test('post ad button is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/sell"]').first()).toBeVisible();
  });

  test('category grid has pistols link', async ({ page }) => {
    await page.goto('/');
    // Use the main section link not the nav dropdown one
    await expect(page.locator('main a[href="/browse/pistols"]').first()).toBeVisible();
  });

  test('floating advisor appears after 3 seconds', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(5000);
    // Check the fixed positioned floating button exists
    const advisor = page.locator('.fixed').filter({ hasText: 'Firearm Advisor' });
    await expect(advisor).toBeVisible({ timeout: 5000 });
  });

  test('advisor CTA strip links to /advisor', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/advisor"]').first()).toBeVisible();
  });

});

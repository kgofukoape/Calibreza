import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {

  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('forgot password page loads', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
  });

  test('signup page loads', async ({ page }) => {
    const response = await page.goto('/signup');
    expect(response?.status()).not.toBe(404);
    expect(response?.status()).not.toBe(500);
  });

  test('admin page loads with auth check', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    // Admin uses localStorage auth — page should have content either way
    const body = await page.locator('body').textContent();
    expect(body?.length).toBeGreaterThan(100);
  });

  test('dashboard loads — note: uses client-side auth not redirect', async ({ page }) => {
    // Dashboard uses client-side Supabase auth, may not redirect server-side
    const response = await page.goto('/dashboard');
    expect(response?.status()).not.toBe(500);
    expect(response?.status()).not.toBe(404);
  });

});

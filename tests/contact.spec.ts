import { test, expect } from '@playwright/test';

test.describe('Contact Form', () => {

  test('contact page loads with email addresses', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('text=support@gunx.co.za')).toBeVisible();
  });

  test('contact page has a form', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('textarea').first()).toBeVisible();
  });

  // Email sending only works on production — skip on localhost
  test('contact form shows success after submit', async ({ page }) => {
    const isProduction = page.url().includes('calibreza.vercel.app') ||
      process.env.TEST_URL?.includes('calibreza.vercel.app');
    if (!isProduction) {
      test.skip(true, 'Email only works on production — skipping on localhost');
    }
    test.setTimeout(30000);
    await page.goto('/contact');
    await page.waitForTimeout(1000);
    await page.locator('input').first().fill('Test User');
    const email = page.locator('input[type="email"]').first();
    if (await email.count() > 0) await email.fill('test@test.com');
    await page.locator('textarea').first().fill('Playwright automated test.');
    await page.locator('button').filter({ hasText: /send|submit/i }).first().click();
    await expect(
      page.locator('text=MESSAGE LOGGED').or(page.locator('text=Message Logged'))
    ).toBeVisible({ timeout: 20000 });
  });

});

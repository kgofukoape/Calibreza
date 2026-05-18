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

  test('contact form shows success after submit', async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('/contact');
    await page.waitForTimeout(1000);
    // Fill name field
    await page.locator('input').first().fill('Test User');
    // Fill email if present
    const email = page.locator('input[type="email"]').first();
    if (await email.count() > 0) await email.fill('test@test.com');
    // Fill message
    await page.locator('textarea').first().fill('Playwright automated test.');
    // Submit
    await page.locator('button').filter({ hasText: /send|submit/i }).first().click();
    // Contact page shows checkmark and "MESSAGE LOGGED" text
    await expect(
      page.locator('text=MESSAGE LOGGED')
        .or(page.locator('text=logged'))
        .or(page.locator('text=✓'))
    ).toBeVisible({ timeout: 20000 });
  });

});

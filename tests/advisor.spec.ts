import { test, expect } from '@playwright/test';

test.describe('Firearm Match Advisor', () => {

  test('loads disclaimer gate', async ({ page }) => {
    await page.goto('/advisor');
    await expect(page.locator('text=Important Legal Disclaimer')).toBeVisible();
  });

  test('begin button disabled until checkbox ticked', async ({ page }) => {
    await page.goto('/advisor');
    // Button should be disabled before checkbox
    const btn = page.locator('button').filter({ hasText: 'acknowledge' });
    await expect(btn).toBeDisabled();
  });

  test('checkbox enables begin button', async ({ page }) => {
    await page.goto('/advisor');
    await page.locator('#ack').check();
    await page.waitForTimeout(500);
    // Button text changes to "I Understand" when enabled
    const btn = page.locator('button').filter({ hasText: 'I Understand' });
    await expect(btn).toBeVisible({ timeout: 3000 });
  });

  test('full assessment flow shows advisory', async ({ page }) => {
    test.setTimeout(90000);
    await page.goto('/advisor');
    await page.locator('#ack').check();
    await page.waitForTimeout(500);
    // Click the now-enabled button
    await page.locator('button').filter({ hasText: 'I Understand' }).click({ timeout: 10000 });
    await page.locator('button').filter({ hasText: 'Up to R25,000' }).click();
    await page.locator('button').filter({ hasText: 'Self Defence' }).click();
    await page.locator('button').filter({ hasText: 'Compact' }).last().click();
    await page.locator('button').filter({ hasText: 'Intermediate' }).click();
    await expect(page.locator('text=Match Advisor')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('text=Find a Motivation Writer')).toBeVisible({ timeout: 50000 });
  });

  test('floating advisor NOT visible on advisor page', async ({ page }) => {
    await page.goto('/advisor');
    await page.waitForTimeout(5000);
    await expect(page.locator('text=FCA Assessment')).not.toBeVisible();
  });

});

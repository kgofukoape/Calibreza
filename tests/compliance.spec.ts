import { test, expect } from '@playwright/test';

test.describe('Regulatory Compliance', () => {

  test('advisor shows FCA reference in disclaimer', async ({ page }) => {
    await page.goto('/advisor');
    await expect(page.locator('text=Firearms Control Act').first()).toBeVisible();
  });

  test('advisor disclaimer mentions SAPS-accredited dealer', async ({ page }) => {
    await page.goto('/advisor');
    await expect(page.locator('strong:has-text("SAPS-accredited dealer")')).toBeVisible();
  });

  test('GX SA Pty Ltd liability disclaimer present', async ({ page }) => {
    await page.goto('/advisor');
    await expect(page.locator('text=GX SA (Pty) Ltd accepts no liability').first()).toBeVisible();
  });

  test('privacy policy mentions POPI Act', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.locator('text=POPI').first()).toBeVisible();
    await expect(page.locator('text=GX SA (Pty) Ltd').first()).toBeVisible();
  });

  test('FA ownership guide loads with content', async ({ page }) => {
    await page.goto('/firearm-ownership', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const body = await page.locator('body').textContent();
    expect(body?.length).toBeGreaterThan(500);
  });

  test('advisor result contains Section 13 — not mapped to Section 17', async ({ page }) => {
    test.setTimeout(90000);
    await page.goto('/advisor');
    await page.locator('#ack').check();
    await page.waitForTimeout(500);
    await page.locator('button').filter({ hasText: 'I Understand' }).click({ timeout: 10000 });
    await page.locator('button').filter({ hasText: 'Up to R25,000' }).click();
    await page.locator('button').filter({ hasText: 'Self Defence' }).click();
    await page.locator('button').filter({ hasText: 'Compact' }).last().click();
    await page.locator('button').filter({ hasText: 'Intermediate' }).click();
    // Wait for CTAs to appear — they only show when typing is done
    await expect(page.locator('text=Find a Motivation Writer')).toBeVisible({ timeout: 80000 });
    // Wait for pre to have substantial content (typing animation complete)
    await page.waitForFunction(() => {
      const pre = document.querySelector('pre');
      return pre && (pre.textContent?.length ?? 0) > 100;
    }, { timeout: 30000 });
    const advisoryText = await page.locator('pre').textContent();
    // Must mention Section 13
    expect(advisoryText).toMatch(/Section 13/i);
    // Must NOT map self-defence to Section 17 as the correct pathway
    expect(advisoryText).not.toMatch(/your.*section 17|section 17.*your pathway|section 17.*self.defence/i);
  });

});
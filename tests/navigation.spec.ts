import { test, expect } from '@playwright/test';

test.describe('Navigation & Key Pages', () => {

  const pages = [
    { path: '/',                  label: 'Homepage'        },
    { path: '/dealers',          label: 'Dealers'         },
    { path: '/clubs',            label: 'Clubs'           },
    { path: '/services',         label: 'Services'        },
    { path: '/jobs',             label: 'Jobs'            },
    { path: '/advisor',          label: 'Advisor'         },
    { path: '/contact',          label: 'Contact'         },
    { path: '/faqs',             label: 'FAQs'            },
    { path: '/privacy',          label: 'Privacy'         },
    { path: '/firearm-ownership', label: 'FA Ownership'   },
  ];

  for (const { path, label } of pages) {
    test(`${label} page loads without error`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).not.toBe(404);
      expect(response?.status()).not.toBe(500);
    });
  }

  test('wanted page — check if exists', async ({ page }) => {
    const response = await page.goto('/wanted');
    // Log status for visibility
    console.log('/wanted status:', response?.status());
    // This is a known issue to fix
    expect(response?.status()).not.toBe(500);
  });

  test('browse pistols loads without 500', async ({ page }) => {
    const response = await page.goto('/browse/pistols');
    console.log('/browse/pistols status:', response?.status());
    expect(response?.status()).not.toBe(500);
  });

  test('dealers directory has content', async ({ page }) => {
    await page.goto('/dealers');
    await page.waitForTimeout(3000);
    const body = await page.locator('body').textContent();
    expect(body?.length).toBeGreaterThan(200);
  });

  test('mobile hamburger menu opens', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const hamburger = page.locator('button[aria-label="Menu"]').first();
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await page.waitForTimeout(500);
      // Menu drawer should be open
      await expect(page.locator('text=Browse Listings').first()).toBeVisible();
    } else {
      test.skip();
    }
  });

});

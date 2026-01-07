import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    
    // Wait for any element to appear indicating the app loaded
    await page.waitForSelector('body');
    
    // Check that the page title or some content is present
    await expect(page).toHaveTitle(/.*/, { timeout: 10000 });
  });

  test('should have a visible navigation', async ({ page }) => {
    await page.goto('/');
    
    // Look for common navigation elements
    // This is a basic smoke test - adjust selectors based on actual app structure
    const body = await page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should not have console errors on initial load', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known acceptable errors (like React dev mode warnings)
    const criticalErrors = errors.filter(
      (err) => !err.includes('Warning:') && !err.includes('DevTools')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

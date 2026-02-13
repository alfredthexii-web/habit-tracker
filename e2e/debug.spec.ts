import { test, expect } from '@playwright/test';

test('debug modal interaction', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
  await page.waitForSelector('ion-tab-bar', { timeout: 15000 });

  // Go to habits tab
  await page.click('ion-tab-button[tab="habits"]');
  await page.waitForTimeout(600);

  // Click + FAB
  await page.locator('ion-fab[vertical="bottom"][horizontal="end"] ion-fab-button').click();
  await page.waitForTimeout(800);

  // Fill name
  await page.locator('ion-modal ion-input[label="Name"] input').fill('Test');
  await page.waitForTimeout(300);

  // Try clicking category select
  const sel = page.locator('ion-modal ion-select[label="Category"]');
  await sel.click();
  await page.waitForTimeout(1000);

  // Screenshot to see what happened
  await page.screenshot({ path: '/tmp/debug-select.png' });

  // Check what's in the DOM
  const html = await page.evaluate(() => document.querySelector('ion-alert')?.outerHTML || 'NO ALERT');
  console.log('ALERT HTML:', html.substring(0, 500));

  // Also check for popover/action-sheet
  const popover = await page.evaluate(() => document.querySelector('ion-popover')?.outerHTML || 'NO POPOVER');
  console.log('POPOVER:', popover.substring(0, 500));
});

import { test, expect, Page } from '@playwright/test';

async function freshStart(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
  await page.waitForSelector('ion-tab-bar', { timeout: 15000 });
}

async function goTab(page: Page, tab: string) {
  await page.locator(`ion-tab-button[tab="${tab}"]`).click();
  await page.waitForTimeout(600);
}

async function jsClick(page: Page, selector: string) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement;
    if (el) el.click();
  }, selector);
}

// Find the VISIBLE (open) ion-modal
function visibleModal(page: Page) {
  return page.locator('ion-modal.show-modal');
}

async function fillIonInput(page: Page, label: string, value: string) {
  const modal = visibleModal(page);
  const ionInput = modal.locator(`ion-input[label="${label}"]`);
  await ionInput.click();
  await page.waitForTimeout(100);
  await page.keyboard.type(value);
}

async function fillIonTextarea(page: Page, label: string, value: string) {
  const modal = visibleModal(page);
  const ionTa = modal.locator(`ion-textarea[label="${label}"]`);
  await ionTa.click();
  await page.waitForTimeout(100);
  await page.keyboard.type(value);
}

async function createHabit(page: Page, name: string, description?: string) {
  await jsClick(page, 'ion-fab[horizontal="end"] ion-fab-button');
  await page.waitForTimeout(1000);

  await fillIonInput(page, 'Name', name);
  if (description) {
    await fillIonTextarea(page, 'Description', description);
  }

  // Click save on the visible modal
  const modal = visibleModal(page);
  await modal.locator('ion-toolbar ion-buttons[slot="end"] ion-button').click({ force: true });
  await page.waitForTimeout(800);
}

test.describe('Habit Tracker E2E', () => {
  test.beforeEach(async ({ page }) => {
    await freshStart(page);
  });

  test('Tab navigation works', async ({ page }) => {
    await expect(page.locator('app-today ion-title')).toContainText('Today');

    await goTab(page, 'habits');
    await expect(page.locator('app-habits ion-title')).toContainText('Habits');

    await goTab(page, 'reports');
    await expect(page.locator('app-reports ion-title')).toContainText('Reports');

    await goTab(page, 'settings');
    await expect(page.locator('app-settings ion-title')).toContainText('Settings');

    await goTab(page, 'today');
    await expect(page.locator('app-today ion-title')).toContainText('Today');
  });

  test('Create a habit via Habits page', async ({ page }) => {
    await goTab(page, 'habits');
    await createHabit(page, 'Test Habit', 'A test description');
    await expect(page.locator('.habit-manage-name').first()).toContainText('Test Habit');
  });

  test('Habit appears on Today page after creation', async ({ page }) => {
    await goTab(page, 'habits');
    await createHabit(page, 'Daily Pushups', 'Do 20 pushups');

    await goTab(page, 'today');
    await expect(page.locator('app-today .habit-name').first()).toContainText('Daily Pushups');
  });

  test('Complete a habit (check it off)', async ({ page }) => {
    await goTab(page, 'habits');
    await createHabit(page, 'Meditation');

    await goTab(page, 'today');
    await expect(page.locator('app-today .habit-name').first()).toContainText('Meditation');

    // Click the custom checkbox
    await jsClick(page, 'app-today .habit-checkbox');
    await page.waitForTimeout(800);

    // Mood modal — click save on the VISIBLE modal
    const modal = visibleModal(page);
    await modal.locator('ion-toolbar ion-buttons[slot="end"] ion-button').click({ force: true });
    await page.waitForTimeout(500);

    await expect(page.locator('app-today .habit-card.completed')).toBeVisible();
  });

  test('Delete a habit', async ({ page }) => {
    await goTab(page, 'habits');
    await createHabit(page, 'To Delete');
    await expect(page.locator('.habit-manage-name').first()).toContainText('To Delete');

    // Open sliding options
    await page.locator('ion-item-sliding').first().evaluate((el: any) => el.open('end'));
    await page.waitForTimeout(400);

    // Click delete option
    await page.evaluate(() => {
      const options = document.querySelectorAll('ion-item-option');
      const del = Array.from(options).find(o => (o as HTMLElement).style.cssText.includes('FF6B6B'));
      if (del) (del as HTMLElement).click();
    });
    await page.waitForTimeout(500);

    await expect(page.locator('.habit-manage-name')).toHaveCount(0);
  });

  test('Dark mode toggle on Settings', async ({ page }) => {
    await goTab(page, 'settings');

    const darkBefore = await page.evaluate(() => document.body.classList.contains('dark'));

    await page.evaluate(() => {
      const toggle = document.querySelector('app-settings ion-toggle') as any;
      if (toggle) toggle.click();
    });
    await page.waitForTimeout(300);

    const darkAfter = await page.evaluate(() => document.body.classList.contains('dark'));
    expect(darkAfter).not.toBe(darkBefore);

    await page.evaluate(() => {
      const toggle = document.querySelector('app-settings ion-toggle') as any;
      if (toggle) toggle.click();
    });
    await page.waitForTimeout(300);

    const darkFinal = await page.evaluate(() => document.body.classList.contains('dark'));
    expect(darkFinal).toBe(darkBefore);
  });

  test('Template quick-add', async ({ page }) => {
    await goTab(page, 'habits');

    // Click template FAB
    await jsClick(page, 'ion-fab[horizontal="start"] ion-fab-button');
    await page.waitForTimeout(1000);

    // Click first template item
    await jsClick(page, '.template-item');
    await page.waitForTimeout(800);

    await expect(page.locator('.habit-manage-name').first()).toContainText('Drink Water');

    await goTab(page, 'today');
    await expect(page.locator('app-today .habit-name').first()).toContainText('Drink Water');
  });
});

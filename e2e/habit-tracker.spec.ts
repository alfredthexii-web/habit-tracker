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

async function clickFab(page: Page, horizontal: string) {
  await page.evaluate((h) => {
    const fab = document.querySelector(`ion-fab[horizontal="${h}"] ion-fab-button`) as HTMLElement;
    if (fab) fab.dispatchEvent(new Event('click', { bubbles: true }));
  }, horizontal);
  await page.waitForTimeout(1000);
}

async function fillIonInput(page: Page, label: string, value: string) {
  const ionInput = page.locator(`ion-input[label="${label}"]`);
  await ionInput.waitFor({ timeout: 5000 });
  await ionInput.locator('input').fill(value);
}

async function fillIonTextarea(page: Page, label: string, value: string) {
  const ionTa = page.locator(`ion-textarea[label="${label}"]`);
  await ionTa.waitFor({ timeout: 5000 });
  await ionTa.locator('textarea').fill(value);
}

async function createHabit(page: Page, name: string, description?: string) {
  await clickFab(page, 'end');

  // Wait for modal to be visible
  await page.locator('ion-modal.show-modal').waitFor({ timeout: 5000 });

  await fillIonInput(page, 'Name', name);
  if (description) {
    await fillIonTextarea(page, 'Description', description);
  }

  // Click save button in modal
  await page.locator('ion-modal.show-modal ion-toolbar ion-buttons[slot="end"] ion-button').click();
  await page.waitForTimeout(500);
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
    await expect(page.locator('app-habits .habit-name')).toContainText('Test Habit');
  });

  test('Habit appears on Today page after creation', async ({ page }) => {
    await goTab(page, 'habits');
    await createHabit(page, 'Daily Pushups', 'Do 20 pushups');

    await goTab(page, 'today');
    await expect(page.locator('app-today .habit-name')).toContainText('Daily Pushups');
  });

  test('Complete a habit', async ({ page }) => {
    await goTab(page, 'habits');
    await createHabit(page, 'Meditation');

    await goTab(page, 'today');
    await expect(page.locator('app-today .habit-name')).toContainText('Meditation');

    // Click the card body to toggle (opens mood modal)
    await page.locator('app-today .card-body').first().click();
    await page.waitForTimeout(800);

    // Save mood modal (checkmark button)
    await page.locator('ion-modal.show-modal ion-toolbar ion-buttons[slot="end"] ion-button').click();
    await page.waitForTimeout(500);

    await expect(page.locator('app-today .habit-card.completed')).toBeVisible();
  });

  test('Delete a habit', async ({ page }) => {
    await goTab(page, 'habits');
    await createHabit(page, 'To Delete');
    await expect(page.locator('app-habits .habit-name')).toContainText('To Delete');

    // Open sliding options programmatically
    await page.locator('ion-item-sliding').first().evaluate((el: any) => el.open('end'));
    await page.waitForTimeout(400);

    // Click delete option
    await page.locator('ion-item-option').last().click();
    await page.waitForTimeout(500);

    await expect(page.locator('app-habits .habit-name')).toHaveCount(0);
  });

  test('Dark mode toggle on Settings', async ({ page }) => {
    await goTab(page, 'settings');

    const darkBefore = await page.evaluate(() => document.body.classList.contains('dark'));

    await page.locator('ion-toggle').click();
    await page.waitForTimeout(300);

    const darkAfter = await page.evaluate(() => document.body.classList.contains('dark'));
    expect(darkAfter).not.toBe(darkBefore);

    await page.locator('ion-toggle').click();
    await page.waitForTimeout(300);

    const darkFinal = await page.evaluate(() => document.body.classList.contains('dark'));
    expect(darkFinal).toBe(darkBefore);
  });
});

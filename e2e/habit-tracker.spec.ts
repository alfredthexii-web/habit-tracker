import { test, expect, Page } from '@playwright/test';

// Helper: clear localStorage and navigate fresh
async function freshStart(page: Page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
  await page.waitForSelector('ion-tab-bar', { timeout: 15000 });
}

// Helper: navigate to a tab
async function goTab(page: Page, tab: string) {
  await page.click(`ion-tab-button[tab="${tab}"]`);
  await page.waitForTimeout(600);
}

// Helper: create a habit with minimal fields (name + optional description)
async function createHabitSimple(page: Page, name: string, description?: string) {
  await goTab(page, 'habits');
  // Click the + FAB (bottom-right)
  await page.locator('ion-fab[vertical="bottom"][horizontal="end"] ion-fab-button').click();
  await page.waitForTimeout(600);
  await page.locator('ion-modal ion-input[label="Name"] input').fill(name);
  if (description) {
    await page.locator('ion-modal ion-textarea[label="Description"] textarea').fill(description);
  }
  // Click save (checkmark button, slot="end")
  await page.locator('ion-modal ion-toolbar ion-buttons[slot="end"] ion-button').click();
  await page.waitForTimeout(600);
}

// Helper: select an ionic select value via alert interface
async function ionSelectValue(page: Page, selectLocator: any, label: string) {
  await selectLocator.click();
  await page.waitForTimeout(600);
  // Ionic select opens an alert with radio buttons
  await page.locator(`ion-alert button.alert-radio-button:has-text("${label}")`).click();
  await page.waitForTimeout(300);
  await page.locator('ion-alert button:has-text("OK")').click();
  await page.waitForTimeout(400);
}

// Helper: create a habit with options
async function createHabitFull(page: Page, opts: {
  name: string;
  description?: string;
  category?: string;
  schedule?: string;
  goal?: string;
  reminderTime?: string;
  timesPerMonth?: string;
  intervalDays?: string;
}) {
  await goTab(page, 'habits');
  await page.locator('ion-fab[vertical="bottom"][horizontal="end"] ion-fab-button').click();
  await page.waitForTimeout(600);

  await page.locator('ion-modal ion-input[label="Name"] input').fill(opts.name);

  if (opts.description) {
    await page.locator('ion-modal ion-textarea[label="Description"] textarea').fill(opts.description);
  }

  if (opts.category) {
    await ionSelectValue(page, page.locator('ion-modal ion-select[label="Category"]'), opts.category);
  }

  if (opts.schedule) {
    const scheduleLabels: Record<string, string> = {
      daily: 'Daily', weekly: 'Weekly', specific_days: 'Specific Days',
      x_per_month: 'X Times per Month', interval: 'Every N Days',
    };
    await ionSelectValue(page, page.locator('ion-modal ion-select[label="Schedule"]'), scheduleLabels[opts.schedule]);
  }

  if (opts.goal) {
    await page.locator('ion-modal ion-input[label="Goal (times per week)"] input').fill(opts.goal);
  }

  if (opts.reminderTime) {
    await page.locator('ion-modal ion-input[label="Reminder Time"] input').fill(opts.reminderTime);
  }

  if (opts.timesPerMonth) {
    await page.locator('ion-modal ion-input[label="Times per month"] input').fill(opts.timesPerMonth);
  }

  if (opts.intervalDays) {
    await page.locator('ion-modal ion-input[label="Every N days"] input').fill(opts.intervalDays);
  }

  await page.locator('ion-modal ion-toolbar ion-buttons[slot="end"] ion-button').click();
  await page.waitForTimeout(600);
}

// Helper: complete a habit on Today page by clicking the custom checkbox button
async function completeHabitOnToday(page: Page, habitName: string, mood?: string, note?: string) {
  // Click the custom checkbox button inside the habit card
  await page.locator(`.habit-card:has-text("${habitName}") .habit-checkbox`).click();
  await page.waitForTimeout(600);

  // Mood modal should appear
  if (mood) {
    await page.locator(`.mood-btn:has-text("${mood}")`).click();
    await page.waitForTimeout(300);
  }
  if (note) {
    await page.locator('ion-modal ion-textarea textarea').fill(note);
  }
  // Save mood
  await page.locator('ion-modal ion-toolbar ion-buttons[slot="end"] ion-button').click();
  await page.waitForTimeout(600);
}

test.describe('Core Navigation', () => {
  test('tab navigation works for all 4 tabs', async ({ page }) => {
    await freshStart(page);
    await expect(page.locator('ion-title:has-text("Today")')).toBeVisible();
    await goTab(page, 'habits');
    await expect(page.locator('ion-title:has-text("Habits")')).toBeVisible();
    await goTab(page, 'reports');
    await expect(page.locator('ion-title:has-text("Reports")')).toBeVisible();
    await goTab(page, 'settings');
    await expect(page.locator('ion-title:has-text("Settings")')).toBeVisible();
  });

  test('empty states display correctly', async ({ page }) => {
    await freshStart(page);
    // Today page: "No habits for today"
    await expect(page.locator('.empty-state:has-text("No habits for today")')).toBeVisible();
    // Habits page: "No habits yet"
    await goTab(page, 'habits');
    await expect(page.locator('.empty-state:has-text("No habits yet")')).toBeVisible();
    // Reports page: uses tailwind classes, not .empty-state; text is "Add some habits to see reports!"
    await goTab(page, 'reports');
    await expect(page.locator('text=Add some habits to see reports')).toBeVisible();
  });
});

test.describe('Habit Management', () => {
  test('create a habit with all fields', async ({ page }) => {
    await freshStart(page);
    await createHabitFull(page, {
      name: 'Morning Run',
      description: '5km run every morning',
      category: 'Fitness',
      schedule: 'daily',
      goal: '5',
      reminderTime: '07:00',
    });
    await expect(page.locator('ion-item:has-text("Morning Run")')).toBeVisible();
    await expect(page.locator('text=5km run every morning')).toBeVisible();
    // Category badge
    await expect(page.locator('.cat-badge:has-text("Fitness")')).toBeVisible();
  });

  test('edit a habit', async ({ page }) => {
    await freshStart(page);
    await createHabitSimple(page, 'Read Books', 'Read 30 min');

    // Open sliding options
    const item = page.locator('ion-item-sliding').first();
    await item.evaluate((el: any) => el.open('end'));
    await page.waitForTimeout(400);
    // Click edit (green button)
    await page.locator('ion-item-option').first().click();
    await page.waitForTimeout(600);

    await page.locator('ion-modal ion-input[label="Name"] input').fill('Read Novels');
    await page.locator('ion-modal ion-toolbar ion-buttons[slot="end"] ion-button').click();
    await page.waitForTimeout(600);

    await expect(page.locator('text=Read Novels')).toBeVisible();
  });

  test('delete a habit', async ({ page }) => {
    await freshStart(page);
    await createHabitSimple(page, 'Delete Me');
    await expect(page.locator('ion-item:has-text("Delete Me")')).toBeVisible();

    const item = page.locator('ion-item-sliding').first();
    await item.evaluate((el: any) => el.open('end'));
    await page.waitForTimeout(400);
    // Delete is the second option (red)
    await page.locator('ion-item-option').nth(1).click();
    await page.waitForTimeout(600);

    await expect(page.locator('ion-item:has-text("Delete Me")')).not.toBeVisible();
  });

  test('quick-add from templates', async ({ page }) => {
    await freshStart(page);
    await goTab(page, 'habits');

    // Click the lightning bolt FAB (bottom-left)
    await page.locator('ion-fab[vertical="bottom"][horizontal="start"] ion-fab-button').click();
    await page.waitForTimeout(600);

    // Templates are shown in a PrimeNG dialog
    await page.locator('.template-item:has-text("Drink Water")').click();
    await page.waitForTimeout(600);

    await expect(page.locator('text=Drink Water')).toBeVisible();
  });
});

test.describe('Flexible Scheduling', () => {
  test('create daily habit', async ({ page }) => {
    await freshStart(page);
    await createHabitFull(page, { name: 'Daily Habit', schedule: 'daily' });
    await expect(page.locator('text=Daily Habit')).toBeVisible();
  });

  test('create weekly habit', async ({ page }) => {
    await freshStart(page);
    await createHabitFull(page, { name: 'Weekly Habit', schedule: 'weekly' });
    await expect(page.locator('text=Weekly Habit')).toBeVisible();
  });

  test('create interval habit (every N days)', async ({ page }) => {
    await freshStart(page);
    await createHabitFull(page, { name: 'Interval Habit', schedule: 'interval', intervalDays: '3' });
    await expect(page.locator('text=Interval Habit')).toBeVisible();
    await expect(page.locator('.habit-tag:has-text("Every 3 days")')).toBeVisible();
  });

  test('create X times per month habit', async ({ page }) => {
    await freshStart(page);
    await createHabitFull(page, { name: 'Monthly Habit', schedule: 'x_per_month', timesPerMonth: '10' });
    await expect(page.locator('text=Monthly Habit')).toBeVisible();
    await expect(page.locator('.habit-tag:has-text("10x/month")')).toBeVisible();
  });
});

test.describe('Daily Tracking', () => {
  test('check off a habit and mood selection', async ({ page }) => {
    await freshStart(page);
    await createHabitSimple(page, 'Test Tracking', 'A test habit');

    await goTab(page, 'today');
    await page.waitForTimeout(600);
    await expect(page.locator('.habit-card:has-text("Test Tracking")')).toBeVisible();

    // Complete with mood
    await completeHabitOnToday(page, 'Test Tracking', '😊', 'Felt great today!');

    // Verify completed state
    await expect(page.locator('.habit-card.completed:has-text("Test Tracking")')).toBeVisible();
    await expect(page.locator('.mood-display:has-text("😊")')).toBeVisible();
  });

  test('category filter on Today page', async ({ page }) => {
    await freshStart(page);
    await createHabitFull(page, { name: 'Fitness Habit', category: 'Fitness' });
    await createHabitFull(page, { name: 'Work Habit', category: 'Work' });

    await goTab(page, 'today');
    await page.waitForTimeout(600);

    // Both visible
    await expect(page.locator('.habit-card:has-text("Fitness Habit")')).toBeVisible();
    await expect(page.locator('.habit-card:has-text("Work Habit")')).toBeVisible();

    // Filter by Fitness — the Today page uses .filter-pill buttons with uppercase text
    await page.locator('app-today .filter-pill:has-text("FITNESS")').click();
    await page.waitForTimeout(400);
    await expect(page.locator('.habit-card:has-text("Fitness Habit")')).toBeVisible();
    await expect(page.locator('.habit-card:has-text("Work Habit")')).not.toBeVisible();

    // Reset to ALL
    await page.locator('app-today .filter-pill:has-text("ALL")').click();
    await page.waitForTimeout(400);
    await expect(page.locator('.habit-card:has-text("Work Habit")')).toBeVisible();
  });
});

test.describe('Gamification', () => {
  test('XP earned after completing habit', async ({ page }) => {
    await freshStart(page);
    await createHabitSimple(page, 'XP Test');

    await goTab(page, 'today');
    await page.waitForTimeout(600);

    // XP is shown in .xp-value
    const xpBefore = await page.locator('.xp-value').textContent();
    expect(xpBefore).toContain('0 XP');

    await completeHabitOnToday(page, 'XP Test');

    const xpAfter = await page.locator('.xp-value').textContent();
    expect(xpAfter).toContain('10 XP');
  });

  test('achievement unlocked after creating first habit', async ({ page }) => {
    await freshStart(page);
    await createHabitSimple(page, 'Achievement Test');

    await goTab(page, 'reports');
    await page.waitForTimeout(600);

    // Achievements section uses divs — look for "First Habit" text and 🌱 icon
    await expect(page.locator('text=First Habit')).toBeVisible();
    await expect(page.locator('text=🌱')).toBeVisible();
  });
});

test.describe('Reports', () => {
  test('streaks display for a habit', async ({ page }) => {
    await freshStart(page);
    await createHabitSimple(page, 'Streak Test');

    await goTab(page, 'today');
    await page.waitForTimeout(600);
    await completeHabitOnToday(page, 'Streak Test');

    await goTab(page, 'reports');
    await page.waitForTimeout(600);

    // Stats grid shows Streak and Best labels
    await expect(page.locator('text=Streak')).toBeVisible();
    await expect(page.locator('text=Best')).toBeVisible();
  });

  test('charts render on reports page', async ({ page }) => {
    await freshStart(page);
    await createHabitSimple(page, 'Chart Test');

    await goTab(page, 'reports');
    await page.waitForTimeout(1000);

    // PrimeNG chart renders p-chart
    await expect(page.locator('p-chart').first()).toBeVisible();
  });

  test('AI Insights card shows content', async ({ page }) => {
    await freshStart(page);
    await createHabitSimple(page, 'Insights Test');

    await goTab(page, 'reports');
    await page.waitForTimeout(600);

    // AI Insights uses h3 with text "AI Insights"
    await expect(page.locator('text=AI Insights')).toBeVisible();
    // At minimum there should be insight text (e.g., "most productive day")
    await expect(page.locator('app-reports p').first()).toBeVisible();
  });

  test('Share Progress button copies to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await freshStart(page);
    await createHabitSimple(page, 'Share Test');

    await goTab(page, 'reports');
    await page.waitForTimeout(600);

    page.on('dialog', dialog => dialog.accept());

    // Share button is a plain <button> with text "Share Progress"
    await page.locator('button:has-text("Share Progress")').click();
    await page.waitForTimeout(600);

    const clipText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipText).toContain('Habit Tracker Progress');
    expect(clipText).toContain('Share Test');
  });

  test('category filter on Reports page', async ({ page }) => {
    await freshStart(page);
    await createHabitFull(page, { name: 'Fitness Report', category: 'Fitness' });
    await createHabitFull(page, { name: 'Work Report', category: 'Work' });

    await goTab(page, 'reports');
    await page.waitForTimeout(600);

    await expect(page.locator('text=Fitness Report')).toBeVisible();
    await expect(page.locator('text=Work Report')).toBeVisible();

    // Filter buttons are plain buttons with uppercase text
    await page.locator('app-reports button:has-text("WORK")').click();
    await page.waitForTimeout(400);

    await expect(page.locator('h3:has-text("Work Report")')).toBeVisible();
    await expect(page.locator('h3:has-text("Fitness Report")')).not.toBeVisible();
  });

  test('mood trends chart visible after completing with mood', async ({ page }) => {
    await freshStart(page);
    await createHabitSimple(page, 'Mood Test');

    await goTab(page, 'today');
    await page.waitForTimeout(600);
    await completeHabitOnToday(page, 'Mood Test', '🔥');

    await goTab(page, 'reports');
    await page.waitForTimeout(600);

    await expect(page.locator('text=Mood Trends')).toBeVisible();
  });
});

test.describe('Settings', () => {
  test('dark mode toggle', async ({ page }) => {
    await freshStart(page);
    await goTab(page, 'settings');
    await page.waitForTimeout(600);

    const toggle = page.locator('ion-toggle');
    await expect(toggle).toBeVisible();

    // App defaults to dark mode ON
    const bodyHasDark = await page.evaluate(() => document.body.classList.contains('dark'));
    expect(bodyHasDark).toBe(true);

    // Toggle off
    await toggle.click();
    await page.waitForTimeout(400);

    const bodyHasDarkAfter = await page.evaluate(() => document.body.classList.contains('dark'));
    expect(bodyHasDarkAfter).toBe(false);
  });

  test('export data downloads JSON', async ({ page }) => {
    await freshStart(page);
    await createHabitSimple(page, 'Export Test');

    await goTab(page, 'settings');
    await page.waitForTimeout(600);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('button:has-text("Export Data")').click(),
    ]);

    expect(download.suggestedFilename()).toContain('habit-tracker-backup');
    expect(download.suggestedFilename()).toContain('.json');
  });

  test('import data from JSON', async ({ page }) => {
    await freshStart(page);
    await goTab(page, 'settings');
    await page.waitForTimeout(600);

    const importData = JSON.stringify({
      habits: [{
        id: 'imported-1',
        name: 'Imported Habit',
        description: 'From import',
        frequency: 'daily',
        category: 'Health',
        createdAt: new Date().toISOString(),
      }],
      completions: [],
      profile: { xp: 50, level: 1, achievements: [] },
      preferences: { darkMode: true },
    });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(importData),
    });
    await page.waitForTimeout(600);

    await expect(page.locator('text=Success!')).toBeVisible();

    await goTab(page, 'habits');
    await page.waitForTimeout(600);
    await expect(page.locator('text=Imported Habit')).toBeVisible();
  });

  test('profile stats display', async ({ page }) => {
    await freshStart(page);
    await goTab(page, 'settings');
    await page.waitForTimeout(600);

    // Profile section has "Your Profile" heading and Level/Total XP/Trophies labels
    await expect(page.locator('text=Your Profile')).toBeVisible();
    await expect(page.locator('text=Level')).toBeVisible();
    await expect(page.locator('text=Total XP')).toBeVisible();
    await expect(page.locator('text=Trophies')).toBeVisible();
  });
});

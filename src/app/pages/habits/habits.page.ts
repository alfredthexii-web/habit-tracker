import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
  IonLabel, IonButton, IonIcon, IonFab, IonFabButton, IonItemSliding,
  IonItemOptions, IonItemOption, IonModal, IonInput, IonTextarea,
  IonSelect, IonSelectOption, IonButtons, IonChip, IonBadge,
  IonNote, IonBackButton,
} from '@ionic/angular/standalone';
import { Dialog } from 'primeng/dialog';
import { HabitService } from '../../services/habit.service';
import {
  Habit, HabitCategory, ALL_CATEGORIES, CATEGORY_COLORS,
  HABIT_TEMPLATES, HabitTemplate, ScheduleType,
} from '../../models/habit.model';
import { addIcons } from 'ionicons';
import {
  addOutline, createOutline, trashOutline, closeOutline,
  checkmarkOutline, flashOutline, flameOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-habits',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
    IonLabel, IonButton, IonIcon, IonFab, IonFabButton, IonItemSliding,
    IonItemOptions, IonItemOption, IonModal, IonInput, IonTextarea,
    IonSelect, IonSelectOption, IonButtons, IonChip, IonBadge,
    IonNote, IonBackButton,
    Dialog,
  ],
  template: `
    <ion-header translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/habits"></ion-back-button>
        </ion-buttons>
        <ion-title>Habits</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content [fullscreen]="true" class="ion-padding">
      <!-- Category Filter -->
      <div class="filter-pills">
        <button (click)="selectedCategory.set(null)"
                class="pill"
                [class.active]="!selectedCategory()">
          All
        </button>
        @for (cat of categories; track cat) {
          <button (click)="selectedCategory.set(cat)"
                  class="pill"
                  [class.active]="selectedCategory() === cat">
            {{ cat }}
          </button>
        }
      </div>

      @if (filteredHabits().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">💪</div>
          <p class="empty-text">
            No habits yet. Tap <span style="color: #FF6B4A; font-weight: 700;">+</span> to add one!
          </p>
        </div>
      }

      <!-- Habit Cards -->
      <div class="habits-list">
        @for (habit of filteredHabits(); track habit.id; let i = $index) {
          <ion-item-sliding>
            <ion-item class="habit-item-wrapper">
              <div class="habit-manage-card" [style.animation-delay]="(i * 0.04) + 's'">
                <div class="card-accent" [style.background]="getCatColor(habit.category)"></div>
                <div class="card-content">
                  <div class="card-main">
                    <div class="card-info">
                      <h3 class="habit-name habit-manage-name">{{ habit.name }}</h3>
                      @if (habit.description) {
                        <p class="habit-desc">{{ habit.description }}</p>
                      }
                    </div>
                    <span class="cat-badge" [style.color]="getCatColor(habit.category)">
                      {{ habit.category }}
                    </span>
                  </div>
                  <div class="card-tags">
                    <span class="tag">📅 {{ getScheduleLabel(habit) }}</span>
                    @if (habit.goal) {
                      <span class="tag">🎯 {{ habit.goal }}x/week</span>
                    }
                    @if (habit.reminderTime) {
                      <span class="tag">⏰ {{ habit.reminderTime }}</span>
                    }
                  </div>
                </div>
              </div>
            </ion-item>
            <ion-item-options side="end">
              <ion-item-option style="--background: #4ADE80; --color: #111116;" (click)="editHabit(habit)">
                <ion-icon slot="icon-only" name="create-outline"></ion-icon>
              </ion-item-option>
              <ion-item-option style="--background: #FF6B6B;" (click)="deleteHabit(habit.id)">
                <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        }
      </div>

      <!-- FABs with proper bottom offset above tab bar -->
      <div style="height: 60px;"></div>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed" style="margin-bottom: 60px;">
        <ion-fab-button (click)="openModal()">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <ion-fab vertical="bottom" horizontal="start" slot="fixed" style="margin-bottom: 60px;">
        <ion-fab-button color="secondary" (click)="showTemplates.set(true)">
          <ion-icon name="flash-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- Templates Dialog -->
      <p-dialog header="Quick Add Templates" [(visible)]="templateDialogVisible" [modal]="true"
        [style]="{ width: '90vw', maxWidth: '400px' }" [draggable]="false" [resizable]="false">
        <div class="template-list">
          @for (t of templates; track t.name) {
            <button class="template-item" (click)="addFromTemplate(t)">
              <div class="template-accent" [style.background]="getCatColor(t.category)"></div>
              <div class="template-info">
                <div class="template-name">{{ t.name }}</div>
                <div class="template-desc">{{ t.description }}</div>
              </div>
            </button>
          }
        </div>
      </p-dialog>

      <!-- Habit Form Modal -->
      <ion-modal [isOpen]="showModal()" (didDismiss)="closeModal()">
        <ng-template>
          <ion-header translucent="true">
            <ion-toolbar>
              <ion-buttons slot="start">
                <ion-button (click)="closeModal()">
                  <ion-icon name="close-outline"></ion-icon>
                </ion-button>
              </ion-buttons>
              <ion-title>{{ editingHabit() ? 'Edit' : 'New' }} Habit</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="saveHabit()" [strong]="true">
                  <ion-icon name="checkmark-outline"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <ion-item>
              <ion-input label="Name" labelPlacement="stacked" placeholder="e.g. Exercise" [(ngModel)]="formName"></ion-input>
            </ion-item>
            <ion-item>
              <ion-textarea label="Description" labelPlacement="stacked" placeholder="e.g. 30 min workout" [(ngModel)]="formDescription"></ion-textarea>
            </ion-item>
            <ion-item>
              <ion-select label="Category" labelPlacement="stacked" [(ngModel)]="formCategory">
                @for (cat of categories; track cat) {
                  <ion-select-option [value]="cat">{{ cat }}</ion-select-option>
                }
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-select label="Schedule" labelPlacement="stacked" [(ngModel)]="formScheduleType">
                <ion-select-option value="daily">Daily</ion-select-option>
                <ion-select-option value="weekly">Weekly</ion-select-option>
                <ion-select-option value="specific_days">Specific Days</ion-select-option>
                <ion-select-option value="x_per_month">X Times per Month</ion-select-option>
                <ion-select-option value="interval">Every N Days</ion-select-option>
              </ion-select>
            </ion-item>
            @if (formScheduleType === 'specific_days') {
              <ion-item>
                <ion-select label="Days" labelPlacement="stacked" [(ngModel)]="formDaysOfWeek" [multiple]="true">
                  <ion-select-option [value]="0">Sunday</ion-select-option>
                  <ion-select-option [value]="1">Monday</ion-select-option>
                  <ion-select-option [value]="2">Tuesday</ion-select-option>
                  <ion-select-option [value]="3">Wednesday</ion-select-option>
                  <ion-select-option [value]="4">Thursday</ion-select-option>
                  <ion-select-option [value]="5">Friday</ion-select-option>
                  <ion-select-option [value]="6">Saturday</ion-select-option>
                </ion-select>
              </ion-item>
            }
            @if (formScheduleType === 'x_per_month') {
              <ion-item>
                <ion-input label="Times per month" labelPlacement="stacked" type="number" [(ngModel)]="formTimesPerMonth"></ion-input>
              </ion-item>
            }
            @if (formScheduleType === 'interval') {
              <ion-item>
                <ion-input label="Every N days" labelPlacement="stacked" type="number" [(ngModel)]="formIntervalDays"></ion-input>
              </ion-item>
            }
            <ion-item>
              <ion-input label="Goal (times per week)" labelPlacement="stacked" type="number" placeholder="Optional" [(ngModel)]="formGoal"></ion-input>
            </ion-item>
            <ion-item>
              <ion-input label="Reminder Time" labelPlacement="stacked" type="time" [(ngModel)]="formReminderTime"></ion-input>
            </ion-item>
            @if (formReminderTime) {
              <p class="reminder-note">
                ⏰ You'll get a notification at {{ formReminderTime }} if this habit isn't done.
              </p>
            }
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: [`
    :host { display: block; }

    .filter-pills {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      animation: slide-up 0.4s ease-out;
    }
    .filter-pills::-webkit-scrollbar { display: none; }
    .pill {
      padding: 8px 16px;
      border-radius: 100px;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      white-space: nowrap;
      background: var(--card-bg);
      color: var(--text-muted);
      border: 1px solid var(--card-border);
      transition: all 0.2s ease-out;
      cursor: pointer;
    }
    .pill.active {
      background: #FF6B4A;
      color: #ffffff;
      border-color: #FF6B4A;
    }

    .empty-state {
      text-align: center;
      padding: 48px 16px;
      animation: fade-in 0.4s ease-out;
    }
    .empty-icon { font-size: 3rem; margin-bottom: 12px; }
    .empty-text {
      font-size: 0.95rem;
      color: var(--text-muted);
    }

    .habits-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .habit-item-wrapper {
      --background: transparent;
      --padding-start: 0;
      --inner-padding-end: 0;
      --min-height: auto;
    }

    .habit-manage-card {
      width: 100%;
      display: flex;
      border-radius: 14px;
      background: var(--card-bg);
      overflow: hidden;
      animation: slide-up 0.4s ease-out both;
    }
    .card-accent {
      width: 4px;
      flex-shrink: 0;
    }
    .card-content {
      flex: 1;
      padding: 14px 16px;
    }
    .card-main {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .card-info {
      flex: 1;
      min-width: 0;
    }
    .habit-name {
      font-family: 'Sora', sans-serif;
      font-size: 0.95rem;
      font-weight: 600;
      margin: 0;
    }
    .habit-desc {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin: 2px 0 0;
    }
    .cat-badge {
      font-family: 'DM Sans', sans-serif;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      flex-shrink: 0;
    }
    .card-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 10px;
    }
    .tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 500;
      background: rgba(255, 107, 74, 0.06);
      color: var(--text-secondary);
    }

    .template-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .template-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px;
      border-radius: 12px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      text-align: left;
      transition: all 0.2s ease-out;
      cursor: pointer;
    }
    .template-item:active {
      transform: scale(0.98);
    }
    .template-accent {
      width: 4px;
      height: 32px;
      border-radius: 2px;
      flex-shrink: 0;
    }
    .template-info { min-width: 0; }
    .template-name {
      font-family: 'Sora', sans-serif;
      font-weight: 600;
      font-size: 0.9rem;
    }
    .template-desc {
      font-size: 0.78rem;
      color: var(--text-muted);
    }

    .reminder-note {
      font-size: 0.82rem;
      color: #FF6B4A;
      padding: 0 16px;
      margin-top: 8px;
    }
  `],
})
export class HabitsPage {
  categories = ALL_CATEGORIES;
  templates = HABIT_TEMPLATES;
  selectedCategory = signal<HabitCategory | null>(null);
  showModal = signal(false);
  showTemplates = signal(false);
  editingHabit = signal<Habit | null>(null);

  templateDialogVisible = false;

  filteredHabits = computed(() => {
    const cat = this.selectedCategory();
    const habits = this.habitService.habits();
    return cat ? habits.filter(h => h.category === cat) : habits;
  });

  formName = '';
  formDescription = '';
  formFrequency: 'daily' | 'weekly' = 'daily';
  formCategory: HabitCategory = 'Personal';
  formScheduleType: ScheduleType = 'daily';
  formDaysOfWeek: number[] = [];
  formTimesPerMonth: number | null = null;
  formIntervalDays: number | null = null;
  formGoal: number | null = null;
  formReminderTime = '';

  constructor(private habitService: HabitService) {
    addIcons({ addOutline, createOutline, trashOutline, closeOutline, checkmarkOutline, flashOutline, flameOutline });
    this.showTemplates.set(false);
  }

  getCatColor(cat: HabitCategory): string { return CATEGORY_COLORS[cat]; }

  getScheduleLabel(habit: Habit): string {
    if (!habit.schedule) return habit.frequency === 'daily' ? 'Daily' : 'Weekly';
    switch (habit.schedule.type) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'specific_days': {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (habit.schedule.daysOfWeek || []).map(d => days[d]).join(', ');
      }
      case 'x_per_month': return `${habit.schedule.timesPerMonth}x/month`;
      case 'interval': return `Every ${habit.schedule.intervalDays} days`;
      default: return 'Daily';
    }
  }

  openModal(): void {
    this.editingHabit.set(null);
    this.formName = '';
    this.formDescription = '';
    this.formCategory = 'Personal';
    this.formScheduleType = 'daily';
    this.formDaysOfWeek = [];
    this.formTimesPerMonth = null;
    this.formIntervalDays = null;
    this.formGoal = null;
    this.formReminderTime = '';
    this.showModal.set(true);
  }

  editHabit(habit: Habit): void {
    this.editingHabit.set(habit);
    this.formName = habit.name;
    this.formDescription = habit.description;
    this.formCategory = habit.category;
    this.formScheduleType = habit.schedule?.type || habit.frequency;
    this.formDaysOfWeek = habit.schedule?.daysOfWeek || [];
    this.formTimesPerMonth = habit.schedule?.timesPerMonth || null;
    this.formIntervalDays = habit.schedule?.intervalDays || null;
    this.formGoal = habit.goal ?? null;
    this.formReminderTime = habit.reminderTime || '';
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  saveHabit(): void {
    if (!this.formName.trim()) return;
    const freq = (this.formScheduleType === 'daily' || this.formScheduleType === 'weekly')
      ? this.formScheduleType : 'daily';

    const schedule = {
      type: this.formScheduleType,
      daysOfWeek: this.formScheduleType === 'specific_days' ? this.formDaysOfWeek : undefined,
      timesPerMonth: this.formScheduleType === 'x_per_month' ? (this.formTimesPerMonth || 1) : undefined,
      intervalDays: this.formScheduleType === 'interval' ? (this.formIntervalDays || 2) : undefined,
    };

    const editing = this.editingHabit();
    if (editing) {
      this.habitService.updateHabit(editing.id, {
        name: this.formName,
        description: this.formDescription,
        frequency: freq,
        category: this.formCategory,
        schedule,
        goal: this.formGoal || undefined,
        reminderTime: this.formReminderTime || undefined,
      });
    } else {
      this.habitService.addHabit({
        name: this.formName,
        description: this.formDescription,
        frequency: freq,
        category: this.formCategory,
        schedule,
        goal: this.formGoal || undefined,
        reminderTime: this.formReminderTime || undefined,
      });
    }
    this.closeModal();
  }

  deleteHabit(id: string): void {
    this.habitService.deleteHabit(id);
  }

  addFromTemplate(t: HabitTemplate): void {
    this.habitService.addHabit({
      name: t.name,
      description: t.description,
      frequency: t.frequency,
      category: t.category,
      goal: t.goal,
    });
    this.templateDialogVisible = false;
    this.showTemplates.set(false);
  }

  ngDoCheck(): void {
    if (this.showTemplates()) {
      this.templateDialogVisible = true;
      this.showTemplates.set(false);
    }
  }
}

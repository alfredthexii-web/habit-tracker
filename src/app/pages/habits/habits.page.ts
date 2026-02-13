import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
  IonLabel, IonButton, IonIcon, IonFab, IonFabButton, IonItemSliding,
  IonItemOptions, IonItemOption, IonModal, IonInput, IonTextarea,
  IonSelect, IonSelectOption, IonButtons, IonChip, IonBadge,
  IonNote,
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
    IonNote,
    Dialog,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Habits</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <!-- Category Filter -->
      <div class="filter-pills">
        <button (click)="selectedCategory.set(null)"
                class="filter-pill"
                [class.active]="!selectedCategory()">
          ALL
        </button>
        @for (cat of categories; track cat) {
          <button (click)="selectedCategory.set(cat)"
                  class="filter-pill"
                  [class.active]="selectedCategory() === cat"
                  [style]="selectedCategory() === cat
                    ? 'background:' + getCatColor(cat) + '; color: #0B0F1A; box-shadow: 0 0 16px ' + getCatColor(cat) + '44;'
                    : 'color:' + getCatColor(cat)">
            {{ cat | uppercase }}
          </button>
        }
      </div>

      @if (filteredHabits().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">💪</div>
          <p class="empty-text">
            No habits yet. Tap <span style="color: #F6A623; font-weight: 700;">+</span> to start building your routine!
          </p>
        </div>
      }

      <!-- Habit Cards -->
      <div class="habits-grid">
        @for (habit of filteredHabits(); track habit.id; let i = $index) {
          <ion-item-sliding>
            <ion-item class="!--background-transparent">
              <div class="habit-manage-card" [style.animation-delay]="(i * 0.06) + 's'">
                <div class="habit-manage-header">
                  <div class="cat-dot-lg" [style.background]="getCatColor(habit.category)"
                       [style.box-shadow]="'0 0 12px ' + getCatColor(habit.category) + '55'"></div>
                  <div class="habit-manage-info">
                    <h3 class="habit-manage-name">{{ habit.name }}</h3>
                    <p class="habit-manage-desc">{{ habit.description }}</p>
                  </div>
                  <span class="cat-badge"
                        [style.background]="getCatColor(habit.category) + '18'"
                        [style.color]="getCatColor(habit.category)">
                    {{ habit.category }}
                  </span>
                </div>
                <div class="habit-manage-tags">
                  <span class="habit-tag">
                    📅 {{ getScheduleLabel(habit) }}
                  </span>
                  @if (habit.goal) {
                    <span class="habit-tag goal">
                      🎯 {{ habit.goal }}x/week
                    </span>
                  }
                  @if (habit.reminderTime) {
                    <span class="habit-tag reminder">
                      ⏰ {{ habit.reminderTime }}
                    </span>
                  }
                </div>
              </div>
            </ion-item>
            <ion-item-options side="end">
              <ion-item-option style="--background: #2DD4A8;" (click)="editHabit(habit)">
                <ion-icon slot="icon-only" name="create-outline"></ion-icon>
              </ion-item-option>
              <ion-item-option style="--background: #FF6B6B;" (click)="deleteHabit(habit.id)">
                <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        }
      </div>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button (click)="openModal()">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <ion-fab vertical="bottom" horizontal="start" slot="fixed">
        <ion-fab-button color="secondary" (click)="showTemplates.set(true)">
          <ion-icon name="flash-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>

      <!-- Templates Dialog -->
      <p-dialog header="⚡ Quick Add Templates" [(visible)]="templateDialogVisible" [modal]="true"
        [style]="{ width: '90vw', maxWidth: '400px' }" [draggable]="false" [resizable]="false">
        <div class="template-list">
          @for (t of templates; track t.name) {
            <button class="template-item" (click)="addFromTemplate(t)">
              <span class="cat-dot-sm" [style.background]="getCatColor(t.category)"></span>
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
          <ion-header>
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
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 24px;
      animation: slide-up 0.5s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .filter-pill {
      padding: 6px 16px;
      border-radius: 100px;
      font-family: 'Outfit', sans-serif;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      background: rgba(27, 37, 64, 0.5);
      color: #5A6B8A;
      border: 1px solid rgba(46, 58, 88, 0.3);
      transition: all 0.25s ease;
      cursor: pointer;
    }
    :host-context(body:not(.dark)) .filter-pill {
      background: rgba(0, 0, 0, 0.04);
      border-color: rgba(0, 0, 0, 0.06);
      color: #6B7A94;
    }
    .filter-pill.active {
      background: #F6A623;
      color: #0B0F1A;
      border-color: transparent;
      box-shadow: 0 0 16px rgba(246, 166, 35, 0.35);
    }

    .empty-state {
      text-align: center;
      padding: 64px 16px;
      animation: fade-in 0.4s ease-out;
    }
    .empty-icon {
      font-size: 3.5rem;
      margin-bottom: 16px;
      animation: float 3s ease-in-out infinite;
    }
    .empty-text {
      font-family: 'Outfit', sans-serif;
      font-size: 0.9rem;
      color: #5A6B8A;
    }

    .habits-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .habit-manage-card {
      width: 100%;
      border-radius: 20px;
      padding: 18px;
      background: rgba(21, 29, 48, 0.5);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(46, 58, 88, 0.25);
      transition: all 0.3s ease;
      animation: slide-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    :host-context(body:not(.dark)) .habit-manage-card {
      background: rgba(255, 255, 255, 0.6);
      border-color: rgba(0, 0, 0, 0.05);
    }

    .habit-manage-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .cat-dot-lg {
      width: 12px; height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 6px;
    }

    .habit-manage-info {
      flex: 1;
      min-width: 0;
    }
    .habit-manage-name {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      margin-bottom: 2px;
    }
    .habit-manage-desc {
      font-family: 'Outfit', sans-serif;
      font-size: 0.78rem;
      color: #5A6B8A;
      margin-bottom: 0;
    }

    .cat-badge {
      padding: 4px 12px;
      border-radius: 100px;
      font-family: 'Outfit', sans-serif;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    .habit-manage-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 12px;
      padding-left: 24px;
    }
    .habit-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 8px;
      font-family: 'Outfit', sans-serif;
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      background: rgba(27, 37, 64, 0.5);
      color: #5A6B8A;
    }
    :host-context(body:not(.dark)) .habit-tag {
      background: rgba(0, 0, 0, 0.04);
    }
    .habit-tag.goal {
      background: rgba(246, 166, 35, 0.1);
      color: #F6A623;
    }
    .habit-tag.reminder {
      background: rgba(255, 107, 107, 0.1);
      color: #FF6B6B;
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
      padding: 16px;
      border-radius: 16px;
      background: rgba(27, 37, 64, 0.5);
      border: 1px solid rgba(46, 58, 88, 0.25);
      text-align: left;
      transition: all 0.2s ease;
      cursor: pointer;
    }
    .template-item:active {
      transform: scale(0.98);
    }
    .cat-dot-sm {
      width: 10px; height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .template-info { min-width: 0; }
    .template-name {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-weight: 700;
      font-size: 0.9rem;
    }
    .template-desc {
      font-family: 'Outfit', sans-serif;
      font-size: 0.75rem;
      color: #5A6B8A;
    }

    .reminder-note {
      font-family: 'Outfit', sans-serif;
      font-size: 0.78rem;
      color: #FF6B6B;
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

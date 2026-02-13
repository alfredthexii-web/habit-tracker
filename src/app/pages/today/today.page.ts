import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
  IonLabel, IonCheckbox, IonBadge, IonNote, IonIcon, IonChip,
  IonModal, IonButton, IonButtons, IonTextarea,
} from '@ionic/angular/standalone';
import { HabitService } from '../../services/habit.service';
import { HabitCategory, ALL_CATEGORIES, CATEGORY_COLORS, MOOD_EMOJIS, MoodEmoji } from '../../models/habit.model';
import { addIcons } from 'ionicons';
import { flameOutline, trophyOutline, closeOutline, checkmarkOutline } from 'ionicons/icons';

@Component({
  selector: 'app-today',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonCheckbox, IonBadge, IonNote, IonIcon,
    IonChip, IonModal, IonButton, IonButtons,
    IonTextarea,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Today</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <!-- Hero Section — glassmorphism card -->
      <div class="hero-card">
        <div class="hero-mesh"></div>
        <div class="hero-content">
          <p class="hero-greeting">{{ greeting }}</p>
          <h1 class="hero-title">
            <span class="gradient-text-warm">Day {{ dayOfJourney }}</span> of your journey
          </h1>
          <p class="hero-date">{{ todayFormatted }}</p>

          @if (completionPct() === 100 && totalCount() > 0) {
            <div class="perfect-day-badge">
              ⭐ PERFECT DAY — You're unstoppable!
            </div>
          }
        </div>

        <!-- Completion Ring -->
        <div class="completion-ring">
          <svg viewBox="0 0 100 100">
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#F6A623"/>
                <stop offset="100%" stop-color="#FF6B6B"/>
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(46,58,88,0.3)" stroke-width="5"/>
            <circle cx="50" cy="50" r="42" fill="none"
                    stroke="url(#ringGrad)"
                    stroke-width="5" stroke-linecap="round"
                    [attr.stroke-dasharray]="264"
                    [attr.stroke-dashoffset]="264 - (264 * completionPct() / 100)"
                    class="ring-progress"/>
          </svg>
          <div class="ring-label">
            <span class="ring-pct">{{ completionPct() }}%</span>
          </div>
        </div>
      </div>

      <!-- XP Bar — game-like -->
      <div class="xp-section">
        <div class="xp-badge">
          <span class="xp-level">{{ profile().level }}</span>
          <div class="xp-badge-shine"></div>
        </div>
        <div class="xp-bar-container">
          <div class="xp-info">
            <span class="xp-label">Level {{ profile().level }}</span>
            <span class="xp-value">{{ profile().xp }} XP</span>
          </div>
          <div class="xp-track">
            <div class="xp-fill" [style.width.%]="xpProgress()"></div>
            <div class="xp-shimmer"></div>
          </div>
        </div>
      </div>

      <!-- Category Filter Pills -->
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
          <div class="empty-icon">🌅</div>
          <p class="empty-text">
            No habits for today. Hit the Habits tab to start your journey!
          </p>
        </div>
      }

      <!-- Habit Cards -->
      <div class="habit-list">
        @for (habit of filteredHabits(); track habit.id; let i = $index) {
          <div class="habit-card"
               [class.completed]="isCompleted(habit.id)"
               [style.animation-delay]="(i * 0.06) + 's'">

            @if (isCompleted(habit.id)) {
              <div class="completed-accent" [style.background]="getCatColor(habit.category)"></div>
            }

            <div class="habit-row">
              <!-- Custom Checkbox -->
              <button (click)="onToggle(habit.id)"
                      class="habit-checkbox"
                      [class.checked]="isCompleted(habit.id)"
                      [style]="isCompleted(habit.id)
                        ? 'background: linear-gradient(135deg, ' + getCatColor(habit.category) + ', ' + getCatColor(habit.category) + 'cc); box-shadow: 0 0 20px ' + getCatColor(habit.category) + '44;'
                        : ''">
                @if (isCompleted(habit.id)) {
                  <svg class="check-icon" fill="none" stroke="#0B0F1A" stroke-width="3" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                }
              </button>

              <!-- Habit Info -->
              <div class="habit-info">
                <div class="habit-name-row">
                  <span class="cat-dot" [style.background]="getCatColor(habit.category)"
                        [style.box-shadow]="'0 0 8px ' + getCatColor(habit.category) + '55'"></span>
                  <h3 class="habit-name" [class.done]="isCompleted(habit.id)">
                    {{ habit.name }}
                  </h3>
                </div>
                <p class="habit-desc">{{ habit.description }}</p>
                @if (getCompletion(habit.id)?.mood) {
                  <span class="mood-display">{{ getCompletion(habit.id)?.mood }}</span>
                }
              </div>

              <!-- Streak Badge -->
              @if (getStreak(habit.id) > 0) {
                <div class="streak-badge">
                  <span class="streak-flame">🔥</span>
                  <span class="streak-count">{{ getStreak(habit.id) }}</span>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Mood/Note Modal -->
      <ion-modal [isOpen]="showMoodModal()" (didDismiss)="showMoodModal.set(false)">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-buttons slot="start">
                <ion-button (click)="showMoodModal.set(false)">
                  <ion-icon name="close-outline"></ion-icon>
                </ion-button>
              </ion-buttons>
              <ion-title>How are you feeling?</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="saveMood()">
                  <ion-icon name="checkmark-outline"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <div class="mood-picker">
              @for (emoji of moodEmojis; track emoji) {
                <button class="mood-btn"
                        [class.selected]="selectedMood === emoji"
                        (click)="selectedMood = emoji">
                  {{ emoji }}
                </button>
              }
            </div>
            <ion-item>
              <ion-textarea
                label="Note (optional)"
                labelPlacement="stacked"
                placeholder="How did it go?"
                [(ngModel)]="completionNote"
                [rows]="3"
              ></ion-textarea>
            </ion-item>
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: [`
    :host { display: block; }

    /* Hero Card */
    .hero-card {
      position: relative;
      overflow: hidden;
      border-radius: 24px;
      margin-bottom: 24px;
      padding: 28px;
      background: rgba(21, 29, 48, 0.6);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(246, 166, 35, 0.1);
      animation: slide-up 0.5s cubic-bezier(0.22, 1, 0.36, 1);
    }
    :host-context(body:not(.dark)) .hero-card {
      background: rgba(255, 255, 255, 0.6);
      border-color: rgba(0, 0, 0, 0.06);
    }
    .hero-mesh {
      position: absolute;
      top: -50%; right: -30%;
      width: 300px; height: 300px;
      background: radial-gradient(circle, rgba(246, 166, 35, 0.12) 0%, transparent 70%);
      pointer-events: none;
    }
    .hero-content { position: relative; z-index: 1; }
    .hero-greeting {
      font-family: 'Outfit', sans-serif;
      font-size: 0.85rem;
      font-weight: 500;
      color: #8694AD;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 4px;
    }
    :host-context(body:not(.dark)) .hero-greeting { color: #6B7A94; }
    .hero-title {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-size: 1.75rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      margin-bottom: 4px;
      line-height: 1.2;
    }
    .hero-date {
      font-family: 'Outfit', sans-serif;
      font-size: 0.85rem;
      color: #5A6B8A;
    }
    .perfect-day-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 8px 20px;
      border-radius: 100px;
      font-family: 'Bricolage Grotesque', sans-serif;
      font-size: 0.85rem;
      font-weight: 700;
      background: linear-gradient(135deg, rgba(246, 166, 35, 0.2), rgba(255, 107, 107, 0.2));
      border: 1px solid rgba(246, 166, 35, 0.3);
      animation: celebrate 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    /* Completion Ring */
    .completion-ring {
      position: absolute;
      top: 20px; right: 20px;
      width: 80px; height: 80px;
    }
    .completion-ring svg {
      width: 100%; height: 100%;
      transform: rotate(-90deg);
    }
    .ring-progress {
      transition: stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .ring-label {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ring-pct {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-size: 1.1rem;
      font-weight: 800;
      background: linear-gradient(135deg, #F6A623, #FF6B6B);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* XP Section */
    .xp-section {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 24px;
      padding: 0 4px;
      animation: slide-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
    }
    .xp-badge {
      position: relative;
      width: 48px; height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #F6A623, #FFD93D);
      box-shadow: 0 0 20px rgba(246, 166, 35, 0.35);
      overflow: hidden;
    }
    .xp-badge-shine {
      position: absolute;
      inset: 0;
      background: linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.3) 50%, transparent 60%);
      background-size: 200% 100%;
      animation: badge-shine 3s ease-in-out infinite;
    }
    .xp-level {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-weight: 800;
      font-size: 1.1rem;
      color: #0B0F1A;
      position: relative;
      z-index: 1;
    }
    .xp-bar-container { flex: 1; }
    .xp-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .xp-label {
      font-family: 'Outfit', sans-serif;
      font-size: 0.78rem;
      font-weight: 600;
      color: #8694AD;
    }
    .xp-value {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-size: 0.78rem;
      font-weight: 700;
      background: linear-gradient(90deg, #F6A623, #FF6B6B);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .xp-track {
      height: 10px;
      border-radius: 8px;
      background: rgba(27, 37, 64, 0.6);
      overflow: hidden;
      position: relative;
    }
    :host-context(body:not(.dark)) .xp-track { background: #E0DCD4; }
    .xp-fill {
      height: 100%;
      border-radius: 8px;
      background: linear-gradient(90deg, #F6A623, #FFD93D, #FF6B6B);
      transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
    }
    .xp-shimmer {
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
      background-size: 200% 100%;
      animation: shimmer 2s linear infinite;
    }

    /* Filter Pills */
    .filter-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 24px;
      animation: slide-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both;
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

    /* Empty State */
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

    /* Habit List */
    .habit-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* Habit Card */
    .habit-card {
      position: relative;
      border-radius: 20px;
      padding: 18px;
      background: rgba(21, 29, 48, 0.5);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(46, 58, 88, 0.25);
      transition: all 0.3s ease;
      animation: slide-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    :host-context(body:not(.dark)) .habit-card {
      background: rgba(255, 255, 255, 0.6);
      border-color: rgba(0, 0, 0, 0.05);
    }
    .habit-card.completed {
      opacity: 0.65;
    }
    .habit-card:active {
      transform: scale(0.99);
    }

    .completed-accent {
      position: absolute;
      left: 0; top: 12px; bottom: 12px;
      width: 3px;
      border-radius: 3px;
    }

    .habit-row {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    /* Custom Checkbox */
    .habit-checkbox {
      flex-shrink: 0;
      width: 46px; height: 46px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(27, 37, 64, 0.6);
      border: 2px solid rgba(90, 107, 138, 0.3);
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      cursor: pointer;
    }
    :host-context(body:not(.dark)) .habit-checkbox {
      background: rgba(0, 0, 0, 0.04);
      border-color: rgba(0, 0, 0, 0.12);
    }
    .habit-checkbox.checked {
      border-color: transparent;
      animation: completion-burst 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .check-icon {
      width: 22px; height: 22px;
    }

    /* Habit Info */
    .habit-info {
      flex: 1;
      min-width: 0;
    }
    .habit-name-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 2px;
    }
    .cat-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .habit-name {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: all 0.3s ease;
    }
    .habit-name.done {
      text-decoration: line-through;
      color: #5A6B8A;
    }
    .habit-desc {
      font-family: 'Outfit', sans-serif;
      font-size: 0.78rem;
      color: #5A6B8A;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .mood-display {
      font-size: 1.2rem;
      margin-top: 4px;
      display: inline-block;
    }

    /* Streak Badge */
    .streak-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 14px;
      border-radius: 100px;
      font-family: 'Outfit', sans-serif;
      font-size: 0.78rem;
      font-weight: 700;
      background: rgba(255, 107, 107, 0.12);
      color: #FF6B6B;
      flex-shrink: 0;
    }
    .streak-flame {
      display: inline-block;
      animation: flame-dance 1.2s ease-in-out infinite;
    }
    .streak-count {
      animation: streak-glow 2.5s ease-in-out infinite;
    }

    /* Mood Picker */
    .mood-picker {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin: 32px 0;
    }
    .mood-btn {
      font-size: 2.5rem;
      padding: 12px;
      border-radius: 20px;
      background: rgba(27, 37, 64, 0.5);
      border: 2px solid transparent;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      cursor: pointer;
    }
    .mood-btn.selected {
      background: rgba(246, 166, 35, 0.15);
      border-color: #F6A623;
      box-shadow: 0 0 24px rgba(246, 166, 35, 0.3);
      transform: scale(1.1);
    }
    :host-context(body:not(.dark)) .mood-btn {
      background: rgba(0, 0, 0, 0.03);
    }
    :host-context(body:not(.dark)) .mood-btn.selected {
      background: rgba(212, 137, 26, 0.12);
      border-color: #D4891A;
    }
  `],
})
export class TodayPage {
  today = new Date();
  todayStr: string;
  todayFormatted: string;
  greeting: string;
  dayOfJourney: number;
  categories = ALL_CATEGORIES;
  moodEmojis = MOOD_EMOJIS;
  selectedCategory = signal<HabitCategory | null>(null);
  showMoodModal = signal(false);
  selectedMood: MoodEmoji | undefined;
  completionNote = '';
  private pendingHabitId = '';

  profile = computed(() => this.habitService.profile());
  xpProgress = computed(() => (this.profile().xp % 100));

  dueHabits = computed(() => this.habitService.getHabitsForDate(this.today));
  filteredHabits = computed(() => {
    const cat = this.selectedCategory();
    const habits = this.dueHabits();
    return cat ? habits.filter(h => h.category === cat) : habits;
  });
  completedCount = computed(() =>
    this.dueHabits().filter(h => this.habitService.isCompleted(h.id, this.todayStr)).length
  );
  totalCount = computed(() => this.dueHabits().length);
  completionPct = computed(() => {
    const total = this.totalCount();
    return total === 0 ? 0 : Math.round((this.completedCount() / total) * 100);
  });

  constructor(private habitService: HabitService) {
    addIcons({ flameOutline, trophyOutline, closeOutline, checkmarkOutline });
    this.todayStr = habitService.getDateStr();
    this.todayFormatted = this.today.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    });
    habitService.requestNotificationPermission();

    const hour = this.today.getHours();
    if (hour < 6) this.greeting = 'Burning the midnight oil, warrior 🌙';
    else if (hour < 12) this.greeting = 'Good morning, champion ☀️';
    else if (hour < 17) this.greeting = 'Stay locked in 💪';
    else if (hour < 21) this.greeting = 'Keep pushing tonight 🔥';
    else this.greeting = 'Finish strong tonight 🌙';

    const habits = habitService.habits();
    if (habits.length > 0) {
      const earliest = habits.reduce((min, h) => h.createdAt < min ? h.createdAt : min, habits[0].createdAt);
      this.dayOfJourney = Math.max(1, Math.floor((Date.now() - new Date(earliest).getTime()) / 86400000) + 1);
    } else {
      this.dayOfJourney = 1;
    }
  }

  getCatColor(cat: HabitCategory): string { return CATEGORY_COLORS[cat]; }

  isCompleted(habitId: string): boolean {
    return this.habitService.isCompleted(habitId, this.todayStr);
  }

  getCompletion(habitId: string) {
    return this.habitService.getCompletion(habitId, this.todayStr);
  }

  onToggle(habitId: string): void {
    if (this.isCompleted(habitId)) {
      this.habitService.toggleCompletion(habitId, this.todayStr);
    } else {
      this.pendingHabitId = habitId;
      this.selectedMood = undefined;
      this.completionNote = '';
      this.showMoodModal.set(true);
    }
  }

  saveMood(): void {
    this.habitService.toggleCompletion(this.pendingHabitId, this.todayStr, this.completionNote || undefined, this.selectedMood);
    this.showMoodModal.set(false);
  }

  getStreak(habitId: string): number {
    return this.habitService.getStats(habitId).currentStreak;
  }
}

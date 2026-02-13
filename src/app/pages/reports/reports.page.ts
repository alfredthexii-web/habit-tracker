import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonIcon, IonButton, IonChip, IonBackButton, IonButtons,
} from '@ionic/angular/standalone';
import { UIChart } from 'primeng/chart';
import { ProgressBar } from 'primeng/progressbar';
import { HabitService } from '../../services/habit.service';
import { CATEGORY_COLORS, HabitCategory, ALL_CATEGORIES } from '../../models/habit.model';
import { addIcons } from 'ionicons';
import { flameOutline, trophyOutline, statsChartOutline, shareSocialOutline, bulbOutline } from 'ionicons/icons';
import { signal } from '@angular/core';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonIcon, IonButton, IonChip, IonBackButton, IonButtons,
    UIChart, ProgressBar,
  ],
  template: `
    <ion-header translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/reports"></ion-back-button>
        </ion-buttons>
        <ion-title>Reports</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content [fullscreen]="true" class="ion-padding">

      <!-- AI Insights -->
      @if (insights().length > 0) {
        <div class="insights-card">
          <div class="insights-accent"></div>
          <div class="insights-body">
            <h3 class="insights-title">💡 Insights</h3>
            <ul class="insights-list">
              @for (insight of insights(); track insight) {
                <li class="insight-item">{{ insight }}</li>
              }
            </ul>
          </div>
        </div>
      }

      <!-- Mood Trends -->
      @if (hasMoodData()) {
        <div class="section-card">
          <h3 class="section-title">Mood Trends <span class="section-subtitle">7 days</span></h3>
          <p-chart type="line" [data]="moodChartData()" [options]="moodChartOptions" height="180px"></p-chart>
        </div>
      }

      <!-- Achievements -->
      <div class="section-card">
        <h3 class="section-title">
          Achievements
          <span class="badge-count">{{ profile().achievements.length }}</span>
        </h3>
        <div class="achievements-grid">
          @for (a of profile().achievements; track a.id) {
            <div class="achievement-item">
              <span class="achievement-icon">{{ a.icon }}</span>
              <strong class="achievement-name">{{ a.name }}</strong>
              <small class="achievement-desc">{{ a.description }}</small>
            </div>
          }
          @if (profile().achievements.length === 0) {
            <div class="empty-achievements">
              <span style="font-size: 2rem;">🏅</span>
              <p>Complete habits to unlock achievements!</p>
            </div>
          }
        </div>
      </div>

      <!-- Category Filter -->
      <div class="filter-pills">
        <button class="pill" [class.active]="!selectedCategory()" (click)="selectedCategory.set(null)">All</button>
        @for (cat of categories; track cat) {
          <button class="pill"
            [class.active]="selectedCategory() === cat"
            (click)="selectedCategory.set(cat)">{{ cat }}</button>
        }
      </div>

      @if (filteredHabits().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <p class="empty-text">Add some habits to see reports!</p>
        </div>
      }

      @for (stat of filteredStats(); track stat.habitId) {
        <div class="section-card stat-card">
          <h3 class="section-title stat-name">{{ stat.habitName }}</h3>

          <!-- Stats 2x2 Grid -->
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-value">{{ stat.currentStreak }}</div>
              <div class="stat-label">🔥 Current</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">{{ stat.bestStreak }}</div>
              <div class="stat-label">🏆 Best</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">{{ stat.weeklyRate }}%</div>
              <div class="stat-label">Week</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">{{ stat.monthlyRate }}%</div>
              <div class="stat-label">Month</div>
            </div>
          </div>

          <div class="goal-section">
            <div class="goal-header">
              <span class="goal-label">Goal Progress</span>
              <span class="goal-pct">{{ stat.goalProgress }}%</span>
            </div>
            <p-progressBar [value]="stat.goalProgress" [showValue]="false"></p-progressBar>
          </div>

          <div class="chart-section">
            <p-chart type="bar" [data]="getChartData(stat.habitId)" [options]="chartOptions" height="160px"></p-chart>
          </div>
        </div>
      }

      <!-- Share -->
      <div class="share-section">
        <button class="share-btn" (click)="shareProgress()">
          <ion-icon name="share-social-outline"></ion-icon>
          Share Progress
        </button>
      </div>

      <div style="height: 60px;"></div>
    </ion-content>
  `,
  styles: [`
    :host { display: block; }

    /* Insights */
    .insights-card {
      display: flex;
      border-radius: 14px;
      background: var(--card-bg);
      overflow: hidden;
      margin-bottom: 16px;
      animation: slide-up 0.4s ease-out;
    }
    .insights-accent {
      width: 4px;
      background: #FF6B4A;
      flex-shrink: 0;
    }
    .insights-body {
      padding: 16px;
      flex: 1;
    }
    .insights-title {
      font-family: 'Sora', sans-serif;
      font-weight: 700;
      font-size: 1rem;
      margin: 0 0 10px;
    }
    .insights-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .insight-item {
      font-size: 0.85rem;
      color: var(--text-secondary);
      padding: 4px 0;
    }

    /* Section Cards */
    .section-card {
      border-radius: 14px;
      padding: 18px;
      margin-bottom: 16px;
      background: var(--card-bg);
      animation: slide-up 0.4s ease-out both;
    }
    .section-title {
      font-family: 'Sora', sans-serif;
      font-weight: 700;
      font-size: 1rem;
      margin: 0 0 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-subtitle {
      font-family: 'DM Sans', sans-serif;
      font-weight: 500;
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .stat-name {
      color: #FF6B4A;
    }

    /* Badge count */
    .badge-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 22px;
      height: 22px;
      border-radius: 6px;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.75rem;
      font-weight: 700;
      background: rgba(255, 107, 74, 0.12);
      color: #FF6B4A;
      padding: 0 6px;
    }

    /* Achievements */
    .achievements-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 10px;
    }
    .achievement-item {
      text-align: center;
      padding: 14px 8px;
      border-radius: 12px;
      background: rgba(255, 107, 74, 0.04);
    }
    .achievement-icon { font-size: 1.8rem; display: block; margin-bottom: 6px; }
    .achievement-name {
      display: block;
      font-family: 'Sora', sans-serif;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .achievement-desc {
      display: block;
      font-size: 0.65rem;
      color: var(--text-muted);
      margin-top: 2px;
    }
    .empty-achievements {
      grid-column: 1 / -1;
      text-align: center;
      padding: 20px;
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    /* Filter Pills */
    .filter-pills {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
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
      color: #fff;
      border-color: #FF6B4A;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .stat-box {
      text-align: center;
      padding: 12px 8px;
      border-radius: 12px;
      background: rgba(255, 107, 74, 0.04);
    }
    .stat-value {
      font-family: 'Sora', sans-serif;
      font-size: 1.3rem;
      font-weight: 700;
    }
    .stat-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--text-muted);
      margin-top: 2px;
    }

    /* Goal */
    .goal-section { margin-bottom: 16px; }
    .goal-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .goal-label {
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--text-secondary);
    }
    .goal-pct {
      font-family: 'Sora', sans-serif;
      font-size: 0.85rem;
      font-weight: 700;
      color: #FF6B4A;
    }

    .chart-section { margin-top: 8px; }

    /* Empty */
    .empty-state {
      text-align: center;
      padding: 40px 16px;
      animation: fade-in 0.4s ease-out;
    }
    .empty-icon { font-size: 3rem; margin-bottom: 12px; }
    .empty-text { font-size: 0.95rem; color: var(--text-muted); }

    /* Share */
    .share-section { margin: 20px 0 16px; }
    .share-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 14px;
      border-radius: 14px;
      font-family: 'Sora', sans-serif;
      font-size: 0.95rem;
      font-weight: 600;
      background: #FF6B4A;
      color: #ffffff;
      border: none;
      transition: all 0.2s ease-out;
      cursor: pointer;
    }
    .share-btn:active { transform: scale(0.98); }
    .share-btn ion-icon { font-size: 1.1rem; }
  `],
})
export class ReportsPage {
  categories = ALL_CATEGORIES;
  selectedCategory = signal<HabitCategory | null>(null);

  profile = computed(() => this.habitService.profile());
  habits = computed(() => this.habitService.habits());
  filteredHabits = computed(() => {
    const cat = this.selectedCategory();
    return cat ? this.habits().filter(h => h.category === cat) : this.habits();
  });
  filteredStats = computed(() =>
    this.filteredHabits().map(h => this.habitService.getStats(h.id))
  );
  insights = computed(() => this.habitService.generateInsights());

  moodData = computed(() => this.habitService.getMoodData());
  hasMoodData = computed(() => this.moodData().data.some(d => d > 0));
  moodChartData = computed(() => ({
    labels: this.moodData().labels,
    datasets: [{
      label: 'Mood',
      data: this.moodData().data,
      borderColor: '#FF6B4A',
      backgroundColor: 'rgba(255, 107, 74, 0.1)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#FF6B4A',
      pointBorderColor: '#FF6B4A',
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  }));

  moodChartOptions = {
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true, max: 5,
        ticks: { stepSize: 1, callback: (v: number) => ['', '😔', '😤', '😐', '🔥', '😊'][v] || '', color: '#6B7280' },
        grid: { color: 'rgba(107, 114, 128, 0.1)' },
      },
      x: {
        ticks: { color: '#6B7280' },
        grid: { display: false },
      },
    },
  };

  chartOptions = {
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true, max: 7,
        ticks: { stepSize: 1, color: '#6B7280' },
        grid: { color: 'rgba(107, 114, 128, 0.1)' },
      },
      x: {
        ticks: { color: '#6B7280' },
        grid: { display: false },
      },
    },
  };

  constructor(private habitService: HabitService) {
    addIcons({ flameOutline, trophyOutline, statsChartOutline, shareSocialOutline, bulbOutline });
  }

  getCatColor(cat: HabitCategory): string { return CATEGORY_COLORS[cat]; }

  getChartData(habitId: string) {
    const weeklyData = this.habitService.getWeeklyData(habitId);
    return {
      labels: weeklyData.labels,
      datasets: [{
        label: 'Completions',
        data: weeklyData.data,
        backgroundColor: 'rgba(255, 107, 74, 0.5)',
        hoverBackgroundColor: '#FF6B4A',
        borderRadius: 6,
        borderSkipped: false,
      }],
    };
  }

  shareProgress(): void {
    const text = this.habitService.generateShareText();
    if (navigator.share) {
      navigator.share({ title: 'My Habit Tracker Progress', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        alert('Progress copied to clipboard!');
      });
    }
  }
}

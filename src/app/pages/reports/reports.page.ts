import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonIcon, IonButton, IonChip,
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
    IonCardTitle, IonCardContent, IonIcon, IonButton, IonChip,
    UIChart, ProgressBar,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Reports</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">

      <!-- AI Insights Card -->
      @if (insights().length > 0) {
        <div class="insights-card">
          <div class="insights-header">
            <span class="insights-icon">💡</span>
            <h3 class="insights-title">AI Insights</h3>
          </div>
          <ul class="insights-list">
            @for (insight of insights(); track insight) {
              <li class="insight-item">{{ insight }}</li>
            }
          </ul>
        </div>
      }

      <!-- Mood Trends -->
      @if (hasMoodData()) {
        <div class="report-card mood-card">
          <h3 class="card-title">😊 Mood Trends <span class="card-subtitle">(7 Days)</span></h3>
          <p-chart type="line" [data]="moodChartData()" [options]="moodChartOptions" height="200px"></p-chart>
        </div>
      }

      <!-- Achievements — collectible cards -->
      <div class="report-card achievements-card">
        <h3 class="card-title">
          🏆 Achievements
          <span class="achievement-count">{{ profile().achievements.length }}</span>
        </h3>
        <div class="achievements-grid">
          @for (a of profile().achievements; track a.id) {
            <div class="achievement-item unlocked">
              <div class="achievement-icon-wrap">
                <span class="achievement-icon">{{ a.icon }}</span>
              </div>
              <strong class="achievement-name">{{ a.name }}</strong>
              <small class="achievement-desc">{{ a.description }}</small>
            </div>
          }
          @if (profile().achievements.length === 0) {
            <div class="empty-achievements">
              <span class="empty-trophy">🏅</span>
              <p>Complete habits to unlock achievements!</p>
            </div>
          }
        </div>
      </div>

      <!-- Category Filter -->
      <div class="filter-pills">
        <button class="filter-pill" [class.active]="!selectedCategory()" (click)="selectedCategory.set(null)">ALL</button>
        @for (cat of categories; track cat) {
          <button class="filter-pill"
            [class.active]="selectedCategory() === cat"
            [style]="selectedCategory() === cat
              ? 'background:' + getCatColor(cat) + '; color: #0B0F1A; box-shadow: 0 0 16px ' + getCatColor(cat) + '44;'
              : 'color:' + getCatColor(cat)"
            (click)="selectedCategory.set(cat)">{{ cat | uppercase }}</button>
        }
      </div>

      @if (filteredHabits().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <p class="empty-text">Add some habits to see reports!</p>
        </div>
      }

      @for (stat of filteredStats(); track stat.habitId) {
        <div class="report-card stat-card">
          <h3 class="card-title stat-habit-name">{{ stat.habitName }}</h3>
          <div class="stats-grid">
            <div class="stat-box">
              <span class="stat-emoji">🔥</span>
              <div class="stat-value">{{ stat.currentStreak }}</div>
              <div class="stat-label">Current</div>
            </div>
            <div class="stat-box">
              <span class="stat-emoji">🏆</span>
              <div class="stat-value">{{ stat.bestStreak }}</div>
              <div class="stat-label">Best</div>
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
            <p-chart type="bar" [data]="getChartData(stat.habitId)" [options]="chartOptions" height="180px"></p-chart>
          </div>
        </div>
      }

      <!-- Share Button -->
      <div class="share-section">
        <button class="share-btn" (click)="shareProgress()">
          <ion-icon name="share-social-outline"></ion-icon>
          Share Progress
        </button>
      </div>
    </ion-content>
  `,
  styles: [`
    :host { display: block; }

    .insights-card {
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 16px;
      background: linear-gradient(135deg, rgba(246, 166, 35, 0.12), rgba(255, 107, 107, 0.08));
      backdrop-filter: blur(12px);
      border: 1px solid rgba(246, 166, 35, 0.15);
      animation: slide-up 0.5s cubic-bezier(0.22, 1, 0.36, 1);
    }
    :host-context(body:not(.dark)) .insights-card {
      background: linear-gradient(135deg, rgba(246, 166, 35, 0.08), rgba(255, 107, 107, 0.04));
      border-color: rgba(246, 166, 35, 0.12);
    }
    .insights-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
    }
    .insights-icon { font-size: 1.5rem; }
    .insights-title {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-weight: 700;
      font-size: 1.1rem;
    }
    .insights-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .insight-item {
      font-family: 'Outfit', sans-serif;
      font-size: 0.85rem;
      color: #B8C2D4;
      padding: 6px 0;
      border-bottom: 1px solid rgba(46, 58, 88, 0.2);
    }
    .insight-item:last-child { border-bottom: none; }
    :host-context(body:not(.dark)) .insight-item { color: #4A5568; border-bottom-color: rgba(0,0,0,0.05); }

    /* Report Cards */
    .report-card {
      border-radius: 20px;
      padding: 22px;
      margin-bottom: 16px;
      background: rgba(21, 29, 48, 0.5);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(46, 58, 88, 0.25);
      animation: slide-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    :host-context(body:not(.dark)) .report-card {
      background: rgba(255, 255, 255, 0.6);
      border-color: rgba(0, 0, 0, 0.05);
    }
    .card-title {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-weight: 700;
      font-size: 1.1rem;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .card-subtitle {
      font-family: 'Outfit', sans-serif;
      font-weight: 500;
      font-size: 0.8rem;
      color: #5A6B8A;
    }

    /* Achievements */
    .achievement-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      height: 24px;
      border-radius: 8px;
      font-family: 'Outfit', sans-serif;
      font-size: 0.75rem;
      font-weight: 700;
      background: rgba(246, 166, 35, 0.15);
      color: #F6A623;
      padding: 0 8px;
    }
    .achievements-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
      gap: 12px;
    }
    .achievement-item {
      text-align: center;
      padding: 16px 8px;
      border-radius: 16px;
      background: rgba(27, 37, 64, 0.5);
      border: 1px solid rgba(246, 166, 35, 0.1);
      transition: transform 0.2s ease;
    }
    :host-context(body:not(.dark)) .achievement-item {
      background: rgba(0, 0, 0, 0.03);
      border-color: rgba(0, 0, 0, 0.05);
    }
    .achievement-item.unlocked {
      animation: glow-pulse 2.5s ease-in-out infinite;
    }
    .achievement-icon-wrap {
      width: 48px; height: 48px;
      margin: 0 auto 8px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(246, 166, 35, 0.15), rgba(255, 107, 107, 0.1));
    }
    .achievement-icon { font-size: 1.8rem; }
    .achievement-name {
      display: block;
      font-family: 'Bricolage Grotesque', sans-serif;
      font-size: 0.78rem;
      font-weight: 700;
      margin-top: 4px;
    }
    .achievement-desc {
      display: block;
      font-family: 'Outfit', sans-serif;
      font-size: 0.65rem;
      color: #5A6B8A;
      margin-top: 2px;
    }
    .empty-achievements {
      grid-column: 1 / -1;
      text-align: center;
      padding: 24px;
    }
    .empty-trophy { font-size: 2.5rem; display: block; margin-bottom: 8px; }
    .empty-achievements p {
      font-family: 'Outfit', sans-serif;
      font-size: 0.85rem;
      color: #5A6B8A;
    }

    /* Filter Pills */
    .filter-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 20px;
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

    /* Stats Grid */
    .stat-habit-name {
      background: linear-gradient(135deg, #F6A623, #FF6B6B);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      text-align: center;
      margin-bottom: 20px;
    }
    .stat-box {
      padding: 12px 4px;
      border-radius: 14px;
      background: rgba(27, 37, 64, 0.4);
    }
    :host-context(body:not(.dark)) .stat-box {
      background: rgba(0, 0, 0, 0.03);
    }
    .stat-emoji { font-size: 1.2rem; display: block; margin-bottom: 4px; }
    .stat-value {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-size: 1.4rem;
      font-weight: 800;
    }
    .stat-label {
      font-family: 'Outfit', sans-serif;
      font-size: 0.68rem;
      font-weight: 500;
      color: #5A6B8A;
      margin-top: 2px;
    }

    /* Goal Section */
    .goal-section { margin-bottom: 20px; }
    .goal-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .goal-label {
      font-family: 'Outfit', sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      color: #8694AD;
    }
    .goal-pct {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-size: 0.85rem;
      font-weight: 700;
      color: #F6A623;
    }

    /* Chart */
    .chart-section { margin-top: 8px; }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 48px 16px;
      animation: fade-in 0.4s ease-out;
    }
    .empty-icon {
      font-size: 3rem;
      margin-bottom: 12px;
      animation: float 3s ease-in-out infinite;
    }
    .empty-text {
      font-family: 'Outfit', sans-serif;
      font-size: 0.9rem;
      color: #5A6B8A;
    }

    /* Share */
    .share-section {
      margin: 24px 0 32px;
    }
    .share-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 16px;
      border-radius: 16px;
      font-family: 'Bricolage Grotesque', sans-serif;
      font-size: 1rem;
      font-weight: 700;
      background: linear-gradient(135deg, #2DD4A8, #1AAE8A);
      color: #0B0F1A;
      border: none;
      box-shadow: 0 4px 24px rgba(45, 212, 168, 0.3);
      transition: all 0.25s ease;
      cursor: pointer;
    }
    .share-btn:active {
      transform: scale(0.98);
    }
    .share-btn ion-icon {
      font-size: 1.2rem;
    }
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
      borderColor: '#F6A623',
      backgroundColor: 'rgba(246, 166, 35, 0.15)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#FF6B6B',
      pointBorderColor: '#FF6B6B',
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  }));

  moodChartOptions = {
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true, max: 5,
        ticks: { stepSize: 1, callback: (v: number) => ['', '😔', '😤', '😐', '🔥', '😊'][v] || '', color: '#5A6B8A' },
        grid: { color: 'rgba(46, 58, 88, 0.2)' },
      },
      x: {
        ticks: { color: '#5A6B8A' },
        grid: { display: false },
      },
    },
  };

  chartOptions = {
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: true, max: 7,
        ticks: { stepSize: 1, color: '#5A6B8A' },
        grid: { color: 'rgba(46, 58, 88, 0.2)' },
      },
      x: {
        ticks: { color: '#5A6B8A' },
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
        backgroundColor: 'rgba(246, 166, 35, 0.6)',
        hoverBackgroundColor: '#F6A623',
        borderRadius: 8,
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

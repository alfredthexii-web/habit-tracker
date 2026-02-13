import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
  IonLabel, IonToggle, IonButton, IonIcon, IonCard, IonCardHeader, IonBackButton, IonButtons,
  IonCardTitle, IonCardContent,
} from '@ionic/angular/standalone';
import { HabitService } from '../../services/habit.service';
import { addIcons } from 'ionicons';
import { moonOutline, downloadOutline, cloudUploadOutline } from 'ionicons/icons';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
    IonLabel, IonToggle, IonButton, IonIcon, IonCard, IonCardHeader, IonBackButton, IonButtons,
    IonCardTitle, IonCardContent,
  ],
  template: `
    <ion-header translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/settings"></ion-back-button>
        </ion-buttons>
        <ion-title>Settings</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content [fullscreen]="true" class="ion-padding">

      <!-- Profile -->
      <div class="settings-group">
        <div class="group-header">Profile</div>
        <div class="settings-card">
          <div class="profile-row">
            <div class="profile-level-badge">{{ profile().level }}</div>
            <div class="profile-info">
              <span class="profile-name">Level {{ profile().level }}</span>
              <span class="profile-detail">{{ profile().xp }} XP · {{ profile().achievements.length }} achievements</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Appearance -->
      <div class="settings-group">
        <div class="group-header">Appearance</div>
        <div class="settings-card">
          <div class="settings-row">
            <span class="row-label">🌙 Dark Mode</span>
            <ion-toggle
              [checked]="isDarkMode()"
              (ionChange)="toggleDarkMode($event)"
            ></ion-toggle>
          </div>
        </div>
      </div>

      <!-- Data -->
      <div class="settings-group">
        <div class="group-header">Data</div>
        <div class="settings-card">
          <button class="action-row" (click)="exportData()">
            <span>📥 Export Data (JSON)</span>
            <span class="row-arrow">›</span>
          </button>
          <div class="row-divider"></div>
          <button class="action-row" (click)="triggerImport()">
            <span>📤 Import Data (JSON)</span>
            <span class="row-arrow">›</span>
          </button>
          <input type="file" accept=".json" #fileInput style="display:none" (change)="importData($event)">
        </div>
        @if (importStatus) {
          <p class="import-status" [class.success]="importStatus === 'Success!'" [class.error]="importStatus !== 'Success!'">
            {{ importStatus === 'Success!' ? '✅' : '❌' }} {{ importStatus }}
          </p>
        }
      </div>

      <!-- Notifications -->
      <div class="settings-group">
        <div class="group-header">Notifications</div>
        <div class="settings-card">
          <div class="settings-row">
            <span class="row-label">Status</span>
            <div class="status-row">
              <span class="status-dot" [class.active]="notificationStatus === 'granted'"></span>
              <span class="status-text">{{ notificationStatus | titlecase }}</span>
            </div>
          </div>
          <div class="row-divider"></div>
          <button class="action-row" (click)="requestPermission()">
            <span>🔔 Enable Notifications</span>
            <span class="row-arrow">›</span>
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="settings-footer">
        <p class="footer-text">Habit Tracker v1.0</p>
        <p class="footer-sub">Built with ❤️ and discipline</p>
      </div>

      <div style="height: 100px;"></div>
    </ion-content>
  `,
  styles: [`
    :host { display: block; }

    .settings-group {
      margin-bottom: 24px;
      animation: slide-up 0.4s ease-out both;
    }
    .group-header {
      font-family: 'Sora', sans-serif;
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      margin-bottom: 8px;
      padding: 0 4px;
    }
    .settings-card {
      border-radius: 14px;
      background: var(--card-bg);
      overflow: hidden;
    }

    /* Profile Row */
    .profile-row {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px;
    }
    .profile-level-badge {
      width: 48px;
      height: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Sora', sans-serif;
      font-weight: 800;
      font-size: 1.2rem;
      color: #ffffff;
      background: #FF6B4A;
    }
    .profile-info {
      display: flex;
      flex-direction: column;
    }
    .profile-name {
      font-family: 'Sora', sans-serif;
      font-weight: 700;
      font-size: 1rem;
    }
    .profile-detail {
      font-size: 0.82rem;
      color: var(--text-muted);
      margin-top: 2px;
    }

    /* Settings Row */
    .settings-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      min-height: 48px;
    }
    .row-label {
      font-size: 0.95rem;
      font-weight: 500;
    }

    /* Action Row */
    .action-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      width: 100%;
      background: none;
      border: none;
      color: inherit;
      font-family: 'DM Sans', sans-serif;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      min-height: 48px;
      text-align: left;
      transition: background 0.15s ease-out;
    }
    .action-row:active {
      background: rgba(255, 107, 74, 0.06);
    }
    .row-arrow {
      font-size: 1.2rem;
      color: var(--text-muted);
    }
    .row-divider {
      height: 1px;
      background: var(--ion-border-color);
      margin: 0 16px;
    }

    /* Status */
    .status-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--text-muted);
    }
    .status-dot.active {
      background: #4ADE80;
    }
    .status-text {
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .import-status {
      font-size: 0.85rem;
      font-weight: 600;
      text-align: center;
      padding: 8px;
      border-radius: 10px;
      margin-top: 8px;
    }
    .import-status.success { color: #4ADE80; background: rgba(74, 222, 128, 0.1); }
    .import-status.error { color: #EF4444; background: rgba(239, 68, 68, 0.1); }

    /* Footer */
    .settings-footer {
      text-align: center;
      padding: 20px 0 8px;
    }
    .footer-text {
      font-family: 'Sora', sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .footer-sub {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 2px;
    }
  `],
})
export class SettingsPage {
  profile = computed(() => this.habitService.profile());
  isDarkMode = computed(() => this.habitService.preferences()['darkMode'] === true);
  importStatus = '';

  get notificationStatus(): string {
    if (!('Notification' in window)) return 'Not supported';
    return Notification.permission;
  }

  constructor(private habitService: HabitService) {
    addIcons({ moonOutline, downloadOutline, cloudUploadOutline });
    this.applyTheme();
  }

  toggleDarkMode(event: any): void {
    const dark = event.detail.checked;
    this.habitService.setPreference('darkMode', dark);
    this.applyTheme();
  }

  private applyTheme(): void {
    document.body.classList.toggle('dark', this.isDarkMode());
  }

  exportData(): void {
    const json = this.habitService.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `habit-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  triggerImport(): void {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    input?.click();
  }

  importData(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const success = this.habitService.importData(reader.result as string);
      this.importStatus = success ? 'Success!' : 'Invalid file format';
    };
    reader.readAsText(file);
  }

  requestPermission(): void {
    this.habitService.requestNotificationPermission();
  }
}

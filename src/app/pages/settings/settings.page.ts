import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
  IonLabel, IonToggle, IonButton, IonIcon, IonCard, IonCardHeader,
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
    IonLabel, IonToggle, IonButton, IonIcon, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Settings</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">

      <!-- Profile / XP Card -->
      <div class="settings-section profile-section">
        <div class="profile-hero">
          <div class="profile-badge">
            <span class="profile-level">{{ profile().level }}</span>
            <div class="profile-badge-shine"></div>
          </div>
          <div class="profile-info">
            <h2 class="profile-title">Level {{ profile().level }}</h2>
            <p class="profile-subtitle">{{ profile().xp }} XP earned</p>
          </div>
        </div>
        <div class="profile-stats-row">
          <div class="profile-stat">
            <div class="profile-stat-value gradient-text-warm">{{ profile().level }}</div>
            <div class="profile-stat-label">Level</div>
          </div>
          <div class="profile-stat-divider"></div>
          <div class="profile-stat">
            <div class="profile-stat-value gradient-text-warm">{{ profile().xp }}</div>
            <div class="profile-stat-label">Total XP</div>
          </div>
          <div class="profile-stat-divider"></div>
          <div class="profile-stat">
            <div class="profile-stat-value gradient-text-warm">{{ profile().achievements.length }}</div>
            <div class="profile-stat-label">Achievements</div>
          </div>
        </div>
      </div>

      <!-- Appearance -->
      <div class="settings-section">
        <div class="section-header">
          <span class="section-icon">🎨</span>
          <h3 class="section-title">Appearance</h3>
        </div>
        <div class="section-divider"></div>
        <div class="settings-row">
          <div class="settings-row-info">
            <span class="settings-row-icon">🌙</span>
            <span class="settings-row-label">Dark Mode</span>
          </div>
          <ion-toggle
            [checked]="isDarkMode()"
            (ionChange)="toggleDarkMode($event)"
          ></ion-toggle>
        </div>
      </div>

      <!-- Data Management -->
      <div class="settings-section">
        <div class="section-header">
          <span class="section-icon">💾</span>
          <h3 class="section-title">Data Management</h3>
        </div>
        <div class="section-divider"></div>
        <button class="settings-action-btn export-btn" (click)="exportData()">
          <ion-icon name="download-outline"></ion-icon>
          <span>Export Data (JSON)</span>
        </button>
        <button class="settings-action-btn import-btn" (click)="triggerImport()">
          <ion-icon name="cloud-upload-outline"></ion-icon>
          <span>Import Data (JSON)</span>
        </button>
        <input type="file" accept=".json" #fileInput style="display:none" (change)="importData($event)">
        @if (importStatus) {
          <p class="import-status" [class.success]="importStatus === 'Success!'" [class.error]="importStatus !== 'Success!'">
            {{ importStatus === 'Success!' ? '✅' : '❌' }} {{ importStatus }}
          </p>
        }
      </div>

      <!-- Notifications -->
      <div class="settings-section">
        <div class="section-header">
          <span class="section-icon">🔔</span>
          <h3 class="section-title">Notifications</h3>
        </div>
        <div class="section-divider"></div>
        <div class="notification-status">
          <span class="status-dot" [class.active]="notificationStatus === 'granted'"></span>
          <span class="status-text">{{ notificationStatus | titlecase }}</span>
        </div>
        <button class="settings-action-btn notify-btn" (click)="requestPermission()">
          <span>🔔</span>
          <span>Enable Notifications</span>
        </button>
      </div>

      <!-- App Info -->
      <div class="settings-footer">
        <p class="footer-text">Habit Tracker v1.0</p>
        <p class="footer-subtext">Built with ❤️ and discipline</p>
      </div>
    </ion-content>
  `,
  styles: [`
    :host { display: block; }

    .settings-section {
      border-radius: 20px;
      padding: 22px;
      margin-bottom: 16px;
      background: rgba(21, 29, 48, 0.5);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(46, 58, 88, 0.25);
      animation: slide-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    :host-context(body:not(.dark)) .settings-section {
      background: rgba(255, 255, 255, 0.6);
      border-color: rgba(0, 0, 0, 0.05);
    }

    /* Profile Section */
    .profile-section {
      background: linear-gradient(135deg, rgba(246, 166, 35, 0.08), rgba(255, 107, 107, 0.05), rgba(21, 29, 48, 0.5));
      border-color: rgba(246, 166, 35, 0.12);
    }
    .profile-hero {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }
    .profile-badge {
      position: relative;
      width: 60px; height: 60px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #F6A623, #FFD93D);
      box-shadow: 0 0 24px rgba(246, 166, 35, 0.35);
      overflow: hidden;
    }
    .profile-badge-shine {
      position: absolute;
      inset: 0;
      background: linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.3) 50%, transparent 60%);
      background-size: 200% 100%;
      animation: badge-shine 3s ease-in-out infinite;
    }
    .profile-level {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-weight: 800;
      font-size: 1.5rem;
      color: #0B0F1A;
      position: relative;
      z-index: 1;
    }
    .profile-info { flex: 1; }
    .profile-title {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-weight: 800;
      font-size: 1.3rem;
      margin-bottom: 2px;
    }
    .profile-subtitle {
      font-family: 'Outfit', sans-serif;
      font-size: 0.85rem;
      color: #8694AD;
    }

    .profile-stats-row {
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding-top: 16px;
      border-top: 1px solid rgba(46, 58, 88, 0.2);
    }
    .profile-stat { text-align: center; }
    .profile-stat-value {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-size: 1.5rem;
      font-weight: 800;
    }
    .profile-stat-label {
      font-family: 'Outfit', sans-serif;
      font-size: 0.72rem;
      font-weight: 500;
      color: #5A6B8A;
      margin-top: 2px;
    }
    .profile-stat-divider {
      width: 1px;
      height: 36px;
      background: rgba(46, 58, 88, 0.3);
    }

    /* Section Headers */
    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 4px;
    }
    .section-icon { font-size: 1.3rem; }
    .section-title {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-weight: 700;
      font-size: 1.05rem;
    }
    .section-divider {
      height: 1px;
      background: rgba(46, 58, 88, 0.2);
      margin: 12px 0 16px;
    }
    :host-context(body:not(.dark)) .section-divider {
      background: rgba(0, 0, 0, 0.06);
    }

    /* Settings Row */
    .settings-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 0;
    }
    .settings-row-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .settings-row-icon { font-size: 1.2rem; }
    .settings-row-label {
      font-family: 'Outfit', sans-serif;
      font-size: 0.95rem;
      font-weight: 500;
    }

    /* Action Buttons */
    .settings-action-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 14px;
      border-radius: 14px;
      font-family: 'Outfit', sans-serif;
      font-size: 0.9rem;
      font-weight: 600;
      border: none;
      margin-bottom: 10px;
      transition: all 0.25s ease;
      cursor: pointer;
    }
    .settings-action-btn:active {
      transform: scale(0.98);
    }
    .export-btn {
      background: linear-gradient(135deg, rgba(246, 166, 35, 0.15), rgba(246, 166, 35, 0.08));
      color: #F6A623;
      border: 1px solid rgba(246, 166, 35, 0.2);
    }
    .import-btn {
      background: linear-gradient(135deg, rgba(255, 107, 107, 0.15), rgba(255, 107, 107, 0.08));
      color: #FF6B6B;
      border: 1px solid rgba(255, 107, 107, 0.2);
    }
    .notify-btn {
      background: linear-gradient(135deg, rgba(45, 212, 168, 0.15), rgba(45, 212, 168, 0.08));
      color: #2DD4A8;
      border: 1px solid rgba(45, 212, 168, 0.2);
    }
    :host-context(body:not(.dark)) .export-btn {
      background: rgba(212, 137, 26, 0.08);
      border-color: rgba(212, 137, 26, 0.15);
      color: #D4891A;
    }
    :host-context(body:not(.dark)) .import-btn {
      background: rgba(224, 69, 69, 0.06);
      border-color: rgba(224, 69, 69, 0.12);
      color: #E04545;
    }
    :host-context(body:not(.dark)) .notify-btn {
      background: rgba(26, 174, 138, 0.06);
      border-color: rgba(26, 174, 138, 0.12);
      color: #1AAE8A;
    }

    .settings-action-btn ion-icon {
      font-size: 1.1rem;
    }

    .import-status {
      font-family: 'Outfit', sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      text-align: center;
      padding: 8px;
      border-radius: 10px;
    }
    .import-status.success {
      color: #2DD4A8;
      background: rgba(45, 212, 168, 0.1);
    }
    .import-status.error {
      color: #FF6B6B;
      background: rgba(255, 107, 107, 0.1);
    }

    /* Notification Status */
    .notification-status {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
    }
    .status-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #5A6B8A;
    }
    .status-dot.active {
      background: #2DD4A8;
      box-shadow: 0 0 8px rgba(45, 212, 168, 0.5);
    }
    .status-text {
      font-family: 'Outfit', sans-serif;
      font-size: 0.85rem;
      color: #8694AD;
    }

    /* Footer */
    .settings-footer {
      text-align: center;
      padding: 24px 0 32px;
      animation: fade-in 0.4s ease-out 0.3s both;
    }
    .footer-text {
      font-family: 'Bricolage Grotesque', sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      color: #5A6B8A;
    }
    .footer-subtext {
      font-family: 'Outfit', sans-serif;
      font-size: 0.75rem;
      color: #3E4D6D;
      margin-top: 4px;
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

import { Component } from '@angular/core';
import {
  IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  today, todayOutline,
  list, listOutline,
  statsChart, statsChartOutline,
  settings, settingsOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="today">
          <ion-icon name="today-outline"></ion-icon>
          <ion-label>Today</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="habits">
          <ion-icon name="list-outline"></ion-icon>
          <ion-label>Habits</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="reports">
          <ion-icon name="stats-chart-outline"></ion-icon>
          <ion-label>Reports</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="settings">
          <ion-icon name="settings-outline"></ion-icon>
          <ion-label>Settings</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
})
export class TabsPage {
  constructor() {
    addIcons({ today, todayOutline, list, listOutline, statsChart, statsChartOutline, settings, settingsOutline });
  }
}

import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./app.tabs').then(m => m.TabsPage),
    children: [
      {
        path: 'today',
        loadComponent: () => import('./pages/today/today.page').then(m => m.TodayPage),
      },
      {
        path: 'habits',
        loadComponent: () => import('./pages/habits/habits.page').then(m => m.HabitsPage),
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports/reports.page').then(m => m.ReportsPage),
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.page').then(m => m.SettingsPage),
      },
      { path: '', redirectTo: 'today', pathMatch: 'full' },
    ],
  },
];

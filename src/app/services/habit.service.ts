import { Injectable, signal, computed } from '@angular/core';
import {
  Habit, HabitCompletion, HabitStats, HabitCategory, MoodEmoji,
  UserProfile, Achievement, ACHIEVEMENT_DEFS, HabitSchedule,
} from '../models/habit.model';

@Injectable({ providedIn: 'root' })
export class HabitService {
  private readonly HABITS_KEY = 'habits';
  private readonly COMPLETIONS_KEY = 'completions';
  private readonly PROFILE_KEY = 'user_profile';
  private readonly PREFS_KEY = 'app_preferences';

  habits = signal<Habit[]>(this.loadHabits());
  completions = signal<HabitCompletion[]>(this.loadCompletions());
  profile = signal<UserProfile>(this.loadProfile());
  preferences = signal<Record<string, any>>(this.loadPreferences());

  private reminderTimers: Map<string, ReturnType<typeof setInterval>> = new Map();

  constructor() {
    this.setupReminders();
  }

  // ─── Persistence ─────────────────────────────────────────
  private loadHabits(): Habit[] {
    const data = localStorage.getItem(this.HABITS_KEY);
    const habits: Habit[] = data ? JSON.parse(data) : [];
    // Migrate old habits without category
    return habits.map(h => ({ ...h, category: h.category || 'Personal' }));
  }

  private loadCompletions(): HabitCompletion[] {
    const data = localStorage.getItem(this.COMPLETIONS_KEY);
    return data ? JSON.parse(data) : [];
  }

  private loadProfile(): UserProfile {
    const data = localStorage.getItem(this.PROFILE_KEY);
    return data ? JSON.parse(data) : { xp: 0, level: 1, achievements: [] };
  }

  private loadPreferences(): Record<string, any> {
    const data = localStorage.getItem(this.PREFS_KEY);
    return data ? JSON.parse(data) : { darkMode: true };
  }

  private saveHabits(): void {
    localStorage.setItem(this.HABITS_KEY, JSON.stringify(this.habits()));
  }

  private saveCompletions(): void {
    localStorage.setItem(this.COMPLETIONS_KEY, JSON.stringify(this.completions()));
  }

  private saveProfile(): void {
    localStorage.setItem(this.PROFILE_KEY, JSON.stringify(this.profile()));
  }

  savePreferences(): void {
    localStorage.setItem(this.PREFS_KEY, JSON.stringify(this.preferences()));
  }

  setPreference(key: string, value: any): void {
    this.preferences.update(p => ({ ...p, [key]: value }));
    this.savePreferences();
  }

  // ─── CRUD ────────────────────────────────────────────────
  addHabit(habit: Omit<Habit, 'id' | 'createdAt'>): void {
    const newHabit: Habit = {
      ...habit,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.habits.update(h => [...h, newHabit]);
    this.saveHabits();
    this.checkAchievements();
    this.setupReminders();
  }

  updateHabit(id: string, updates: Partial<Habit>): void {
    this.habits.update(habits =>
      habits.map(h => (h.id === id ? { ...h, ...updates } : h))
    );
    this.saveHabits();
    this.setupReminders();
  }

  deleteHabit(id: string): void {
    this.habits.update(h => h.filter(habit => habit.id !== id));
    this.completions.update(c => c.filter(comp => comp.habitId !== id));
    this.saveHabits();
    this.saveCompletions();
  }

  // ─── Completions ─────────────────────────────────────────
  toggleCompletion(habitId: string, date: string, note?: string, mood?: MoodEmoji): void {
    const existing = this.completions().find(
      c => c.habitId === habitId && c.date === date
    );
    if (existing) {
      this.completions.update(c =>
        c.filter(comp => !(comp.habitId === habitId && comp.date === date))
      );
      this.addXP(-10); // Remove XP on un-complete
    } else {
      this.completions.update(c => [...c, { habitId, date, note, mood }]);
      this.addXP(10);
      // Check streak bonuses
      const stats = this.getStats(habitId);
      if (stats.currentStreak === 7) this.addXP(50);
      if (stats.currentStreak === 30) this.addXP(200);
      this.checkAchievements();
    }
    this.saveCompletions();
  }

  updateCompletionMeta(habitId: string, date: string, note?: string, mood?: MoodEmoji): void {
    this.completions.update(comps =>
      comps.map(c =>
        c.habitId === habitId && c.date === date
          ? { ...c, note: note ?? c.note, mood: mood ?? c.mood }
          : c
      )
    );
    this.saveCompletions();
  }

  isCompleted(habitId: string, date: string): boolean {
    return this.completions().some(
      c => c.habitId === habitId && c.date === date
    );
  }

  getCompletion(habitId: string, date: string): HabitCompletion | undefined {
    return this.completions().find(c => c.habitId === habitId && c.date === date);
  }

  getCompletionsForDate(date: string): HabitCompletion[] {
    return this.completions().filter(c => c.date === date);
  }

  getDateStr(date: Date = new Date()): string {
    return date.toISOString().split('T')[0];
  }

  // ─── Scheduling ──────────────────────────────────────────
  isHabitDueOn(habit: Habit, date: Date): boolean {
    const schedule = habit.schedule;
    if (!schedule) {
      // Legacy: daily means every day, weekly means once a week
      return true;
    }
    switch (schedule.type) {
      case 'daily':
        return true;
      case 'weekly':
        return true; // shown every day, goal is X per week
      case 'specific_days':
        return (schedule.daysOfWeek || []).includes(date.getDay());
      case 'x_per_month':
        return true; // always shown, user decides when
      case 'interval': {
        const created = new Date(habit.createdAt);
        const diffDays = Math.floor((date.getTime() - created.getTime()) / (86400000));
        return diffDays >= 0 && diffDays % (schedule.intervalDays || 1) === 0;
      }
      default:
        return true;
    }
  }

  getHabitsForDate(date: Date): Habit[] {
    return this.habits().filter(h => this.isHabitDueOn(h, date));
  }

  // ─── Stats ───────────────────────────────────────────────
  getStats(habitId: string): HabitStats {
    const habit = this.habits().find(h => h.id === habitId);
    if (!habit) {
      return { habitId, habitName: '', currentStreak: 0, bestStreak: 0, weeklyRate: 0, monthlyRate: 0, goalProgress: 0 };
    }

    const completions = this.completions()
      .filter(c => c.habitId === habitId)
      .map(c => c.date)
      .sort();

    const today = new Date();
    const todayStr = this.getDateStr(today);

    let currentStreak = 0;
    const checkDate = new Date(today);
    while (true) {
      const dateStr = this.getDateStr(checkDate);
      if (completions.includes(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (dateStr === todayStr) {
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    let bestStreak = 0;
    let streak = 0;
    const uniqueDates = [...new Set(completions)].sort();
    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) {
        streak = 1;
      } else {
        const prev = new Date(uniqueDates[i - 1]);
        const curr = new Date(uniqueDates[i]);
        const diff = (curr.getTime() - prev.getTime()) / (86400000);
        streak = diff === 1 ? streak + 1 : 1;
      }
      bestStreak = Math.max(bestStreak, streak);
    }

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);
    let weekCount = 0;
    for (const d = new Date(weekAgo); d <= today; d.setDate(d.getDate() + 1)) {
      if (completions.includes(this.getDateStr(d))) weekCount++;
    }
    const weeklyRate = Math.round((weekCount / 7) * 100);

    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 29);
    let monthCount = 0;
    for (const d = new Date(monthAgo); d <= today; d.setDate(d.getDate() + 1)) {
      if (completions.includes(this.getDateStr(d))) monthCount++;
    }
    const monthlyRate = Math.round((monthCount / 30) * 100);

    const goal = habit.goal || (habit.frequency === 'daily' ? 7 : 1);
    const goalProgress = Math.min(100, Math.round((weekCount / goal) * 100));

    return {
      habitId,
      habitName: habit.name,
      currentStreak,
      bestStreak: Math.max(bestStreak, currentStreak),
      weeklyRate,
      monthlyRate,
      goalProgress,
    };
  }

  getWeeklyData(habitId: string): { labels: string[]; data: number[] } {
    const labels: string[] = [];
    const data: number[] = [];
    const today = new Date();

    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - (w * 7 + 6));
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() - w * 7);

      let count = 0;
      for (const d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
        if (this.isCompleted(habitId, this.getDateStr(d))) count++;
      }
      labels.push(`Week ${4 - w}`);
      data.push(count);
    }

    return { labels, data };
  }

  // ─── XP & Gamification ──────────────────────────────────
  addXP(amount: number): void {
    this.profile.update(p => {
      const newXP = Math.max(0, p.xp + amount);
      const newLevel = Math.floor(newXP / 100) + 1;
      return { ...p, xp: newXP, level: newLevel };
    });
    this.saveProfile();
    this.checkAchievements();
  }

  private checkAchievements(): void {
    const p = this.profile();
    const habits = this.habits();
    const unlocked = new Set(p.achievements.map(a => a.id));
    const newAchievements: Achievement[] = [...p.achievements];
    const now = new Date().toISOString();

    const tryUnlock = (id: string) => {
      if (unlocked.has(id)) return;
      const def = ACHIEVEMENT_DEFS.find(a => a.id === id);
      if (def) {
        newAchievements.push({ ...def, unlockedAt: now });
        unlocked.add(id);
      }
    };

    if (habits.length >= 1) tryUnlock('first_habit');
    if (habits.length >= 10) tryUnlock('habits_10');

    // Check streaks
    for (const h of habits) {
      const stats = this.getStats(h.id);
      if (stats.currentStreak >= 7 || stats.bestStreak >= 7) tryUnlock('streak_7');
      if (stats.currentStreak >= 30 || stats.bestStreak >= 30) tryUnlock('streak_30');
    }

    // Perfect week: all habits completed every day last 7 days
    const today = new Date();
    let perfectWeek = habits.length > 0;
    for (let i = 0; i < 7 && perfectWeek; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = this.getDateStr(d);
      for (const h of habits) {
        if (!this.isCompleted(h.id, dateStr)) { perfectWeek = false; break; }
      }
    }
    if (perfectWeek && habits.length > 0) tryUnlock('perfect_week');

    if (p.level >= 5) tryUnlock('level_5');
    if (p.level >= 10) tryUnlock('level_10');

    if (newAchievements.length !== p.achievements.length) {
      this.profile.update(pr => ({ ...pr, achievements: newAchievements }));
      this.saveProfile();
    }
  }

  // ─── Reminders ───────────────────────────────────────────
  setupReminders(): void {
    // Clear existing
    this.reminderTimers.forEach(t => clearInterval(t));
    this.reminderTimers.clear();

    for (const habit of this.habits()) {
      if (habit.reminderTime) {
        const timer = setInterval(() => {
          this.checkAndNotify(habit);
        }, 60000); // Check every minute
        this.reminderTimers.set(habit.id, timer);
        // Also check immediately
        this.checkAndNotify(habit);
      }
    }
  }

  private checkAndNotify(habit: Habit): void {
    if (!habit.reminderTime) return;
    const now = new Date();
    const [h, m] = habit.reminderTime.split(':').map(Number);
    if (now.getHours() === h && now.getMinutes() === m) {
      const todayStr = this.getDateStr();
      if (!this.isCompleted(habit.id, todayStr)) {
        this.sendNotification(habit.name, `Time to: ${habit.description || habit.name}`);
      }
    }
  }

  requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  private sendNotification(title: string, body: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '🔔' });
    }
  }

  // ─── Mood data ───────────────────────────────────────────
  getMoodData(): { labels: string[]; data: number[] } {
    const moodMap: Record<string, number> = { '😊': 5, '🔥': 4, '😐': 3, '😤': 2, '😔': 1 };
    const today = new Date();
    const labels: string[] = [];
    const data: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = this.getDateStr(d);
      labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));

      const dayCompletions = this.completions().filter(c => c.date === dateStr && c.mood);
      if (dayCompletions.length > 0) {
        const avg = dayCompletions.reduce((sum, c) => sum + (moodMap[c.mood!] || 3), 0) / dayCompletions.length;
        data.push(Math.round(avg * 10) / 10);
      } else {
        data.push(0);
      }
    }
    return { labels, data };
  }

  // ─── AI Insights ─────────────────────────────────────────
  generateInsights(): string[] {
    const insights: string[] = [];
    const habits = this.habits();
    const completions = this.completions();
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const habit of habits) {
      const habitCompletions = completions.filter(c => c.habitId === habit.id);
      if (habitCompletions.length < 3) continue;

      // Find best/worst day of week
      const dayCount = [0, 0, 0, 0, 0, 0, 0];
      const dayTotal = [0, 0, 0, 0, 0, 0, 0];

      for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dow = d.getDay();
        dayTotal[dow]++;
        if (this.isCompleted(habit.id, this.getDateStr(d))) dayCount[dow]++;
      }

      const rates = dayTotal.map((t, i) => t > 0 ? dayCount[i] / t : 0);
      const bestDay = rates.indexOf(Math.max(...rates));
      const worstDay = rates.indexOf(Math.min(...rates.filter(r => rates.indexOf(r) !== -1)));

      if (rates[bestDay] > 0.7) {
        insights.push(`Your best day for "${habit.name}" is ${dayNames[bestDay]} (${Math.round(rates[bestDay] * 100)}% completion)`);
      }

      if (rates[worstDay] < 0.3 && dayTotal[worstDay] > 0) {
        insights.push(`You tend to skip "${habit.name}" on ${dayNames[worstDay]}s`);
      }

      // Month-over-month improvement
      const thisMonth = habitCompletions.filter(c => {
        const d = new Date(c.date);
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      }).length;

      const lastMonthDate = new Date(today);
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      const lastMonth = habitCompletions.filter(c => {
        const d = new Date(c.date);
        return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
      }).length;

      if (lastMonth > 0 && thisMonth > lastMonth) {
        const improvement = Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
        if (improvement > 10) {
          insights.push(`You've improved "${habit.name}" completion by ${improvement}% this month!`);
        }
      }
    }

    // Overall best day
    if (habits.length > 0) {
      const overallDay = [0, 0, 0, 0, 0, 0, 0];
      for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = this.getDateStr(d);
        const count = completions.filter(c => c.date === dateStr).length;
        overallDay[d.getDay()] += count;
      }
      const bestOverall = overallDay.indexOf(Math.max(...overallDay));
      insights.push(`Your most productive day overall is ${dayNames[bestOverall]}`);
    }

    if (insights.length === 0) {
      insights.push('Keep tracking your habits to get personalized insights!');
    }

    return insights;
  }

  // ─── Export / Import ─────────────────────────────────────
  exportData(): string {
    return JSON.stringify({
      habits: this.habits(),
      completions: this.completions(),
      profile: this.profile(),
      preferences: this.preferences(),
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  importData(json: string): boolean {
    try {
      const data = JSON.parse(json);
      if (data.habits) {
        this.habits.set(data.habits);
        this.saveHabits();
      }
      if (data.completions) {
        this.completions.set(data.completions);
        this.saveCompletions();
      }
      if (data.profile) {
        this.profile.set(data.profile);
        this.saveProfile();
      }
      if (data.preferences) {
        this.preferences.set(data.preferences);
        this.savePreferences();
      }
      return true;
    } catch {
      return false;
    }
  }

  // ─── Share ───────────────────────────────────────────────
  generateShareText(): string {
    const habits = this.habits();
    const p = this.profile();
    let text = `🏆 My Habit Tracker Progress\n`;
    text += `📊 Level ${p.level} | ${p.xp} XP\n`;
    text += `📋 ${habits.length} habits tracked\n\n`;

    for (const h of habits) {
      const stats = this.getStats(h.id);
      text += `${h.name}: 🔥${stats.currentStreak} day streak (best: ${stats.bestStreak})\n`;
    }

    text += `\n🏅 ${p.achievements.length} achievements unlocked`;
    return text;
  }
}

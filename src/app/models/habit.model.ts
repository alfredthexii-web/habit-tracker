export type HabitCategory = 'Health' | 'Work' | 'Personal' | 'Fitness' | 'Learning' | 'Custom';

export const CATEGORY_COLORS: Record<HabitCategory, string> = {
  Health: '#2DD4A8',
  Work: '#60A5FA',
  Personal: '#A78BFA',
  Fitness: '#FF6B6B',
  Learning: '#F6A623',
  Custom: '#8694AD',
};

export const ALL_CATEGORIES: HabitCategory[] = ['Health', 'Work', 'Personal', 'Fitness', 'Learning', 'Custom'];

export type ScheduleType = 'daily' | 'weekly' | 'specific_days' | 'x_per_month' | 'interval';

export interface HabitSchedule {
  type: ScheduleType;
  daysOfWeek?: number[]; // 0=Sun..6=Sat for specific_days
  timesPerMonth?: number; // for x_per_month
  intervalDays?: number; // for interval (every N days)
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly'; // kept for backward compat
  schedule?: HabitSchedule;
  goal?: number;
  category: HabitCategory;
  reminderTime?: string; // HH:mm format
  createdAt: string;
}

export type MoodEmoji = '😊' | '😐' | '😔' | '😤' | '🔥';
export const MOOD_EMOJIS: MoodEmoji[] = ['😊', '😐', '😔', '😤', '🔥'];

export interface HabitCompletion {
  habitId: string;
  date: string; // YYYY-MM-DD
  note?: string;
  mood?: MoodEmoji;
}

export interface HabitStats {
  habitId: string;
  habitName: string;
  currentStreak: number;
  bestStreak: number;
  weeklyRate: number;
  monthlyRate: number;
  goalProgress: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface UserProfile {
  xp: number;
  level: number;
  achievements: Achievement[];
}

export interface HabitTemplate {
  name: string;
  description: string;
  category: HabitCategory;
  frequency: 'daily' | 'weekly';
  goal?: number;
}

export const HABIT_TEMPLATES: HabitTemplate[] = [
  { name: 'Drink Water', description: '8 glasses of water', category: 'Health', frequency: 'daily' },
  { name: 'Meditate', description: '10 minutes meditation', category: 'Health', frequency: 'daily' },
  { name: 'Exercise', description: '30 min workout', category: 'Fitness', frequency: 'daily' },
  { name: 'Read', description: '30 minutes reading', category: 'Learning', frequency: 'daily' },
  { name: 'Journal', description: 'Write in journal', category: 'Personal', frequency: 'daily' },
  { name: 'Sleep 8hrs', description: 'Get 8 hours of sleep', category: 'Health', frequency: 'daily' },
  { name: 'No Social Media', description: 'Avoid social media', category: 'Personal', frequency: 'daily' },
  { name: 'Walk 10k Steps', description: '10,000 steps', category: 'Fitness', frequency: 'daily' },
  { name: 'Learn Something New', description: 'Learn a new concept or skill', category: 'Learning', frequency: 'daily' },
  { name: 'Gratitude List', description: 'Write 3 things you\'re grateful for', category: 'Personal', frequency: 'daily' },
];

export const ACHIEVEMENT_DEFS: Omit<Achievement, 'unlockedAt'>[] = [
  { id: 'first_habit', name: 'First Habit', description: 'Created your first habit', icon: '🌱' },
  { id: 'streak_7', name: '7-Day Streak', description: 'Maintained a 7-day streak', icon: '🔥' },
  { id: 'streak_30', name: '30-Day Streak', description: 'Maintained a 30-day streak', icon: '💎' },
  { id: 'perfect_week', name: 'Perfect Week', description: 'Completed all habits for a full week', icon: '⭐' },
  { id: 'habits_10', name: '10 Habits Created', description: 'Created 10 habits', icon: '📋' },
  { id: 'level_5', name: 'Level 5', description: 'Reached level 5', icon: '🏅' },
  { id: 'level_10', name: 'Level 10', description: 'Reached level 10', icon: '🏆' },
];

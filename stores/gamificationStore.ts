import { create } from 'zustand';
import { db } from '@/db/client';
import { userStats, achievements, workouts, sets } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export interface UserStatsData {
  currentStreak: number;
  longestStreak: number;
  totalWorkouts: number;
  totalVolume: number;
  totalXP: number;
  level: number;
  lastWorkoutDate: Date | null;
}

export interface AchievementData {
  id: number;
  key: string;
  name: string;
  description: string | null;
  xpReward: number | null;
  isUnlocked: boolean | null;
  unlockedAt: Date | null;
}

// XP required for each level (cumulative)
const levelThresholds = [
  0,      // Level 1
  100,    // Level 2
  300,    // Level 3
  600,    // Level 4
  1000,   // Level 5
  1500,   // Level 6
  2100,   // Level 7
  2800,   // Level 8
  3600,   // Level 9
  4500,   // Level 10
  5500,   // Level 11+
];

const levelNames = [
  'Beginner',
  'Novice',
  'Apprentice',
  'Intermediate',
  'Skilled',
  'Advanced',
  'Expert',
  'Master',
  'Elite',
  'Champion',
  'Legend',
];

export function getLevelFromXP(xp: number): number {
  for (let i = levelThresholds.length - 1; i >= 0; i--) {
    if (xp >= levelThresholds[i]) {
      return i + 1;
    }
  }
  return 1;
}

export function getLevelName(level: number): string {
  return levelNames[Math.min(level - 1, levelNames.length - 1)] || 'Legend';
}

export function getXPForNextLevel(currentXP: number): { current: number; required: number; progress: number } {
  const level = getLevelFromXP(currentXP);
  const currentThreshold = levelThresholds[level - 1] || 0;
  const nextThreshold = levelThresholds[level] || levelThresholds[levelThresholds.length - 1] + 1000;

  const xpInLevel = currentXP - currentThreshold;
  const xpRequired = nextThreshold - currentThreshold;

  return {
    current: xpInLevel,
    required: xpRequired,
    progress: Math.min(xpInLevel / xpRequired, 1),
  };
}

interface GamificationState {
  stats: UserStatsData | null;
  achievements: AchievementData[];
  unlockedAchievements: AchievementData[];
  newlyUnlocked: AchievementData[];
  isLoading: boolean;

  fetchStats: () => Promise<void>;
  fetchAchievements: () => Promise<void>;
  updateStatsAfterWorkout: (volume: number) => Promise<AchievementData[]>;
  clearNewlyUnlocked: () => void;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  stats: null,
  achievements: [],
  unlockedAchievements: [],
  newlyUnlocked: [],
  isLoading: false,

  fetchStats: async () => {
    try {
      const statsData = await db.select().from(userStats).limit(1);

      if (statsData.length > 0) {
        const s = statsData[0];
        set({
          stats: {
            currentStreak: s.currentStreak || 0,
            longestStreak: s.longestStreak || 0,
            totalWorkouts: s.totalWorkouts || 0,
            totalVolume: s.totalVolume || 0,
            totalXP: s.totalXP || 0,
            level: s.level || 1,
            lastWorkoutDate: s.lastWorkoutDate,
          },
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  },

  fetchAchievements: async () => {
    try {
      const achievementsData = await db.select().from(achievements);

      const mapped = achievementsData.map((a) => ({
        id: a.id,
        key: a.key,
        name: a.name,
        description: a.description,
        xpReward: a.xpReward,
        isUnlocked: a.isUnlocked,
        unlockedAt: a.unlockedAt,
      }));

      set({
        achievements: mapped,
        unlockedAchievements: mapped.filter((a) => a.isUnlocked),
      });
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  },

  updateStatsAfterWorkout: async (volume: number) => {
    const { stats, achievements } = get();
    if (!stats) {
      await get().fetchStats();
      await get().fetchAchievements();
    }

    const currentStats = get().stats;
    if (!currentStats) return [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate streak
    let newStreak = currentStats.currentStreak;
    if (currentStats.lastWorkoutDate) {
      const lastDate = new Date(currentStats.lastWorkoutDate);
      const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
      const diffDays = Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Same day, streak unchanged
      } else if (diffDays === 1) {
        // Consecutive day, increment streak
        newStreak += 1;
      } else {
        // Streak broken, reset to 1
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const newLongestStreak = Math.max(currentStats.longestStreak, newStreak);
    const newTotalWorkouts = currentStats.totalWorkouts + 1;
    const newTotalVolume = currentStats.totalVolume + volume;

    // Base XP for completing a workout
    let xpGained = 25;

    // Bonus XP for streak
    if (newStreak > 1) {
      xpGained += Math.min(newStreak * 5, 50); // Max 50 bonus XP for streak
    }

    // Check and unlock achievements
    const newlyUnlockedAchievements: AchievementData[] = [];
    const allAchievements = get().achievements;

    const checkAndUnlock = async (key: string) => {
      const achievement = allAchievements.find((a) => a.key === key && !a.isUnlocked);
      if (achievement) {
        await db
          .update(achievements)
          .set({ isUnlocked: true, unlockedAt: now })
          .where(eq(achievements.key, key));

        xpGained += achievement.xpReward || 0;
        newlyUnlockedAchievements.push({ ...achievement, isUnlocked: true, unlockedAt: now });
      }
    };

    // Check first workout
    if (newTotalWorkouts === 1) {
      await checkAndUnlock('first_workout');
    }

    // Check workout milestones
    if (newTotalWorkouts >= 10) await checkAndUnlock('workouts_10');
    if (newTotalWorkouts >= 50) await checkAndUnlock('workouts_50');
    if (newTotalWorkouts >= 100) await checkAndUnlock('workouts_100');

    // Check streak milestones
    if (newStreak >= 3) await checkAndUnlock('streak_3');
    if (newStreak >= 7) await checkAndUnlock('streak_7');
    if (newStreak >= 30) await checkAndUnlock('streak_30');

    // Check volume milestones
    if (newTotalVolume >= 1000) await checkAndUnlock('volume_1000');
    if (newTotalVolume >= 10000) await checkAndUnlock('volume_10000');

    // Check time-based achievements
    const hour = now.getHours();
    if (hour < 7) await checkAndUnlock('morning_workout');
    if (hour >= 22) await checkAndUnlock('night_workout');

    const newTotalXP = currentStats.totalXP + xpGained;
    const newLevel = getLevelFromXP(newTotalXP);

    // Update database
    await db
      .update(userStats)
      .set({
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        totalWorkouts: newTotalWorkouts,
        totalVolume: newTotalVolume,
        totalXP: newTotalXP,
        level: newLevel,
        lastWorkoutDate: now,
      })
      .where(eq(userStats.id, 1));

    // Update state
    set({
      stats: {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        totalWorkouts: newTotalWorkouts,
        totalVolume: newTotalVolume,
        totalXP: newTotalXP,
        level: newLevel,
        lastWorkoutDate: now,
      },
      newlyUnlocked: newlyUnlockedAchievements,
    });

    // Refresh achievements
    await get().fetchAchievements();

    return newlyUnlockedAchievements;
  },

  clearNewlyUnlocked: () => {
    set({ newlyUnlocked: [] });
  },
}));

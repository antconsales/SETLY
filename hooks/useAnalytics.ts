import { useState, useEffect, useCallback } from 'react';
import { db } from '@/db/client';
import { workouts, sets, exercises } from '@/db/schema';
import { eq, desc, gte, lte, and, sql } from 'drizzle-orm';

export interface WeeklyStats {
  weekStart: Date;
  totalWorkouts: number;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
}

export interface ExerciseProgress {
  exerciseId: number;
  exerciseName: string;
  category: string | null;
  dataPoints: {
    date: Date;
    maxWeight: number;
    totalVolume: number;
  }[];
}

export interface DailyWorkoutCount {
  date: string; // YYYY-MM-DD
  count: number;
}

export function useAnalytics() {
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [exerciseProgress, setExerciseProgress] = useState<Map<number, ExerciseProgress>>(new Map());
  const [dailyWorkouts, setDailyWorkouts] = useState<DailyWorkoutCount[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalWorkouts: 0,
    totalVolume: 0,
    totalSets: 0,
    currentStreak: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Get weekly stats for the last N weeks
  const fetchWeeklyStats = useCallback(async (weeks = 8) => {
    try {
      const stats: WeeklyStats[] = [];
      const now = new Date();

      for (let i = 0; i < weeks; i++) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay() - i * 7);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);

        const weekWorkouts = await db
          .select({
            id: workouts.id,
          })
          .from(workouts)
          .where(
            and(
              gte(workouts.startedAt, weekStart),
              lte(workouts.startedAt, weekEnd)
            )
          );

        let totalVolume = 0;
        let totalSets = 0;
        let totalReps = 0;

        for (const workout of weekWorkouts) {
          const workoutSets = await db
            .select({
              reps: sets.reps,
              weight: sets.weight,
            })
            .from(sets)
            .where(eq(sets.workoutId, workout.id));

          workoutSets.forEach((set) => {
            totalSets++;
            if (set.reps) {
              totalReps += set.reps;
              if (set.weight) {
                totalVolume += set.reps * set.weight;
              }
            }
          });
        }

        stats.push({
          weekStart,
          totalWorkouts: weekWorkouts.length,
          totalVolume,
          totalSets,
          totalReps,
        });
      }

      setWeeklyStats(stats.reverse());
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
    }
  }, []);

  // Get progress for a specific exercise
  const fetchExerciseProgress = useCallback(async (exerciseId: number) => {
    try {
      const exerciseData = await db
        .select({
          id: exercises.id,
          name: exercises.name,
          category: exercises.category,
        })
        .from(exercises)
        .where(eq(exercises.id, exerciseId))
        .limit(1);

      if (exerciseData.length === 0) return null;

      const workoutData = await db
        .select({
          workoutId: workouts.id,
          startedAt: workouts.startedAt,
          weight: sets.weight,
          reps: sets.reps,
        })
        .from(workouts)
        .innerJoin(sets, eq(workouts.id, sets.workoutId))
        .where(eq(workouts.exerciseId, exerciseId))
        .orderBy(workouts.startedAt);

      // Group by workout date
      const dateMap = new Map<string, { maxWeight: number; totalVolume: number; date: Date }>();

      workoutData.forEach((row) => {
        const dateKey = row.startedAt.toISOString().split('T')[0];
        const existing = dateMap.get(dateKey);
        const volume = (row.weight || 0) * (row.reps || 0);

        if (!existing) {
          dateMap.set(dateKey, {
            maxWeight: row.weight || 0,
            totalVolume: volume,
            date: row.startedAt,
          });
        } else {
          existing.maxWeight = Math.max(existing.maxWeight, row.weight || 0);
          existing.totalVolume += volume;
        }
      });

      const progress: ExerciseProgress = {
        exerciseId,
        exerciseName: exerciseData[0].name,
        category: exerciseData[0].category,
        dataPoints: Array.from(dateMap.values()),
      };

      setExerciseProgress((prev) => new Map(prev).set(exerciseId, progress));
      return progress;
    } catch (error) {
      console.error('Error fetching exercise progress:', error);
      return null;
    }
  }, []);

  // Get daily workout counts for calendar heatmap
  const fetchDailyWorkouts = useCallback(async (days = 90) => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const workoutDates = await db
        .select({
          startedAt: workouts.startedAt,
        })
        .from(workouts)
        .where(gte(workouts.startedAt, startDate));

      // Count workouts per day
      const countMap = new Map<string, number>();

      workoutDates.forEach((w) => {
        const dateKey = w.startedAt.toISOString().split('T')[0];
        countMap.set(dateKey, (countMap.get(dateKey) || 0) + 1);
      });

      const daily: DailyWorkoutCount[] = Array.from(countMap.entries()).map(([date, count]) => ({
        date,
        count,
      }));

      setDailyWorkouts(daily);
    } catch (error) {
      console.error('Error fetching daily workouts:', error);
    }
  }, []);

  // Calculate total stats and streak
  const fetchTotalStats = useCallback(async () => {
    try {
      // Total workouts
      const allWorkouts = await db
        .select({
          id: workouts.id,
          startedAt: workouts.startedAt,
        })
        .from(workouts)
        .orderBy(desc(workouts.startedAt));

      // Total sets and volume
      const allSets = await db
        .select({
          reps: sets.reps,
          weight: sets.weight,
        })
        .from(sets);

      let totalVolume = 0;
      allSets.forEach((set) => {
        if (set.reps && set.weight) {
          totalVolume += set.reps * set.weight;
        }
      });

      // Calculate streak
      let streak = 0;
      if (allWorkouts.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get unique workout dates
        const workoutDates = new Set<string>();
        allWorkouts.forEach((w) => {
          workoutDates.add(w.startedAt.toISOString().split('T')[0]);
        });

        // Count consecutive days from today or yesterday
        let checkDate = new Date(today);
        const lastWorkoutDate = new Date(allWorkouts[0].startedAt);
        lastWorkoutDate.setHours(0, 0, 0, 0);

        // If last workout was not today or yesterday, streak is 0
        const diffDays = Math.floor((today.getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 1) {
          checkDate = lastWorkoutDate;
          while (workoutDates.has(checkDate.toISOString().split('T')[0])) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          }
        }
      }

      setTotalStats({
        totalWorkouts: allWorkouts.length,
        totalVolume,
        totalSets: allSets.length,
        currentStreak: streak,
      });
    } catch (error) {
      console.error('Error fetching total stats:', error);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchWeeklyStats(),
        fetchDailyWorkouts(),
        fetchTotalStats(),
      ]);
      setIsLoading(false);
    };

    fetchAll();
  }, [fetchWeeklyStats, fetchDailyWorkouts, fetchTotalStats]);

  return {
    weeklyStats,
    exerciseProgress,
    dailyWorkouts,
    totalStats,
    isLoading,
    fetchExerciseProgress,
    refresh: async () => {
      await Promise.all([
        fetchWeeklyStats(),
        fetchDailyWorkouts(),
        fetchTotalStats(),
      ]);
    },
  };
}

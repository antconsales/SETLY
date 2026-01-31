import { useCallback, useState } from 'react';
import { db } from '@/db/client';
import { workouts, exercises, sets } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export interface WorkoutWithDetails {
  id: number;
  exerciseName: string;
  exerciseCategory: string | null;
  completedAt: Date;
  totalDuration: number;
  totalSets: number;
}

export interface DayWorkouts {
  [dateKey: string]: WorkoutWithDetails[];
}

export function useWorkoutHistory() {
  const [workoutsByDay, setWorkoutsByDay] = useState<DayWorkouts>({});
  const [isLoading, setIsLoading] = useState(false);

  // Format date as YYYY-MM-DD for consistent keys
  const formatDateKey = useCallback((date: Date) => {
    return date.toISOString().split('T')[0];
  }, []);

  // Fetch workouts for a specific month
  const fetchMonthWorkouts = useCallback(async (year: number, month: number) => {
    setIsLoading(true);
    try {
      // Get start and end of month
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);

      // Fetch all workouts in this month with exercise details
      const result = await db
        .select({
          workoutId: workouts.id,
          exerciseName: exercises.name,
          exerciseCategory: exercises.category,
          completedAt: workouts.completedAt,
          totalDuration: workouts.totalDuration,
        })
        .from(workouts)
        .leftJoin(exercises, eq(workouts.exerciseId, exercises.id))
        .where(
          and(
            gte(workouts.completedAt, startDate),
            lte(workouts.completedAt, endDate)
          )
        )
        .orderBy(desc(workouts.completedAt));

      // Group by day and count sets
      const grouped: DayWorkouts = {};

      for (const workout of result) {
        if (!workout.completedAt) continue;

        const dateKey = formatDateKey(new Date(workout.completedAt));

        // Count sets for this workout
        const workoutSets = await db
          .select()
          .from(sets)
          .where(eq(sets.workoutId, workout.workoutId));

        const workoutWithDetails: WorkoutWithDetails = {
          id: workout.workoutId,
          exerciseName: workout.exerciseName || 'Unknown',
          exerciseCategory: workout.exerciseCategory,
          completedAt: new Date(workout.completedAt),
          totalDuration: workout.totalDuration || 0,
          totalSets: workoutSets.length,
        };

        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(workoutWithDetails);
      }

      setWorkoutsByDay(grouped);
    } catch (error) {
      console.error('Error fetching month workouts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [formatDateKey]);

  // Get workouts for a specific date
  const getWorkoutsForDate = useCallback((date: Date): WorkoutWithDetails[] => {
    const dateKey = formatDateKey(date);
    return workoutsByDay[dateKey] || [];
  }, [workoutsByDay, formatDateKey]);

  // Check if a date has workouts
  const hasWorkouts = useCallback((date: Date): boolean => {
    const dateKey = formatDateKey(date);
    return (workoutsByDay[dateKey]?.length || 0) > 0;
  }, [workoutsByDay, formatDateKey]);

  // Get workout count for a date
  const getWorkoutCount = useCallback((date: Date): number => {
    const dateKey = formatDateKey(date);
    return workoutsByDay[dateKey]?.length || 0;
  }, [workoutsByDay, formatDateKey]);

  return {
    workoutsByDay,
    isLoading,
    fetchMonthWorkouts,
    getWorkoutsForDate,
    hasWorkouts,
    getWorkoutCount,
    formatDateKey,
  };
}

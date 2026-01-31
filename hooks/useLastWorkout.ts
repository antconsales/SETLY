import { useEffect, useState, useCallback } from 'react';
import { db } from '@/db/client';
import { workouts, exercises, sets } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

interface LastWorkoutInfo {
  exerciseName: string;
  when: string;
  totalSets: number;
  avgRestTime: string;
}

export function useLastWorkout() {
  const [lastWorkout, setLastWorkout] = useState<LastWorkoutInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLastWorkout = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get the most recent workout with exercise info
      const result = await db
        .select({
          workoutId: workouts.id,
          exerciseName: exercises.name,
          completedAt: workouts.completedAt,
          totalDuration: workouts.totalDuration,
        })
        .from(workouts)
        .leftJoin(exercises, eq(workouts.exerciseId, exercises.id))
        .orderBy(desc(workouts.completedAt))
        .limit(1);

      if (result.length === 0) {
        setLastWorkout(null);
        setIsLoading(false);
        return;
      }

      const workout = result[0];

      // Get sets for this workout
      const workoutSets = await db
        .select()
        .from(sets)
        .where(eq(sets.workoutId, workout.workoutId));

      // Calculate average rest time
      const restTimes = workoutSets
        .filter((s) => s.restAfter != null)
        .map((s) => s.restAfter!);
      const avgRest =
        restTimes.length > 0
          ? Math.round(restTimes.reduce((a, b) => a + b, 0) / restTimes.length)
          : 0;

      // Format "when"
      const completedDate = workout.completedAt
        ? new Date(workout.completedAt)
        : new Date();
      const now = new Date();
      const diffDays = Math.floor(
        (now.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let when = 'Today';
      if (diffDays === 1) when = 'Yesterday';
      else if (diffDays > 1 && diffDays < 7) when = `${diffDays} days ago`;
      else if (diffDays >= 7) when = completedDate.toLocaleDateString();

      setLastWorkout({
        exerciseName: workout.exerciseName || 'Unknown',
        when,
        totalSets: workoutSets.length,
        avgRestTime: `${avgRest}s`,
      });
    } catch (error) {
      console.error('Error fetching last workout:', error);
      setLastWorkout(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLastWorkout();
  }, [fetchLastWorkout]);

  return { lastWorkout, isLoading, refetch: fetchLastWorkout };
}

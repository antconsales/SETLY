import { useState, useEffect } from 'react';
import { db } from '@/db/client';
import { workouts, sets, exercises } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface WorkoutDetails {
  id: number;
  exerciseName: string;
  startedAt: Date;
  completedAt: Date | null;
  totalDuration: number | null;
  sets: {
    setNumber: number;
    reps: number | null;
    weight: number | null;
    duration: number | null;
  }[];
  totalVolume: number;
  totalReps: number;
}

export function useWorkoutDetails(workoutId: number | null) {
  const [workout, setWorkout] = useState<WorkoutDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!workoutId) {
      setIsLoading(false);
      return;
    }

    const fetchWorkout = async () => {
      try {
        // Get workout with exercise name
        const workoutData = await db
          .select({
            id: workouts.id,
            exerciseId: workouts.exerciseId,
            startedAt: workouts.startedAt,
            completedAt: workouts.completedAt,
            totalDuration: workouts.totalDuration,
            exerciseName: exercises.name,
          })
          .from(workouts)
          .leftJoin(exercises, eq(workouts.exerciseId, exercises.id))
          .where(eq(workouts.id, workoutId))
          .limit(1);

        if (workoutData.length === 0) {
          setWorkout(null);
          setIsLoading(false);
          return;
        }

        // Get sets
        const setsData = await db
          .select({
            setNumber: sets.setNumber,
            reps: sets.reps,
            weight: sets.weight,
            duration: sets.duration,
          })
          .from(sets)
          .where(eq(sets.workoutId, workoutId))
          .orderBy(sets.setNumber);

        // Calculate totals
        let totalVolume = 0;
        let totalReps = 0;

        setsData.forEach((set) => {
          if (set.reps) {
            totalReps += set.reps;
            if (set.weight) {
              totalVolume += set.reps * set.weight;
            }
          }
        });

        setWorkout({
          id: workoutData[0].id,
          exerciseName: workoutData[0].exerciseName || 'Workout',
          startedAt: workoutData[0].startedAt,
          completedAt: workoutData[0].completedAt,
          totalDuration: workoutData[0].totalDuration,
          sets: setsData,
          totalVolume,
          totalReps,
        });
      } catch (error) {
        console.error('Error fetching workout details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkout();
  }, [workoutId]);

  return { workout, isLoading };
}

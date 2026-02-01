import { useState, useEffect, useCallback } from 'react';
import { db } from '@/db/client';
import { workouts, sets, exercises } from '@/db/schema';
import { eq, desc, and, isNotNull } from 'drizzle-orm';

export interface PersonalRecord {
  exerciseId: number;
  exerciseName: string;
  maxWeight: number;
  maxWeightReps: number;
  maxVolume: number; // weight * reps in a single set
  maxVolumeWeight: number;
  maxVolumeReps: number;
  achievedAt: Date;
}

export interface PRCheck {
  isNewWeightPR: boolean;
  isNewVolumePR: boolean;
  previousMaxWeight: number | null;
  previousMaxVolume: number | null;
}

export function usePersonalRecords(exerciseId?: number) {
  const [records, setRecords] = useState<Map<number, PersonalRecord>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all PRs or for a specific exercise
  const fetchRecords = useCallback(async () => {
    try {
      // Get all sets with weight, grouped by exercise
      const query = db
        .select({
          exerciseId: workouts.exerciseId,
          exerciseName: exercises.name,
          weight: sets.weight,
          reps: sets.reps,
          completedAt: sets.completedAt,
        })
        .from(sets)
        .innerJoin(workouts, eq(sets.workoutId, workouts.id))
        .innerJoin(exercises, eq(workouts.exerciseId, exercises.id))
        .where(
          exerciseId
            ? and(eq(workouts.exerciseId, exerciseId), isNotNull(sets.weight))
            : isNotNull(sets.weight)
        );

      const allSets = await query;

      // Process sets to find PRs per exercise
      const prMap = new Map<number, PersonalRecord>();

      allSets.forEach((set) => {
        if (!set.exerciseId || !set.weight) return;

        const volume = set.weight * (set.reps || 1);
        const existing = prMap.get(set.exerciseId);

        if (!existing) {
          prMap.set(set.exerciseId, {
            exerciseId: set.exerciseId,
            exerciseName: set.exerciseName || 'Unknown',
            maxWeight: set.weight,
            maxWeightReps: set.reps || 1,
            maxVolume: volume,
            maxVolumeWeight: set.weight,
            maxVolumeReps: set.reps || 1,
            achievedAt: set.completedAt || new Date(),
          });
        } else {
          // Check for new max weight
          if (set.weight > existing.maxWeight) {
            existing.maxWeight = set.weight;
            existing.maxWeightReps = set.reps || 1;
            existing.achievedAt = set.completedAt || new Date();
          }
          // Check for new max volume
          if (volume > existing.maxVolume) {
            existing.maxVolume = volume;
            existing.maxVolumeWeight = set.weight;
            existing.maxVolumeReps = set.reps || 1;
          }
        }
      });

      setRecords(prMap);
    } catch (error) {
      console.error('Error fetching personal records:', error);
    } finally {
      setIsLoading(false);
    }
  }, [exerciseId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Check if a set beats the current PR
  const checkPR = useCallback(
    (exerciseId: number, weight: number, reps: number): PRCheck => {
      const currentPR = records.get(exerciseId);
      const volume = weight * reps;

      if (!currentPR) {
        // First recorded set with weight for this exercise - it's a PR!
        return {
          isNewWeightPR: true,
          isNewVolumePR: true,
          previousMaxWeight: null,
          previousMaxVolume: null,
        };
      }

      return {
        isNewWeightPR: weight > currentPR.maxWeight,
        isNewVolumePR: volume > currentPR.maxVolume,
        previousMaxWeight: currentPR.maxWeight,
        previousMaxVolume: currentPR.maxVolume,
      };
    },
    [records]
  );

  // Get PR for a specific exercise
  const getPR = useCallback(
    (exerciseId: number): PersonalRecord | undefined => {
      return records.get(exerciseId);
    },
    [records]
  );

  // Get all PRs as array
  const getAllPRs = useCallback((): PersonalRecord[] => {
    return Array.from(records.values());
  }, [records]);

  return {
    records,
    isLoading,
    checkPR,
    getPR,
    getAllPRs,
    refresh: fetchRecords,
  };
}

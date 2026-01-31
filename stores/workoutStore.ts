import { create } from 'zustand';
import { db } from '@/db/client';
import { workouts, sets } from '@/db/schema';
import type { SetData, WorkoutSession } from '@/types';

interface WorkoutState {
  // Current workout session
  session: WorkoutSession | null;

  // Timer state
  timerSeconds: number;
  isRunning: boolean;

  // Actions
  startWorkout: (exerciseId: number, exerciseName: string, plannedSets: number) => void;
  endSet: (duration: number, reps?: number, weight?: number) => void;
  startRest: () => void;
  endRest: () => void;
  tickTimer: () => void;
  resetTimer: () => void;
  finishWorkout: () => Promise<number | null>; // Returns workout ID
  cancelWorkout: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  session: null,
  timerSeconds: 0,
  isRunning: false,

  startWorkout: (exerciseId, exerciseName, plannedSets) => {
    set({
      session: {
        exerciseId,
        exerciseName,
        startedAt: new Date(),
        sets: [],
        isResting: false,
        currentSetIndex: 0,
        plannedSets,
      },
      timerSeconds: 0,
      isRunning: true,
    });
  },

  endSet: (duration, reps, weight) => {
    const { session } = get();
    if (!session) return;

    const newSet: SetData = {
      setNumber: session.sets.length + 1,
      duration,
      reps,
      weight,
      completedAt: new Date(),
    };

    set({
      session: {
        ...session,
        sets: [...session.sets, newSet],
        isResting: true,
      },
      timerSeconds: 0,
      isRunning: true,
    });
  },

  startRest: () => {
    const { session } = get();
    if (!session) return;

    set({
      session: {
        ...session,
        isResting: true,
      },
      timerSeconds: 0,
      isRunning: true,
    });
  },

  endRest: () => {
    const { session } = get();
    if (!session) return;

    // Update last set with rest duration
    const updatedSets = [...session.sets];
    if (updatedSets.length > 0) {
      updatedSets[updatedSets.length - 1].restAfter = get().timerSeconds;
    }

    set({
      session: {
        ...session,
        sets: updatedSets,
        isResting: false,
        currentSetIndex: session.currentSetIndex + 1,
      },
      timerSeconds: 0,
      isRunning: true,
    });
  },

  tickTimer: () => {
    set((state) => ({
      timerSeconds: state.timerSeconds + 1,
    }));
  },

  resetTimer: () => {
    set({ timerSeconds: 0 });
  },

  finishWorkout: async () => {
    const { session } = get();
    if (!session) return null;

    try {
      // Calculate total duration
      const totalDuration = session.sets.reduce(
        (acc, s) => acc + s.duration + (s.restAfter || 0),
        0
      );

      // Insert workout
      const [workout] = await db
        .insert(workouts)
        .values({
          exerciseId: session.exerciseId,
          startedAt: session.startedAt,
          completedAt: new Date(),
          totalDuration,
        })
        .returning();

      // Insert all sets
      if (session.sets.length > 0) {
        await db.insert(sets).values(
          session.sets.map((s) => ({
            workoutId: workout.id,
            setNumber: s.setNumber,
            reps: s.reps,
            weight: s.weight,
            duration: s.duration,
            restAfter: s.restAfter,
            completedAt: s.completedAt,
          }))
        );
      }

      // Reset state
      set({
        session: null,
        timerSeconds: 0,
        isRunning: false,
      });

      return workout.id;
    } catch (error) {
      console.error('Error saving workout:', error);
      return null;
    }
  },

  cancelWorkout: () => {
    set({
      session: null,
      timerSeconds: 0,
      isRunning: false,
    });
  },
}));

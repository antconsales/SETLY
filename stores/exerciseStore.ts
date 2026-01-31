import { create } from 'zustand';
import { db } from '@/db/client';
import { exercises } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { Exercise } from '@/types';

interface ExerciseState {
  exercises: Exercise[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchExercises: () => Promise<void>;
  addExercise: (name: string, category?: string) => Promise<Exercise | null>;
  deleteExercise: (id: number) => Promise<void>;
}

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  exercises: [],
  isLoading: false,
  error: null,

  fetchExercises: async () => {
    set({ isLoading: true, error: null });
    try {
      const result = await db.select().from(exercises);
      set({ exercises: result, isLoading: false });
    } catch (error) {
      console.error('Error fetching exercises:', error);
      set({ error: 'Failed to load exercises', isLoading: false });
    }
  },

  addExercise: async (name, category) => {
    try {
      const [newExercise] = await db
        .insert(exercises)
        .values({
          name,
          category,
          isCustom: true,
        })
        .returning();

      set((state) => ({
        exercises: [...state.exercises, newExercise],
      }));

      return newExercise;
    } catch (error) {
      console.error('Error adding exercise:', error);
      return null;
    }
  },

  deleteExercise: async (id) => {
    try {
      await db.delete(exercises).where(eq(exercises.id, id));
      set((state) => ({
        exercises: state.exercises.filter((e) => e.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting exercise:', error);
    }
  },
}));

import { create } from 'zustand';
import { db } from '@/db/client';
import { scheduledWorkouts, exercises } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import {
  scheduleWorkoutNotification,
  cancelWorkoutNotification,
  requestNotificationPermissions,
} from '@/lib/notifications';

export interface ScheduledWorkoutWithDetails {
  id: number;
  exerciseId: number;
  exerciseName: string;
  scheduledFor: Date;
  plannedSets: number | null;
  completed: boolean;
  notificationId: string | null;
}

interface ScheduleState {
  scheduledWorkouts: ScheduledWorkoutWithDetails[];
  isLoading: boolean;
  notificationsEnabled: boolean;

  // Actions
  fetchScheduledWorkouts: (startDate?: Date, endDate?: Date) => Promise<void>;
  scheduleWorkout: (
    exerciseId: number,
    scheduledFor: Date,
    plannedSets?: number
  ) => Promise<number | null>;
  cancelScheduledWorkout: (id: number) => Promise<void>;
  markAsCompleted: (id: number, workoutId: number) => Promise<void>;
  enableNotifications: () => Promise<boolean>;
}

// Store notification IDs in memory (would use MMKV in production)
const notificationIds: Map<number, string> = new Map();

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  scheduledWorkouts: [],
  isLoading: false,
  notificationsEnabled: false,

  fetchScheduledWorkouts: async (startDate, endDate) => {
    set({ isLoading: true });
    try {
      let query = db
        .select({
          id: scheduledWorkouts.id,
          exerciseId: scheduledWorkouts.exerciseId,
          exerciseName: exercises.name,
          scheduledFor: scheduledWorkouts.scheduledFor,
          plannedSets: scheduledWorkouts.plannedSets,
          completed: scheduledWorkouts.completed,
        })
        .from(scheduledWorkouts)
        .leftJoin(exercises, eq(scheduledWorkouts.exerciseId, exercises.id))
        .orderBy(desc(scheduledWorkouts.scheduledFor));

      // Add date filters if provided
      const conditions = [];
      if (startDate) {
        conditions.push(gte(scheduledWorkouts.scheduledFor, startDate));
      }
      if (endDate) {
        conditions.push(lte(scheduledWorkouts.scheduledFor, endDate));
      }

      const result = conditions.length > 0
        ? await query.where(and(...conditions))
        : await query;

      const workouts: ScheduledWorkoutWithDetails[] = result.map((w) => ({
        id: w.id,
        exerciseId: w.exerciseId!,
        exerciseName: w.exerciseName || 'Unknown',
        scheduledFor: new Date(w.scheduledFor!),
        plannedSets: w.plannedSets,
        completed: w.completed || false,
        notificationId: notificationIds.get(w.id) || null,
      }));

      set({ scheduledWorkouts: workouts, isLoading: false });
    } catch (error) {
      console.error('Error fetching scheduled workouts:', error);
      set({ isLoading: false });
    }
  },

  scheduleWorkout: async (exerciseId, scheduledFor, plannedSets) => {
    try {
      // Insert into database
      const [scheduled] = await db
        .insert(scheduledWorkouts)
        .values({
          exerciseId,
          scheduledFor,
          plannedSets,
          completed: false,
        })
        .returning();

      // Get exercise name for notification
      const [exercise] = await db
        .select()
        .from(exercises)
        .where(eq(exercises.id, exerciseId));

      // Schedule notification if enabled
      const { notificationsEnabled } = get();
      if (notificationsEnabled && exercise) {
        const notificationId = await scheduleWorkoutNotification(
          exercise.name,
          scheduledFor,
          scheduled.id
        );
        if (notificationId) {
          notificationIds.set(scheduled.id, notificationId);
        }
      }

      // Refresh list
      await get().fetchScheduledWorkouts();

      return scheduled.id;
    } catch (error) {
      console.error('Error scheduling workout:', error);
      return null;
    }
  },

  cancelScheduledWorkout: async (id) => {
    try {
      // Cancel notification if exists
      const notificationId = notificationIds.get(id);
      if (notificationId) {
        await cancelWorkoutNotification(notificationId);
        notificationIds.delete(id);
      }

      // Delete from database
      await db.delete(scheduledWorkouts).where(eq(scheduledWorkouts.id, id));

      // Update state
      set((state) => ({
        scheduledWorkouts: state.scheduledWorkouts.filter((w) => w.id !== id),
      }));
    } catch (error) {
      console.error('Error cancelling scheduled workout:', error);
    }
  },

  markAsCompleted: async (id, workoutId) => {
    try {
      // Cancel notification if exists
      const notificationId = notificationIds.get(id);
      if (notificationId) {
        await cancelWorkoutNotification(notificationId);
        notificationIds.delete(id);
      }

      // Update database
      await db
        .update(scheduledWorkouts)
        .set({ completed: true, workoutId })
        .where(eq(scheduledWorkouts.id, id));

      // Update state
      set((state) => ({
        scheduledWorkouts: state.scheduledWorkouts.map((w) =>
          w.id === id ? { ...w, completed: true } : w
        ),
      }));
    } catch (error) {
      console.error('Error marking workout as completed:', error);
    }
  },

  enableNotifications: async () => {
    const granted = await requestNotificationPermissions();
    set({ notificationsEnabled: granted });
    return granted;
  },
}));

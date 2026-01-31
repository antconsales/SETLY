import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Esercizi predefiniti e custom
export const exercises = sqliteTable('exercises', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  category: text('category'), // push, pull, legs, core, cardio
  isCustom: integer('is_custom', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Allenamenti completati
export const workouts = sqliteTable('workouts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  exerciseId: integer('exercise_id').references(() => exercises.id),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  totalDuration: integer('total_duration'), // seconds
  notes: text('notes'),
});

// Set di ogni allenamento
export const sets = sqliteTable('sets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workoutId: integer('workout_id').references(() => workouts.id),
  setNumber: integer('set_number').notNull(),
  reps: integer('reps'),
  weight: real('weight'),
  duration: integer('duration'), // seconds (per esercizi a tempo)
  restAfter: integer('rest_after'), // seconds
  completedAt: integer('completed_at', { mode: 'timestamp' }),
});

// Allenamenti programmati
export const scheduledWorkouts = sqliteTable('scheduled_workouts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  exerciseId: integer('exercise_id').references(() => exercises.id),
  scheduledFor: integer('scheduled_for', { mode: 'timestamp' }).notNull(),
  plannedSets: integer('planned_sets'),
  completed: integer('completed', { mode: 'boolean' }).default(false),
  workoutId: integer('workout_id').references(() => workouts.id),
});

// Foto allenamento (paths locali)
export const workoutPhotos = sqliteTable('workout_photos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workoutId: integer('workout_id').references(() => workouts.id),
  localPath: text('local_path').notNull(),
  takenAt: integer('taken_at', { mode: 'timestamp' }),
});

// TypeScript types derivati dallo schema
export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
export type Workout = typeof workouts.$inferSelect;
export type NewWorkout = typeof workouts.$inferInsert;
export type Set = typeof sets.$inferSelect;
export type NewSet = typeof sets.$inferInsert;
export type ScheduledWorkout = typeof scheduledWorkouts.$inferSelect;
export type NewScheduledWorkout = typeof scheduledWorkouts.$inferInsert;
export type WorkoutPhoto = typeof workoutPhotos.$inferSelect;
export type NewWorkoutPhoto = typeof workoutPhotos.$inferInsert;

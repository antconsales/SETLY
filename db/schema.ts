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

// Workout templates
export const workoutTemplates = sqliteTable('workout_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Esercizi nel template
export const templateExercises = sqliteTable('template_exercises', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  templateId: integer('template_id').references(() => workoutTemplates.id),
  exerciseId: integer('exercise_id').references(() => exercises.id),
  orderIndex: integer('order_index').notNull(),
  targetSets: integer('target_sets').default(4),
  targetReps: integer('target_reps'),
  targetWeight: real('target_weight'),
});

// User stats for gamification
export const userStats = sqliteTable('user_stats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  currentStreak: integer('current_streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  totalWorkouts: integer('total_workouts').default(0),
  totalVolume: real('total_volume').default(0),
  totalXP: integer('total_xp').default(0),
  level: integer('level').default(1),
  lastWorkoutDate: integer('last_workout_date', { mode: 'timestamp' }),
});

// Achievements
export const achievements = sqliteTable('achievements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  xpReward: integer('xp_reward').default(0),
  unlockedAt: integer('unlocked_at', { mode: 'timestamp' }),
  isUnlocked: integer('is_unlocked', { mode: 'boolean' }).default(false),
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
export type WorkoutTemplate = typeof workoutTemplates.$inferSelect;
export type NewWorkoutTemplate = typeof workoutTemplates.$inferInsert;
export type TemplateExercise = typeof templateExercises.$inferSelect;
export type NewTemplateExercise = typeof templateExercises.$inferInsert;
export type UserStats = typeof userStats.$inferSelect;
export type NewUserStats = typeof userStats.$inferInsert;
export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;

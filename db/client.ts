import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

// Open database connection
const expo = SQLite.openDatabaseSync('setly.db');
export const db = drizzle(expo, { schema });

// Default exercises to seed
const defaultExercises = [
  { name: 'Push-ups', category: 'push', isCustom: false },
  { name: 'Squats', category: 'legs', isCustom: false },
  { name: 'Pull-ups', category: 'pull', isCustom: false },
  { name: 'Deadlift', category: 'pull', isCustom: false },
  { name: 'Bench Press', category: 'push', isCustom: false },
  { name: 'Plank', category: 'core', isCustom: false },
  { name: 'Lunges', category: 'legs', isCustom: false },
  { name: 'Rows', category: 'pull', isCustom: false },
  { name: 'Shoulder Press', category: 'push', isCustom: false },
  { name: 'Crunches', category: 'core', isCustom: false },
];

// Create tables using raw SQL
function createTables() {
  // Exercises table
  expo.execSync(`
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      is_custom INTEGER DEFAULT 0,
      created_at INTEGER
    );
  `);

  // Workouts table
  expo.execSync(`
    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id INTEGER REFERENCES exercises(id),
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      total_duration INTEGER,
      notes TEXT
    );
  `);

  // Sets table
  expo.execSync(`
    CREATE TABLE IF NOT EXISTS sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER REFERENCES workouts(id),
      set_number INTEGER NOT NULL,
      reps INTEGER,
      weight REAL,
      duration INTEGER,
      rest_after INTEGER,
      completed_at INTEGER
    );
  `);

  // Scheduled workouts table
  expo.execSync(`
    CREATE TABLE IF NOT EXISTS scheduled_workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id INTEGER REFERENCES exercises(id),
      scheduled_for INTEGER NOT NULL,
      planned_sets INTEGER,
      completed INTEGER DEFAULT 0,
      workout_id INTEGER REFERENCES workouts(id)
    );
  `);

  // Workout photos table
  expo.execSync(`
    CREATE TABLE IF NOT EXISTS workout_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER REFERENCES workouts(id),
      local_path TEXT NOT NULL,
      taken_at INTEGER
    );
  `);

  // Workout templates table
  expo.execSync(`
    CREATE TABLE IF NOT EXISTS workout_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      is_default INTEGER DEFAULT 0,
      created_at INTEGER
    );
  `);

  // Template exercises table
  expo.execSync(`
    CREATE TABLE IF NOT EXISTS template_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER REFERENCES workout_templates(id),
      exercise_id INTEGER REFERENCES exercises(id),
      order_index INTEGER NOT NULL,
      target_sets INTEGER DEFAULT 4,
      target_reps INTEGER,
      target_weight REAL
    );
  `);

  // User stats table
  expo.execSync(`
    CREATE TABLE IF NOT EXISTS user_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      total_workouts INTEGER DEFAULT 0,
      total_volume REAL DEFAULT 0,
      total_xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      last_workout_date INTEGER
    );
  `);

  // Achievements table
  expo.execSync(`
    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      xp_reward INTEGER DEFAULT 0,
      unlocked_at INTEGER,
      is_unlocked INTEGER DEFAULT 0
    );
  `);

  console.log('Database tables created');
}

// Seed default exercises
export async function seedExercises() {
  const existing = await db.select().from(schema.exercises);

  if (existing.length === 0) {
    for (const exercise of defaultExercises) {
      await db.insert(schema.exercises).values(exercise);
    }
    console.log('Default exercises seeded');
  }
}

// Default workout templates
const defaultTemplates = [
  {
    name: 'Push Day',
    description: 'Chest, shoulders, and triceps',
    exercises: ['Bench Press', 'Shoulder Press', 'Push-ups'],
  },
  {
    name: 'Pull Day',
    description: 'Back and biceps',
    exercises: ['Pull-ups', 'Rows', 'Deadlift'],
  },
  {
    name: 'Leg Day',
    description: 'Quads, hamstrings, and glutes',
    exercises: ['Squats', 'Lunges', 'Deadlift'],
  },
  {
    name: 'Full Body',
    description: 'Complete full body workout',
    exercises: ['Squats', 'Bench Press', 'Rows', 'Shoulder Press', 'Plank'],
  },
  {
    name: 'Core Focus',
    description: 'Abs and core stability',
    exercises: ['Plank', 'Crunches'],
  },
];

// Seed default templates
export async function seedTemplates() {
  const existing = await db.select().from(schema.workoutTemplates);

  if (existing.length === 0) {
    // Get all exercises to map names to IDs
    const allExercises = await db.select().from(schema.exercises);
    const exerciseMap = new Map(allExercises.map((e) => [e.name, e.id]));

    for (const template of defaultTemplates) {
      // Insert template
      const [inserted] = await db
        .insert(schema.workoutTemplates)
        .values({
          name: template.name,
          description: template.description,
          isDefault: true,
        })
        .returning();

      // Insert template exercises
      for (let i = 0; i < template.exercises.length; i++) {
        const exerciseId = exerciseMap.get(template.exercises[i]);
        if (exerciseId) {
          await db.insert(schema.templateExercises).values({
            templateId: inserted.id,
            exerciseId,
            orderIndex: i,
            targetSets: 4,
            targetReps: 10,
          });
        }
      }
    }
    console.log('Default templates seeded');
  }
}

// Default achievements
const defaultAchievements = [
  { key: 'first_workout', name: 'First Steps', description: 'Complete your first workout', xpReward: 50 },
  { key: 'streak_3', name: 'Consistent', description: 'Maintain a 3-day streak', xpReward: 100 },
  { key: 'streak_7', name: 'Week Warrior', description: 'Maintain a 7-day streak', xpReward: 250 },
  { key: 'streak_30', name: 'Monthly Master', description: 'Maintain a 30-day streak', xpReward: 1000 },
  { key: 'workouts_10', name: 'Getting Started', description: 'Complete 10 workouts', xpReward: 150 },
  { key: 'workouts_50', name: 'Dedicated', description: 'Complete 50 workouts', xpReward: 500 },
  { key: 'workouts_100', name: 'Century', description: 'Complete 100 workouts', xpReward: 1000 },
  { key: 'volume_1000', name: 'Ton Lifter', description: 'Lift 1,000 kg total volume', xpReward: 200 },
  { key: 'volume_10000', name: '10K Club', description: 'Lift 10,000 kg total volume', xpReward: 500 },
  { key: 'first_pr', name: 'Personal Best', description: 'Set your first Personal Record', xpReward: 100 },
  { key: 'morning_workout', name: 'Early Bird', description: 'Complete a workout before 7 AM', xpReward: 75 },
  { key: 'night_workout', name: 'Night Owl', description: 'Complete a workout after 10 PM', xpReward: 75 },
];

// Seed achievements and user stats
export async function seedGamification() {
  // Seed achievements
  const existingAchievements = await db.select().from(schema.achievements);
  if (existingAchievements.length === 0) {
    for (const achievement of defaultAchievements) {
      await db.insert(schema.achievements).values({
        key: achievement.key,
        name: achievement.name,
        description: achievement.description,
        xpReward: achievement.xpReward,
        isUnlocked: false,
      });
    }
    console.log('Default achievements seeded');
  }

  // Initialize user stats if not exists
  const existingStats = await db.select().from(schema.userStats);
  if (existingStats.length === 0) {
    await db.insert(schema.userStats).values({
      currentStreak: 0,
      longestStreak: 0,
      totalWorkouts: 0,
      totalVolume: 0,
      totalXP: 0,
      level: 1,
    });
    console.log('User stats initialized');
  }
}

// Initialize database - create tables, run migrations, and seed
export async function initDatabase() {
  try {
    // Create tables first (synchronous)
    createTables();

    // Run any pending migrations
    const { runMigrations } = require('./migrations/migrate');
    const applied = runMigrations(expo);
    if (applied > 0) {
      console.log(`Applied ${applied} migration(s)`);
    }

    // Then seed default data
    await seedExercises();
    await seedTemplates();
    await seedGamification();
    console.log('Database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

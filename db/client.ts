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

// Initialize database - create tables and seed
export async function initDatabase() {
  try {
    // Create tables first (synchronous)
    createTables();
    // Then seed default data
    await seedExercises();
    console.log('Database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

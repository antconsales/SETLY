/**
 * Database Migration System for SETLY
 *
 * Runs versioned migrations on app startup.
 * Each migration runs once and is tracked in a migrations table.
 */

import * as SQLite from 'expo-sqlite';

interface Migration {
  version: number;
  name: string;
  up: (db: SQLite.SQLiteDatabase) => void;
}

// Define migrations in order. Each runs exactly once.
const migrations: Migration[] = [
  // Example migration for future schema changes:
  // {
  //   version: 1,
  //   name: 'add_workout_notes_column',
  //   up: (db) => {
  //     db.execSync(`ALTER TABLE workouts ADD COLUMN rating INTEGER;`);
  //   },
  // },
];

/**
 * Ensures the migrations tracking table exists.
 */
function ensureMigrationsTable(db: SQLite.SQLiteDatabase) {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    );
  `);
}

/**
 * Gets the current schema version (highest applied migration).
 */
function getCurrentVersion(db: SQLite.SQLiteDatabase): number {
  const result = db.getFirstSync<{ max_version: number | null }>(
    'SELECT MAX(version) as max_version FROM _migrations'
  );
  return result?.max_version ?? 0;
}

/**
 * Runs all pending migrations in order.
 * Returns the number of migrations applied.
 */
export function runMigrations(db: SQLite.SQLiteDatabase): number {
  ensureMigrationsTable(db);

  const currentVersion = getCurrentVersion(db);
  const pending = migrations.filter((m) => m.version > currentVersion);

  if (pending.length === 0) {
    return 0;
  }

  // Sort by version to ensure order
  pending.sort((a, b) => a.version - b.version);

  let applied = 0;

  for (const migration of pending) {
    try {
      // Run the migration
      migration.up(db);

      // Record it
      db.runSync(
        'INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?)',
        migration.version,
        migration.name,
        Date.now()
      );

      console.log(`[Migration] Applied v${migration.version}: ${migration.name}`);
      applied++;
    } catch (error) {
      console.error(
        `[Migration] Failed v${migration.version}: ${migration.name}`,
        error
      );
      throw error;
    }
  }

  return applied;
}

export { migrations };

import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { db } from '@/db/client';
import { exercises, workouts, sets, userStats, achievements } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { ExportData } from './export';

/**
 * Validates that imported data has the expected structure.
 */
function validateImportData(data: unknown): data is ExportData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;

  if (typeof d.version !== 'string') return false;
  if (!Array.isArray(d.workouts)) return false;

  // Validate each workout has required fields
  for (const w of d.workouts) {
    if (typeof w !== 'object' || w === null) return false;
    if (typeof (w as Record<string, unknown>).exerciseName !== 'string') return false;
    if (typeof (w as Record<string, unknown>).startedAt !== 'string') return false;
    if (!Array.isArray((w as Record<string, unknown>).sets)) return false;
  }

  return true;
}

export interface ImportResult {
  success: boolean;
  exercisesImported: number;
  workoutsImported: number;
  setsImported: number;
  error?: string;
}

/**
 * Picks a JSON file from device and imports SETLY data.
 * Merges data — does not overwrite existing workouts.
 */
export async function pickAndImportJSON(): Promise<ImportResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) {
    return {
      success: false,
      exercisesImported: 0,
      workoutsImported: 0,
      setsImported: 0,
      error: 'Nessun file selezionato',
    };
  }

  const fileUri = result.assets[0].uri;
  const content = await FileSystem.readAsStringAsync(fileUri);

  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    return {
      success: false,
      exercisesImported: 0,
      workoutsImported: 0,
      setsImported: 0,
      error: 'Il file non contiene JSON valido',
    };
  }

  if (!validateImportData(data)) {
    return {
      success: false,
      exercisesImported: 0,
      workoutsImported: 0,
      setsImported: 0,
      error: 'Il formato del file non è compatibile con SETLY',
    };
  }

  return importData(data);
}

/**
 * Imports validated SETLY export data into the database.
 * Uses a merge strategy: skips exercises that already exist,
 * imports all workouts (they'll have new IDs).
 */
async function importData(data: ExportData): Promise<ImportResult> {
  let exercisesImported = 0;
  let workoutsImported = 0;
  let setsImported = 0;

  try {
    // Step 1: Import/resolve exercises
    const existingExercises = await db.select().from(exercises);
    const exerciseNameToId = new Map(existingExercises.map((e) => [e.name, e.id]));

    for (const w of data.workouts) {
      if (!exerciseNameToId.has(w.exerciseName)) {
        const [inserted] = await db
          .insert(exercises)
          .values({
            name: w.exerciseName,
            category: w.exerciseCategory,
            isCustom: true,
          })
          .returning();
        exerciseNameToId.set(w.exerciseName, inserted.id);
        exercisesImported++;
      }
    }

    // Step 2: Import workouts and sets
    for (const w of data.workouts) {
      const exerciseId = exerciseNameToId.get(w.exerciseName);
      if (!exerciseId) continue;

      const [insertedWorkout] = await db
        .insert(workouts)
        .values({
          exerciseId,
          startedAt: new Date(w.startedAt),
          completedAt: w.completedAt ? new Date(w.completedAt) : null,
          totalDuration: w.totalDuration,
        })
        .returning();

      workoutsImported++;

      // Import sets
      for (const s of w.sets) {
        await db.insert(sets).values({
          workoutId: insertedWorkout.id,
          setNumber: s.setNumber,
          reps: s.reps,
          weight: s.weight,
          duration: s.duration,
        });
        setsImported++;
      }
    }

    // Step 3: Update stats if present
    if (data.stats) {
      const existingStats = await db.select().from(userStats).limit(1);
      if (existingStats.length > 0) {
        const current = existingStats[0];
        await db
          .update(userStats)
          .set({
            totalWorkouts: (current.totalWorkouts || 0) + workoutsImported,
            totalVolume:
              (current.totalVolume || 0) +
              data.workouts.reduce(
                (sum, w) =>
                  sum +
                  w.sets.reduce((s, set) => s + (set.reps || 0) * (set.weight || 0), 0),
                0
              ),
          })
          .where(eq(userStats.id, current.id));
      }
    }

    return {
      success: true,
      exercisesImported,
      workoutsImported,
      setsImported,
    };
  } catch (error) {
    return {
      success: false,
      exercisesImported,
      workoutsImported,
      setsImported,
      error: error instanceof Error ? error.message : 'Errore durante l\'importazione',
    };
  }
}

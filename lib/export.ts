import * as FileSystem from 'expo-file-system';
import { documentDirectory } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { db } from '@/db/client';
import { workouts, sets, exercises, userStats, achievements } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface ExportData {
  version: string;
  exportedAt: string;
  workouts: {
    id: number;
    exerciseName: string;
    exerciseCategory: string | null;
    startedAt: string;
    completedAt: string | null;
    totalDuration: number | null;
    sets: {
      setNumber: number;
      reps: number | null;
      weight: number | null;
      duration: number | null;
    }[];
  }[];
  stats: {
    totalWorkouts: number;
    totalVolume: number;
    currentStreak: number;
    longestStreak: number;
    level: number;
    totalXP: number;
  };
  achievements: {
    name: string;
    description: string | null;
    isUnlocked: boolean;
    unlockedAt: string | null;
  }[];
}

// Fetch all data for export
export async function gatherExportData(): Promise<ExportData> {
  // Fetch all workouts with sets
  const allWorkouts = await db
    .select({
      id: workouts.id,
      exerciseId: workouts.exerciseId,
      startedAt: workouts.startedAt,
      completedAt: workouts.completedAt,
      totalDuration: workouts.totalDuration,
      exerciseName: exercises.name,
      exerciseCategory: exercises.category,
    })
    .from(workouts)
    .leftJoin(exercises, eq(workouts.exerciseId, exercises.id))
    .orderBy(workouts.startedAt);

  // Fetch sets for each workout
  const workoutsWithSets = await Promise.all(
    allWorkouts.map(async (workout) => {
      const workoutSets = await db
        .select({
          setNumber: sets.setNumber,
          reps: sets.reps,
          weight: sets.weight,
          duration: sets.duration,
        })
        .from(sets)
        .where(eq(sets.workoutId, workout.id))
        .orderBy(sets.setNumber);

      return {
        id: workout.id,
        exerciseName: workout.exerciseName || 'Unknown',
        exerciseCategory: workout.exerciseCategory,
        startedAt: workout.startedAt.toISOString(),
        completedAt: workout.completedAt?.toISOString() || null,
        totalDuration: workout.totalDuration,
        sets: workoutSets,
      };
    })
  );

  // Fetch user stats
  const statsData = await db.select().from(userStats).limit(1);
  const stats = statsData[0] || {
    totalWorkouts: 0,
    totalVolume: 0,
    currentStreak: 0,
    longestStreak: 0,
    level: 1,
    totalXP: 0,
  };

  // Fetch achievements
  const achievementsData = await db.select().from(achievements);

  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    workouts: workoutsWithSets,
    stats: {
      totalWorkouts: stats.totalWorkouts || 0,
      totalVolume: stats.totalVolume || 0,
      currentStreak: stats.currentStreak || 0,
      longestStreak: stats.longestStreak || 0,
      level: stats.level || 1,
      totalXP: stats.totalXP || 0,
    },
    achievements: achievementsData.map((a) => ({
      name: a.name,
      description: a.description,
      isUnlocked: a.isUnlocked || false,
      unlockedAt: a.unlockedAt?.toISOString() || null,
    })),
  };
}

// Export as JSON
export async function exportAsJSON(): Promise<string> {
  const data = await gatherExportData();
  const json = JSON.stringify(data, null, 2);

  const fileName = `setly-export-${new Date().toISOString().split('T')[0]}.json`;
  const filePath = `${documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, json);

  return filePath;
}

// Export as CSV (workouts only)
export async function exportAsCSV(): Promise<string> {
  const data = await gatherExportData();

  // Create CSV header
  const header = 'Date,Exercise,Category,Duration (min),Set,Reps,Weight (kg),Volume (kg)';

  // Create CSV rows
  const rows: string[] = [];

  data.workouts.forEach((workout) => {
    workout.sets.forEach((set) => {
      const volume = (set.reps || 0) * (set.weight || 0);
      const durationMin = workout.totalDuration ? Math.round(workout.totalDuration / 60) : 0;

      rows.push(
        [
          workout.startedAt.split('T')[0],
          `"${workout.exerciseName}"`,
          workout.exerciseCategory || '',
          durationMin,
          set.setNumber,
          set.reps || '',
          set.weight || '',
          volume || '',
        ].join(',')
      );
    });
  });

  const csv = [header, ...rows].join('\n');

  const fileName = `setly-export-${new Date().toISOString().split('T')[0]}.csv`;
  const filePath = `${documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, csv);

  return filePath;
}

// Share exported file
export async function shareFile(filePath: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();

  if (isAvailable) {
    await Sharing.shareAsync(filePath);
  } else {
    throw new Error('Sharing is not available on this device');
  }
}

// Export and share JSON
export async function exportAndShareJSON(): Promise<void> {
  const filePath = await exportAsJSON();
  await shareFile(filePath);
}

// Export and share CSV
export async function exportAndShareCSV(): Promise<void> {
  const filePath = await exportAsCSV();
  await shareFile(filePath);
}

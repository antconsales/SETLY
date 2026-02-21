/**
 * Tool Executor for SETLY AI Assistant
 *
 * Dispatcher switch/case that maps 18 tool calls to:
 * - Zustand store actions (via StoreRefs, no hooks)
 * - Direct DB queries (workout history, PRs, weekly stats, exercise progress)
 * - Pure calculation functions from lib/calculations.ts
 * - Navigation callback
 */

import { db } from '@/db/client';
import { workouts, sets, exercises } from '@/db/schema';
import { eq, and, gte, lte, desc, isNotNull } from 'drizzle-orm';
import {
  calculate1RM,
  calculatePlates,
  getPercentageBreakdown,
  getRecommendedRestTime,
  getExerciseType,
} from '@/lib/calculations';
import type {
  ToolCall,
  ToolResult,
  GetExercisesParams,
  GetWorkoutHistoryParams,
  GetPersonalRecordsParams,
  GetWeeklyStatsParams,
  GetExerciseProgressParams,
  GetScheduledWorkoutsParams,
  GetAchievementsParams,
  Calculate1RMParams,
  CalculatePlatesParams,
  GetPercentageBreakdownParams,
  GetRestRecommendationParams,
  AddExerciseParams,
  ScheduleWorkoutParams,
  CreateTemplateParams,
  NavigateParams,
} from './tools';
import type { Exercise } from '@/types';
import type { UserStatsData, AchievementData } from '@/stores/gamificationStore';
import type { ScheduledWorkoutWithDetails } from '@/stores/scheduleStore';
import type { TemplateWithExercises } from '@/stores/templateStore';

// --- StoreRefs: injected by chatService to avoid hook usage outside React ---

export interface StoreRefs {
  // Exercise store
  getExercises: () => Exercise[];
  fetchExercises: () => Promise<void>;
  addExercise: (name: string, category?: string) => Promise<Exercise | null>;

  // Gamification store
  getStats: () => UserStatsData | null;
  fetchStats: () => Promise<void>;
  getAchievements: () => AchievementData[];
  getUnlockedAchievements: () => AchievementData[];
  fetchAchievements: () => Promise<void>;

  // Settings store
  getSettings: () => {
    defaultSets: number;
    defaultRestTime: number;
    hapticEnabled: boolean;
    soundEnabled: boolean;
  };

  // Schedule store
  getScheduledWorkouts: () => ScheduledWorkoutWithDetails[];
  fetchScheduledWorkouts: (startDate?: Date, endDate?: Date) => Promise<void>;
  scheduleWorkout: (
    exerciseId: number,
    scheduledFor: Date,
    plannedSets?: number
  ) => Promise<number | null>;

  // Template store
  getTemplates: () => TemplateWithExercises[];
  fetchTemplates: () => Promise<void>;
  createTemplate: (
    name: string,
    description: string,
    exercisesList: {
      exerciseId: number;
      targetSets?: number;
      targetReps?: number;
      targetWeight?: number;
    }[]
  ) => Promise<number | null>;

  // Navigation (Expo Router)
  navigate: (screen: string) => void;
}

// --- Main dispatcher ---

export async function executeTool(
  toolCall: ToolCall,
  storeRefs: StoreRefs
): Promise<ToolResult> {
  try {
    switch (toolCall.name) {
      // === DATA RETRIEVAL (10) ===

      case 'get_exercises':
        return await handleGetExercises(
          toolCall.arguments as GetExercisesParams,
          storeRefs
        );

      case 'get_stats':
        return await handleGetStats(storeRefs);

      case 'get_workout_history':
        return await handleGetWorkoutHistory(
          toolCall.arguments as GetWorkoutHistoryParams
        );

      case 'get_personal_records':
        return await handleGetPersonalRecords(
          toolCall.arguments as GetPersonalRecordsParams
        );

      case 'get_weekly_stats':
        return await handleGetWeeklyStats(
          toolCall.arguments as GetWeeklyStatsParams
        );

      case 'get_exercise_progress':
        return await handleGetExerciseProgress(
          toolCall.arguments as GetExerciseProgressParams
        );

      case 'get_scheduled_workouts':
        return await handleGetScheduledWorkouts(
          toolCall.arguments as GetScheduledWorkoutsParams,
          storeRefs
        );

      case 'get_templates':
        return await handleGetTemplates(storeRefs);

      case 'get_achievements':
        return await handleGetAchievements(
          toolCall.arguments as GetAchievementsParams,
          storeRefs
        );

      case 'get_settings':
        return handleGetSettings(storeRefs);

      // === CALCULATIONS (4) ===

      case 'calculate_1rm':
        return handleCalculate1RM(toolCall.arguments as Calculate1RMParams);

      case 'calculate_plates':
        return handleCalculatePlates(
          toolCall.arguments as CalculatePlatesParams
        );

      case 'get_percentage_breakdown':
        return handleGetPercentageBreakdown(
          toolCall.arguments as GetPercentageBreakdownParams
        );

      case 'get_rest_recommendation':
        return handleGetRestRecommendation(
          toolCall.arguments as GetRestRecommendationParams
        );

      // === ACTIONS (3) ===

      case 'add_exercise':
        return await handleAddExercise(
          toolCall.arguments as AddExerciseParams,
          storeRefs
        );

      case 'schedule_workout':
        return await handleScheduleWorkout(
          toolCall.arguments as ScheduleWorkoutParams,
          storeRefs
        );

      case 'create_template':
        return await handleCreateTemplate(
          toolCall.arguments as CreateTemplateParams,
          storeRefs
        );

      // === NAVIGATION (1) ===

      case 'navigate':
        return handleNavigate(
          toolCall.arguments as NavigateParams,
          storeRefs
        );

      default:
        return { success: false, error: `Tool sconosciuto: ${toolCall.name}` };
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Errore sconosciuto';
    console.error(`[toolExecutor] ${toolCall.name} failed:`, error);
    return { success: false, error: message };
  }
}

// === DATA RETRIEVAL handlers ===

async function handleGetExercises(
  params: GetExercisesParams,
  storeRefs: StoreRefs
): Promise<ToolResult> {
  await storeRefs.fetchExercises();
  let result = storeRefs.getExercises();

  if (params.category) {
    result = result.filter((e) => e.category === params.category);
  }

  return {
    success: true,
    data: result.map((e) => ({
      id: e.id,
      name: e.name,
      category: e.category,
      isCustom: e.isCustom,
    })),
  };
}

async function handleGetStats(storeRefs: StoreRefs): Promise<ToolResult> {
  await storeRefs.fetchStats();
  const stats = storeRefs.getStats();

  if (!stats) {
    return { success: true, data: { message: 'Nessuna statistica disponibile' } };
  }

  return {
    success: true,
    data: {
      currentStreak: stats.currentStreak,
      longestStreak: stats.longestStreak,
      totalWorkouts: stats.totalWorkouts,
      totalVolume: stats.totalVolume,
      totalXP: stats.totalXP,
      level: stats.level,
      lastWorkoutDate: stats.lastWorkoutDate?.toISOString() ?? null,
    },
  };
}

async function handleGetWorkoutHistory(
  params: GetWorkoutHistoryParams
): Promise<ToolResult> {
  const days = params.days ?? 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const conditions = [gte(workouts.startedAt, startDate)];
  if (params.exerciseId) {
    conditions.push(eq(workouts.exerciseId, params.exerciseId));
  }

  const result = await db
    .select({
      workoutId: workouts.id,
      exerciseId: workouts.exerciseId,
      exerciseName: exercises.name,
      startedAt: workouts.startedAt,
      completedAt: workouts.completedAt,
      totalDuration: workouts.totalDuration,
    })
    .from(workouts)
    .leftJoin(exercises, eq(workouts.exerciseId, exercises.id))
    .where(and(...conditions))
    .orderBy(desc(workouts.startedAt))
    .limit(50);

  const history = [];
  for (const w of result) {
    const workoutSets = await db
      .select({
        setNumber: sets.setNumber,
        reps: sets.reps,
        weight: sets.weight,
        duration: sets.duration,
      })
      .from(sets)
      .where(eq(sets.workoutId, w.workoutId));

    history.push({
      id: w.workoutId,
      exerciseName: w.exerciseName ?? 'Sconosciuto',
      startedAt: w.startedAt.toISOString(),
      completedAt: w.completedAt?.toISOString() ?? null,
      totalDuration: w.totalDuration,
      sets: workoutSets,
    });
  }

  return { success: true, data: history };
}

async function handleGetPersonalRecords(
  params: GetPersonalRecordsParams
): Promise<ToolResult> {
  const conditions = [isNotNull(sets.weight)];
  if (params.exerciseId) {
    conditions.push(eq(workouts.exerciseId, params.exerciseId));
  }

  const allSets = await db
    .select({
      exerciseId: workouts.exerciseId,
      exerciseName: exercises.name,
      weight: sets.weight,
      reps: sets.reps,
      completedAt: sets.completedAt,
    })
    .from(sets)
    .innerJoin(workouts, eq(sets.workoutId, workouts.id))
    .innerJoin(exercises, eq(workouts.exerciseId, exercises.id))
    .where(and(...conditions));

  const prMap = new Map<
    number,
    {
      exerciseId: number;
      exerciseName: string;
      maxWeight: number;
      maxWeightReps: number;
      maxVolume: number;
      maxVolumeWeight: number;
      maxVolumeReps: number;
      achievedAt: string;
    }
  >();

  for (const s of allSets) {
    if (!s.exerciseId || !s.weight) continue;
    const volume = s.weight * (s.reps ?? 1);
    const existing = prMap.get(s.exerciseId);

    if (!existing) {
      prMap.set(s.exerciseId, {
        exerciseId: s.exerciseId,
        exerciseName: s.exerciseName ?? 'Sconosciuto',
        maxWeight: s.weight,
        maxWeightReps: s.reps ?? 1,
        maxVolume: volume,
        maxVolumeWeight: s.weight,
        maxVolumeReps: s.reps ?? 1,
        achievedAt: (s.completedAt ?? new Date()).toISOString(),
      });
    } else {
      if (s.weight > existing.maxWeight) {
        existing.maxWeight = s.weight;
        existing.maxWeightReps = s.reps ?? 1;
        existing.achievedAt = (s.completedAt ?? new Date()).toISOString();
      }
      if (volume > existing.maxVolume) {
        existing.maxVolume = volume;
        existing.maxVolumeWeight = s.weight;
        existing.maxVolumeReps = s.reps ?? 1;
      }
    }
  }

  return { success: true, data: Array.from(prMap.values()) };
}

async function handleGetWeeklyStats(
  params: GetWeeklyStatsParams
): Promise<ToolResult> {
  const weeks = params.weeks ?? 8;
  const stats = [];
  const now = new Date();

  for (let i = 0; i < weeks; i++) {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() - i * 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekWorkouts = await db
      .select({ id: workouts.id })
      .from(workouts)
      .where(
        and(gte(workouts.startedAt, weekStart), lte(workouts.startedAt, weekEnd))
      );

    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;

    for (const w of weekWorkouts) {
      const workoutSets = await db
        .select({ reps: sets.reps, weight: sets.weight })
        .from(sets)
        .where(eq(sets.workoutId, w.id));

      for (const s of workoutSets) {
        totalSets++;
        if (s.reps) {
          totalReps += s.reps;
          if (s.weight) {
            totalVolume += s.reps * s.weight;
          }
        }
      }
    }

    stats.push({
      weekStart: weekStart.toISOString(),
      totalWorkouts: weekWorkouts.length,
      totalVolume,
      totalSets,
      totalReps,
    });
  }

  return { success: true, data: stats.reverse() };
}

async function handleGetExerciseProgress(
  params: GetExerciseProgressParams
): Promise<ToolResult> {
  const exerciseData = await db
    .select({ id: exercises.id, name: exercises.name, category: exercises.category })
    .from(exercises)
    .where(eq(exercises.id, params.exerciseId))
    .limit(1);

  if (exerciseData.length === 0) {
    return { success: false, error: 'Esercizio non trovato' };
  }

  const workoutData = await db
    .select({
      startedAt: workouts.startedAt,
      weight: sets.weight,
      reps: sets.reps,
    })
    .from(workouts)
    .innerJoin(sets, eq(workouts.id, sets.workoutId))
    .where(eq(workouts.exerciseId, params.exerciseId))
    .orderBy(workouts.startedAt);

  const dateMap = new Map<
    string,
    { maxWeight: number; totalVolume: number; date: string }
  >();

  for (const row of workoutData) {
    const dateKey = row.startedAt.toISOString().split('T')[0];
    const volume = (row.weight ?? 0) * (row.reps ?? 0);
    const existing = dateMap.get(dateKey);

    if (!existing) {
      dateMap.set(dateKey, {
        maxWeight: row.weight ?? 0,
        totalVolume: volume,
        date: dateKey,
      });
    } else {
      existing.maxWeight = Math.max(existing.maxWeight, row.weight ?? 0);
      existing.totalVolume += volume;
    }
  }

  return {
    success: true,
    data: {
      exerciseId: exerciseData[0].id,
      exerciseName: exerciseData[0].name,
      category: exerciseData[0].category,
      dataPoints: Array.from(dateMap.values()),
    },
  };
}

async function handleGetScheduledWorkouts(
  params: GetScheduledWorkoutsParams,
  storeRefs: StoreRefs
): Promise<ToolResult> {
  const startDate = params.startDate ? new Date(params.startDate) : undefined;
  const endDate = params.endDate ? new Date(params.endDate) : undefined;

  await storeRefs.fetchScheduledWorkouts(startDate, endDate);
  const scheduled = storeRefs.getScheduledWorkouts();

  return {
    success: true,
    data: scheduled.map((w) => ({
      id: w.id,
      exerciseId: w.exerciseId,
      exerciseName: w.exerciseName,
      scheduledFor: w.scheduledFor.toISOString(),
      plannedSets: w.plannedSets,
      completed: w.completed,
    })),
  };
}

async function handleGetTemplates(storeRefs: StoreRefs): Promise<ToolResult> {
  await storeRefs.fetchTemplates();
  const templates = storeRefs.getTemplates();

  return {
    success: true,
    data: templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      exercises: t.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        exerciseName: e.exerciseName,
        category: e.category,
        targetSets: e.targetSets,
        targetReps: e.targetReps,
        targetWeight: e.targetWeight,
      })),
    })),
  };
}

async function handleGetAchievements(
  params: GetAchievementsParams,
  storeRefs: StoreRefs
): Promise<ToolResult> {
  await storeRefs.fetchAchievements();

  const data = params.unlockedOnly
    ? storeRefs.getUnlockedAchievements()
    : storeRefs.getAchievements();

  return {
    success: true,
    data: data.map((a) => ({
      id: a.id,
      key: a.key,
      name: a.name,
      description: a.description,
      xpReward: a.xpReward,
      isUnlocked: a.isUnlocked,
      unlockedAt: a.unlockedAt?.toISOString() ?? null,
    })),
  };
}

function handleGetSettings(storeRefs: StoreRefs): ToolResult {
  return { success: true, data: storeRefs.getSettings() };
}

// === CALCULATION handlers ===

function handleCalculate1RM(params: Calculate1RMParams): ToolResult {
  if (params.weight <= 0 || params.reps < 1) {
    return { success: false, error: 'Peso e ripetizioni devono essere positivi' };
  }

  const oneRepMax = calculate1RM(params.weight, params.reps);

  return {
    success: true,
    data: {
      weight: params.weight,
      reps: params.reps,
      estimated1RM: oneRepMax,
      unit: 'kg',
    },
  };
}

function handleCalculatePlates(params: CalculatePlatesParams): ToolResult {
  if (params.targetWeight <= 0) {
    return { success: false, error: 'Il peso target deve essere positivo' };
  }

  const result = calculatePlates(params.targetWeight, params.barbellWeight);

  return {
    success: true,
    data: {
      targetWeight: result.targetWeight,
      barbellWeight: result.barbellWeight,
      weightPerSide: result.weightPerSide,
      plates: result.plates,
      achievedWeight: result.achievedWeight,
      isExact: result.isExact,
    },
  };
}

function handleGetPercentageBreakdown(
  params: GetPercentageBreakdownParams
): ToolResult {
  if (params.oneRepMax <= 0) {
    return { success: false, error: 'Il 1RM deve essere positivo' };
  }

  const breakdown = getPercentageBreakdown(params.oneRepMax);

  return {
    success: true,
    data: {
      oneRepMax: params.oneRepMax,
      breakdown,
    },
  };
}

function handleGetRestRecommendation(
  params: GetRestRecommendationParams
): ToolResult {
  const exerciseType = getExerciseType(params.exerciseName);
  const restSeconds = getRecommendedRestTime(exerciseType, params.intensity);

  return {
    success: true,
    data: {
      exerciseName: params.exerciseName,
      exerciseType,
      intensity: params.intensity ?? 'moderate',
      recommendedRestSeconds: restSeconds,
    },
  };
}

// === ACTION handlers ===

async function handleAddExercise(
  params: AddExerciseParams,
  storeRefs: StoreRefs
): Promise<ToolResult> {
  const exercise = await storeRefs.addExercise(params.name, params.category);

  if (!exercise) {
    return { success: false, error: "Errore nell'aggiunta dell'esercizio" };
  }

  return {
    success: true,
    data: {
      id: exercise.id,
      name: exercise.name,
      category: exercise.category,
    },
  };
}

async function handleScheduleWorkout(
  params: ScheduleWorkoutParams,
  storeRefs: StoreRefs
): Promise<ToolResult> {
  const scheduledFor = new Date(params.scheduledFor);

  if (isNaN(scheduledFor.getTime())) {
    return { success: false, error: 'Data non valida' };
  }

  const id = await storeRefs.scheduleWorkout(
    params.exerciseId,
    scheduledFor,
    params.plannedSets
  );

  if (id === null) {
    return { success: false, error: "Errore nella programmazione dell'allenamento" };
  }

  return {
    success: true,
    data: {
      id,
      exerciseId: params.exerciseId,
      scheduledFor: scheduledFor.toISOString(),
      plannedSets: params.plannedSets,
    },
  };
}

async function handleCreateTemplate(
  params: CreateTemplateParams,
  storeRefs: StoreRefs
): Promise<ToolResult> {
  const id = await storeRefs.createTemplate(
    params.name,
    params.description,
    params.exercises
  );

  if (id === null) {
    return { success: false, error: 'Errore nella creazione del template' };
  }

  return {
    success: true,
    data: {
      id,
      name: params.name,
      description: params.description,
      exerciseCount: params.exercises.length,
    },
  };
}

// === NAVIGATION handler ===

function handleNavigate(
  params: NavigateParams,
  storeRefs: StoreRefs
): ToolResult {
  storeRefs.navigate(params.screen);

  return {
    success: true,
    data: { navigatedTo: params.screen },
  };
}

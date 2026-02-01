/**
 * 1RM (One Rep Max) Formulas
 * Reference: https://en.wikipedia.org/wiki/One-repetition_maximum
 */

// Epley Formula: weight × (1 + reps/30)
export function epley1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

// Brzycki Formula: weight × 36 / (37 - reps)
export function brzycki1RM(weight: number, reps: number): number {
  if (reps >= 37) return weight; // Invalid, too many reps
  if (reps === 1) return weight;
  return Math.round((weight * 36) / (37 - reps));
}

// Lander Formula: 100 × weight / (101.3 - 2.67123 × reps)
export function lander1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  const divisor = 101.3 - 2.67123 * reps;
  if (divisor <= 0) return weight;
  return Math.round((100 * weight) / divisor);
}

// Average of all formulas for better accuracy
export function calculate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps < 1 || weight <= 0) return 0;

  const epley = epley1RM(weight, reps);
  const brzycki = brzycki1RM(weight, reps);
  const lander = lander1RM(weight, reps);

  return Math.round((epley + brzycki + lander) / 3);
}

// Calculate weight for a given percentage of 1RM
export function weightAtPercentage(oneRepMax: number, percentage: number): number {
  return Math.round((oneRepMax * percentage) / 100);
}

// Standard percentage table
export const percentageTable = [
  { percentage: 100, reps: 1 },
  { percentage: 95, reps: 2 },
  { percentage: 90, reps: 4 },
  { percentage: 85, reps: 6 },
  { percentage: 80, reps: 8 },
  { percentage: 75, reps: 10 },
  { percentage: 70, reps: 12 },
  { percentage: 65, reps: 15 },
  { percentage: 60, reps: 20 },
];

// Calculate full percentage breakdown
export function getPercentageBreakdown(oneRepMax: number): { percentage: number; weight: number; reps: number }[] {
  return percentageTable.map((row) => ({
    ...row,
    weight: weightAtPercentage(oneRepMax, row.percentage),
  }));
}

/**
 * Plate Calculator
 * Calculates which plates to load on each side of the barbell
 */

// Standard plate weights in kg
export const standardPlates = [25, 20, 15, 10, 5, 2.5, 1.25];

// Standard barbell weight in kg
export const standardBarbellWeight = 20;

export interface PlateCalculation {
  barbellWeight: number;
  targetWeight: number;
  weightPerSide: number;
  plates: { weight: number; count: number }[];
  achievedWeight: number;
  isExact: boolean;
}

export function calculatePlates(
  targetWeight: number,
  barbellWeight: number = standardBarbellWeight,
  availablePlates: number[] = standardPlates
): PlateCalculation {
  // Weight to load per side
  const weightPerSide = (targetWeight - barbellWeight) / 2;

  if (weightPerSide <= 0) {
    return {
      barbellWeight,
      targetWeight,
      weightPerSide: 0,
      plates: [],
      achievedWeight: barbellWeight,
      isExact: targetWeight === barbellWeight,
    };
  }

  const plates: { weight: number; count: number }[] = [];
  let remaining = weightPerSide;

  // Sort plates from largest to smallest
  const sortedPlates = [...availablePlates].sort((a, b) => b - a);

  for (const plateWeight of sortedPlates) {
    const count = Math.floor(remaining / plateWeight);
    if (count > 0) {
      plates.push({ weight: plateWeight, count });
      remaining -= count * plateWeight;
    }
  }

  const achievedPerSide = plates.reduce((sum, p) => sum + p.weight * p.count, 0);
  const achievedWeight = barbellWeight + achievedPerSide * 2;

  return {
    barbellWeight,
    targetWeight,
    weightPerSide: achievedPerSide,
    plates,
    achievedWeight,
    isExact: Math.abs(achievedWeight - targetWeight) < 0.01,
  };
}

/**
 * Volume Calculations
 */

export function calculateVolume(weight: number, reps: number, sets: number = 1): number {
  return weight * reps * sets;
}

export function calculateTotalVolume(
  sets: { weight?: number | null; reps?: number | null }[]
): number {
  return sets.reduce((total, set) => {
    if (set.weight && set.reps) {
      return total + set.weight * set.reps;
    }
    return total;
  }, 0);
}

/**
 * Rest Time Recommendations
 * Based on exercise type and intensity
 */

export type ExerciseType = 'compound' | 'isolation' | 'cardio' | 'core';

export function getRecommendedRestTime(
  exerciseType: ExerciseType,
  intensity: 'light' | 'moderate' | 'heavy' = 'moderate'
): number {
  const restTimes: Record<ExerciseType, Record<string, number>> = {
    compound: { light: 90, moderate: 120, heavy: 180 },
    isolation: { light: 45, moderate: 60, heavy: 90 },
    cardio: { light: 30, moderate: 45, heavy: 60 },
    core: { light: 30, moderate: 45, heavy: 60 },
  };

  return restTimes[exerciseType]?.[intensity] || 60;
}

// Determine intensity based on reps and percentage of 1RM
export function getIntensity(
  weight: number,
  oneRepMax: number
): 'light' | 'moderate' | 'heavy' {
  if (oneRepMax <= 0) return 'moderate';

  const percentage = (weight / oneRepMax) * 100;

  if (percentage >= 85) return 'heavy';
  if (percentage >= 70) return 'moderate';
  return 'light';
}

// Categorize exercise by name
export function getExerciseType(exerciseName: string): ExerciseType {
  const name = exerciseName.toLowerCase();

  const compoundExercises = [
    'squat',
    'deadlift',
    'bench',
    'press',
    'row',
    'pull-up',
    'pullup',
    'chin-up',
    'lunge',
    'clean',
    'snatch',
  ];

  const coreExercises = ['plank', 'crunch', 'sit-up', 'situp', 'ab', 'core', 'twist'];

  const cardioExercises = ['run', 'jog', 'bike', 'cycle', 'swim', 'jump', 'burpee'];

  if (compoundExercises.some((ex) => name.includes(ex))) return 'compound';
  if (coreExercises.some((ex) => name.includes(ex))) return 'core';
  if (cardioExercises.some((ex) => name.includes(ex))) return 'cardio';

  return 'isolation';
}

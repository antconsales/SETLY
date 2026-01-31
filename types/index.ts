// Re-export database types
export type {
  Exercise,
  NewExercise,
  Workout,
  NewWorkout,
  Set,
  NewSet,
  ScheduledWorkout,
  NewScheduledWorkout,
  WorkoutPhoto,
  NewWorkoutPhoto,
} from '../db/schema';

// App-specific types
export interface WorkoutSession {
  exerciseId: number;
  exerciseName: string;
  startedAt: Date;
  sets: SetData[];
  isResting: boolean;
  currentSetIndex: number;
  plannedSets: number;
}

export interface SetData {
  setNumber: number;
  duration: number; // seconds
  restAfter?: number; // seconds
  reps?: number;
  weight?: number;
  completedAt?: Date;
}

export interface TimerState {
  seconds: number;
  isRunning: boolean;
  isResting: boolean;
}

export interface LastWorkout {
  exerciseName: string;
  when: string;
  restTime: string;
  sets: number;
}

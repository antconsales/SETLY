// SETLY Color Palette
export const colors = {
  black: '#0A0A0A',
  dark: '#121212',
  gray: '#1A1A1A',
  border: '#2A2A2A',
  text: '#E5E5E5',
  muted: '#666666',
  accent: '#4ADE80',
  glow: 'rgba(255,255,255,0.1)',
} as const;

// Font families
export const fonts = {
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
} as const;

// Default values
export const defaults = {
  restTime: 60, // seconds
  totalSets: 4,
  maxTimerDisplay: 90, // seconds for visual progress
} as const;

// Exercise categories
export const categories = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  core: 'Core',
  cardio: 'Cardio',
} as const;

export type Category = keyof typeof categories;

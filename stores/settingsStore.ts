import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  // Workout settings
  defaultSets: number;
  defaultRestTime: number; // seconds

  // UI settings
  hapticEnabled: boolean;
  soundEnabled: boolean;

  // Onboarding
  hasSeenOnboarding: boolean;

  // Actions
  setDefaultSets: (sets: number) => void;
  setDefaultRestTime: (seconds: number) => void;
  toggleHaptic: () => void;
  toggleSound: () => void;
  completeOnboarding: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Defaults
      defaultSets: 4,
      defaultRestTime: 60,
      hapticEnabled: true,
      soundEnabled: false,
      hasSeenOnboarding: false,

      // Actions
      setDefaultSets: (sets) => set({ defaultSets: sets }),
      setDefaultRestTime: (seconds) => set({ defaultRestTime: seconds }),
      toggleHaptic: () => set((state) => ({ hapticEnabled: !state.hapticEnabled })),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      completeOnboarding: () => set({ hasSeenOnboarding: true }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

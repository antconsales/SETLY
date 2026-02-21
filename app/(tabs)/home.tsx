import { View, Text, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
import { useLastWorkout } from '@/hooks';
import { useSettingsStore } from '@/stores';
import { AIFab } from '@/components/ui';

export default function Home() {
  const { lastWorkout, isLoading, refetch } = useLastWorkout();
  const { hapticEnabled } = useSettingsStore();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const handleStartWorkout = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/workout/select');
  };

  return (
    <View className="flex-1 bg-setly-black justify-center items-center px-8">
      {/* Decorative lines */}
      <View className="absolute left-0 top-1/4 w-12 h-px bg-setly-border" />
      <View className="absolute right-0 top-1/3 w-8 h-px bg-setly-border" />

      {/* Main CTA */}
      <Pressable
        onPress={handleStartWorkout}
        className="px-12 py-5 border border-setly-text/50 bg-white/5 active:bg-white/10"
      >
        <Text
          className="text-setly-text text-lg tracking-widest"
          style={{ fontFamily: 'SpaceMono_700Bold' }}
        >
          START
        </Text>
      </Pressable>

      {/* Last workout */}
      <View className="mt-12 items-center">
        {isLoading ? null : lastWorkout ? (
          <Text
            className="text-setly-muted text-xs tracking-wider text-center"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            {lastWorkout.exerciseName.toUpperCase()} • {lastWorkout.when}
          </Text>
        ) : (
          <Text
            className="text-setly-muted text-xs tracking-wider"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            TRACK. DON'T GUESS.
          </Text>
        )}
      </View>

      <AIFab />
    </View>
  );
}

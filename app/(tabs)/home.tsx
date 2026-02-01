import { View, Text, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { useLastWorkout } from '@/hooks';
import { useSettingsStore, useScheduleStore } from '@/stores';

export default function Home() {
  const { lastWorkout, isLoading, refetch } = useLastWorkout();
  const { hapticEnabled } = useSettingsStore();
  const { scheduledWorkouts, fetchScheduledWorkouts } = useScheduleStore();
  const [nextScheduled, setNextScheduled] = useState<{
    exerciseName: string;
    time: string;
  } | null>(null);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      refetch();
      fetchScheduledWorkouts();
    }, [refetch, fetchScheduledWorkouts])
  );

  // Find next scheduled workout
  useEffect(() => {
    const now = new Date();
    const upcoming = scheduledWorkouts
      .filter((w) => !w.completed && new Date(w.scheduledFor) > now)
      .sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());

    if (upcoming.length > 0) {
      const next = upcoming[0];
      const date = new Date(next.scheduledFor);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let timeStr = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      if (date.toDateString() === today.toDateString()) {
        timeStr = `TODAY ${timeStr}`;
      } else if (date.toDateString() === tomorrow.toDateString()) {
        timeStr = `TOMORROW ${timeStr}`;
      } else {
        timeStr = `${date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()} ${timeStr}`;
      }

      setNextScheduled({
        exerciseName: next.exerciseName,
        time: timeStr,
      });
    } else {
      setNextScheduled(null);
    }
  }, [scheduledWorkouts]);

  const handleStartWorkout = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/workout/select');
  };

  const handleScheduleWorkout = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/schedule/create');
  };

  const handleOpenTemplates = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/templates');
  };

  return (
    <View className="flex-1 bg-setly-black justify-center items-center px-8">
      {/* Decorative elements */}
      <View className="absolute left-0 top-1/4 w-12 h-px bg-setly-border" />
      <View className="absolute right-0 top-1/3 w-8 h-px bg-setly-border" />

      {/* Next scheduled workout */}
      {nextScheduled && (
        <View className="absolute top-20 items-center">
          <Text
            className="text-setly-muted text-xs tracking-wider"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            NEXT SCHEDULED
          </Text>
          <Text
            className="text-setly-accent text-sm tracking-wider mt-1"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            {nextScheduled.exerciseName.toUpperCase()}
          </Text>
          <Text
            className="text-setly-muted text-xs tracking-wider mt-1"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            {nextScheduled.time}
          </Text>
        </View>
      )}

      {/* Main CTA Button */}
      <Pressable
        onPress={handleStartWorkout}
        className="px-12 py-5 border border-setly-text/50 bg-white/5 active:bg-white/10"
      >
        <Text
          className="text-setly-text text-lg tracking-widest"
          style={{ fontFamily: 'SpaceMono_700Bold' }}
        >
          START WORKOUT
        </Text>
      </Pressable>

      {/* Secondary buttons */}
      <View className="flex-row gap-4 mt-4">
        <Pressable
          onPress={handleOpenTemplates}
          className="px-6 py-3 border border-setly-border active:bg-white/5"
        >
          <Text
            className="text-setly-text text-sm tracking-wider"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            TEMPLATES
          </Text>
        </Pressable>

        <Pressable
          onPress={handleScheduleWorkout}
          className="px-6 py-3 active:opacity-70"
        >
          <Text
            className="text-setly-muted text-sm tracking-wider"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            + SCHEDULE
          </Text>
        </Pressable>
      </View>

      {/* Last workout info */}
      <View className="mt-8 items-center">
        {isLoading ? (
          <Text
            className="text-setly-muted text-xs tracking-wider"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            LOADING...
          </Text>
        ) : lastWorkout ? (
          <>
            <Text
              className="text-setly-muted text-xs tracking-wider"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              LAST WORKOUT: {lastWorkout.exerciseName.toUpperCase()} • {lastWorkout.when}
            </Text>
            <Text
              className="text-setly-muted text-xs tracking-wider mt-1"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              REST TIME: {lastWorkout.avgRestTime} • SETS: {lastWorkout.totalSets}
            </Text>
          </>
        ) : (
          <Text
            className="text-setly-muted text-xs tracking-wider"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            NO WORKOUTS YET
          </Text>
        )}
      </View>

      {/* Page indicator dots */}
      <View className="absolute bottom-24 flex-row gap-2">
        <View className="w-2 h-2 rounded-full bg-setly-text" />
        <View className="w-2 h-2 rounded-full bg-setly-muted/50" />
        <View className="w-2 h-2 rounded-full bg-setly-muted/50" />
        <View className="w-2 h-2 rounded-full bg-setly-muted/50" />
      </View>
    </View>
  );
}

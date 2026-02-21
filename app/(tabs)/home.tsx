import { View, Text, Pressable, Animated } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLastWorkout } from '@/hooks';
import { useSettingsStore, useGamificationStore, getLevelName } from '@/stores';
import { AIFab, StreakBadge } from '@/components/ui';
import { db } from '@/db/client';
import { workouts } from '@/db/schema';
import { gte } from 'drizzle-orm';

export default function Home() {
  const { lastWorkout, isLoading, refetch } = useLastWorkout();
  const { hapticEnabled } = useSettingsStore();
  const { stats, fetchStats } = useGamificationStore();
  const [weekWorkouts, setWeekWorkouts] = useState(0);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const fetchWeekWorkouts = useCallback(async () => {
    try {
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const result = await db
        .select({ id: workouts.id })
        .from(workouts)
        .where(gte(workouts.startedAt, weekStart));

      setWeekWorkouts(result.length);
    } catch (error) {
      console.error('Error fetching week workouts:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refetch();
      fetchStats();
      fetchWeekWorkouts();
    }, [refetch, fetchStats, fetchWeekWorkouts])
  );

  // Subtle breathing animation on CTA border
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const handleStartWorkout = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/workout/select');
  };

  const animatedBorderColor = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(229,229,229,0.3)', 'rgba(229,229,229,0.7)'],
  });

  return (
    <View className="flex-1 bg-setly-black px-8">
      {/* Decorative lines */}
      <View className="absolute left-0 top-1/4 w-12 h-px bg-setly-border" />
      <View className="absolute right-0 top-1/3 w-8 h-px bg-setly-border" />

      {/* Top: StreakBadge + quick stats */}
      <View className="pt-16">
        {stats ? (
          <View>
            <StreakBadge
              streak={stats.currentStreak}
              level={stats.level}
              totalXP={stats.totalXP}
              compact
            />
            <View className="flex-row items-center mt-3 gap-6">
              <View className="flex-row items-baseline">
                <Text
                  className="text-setly-accent text-base"
                  style={{ fontFamily: 'SpaceMono_700Bold' }}
                >
                  {weekWorkouts}
                </Text>
                <Text
                  className="text-setly-muted text-xs tracking-wider ml-2"
                  style={{ fontFamily: 'SpaceMono_400Regular' }}
                >
                  THIS WEEK
                </Text>
              </View>
              <View className="h-3 w-px bg-setly-border" />
              <Text
                className="text-setly-muted text-xs tracking-wider"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                {getLevelName(stats.level).toUpperCase()}
              </Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* Main CTA — centered with breathing border */}
      <View className="flex-1 justify-center items-center">
        <Animated.View
          style={{
            borderWidth: 1,
            borderColor: animatedBorderColor,
            backgroundColor: 'rgba(255,255,255,0.05)',
          }}
        >
          <Pressable
            onPress={handleStartWorkout}
            className="px-12 py-5 active:bg-white/10"
          >
            <Text
              className="text-setly-text text-lg tracking-widest"
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              START
            </Text>
          </Pressable>
        </Animated.View>

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
      </View>

      <AIFab />
    </View>
  );
}

import { View, Text, Pressable } from 'react-native';
import { useEffect, useCallback } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useWorkoutStore, useSettingsStore } from '@/stores';
import { useTimer } from '@/hooks';

export default function ActiveWorkout() {
  const { exerciseName } = useLocalSearchParams<{ exerciseName: string }>();
  const { seconds, formattedTime, formatTime } = useTimer();
  const { session, endSet, startRest, endRest, finishWorkout, cancelWorkout } = useWorkoutStore();
  const { hapticEnabled } = useSettingsStore();

  const currentSet = session ? session.sets.length + 1 : 1;
  const totalSets = session?.plannedSets || 4;
  const isResting = session?.isResting || false;

  // Glow animation
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1500 }),
        withTiming(0.3, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handleEndSet = useCallback(() => {
    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    endSet(seconds);
  }, [hapticEnabled, endSet, seconds]);

  const handleStopRest = useCallback(async () => {
    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    if (currentSet >= totalSets) {
      // Workout complete - save to database
      const workoutId = await finishWorkout();
      router.replace({
        pathname: '/workout/summary',
        params: {
          exerciseName: exerciseName || session?.exerciseName || 'Workout',
          totalSets: currentSet.toString(),
          totalTime: formatTime(seconds),
          workoutId: workoutId?.toString() || '',
        },
      });
      return;
    }

    endRest();
  }, [hapticEnabled, currentSet, totalSets, finishWorkout, endRest, exerciseName, session, formatTime, seconds]);

  const handleEndWorkout = useCallback(async () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    // Save current set if in progress (not resting)
    if (!isResting && seconds > 0) {
      endSet(seconds);
    }

    const workoutId = await finishWorkout();
    router.replace({
      pathname: '/workout/summary',
      params: {
        exerciseName: exerciseName || session?.exerciseName || 'Workout',
        totalSets: session?.sets.length.toString() || '0',
        totalTime: formatTime(seconds),
        workoutId: workoutId?.toString() || '',
      },
    });
  }, [hapticEnabled, isResting, seconds, endSet, finishWorkout, exerciseName, session, formatTime]);

  // Timer progress
  const radius = 100;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const maxSeconds = 90;
  const progress = Math.min(seconds / maxSeconds, 1) * circumference;

  return (
    <View className="flex-1 bg-setly-black items-center justify-center px-8">
      {/* Battery indicator - top right */}
      <View className="absolute top-14 right-6 flex-row gap-0.5">
        {[...Array(5)].map((_, i) => (
          <View key={i} className="w-1.5 h-3 bg-setly-muted rounded-sm" />
        ))}
      </View>

      {/* Exercise name */}
      <Text
        className="absolute top-24 text-2xl text-setly-text tracking-widest"
        style={{ fontFamily: 'SpaceMono_700Bold' }}
      >
        {(exerciseName || session?.exerciseName || 'WORKOUT').toUpperCase()}
      </Text>

      {/* Timer Container */}
      <View className="items-center justify-center">
        {/* Glow effect */}
        <Animated.View
          style={glowStyle}
          className="absolute w-72 h-72 rounded-full bg-white/10"
        />

        {/* Progress ring */}
        <Svg width={240} height={240} className="absolute">
          {/* Background ring */}
          <Circle
            cx={120}
            cy={120}
            r={radius}
            stroke="#2A2A2A"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress ring */}
          <Circle
            cx={120}
            cy={120}
            r={radius}
            stroke={isResting ? '#4ADE80' : '#E5E5E5'}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            rotation={-90}
            origin="120, 120"
          />
          {/* Tick marks */}
          {Array.from({ length: 60 }).map((_, i) => {
            const angle = (i * 6 - 90) * (Math.PI / 180);
            const x = 120 + (radius - 12) * Math.cos(angle);
            const y = 120 + (radius - 12) * Math.sin(angle);
            return (
              <Circle
                key={i}
                cx={x}
                cy={y}
                r={i % 5 === 0 ? 1.5 : 0.8}
                fill="#666"
              />
            );
          })}
        </Svg>

        {/* Time display */}
        <Text
          className="text-6xl text-setly-text tracking-wider"
          style={{ fontFamily: 'SpaceMono_700Bold' }}
        >
          {formattedTime}
        </Text>
      </View>

      {/* Set counter */}
      <Text
        className="text-setly-text text-xl mt-8"
        style={{ fontFamily: 'SpaceMono_400Regular' }}
      >
        {isResting ? currentSet - 1 : currentSet} / {totalSets}
      </Text>

      {/* Status indicator */}
      <Text
        className="text-setly-muted text-xs mt-2 tracking-wider"
        style={{ fontFamily: 'SpaceMono_400Regular' }}
      >
        {isResting ? 'RESTING' : 'WORKING'}
      </Text>

      {/* Pause indicator */}
      {isResting && (
        <Text
          className="absolute right-8 text-setly-accent text-2xl"
          style={{ fontFamily: 'SpaceMono_700Bold', top: '50%' }}
        >
          ║
        </Text>
      )}

      {/* Action button */}
      <View className="absolute bottom-16 w-full px-8">
        <Pressable
          onPress={isResting ? handleStopRest : handleEndSet}
          className={`py-4 border active:bg-white/5 ${isResting ? 'border-setly-accent/50' : 'border-setly-text/50'}`}
        >
          <Text
            className={`text-center tracking-widest ${isResting ? 'text-setly-accent' : 'text-setly-text'}`}
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            {isResting ? 'STOP PAUSA' : 'FINE SET'}
          </Text>
        </Pressable>

        {/* End workout early */}
        <Pressable onPress={handleEndWorkout} className="py-3 mt-4">
          <Text
            className="text-setly-muted text-center text-sm tracking-wider"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            END WORKOUT
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

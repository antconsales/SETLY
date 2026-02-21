import { View, Text, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useWorkoutDetails } from '@/hooks';

export default function WorkoutSummary() {
  const { exerciseName, totalSets, totalTime, workoutId } = useLocalSearchParams<{
    exerciseName: string;
    totalSets: string;
    totalTime: string;
    workoutId: string;
  }>();

  const { workout, isLoading } = useWorkoutDetails(workoutId ? parseInt(workoutId, 10) : null);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(tabs)/home');
  };

  const handleGoStats = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(tabs)/stats');
  };

  // Format volume for display
  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k`;
    }
    return volume.toString();
  };

  // Computed stats
  const stats = useMemo(() => {
    if (!workout || workout.sets.length === 0) return null;

    const weightsUsed = workout.sets
      .map((s) => s.weight)
      .filter((w): w is number => w !== null && w > 0);
    const repsPerformed = workout.sets
      .map((s) => s.reps)
      .filter((r): r is number => r !== null && r > 0);

    const maxWeight = weightsUsed.length > 0 ? Math.max(...weightsUsed) : 0;
    const avgWeight = weightsUsed.length > 0
      ? weightsUsed.reduce((a, b) => a + b, 0) / weightsUsed.length
      : 0;
    const avgReps = repsPerformed.length > 0
      ? repsPerformed.reduce((a, b) => a + b, 0) / repsPerformed.length
      : 0;

    // Estimated 1RM (Epley formula): weight * (1 + reps / 30)
    const maxWeightSet = workout.sets.reduce(
      (best, set) => {
        if (!set.weight || !set.reps) return best;
        const estimated1RM = set.weight * (1 + set.reps / 30);
        return estimated1RM > best.estimated1RM ? { weight: set.weight, reps: set.reps, estimated1RM } : best;
      },
      { weight: 0, reps: 0, estimated1RM: 0 }
    );

    return {
      maxWeight,
      avgWeight: Math.round(avgWeight * 10) / 10,
      avgReps: Math.round(avgReps * 10) / 10,
      estimated1RM: Math.round(maxWeightSet.estimated1RM),
      bestSetWeight: maxWeightSet.weight,
      bestSetReps: maxWeightSet.reps,
    };
  }, [workout]);

  return (
    <ScrollView className="flex-1 bg-setly-black" contentContainerClassName="items-center px-8 py-16">
      {/* Decorative elements */}
      <View className="absolute left-0 top-1/4 w-16 h-px bg-setly-border" />
      <View className="absolute right-0 bottom-1/3 w-12 h-px bg-setly-border" />

      {/* Success indicator */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        className="w-16 h-16 border-2 border-setly-accent items-center justify-center mb-8 mt-8"
      >
        <Text className="text-setly-accent text-2xl">✓</Text>
      </Animated.View>

      {/* Title */}
      <Animated.View entering={FadeInDown.duration(400).delay(100)} className="items-center mb-8">
        <Text
          className="text-setly-text text-xl tracking-widest mb-2"
          style={{ fontFamily: 'SpaceMono_700Bold' }}
        >
          ALLENAMENTO SALVATO
        </Text>
        <Text
          className="text-setly-muted text-sm tracking-wider"
          style={{ fontFamily: 'SpaceMono_400Regular' }}
        >
          {exerciseName?.toUpperCase()}
        </Text>
      </Animated.View>

      {/* Main Stats */}
      <Animated.View entering={FadeInDown.duration(400).delay(200)} className="flex-row gap-8 mb-8">
        <View className="items-center">
          <Text
            className="text-setly-text text-4xl tracking-wider"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            {totalSets}
          </Text>
          <Text
            className="text-setly-muted text-xs tracking-wider mt-1"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            SET
          </Text>
        </View>

        <View className="items-center">
          <Text
            className="text-setly-text text-4xl tracking-wider"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            {totalTime}
          </Text>
          <Text
            className="text-setly-muted text-xs tracking-wider mt-1"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            DURATA
          </Text>
        </View>

        {workout && workout.totalVolume > 0 && (
          <View className="items-center">
            <Text
              className="text-setly-accent text-4xl tracking-wider"
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              {formatVolume(workout.totalVolume)}
            </Text>
            <Text
              className="text-setly-muted text-xs tracking-wider mt-1"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              VOLUME KG
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Advanced Stats */}
      {stats && stats.maxWeight > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(300)} className="w-full mb-8">
          <View className="flex-row gap-3">
            {/* Max Weight */}
            <View className="flex-1 border border-setly-border p-3">
              <Text
                className="text-setly-muted text-xs tracking-wider mb-1"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                MAX PESO
              </Text>
              <Text
                className="text-setly-text text-lg"
                style={{ fontFamily: 'SpaceMono_700Bold' }}
              >
                {stats.maxWeight} kg
              </Text>
            </View>

            {/* Avg Weight */}
            <View className="flex-1 border border-setly-border p-3">
              <Text
                className="text-setly-muted text-xs tracking-wider mb-1"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                MEDIA PESO
              </Text>
              <Text
                className="text-setly-text text-lg"
                style={{ fontFamily: 'SpaceMono_700Bold' }}
              >
                {stats.avgWeight} kg
              </Text>
            </View>

            {/* Avg Reps */}
            <View className="flex-1 border border-setly-border p-3">
              <Text
                className="text-setly-muted text-xs tracking-wider mb-1"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                MEDIA REPS
              </Text>
              <Text
                className="text-setly-text text-lg"
                style={{ fontFamily: 'SpaceMono_700Bold' }}
              >
                {stats.avgReps}
              </Text>
            </View>
          </View>

          {/* Estimated 1RM */}
          {stats.estimated1RM > 0 && (
            <View className="mt-3 border border-setly-accent/30 bg-setly-accent/5 p-3 flex-row justify-between items-center">
              <View>
                <Text
                  className="text-setly-muted text-xs tracking-wider"
                  style={{ fontFamily: 'SpaceMono_400Regular' }}
                >
                  1RM STIMATO (EPLEY)
                </Text>
                <Text
                  className="text-setly-muted text-xs tracking-wider mt-0.5"
                  style={{ fontFamily: 'SpaceMono_400Regular' }}
                >
                  da {stats.bestSetWeight}kg × {stats.bestSetReps}
                </Text>
              </View>
              <Text
                className="text-setly-accent text-2xl"
                style={{ fontFamily: 'SpaceMono_700Bold' }}
              >
                ~{stats.estimated1RM} kg
              </Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* Set Details */}
      {workout && workout.sets.length > 0 && (
        <Animated.View entering={FadeInDown.duration(400).delay(400)} className="w-full mb-8">
          <Text
            className="text-setly-muted text-xs tracking-wider mb-4"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            DETTAGLIO SET
          </Text>

          <View className="border border-setly-border">
            {/* Header */}
            <View className="flex-row border-b border-setly-border px-4 py-3 bg-setly-border/20">
              <Text
                className="text-setly-muted text-xs w-12"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                SET
              </Text>
              <Text
                className="text-setly-muted text-xs flex-1 text-center"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                PESO
              </Text>
              <Text
                className="text-setly-muted text-xs flex-1 text-center"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                REPS
              </Text>
              <Text
                className="text-setly-muted text-xs flex-1 text-right"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                VOLUME
              </Text>
            </View>

            {/* Rows */}
            {workout.sets.map((set, index) => {
              const setVolume = (set.weight || 0) * (set.reps || 0);
              const isMaxWeight = stats && set.weight === stats.maxWeight;
              return (
                <View
                  key={index}
                  className={`flex-row px-4 py-3 ${index < workout.sets.length - 1 ? 'border-b border-setly-border' : ''}`}
                >
                  <Text
                    className="text-setly-text text-sm w-12"
                    style={{ fontFamily: 'SpaceMono_700Bold' }}
                  >
                    {set.setNumber}
                  </Text>
                  <Text
                    className={`text-sm flex-1 text-center ${isMaxWeight ? 'text-setly-accent' : 'text-setly-text'}`}
                    style={{ fontFamily: 'SpaceMono_400Regular' }}
                  >
                    {set.weight ? `${set.weight} kg` : '-'}
                  </Text>
                  <Text
                    className="text-setly-text text-sm flex-1 text-center"
                    style={{ fontFamily: 'SpaceMono_400Regular' }}
                  >
                    {set.reps || '-'}
                  </Text>
                  <Text
                    className="text-setly-text text-sm flex-1 text-right"
                    style={{ fontFamily: 'SpaceMono_400Regular' }}
                  >
                    {setVolume > 0 ? `${setVolume} kg` : '-'}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Totals row */}
          {workout.totalVolume > 0 && (
            <View className="flex-row px-4 py-3 border-x border-b border-setly-accent/50 bg-setly-accent/5">
              <Text
                className="text-setly-accent text-sm w-12"
                style={{ fontFamily: 'SpaceMono_700Bold' }}
              >
                TOT
              </Text>
              <Text
                className="text-setly-muted text-sm flex-1 text-center"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                -
              </Text>
              <Text
                className="text-setly-accent text-sm flex-1 text-center"
                style={{ fontFamily: 'SpaceMono_700Bold' }}
              >
                {workout.totalReps}
              </Text>
              <Text
                className="text-setly-accent text-sm flex-1 text-right"
                style={{ fontFamily: 'SpaceMono_700Bold' }}
              >
                {workout.totalVolume} kg
              </Text>
            </View>
          )}
        </Animated.View>
      )}

      {/* Action buttons */}
      <Animated.View entering={FadeInDown.duration(400).delay(500)} className="w-full gap-3">
        <Pressable
          onPress={handleDone}
          className="py-4 border border-setly-text/50 active:bg-white/5"
        >
          <Text
            className="text-setly-text text-center tracking-widest"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            FATTO
          </Text>
        </Pressable>

        <Pressable
          onPress={handleGoStats}
          className="py-3"
        >
          <Text
            className="text-setly-muted text-center text-sm tracking-wider"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            VEDI STATISTICHE
          </Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}

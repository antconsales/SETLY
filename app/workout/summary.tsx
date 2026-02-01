import { View, Text, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
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
    // Success haptic on mount
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(tabs)/home');
  };

  // Format volume for display
  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k`;
    }
    return volume.toString();
  };

  return (
    <ScrollView className="flex-1 bg-setly-black" contentContainerClassName="items-center px-8 py-16">
      {/* Decorative elements */}
      <View className="absolute left-0 top-1/4 w-16 h-px bg-setly-border" />
      <View className="absolute right-0 bottom-1/3 w-12 h-px bg-setly-border" />

      {/* Success indicator */}
      <View className="w-16 h-16 rounded-full border-2 border-setly-accent items-center justify-center mb-8 mt-8">
        <Text className="text-setly-accent text-2xl">✓</Text>
      </View>

      {/* Title */}
      <Text
        className="text-setly-text text-xl tracking-widest mb-2"
        style={{ fontFamily: 'SpaceMono_700Bold' }}
      >
        ALLENAMENTO SALVATO
      </Text>

      <Text
        className="text-setly-muted text-sm tracking-wider mb-8"
        style={{ fontFamily: 'SpaceMono_400Regular' }}
      >
        {exerciseName?.toUpperCase()}
      </Text>

      {/* Main Stats */}
      <View className="flex-row gap-8 mb-8">
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
      </View>

      {/* Set Details */}
      {workout && workout.sets.length > 0 && (
        <View className="w-full mb-8">
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
                    className="text-setly-text text-sm flex-1 text-center"
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
        </View>
      )}

      {/* Done button */}
      <Pressable
        onPress={handleDone}
        className="px-16 py-4 border border-setly-text/50 active:bg-white/5"
      >
        <Text
          className="text-setly-text text-center tracking-widest"
          style={{ fontFamily: 'SpaceMono_700Bold' }}
        >
          FATTO
        </Text>
      </Pressable>
    </ScrollView>
  );
}

import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useExerciseStore, useSettingsStore, useWorkoutStore } from '@/stores';

export default function ExerciseSelect() {
  const [autoDetect, setAutoDetect] = useState(false);
  const { exercises, isLoading } = useExerciseStore();
  const { defaultSets, hapticEnabled } = useSettingsStore();
  const { startWorkout } = useWorkoutStore();

  const handleSelect = (id: number, name: string) => {
    if (hapticEnabled) {
      Haptics.selectionAsync();
    }
    // Start workout in store
    startWorkout(id, name, defaultSets);
    // Navigate to active workout
    router.push({
      pathname: '/workout/active',
      params: { exerciseId: id, exerciseName: name },
    });
  };

  const handleToggleAutoDetect = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setAutoDetect(!autoDetect);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-setly-black justify-center items-center">
        <ActivityIndicator color="#E5E5E5" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-setly-black">
      {/* Header */}
      <View className="px-6 pt-16 pb-4 border-b border-setly-border">
        <Pressable onPress={() => router.back()}>
          <Text
            className="text-setly-muted text-sm tracking-wider"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            ← BACK
          </Text>
        </Pressable>
        <Text
          className="text-setly-text text-xl mt-4 tracking-wider"
          style={{ fontFamily: 'SpaceMono_700Bold' }}
        >
          SELECT EXERCISE
        </Text>
      </View>

      <ScrollView className="flex-1">
        {/* Exercise list from database */}
        {exercises.map((exercise) => (
          <Pressable
            key={exercise.id}
            onPress={() => handleSelect(exercise.id, exercise.name)}
            className="px-6 py-5 border-b border-setly-border active:bg-white/5"
          >
            <View className="flex-row justify-between items-center">
              <View>
                <Text
                  className="text-setly-text text-base"
                  style={{ fontFamily: 'SpaceMono_400Regular' }}
                >
                  {exercise.name}
                </Text>
                {exercise.category && (
                  <Text
                    className="text-setly-muted text-xs mt-1 tracking-wider"
                    style={{ fontFamily: 'SpaceMono_400Regular' }}
                  >
                    {exercise.category.toUpperCase()}
                  </Text>
                )}
              </View>
              <Text
                className="text-setly-muted text-lg"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                ›
              </Text>
            </View>
          </Pressable>
        ))}

        {/* Auto-detect toggle */}
        <Pressable
          onPress={handleToggleAutoDetect}
          className="px-6 py-5 border-b border-setly-border flex-row justify-between items-center"
        >
          <Text
            className="text-setly-text text-base"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            Auto-detect
          </Text>
          <View
            className={`w-12 h-6 rounded-full ${autoDetect ? 'bg-setly-accent/30' : 'bg-setly-border'} justify-center px-0.5`}
          >
            <View
              className={`w-5 h-5 rounded-full ${autoDetect ? 'bg-setly-accent self-end' : 'bg-setly-muted self-start'}`}
            />
          </View>
        </Pressable>

        {/* Empty state */}
        {exercises.length === 0 && (
          <View className="px-6 py-12 items-center">
            <Text
              className="text-setly-muted text-sm tracking-wider"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              NO EXERCISES FOUND
            </Text>
          </View>
        )}

        {/* Spacer */}
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}

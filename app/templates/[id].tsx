import { View, Text, ScrollView, Pressable } from 'react-native';
import { useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTemplateStore, useWorkoutStore, useSettingsStore } from '@/stores';

export default function TemplateDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { templates, fetchTemplates } = useTemplateStore();
  const { startWorkout } = useWorkoutStore();
  const { hapticEnabled, defaultSets } = useSettingsStore();

  const template = templates.find((t) => t.id === parseInt(id, 10));

  useEffect(() => {
    if (templates.length === 0) {
      fetchTemplates();
    }
  }, [templates.length, fetchTemplates]);

  const handleStartWorkout = (exerciseId: number, exerciseName: string, targetSets?: number | null) => {
    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    startWorkout(exerciseId, exerciseName, targetSets || defaultSets);
    router.replace({
      pathname: '/workout/active',
      params: { exerciseName },
    });
  };

  const handleStartAll = () => {
    if (!template || template.exercises.length === 0) return;

    const firstExercise = template.exercises[0];
    handleStartWorkout(
      firstExercise.exerciseId,
      firstExercise.exerciseName,
      firstExercise.targetSets
    );
  };

  const handleBack = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  if (!template) {
    return (
      <View className="flex-1 bg-setly-black items-center justify-center">
        <Text
          className="text-setly-muted text-sm tracking-wider"
          style={{ fontFamily: 'SpaceMono_400Regular' }}
        >
          TEMPLATE NON TROVATO
        </Text>
        <Pressable onPress={handleBack} className="mt-4 px-6 py-3 border border-setly-border">
          <Text
            className="text-setly-text text-sm tracking-wider"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            INDIETRO
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-setly-black">
      {/* Header */}
      <View className="px-6 pt-16 pb-6">
        <Pressable onPress={handleBack} className="mb-4">
          <Text
            className="text-setly-muted text-sm tracking-wider"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            ← INDIETRO
          </Text>
        </Pressable>

        <Text
          className="text-setly-text text-2xl tracking-widest"
          style={{ fontFamily: 'SpaceMono_700Bold' }}
        >
          {template.name.toUpperCase()}
        </Text>

        {template.description && (
          <Text
            className="text-setly-muted text-sm mt-2"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            {template.description}
          </Text>
        )}
      </View>

      {/* Start all button */}
      <View className="px-6 mb-6">
        <Pressable
          onPress={handleStartAll}
          className="py-4 border border-setly-accent bg-setly-accent/10"
        >
          <Text
            className="text-setly-accent text-center tracking-widest"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            INIZIA WORKOUT COMPLETO
          </Text>
        </Pressable>
      </View>

      {/* Exercises list */}
      <ScrollView className="flex-1 px-6">
        <Text
          className="text-setly-muted text-xs tracking-wider mb-4"
          style={{ fontFamily: 'SpaceMono_400Regular' }}
        >
          ESERCIZI ({template.exercises.length})
        </Text>

        {template.exercises.map((exercise, index) => (
          <View
            key={exercise.id}
            className={`border border-setly-border p-4 mb-3 ${
              index === 0 ? 'border-setly-accent/30' : ''
            }`}
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Text
                  className="text-setly-muted text-sm mr-3"
                  style={{ fontFamily: 'SpaceMono_400Regular' }}
                >
                  {(index + 1).toString().padStart(2, '0')}
                </Text>
                <View>
                  <Text
                    className="text-setly-text text-base"
                    style={{ fontFamily: 'SpaceMono_700Bold' }}
                  >
                    {exercise.exerciseName.toUpperCase()}
                  </Text>
                  {exercise.category && (
                    <Text
                      className="text-setly-muted text-xs mt-1"
                      style={{ fontFamily: 'SpaceMono_400Regular' }}
                    >
                      {exercise.category.toUpperCase()}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Targets */}
            <View className="flex-row gap-4 mb-3">
              <View>
                <Text
                  className="text-setly-accent text-lg"
                  style={{ fontFamily: 'SpaceMono_700Bold' }}
                >
                  {exercise.targetSets || 4}
                </Text>
                <Text
                  className="text-setly-muted text-xs"
                  style={{ fontFamily: 'SpaceMono_400Regular' }}
                >
                  SET
                </Text>
              </View>
              {exercise.targetReps && (
                <View>
                  <Text
                    className="text-setly-text text-lg"
                    style={{ fontFamily: 'SpaceMono_700Bold' }}
                  >
                    {exercise.targetReps}
                  </Text>
                  <Text
                    className="text-setly-muted text-xs"
                    style={{ fontFamily: 'SpaceMono_400Regular' }}
                  >
                    REPS
                  </Text>
                </View>
              )}
              {exercise.targetWeight && (
                <View>
                  <Text
                    className="text-setly-text text-lg"
                    style={{ fontFamily: 'SpaceMono_700Bold' }}
                  >
                    {exercise.targetWeight}kg
                  </Text>
                  <Text
                    className="text-setly-muted text-xs"
                    style={{ fontFamily: 'SpaceMono_400Regular' }}
                  >
                    PESO
                  </Text>
                </View>
              )}
            </View>

            {/* Start single exercise */}
            <Pressable
              onPress={() =>
                handleStartWorkout(
                  exercise.exerciseId,
                  exercise.exerciseName,
                  exercise.targetSets
                )
              }
              className="py-2 border border-setly-text/30"
            >
              <Text
                className="text-setly-text text-center text-sm tracking-wider"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                INIZIA
              </Text>
            </Pressable>
          </View>
        ))}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}

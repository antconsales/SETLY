import { View, Text, ScrollView, Pressable } from 'react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTemplateStore, useWorkoutStore, useSettingsStore } from '@/stores';

export default function TemplatesScreen() {
  const { templates, isLoading, fetchTemplates } = useTemplateStore();
  const { startWorkout } = useWorkoutStore();
  const { hapticEnabled, defaultSets } = useSettingsStore();

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSelectTemplate = (templateId: number) => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push({
      pathname: '/templates/[id]',
      params: { id: templateId.toString() },
    });
  };

  const handleStartFromTemplate = (template: typeof templates[0]) => {
    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Start workout with first exercise from template
    if (template.exercises.length > 0) {
      const firstExercise = template.exercises[0];
      startWorkout(
        firstExercise.exerciseId,
        firstExercise.exerciseName,
        firstExercise.targetSets || defaultSets
      );
      router.push({
        pathname: '/workout/active',
        params: {
          exerciseName: firstExercise.exerciseName,
          templateId: template.id.toString(),
        },
      });
    }
  };

  const handleBack = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-setly-black items-center justify-center">
        <Text
          className="text-setly-muted text-sm tracking-wider"
          style={{ fontFamily: 'SpaceMono_400Regular' }}
        >
          LOADING TEMPLATES...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-setly-black">
      {/* Header */}
      <View className="px-6 pt-16 pb-6 flex-row items-center justify-between">
        <View>
          <Text
            className="text-setly-text text-2xl tracking-widest"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            TEMPLATES
          </Text>
          <Text
            className="text-setly-muted text-xs tracking-wider mt-1"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            PROGRAMMI PREDEFINITI
          </Text>
        </View>
        <Pressable onPress={handleBack} className="p-2">
          <Text
            className="text-setly-muted text-2xl"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            ×
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6">
        {templates.map((template) => (
          <Pressable
            key={template.id}
            onPress={() => handleSelectTemplate(template.id)}
            className="border border-setly-border p-4 mb-4 active:bg-white/5"
          >
            {/* Template header */}
            <View className="flex-row items-center justify-between mb-2">
              <Text
                className="text-setly-text text-lg tracking-wider"
                style={{ fontFamily: 'SpaceMono_700Bold' }}
              >
                {template.name.toUpperCase()}
              </Text>
              {template.isDefault && (
                <View className="px-2 py-1 border border-setly-accent/50">
                  <Text
                    className="text-setly-accent text-xs"
                    style={{ fontFamily: 'SpaceMono_400Regular' }}
                  >
                    DEFAULT
                  </Text>
                </View>
              )}
            </View>

            {/* Description */}
            {template.description && (
              <Text
                className="text-setly-muted text-sm mb-3"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                {template.description}
              </Text>
            )}

            {/* Exercises list */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {template.exercises.map((exercise) => (
                <View
                  key={exercise.id}
                  className="px-2 py-1 bg-setly-border/50 rounded"
                >
                  <Text
                    className="text-setly-text text-xs"
                    style={{ fontFamily: 'SpaceMono_400Regular' }}
                  >
                    {exercise.exerciseName}
                  </Text>
                </View>
              ))}
            </View>

            {/* Quick start button */}
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleStartFromTemplate(template);
              }}
              className="py-3 border border-setly-accent/50 bg-setly-accent/10"
            >
              <Text
                className="text-setly-accent text-center text-sm tracking-wider"
                style={{ fontFamily: 'SpaceMono_700Bold' }}
              >
                INIZIA WORKOUT
              </Text>
            </Pressable>
          </Pressable>
        ))}

        {templates.length === 0 && (
          <View className="py-12 items-center">
            <Text
              className="text-setly-muted text-sm text-center tracking-wider"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              NESSUN TEMPLATE
              {'\n\n'}
              I templates verranno caricati automaticamente.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

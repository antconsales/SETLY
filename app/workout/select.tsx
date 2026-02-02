import { View, Text, Pressable, ScrollView, ActivityIndicator, TextInput, Modal } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useExerciseStore, useSettingsStore, useWorkoutStore } from '@/stores';

export default function ExerciseSelect() {
  const { exercises, isLoading, addExercise } = useExerciseStore();
  const { defaultSets, hapticEnabled } = useSettingsStore();
  const { startWorkout } = useWorkoutStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');

  const handleSelect = (id: number, name: string) => {
    if (hapticEnabled) {
      Haptics.selectionAsync();
    }
    startWorkout(id, name, defaultSets);
    router.push({
      pathname: '/workout/active',
      params: { exerciseId: id, exerciseName: name },
    });
  };

  const handleAddCustom = async () => {
    if (!newExerciseName.trim()) return;

    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const exercise = await addExercise(newExerciseName.trim());
    setNewExerciseName('');
    setShowAddModal(false);

    if (exercise) {
      startWorkout(exercise.id, exercise.name, defaultSets);
      router.push({
        pathname: '/workout/active',
        params: { exerciseId: exercise.id, exerciseName: exercise.name },
      });
    }
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
      <View className="px-6 pt-16 pb-4 border-b border-setly-border flex-row justify-between items-end">
        <View>
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
            EXERCISE
          </Text>
        </View>

        <Pressable
          onPress={() => {
            if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowAddModal(true);
          }}
          className="pb-1"
        >
          <Text
            className="text-setly-accent text-sm tracking-wider"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            + NEW
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1">
        {exercises.map((exercise) => (
          <Pressable
            key={exercise.id}
            onPress={() => handleSelect(exercise.id, exercise.name)}
            className="px-6 py-5 border-b border-setly-border active:bg-white/5"
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                {exercise.isCustom && (
                  <View className="w-1.5 h-1.5 rounded-full bg-setly-accent mr-3" />
                )}
                <Text
                  className="text-setly-text text-base"
                  style={{ fontFamily: 'SpaceMono_400Regular' }}
                >
                  {exercise.name}
                </Text>
              </View>
              <Text className="text-setly-muted">›</Text>
            </View>
          </Pressable>
        ))}

        <View className="h-20" />
      </ScrollView>

      {/* Add Custom Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/80 justify-center px-8"
          onPress={() => setShowAddModal(false)}
        >
          <Pressable className="bg-setly-black border border-setly-border p-6">
            <Text
              className="text-setly-text text-lg tracking-widest mb-6"
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              NEW EXERCISE
            </Text>

            <TextInput
              value={newExerciseName}
              onChangeText={setNewExerciseName}
              placeholder="Exercise name"
              placeholderTextColor="#666"
              autoFocus
              className="border border-setly-border px-4 py-3 text-setly-text text-base mb-6"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            />

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowAddModal(false)}
                className="flex-1 py-3 border border-setly-border"
              >
                <Text
                  className="text-setly-muted text-center tracking-wider"
                  style={{ fontFamily: 'SpaceMono_400Regular' }}
                >
                  CANCEL
                </Text>
              </Pressable>

              <Pressable
                onPress={handleAddCustom}
                className="flex-1 py-3 border border-setly-accent bg-setly-accent/10"
              >
                <Text
                  className="text-setly-accent text-center tracking-wider"
                  style={{ fontFamily: 'SpaceMono_700Bold' }}
                >
                  ADD & START
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

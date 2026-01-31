import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useExerciseStore, useSettingsStore } from '@/stores';
import { useScheduleStore } from '@/stores/scheduleStore';
import { DatePicker } from '@/components/ui/DatePicker';
import { TimePicker } from '@/components/ui/TimePicker';

export default function CreateSchedule() {
  const { exercises, isLoading: loadingExercises } = useExerciseStore();
  const { defaultSets, hapticEnabled } = useSettingsStore();
  const { scheduleWorkout, enableNotifications, notificationsEnabled } = useScheduleStore();

  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return tomorrow;
  });
  const [time, setTime] = useState({ hours: 9, minutes: 0 });
  const [isScheduling, setIsScheduling] = useState(false);

  // Request notification permissions on mount
  useEffect(() => {
    enableNotifications();
  }, [enableNotifications]);

  // Update date when time changes
  useEffect(() => {
    const newDate = new Date(selectedDate);
    newDate.setHours(time.hours, time.minutes, 0, 0);
    setSelectedDate(newDate);
  }, [time]);

  const selectedExercise = exercises.find((e) => e.id === selectedExerciseId);

  const handleSelectExercise = (id: number) => {
    if (hapticEnabled) {
      Haptics.selectionAsync();
    }
    setSelectedExerciseId(id);
  };

  const handleSchedule = async () => {
    if (!selectedExerciseId) return;

    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsScheduling(true);

    const scheduledId = await scheduleWorkout(
      selectedExerciseId,
      selectedDate,
      defaultSets
    );

    setIsScheduling(false);

    if (scheduledId) {
      if (hapticEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.back();
    }
  };

  const formatScheduledTime = () => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };
    return selectedDate.toLocaleDateString('en-US', options).toUpperCase();
  };

  if (loadingExercises) {
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
            ← CANCEL
          </Text>
        </Pressable>
        <Text
          className="text-setly-text text-xl mt-4 tracking-wider"
          style={{ fontFamily: 'SpaceMono_700Bold' }}
        >
          SCHEDULE WORKOUT
        </Text>
      </View>

      <ScrollView className="flex-1">
        {/* Date picker */}
        <View className="mt-6">
          <Text
            className="text-setly-muted text-xs tracking-wider px-6 mb-2"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            SELECT DATE
          </Text>
          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
          />
        </View>

        {/* Time picker */}
        <View className="mt-8 px-6">
          <Text
            className="text-setly-muted text-xs tracking-wider mb-4"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            SELECT TIME
          </Text>
          <TimePicker value={time} onChange={setTime} />
        </View>

        {/* Exercise selection */}
        <View className="mt-8">
          <Text
            className="text-setly-muted text-xs tracking-wider px-6 mb-2"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            SELECT EXERCISE
          </Text>

          {exercises.map((exercise) => (
            <Pressable
              key={exercise.id}
              onPress={() => handleSelectExercise(exercise.id)}
              className={`px-6 py-4 border-b border-setly-border ${
                selectedExerciseId === exercise.id ? 'bg-white/5' : ''
              }`}
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
                {selectedExerciseId === exercise.id && (
                  <View className="w-4 h-4 rounded-full bg-setly-accent items-center justify-center">
                    <Text className="text-setly-black text-xs">✓</Text>
                  </View>
                )}
              </View>
            </Pressable>
          ))}
        </View>

        {/* Notification status */}
        <View className="mt-8 px-6">
          <View className="flex-row items-center gap-2">
            <View
              className={`w-2 h-2 rounded-full ${
                notificationsEnabled ? 'bg-setly-accent' : 'bg-setly-muted'
              }`}
            />
            <Text
              className="text-setly-muted text-xs tracking-wider"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              {notificationsEnabled
                ? 'REMINDER 15 MIN BEFORE'
                : 'NOTIFICATIONS DISABLED'}
            </Text>
          </View>
        </View>

        {/* Spacer */}
        <View className="h-32" />
      </ScrollView>

      {/* Bottom action */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-setly-black border-t border-setly-border">
        {/* Preview */}
        {selectedExercise && (
          <Text
            className="text-setly-muted text-xs tracking-wider text-center mb-4"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            {selectedExercise.name.toUpperCase()} • {formatScheduledTime()}
          </Text>
        )}

        <Pressable
          onPress={handleSchedule}
          disabled={!selectedExerciseId || isScheduling}
          className={`py-4 border ${
            selectedExerciseId
              ? 'border-setly-accent bg-setly-accent/10'
              : 'border-setly-border'
          }`}
        >
          {isScheduling ? (
            <ActivityIndicator color="#4ADE80" />
          ) : (
            <Text
              className={`text-center tracking-widest ${
                selectedExerciseId ? 'text-setly-accent' : 'text-setly-muted'
              }`}
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              SCHEDULE
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import type { WorkoutWithDetails } from '@/hooks/useWorkoutHistory';
import type { ScheduledWorkoutWithDetails } from '@/stores/scheduleStore';
import { useSettingsStore, useScheduleStore } from '@/stores';

interface DayDetailProps {
  date: Date;
  workouts: WorkoutWithDetails[];
  scheduledWorkouts?: ScheduledWorkoutWithDetails[];
  onClose: () => void;
}

const DAYS_FULL = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MONTHS_FULL = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

export function DayDetail({ date, workouts, scheduledWorkouts = [], onClose }: DayDetailProps) {
  const { hapticEnabled } = useSettingsStore();
  const { cancelScheduledWorkout } = useScheduleStore();

  // Filter scheduled workouts that are not completed
  const pendingScheduled = scheduledWorkouts.filter((sw) => !sw.completed);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const handleStartScheduled = (exerciseId: number) => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push(`/workout/active?exerciseId=${exerciseId}`);
  };

  const handleCancelScheduled = async (id: number) => {
    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    await cancelScheduledWorkout(id);
  };

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="px-6 pt-4 pb-4 border-b border-setly-border">
        <Pressable onPress={onClose} className="mb-4">
          <Text
            className="text-setly-muted text-sm tracking-wider"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            ← BACK TO CALENDAR
          </Text>
        </Pressable>

        <Text
          className="text-setly-text text-lg tracking-wider"
          style={{ fontFamily: 'SpaceMono_700Bold' }}
        >
          {DAYS_FULL[date.getDay()]}, {date.getDate()} {MONTHS_FULL[date.getMonth()]}
        </Text>

        <View className="flex-row gap-4 mt-1">
          <Text
            className="text-setly-muted text-xs tracking-wider"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            {workouts.length} COMPLETED
          </Text>
          {pendingScheduled.length > 0 && (
            <Text
              className="text-setly-muted text-xs tracking-wider"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              • {pendingScheduled.length} SCHEDULED
            </Text>
          )}
        </View>
      </View>

      {/* Workouts list */}
      <ScrollView className="flex-1">
        {/* Scheduled workouts section */}
        {pendingScheduled.length > 0 && (
          <>
            <View className="px-6 pt-4 pb-2">
              <Text
                className="text-setly-muted text-xs tracking-wider"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                SCHEDULED
              </Text>
            </View>
            {pendingScheduled.map((scheduled) => (
              <View
                key={`scheduled-${scheduled.id}`}
                className="px-6 py-4 border-b border-setly-border"
              >
                {/* Exercise name and time */}
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-row items-center gap-2 flex-1">
                    <View className="w-2 h-2 rounded-full border border-setly-text" />
                    <Text
                      className="text-setly-text text-base"
                      style={{ fontFamily: 'SpaceMono_700Bold' }}
                    >
                      {scheduled.exerciseName}
                    </Text>
                  </View>
                  <Text
                    className="text-setly-muted text-xs tracking-wider"
                    style={{ fontFamily: 'SpaceMono_400Regular' }}
                  >
                    {formatTime(scheduled.scheduledFor)}
                  </Text>
                </View>

                {/* Planned sets */}
                {scheduled.plannedSets && (
                  <Text
                    className="text-setly-muted text-xs tracking-wider mb-3"
                    style={{ fontFamily: 'SpaceMono_400Regular' }}
                  >
                    {scheduled.plannedSets} SETS PLANNED
                  </Text>
                )}

                {/* Action buttons */}
                <View className="flex-row gap-4 mt-2">
                  <Pressable
                    onPress={() => handleStartScheduled(scheduled.exerciseId)}
                    className="px-4 py-2 bg-setly-border active:bg-setly-border/70"
                  >
                    <Text
                      className="text-setly-text text-xs tracking-wider"
                      style={{ fontFamily: 'SpaceMono_700Bold' }}
                    >
                      START NOW
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleCancelScheduled(scheduled.id)}
                    className="px-4 py-2 active:opacity-70"
                  >
                    <Text
                      className="text-setly-muted text-xs tracking-wider"
                      style={{ fontFamily: 'SpaceMono_400Regular' }}
                    >
                      CANCEL
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Completed workouts section */}
        {workouts.length > 0 && (
          <View className="px-6 pt-4 pb-2">
            <Text
              className="text-setly-muted text-xs tracking-wider"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              COMPLETED
            </Text>
          </View>
        )}

        {workouts.length === 0 && pendingScheduled.length === 0 ? (
          <View className="px-6 py-12 items-center">
            <Text
              className="text-setly-muted text-sm tracking-wider"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              NO WORKOUTS
            </Text>
          </View>
        ) : workouts.length === 0 ? null : (
          workouts.map((workout) => (
            <View
              key={workout.id}
              className="px-6 py-4 border-b border-setly-border"
            >
              {/* Exercise name and time */}
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-row items-center gap-2 flex-1">
                  <View className="w-2 h-2 rounded-full bg-setly-accent" />
                  <Text
                    className="text-setly-text text-base"
                    style={{ fontFamily: 'SpaceMono_700Bold' }}
                  >
                    {workout.exerciseName}
                  </Text>
                </View>
                <Text
                  className="text-setly-muted text-xs tracking-wider"
                  style={{ fontFamily: 'SpaceMono_400Regular' }}
                >
                  {formatTime(workout.completedAt)}
                </Text>
              </View>

              {/* Category */}
              {workout.exerciseCategory && (
                <Text
                  className="text-setly-muted text-xs tracking-wider mb-3"
                  style={{ fontFamily: 'SpaceMono_400Regular' }}
                >
                  {workout.exerciseCategory.toUpperCase()}
                </Text>
              )}

              {/* Stats */}
              <View className="flex-row gap-6">
                <View>
                  <Text
                    className="text-setly-text text-xl"
                    style={{ fontFamily: 'SpaceMono_700Bold' }}
                  >
                    {workout.totalSets}
                  </Text>
                  <Text
                    className="text-setly-muted text-xs tracking-wider"
                    style={{ fontFamily: 'SpaceMono_400Regular' }}
                  >
                    SETS
                  </Text>
                </View>

                <View>
                  <Text
                    className="text-setly-text text-xl"
                    style={{ fontFamily: 'SpaceMono_700Bold' }}
                  >
                    {formatDuration(workout.totalDuration)}
                  </Text>
                  <Text
                    className="text-setly-muted text-xs tracking-wider"
                    style={{ fontFamily: 'SpaceMono_400Regular' }}
                  >
                    DURATION
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}

        {/* Spacer */}
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}

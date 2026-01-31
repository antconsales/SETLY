import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useWorkoutHistory } from '@/hooks';
import { useSettingsStore, useScheduleStore } from '@/stores';
import { MonthView } from '@/components/ui/MonthView';
import { DayDetail } from '@/components/ui/DayDetail';

export default function Calendar() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const {
    workoutsByDay,
    isLoading: loadingHistory,
    fetchMonthWorkouts,
    getWorkoutsForDate,
    hasWorkouts,
    getWorkoutCount,
    formatDateKey,
  } = useWorkoutHistory();

  const {
    scheduledWorkouts,
    isLoading: loadingScheduled,
    fetchScheduledWorkouts,
  } = useScheduleStore();

  const { hapticEnabled } = useSettingsStore();

  // Calculate total workouts this month
  const monthlyWorkoutCount = Object.values(workoutsByDay).reduce(
    (acc, dayWorkouts) => acc + dayWorkouts.length,
    0
  );

  // Fetch data when month changes
  useEffect(() => {
    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    fetchMonthWorkouts(currentYear, currentMonth);
    fetchScheduledWorkouts(startDate, endDate);
  }, [currentYear, currentMonth, fetchMonthWorkouts, fetchScheduledWorkouts]);

  // Check if a date has scheduled workouts
  const hasScheduled = useCallback((date: Date): boolean => {
    const dateKey = formatDateKey(date);
    return scheduledWorkouts.some((sw) => {
      const swDate = new Date(sw.scheduledFor);
      return formatDateKey(swDate) === dateKey && !sw.completed;
    });
  }, [scheduledWorkouts, formatDateKey]);

  // Get scheduled workouts for a specific date
  const getScheduledForDate = useCallback((date: Date) => {
    const dateKey = formatDateKey(date);
    return scheduledWorkouts.filter((sw) => {
      const swDate = new Date(sw.scheduledFor);
      return formatDateKey(swDate) === dateKey;
    });
  }, [scheduledWorkouts, formatDateKey]);

  const handlePrevMonth = useCallback(() => {
    if (hapticEnabled) {
      Haptics.selectionAsync();
    }
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }, [currentMonth, hapticEnabled]);

  const handleNextMonth = useCallback(() => {
    // Allow going up to 2 months in the future for scheduling
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 2);

    if (currentYear > maxDate.getFullYear() ||
        (currentYear === maxDate.getFullYear() && currentMonth >= maxDate.getMonth())) {
      return;
    }

    if (hapticEnabled) {
      Haptics.selectionAsync();
    }
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }, [currentMonth, currentYear, hapticEnabled]);

  const handleSelectDate = useCallback((date: Date) => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedDate(date);
  }, [hapticEnabled]);

  const handleCloseDetail = useCallback(() => {
    if (hapticEnabled) {
      Haptics.selectionAsync();
    }
    setSelectedDate(null);
  }, [hapticEnabled]);

  const handleSchedule = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/schedule/create');
  }, [hapticEnabled]);

  // Check if can navigate to next month
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return d;
  }, []);

  const canGoNext = currentYear < maxDate.getFullYear() ||
    (currentYear === maxDate.getFullYear() && currentMonth < maxDate.getMonth());

  const isLoading = loadingHistory || loadingScheduled;

  // Show day detail if a date is selected
  if (selectedDate) {
    const dayWorkouts = getWorkoutsForDate(selectedDate);
    const dayScheduled = getScheduledForDate(selectedDate);

    return (
      <View className="flex-1 bg-setly-black pt-12">
        <DayDetail
          date={selectedDate}
          workouts={dayWorkouts}
          scheduledWorkouts={dayScheduled}
          onClose={handleCloseDetail}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-setly-black pt-12 px-4">
      {/* Navigation arrows */}
      <View className="flex-row justify-between items-center mb-6 px-2">
        <Pressable onPress={handlePrevMonth} className="px-4 py-2">
          <Text
            className="text-setly-text text-lg"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            ←
          </Text>
        </Pressable>

        <Pressable onPress={handleNextMonth} className="px-4 py-2" disabled={!canGoNext}>
          <Text
            className={`text-lg ${canGoNext ? 'text-setly-text' : 'text-setly-muted/30'}`}
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            →
          </Text>
        </Pressable>
      </View>

      {/* Loading indicator */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#E5E5E5" />
        </View>
      ) : (
        <>
          {/* Month view */}
          <MonthView
            year={currentYear}
            month={currentMonth}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
            hasWorkouts={hasWorkouts}
            getWorkoutCount={getWorkoutCount}
            hasScheduled={hasScheduled}
          />

          {/* Legend */}
          <View className="mt-8 px-4">
            <View className="flex-row items-center gap-2 mb-2">
              <View className="w-2 h-2 rounded-full bg-setly-accent" />
              <Text
                className="text-setly-muted text-xs tracking-wider"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                COMPLETED
              </Text>
            </View>
            <View className="flex-row items-center gap-2 mb-2">
              <View className="w-2 h-2 rounded-full border border-setly-text" />
              <Text
                className="text-setly-muted text-xs tracking-wider"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                SCHEDULED
              </Text>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="w-4 h-4 rounded-full bg-setly-border items-center justify-center">
                <Text className="text-setly-text text-[8px]">•</Text>
              </View>
              <Text
                className="text-setly-muted text-xs tracking-wider"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                TODAY
              </Text>
            </View>
          </View>

          {/* Quick stats */}
          <View className="absolute bottom-24 left-0 right-0 px-6">
            <View className="flex-row justify-center gap-8">
              <View className="items-center">
                <Text
                  className="text-setly-text text-2xl"
                  style={{ fontFamily: 'SpaceMono_700Bold' }}
                >
                  {monthlyWorkoutCount > 0 ? monthlyWorkoutCount : '—'}
                </Text>
                <Text
                  className="text-setly-muted text-xs tracking-wider"
                  style={{ fontFamily: 'SpaceMono_400Regular' }}
                >
                  THIS MONTH
                </Text>
              </View>
            </View>
          </View>

          {/* Schedule button */}
          <Pressable
            onPress={handleSchedule}
            className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-setly-border items-center justify-center"
          >
            <Text
              className="text-setly-text text-2xl"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              +
            </Text>
          </Pressable>
        </>
      )}

      {/* Decorative elements */}
      <View className="absolute left-0 top-1/3 w-8 h-px bg-setly-border" />
    </View>
  );
}

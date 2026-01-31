import { View, Text, Pressable } from 'react-native';
import { useMemo } from 'react';

interface MonthViewProps {
  year: number;
  month: number; // 0-indexed
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  hasWorkouts: (date: Date) => boolean;
  getWorkoutCount: (date: Date) => number;
  hasScheduled?: (date: Date) => boolean;
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

export function MonthView({
  year,
  month,
  selectedDate,
  onSelectDate,
  hasWorkouts,
  getWorkoutCount,
  hasScheduled,
}: MonthViewProps) {
  const today = useMemo(() => new Date(), []);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    // Pad to complete the last row
    while (days.length % 7 !== 0) {
      days.push(null);
    }

    return days;
  }, [year, month]);

  const isToday = (date: Date) => {
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isFuture = (date: Date) => {
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return date > todayStart;
  };

  const isPast = (date: Date) => {
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return date < todayStart;
  };

  return (
    <View>
      {/* Month/Year header */}
      <Text
        className="text-setly-text text-lg tracking-widest mb-6 text-center"
        style={{ fontFamily: 'SpaceMono_700Bold' }}
      >
        {MONTHS[month]} {year}
      </Text>

      {/* Day headers */}
      <View className="flex-row mb-2">
        {DAYS.map((day, index) => (
          <View key={index} className="flex-1 items-center">
            <Text
              className="text-setly-muted text-xs"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View className="flex-row flex-wrap">
        {calendarDays.map((date, index) => {
          const hasWorkout = date ? hasWorkouts(date) : false;
          const isScheduled = date && hasScheduled ? hasScheduled(date) : false;
          const workoutCount = date ? getWorkoutCount(date) : 0;

          return (
            <View key={index} className="w-[14.28%] aspect-square p-1">
              {date ? (
                <Pressable
                  onPress={() => onSelectDate(date)}
                  className={`flex-1 items-center justify-center rounded-full ${
                    isSelected(date)
                      ? 'border border-setly-text'
                      : isToday(date)
                      ? 'bg-setly-border'
                      : ''
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      isSelected(date)
                        ? 'text-setly-text'
                        : hasWorkout
                        ? 'text-setly-text'
                        : isScheduled && !isPast(date)
                        ? 'text-setly-text'
                        : isFuture(date)
                        ? 'text-setly-muted/50'
                        : 'text-setly-muted'
                    }`}
                    style={{ fontFamily: 'SpaceMono_400Regular' }}
                  >
                    {date.getDate()}
                  </Text>

                  {/* Indicators */}
                  {!isSelected(date) && (
                    <View className="absolute bottom-1 flex-row gap-0.5">
                      {/* Completed workout dots (green) */}
                      {hasWorkout && workoutCount > 0 && (
                        <>
                          {Array.from({ length: Math.min(workoutCount, 3) }).map((_, i) => (
                            <View key={`w-${i}`} className="w-1 h-1 rounded-full bg-setly-accent" />
                          ))}
                        </>
                      )}
                      {/* Scheduled workout dot (white/outline) */}
                      {isScheduled && !isPast(date) && !hasWorkout && (
                        <View className="w-1 h-1 rounded-full border border-setly-text" />
                      )}
                    </View>
                  )}
                </Pressable>
              ) : (
                <View className="flex-1" />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

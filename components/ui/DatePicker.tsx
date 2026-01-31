import { View, Text, Pressable, ScrollView } from 'react-native';
import { useMemo } from 'react';
import * as Haptics from 'expo-haptics';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
}

const MONTHS_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function DatePicker({ value, onChange, minDate = new Date() }: DatePickerProps) {
  // Generate next 30 days
  const availableDates = useMemo(() => {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (!minDate || date >= minDate) {
        dates.push(date);
      }
    }
    return dates;
  }, [minDate]);

  const handleDateChange = (date: Date) => {
    Haptics.selectionAsync();
    // Preserve the time from the current value
    const newDate = new Date(date);
    newDate.setHours(value.getHours(), value.getMinutes(), 0, 0);
    onChange(newDate);
  };

  const isSelected = (date: Date) => {
    return (
      date.getDate() === value.getDate() &&
      date.getMonth() === value.getMonth() &&
      date.getFullYear() === value.getFullYear()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="py-4"
    >
      <View className="flex-row gap-2 px-4">
        {availableDates.map((date) => (
          <Pressable
            key={date.toISOString()}
            onPress={() => handleDateChange(date)}
            className={`w-16 py-3 items-center rounded ${
              isSelected(date)
                ? 'bg-setly-text'
                : 'bg-setly-border'
            }`}
          >
            <Text
              className={`text-xs tracking-wider ${
                isSelected(date) ? 'text-setly-black' : 'text-setly-muted'
              }`}
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              {MONTHS_SHORT[date.getMonth()]}
            </Text>
            <Text
              className={`text-xl mt-1 ${
                isSelected(date) ? 'text-setly-black' : 'text-setly-text'
              }`}
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              {date.getDate()}
            </Text>
            {isToday(date) && (
              <Text
                className={`text-[8px] tracking-wider ${
                  isSelected(date) ? 'text-setly-black' : 'text-setly-accent'
                }`}
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                TODAY
              </Text>
            )}
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

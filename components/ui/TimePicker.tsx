import { View, Text, Pressable, ScrollView } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';

interface TimePickerProps {
  value: { hours: number; minutes: number };
  onChange: (value: { hours: number; minutes: number }) => void;
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 5 min intervals

  const handleHourChange = (hour: number) => {
    Haptics.selectionAsync();
    onChange({ ...value, hours: hour });
  };

  const handleMinuteChange = (minute: number) => {
    Haptics.selectionAsync();
    onChange({ ...value, minutes: minute });
  };

  return (
    <View className="flex-row justify-center items-center gap-4">
      {/* Hours */}
      <View className="h-48 w-20">
        <ScrollView
          showsVerticalScrollIndicator={false}
          snapToInterval={48}
          decelerationRate="fast"
        >
          <View className="h-24" />
          {hours.map((hour) => (
            <Pressable
              key={hour}
              onPress={() => handleHourChange(hour)}
              className={`h-12 items-center justify-center ${
                value.hours === hour ? 'bg-setly-border rounded' : ''
              }`}
            >
              <Text
                className={`text-2xl ${
                  value.hours === hour ? 'text-setly-text' : 'text-setly-muted'
                }`}
                style={{ fontFamily: 'SpaceMono_700Bold' }}
              >
                {hour.toString().padStart(2, '0')}
              </Text>
            </Pressable>
          ))}
          <View className="h-24" />
        </ScrollView>
      </View>

      {/* Separator */}
      <Text
        className="text-setly-text text-3xl"
        style={{ fontFamily: 'SpaceMono_700Bold' }}
      >
        :
      </Text>

      {/* Minutes */}
      <View className="h-48 w-20">
        <ScrollView
          showsVerticalScrollIndicator={false}
          snapToInterval={48}
          decelerationRate="fast"
        >
          <View className="h-24" />
          {minutes.map((minute) => (
            <Pressable
              key={minute}
              onPress={() => handleMinuteChange(minute)}
              className={`h-12 items-center justify-center ${
                value.minutes === minute ? 'bg-setly-border rounded' : ''
              }`}
            >
              <Text
                className={`text-2xl ${
                  value.minutes === minute ? 'text-setly-text' : 'text-setly-muted'
                }`}
                style={{ fontFamily: 'SpaceMono_700Bold' }}
              >
                {minute.toString().padStart(2, '0')}
              </Text>
            </Pressable>
          ))}
          <View className="h-24" />
        </ScrollView>
      </View>
    </View>
  );
}

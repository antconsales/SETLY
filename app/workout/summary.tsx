import { View, Text, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';

export default function WorkoutSummary() {
  const { exerciseName, totalSets, totalTime } = useLocalSearchParams<{
    exerciseName: string;
    totalSets: string;
    totalTime: string;
  }>();

  useEffect(() => {
    // Success haptic on mount
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleDone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(tabs)/home');
  };

  return (
    <View className="flex-1 bg-setly-black justify-center items-center px-8">
      {/* Decorative elements */}
      <View className="absolute left-0 top-1/4 w-16 h-px bg-setly-border" />
      <View className="absolute right-0 bottom-1/3 w-12 h-px bg-setly-border" />

      {/* Success indicator */}
      <View className="w-16 h-16 rounded-full border-2 border-setly-accent items-center justify-center mb-8">
        <Text className="text-setly-accent text-2xl">✓</Text>
      </View>

      {/* Title */}
      <Text
        className="text-setly-text text-xl tracking-widest mb-2"
        style={{ fontFamily: 'SpaceMono_700Bold' }}
      >
        ALLENAMENTO SALVATO
      </Text>

      <Text
        className="text-setly-muted text-sm tracking-wider mb-12"
        style={{ fontFamily: 'SpaceMono_400Regular' }}
      >
        {exerciseName?.toUpperCase()}
      </Text>

      {/* Stats */}
      <View className="flex-row gap-12 mb-16">
        <View className="items-center">
          <Text
            className="text-setly-text text-4xl tracking-wider"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            {totalSets}
          </Text>
          <Text
            className="text-setly-muted text-xs tracking-wider mt-1"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            SET
          </Text>
        </View>

        <View className="items-center">
          <Text
            className="text-setly-text text-4xl tracking-wider"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            {totalTime}
          </Text>
          <Text
            className="text-setly-muted text-xs tracking-wider mt-1"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            DURATION
          </Text>
        </View>
      </View>

      {/* Done button */}
      <Pressable
        onPress={handleDone}
        className="px-16 py-4 border border-setly-text/50 active:bg-white/5"
      >
        <Text
          className="text-setly-text text-center tracking-widest"
          style={{ fontFamily: 'SpaceMono_700Bold' }}
        >
          DONE
        </Text>
      </Pressable>
    </View>
  );
}

import { View, Text, Pressable } from 'react-native';
import { useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import type { AchievementData } from '@/stores';

interface AchievementPopupProps {
  achievement: AchievementData;
  onDismiss: () => void;
}

export function AchievementPopup({ achievement, onDismiss }: AchievementPopupProps) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    // Haptic celebration
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animate in
    translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 200 });
    scale.value = withSpring(1, { damping: 10, stiffness: 200 });

    // Auto dismiss after 4 seconds
    const timeout = setTimeout(() => {
      translateY.value = withTiming(-100, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
      setTimeout(onDismiss, 300);
    }, 4000);

    return () => clearTimeout(timeout);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className="absolute top-16 left-4 right-4 z-50"
    >
      <Pressable
        onPress={onDismiss}
        className="bg-setly-black border-2 border-setly-accent p-4 flex-row items-center"
      >
        {/* Icon */}
        <View className="w-12 h-12 rounded-full bg-setly-accent/20 items-center justify-center mr-4">
          <Text className="text-2xl">🏆</Text>
        </View>

        {/* Content */}
        <View className="flex-1">
          <Text
            className="text-setly-accent text-xs tracking-wider mb-1"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            ACHIEVEMENT UNLOCKED!
          </Text>
          <Text
            className="text-setly-text text-base"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            {achievement.name}
          </Text>
          <Text
            className="text-setly-muted text-xs mt-1"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            {achievement.description}
          </Text>
        </View>

        {/* XP reward */}
        {achievement.xpReward && achievement.xpReward > 0 && (
          <View className="items-end ml-2">
            <Text
              className="text-setly-accent text-lg"
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              +{achievement.xpReward}
            </Text>
            <Text
              className="text-setly-muted text-xs"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              XP
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

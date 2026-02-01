import { View, Text } from 'react-native';
import { useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';

interface PRBadgeProps {
  type: 'weight' | 'volume' | 'both';
  previousValue?: number | null;
  newValue: number;
  onComplete?: () => void;
}

export function PRBadge({ type, previousValue, newValue, onComplete }: PRBadgeProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    // Trigger haptic celebration
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Animate in
    scale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 200 }),
      withSpring(1, { damping: 12 })
    );
    opacity.value = withTiming(1, { duration: 200 });
    glowOpacity.value = withSequence(
      withTiming(0.8, { duration: 300 }),
      withTiming(0.3, { duration: 500 })
    );

    // Auto dismiss after 3 seconds
    const timeout = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(0.8, { duration: 300 });
      if (onComplete) {
        setTimeout(onComplete, 300);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const getLabel = () => {
    switch (type) {
      case 'weight':
        return 'NUOVO PESO MAX';
      case 'volume':
        return 'NUOVO VOLUME MAX';
      case 'both':
        return 'DOPPIO PR!';
    }
  };

  const getEmoji = () => {
    switch (type) {
      case 'weight':
        return '🏋️';
      case 'volume':
        return '💪';
      case 'both':
        return '🔥';
    }
  };

  return (
    <Animated.View
      style={containerStyle}
      className="absolute top-1/3 left-0 right-0 items-center z-50"
    >
      {/* Glow effect */}
      <Animated.View
        style={glowStyle}
        className="absolute w-64 h-64 rounded-full bg-setly-accent/30"
      />

      {/* Badge container */}
      <View className="bg-setly-black border-2 border-setly-accent px-8 py-6 items-center">
        {/* Crown/star decoration */}
        <Text className="text-4xl mb-2">{getEmoji()}</Text>

        {/* PR Label */}
        <Text
          className="text-setly-accent text-xl tracking-widest mb-2"
          style={{ fontFamily: 'SpaceMono_700Bold' }}
        >
          PR!
        </Text>

        <Text
          className="text-setly-text text-sm tracking-wider mb-4"
          style={{ fontFamily: 'SpaceMono_400Regular' }}
        >
          {getLabel()}
        </Text>

        {/* Value display */}
        <View className="flex-row items-center gap-3">
          {previousValue !== null && previousValue !== undefined && (
            <>
              <Text
                className="text-setly-muted text-lg line-through"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                {previousValue}
              </Text>
              <Text className="text-setly-muted">→</Text>
            </>
          )}
          <Text
            className="text-setly-accent text-2xl"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            {newValue} {type === 'weight' ? 'kg' : 'kg vol'}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

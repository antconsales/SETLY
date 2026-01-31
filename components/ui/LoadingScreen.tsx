import { View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
  withDelay,
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'LOADING' }: LoadingScreenProps) {
  const dot1Opacity = useSharedValue(0.3);
  const dot2Opacity = useSharedValue(0.3);
  const dot3Opacity = useSharedValue(0.3);

  useEffect(() => {
    dot1Opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0.3, { duration: 300 })
      ),
      -1
    );

    dot2Opacity.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.3, { duration: 300 })
        ),
        -1
      )
    );

    dot3Opacity.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.3, { duration: 300 })
        ),
        -1
      )
    );
  }, []);

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dot1Opacity.value,
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: dot2Opacity.value,
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: dot3Opacity.value,
  }));

  return (
    <View className="flex-1 bg-setly-black justify-center items-center">
      {/* Decorative lines */}
      <View className="absolute left-0 top-1/3 w-12 h-px bg-setly-border" />
      <View className="absolute right-0 top-2/3 w-8 h-px bg-setly-border" />

      {/* Loading text */}
      <Text
        className="text-setly-text text-sm tracking-widest"
        style={{ fontFamily: 'SpaceMono_700Bold' }}
      >
        {message}
      </Text>

      {/* Animated dots */}
      <View className="flex-row gap-2 mt-4">
        <Animated.View
          style={dot1Style}
          className="w-2 h-2 rounded-full bg-setly-text"
        />
        <Animated.View
          style={dot2Style}
          className="w-2 h-2 rounded-full bg-setly-text"
        />
        <Animated.View
          style={dot3Style}
          className="w-2 h-2 rounded-full bg-setly-text"
        />
      </View>
    </View>
  );
}

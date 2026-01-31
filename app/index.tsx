import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useEffect } from 'react';

export default function Splash() {
  // Glow animation
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 2000 }),
        withTiming(0.3, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(tabs)/home');
  };

  return (
    <View className="flex-1 bg-setly-black">
      {/* Status indicators - top left */}
      <View className="absolute top-14 left-6 flex-row gap-2">
        <View className="w-2.5 h-2.5 rounded-full bg-red-500" />
        <View className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
        <View className="w-2.5 h-2.5 rounded-full bg-green-500" />
      </View>

      {/* Battery indicator - top right */}
      <View className="absolute top-14 right-6 flex-row gap-0.5">
        {[...Array(5)].map((_, i) => (
          <View
            key={i}
            className="w-1.5 h-3 bg-setly-muted rounded-sm"
          />
        ))}
      </View>

      {/* Decorative line - left */}
      <View className="absolute left-0 top-1/3 w-20 h-px bg-setly-border" />

      {/* Decorative circuit lines - bottom right */}
      <View className="absolute right-0 bottom-1/3">
        <View className="w-16 h-px bg-setly-border" />
        <View className="absolute right-0 top-0 w-px h-8 bg-setly-border" />
        <View className="absolute right-4 top-0 w-px h-4 bg-setly-border" />
      </View>

      {/* Main content */}
      <View className="flex-1 justify-center items-center px-8">
        {/* Glow effect behind text */}
        <Animated.View
          style={glowStyle}
          className="absolute w-64 h-64 rounded-full bg-white/5"
        />

        {/* Title */}
        <View className="items-center">
          <Text
            className="text-4xl text-setly-text tracking-tight"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            TRACK.
          </Text>
          <Text
            className="text-4xl text-setly-text tracking-tight"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            DON'T GUESS.
          </Text>
        </View>

        {/* Subtitle */}
        <Text
          className="text-setly-muted text-center mt-6 leading-6"
          style={{ fontFamily: 'SpaceMono_400Regular' }}
        >
          Private, automatic workout tracking.{'\n'}
          No coaching. 100% local.
        </Text>
      </View>

      {/* CTA Button */}
      <View className="absolute bottom-16 left-0 right-0 px-8">
        <Pressable
          onPress={handleStart}
          className="py-4 border border-setly-text/50 active:bg-white/5"
        >
          <Text
            className="text-setly-text text-center tracking-widest"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            INIZIA
          </Text>
        </Pressable>
      </View>

      {/* Corner decorations */}
      <View className="absolute bottom-8 left-6 flex-row gap-1">
        <View className="w-8 h-px bg-setly-border" />
      </View>
      <View className="absolute bottom-8 right-6 flex-row gap-1">
        <View className="w-4 h-px bg-setly-border" />
        <View className="w-2 h-px bg-setly-border" />
      </View>
    </View>
  );
}

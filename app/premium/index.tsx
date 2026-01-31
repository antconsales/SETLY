import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/stores';

const PRO_FEATURES = [
  {
    title: 'UNLIMITED HISTORY',
    description: 'Access your complete workout history, forever',
    icon: '∞',
  },
  {
    title: 'ADVANCED ANALYTICS',
    description: 'Detailed progress charts and trends',
    icon: '◉',
  },
  {
    title: 'CUSTOM EXERCISES',
    description: 'Create and track your own exercises',
    icon: '+',
  },
  {
    title: 'EXPORT DATA',
    description: 'Export your data to CSV or JSON',
    icon: '↗',
  },
  {
    title: 'CLOUD BACKUP',
    description: 'Secure backup and sync across devices',
    icon: '☁',
  },
  {
    title: 'WORKOUT PHOTOS',
    description: 'Attach progress photos to workouts',
    icon: '▣',
  },
];

export default function Premium() {
  const { hapticEnabled } = useSettingsStore();

  const handleClose = () => {
    if (hapticEnabled) {
      Haptics.selectionAsync();
    }
    router.back();
  };

  const handleSubscribe = () => {
    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // TODO: Implement in-app purchase
    console.log('Subscribe pressed');
  };

  const handleRestore = () => {
    if (hapticEnabled) {
      Haptics.selectionAsync();
    }
    // TODO: Implement restore purchases
    console.log('Restore pressed');
  };

  return (
    <View className="flex-1 bg-setly-black">
      {/* Header */}
      <View className="pt-16 px-6 pb-4">
        <Pressable onPress={handleClose} className="mb-6">
          <Text
            className="text-setly-muted text-sm tracking-wider"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            ← CLOSE
          </Text>
        </Pressable>

        {/* Logo */}
        <View className="items-center mb-2">
          <Text
            className="text-setly-accent text-3xl tracking-widest"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            SETLY
          </Text>
          <Text
            className="text-setly-text text-lg tracking-widest"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            PRO
          </Text>
        </View>

        {/* Tagline */}
        <Text
          className="text-setly-muted text-xs tracking-wider text-center mt-2"
          style={{ fontFamily: 'SpaceMono_400Regular' }}
        >
          UNLOCK YOUR FULL POTENTIAL
        </Text>
      </View>

      {/* Decorative line */}
      <View className="h-px bg-setly-border mx-6" />

      {/* Features list */}
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-6">
          {PRO_FEATURES.map((feature, index) => (
            <View
              key={feature.title}
              className="flex-row items-start mb-6"
            >
              {/* Icon */}
              <View className="w-10 h-10 border border-setly-border items-center justify-center mr-4">
                <Text
                  className="text-setly-accent text-lg"
                  style={{ fontFamily: 'SpaceMono_700Bold' }}
                >
                  {feature.icon}
                </Text>
              </View>

              {/* Text */}
              <View className="flex-1">
                <Text
                  className="text-setly-text text-sm tracking-wider"
                  style={{ fontFamily: 'SpaceMono_700Bold' }}
                >
                  {feature.title}
                </Text>
                <Text
                  className="text-setly-muted text-xs tracking-wider mt-1"
                  style={{ fontFamily: 'SpaceMono_400Regular' }}
                >
                  {feature.description}
                </Text>
              </View>

              {/* Check indicator */}
              <View className="w-4 h-4 items-center justify-center">
                <Text className="text-setly-accent text-xs">✓</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Spacer */}
        <View className="h-32" />
      </ScrollView>

      {/* Bottom CTA */}
      <View className="absolute bottom-0 left-0 right-0 bg-setly-black border-t border-setly-border px-6 pt-4 pb-10">
        {/* Price */}
        <View className="items-center mb-4">
          <View className="flex-row items-baseline">
            <Text
              className="text-setly-text text-3xl"
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              €4.99
            </Text>
            <Text
              className="text-setly-muted text-sm ml-1"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              / month
            </Text>
          </View>
          <Text
            className="text-setly-muted text-xs tracking-wider mt-1"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            or €39.99/year (save 33%)
          </Text>
        </View>

        {/* Subscribe button */}
        <Pressable
          onPress={handleSubscribe}
          className="bg-setly-accent py-4 items-center active:opacity-80"
        >
          <Text
            className="text-setly-black text-sm tracking-widest"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            START FREE TRIAL
          </Text>
        </Pressable>

        {/* Trial info */}
        <Text
          className="text-setly-muted text-xs tracking-wider text-center mt-3"
          style={{ fontFamily: 'SpaceMono_400Regular' }}
        >
          7 days free, then €4.99/month
        </Text>

        {/* Restore */}
        <Pressable onPress={handleRestore} className="mt-4 py-2">
          <Text
            className="text-setly-muted text-xs tracking-wider text-center"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            RESTORE PURCHASES
          </Text>
        </Pressable>
      </View>

      {/* Decorative elements */}
      <View className="absolute left-0 top-1/3 w-8 h-px bg-setly-border" />
      <View className="absolute right-0 top-1/2 w-12 h-px bg-setly-border" />
    </View>
  );
}

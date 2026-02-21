import { Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/stores';

export function AIFab() {
  const router = useRouter();
  const hapticEnabled = useSettingsStore((s) => s.hapticEnabled);

  const handlePress = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/ai/chat');
  };

  return (
    <Pressable
      onPress={handlePress}
      className="absolute bottom-24 right-6 w-12 h-12 border border-setly-accent bg-setly-accent/10 items-center justify-center active:bg-setly-accent/20"
    >
      <Text
        className="text-setly-accent text-sm"
        style={{ fontFamily: 'SpaceMono_700Bold' }}
      >
        AI
      </Text>
    </Pressable>
  );
}

import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { useChatStore } from '@/stores';
import type { ModelState } from '@/lib/llm/modelManager';

// --- Progress bar ---

function ProgressBar({ progress }: { progress: number }) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(progress, { duration: 300 });
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View className="w-full h-1 bg-setly-border">
      <Animated.View style={barStyle} className="h-1 bg-setly-accent" />
    </View>
  );
}

// --- Pulsing dot for loading states ---

function PulsingDot() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={style} className="w-2 h-2 bg-setly-accent" />;
}

// --- State label map ---

function getStateLabel(state: ModelState): string {
  switch (state) {
    case 'not_downloaded':
      return 'NON SCARICATO';
    case 'downloading':
      return 'DOWNLOAD IN CORSO...';
    case 'downloaded':
      return 'INIZIALIZZAZIONE...';
    case 'loading':
      return 'CARICAMENTO MODELLO...';
    case 'ready':
      return 'MODELLO PRONTO';
    case 'error':
      return 'ERRORE';
    default:
      return '';
  }
}

// --- Main component ---

export function ModelDownload() {
  const modelStatus = useChatStore((s) => s.modelStatus);
  const downloadModel = useChatStore((s) => s.downloadModel);
  const cancelDownload = useChatStore((s) => s.cancelDownload);
  const initModel = useChatStore((s) => s.initModel);

  const { state, progress, error } = modelStatus;

  // Auto-init after download completes
  useEffect(() => {
    if (state === 'downloaded') {
      initModel();
    }
  }, [state]);

  // --- Not downloaded / Error → show download CTA ---
  if (state === 'not_downloaded' || state === 'error') {
    return (
      <View className="border border-setly-border bg-setly-gray p-6">
        <Text
          className="text-setly-text text-sm tracking-widest mb-1"
          style={{ fontFamily: 'SpaceMono_700Bold' }}
        >
          DOWNLOAD AI MODEL
        </Text>
        <Text
          className="text-setly-muted text-xs tracking-wider mb-4"
          style={{ fontFamily: 'SpaceMono_400Regular' }}
        >
          ~200 MB
        </Text>

        {error && (
          <Text
            className="text-red-400 text-xs mb-3"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            {error}
          </Text>
        )}

        <Pressable
          onPress={downloadModel}
          className="border border-setly-accent bg-setly-accent/10 px-6 py-3 items-center active:bg-setly-accent/20"
        >
          <Text
            className="text-setly-accent text-sm tracking-widest"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            SCARICA
          </Text>
        </Pressable>
      </View>
    );
  }

  // --- Downloading → show progress ---
  if (state === 'downloading') {
    return (
      <View className="border border-setly-border bg-setly-gray p-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text
            className="text-setly-text text-sm tracking-widest"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            DOWNLOAD AI MODEL
          </Text>
          <Text
            className="text-setly-muted text-xs"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            {progress}%
          </Text>
        </View>

        <ProgressBar progress={progress} />

        <Pressable
          onPress={cancelDownload}
          className="mt-4 border border-setly-border px-4 py-2 items-center self-center active:bg-white/5"
        >
          <Text
            className="text-setly-muted text-xs tracking-wider"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            ANNULLA
          </Text>
        </Pressable>
      </View>
    );
  }

  // --- Downloaded / Loading → initializing ---
  if (state === 'downloaded' || state === 'loading') {
    return (
      <View className="border border-setly-border bg-setly-gray p-6">
        <View className="flex-row items-center gap-2 mb-1">
          <PulsingDot />
          <Text
            className="text-setly-text text-sm tracking-widest"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            {getStateLabel(state)}
          </Text>
        </View>
        <Text
          className="text-setly-muted text-xs tracking-wider"
          style={{ fontFamily: 'SpaceMono_400Regular' }}
        >
          Preparazione modello AI...
        </Text>
      </View>
    );
  }

  // --- Ready ---
  if (state === 'ready') {
    return (
      <View className="border border-setly-accent/30 bg-setly-accent/5 p-4">
        <View className="flex-row items-center gap-2">
          <View className="w-2 h-2 bg-setly-accent" />
          <Text
            className="text-setly-accent text-xs tracking-widest"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            {getStateLabel(state)}
          </Text>
        </View>
      </View>
    );
  }

  return null;
}

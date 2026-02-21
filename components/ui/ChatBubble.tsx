import { View, Text } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import type { ChatMessage } from '@/lib/llm/systemPrompt';

interface ChatBubbleProps {
  message: ChatMessage;
}

// --- Loading dots (3 bouncing dots) ---

function LoadingDots() {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const bounce = (delay: number) =>
      withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(-4, { duration: 300 }),
            withTiming(0, { duration: 300 })
          ),
          -1,
          true
        )
      );

    dot1.value = bounce(0);
    dot2.value = bounce(150);
    dot3.value = bounce(300);
  }, []);

  const style1 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot1.value }],
  }));
  const style2 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot2.value }],
  }));
  const style3 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot3.value }],
  }));

  return (
    <View className="self-start border border-setly-border bg-setly-gray px-4 py-3">
      <View className="flex-row items-center gap-1">
        <Animated.View style={style1} className="w-2 h-2 bg-setly-muted" />
        <Animated.View style={style2} className="w-2 h-2 bg-setly-muted" />
        <Animated.View style={style3} className="w-2 h-2 bg-setly-muted" />
      </View>
    </View>
  );
}

// --- Tool result bubble ---

function ToolBubble({ message }: ChatBubbleProps) {
  const label = message.toolResult?.success ? 'TOOL OK' : 'TOOL ERROR';

  return (
    <View className="self-center border border-setly-accent/30 bg-setly-accent/5 px-3 py-2 max-w-[85%]">
      <Text
        className="text-setly-accent/70 text-[10px] tracking-wider mb-0.5"
        style={{ fontFamily: 'SpaceMono_700Bold' }}
      >
        {label}
      </Text>
      <Text
        className="text-setly-muted text-xs"
        style={{ fontFamily: 'SpaceMono_400Regular' }}
        numberOfLines={3}
      >
        {message.content}
      </Text>
    </View>
  );
}

// --- User bubble ---

function UserBubble({ message }: ChatBubbleProps) {
  return (
    <View className="self-end border border-setly-text/30 bg-setly-gray px-4 py-3 max-w-[85%]">
      <Text
        className="text-setly-text text-sm"
        style={{ fontFamily: 'SpaceMono_400Regular' }}
      >
        {message.content}
      </Text>
    </View>
  );
}

// --- Assistant bubble ---

function AssistantBubble({ message }: ChatBubbleProps) {
  return (
    <View className="self-start border border-setly-border bg-setly-dark px-4 py-3 max-w-[85%]">
      <Text
        className="text-setly-text text-sm"
        style={{ fontFamily: 'SpaceMono_400Regular' }}
      >
        {message.content}
      </Text>
    </View>
  );
}

// --- Main export ---

export function ChatBubble({ message }: ChatBubbleProps) {
  switch (message.role) {
    case 'user':
      return <UserBubble message={message} />;
    case 'tool':
      return <ToolBubble message={message} />;
    case 'assistant':
      return <AssistantBubble message={message} />;
    default:
      return null;
  }
}

/** Standalone loading indicator — use when `isGenerating` is true */
ChatBubble.Loading = LoadingDots;

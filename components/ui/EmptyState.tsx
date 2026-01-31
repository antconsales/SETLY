import { View, Text, Pressable } from 'react-native';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 justify-center items-center px-8">
      {/* Decorative bracket */}
      <Text
        className="text-setly-border text-4xl mb-4"
        style={{ fontFamily: 'SpaceMono_400Regular' }}
      >
        [ ]
      </Text>

      <Text
        className="text-setly-text text-lg tracking-wider text-center"
        style={{ fontFamily: 'SpaceMono_700Bold' }}
      >
        {title}
      </Text>

      {subtitle && (
        <Text
          className="text-setly-muted text-sm tracking-wider text-center mt-2 max-w-[280px]"
          style={{ fontFamily: 'SpaceMono_400Regular' }}
        >
          {subtitle}
        </Text>
      )}

      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          className="mt-6 px-6 py-3 border border-setly-border active:bg-setly-border/20"
        >
          <Text
            className="text-setly-text text-sm tracking-wider"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

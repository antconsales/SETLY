import { View, Text } from 'react-native';
import { getLevelName, getXPForNextLevel } from '@/stores';

interface StreakBadgeProps {
  streak: number;
  level: number;
  totalXP: number;
  compact?: boolean;
}

export function StreakBadge({ streak, level, totalXP, compact = false }: StreakBadgeProps) {
  const levelName = getLevelName(level);
  const xpProgress = getXPForNextLevel(totalXP);

  if (compact) {
    return (
      <View className="flex-row items-center gap-4">
        {/* Streak */}
        <View className="flex-row items-center">
          <Text className="text-lg mr-1">🔥</Text>
          <Text
            className="text-setly-accent text-lg"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            {streak}
          </Text>
        </View>

        {/* Level */}
        <View className="flex-row items-center">
          <Text
            className="text-setly-text text-sm"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            LV{level}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="border border-setly-border p-4">
      {/* Top row: Streak and Level */}
      <View className="flex-row justify-between items-center mb-4">
        {/* Streak */}
        <View className="flex-row items-center">
          <Text className="text-2xl mr-2">🔥</Text>
          <View>
            <Text
              className="text-setly-accent text-2xl"
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              {streak}
            </Text>
            <Text
              className="text-setly-muted text-xs"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              STREAK
            </Text>
          </View>
        </View>

        {/* Level */}
        <View className="items-end">
          <Text
            className="text-setly-text text-xl"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            LEVEL {level}
          </Text>
          <Text
            className="text-setly-muted text-xs"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            {levelName.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* XP Progress bar */}
      <View>
        <View className="flex-row justify-between mb-1">
          <Text
            className="text-setly-muted text-xs"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            XP
          </Text>
          <Text
            className="text-setly-muted text-xs"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            {xpProgress.current} / {xpProgress.required}
          </Text>
        </View>
        <View className="h-2 bg-setly-border rounded-full overflow-hidden">
          <View
            className="h-full bg-setly-accent rounded-full"
            style={{ width: `${xpProgress.progress * 100}%` }}
          />
        </View>
      </View>
    </View>
  );
}

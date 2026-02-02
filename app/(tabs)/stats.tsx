import { View, Text, ScrollView } from 'react-native';
import { useAnalytics } from '@/hooks/useAnalytics';
import { usePersonalRecords } from '@/hooks/usePersonalRecords';

export default function StatsScreen() {
  const { totalStats, isLoading } = useAnalytics();
  const { getAllPRs } = usePersonalRecords();

  const prs = getAllPRs();

  const formatVolume = (volume: number) => {
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k`;
    }
    return volume.toString();
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-setly-black items-center justify-center">
        <Text
          className="text-setly-muted text-xs tracking-wider"
          style={{ fontFamily: 'SpaceMono_400Regular' }}
        >
          ...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-setly-black">
      {/* Header */}
      <View className="px-6 pt-16 pb-8">
        <Text
          className="text-setly-text text-xl tracking-widest"
          style={{ fontFamily: 'SpaceMono_700Bold' }}
        >
          STATS
        </Text>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Main numbers */}
        <View className="mb-12">
          <View className="flex-row justify-between mb-8">
            <View>
              <Text
                className="text-setly-accent text-5xl"
                style={{ fontFamily: 'SpaceMono_700Bold' }}
              >
                {totalStats.totalWorkouts}
              </Text>
              <Text
                className="text-setly-muted text-xs tracking-wider mt-1"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                WORKOUTS
              </Text>
            </View>

            <View className="items-end">
              <Text
                className="text-setly-text text-5xl"
                style={{ fontFamily: 'SpaceMono_700Bold' }}
              >
                {totalStats.currentStreak}
              </Text>
              <Text
                className="text-setly-muted text-xs tracking-wider mt-1"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                STREAK
              </Text>
            </View>
          </View>

          <View className="border-t border-setly-border pt-6">
            <Text
              className="text-setly-text text-3xl"
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              {formatVolume(totalStats.totalVolume)} kg
            </Text>
            <Text
              className="text-setly-muted text-xs tracking-wider mt-1"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              TOTAL VOLUME
            </Text>
          </View>
        </View>

        {/* Personal Records */}
        {prs.length > 0 && (
          <View>
            <Text
              className="text-setly-muted text-xs tracking-wider mb-4"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              PERSONAL RECORDS
            </Text>

            {prs.map((pr) => (
              <View
                key={pr.exerciseId}
                className="flex-row justify-between items-center py-4 border-b border-setly-border"
              >
                <Text
                  className="text-setly-text text-sm"
                  style={{ fontFamily: 'SpaceMono_400Regular' }}
                >
                  {pr.exerciseName}
                </Text>
                <Text
                  className="text-setly-accent text-lg"
                  style={{ fontFamily: 'SpaceMono_700Bold' }}
                >
                  {pr.maxWeight} kg
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Empty state */}
        {totalStats.totalWorkouts === 0 && (
          <View className="items-center py-12">
            <Text
              className="text-setly-muted text-xs tracking-wider text-center"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              NO DATA YET
            </Text>
          </View>
        )}

        <View className="h-20" />
      </ScrollView>

      {/* Decorative */}
      <View className="absolute right-0 top-1/3 w-8 h-px bg-setly-border" />
    </View>
  );
}

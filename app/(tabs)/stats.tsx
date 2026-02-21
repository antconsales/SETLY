import { View, Text, ScrollView, Dimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { usePersonalRecords } from '@/hooks/usePersonalRecords';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_PADDING = 24; // px-6
const BAR_GAP = 6;

export default function StatsScreen() {
  const { totalStats, weeklyStats, isLoading, refresh } = useAnalytics();
  const { getAllPRs, refresh: refreshPRs } = usePersonalRecords();

  useFocusEffect(
    useCallback(() => {
      refresh();
      refreshPRs();
    }, [refresh, refreshPRs])
  );

  const prs = getAllPRs();

  // Sort PRs by maxWeight descending
  const sortedPRs = useMemo(
    () => [...prs].sort((a, b) => b.maxWeight - a.maxWeight),
    [prs]
  );

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k`;
    }
    return volume.toString();
  };

  const formatWeekLabel = (date: Date) => {
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleDateString('it-IT', { month: 'short' }).toUpperCase();
    return `${day} ${month}`;
  };

  const formatPRDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
    }).toUpperCase();
  };

  // Chart calculations
  const maxWorkouts = Math.max(...weeklyStats.map((w) => w.totalWorkouts), 1);
  const maxVolume = Math.max(...weeklyStats.map((w) => w.totalVolume), 1);
  const barCount = weeklyStats.length || 1;
  const availableWidth = SCREEN_WIDTH - CHART_PADDING * 2;
  const barWidth = Math.floor((availableWidth - BAR_GAP * (barCount - 1)) / barCount);

  // This week vs last week comparison
  const thisWeek = weeklyStats.length > 0 ? weeklyStats[weeklyStats.length - 1] : null;
  const lastWeek = weeklyStats.length > 1 ? weeklyStats[weeklyStats.length - 2] : null;

  const workoutDelta = thisWeek && lastWeek
    ? thisWeek.totalWorkouts - lastWeek.totalWorkouts
    : null;

  const volumeDelta = thisWeek && lastWeek && lastWeek.totalVolume > 0
    ? Math.round(((thisWeek.totalVolume - lastWeek.totalVolume) / lastWeek.totalVolume) * 100)
    : null;

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
      <View className="px-6 pt-16 pb-6">
        <Text
          className="text-setly-text text-xl tracking-widest"
          style={{ fontFamily: 'SpaceMono_700Bold' }}
        >
          STATS
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Overview cards row */}
        <View className="flex-row gap-3 mb-6">
          {/* Workouts card */}
          <View className="flex-1 border border-setly-border p-4">
            <Text
              className="text-setly-muted text-xs tracking-wider mb-2"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              WORKOUTS
            </Text>
            <Text
              className="text-setly-accent text-3xl"
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              {totalStats.totalWorkouts}
            </Text>
          </View>

          {/* Streak card */}
          <View className="flex-1 border border-setly-border p-4">
            <Text
              className="text-setly-muted text-xs tracking-wider mb-2"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              STREAK
            </Text>
            <Text
              className="text-setly-text text-3xl"
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              {totalStats.currentStreak}
            </Text>
          </View>
        </View>

        {/* Volume + Sets cards */}
        <View className="flex-row gap-3 mb-8">
          {/* Total Volume card */}
          <View className="flex-1 border border-setly-border p-4">
            <Text
              className="text-setly-muted text-xs tracking-wider mb-2"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              VOLUME TOTALE
            </Text>
            <Text
              className="text-setly-text text-2xl"
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              {formatVolume(totalStats.totalVolume)}
            </Text>
            <Text
              className="text-setly-muted text-xs mt-1"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              KG
            </Text>
          </View>

          {/* Total Sets card */}
          <View className="flex-1 border border-setly-border p-4">
            <Text
              className="text-setly-muted text-xs tracking-wider mb-2"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              SERIE TOTALI
            </Text>
            <Text
              className="text-setly-text text-2xl"
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              {totalStats.totalSets}
            </Text>
          </View>
        </View>

        {/* Weekly Workouts Chart */}
        {weeklyStats.length > 0 && (
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text
                className="text-setly-muted text-xs tracking-wider"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                WORKOUT / SETTIMANA
              </Text>
              {workoutDelta !== null && (
                <Text
                  className={`text-xs ${workoutDelta >= 0 ? 'text-setly-accent' : 'text-red-400'}`}
                  style={{ fontFamily: 'SpaceMono_700Bold' }}
                >
                  {workoutDelta >= 0 ? '+' : ''}{workoutDelta} VS SCORSA
                </Text>
              )}
            </View>

            {/* Bar chart */}
            <View className="border border-setly-border p-4">
              <View className="flex-row items-end justify-between" style={{ height: 100 }}>
                {weeklyStats.map((week, i) => {
                  const height = maxWorkouts > 0
                    ? Math.max((week.totalWorkouts / maxWorkouts) * 80, week.totalWorkouts > 0 ? 4 : 0)
                    : 0;
                  const isCurrentWeek = i === weeklyStats.length - 1;

                  return (
                    <View key={i} className="items-center" style={{ width: barWidth }}>
                      {/* Value label */}
                      {week.totalWorkouts > 0 && (
                        <Text
                          className="text-setly-muted text-xs mb-1"
                          style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 9 }}
                        >
                          {week.totalWorkouts}
                        </Text>
                      )}
                      {/* Bar */}
                      <View
                        style={{
                          width: Math.min(barWidth - 4, 28),
                          height,
                          backgroundColor: isCurrentWeek ? '#4ADE80' : '#2A2A2A',
                        }}
                      />
                    </View>
                  );
                })}
              </View>

              {/* Week labels */}
              <View className="flex-row justify-between mt-2">
                {weeklyStats.map((week, i) => (
                  <View key={i} className="items-center" style={{ width: barWidth }}>
                    <Text
                      className="text-setly-muted"
                      style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 8 }}
                    >
                      {formatWeekLabel(week.weekStart)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Weekly Volume Chart */}
        {weeklyStats.length > 0 && (
          <View className="mb-8">
            <View className="flex-row justify-between items-center mb-4">
              <Text
                className="text-setly-muted text-xs tracking-wider"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                VOLUME / SETTIMANA
              </Text>
              {volumeDelta !== null && (
                <Text
                  className={`text-xs ${volumeDelta >= 0 ? 'text-setly-accent' : 'text-red-400'}`}
                  style={{ fontFamily: 'SpaceMono_700Bold' }}
                >
                  {volumeDelta >= 0 ? '+' : ''}{volumeDelta}% VS SCORSA
                </Text>
              )}
            </View>

            {/* Bar chart */}
            <View className="border border-setly-border p-4">
              <View className="flex-row items-end justify-between" style={{ height: 100 }}>
                {weeklyStats.map((week, i) => {
                  const height = maxVolume > 0
                    ? Math.max((week.totalVolume / maxVolume) * 80, week.totalVolume > 0 ? 4 : 0)
                    : 0;
                  const isCurrentWeek = i === weeklyStats.length - 1;

                  return (
                    <View key={i} className="items-center" style={{ width: barWidth }}>
                      {/* Value label */}
                      {week.totalVolume > 0 && (
                        <Text
                          className="text-setly-muted text-xs mb-1"
                          style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 9 }}
                        >
                          {formatVolume(week.totalVolume)}
                        </Text>
                      )}
                      {/* Bar */}
                      <View
                        style={{
                          width: Math.min(barWidth - 4, 28),
                          height,
                          backgroundColor: isCurrentWeek ? '#4ADE80' : '#2A2A2A',
                        }}
                      />
                    </View>
                  );
                })}
              </View>

              {/* Week labels */}
              <View className="flex-row justify-between mt-2">
                {weeklyStats.map((week, i) => (
                  <View key={i} className="items-center" style={{ width: barWidth }}>
                    <Text
                      className="text-setly-muted"
                      style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 8 }}
                    >
                      {formatWeekLabel(week.weekStart)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Personal Records */}
        {sortedPRs.length > 0 && (
          <View className="mb-8">
            <Text
              className="text-setly-muted text-xs tracking-wider mb-4"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              PERSONAL RECORDS
            </Text>

            {sortedPRs.map((pr) => (
              <View
                key={pr.exerciseId}
                className="border border-setly-border p-4 mb-3"
              >
                {/* Exercise name */}
                <Text
                  className="text-setly-text text-sm tracking-wider mb-3"
                  style={{ fontFamily: 'SpaceMono_700Bold' }}
                >
                  {pr.exerciseName.toUpperCase()}
                </Text>

                {/* PR details row */}
                <View className="flex-row justify-between">
                  {/* Max weight */}
                  <View>
                    <Text
                      className="text-setly-muted text-xs tracking-wider mb-1"
                      style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 9 }}
                    >
                      MAX PESO
                    </Text>
                    <View className="flex-row items-baseline">
                      <Text
                        className="text-setly-accent text-xl"
                        style={{ fontFamily: 'SpaceMono_700Bold' }}
                      >
                        {pr.maxWeight}
                      </Text>
                      <Text
                        className="text-setly-muted text-xs ml-1"
                        style={{ fontFamily: 'SpaceMono_400Regular' }}
                      >
                        kg
                      </Text>
                    </View>
                    <Text
                      className="text-setly-muted mt-1"
                      style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 9 }}
                    >
                      x{pr.maxWeightReps} reps
                    </Text>
                  </View>

                  {/* Separator */}
                  <View className="w-px bg-setly-border mx-4" />

                  {/* Max volume */}
                  <View>
                    <Text
                      className="text-setly-muted text-xs tracking-wider mb-1"
                      style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 9 }}
                    >
                      MAX VOLUME
                    </Text>
                    <View className="flex-row items-baseline">
                      <Text
                        className="text-setly-text text-xl"
                        style={{ fontFamily: 'SpaceMono_700Bold' }}
                      >
                        {formatVolume(pr.maxVolume)}
                      </Text>
                      <Text
                        className="text-setly-muted text-xs ml-1"
                        style={{ fontFamily: 'SpaceMono_400Regular' }}
                      >
                        kg
                      </Text>
                    </View>
                    <Text
                      className="text-setly-muted mt-1"
                      style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 9 }}
                    >
                      {pr.maxVolumeWeight}x{pr.maxVolumeReps}
                    </Text>
                  </View>

                  {/* Date */}
                  <View className="items-end justify-end">
                    <Text
                      className="text-setly-muted"
                      style={{ fontFamily: 'SpaceMono_400Regular', fontSize: 9 }}
                    >
                      {formatPRDate(pr.achievedAt)}
                    </Text>
                  </View>
                </View>
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

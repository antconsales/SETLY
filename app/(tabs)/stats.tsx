import { View, Text, ScrollView, Dimensions, Pressable } from 'react-native';
import { useState, useEffect } from 'react';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useAnalytics } from '@/hooks/useAnalytics';
import { usePersonalRecords } from '@/hooks/usePersonalRecords';
import { useExerciseStore } from '@/stores';
import * as Haptics from 'expo-haptics';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: '#0A0A0A',
  backgroundGradientFrom: '#0A0A0A',
  backgroundGradientTo: '#0A0A0A',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(74, 222, 128, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
  style: {
    borderRadius: 0,
  },
  propsForDots: {
    r: '4',
    strokeWidth: '2',
    stroke: '#4ADE80',
  },
  propsForBackgroundLines: {
    strokeDasharray: '',
    stroke: '#2A2A2A',
    strokeWidth: 0.5,
  },
};

export default function StatsScreen() {
  const { weeklyStats, totalStats, isLoading, fetchExerciseProgress, exerciseProgress } = useAnalytics();
  const { getAllPRs } = usePersonalRecords();
  const { exercises } = useExerciseStore();
  const [selectedExercise, setSelectedExercise] = useState<number | null>(null);

  const prs = getAllPRs();

  // Fetch exercise progress when selected
  useEffect(() => {
    if (selectedExercise) {
      fetchExerciseProgress(selectedExercise);
    }
  }, [selectedExercise, fetchExerciseProgress]);

  // Prepare weekly volume data for chart
  const weeklyVolumeData = {
    labels: weeklyStats.slice(-6).map((w) => {
      const date = new Date(w.weekStart);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: weeklyStats.slice(-6).map((w) => w.totalVolume / 1000 || 0), // in kg * 1000
      },
    ],
  };

  // Prepare weekly workouts data
  const weeklyWorkoutsData = {
    labels: weeklyStats.slice(-6).map((w) => {
      const date = new Date(w.weekStart);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [
      {
        data: weeklyStats.slice(-6).map((w) => w.totalWorkouts || 0),
      },
    ],
  };

  // Get selected exercise progress
  const selectedProgress = selectedExercise ? exerciseProgress.get(selectedExercise) : null;
  const progressChartData = selectedProgress && selectedProgress.dataPoints.length > 1
    ? {
        labels: selectedProgress.dataPoints.slice(-8).map((d) => {
          const date = new Date(d.date);
          return `${date.getDate()}/${date.getMonth() + 1}`;
        }),
        datasets: [
          {
            data: selectedProgress.dataPoints.slice(-8).map((d) => d.maxWeight || 0),
          },
        ],
      }
    : null;

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}k`;
    }
    return volume.toString();
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-setly-black items-center justify-center">
        <Text
          className="text-setly-muted text-sm tracking-wider"
          style={{ fontFamily: 'SpaceMono_400Regular' }}
        >
          LOADING STATS...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-setly-black" contentContainerClassName="pb-8">
      {/* Header */}
      <View className="px-6 pt-16 pb-6">
        <Text
          className="text-setly-text text-2xl tracking-widest"
          style={{ fontFamily: 'SpaceMono_700Bold' }}
        >
          STATISTICHE
        </Text>
      </View>

      {/* Overview Stats */}
      <View className="flex-row px-6 gap-4 mb-8">
        <View className="flex-1 border border-setly-border p-4">
          <Text
            className="text-setly-accent text-3xl"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            {totalStats.totalWorkouts}
          </Text>
          <Text
            className="text-setly-muted text-xs tracking-wider mt-1"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            WORKOUT
          </Text>
        </View>

        <View className="flex-1 border border-setly-border p-4">
          <Text
            className="text-setly-accent text-3xl"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            {formatVolume(totalStats.totalVolume)}
          </Text>
          <Text
            className="text-setly-muted text-xs tracking-wider mt-1"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            VOLUME KG
          </Text>
        </View>

        <View className="flex-1 border border-setly-border p-4">
          <Text
            className="text-setly-accent text-3xl"
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

      {/* Weekly Volume Chart */}
      {weeklyStats.length > 0 && (
        <View className="px-6 mb-8">
          <Text
            className="text-setly-text text-sm tracking-wider mb-4"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            VOLUME SETTIMANALE (tonnellate)
          </Text>
          <View className="border border-setly-border p-2">
            <BarChart
              data={weeklyVolumeData}
              width={screenWidth - 64}
              height={180}
              chartConfig={chartConfig}
              withInnerLines={true}
              showBarTops={false}
              fromZero
              yAxisSuffix="t"
              yAxisLabel=""
              style={{
                marginLeft: -16,
              }}
            />
          </View>
        </View>
      )}

      {/* Weekly Workouts Chart */}
      {weeklyStats.length > 0 && (
        <View className="px-6 mb-8">
          <Text
            className="text-setly-text text-sm tracking-wider mb-4"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            WORKOUT PER SETTIMANA
          </Text>
          <View className="border border-setly-border p-2">
            <BarChart
              data={weeklyWorkoutsData}
              width={screenWidth - 64}
              height={180}
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(229, 229, 229, ${opacity})`,
              }}
              withInnerLines={true}
              showBarTops={false}
              fromZero
              yAxisSuffix=""
              yAxisLabel=""
              style={{
                marginLeft: -16,
              }}
            />
          </View>
        </View>
      )}

      {/* Personal Records */}
      {prs.length > 0 && (
        <View className="px-6 mb-8">
          <Text
            className="text-setly-text text-sm tracking-wider mb-4"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            PERSONAL RECORDS
          </Text>
          <View className="border border-setly-border">
            {prs.map((pr, index) => (
              <View
                key={pr.exerciseId}
                className={`flex-row justify-between items-center px-4 py-3 ${
                  index < prs.length - 1 ? 'border-b border-setly-border' : ''
                }`}
              >
                <Text
                  className="text-setly-text text-sm flex-1"
                  style={{ fontFamily: 'SpaceMono_400Regular' }}
                >
                  {pr.exerciseName.toUpperCase()}
                </Text>
                <View className="flex-row gap-6">
                  <View className="items-end">
                    <Text
                      className="text-setly-accent text-lg"
                      style={{ fontFamily: 'SpaceMono_700Bold' }}
                    >
                      {pr.maxWeight} kg
                    </Text>
                    <Text
                      className="text-setly-muted text-xs"
                      style={{ fontFamily: 'SpaceMono_400Regular' }}
                    >
                      MAX
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text
                      className="text-setly-text text-lg"
                      style={{ fontFamily: 'SpaceMono_700Bold' }}
                    >
                      {pr.maxVolume} kg
                    </Text>
                    <Text
                      className="text-setly-muted text-xs"
                      style={{ fontFamily: 'SpaceMono_400Regular' }}
                    >
                      VOL
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Exercise Progress */}
      <View className="px-6 mb-8">
        <Text
          className="text-setly-text text-sm tracking-wider mb-4"
          style={{ fontFamily: 'SpaceMono_700Bold' }}
        >
          PROGRESSI ESERCIZIO
        </Text>

        {/* Exercise selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {exercises.map((exercise) => (
            <Pressable
              key={exercise.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedExercise(exercise.id);
              }}
              className={`px-4 py-2 mr-2 border ${
                selectedExercise === exercise.id
                  ? 'border-setly-accent bg-setly-accent/10'
                  : 'border-setly-border'
              }`}
            >
              <Text
                className={`text-xs tracking-wider ${
                  selectedExercise === exercise.id ? 'text-setly-accent' : 'text-setly-text'
                }`}
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                {exercise.name.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Progress chart */}
        {progressChartData ? (
          <View className="border border-setly-border p-2">
            <LineChart
              data={progressChartData}
              width={screenWidth - 64}
              height={200}
              chartConfig={chartConfig}
              bezier
              withDots
              withInnerLines
              withOuterLines={false}
              withVerticalLines={false}
              yAxisSuffix=" kg"
              yAxisLabel=""
              style={{
                marginLeft: -16,
              }}
            />
          </View>
        ) : selectedExercise ? (
          <View className="border border-setly-border p-8 items-center">
            <Text
              className="text-setly-muted text-sm text-center"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              Non ci sono ancora abbastanza dati per questo esercizio.
              {'\n'}Completa almeno 2 workout!
            </Text>
          </View>
        ) : (
          <View className="border border-setly-border p-8 items-center">
            <Text
              className="text-setly-muted text-sm text-center"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              Seleziona un esercizio per vedere i progressi
            </Text>
          </View>
        )}
      </View>

      {/* Empty state if no data */}
      {totalStats.totalWorkouts === 0 && (
        <View className="px-6 py-12 items-center">
          <Text
            className="text-setly-muted text-sm text-center tracking-wider"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            NESSUN DATO ANCORA
            {'\n\n'}
            Completa il tuo primo workout per vedere le statistiche!
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

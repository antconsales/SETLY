import { View, Text, Pressable, TextInput, Modal, ScrollView } from 'react-native';
import { useEffect, useCallback, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useWorkoutStore, useSettingsStore } from '@/stores';
import { useTimer, usePersonalRecords } from '@/hooks';
import { PRBadge } from '@/components/ui';

export default function ActiveWorkout() {
  const { exerciseName } = useLocalSearchParams<{ exerciseName: string }>();
  const { seconds, formattedTime, formatTime } = useTimer();
  const { session, endSet, startRest, endRest, finishWorkout, cancelWorkout } = useWorkoutStore();
  const { hapticEnabled } = useSettingsStore();

  // Input modal state
  const [showInputModal, setShowInputModal] = useState(false);
  const [repsInput, setRepsInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [setDuration, setSetDuration] = useState(0);

  // PR tracking
  const { checkPR, refresh: refreshPRs } = usePersonalRecords(session?.exerciseId);
  const [showPRBadge, setShowPRBadge] = useState(false);
  const [prType, setPrType] = useState<'weight' | 'volume' | 'both'>('weight');
  const [prPrevValue, setPrPrevValue] = useState<number | null>(null);
  const [prNewValue, setPrNewValue] = useState(0);

  const currentSet = session ? session.sets.length + 1 : 1;
  const totalSets = session?.plannedSets || 4;
  const isResting = session?.isResting || false;

  // Glow animation
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1500 }),
        withTiming(0.3, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Open modal to input reps/weight
  const handleEndSet = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSetDuration(seconds);
    setShowInputModal(true);
  }, [hapticEnabled, seconds]);

  // Confirm set with reps/weight
  const handleConfirmSet = useCallback(() => {
    const reps = repsInput ? parseInt(repsInput, 10) : undefined;
    const weight = weightInput ? parseFloat(weightInput) : undefined;

    // Check for PR before saving
    if (session?.exerciseId && weight && reps) {
      const prCheck = checkPR(session.exerciseId, weight, reps);
      const volume = weight * reps;

      if (prCheck.isNewWeightPR || prCheck.isNewVolumePR) {
        // Show PR celebration!
        if (prCheck.isNewWeightPR && prCheck.isNewVolumePR) {
          setPrType('both');
          setPrPrevValue(prCheck.previousMaxWeight);
          setPrNewValue(weight);
        } else if (prCheck.isNewWeightPR) {
          setPrType('weight');
          setPrPrevValue(prCheck.previousMaxWeight);
          setPrNewValue(weight);
        } else {
          setPrType('volume');
          setPrPrevValue(prCheck.previousMaxVolume);
          setPrNewValue(volume);
        }
        setShowPRBadge(true);
      } else if (hapticEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    endSet(setDuration, reps, weight);

    // Reset inputs
    setRepsInput('');
    setWeightInput('');
    setShowInputModal(false);
  }, [hapticEnabled, endSet, setDuration, repsInput, weightInput, session?.exerciseId, checkPR]);

  // Skip reps/weight input
  const handleSkipInput = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    endSet(setDuration);
    setRepsInput('');
    setWeightInput('');
    setShowInputModal(false);
  }, [hapticEnabled, endSet, setDuration]);

  const handleStopRest = useCallback(async () => {
    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    if (currentSet >= totalSets) {
      // Workout complete - save to database
      const workoutId = await finishWorkout();
      router.replace({
        pathname: '/workout/summary',
        params: {
          exerciseName: exerciseName || session?.exerciseName || 'Workout',
          totalSets: currentSet.toString(),
          totalTime: formatTime(seconds),
          workoutId: workoutId?.toString() || '',
        },
      });
      return;
    }

    endRest();
  }, [hapticEnabled, currentSet, totalSets, finishWorkout, endRest, exerciseName, session, formatTime, seconds]);

  const handleEndWorkout = useCallback(async () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    // Save current set if in progress (not resting)
    if (!isResting && seconds > 0) {
      endSet(seconds);
    }

    const workoutId = await finishWorkout();
    router.replace({
      pathname: '/workout/summary',
      params: {
        exerciseName: exerciseName || session?.exerciseName || 'Workout',
        totalSets: session?.sets.length.toString() || '0',
        totalTime: formatTime(seconds),
        workoutId: workoutId?.toString() || '',
      },
    });
  }, [hapticEnabled, isResting, seconds, endSet, finishWorkout, exerciseName, session, formatTime]);

  // Timer progress
  const radius = 100;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const maxSeconds = 90;
  const progress = Math.min(seconds / maxSeconds, 1) * circumference;

  return (
    <View className="flex-1 bg-setly-black items-center justify-center px-8">
      {/* PR Badge */}
      {showPRBadge && (
        <PRBadge
          type={prType}
          previousValue={prPrevValue}
          newValue={prNewValue}
          onComplete={() => {
            setShowPRBadge(false);
            refreshPRs(); // Refresh PRs after setting new one
          }}
        />
      )}

      {/* Battery indicator - top right */}
      <View className="absolute top-14 right-6 flex-row gap-0.5">
        {[...Array(5)].map((_, i) => (
          <View key={i} className="w-1.5 h-3 bg-setly-muted rounded-sm" />
        ))}
      </View>

      {/* Exercise name */}
      <Text
        className="absolute top-24 text-2xl text-setly-text tracking-widest"
        style={{ fontFamily: 'SpaceMono_700Bold' }}
      >
        {(exerciseName || session?.exerciseName || 'WORKOUT').toUpperCase()}
      </Text>

      {/* Timer Container */}
      <View className="items-center justify-center">
        {/* Glow effect */}
        <Animated.View
          style={glowStyle}
          className="absolute w-72 h-72 rounded-full bg-white/10"
        />

        {/* Progress ring */}
        <Svg width={240} height={240} className="absolute">
          {/* Background ring */}
          <Circle
            cx={120}
            cy={120}
            r={radius}
            stroke="#2A2A2A"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress ring */}
          <Circle
            cx={120}
            cy={120}
            r={radius}
            stroke={isResting ? '#4ADE80' : '#E5E5E5'}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            rotation={-90}
            origin="120, 120"
          />
          {/* Tick marks */}
          {Array.from({ length: 60 }).map((_, i) => {
            const angle = (i * 6 - 90) * (Math.PI / 180);
            const x = 120 + (radius - 12) * Math.cos(angle);
            const y = 120 + (radius - 12) * Math.sin(angle);
            return (
              <Circle
                key={i}
                cx={x}
                cy={y}
                r={i % 5 === 0 ? 1.5 : 0.8}
                fill="#666"
              />
            );
          })}
        </Svg>

        {/* Time display */}
        <Text
          className="text-6xl text-setly-text tracking-wider"
          style={{ fontFamily: 'SpaceMono_700Bold' }}
        >
          {formattedTime}
        </Text>
      </View>

      {/* Set counter */}
      <Text
        className="text-setly-text text-xl mt-8"
        style={{ fontFamily: 'SpaceMono_400Regular' }}
      >
        {isResting ? currentSet - 1 : currentSet} / {totalSets}
      </Text>

      {/* Status indicator */}
      <Text
        className="text-setly-muted text-xs mt-2 tracking-wider"
        style={{ fontFamily: 'SpaceMono_400Regular' }}
      >
        {isResting ? 'RESTING' : 'WORKING'}
      </Text>

      {/* Pause indicator */}
      {isResting && (
        <Text
          className="absolute right-8 text-setly-accent text-2xl"
          style={{ fontFamily: 'SpaceMono_700Bold', top: '50%' }}
        >
          ║
        </Text>
      )}

      {/* Completed sets display */}
      {session && session.sets.length > 0 && (
        <View className="absolute top-40 left-8 right-8">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {session.sets.map((set, index) => (
              <View key={index} className="mr-3 px-3 py-2 border border-setly-border rounded">
                <Text
                  className="text-setly-muted text-xs"
                  style={{ fontFamily: 'SpaceMono_400Regular' }}
                >
                  SET {set.setNumber}
                </Text>
                <Text
                  className="text-setly-text text-sm"
                  style={{ fontFamily: 'SpaceMono_700Bold' }}
                >
                  {set.weight ? `${set.weight}kg` : '-'} × {set.reps || '-'}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Action button */}
      <View className="absolute bottom-16 w-full px-8">
        <Pressable
          onPress={isResting ? handleStopRest : handleEndSet}
          className={`py-4 border active:bg-white/5 ${isResting ? 'border-setly-accent/50' : 'border-setly-text/50'}`}
        >
          <Text
            className={`text-center tracking-widest ${isResting ? 'text-setly-accent' : 'text-setly-text'}`}
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            {isResting ? 'STOP PAUSA' : 'FINE SET'}
          </Text>
        </Pressable>

        {/* End workout early */}
        <Pressable onPress={handleEndWorkout} className="py-3 mt-4">
          <Text
            className="text-setly-muted text-center text-sm tracking-wider"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            END WORKOUT
          </Text>
        </Pressable>
      </View>

      {/* Reps/Weight Input Modal */}
      <Modal
        visible={showInputModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInputModal(false)}
      >
        <View className="flex-1 bg-black/80 justify-center items-center px-8">
          <View className="w-full bg-setly-black border border-setly-border p-6">
            {/* Modal header */}
            <Text
              className="text-setly-text text-lg tracking-widest text-center mb-6"
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              SET {currentSet} COMPLETATO
            </Text>

            {/* Weight input */}
            <View className="mb-4">
              <Text
                className="text-setly-muted text-xs tracking-wider mb-2"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                PESO (KG)
              </Text>
              <TextInput
                value={weightInput}
                onChangeText={setWeightInput}
                placeholder="0"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
                className="border border-setly-border px-4 py-3 text-setly-text text-xl text-center"
                style={{ fontFamily: 'SpaceMono_700Bold' }}
              />
            </View>

            {/* Reps input */}
            <View className="mb-6">
              <Text
                className="text-setly-muted text-xs tracking-wider mb-2"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                RIPETIZIONI
              </Text>
              <TextInput
                value={repsInput}
                onChangeText={setRepsInput}
                placeholder="0"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                className="border border-setly-border px-4 py-3 text-setly-text text-xl text-center"
                style={{ fontFamily: 'SpaceMono_700Bold' }}
              />
            </View>

            {/* Quick reps buttons */}
            <View className="flex-row justify-center gap-3 mb-6">
              {[6, 8, 10, 12, 15].map((num) => (
                <Pressable
                  key={num}
                  onPress={() => {
                    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setRepsInput(num.toString());
                  }}
                  className={`px-4 py-2 border ${repsInput === num.toString() ? 'border-setly-accent bg-setly-accent/10' : 'border-setly-border'}`}
                >
                  <Text
                    className={`text-sm ${repsInput === num.toString() ? 'text-setly-accent' : 'text-setly-text'}`}
                    style={{ fontFamily: 'SpaceMono_700Bold' }}
                  >
                    {num}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Confirm button */}
            <Pressable
              onPress={handleConfirmSet}
              className="py-4 border border-setly-accent bg-setly-accent/10 mb-3"
            >
              <Text
                className="text-setly-accent text-center tracking-widest"
                style={{ fontFamily: 'SpaceMono_700Bold' }}
              >
                CONFERMA
              </Text>
            </Pressable>

            {/* Skip button */}
            <Pressable onPress={handleSkipInput} className="py-3">
              <Text
                className="text-setly-muted text-center text-sm tracking-wider"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                SALTA
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

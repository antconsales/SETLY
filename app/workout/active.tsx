import { View, Text, Pressable, TextInput, Modal, ScrollView } from 'react-native';
import { useEffect, useCallback, useState, useRef } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useWorkoutStore, useSettingsStore } from '@/stores';
import { useTimer, usePersonalRecords } from '@/hooks';
import { PRBadge } from '@/components/ui';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ActiveWorkout() {
  const { exerciseName } = useLocalSearchParams<{ exerciseName: string }>();
  const { seconds, formattedTime, formatTime } = useTimer();
  const { session, endSet, startRest, endRest, finishWorkout, cancelWorkout, restTargetSeconds } = useWorkoutStore();
  const { hapticEnabled, defaultRestTime } = useSettingsStore();

  // Input modal state
  const [showInputModal, setShowInputModal] = useState(false);
  const [repsInput, setRepsInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [setDuration, setSetDuration] = useState(0);

  // Rest finished tracking (to fire haptic only once)
  const restFinishedRef = useRef(false);

  // PR tracking
  const { checkPR, refresh: refreshPRs } = usePersonalRecords(session?.exerciseId);
  const [showPRBadge, setShowPRBadge] = useState(false);
  const [prType, setPrType] = useState<'weight' | 'volume' | 'both'>('weight');
  const [prPrevValue, setPrPrevValue] = useState<number | null>(null);
  const [prNewValue, setPrNewValue] = useState(0);

  const currentSet = session ? session.sets.length + 1 : 1;
  const totalSets = session?.plannedSets || 4;
  const isResting = session?.isResting || false;

  // Countdown: rest timer reached 0
  const restFinished = isResting && restTargetSeconds > 0 && seconds === 0;

  // Fire haptic when rest countdown reaches 0
  useEffect(() => {
    if (restFinished && !restFinishedRef.current) {
      restFinishedRef.current = true;
      if (hapticEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
    if (!isResting) {
      restFinishedRef.current = false;
    }
  }, [restFinished, isResting, hapticEnabled]);

  // Animated values
  const glowOpacity = useSharedValue(0.3);
  const ringProgress = useSharedValue(0);
  const stateTransition = useSharedValue(isResting ? 1 : 0);
  const pulseScale = useSharedValue(1);

  // Glow animation
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

  // State transition animation (working ↔ resting)
  useEffect(() => {
    stateTransition.value = withTiming(isResting ? 1 : 0, {
      duration: 400,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    // Pulse on state change
    if (seconds > 0 || restTargetSeconds > 0) {
      pulseScale.value = withSequence(
        withSpring(1.05, { damping: 6 }),
        withSpring(1, { damping: 8 })
      );
    }
  }, [isResting]);

  // Animate ring progress
  useEffect(() => {
    if (isResting && restTargetSeconds > 0) {
      // Countdown mode: ring drains from full to empty
      const target = seconds / restTargetSeconds;
      ringProgress.value = withTiming(target, {
        duration: 300,
        easing: Easing.linear,
      });
    } else {
      // Count up mode: ring fills over 90s
      const maxSeconds = 90;
      const target = Math.min(seconds / maxSeconds, 1);
      ringProgress.value = withTiming(target, {
        duration: 300,
        easing: Easing.linear,
      });
    }
  }, [seconds, isResting, restTargetSeconds]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const containerPulse = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Animated ring stroke color
  const radius = 100;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;

  const animatedRingProps = useAnimatedProps(() => {
    const progress = ringProgress.value * circumference;
    return {
      strokeDashoffset: circumference - progress,
      stroke: interpolateColor(
        stateTransition.value,
        [0, 1],
        ['#E5E5E5', '#4ADE80']
      ),
    };
  });

  // Status text style
  const statusStyle = useAnimatedStyle(() => ({
    opacity: withTiming(1, { duration: 200 }),
  }));

  // Format countdown display
  const displayTime = (() => {
    if (isResting && restTargetSeconds > 0) {
      // Show countdown MM:SS
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return formattedTime;
  })();

  // Last set weight for quick buttons
  const lastWeight = session?.sets.length
    ? session.sets[session.sets.length - 1].weight
    : null;

  // Open modal to input reps/weight
  const handleEndSet = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSetDuration(seconds);
    // Pre-fill weight from last set
    if (lastWeight && !weightInput) {
      setWeightInput(lastWeight.toString());
    }
    setShowInputModal(true);
  }, [hapticEnabled, seconds, lastWeight, weightInput]);

  // Confirm set with reps/weight — starts rest countdown
  const handleConfirmSet = useCallback(() => {
    const reps = repsInput ? parseInt(repsInput, 10) : undefined;
    const weight = weightInput ? parseFloat(weightInput) : undefined;

    // Check for PR before saving
    if (session?.exerciseId && weight && reps) {
      const prCheck = checkPR(session.exerciseId, weight, reps);
      const volume = weight * reps;

      if (prCheck.isNewWeightPR || prCheck.isNewVolumePR) {
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

    // Set rest target from user settings
    startRest(defaultRestTime);

    setRepsInput('');
    setWeightInput('');
    setShowInputModal(false);
  }, [hapticEnabled, endSet, startRest, defaultRestTime, setDuration, repsInput, weightInput, session?.exerciseId, checkPR]);

  // Skip reps/weight input — starts rest countdown
  const handleSkipInput = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    endSet(setDuration);
    startRest(defaultRestTime);
    setRepsInput('');
    setWeightInput('');
    setShowInputModal(false);
  }, [hapticEnabled, endSet, startRest, defaultRestTime, setDuration]);

  const handleStopRest = useCallback(async () => {
    if (hapticEnabled) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    if (currentSet >= totalSets) {
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

  // Quick weight buttons (last weight ± adjustments)
  const quickWeights = lastWeight
    ? [lastWeight - 5, lastWeight - 2.5, lastWeight, lastWeight + 2.5, lastWeight + 5].filter((w) => w > 0)
    : [20, 40, 60, 80, 100];

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
            refreshPRs();
          }}
        />
      )}

      {/* Battery indicator - top right */}
      <View className="absolute top-14 right-6 flex-row gap-0.5">
        {[...Array(totalSets)].map((_, i) => (
          <View
            key={i}
            className={`w-1.5 h-3 ${
              i < (isResting ? currentSet - 1 : currentSet - 1)
                ? 'bg-setly-accent'
                : i === (isResting ? currentSet - 1 : currentSet - 1)
                ? isResting ? 'bg-setly-accent/50' : 'bg-setly-text'
                : 'bg-setly-border'
            }`}
          />
        ))}
      </View>

      {/* Exercise name */}
      <Text
        className="absolute top-24 text-2xl text-setly-text tracking-widest"
        style={{ fontFamily: 'SpaceMono_700Bold' }}
      >
        {(exerciseName || session?.exerciseName || 'WORKOUT').toUpperCase()}
      </Text>

      {/* Completed sets display */}
      {session && session.sets.length > 0 && (
        <View className="absolute top-40 left-8 right-8">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {session.sets.map((set, index) => (
              <View key={index} className="mr-3 px-3 py-2 border border-setly-border">
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

      {/* Timer Container */}
      <Animated.View style={containerPulse} className="items-center justify-center">
        {/* Glow effect */}
        <Animated.View
          style={glowStyle}
          className={`absolute w-72 h-72 rounded-full ${isResting ? 'bg-setly-accent/10' : 'bg-white/10'}`}
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
          {/* Animated progress ring */}
          <AnimatedCircle
            cx={120}
            cy={120}
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeLinecap="round"
            rotation={-90}
            origin="120, 120"
            animatedProps={animatedRingProps}
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
          className={`text-6xl tracking-wider ${restFinished ? 'text-setly-accent' : 'text-setly-text'}`}
          style={{ fontFamily: 'SpaceMono_700Bold' }}
        >
          {displayTime}
        </Text>
      </Animated.View>

      {/* Set counter */}
      <Text
        className="text-setly-text text-xl mt-8"
        style={{ fontFamily: 'SpaceMono_400Regular' }}
      >
        {isResting ? currentSet - 1 : currentSet} / {totalSets}
      </Text>

      {/* Status indicator with color */}
      <Animated.View style={statusStyle} className="flex-row items-center gap-2 mt-2">
        <View className={`w-2 h-2 rounded-full ${isResting ? 'bg-setly-accent' : 'bg-setly-text'}`} />
        <Text
          className={`text-xs tracking-wider ${isResting ? 'text-setly-accent' : 'text-setly-muted'}`}
          style={{ fontFamily: 'SpaceMono_700Bold' }}
        >
          {restFinished ? 'PAUSA FINITA!' : isResting ? `PAUSA · ${formatTime(defaultRestTime)}` : 'WORKING'}
        </Text>
      </Animated.View>

      {/* Action button */}
      <View className="absolute bottom-16 w-full px-8">
        <Pressable
          onPress={isResting ? handleStopRest : handleEndSet}
          className={`py-4 border active:bg-white/5 ${
            restFinished
              ? 'border-setly-accent bg-setly-accent/20'
              : isResting
              ? 'border-setly-accent bg-setly-accent/5'
              : 'border-setly-text/50'
          }`}
        >
          <Text
            className={`text-center tracking-widest ${isResting ? 'text-setly-accent' : 'text-setly-text'}`}
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            {isResting
              ? currentSet >= totalSets
                ? 'TERMINA ALLENAMENTO'
                : restFinished
                ? 'PROSSIMO SET'
                : 'STOP PAUSA'
              : 'FINE SET'}
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
        animationType="slide"
        onRequestClose={() => setShowInputModal(false)}
      >
        <View className="flex-1 bg-black/80 justify-end">
          <View className="bg-setly-black border-t border-setly-border p-6 pb-10">
            {/* Modal header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text
                className="text-setly-text text-lg tracking-widest"
                style={{ fontFamily: 'SpaceMono_700Bold' }}
              >
                SET {currentSet}
              </Text>
              <Text
                className="text-setly-muted text-xs tracking-wider"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                {setDuration}s
              </Text>
            </View>

            {/* Weight input */}
            <View className="mb-3">
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

            {/* Quick weight buttons */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <View className="flex-row gap-2">
                {quickWeights.map((w) => (
                  <Pressable
                    key={w}
                    onPress={() => {
                      if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setWeightInput(w.toString());
                    }}
                    className={`px-3 py-1.5 border ${weightInput === w.toString() ? 'border-setly-accent bg-setly-accent/10' : 'border-setly-border'}`}
                  >
                    <Text
                      className={`text-xs ${weightInput === w.toString() ? 'text-setly-accent' : 'text-setly-text'}`}
                      style={{ fontFamily: 'SpaceMono_700Bold' }}
                    >
                      {w}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Reps input */}
            <View className="mb-3">
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
              {[5, 6, 8, 10, 12, 15].map((num) => (
                <Pressable
                  key={num}
                  onPress={() => {
                    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setRepsInput(num.toString());
                  }}
                  className={`px-3 py-2 border ${repsInput === num.toString() ? 'border-setly-accent bg-setly-accent/10' : 'border-setly-border'}`}
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
              className="py-4 border border-setly-accent bg-setly-accent/10 mb-3 active:bg-setly-accent/20"
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

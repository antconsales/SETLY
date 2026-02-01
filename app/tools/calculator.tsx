import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  calculate1RM,
  getPercentageBreakdown,
  calculatePlates,
  standardBarbellWeight,
} from '@/lib/calculations';
import { useSettingsStore } from '@/stores';

type CalculatorMode = '1rm' | 'plates';

export default function CalculatorScreen() {
  const { hapticEnabled } = useSettingsStore();
  const [mode, setMode] = useState<CalculatorMode>('1rm');

  // 1RM inputs
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [calculated1RM, setCalculated1RM] = useState<number | null>(null);

  // Plate calculator inputs
  const [targetWeight, setTargetWeight] = useState('');
  const [barbellWeight, setBarbellWeight] = useState(standardBarbellWeight.toString());

  const handleCalculate1RM = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const w = parseFloat(weight);
    const r = parseInt(reps, 10);

    if (w > 0 && r > 0) {
      setCalculated1RM(calculate1RM(w, r));
    }
  };

  const handleBack = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const plateCalc = targetWeight
    ? calculatePlates(parseFloat(targetWeight), parseFloat(barbellWeight) || standardBarbellWeight)
    : null;

  const percentageBreakdown = calculated1RM ? getPercentageBreakdown(calculated1RM) : [];

  return (
    <View className="flex-1 bg-setly-black">
      {/* Header */}
      <View className="px-6 pt-16 pb-4">
        <Pressable onPress={handleBack} className="mb-4">
          <Text
            className="text-setly-muted text-sm tracking-wider"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            ← INDIETRO
          </Text>
        </Pressable>

        <Text
          className="text-setly-text text-2xl tracking-widest"
          style={{ fontFamily: 'SpaceMono_700Bold' }}
        >
          CALCOLATORI
        </Text>
      </View>

      {/* Mode tabs */}
      <View className="flex-row px-6 mb-6">
        <Pressable
          onPress={() => setMode('1rm')}
          className={`flex-1 py-3 border ${
            mode === '1rm' ? 'border-setly-accent bg-setly-accent/10' : 'border-setly-border'
          }`}
        >
          <Text
            className={`text-center text-sm tracking-wider ${
              mode === '1rm' ? 'text-setly-accent' : 'text-setly-text'
            }`}
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            1RM
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setMode('plates')}
          className={`flex-1 py-3 border border-l-0 ${
            mode === 'plates' ? 'border-setly-accent bg-setly-accent/10' : 'border-setly-border'
          }`}
        >
          <Text
            className={`text-center text-sm tracking-wider ${
              mode === 'plates' ? 'text-setly-accent' : 'text-setly-text'
            }`}
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            DISCHI
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-6">
        {mode === '1rm' ? (
          <>
            {/* 1RM Calculator */}
            <Text
              className="text-setly-muted text-xs tracking-wider mb-4"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              CALCOLA IL TUO MASSIMALE
            </Text>

            {/* Weight input */}
            <View className="mb-4">
              <Text
                className="text-setly-muted text-xs tracking-wider mb-2"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                PESO SOLLEVATO (KG)
              </Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                placeholder="0"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
                className="border border-setly-border px-4 py-3 text-setly-text text-xl"
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
                value={reps}
                onChangeText={setReps}
                placeholder="0"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                className="border border-setly-border px-4 py-3 text-setly-text text-xl"
                style={{ fontFamily: 'SpaceMono_700Bold' }}
              />
            </View>

            {/* Calculate button */}
            <Pressable
              onPress={handleCalculate1RM}
              className="py-4 border border-setly-accent bg-setly-accent/10 mb-6"
            >
              <Text
                className="text-setly-accent text-center tracking-widest"
                style={{ fontFamily: 'SpaceMono_700Bold' }}
              >
                CALCOLA
              </Text>
            </Pressable>

            {/* Result */}
            {calculated1RM && (
              <View className="mb-6">
                <View className="border border-setly-accent p-6 items-center mb-4">
                  <Text
                    className="text-setly-muted text-xs tracking-wider mb-2"
                    style={{ fontFamily: 'SpaceMono_400Regular' }}
                  >
                    IL TUO 1RM STIMATO
                  </Text>
                  <Text
                    className="text-setly-accent text-5xl"
                    style={{ fontFamily: 'SpaceMono_700Bold' }}
                  >
                    {calculated1RM}
                  </Text>
                  <Text
                    className="text-setly-accent text-xl"
                    style={{ fontFamily: 'SpaceMono_400Regular' }}
                  >
                    KG
                  </Text>
                </View>

                {/* Percentage table */}
                <Text
                  className="text-setly-muted text-xs tracking-wider mb-3"
                  style={{ fontFamily: 'SpaceMono_400Regular' }}
                >
                  TABELLA PERCENTUALI
                </Text>

                <View className="border border-setly-border">
                  {/* Header */}
                  <View className="flex-row border-b border-setly-border px-4 py-2 bg-setly-border/30">
                    <Text
                      className="text-setly-muted text-xs flex-1"
                      style={{ fontFamily: 'SpaceMono_400Regular' }}
                    >
                      %
                    </Text>
                    <Text
                      className="text-setly-muted text-xs flex-1 text-center"
                      style={{ fontFamily: 'SpaceMono_400Regular' }}
                    >
                      PESO
                    </Text>
                    <Text
                      className="text-setly-muted text-xs flex-1 text-right"
                      style={{ fontFamily: 'SpaceMono_400Regular' }}
                    >
                      REPS
                    </Text>
                  </View>

                  {percentageBreakdown.map((row, index) => (
                    <View
                      key={row.percentage}
                      className={`flex-row px-4 py-3 ${
                        index < percentageBreakdown.length - 1 ? 'border-b border-setly-border' : ''
                      }`}
                    >
                      <Text
                        className="text-setly-text text-sm flex-1"
                        style={{ fontFamily: 'SpaceMono_700Bold' }}
                      >
                        {row.percentage}%
                      </Text>
                      <Text
                        className="text-setly-accent text-sm flex-1 text-center"
                        style={{ fontFamily: 'SpaceMono_700Bold' }}
                      >
                        {row.weight} kg
                      </Text>
                      <Text
                        className="text-setly-muted text-sm flex-1 text-right"
                        style={{ fontFamily: 'SpaceMono_400Regular' }}
                      >
                        ~{row.reps} reps
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Plate Calculator */}
            <Text
              className="text-setly-muted text-xs tracking-wider mb-4"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              CALCOLA I DISCHI DA CARICARE
            </Text>

            {/* Target weight */}
            <View className="mb-4">
              <Text
                className="text-setly-muted text-xs tracking-wider mb-2"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                PESO TARGET (KG)
              </Text>
              <TextInput
                value={targetWeight}
                onChangeText={setTargetWeight}
                placeholder="0"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
                className="border border-setly-border px-4 py-3 text-setly-text text-xl"
                style={{ fontFamily: 'SpaceMono_700Bold' }}
              />
            </View>

            {/* Barbell weight */}
            <View className="mb-6">
              <Text
                className="text-setly-muted text-xs tracking-wider mb-2"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                PESO BILANCIERE (KG)
              </Text>
              <View className="flex-row gap-2">
                {[15, 20, 25].map((w) => (
                  <Pressable
                    key={w}
                    onPress={() => setBarbellWeight(w.toString())}
                    className={`flex-1 py-3 border ${
                      barbellWeight === w.toString()
                        ? 'border-setly-accent bg-setly-accent/10'
                        : 'border-setly-border'
                    }`}
                  >
                    <Text
                      className={`text-center ${
                        barbellWeight === w.toString() ? 'text-setly-accent' : 'text-setly-text'
                      }`}
                      style={{ fontFamily: 'SpaceMono_700Bold' }}
                    >
                      {w}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Result */}
            {plateCalc && parseFloat(targetWeight) > 0 && (
              <View className="border border-setly-border p-4 mb-6">
                <Text
                  className="text-setly-muted text-xs tracking-wider mb-4"
                  style={{ fontFamily: 'SpaceMono_400Regular' }}
                >
                  DISCHI PER LATO
                </Text>

                {plateCalc.plates.length > 0 ? (
                  <View className="flex-row flex-wrap gap-3 mb-4">
                    {plateCalc.plates.map((plate, index) => (
                      <View key={index} className="items-center">
                        <View
                          className="w-16 h-16 rounded-full border-2 border-setly-accent items-center justify-center"
                          style={{
                            width: 40 + plate.weight * 2,
                            height: 40 + plate.weight * 2,
                          }}
                        >
                          <Text
                            className="text-setly-accent text-lg"
                            style={{ fontFamily: 'SpaceMono_700Bold' }}
                          >
                            {plate.weight}
                          </Text>
                        </View>
                        <Text
                          className="text-setly-muted text-xs mt-1"
                          style={{ fontFamily: 'SpaceMono_400Regular' }}
                        >
                          ×{plate.count}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text
                    className="text-setly-muted text-sm text-center mb-4"
                    style={{ fontFamily: 'SpaceMono_400Regular' }}
                  >
                    Solo bilanciere, nessun disco
                  </Text>
                )}

                {/* Summary */}
                <View className="flex-row justify-between border-t border-setly-border pt-4">
                  <View>
                    <Text
                      className="text-setly-muted text-xs"
                      style={{ fontFamily: 'SpaceMono_400Regular' }}
                    >
                      BILANCIERE
                    </Text>
                    <Text
                      className="text-setly-text text-lg"
                      style={{ fontFamily: 'SpaceMono_700Bold' }}
                    >
                      {plateCalc.barbellWeight} kg
                    </Text>
                  </View>
                  <View>
                    <Text
                      className="text-setly-muted text-xs"
                      style={{ fontFamily: 'SpaceMono_400Regular' }}
                    >
                      PER LATO
                    </Text>
                    <Text
                      className="text-setly-text text-lg"
                      style={{ fontFamily: 'SpaceMono_700Bold' }}
                    >
                      {plateCalc.weightPerSide} kg
                    </Text>
                  </View>
                  <View>
                    <Text
                      className="text-setly-muted text-xs"
                      style={{ fontFamily: 'SpaceMono_400Regular' }}
                    >
                      TOTALE
                    </Text>
                    <Text
                      className={`text-lg ${plateCalc.isExact ? 'text-setly-accent' : 'text-yellow-500'}`}
                      style={{ fontFamily: 'SpaceMono_700Bold' }}
                    >
                      {plateCalc.achievedWeight} kg
                    </Text>
                  </View>
                </View>

                {!plateCalc.isExact && (
                  <Text
                    className="text-yellow-500 text-xs text-center mt-3"
                    style={{ fontFamily: 'SpaceMono_400Regular' }}
                  >
                    ⚠ Peso non esatto con i dischi disponibili
                  </Text>
                )}
              </View>
            )}
          </>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}

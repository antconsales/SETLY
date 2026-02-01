import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '@/stores';
import { exportAndShareJSON, exportAndShareCSV, gatherExportData } from '@/lib/export';

export default function ExportScreen() {
  const { hapticEnabled } = useSettingsStore();
  const [isExporting, setIsExporting] = useState(false);
  const [stats, setStats] = useState<{ workouts: number; sets: number } | null>(null);

  const handleBack = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const handlePreview = async () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const data = await gatherExportData();
      const totalSets = data.workouts.reduce((sum, w) => sum + w.sets.length, 0);
      setStats({
        workouts: data.workouts.length,
        sets: totalSets,
      });
    } catch (error) {
      console.error('Error previewing data:', error);
    }
  };

  const handleExportJSON = async () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsExporting(true);
    try {
      await exportAndShareJSON();
      if (hapticEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error exporting JSON:', error);
      Alert.alert('Errore', 'Impossibile esportare i dati. Riprova.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsExporting(true);
    try {
      await exportAndShareCSV();
      if (hapticEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      Alert.alert('Errore', 'Impossibile esportare i dati. Riprova.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <View className="flex-1 bg-setly-black">
      {/* Header */}
      <View className="px-6 pt-16 pb-6">
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
          ESPORTA DATI
        </Text>
        <Text
          className="text-setly-muted text-sm mt-2"
          style={{ fontFamily: 'SpaceMono_400Regular' }}
        >
          Esporta i tuoi workout e statistiche
        </Text>
      </View>

      <ScrollView className="flex-1 px-6">
        {/* Preview section */}
        <View className="border border-setly-border p-4 mb-6">
          <Text
            className="text-setly-muted text-xs tracking-wider mb-4"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            ANTEPRIMA DATI
          </Text>

          {stats ? (
            <View className="flex-row gap-6 mb-4">
              <View>
                <Text
                  className="text-setly-accent text-2xl"
                  style={{ fontFamily: 'SpaceMono_700Bold' }}
                >
                  {stats.workouts}
                </Text>
                <Text
                  className="text-setly-muted text-xs"
                  style={{ fontFamily: 'SpaceMono_400Regular' }}
                >
                  WORKOUT
                </Text>
              </View>
              <View>
                <Text
                  className="text-setly-text text-2xl"
                  style={{ fontFamily: 'SpaceMono_700Bold' }}
                >
                  {stats.sets}
                </Text>
                <Text
                  className="text-setly-muted text-xs"
                  style={{ fontFamily: 'SpaceMono_400Regular' }}
                >
                  SET
                </Text>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={handlePreview}
              className="py-3 border border-setly-border"
            >
              <Text
                className="text-setly-text text-center text-sm tracking-wider"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                MOSTRA ANTEPRIMA
              </Text>
            </Pressable>
          )}
        </View>

        {/* Export options */}
        <Text
          className="text-setly-muted text-xs tracking-wider mb-4"
          style={{ fontFamily: 'SpaceMono_400Regular' }}
        >
          FORMATO EXPORT
        </Text>

        {/* JSON Export */}
        <Pressable
          onPress={handleExportJSON}
          disabled={isExporting}
          className={`border border-setly-accent p-4 mb-4 ${isExporting ? 'opacity-50' : ''}`}
        >
          <View className="flex-row justify-between items-center">
            <View>
              <Text
                className="text-setly-accent text-lg"
                style={{ fontFamily: 'SpaceMono_700Bold' }}
              >
                JSON
              </Text>
              <Text
                className="text-setly-muted text-xs mt-1"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                Export completo con tutti i dettagli
              </Text>
            </View>
            <Text
              className="text-setly-accent text-xl"
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              →
            </Text>
          </View>
        </Pressable>

        {/* CSV Export */}
        <Pressable
          onPress={handleExportCSV}
          disabled={isExporting}
          className={`border border-setly-border p-4 mb-6 ${isExporting ? 'opacity-50' : ''}`}
        >
          <View className="flex-row justify-between items-center">
            <View>
              <Text
                className="text-setly-text text-lg"
                style={{ fontFamily: 'SpaceMono_700Bold' }}
              >
                CSV
              </Text>
              <Text
                className="text-setly-muted text-xs mt-1"
                style={{ fontFamily: 'SpaceMono_400Regular' }}
              >
                Formato spreadsheet (Excel, Google Sheets)
              </Text>
            </View>
            <Text
              className="text-setly-muted text-xl"
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              →
            </Text>
          </View>
        </Pressable>

        {/* Info */}
        <View className="border border-setly-border/50 p-4 bg-setly-border/10">
          <Text
            className="text-setly-muted text-xs"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            I dati esportati includono:
            {'\n'}• Tutti i workout completati
            {'\n'}• Dettagli di ogni set (peso, reps)
            {'\n'}• Statistiche e progressi
            {'\n'}• Achievement sbloccati
            {'\n\n'}
            I file vengono salvati nella cartella documenti dell'app.
          </Text>
        </View>

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}

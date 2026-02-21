import { View, Text, ScrollView, Pressable, Switch, Alert } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSettingsStore, useScheduleStore, useChatStore } from '@/stores';

export default function Settings() {
  const {
    defaultSets,
    defaultRestTime,
    hapticEnabled,
    soundEnabled,
    setDefaultSets,
    setDefaultRestTime,
    toggleHaptic,
    toggleSound,
  } = useSettingsStore();

  const { notificationsEnabled, enableNotifications } = useScheduleStore();

  const { modelStatus, downloadModel, deleteModel, cancelDownload } = useChatStore();

  const handleToggleHaptic = () => {
    if (hapticEnabled) {
      Haptics.selectionAsync();
    }
    toggleHaptic();
  };

  const handleToggleSound = () => {
    if (hapticEnabled) {
      Haptics.selectionAsync();
    }
    toggleSound();
  };

  const handleEnableNotifications = async () => {
    if (hapticEnabled) {
      Haptics.selectionAsync();
    }
    await enableNotifications();
  };

  const handleIncrementSets = () => {
    if (hapticEnabled) Haptics.selectionAsync();
    if (defaultSets < 10) setDefaultSets(defaultSets + 1);
  };

  const handleDecrementSets = () => {
    if (hapticEnabled) Haptics.selectionAsync();
    if (defaultSets > 1) setDefaultSets(defaultSets - 1);
  };

  const handleIncrementRest = () => {
    if (hapticEnabled) Haptics.selectionAsync();
    if (defaultRestTime < 300) setDefaultRestTime(defaultRestTime + 15);
  };

  const handleDecrementRest = () => {
    if (hapticEnabled) Haptics.selectionAsync();
    if (defaultRestTime > 15) setDefaultRestTime(defaultRestTime - 15);
  };

  const handleGoPremium = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/premium');
  };

  const handleOpenCalculator = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/tools/calculator');
  };

  const handleOpenExport = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/settings/export');
  };

  const handleOpenTemplates = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/templates');
  };

  const handleDownloadModel = async () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await downloadModel();
  };

  const handleDeleteModel = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    Alert.alert(
      'ELIMINA MODELLO AI',
      'Vuoi eliminare il modello AI (~200 MB)? Potrai riscaricarlo in qualsiasi momento.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: () => deleteModel(),
        },
      ]
    );
  };

  const handleCancelDownload = async () => {
    if (hapticEnabled) {
      Haptics.selectionAsync();
    }
    await cancelDownload();
  };

  const handleOpenChat = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/ai/chat');
  };

  const formatRestTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
  };

  // Model status label
  const getModelStatusLabel = () => {
    switch (modelStatus.state) {
      case 'not_downloaded':
        return 'NON SCARICATO';
      case 'downloading':
        return `SCARICAMENTO ${modelStatus.progress}%`;
      case 'downloaded':
        return 'SCARICATO';
      case 'loading':
        return 'CARICAMENTO...';
      case 'ready':
        return 'PRONTO';
      case 'error':
        return 'ERRORE';
      default:
        return 'SCONOSCIUTO';
    }
  };

  const getModelStatusColor = () => {
    switch (modelStatus.state) {
      case 'ready':
      case 'downloaded':
        return 'bg-setly-accent';
      case 'downloading':
      case 'loading':
        return 'bg-yellow-400';
      case 'error':
        return 'bg-red-500';
      default:
        return 'border border-setly-muted';
    }
  };

  return (
    <View className="flex-1 bg-setly-black pt-12">
      {/* Header */}
      <View className="px-6 pb-4 border-b border-setly-border">
        <Text
          className="text-setly-text text-xl tracking-wider"
          style={{ fontFamily: 'SpaceMono_700Bold' }}
        >
          SETTINGS
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* AI Assistant Section */}
        <View className="px-6 pt-6 pb-2">
          <Text
            className="text-setly-muted text-xs tracking-wider"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            AI ASSISTANT
          </Text>
        </View>

        {/* AI Status row */}
        <View className="px-6 py-4 border-b border-setly-border">
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center gap-2">
              <View className={`w-2 h-2 rounded-full ${getModelStatusColor()}`} />
              <Text
                className="text-setly-text text-sm"
                style={{ fontFamily: 'SpaceMono_700Bold' }}
              >
                SETLY AI
              </Text>
            </View>
            <Text
              className="text-setly-muted text-xs tracking-wider"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              {getModelStatusLabel()}
            </Text>
          </View>

          <Text
            className="text-setly-muted text-xs tracking-wider mb-3"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            Assistente AI on-device (~200 MB). Funziona completamente offline.
          </Text>

          {/* Download progress bar */}
          {modelStatus.state === 'downloading' && (
            <View className="mb-3">
              <View className="h-1 bg-setly-border w-full">
                <View
                  className="h-1 bg-setly-accent"
                  style={{ width: `${modelStatus.progress}%` }}
                />
              </View>
            </View>
          )}

          {/* Action buttons */}
          <View className="flex-row gap-3">
            {modelStatus.state === 'not_downloaded' && (
              <Pressable
                onPress={handleDownloadModel}
                className="px-4 py-2 border border-setly-accent bg-setly-accent/10 active:bg-setly-accent/20"
              >
                <Text
                  className="text-setly-accent text-xs tracking-wider"
                  style={{ fontFamily: 'SpaceMono_700Bold' }}
                >
                  SCARICA
                </Text>
              </Pressable>
            )}

            {modelStatus.state === 'downloading' && (
              <Pressable
                onPress={handleCancelDownload}
                className="px-4 py-2 border border-setly-border active:bg-white/5"
              >
                <Text
                  className="text-setly-muted text-xs tracking-wider"
                  style={{ fontFamily: 'SpaceMono_400Regular' }}
                >
                  ANNULLA
                </Text>
              </Pressable>
            )}

            {(modelStatus.state === 'downloaded' || modelStatus.state === 'ready') && (
              <>
                <Pressable
                  onPress={handleOpenChat}
                  className="px-4 py-2 border border-setly-accent bg-setly-accent/10 active:bg-setly-accent/20"
                >
                  <Text
                    className="text-setly-accent text-xs tracking-wider"
                    style={{ fontFamily: 'SpaceMono_700Bold' }}
                  >
                    APRI CHAT
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleDeleteModel}
                  className="px-4 py-2 border border-setly-border active:bg-white/5"
                >
                  <Text
                    className="text-setly-muted text-xs tracking-wider"
                    style={{ fontFamily: 'SpaceMono_400Regular' }}
                  >
                    ELIMINA
                  </Text>
                </Pressable>
              </>
            )}

            {modelStatus.state === 'error' && (
              <Pressable
                onPress={handleDownloadModel}
                className="px-4 py-2 border border-setly-border active:bg-white/5"
              >
                <Text
                  className="text-setly-muted text-xs tracking-wider"
                  style={{ fontFamily: 'SpaceMono_400Regular' }}
                >
                  RIPROVA
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Workout Defaults Section */}
        <View className="px-6 pt-6 pb-2">
          <Text
            className="text-setly-muted text-xs tracking-wider"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            WORKOUT DEFAULTS
          </Text>
        </View>

        {/* Default Sets */}
        <View className="px-6 py-4 flex-row justify-between items-center border-b border-setly-border">
          <View>
            <Text
              className="text-setly-text text-sm"
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              DEFAULT SETS
            </Text>
            <Text
              className="text-setly-muted text-xs tracking-wider mt-1"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              Target sets per exercise
            </Text>
          </View>
          <View className="flex-row items-center gap-4">
            <Pressable onPress={handleDecrementSets} className="w-8 h-8 items-center justify-center">
              <Text className="text-setly-muted text-xl">−</Text>
            </Pressable>
            <Text
              className="text-setly-text text-lg w-6 text-center"
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              {defaultSets}
            </Text>
            <Pressable onPress={handleIncrementSets} className="w-8 h-8 items-center justify-center">
              <Text className="text-setly-muted text-xl">+</Text>
            </Pressable>
          </View>
        </View>

        {/* Default Rest Time */}
        <View className="px-6 py-4 flex-row justify-between items-center border-b border-setly-border">
          <View>
            <Text
              className="text-setly-text text-sm"
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              REST TIME
            </Text>
            <Text
              className="text-setly-muted text-xs tracking-wider mt-1"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              Default rest between sets
            </Text>
          </View>
          <View className="flex-row items-center gap-4">
            <Pressable onPress={handleDecrementRest} className="w-8 h-8 items-center justify-center">
              <Text className="text-setly-muted text-xl">−</Text>
            </Pressable>
            <Text
              className="text-setly-text text-sm w-12 text-center"
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              {formatRestTime(defaultRestTime)}
            </Text>
            <Pressable onPress={handleIncrementRest} className="w-8 h-8 items-center justify-center">
              <Text className="text-setly-muted text-xl">+</Text>
            </Pressable>
          </View>
        </View>

        {/* Feedback Section */}
        <View className="px-6 pt-6 pb-2">
          <Text
            className="text-setly-muted text-xs tracking-wider"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            FEEDBACK
          </Text>
        </View>

        {/* Haptic Toggle */}
        <View className="px-6 py-4 flex-row justify-between items-center border-b border-setly-border">
          <View>
            <Text
              className="text-setly-text text-sm"
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              HAPTIC FEEDBACK
            </Text>
            <Text
              className="text-setly-muted text-xs tracking-wider mt-1"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              Vibration on interactions
            </Text>
          </View>
          <Switch
            value={hapticEnabled}
            onValueChange={handleToggleHaptic}
            trackColor={{ false: '#2A2A2A', true: '#4ADE80' }}
            thumbColor="#E5E5E5"
          />
        </View>

        {/* Sound Toggle */}
        <View className="px-6 py-4 flex-row justify-between items-center border-b border-setly-border">
          <View>
            <Text
              className="text-setly-text text-sm"
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              SOUND EFFECTS
            </Text>
            <Text
              className="text-setly-muted text-xs tracking-wider mt-1"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              Audio feedback
            </Text>
          </View>
          <Switch
            value={soundEnabled}
            onValueChange={handleToggleSound}
            trackColor={{ false: '#2A2A2A', true: '#4ADE80' }}
            thumbColor="#E5E5E5"
          />
        </View>

        {/* Notifications Section */}
        <View className="px-6 pt-6 pb-2">
          <Text
            className="text-setly-muted text-xs tracking-wider"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            NOTIFICATIONS
          </Text>
        </View>

        {/* Notifications Toggle */}
        <Pressable
          onPress={!notificationsEnabled ? handleEnableNotifications : undefined}
          className="px-6 py-4 flex-row justify-between items-center border-b border-setly-border"
        >
          <View>
            <Text
              className="text-setly-text text-sm"
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              WORKOUT REMINDERS
            </Text>
            <Text
              className="text-setly-muted text-xs tracking-wider mt-1"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              {notificationsEnabled ? 'Enabled' : 'Tap to enable'}
            </Text>
          </View>
          <View className={`w-3 h-3 rounded-full ${notificationsEnabled ? 'bg-setly-accent' : 'border border-setly-muted'}`} />
        </Pressable>

        {/* Tools Section */}
        <View className="px-6 pt-6 pb-2">
          <Text
            className="text-setly-muted text-xs tracking-wider"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            TOOLS
          </Text>
        </View>

        <Pressable
          onPress={handleOpenCalculator}
          className="px-6 py-4 flex-row justify-between items-center border-b border-setly-border active:bg-white/5"
        >
          <View>
            <Text
              className="text-setly-text text-sm"
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              CALCOLATORI
            </Text>
            <Text
              className="text-setly-muted text-xs tracking-wider mt-1"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              1RM e dischi bilanciere
            </Text>
          </View>
          <Text className="text-setly-muted">→</Text>
        </Pressable>

        <Pressable
          onPress={handleOpenTemplates}
          className="px-6 py-4 flex-row justify-between items-center border-b border-setly-border active:bg-white/5"
        >
          <View>
            <Text
              className="text-setly-text text-sm"
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              TEMPLATES
            </Text>
            <Text
              className="text-setly-muted text-xs tracking-wider mt-1"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              Programmi predefiniti
            </Text>
          </View>
          <Text className="text-setly-muted">→</Text>
        </Pressable>

        <Pressable
          onPress={handleOpenExport}
          className="px-6 py-4 flex-row justify-between items-center border-b border-setly-border active:bg-white/5"
        >
          <View>
            <Text
              className="text-setly-text text-sm"
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              EXPORT
            </Text>
            <Text
              className="text-setly-muted text-xs tracking-wider mt-1"
              style={{ fontFamily: 'SpaceMono_400Regular' }}
            >
              Backup JSON/CSV
            </Text>
          </View>
          <Text className="text-setly-muted">→</Text>
        </Pressable>

        {/* Premium Section */}
        <View className="px-6 pt-6 pb-2">
          <Text
            className="text-setly-muted text-xs tracking-wider"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            UPGRADE
          </Text>
        </View>

        <Pressable
          onPress={handleGoPremium}
          className="mx-6 my-4 p-4 border border-setly-accent/50 bg-setly-accent/5 active:bg-setly-accent/10"
        >
          <Text
            className="text-setly-accent text-sm tracking-wider"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            SETLY PRO
          </Text>
          <Text
            className="text-setly-muted text-xs tracking-wider mt-1"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            Unlock advanced features
          </Text>
        </Pressable>

        {/* About Section */}
        <View className="px-6 pt-6 pb-2">
          <Text
            className="text-setly-muted text-xs tracking-wider"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            ABOUT
          </Text>
        </View>

        <View className="px-6 py-4 border-b border-setly-border">
          <Text
            className="text-setly-muted text-xs tracking-wider"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            VERSION 1.0.0
          </Text>
        </View>

        {/* Footer */}
        <View className="px-6 py-8 items-center">
          <Text
            className="text-setly-border text-xs tracking-widest"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
          >
            TRACK. DON'T GUESS.
          </Text>
        </View>

        {/* Spacer */}
        <View className="h-20" />
      </ScrollView>

      {/* Decorative elements */}
      <View className="absolute left-0 top-1/4 w-6 h-px bg-setly-border" />
      <View className="absolute right-0 bottom-1/3 w-10 h-px bg-setly-border" />
    </View>
  );
}

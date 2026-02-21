import { useCallback, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatBubble, ModelDownload } from '@/components/ui';
import {
  useChatStore,
  useExerciseStore,
  useSettingsStore,
  useScheduleStore,
  useTemplateStore,
  useGamificationStore,
} from '@/stores';
import type { StoreRefs } from '@/lib/llm/toolExecutor';
import type { ChatMessage } from '@/lib/llm/systemPrompt';

// --- Quick action chips ---

const QUICK_ACTIONS = [
  'Mostra statistiche',
  'Calcola 1RM',
  'Quali esercizi ho?',
  'Programma allenamento',
] as const;

// --- Chat screen ---

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList<ChatMessage>>(null);
  const [inputText, setInputText] = useState('');

  // Chat store
  const messages = useChatStore((s) => s.messages);
  const isGenerating = useChatStore((s) => s.isGenerating);
  const modelStatus = useChatStore((s) => s.modelStatus);
  const sendUserMessage = useChatStore((s) => s.sendUserMessage);
  const clearMessages = useChatStore((s) => s.clearMessages);
  const initModel = useChatStore((s) => s.initModel);
  const releaseModel = useChatStore((s) => s.releaseModel);

  // Settings
  const hapticEnabled = useSettingsStore((s) => s.hapticEnabled);

  // Stores for StoreRefs injection
  const exerciseStore = useExerciseStore();
  const settingsStore = useSettingsStore();
  const scheduleStore = useScheduleStore();
  const templateStore = useTemplateStore();
  const gamificationStore = useGamificationStore();

  // Build StoreRefs from Zustand stores (no hooks inside tool executor)
  const storeRefs = useMemo<StoreRefs>(
    () => ({
      getExercises: () => exerciseStore.exercises,
      fetchExercises: exerciseStore.fetchExercises,
      addExercise: exerciseStore.addExercise,

      getStats: () => gamificationStore.stats,
      fetchStats: gamificationStore.fetchStats,
      getAchievements: () => gamificationStore.achievements,
      getUnlockedAchievements: () =>
        gamificationStore.achievements.filter((a) => a.unlockedAt !== null),
      fetchAchievements: gamificationStore.fetchAchievements,

      getSettings: () => ({
        defaultSets: settingsStore.defaultSets,
        defaultRestTime: settingsStore.defaultRestTime,
        hapticEnabled: settingsStore.hapticEnabled,
        soundEnabled: settingsStore.soundEnabled,
      }),

      getScheduledWorkouts: () => scheduleStore.scheduledWorkouts,
      fetchScheduledWorkouts: scheduleStore.fetchScheduledWorkouts,
      scheduleWorkout: scheduleStore.scheduleWorkout,

      getTemplates: () => templateStore.templates,
      fetchTemplates: templateStore.fetchTemplates,
      createTemplate: templateStore.createTemplate,

      navigate: (screen: string) => {
        router.push(screen as any);
      },
    }),
    [exerciseStore, settingsStore, scheduleStore, templateStore, gamificationStore]
  );

  // Load model on focus, release on blur
  useFocusEffect(
    useCallback(() => {
      if (modelStatus.state === 'downloaded') {
        initModel();
      }

      return () => {
        releaseModel();
      };
    }, [modelStatus.state])
  );

  const isModelReady = modelStatus.state === 'ready';
  const showDownloadCard =
    modelStatus.state !== 'ready' && modelStatus.state !== 'loading';

  // --- Handlers ---

  const handleSend = useCallback(
    (text?: string) => {
      const msg = (text ?? inputText).trim();
      if (!msg || isGenerating || !isModelReady) return;

      if (hapticEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      setInputText('');
      sendUserMessage(msg, storeRefs);
    },
    [inputText, isGenerating, isModelReady, hapticEnabled, storeRefs, sendUserMessage]
  );

  const handleClear = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    clearMessages();
  }, [hapticEnabled, clearMessages]);

  const handleBack = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, [hapticEnabled]);

  // --- Render ---

  const renderMessage = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <View className="px-4 mb-2">
        <ChatBubble message={item} />
      </View>
    ),
    []
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  // Inverted FlatList needs newest-first order
  const reversedMessages = useMemo(
    () => [...messages].reverse(),
    [messages]
  );

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-setly-black"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 pb-3 border-b border-setly-border"
        style={{ paddingTop: insets.top + 12 }}
      >
        <Pressable onPress={handleBack} className="px-2 py-1 active:opacity-60">
          <Text
            className="text-setly-text text-sm tracking-wider"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            {'<'} BACK
          </Text>
        </Pressable>

        <Text
          className="text-setly-text text-sm tracking-widest"
          style={{ fontFamily: 'SpaceMono_700Bold' }}
        >
          AI ASSISTANT
        </Text>

        <Pressable onPress={handleClear} className="px-2 py-1 active:opacity-60">
          <Text
            className="text-setly-muted text-xs tracking-wider"
            style={{ fontFamily: 'SpaceMono_700Bold' }}
          >
            CLEAR
          </Text>
        </Pressable>
      </View>

      {/* Content */}
      <View className="flex-1">
        {showDownloadCard ? (
          <View className="flex-1 justify-center px-4">
            <ModelDownload />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={reversedMessages}
            renderItem={renderMessage}
            keyExtractor={keyExtractor}
            inverted
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: messages.length === 0 ? 'flex-end' : undefined,
              paddingVertical: 16,
            }}
            ListHeaderComponent={
              isGenerating ? (
                <View className="px-4 mb-2">
                  <ChatBubble.Loading />
                </View>
              ) : null
            }
            ListFooterComponent={
              messages.length === 0 ? (
                <View className="px-4 pb-4">
                  <Text
                    className="text-setly-muted text-xs tracking-wider text-center mb-6"
                    style={{ fontFamily: 'SpaceMono_400Regular' }}
                  >
                    COME POSSO AIUTARTI?
                  </Text>
                  <View className="flex-row flex-wrap justify-center gap-2">
                    {QUICK_ACTIONS.map((action) => (
                      <Pressable
                        key={action}
                        onPress={() => handleSend(action)}
                        className="border border-setly-border px-3 py-2 active:bg-white/5"
                      >
                        <Text
                          className="text-setly-text text-xs tracking-wider"
                          style={{ fontFamily: 'SpaceMono_400Regular' }}
                        >
                          {action}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null
            }
          />
        )}
      </View>

      {/* Input bar */}
      {isModelReady && (
        <View
          className="flex-row items-end px-4 pt-3 border-t border-setly-border"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <TextInput
            className="flex-1 border border-setly-border bg-setly-gray px-4 py-3 text-setly-text text-sm mr-3"
            style={{ fontFamily: 'SpaceMono_400Regular' }}
            placeholder="Scrivi un messaggio..."
            placeholderTextColor="#666"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isGenerating}
            onSubmitEditing={() => handleSend()}
            blurOnSubmit
          />
          <Pressable
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isGenerating}
            className={`border px-4 py-3 items-center justify-center ${
              inputText.trim() && !isGenerating
                ? 'border-setly-accent bg-setly-accent/10 active:bg-setly-accent/20'
                : 'border-setly-border bg-setly-gray opacity-40'
            }`}
          >
            <Text
              className={`text-sm tracking-wider ${
                inputText.trim() && !isGenerating
                  ? 'text-setly-accent'
                  : 'text-setly-muted'
              }`}
              style={{ fontFamily: 'SpaceMono_700Bold' }}
            >
              SEND
            </Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

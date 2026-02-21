import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage } from '@/lib/llm/systemPrompt';
import type { ModelStatus, ModelState } from '@/lib/llm/modelManager';
import { modelManager } from '@/lib/llm/modelManager';
import { sendMessage } from '@/lib/llm/chatService';
import type { StoreRefs } from '@/lib/llm/toolExecutor';

// --- Types ---

interface ChatState {
  messages: ChatMessage[];
  isGenerating: boolean;
  modelStatus: ModelStatus;

  // Actions — messages
  sendUserMessage: (text: string, storeRefs: StoreRefs) => Promise<void>;
  clearMessages: () => void;

  // Actions — model lifecycle
  downloadModel: () => Promise<void>;
  cancelDownload: () => Promise<void>;
  initModel: () => Promise<void>;
  releaseModel: () => Promise<void>;
  deleteModel: () => Promise<void>;
  syncModelStatus: () => void;
}

// --- Persisted state (only modelStatus.state) ---

interface PersistedChatState {
  _modelState: ModelState;
}

// --- ID generator ---

let idCounter = 0;

function generateId(): string {
  return `msg_${Date.now()}_${++idCounter}`;
}

// --- Store ---

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isGenerating: false,
      modelStatus: modelManager.getStatus(),

      // --- Message actions ---

      sendUserMessage: async (text: string, storeRefs: StoreRefs) => {
        const trimmed = text.trim();
        if (!trimmed || get().isGenerating) return;

        const userMessage: ChatMessage = {
          id: generateId(),
          role: 'user',
          content: trimmed,
          timestamp: Date.now(),
        };

        set((state) => ({
          messages: [...state.messages, userMessage],
          isGenerating: true,
        }));

        try {
          const { response, updatedHistory } = await sendMessage(
            trimmed,
            get().messages,
            storeRefs
          );

          // Add tool result messages if any tool calls were made
          const toolMessages: ChatMessage[] = response.toolCalls.map((tc) => ({
            id: generateId(),
            role: 'tool' as const,
            content: JSON.stringify(tc.result),
            toolResult: tc.result,
            timestamp: Date.now(),
          }));

          // Add assistant response
          const assistantMessage: ChatMessage = {
            id: generateId(),
            role: 'assistant',
            content: response.text,
            timestamp: Date.now(),
          };

          set({
            messages: [...get().messages, ...toolMessages, assistantMessage],
            isGenerating: false,
          });
        } catch (error) {
          const errorText =
            error instanceof Error ? error.message : 'Errore sconosciuto';

          const errorMessage: ChatMessage = {
            id: generateId(),
            role: 'assistant',
            content: `Mi dispiace, si è verificato un errore: ${errorText}`,
            timestamp: Date.now(),
          };

          set((state) => ({
            messages: [...state.messages, errorMessage],
            isGenerating: false,
          }));
        }
      },

      clearMessages: () => set({ messages: [] }),

      // --- Model lifecycle actions ---

      downloadModel: async () => {
        await modelManager.download();
      },

      cancelDownload: async () => {
        await modelManager.cancelDownload();
      },

      initModel: async () => {
        await modelManager.initContext();
      },

      releaseModel: async () => {
        await modelManager.releaseContext();
      },

      deleteModel: async () => {
        await modelManager.deleteModel();
      },

      syncModelStatus: () => {
        set({ modelStatus: modelManager.getStatus() });
      },
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state): PersistedChatState => ({
        _modelState: state.modelStatus.state,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        // On rehydrate, check actual model file on disk.
        // If persisted state says 'downloaded' or 'ready', verify the file exists.
        const persisted = (state as unknown as PersistedChatState)._modelState;
        if (persisted === 'downloaded' || persisted === 'ready') {
          modelManager.checkModelExists();
        }
        state.modelStatus = modelManager.getStatus();

        // Subscribe to modelManager status changes
        modelManager.subscribe((status) => {
          useChatStore.setState({ modelStatus: status });
        });
      },
    }
  )
);

// Subscribe immediately (covers non-persisted cold start)
modelManager.subscribe((status) => {
  useChatStore.setState({ modelStatus: status });
});

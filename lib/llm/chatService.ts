/**
 * Chat Service for SETLY AI Assistant
 *
 * Orchestrates the full chat loop:
 * 1. Build prompt from history + system prompt
 * 2. Run context.completion()
 * 3. Parse response (tool call or text)
 * 4. If tool call → execute tool → append result → re-prompt for NL response
 * 5. Max 3 tool calls per turn, history limited to 10 messages
 */

import { buildConversationPrompt, type ChatMessage } from './systemPrompt';
import { parseResponse } from './responseParser';
import { executeTool, type StoreRefs } from './toolExecutor';
import { modelManager } from './modelManager';
import type { LlamaContext } from 'llama.rn';

// --- Constants ---

const MAX_TOOL_CALLS_PER_TURN = 3;
const MAX_HISTORY_MESSAGES = 10;

// --- Completion parameters (tuned for function calling model) ---

const COMPLETION_PARAMS = {
  n_predict: 512,
  temperature: 0.7,
  top_p: 0.9,
  top_k: 40,
  stop: ['<end_of_turn>', '<start_of_turn>'] as string[],
} as const;

// --- Types ---

export interface ChatServiceResponse {
  /** Final natural language text to show the user */
  text: string;
  /** Tool calls that were executed during this turn */
  toolCalls: {
    name: string;
    arguments: Record<string, unknown>;
    result: { success: boolean; data?: unknown; error?: string };
  }[];
}

// --- ID generator ---

let messageIdCounter = 0;

function generateMessageId(): string {
  return `msg_${Date.now()}_${++messageIdCounter}`;
}

// --- Chat Service ---

/**
 * Sends a user message and runs the full completion loop.
 *
 * @param userMessage - The user's text input
 * @param history - Current chat history (will be trimmed to last 10 messages)
 * @param storeRefs - Injected store references for tool execution
 * @returns The assistant's response with any tool calls that were made
 */
export async function sendMessage(
  userMessage: string,
  history: ChatMessage[],
  storeRefs: StoreRefs
): Promise<{ response: ChatServiceResponse; updatedHistory: ChatMessage[] }> {
  const context = modelManager.getContext();
  if (!context) {
    throw new Error('Modello non caricato. Scarica e inizializza il modello prima di usare la chat.');
  }

  // Clone history and trim to limit
  const workingHistory = trimHistory([...history]);

  // Add user message
  const userMsg: ChatMessage = {
    id: generateMessageId(),
    role: 'user',
    content: userMessage,
    timestamp: Date.now(),
  };
  workingHistory.push(userMsg);

  const toolCalls: ChatServiceResponse['toolCalls'] = [];

  // Completion loop: run model → if tool call, execute and re-prompt
  for (let i = 0; i < MAX_TOOL_CALLS_PER_TURN + 1; i++) {
    const prompt = buildConversationPrompt(trimHistory(workingHistory));
    const rawOutput = await runCompletion(context, prompt);
    const parsed = parseResponse(rawOutput);

    if (parsed.type === 'text') {
      // Final text response — done
      const assistantMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: parsed.text || 'Non ho capito, puoi ripetere?',
        timestamp: Date.now(),
      };
      workingHistory.push(assistantMsg);

      return {
        response: { text: assistantMsg.content, toolCalls },
        updatedHistory: trimHistory(workingHistory),
      };
    }

    if (parsed.type === 'error') {
      // Parse error — return error message to user
      console.warn('[chatService] parse error:', parsed.error);
      const errorMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: 'Mi dispiace, ho avuto un problema. Puoi riprovare?',
        timestamp: Date.now(),
      };
      workingHistory.push(errorMsg);

      return {
        response: { text: errorMsg.content, toolCalls },
        updatedHistory: trimHistory(workingHistory),
      };
    }

    // Tool call — execute if within limit
    if (i >= MAX_TOOL_CALLS_PER_TURN) {
      // Exceeded tool call limit — force a text response
      const limitMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: 'Ho raccolto tutte le informazioni necessarie, ma non riesco a formulare una risposta. Puoi riprovare con una domanda diversa?',
        timestamp: Date.now(),
      };
      workingHistory.push(limitMsg);

      return {
        response: { text: limitMsg.content, toolCalls },
        updatedHistory: trimHistory(workingHistory),
      };
    }

    const { toolCall } = parsed;

    // Add assistant message with tool call
    const assistantToolMsg: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: '',
      toolCall: {
        name: toolCall.name,
        arguments: toolCall.arguments as Record<string, unknown>,
      },
      timestamp: Date.now(),
    };
    workingHistory.push(assistantToolMsg);

    // Execute tool
    const toolResult = await executeTool(toolCall, storeRefs);

    toolCalls.push({
      name: toolCall.name,
      arguments: toolCall.arguments as Record<string, unknown>,
      result: toolResult,
    });

    // Add tool result message
    const toolResultMsg: ChatMessage = {
      id: generateMessageId(),
      role: 'tool',
      content: JSON.stringify(toolResult),
      toolResult: {
        success: toolResult.success,
        data: toolResult.data,
        error: toolResult.error,
      },
      timestamp: Date.now(),
    };
    workingHistory.push(toolResultMsg);

    // Loop continues — model will see tool result and generate next response
  }

  // Should not reach here, but just in case
  return {
    response: { text: 'Errore imprevisto. Riprova.', toolCalls },
    updatedHistory: trimHistory(workingHistory),
  };
}

// --- Helpers ---

/**
 * Trims history to the last MAX_HISTORY_MESSAGES messages.
 * Preserves message order (oldest first).
 */
function trimHistory(history: ChatMessage[]): ChatMessage[] {
  if (history.length <= MAX_HISTORY_MESSAGES) return history;
  return history.slice(-MAX_HISTORY_MESSAGES);
}

/**
 * Runs a single completion against the LlamaContext.
 */
async function runCompletion(
  context: LlamaContext,
  prompt: string
): Promise<string> {
  const result = await context.completion(
    { prompt, ...COMPLETION_PARAMS },
    (data: { token: string }) => {
      // Streaming callback — unused for now, but available for future streaming UI
    }
  );

  return result.text ?? '';
}

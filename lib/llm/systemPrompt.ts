/**
 * System Prompt Builder for SETLY AI Assistant
 *
 * Builds the system prompt in FunctionGemma format:
 * - <start_of_turn>user / <start_of_turn>model turn markers
 * - Tool schemas as JSON function declarations
 * - [FUNC_CALL] {"name":..., "arguments":...} for tool invocations
 * - SETLY AI persona in italiano
 */

import { toolDefinitions, type ToolDefinition } from './tools';

// --- Chat message types (used by chatService and chatStore) ---

export type MessageRole = 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  toolCall?: {
    name: string;
    arguments: Record<string, unknown>;
  };
  toolResult?: {
    success: boolean;
    data?: unknown;
    error?: string;
  };
  timestamp: number;
}

// --- FunctionGemma format constants ---

const TURN_START = '<start_of_turn>';
const TURN_END = '<end_of_turn>';

// --- Persona & instructions ---

const PERSONA = `Sei SETLY AI, l'assistente intelligente integrato nell'app SETLY di workout tracking.

COMPORTAMENTO:
- Rispondi SEMPRE in italiano
- Sii conciso e diretto, usa un tono motivante ma non eccessivo
- Usa i tool disponibili per accedere ai dati reali dell'utente prima di rispondere
- Se l'utente chiede dati (statistiche, esercizi, PR), chiama SEMPRE il tool appropriato invece di inventare dati
- Puoi chiamare fino a 3 tool per turno se necessario
- Dopo aver ricevuto il risultato di un tool, formula una risposta naturale basata sui dati

CAPACITA':
- Consultare esercizi, statistiche, storico allenamenti, PR, achievement
- Calcolare 1RM, dischi bilanciere, tabelle percentuali, tempi di riposo
- Aggiungere esercizi personalizzati
- Programmare allenamenti futuri
- Creare template di allenamento
- Navigare tra le schermate dell'app

FORMATO RISPOSTA:
- Per chiamare un tool, rispondi SOLO con: [FUNC_CALL] {"name": "tool_name", "arguments": {...}}
- Non aggiungere testo prima o dopo [FUNC_CALL]
- Se non serve nessun tool, rispondi con testo libero in italiano
- Non inventare mai dati: se non hai informazioni, chiedi all'utente o usa un tool`;

// --- Build tool schema string ---

function formatToolSchema(tool: ToolDefinition): string {
  return JSON.stringify(
    {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
    null,
    2
  );
}

function buildToolSchemas(): string {
  return toolDefinitions.map(formatToolSchema).join('\n\n');
}

// --- System prompt builder ---

/**
 * Builds the full system prompt with tool definitions in FunctionGemma format.
 * This is placed at the start of the conversation as the first "user" turn
 * containing instructions and available tools.
 */
export function buildSystemPrompt(): string {
  const toolSchemas = buildToolSchemas();

  return [
    `${TURN_START}user`,
    `${PERSONA}`,
    '',
    'HAI ACCESSO ALLE SEGUENTI FUNZIONI:',
    '',
    toolSchemas,
    '',
    'Per chiamare una funzione, rispondi ESCLUSIVAMENTE con:',
    '[FUNC_CALL] {"name": "nome_funzione", "arguments": {...}}',
    '',
    'Se non serve chiamare una funzione, rispondi normalmente in italiano.',
    TURN_END,
  ].join('\n');
}

// --- Conversation prompt builder ---

/**
 * Builds the full prompt from system prompt + chat history.
 * Formats each message according to FunctionGemma turn structure.
 *
 * @param history - Array of chat messages (limited to last N by chatService)
 * @returns Complete prompt string ready for model completion
 */
export function buildConversationPrompt(history: ChatMessage[]): string {
  const parts: string[] = [buildSystemPrompt()];

  for (const message of history) {
    switch (message.role) {
      case 'user':
        parts.push(`${TURN_START}user\n${message.content}\n${TURN_END}`);
        break;

      case 'assistant':
        if (message.toolCall) {
          // Assistant decided to call a tool
          const funcCall = JSON.stringify({
            name: message.toolCall.name,
            arguments: message.toolCall.arguments,
          });
          parts.push(
            `${TURN_START}model\n[FUNC_CALL] ${funcCall}\n${TURN_END}`
          );
        } else {
          // Assistant replied with text
          parts.push(`${TURN_START}model\n${message.content}\n${TURN_END}`);
        }
        break;

      case 'tool':
        // Tool result injected as a user turn (FunctionGemma convention)
        if (message.toolResult) {
          const resultStr = JSON.stringify(message.toolResult);
          parts.push(
            `${TURN_START}user\n[FUNC_RESULT] ${resultStr}\n${TURN_END}`
          );
        }
        break;
    }
  }

  // Open model turn for the next completion
  parts.push(`${TURN_START}model`);

  return parts.join('\n');
}

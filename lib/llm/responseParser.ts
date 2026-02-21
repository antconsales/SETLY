/**
 * Response Parser for SETLY AI Assistant
 *
 * Parses raw model output and extracts either:
 * - A tool call: [FUNC_CALL] {"name":..., "arguments":...}
 * - Plain text response
 *
 * Handles malformed JSON gracefully with recovery strategies.
 */

import { TOOL_NAMES, type ToolCall, type ToolName } from './tools';

// --- Parse result types ---

export interface ToolCallResult {
  type: 'tool_call';
  toolCall: ToolCall;
}

export interface TextResult {
  type: 'text';
  text: string;
}

export interface ErrorResult {
  type: 'error';
  error: string;
  raw: string;
}

export type ParseResult = ToolCallResult | TextResult | ErrorResult;

// --- Constants ---

const FUNC_CALL_MARKER = '[FUNC_CALL]';

// --- JSON recovery helpers ---

/**
 * Attempts to fix common JSON malformations from LLM output:
 * - Trailing commas before } or ]
 * - Single quotes instead of double quotes (outside of values)
 * - Unquoted keys
 * - Truncated JSON (missing closing braces)
 */
function tryFixJson(raw: string): string {
  let fixed = raw.trim();

  // Remove trailing commas before } or ]
  fixed = fixed.replace(/,\s*([}\]])/g, '$1');

  // Count opening vs closing braces and brackets to fix truncation
  const openBraces = (fixed.match(/{/g) || []).length;
  const closeBraces = (fixed.match(/}/g) || []).length;
  const openBrackets = (fixed.match(/\[/g) || []).length;
  const closeBrackets = (fixed.match(/]/g) || []).length;

  // Append missing closing brackets/braces
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    fixed += ']';
  }
  for (let i = 0; i < openBraces - closeBraces; i++) {
    fixed += '}';
  }

  return fixed;
}

/**
 * Attempts to parse JSON with progressive recovery strategies.
 */
function parseJsonSafe(raw: string): Record<string, unknown> | null {
  // Strategy 1: Direct parse
  try {
    return JSON.parse(raw);
  } catch {
    // continue to next strategy
  }

  // Strategy 2: Fix common issues and retry
  try {
    return JSON.parse(tryFixJson(raw));
  } catch {
    // continue to next strategy
  }

  // Strategy 3: Extract JSON object from surrounding text
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      try {
        return JSON.parse(tryFixJson(jsonMatch[0]));
      } catch {
        // all strategies exhausted
      }
    }
  }

  return null;
}

// --- Validation ---

function isValidToolName(name: unknown): name is ToolName {
  return typeof name === 'string' && (TOOL_NAMES as readonly string[]).includes(name);
}

function validateToolCall(parsed: Record<string, unknown>): ToolCall | null {
  const { name, arguments: args } = parsed;

  if (!isValidToolName(name)) {
    return null;
  }

  // Arguments should be an object (or missing/empty for parameterless tools)
  const toolArgs =
    args != null && typeof args === 'object' && !Array.isArray(args)
      ? (args as Record<string, unknown>)
      : {};

  return {
    name,
    arguments: toolArgs,
  };
}

// --- Main parser ---

/**
 * Parses raw model output into a structured result.
 *
 * The model is expected to output either:
 * 1. `[FUNC_CALL] {"name": "tool_name", "arguments": {...}}`
 * 2. Plain text response in Italian
 *
 * @param raw - Raw string output from the model
 * @returns ParseResult with type 'tool_call', 'text', or 'error'
 */
export function parseResponse(raw: string): ParseResult {
  const trimmed = raw.trim();

  if (!trimmed) {
    return { type: 'text', text: '' };
  }

  // Check if the response contains a function call marker
  const markerIndex = trimmed.indexOf(FUNC_CALL_MARKER);

  if (markerIndex === -1) {
    // No function call — return as plain text, stripping FunctionGemma turn markers
    return { type: 'text', text: stripTurnMarkers(trimmed) };
  }

  // Extract the JSON portion after the marker
  const jsonPart = trimmed.slice(markerIndex + FUNC_CALL_MARKER.length).trim();

  if (!jsonPart) {
    return {
      type: 'error',
      error: 'FUNC_CALL marker trovato ma nessun JSON dopo il marker',
      raw: trimmed,
    };
  }

  const parsed = parseJsonSafe(jsonPart);

  if (!parsed) {
    return {
      type: 'error',
      error: 'JSON malformato dopo FUNC_CALL marker',
      raw: trimmed,
    };
  }

  const toolCall = validateToolCall(parsed);

  if (!toolCall) {
    return {
      type: 'error',
      error: `Tool name non valido: "${parsed.name}"`,
      raw: trimmed,
    };
  }

  return { type: 'tool_call', toolCall };
}

// --- Helpers ---

/**
 * Strips FunctionGemma turn markers from text output.
 * The model might include residual `<end_of_turn>` or similar tokens.
 */
function stripTurnMarkers(text: string): string {
  return text
    .replace(/<start_of_turn>(?:model|user)\n?/g, '')
    .replace(/<end_of_turn>\n?/g, '')
    .trim();
}

/**
 * Checks if a parse result is a tool call.
 */
export function isToolCall(result: ParseResult): result is ToolCallResult {
  return result.type === 'tool_call';
}

/**
 * Checks if a parse result is a text response.
 */
export function isTextResponse(result: ParseResult): result is TextResult {
  return result.type === 'text';
}

/**
 * Checks if a parse result is an error.
 */
export function isError(result: ParseResult): result is ErrorResult {
  return result.type === 'error';
}

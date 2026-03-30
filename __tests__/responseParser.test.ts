import { parseResponse, isToolCall, isTextResponse, isError } from '../lib/llm/responseParser';

// Mock the tools module to provide TOOL_NAMES
jest.mock('../lib/llm/tools', () => ({
  TOOL_NAMES: [
    'get_exercises',
    'get_stats',
    'get_workout_history',
    'get_personal_records',
    'get_weekly_stats',
    'get_exercise_progress',
    'get_scheduled_workouts',
    'get_templates',
    'get_achievements',
    'get_settings',
    'calculate_1rm',
    'calculate_plates',
    'get_percentage_breakdown',
    'get_rest_recommendation',
    'add_exercise',
    'schedule_workout',
    'create_template',
    'navigate',
  ] as const,
}));

describe('parseResponse', () => {
  describe('plain text responses', () => {
    it('returns text for plain string', () => {
      const result = parseResponse('Ciao! Come posso aiutarti?');
      expect(result.type).toBe('text');
      if (isTextResponse(result)) {
        expect(result.text).toBe('Ciao! Come posso aiutarti?');
      }
    });

    it('returns empty text for empty string', () => {
      const result = parseResponse('');
      expect(result.type).toBe('text');
      if (isTextResponse(result)) {
        expect(result.text).toBe('');
      }
    });

    it('strips FunctionGemma turn markers', () => {
      const result = parseResponse(
        '<start_of_turn>model\nEcco i tuoi esercizi<end_of_turn>'
      );
      expect(result.type).toBe('text');
      if (isTextResponse(result)) {
        expect(result.text).toBe('Ecco i tuoi esercizi');
      }
    });
  });

  describe('tool call responses', () => {
    it('parses valid tool call', () => {
      const raw = '[FUNC_CALL] {"name": "get_exercises", "arguments": {}}';
      const result = parseResponse(raw);
      expect(result.type).toBe('tool_call');
      if (isToolCall(result)) {
        expect(result.toolCall.name).toBe('get_exercises');
        expect(result.toolCall.arguments).toEqual({});
      }
    });

    it('parses tool call with arguments', () => {
      const raw =
        '[FUNC_CALL] {"name": "calculate_1rm", "arguments": {"weight": 100, "reps": 5}}';
      const result = parseResponse(raw);
      expect(result.type).toBe('tool_call');
      if (isToolCall(result)) {
        expect(result.toolCall.name).toBe('calculate_1rm');
        expect(result.toolCall.arguments).toEqual({ weight: 100, reps: 5 });
      }
    });

    it('handles text before FUNC_CALL marker', () => {
      const raw =
        'Let me check that for you.\n[FUNC_CALL] {"name": "get_stats", "arguments": {}}';
      const result = parseResponse(raw);
      expect(result.type).toBe('tool_call');
      if (isToolCall(result)) {
        expect(result.toolCall.name).toBe('get_stats');
      }
    });
  });

  describe('JSON recovery', () => {
    it('fixes trailing commas', () => {
      const raw = '[FUNC_CALL] {"name": "get_exercises", "arguments": {},}';
      const result = parseResponse(raw);
      expect(result.type).toBe('tool_call');
    });

    it('fixes missing closing braces (truncated output)', () => {
      const raw =
        '[FUNC_CALL] {"name": "calculate_1rm", "arguments": {"weight": 100, "reps": 5}';
      const result = parseResponse(raw);
      expect(result.type).toBe('tool_call');
      if (isToolCall(result)) {
        expect(result.toolCall.name).toBe('calculate_1rm');
      }
    });

    it('extracts JSON from surrounding text', () => {
      const raw =
        '[FUNC_CALL] Sure! {"name": "get_exercises", "arguments": {}} here you go';
      const result = parseResponse(raw);
      expect(result.type).toBe('tool_call');
    });
  });

  describe('error handling', () => {
    it('returns error for invalid tool name', () => {
      const raw = '[FUNC_CALL] {"name": "invalid_tool", "arguments": {}}';
      const result = parseResponse(raw);
      expect(result.type).toBe('error');
      if (isError(result)) {
        expect(result.error).toContain('Tool name non valido');
      }
    });

    it('returns error for FUNC_CALL with no JSON', () => {
      const raw = '[FUNC_CALL]';
      const result = parseResponse(raw);
      expect(result.type).toBe('error');
    });

    it('returns error for completely broken JSON', () => {
      const raw = '[FUNC_CALL] this is not json at all !@#$';
      const result = parseResponse(raw);
      expect(result.type).toBe('error');
    });
  });

  describe('type guards', () => {
    it('isToolCall works correctly', () => {
      const result = parseResponse(
        '[FUNC_CALL] {"name": "get_exercises", "arguments": {}}'
      );
      expect(isToolCall(result)).toBe(true);
      expect(isTextResponse(result)).toBe(false);
      expect(isError(result)).toBe(false);
    });

    it('isTextResponse works correctly', () => {
      const result = parseResponse('Hello');
      expect(isToolCall(result)).toBe(false);
      expect(isTextResponse(result)).toBe(true);
      expect(isError(result)).toBe(false);
    });
  });
});

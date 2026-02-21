/**
 * LLM Tool Definitions for SETLY AI Assistant
 *
 * 18 tool definitions that map to store actions, calculations, and navigation.
 * Used by systemPrompt.ts to build the FunctionGemma tool schema
 * and by toolExecutor.ts to dispatch calls.
 */

// --- Parameter types for each tool ---

export interface GetExercisesParams {
  category?: string; // 'push' | 'pull' | 'legs' | 'core' | 'cardio'
}

export interface GetStatsParams {}

export interface GetWorkoutHistoryParams {
  exerciseId?: number;
  days?: number; // how many days back, default 30
}

export interface GetPersonalRecordsParams {
  exerciseId?: number; // if omitted, returns all PRs
}

export interface GetWeeklyStatsParams {
  weeks?: number; // how many weeks back, default 8
}

export interface GetExerciseProgressParams {
  exerciseId: number;
}

export interface GetScheduledWorkoutsParams {
  startDate?: string; // ISO date string
  endDate?: string;   // ISO date string
}

export interface GetTemplatesParams {}

export interface GetAchievementsParams {
  unlockedOnly?: boolean;
}

export interface GetSettingsParams {}

export interface Calculate1RMParams {
  weight: number; // kg
  reps: number;
}

export interface CalculatePlatesParams {
  targetWeight: number;  // kg
  barbellWeight?: number; // kg, default 20
}

export interface GetPercentageBreakdownParams {
  oneRepMax: number; // kg
}

export interface GetRestRecommendationParams {
  exerciseName: string;
  intensity?: 'light' | 'moderate' | 'heavy';
}

export interface AddExerciseParams {
  name: string;
  category?: string; // 'push' | 'pull' | 'legs' | 'core' | 'cardio'
}

export interface ScheduleWorkoutParams {
  exerciseId: number;
  scheduledFor: string; // ISO date string
  plannedSets?: number;
}

export interface CreateTemplateParams {
  name: string;
  description: string;
  exercises: {
    exerciseId: number;
    targetSets?: number;
    targetReps?: number;
    targetWeight?: number;
  }[];
}

export interface NavigateParams {
  screen: string; // route path e.g. '/workout/select', '/stats', '/ai/chat'
}

// --- Tool parameter union ---

export type ToolParams =
  | GetExercisesParams
  | GetStatsParams
  | GetWorkoutHistoryParams
  | GetPersonalRecordsParams
  | GetWeeklyStatsParams
  | GetExerciseProgressParams
  | GetScheduledWorkoutsParams
  | GetTemplatesParams
  | GetAchievementsParams
  | GetSettingsParams
  | Calculate1RMParams
  | CalculatePlatesParams
  | GetPercentageBreakdownParams
  | GetRestRecommendationParams
  | AddExerciseParams
  | ScheduleWorkoutParams
  | CreateTemplateParams
  | NavigateParams;

// --- Tool names ---

export const TOOL_NAMES = [
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
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

// --- Tool call type (parsed from model output) ---

export interface ToolCall {
  name: ToolName;
  arguments: ToolParams;
}

// --- Tool result type ---

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// --- JSON Schema parameter definition ---

interface ParamProperty {
  type: string;
  description: string;
  enum?: string[];
  items?: { type: string; properties?: Record<string, ParamProperty>; required?: string[] };
  default?: unknown;
}

interface ToolParametersSchema {
  type: 'object';
  properties: Record<string, ParamProperty>;
  required: string[];
}

// --- Tool definition ---

export interface ToolDefinition {
  name: ToolName;
  description: string;
  parameters: ToolParametersSchema;
}

// --- All 18 tool definitions ---

export const toolDefinitions: ToolDefinition[] = [
  // === DATA RETRIEVAL (10) ===
  {
    name: 'get_exercises',
    description: 'Ottieni la lista degli esercizi disponibili, opzionalmente filtrati per categoria',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Categoria esercizio',
          enum: ['push', 'pull', 'legs', 'core', 'cardio'],
        },
      },
      required: [],
    },
  },
  {
    name: 'get_stats',
    description: 'Ottieni le statistiche generali: streak, livello, XP, workout totali, volume totale',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_workout_history',
    description: 'Ottieni lo storico degli allenamenti recenti con dettagli (esercizio, serie, durata)',
    parameters: {
      type: 'object',
      properties: {
        exerciseId: {
          type: 'number',
          description: 'ID esercizio per filtrare (opzionale)',
        },
        days: {
          type: 'number',
          description: 'Quanti giorni indietro cercare (default 30)',
          default: 30,
        },
      },
      required: [],
    },
  },
  {
    name: 'get_personal_records',
    description: 'Ottieni i personal record (PR) per peso massimo e volume massimo, per tutti gli esercizi o uno specifico',
    parameters: {
      type: 'object',
      properties: {
        exerciseId: {
          type: 'number',
          description: 'ID esercizio specifico (opzionale, se omesso ritorna tutti i PR)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_weekly_stats',
    description: 'Ottieni le statistiche settimanali: workout, volume, serie e ripetizioni per settimana',
    parameters: {
      type: 'object',
      properties: {
        weeks: {
          type: 'number',
          description: 'Quante settimane indietro (default 8)',
          default: 8,
        },
      },
      required: [],
    },
  },
  {
    name: 'get_exercise_progress',
    description: 'Ottieni il progresso nel tempo per un esercizio specifico (peso max e volume per sessione)',
    parameters: {
      type: 'object',
      properties: {
        exerciseId: {
          type: 'number',
          description: 'ID dell\'esercizio',
        },
      },
      required: ['exerciseId'],
    },
  },
  {
    name: 'get_scheduled_workouts',
    description: 'Ottieni gli allenamenti programmati, opzionalmente filtrati per intervallo di date',
    parameters: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'Data inizio filtro in formato ISO (es. 2026-02-01)',
        },
        endDate: {
          type: 'string',
          description: 'Data fine filtro in formato ISO (es. 2026-02-28)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_templates',
    description: 'Ottieni tutti i template di allenamento con i relativi esercizi',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_achievements',
    description: 'Ottieni la lista degli achievement con stato di sblocco',
    parameters: {
      type: 'object',
      properties: {
        unlockedOnly: {
          type: 'boolean',
          description: 'Se true, ritorna solo gli achievement sbloccati',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_settings',
    description: 'Ottieni le impostazioni utente correnti (set default, tempo riposo, haptic, suono)',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },

  // === CALCULATIONS (4) ===
  {
    name: 'calculate_1rm',
    description: 'Calcola il massimale (1RM) stimato dato un peso e un numero di ripetizioni. Usa la media di Epley, Brzycki e Lander',
    parameters: {
      type: 'object',
      properties: {
        weight: {
          type: 'number',
          description: 'Peso sollevato in kg',
        },
        reps: {
          type: 'number',
          description: 'Numero di ripetizioni eseguite',
        },
      },
      required: ['weight', 'reps'],
    },
  },
  {
    name: 'calculate_plates',
    description: 'Calcola i dischi da caricare su ogni lato del bilanciere per raggiungere un peso target',
    parameters: {
      type: 'object',
      properties: {
        targetWeight: {
          type: 'number',
          description: 'Peso totale obiettivo in kg (bilanciere incluso)',
        },
        barbellWeight: {
          type: 'number',
          description: 'Peso del bilanciere in kg (default 20)',
          default: 20,
        },
      },
      required: ['targetWeight'],
    },
  },
  {
    name: 'get_percentage_breakdown',
    description: 'Dato un 1RM, calcola la tabella percentuali (100%-60%) con peso e ripetizioni consigliate',
    parameters: {
      type: 'object',
      properties: {
        oneRepMax: {
          type: 'number',
          description: 'Massimale (1RM) in kg',
        },
      },
      required: ['oneRepMax'],
    },
  },
  {
    name: 'get_rest_recommendation',
    description: 'Ottieni il tempo di riposo consigliato per un esercizio in base al tipo e all\'intensita\'',
    parameters: {
      type: 'object',
      properties: {
        exerciseName: {
          type: 'string',
          description: 'Nome dell\'esercizio',
        },
        intensity: {
          type: 'string',
          description: 'Intensita\' dell\'allenamento',
          enum: ['light', 'moderate', 'heavy'],
        },
      },
      required: ['exerciseName'],
    },
  },

  // === ACTIONS (3) ===
  {
    name: 'add_exercise',
    description: 'Aggiungi un nuovo esercizio personalizzato alla lista',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nome dell\'esercizio',
        },
        category: {
          type: 'string',
          description: 'Categoria dell\'esercizio',
          enum: ['push', 'pull', 'legs', 'core', 'cardio'],
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'schedule_workout',
    description: 'Programma un allenamento per una data e ora specifica',
    parameters: {
      type: 'object',
      properties: {
        exerciseId: {
          type: 'number',
          description: 'ID dell\'esercizio da programmare',
        },
        scheduledFor: {
          type: 'string',
          description: 'Data e ora in formato ISO (es. 2026-02-22T10:00:00)',
        },
        plannedSets: {
          type: 'number',
          description: 'Numero di serie pianificate (opzionale)',
        },
      },
      required: ['exerciseId', 'scheduledFor'],
    },
  },
  {
    name: 'create_template',
    description: 'Crea un nuovo template di allenamento con una lista di esercizi',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Nome del template',
        },
        description: {
          type: 'string',
          description: 'Descrizione del template',
        },
        exercises: {
          type: 'array',
          description: 'Lista esercizi del template',
          items: {
            type: 'object',
            properties: {
              exerciseId: {
                type: 'number',
                description: 'ID dell\'esercizio',
              },
              targetSets: {
                type: 'number',
                description: 'Serie target (default 4)',
              },
              targetReps: {
                type: 'number',
                description: 'Ripetizioni target',
              },
              targetWeight: {
                type: 'number',
                description: 'Peso target in kg',
              },
            },
            required: ['exerciseId'],
          },
        },
      },
      required: ['name', 'description', 'exercises'],
    },
  },

  // === NAVIGATION (1) ===
  {
    name: 'navigate',
    description: 'Naviga a una schermata specifica dell\'app',
    parameters: {
      type: 'object',
      properties: {
        screen: {
          type: 'string',
          description: 'Percorso della schermata (es. /workout/select, /stats, /calendar, /settings, /tools/calculator, /templates)',
        },
      },
      required: ['screen'],
    },
  },
];

// --- Lookup helper ---

export function getToolDefinition(name: ToolName): ToolDefinition | undefined {
  return toolDefinitions.find((t) => t.name === name);
}

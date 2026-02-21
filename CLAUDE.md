# SETLY

App di workout tracking per iOS/Android, 100% offline-first. React Native + Expo + SQLite.

## Working With Claude

- **Branch**: `feat/ai-assistant`
- **Commit prefix**: `[ai]`
- **Language**: TypeScript
- **UI language**: Italiano

## Conventions

- Naming: camelCase per variabili, PascalCase per tipi e componenti
- Imports: alias `@/` per root (es. `@/stores`, `@/hooks`, `@/lib`)
- Tipi condivisi: `types/index.ts` e re-export da `db/schema.ts`
- Store: Zustand con barrel export da `stores/index.ts`
- Hooks: barrel export da `hooks/index.ts`
- Componenti UI: barrel export da `components/ui/index.ts`
- Styling: NativeWind (Tailwind) con classi `setly-*` definite in `tailwind.config.js`
- Colori: black #0A0A0A, dark #121212, gray #1A1A1A, border #2A2A2A, text #E5E5E5, muted #666, accent #4ADE80
- Font: SpaceMono_400Regular (regular), SpaceMono_700Bold (bold)
- Stile UI: brutalist/angolare, no border-radius, tracking-wider su header
- Haptics: usare `expo-haptics` rispettando `useSettingsStore().hapticEnabled`
- Route: Expo Router file-based in `app/`

## Roadmap

### Phase 1 - LLM Foundation (engine, nessuna UI)
- [x] Creare `lib/llm/tools.ts` — Definire le 18 tool definitions (get_exercises, get_stats, calculate_1rm, add_exercise, schedule_workout, navigate, ecc.) con tipi TypeScript
- [x] Creare `lib/llm/systemPrompt.ts` — Costruire il system prompt builder nel formato FunctionGemma (`<start_of_turn>`, tool schemas, persona SETLY AI in italiano)
- [x] Creare `lib/llm/responseParser.ts` — Parser per output modello: estrae `[FUNC_CALL] {"name":..., "arguments":...}` o testo libero, gestisce JSON malformato
- [x] Creare `lib/llm/modelManager.ts` — Download GGUF con progress via `expo-file-system`, cache in `documentDirectory/models/`, init/release `LlamaContext` da `llama.rn`, gestione stati (not_downloaded, downloading, downloaded, loading, ready, error)
- [x] Creare `lib/llm/toolExecutor.ts` — Dispatcher switch/case su 18 tool names → chiama store Zustand/calcoli da `lib/calculations.ts`. Accetta `StoreRefs` interface per ricevere azioni dagli store senza usare hooks direttamente
- [x] Creare `lib/llm/chatService.ts` — Orchestrazione completa: build prompt da history + system prompt → `context.completion()` → parse response → execute tool → re-prompt per risposta NL. Max 3 tool calls per turno, history limitata a 10 messaggi

### Phase 2 - State Management
- [x] Creare `stores/chatStore.ts` — Zustand store: `messages: ChatMessage[]`, `isGenerating`, `modelStatus: ModelStatus`. Solo `modelStatus.state` persistito in AsyncStorage. Aggiornare `stores/index.ts` con export

### Phase 3 - Componenti UI
- [ ] Creare `components/ui/ChatBubble.tsx` — Bolla messaggio: user (self-end, border-setly-text/30), assistant (self-start, border-setly-border), tool result (self-center, setly-accent/30, testo piccolo), loading (3 dots animati). SpaceMono font, no border-radius
- [ ] Creare `components/ui/ModelDownload.tsx` — Card download modello: titolo "DOWNLOAD AI MODEL", subtitle "~200 MB", progress bar (`bg-setly-accent h-1`), bottone download stile CTA SETLY, stati (download/downloading/initializing/ready)
- [ ] Creare `components/ui/AIFab.tsx` — Floating action button 48x48, posizione `absolute bottom-24 right-6`, `border border-setly-accent bg-setly-accent/10`, testo "AI" in SpaceMono_700Bold, `onPress → router.push('/ai/chat')`. Aggiornare `components/ui/index.ts` con tutti i nuovi export

### Phase 4 - Schermata Chat AI
- [ ] Creare `app/ai/_layout.tsx` — Stack layout per route group AI, `animation: 'slide_from_bottom'`, headerShown false, bg #0A0A0A
- [ ] Creare `app/ai/chat.tsx` — Schermata chat completa: header "AI ASSISTANT" con back + clear, ModelDownload card se modello non scaricato, FlatList inverted per messaggi con ChatBubble, TextInput con bottone send, quick action chips quando chat vuota ("Mostra statistiche", "Calcola 1RM", "Quali esercizi ho?", "Programma allenamento"). Integrazione con chatService, gestione focus/unfocus per load/unload modello

### Phase 5 - Integrazione e Wiring
- [ ] Aggiungere `<AIFab />` in `app/(tabs)/home.tsx` — Import e render come ultimo figlio del View root, con haptic feedback

### Phase 6 - Polish UX/UI schermate esistenti
- [ ] Migliorare `app/(tabs)/home.tsx` — Aggiungere StreakBadge compatto in alto, mostrare stats rapide (workout settimana, livello), migliorare layout CTA con animazione subtle
- [ ] Migliorare `app/(tabs)/stats.tsx` — Migliorare layout statistiche con cards ben strutturate, aggiungere grafici settimanali piu' leggibili, migliorare sezione PR
- [ ] Migliorare `app/(tabs)/calendar.tsx` — Migliorare transizioni mese, aggiungere scroll gesture, migliorare DayDetail modal
- [ ] Migliorare `app/(tabs)/settings.tsx` — Aggiungere sezione "AI Assistant" con toggle per gestire modello (scarica/elimina), mostrare dimensione modello e stato
- [ ] Migliorare `app/workout/active.tsx` — Migliorare animazioni ring progress, aggiungere feedback visivo piu' chiaro per cambio stato (working/resting), migliorare modal input reps/weight
- [ ] Migliorare `app/workout/summary.tsx` — Aggiungere statistiche dettagliate post-workout, PR ottenuti, confronto con sessione precedente, achievement sbloccati

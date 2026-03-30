# SETLY

> Offline-first workout tracking app for iOS & Android

SETLY is a brutalist-styled fitness tracker built with React Native + Expo. Every feature works 100% offline — no account required, no cloud sync, no subscriptions. Your data lives on your device.

## Features

- **Workout Tracking** — Log exercises, sets, reps, and weight with a fast, minimal UI
- **Rest Timer** — Configurable rest timer with haptic feedback
- **Personal Records** — Automatic PR detection with achievement popups
- **Statistics & Charts** — Weekly volume, PR history, workout frequency
- **Calendar View** — Browse past workouts by date
- **Templates** — Save and reuse workout templates
- **Scheduling** — Plan upcoming workouts with push notifications
- **1RM Calculator** — Epley, Brzycki, and Lander formulas averaged for accuracy
- **Plate Calculator** — Auto-calculate barbell plate loading
- **Gamification** — XP, levels, streaks, and achievements
- **AI Assistant** (on-device) — Natural language workout queries via llama.rn (GGUF, ~200 MB)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) ~54 + [React Native](https://reactnative.dev) 0.81 |
| Navigation | [Expo Router](https://expo.github.io/router) (file-based) |
| Database | [SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) via [Drizzle ORM](https://orm.drizzle.team) |
| State | [Zustand](https://zustand-demo.pmnd.rs) 5 |
| Styling | [NativeWind](https://www.nativewind.dev) 4 (Tailwind CSS) |
| Fonts | Space Mono (Google Fonts) |
| Animations | react-native-reanimated 4 |
| On-device AI | [llama.rn](https://github.com/mybigday/llama.rn) (GGUF format) |
| Language | TypeScript (strict mode) |

## Project Structure

```
setly/
├── app/                    # Expo Router pages (file-based routing)
│   ├── (tabs)/             # Tab navigator screens
│   │   ├── home.tsx
│   │   ├── calendar.tsx
│   │   ├── stats.tsx
│   │   └── settings.tsx
│   ├── ai/                 # AI Assistant screens
│   ├── workout/            # Active workout flow
│   ├── templates/          # Template management
│   ├── schedule/           # Scheduling
│   ├── settings/           # Settings sub-pages
│   └── tools/              # Utility tools (1RM calculator, etc.)
├── components/
│   └── ui/                 # Reusable UI components (barrel export)
├── db/                     # Drizzle schema + SQLite client
├── hooks/                  # Custom React hooks (barrel export)
├── lib/                    # Business logic & utilities
│   ├── calculations.ts     # 1RM, plate, volume calculations
│   ├── haptics.ts          # Haptic feedback wrapper
│   ├── notifications.ts    # Push notification service
│   └── llm/                # On-device AI module
│       ├── chatService.ts
│       ├── modelManager.ts
│       ├── responseParser.ts
│       ├── systemPrompt.ts
│       ├── toolExecutor.ts
│       └── tools.ts
├── stores/                 # Zustand stores (barrel export)
├── types/                  # Shared TypeScript types
├── tailwind.config.js      # SETLY color palette + custom classes
└── CLAUDE.md               # Development conventions & roadmap
```

## Getting Started

### Prerequisites

- Node.js 20+
- [Expo CLI](https://docs.expo.dev/get-started/installation/): `npm install -g expo`
- iOS: Xcode 15+ (Mac only)
- Android: Android Studio with SDK 34+

### Install

```bash
git clone https://github.com/your-username/setly.git
cd setly
npm install
```

### Run

```bash
# Start Metro bundler
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

### Development Scripts

```bash
npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix
npm run format        # Prettier format all files
npm run format:check  # Prettier check (CI)
npm run type-check    # TypeScript strict check (no emit)
npm test              # Jest unit tests
```

## Design System

SETLY uses a **brutalist/angular** visual style — no border-radius, monospaced font everywhere, high-contrast dark palette.

| Token | Value | Usage |
|---|---|---|
| `setly-black` | `#0A0A0A` | App background |
| `setly-dark` | `#121212` | Card backgrounds |
| `setly-gray` | `#1A1A1A` | Elevated surfaces |
| `setly-border` | `#2A2A2A` | Borders & dividers |
| `setly-text` | `#E5E5E5` | Primary text |
| `setly-muted` | `#666666` | Secondary text |
| `setly-accent` | `#4ADE80` | CTAs, highlights, progress |

Font: `SpaceMono_400Regular` / `SpaceMono_700Bold`

## AI Assistant

The AI feature is entirely on-device using a quantized GGUF model (~200 MB). No data ever leaves the device.

- Model downloaded on first use from the Settings screen
- 18 custom function-calling tools (query workouts, calculate 1RM, navigate, etc.)
- System prompt in Italian (SETLY AI persona)
- Max 3 tool calls per turn, 10-message history window

## Data Privacy

SETLY stores everything locally in SQLite via Expo's file system. There are no backend servers, no analytics, no tracking. Exporting your data (JSON/CSV) is available from Settings.

## Contributing

1. Fork the repo and create a branch from `master`
2. Follow the conventions in `CLAUDE.md` (camelCase vars, PascalCase types/components, `@/` imports)
3. Run `npm run lint && npm run type-check` before opening a PR
4. Commit messages: lowercase English, descriptive (`fix rest timer countdown logic`)

## License

Private — all rights reserved.

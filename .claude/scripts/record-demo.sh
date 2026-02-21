#!/bin/bash
# record-demo.sh - Creates a scripted demo recording for the README
# Simulates the roadmap-pilot workflow with realistic output

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DEMO_DIR="/tmp/roadmap-demo-project"
CAST_FILE="/tmp/roadmap-demo.cast"
GIF_FILE="$PROJECT_DIR/assets/demo.gif"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# Cleanup
rm -rf "$DEMO_DIR"
mkdir -p "$DEMO_DIR" "$PROJECT_DIR/assets"

# Create a fake project to demo with
mkdir -p "$DEMO_DIR/src/utils" "$DEMO_DIR/src/components" "$DEMO_DIR/src/types"

cat > "$DEMO_DIR/CLAUDE.md" << 'INNEREOF'
# MyApp

E-commerce frontend built with Next.js and TypeScript.

## Working With Claude

- **Branch**: `refactor/typing`
- **Commit prefix**: `[typing]`

## Conventions

- Shared types in `src/types/`
- Use `type` instead of `interface`

## Roadmap

### Phase 1 - Shared Types
- [x] Create `src/types/api.ts` with API response types
- [x] Create `src/types/models.ts` with domain model types
- [x] Create `src/types/components.ts` with shared prop types

### Phase 2 - Core Utilities
- [x] Type `src/utils/formatters.ts`
- [x] Type `src/utils/validators.ts`
- [ ] Type `src/utils/helpers.ts`
- [ ] Type `src/utils/api-client.ts`

### Phase 3 - Components
- [ ] Type `src/components/Header.tsx`
- [ ] Type `src/components/ProductCard.tsx`
- [ ] Type `src/components/CartDrawer.tsx`
- [ ] Type remaining files in `src/components/`
INNEREOF

# The simulated demo script
cat > /tmp/demo-script.sh << 'DEMOEOF'
#!/bin/bash

# Simulated typing effect
type_slow() {
  local text="$1"
  for ((i=0; i<${#text}; i++)); do
    printf '%s' "${text:$i:1}"
    sleep 0.04
  done
}

type_cmd() {
  printf '\033[0;32m❯\033[0m '
  type_slow "$1"
  sleep 0.3
  echo ""
}

DEMO_DIR="/tmp/roadmap-demo-project"
cd "$DEMO_DIR"

echo ""
echo -e "\033[1;34m  ╔═══════════════════════════════════════════╗\033[0m"
echo -e "\033[1;34m  ║        ROADMAP PILOT  —  Demo             ║\033[0m"
echo -e "\033[1;34m  ╚═══════════════════════════════════════════╝\033[0m"
echo ""
sleep 1

# Step 1: Show status
echo -e "\033[2m  # Step 1: Check roadmap progress\033[0m"
sleep 0.5
type_cmd "status.sh CLAUDE.md"
sleep 0.3

# Simulated status output
echo ""
echo -e "  \033[1mROADMAP PROGRESS\033[0m"
echo -e "  ─────────────────────────────────────────────"
echo ""
echo -e "  \033[0;32mPhase 1 - Shared Types       ████████████████████ 3/3 (100%)\033[0m"
echo -e "  \033[1;33mPhase 2 - Core Utilities      ██████████░░░░░░░░░░ 2/4 (50%)\033[0m"
echo -e "  \033[1;33mPhase 3 - Components           ░░░░░░░░░░░░░░░░░░░░ 0/4 (0%)\033[0m"
echo ""
echo -e "  ─────────────────────────────────────────────"
echo ""
echo -e "  \033[1;33mTOTAL                        ██████████░░░░░░░░░░ 5/11 (45%)\033[0m"
echo ""
echo -e "  \033[0;34mNext:\033[0m Type \`src/utils/helpers.ts\`"
echo ""
sleep 2

# Step 2: Run /roadmap
echo -e "\033[2m  # Step 2: Execute next task\033[0m"
sleep 0.5
type_cmd "/roadmap"
sleep 0.5

echo ""
echo -e "  \033[0;34m📖 Reading CLAUDE.md...\033[0m"
sleep 0.8
echo -e "  \033[0;34m🔍 Next task:\033[0m Type \`src/utils/helpers.ts\`"
sleep 0.5
echo -e "  \033[0;34m📝 Reading src/utils/helpers.ts...\033[0m"
sleep 0.8
echo -e "  \033[0;32m✓  Replaced 12 \`any\` types with proper types\033[0m"
sleep 0.3
echo -e "  \033[0;32m✓  Imported SharedTypes from src/types/\033[0m"
sleep 0.3
echo -e "  \033[0;32m✓  Marked task [x] in CLAUDE.md\033[0m"
sleep 0.3
echo -e "  \033[0;32m✓  Committed: [typing] type src/utils/helpers.ts\033[0m"
sleep 0.5
echo ""
echo -e "  \033[1;32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
echo -e "  \033[1;32mDone. Open a new session and say:\033[0m"
echo -e "  \033[1;32mcontinue the roadmap\033[0m"
echo -e "  \033[1;32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
echo ""
sleep 2

# Step 3: Show updated progress
echo -e "\033[2m  # Step 3: Progress updated automatically\033[0m"
sleep 0.5
type_cmd "status.sh CLAUDE.md"
sleep 0.3

# Updated status
echo ""
echo -e "  \033[1mROADMAP PROGRESS\033[0m"
echo -e "  ─────────────────────────────────────────────"
echo ""
echo -e "  \033[0;32mPhase 1 - Shared Types       ████████████████████ 3/3 (100%)\033[0m"
echo -e "  \033[1;33mPhase 2 - Core Utilities      ███████████████░░░░░ 3/4 (75%)\033[0m"
echo -e "  \033[1;33mPhase 3 - Components           ░░░░░░░░░░░░░░░░░░░░ 0/4 (0%)\033[0m"
echo ""
echo -e "  ─────────────────────────────────────────────"
echo ""
echo -e "  \033[1;33mTOTAL                        ███████████░░░░░░░░░ 6/11 (54%)\033[0m"
echo ""
echo -e "  \033[0;34mNext:\033[0m Type \`src/utils/api-client.ts\`"
echo ""
sleep 2

# Final message
echo -e "  \033[2m  One task per session. Zero hallucinations.\033[0m"
echo -e "  \033[2m  github.com/antconsales/roadmap-pilot\033[0m"
echo ""
sleep 2
DEMOEOF

chmod +x /tmp/demo-script.sh

echo "Demo script ready. Recording..."

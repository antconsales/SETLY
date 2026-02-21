#!/bin/bash
# record-demo-init.sh - Demo of /init-roadmap (planning skill)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

mkdir -p "$PROJECT_DIR/assets"

# Create the simulated demo script
cat > /tmp/demo-init-script.sh << 'DEMOEOF'
#!/bin/bash

type_slow() {
  local text="$1"
  for ((i=0; i<${#text}; i++)); do
    printf '%s' "${text:$i:1}"
    sleep 0.03
  done
}

type_cmd() {
  printf '\033[0;32m❯\033[0m '
  type_slow "$1"
  sleep 0.3
  echo ""
}

echo ""
echo -e "\033[1;34m  ╔═══════════════════════════════════════════╗\033[0m"
echo -e "\033[1;34m  ║      /init-roadmap  —  Planning Mode      ║\033[0m"
echo -e "\033[1;34m  ╚═══════════════════════════════════════════╝\033[0m"
echo ""
sleep 1

# Step 1: User triggers
echo -e "\033[2m  # Step 1: User invokes the planning skill\033[0m"
sleep 0.5
type_cmd "/init-roadmap"
sleep 0.8

# Step 2: Scan
echo ""
echo -e "  \033[0;34m🔍 Scanning project...\033[0m"
sleep 0.6
echo ""
echo -e "  \033[1mProject analysis:\033[0m"
echo -e "  \033[2m──────────────────────────────────────\033[0m"
echo -e "  Framework:  \033[1;33mNext.js + TypeScript\033[0m"
echo -e "  Files:      \033[0m147 .ts/.tsx, 23 .js (legacy)"
echo -e "  Tests:      Jest configured, 12 test files"
echo -e "  Linting:    ESLint + Prettier"
echo -e "  Structure:  src/ with components/, pages/, utils/, api/"
echo -e "  Any types:  \033[1;31m89 files contain \`any\`\033[0m"
echo -e "  \033[2m──────────────────────────────────────\033[0m"
echo ""
sleep 2

# Step 3: Interview
echo -e "  \033[0;34m💬 Targeted questions:\033[0m"
sleep 0.5
echo ""
echo -e "  \033[1m1.\033[0m What's the goal?"
echo -e "     \033[0;32m→ Remove all \`any\` types, add proper typing\033[0m"
sleep 0.8
echo -e "  \033[1m2.\033[0m Which branch?"
echo -e "     \033[0;32m→ Creating \`refactor/typing-cleanup\`\033[0m"
sleep 0.8
echo -e "  \033[1m3.\033[0m Commit prefix?"
echo -e "     \033[0;32m→ [typing]\033[0m"
sleep 0.8
echo -e "  \033[1m4.\033[0m Where should shared types live?"
echo -e "     \033[0;32m→ src/types/index.ts (already exists)\033[0m"
sleep 1.5

# Step 4: Generate roadmap
echo ""
echo -e "  \033[0;34m📋 Generating roadmap...\033[0m"
sleep 0.8
echo ""
echo -e "  \033[1mGenerated CLAUDE.md:\033[0m"
echo -e "  \033[2m──────────────────────────────────────\033[0m"
echo ""
echo -e "  \033[1m## Roadmap\033[0m"
echo ""
echo -e "  \033[1;36m### Phase 1 - Foundation (3 tasks)\033[0m"
echo -e "  - [ ] Create \`src/types/api.ts\`"
echo -e "  - [ ] Create \`src/types/models.ts\`"
echo -e "  - [ ] Create \`src/types/components.ts\`"
echo ""
echo -e "  \033[1;36m### Phase 2 - Core Utilities (5 tasks)\033[0m"
echo -e "  - [ ] Type \`src/utils/formatters.ts\`"
echo -e "  - [ ] Type \`src/utils/validators.ts\`"
echo -e "  - [ ] Type \`src/utils/helpers.ts\`"
echo -e "  - [ ] Type \`src/utils/api-client.ts\`"
echo -e "  - [ ] Type \`src/utils/auth.ts\`"
echo ""
echo -e "  \033[1;36m### Phase 3 - Components (8 tasks)\033[0m"
echo -e "  - [ ] Type \`src/components/Header.tsx\`"
echo -e "  - [ ] Type \`src/components/ProductCard.tsx\`"
echo -e "  - [ ] ...6 more files"
echo ""
echo -e "  \033[2m──────────────────────────────────────\033[0m"
sleep 2

# Step 5: Save
echo ""
echo -e "  \033[0;32m✓  CLAUDE.md saved with 16 tasks in 3 phases\033[0m"
echo -e "  \033[0;32m✓  Branch \`refactor/typing-cleanup\` created\033[0m"
echo -e "  \033[0;32m✓  Committed: [typing] init roadmap\033[0m"
echo ""
sleep 0.5
echo -e "  \033[1;32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
echo -e "  \033[1;32mRoadmap ready! 16 tasks in 3 phases.\033[0m"
echo -e "  \033[1;32mOpen a new session and type: /roadmap\033[0m"
echo -e "  \033[1;32m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
echo ""
sleep 2
DEMOEOF

chmod +x /tmp/demo-init-script.sh
echo "Init demo script ready."

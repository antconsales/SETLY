#!/bin/bash
# record-demo-autopilot.sh - Demo of auto-roadmap.sh (full autopilot)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

mkdir -p "$PROJECT_DIR/assets"

# Create the simulated demo script
cat > /tmp/demo-autopilot-script.sh << 'DEMOEOF'
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
echo -e "\033[1;34m  ║    auto-roadmap.sh  —  Autopilot Mode     ║\033[0m"
echo -e "\033[1;34m  ╚═══════════════════════════════════════════╝\033[0m"
echo ""
sleep 1

# Launch
echo -e "\033[2m  # Launch the autopilot and grab a coffee\033[0m"
sleep 0.5
type_cmd "./auto-roadmap.sh CLAUDE.md"
sleep 0.5

echo ""
echo -e "  \033[1;34m╔══════════════════════════════════════╗\033[0m"
echo -e "  \033[1;34m║     ROADMAP PILOT - AUTO MODE        ║\033[0m"
echo -e "  \033[1;34m╚══════════════════════════════════════╝\033[0m"
echo ""
echo -e "  \033[1;33mRoadmap: 5/11 completed, 6 remaining\033[0m"
echo -e "  \033[1;33mMax sessions: 50\033[0m"
echo ""
sleep 1.5

# Session 1
echo -e "  \033[0;34m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
echo -e "  \033[0;34mSession #1/50\033[0m"
echo -e "  \033[1;33mNext: Type \`src/utils/helpers.ts\`\033[0m"
echo -e "  \033[0;34m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
sleep 0.5
echo -e "  \033[2m  claude -p \"Read CLAUDE.md and execute next task...\"\033[0m"
sleep 1.5
echo -e "  \033[0;32mTask completed! (6/11)\033[0m"
echo ""
sleep 1

# Session 2
echo -e "  \033[0;34m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
echo -e "  \033[0;34mSession #2/50\033[0m"
echo -e "  \033[1;33mNext: Type \`src/utils/api-client.ts\`\033[0m"
echo -e "  \033[0;34m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
sleep 0.5
echo -e "  \033[2m  claude -p \"Read CLAUDE.md and execute next task...\"\033[0m"
sleep 1.5
echo -e "  \033[0;32mTask completed! (7/11)\033[0m"
echo ""
sleep 1

# Session 3
echo -e "  \033[0;34m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
echo -e "  \033[0;34mSession #3/50\033[0m"
echo -e "  \033[1;33mNext: Type \`src/components/Header.tsx\`\033[0m"
echo -e "  \033[0;34m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
sleep 0.5
echo -e "  \033[2m  claude -p \"Read CLAUDE.md and execute next task...\"\033[0m"
sleep 1.5
echo -e "  \033[0;32mTask completed! (8/11)\033[0m"
echo ""
sleep 0.8

# Fast forward
echo -e "  \033[2m  ⋮ (sessions 4-6 running...)\033[0m"
sleep 1.5
echo ""

# Done!
echo -e "  \033[0;32m╔══════════════════════════════════════╗\033[0m"
echo -e "  \033[0;32m║     ROADMAP COMPLETED!               ║\033[0m"
echo -e "  \033[0;32m╚══════════════════════════════════════╝\033[0m"
echo ""
echo -e "  \033[0;32mSessions used: 6\033[0m"
echo -e "  \033[0;32mTasks completed: 11/11\033[0m"
echo ""
sleep 1

echo -e "  \033[2m  Each session = fresh context, zero hallucinations.\033[0m"
echo -e "  \033[2m  github.com/antconsales/roadmap-pilot\033[0m"
echo ""
sleep 2
DEMOEOF

chmod +x /tmp/demo-autopilot-script.sh
echo "Autopilot demo script ready."

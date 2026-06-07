#!/bin/bash
# run.sh — Start both services, auto-patching API URL for GitHub Codespaces
#
# Usage:
#   ./run.sh          → normal start
#   ./run.sh --build  → force rebuild images

set -e

BUILD_FLAG=""
if [ "$1" = "--build" ]; then
  BUILD_FLAG="--build"
fi

# ── Detect Codespaces environment ─────────────────────────────────────────────
if [ -n "$CODESPACE_NAME" ]; then
  SD_API_URL="https://${CODESPACE_NAME}-8000.app.github.dev"
  echo "🌐 Codespaces detected"
  echo "   SD API  → $SD_API_URL"
  echo "   React   → https://${CODESPACE_NAME}-3000.app.github.dev"
else
  SD_API_URL="http://localhost:8000"
  echo "💻 Local environment"
  echo "   SD API  → $SD_API_URL"
  echo "   React   → http://localhost:3000"
fi

# Write .env so docker-compose picks up the correct API URL
cat > .env <<ENVEOF
REACT_APP_IMG_API=${SD_API_URL}
ENVEOF

echo ""
echo "▶ Starting services…"
docker compose up $BUILD_FLAG -d

echo ""
echo "✅ Done. Useful commands:"
echo "   docker compose logs -f          → live logs"
echo "   docker compose logs -f sd-api   → API logs only"
echo "   docker compose down             → stop everything"

#!/usr/bin/env bash
# Send a Telegram message from a shell. Used by Claude for progress updates.
# Usage: notify.sh "your message"

set -euo pipefail

MSG="${1:-}"
if [ -z "$MSG" ]; then
  echo "usage: notify.sh <message>" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "no .env at $ENV_FILE" >&2
  exit 1
fi

TOKEN="$(grep -E '^TELEGRAM_BOT_TOKEN=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
CHAT="$(grep -E '^ALLOWED_CHAT_ID=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'" | cut -d, -f1)"

if [ -z "$TOKEN" ] || [ -z "$CHAT" ]; then
  echo "TELEGRAM_BOT_TOKEN or ALLOWED_CHAT_ID missing in .env" >&2
  exit 1
fi

curl -sS -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" \
  --data-urlencode "chat_id=${CHAT}" \
  --data-urlencode "text=${MSG}" \
  > /dev/null

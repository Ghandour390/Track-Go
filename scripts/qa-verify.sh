#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

echo "[1/4] TypeScript check"
npx tsc --noEmit

echo "[2/4] ESLint check"
npm run lint

echo "[3/4] Mock API reachability"
API_URL="${EXPO_PUBLIC_API_URL:-http://localhost:3009}"

if curl --silent --fail "$API_URL/colis" >/dev/null; then
  echo "API reachable at $API_URL"
  echo "[4/4] Minimal API payload checks"
  COLIS_COUNT="$(curl --silent "$API_URL/colis" | wc -c | tr -d ' ')"
  LIVREURS_COUNT="$(curl --silent "$API_URL/livreurs" | wc -c | tr -d ' ')"

  if [[ "$COLIS_COUNT" -le 2 || "$LIVREURS_COUNT" -le 2 ]]; then
    echo "Unexpected API payload sizes"
    exit 1
  fi

  echo "QA verify passed"
else
  echo "API not reachable at $API_URL"
  echo "Skip API checks. Start mock API to run full QA: cd mock-server && docker compose up --build"
  echo "QA verify passed (code checks only)"
fi

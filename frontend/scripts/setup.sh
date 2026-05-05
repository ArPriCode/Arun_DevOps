#!/usr/bin/env bash
# =============================================================================
# Cinemora Frontend – Idempotent Setup Script
# Safe to run multiple times; each step is a no-op if already done.
# =============================================================================
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "==> [1/3] Ensuring Node.js dependencies are installed..."
# npm ci is idempotent: installs exact versions from package-lock.json
npm ci

echo "==> [2/3] Building frontend..."
# vite build is idempotent: always produces a fresh dist/ folder
npm run build

echo "==> [3/3] Ensuring dist/ is served by nginx (if available)..."
if command -v nginx &>/dev/null; then
  # Reload nginx config without downtime (idempotent)
  sudo nginx -t && sudo nginx -s reload
  echo "     nginx reloaded."
else
  echo "     nginx not found – skipping. Serve dist/ with your preferred static server."
fi

echo ""
echo "✅ Frontend setup complete. Built output is in: $PROJECT_DIR/dist"

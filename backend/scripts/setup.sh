#!/usr/bin/env bash
# =============================================================================
# Cinemora Backend – Idempotent Setup Script
# Safe to run multiple times; each step is a no-op if already done.
# =============================================================================
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

echo "==> [1/5] Ensuring Node.js dependencies are installed..."
# npm ci is idempotent: installs exact versions from package-lock.json
npm ci

echo "==> [2/5] Generating Prisma client..."
# prisma generate is idempotent: regenerates client from schema
npx prisma generate

echo "==> [3/5] Running database migrations..."
# prisma migrate deploy is idempotent: skips already-applied migrations
npx prisma migrate deploy

echo "==> [4/5] Ensuring PM2 is available..."
if ! command -v pm2 &>/dev/null; then
  echo "     PM2 not found – installing globally..."
  npm install -g pm2
else
  echo "     PM2 already installed: $(pm2 --version)"
fi

echo "==> [5/5] Starting / reloading backend with PM2..."
# pm2 startOrReload is idempotent: starts if not running, reloads if running
if pm2 list | grep -q "cinemora-backend"; then
  pm2 reload cinemora-backend --update-env
else
  pm2 start src/index.js --name cinemora-backend
fi

pm2 save

echo ""
echo "✅ Backend setup complete."

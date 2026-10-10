#!/usr/bin/env bash
set -euo pipefail
echo "=== Saral Watch Setup ==="
npm install
npm run build
npm --workspace server run db:push
npm run seed
echo "=== Setup complete. Run: npm start ==="

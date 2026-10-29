#!/bin/sh
set -e
# Apply pending migrations (safe to run on every start; no-op when up to date)
prisma migrate deploy --schema=./prisma/schema.prisma
# First boot only: create plans + the super admin (demo stores skipped unless SEED_DEMO=true)
if [ "${RUN_SEED:-false}" = "true" ]; then
  SEED_DEMO="${SEED_DEMO:-false}" tsx prisma/seed.ts
fi
exec node server.js

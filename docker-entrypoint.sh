#!/bin/sh
set -e
# Apply pending migrations (safe to run on every start; no-op when up to date)
prisma migrate deploy --schema=./prisma/schema.prisma
# System data (plans; optional SEED_ADMIN_*) — idempotent, safe on every start
tsx prisma/seed.ts
exec node server.js

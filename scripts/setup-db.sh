#!/usr/bin/env bash
set -euo pipefail

echo "→ Applying local migrations..."
supabase db push --local

echo "→ Regenerating TypeScript types..."
supabase gen types typescript --local > src/types/supabase.ts

echo "✓ Database setup complete"

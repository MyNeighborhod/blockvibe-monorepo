#!/bin/bash
set -e

# Pull production Postgres, apply Payload schema push locally, push back to prod.
# Preserves production data while adding tables/columns required by the current code.
#
# Usage: ./infra/sync-prod-schema.sh [--yes]

SKIP_CONFIRM=0
for arg in "$@"; do
  case "$arg" in
    --yes) SKIP_CONFIRM=1 ;;
  esac
done

INFRA_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$( dirname "$INFRA_DIR" )"

cd "$INFRA_DIR"

IP=$(terraform output -raw instance_public_ip 2>/dev/null || echo "")
if [ -z "$IP" ]; then
  echo "Error: Could not retrieve instance_public_ip."
  exit 1
fi

SSH_KEY="$HOME/.ssh/blockvibe_id_rsa"
if [ ! -f "$SSH_KEY" ]; then
  SSH_KEY="$INFRA_DIR/id_rsa"
fi

SNAPSHOT_DIR="$PROJECT_DIR/dbsnapshots"
mkdir -p "$SNAPSHOT_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PROD_DUMP="$SNAPSHOT_DIR/prod_${TIMESTAMP}.sql"
SCHEMA_DUMP="$SNAPSHOT_DIR/prod_${TIMESTAMP}_schema.sql"

echo "--------------------------------------------------------"
echo "1. Dumping production database from ubuntu@$IP"
echo "--------------------------------------------------------"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "ubuntu@$IP" \
  "cd /home/ubuntu/app && sudo docker compose exec -T db pg_dump -U postgres -d blockvibe-multitenant --clean --if-exists" \
  > "$PROD_DUMP"
echo "✓ Production dump: $PROD_DUMP ($(du -sh "$PROD_DUMP" | cut -f1))"

echo "--------------------------------------------------------"
echo "2. Restoring dump to local Postgres and pushing schema"
echo "--------------------------------------------------------"
cd "$PROJECT_DIR"

set -a
# shellcheck disable=SC1090
source "$PROJECT_DIR/.env"
set +a

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL missing in .env"
  exit 1
fi

psql --dbname="$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
grep -v -E '^(SET transaction_timeout|SET idle_in_transaction_session_timeout|\\restrict|\\unrestrict)' "$PROD_DUMP" \
  | psql --dbname="$DATABASE_URL" -q

export NODE_ENV=development
export NODE_OPTIONS=--no-deprecation
pnpm exec tsx infra/push-schema.ts

pg_dump --dbname="$DATABASE_URL" -f "$SCHEMA_DUMP"
grep -v -E '^(SET transaction_timeout|SET idle_in_transaction_session_timeout)' "$SCHEMA_DUMP" > "${SCHEMA_DUMP%.sql}_prod.sql"
SCHEMA_DUMP="${SCHEMA_DUMP%.sql}_prod.sql"

echo "✓ Schema-updated dump: $SCHEMA_DUMP ($(du -sh "$SCHEMA_DUMP" | cut -f1))"

echo "--------------------------------------------------------"
echo "3. Pushing schema-updated database back to production"
echo "--------------------------------------------------------"
"$INFRA_DIR/push-db-to-prod.sh" $([ "$SKIP_CONFIRM" -eq 1 ] && echo --yes) --skip-media "$SCHEMA_DUMP"

echo "--------------------------------------------------------"
echo "Production schema sync complete."
echo "--------------------------------------------------------"

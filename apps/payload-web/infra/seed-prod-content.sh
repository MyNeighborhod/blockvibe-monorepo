#!/bin/bash
set -e

# Seed production CMS content for info.blockvibe.org (default platform tenant)
# and NOG neighbor users for nog.blockvibe.org e2e tests.
#
# Opens an SSH tunnel to the production Postgres port, runs seed scripts locally,
# then closes the tunnel.
#
# Usage: ./infra/seed-prod-content.sh

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

ENV_FILE="$PROJECT_DIR/.env.production"
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: .env.production not found."
  exit 1
fi

DB_PASSWORD=$(grep -E '^DB_PASSWORD=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
PAYLOAD_SECRET=$(grep -E '^PAYLOAD_SECRET=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
SERVER_URL=$(grep -E '^NEXT_PUBLIC_SERVER_URL=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")

if [ -z "$DB_PASSWORD" ] || [ -z "$PAYLOAD_SECRET" ]; then
  echo "Error: DB_PASSWORD or PAYLOAD_SECRET missing in .env.production"
  exit 1
fi

LOCAL_DB_PORT=15432
TUNNEL_PID=""

cleanup() {
  if [ -n "$TUNNEL_PID" ] && kill -0 "$TUNNEL_PID" 2>/dev/null; then
    echo "Closing SSH tunnel (pid $TUNNEL_PID)..."
    kill "$TUNNEL_PID" 2>/dev/null || true
    wait "$TUNNEL_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

echo "--------------------------------------------------------"
echo "Opening SSH tunnel to production Postgres (ubuntu@$IP)"
echo "--------------------------------------------------------"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -f -N -L "${LOCAL_DB_PORT}:127.0.0.1:5432" "ubuntu@$IP"
TUNNEL_PID=$(pgrep -f "ssh.*${LOCAL_DB_PORT}:127.0.0.1:5432.*ubuntu@${IP}" | head -1)

sleep 1

cd "$PROJECT_DIR"

# Load TENANT_NOG_* from local .env (must not clobber tunnel DATABASE_URL)
set -a
# shellcheck disable=SC1090
source "$PROJECT_DIR/.env"
set +a

export DATABASE_URL="postgres://postgres:${DB_PASSWORD}@127.0.0.1:${LOCAL_DB_PORT}/blockvibe-multitenant"
export PAYLOAD_SECRET
export NEXT_PUBLIC_SERVER_URL="${SERVER_URL:-https://info.blockvibe.org}"
export NOG_SHOWCASE_URL="https://nog.blockvibe.org"
export NODE_ENV=development
export NODE_OPTIONS=--no-deprecation

echo "Using database: postgres://postgres:***@127.0.0.1:${LOCAL_DB_PORT}/blockvibe-multitenant"

echo "--------------------------------------------------------"
echo "1. Seeding default platform tenant (info.blockvibe.org)"
echo "--------------------------------------------------------"
pnpm exec tsx src/scripts/seed-default-platform.ts

echo "--------------------------------------------------------"
echo "2. Seeding NOG neighbor users (nog.blockvibe.org)"
echo "--------------------------------------------------------"
pnpm exec tsx src/scripts/seed-nog-users.ts

echo "--------------------------------------------------------"
echo "3. Syncing superadmin password for admin e2e"
echo "--------------------------------------------------------"
export LOCAL_SUPERADMIN_USERNAME=$(grep -E '^LOCAL_SUPERADMIN_USERNAME=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
export LOCAL_SUPERADMIN_PASSWORD=$(grep -E '^LOCAL_SUPERADMIN_PASSWORD=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
pnpm exec tsx src/scripts/seed-superadmin-password.ts

echo "--------------------------------------------------------"
echo "4. Seeding Twin Suns users for dashboard e2e"
echo "--------------------------------------------------------"
pnpm exec tsx src/scripts/seed-twin-suns-users.ts

echo "--------------------------------------------------------"
echo "Production content seed complete."
echo "  Platform: ${NEXT_PUBLIC_SERVER_URL}"
echo "  Showcase: ${NOG_SHOWCASE_URL}"
echo "--------------------------------------------------------"

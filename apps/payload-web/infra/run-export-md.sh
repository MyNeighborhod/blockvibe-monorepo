#!/bin/bash
set -e

INFRA_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$( dirname "$INFRA_DIR" )"

cd "$INFRA_DIR"

IP=$(terraform output -raw instance_public_ip 2>/dev/null || echo "")
SSH_KEY="$INFRA_DIR/id_rsa"

ENV_FILE_PROD="$PROJECT_DIR/.env.production"
LOCAL_DB_PORT_PROD=15432
REMOTE_DB_PORT_PROD=5432
DB_NAME_PROD="blockvibe-multitenant"
DB_PASSWORD_PROD=$(grep -E '^DB_PASSWORD=' "$ENV_FILE_PROD" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
PAYLOAD_SECRET_PROD=$(grep -E '^PAYLOAD_SECRET=' "$ENV_FILE_PROD" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")

pkill -f "15432:127.0.0.1" || true
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -f -N -L "${LOCAL_DB_PORT_PROD}:127.0.0.1:${REMOTE_DB_PORT_PROD}" "ubuntu@$IP"
TUNNEL_PID_PROD=$(pgrep -f "ssh.*${LOCAL_DB_PORT_PROD}:127.0.0.1:${REMOTE_DB_PORT_PROD}.*ubuntu@${IP}" | head -1)

sleep 2

cd "$PROJECT_DIR"
export DATABASE_URL="postgres://postgres:${DB_PASSWORD_PROD}@127.0.0.1:${LOCAL_DB_PORT_PROD}/${DB_NAME_PROD}"
export PAYLOAD_SECRET="$PAYLOAD_SECRET_PROD"
export NODE_ENV=development
export NODE_OPTIONS=--no-deprecation

pnpm exec tsx src/scripts/generate-md-export.ts

if [ -n "$TUNNEL_PID_PROD" ] && kill -0 "$TUNNEL_PID_PROD" 2>/dev/null; then
  kill "$TUNNEL_PID_PROD" 2>/dev/null || true
fi

#!/bin/bash
set -e

# Take production Postgres snapshot and download it locally.
#
# Usage:
#   ./infra/snapshot-prod-db.sh
#
# Requires: terraform applied, SSH access to EC2.

INFRA_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$( dirname "$INFRA_DIR" )"

cd "$INFRA_DIR"

IP=$(terraform output -raw instance_public_ip 2>/dev/null || echo "")
if [ -z "$IP" ]; then
  echo "Error: Could not retrieve instance_public_ip. Run terraform apply in infra/ first."
  exit 1
fi

SSH_KEY="$HOME/.ssh/blockvibe_id_rsa"
if [ ! -f "$SSH_KEY" ]; then
  SSH_KEY="$INFRA_DIR/id_rsa"
fi
if [ ! -f "$SSH_KEY" ]; then
  echo "Error: SSH private key not found."
  exit 1
fi

for cmd in pg_dump scp ssh; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: '$cmd' is required but not installed."
    exit 1
  fi
done

SNAPSHOT_DIR="$PROJECT_DIR/dbsnapshots/prod"
mkdir -p "$SNAPSHOT_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOCAL_PATH="$SNAPSHOT_DIR/snapshot_${TIMESTAMP}.sql"
REMOTE_PATH="/home/ubuntu/snapshot_prod_${TIMESTAMP}.sql"

echo "--------------------------------------------------------"
echo "Target: ubuntu@$IP (production)"
echo "Local Path: dbsnapshots/prod/snapshot_${TIMESTAMP}.sql"
echo "--------------------------------------------------------"

echo "Taking snapshot on production EC2..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "ubuntu@$IP" \
  REMOTE_PATH="$REMOTE_PATH" bash -s <<'REMOTE'
set -e
cd /home/ubuntu/app

# Read DB name from remote .env
DB_NAME="blockvibe-multitenant"
if [ -f .env ]; then
  ENV_DB_NAME=$(grep -E '^DB_NAME=' .env | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
  if [ -n "$ENV_DB_NAME" ]; then
    DB_NAME="$ENV_DB_NAME"
  fi
fi

echo "Running pg_dump inside db container..."
sudo docker compose exec -T db pg_dump -U postgres -d "$DB_NAME" > "$REMOTE_PATH"

if [ ! -s "$REMOTE_PATH" ]; then
  echo "Error: Production snapshot failed or is empty: $REMOTE_PATH"
  rm -f "$REMOTE_PATH"
  exit 1
fi

echo "✓ Remote snapshot created: $REMOTE_PATH ($(du -sh "$REMOTE_PATH" | cut -f1))"
REMOTE

echo "Downloading production snapshot..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "ubuntu@$IP:$REMOTE_PATH" "$LOCAL_PATH"

echo "Prepending Git commit metadata..."
GIT_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
GIT_SUBJECT=$(git log -1 --format="%s" 2>/dev/null || echo "")

TEMP_FILE="${LOCAL_PATH}.tmp"
echo "-- Git Commit: ${GIT_COMMIT} (${GIT_SUBJECT})" > "$TEMP_FILE"
echo "" >> "$TEMP_FILE"
cat "$LOCAL_PATH" >> "$TEMP_FILE"
mv "$TEMP_FILE" "$LOCAL_PATH"

echo "Cleaning up remote file..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "ubuntu@$IP" "rm -f $REMOTE_PATH"

echo "--------------------------------------------------------"
echo "✓ Success! Production snapshot saved to:"
echo "  $LOCAL_PATH ($(du -sh "$LOCAL_PATH" | cut -f1))"
echo "--------------------------------------------------------"

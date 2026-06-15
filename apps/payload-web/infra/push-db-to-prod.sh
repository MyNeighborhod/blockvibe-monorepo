#!/bin/bash
set -e

# Push local Postgres to production (replaces the remote database).
#
# Usage:
#   ./infra/push-db-to-prod.sh              # prompt before overwrite
#   ./infra/push-db-to-prod.sh --yes        # skip confirmation
#   ./infra/push-db-to-prod.sh --skip-media # DB only, no media rsync
#   ./infra/push-db-to-prod.sh --no-backup  # skip prod backup (emergency only)
#
# Requires: .env with DATABASE_URL (local), terraform applied, SSH access to EC2.

SKIP_CONFIRM=0
SKIP_MEDIA=0
SKIP_BACKUP=0
SNAPSHOT_ARG=""
PROD_BACKUP_KEEP=7

for arg in "$@"; do
  case "$arg" in
    --yes) SKIP_CONFIRM=1 ;;
    --skip-media) SKIP_MEDIA=1 ;;
    --no-backup) SKIP_BACKUP=1 ;;
    --*) ;;
    *) SNAPSHOT_ARG="$arg" ;;
  esac
done

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

for cmd in pg_dump scp ssh rsync; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: '$cmd' is required but not installed."
    exit 1
  fi
done

if [ -n "$SNAPSHOT_ARG" ]; then
  if [ -f "$SNAPSHOT_ARG" ]; then
    SNAPSHOT_PATH="$(cd "$(dirname "$SNAPSHOT_ARG")" && pwd)/$(basename "$SNAPSHOT_ARG")"
  elif [ -f "$PROJECT_DIR/$SNAPSHOT_ARG" ]; then
    SNAPSHOT_PATH="$PROJECT_DIR/$SNAPSHOT_ARG"
  elif [ -f "$PROJECT_DIR/dbsnapshots/$SNAPSHOT_ARG" ]; then
    SNAPSHOT_PATH="$PROJECT_DIR/dbsnapshots/$SNAPSHOT_ARG"
  else
    echo "Error: Snapshot not found: $SNAPSHOT_ARG"
    exit 1
  fi
else
  ENV_FILE="$PROJECT_DIR/.env"
  if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env not found. Set DATABASE_URL for local Postgres."
    exit 1
  fi
  DATABASE_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
  if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL missing in .env"
    exit 1
  fi

  SNAPSHOT_DIR="$PROJECT_DIR/dbsnapshots"
  mkdir -p "$SNAPSHOT_DIR"
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  SNAPSHOT_PATH="$SNAPSHOT_DIR/snapshot_${TIMESTAMP}.sql"

  echo "Dumping local database..."
  echo "  Source: ${DATABASE_URL/@*@/@****@}"
  pg_dump --dbname="$DATABASE_URL" -f "$SNAPSHOT_PATH"
  echo "✓ Local snapshot: $SNAPSHOT_PATH"
fi

# Strip PG17+ settings that Postgres 16 (production) does not recognize
if [[ "$SNAPSHOT_PATH" != *_prod.sql ]]; then
  CLEAN_SNAPSHOT="${SNAPSHOT_PATH%.sql}_prod.sql"
  grep -v -E '^(SET transaction_timeout|SET idle_in_transaction_session_timeout)' "$SNAPSHOT_PATH" > "$CLEAN_SNAPSHOT"
  SNAPSHOT_PATH="$CLEAN_SNAPSHOT"
fi

if [ ! -f "$SNAPSHOT_PATH" ]; then
  echo "Error: Snapshot file not found: $SNAPSHOT_PATH"
  exit 1
fi

echo "--------------------------------------------------------"
echo "Target: ubuntu@$IP (production)"
echo "Snapshot: $SNAPSHOT_PATH ($(du -sh "$SNAPSHOT_PATH" | cut -f1))"
echo "--------------------------------------------------------"
echo "WARNING: This REPLACES the entire production database."

if [ "$SKIP_CONFIRM" -eq 0 ]; then
  read -r -p "Type 'yes' to continue: " CONFIRM
  if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 1
  fi
fi

REMOTE_SNAPSHOT="/home/ubuntu/push-db-snapshot.sql"
echo "Uploading snapshot..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SNAPSHOT_PATH" "ubuntu@$IP:$REMOTE_SNAPSHOT"

echo "Restoring on production (stopping app container)..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "ubuntu@$IP" \
  SKIP_BACKUP="$SKIP_BACKUP" PROD_BACKUP_KEEP="$PROD_BACKUP_KEEP" bash -s <<'REMOTE'
set -e
cd /home/ubuntu/app

# Read DB name from remote .env (defaults match docker-compose.yml)
DB_NAME="blockvibe-multitenant"
if [ -f .env ]; then
  ENV_DB_NAME=$(grep -E '^DB_NAME=' .env | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
  if [ -n "$ENV_DB_NAME" ]; then
    DB_NAME="$ENV_DB_NAME"
  fi
fi

sudo docker compose stop payload

if [ "${SKIP_BACKUP:-0}" -eq 0 ]; then
  BACKUP_DIR="/home/ubuntu/backups"
  BACKUP_FILE="$BACKUP_DIR/pre-push-$(date +%Y%m%d-%H%M%S).sql"
  mkdir -p "$BACKUP_DIR"

  echo "Backing up production database before restore..."
  sudo docker compose exec -T db pg_dump -U postgres -d "$DB_NAME" > "$BACKUP_FILE"

  if [ ! -s "$BACKUP_FILE" ]; then
    echo "Error: Production backup failed or is empty: $BACKUP_FILE"
    sudo docker compose start payload
    exit 1
  fi

  echo "✓ Production backup: $BACKUP_FILE ($(du -sh "$BACKUP_FILE" | cut -f1))"

  # Keep the newest N backups
  KEEP="${PROD_BACKUP_KEEP:-7}"
  ls -1t "$BACKUP_DIR"/pre-push-*.sql 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f
else
  echo "WARNING: Skipping production backup (--no-backup)."
fi

echo "Recreating public schema on production..."
sudo docker compose exec -T db psql -U postgres -d "$DB_NAME" -v ON_ERROR_STOP=1 <<'SQL'
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
SQL

echo "Loading snapshot..."
sudo docker compose exec -T db psql -U postgres -d "$DB_NAME" -v ON_ERROR_STOP=1 < /home/ubuntu/push-db-snapshot.sql

rm -f /home/ubuntu/push-db-snapshot.sql

sudo docker compose start payload
echo "✓ Production database restored."
REMOTE

if [ "$SKIP_MEDIA" -eq 0 ] && [ -d "$PROJECT_DIR/public/media" ]; then
  echo "Syncing local media to production..."
  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "ubuntu@$IP" \
    "sudo mkdir -p /var/www/blockvibe/media && sudo chown -R 1001:1001 /var/www/blockvibe/media"
  rsync -avz --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r \
    -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    "$PROJECT_DIR/public/media/" \
    "ubuntu@$IP:/var/www/blockvibe/media/"
  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "ubuntu@$IP" \
    "sudo chown -R 1001:1001 /var/www/blockvibe/media && sudo chmod -R a+rX /var/www/blockvibe/media"
  echo "✓ Media sync complete."
else
  echo "Skipped media sync."
fi

DOMAIN=$(terraform output -raw domain_url 2>/dev/null | sed 's|https://||' || echo "$IP")
echo "--------------------------------------------------------"
echo "Production database updated from local."
echo "Pre-restore backups (if any): ubuntu@$IP:/home/ubuntu/backups/pre-push-*.sql"
echo "Visit: https://$DOMAIN"
echo "Tip: run ./infra/deploy.sh if application code also changed."
echo "--------------------------------------------------------"

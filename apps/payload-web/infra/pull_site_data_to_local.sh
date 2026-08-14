#!/bin/bash
set -e

# pull_site_data_to_local.sh
# Pull site structure, pages, posts, categories, headers, footers, media metadata,
# and media assets from production into local development environment.
# EXCLUDES sensitive data: users, memberships, invites, crm fields, mailing lists, form submissions, emails.

INFRA_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$( dirname "$INFRA_DIR" )"

cd "$INFRA_DIR"

IP=$(terraform output -raw instance_public_ip 2>/dev/null || echo "")
if [ -z "$IP" ]; then
  echo "Error: Could not retrieve instance_public_ip from terraform outputs."
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

SNAPSHOT_DIR="$PROJECT_DIR/dbsnapshots/prod"
mkdir -p "$SNAPSHOT_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOCAL_PATH="$SNAPSHOT_DIR/site_data_${TIMESTAMP}.sql"
REMOTE_PATH="/home/ubuntu/site_data_${TIMESTAMP}.sql"

echo "========================================================"
echo "Pulling Site Data from Production (ubuntu@$IP)"
echo "Excluding: users, memberships, invites, CRM, mailing lists, form submissions"
echo "========================================================"

EXCLUDE_FLAGS=(
  "--exclude-table-data=users"
  "--exclude-table-data=users_sessions"
  "--exclude-table-data=users_tenants"
  "--exclude-table-data=memberships"
  "--exclude-table-data=invites"
  "--exclude-table-data=crm_fields"
  "--exclude-table-data=crm_fields_options"
  "--exclude-table-data=mailing_lists"
  "--exclude-table-data=mailing_lists_rels"
  "--exclude-table-data=broadcasts"
  "--exclude-table-data=form_submissions"
  "--exclude-table-data=form_submissions_submission_data"
  "--exclude-table-data=tenant_email_quotas"
  "--exclude-table-data=sent_emails"
  "--exclude-table-data=payload_locked_documents"
  "--exclude-table-data=payload_locked_documents_rels"
  "--exclude-table-data=payload_preferences"
  "--exclude-table-data=payload_preferences_rels"
)

EXCLUDE_ARGS="${EXCLUDE_FLAGS[*]}"

echo "Step 1/3: Taking sanitized database snapshot on production EC2..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "ubuntu@$IP" \
  REMOTE_PATH="$REMOTE_PATH" EXCLUDE_ARGS="$EXCLUDE_ARGS" bash -s <<'REMOTE'
set -e
cd /home/ubuntu/app

DB_NAME="blockvibe-multitenant"
if [ -f .env ]; then
  ENV_DB_NAME=$(grep -E '^DB_NAME=' .env | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
  if [ -n "$ENV_DB_NAME" ]; then
    DB_NAME="$ENV_DB_NAME"
  fi
fi

echo "Running pg_dump excluding sensitive tables..."
sudo docker compose exec -T db pg_dump -U postgres -d "$DB_NAME" $EXCLUDE_ARGS > "$REMOTE_PATH"

if [ ! -s "$REMOTE_PATH" ]; then
  echo "Error: Snapshot failed or is empty."
  rm -f "$REMOTE_PATH"
  exit 1
fi
echo "✓ Remote snapshot created: $REMOTE_PATH ($(du -sh "$REMOTE_PATH" | cut -f1))"
REMOTE

echo ""
echo "Step 2/3: Downloading snapshot file..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "ubuntu@$IP:$REMOTE_PATH" "$LOCAL_PATH"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "ubuntu@$IP" "rm -f $REMOTE_PATH"

echo "✓ Saved snapshot to: $LOCAL_PATH"

echo ""
echo "Step 3/3: Syncing media assets to local public/media..."
mkdir -p "$PROJECT_DIR/public/media"
rsync -avz --progress \
  -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
  "ubuntu@$IP:/var/www/blockvibe/media/" \
  "$PROJECT_DIR/public/media/" || echo "Warning: Media sync completed with non-fatal notices."

echo ""
echo "Restoring snapshot into local Postgres database..."
POSTGRES_CONTAINER=$(docker ps --format '{{.Names}}' | grep postgres | head -1 || echo "")

if [ -n "$POSTGRES_CONTAINER" ]; then
  # Determine DB name locally
  LOCAL_DB="blockvibe-multitenant"
  docker exec -i "$POSTGRES_CONTAINER" psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS \"$LOCAL_DB\";" >/dev/null 2>&1 || true
  docker exec -i "$POSTGRES_CONTAINER" psql -U postgres -d postgres -c "CREATE DATABASE \"$LOCAL_DB\";" >/dev/null 2>&1
  docker exec -i "$POSTGRES_CONTAINER" psql -U postgres -d "$LOCAL_DB" < "$LOCAL_PATH" >/dev/null
  echo "✓ Successfully restored site data to local database '$LOCAL_DB'!"
else
  echo "Notice: Local Postgres docker container not running. You can restore manually using:"
  echo "  pnpm tsx src/scripts/restore_local_db.ts $LOCAL_PATH"
fi

echo ""
echo "========================================================"
echo "✓ All Done! Site structures, pages, posts, and media synced to local."
echo "========================================================"

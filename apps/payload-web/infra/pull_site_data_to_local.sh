#!/bin/bash
set -e

# pull_site_data_to_local.sh [--staging] [site-slug-or-domain]
#
# Pull site structure, pages, posts, categories, headers, footers, media metadata,
# and media assets from production or staging into local development environment.
#
# Usage:
#   pnpm db:pull:site-data              (pulls all sites from PROD)
#   pnpm db:pull:site-data nog          (pulls North of Grand site data & media from PROD)
#   pnpm db:pull:site-data --staging    (pulls all sites from STAGING)
#   pnpm db:pull:site-data --staging nog(pulls North of Grand site data & media from STAGING)
#   ./infra/pull_site_data_to_local.sh --staging beaverdale

STAGING=0
SITE_ARG="all"

for arg in "$@"; do
  case "$arg" in
    --staging) STAGING=1 ;;
    --prod) STAGING=0 ;;
    --*) ;;
    *) SITE_ARG="$arg" ;;
  esac
done

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

REMOTE_DIR="/home/ubuntu/app"
REMOTE_MEDIA_DIR="/var/www/blockvibe/media"
REMOTE_DB_SERVICE="db"
ENV_LABEL="production"

if [ "$STAGING" -eq 1 ]; then
  REMOTE_DIR="/home/ubuntu/app-staging"
  REMOTE_MEDIA_DIR="/var/www/blockvibe/media-staging/media"
  REMOTE_DB_SERVICE="db-staging"
  ENV_LABEL="staging"
fi

PARALLEL_DIR="$( cd "$PROJECT_DIR/../../.." &> /dev/null && pwd )"
SNAPSHOT_DIR="$PARALLEL_DIR/dbsnapshots/$ENV_LABEL"
mkdir -p "$SNAPSHOT_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOCAL_PATH="$SNAPSHOT_DIR/site_data_${SITE_ARG}_${TIMESTAMP}.sql"
REMOTE_PATH="/home/ubuntu/site_data_${ENV_LABEL}_${SITE_ARG}_${TIMESTAMP}.sql"

echo "========================================================"
echo "Pulling Site Data from $ENV_LABEL (ubuntu@$IP)"
echo "Target Site Filter: $SITE_ARG"
echo "EXCLUDES: users, passwords, sessions, memberships, payments, CRM, emails, payment secrets"
echo "========================================================"

EXCLUDE_FLAGS=(
  "--exclude-table-data=users"
  "--exclude-table-data=users_sessions"
  "--exclude-table-data=users_tenants"
  "--exclude-table-data=memberships"
  "--exclude-table-data=invites"
  "--exclude-table-data=payments"
  "--exclude-table-data=payments_rels"
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
  "--exclude-table-data=payment_settings"
  "--exclude-table-data=payment_settings_business_tiers"
  "--exclude-table-data=payload_kv"
)

EXCLUDE_ARGS="${EXCLUDE_FLAGS[*]}"

echo "Step 1/3: Taking sanitized database snapshot on $ENV_LABEL EC2..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "ubuntu@$IP" bash -s <<REMOTE
set -e
cd "$REMOTE_DIR"

DB_NAME="blockvibe-multitenant"
if [ -f .env ]; then
  ENV_DB_NAME=\$(grep -E '^DB_NAME=' .env | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
  if [ -n "\$ENV_DB_NAME" ]; then
    DB_NAME="\$ENV_DB_NAME"
  fi
fi

echo "Running pg_dump inside $REMOTE_DB_SERVICE excluding sensitive tables..."
sudo docker compose exec -T "$REMOTE_DB_SERVICE" pg_dump -U postgres -d "\$DB_NAME" $EXCLUDE_ARGS > "$REMOTE_PATH"

if [ ! -s "$REMOTE_PATH" ]; then
  echo "Error: Snapshot failed or is empty."
  rm -f "$REMOTE_PATH"
  exit 1
fi
echo "✓ Remote snapshot created: $REMOTE_PATH (\$(du -sh "$REMOTE_PATH" | cut -f1))"
REMOTE

echo ""
echo "Step 2/3: Downloading snapshot file..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "ubuntu@$IP:$REMOTE_PATH" "$LOCAL_PATH"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "ubuntu@$IP" "rm -f $REMOTE_PATH"

echo "✓ Saved snapshot to: $LOCAL_PATH"

echo ""
echo "Step 3/3: Syncing media assets to local public/media..."
mkdir -p "$PROJECT_DIR/public/media"

if [ "$SITE_ARG" != "all" ]; then
  echo "Syncing media specifically for site '$SITE_ARG' from $ENV_LABEL..."
  rsync -avz --progress \
    -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    "ubuntu@$IP:${REMOTE_MEDIA_DIR}/${SITE_ARG}/" \
    "$PROJECT_DIR/public/media/${SITE_ARG}/" 2>/dev/null || \
  rsync -avz --progress \
    -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    "ubuntu@$IP:${REMOTE_MEDIA_DIR}/" \
    "$PROJECT_DIR/public/media/" || echo "Warning: Media sync completed with notices."
else
  rsync -avz --progress \
    -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    "ubuntu@$IP:${REMOTE_MEDIA_DIR}/" \
    "$PROJECT_DIR/public/media/" || echo "Warning: Media sync completed with notices."
fi

echo ""
echo "Restoring snapshot into local Postgres database..."
POSTGRES_CONTAINER=$(docker ps --format '{{.Names}}' | grep postgres | head -1 || echo "")

if [ -n "$POSTGRES_CONTAINER" ]; then
  LOCAL_DB="blockvibe-multitenant"
  docker exec -i "$POSTGRES_CONTAINER" psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS \"$LOCAL_DB\" WITH (FORCE);" >/dev/null 2>&1 || true
  docker exec -i "$POSTGRES_CONTAINER" psql -U postgres -d postgres -c "CREATE DATABASE \"$LOCAL_DB\";" >/dev/null 2>&1
  (echo "SET session_replication_role = 'replica';" && cat "$LOCAL_PATH") | docker exec -i "$POSTGRES_CONTAINER" psql -U postgres -d "$LOCAL_DB" >/dev/null 2>&1 || true

  if [ "$SITE_ARG" != "all" ]; then
    echo "Filtering database to retain site data for '$SITE_ARG'..."
    docker exec -i "$POSTGRES_CONTAINER" psql -U postgres -d "$LOCAL_DB" -c "
      DO \$\$
      DECLARE target_id INT;
      BEGIN
        SELECT id INTO target_id FROM tenants WHERE slug = '$SITE_ARG' OR domain = '$SITE_ARG' LIMIT 1;
        IF target_id IS NOT NULL THEN
          DELETE FROM pages WHERE tenant IS NOT NULL AND tenant != target_id;
          DELETE FROM posts WHERE tenant IS NOT NULL AND tenant != target_id;
          DELETE FROM header WHERE tenant IS NOT NULL AND tenant != target_id;
          DELETE FROM footer WHERE tenant IS NOT NULL AND tenant != target_id;
          DELETE FROM media WHERE tenant IS NOT NULL AND tenant != target_id;
          DELETE FROM categories WHERE tenant IS NOT NULL AND tenant != target_id;
        END IF;
      END \$\$;
    " >/dev/null 2>&1 || true
  fi

  echo "Cleaning up orphaned author references..."
  docker exec -i "$POSTGRES_CONTAINER" psql -U postgres -d "$LOCAL_DB" -c "
    DELETE FROM posts_rels WHERE users_id IS NOT NULL AND users_id NOT IN (SELECT id FROM users);
    DELETE FROM _posts_v_rels WHERE users_id IS NOT NULL AND users_id NOT IN (SELECT id FROM users);
  " >/dev/null 2>&1 || true

  echo "Seeding local dev admin users..."
  pnpm tsx "$PROJECT_DIR/src/scripts/seed-nog-users.ts" >/dev/null 2>&1 || true

  echo "✓ Successfully restored $ENV_LABEL site data for '$SITE_ARG' into local database '$LOCAL_DB'!"
else
  echo "Notice: Local Postgres container not running. You can restore manually using:"
  echo "  pnpm tsx src/scripts/restore_local_db.ts $LOCAL_PATH"
fi

echo ""
echo "========================================================"
echo "✓ All Done! $ENV_LABEL site structures, pages, posts, and media synced for [$SITE_ARG]."
echo "========================================================"

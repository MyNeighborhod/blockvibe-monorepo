#!/bin/bash
# Apply NOG tenant email/domain settings on remote staging or production Postgres.
# Usage: ./infra/configure-remote-tenant-email.sh --staging
#        ./infra/configure-remote-tenant-email.sh --production

set -e

STAGING=0
PRODUCTION=0
for arg in "$@"; do
  case "$arg" in
    --staging) STAGING=1 ;;
    --production) PRODUCTION=1 ;;
  esac
done

if [ "$STAGING" -eq 1 ]; then
  ENV_LABEL="staging"
  REMOTE_DIR="/home/ubuntu/app-staging"
  DB_SERVICE="db-staging"
  COMPOSE_FILE="docker-compose.staging.yml"
  DB_NAME="blockvibe-staging"
  DOMAIN="nog.staging.blockvibe.org"
  FROM_EMAIL="${TENANT_NOG_TRANSACTIONAL_EMAIL_FROM:-info@blockvibe.org}"
  FROM_NAME="${TENANT_NOG_TRANSACTIONAL_EMAIL_FROM_NAME:-BlockVibe — North of Grand (Staging)}"
elif [ "$PRODUCTION" -eq 1 ]; then
  ENV_LABEL="production"
  REMOTE_DIR="/home/ubuntu/app"
  DB_SERVICE="db"
  COMPOSE_FILE="docker-compose.yml"
  DB_NAME="blockvibe-multitenant"
  DOMAIN="www.northofgranddsm.org"
  FROM_EMAIL="${TENANT_NOG_TRANSACTIONAL_EMAIL_FROM:-northofgrandpresident@northofgranddsm.org}"
  FROM_NAME="${TENANT_NOG_TRANSACTIONAL_EMAIL_FROM_NAME:-North of Grand Neighborhood Association}"
else
  echo "Pass --staging or --production"
  exit 1
fi

INFRA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
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

echo "Configuring NOG tenant email on $ENV_LABEL ($IP)..."
echo "  domain=$DOMAIN"
echo "  from=$FROM_EMAIL"

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "ubuntu@$IP" \
  "REMOTE_DIR='$REMOTE_DIR' DB_SERVICE='$DB_SERVICE' COMPOSE_FILE='$COMPOSE_FILE' DB_NAME='$DB_NAME' DOMAIN='$DOMAIN' FROM_EMAIL='$FROM_EMAIL' FROM_NAME='$FROM_NAME' bash -s" <<'REMOTE'
set -e
cd "$REMOTE_DIR"

sudo docker compose -f "$COMPOSE_FILE" exec -T "$DB_SERVICE" psql -U postgres -d "$DB_NAME" -v ON_ERROR_STOP=1 <<SQL
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS transactional_email_from character varying;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS transactional_email_from_name character varying;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS organization_legal_name text;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is501c3 boolean DEFAULT false;

UPDATE tenants SET
  domain = '${DOMAIN}',
  organization_legal_name = COALESCE(organization_legal_name, 'North of Grand Neighborhood Association'),
  is501c3 = COALESCE(is501c3, true),
  transactional_email_from = '${FROM_EMAIL}',
  transactional_email_from_name = '${FROM_NAME}',
  email_delivery_default = COALESCE(email_delivery_default, 'ses'::enum_tenants_email_delivery_default)
WHERE slug = 'nog';

SELECT slug, domain, transactional_email_from, transactional_email_from_name
FROM tenants WHERE slug = 'nog';
SQL
REMOTE

echo "✓ NOG tenant email configured on $ENV_LABEL."

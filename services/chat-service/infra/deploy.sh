#!/bin/bash
set -e

# Deploy the chat-service Lambda and API Gateway with AWS CDK.
#
# Usage:
#   ./infra/deploy.sh              # dev stage, env from services/chat-service/.env
#   ./infra/deploy.sh --staging    # staging, env from apps/payload-web/.env.staging
#   ./infra/deploy.sh --prod       # prod, env from apps/payload-web/.env.production
#

STAGE="dev"
ENV_LABEL="dev"
ENV_SOURCE=""

for arg in "$@"; do
  case "$arg" in
    --staging) STAGE="staging"; ENV_LABEL="Staging" ;;
    --prod) STAGE="prod"; ENV_LABEL="Production" ;;
    --dev) STAGE="dev"; ENV_LABEL="Dev" ;;
  esac
done

INFRA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_DIR="$(dirname "$INFRA_DIR")"
MONOREPO_ROOT="$(cd "$SERVICE_DIR/../.." && pwd)"
PAYLOAD_WEB_DIR="$MONOREPO_ROOT/apps/payload-web"

case "$STAGE" in
  prod)
    ENV_SOURCE="$PAYLOAD_WEB_DIR/.env.production"
    ;;
  staging)
    ENV_SOURCE="$PAYLOAD_WEB_DIR/.env.staging"
    ;;
  *)
    ENV_SOURCE="$SERVICE_DIR/.env"
    if [ ! -f "$ENV_SOURCE" ]; then
      ENV_SOURCE="$PAYLOAD_WEB_DIR/.env"
    fi
    ;;
esac

if [ ! -f "$ENV_SOURCE" ]; then
  echo "Error: Environment file not found: $ENV_SOURCE"
  exit 1
fi

echo "--------------------------------------------------------"
echo "Deploying chat-service ($ENV_LABEL / stage=$STAGE)"
echo "Env file: $ENV_SOURCE"
echo "Region: ${CDK_DEFAULT_REGION:-${AWS_REGION:-us-east-1}}"
echo "--------------------------------------------------------"

set -a
# shellcheck disable=SC1090
source "$ENV_SOURCE"
set +a

if [ -z "$CHAT_SERVICE_SIGNING_SECRET" ]; then
  if [ -n "$PAYLOAD_SECRET" ]; then
    echo "CHAT_SERVICE_SIGNING_SECRET not set; using PAYLOAD_SECRET from env file."
    export CHAT_SERVICE_SIGNING_SECRET="$PAYLOAD_SECRET"
  else
    echo "Error: CHAT_SERVICE_SIGNING_SECRET missing in $ENV_SOURCE"
    exit 1
  fi
fi

cd "$MONOREPO_ROOT"
echo "Building chat-service..."
pnpm chat-service:build

cd "$INFRA_DIR"
echo "Running CDK deploy..."
pnpm exec cdk deploy --all -c "stage=$STAGE" --require-approval never

echo "--------------------------------------------------------"
echo "Chat Service API deployed successfully!"
echo "--------------------------------------------------------"

#!/bin/bash
set -e

# Zero-Downtime Blue-Green Deployment Script for BlockVibe Production
# Usage: ./infra/deploy-zero-downtime.sh [--skip-media]

SKIP_MEDIA=0
for arg in "$@"; do
  case "$arg" in
    --skip-media) SKIP_MEDIA=1 ;;
  esac
done

INFRA_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$( dirname "$INFRA_DIR" )"

cd "$INFRA_DIR"

echo "Fetching server IP from Terraform..."
IP=$(terraform output -raw instance_public_ip 2>/dev/null || echo "")

if [ -z "$IP" ] || [[ "$IP" == *"No outputs found"* ]] || [[ "$IP" == *"not found"* ]]; then
  echo "Error: Could not retrieve instance_public_ip from terraform outputs."
  exit 1
fi

SSH_KEY="$HOME/.ssh/blockvibe_id_rsa"
if [ ! -f "$SSH_KEY" ]; then
  SSH_KEY="$INFRA_DIR/id_rsa"
fi

IMAGE_TAG="latest"
ARCHIVE_NAME="app.tar.gz"
REMOTE_DIR="/home/ubuntu/app"
REMOTE_MEDIA_DIR="/var/www/blockvibe/media"
ENV_SOURCE=".env.production"
COMPOSE_SOURCE="docker-compose.yml"

echo "--------------------------------------------------------"
echo "Zero-Downtime Deployment Target: $IP"
echo "Using SSH Key: $SSH_KEY"
echo "--------------------------------------------------------"

# Build application Docker container locally
cd "$PROJECT_DIR/../.."
echo "Building Docker image locally for linux/amd64 (tag: $IMAGE_TAG)..."

BUILD_SERVER_URL=""
if [ -f "$PROJECT_DIR/$ENV_SOURCE" ]; then
  BUILD_SERVER_URL=$(grep -E '^NEXT_PUBLIC_SERVER_URL=' "$PROJECT_DIR/$ENV_SOURCE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
fi

docker build --platform linux/amd64 --pull=false \
  ${BUILD_SERVER_URL:+--build-arg NEXT_PUBLIC_SERVER_URL="$BUILD_SERVER_URL"} \
  -t blockvibe-app:$IMAGE_TAG -f apps/payload-web/Dockerfile .

echo "Saving and compressing Docker image..."
docker save blockvibe-app:$IMAGE_TAG | gzip > $ARCHIVE_NAME
echo "✓ Image compressed successfully. Size:" $(du -sh $ARCHIVE_NAME | cut -f1)

# Upload files to EC2
echo "Uploading files to EC2..."
ssh -i "$SSH_KEY" ubuntu@$IP "mkdir -p $REMOTE_DIR && sudo mkdir -p $REMOTE_MEDIA_DIR && sudo chown -R 1001:1001 $REMOTE_MEDIA_DIR"
scp -i "$SSH_KEY" "$PROJECT_DIR/$COMPOSE_SOURCE" ubuntu@$IP:$REMOTE_DIR/docker-compose.yml
scp -i "$SSH_KEY" "$PROJECT_DIR/$ENV_SOURCE" ubuntu@$IP:$REMOTE_DIR/.env

if [ "$SKIP_MEDIA" -eq 0 ] && [ -d "$PROJECT_DIR/public/media" ]; then
  echo "Syncing media files to EC2..."
  rsync -avz --rsync-path="sudo rsync" --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r \
    -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    "$PROJECT_DIR/public/media/" \
    "ubuntu@$IP:$REMOTE_MEDIA_DIR/"
fi

echo "Uploading Docker archive..."
scp -i "$SSH_KEY" $ARCHIVE_NAME ubuntu@$IP:/home/ubuntu/$ARCHIVE_NAME
rm $ARCHIVE_NAME

# Execute Blue-Green hot-swap on remote server
echo "Executing Blue-Green hot-swap on remote EC2 instance..."
ssh -i "$SSH_KEY" ubuntu@$IP "
  sudo docker load -i /home/ubuntu/$ARCHIVE_NAME && rm /home/ubuntu/$ARCHIVE_NAME
  cd $REMOTE_DIR

  # Ensure database container is running
  sudo docker compose up -d db

  # Detect active port in current Caddyfile
  ACTIVE_PORT=3000
  if sudo grep -q '127.0.0.1:3000' /etc/caddy/Caddyfile 2>/dev/null; then
    ACTIVE_PORT=3000
    NEW_SERVICE=\"payload_green\"
    NEW_PORT=3001
    OLD_SERVICE=\"payload_blue\"
  else
    ACTIVE_PORT=3001
    NEW_SERVICE=\"payload_blue\"
    NEW_PORT=3000
    OLD_SERVICE=\"payload_green\"
  fi

  echo \"Current active port: \$ACTIVE_PORT. Starting target service \$NEW_SERVICE on port \$NEW_PORT...\"
  sudo docker compose up -d \$NEW_SERVICE

  # Poll health check until HTTP 200 OK
  echo \"Warming up Next.js on port \$NEW_PORT...\"
  for i in \$(seq 1 30); do
    STATUS=\$(curl -s -o /null -w '%{http_code}' http://127.0.0.1:\$NEW_PORT/ || true)
    if [ \"\$STATUS\" -eq 200 ] || [ \"\$STATUS\" -eq 302 ]; then
      echo \"✓ New instance on port \$NEW_PORT is healthy (HTTP \$STATUS)!\"
      break
    fi
    sleep 1
  done

  # Hot-swap Caddy upstream target
  echo \"Hot-swapping Caddy upstream to port \$NEW_PORT...\"
  sudo sed -i \"s/127.0.0.1:\$ACTIVE_PORT/127.0.0.1:\$NEW_PORT/g\" /etc/caddy/Caddyfile
  sudo systemctl reload caddy

  echo \"✓ Traffic hot-swapped! Stopping previous instance \$OLD_SERVICE...\"
  sudo docker compose stop \$OLD_SERVICE
"

DOMAIN=$(cd "$INFRA_DIR" && terraform output -raw domain_url 2>/dev/null | sed -E 's|https?://||' || echo "$IP")
echo "--------------------------------------------------------"
echo "Zero-Downtime Production Deployment successful! Visit: https://$DOMAIN"
echo "--------------------------------------------------------"

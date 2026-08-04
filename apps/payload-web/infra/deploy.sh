#!/bin/bash
set -e

# BlockVibe Multi-Tenant Web Application Automated Deployment Script
# Usage: ./infra/deploy.sh [--staging] [--skip-media]

STAGING=0
SKIP_MEDIA=0

for arg in "$@"; do
  case "$arg" in
    --staging) STAGING=1 ;;
    --skip-media) SKIP_MEDIA=1 ;;
  esac
done

INFRA_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$( dirname "$INFRA_DIR" )"

cd "$INFRA_DIR"

# 1. Obtain EC2 Server Public IP via Terraform
echo "Fetching server IP from Terraform..."
IP=$(terraform output -raw instance_public_ip 2>/dev/null || echo "")

if [ -z "$IP" ] || [[ "$IP" == *"No outputs found"* ]] || [[ "$IP" == *"not found"* ]]; then
  echo "Error: Could not retrieve instance_public_ip from terraform outputs."
  echo "Ensure terraform has been applied: cd infra && terraform apply"
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

if [ "$STAGING" -eq 1 ]; then
  IMAGE_TAG="staging"
  ARCHIVE_NAME="app-staging.tar.gz"
  REMOTE_DIR="/home/ubuntu/app-staging"
  REMOTE_MEDIA_DIR="/var/www/blockvibe/media-staging/media"
  ENV_SOURCE=".env.staging"
  COMPOSE_SOURCE="docker-compose.staging.yml"
fi

echo "--------------------------------------------------------"
echo "Deployment Target: $IP (${STAGING:+STAGING}${STAGING:-PRODUCTION})"
echo "Using SSH Key: $SSH_KEY"
echo "--------------------------------------------------------"

# 2. Build application Docker container locally
cd "$PROJECT_DIR/../.."
echo "Building Docker image locally for linux/amd64 (tag: $IMAGE_TAG)..."

BUILD_SERVER_URL=""
if [ -f "$PROJECT_DIR/$ENV_SOURCE" ]; then
  BUILD_SERVER_URL=$(grep -E '^NEXT_PUBLIC_SERVER_URL=' "$PROJECT_DIR/$ENV_SOURCE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")
fi

docker build --platform linux/amd64 --pull=false \
  ${BUILD_SERVER_URL:+--build-arg NEXT_PUBLIC_SERVER_URL="$BUILD_SERVER_URL"} \
  -t blockvibe-app:$IMAGE_TAG -f apps/payload-web/Dockerfile .

# 3. Export image to compressed tarball
echo "Saving and compressing Docker image (blockvibe-app:$IMAGE_TAG -> $ARCHIVE_NAME)..."
docker save blockvibe-app:$IMAGE_TAG | gzip > $ARCHIVE_NAME
echo "✓ Image compressed successfully. Size:" $(du -sh $ARCHIVE_NAME | cut -f1)

# 4. Create deployment directory on remote
ssh -i "$SSH_KEY" ubuntu@$IP "mkdir -p $REMOTE_DIR && sudo mkdir -p $REMOTE_MEDIA_DIR && sudo chown -R 1001:1001 $REMOTE_MEDIA_DIR"

# Upload docker-compose config
scp -i "$SSH_KEY" "$PROJECT_DIR/$COMPOSE_SOURCE" ubuntu@$IP:$REMOTE_DIR/$COMPOSE_SOURCE

# Upload Caddy reverse-proxy config (enables HTTPS)
echo "Uploading Caddyfile..."
scp -i "$SSH_KEY" "$INFRA_DIR/Caddyfile" ubuntu@$IP:/tmp/Caddyfile

# Upload environment file if present
if [ -f "$PROJECT_DIR/$ENV_SOURCE" ]; then
  echo "Uploading $ENV_SOURCE as remote .env..."
  scp -i "$SSH_KEY" "$PROJECT_DIR/$ENV_SOURCE" ubuntu@$IP:$REMOTE_DIR/.env
elif [ -f "$PROJECT_DIR/.env" ]; then
  echo "WARNING: $ENV_SOURCE not found. Uploading local .env as remote .env..."
  scp -i "$SSH_KEY" "$PROJECT_DIR/.env" ubuntu@$IP:$REMOTE_DIR/.env
else
  echo "WARNING: No environment file found. You will need to manually create $REMOTE_DIR/.env on the EC2 server."
fi

# Sync uploaded media to the EBS-backed volume (docker-compose mounts over /app/public/media)
if [ "$SKIP_MEDIA" -eq 0 ] && [ -d "$PROJECT_DIR/public/media" ]; then
  echo "Syncing media files to EC2 (public/media -> $REMOTE_MEDIA_DIR)..."
  rsync -avz --rsync-path="sudo rsync" --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r \
    -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    "$PROJECT_DIR/public/media/" \
    "ubuntu@$IP:$REMOTE_MEDIA_DIR/"
  echo "✓ Media sync complete."
elif [ "$SKIP_MEDIA" -eq 1 ]; then
  echo "Skipping media sync (--skip-media)."
else
  echo "WARNING: No public/media directory found locally. Uploaded images will be missing on the server."
fi

# Upload the compressed image tarball
echo "Uploading Docker image archive (this might take a minute)..."
scp -i "$SSH_KEY" $ARCHIVE_NAME ubuntu@$IP:/home/ubuntu/$ARCHIVE_NAME

# Clean up local archive file
rm $ARCHIVE_NAME
echo "✓ Local cleanup complete."

# 5. Prune old images and load image with Blue-Green hot-swap on EC2
echo "Loading image and restarting containers on the remote EC2 instance..."
ssh -i "$SSH_KEY" ubuntu@$IP "
  echo 'Pruning old unused Docker images...' &&
  sudo docker image prune -af 2>/dev/null || true

  echo 'Loading Docker image...' &&
  sudo docker load -i /home/ubuntu/$ARCHIVE_NAME &&
  rm /home/ubuntu/$ARCHIVE_NAME &&
  
  sudo mkdir -p $REMOTE_MEDIA_DIR &&
  sudo chown -R 1001:1001 $REMOTE_MEDIA_DIR &&
  sudo chmod -R a+rX $REMOTE_MEDIA_DIR &&
  cd $REMOTE_DIR &&

  DB_SERVICE=\"db-staging\"
  DEFAULT_PORT=3002
  ALT_PORT=3003

  if [ \"$STAGING\" -eq 0 ]; then
    DB_SERVICE=\"db\"
    DEFAULT_PORT=3000
    ALT_PORT=3001
  fi

  # Stop any legacy non-blue/green standalone container if running
  sudo docker stop app-staging-payload-staging-1 payload_staging 2>/dev/null || true
  sudo docker rm app-staging-payload-staging-1 payload_staging 2>/dev/null || true

  sudo docker compose -f $COMPOSE_SOURCE up -d --remove-orphans \$DB_SERVICE

  ACTIVE_PORT=\$DEFAULT_PORT
  if sudo grep -q \"127.0.0.1:\$DEFAULT_PORT\" /etc/caddy/Caddyfile 2>/dev/null; then
    ACTIVE_PORT=\$DEFAULT_PORT
    NEW_SERVICE=\"payload_green\"
    NEW_PORT=\$ALT_PORT
    OLD_SERVICE=\"payload_blue\"
  else
    ACTIVE_PORT=\$ALT_PORT
    NEW_SERVICE=\"payload_blue\"
    NEW_PORT=\$DEFAULT_PORT
    OLD_SERVICE=\"payload_green\"
  fi

  echo \"Current active port: \$ACTIVE_PORT. Starting \$NEW_SERVICE on port \$NEW_PORT...\"
  sudo docker compose -f $COMPOSE_SOURCE up -d --remove-orphans \$NEW_SERVICE

  echo \"Warming up Next.js on port \$NEW_PORT...\"
  for i in \$(seq 1 30); do
    STATUS=\$(curl -s -o /null -w '%{http_code}' http://127.0.0.1:\$NEW_PORT/ || true)
    if [ \"\$STATUS\" -eq 200 ] || [ \"\$STATUS\" -eq 302 ]; then
      echo \"✓ New instance on port \$NEW_PORT is healthy (HTTP \$STATUS)!\"
      break
    fi
    sleep 1
  done

  echo \"Hot-swapping Caddy upstream to port \$NEW_PORT...\"
  sudo cp /tmp/Caddyfile /etc/caddy/Caddyfile
  if [ \"\$STAGING\" -eq 1 ]; then
    sudo sed -i \"s/127.0.0.1:3002/127.0.0.1:\$NEW_PORT/g\" /etc/caddy/Caddyfile
  else
    sudo sed -i \"s/127.0.0.1:3000/127.0.0.1:\$NEW_PORT/g\" /etc/caddy/Caddyfile
  fi
  sudo systemctl reload caddy

  echo \"✓ Hot-swap complete! Stopping previous service \$OLD_SERVICE...\"
  sudo docker compose -f $COMPOSE_SOURCE stop \$OLD_SERVICE
"

DOMAIN=$(cd "$INFRA_DIR" && terraform output -raw domain_url 2>/dev/null | sed -E 's|https?://||' || echo "$IP")
if [ "$STAGING" -eq 1 ]; then
  DOMAIN="staging.$DOMAIN"
fi

echo "--------------------------------------------------------"
echo "Deployment successful! Visit your app at: https://$DOMAIN"
echo "--------------------------------------------------------"

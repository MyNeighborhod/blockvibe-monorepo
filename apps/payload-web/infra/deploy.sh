#!/bin/bash
set -e

# Usage: ./infra/deploy.sh [--skip-media]
# Media files live on the EC2 EBS volume (not in the Docker image). Use --skip-media for
# code-only deploys when public/media has not changed.
SKIP_MEDIA=0
for arg in "$@"; do
  case "$arg" in
    --skip-media) SKIP_MEDIA=1 ;;
  esac
done

# Get the directory of this script
INFRA_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_DIR="$( dirname "$INFRA_DIR" )"

cd "$INFRA_DIR"

# 1. Retrieve the public IP dynamically from Terraform outputs
echo "Fetching server IP from Terraform..."
IP=$(terraform output -raw instance_public_ip 2>/dev/null || echo "")

if [ -z "$IP" ] || [[ "$IP" == *"No outputs found"* ]] || [[ "$IP" == *"not found"* ]]; then
  echo "Error: Could not retrieve instance_public_ip from terraform outputs."
  echo "Make sure you have run 'terraform apply' first inside the 'infra/' directory."
  exit 1
fi

# 2. Resolve SSH key path
SSH_KEY="$HOME/.ssh/blockvibe_id_rsa"
if [ ! -f "$SSH_KEY" ]; then
  SSH_KEY="$INFRA_DIR/id_rsa"
fi

if [ ! -f "$SSH_KEY" ]; then
  echo "Error: SSH private key not found at $HOME/.ssh/blockvibe_id_rsa or $INFRA_DIR/id_rsa"
  exit 1
fi

echo "--------------------------------------------------------"
echo "Deploying to: $IP"
echo "Using SSH Key: $SSH_KEY"
echo "--------------------------------------------------------"

# 3. Build the application Docker container locally
cd "$PROJECT_DIR/../.."
echo "Building Docker image locally for target platform linux/amd64..."
echo "(This compilation happens inside Docker on your localhost to prevent crashing the weak EC2 instance)"

# Build for linux/amd64 to ensure compatibility with EC2, even if building on Apple Silicon macOS
docker build --platform linux/amd64 -t blockvibe-app:latest -f apps/payload-web/Dockerfile .

# 4. Save and compress Docker image
echo "Saving and compressing Docker image (blockvibe-app:latest -> app.tar.gz)..."
docker save blockvibe-app:latest | gzip > app.tar.gz
echo "✓ Image compressed successfully. Size:" $(du -sh app.tar.gz | cut -f1)

# Preflight: tools required for deploy
for cmd in docker rsync scp ssh; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: '$cmd' is required but not installed."
    exit 1
  fi
done

# 5. Upload files to EC2
echo "Uploading application files to EC2..."
# Create deployment directory on remote
ssh -i "$SSH_KEY" ubuntu@$IP "sudo mkdir -p /var/www/blockvibe/media && sudo chown -R 1001:1001 /var/www/blockvibe/media"

# Upload docker-compose.yml
scp -i "$SSH_KEY" "$PROJECT_DIR/docker-compose.yml" ubuntu@$IP:/home/ubuntu/app/docker-compose.yml

# Upload Caddy reverse-proxy config (enables HTTPS)
echo "Uploading Caddyfile..."
scp -i "$SSH_KEY" "$INFRA_DIR/Caddyfile" ubuntu@$IP:/tmp/Caddyfile

# Upload environment file if present (default to .env.production, fallback to .env)
if [ -f "$PROJECT_DIR/.env.production" ]; then
  echo "Uploading .env.production as remote .env..."
  scp -i "$SSH_KEY" "$PROJECT_DIR/.env.production" ubuntu@$IP:/home/ubuntu/app/.env
elif [ -f "$PROJECT_DIR/.env" ]; then
  echo "WARNING: .env.production not found. Uploading local .env as remote .env..."
  scp -i "$SSH_KEY" "$PROJECT_DIR/.env" ubuntu@$IP:/home/ubuntu/app/.env
else
  echo "WARNING: No .env file found. You will need to manually create /home/ubuntu/app/.env on the EC2 server."
fi

# Sync uploaded media to the EBS-backed volume (docker-compose mounts over /app/public/media)
if [ "$SKIP_MEDIA" -eq 0 ] && [ -d "$PROJECT_DIR/public/media" ]; then
  echo "Syncing media files to EC2 (public/media -> /var/www/blockvibe/media)..."
  rsync -avz --rsync-path="sudo rsync" --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r \
    -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    "$PROJECT_DIR/public/media/" \
    "ubuntu@$IP:/var/www/blockvibe/media/"
  echo "✓ Media sync complete."
elif [ "$SKIP_MEDIA" -eq 1 ]; then
  echo "Skipping media sync (--skip-media)."
else
  echo "WARNING: No public/media directory found locally. Uploaded images will be missing on the server."
fi

# Upload the compressed image tarball (to /home/ubuntu/ to avoid mounting inside the compose volume context)
echo "Uploading Docker image archive (this might take a minute)..."
scp -i "$SSH_KEY" app.tar.gz ubuntu@$IP:/home/ubuntu/app.tar.gz

# Clean up local archive file
rm app.tar.gz
echo "✓ Local cleanup complete."

# 6. Load image and boot containers on EC2
echo "Loading image and restarting containers on the remote EC2 instance..."
ssh -i "$SSH_KEY" ubuntu@$IP "
  echo 'Loading Docker image...' &&
  sudo docker load -i /home/ubuntu/app.tar.gz &&
  rm /home/ubuntu/app.tar.gz &&
  
  sudo mkdir -p /var/www/blockvibe/media &&
  sudo chown -R 1001:1001 /var/www/blockvibe/media &&
  sudo chmod -R a+rX /var/www/blockvibe/media &&
  cd /home/ubuntu/app &&
  echo 'Starting containers via Docker Compose...' &&
  sudo docker compose down &&
  sudo docker compose up -d &&

  echo 'Updating Caddy reverse-proxy...' &&
  sudo cp /tmp/Caddyfile /etc/caddy/Caddyfile &&
  sudo systemctl reload caddy
"

echo "--------------------------------------------------------"
DOMAIN=$(cd "$INFRA_DIR" && terraform output -raw domain_url 2>/dev/null | sed 's|http://||' || echo "$IP")
echo "Deployment successful! Visit your app at: https://$DOMAIN"
echo "--------------------------------------------------------"

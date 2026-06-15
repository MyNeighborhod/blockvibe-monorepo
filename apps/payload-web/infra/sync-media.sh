#!/bin/bash
set -e

# Sync public/media to the production server without a full app redeploy.
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

if [ ! -d "$PROJECT_DIR/public/media" ]; then
  echo "Error: $PROJECT_DIR/public/media does not exist."
  exit 1
fi

echo "Syncing media to ubuntu@$IP:/var/www/blockvibe/media ..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "ubuntu@$IP" "sudo mkdir -p /var/www/blockvibe/media && sudo chown -R 1001:1001 /var/www/blockvibe/media"
rsync -avz --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r \
  -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
  "$PROJECT_DIR/public/media/" \
  "ubuntu@$IP:/var/www/blockvibe/media/"
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "ubuntu@$IP" "sudo chown -R 1001:1001 /var/www/blockvibe/media && sudo chmod -R a+rX /var/www/blockvibe/media"
echo "✓ Media sync complete."

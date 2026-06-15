#!/bin/bash
set -e

# Update and install basic dependencies
apt-get update -y
apt-get install -y apt-transport-https ca-certificates curl software-properties-common gnupg lsb-release

# 1. Setup 4GB Swap Space (Crucial for low memory t3.micro/t3.small instances)
if [ ! -f /swapfile ]; then
  echo "Setting up 4GB Swap Space..."
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "Swap space configured successfully."
else
  echo "Swap space already exists."
fi

# 2. Install Docker
echo "Installing Docker..."
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start and enable Docker service
systemctl start docker
systemctl enable docker
echo "Docker installed and started."

# 3. Install Caddy (handles automatic SSL reverse-proxy)
echo "Installing Caddy..."
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update -y
apt-get install -y caddy

# 4. Create Caddyfile config
# Default configuration reverse-proxies all port 80 (HTTP) traffic to Docker container on 3000.
# The Caddyfile is annotated with instructions on enabling automatic SSL on-demand or using DNS-01.
mkdir -p /var/www/blockvibe/media
chown -R 1001:1001 /var/www/blockvibe/media
chmod -R a+rX /var/www/blockvibe/media

cat << 'EOF' > /etc/caddy/Caddyfile
# Automatic HTTPS via Let's Encrypt (HTTP-01 challenge).
info.blockvibe.org, nog.blockvibe.org, beaverdale.blockvibe.org, oakwood.blockvibe.org, woodland-dsm.blockvibe.org, twin-suns.blockvibe.org {
	handle /media/* {
		root * /var/www/blockvibe
		file_server
	}

	handle {
		reverse_proxy 127.0.0.1:3000
	}
}
EOF

# Restart Caddy to apply config
systemctl restart caddy
echo "Caddy installed and configured."

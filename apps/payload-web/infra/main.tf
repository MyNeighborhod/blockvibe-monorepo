terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.0"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token == "" ? null : var.cloudflare_api_token
}

# --- SSH Key Pair Generation ---
# Generates a key pair dynamically if no pre-existing ssh_key_name is provided.
resource "tls_private_key" "pk" {
  count     = var.ssh_key_name == "" ? 1 : 0
  algorithm = "RSA"
  rsa_bits  = 4096
}

resource "aws_key_pair" "kp" {
  count      = var.ssh_key_name == "" ? 1 : 0
  key_name   = "${var.instance_name}-key"
  public_key = tls_private_key.pk[0].public_key_openssh
}

resource "local_file" "ssh_key" {
  count           = var.ssh_key_name == "" ? 1 : 0
  filename        = "${path.module}/id_rsa"
  content         = tls_private_key.pk[0].private_key_pem
  file_permission = "0600"
}

# --- Networking & Security Group ---
resource "aws_security_group" "web_sg" {
  name        = "${var.instance_name}-sg"
  description = "Security group for blockvibe EC2 web server"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.instance_name}-sg"
  }
}

# --- AMI Lookup (Ubuntu 24.04 LTS AMD64) ---
data "aws_ami" "ubuntu" {
  most_recent = true
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
  owners = ["099720109477"] # Canonical
}

# --- EC2 Instance ---
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type

  # Use generated key pair or user-specified key pair
  key_name = var.ssh_key_name == "" ? aws_key_pair.kp[0].key_name : var.ssh_key_name

  vpc_security_group_ids = [aws_security_group.web_sg.id]

  # Root block device size and performance configuration
  root_block_device {
    volume_size           = var.volume_size
    volume_type           = "gp3"
    delete_on_termination = true
  }

  # Startup provisioning script
  user_data = file("${path.module}/userdata.sh")

  tags = {
    Name = var.instance_name
  }
}

# --- Elastic IP ---
# Allocates a static IP address to the EC2 instance
resource "aws_eip" "lb" {
  instance = aws_instance.web.id
  domain   = "vpc"

  tags = {
    Name = "${var.instance_name}-eip"
  }
}

# --- Cloudflare DNS Configuration ---
# Create an A record pointing the subdomain (e.g., info.blockvibe.org) to the EC2 Elastic IP
resource "cloudflare_record" "subdomain" {
  count   = var.cloudflare_zone_id == "" ? 0 : 1
  zone_id = var.cloudflare_zone_id
  name    = split(".", var.domain_name)[0]
  value   = aws_eip.lb.public_ip
  type    = "A"
  ttl     = 3600
  proxied = false # Let's Encrypt / Caddy handles TLS directly
}

# Create a wildcard A record (e.g., *.blockvibe.org) for multitenant subdomains
resource "cloudflare_record" "wildcard" {
  count   = var.cloudflare_zone_id == "" ? 0 : 1
  zone_id = var.cloudflare_zone_id
  name    = "*"
  value   = aws_eip.lb.public_ip
  type    = "A"
  ttl     = 3600
  proxied = false # Let's Encrypt / Caddy handles TLS directly
}

# Create explicit A records for each configured tenant subdomain in Cloudflare
resource "cloudflare_record" "tenants" {
  for_each = toset(var.cloudflare_zone_id == "" ? [] : var.tenant_subdomains)
  zone_id  = var.cloudflare_zone_id
  name     = each.value
  value    = aws_eip.lb.public_ip
  type     = "A"
  ttl      = 3600
  proxied  = false # Let's Encrypt / Caddy handles TLS directly
}

# --- AWS SES Configuration ---

# We use the domain name of the zone (e.g., blockvibe.org) for SES
locals {
  ses_domain = var.cloudflare_zone_id == "" ? "blockvibe.org" : join(".", slice(split(".", var.domain_name), 1, length(split(".", var.domain_name))))
}

resource "aws_ses_domain_identity" "ses_domain" {
  domain = local.ses_domain
}

resource "aws_ses_domain_dkim" "ses_dkim" {
  domain = aws_ses_domain_identity.ses_domain.domain
}

# Cloudflare CNAME Records for SES DKIM Verification
resource "cloudflare_record" "ses_dkim_record" {
  count   = var.cloudflare_zone_id == "" ? 0 : 3
  zone_id = var.cloudflare_zone_id
  name    = "${aws_ses_domain_dkim.ses_dkim.dkim_tokens[count.index]}._domainkey"
  value   = "${aws_ses_domain_dkim.ses_dkim.dkim_tokens[count.index]}.dkim.amazonses.com"
  type    = "CNAME"
  ttl     = 600
  proxied = false
}

# Custom MAIL FROM domain configuration for better SPF alignment
resource "aws_ses_domain_mail_from" "ses_mail_from" {
  domain           = aws_ses_domain_identity.ses_domain.domain
  mail_from_domain = "mail.${aws_ses_domain_identity.ses_domain.domain}"
}

# Cloudflare SPF Record for custom MAIL FROM domain
resource "cloudflare_record" "ses_spf_mail_from" {
  count   = var.cloudflare_zone_id == "" ? 0 : 1
  zone_id = var.cloudflare_zone_id
  name    = "mail"
  value   = "v=spf1 include:amazonses.com ~all"
  type    = "TXT"
  ttl     = 3600
}

# Cloudflare MX Record for custom MAIL FROM domain (required by SES to receive bounce notifications)
resource "cloudflare_record" "ses_mx_mail_from" {
  count    = var.cloudflare_zone_id == "" ? 0 : 1
  zone_id  = var.cloudflare_zone_id
  name     = "mail"
  value    = "feedback-smtp.${var.aws_region}.amazonses.com"
  type     = "MX"
  priority = 10
  ttl      = 3600
}

# Cloudflare DMARC Record for root domain
resource "cloudflare_record" "ses_dmarc" {
  count   = var.cloudflare_zone_id == "" ? 0 : 1
  zone_id = var.cloudflare_zone_id
  name    = "_dmarc"
  value   = "v=DMARC1; p=none;"
  type    = "TXT"
  ttl     = 3600
}


# --- IAM Credentials for SES SMTP ---
resource "aws_iam_user" "ses_user" {
  name = "${var.instance_name}-ses-smtp-user"
}

resource "aws_iam_user_policy" "ses_policy" {
  name = "${var.instance_name}-ses-send-policy"
  user = aws_iam_user.ses_user.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ses:SendRawEmail"]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_access_key" "ses_key" {
  user = aws_iam_user.ses_user.name
}

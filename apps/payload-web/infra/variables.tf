variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance size (Intel)"
  type        = string
  default     = "t3.micro"
}

variable "volume_size" {
  description = "EBS Root Volume size in GB"
  type        = number
  default     = 20
}

variable "instance_name" {
  description = "Name tag for the EC2 instance"
  type        = string
  default     = "blockvibe-multitenant-prod"
}

variable "ssh_key_name" {
  description = "The name of the pre-existing AWS SSH key pair to use (optional). Leave empty to generate a new key pair."
  type        = string
  default     = ""
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token with DNS Edit permissions. Can also be set via CLOUDFLARE_API_TOKEN environment variable."
  type        = string
  sensitive   = true
  default     = ""
}

variable "cloudflare_zone_id" {
  description = "The Cloudflare Zone ID for blockvibe.org"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "The platform root subdomain to point to the EC2 instance"
  type        = string
  default     = "info.blockvibe.org"
}

variable "tenant_subdomains" {
  description = "List of tenant subdomains to create A records for in Cloudflare"
  type        = list(string)
  default     = ["nog", "beaverdale", "oakwood", "woodland-dsm"]
}

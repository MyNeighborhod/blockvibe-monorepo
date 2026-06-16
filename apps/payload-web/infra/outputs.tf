output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.web.id
}

output "instance_public_ip" {
  description = "Public Elastic IP address of the web server"
  value       = aws_eip.lb.public_ip
}

output "domain_url" {
  description = "Configured URL of the web server"
  value       = "https://${var.domain_name}"
}

output "ses_smtp_username" {
  description = "Access key ID for SES SMTP"
  value       = aws_iam_access_key.ses_key.id
  sensitive   = false
}

output "ses_smtp_password" {
  description = "SMTP password generated from the secret access key (v4)"
  value       = aws_iam_access_key.ses_key.ses_smtp_password_v4
  sensitive   = true
}

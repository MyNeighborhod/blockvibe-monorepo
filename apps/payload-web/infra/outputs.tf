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

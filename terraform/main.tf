# terraform {
#   # Example backend configuration (optional, but highly recommended for team collaboration)
#   # backend "s3" {
#   #   bucket         = "your-terraform-state-bucket-name"
#   #   key            = "app-name/prod/terraform.tfstate"
#   #   region         = "us-east-1"
#   #   encrypt        = true
#   #   dynamodb_table = "your-terraform-state-lock-table"
#   # }
# }

provider "aws" {
  region = var.aws_region
}

# ------------------------------------------------------------------------------
# Variables
# ------------------------------------------------------------------------------
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Application name (used for naming resources)"
  type        = string
  default     = "myapp"
}

variable "app_environment" {
  description = "Application environment (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "List of CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "List of CIDR blocks for private subnets (app & db)"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24"]
}

variable "availability_zones" {
  description = "List of Availability Zones to use"
  type        = list(string)
  # Note: Ensure these AZs are available in your chosen region
  # You can use `data "aws_availability_zones" "available"` to get them dynamically
}

data "aws_availability_zones" "available" {
  state = "available"
}

# Use this if `availability_zones` variable is not explicitly set
locals {
  azs = length(var.availability_zones) > 0 ? var.availability_zones : slice(data.aws_availability_zones.available.names, 0, 2) # Use first 2 available AZs
}

variable "beanstalk_solution_stack_name" {
  description = "Elastic Beanstalk solution stack name (e.g., 64bit Amazon Linux 2 vX.Y.Z running Node.js 18)"
  type        = string
  default     = "64bit Amazon Linux 2 v5.8.0 running Node.js 18" # Check AWS console for latest Node.js stack
}

variable "beanstalk_instance_type" {
  description = "EC2 instance type for Elastic Beanstalk environment"
  type        = string
  default     = "t3.small"
}

variable "beanstalk_app_port" {
  description = "Port your application listens on"
  type        = number
  default     = 3000 # Common for Node.js apps
}

variable "docdb_instance_class" {
  description = "Instance class for DocumentDB instances"
  type        = string
  default     = "db.t3.medium"
}

variable "docdb_instances_count" {
  description = "Number of DocumentDB instances in the cluster"
  type        = number
  default     = 2 # For HA
}

variable "docdb_master_username" {
  description = "Master username for DocumentDB"
  type        = string
  sensitive   = true
}

variable "docdb_master_password" {
  description = "Master password for DocumentDB"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Your application's domain name (e.g., myapp.example.com). Optional."
  type        = string
  default     = ""
}

variable "hosted_zone_id" {
  description = "Route 53 Hosted Zone ID for the domain_name. Optional."
  type        = string
  default     = ""
}

# ------------------------------------------------------------------------------
# VPC
# ------------------------------------------------------------------------------
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0" # Use a recent version

  name = "${var.app_name}-vpc-${var.app_environment}"
  cidr = var.vpc_cidr

  azs             = local.azs
  public_subnets  = var.public_subnet_cidrs
  private_subnets = var.private_subnet_cidrs

  enable_nat_gateway   = true
  single_nat_gateway   = var.docdb_instances_count < 2 # For cost saving in dev with single DB, otherwise use one NAT per AZ
  one_nat_gateway_per_az = var.docdb_instances_count >= 2 # Recommended for HA

  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Terraform   = "true"
    Environment = var.app_environment
    Application = var.app_name
  }
}

# ------------------------------------------------------------------------------
# Security Groups
# ------------------------------------------------------------------------------
resource "aws_security_group" "alb_sg" {
  name        = "${var.app_name}-alb-sg-${var.app_environment}"
  description = "Allow HTTP/HTTPS traffic to ALB"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
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
    Name        = "${var.app_name}-alb-sg-${var.app_environment}"
    Environment = var.app_environment
  }
}

resource "aws_security_group" "app_sg" {
  name        = "${var.app_name}-app-sg-${var.app_environment}"
  description = "Allow traffic from ALB to App instances"
  vpc_id      = module.vpc.vpc_id

  # Traffic from ALB
  ingress {
    from_port       = var.beanstalk_app_port
    to_port         = var.beanstalk_app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  # Allow SSH from a bastion or specific IPs (optional, for debugging)
  # ingress {
  #   from_port   = 22
  #   to_port     = 22
  #   protocol    = "tcp"
  #   cidr_blocks = ["YOUR_IP_ADDRESS/32"] # Replace with your IP
  # }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"] # Allows outbound connections to DB, internet via NAT
  }

  tags = {
    Name        = "${var.app_name}-app-sg-${var.app_environment}"
    Environment = var.app_environment
  }
}

resource "aws_security_group" "docdb_sg" {
  name        = "${var.app_name}-docdb-sg-${var.app_environment}"
  description = "Allow traffic from App to DocumentDB"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 27017 # MongoDB default port
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }

  egress { # Typically not needed for DBs unless they initiate connections
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.app_name}-docdb-sg-${var.app_environment}"
    Environment = var.app_environment
  }
}

# ------------------------------------------------------------------------------
# DocumentDB (MongoDB compatible)
# ------------------------------------------------------------------------------
resource "aws_docdb_subnet_group" "default" {
  name       = "${var.app_name}-docdb-subnet-group-${var.app_environment}"
  subnet_ids = module.vpc.private_subnets # DocumentDB should be in private subnets

  tags = {
    Name        = "${var.app_name}-docdb-subnet-group-${var.app_environment}"
    Environment = var.app_environment
  }
}

resource "aws_docdb_cluster_parameter_group" "default" {
  family      = "docdb4.0" # Or "docdb5.0" - check latest available
  name        = "${var.app_name}-docdb-cluster-pg-${var.app_environment}"
  description = "DocumentDB cluster parameter group for ${var.app_name}"

  parameter {
    name  = "tls"
    value = "disabled" # Set to "enabled" for production and configure your app client
                       # For simplicity in this template, it's disabled.
                       # Enabling TLS requires client-side configuration.
  }

  tags = {
    Name        = "${var.app_name}-docdb-cluster-pg-${var.app_environment}"
    Environment = var.app_environment
  }
}

resource "aws_docdb_cluster" "default" {
  cluster_identifier              = "${var.app_name}-docdb-cluster-${var.app_environment}"
  engine                          = "docdb"
  master_username                 = var.docdb_master_username
  master_password                 = var.docdb_master_password
  db_subnet_group_name            = aws_docdb_subnet_group.default.name
  vpc_security_group_ids          = [aws_security_group.docdb_sg.id]
  skip_final_snapshot             = var.app_environment == "dev" ? true : false # Take snapshot for prod
  db_cluster_parameter_group_name = aws_docdb_cluster_parameter_group.default.name
  backup_retention_period         = var.app_environment == "prod" ? 7 : 1 # Adjust as needed
  preferred_backup_window         = "07:00-09:00"
  storage_encrypted               = true # Recommended
  # engine_version = "4.0.0" # Specify if needed, otherwise uses default for the family

  tags = {
    Name        = "${var.app_name}-docdb-cluster-${var.app_environment}"
    Environment = var.app_environment
  }
}

resource "aws_docdb_cluster_instance" "default" {
  count              = var.docdb_instances_count
  identifier         = "${var.app_name}-docdb-instance-${var.app_environment}-${count.index}"
  cluster_identifier = aws_docdb_cluster.default.id
  instance_class     = var.docdb_instance_class
  # promotion_tier   = count.index == 0 ? 0 : 1 # For controlling reader/writer promotion order

  tags = {
    Name        = "${var.app_name}-docdb-instance-${var.app_environment}-${count.index}"
    Environment = var.app_environment
  }
}

# ------------------------------------------------------------------------------
# Elastic Beanstalk
# ------------------------------------------------------------------------------

# IAM Role for Beanstalk EC2 Instances (Optional: Beanstalk creates one, but this gives more control)
# resource "aws_iam_role" "beanstalk_ec2_role" {
#   name = "${var.app_name}-beanstalk-ec2-role-${var.app_environment}"
#   assume_role_policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Action = "sts:AssumeRole"
#         Effect = "Allow"
#         Principal = {
#           Service = "ec2.amazonaws.com"
#         }
#       }
#     ]
#   })
#   # Attach policies like AWSSecretsManagerReadWrite or specific access to S3, etc.
#   # managed_policy_arns = ["arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier"]
# }

# resource "aws_iam_instance_profile" "beanstalk_ec2_profile" {
#   name = "${var.app_name}-beanstalk-ec2-profile-${var.app_environment}"
#   role = aws_iam_role.beanstalk_ec2_role.name
# }

resource "aws_elastic_beanstalk_application" "default" {
  name        = "${var.app_name}-${var.app_environment}"
  description = "Elastic Beanstalk application for ${var.app_name} (${var.app_environment})"

  tags = {
    Name        = "${var.app_name}-eb-app-${var.app_environment}"
    Environment = var.app_environment
  }
}

# ACM Certificate for HTTPS (Requires domain validation)
resource "aws_acm_certificate" "default" {
  count             = var.domain_name != "" ? 1 : 0
  domain_name       = var.domain_name
  validation_method = "DNS" # Or EMAIL

  # If you have subdomains like www.myapp.example.com, add them here
  # subject_alternative_names = ["www.${var.domain_name}"]

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "${var.app_name}-cert-${var.app_environment}"
    Environment = var.app_environment
  }
}

# DNS Validation records for ACM (if Route 53 is used for DNS)
# You'll need to manually create these records if your DNS is not managed by Route 53
# or if you can't automate it here.
resource "aws_route53_record" "cert_validation" {
  count   = var.domain_name != "" && var.hosted_zone_id != "" && length(aws_acm_certificate.default[0].domain_validation_options) > 0 ? length(aws_acm_certificate.default[0].domain_validation_options) : 0
  zone_id = var.hosted_zone_id
  name    = element(aws_acm_certificate.default[0].domain_validation_options, count.index).resource_record_name
  type    = element(aws_acm_certificate.default[0].domain_validation_options, count.index).resource_record_type
  records = [element(aws_acm_certificate.default[0].domain_validation_options, count.index).resource_record_value]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "default" {
  count                   = var.domain_name != "" && var.hosted_zone_id != "" && length(aws_route53_record.cert_validation) > 0 ? 1 : 0
  certificate_arn         = aws_acm_certificate.default[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
  # depends_on = [aws_route53_record.cert_validation] # Not strictly needed due to implicit dependency
}

resource "aws_elastic_beanstalk_environment" "default" {
  name                = "${var.app_name}-env-${var.app_environment}"
  application         = aws_elastic_beanstalk_application.default.name
  solution_stack_name = var.beanstalk_solution_stack_name
  # tier             = "WebServer" # Default

  # Wait for ACM certificate validation if creating one
  depends_on = [aws_acm_certificate_validation.default]


  setting {
    namespace = "aws:ec2:vpc"
    name      = "VPCId"
    value     = module.vpc.vpc_id
  }
  setting {
    namespace = "aws:ec2:vpc"
    name      = "Subnets" # For EC2 instances
    value     = join(",", module.vpc.private_subnets)
  }
  setting {
    namespace = "aws:ec2:vpc"
    name      = "ELBSubnets" # For Load Balancer
    value     = join(",", module.vpc.public_subnets)
  }

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "InstanceType"
    value     = var.beanstalk_instance_type
  }
  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "EC2KeyName"
    value     = "" # Specify your EC2 KeyPair name if you need SSH access
  }
  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "SecurityGroups"
    value     = aws_security_group.app_sg.id # Attach app security group
  }
  # Optional: if you created a custom instance profile
  # setting {
  #   namespace = "aws:autoscaling:launchconfiguration"
  #   name      = "IamInstanceProfile"
  #   value     = aws_iam_instance_profile.beanstalk_ec2_profile.name
  # }


  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "LoadBalancerType"
    value     = "application"
  }
  setting {
    namespace = "aws:elbv2:loadbalancer"
    name      = "SecurityGroups"
    value     = aws_security_group.alb_sg.id # Attach ALB security group
  }
  setting {
    namespace = "aws:elbv2:loadbalancer"
    name      = "IdleTimeout"
    value     = "300" # seconds
  }

  # HTTPS Listener
  setting {
    namespace = "aws:elbv2:listener:443"
    name      = "Protocol"
    value     = "HTTPS"
  }
  setting {
    namespace = "aws:elbv2:listener:443"
    name      = "SSLCertificateArns"
    value     = var.domain_name != "" && length(aws_acm_certificate_validation.default) > 0 ? aws_acm_certificate.default[0].arn : "" # Conditional based on cert creation
  }
   setting {
    namespace = "aws:elbv2:listener:default" # HTTP listener (often redirects to HTTPS or serves directly)
    name      = "ListenerEnabled"
    value     = "true" # Keep HTTP listener, can redirect later if needed
  }


  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "NODE_ENV"
    value     = var.app_environment == "prod" ? "production" : "development"
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "PORT" # Beanstalk Node.js platform expects app on port 8081 by default, or you can set this
    value     = tostring(var.beanstalk_app_port)
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DB_HOST" # Your application will use this env var
    value     = aws_docdb_cluster.default.endpoint
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DB_PORT"
    value     = tostring(aws_docdb_cluster.default.port)
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DB_USER"
    value     = var.docdb_master_username
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DB_PASS"
    # For production, retrieve from AWS Secrets Manager instead of directly setting here.
    # This is a simplified example.
    value     = var.docdb_master_password
  }
  setting {
    namespace = "aws:elasticbeanstalk:application:environment"
    name      = "DB_NAME"
    value     = "${var.app_name}_db" # Example DB name
  }
  # Add other environment variables your application needs
  # setting {
  #   namespace = "aws:elasticbeanstalk:application:environment"
  #   name      = "API_KEY"
  #   value     = "your_api_key_here_or_from_secrets_manager"
  # }

  # Health check
  setting {
    namespace = "aws:elasticbeanstalk:application"
    name      = "Application Healthcheck URL"
    value     = "/health" # Change to your app's health check endpoint
  }
  setting {
    namespace = "aws:elasticbeanstalk:environment:process:default"
    name      = "HealthCheckPath"
    value     = "/health" # Ensure this matches your app
  }
   setting {
    namespace = "aws:elasticbeanstalk:environment:process:default"
    name      = "Port"
    value     = tostring(var.beanstalk_app_port)
  }


  # For rolling updates
  setting {
    namespace = "aws:elasticbeanstalk:command"
    name      = "DeploymentPolicy"
    value     = "Rolling" # Other options: AllAtOnce, RollingWithAdditionalBatch, Immutable, BlueGreen
  }
  setting {
    namespace = "aws:elasticbeanstalk:command"
    name      = "BatchSizeType"
    value     = "Percentage"
  }
  setting {
    namespace = "aws:elasticbeanstalk:command"
    name      = "BatchSize"
    value     = "30" # 30% of instances at a time
  }

  # Auto Scaling
  setting {
    namespace = "aws:autoscaling:asg"
    name      = "MinSize"
    value     = "1" # For dev, can be 1. For prod, typically 2.
  }
  setting {
    namespace = "aws:autoscaling:asg"
    name      = "MaxSize"
    value     = "3" # Adjust as needed
  }
  # You can add more trigger settings for scaling (CPUUtilization, NetworkIn/Out, etc.)

  tags = {
    Name        = "${var.app_name}-eb-env-${var.app_environment}"
    Environment = var.app_environment
  }
}

# ------------------------------------------------------------------------------
# Route 53 DNS Record (Optional)
# ------------------------------------------------------------------------------
resource "aws_route53_record" "app_dns" {
  count   = var.domain_name != "" && var.hosted_zone_id != "" ? 1 : 0
  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_elastic_beanstalk_environment.default.cname # Beanstalk provides a CNAME, but ALB has an A record alias target
    zone_id                = aws_elastic_beanstalk_environment.default.load_balancers[0] # This gets the ALB's hosted zone ID
    evaluate_target_health = true
  }
}


# ------------------------------------------------------------------------------
# Outputs
# ------------------------------------------------------------------------------
output "beanstalk_environment_url" {
  value = try(aws_elastic_beanstalk_environment.default.cname, "N/A")
  description = "beanstalk_environment_url"
}

output "beanstalk_environment_endpoint" {
  value = try(aws_elastic_beanstalk_environment.default.endpoint_url, "N/A")
  description = "beanstalk_environment_endpoint"
}

output "docdb_cluster_endpoint" {
  value = try(aws_docdb_cluster.default.endpoint, "N/A")
  description = "docdb_cluster_endpoint"
}

output "docdb_cluster_reader_endpoint" {
  value = try(aws_docdb_cluster.default.reader_endpoint, "N/A")
  description = "docdb_cluster_reader_endpoint"
}

output "docdb_security_group_id" {
  value = try(aws_security_group.docdb_sg.id, "N/A")
  description = "docdb_security_group_id"
}

output "app_security_group_id" {
  value = try(aws_security_group.app_sg.id, "N/A")
  description = "app_security_group_id"
}

output "alb_security_group_id" {
  value = try(aws_security_group.alb_sg.id, "N/A")
  description = "alb_security_group_id"
}

output "vpc_id" {
  value = try(module.vpc.vpc_id, "N/A")
  description = "vpc_id"
}

output "public_subnet_ids" {
  value = try(module.vpc.public_subnets, "N/A")
  description = "public_subnet_ids"
}

output "private_subnet_ids" {
  value = try(module.vpc.private_subnets, "N/A")
  description = "private_subnet_ids"
}

output "acm_certificate_arn" {
  description = "ARN of the ACM certificate (if created)"
  value       = var.domain_name != "" && length(aws_acm_certificate.default) > 0 ? aws_acm_certificate.default[0].arn : "Not created"
}

output "application_url" {
  description = "URL for the application if domain name is configured"
  value       = var.domain_name != "" ? "https://${var.domain_name}" : "Use beanstalk_environment_endpoint"
}
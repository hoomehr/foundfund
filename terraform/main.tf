# (Ensure you have AWS provider configured, e.g., via environment variables or ~/.aws/credentials)
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Optional: S3 backend for Terraform state
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket-name"
  #   key            = "myapp/production/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "your-terraform-state-lock-table"
  # }
}

provider "aws" {
  region = var.aws_region
}

# ------------------------------------------------------------------------------
# VARIABLES
# ------------------------------------------------------------------------------
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "A name for the project, used for tagging and naming resources"
  type        = string
  default     = "myapp"
}

variable "environment" {
  description = "Deployment environment (e.g., dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "vpc_cidr_block" {
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
  description = "List of CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24"]
}

variable "availability_zones" {
  description = "List of Availability Zones to use"
  type        = list(string)
  # Ensure these AZs are available in your selected region
  default = ["us-east-1a", "us-east-1b"]
}

variable "app_container_image" {
  description = "Docker image for the application backend (e.g., from ECR)"
  type        = string
  default     = "nginx:latest" # Replace with your actual app image from ECR
}

variable "app_container_port" {
  description = "Port the application container listens on"
  type        = number
  default     = 3000 # Common for Node.js apps
}

variable "fargate_cpu" {
  description = "Fargate task CPU units (e.g., 256 = 0.25 vCPU, 512 = 0.5 vCPU, 1024 = 1 vCPU)"
  type        = number
  default     = 512 # 0.5 vCPU
}

variable "fargate_memory" {
  description = "Fargate task memory in MiB (e.g., 512, 1024, 2048)"
  type        = number
  default     = 1024 # 1GB
}

variable "fargate_desired_count" {
  description = "Desired number of Fargate tasks"
  type        = number
  default     = 2
}

variable "docdb_instance_class" {
  description = "DocumentDB instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "docdb_instances_count" {
  description = "Number of DocumentDB instances"
  type        = number
  default     = 2 # For HA
}

variable "domain_name" {
  description = "Your application's domain name (e.g., example.com)"
  type        = string
  default     = "" # Set this if you want to use Route 53 and ACM
}

variable "api_subdomain" {
  description = "Subdomain for the API (e.g., api.example.com)"
  type        = string
  default     = "api"
}

variable "frontend_subdomain" {
  description = "Subdomain for the frontend (e.g., www.example.com or just example.com)"
  type        = string
  default     = "www"
}

# ------------------------------------------------------------------------------
# LOCALS
# ------------------------------------------------------------------------------
locals {
  tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
  docdb_master_username = "docdbadmin"
  frontend_s3_bucket_name = var.domain_name != "" ? "${var.frontend_subdomain}.${var.domain_name}" : "${var.project_name}-${var.environment}-frontend-assets-${random_string.bucket_suffix.id}"
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "random_password" "docdb_master_password" {
  length           = 16
  special          = true
  override_special = "_%@"
}

# ------------------------------------------------------------------------------
# NETWORKING (VPC, Subnets, IGW, NAT GW, Route Tables)
# ------------------------------------------------------------------------------
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.5.1" # Use a recent, stable version

  name = "${var.project_name}-vpc-${var.environment}"
  cidr = var.vpc_cidr_block

  azs             = var.availability_zones
  public_subnets  = var.public_subnet_cidrs
  private_subnets = var.private_subnet_cidrs

  enable_nat_gateway     = true
  single_nat_gateway     = false # Set to true for cost saving in dev, false for HA
  one_nat_gateway_per_az = true  # For HA

  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = local.tags

  public_subnet_tags = {
    "kubernetes.io/role/elb" = "1" # For ALB auto-discovery if using Kubernetes later
  }
  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = "1"
  }
}

# ------------------------------------------------------------------------------
# SECURITY GROUPS
# ------------------------------------------------------------------------------

# Security Group for ALB (allows HTTP/HTTPS from anywhere)
resource "aws_security_group" "alb_sg" {
  name        = "${var.project_name}-alb-sg-${var.environment}"
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
  tags = local.tags
}

# Security Group for Fargate tasks (allows traffic from ALB on app port)
resource "aws_security_group" "fargate_sg" {
  name        = "${var.project_name}-fargate-sg-${var.environment}"
  description = "Allow traffic from ALB to Fargate tasks"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = var.app_container_port
    to_port         = var.app_container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }
  egress { # Allow outbound traffic to internet (e.g., external APIs, ECR, DocumentDB)
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = local.tags
}

# Security Group for DocumentDB (allows traffic from Fargate SG on DocumentDB port)
resource "aws_security_group" "docdb_sg" {
  name        = "${var.project_name}-docdb-sg-${var.environment}"
  description = "Allow traffic from Fargate tasks to DocumentDB"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 27017 # Default MongoDB/DocumentDB port
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [aws_security_group.fargate_sg.id]
  }
  egress { # Typically not needed for DB, but can be open if DB needs to reach out
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = local.tags
}

# ------------------------------------------------------------------------------
# ECR (Elastic Container Registry)
# ------------------------------------------------------------------------------
resource "aws_ecr_repository" "app_ecr_repo" {
  name                 = "${var.project_name}-backend-${var.environment}"
  image_tag_mutability = "MUTABLE" # Or IMMUTABLE for stricter versioning

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = local.tags
}

# ------------------------------------------------------------------------------
# ECS FARGATE (Backend Application)
# ------------------------------------------------------------------------------
resource "aws_ecs_cluster" "main_cluster" {
  name = "${var.project_name}-cluster-${var.environment}"
  tags = local.tags
}

# IAM Role for ECS Task Execution (permissions to pull ECR images, send logs to CloudWatch)
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.project_name}-ecs-task-exec-role-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Optional: IAM Role for ECS Tasks (permissions for your application code if it needs to call AWS APIs)
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project_name}-ecs-task-role-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
  tags = local.tags
}
# Attach policies as needed, e.g., to access S3, SQS, Secrets Manager
# resource "aws_iam_role_policy_attachment" "ecs_task_role_s3_access" {
#   role       = aws_iam_role.ecs_task_role.name
#   policy_arn = "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess" # Example
# }
resource "aws_iam_role_policy_attachment" "ecs_task_role_secrets_manager_access" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = "arn:aws:iam::aws:policy/SecretsManagerReadWrite" # Or a more restrictive custom policy
}


resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/ecs/${var.project_name}-backend-${var.environment}"
  retention_in_days = 30 # Adjust as needed
  tags              = local.tags
}

resource "aws_ecs_task_definition" "app_task_def" {
  family                   = "${var.project_name}-backend-${var.environment}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.fargate_cpu
  memory                   = var.fargate_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn # Optional: if your app needs AWS permissions

  container_definitions = jsonencode([{
    name      = "${var.project_name}-backend-container"
    image     = var.app_container_image == "nginx:latest" ? aws_ecr_repository.app_ecr_repo.repository_url : var.app_container_image # Use ECR repo URL once image is pushed
    cpu       = var.fargate_cpu
    memory    = var.fargate_memory
    essential = true
    portMappings = [{
      containerPort = var.app_container_port
      hostPort      = var.app_container_port # For awsvpc mode, hostPort is same as containerPort
      protocol      = "tcp"
    }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.app_logs.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
    # Environment variables for your application
    environment = [
      { name = "NODE_ENV", value = var.environment == "prod" ? "production" : "development" },
      { name = "PORT", value = tostring(var.app_container_port) },
      # Add other env vars as needed
    ]
    secrets = [ # Example for DocumentDB connection string
      {
        name      = "MONGODB_URI" # The env var name in your container
        valueFrom = aws_secretsmanager_secret_version.docdb_secret_version.arn
      }
    ]
  }])
  tags = local.tags
}

resource "aws_lb" "main_alb" {
  name               = "${var.project_name}-alb-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = module.vpc.public_subnets
  enable_deletion_protection = false # Set to true for production

  tags = local.tags
}

resource "aws_lb_target_group" "app_tg" {
  name        = "${var.project_name}-tg-${var.environment}"
  port        = var.app_container_port
  protocol    = "HTTP"
  vpc_id      = module.vpc.vpc_id
  target_type = "ip" # Required for Fargate

  health_check {
    enabled             = true
    path                = "/" # Adjust to your application's health check endpoint
    protocol            = "HTTP"
    matcher             = "200-399"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }
  tags = local.tags
}

resource "aws_lb_listener" "http_listener" {
  load_balancer_arn = aws_lb.main_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
  # If you don't have a domain/ACM cert yet, use forward to target group
  # default_action {
  #   type             = "forward"
  #   target_group_arn = aws_lb_target_group.app_tg.arn
  # }
}

resource "aws_lb_listener" "https_listener" {
  count             = var.domain_name != "" ? 1 : 0 # Only create if domain is set
  load_balancer_arn = aws_lb.main_alb.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08" # Choose appropriate SSL policy
  certificate_arn   = module.acm.acm_certificate_arn # From ACM module below

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app_tg.arn
  }
  tags = local.tags
}

resource "aws_ecs_service" "app_service" {
  name            = "${var.project_name}-service-${var.environment}"
  cluster         = aws_ecs_cluster.main_cluster.id
  task_definition = aws_ecs_task_definition.app_task_def.arn
  desired_count   = var.fargate_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = module.vpc.private_subnets # Run tasks in private subnets
    security_groups = [aws_security_group.fargate_sg.id]
    assign_public_ip = false # Important for tasks in private subnets
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app_tg.arn
    container_name   = "${var.project_name}-backend-container"
    container_port   = var.app_container_port
  }

  # Optional: Enable service discovery (e.g., for internal microservices communication)
  # service_registries {
  #   registry_arn = aws_service_discovery_service.example.arn
  # }

  # Ensure tasks are replaced on new deployment
  deployment_controller {
    type = "ECS" # Rolling updates
  }
  
  # Optional: enable CloudWatch alarms for auto-scaling
  # depends_on = [aws_lb_listener.http_listener, aws_lb_listener.https_listener] # If HTTPS listener is used

  tags = local.tags
}

# ------------------------------------------------------------------------------
# DOCUMENTDB (MongoDB Compatible Database)
# ------------------------------------------------------------------------------
resource "aws_docdb_subnet_group" "main_docdb_subnet_group" {
  name       = "${var.project_name}-docdb-subnet-group-${var.environment}"
  subnet_ids = module.vpc.private_subnets # DocumentDB should be in private subnets
  tags       = local.tags
}

resource "aws_secretsmanager_secret" "docdb_credentials" {
  name        = "${var.project_name}-docdb-credentials-${var.environment}"
  description = "DocumentDB master credentials"
  tags        = local.tags
}

resource "aws_secretsmanager_secret_version" "docdb_secret_version" {
  secret_id     = aws_secretsmanager_secret.docdb_credentials.id
  secret_string = <<EOF
{
  "username": "${local.docdb_master_username}",
  "password": "${random_password.docdb_master_password.result}",
  "engine": "docdb",
  "host": "${aws_docdb_cluster.main_docdb_cluster.endpoint}",
  "port": ${aws_docdb_cluster.main_docdb_cluster.port},
  "dbClusterIdentifier": "${aws_docdb_cluster.main_docdb_cluster.id}",
  "connection_string": "mongodb://${local.docdb_master_username}:${random_password.docdb_master_password.result}@${aws_docdb_cluster.main_docdb_cluster.endpoint}:${aws_docdb_cluster.main_docdb_cluster.port}/${var.project_name}?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"
}
EOF
  # Note: Modify the connection string options like dbName as needed.
  # `retryWrites=false` is often recommended for DocumentDB.
  # `ssl_ca_certs` might be needed by your client driver. Point to `rds-combined-ca-bundle.pem`.
}

resource "aws_docdb_cluster" "main_docdb_cluster" {
  cluster_identifier      = "${var.project_name}-docdb-cluster-${var.environment}"
  engine                  = "docdb"
  master_username         = local.docdb_master_username
  master_password         = random_password.docdb_master_password.result
  db_subnet_group_name    = aws_docdb_subnet_group.main_docdb_subnet_group.name
  vpc_security_group_ids  = [aws_security_group.docdb_sg.id]
  skip_final_snapshot     = var.environment != "prod" # Set to false for prod
  backup_retention_period = var.environment == "prod" ? 7 : 1 # Days
  preferred_backup_window = "07:00-09:00"
  # storage_encrypted       = true # Encrypted by default
  # deletion_protection = var.environment == "prod" # Enable for prod
  
  tags = local.tags
}

resource "aws_docdb_cluster_instance" "docdb_instance" {
  count              = var.docdb_instances_count
  identifier         = "${var.project_name}-docdb-instance-${var.environment}-${count.index}"
  cluster_identifier = aws_docdb_cluster.main_docdb_cluster.id
  instance_class     = var.docdb_instance_class
  engine             = "docdb"
  
  tags = local.tags
}

# ------------------------------------------------------------------------------
# FRONTEND (S3 Static Site + CloudFront CDN)
# ------------------------------------------------------------------------------
resource "aws_s3_bucket" "frontend_assets" {
  bucket = local.frontend_s3_bucket_name
  tags   = local.tags
}

resource "aws_s3_bucket_website_configuration" "frontend_website_config" {
  bucket = aws_s3_bucket.frontend_assets.id

  index_document {
    suffix = "index.html"
  }
  error_document {
    key = "error.html" # Optional: your custom error page
  }
}

resource "aws_s3_bucket_public_access_block" "frontend_public_access" {
  bucket = aws_s3_bucket.frontend_assets.id

  block_public_acls       = false # Must be false if using ACLs for public read
  block_public_policy     = false # Must be false for public policy
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Option 1: S3 Bucket Policy for Public Read (Simpler, if OAI is not strictly needed)
resource "aws_s3_bucket_policy" "frontend_bucket_policy" {
  bucket = aws_s3_bucket.frontend_assets.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend_assets.arn}/*"
      }
    ]
  })
  depends_on = [aws_s3_bucket_public_access_block.frontend_public_access]
}

# CloudFront Origin Access Identity (OAI) - Recommended for restricting S3 access to CloudFront
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for ${local.frontend_s3_bucket_name}"
}

# Modify S3 bucket policy to use OAI (Comment out the above policy if using this)
/*
resource "aws_s3_bucket_policy" "frontend_bucket_policy_oai" {
  bucket = aws_s3_bucket.frontend_assets.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect    = "Allow",
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.oai.iam_arn
        },
        Action    = "s3:GetObject",
        Resource  = "${aws_s3_bucket.frontend_assets.arn}/*"
      }
    ]
  })
  depends_on = [aws_s3_bucket_public_access_block.frontend_public_access, aws_cloudfront_origin_access_identity.oai]
}
*/

module "acm" {
  source  = "terraform-aws-modules/acm/aws"
  version = "~> 4.0" # Check for latest stable version

  # Only create if domain_name is provided
  # This will attempt to create a certificate and validate it via DNS (if Route 53 zone is managed by AWS)
  # or email validation. For DNS validation to work automatically, Route 53 zone must exist.
  count = var.domain_name != "" ? 1 : 0

  domain_name = var.domain_name # e.g., example.com
  zone_id     = var.domain_name != "" ? data.aws_route53_zone.selected[0].zone_id : null

  subject_alternative_names = [
    var.domain_name != "" ? "*.${var.domain_name}" : "", # Wildcard for subdomains like www, api
    var.domain_name != "" ? "${var.api_subdomain}.${var.domain_name}" : "",
    var.domain_name != "" ? "${var.frontend_subdomain}.${var.domain_name}" : ""
  ]
  wait_for_validation = true # Can take time

  tags = local.tags
}

resource "aws_cloudfront_distribution" "s3_distribution" {
  count = var.domain_name != "" ? 1 : 0 # Only create if domain is set for CloudFront

  origin {
    domain_name = aws_s3_bucket.frontend_assets.bucket_regional_domain_name
    origin_id   = "S3-${local.frontend_s3_bucket_name}"

    # Use S3 Origin Config with OAI if you chose that S3 policy route
    # s3_origin_config {
    #   origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    # }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront for ${local.frontend_s3_bucket_name}"
  default_root_object = "index.html"

  # Logging (optional)
  # logging_config {
  #   include_cookies = false
  #   bucket          = "mylogs.s3.amazonaws.com" # Create this bucket separately
  #   prefix          = "cloudfront-logs/"
  # }

  aliases = [var.domain_name != "" ? "${var.frontend_subdomain}.${var.domain_name}" : ""]

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${local.frontend_s3_bucket_name}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600 # 1 hour
    max_ttl                = 86400 # 24 hours
  }

  # Price class: Use PriceClass_100 for US/EU, PriceClass_All for global
  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none" # Or "whitelist"/"blacklist" specific countries
    }
  }

  viewer_certificate {
    acm_certificate_arn      = module.acm[0].acm_certificate_arn # Assumes ACM module is used
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
  tags = local.tags
}

# ------------------------------------------------------------------------------
# DNS (Route 53) - Optional, if managing DNS with AWS
# ------------------------------------------------------------------------------

data "aws_route53_zone" "selected" {
  count        = var.domain_name != "" ? 1 : 0
  name         = var.domain_name # e.g., "example.com." (note the trailing dot)
  private_zone = false
}

resource "aws_route53_record" "api_dns" {
  count   = var.domain_name != "" ? 1 : 0
  zone_id = data.aws_route53_zone.selected[0].zone_id
  name    = "${var.api_subdomain}.${var.domain_name}" # e.g., api.example.com
  type    = "A"

  alias {
    name                   = aws_lb.main_alb.dns_name
    zone_id                = aws_lb.main_alb.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "frontend_dns" {
  count   = var.domain_name != "" && length(aws_cloudfront_distribution.s3_distribution) > 0 ? 1 : 0
  zone_id = data.aws_route53_zone.selected[0].zone_id
  name    = "${var.frontend_subdomain}.${var.domain_name}" # e.g., www.example.com or example.com if frontend_subdomain is empty
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.s3_distribution[0].domain_name
    zone_id                = aws_cloudfront_distribution.s3_distribution[0].hosted_zone_id
    evaluate_target_health = false # CloudFront aliases don't support health evaluation this way
  }
}


# ------------------------------------------------------------------------------
# OUTPUTS
# ------------------------------------------------------------------------------
output "ecr_repository_url" {
  value = try(aws_ecr_repository.app_ecr_repo.repository_url, "N/A")
  description = "ecr_repository_url"
}

output "alb_dns_name" {
  value = try(aws_lb.main_alb.dns_name, "N/A")
  description = "alb_dns_name"
}

output "api_endpoint_url" {
  description = "URL for the API endpoint"
  value       = var.domain_name != "" ? "https://${var.api_subdomain}.${var.domain_name}" : "http://${aws_lb.main_alb.dns_name}"
}

output "frontend_s3_bucket_name" {
  value = try(aws_s3_bucket.frontend_assets.bucket, "N/A")
  description = "frontend_s3_bucket_name"
}

output "frontend_s3_bucket_website_endpoint" {
  value = try(aws_s3_bucket_website_configuration.frontend_website_config.website_endpoint, "N/A")
  description = "frontend_s3_bucket_website_endpoint"
}

output "cloudfront_distribution_domain_name" {
  description = "Domain name of the CloudFront distribution for the frontend"
  value       = var.domain_name != "" && length(aws_cloudfront_distribution.s3_distribution) > 0 ? aws_cloudfront_distribution.s3_distribution[0].domain_name : "CloudFront not created (domain_name not set)"
}

output "frontend_url" {
  description = "URL for the frontend application"
  value       = var.domain_name != "" && length(aws_cloudfront_distribution.s3_distribution) > 0 ? "https://${var.frontend_subdomain}.${var.domain_name}" : "See S3 website endpoint or CloudFront domain if created manually."
}

output "docdb_cluster_endpoint" {
  value = try(aws_docdb_cluster.main_docdb_cluster.endpoint, "N/A")
  description = "docdb_cluster_endpoint"
}

output "docdb_cluster_reader_endpoint" {
  value = try(aws_docdb_cluster.main_docdb_cluster.reader_endpoint, "N/A")
  description = "docdb_cluster_reader_endpoint"
}

output "docdb_credentials_secret_arn" {
  value = try(aws_secretsmanager_secret.docdb_credentials.arn, "N/A")
  description = "docdb_credentials_secret_arn"
}

output "docdb_connection_string_secret_arn" {
  value = try(aws_secretsmanager_secret_version.docdb_secret_version.arn, "N/A")
  description = "docdb_connection_string_secret_arn"
}
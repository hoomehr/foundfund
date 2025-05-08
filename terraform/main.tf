terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  required_version = ">= 0.13"
}

provider "aws" {
  region = "us-east-1"  # Replace with your desired AWS region
}

# --- VPC ---
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  tags = {
    Name = "application-vpc"
  }
}

resource "aws_subnet" "public_subnet_a" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
  availability_zone = "us-east-1a" # replace as necessary

  map_public_ip_on_launch = true
  tags = {
    Name = "public-subnet-a"
  }
}

resource "aws_subnet" "public_subnet_b" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.2.0/24"
  availability_zone = "us-east-1b" # replace as necessary

  map_public_ip_on_launch = true
  tags = {
    Name = "public-subnet-b"
  }
}

resource "aws_subnet" "private_subnet_a" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.11.0/24"
  availability_zone = "us-east-1a" # replace as necessary
  tags = {
    Name = "private-subnet-a"
  }
}

resource "aws_subnet" "private_subnet_b" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.12.0/24"
  availability_zone = "us-east-1b" # replace as necessary
  tags = {
    Name = "private-subnet-b"
  }
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name = "internet-gateway"
  }
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }

  tags = {
    Name = "public-route-table"
  }
}

resource "aws_route_table_association" "public_subnet_a_assoc" {
  subnet_id      = aws_subnet.public_subnet_a.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_subnet_b_assoc" {
  subnet_id      = aws_subnet.public_subnet_b.id
  route_table_id = aws_route_table.public_rt.id
}

# --- Security Groups ---
resource "aws_security_group" "allow_web" {
  name        = "allow_web_traffic"
  description = "Allow web traffic to instances"
  vpc_id      = aws_vpc.main.id

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
    Name = "allow_web_traffic"
  }
}

resource "aws_security_group" "allow_ssh" {
  name        = "allow_ssh_traffic"
  description = "Allow SSH traffic"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["YOUR_IP_ADDRESS/32"] # Replace with your IP address for security
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "allow_ssh_traffic"
  }
}

resource "aws_security_group" "allow_db" {
  name        = "allow_db_traffic"
  description = "Allow DB traffic between EC2 instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 27017
    to_port     = 27017
    protocol    = "tcp"
    security_groups = [aws_security_group.allow_web.id, aws_security_group.allow_ssh.id] # allow DB traffic from app servers
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "allow_db_traffic"
  }
}

# --- EC2 Instances ---
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"] # This is Amazon Linux 2 AMI
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "app_server_a" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.medium"
  subnet_id     = aws_subnet.private_subnet_a.id
  vpc_security_group_ids = [aws_security_group.allow_web.id, aws_security_group.allow_ssh.id]
  key_name      = "your_key_pair" # Replace with your key pair name
  tags = {
    Name = "app-server-a"
  }

  # User data to install Node.js and PM2 (example)
  user_data = <<-EOF
              #!/bin/bash
              sudo yum update -y
              sudo yum install -y nodejs npm
              sudo npm install -g pm2
              # Copy your application code here (e.g., from S3) and start it with pm2
              # Example:
              # aws s3 cp s3://your-app-bucket/app.tar.gz /tmp/app.tar.gz
              # tar -xzf /tmp/app.tar.gz -C /var/www/html
              # cd /var/www/html
              # pm2 start app.js
              EOF
}

resource "aws_instance" "app_server_b" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.medium"
  subnet_id     = aws_subnet.private_subnet_b.id
  vpc_security_group_ids = [aws_security_group.allow_web.id, aws_security_group.allow_ssh.id]
  key_name      = "your_key_pair" # Replace with your key pair name
  tags = {
    Name = "app-server-b"
  }
  # User data to install Node.js and PM2 (example)
  user_data = <<-EOF
              #!/bin/bash
              sudo yum update -y
              sudo yum install -y nodejs npm
              sudo npm install -g pm2
              # Copy your application code here (e.g., from S3) and start it with pm2
              # Example:
              # aws s3 cp s3://your-app-bucket/app.tar.gz /tmp/app.tar.gz
              # tar -xzf /tmp/app.tar.gz -C /var/www/html
              # cd /var/www/html
              # pm2 start app.js
              EOF
}
# --- MongoDB Instance (If not using MongoDB Atlas) ---
/*
resource "aws_instance" "mongodb_server" {
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.medium"
  subnet_id     = aws_subnet.private_subnet_a.id
  vpc_security_group_ids = [aws_security_group.allow_db.id, aws_security_group.allow_ssh.id]
  key_name      = "your_key_pair"
  tags = {
    Name = "mongodb-server"
  }

  # User data to install and configure MongoDB
  user_data = <<-EOF
              #!/bin/bash
              sudo yum update -y
              # Install MongoDB
              # Refer to the MongoDB documentation for the correct installation steps for your OS
              # Example (Amazon Linux 2):
              # ... (MongoDB installation commands) ...
              # Configure MongoDB for replication and security
              EOF
}
*/

# --- Load Balancer ---
resource "aws_lb" "application_lb" {
  name               = "application-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups   = [aws_security_group.allow_web.id]
  subnets            = [aws_subnet.public_subnet_a.id, aws_subnet.public_subnet_b.id]

  tags = {
    Name = "application-lb"
  }
}

resource "aws_lb_target_group" "target_group" {
  name     = "target-group"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    path     = "/"  # Modify this based on your application's health check endpoint
    protocol = "HTTP"
    matcher  = "200"
  }
}

resource "aws_lb_target_group_attachment" "app_server_a_tg" {
  target_group_arn = aws_lb_target_group.target_group.arn
  target_id        = aws_instance.app_server_a.id
  port             = 80
}

resource "aws_lb_target_group_attachment" "app_server_b_tg" {
  target_group_arn = aws_lb_target_group.target_group.arn
  target_id        = aws_instance.app_server_b.id
  port             = 80
}

resource "aws_lb_listener" "http_listener" {
  load_balancer_arn = aws_lb.application_lb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.target_group.arn
  }
}

# --- S3 Bucket (for static assets) ---
resource "aws_s3_bucket" "static_assets" {
  bucket = "your-app-static-assets-bucket" # Replace with a unique bucket name
  acl    = "private" # Block public access by default

  tags = {
    Name = "static-assets-bucket"
  }
  # Add bucket policy here if you need CloudFront access
}

# --- Route 53 Record (optional) ---
/*
resource "aws_route53_record" "www" {
  zone_id = "YOUR_ROUTE53_ZONE_ID" # Replace with your Route 53 zone ID
  name    = "www.yourdomain.com" # Replace with your domain name
  type    = "A"

  alias {
    name                   = aws_lb.application_lb.dns_name
    zone_id                = aws_lb.application_lb.zone_id
    evaluate_target_health = true
  }
}
*/

# --- IAM Role (example) ---
resource "aws_iam_role" "ec2_role" {
  name = "ec2-application-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Principal = {
          Service = "ec2.amazonaws.com"
        },
        Effect = "Allow",
        Sid    = "",
      },
    ]
  })
}

resource "aws_iam_policy" "ec2_policy" {
  name        = "ec2-application-policy"
  description = "Policy for EC2 instances to access other AWS resources"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ],
        Effect   = "Allow",
        Resource = [
          "arn:aws:s3:::your-app-static-assets-bucket",  # Replace with your bucket name
          "arn:aws:s3:::your-app-static-assets-bucket/*" # Replace with your bucket name
        ]
      }
      # Add more permissions as needed
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ec2_role_policy_attach" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_policy.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "ec2-application-profile"
  role = aws_iam_role.ec2_role.name
}

#Associate the instance profile with the EC2 instances
resource "aws_instance" "app_server_a" {
  ami = data.aws_ami.amazon_linux.id
  instance_type = "t3.medium"
  subnet_id = aws_subnet.private_subnet_a.id
  vpc_security_group_ids = [aws_security_group.allow_web.id, aws_security_group.allow_ssh.id]
  key_name = "your_key_pair" # Replace with your key pair name
  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name #added

  tags = {
    Name = "app-server-a"
  }

  # User data to install Node.js and PM2 (example)
  user_data = <<-EOF
              #!/bin/bash
              sudo yum update -y
              sudo yum install -y nodejs npm
              sudo npm install -g pm2
              # Copy your application code here (e.g., from S3) and start it with pm2
              # Example:
              aws s3 cp s3://your-app-bucket/app.tar.gz /tmp/app.tar.gz
              tar -xzf /tmp/app.tar.gz -C /var/www/html
              cd /var/www/html
              pm2 start app.js
              EOF
}

resource "aws_instance" "app_server_b" {
  ami = data.aws_ami.amazon_linux.id
  instance_type = "t3.medium"
  subnet_id = aws_subnet.private_subnet_b.id
  vpc_security_group_ids = [aws_security_group.allow_web.id, aws_security_group.allow_ssh.id]
  key_name = "your_key_pair" # Replace with your key pair name
  iam_instance_profile = aws_iam_instance_profile.ec2_profile.name #added
  tags = {
    Name = "app-server-b"
  }
  # User data to install Node.js and PM2 (example)
  user_data = <<-EOF
              #!/bin/bash
              sudo yum update -y
              sudo yum install -y nodejs npm
              sudo npm install -g pm2
              # Copy your application code here (e.g., from S3) and start it with pm2
              # Example:
              aws s3 cp s3://your-app-bucket/app.tar.gz /tmp/app.tar.gz
              tar -xzf /tmp/app.tar.gz -C /var/www/html
              cd /var/www/html
              pm2 start app.js
              EOF
}
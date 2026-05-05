terraform {
  required_version = ">= 1.3.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.31"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ── S3 Bucket (unique name, versioning, encryption, public access blocked) ──

resource "aws_s3_bucket" "cinemora_artifacts" {
  bucket        = var.s3_bucket_name
  force_destroy = true

  tags = {
    Project     = "cinemora"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "cinemora_artifacts" {
  bucket = aws_s3_bucket.cinemora_artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cinemora_artifacts" {
  bucket = aws_s3_bucket.cinemora_artifacts.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cinemora_artifacts" {
  bucket                  = aws_s3_bucket.cinemora_artifacts.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ── ECR Repository ──────────────────────────────────────────────────────────

resource "aws_ecr_repository" "cinemora_backend" {
  name                 = "cinemora-backend"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = {
    Project     = "cinemora"
    Environment = var.environment
  }
}

# ── ECS Cluster ─────────────────────────────────────────────────────────────

resource "aws_ecs_cluster" "cinemora" {
  name = "cinemora-cluster"

  tags = {
    Project     = "cinemora"
    Environment = var.environment
  }
}

# ── IAM Role for ECS Task Execution ─────────────────────────────────────────
# AWS Academy restricts iam:CreateRole — use the pre-existing LabRole instead

data "aws_iam_role" "ecs_task_execution" {
  name = "LabRole"
}

# ── VPC & Networking ─────────────────────────────────────────────────────────

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# ── Security Group for ECS ───────────────────────────────────────────────────

resource "aws_security_group" "ecs_sg" {
  name        = "cinemora-ecs-sg"
  description = "Allow inbound traffic to Cinemora backend"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 5001
    to_port     = 5001
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
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
    Project = "cinemora"
  }
}

# ── ECS Task Definition ──────────────────────────────────────────────────────

resource "aws_ecs_task_definition" "cinemora_backend" {
  family                   = "cinemora-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn

  container_definitions = jsonencode([{
    name      = "cinemora-backend"
    image     = "${aws_ecr_repository.cinemora_backend.repository_url}:latest"
    essential = true

    portMappings = [{
      containerPort = 5001
      hostPort      = 5001
      protocol      = "tcp"
    }]

    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "PORT", value = "5001" }
    ]

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:5001/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/cinemora-backend"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  tags = {
    Project     = "cinemora"
    Environment = var.environment
  }
}

# ── CloudWatch Log Group ─────────────────────────────────────────────────────

resource "aws_cloudwatch_log_group" "cinemora_backend" {
  name              = "/ecs/cinemora-backend"
  retention_in_days = 7

  tags = {
    Project = "cinemora"
  }
}

# ── ECS Service ──────────────────────────────────────────────────────────────

resource "aws_ecs_service" "cinemora_backend" {
  name            = "cinemora-backend-service"
  cluster         = aws_ecs_cluster.cinemora.id
  task_definition = aws_ecs_task_definition.cinemora_backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = true
  }

  tags = {
    Project     = "cinemora"
    Environment = var.environment
  }
}

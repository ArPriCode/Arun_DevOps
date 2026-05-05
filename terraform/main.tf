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

# ── S3 Bucket ────────────────────────────────────────────────────────────────

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

# ── ECR Repository ───────────────────────────────────────────────────────────

resource "aws_ecr_repository" "cinemora_backend" {
  name                 = var.ecr_repo_name
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

# ── IAM Role (use existing LabRole in AWS Academy) ───────────────────────────

data "aws_iam_role" "lab_role" {
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

# ── EKS Cluster ──────────────────────────────────────────────────────────────

resource "aws_eks_cluster" "cinemora" {
  name     = var.eks_cluster_name
  role_arn = data.aws_iam_role.lab_role.arn

  vpc_config {
    subnet_ids = data.aws_subnets.default.ids
  }

  tags = {
    Project     = "cinemora"
    Environment = var.environment
  }
}

# ── EKS Node Group ───────────────────────────────────────────────────────────

resource "aws_eks_node_group" "cinemora" {
  cluster_name    = aws_eks_cluster.cinemora.name
  node_group_name = "cinemora-nodes"
  node_role_arn   = data.aws_iam_role.lab_role.arn
  subnet_ids      = data.aws_subnets.default.ids

  scaling_config {
    desired_size = 2
    max_size     = 3
    min_size     = 1
  }

  instance_types = ["t3.small"]

  tags = {
    Project     = "cinemora"
    Environment = var.environment
  }
}

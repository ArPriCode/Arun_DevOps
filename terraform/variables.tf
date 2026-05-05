variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "s3_bucket_name" {
  description = "Unique S3 bucket name"
  type        = string
  default     = "cinemora-artifacts-arun-devops-2026"
}

variable "ecr_repo_name" {
  description = "ECR repository name"
  type        = string
  default     = "cinemora-backend"
}

variable "eks_cluster_name" {
  description = "EKS cluster name"
  type        = string
  default     = "cinemora-eks-cluster"
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "production"
}

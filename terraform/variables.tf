variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "s3_bucket_name" {
  description = "Unique S3 bucket name for Cinemora artifacts"
  type        = string
  default     = "cinemora-artifacts-devops-2026"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.cinemora_artifacts.bucket
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = aws_ecr_repository.cinemora_backend.repository_url
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = aws_eks_cluster.cinemora.name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = aws_eks_cluster.cinemora.endpoint
}

output "s3_bucket_name" {
  description = "S3 bucket name for artifacts"
  value       = aws_s3_bucket.cinemora_artifacts.bucket
}

output "ecr_repository_url" {
  description = "ECR repository URL for Docker images"
  value       = aws_ecr_repository.cinemora_backend.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.cinemora.name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.cinemora_backend.name
}

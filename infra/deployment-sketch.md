# Deployment Sketch (Light)

Hypothetical only, not applied — matches the assignment's own scope note ("not grading production hardening").

## Target: AWS ECS Fargate

Right-sized for this MVP's scale — no Kubernetes needed for a few dozen monitored URLs.

- 2 Fargate services (`backend`, `frontend`), behind an Application Load Balancer
- ALB routing: `/` → frontend, `/api/*` → backend (or separate subdomains)
- Backend: 1 task, 0.25 vCPU / 0.5 GB — SQLite on an EFS-backed volume for persistence across restarts (swap for RDS Postgres at real scale)
- Frontend: 1 task, 0.25 vCPU / 0.5 GB
- Both images pushed to ECR from CI, tagged by commit SHA
- Config (CORS origins, API base URL) via ECS task-definition environment variables, not baked into the image

## Illustrative Terraform

```hcl
resource "aws_ecs_service" "backend" {
  name            = "uptime-backend"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [aws_security_group.backend.id]
  }
}
```

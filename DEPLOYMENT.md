# Deployment Guide - AI-Powered Logistics Monitoring System

## Prerequisites
- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 7.0
- Apache Kafka >= 3.0
- Docker (optional)
- AWS CLI (for AWS deployments)

## Environment Setup

### Production Environment Variables
```bash
NODE_ENV=production
PORT=3000
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_NAME=logistics_prod
DB_USER=logistics_admin
DB_PASSWORD=<secure-password>
REDIS_HOST=your-elasticache-endpoint.amazonaws.com
REDIS_PORT=6379
KAFKA_BROKERS=broker1:9092,broker2:9092
JWT_SECRET=<secure-jwt-secret>
ENCRYPTION_KEY=<secure-encryption-key>
CORS_ORIGINS=https://app.logistics-system.com
```

## Database Setup

### Initialize Database
```bash
psql -h your-db-host -U postgres -d logistics_db -f src/resources/database-schema.sql
```

## Docker Deployment

### Build Image
```bash
docker build -t logistics-monitoring-system:latest .
```

### Run Container
```bash
docker run -p 3000:3000 --env-file .env logistics-monitoring-system:latest
```

## AWS ECS Fargate Deployment

### Create ECS Cluster
```bash
aws ecs create-cluster --cluster-name logistics-prod-cluster
```

### Deploy Task Definition
```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

### Create Service
```bash
aws ecs create-service --cluster logistics-prod-cluster --service-name logistics-api --task-definition logistics-monitoring-task --desired-count 3
```

## Monitoring

- CloudWatch Logs: /ecs/logistics-monitoring
- CloudWatch Metrics: Custom application metrics
- Health Check: GET /health
- Readiness Check: GET /health/ready

## Security

- All secrets stored in AWS Secrets Manager
- TLS 1.3 encryption in transit
- AES-256 encryption at rest
- RBAC enforced on all endpoints
- Comprehensive audit logging

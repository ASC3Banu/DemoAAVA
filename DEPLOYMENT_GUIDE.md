# Deployment Guide - AI-Powered Logistics Monitoring System

## Overview

This guide provides step-by-step instructions for deploying the AI-Powered Logistics Monitoring System backend to production environments.

## Prerequisites

### Infrastructure Requirements
- Kubernetes cluster (v1.24+)
- PostgreSQL 14+ (managed service recommended)
- Redis 7+ (managed service recommended)
- Apache Kafka 3.0+ (managed service recommended)
- Container registry (Docker Hub, ECR, GCR, etc.)
- Load balancer (ALB, NLB, or cloud provider equivalent)

### Security Requirements
- TLS certificates for HTTPS
- Secrets management system (AWS Secrets Manager, HashiCorp Vault, etc.)
- IAM roles and policies configured
- Network security groups/firewall rules

### Monitoring Requirements
- Prometheus for metrics collection
- Grafana for dashboards
- ELK Stack or CloudWatch for logging
- APM tool (New Relic, Datadog, etc.)

## Pre-Deployment Checklist

- [ ] Database schema deployed
- [ ] Environment variables configured
- [ ] Secrets stored securely
- [ ] TLS certificates obtained
- [ ] Container images built and pushed
- [ ] Kubernetes manifests prepared
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery procedures tested
- [ ] Security scanning completed
- [ ] Load testing performed

## Deployment Steps

### Step 1: Database Setup

```bash
# Connect to PostgreSQL
psql -h <db-host> -U postgres -d postgres

# Create database
CREATE DATABASE logistics_db;

# Run schema migration
psql -h <db-host> -U postgres -d logistics_db -f src/resources/database/schema.sql

# Run seed data (optional for non-production)
psql -h <db-host> -U postgres -d logistics_db -f src/resources/database/seed.sql
```

### Step 2: Build and Push Container Image

```bash
# Build Docker image
docker build -t logistics-monitoring:latest .

# Tag for registry
docker tag logistics-monitoring:latest <registry>/logistics-monitoring:v1.0.0

# Push to registry
docker push <registry>/logistics-monitoring:v1.0.0
```

### Step 3: Configure Secrets

```bash
# Create Kubernetes secrets
kubectl create secret generic logistics-secrets \n  --from-literal=db-password=<db-password> \n  --from-literal=redis-password=<redis-password> \n  --from-literal=jwt-secret=<jwt-secret> \n  --from-literal=encryption-key=<encryption-key>
```

### Step 4: Deploy to Kubernetes

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

# Verify deployment
kubectl get pods -n logistics-monitoring
kubectl get services -n logistics-monitoring
```

### Step 5: Configure Load Balancer

```bash
# Get load balancer endpoint
kubectl get ingress -n logistics-monitoring

# Configure DNS
# Point api.logistics-monitor.com to load balancer IP/hostname
```

### Step 6: Verify Deployment

```bash
# Health check
curl https://api.logistics-monitor.com/health

# Test authentication
curl -X POST https://api.logistics-monitor.com/v1/auth/login \n  -H "Content-Type: application/json" \n  -d '{"username":"admin","password":"password"}'

# Test API endpoint
curl https://api.logistics-monitor.com/v1/shipments \n  -H "Authorization: Bearer <token>"
```

## Post-Deployment Tasks

### Monitoring Setup

1. Configure Prometheus scraping
2. Import Grafana dashboards
3. Set up log aggregation
4. Configure alerting rules
5. Test alert notifications

### Security Hardening

1. Enable WAF rules
2. Configure rate limiting
3. Set up DDoS protection
4. Enable audit logging
5. Configure backup encryption

### Performance Optimization

1. Configure auto-scaling policies
2. Optimize database queries
3. Enable caching
4. Configure CDN (if applicable)
5. Monitor and tune resource limits

## Rollback Procedure

```bash
# Rollback to previous version
kubectl rollout undo deployment/logistics-app -n logistics-monitoring

# Verify rollback
kubectl rollout status deployment/logistics-app -n logistics-monitoring

# Check application health
curl https://api.logistics-monitor.com/health
```

## Troubleshooting

### Common Issues

#### Pods Not Starting
```bash
# Check pod logs
kubectl logs <pod-name> -n logistics-monitoring

# Describe pod for events
kubectl describe pod <pod-name> -n logistics-monitoring

# Check resource limits
kubectl top pods -n logistics-monitoring
```

#### Database Connection Issues
```bash
# Test database connectivity
kubectl run -it --rm debug --image=postgres:14 --restart=Never -- \n  psql -h <db-host> -U postgres -d logistics_db

# Check database credentials
kubectl get secret logistics-secrets -o yaml
```

#### High Memory Usage
```bash
# Check memory usage
kubectl top pods -n logistics-monitoring

# Adjust resource limits
kubectl edit deployment logistics-app -n logistics-monitoring

# Restart pods
kubectl rollout restart deployment/logistics-app -n logistics-monitoring
```

## Maintenance

### Regular Tasks

- Weekly: Review logs and metrics
- Monthly: Update dependencies and security patches
- Quarterly: Disaster recovery drill
- Annually: Security audit and penetration testing

### Backup Procedures

```bash
# Database backup
pg_dump -h <db-host> -U postgres logistics_db > backup_$(date +%Y%m%d).sql

# Upload to S3
aws s3 cp backup_$(date +%Y%m%d).sql s3://logistics-backups/

# Verify backup
aws s3 ls s3://logistics-backups/
```

### Update Procedures

```bash
# Build new version
docker build -t logistics-monitoring:v1.1.0 .

# Push to registry
docker push <registry>/logistics-monitoring:v1.1.0

# Update deployment
kubectl set image deployment/logistics-app \n  logistics-app=<registry>/logistics-monitoring:v1.1.0 \n  -n logistics-monitoring

# Monitor rollout
kubectl rollout status deployment/logistics-app -n logistics-monitoring
```

## Support and Escalation

### Contact Information
- Development Team: dev@logistics-monitor.com
- Operations Team: ops@logistics-monitor.com
- Security Team: security@logistics-monitor.com
- On-call: +1-XXX-XXX-XXXX

### Escalation Matrix

| Severity | Response Time | Escalation |
|----------|--------------|------------|
| Critical | 15 minutes | Immediate |
| High | 1 hour | After 2 hours |
| Medium | 4 hours | After 8 hours |
| Low | 24 hours | After 48 hours |

## Compliance and Audit

### Audit Trail
- All deployments logged in audit system
- Change requests tracked in ticketing system
- Deployment approvals documented
- Post-deployment reviews conducted

### Compliance Checks
- [ ] GDPR compliance verified
- [ ] PCI-DSS controls validated
- [ ] ISO 27001 requirements met
- [ ] SOC 2 controls implemented
- [ ] Data residency requirements satisfied

## Additional Resources

- [API Documentation](./README.md)
- [Architecture Diagrams](./docs/architecture/)
- [Security Guidelines](./docs/security/)
- [Performance Tuning](./docs/performance/)
- [Disaster Recovery Plan](./docs/dr-plan/)
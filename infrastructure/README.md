# SEO Intelligence Platform - Infrastructure

**Complete production-ready infrastructure for the SEO Intelligence Platform**

## 📋 Table of Contents

- [Overview](#overview)
- [Directory Structure](#directory-structure)
- [Quick Start](#quick-start)
- [Docker Setup](#docker-setup)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Helm Charts](#helm-charts)
- [CI/CD Pipelines](#cicd-pipelines)
- [Monitoring](#monitoring)
- [Terraform](#terraform)
- [Utility Scripts](#utility-scripts)

## 🎯 Overview

This infrastructure provides:

- **Docker**: Multi-stage builds for all services
- **Kubernetes**: Production-ready manifests with HPA, PDB, and network policies
- **Helm**: Flexible chart-based deployments
- **CI/CD**: Automated GitHub Actions workflows
- **Monitoring**: Prometheus, Grafana, Alertmanager, and Loki
- **Terraform**: Infrastructure as Code for AWS
- **Scripts**: Deployment, rollback, health-check, backup, and scaling utilities

## 📁 Directory Structure

```
infrastructure/
├── docker/                      # Docker configurations
│   ├── Dockerfile.backend       # NestJS backend
│   ├── Dockerfile.frontend      # Next.js frontend
│   ├── Dockerfile.ml-service    # Python ML service
│   ├── docker-compose.yml       # Local development
│   ├── docker-compose.prod.yml  # Production deployment
│   └── nginx/                   # Nginx reverse proxy
├── k8s/                         # Kubernetes manifests
│   ├── base/                    # Base configurations
│   │   ├── deployments/         # Application deployments
│   │   ├── services/            # Services
│   │   ├── configmaps/          # Configuration maps
│   │   ├── secrets/             # Secrets
│   │   ├── statefulsets/        # Databases (PostgreSQL, MongoDB, Redis, Kafka)
│   │   ├── hpa.yaml            # Horizontal Pod Autoscaler
│   │   ├── rbac.yaml           # Service accounts and roles
│   │   └── pvc.yaml            # Persistent volume claims
│   └── overlays/                # Environment-specific configs
│       ├── staging/             # Staging environment
│       └── production/          # Production environment
├── helm/                        # Helm charts
│   └── seo-platform/
│       ├── Chart.yaml           # Chart metadata
│       ├── values.yaml          # Default values
│       ├── values-prod.yaml     # Production values
│       └── templates/           # Kubernetes templates
├── .github/workflows/           # CI/CD pipelines
│   ├── backend-ci.yml           # Backend build and test
│   ├── crawler-ci.yml           # Crawler build and test
│   ├── frontend-ci.yml          # Frontend build and test
│   ├── ml-service-ci.yml        # ML service build and test
│   ├── deploy-staging.yml       # Auto deploy to staging
│   └── deploy-production.yml    # Manual deploy to production
├── monitoring/                  # Monitoring stack
│   ├── prometheus/              # Prometheus configuration
│   ├── grafana/                 # Grafana dashboards
│   ├── alertmanager/            # Alert rules
│   └── loki/                    # Log aggregation
├── terraform/                   # Infrastructure as Code
│   ├── aws/                     # AWS infrastructure
│   └── modules/                 # Reusable modules
└── scripts/                     # Utility scripts
    ├── deploy.sh                # Deployment script
    ├── rollback.sh              # Rollback script
    ├── health-check.sh          # Health verification
    ├── backup.sh                # Backup databases
    └── scale.sh                 # Scale services
```

## 🚀 Quick Start

### Prerequisites

- Docker 24+ and Docker Compose
- Kubernetes 1.28+
- Helm 3.13+
- kubectl
- AWS CLI (for cloud deployment)
- Terraform 1.5+ (for infrastructure provisioning)

### Local Development with Docker

```bash
# Start all services locally
cd infrastructure/docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**Access services:**
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- Crawler: http://localhost:8080
- ML Service: http://localhost:8000

### Kubernetes Deployment

#### Using kubectl

```bash
# Deploy to staging
kubectl apply -k k8s/overlays/staging

# Deploy to production
kubectl apply -k k8s/overlays/production

# Check deployment status
kubectl get pods -n seo-platform
```

#### Using Helm

```bash
# Install to staging
helm install seo-platform-staging ./helm/seo-platform \
  --namespace seo-platform-staging \
  --create-namespace

# Install to production
helm install seo-platform ./helm/seo-platform \
  --namespace seo-platform \
  --values ./helm/seo-platform/values-prod.yaml \
  --create-namespace

# Upgrade deployment
helm upgrade seo-platform ./helm/seo-platform \
  --namespace seo-platform
```

## 🐳 Docker Setup

### Building Images

```bash
# Backend
docker build -f docker/Dockerfile.backend -t seo-backend:latest .

# Frontend
docker build -f docker/Dockerfile.frontend -t seo-frontend:latest .

# ML Service
docker build -f docker/Dockerfile.ml-service -t seo-ml-service:latest .

# Crawler (uses existing Dockerfiles)
cd crawler
docker build -f Dockerfile.crawler -t seo-crawler:latest .
```

### Production Deployment with Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c infrastructure/docker/docker-compose.prod.yml seo-platform

# Check services
docker service ls
```

## ☸️ Kubernetes Deployment

### Architecture

- **Deployments**: Backend, Crawler, ML Service, Frontend
- **StatefulSets**: PostgreSQL, MongoDB, Redis, Kafka
- **Services**: ClusterIP for internal, LoadBalancer for external
- **HPA**: Auto-scaling based on CPU/Memory
- **PDB**: Pod Disruption Budgets for high availability
- **Network Policies**: Secure pod-to-pod communication

### Deployment Options

#### 1. Kustomize (Recommended)

```bash
# Staging
kubectl apply -k k8s/overlays/staging

# Production
kubectl apply -k k8s/overlays/production
```

#### 2. Raw Manifests

```bash
# Apply namespace
kubectl apply -f k8s/base/namespace.yaml

# Apply all base resources
kubectl apply -f k8s/base/
```

### Scaling

```bash
# Manual scaling
kubectl scale deployment backend --replicas=10 -n seo-platform

# Using script
./scripts/scale.sh production backend 10
```

## 📦 Helm Charts

### Installation

```bash
# Add dependencies
helm dependency update ./helm/seo-platform

# Install
helm install seo-platform ./helm/seo-platform \
  --namespace seo-platform \
  --create-namespace \
  --values ./helm/seo-platform/values-prod.yaml
```

### Configuration

Key values to customize in `values.yaml`:

```yaml
global:
  registry: your-registry.io

backend:
  replicaCount: 3
  image:
    tag: v1.0.0
  resources:
    requests:
      cpu: 500m
      memory: 512Mi
```

### Upgrading

```bash
helm upgrade seo-platform ./helm/seo-platform \
  --namespace seo-platform \
  --reuse-values \
  --set backend.image.tag=v1.1.0
```

## 🔄 CI/CD Pipelines

### GitHub Actions Workflows

**Automatic Triggers:**
- `backend-ci.yml`: On push to backend/
- `crawler-ci.yml`: On push to crawler/
- `frontend-ci.yml`: On push to frontend/
- `ml-service-ci.yml`: On push to ml-service/
- `deploy-staging.yml`: On push to develop branch

**Manual Triggers:**
- `deploy-production.yml`: Requires manual approval

### Required Secrets

Configure these in GitHub repository settings:

```
CONTAINER_REGISTRY        # Container registry URL
REGISTRY_USERNAME         # Registry username
REGISTRY_PASSWORD         # Registry password
KUBE_CONFIG_STAGING      # Base64 encoded kubeconfig for staging
KUBE_CONFIG_PRODUCTION   # Base64 encoded kubeconfig for production
SLACK_WEBHOOK            # Slack webhook for notifications
```

### Deployment Flow

1. **Push to branch** → Triggers CI workflow
2. **Tests run** → Unit, integration, linting
3. **Build Docker image** → Multi-stage build
4. **Push to registry** → Tagged with commit SHA
5. **Deploy to staging** → Automatic for develop branch
6. **Deploy to production** → Manual approval required

## 📊 Monitoring

### Prometheus

**Metrics collected:**
- Application metrics (request rate, latency, errors)
- System metrics (CPU, memory, disk)
- Database metrics (connections, queries)
- Kafka metrics (lag, throughput)

**Access Prometheus:**
```bash
kubectl port-forward -n monitoring svc/prometheus 9090:9090
# Open http://localhost:9090
```

### Grafana Dashboards

**Pre-configured dashboards:**
1. **Infrastructure**: CPU, memory, disk, network
2. **Application**: Request rate, errors, latency
3. **Business**: Users, API usage, revenue

**Access Grafana:**
```bash
kubectl port-forward -n monitoring svc/grafana 3000:3000
# Open http://localhost:3000
# Default login: admin/admin
```

### Alertmanager

**Alert channels:**
- Slack notifications
- PagerDuty for critical alerts
- Email for warnings

**Alert rules:**
- Service down
- High error rate
- Resource exhaustion
- Database issues

### Loki (Log Aggregation)

**Query logs:**
```bash
kubectl port-forward -n monitoring svc/loki 3100:3100
```

**Example queries:**
```
{app="backend"} |= "error"
{namespace="seo-platform"} |= "exception"
```

## 🏗️ Terraform

### AWS Infrastructure

**Resources provisioned:**
- VPC with public/private subnets
- EKS cluster (3 node groups)
- RDS PostgreSQL (multi-AZ)
- DocumentDB (MongoDB compatible)
- ElastiCache Redis (cluster mode)
- MSK (Kafka)
- S3 buckets
- EFS for ML models

### Deployment

```bash
cd infrastructure/terraform/aws

# Initialize
terraform init

# Plan
terraform plan -var-file=production.tfvars

# Apply
terraform apply -var-file=production.tfvars

# Outputs
terraform output
```

### Variables

Create `production.tfvars`:

```hcl
environment         = "production"
aws_region         = "us-east-1"
cluster_name       = "seo-platform"
rds_instance_class = "db.r6g.2xlarge"
```

## 🛠️ Utility Scripts

### 1. Deploy Script

```bash
./scripts/deploy.sh [environment] [version]

# Examples
./scripts/deploy.sh staging latest
./scripts/deploy.sh production v1.0.0
```

**Features:**
- Validates prerequisites
- Sets up kubeconfig
- Deploys with Helm
- Verifies deployment
- Runs smoke tests

### 2. Rollback Script

```bash
./scripts/rollback.sh [environment] [revision]

# Examples
./scripts/rollback.sh staging        # Rollback to previous
./scripts/rollback.sh production 5   # Rollback to revision 5
```

### 3. Health Check Script

```bash
./scripts/health-check.sh [environment]

# Example
./scripts/health-check.sh production
```

**Checks:**
- Cluster connectivity
- Node status
- Deployment health
- StatefulSet health
- Pod status
- Service endpoints
- Recent errors in logs

### 4. Backup Script

```bash
./scripts/backup.sh [environment]

# Example
./scripts/backup.sh production
```

**Backs up:**
- PostgreSQL database
- MongoDB database
- Kubernetes resources
- Helm values
- Uploads to S3

### 5. Scale Script

```bash
./scripts/scale.sh [environment] [service] [replicas]

# Examples
./scripts/scale.sh production backend 10
./scripts/scale.sh staging all 5
```

## 🔒 Security Best Practices

1. **Secrets Management**: Use external secret managers (AWS Secrets Manager, HashiCorp Vault)
2. **Network Policies**: Restrict pod-to-pod communication
3. **RBAC**: Minimal permissions for service accounts
4. **Image Scanning**: Scan images for vulnerabilities
5. **TLS**: Enable encryption in transit
6. **Pod Security**: Run as non-root user

## 📈 Scaling Strategy

### Horizontal Pod Autoscaler (HPA)

```yaml
Backend:    3-20 replicas (70% CPU, 80% Memory)
Crawler:    5-50 replicas (75% CPU, 85% Memory)
ML Service: 3-10 replicas (80% CPU, 85% Memory)
Frontend:   3-15 replicas (70% CPU, 75% Memory)
```

### Database Scaling

- **PostgreSQL**: Read replicas + connection pooling
- **MongoDB**: Replica set with sharding
- **Redis**: Cluster mode with multiple shards
- **Kafka**: Add brokers to cluster

## 🐛 Troubleshooting

### Check pod status

```bash
kubectl get pods -n seo-platform
kubectl describe pod <pod-name> -n seo-platform
kubectl logs <pod-name> -n seo-platform
```

### Check service endpoints

```bash
kubectl get endpoints -n seo-platform
```

### Check HPA status

```bash
kubectl get hpa -n seo-platform
```

### Check events

```bash
kubectl get events -n seo-platform --sort-by='.lastTimestamp'
```

## 📝 Maintenance

### Regular tasks

- **Daily**: Monitor alerts, check logs
- **Weekly**: Review resource usage, update dependencies
- **Monthly**: Security patches, backup verification
- **Quarterly**: Capacity planning, cost optimization

### Updates

```bash
# Update Helm chart
helm upgrade seo-platform ./helm/seo-platform

# Update Kubernetes manifests
kubectl apply -k k8s/overlays/production

# Update Terraform
terraform plan && terraform apply
```

## 📞 Support

For infrastructure issues:
- Check monitoring dashboards
- Review logs in Loki
- Check Prometheus alerts
- Run health-check script

## 📄 License

See individual files for licensing information.

---

**Built by Team Eta - Infrastructure & DevOps**

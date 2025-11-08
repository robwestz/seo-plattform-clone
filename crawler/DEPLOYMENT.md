# Deployment Guide - SEO Crawler Infrastructure

## Production Deployment

### Prerequisites

1. **Infrastructure Requirements**
   - Docker Swarm or Kubernetes cluster
   - PostgreSQL 16+ (managed service recommended)
   - MongoDB 7+ (managed service recommended)
   - Apache Kafka cluster (managed service recommended)
   - Sufficient compute resources

2. **Recommended Resources**
   - Crawler workers: 1 CPU, 1GB RAM per worker
   - Scheduler: 0.5 CPU, 512MB RAM
   - Renderer: 2 CPU, 2GB RAM per instance
   - PostgreSQL: 4 CPU, 8GB RAM
   - MongoDB: 4 CPU, 8GB RAM
   - Kafka: 2 CPU, 4GB RAM (3 brokers minimum)

### Docker Swarm Deployment

```bash
# Initialize swarm
docker swarm init

# Create overlay network
docker network create -d overlay crawler-network

# Deploy stack
docker stack deploy -c docker-compose.yml seo-crawler

# Scale workers
docker service scale seo-crawler_crawler=10

# Monitor services
docker service ls
docker service logs seo-crawler_crawler
```

### Kubernetes Deployment

```bash
# Create namespace
kubectl create namespace seo-crawler

# Apply configurations
kubectl apply -f k8s/

# Scale deployment
kubectl scale deployment crawler-worker --replicas=10 -n seo-crawler

# Monitor
kubectl get pods -n seo-crawler
kubectl logs -f deployment/crawler-worker -n seo-crawler
```

### Environment-Specific Configuration

#### Production

```bash
# .env.production
POSTGRES_URL=postgres://user:pass@prod-db.example.com:5432/seo_platform?sslmode=require
MONGO_URL=mongodb+srv://user:pass@prod-cluster.mongodb.net/
KAFKA_BROKERS=kafka-1:9092,kafka-2:9092,kafka-3:9092
RESPECT_ROBOTS=true
RATE_LIMIT_PER_SEC=0.5
LOG_LEVEL=info
```

#### Staging

```bash
# .env.staging
POSTGRES_URL=postgres://user:pass@staging-db.example.com:5432/seo_platform
MONGO_URL=mongodb://user:pass@staging-mongo:27017/
KAFKA_BROKERS=staging-kafka:9092
RESPECT_ROBOTS=true
RATE_LIMIT_PER_SEC=1.0
LOG_LEVEL=debug
```

### Managed Services Setup

#### AWS

**RDS PostgreSQL**
```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier seo-crawler-db \
  --db-instance-class db.t3.large \
  --engine postgres \
  --engine-version 16.1 \
  --master-username postgres \
  --master-user-password <password> \
  --allocated-storage 100
```

**DocumentDB (MongoDB)**
```bash
# Create DocumentDB cluster
aws docdb create-db-cluster \
  --db-cluster-identifier seo-crawler-docdb \
  --engine docdb \
  --master-username admin \
  --master-user-password <password>
```

**MSK (Kafka)**
```bash
# Create MSK cluster
aws kafka create-cluster \
  --cluster-name seo-crawler-kafka \
  --broker-node-group-info file://broker-config.json \
  --kafka-version 3.5.1
```

#### Google Cloud

**Cloud SQL PostgreSQL**
```bash
gcloud sql instances create seo-crawler-db \
  --database-version=POSTGRES_16 \
  --tier=db-n1-standard-2 \
  --region=us-central1
```

**MongoDB Atlas**
- Use MongoDB Atlas for managed MongoDB
- Create cluster via web console
- Configure network access and database user

**Confluent Cloud (Kafka)**
- Use Confluent Cloud for managed Kafka
- Create cluster via web console
- Get bootstrap servers and API keys

### Load Balancing

#### Nginx Configuration

```nginx
upstream crawler_api {
    least_conn;
    server crawler-1:8080;
    server crawler-2:8080;
    server crawler-3:8080;
}

upstream scheduler_api {
    server scheduler:8081;
}

upstream renderer_api {
    least_conn;
    server renderer-1:3000;
    server renderer-2:3000;
}

server {
    listen 80;
    server_name crawler.example.com;

    location /api/crawl {
        proxy_pass http://crawler_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/schedule {
        proxy_pass http://scheduler_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/render {
        proxy_pass http://renderer_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 60s;
    }
}
```

### Monitoring Setup

#### Prometheus Configuration

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'crawler'
    static_configs:
      - targets: ['crawler:8080']

  - job_name: 'scheduler'
    static_configs:
      - targets: ['scheduler:8081']

  - job_name: 'renderer'
    static_configs:
      - targets: ['renderer:3000']
```

#### Grafana Dashboards

Import pre-built dashboards for:
- Go applications
- Kafka metrics
- PostgreSQL performance
- MongoDB operations

### Backup Strategy

#### PostgreSQL Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgres"
mkdir -p $BACKUP_DIR

pg_dump -h $POSTGRES_HOST -U $POSTGRES_USER $POSTGRES_DB | \
  gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Retain 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

#### MongoDB Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"
mkdir -p $BACKUP_DIR

mongodump --uri="$MONGO_URL" --out=$BACKUP_DIR/backup_$DATE

# Compress and retain 30 days
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $BACKUP_DIR/backup_$DATE
rm -rf $BACKUP_DIR/backup_$DATE
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +30 -delete
```

### Security

#### Network Security

```bash
# Allow only necessary ports
# PostgreSQL: 5432
# MongoDB: 27017
# Kafka: 9092
# Crawler API: 8080
# Scheduler API: 8081
# Renderer API: 3000

# Use private networking when possible
# Enable SSL/TLS for all connections
```

#### Secrets Management

```bash
# Use environment-specific secrets
# Never commit secrets to git

# AWS Secrets Manager
aws secretsmanager create-secret \
  --name seo-crawler/postgres \
  --secret-string '{"username":"admin","password":"xxx"}'

# Kubernetes Secrets
kubectl create secret generic postgres-credentials \
  --from-literal=username=admin \
  --from-literal=password=xxx \
  -n seo-crawler
```

### Performance Optimization

#### Database Optimization

**PostgreSQL**
```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_page_metadata_domain_status
  ON page_metadata(domain, status_code);

-- Analyze tables regularly
ANALYZE page_metadata;
ANALYZE crawl_jobs;

-- Vacuum old data
VACUUM ANALYZE;
```

**MongoDB**
```javascript
// Create compound indexes
db.page_content.createIndex({ "url": 1, "crawled_at": -1 });

// Enable compression
db.runCommand({
  collMod: "page_content",
  validationLevel: "moderate",
  storageEngine: { wiredTiger: { configString: "block_compressor=zstd" }}
});
```

#### Kafka Optimization

```bash
# Increase partitions for parallelism
kafka-topics --bootstrap-server localhost:9092 \
  --alter --topic crawl-jobs --partitions 20

# Configure retention
kafka-configs --bootstrap-server localhost:9092 \
  --alter --entity-type topics --entity-name crawl-jobs \
  --add-config retention.ms=86400000
```

### Troubleshooting Production Issues

#### High Memory Usage

```bash
# Check container stats
docker stats

# Adjust memory limits
docker-compose up -d --scale crawler=5
```

#### Slow Crawling

```bash
# Check rate limiter settings
# Increase concurrency
# Scale workers
docker service scale seo-crawler_crawler=20
```

#### Database Connection Pool Exhausted

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Increase max_connections in postgresql.conf
max_connections = 200
```

### Maintenance

#### Regular Tasks

1. **Daily**: Check service health
2. **Weekly**: Review error logs
3. **Monthly**: Database maintenance (VACUUM, ANALYZE)
4. **Quarterly**: Capacity planning review

#### Update Procedure

```bash
# Pull latest images
docker-compose pull

# Rolling update
docker service update --image crawler:latest seo-crawler_crawler

# Verify deployment
docker service ps seo-crawler_crawler
```

## Cost Optimization

### Resource Right-Sizing

- Monitor actual resource usage
- Adjust container limits based on metrics
- Use spot instances for non-critical workers
- Scale down during off-peak hours

### Storage Optimization

- Archive old crawl data to object storage (S3, GCS)
- Use MongoDB compression
- Implement data retention policies
- Clean up temporary data regularly

## Support and Escalation

For production issues:
1. Check service health endpoints
2. Review application logs
3. Check monitoring dashboards
4. Contact DevOps team
5. Escalate to development team if needed

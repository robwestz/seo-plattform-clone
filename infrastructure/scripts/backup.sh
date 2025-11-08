#!/bin/bash
set -euo pipefail

# SEO Platform Backup Script
# Usage: ./backup.sh [environment]

ENVIRONMENT=${1:-staging}
BACKUP_DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="/backups/seo-platform"
S3_BUCKET="seo-platform-backups"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Setup
setup() {
    if [ "$ENVIRONMENT" = "production" ]; then
        CLUSTER_NAME="seo-platform-prod"
        NAMESPACE="seo-platform"
    else
        CLUSTER_NAME="seo-platform-staging"
        NAMESPACE="seo-platform-staging"
    fi

    aws eks update-kubeconfig --name "$CLUSTER_NAME" --region us-east-1 &> /dev/null

    mkdir -p "$BACKUP_DIR/$ENVIRONMENT/$BACKUP_DATE"
}

# Backup PostgreSQL
backup_postgres() {
    log_info "Backing up PostgreSQL database..."

    local pod=$(kubectl get pod -n "$NAMESPACE" -l app=postgres -o jsonpath='{.items[0].metadata.name}')

    kubectl exec -n "$NAMESPACE" "$pod" -- pg_dumpall -U seo_admin | \
        gzip > "$BACKUP_DIR/$ENVIRONMENT/$BACKUP_DATE/postgres-backup.sql.gz"

    log_info "PostgreSQL backup completed"
}

# Backup MongoDB
backup_mongodb() {
    log_info "Backing up MongoDB database..."

    local pod=$(kubectl get pod -n "$NAMESPACE" -l app=mongodb -o jsonpath='{.items[0].metadata.name}')

    kubectl exec -n "$NAMESPACE" "$pod" -- mongodump --archive | \
        gzip > "$BACKUP_DIR/$ENVIRONMENT/$BACKUP_DATE/mongodb-backup.archive.gz"

    log_info "MongoDB backup completed"
}

# Backup Kubernetes resources
backup_k8s_resources() {
    log_info "Backing up Kubernetes resources..."

    kubectl get all -n "$NAMESPACE" -o yaml > \
        "$BACKUP_DIR/$ENVIRONMENT/$BACKUP_DATE/k8s-resources.yaml"

    kubectl get configmap -n "$NAMESPACE" -o yaml > \
        "$BACKUP_DIR/$ENVIRONMENT/$BACKUP_DATE/configmaps.yaml"

    kubectl get secret -n "$NAMESPACE" -o yaml > \
        "$BACKUP_DIR/$ENVIRONMENT/$BACKUP_DATE/secrets.yaml"

    kubectl get pvc -n "$NAMESPACE" -o yaml > \
        "$BACKUP_DIR/$ENVIRONMENT/$BACKUP_DATE/pvcs.yaml"

    log_info "Kubernetes resources backup completed"
}

# Backup Helm values
backup_helm() {
    log_info "Backing up Helm release..."

    local release_name="seo-platform"
    if [ "$ENVIRONMENT" = "staging" ]; then
        release_name="seo-platform-staging"
    fi

    helm get values "$release_name" -n "$NAMESPACE" > \
        "$BACKUP_DIR/$ENVIRONMENT/$BACKUP_DATE/helm-values.yaml"

    log_info "Helm backup completed"
}

# Upload to S3
upload_to_s3() {
    log_info "Uploading backup to S3..."

    cd "$BACKUP_DIR/$ENVIRONMENT"
    tar -czf "$BACKUP_DATE.tar.gz" "$BACKUP_DATE/"

    aws s3 cp "$BACKUP_DATE.tar.gz" \
        "s3://$S3_BUCKET/$ENVIRONMENT/$BACKUP_DATE.tar.gz" \
        --storage-class STANDARD_IA

    log_info "Backup uploaded to S3"
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up old local backups..."

    # Keep last 7 days locally
    find "$BACKUP_DIR/$ENVIRONMENT" -type d -mtime +7 -exec rm -rf {} + || true

    log_info "Cleanup completed"
}

# Verify backup
verify_backup() {
    log_info "Verifying backup..."

    local backup_size=$(du -sh "$BACKUP_DIR/$ENVIRONMENT/$BACKUP_DATE" | cut -f1)

    log_info "Backup size: $backup_size"
    log_info "Backup location: $BACKUP_DIR/$ENVIRONMENT/$BACKUP_DATE"
}

# Main function
main() {
    log_info "Starting backup for SEO Platform"
    log_info "Environment: $ENVIRONMENT"
    log_info "Backup date: $BACKUP_DATE"

    setup
    backup_postgres
    backup_mongodb
    backup_k8s_resources
    backup_helm
    verify_backup
    upload_to_s3
    cleanup_old_backups

    log_info "========================================="
    log_info "Backup completed successfully!"
    log_info "Backup ID: $BACKUP_DATE"
    log_info "========================================="
}

main "$@"

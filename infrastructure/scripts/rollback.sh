#!/bin/bash
set -euo pipefail

# SEO Platform Rollback Script
# Usage: ./rollback.sh [environment] [revision]

ENVIRONMENT=${1:-staging}
REVISION=${2:-0}  # 0 means previous revision
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Validate environment
validate_environment() {
    if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
        log_error "Invalid environment. Must be 'staging' or 'production'"
        exit 1
    fi
}

# Setup kubeconfig
setup_kubeconfig() {
    log_info "Setting up kubeconfig for $ENVIRONMENT..."

    if [ "$ENVIRONMENT" = "production" ]; then
        CLUSTER_NAME="seo-platform-prod"
    else
        CLUSTER_NAME="seo-platform-staging"
    fi

    aws eks update-kubeconfig --name "$CLUSTER_NAME" --region us-east-1
}

# Show deployment history
show_history() {
    local release_name="seo-platform"
    local namespace="seo-platform"

    if [ "$ENVIRONMENT" = "staging" ]; then
        release_name="seo-platform-staging"
        namespace="seo-platform-staging"
    fi

    log_info "Showing deployment history..."
    helm history "$release_name" -n "$namespace"
}

# Rollback Helm release
rollback_helm() {
    local release_name="seo-platform"
    local namespace="seo-platform"

    if [ "$ENVIRONMENT" = "staging" ]; then
        release_name="seo-platform-staging"
        namespace="seo-platform-staging"
    fi

    log_warn "Rolling back $release_name to revision $REVISION..."

    # Confirm rollback
    if [ "$ENVIRONMENT" = "production" ]; then
        read -p "Are you sure you want to rollback production? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log_info "Rollback cancelled"
            exit 0
        fi
    fi

    # Perform rollback
    if [ "$REVISION" -eq 0 ]; then
        helm rollback "$release_name" -n "$namespace" --wait --timeout 10m
    else
        helm rollback "$release_name" "$REVISION" -n "$namespace" --wait --timeout 10m
    fi

    log_info "Rollback completed"
}

# Verify rollback
verify_rollback() {
    local namespace="seo-platform"
    if [ "$ENVIRONMENT" = "staging" ]; then
        namespace="seo-platform-staging"
    fi

    log_info "Verifying rollback..."

    local deployments=("backend" "crawler" "ml-service" "frontend")

    for deployment in "${deployments[@]}"; do
        kubectl rollout status deployment/"$deployment" -n "$namespace" --timeout=10m
    done

    log_info "Rollback verified successfully"
}

# Main function
main() {
    log_info "Starting rollback of SEO Platform"
    log_info "Environment: $ENVIRONMENT"

    validate_environment
    setup_kubeconfig
    show_history
    rollback_helm
    verify_rollback

    log_info "========================================="
    log_info "Rollback completed successfully!"
    log_info "========================================="
}

main "$@"

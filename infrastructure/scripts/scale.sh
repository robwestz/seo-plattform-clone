#!/bin/bash
set -euo pipefail

# SEO Platform Scaling Script
# Usage: ./scale.sh [environment] [service] [replicas]

ENVIRONMENT=${1:-staging}
SERVICE=${2:-backend}
REPLICAS=${3:-3}

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

# Validate inputs
validate_inputs() {
    if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
        log_error "Invalid environment. Must be 'staging' or 'production'"
        exit 1
    fi

    if [[ ! "$SERVICE" =~ ^(backend|crawler|ml-service|frontend|all)$ ]]; then
        log_error "Invalid service. Must be 'backend', 'crawler', 'ml-service', 'frontend', or 'all'"
        exit 1
    fi

    if ! [[ "$REPLICAS" =~ ^[0-9]+$ ]] || [ "$REPLICAS" -lt 0 ]; then
        log_error "Invalid replicas. Must be a non-negative integer"
        exit 1
    fi
}

# Setup kubeconfig
setup_kubeconfig() {
    if [ "$ENVIRONMENT" = "production" ]; then
        CLUSTER_NAME="seo-platform-prod"
        NAMESPACE="seo-platform"
    else
        CLUSTER_NAME="seo-platform-staging"
        NAMESPACE="seo-platform-staging"
    fi

    aws eks update-kubeconfig --name "$CLUSTER_NAME" --region us-east-1 &> /dev/null
}

# Scale deployment
scale_deployment() {
    local deployment=$1
    local replicas=$2

    log_info "Scaling $deployment to $replicas replicas..."

    kubectl scale deployment "$deployment" \
        --replicas="$replicas" \
        -n "$NAMESPACE"

    # Wait for scaling to complete
    kubectl rollout status deployment/"$deployment" \
        -n "$NAMESPACE" \
        --timeout=5m

    local current=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}')

    log_info "$deployment scaled successfully: $current/$replicas replicas ready"
}

# Scale all services
scale_all() {
    local services=("backend" "crawler" "ml-service" "frontend")

    for service in "${services[@]}"; do
        scale_deployment "$service" "$REPLICAS"
    done
}

# Show current scale
show_current_scale() {
    log_info "Current deployment scale:"
    log_info ""

    kubectl get deployments -n "$NAMESPACE" \
        -o custom-columns=NAME:.metadata.name,DESIRED:.spec.replicas,CURRENT:.status.replicas,READY:.status.readyReplicas
}

# Main function
main() {
    log_info "SEO Platform Scaling Tool"
    log_info "Environment: $ENVIRONMENT"
    log_info "Service: $SERVICE"
    log_info "Target replicas: $REPLICAS"
    log_info ""

    validate_inputs
    setup_kubeconfig
    show_current_scale

    log_info ""

    if [ "$SERVICE" = "all" ]; then
        scale_all
    else
        scale_deployment "$SERVICE" "$REPLICAS"
    fi

    log_info ""
    log_info "========================================="
    log_info "Scaling completed successfully!"
    log_info "========================================="
    log_info ""

    show_current_scale
}

main "$@"

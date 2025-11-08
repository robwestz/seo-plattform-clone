#!/bin/bash
set -euo pipefail

# SEO Platform Deployment Script
# Usage: ./deploy.sh [environment] [version]

ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRASTRUCTURE_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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
    log_info "Deploying to environment: $ENVIRONMENT"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    local missing_tools=()

    for tool in kubectl helm docker aws; do
        if ! command -v $tool &> /dev/null; then
            missing_tools+=($tool)
        fi
    done

    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi

    log_info "All prerequisites satisfied"
}

# Get kubeconfig
setup_kubeconfig() {
    log_info "Setting up kubeconfig for $ENVIRONMENT..."

    if [ "$ENVIRONMENT" = "production" ]; then
        CLUSTER_NAME="seo-platform-prod"
    else
        CLUSTER_NAME="seo-platform-staging"
    fi

    aws eks update-kubeconfig --name "$CLUSTER_NAME" --region us-east-1

    # Verify connection
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Failed to connect to Kubernetes cluster"
        exit 1
    fi

    log_info "Connected to cluster: $CLUSTER_NAME"
}

# Create namespace
create_namespace() {
    local namespace="seo-platform"
    if [ "$ENVIRONMENT" = "staging" ]; then
        namespace="seo-platform-staging"
    fi

    log_info "Creating namespace: $namespace"
    kubectl create namespace "$namespace" --dry-run=client -o yaml | kubectl apply -f -
}

# Deploy with Helm
deploy_helm() {
    log_info "Deploying with Helm..."

    local release_name="seo-platform"
    local namespace="seo-platform"
    local values_file="$INFRASTRUCTURE_DIR/helm/seo-platform/values.yaml"

    if [ "$ENVIRONMENT" = "staging" ]; then
        release_name="seo-platform-staging"
        namespace="seo-platform-staging"
    else
        values_file="$INFRASTRUCTURE_DIR/helm/seo-platform/values-prod.yaml"
    fi

    # Perform Helm upgrade
    helm upgrade --install "$release_name" \
        "$INFRASTRUCTURE_DIR/helm/seo-platform" \
        --namespace "$namespace" \
        --values "$values_file" \
        --set global.registry="${REGISTRY:-ghcr.io/seo-platform}" \
        --set backend.image.tag="$VERSION" \
        --set crawler.image.tag="$VERSION" \
        --set mlService.image.tag="$VERSION" \
        --set frontend.image.tag="$VERSION" \
        --wait \
        --timeout 15m \
        --atomic

    log_info "Helm deployment completed"
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."

    local namespace="seo-platform"
    if [ "$ENVIRONMENT" = "staging" ]; then
        namespace="seo-platform-staging"
    fi

    # Check deployment status
    local deployments=("backend" "crawler" "ml-service" "frontend")

    for deployment in "${deployments[@]}"; do
        log_info "Checking deployment: $deployment"
        if ! kubectl rollout status deployment/"$deployment" -n "$namespace" --timeout=10m; then
            log_error "Deployment $deployment failed"
            return 1
        fi
    done

    log_info "All deployments verified successfully"
}

# Run smoke tests
run_smoke_tests() {
    log_info "Running smoke tests..."

    local namespace="seo-platform"
    if [ "$ENVIRONMENT" = "staging" ]; then
        namespace="seo-platform-staging"
    fi

    # Test backend health
    kubectl run smoke-test-backend --rm -i --restart=Never \
        --image=curlimages/curl:latest \
        --namespace="$namespace" \
        -- curl -f http://backend:3000/health || {
            log_error "Backend health check failed"
            return 1
        }

    log_info "Smoke tests passed"
}

# Main deployment flow
main() {
    log_info "Starting deployment of SEO Platform"
    log_info "Environment: $ENVIRONMENT"
    log_info "Version: $VERSION"

    validate_environment
    check_prerequisites
    setup_kubeconfig
    create_namespace
    deploy_helm
    verify_deployment
    run_smoke_tests

    log_info "========================================="
    log_info "Deployment completed successfully!"
    log_info "Environment: $ENVIRONMENT"
    log_info "Version: $VERSION"
    log_info "========================================="
}

# Run main function
main "$@"

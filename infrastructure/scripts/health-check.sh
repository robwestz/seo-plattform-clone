#!/bin/bash
set -euo pipefail

# SEO Platform Health Check Script
# Usage: ./health-check.sh [environment]

ENVIRONMENT=${1:-staging}

# Colors
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

check_success() {
    echo -e "${GREEN}✓${NC} $1"
}

check_failure() {
    echo -e "${RED}✗${NC} $1"
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

# Check cluster connectivity
check_cluster() {
    log_info "Checking cluster connectivity..."

    if kubectl cluster-info &> /dev/null; then
        check_success "Cluster is reachable"
        return 0
    else
        check_failure "Cannot connect to cluster"
        return 1
    fi
}

# Check node status
check_nodes() {
    log_info "Checking node status..."

    local total_nodes=$(kubectl get nodes --no-headers | wc -l)
    local ready_nodes=$(kubectl get nodes --no-headers | grep -c " Ready")

    if [ "$total_nodes" -eq "$ready_nodes" ]; then
        check_success "All $total_nodes nodes are Ready"
        return 0
    else
        check_failure "Only $ready_nodes/$total_nodes nodes are Ready"
        kubectl get nodes
        return 1
    fi
}

# Check deployments
check_deployments() {
    log_info "Checking deployment status..."

    local deployments=("backend" "crawler" "ml-service" "frontend")
    local all_healthy=true

    for deployment in "${deployments[@]}"; do
        local desired=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
        local ready=$(kubectl get deployment "$deployment" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")

        if [ "$desired" -eq "$ready" ] && [ "$ready" -gt 0 ]; then
            check_success "$deployment: $ready/$desired replicas ready"
        else
            check_failure "$deployment: $ready/$desired replicas ready"
            all_healthy=false
        fi
    done

    if [ "$all_healthy" = true ]; then
        return 0
    else
        return 1
    fi
}

# Check StatefulSets
check_statefulsets() {
    log_info "Checking StatefulSet status..."

    local statefulsets=("postgres" "mongodb" "redis" "kafka")
    local all_healthy=true

    for sts in "${statefulsets[@]}"; do
        local desired=$(kubectl get statefulset "$sts" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
        local ready=$(kubectl get statefulset "$sts" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")

        if [ "$desired" -eq "$ready" ] && [ "$ready" -gt 0 ]; then
            check_success "$sts: $ready/$desired replicas ready"
        else
            check_failure "$sts: $ready/$desired replicas ready"
            all_healthy=false
        fi
    done

    if [ "$all_healthy" = true ]; then
        return 0
    else
        return 1
    fi
}

# Check pod health
check_pods() {
    log_info "Checking pod health..."

    local total_pods=$(kubectl get pods -n "$NAMESPACE" --no-headers | wc -l)
    local running_pods=$(kubectl get pods -n "$NAMESPACE" --no-headers | grep -c "Running" || true)
    local failed_pods=$(kubectl get pods -n "$NAMESPACE" --field-selector=status.phase=Failed --no-headers | wc -l)

    if [ "$failed_pods" -gt 0 ]; then
        check_failure "$failed_pods pod(s) in Failed state"
        kubectl get pods -n "$NAMESPACE" --field-selector=status.phase=Failed
        return 1
    elif [ "$running_pods" -eq "$total_pods" ]; then
        check_success "All $total_pods pods are Running"
        return 0
    else
        check_warn "$running_pods/$total_pods pods are Running"
        return 1
    fi
}

# Check service endpoints
check_services() {
    log_info "Checking service endpoints..."

    local services=("backend" "crawler" "ml-service" "frontend")
    local all_healthy=true

    for service in "${services[@]}"; do
        local endpoints=$(kubectl get endpoints "$service" -n "$NAMESPACE" -o jsonpath='{.subsets[*].addresses[*].ip}' 2>/dev/null || echo "")
        local count=$(echo $endpoints | wc -w)

        if [ "$count" -gt 0 ]; then
            check_success "$service: $count endpoint(s)"
        else
            check_failure "$service: No endpoints available"
            all_healthy=false
        fi
    done

    if [ "$all_healthy" = true ]; then
        return 0
    else
        return 1
    fi
}

# Check PVCs
check_pvcs() {
    log_info "Checking PersistentVolumeClaims..."

    local pending=$(kubectl get pvc -n "$NAMESPACE" --no-headers 2>/dev/null | grep -c "Pending" || true)

    if [ "$pending" -gt 0 ]; then
        check_failure "$pending PVC(s) in Pending state"
        kubectl get pvc -n "$NAMESPACE" | grep "Pending"
        return 1
    else
        check_success "All PVCs are Bound"
        return 0
    fi
}

# Check recent errors in logs
check_logs() {
    log_info "Checking for recent errors in logs..."

    local deployments=("backend" "crawler" "ml-service" "frontend")
    local errors_found=false

    for deployment in "${deployments[@]}"; do
        local pod=$(kubectl get pod -n "$NAMESPACE" -l app="$deployment" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

        if [ -n "$pod" ]; then
            local error_count=$(kubectl logs "$pod" -n "$NAMESPACE" --tail=100 2>/dev/null | grep -ci "error\|fatal\|exception" || true)

            if [ "$error_count" -gt 0 ]; then
                check_warn "$deployment: $error_count error(s) found in recent logs"
                errors_found=true
            fi
        fi
    done

    if [ "$errors_found" = false ]; then
        check_success "No recent errors found in logs"
    fi
}

# Generate health report
generate_report() {
    local total_checks=0
    local passed_checks=0

    log_info ""
    log_info "========================================="
    log_info "Health Check Summary"
    log_info "Environment: $ENVIRONMENT"
    log_info "Timestamp: $(date)"
    log_info "========================================="

    # Run all checks and count results
    check_cluster && ((passed_checks++)) || true
    ((total_checks++))

    check_nodes && ((passed_checks++)) || true
    ((total_checks++))

    check_deployments && ((passed_checks++)) || true
    ((total_checks++))

    check_statefulsets && ((passed_checks++)) || true
    ((total_checks++))

    check_pods && ((passed_checks++)) || true
    ((total_checks++))

    check_services && ((passed_checks++)) || true
    ((total_checks++))

    check_pvcs && ((passed_checks++)) || true
    ((total_checks++))

    check_logs

    log_info ""
    log_info "========================================="
    log_info "Result: $passed_checks/$total_checks checks passed"

    if [ "$passed_checks" -eq "$total_checks" ]; then
        log_info "Status: ${GREEN}HEALTHY${NC}"
        log_info "========================================="
        exit 0
    else
        log_warn "Status: ${YELLOW}DEGRADED${NC}"
        log_info "========================================="
        exit 1
    fi
}

# Main function
main() {
    log_info "Running health check for SEO Platform"
    log_info "Environment: $ENVIRONMENT"
    log_info ""

    setup_kubeconfig
    generate_report
}

main "$@"

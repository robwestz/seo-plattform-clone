.PHONY: help build run test clean docker-build docker-up docker-down deps

# Default target
help:
	@echo "Available targets:"
	@echo "  build         - Build all Go binaries"
	@echo "  build-crawler - Build crawler binary"
	@echo "  build-scheduler - Build scheduler binary"
	@echo "  build-renderer - Build renderer service"
	@echo "  run-crawler   - Run crawler locally"
	@echo "  run-scheduler - Run scheduler locally"
	@echo "  run-renderer  - Run renderer locally"
	@echo "  test          - Run tests"
	@echo "  deps          - Download Go dependencies"
	@echo "  docker-build  - Build Docker images"
	@echo "  docker-up     - Start all services with Docker Compose"
	@echo "  docker-down   - Stop all services"
	@echo "  clean         - Clean build artifacts"

# Build targets
build: build-crawler build-scheduler build-renderer

build-crawler:
	@echo "Building crawler..."
	go build -o bin/crawler ./cmd/crawler

build-scheduler:
	@echo "Building scheduler..."
	go build -o bin/scheduler ./cmd/scheduler

build-renderer:
	@echo "Building renderer..."
	cd renderer && npm install && npm run build

# Run targets
run-crawler:
	@echo "Running crawler..."
	go run ./cmd/crawler/main.go

run-scheduler:
	@echo "Running scheduler..."
	go run ./cmd/scheduler/main.go

run-renderer:
	@echo "Running renderer..."
	cd renderer && npm run dev

# Test targets
test:
	@echo "Running Go tests..."
	go test -v -race -coverprofile=coverage.out ./...
	@echo "Running renderer tests..."
	cd renderer && npm test

# Dependencies
deps:
	@echo "Downloading Go dependencies..."
	go mod download
	go mod tidy
	@echo "Installing renderer dependencies..."
	cd renderer && npm install

# Docker targets
docker-build:
	@echo "Building Docker images..."
	docker-compose build

docker-up:
	@echo "Starting services..."
	docker-compose up -d

docker-down:
	@echo "Stopping services..."
	docker-compose down

docker-logs:
	docker-compose logs -f

# Clean
clean:
	@echo "Cleaning build artifacts..."
	rm -rf bin/
	rm -rf renderer/dist/
	rm -rf renderer/node_modules/
	go clean

# Database initialization
init-db:
	@echo "Initializing database..."
	psql -h localhost -U postgres -d seo_platform -f init-db.sql

# Linting
lint:
	@echo "Linting Go code..."
	golangci-lint run ./...
	@echo "Linting TypeScript code..."
	cd renderer && npm run lint

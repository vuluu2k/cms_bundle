.PHONY: help install start dev test lint lint-fix format format-check clean docker-build docker-up docker-down docker-dev docker-logs docker-restart

# Default target
.DEFAULT_GOAL := help

# Variables
DOCKER_COMPOSE = docker-compose
DOCKER_COMPOSE_DEV = docker-compose -f docker-compose.dev.yml
PORT ?= 3008

## help: Display available commands
help:
	@echo "Available commands:"
	@echo ""
	@echo "  make install          - Install dependencies"
	@echo "  make start            - Run application in production mode"
	@echo "  make dev              - Run application in development mode (with watch)"
	@echo "  make test             - Run tests"
	@echo "  make lint             - Check ESLint errors"
	@echo "  make lint-fix         - Auto-fix ESLint errors"
	@echo "  make format           - Format code with Prettier"
	@echo "  make format-check     - Check code format"
	@echo "  make clean            - Remove node_modules and temporary files"
	@echo ""
	@echo "Docker commands:"
	@echo "  make docker-build     - Build Docker image"
	@echo "  make docker-build-dev - Build Docker image (development)"
	@echo "  make docker-up        - Run Docker container (production)"
	@echo "  make docker-down      - Stop Docker container"
	@echo "  make docker-dev       - Run Docker container (development)"
	@echo "  make docker-logs      - View Docker container logs"
	@echo "  make docker-restart   - Restart Docker container"
	@echo "  make docker-clean     - Remove Docker containers and images"
	@echo "  make docker-bash-dev  - Open bash in development container"

## install: Install dependencies
install:
	@echo "📦 Installing dependencies..."
	npm install

## start: Run application in production mode
start:
	@echo "🚀 Starting application (production mode)..."
	npm start

## dev: Run application in development mode
dev:
	@echo "🔧 Starting application (development mode)..."
	npm run dev

## test: Run tests
test:
	@echo "🧪 Running tests..."
	npm test

## lint: Check ESLint errors
lint:
	@echo "🔍 Checking ESLint errors..."
	npm run lint

## lint-fix: Auto-fix ESLint errors
lint-fix:
	@echo "🔧 Fixing ESLint errors..."
	npm run lint:fix

## format: Format code with Prettier
format:
	@echo "✨ Formatting code with Prettier..."
	npm run format

## format-check: Check code format
format-check:
	@echo "✅ Checking code format..."
	npm run format:check

## clean: Remove node_modules and temporary files
clean:
	@echo "🧹 Cleaning up..."
	rm -rf node_modules
	rm -rf bundle/*
	rm -rf .nyc_output
	rm -rf coverage
	find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	@echo "✅ Cleanup completed!"

## docker-build: Build Docker image
docker-build:
	@echo "🐳 Building Docker image..."
	$(DOCKER_COMPOSE) build

## docker-up: Run Docker container (production)
docker-up:
	@echo "🐳 Starting Docker container (production)..."
	$(DOCKER_COMPOSE) up -d
	@echo "✅ Container started!"

## docker-down: Stop Docker container
docker-down:
	@echo "🐳 Stopping Docker container..."
	$(DOCKER_COMPOSE) down
	@echo "✅ Container stopped!"

## docker-build-dev: Build Docker image (development)
docker-build-dev:
	@echo "🐳 Building Docker image (development)..."
	$(DOCKER_COMPOSE_DEV) build

## docker-dev: Run Docker container (development)
docker-dev:
	@echo "🐳 Starting Docker container (development)..."
	$(DOCKER_COMPOSE_DEV) up
	@echo "✅ Development container started!"

## docker-logs: View Docker container logs
docker-logs:
	@echo "📋 Viewing logs..."
	$(DOCKER_COMPOSE) logs -f

## docker-logs-dev: View Docker container logs (development)
docker-logs-dev:
	@echo "📋 Viewing logs (development)..."
	$(DOCKER_COMPOSE_DEV) logs -f

## docker-restart: Restart Docker container
docker-restart: docker-down docker-up
	@echo "✅ Container restarted!"

## docker-clean: Remove Docker containers and images
docker-clean:
	@echo "🧹 Removing Docker containers and images..."
	$(DOCKER_COMPOSE) down -v --rmi all
	$(DOCKER_COMPOSE_DEV) down -v --rmi all
	@echo "✅ Docker cleanup completed!"

## docker-stop-dev: Stop Docker container (development)
docker-stop-dev:
	@echo "🐳 Stopping Docker container (development)..."
	$(DOCKER_COMPOSE_DEV) down
	@echo "✅ Development container stopped!"

## docker-bash-dev: Open bash in development container
docker-bash-dev:
	@echo "🐳 Opening bash in development container..."
	$(DOCKER_COMPOSE_DEV) exec cms-bundle bash

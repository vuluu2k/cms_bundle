.PHONY: help install start dev test lint lint-fix format format-check clean docker-build docker-up docker-down docker-dev docker-logs docker-restart

# Default target
.DEFAULT_GOAL := help

# Variables
DOCKER_COMPOSE = docker-compose
DOCKER_COMPOSE_DEV = docker-compose -f docker-compose.dev.yml
PORT ?= 3008

## help: Hiển thị danh sách các lệnh có sẵn
help:
	@echo "Các lệnh có sẵn:"
	@echo ""
	@echo "  make install          - Cài đặt dependencies"
	@echo "  make start            - Chạy ứng dụng ở production mode"
	@echo "  make dev              - Chạy ứng dụng ở development mode (với watch)"
	@echo "  make test             - Chạy tests"
	@echo "  make lint             - Kiểm tra lỗi ESLint"
	@echo "  make lint-fix         - Tự động sửa lỗi ESLint"
	@echo "  make format           - Format code với Prettier"
	@echo "  make format-check     - Kiểm tra format code"
	@echo "  make clean            - Xóa node_modules và các file tạm"
	@echo ""
	@echo "Docker commands:"
	@echo "  make docker-build     - Build Docker image"
	@echo "  make docker-up        - Chạy Docker container (production)"
	@echo "  make docker-down      - Dừng Docker container"
	@echo "  make docker-dev       - Chạy Docker container (development)"
	@echo "  make docker-logs      - Xem logs của Docker container"
	@echo "  make docker-restart   - Restart Docker container"
	@echo "  make docker-clean     - Xóa Docker containers và images"

## install: Cài đặt dependencies
install:
	@echo "📦 Đang cài đặt dependencies..."
	npm install

## start: Chạy ứng dụng ở production mode
start:
	@echo "🚀 Đang khởi động ứng dụng (production mode)..."
	npm start

## dev: Chạy ứng dụng ở development mode
dev:
	@echo "🔧 Đang khởi động ứng dụng (development mode)..."
	npm run dev

## test: Chạy tests
test:
	@echo "🧪 Đang chạy tests..."
	npm test

## lint: Kiểm tra lỗi ESLint
lint:
	@echo "🔍 Đang kiểm tra lỗi ESLint..."
	npm run lint

## lint-fix: Tự động sửa lỗi ESLint
lint-fix:
	@echo "🔧 Đang sửa lỗi ESLint..."
	npm run lint:fix

## format: Format code với Prettier
format:
	@echo "✨ Đang format code với Prettier..."
	npm run format

## format-check: Kiểm tra format code
format-check:
	@echo "✅ Đang kiểm tra format code..."
	npm run format:check

## clean: Xóa node_modules và các file tạm
clean:
	@echo "🧹 Đang dọn dẹp..."
	rm -rf node_modules
	rm -rf bundle/*
	rm -rf .nyc_output
	rm -rf coverage
	find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	@echo "✅ Đã dọn dẹp xong!"

## docker-build: Build Docker image
docker-build:
	@echo "🐳 Đang build Docker image..."
	$(DOCKER_COMPOSE) build

## docker-up: Chạy Docker container (production)
docker-up:
	@echo "🐳 Đang khởi động Docker container (production)..."
	$(DOCKER_COMPOSE) up -d
	@echo "✅ Container đã được khởi động!"

## docker-down: Dừng Docker container
docker-down:
	@echo "🐳 Đang dừng Docker container..."
	$(DOCKER_COMPOSE) down
	@echo "✅ Container đã được dừng!"

## docker-dev: Chạy Docker container (development)
docker-dev:
	@echo "🐳 Đang khởi động Docker container (development)..."
	$(DOCKER_COMPOSE_DEV) up -d
	@echo "✅ Container development đã được khởi động!"

## docker-logs: Xem logs của Docker container
docker-logs:
	@echo "📋 Đang xem logs..."
	$(DOCKER_COMPOSE) logs -f

## docker-logs-dev: Xem logs của Docker container (development)
docker-logs-dev:
	@echo "📋 Đang xem logs (development)..."
	$(DOCKER_COMPOSE_DEV) logs -f

## docker-restart: Restart Docker container
docker-restart: docker-down docker-up
	@echo "✅ Container đã được restart!"

## docker-clean: Xóa Docker containers và images
docker-clean:
	@echo "🧹 Đang xóa Docker containers và images..."
	$(DOCKER_COMPOSE) down -v --rmi all
	$(DOCKER_COMPOSE_DEV) down -v --rmi all
	@echo "✅ Đã dọn dẹp Docker!"

## docker-stop-dev: Dừng Docker container (development)
docker-stop-dev:
	@echo "🐳 Đang dừng Docker container (development)..."
	$(DOCKER_COMPOSE_DEV) down
	@echo "✅ Container development đã được dừng!"


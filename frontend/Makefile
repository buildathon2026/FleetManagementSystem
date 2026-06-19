.PHONY: help install dev build clean

help:
	@echo "Fleet Management System - Frontend"
	@echo "===================================="
	@echo ""
	@echo "Commands:"
	@echo "  make install    - Install dependencies"
	@echo "  make dev        - Start development server on :3000"
	@echo "  make build      - Build for production"
	@echo "  make clean      - Clean build artifacts"
	@echo ""
	@echo "Frontend runs on: http://localhost:3000"
	@echo "Backend API: http://192.168.1.160:8002 (configurable in .env)"

install:
	npm install --legacy-peer-deps
	@echo "✓ Dependencies installed"

dev:
	npm run dev

build:
	npm run build

clean:
	rm -rf dist node_modules
	@echo "✓ Cleaned up"

.DEFAULT_GOAL := help

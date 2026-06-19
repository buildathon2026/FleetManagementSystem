# Cross-platform variables for virtual environment
VENV_DIR := venv
PYTHON := python3
PIP := $(PYTHON) -m pip
PYTHON_VENV := $(VENV_DIR)/bin/python
PIP_VENV := $(VENV_DIR)/bin/pip

# Detect OS
UNAME_S := $(shell uname -s)
ifeq ($(OS),Windows_NT)
    VENV_DIR := venv
    PYTHON_VENV := $(VENV_DIR)\Scripts\python.exe
    PIP_VENV := $(VENV_DIR)\Scripts\pip.exe
    PYTHON := python
    RM := cmd /c del
    RMDIR := cmd /c rmdir /s /q
else ifeq ($(UNAME_S),Darwin)
    PYTHON := python3
    RM := rm -f
    RMDIR := rm -rf
else
    PYTHON := python3
    RM := rm -f
    RMDIR := rm -rf
endif

.PHONY: help venv install run dev test clean lint ingestion-stats ingest-sample generate-data ingest-all

help:
	@echo "Document Ingestion Pipeline - Commands"
	@echo "======================================"
	@echo ""
	@echo "Setup Commands:"
	@echo "  make venv       - Create virtual environment"
	@echo "  make install    - Install dependencies in venv"
	@echo ""
	@echo "Runtime Commands:"
	@echo "  make run        - Run production server"
	@echo "  make dev        - Run development server with auto-reload"
	@echo ""
	@echo "Data Commands:"
	@echo "  make generate-data  - Generate synthetic fleet documents (~230 docs)"
	@echo "  make ingest-all     - Ingest all synthetic documents into pipeline"
	@echo "  make seed-database  - Full pipeline: generate → clean → ingest"
	@echo ""
	@echo "Utility Commands:"
	@echo "  make test           - Run tests"
	@echo "  make clean          - Clean database and cache files"
	@echo "  make lint           - Run linting checks"
	@echo "  make ingestion-stats    - Show pipeline statistics"
	@echo "  make ingest-sample      - Test single document ingestion"
	@echo ""
	@echo "Virtual Environment:"
	@echo "  VENV_DIR: $(VENV_DIR)"
	@echo "  PYTHON: $(PYTHON)"

venv:
	$(PYTHON) -m venv $(VENV_DIR)
	@echo "✓ Virtual environment created at $(VENV_DIR)"
	@echo "✓ Activate with:"
ifeq ($(OS),Windows_NT)
	@echo "    $(VENV_DIR)\Scripts\activate"
else
	@echo "    source $(VENV_DIR)/bin/activate"
endif

install: venv
	$(PIP_VENV) install --upgrade pip setuptools wheel
	$(PIP_VENV) install -r requirements.txt
	@echo "✓ Dependencies installed successfully"

run:
	$(PYTHON_VENV) -m uvicorn src.app:app --host 0.0.0.0 --port 8004

dev:
	$(PYTHON_VENV) -m uvicorn src.app:app --host 0.0.0.0 --port 8004 --reload

test:
	$(PYTHON_VENV) -m pytest tests/ -v --tb=short

clean:
	@echo "Cleaning up..."
ifeq ($(OS),Windows_NT)
	-cmd /c if exist fleet.db del fleet.db
	-cmd /c if exist chromadb $(RMDIR) chromadb
	-for /d /r . %d in (__pycache__) do @if exist "%d" $(RMDIR) "%d"
	-for /r . %f in (*.pyc) do @if exist "%f" $(RM) "%f"
else
	-$(RM) fleet.db
	-$(RMDIR) chromadb
	-find . -type d -name __pycache__ -exec $(RMDIR) {} + 2>/dev/null || true
	-find . -type f -name "*.pyc" -delete 2>/dev/null || true
endif
	@echo "✓ Cleanup complete"

lint:
	$(PYTHON_VENV) -m black src/ tests/
	$(PYTHON_VENV) -m flake8 src/ tests/
	$(PYTHON_VENV) -m isort src/ tests/

ingestion-stats:
	@$(PYTHON_VENV) -c "from src.ingestion import DocumentIngestionPipeline; p = DocumentIngestionPipeline(); import json; print(json.dumps(p.get_stats(), indent=2))"

ingest-sample:
	@$(PYTHON_VENV) -c "\
import asyncio; \
from src.ingestion import DocumentIngestionPipeline; \
p = DocumentIngestionPipeline(); \
result = asyncio.run(p.ingest_document('test.txt', 'Sample content')); \
print('Ingestion result:'); \
print(f'  Status: {result[\"status\"]}'); \
print(f'  Doc ID: {result[\"doc_id\"]}'); \
"

generate-data:
	@echo "🔄 Generating synthetic fleet documents..."
	@$(PYTHON) ../data/synthetic/generate_synthetic_data.py
	@echo "✓ Synthetic data generated in: ../data/synthetic/"
	@find ../data/synthetic -type f | wc -l && echo "documents created"

ingest-all:
	@echo "📥 Ingesting all synthetic documents..."
	@$(PYTHON_VENV) examples.py
	@echo "✓ Ingestion complete"

seed-database: clean generate-data ingest-all ingestion-stats
	@echo "✓ Database seeding complete!"

.DEFAULT_GOAL := help

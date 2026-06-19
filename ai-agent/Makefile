.PHONY: install dev test clean

VENV := .venv
PYTHON_VENV := $(VENV)/bin/python
PIP_VENV := $(VENV)/bin/pip

venv:
	python3 -m venv $(VENV)

install: venv
	$(PIP_VENV) install --upgrade pip setuptools wheel
	$(PIP_VENV) install -r requirements.txt
	@echo "✓ Dependencies installed successfully"

dev: install
	$(VENV)/bin/uvicorn src.agent:app --host 0.0.0.0 --port 8001 --reload

run: install
	$(VENV)/bin/uvicorn src.agent:app --host 0.0.0.0 --port 8001

test: install
	$(VENV)/bin/pytest -q

clean:
	rm -rf $(VENV) __pycache__ src/__pycache__ .pytest_cache

.PHONY: install run dev clean

VENV := .venv
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip

install: $(VENV)/bin/activate

$(VENV)/bin/activate: requirements.txt
	python3 -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
	touch $(VENV)/bin/activate

run: install
	@echo "Starting AI Agent on port 8001..."
	@echo "Ensure FleetDataService is running on port 8002"
	FEATHERLESS_API_KEY=$${FEATHERLESS_API_KEY} $(VENV)/bin/uvicorn src.agent:app --host 0.0.0.0 --port 8001

dev: install
	@echo "Starting AI Agent (dev mode) on port 8001..."
	FEATHERLESS_API_KEY=$${FEATHERLESS_API_KEY} $(VENV)/bin/uvicorn src.agent:app --host 0.0.0.0 --port 8001 --reload

clean:
	rm -rf $(VENV) __pycache__ src/__pycache__

.PHONY: dev test

dev:
	uvicorn src.agent:app --host 0.0.0.0 --port 8001 --reload

test:
	pytest -q

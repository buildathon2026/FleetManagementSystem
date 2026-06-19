.PHONY: dev test seed

dev:
	uvicorn src.app:app --host 0.0.0.0 --port 8003 --reload

test:
	pytest -q

seed:
	python -m src.seed

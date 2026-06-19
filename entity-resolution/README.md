# Entity Resolution Engine

FastAPI service for resolving messy fleet mentions to canonical entities.

## Why Python

This module is Python/FastAPI because the work is data-heavy: SQLite graph access,
normalization rules, cosine similarity, and future embedding or ML upgrades all fit
Python's ecosystem well.

## Run

```bash
cd entity-resolution
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
make dev
```

The API runs on port `8003`.

## Endpoints

```text
GET  /resolve?mention=truck+84
GET  /entity/{entity_id}
GET  /entities
POST /entity/register-alias
GET  /health
```

The SQLite database is created at `data/entity_graph.db` on first startup and is
seeded with a small fabricated fleet graph for demos.

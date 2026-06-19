# AI Agent

Module 4: Planner + Formatter service for the Fleet Management System.

The first implementation uses a deterministic rule-based planner and formatter
with the same JSON plan structure expected from an LLM planner. This keeps the
demo reliable and makes it easy to swap in Featherless/API-backed models later.

## Run

```bash
cd ai-agent
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
make dev
```

The API runs on port `8001`.

## Environment

```bash
MCP_TOOLS_URL=http://192.168.1.160:8002/tools
MCP_TOOLS_LIST_URL=http://192.168.1.160:8002/tools/list
FLEET_DATA_URL=http://192.168.1.160:8002
ENTITY_RESOLUTION_URL=http://localhost:8003
INGESTION_URL=http://localhost:8004
AGENT_DB_PATH=data/agent.db
```

## Endpoints

```text
POST /ask
GET  /conversation/{id}
POST /feedback
GET  /health
```

Example:

```bash
curl -X POST http://localhost:8001/ask \
  -H 'content-type: application/json' \
  -d '{"question":"How profitable was truck 84 in May 2026?","conversation_id":"conv-001"}'
```

# Module 4: AI Agent (Planner + Formatter)

Natural language Q&A agent for fleet management. Converts questions into tool-call plans, executes them against the MCP Data Server (Module 1), and formats results into human-readable answers.

## Architecture

```
User Question
     │
     ▼
┌─────────────────────────┐
│  Planner (8B LLM)       │  ← Converts question to JSON tool plan
│  temp=0.0, deterministic│
└────────────┬────────────┘
             │ [{"tool": "get_expenses", "params": {...}}]
             ▼
┌─────────────────────────┐
│  Tool Executor          │  ← Parallel HTTP calls to MCP Data Server
│  asyncio.gather()       │
└────────────┬────────────┘
             │ [{tool, params, result, timing}]
             ▼
┌─────────────────────────┐
│  Formatter (70B LLM)    │  ← Produces NL answer with citations
│  temp=0.3               │
└─────────────────────────┘
```

## Prerequisites

- Python 3.11+
- Module 1 (FleetDataService) running on port 8002
- `FEATHERLESS_API_KEY` environment variable set

## Quick Start

```bash
# Set API key
export FEATHERLESS_API_KEY=your_key_here

# Install and run
make run
```

The agent starts on port 8001.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /ask | Ask a natural language question |
| GET | /conversation/:id | Get conversation history |
| POST | /feedback | Submit thumbs up/down |
| GET | /health | Health check |

## Example

```bash
curl -X POST http://localhost:8001/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "How much did I spend on fuel last month?"}'
```

## Integration with Module 1

The AI Agent calls the MCP Data Server's REST API endpoints:
- `GET /tools/expenses` → get_expenses
- `GET /tools/revenue` → get_revenue
- `GET /tools/profit` → get_truck_profit
- `GET /tools/documents` → find_document
- `GET /tools/entity/resolve` → resolve_entity
- `GET /tools/renewals` → get_upcoming_renewals
- `GET /tools/fleet-overview` → get_fleet_overview

The LLM never accesses the database directly — all data flows through Module 1's typed, validated endpoints (zero-hallucination architecture).

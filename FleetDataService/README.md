# Fleet Data Service

MCP Data Server for the Fleet Management System. Provides RESTful endpoints for fleet financial data, document management, and entity resolution.

## Quick Start

```bash
make setup    # Install dependencies
make build    # Compile TypeScript
make run      # Start server on port 8002
```

For development with auto-reload:

```bash
make dev
```

## Endpoints

### Health Check

```bash
curl http://localhost:8002/health
```

### Get Expenses

Query expense records with optional filters.

```bash
# All expenses for truck T-084
curl "http://localhost:8002/tools/expenses?truck_id=T-084"

# Filter by category and date range
curl "http://localhost:8002/tools/expenses?truck_id=T-084&category=parts&date_from=2026-05-01&date_to=2026-05-31"

# All fuel expenses across fleet
curl "http://localhost:8002/tools/expenses?category=fuel"
```

### Get Revenue

```bash
# Revenue for a specific truck
curl "http://localhost:8002/tools/revenue?truck_id=T-084&date_from=2026-05-01&date_to=2026-05-31"

# All fleet revenue for a period
curl "http://localhost:8002/tools/revenue?date_from=2026-01-01&date_to=2026-06-30"
```

### Get Profit

Calculate net profit for a truck or entire fleet over a period.

```bash
# Single truck quarterly profit
curl "http://localhost:8002/tools/profit?truck_id=T-084&period=Q1-2026"

# Fleet-wide monthly profit
curl "http://localhost:8002/tools/profit?period=2026-05"
```

### Get Documents

```bash
# All documents for an entity
curl "http://localhost:8002/tools/documents?entity_id=T-084"

# Filter by document type
curl "http://localhost:8002/tools/documents?entity_id=T-084&doc_type=tax_form"
```

### Entity Resolution

Resolve natural language mentions to canonical entity IDs.

```bash
# Resolve by informal mention
curl "http://localhost:8002/tools/entity/resolve?mention=truck+84"

# Resolve by unit number
curl "http://localhost:8002/tools/entity/resolve?mention=Unit+84"

# Resolve by VIN
curl "http://localhost:8002/tools/entity/resolve?mention=3AKJHHDR7KSJF4821"

# Resolve driver by name
curl "http://localhost:8002/tools/entity/resolve?mention=John+Smith"
```

### Upcoming Renewals

```bash
# Documents expiring in the next 30 days
curl "http://localhost:8002/tools/renewals?days_ahead=30"

# Documents expiring in the next 90 days
curl "http://localhost:8002/tools/renewals?days_ahead=90"
```

### Fleet Overview

```bash
curl "http://localhost:8002/tools/fleet-overview"
```

## Database Schema

The service uses SQLite (`fleet.db`) with the following tables:

| Table | Purpose |
|-------|---------|
| `entities` | Fleet entities (trucks, drivers, trailers) |
| `aliases` | Alternative names/identifiers for entities |
| `expenses` | Financial expense records per truck |
| `revenue` | Revenue/income records per truck |
| `documents` | Document storage (registrations, insurance, etc.) |
| `audit_log` | API call audit trail |

### Re-seeding

To reset the database with fresh sample data:

```bash
make seed
```

## Project Structure

```
FleetDataService/
├── src/
│   ├── index.ts              # Express app + server startup
│   ├── db.ts                 # SQLite connection + initialization
│   ├── seed.ts               # Seed data generation
│   ├── routes/
│   │   ├── expenses.ts       # GET /tools/expenses
│   │   ├── revenue.ts        # GET /tools/revenue
│   │   ├── profit.ts         # GET /tools/profit
│   │   ├── documents.ts      # GET /tools/documents
│   │   ├── entity.ts         # GET /tools/entity/resolve
│   │   ├── renewals.ts       # GET /tools/renewals
│   │   ├── fleetOverview.ts  # GET /tools/fleet-overview
│   │   └── health.ts         # GET /health
│   └── middleware/
│       └── audit.ts          # Audit logging middleware
├── package.json
├── tsconfig.json
├── Makefile
└── README.md
```

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `PORT` | `8002` | Server port |
| `DATABASE_PATH` | `./fleet.db` | SQLite database file path |

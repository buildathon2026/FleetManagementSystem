# Fleet Intelligence System — AI Techniques Applied at Scale

## Problem

Trucking carriers run on paper. An active fleet generates 50+ documents every week, titles, tax forms, fuel records, registration renewals, maintenance receipts. Today it all lives in filing cabinets, glove boxes, and email threads. Nothing is searchable. Nothing is organized by truck. Operators can't answer basic questions without digging through physical files: which trucks are profitable? How much did I spend on parts last month? Where's the tax form for truck 84? What documents do I need to renew these plates? Build a system that ingests every fleet document, links each one to the correct truck, driver, and trailer, and lets an operator ask any question in plain English. Some questions need a database query, some need document retrieval, some need both in one answer. The system should handle all of them, accurately, grounded, no hallucinations. Sample documents can be synthetic. The messiness should be realistic.

## Overview

How every AI inference and fine-tuning technique solves a specific hard problem in the Fleet Document Intelligence system. Designed for production-scale (1000s of trucks, millions of documents) with hackathon-feasible implementations.

---

## Core Architecture: The LLM Never Generates Facts — MCP-Secured Data Access

```
USER QUESTION
      │
      ▼
┌─────────────────────────────────────────────────────┐
│  SMALL MODEL (8B, quantized) — THE PLANNER          │
│  Generates a JSON tool-call plan. Never touches DB. │
│  Latency: ~100ms                                    │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  MCP TOOL EXECUTION LAYER (secure boundary)         │
│                                                     │
│  ┌── MCP Server (FastAPI) ──────────────────────┐   │
│  │                                              │   │
│  │  Tool: get_expenses(truck_id, category, ...) │   │
│  │  Tool: get_revenue(truck_id, period)         │   │
│  │  Tool: find_document(entity_id, doc_type)    │   │
│  │  Tool: resolve_entity(mention)               │   │
│  │  Tool: get_truck_profit(truck_id, period)    │   │
│  │  Tool: get_upcoming_renewals(days_ahead)     │   │
│  │                                              │   │
│  │  Each tool: validates params → runs query    │   │
│  │  → returns structured result                 │   │
│  │  → logs audit trail                          │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  LLM NEVER sees: raw SQL, DB schema, connection     │
│  LLM ONLY sees: tool names + typed parameters       │
│  Latency: ~50ms per tool call                       │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  LARGE MODEL (70B via API) — THE FORMATTER          │
│  Formats tool execution results into natural lang.  │
│  Adds no facts. Only reformats + cites.             │
│  Latency: ~500ms                                    │
└─────────────────────────────────────────────────────┘
```

**The principle:** The LLM is a translator (NL → tool calls) and a formatter (results → NL). Facts come from validated API tools. The LLM never generates SQL, never touches the database, never sees the schema.

**Why MCP (Model Context Protocol):**
- Tools are defined with typed schemas — LLM can't call with wrong types
- Server-side execution — even prompt injection can't escape the tool boundary
- Audit logging — every tool call recorded (who, what, when, result)
- Tool discovery — LLM automatically knows available tools + params
- Multi-model support — any MCP-compatible client (Claude, LangChain, etc.)

---

## 📚 Grounding with Context (RAG) — Revamped

### Original Approach
Generic vector search → stuff results into context → LLM answers.

### Fleet System Approach: Entity-Filtered RAG

| Problem | Why Generic RAG Fails | Fleet Solution |
|---------|----------------------|----------------|
| "Where's the tax form for truck 84?" | Vector search returns tax forms for ALL trucks (similar text) | **Pre-filter by entity** before vector search. Resolve "truck 84" → T-084 → search only T-084's linked documents. |
| "How much on parts last month?" | Vectors don't do math. Similarity search can't SUM. | **Route to MCP tool:** `get_expenses(category="parts", date_from="2026-05-01")`. API runs the SQL internally, returns validated result. |
| Too many similar documents | 700+ docs with overlapping content pollute retrieval | **Metadata filtering:** `where={"entity_id": "T-084", "doc_type": "tax_form", "active": True}` |

### Implementation

```python
# BAD: Generic RAG
results = vectordb.query(text="tax form truck 84", n_results=5)

# GOOD: Entity-filtered RAG
entity = resolve_entity("truck 84")  # → "T-084"
results = vectordb.query(
    text="tax form highway use",
    n_results=5,
    where={"entity_id": entity.canonical_id, "doc_type": "tax_form"}
)
```

| Hackathon Feasibility | ✅ Easy — ChromaDB supports metadata filtering natively |
|---|---|

---

## ✍️ Smart Prompt Engineering — Revamped

### Original Approach
Tell the LLM "don't hallucinate" and hope it listens.

### Fleet System Approach: Architectural Enforcement

| Technique | Original (Prompt-Based) | Revamped (Architecture-Based) | Why It's Better |
|-----------|------------------------|-------------------------------|-----------------|
| "I Don't Know" Rule | System prompt: "Say I don't know if unsure" | `if len(sql_results) == 0 and len(retrieval_results) == 0: return NOT_FOUND_RESPONSE` | Code can't hallucinate. LLM can. |
| Citation Requests | "Please cite your sources" | Inject citations programmatically: `f"Sources: {[r.doc_id for r in results]}"` | LLM fabricates citation IDs. Code doesn't. |
| Chain of Thought | "Think step by step" | Use CoT ONLY for query plan decomposition: "Break 'which trucks are profitable?' into sub-queries" | CoT for reasoning is good. CoT for facts is dangerous. |

### Implementation — Structured Output Forces Honesty

```python
# The planner LLM outputs ONLY tool calls (JSON) — never raw SQL
PLANNER_PROMPT = """
You are a query planner for a fleet management system.
Given a user question, output a JSON plan with MCP tool calls to execute.
Never answer the question directly. Never generate SQL. Only output tool calls.

Available MCP tools:
- get_expenses(truck_id?, category?, date_from?, date_to?) → {total, count, items[]}
- get_revenue(truck_id?, date_from?, date_to?) → {total, load_count, items[]}
- get_truck_profit(truck_id?, period) → {revenue, expenses, net, breakdown}
- find_document(entity_id, doc_type?, date_from?) → {documents[], count}
- resolve_entity(mention) → {canonical_id, aliases[], confidence}
- get_upcoming_renewals(days_ahead?) → {items[]}
- get_fleet_overview() → {trucks[], total_revenue, alerts[]}

Output format: {"plan": [{"tool": "...", "params": {...}}, ...]}
"""

# LLM is physically unable to:
# - Generate SQL (no SQL in tool interface)
# - Access raw database (MCP server validates all calls)
# - Inject malicious queries (typed parameters only)
# - See other carriers' data (API enforces tenant isolation)
```

| Hackathon Feasibility | ✅ Easy — `response_format={"type": "json_object"}` on OpenAI/Featherless |
|---|---|

---

## 🎛️ Model Settings — Revamped for Dual-Model Architecture

### Original Approach
One model, tune temperature.

### Fleet System Approach: Different Settings per Role

| Model Role | Temperature | Top-P | Max Tokens | Why |
|-----------|------------|-------|------------|-----|
| **Planner (8B)** | 0.0 | 0.9 | 500 | Deterministic tool-call plans. No creativity needed. |
| **MCP Tool Layer** | N/A | N/A | N/A | Not an LLM. Validated API calls only. Zero variance by design. |
| **Response Formatter (70B)** | 0.3 | 0.95 | 1000 | Slight creativity for natural-sounding responses, but constrained by tool results. |
| **Entity Resolver (embeddings)** | N/A | N/A | N/A | Not generative. Cosine similarity only. |

| Hackathon Feasibility | ✅ Easy — pass different params per LLM call |
|---|---|

---

## 🛡️ Guardrails and Verification — Revamped

### Original Approach
Second AI checks first AI's work.

### Fleet System Approach: Multi-Layer Defense

| Layer | Technique | What It Catches | Hackathon Implementation |
|-------|-----------|-----------------|--------------------------|
| 1 | **MCP tool boundary** | LLM can't access DB directly, can't generate SQL, can't see schema | ✅ MCP server with typed tool definitions |
| 2 | **Typed parameter validation** | Wrong types, missing required params, out-of-range values | ✅ Pydantic models on each MCP tool endpoint |
| 3 | **Tenant isolation** | Carrier A can't see Carrier B's data | ✅ API enforces `carrier_id` filter on every query |
| 4 | **Result-bound formatting** | Formatter can only use data from tool execution results | ✅ System prompt: "Format ONLY these results: {results}. Add nothing." |
| 5 | **Confidence scoring** | Low-evidence answers flagged visually | ✅ `confidence = "HIGH" if len(sources) >= 3 else "LOW"` |
| 6 | **Conflict detection** | Two docs disagree on same fact | ✅ API: `GET /conflicts?truck_id=T-084` → flag |
| 7 | **Audit logging** | Every tool call logged with user, timestamp, params, result | ✅ MCP server middleware logs to SQLite |
| 8 | **Human feedback loop (👍/👎)** | Ongoing quality improvement | ✅ Store feedback in SQLite. Weekly: bad answers → few-shot negative examples. |

### Security: MCP vs Direct SQL

```python
# DANGEROUS: LLM generates raw SQL
plan = llm.generate("Convert to SQL: How much on parts?")
# Output: "SELECT * FROM expenses; DROP TABLE expenses; --"
# Result: Database destroyed

# SAFE: LLM generates tool calls, MCP validates and executes
plan = llm.generate("Convert to tool calls: How much on parts?")
# Output: {"tool": "get_expenses", "params": {"category": "parts"}}
# MCP server: validates params → runs pre-defined query → returns result
# Even with prompt injection: LLM can ONLY call defined tools with typed params
```

| Hackathon Feasibility | ✅ All layers implementable. Layer 6 (feedback) takes 30 min. |
|---|---|

---

## ⚙️ Advanced Techniques — Revamped for Fleet System at Scale

### Quantization → Fast Local Planner

| Aspect | Detail |
|--------|--------|
| **Problem it solves** | API calls to large models cost money and add 500ms+ latency for every query plan |
| **Solution** | Run quantized 8B model (Llama 3.1 8B Q4) locally as the planner. 100ms, $0 per query. |
| **Production value** | 90% cost reduction on planning calls. Runs on a single $50/month GPU. |
| **Hackathon implementation** | Use Featherless API with `meta-llama/Meta-Llama-3.1-8B-Instruct`. Free credits. Same effect. |

### Knowledge Distillation → Fleet Document Classifier

| Aspect | Detail |
|--------|--------|
| **Problem it solves** | Classifying 50+ docs/week per carrier using GPT-4 costs $0.10/doc at scale (10K docs/month = $1K) |
| **Solution** | Use GPT-4 to label 500 docs → train DistilBERT classifier → runs in 5ms at $0/doc |
| **Production value** | 100x faster, free inference, works offline |
| **Hackathon implementation** | **Placeholder:** Generate 100 labeled examples with LLM during prep. Show the training data CSV. Say: "In production, this trains a 5ms classifier. Today we demo with API calls." |

### Speculative Decoding → Dual-Model Tool Call Validation

| Aspect | Detail |
|--------|--------|
| **Problem it solves** | LLM might generate malformed tool calls or choose wrong tool for the question. |
| **Solution** | Small model drafts tool-call plan (fast, cheap). Large model verifies: "Does this plan answer the question? YES/NO + fix." Both through MCP boundary — neither touches DB directly. |
| **Production value** | 95%+ tool-call accuracy. Small model handles 80% of cases alone; large model only invoked for complex/hybrid queries. |
| **Hackathon implementation** | Two Featherless calls: (1) 8B generates tool plan, (2) 70B reviews plan and approves/corrects. Show both in transparency panel: "Draft Plan → Verified Plan". Takes 1 hour. |

### KV Caching → Multi-Turn Fleet Conversations

| Aspect | Detail |
|--------|--------|
| **Problem it solves** | Operators ask follow-ups: "How much on parts?" → "Break that down by truck" → "Show invoices for T-091" |
| **Solution** | Structure prompts as append-only (never rewrite history). Provider's KV cache keeps previous turns pre-computed. |
| **Production value** | 3-5x faster on turns 2+ of a conversation. Operator feels instant. |
| **Hackathon implementation** | ✅ Free — happens automatically with append-only message arrays. Design prompts that append, not reconstruct. |

### Continuous Batching → Concurrent Multi-Carrier Serving

| Aspect | Detail |
|--------|--------|
| **Problem it solves** | 50 operators across 10 carriers asking questions simultaneously. Naive: 50 × 500ms = queue builds up. |
| **Solution** | Batch similar query types. All SQL-generation requests processed as one batch. |
| **Production value** | 10x throughput on same hardware. P95 latency stays <2s even at 100 concurrent users. |
| **Hackathon implementation** | **Placeholder:** Implement simple request queue. Demo: fire 5 concurrent requests → show all return in ~1s. Architecture diagram shows batching layer. |

### RLHF → Lightweight Feedback Loop (No Training Required)

| Aspect | Detail |
|--------|--------|
| **Problem it solves** | System gives wrong answer → how does it improve without manual retraining? |
| **Solution** | 👍/👎 on every response. Store `(question, plan, results, answer, rating)`. Weekly: filter thumbs-down → add as few-shot negative examples in planner prompt. |
| **Production value** | Continuous improvement. No retraining. No GPU. Just a cron job that updates the system prompt. |
| **Hackathon implementation** | ✅ Build it. SQLite table + two buttons + a query: `SELECT * FROM feedback WHERE rating='bad' ORDER BY created_at DESC LIMIT 5`. Add to system prompt as "avoid these patterns". Takes 30 min. |

### FlashAttention → Full-Document Retrieval (No Chunking)

| Aspect | Detail |
|--------|--------|
| **Problem it solves** | Chunking documents loses context. A maintenance invoice needs header (truck ID) + line items (parts) + total together. Chunked, they're separated. |
| **Solution** | Use models with FlashAttention (Llama 3.1, Mistral) that handle 32K+ context. Retrieve FULL documents, not chunks. |
| **Production value** | Better answers because context is complete. No "lost the truck ID in a different chunk" failures. |
| **Hackathon implementation** | ✅ Use a long-context model. Don't chunk at ingestion — store full doc text as one vector. Retrieve top 3 full docs. Works with ChromaDB's default settings. |

### Pruning → Lean Vector Index

| Aspect | Detail |
|--------|--------|
| **Problem it solves** | After 2 years, a carrier has 5,000+ documents. Many are stale (old insurance certs, expired registrations). Retrieval gets noisy. |
| **Solution** | Tag docs as `active`/`archived` at ingestion. Query only active docs by default. Prune archived docs from hot index monthly. |
| **Production value** | Retrieval stays fast (<50ms) and relevant even at 100K+ documents. |
| **Hackathon implementation** | ✅ Add `active: bool` metadata to every doc in ChromaDB. Filter: `where={"active": True}`. When a new registration replaces an old one, mark old as archived. |

---

## 📊 Complete Technique Map — What Solves What

| Hard Problem | Primary Technique | Secondary Technique | Hackathon Build? |
|---|---|---|---|
| Entity resolution (messy aliases) | Embedding clustering (cosine similarity) | Rule-based VIN/CDL exact match | ✅ Build both |
| Query routing (SQL vs retrieval vs hybrid) | Eliminate routing — MCP tools handle dispatch | Parallel tool execution via asyncio | ✅ Build |
| Zero hallucination | Architectural: LLM calls MCP tools, never generates facts | Structured JSON output + result-bound formatting | ✅ Build |
| Data security (no SQL injection, no schema exposure) | MCP tool boundary — typed params, validated server-side | Tenant isolation + audit logging | ✅ Build |
| Multi-turn memory | KV caching (provider-side) + append-only prompts | Sliding window: last 5 turns + tool results | ✅ Build |
| Real-time ingestion (50 docs/week) | Event-driven queue + entity linker | Knowledge distillation for fast classification | ⚠️ Build queue, placeholder for distillation |
| Tool-call accuracy | Speculative decoding: small drafts, large verifies | Retry on tool execution error | ✅ Build dual-model |
| Scale to 1000s of carriers | Continuous batching + model parallelism | Quantized planner per carrier (edge deploy) | ⚠️ Placeholder + architecture diagram |
| Continuous improvement | Feedback loop (👍/👎 → few-shot updates) | Weekly prompt refresh from bad-answer corpus | ✅ Build |
| Retrieval precision at scale | Entity-filtered RAG + active doc pruning | FlashAttention for full-doc retrieval | ✅ Build |
| Document conflicts | Conflict detection API + surface to user | Never silently resolve — always show both | ✅ Build |

---

## 🎯 Implementation Priority for Hackathon

| Priority | Component | Technique Used | Time | Demo Impact |
|----------|-----------|---------------|------|-------------|
| 1 | MCP server with 6-7 fleet tools | FastAPI + typed Pydantic endpoints | 3h | ⭐⭐⭐⭐⭐ |
| 2 | Structured JSON planner (tool calls, no SQL) | Quantized model + JSON output | 2h | ⭐⭐⭐⭐⭐ |
| 3 | Entity-filtered RAG (via MCP `find_document` tool) | Embedding clustering + metadata filter | 2h | ⭐⭐⭐⭐⭐ |
| 4 | Parallel tool execution | asyncio.gather() on multiple tool calls | 1h | ⭐⭐⭐⭐ |
| 5 | Dual-model tool-call validation (draft + verify) | Speculative decoding pattern | 1h | ⭐⭐⭐⭐ |
| 6 | Result-bound response formatting | Large model as formatter only | 1h | ⭐⭐⭐ |
| 7 | Audit logging + transparency panel | MCP middleware + display in UI | 1h | ⭐⭐⭐⭐⭐ |
| 8 | Feedback loop (👍/👎) | RLHF-lite with few-shot updates | 30m | ⭐⭐⭐⭐ |
| 9 | Conflict detection | `GET /conflicts` API endpoint | 30m | ⭐⭐⭐ |
| 10 | Active doc pruning | Metadata filter on retrieval | 15m | ⭐⭐ |

**Total: ~13 hours.** Tight but achievable with 2-3 people.

---

## The Brutal Summary

Every advanced AI technique reduces to two questions for this system:

> **1. Does the LLM ever get to make up facts unsupervised?**

- If yes → you will hallucinate. No technique saves you.
- If no → you've solved the hard problem.

> **2. Does the LLM ever touch the database directly?**

- If yes → you have SQL injection, schema exposure, and zero audit trail.
- If no → you have production-grade security by design.

The architecture ensures:
- The LLM is never the source of truth. It plans. It formats. It never invents.
- The LLM never touches data directly. MCP tools are the only interface. Typed. Validated. Logged.

That's not a prompt trick. That's not fine-tuning. That's system design with MCP as the security boundary. And it's the thing that makes the demo memorable.

---

## MCP Server Definition (for `mcp.json`)

```json
{
  "mcpServers": {
    "fleet-data": {
      "command": "uvicorn",
      "args": ["src.mcp_server:app", "--host", "0.0.0.0", "--port", "8002"],
      "env": {
        "DATABASE_URL": "./fleet.db",
        "VECTOR_STORE_PATH": "./chromadb"
      },
      "disabled": false,
      "autoApprove": ["get_expenses", "get_revenue", "find_document", "resolve_entity"]
    }
  }
}
```

### MCP Tools Schema

| Tool | Parameters | Returns | Security |
|------|-----------|---------|----------|
| `get_expenses` | `truck_id?: str, category?: str, date_from?: str, date_to?: str` | `{total: float, count: int, items: [{id, truck_id, date, amount, category, doc_ref}]}` | Read-only. Filtered by carrier. |
| `get_revenue` | `truck_id?: str, date_from?: str, date_to?: str` | `{total: float, load_count: int, items: [{id, truck_id, date, amount}]}` | Read-only. Filtered by carrier. |
| `get_truck_profit` | `truck_id?: str, period: str` | `{trucks: [{id, revenue, expenses, net, top_expense_category}]}` | Pre-computed join. No raw SQL exposed. |
| `find_document` | `entity_id: str, doc_type?: str, date_from?: str` | `{documents: [{id, type, date, summary, content_preview}], count: int}` | Vector search + entity filter. |
| `resolve_entity` | `mention: str` | `{canonical_id: str, type: str, aliases: [], confidence: float}` | Embedding lookup. Deterministic. |
| `get_upcoming_renewals` | `days_ahead?: int` | `{items: [{truck_id, doc_type, expiry_date, days_remaining, status}]}` | Date-filtered query. |
| `get_fleet_overview` | — | `{trucks: [{id, driver, status, doc_count, revenue_mtd}], alerts: []}` | Dashboard summary. No PII exposed. |

---

## System Modules (Independent Services)

### Module Overview

| # | Module | Port | Responsibility | Build Time |
|---|--------|------|----------------|------------|
| 1 | **MCP Data Server** | 8002 | Security boundary. Exposes fleet data as typed MCP tools. Validates params, runs queries, logs audit. | 3h |
| 2 | **Entity Resolution Engine** | 8003 | Resolves messy mentions to canonical fleet entities. Embedding similarity + rule-based exact match. | 2h |
| 3 | **Document Ingestion Pipeline** | 8004 | Ingests fabricated text documents, classifies, extracts fields, links to entities, populates DB + vector store. No image/OCR. | 2h |
| 4 | **AI Agent (Planner + Formatter)** | 8001 | Takes user question → tool-call plan (small model) → executes via MCP → formats response (large model). | 3h |
| 5 | **Frontend UI** | 3000 | Chat, entity graph, fleet dashboard, document viewer, transparency panel, feedback buttons. | 3h |

---

### Data Flow

```
User (browser :3000)
    │
    ▼
┌─────────────────┐         ┌───────────────────────┐
│  5. Frontend UI │────────▶│  4. AI Agent (:8001)   │
│     (React)     │◀────────│  Planner + Formatter   │
└─────────────────┘         └───────────┬────────────┘
                                        │ MCP tool calls
                                        ▼
                            ┌───────────────────────┐
                            │  1. MCP Data Server    │
                            │     (:8002)            │
                            └──┬────────────────┬───┘
                               │                │
                      ┌────────▼────┐     ┌─────▼──────┐
                      │  SQLite DB  │     │  ChromaDB   │
                      │ (structured) │     │  (vectors)  │
                      └─────────────┘     └────────────┘
                               ▲                ▲
                               │                │
                            ┌──┴────────────────┴──┐
                            │ 3. Ingestion (:8004)  │
                            └──────────┬───────────┘
                                       │ resolves entities
                                       ▼
                            ┌───────────────────────┐
                            │ 2. Entity Resolution   │
                            │    (:8003)             │
                            └───────────────────────┘
```

---

### Module 1: MCP Data Server

| Aspect | Detail |
|--------|--------|
| **Language** | Python (FastAPI) |
| **Storage** | SQLite (expenses, revenue, documents metadata) + ChromaDB (document embeddings) |
| **Tools exposed** | `get_expenses`, `get_revenue`, `get_truck_profit`, `find_document`, `resolve_entity`, `get_upcoming_renewals`, `get_fleet_overview` |
| **Security** | Typed Pydantic params on each endpoint. Read-only. Tenant-isolated. Audit logged. |
| **Key files** | `src/mcp_server.py`, `src/db.py`, `src/vector_store.py` |

**Endpoints (internal):**
```
GET  /tools/expenses?truck_id=T-084&category=parts&date_from=2026-05-01
GET  /tools/revenue?truck_id=T-084&date_from=2026-05-01
GET  /tools/profit?truck_id=T-084&period=Q1-2026
GET  /tools/documents?entity_id=T-084&doc_type=tax_form
GET  /tools/entity/resolve?mention=truck+84
GET  /tools/renewals?days_ahead=30
GET  /tools/fleet-overview
GET  /health
```

---

### Module 2: Entity Resolution Engine

| Aspect | Detail |
|--------|--------|
| **Language** | Python (FastAPI) |
| **Storage** | SQLite entity graph: `entities(id, type, canonical_name, lat, lng)` + `aliases(entity_id, alias_text, source_doc, confidence, method)` |
| **Resolution logic** | 1. VIN exact match → confidence 1.0, 2. Unit number normalization ("84"/"#84"/"084") → 0.9, 3. CDL exact match → 1.0, 4. License plate match → 1.0, 5. Embedding cosine similarity on description → 0.6-0.8 |
| **Key files** | `src/resolver.py`, `src/entity_graph.py`, `src/embeddings.py` |

**Endpoints:**
```
GET  /resolve?mention=truck+84          → {canonical_id: "T-084", confidence: 0.9, ...}
GET  /resolve?mention=VIN+3AKJHHDR7...  → {canonical_id: "T-084", confidence: 1.0, ...}
GET  /resolve?mention=the+white+Cascadia → {canonical_id: "T-084", confidence: 0.7, ...}
GET  /entity/T-084                      → {aliases: [...], linked_docs: [...], driver: "D-012"}
GET  /entities                          → [{id, type, canonical_name, alias_count, doc_count}]
POST /entity/register-alias             → Add new alias mapping (used by ingestion)
GET  /health
```

---

### Module 3: Document Ingestion Pipeline

| Aspect | Detail |
|--------|--------|
| **Language** | Python (FastAPI + async queue worker) |
| **Input format** | Plain text documents (fabricated). No image scanning, no OCR. Text-based PDFs, emails, receipts as `.txt` or `.json` |
| **Pipeline steps** | 1. Classify doc type (LLM or regex), 2. Extract fields (regex per type), 3. Resolve entities (call Module 2), 4. Insert structured data into SQLite, 5. Embed full doc text into ChromaDB |
| **Key files** | `src/ingestion.py`, `src/classifier.py`, `src/extractor.py`, `data/synthetic/` |

**Endpoints:**
```
POST /ingest              → Upload raw text document, triggers pipeline
GET  /ingest/status/:id   → Check ingestion status for a document
GET  /ingest/stats        → {total_ingested, by_type: {...}, last_ingested_at}
GET  /health
```

**Synthetic Data (fabricated text, pre-generated):**

```
data/synthetic/
├── titles/              # 10 vehicle title documents (clean, formal)
├── registrations/       # 10 registration docs ("Unit 84", "T-084" formats)
├── insurance/           # 10 insurance certs ("FL-084" fleet format)
├── tax_forms/           # 10 Form 2290 (VIN-based, no unit number)
├── fuel_receipts/       # 60 fuel receipts (messy: "Trk 84", "84", "Unit84")
├── maintenance/         # 40 maintenance invoices (vendor formats vary)
├── inspections/         # 10 DOT annual inspections
├── settlements/         # 30 settlement statements ("Smith, John — Unit 84")
├── emails/              # 20 emails ("the white Cascadia needs brakes")
└── toll_receipts/       # 30 toll receipts (transponder ID only)
```

**Total: ~220 fabricated text documents.** Generated once during hackathon prep. Pre-ingested at startup.

**Sample fabricated document (fuel receipt):**
```
FUEL RECEIPT
Station: Pilot Travel Center #412, Dallas TX
Date: 05/18/2026
Truck: Trk 84
Driver: J. Smith
Gallons: 142.3
Price/Gal: $3.79
Total: $539.32
Odometer: 487,291
```

**Sample fabricated document (email):**
```
From: mike@abctrucking.com
To: dispatch@abctrucking.com
Date: May 20, 2026
Subject: White Cascadia brake issue

Hey, the white Cascadia is pulling to the left under braking.
John says it started yesterday on the I-20 run.
Can we get it into the shop this week? Maybe Penske on Harry Hines.
```

---

### Module 4: AI Agent (Planner + Formatter)

| Aspect | Detail |
|--------|--------|
| **Language** | Python (FastAPI) |
| **Planner model** | Small (8B via Featherless): generates JSON tool-call plans. Temp=0.0. |
| **Formatter model** | Large (70B via API): formats execution results into NL with citations. Temp=0.3. |
| **Execution** | Parallel tool calls via `asyncio.gather()` against MCP Data Server |
| **Key files** | `src/agent.py`, `src/planner.py`, `src/formatter.py`, `src/tool_executor.py` |

**Endpoints:**
```
POST /ask                 → {question: "..."} → {answer, sources, confidence, plan}
GET  /conversation/:id    → Conversation history with tool call logs
POST /feedback            → {conversation_id, rating: "up"|"down"}
GET  /health
```

**Request/Response example:**
```json
// POST /ask
{
  "question": "How much did I spend on parts last month?",
  "conversation_id": "conv-001"
}

// Response
{
  "answer": "You spent $4,287.50 on parts in May 2026 across 12 invoices.",
  "sources": ["INV-041", "INV-043", "INV-047", "INV-051", "..."],
  "confidence": "HIGH",
  "query_type": "STRUCTURED",
  "plan_executed": {
    "tools_called": [
      {"tool": "get_expenses", "params": {"category": "parts", "date_from": "2026-05-01", "date_to": "2026-05-31"}}
    ],
    "execution_time_ms": 85
  }
}
```

---

### Module 5: Frontend UI

| Aspect | Detail |
|--------|--------|
| **Language** | React + TypeScript (Vite or Lovable-generated) |
| **Styling** | Tailwind CSS, dark theme |
| **Key views** | Chat, Entity Graph, Fleet Dashboard, Document Viewer, Transparency Panel |
| **Key files** | `src/App.tsx`, `src/components/Chat.tsx`, `src/components/EntityGraph.tsx`, `src/components/Dashboard.tsx` |

**Views:**

| View | What It Shows |
|------|---------------|
| **Chat** | Natural language Q&A. Query type badge `[STRUCTURED]` `[RETRIEVAL]` `[HYBRID]`. Citations as clickable links. 👍/👎 buttons. |
| **Entity Graph** | Interactive graph (vis.js or d3-force): trucks → drivers → trailers → documents. Click node → see aliases. |
| **Fleet Dashboard** | Cards per truck: revenue, expenses, net P&L, upcoming renewals. Red alerts for expired docs. |
| **Document Viewer** | Side panel: click any citation → original document text with highlighted relevant passage. |
| **Transparency Panel** | Shows: tool-call plan generated, tools executed, params used, execution time. Anti-hallucination proof. |

---

### Build Order

| Order | Module | Who | Why This Order |
|-------|--------|-----|----------------|
| 1st | MCP Data Server + SQLite schema + ChromaDB | Backend dev | Everything depends on data access |
| 2nd | Entity Resolution Engine + seed entity graph | Backend dev | Ingestion and agent both need this |
| 3rd | Document Ingestion + synthetic data generation | Backend dev | Populates the DB for all demos |
| 4th | AI Agent (Planner + Formatter) | AI/ML dev | Brain that ties it together. Test via curl. |
| 5th | Frontend UI | Frontend dev | Makes it demoable end to end |

**Parallel work possible:**
- Backend dev: Modules 1 + 2 + 3 (sequential, ~7h)
- AI/ML dev: Module 4 (can mock MCP responses while Module 1 is being built, ~3h)
- Frontend dev: Module 5 (can use mock API responses while backend builds, ~3h)

**Wall-clock time with 3 people: ~7 hours.**

---

### Project Structure

```
FleetManagementSystem/
├── docs/
│   └── design.md                    # This file
├── mcp-data-server/                 # Module 1
│   ├── src/
│   │   ├── mcp_server.py
│   │   ├── db.py
│   │   └── vector_store.py
│   ├── requirements.txt
│   └── Makefile
├── entity-resolution/               # Module 2
│   ├── src/
│   │   ├── resolver.py
│   │   ├── entity_graph.py
│   │   └── embeddings.py
│   ├── requirements.txt
│   └── Makefile
├── ingestion/                       # Module 3
│   ├── src/
│   │   ├── ingestion.py
│   │   ├── classifier.py
│   │   └── extractor.py
│   ├── data/synthetic/              # Fabricated text documents
│   │   ├── titles/
│   │   ├── fuel_receipts/
│   │   ├── maintenance/
│   │   ├── emails/
│   │   └── ...
│   ├── requirements.txt
│   └── Makefile
├── ai-agent/                        # Module 4
│   ├── src/
│   │   ├── agent.py
│   │   ├── planner.py
│   │   ├── formatter.py
│   │   └── tool_executor.py
│   ├── requirements.txt
│   └── Makefile
├── frontend/                        # Module 5
│   ├── src/
│   │   ├── App.tsx
│   │   └── components/
│   ├── package.json
│   └── Makefile
└── docker-compose.yml               # Optional: run all services together
```

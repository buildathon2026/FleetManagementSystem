# Fleet Intelligence System — AI Techniques Applied at Scale

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

That's not a prompt trick. That's not fine-tuning. That's system design with MCP as the security boundary. And it's the thing judges will remember.

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

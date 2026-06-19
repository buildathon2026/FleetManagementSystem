# Problem Statement → Solution Architecture

## The Problem (What We're Solving)

**Trucking carriers run on paper:**
- 50+ documents per week (titles, tax forms, fuel records, registrations, maintenance receipts)
- Stored in filing cabinets, glove boxes, email threads
- Nothing searchable, nothing organized by truck
- Operators can't answer basic questions without manual digging:
  - Which trucks are profitable?
  - How much did I spend on parts last month?
  - Where's the tax form for truck 84?
  - What documents do I need to renew these plates?

**The Messiness:**
- Same truck referenced as "Unit 84", "Trk 84", "T-084", "84" across different document types
- Different document formats (fuel receipts, invoices, forms, emails)
- Different vendor formats for the same doc type
- No structured data extraction

**The Challenge:**
- Some questions need SQL: "How much on parts?" → expenses table aggregate
- Some need retrieval: "What documents exist for truck 84?" → vector search
- Some need both: "Why did we spend so much on truck 84?" → get expenses (SQL) + find related docs (retrieval)
- All must be **accurate, grounded, zero hallucinations**

---

## Our Solution Architecture

### Layer 1: Ingest & Organize (✅ Module 3 Complete)

**Problem it solves:** 50+ weekly documents → structured, searchable, entity-linked

**What Module 3 does:**
```
Raw Document (text)
    ↓
[1. Classify] → Detect: fuel_receipt, maintenance, tax_form, insurance, email, etc.
    ↓
[2. Extract] → Fields: truck ID, date, amount, description
    ↓
[3. Resolve Entity] → "Trk 84" → canonical T-084 with 0.85 confidence
    ↓
[4. Store] → SQLite (structured) + ChromaDB (vectors)
    ↓
Searchable, Entity-Linked, Ready for Q&A
```

**Current State:**
- ✅ 230 synthetic documents pre-ingested (10 types)
- ✅ 10 truck entities linked across 1,150+ documents
- ✅ SQLite schema: documents, fuel_receipts, maintenance_invoices, settlements, etc.
- ✅ ChromaDB: 230 embeddings for semantic search
- ✅ 10 REST endpoints for ingestion/search

**Sample Flow:**
```
Input: "FUEL RECEIPT\nTruck: Trk 84\nDate: 05/18/2026\nAmount: $539.32"
    ↓
Classified as: fuel_receipt (confidence: 0.98)
Extracted: {truck_mention: "Trk 84", date: "2026-05-18", amount: 539.32}
Resolved: truck_mention "Trk 84" → canonical "T-084" (confidence: 0.85)
Stored:
  - documents table: {id, doc_type, entity_id="T-084", ingested_at}
  - fuel_receipts table: {doc_id, amount, date}
  - chromadb: embedded full text + metadata
```

---

### Layer 2: Security Boundary (📋 Module 1 - To Build)

**Problem it solves:** LLM must never generate SQL or see database schema

**What Module 1 does:**
- Exposes **7 typed MCP tools** (no raw SQL)
- Each tool: validates params → runs query → returns structured result → logs audit
- LLM only sees: tool names and typed parameters
- LLM never sees: SQL, schema, raw data

**The 7 Tools:**
```python
1. get_expenses(truck_id?, category?, date_from?, date_to?)
   → {total: $X, items: [{id, amount, category, date}]}
   
2. get_revenue(truck_id?, date_from?, date_to?)
   → {total: $X, load_count: N, items: [{...}]}
   
3. get_truck_profit(truck_id, period)
   → {revenue, expenses, net, breakdown}
   
4. find_document(entity_id, doc_type?, date_from?)
   → {documents: [{id, type, date, summary}], count}
   
5. resolve_entity(mention: "truck 84")
   → {canonical_id: "T-084", confidence: 0.85, aliases}
   
6. get_upcoming_renewals(days_ahead?)
   → {items: [{truck_id, doc_type, expiry_date, days_remaining}]}
   
7. get_fleet_overview()
   → {trucks: [...], total_revenue, alerts: [...]}
```

**Why This Matters:**
```
❌ DANGEROUS (LLM generates SQL):
   LLM: "SELECT * FROM expenses; DROP TABLE expenses; --"
   Result: Database destroyed
   
✅ SAFE (LLM calls MCP tools):
   LLM: {"tool": "get_expenses", "params": {"category": "parts"}}
   MCP: validates params → runs pre-defined query → returns {total: 2287.50}
   Result: No SQL injection possible, audit logged
```

---

### Layer 3: Entity Resolution (📋 Module 2 - To Build)

**Problem it solves:** "Which truck?" when the same truck appears as "Unit 84", "Trk 84", "T-084", "84"

**What Module 2 does:**
- Maps messy mentions to canonical truck IDs
- Returns (canonical_id, confidence) tuple
- Used by ingestion AND by the AI agent

**Resolution Rules (Confidence Scoring):**
```
Rule Priority | Match | Confidence | Example
1. VIN exact  | VIN exact match      | 1.0  | "4AKJH..." → T-084
2. CDL exact  | CDL number           | 1.0  | "CDL-5429..." → T-084
3. Plate      | License plate        | 1.0  | "ABC-1234" → T-084
4. Unit norm  | "Unit 84", "084"     | 0.95 | "Unit 84" → T-084
5. Trk format | "Trk 84", "T 84"     | 0.90 | "Trk 84" → T-084
6. Bare num   | Just "84"            | 0.80 | "84" → T-084 (ambiguous)
7. Embedding  | Semantic similarity  | 0.6-0.8 | "white Cascadia" → T-084
```

**Used By:**
- Ingestion pipeline: Link documents to correct truck
- AI agent: Resolve user mentions ("truck 84") to canonical ID
- Search: Filter documents by specific truck

**Example:**
```
User question: "Which documents does truck 84 have?"
Agent: resolve_entity("truck 84") → T-084 (confidence: 0.85)
Agent: find_document(entity_id="T-084") → [doc1, doc2, doc3...]
```

---

### Layer 4: Question Routing & Tool Planning (📋 Module 4 - To Build)

**Problem it solves:** Operator asks plain English, system routes to SQL vs retrieval vs hybrid

**What Module 4 does:**

**Planner (Small 8B model, quantized):**
- Input: "How much on parts last month?"
- Output: JSON tool-call plan (NO SQL, NO facts)
- Temperature: 0.0 (deterministic)
- Speed: ~100ms

```json
{
  "plan": [
    {
      "tool": "get_expenses",
      "params": {
        "category": "parts",
        "date_from": "2026-05-01",
        "date_to": "2026-05-31"
      }
    }
  ]
}
```

**Executor (Async):**
- Parallel tool calls via asyncio.gather()
- Each tool runs against MCP Data Server (Module 1)
- Collects results

**Formatter (Large 70B model, API):**
- Input: tool results + conversation context
- Output: Natural language answer with citations
- Temperature: 0.3 (slight creativity for prose)
- Speed: ~500ms

```
Input:
  - Tool result: {total: 2287.50, count: 4, items: [INV-041, INV-043, ...]}
  - User question: "How much on parts?"

Output:
  "You spent $2,287.50 on parts in May 2026 across 4 invoices.
   Sources: INV-041, INV-043, INV-047, INV-051"
```

**Query Types Handled:**

| Query | Example | Tools Used | Type |
|-------|---------|-----------|------|
| Structured | "How much on parts?" | get_expenses | STRUCTURED |
| Retrieval | "Find my tax form for truck 84" | resolve_entity + find_document | RETRIEVAL |
| Hybrid | "Why did truck 84 spend so much?" | get_expenses + find_document | HYBRID |
| Analytical | "Which trucks are profitable?" | get_truck_profit × 10 | STRUCTURED |

---

### Layer 5: User Interface (✅ Module 5 Complete)

**Problem it solves:** Make results actionable for tired operators

**What Module 5 does:**

1. **Chat View**
   - Plain English questions
   - Answers with citations (clickable docs)
   - Confidence badges
   - Transparency: shows tools executed
   - Feedback: 👍/👎 for RLHF improvement

2. **Dashboard View**
   - Fleet overview: total revenue, alerts, active trucks
   - Truck cards: revenue MTD, doc count, driver, status
   - Alert system: insurance renewal, inspection overdue, inactive trucks

3. **Document Viewer**
   - Search: find documents by keyword
   - Filter: by type, by truck, by date
   - Preview: full metadata + extraction confidence

4. **Entity Graph**
   - All 10 trucks with aliases
   - Connection count
   - Relationship visualization

5. **Transparency Panel**
   - Query type: [STRUCTURED] / [RETRIEVAL] / [HYBRID]
   - Tools called: names + parameters
   - Execution time: per tool + total
   - Anti-hallucination proof: ✓ LLM never saw database

---

## Query Flow End-to-End

### Example 1: Structured Query

```
USER ASKS:
  "How much did I spend on parts last month?"

FRONTEND (Chat.tsx):
  Sends to Agent: {question: "...", conversation_id: "conv-001"}

AGENT PLANNER (8B model):
  Generates tool plan:
  {
    "plan": [
      {
        "tool": "get_expenses",
        "params": {
          "category": "parts",
          "date_from": "2026-05-01",
          "date_to": "2026-05-31"
        }
      }
    ]
  }

MCP DATA SERVER (Tool Executor):
  Calls: GET /tools/expenses?category=parts&date_from=2026-05-01&date_to=2026-05-31
  Receives:
  {
    "total": 2287.50,
    "count": 4,
    "items": [
      {id: "INV-041", amount: 287.50, date: "2026-05-15"},
      {id: "INV-043", amount: 450.00, date: "2026-05-18"},
      {id: "INV-047", amount: 125.00, date: "2026-05-20"},
      {id: "INV-051", amount: 625.00, date: "2026-05-22"}
    ]
  }

AGENT FORMATTER (70B model):
  Formats result:
  "You spent $2,287.50 on parts in May 2026 across 4 invoices.
   Sources: INV-041, INV-043, INV-047, INV-051"
  confidence: HIGH

FRONTEND:
  Displays answer with citations
  Shows Transparency Panel:
    Query Type: [STRUCTURED]
    Tools: get_expenses (45ms)
    Total Time: 150ms
    ✓ LLM never saw database schema or raw SQL
```

---

### Example 2: Retrieval Query

```
USER ASKS:
  "Find the tax form for truck 84"

AGENT PLANNER:
  {
    "plan": [
      {tool: "resolve_entity", params: {mention: "truck 84"}},
      {tool: "find_document", params: {entity_id: "?", doc_type: "tax_form"}}
    ]
  }

MCP DATA SERVER:
  Tool 1: resolve_entity("truck 84")
    → {canonical_id: "T-084", confidence: 0.85}
  
  Tool 2: find_document(entity_id="T-084", doc_type="tax_form")
    → {
        documents: [
          {id: "TAX_001", type: "tax_form", date: "2026-04-15", 
           summary: "Form 2290 - Highway Use Tax"}
        ],
        count: 1
      }

AGENT FORMATTER:
  "I found 1 tax form for truck 84:
   - TAX_001 (Form 2290, 2026-04-15)
   This is likely your highway use tax form."

FRONTEND:
  Displays with clickable citation → Document Viewer opens TAX_001
  Transparency Panel shows: query_type=RETRIEVAL, 2 tools, 95ms total
```

---

### Example 3: Hybrid Query

```
USER ASKS:
  "Why did truck 84 spend so much last month? Show me the documents."

AGENT PLANNER:
  {
    "plan": [
      {tool: "resolve_entity", params: {mention: "truck 84"}},
      {tool: "get_expenses", params: {truck_id: "?", date_from: "2026-05-01"}},
      {tool: "find_document", params: {entity_id: "?", doc_type: "maintenance_invoice"}}
    ]
  }

MCP DATA SERVER (parallel):
  Tool 1: resolve_entity("truck 84")
    → {canonical_id: "T-084", confidence: 0.85}
  
  Tool 2: get_expenses(truck_id="T-084", date_from="2026-05-01")
    → {
        total: 2800.50,
        items: [
          {id: "INV-0023", amount: 625, type: "parts"},
          {id: "INV-0024", amount: 450, type: "fuel"},
          {id: "INV-0025", amount: 800, type: "maintenance"}
        ]
      }
  
  Tool 3: find_document(entity_id="T-084", doc_type="maintenance_invoice")
    → {
        documents: [
          {id: "INV_0023", summary: "ABC Brake Service - $625.00"},
          {id: "INV_0025", summary: "XYZ Transmission Service - $800.00"}
        ]
      }

AGENT FORMATTER:
  "Truck 84 spent $2,800.50 in May, notably on maintenance.
   The big expenses were:
   - $800 transmission service (INV-0025)
   - $625 brake service (INV_0023)
   
   These two repairs account for about 51% of your monthly spend.
   Sources: INV-0023, INV-0024, INV-0025"

FRONTEND:
  Shows answer + 3 clickable sources
  Transparency: query_type=HYBRID, 3 tools, 120ms total
```

---

## How This Solves the Problem

### ✅ "Nothing is searchable"
- Every document ingested into ChromaDB with full-text embeddings
- Semantic search: "brake issue" finds documents about brakes
- Entity filtering: "for truck 84" narrows to 45 relevant docs instead of 230

### ✅ "Nothing is organized by truck"
- Module 2 entity resolution maps all aliases to canonical truck IDs
- SQLite foreign keys link all documents to `entity_id`
- Dashboard shows per-truck view: revenue, docs, alerts

### ✅ "Operators can't answer basic questions"
- Dashboard: "Which trucks profitable?" → cards ranked by net profit
- Chat: "How much on parts?" → SQL query via MCP tool
- Chat: "Where's tax form for 84?" → vector search + entity filter
- Chat: "What to renew plates?" → get_upcoming_renewals tool

### ✅ "Accurate, grounded, zero hallucinations"
- LLM never generates facts—only generates tool calls
- MCP tools return validated data from SQLite/ChromaDB
- Formatter reformats results, adds no new facts
- Every answer has citations back to source documents
- Transparency panel proves LLM never touched database

### ✅ "Handle all three query types"
- **Structured** (SQL): expenses, revenue, profit, renewals
- **Retrieval** (vectors): documents by meaning, entity graph
- **Hybrid** (both): "Why spent so much?" = get_expenses + find related docs

---

## Current Implementation Status

| Module | Purpose | Status | Build Time |
|--------|---------|--------|------------|
| 1 | MCP Data Server (security boundary) | 📋 TODO | 3h |
| 2 | Entity Resolution (truck linking) | 📋 TODO | 2h |
| 3 | Document Ingestion | ✅ COMPLETE | 2h |
| 4 | AI Agent (planner + formatter) | 📋 TODO | 3h |
| 5 | Frontend UI | ✅ COMPLETE | 2h |

**Total remaining:** ~8 hours with 1-2 people

---

## Next Steps to Complete

1. **Module 1: MCP Data Server** — Build 7 typed tools, security boundary, audit logging
2. **Module 2: Entity Resolution** — Confidence-scored truck linking with embedding fallback
3. **Module 4: AI Agent** — Planner (8B) + executor (parallel) + formatter (70B)

Then: Demo all 5 modules working end-to-end on the 230 pre-ingested documents.

---

**Key Design Principle:**
> The LLM is a translator (NL → tool calls) and a formatter (results → NL). Facts come from validated API tools. The LLM never generates SQL, never touches the database, never sees the schema. This is how we guarantee accuracy and zero hallucinations at scale.

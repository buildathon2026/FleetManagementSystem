# Quick Start Guide - Synthetic Dataset

## What Was Generated?

✅ **230 synthetic documents** for testing the Document Ingestion Pipeline (Module 3)

```
data/synthetic/
├── titles/            (10 files)   - Vehicle titles (formal, clean)
├── registrations/     (10 files)   - Registration certificates (messy truck names)
├── insurance/         (10 files)   - Insurance certificates
├── tax_forms/         (10 files)   - IRS Form 2290
├── fuel_receipts/     (60 files)   - Fuel station receipts (HIGH VOLUME)
├── maintenance/       (40 files)   - Repair shop invoices
├── inspections/       (10 files)   - DOT inspection reports
├── settlements/       (30 files)   - Freight settlements
├── emails/            (20 files)   - Internal communications
├── toll_receipts/     (30 files)   - Toll collection receipts
├── README.md                       - Full documentation
├── DATASET_MANIFEST.json           - Machine-readable metadata
└── QUICKSTART.md                   - This file
```

**Total Size:** ~1 MB | **Time Span:** 60 days (April 19 - June 18, 2026)

---

## 5-Minute Tour

### 1. See What's Inside

```bash
# View directory structure
tree -L 2 data/synthetic/ -I '__pycache__'

# Count documents by type
for dir in data/synthetic/*/; do 
  count=$(ls -1 "$dir"*.txt 2>/dev/null | wc -l)
  echo "$(basename "$dir"): $count files"
done

# Sample a fuel receipt (messy data - best for testing entity resolution)
head -20 data/synthetic/fuel_receipts/FUEL_0001.txt

# Sample a maintenance invoice (structured extraction)
head -20 data/synthetic/maintenance/MAINT_0001.txt

# Sample an email (unstructured - embedding quality test)
head -15 data/synthetic/emails/EMAIL_001.txt
```

### 2. Key Entities in Dataset

**10 Trucks:**
- T-084, T-091, T-105, T-112, T-118, T-125, T-132, T-140, T-151, T-168

**10 Drivers:**
- John Smith, Maria Garcia, Robert Johnson, David Chen, James Wilson, Michael Torres, Antoine Beaumont, Philip Morrison, Kevin Hayes, Samuel Price

**Reference across documents:**
- Titles: "Unit 084"
- Registrations: "Unit 105", "T-091"
- Fuel receipts: "Trk 84", "Unit 84", "84", "Unit84"  ← entity resolution test
- Emails: "the white Cascadia", "truck 84"  ← embedding test

### 3. Test Entity Resolution

```bash
# Scenario: Fuel receipt says "Trk 84", registration says "Unit 84"
# System should resolve both to canonical entity: T-084

# Test with Module 2 (Entity Resolution)
curl http://localhost:8003/resolve?mention="Trk%2084"
# Expected: {canonical_id: "T-084", confidence: 0.9, aliases: ["84", "Unit 84", ...]}

curl http://localhost:8003/resolve?mention="Unit%20105"
# Expected: {canonical_id: "T-105", confidence: 0.9}

curl http://localhost:8003/resolve?mention="the%20white%20Cascadia"
# Expected: {canonical_id: "T-084", confidence: 0.6-0.8}  ← embedding-based
```

### 4. Test Ingestion Pipeline

```bash
# Upload a batch of fuel receipts
curl -X POST http://localhost:8004/ingest \
  -F "documents=@data/synthetic/fuel_receipts/FUEL_0001.txt" \
  -F "documents=@data/synthetic/fuel_receipts/FUEL_0002.txt" \
  -F "documents=@data/synthetic/fuel_receipts/FUEL_0003.txt"

# Check status
curl http://localhost:8004/ingest/stats
# Returns: {total_ingested: 3, by_type: {fuel_receipt: 3}, last_ingested_at: ...}
```

### 5. Test Retrieval (RAG)

```bash
# Query: "How much did I spend on fuel in May 2026?"
curl -X POST http://localhost:8001/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How much did I spend on fuel in May 2026?",
    "conversation_id": "test-001"
  }'

# Behind the scenes:
# 1. Planner routes to: get_expenses(category="fuel", date_from="2026-05-01", date_to="2026-05-31")
# 2. MCP executes query against SQLite
# 3. RAG retrieves relevant fuel receipts from ChromaDB (entity-filtered: active=true)
# 4. Formatter produces answer with citations

# Expected response:
# {
#   "answer": "You spent $28,450.32 on fuel in May 2026 across 52 receipts.",
#   "sources": ["FUEL_0001", "FUEL_0002", ..., "FUEL_0052"],
#   "confidence": "HIGH"
# }
```

---

## Which Document Type Tests What?

| Document | Test Focus | Key Challenge | File Count |
|----------|-----------|-----------------|-----------|
| **Fuel Receipts** | Entity resolution (messy naming) | "Trk 84" vs "Unit 84" vs "84" | 60 |
| **Maintenance** | Structured field extraction | Invoice parsing, amount recognition | 40 |
| **Settlements** | Complex document structure | Multi-field aggregation | 30 |
| **Toll Receipts** | Indirect entity linking | Transponder ID → truck mapping | 30 |
| **Emails** | Unstructured embedding quality | "white Cascadia" → T-084 | 20 |
| **Titles** | VIN-based entity resolution | Perfect match confidence | 10 |
| **Registrations** | Format normalization | "Unit 84" vs "T-084" vs "084" | 10 |
| **Insurance** | Compliance tracking | Expiration date extraction | 10 |
| **Tax Forms** | Tax year handling | VIN-only documents | 10 |
| **Inspections** | Pass/Fail status tracking | Validity period parsing | 10 |

---

## Regenerate Fresh Data

If you want new random values (new amounts, dates, drivers):

```bash
cd data/synthetic
python3 generate_synthetic_data.py
```

**Note:** This regenerates these 8 categories:
- insurance, tax_forms, fuel_receipts, maintenance, inspections, settlements, emails, toll_receipts

**Static** (hand-crafted for accuracy):
- titles, registrations

---

## Common Testing Workflows

### Workflow 1: Full Pipeline End-to-End Test

```bash
# 1. Start all services
docker-compose up -d

# 2. Seed entity graph (Module 2)
curl -X POST http://localhost:8003/entity/register \
  -H "Content-Type: application/json" \
  -d '{
    "canonical_id": "T-084",
    "type": "truck",
    "canonical_name": "Unit 084",
    "aliases": [
      {"alias_text": "84", "confidence": 0.95},
      {"alias_text": "Trk 84", "confidence": 0.90},
      {"alias_text": "Unit 84", "confidence": 0.95}
    ]
  }'

# 3. Ingest all documents via Module 3
for file in data/synthetic/*/*.txt; do
  curl -X POST http://localhost:8004/ingest \
    -F "document=@$file" &
done
wait

# 4. Query via Module 4 (Agent)
curl -X POST http://localhost:8001/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "How much on fuel last month?"}'

# 5. Check stats
curl http://localhost:8002/health
curl http://localhost:8004/ingest/stats
```

### Workflow 2: Entity Resolution Stress Test

```bash
# Get all truck identifiers from fuel receipts
grep -h "^Truck:" data/synthetic/fuel_receipts/*.txt | sort | uniq

# Test resolution accuracy
for mention in "84" "Trk 84" "Unit 84" "Unit84" "T-084"; do
  curl http://localhost:8003/resolve?mention="$mention"
done

# Expected: All resolve to T-084 with confidence ≥ 0.9
```

### Workflow 3: Document Classification Accuracy

```bash
# Randomly sample 10 docs, classify each
for i in {1..10}; do
  file=$(find data/synthetic -name "*.txt" | shuf | head -1)
  echo "Testing: $file"
  curl -X POST http://localhost:8004/classify \
    -F "doc=@$file"
done
```

### Workflow 4: Field Extraction Quality

```bash
# Extract from fuel receipt (simple)
curl -X POST http://localhost:8004/extract \
  -F "doc=@data/synthetic/fuel_receipts/FUEL_0001.txt"
# Expected: {doc_type: "fuel_receipt", gallons: X, price: Y, total: Z, date: ...}

# Extract from maintenance invoice (complex)
curl -X POST http://localhost:8004/extract \
  -F "doc=@data/synthetic/maintenance/MAINT_0001.txt"
# Expected: {doc_type: "maintenance_invoice", invoice_id: X, amount: Y, services: [...]}

# Extract from email (unstructured)
curl -X POST http://localhost:8004/extract \
  -F "doc=@data/synthetic/emails/EMAIL_001.txt"
# Expected: {doc_type: "email", subject: X, entities: [...]}
```

---

## Data Schema (SQLite after ingestion)

After documents are ingested, your SQLite tables should contain:

```sql
-- Documents metadata
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  doc_type TEXT,
  entity_id TEXT,       -- Resolved truck ID (e.g., "T-084")
  extracted_fields JSONB,
  doc_date DATE,
  ingested_at TIMESTAMP,
  active BOOLEAN DEFAULT TRUE
);

-- Example rows:
INSERT INTO documents VALUES (
  "FUEL_0001",
  "fuel_receipt",
  "T-084",
  '{"gallons": 142.3, "price": 3.79, "total": 539.32, "odometer": 487291}',
  "2026-05-18",
  "2026-06-18 22:45:00",
  TRUE
);

-- Vector store (ChromaDB)
-- Document ID: FUEL_0001
-- Embedding: [0.234, -0.567, 0.891, ...]  (from full text)
-- Metadata: {entity_id: "T-084", doc_type: "fuel_receipt", doc_date: "2026-05-18", active: true}
```

---

## Debugging Tips

### Check a document is being classified correctly

```bash
# Check doc type
file=data/synthetic/fuel_receipts/FUEL_0001.txt
head -5 $file  # Does it start with "FUEL RECEIPT"?
```

### Verify entity resolution

```bash
# Check which trucks appear in fuel receipts
grep -h "^Truck:" data/synthetic/fuel_receipts/*.txt | sed 's/Truck: //' | sort | uniq -c

# All should map to T-084 through T-168 (the 10 truck IDs)
```

### Monitor ingestion

```bash
# Watch real-time ingestion logs
curl http://localhost:8004/ingest/status/FUEL_0001
# Should show: {"status": "completed", "extracted_fields": {...}}

# Check ingestion errors
curl http://localhost:8004/ingest/status?filter=error
```

---

## Pro Tips

1. **Start small:** Ingest 10 fuel receipts first, verify end-to-end, then scale to all 60

2. **Entity seeding:** Pre-seed the entity graph (Module 2) with known entities before ingesting unknown docs

3. **Date filtering:** Most queries will filter by date. Ensure `doc_date` parsing is correct in extraction

4. **Metrics:** Track:
   - Entity resolution confidence (should be ≥ 0.9 for unit number normalization)
   - Document classification accuracy (should be >95%)
   - Field extraction completeness (all required fields present)
   - Ingestion latency (should be <500ms per doc on average)

5. **Embeddings:** For RAG quality, test:
   - Same entity retrieval (e.g., all T-084 docs for a T-084 query)
   - Temporal filtering (past 30 days)
   - Cross-doc coherence (do related docs cluster together?)

---

## Next Steps

1. **Read** → `README.md` for full documentation
2. **Review** → `DATASET_MANIFEST.json` for machine-readable metadata
3. **Start** → Module 3 implementation (ingestion pipeline)
4. **Test** → Run workflows above
5. **Scale** → Add more documents or modify generation script

---

**Dataset Version:** 1.0  
**Last Updated:** 2026-06-18  
**Maintainer:** Fleet Management System Team

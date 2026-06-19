# Synthetic Dataset for Document Ingestion Pipeline

## Overview

This directory contains **~230 fabricated text documents** designed for testing and demonstration of the Fleet Management System's Document Ingestion Pipeline (Module 3).

All documents are **realistic but completely fictional** and generated for:
- Entity resolution testing (matching messy truck/driver references)
- Document classification pipeline evaluation
- Field extraction and parsing
- Vector embedding quality assessment
- End-to-end ingestion workflow validation

---

## Directory Structure

```
data/synthetic/
├── titles/           (10 files)     - Vehicle title documents (formal, clean format)
├── registrations/    (10 files)     - Vehicle registration certs (various format variations)
├── insurance/        (10 files)     - Commercial vehicle insurance certificates
├── tax_forms/        (10 files)     - IRS Form 2290 (Heavy Highway Vehicle Use Tax)
├── fuel_receipts/    (60 files)     - Fuel station receipts (messy truck naming)
├── maintenance/      (40 files)     - Maintenance invoices & repair orders
├── inspections/      (10 files)     - DOT annual inspection reports
├── settlements/      (30 files)     - Load settlement statements
├── emails/           (20 files)     - Internal email communications
├── toll_receipts/    (30 files)     - Toll collection receipts
└── README.md                         - This file
```

**Total: ~230 documents**

---

## Document Categories

### 1. Titles (10 files)
**Purpose:** Test clean document parsing

**Format:** Formal state-issued vehicle titles
**Key fields:** VIN, Owner, Lien Holder, Unit Number
**Truck references:** Clean formats (Unit 084, 084)
**Date range:** 2021-2024
**Entities resolved:** 10 unique trucks (T-084 through T-168)

**Sample:**
```
VEHICLE TITLE
State: Texas
VIN: 3AKJHHDR7BS467821
Truck Unit Number: 084
Owner Name: ABC Trucking LLC
```

---

### 2. Registrations (10 files)
**Purpose:** Test entity resolution with format variations

**Format:** State registration certificates
**Key fields:** Unit Number, Plate Number, VIN, Expiration Date
**Truck references:** MESSY (variations: "84", "Unit 84", "T-084", "Unit84", "#084")
**Date range:** 2022-2025
**Entities resolved:** 10 unique trucks

**Sample:**
```
Unit Number: Unit 105
Plate Number: ABCUNIT105
Status: Active
Expiration Date: January 10, 2026
```

**Entity resolution challenge:** Matches "Unit 84", "T-084", "084" to canonical entity T-084

---

### 3. Insurance Certificates (10 files)
**Purpose:** Test structured data extraction from formal documents

**Format:** Commercial vehicle insurance certificates
**Key fields:** Policy Number, Certificate Number, Coverage Limits, VIN, Unit Number
**Coverage types:** Liability ($1M), Property Damage, Medical Payments
**Expiration dates:** All active (valid until 2026-2027)
**Entities resolved:** Linked to fleet vehicles by unit number

**Sample:**
```
Certificate Number: FL-ABC-0001
Policy Number: POL-000001
Unit Number: 84
Expiration Date: [6+ months future]
Coverage Limits: $1,000,000 each occurrence
```

---

### 4. Tax Forms (10 files)
**Purpose:** Test VIN-based entity linking (no unit number in form)

**Format:** IRS Form 2290 (Heavy Highway Vehicle Use Tax Return)
**Key fields:** VIN, EIN, Gross Vehicle Weight, Tax Amount, Payment Date
**Special:** VIN is primary identifier (no unit number)
**Amount:** $550/vehicle/year (standard)
**Date range:** 2023-2026

**Ingestion challenge:**
- Must resolve VIN → canonical truck entity
- VIN-only documents test embedding quality
- Forms date back multiple years (test date parsing)

**Sample:**
```
IRS FORM 2290
VIN: 3AKJHHDR7BS467821
EIN: 75-2847392
Tax Year: 2026
Total Tax Due: $550.00
Acceptance Number: 234892
```

---

### 5. Fuel Receipts (60 files)
**Purpose:** Test real-world messy data (primary ingestion workload)

**Format:** Simple fuel station receipts
**Key fields:** Truck identifier, Gallons, Price, Odometer, Driver name, Date
**Truck references:** VERY MESSY
  - "Trk 84" (abbreviated)
  - "Unit 84" (formal)
  - "84" (bare number)
  - "Unit84" (no space)
**Date range:** Past 30 days
**Volume:** 60 docs (typical weekly volume for a 10-truck fleet)
**Driver names:** Match global driver pool (reduces ambiguity)

**Sample:**
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

**Ingestion challenge:**
- Entity resolution must resolve "Trk 84" → T-084
- Field extraction (gallons, price, odometer)
- Driver name may be abbreviated
- Multiple receipts per truck per week

---

### 6. Maintenance Invoices (40 files)
**Purpose:** Test structured extraction from vendor documents

**Format:** Repair shop invoices
**Key fields:** Invoice Number, Truck/Unit ID, Service Type, Hours, Cost, Parts Cost
**Service types:** Oil change, tire replacement, brake service, etc.
**Truck references:** "Unit {number}" or "T-{number}"
**Amount range:** $150–$1600 per invoice
**Date range:** Past 60 days
**Volume:** 40 docs (typical monthly volume)

**Sample:**
```
MAINTENANCE INVOICE
Invoice Number: INV-0001
Truck/Fleet ID: Unit 84 (T-084)
Make/Model: Freightliner Truck
Odometer Reading: 245678 miles
Services Rendered: Oil Change
Hours: 2.5
Parts Cost: $145.00
Labor Cost: $187.50
Total Due: $383.75
```

---

### 7. DOT Inspection Reports (10 files)
**Purpose:** Test long-form document parsing and compliance tracking

**Format:** Annual DOT safety inspection records
**Key fields:** Unit Number, VIN, Inspection Date, Valid Until, Pass/Fail status
**Status:** All PASS (fleet compliance)
**Components checked:** Brakes, tires, lights, suspension, steering, safety equipment
**Validity period:** 12 months from inspection date
**Entities resolved:** 1:1 mapping to vehicle units

**Sample:**
```
ANNUAL DOT INSPECTION REPORT
Inspection Number: DOT-000001
Unit Number: 84 (T-084)
Inspection Date: [past 6 months]
Valid Until: [future date]
OVERALL RESULT: APPROVED FOR SERVICE
```

---

### 8. Settlement Statements (30 files)
**Purpose:** Test extraction from variable-format freight/load data

**Format:** Broker settlement statements (per load)
**Key fields:** Load Number, Truck/Unit, Driver, Miles, Revenue, Deductions, Net Settlement
**Truck references:** "Unit {number}" or "T-{number}"
**Revenue range:** $900–$3000 per load
**Deduction types:** Fuel, maintenance, insurance, tolls, commission
**Date range:** Past 45 days
**Frequency:** 3–4 per truck per month (varies)

**Sample:**
```
SETTLEMENT STATEMENT
Settlement ID: STL-000001
Load #: LOAD-45821
Truck/Unit: Unit 84 (T-084)
Driver: John Smith
Miles: 1547
Total Revenue: $2,847.50
Total Deductions: $1,087.23
NET SETTLEMENT: $1,760.27
```

---

### 9. Emails (20 files)
**Purpose:** Test unstructured text entity extraction

**Format:** Plain text email messages
**Key fields:** From, To, Date, Subject, Body
**Subjects:** Maintenance requests, safety alerts, vehicle issues
**Truck references:** Very informal
  - "the white Cascadia" (description)
  - "Unit 84" (formal)
  - "truck 84" (informal)
**Body text:** Natural language, task descriptions
**Date range:** Past 60 days

**Sample:**
```
From: mike@abctrucking.com
To: dispatch@abctrucking.com
Date: May 20, 2026
Subject: White Cascadia brake issue

Hey, the white Cascadia is pulling to the left under braking.
John says it started yesterday on the I-20 run.
Can we get it into the shop this week?
```

**Ingestion challenge:**
- Entity resolution via description ("white Cascadia" → T-084)
- Embedding quality on short text
- Informal language parsing

---

### 10. Toll Receipts (30 files)
**Purpose:** Test transponder/identifier-only documents

**Format:** Electronic toll collection receipts
**Key fields:** Receipt Number, Transponder ID, Toll Charge, Date/Time, Account Balance
**Truck references:** Indirect (transponder linked to fleet unit ID)
**Amount:** $2.50–$8.50 per toll
**Toll roads:** Texas toll authorities
**Date range:** Past 45 days

**Sample:**
```
TOLL RECEIPT
Receipt Number: TOLL-000001
Transponder ID: TX-4567
Date: 05/15/2026
Toll Plaza: North Plaza
Charge: $5.75
Account Balance: $247.83
```

**Ingestion challenge:**
- Transponder → fleet unit mapping
- No direct truck identifier in document
- Requires cross-reference lookup

---

## Entity Resolution Test Scenarios

The dataset is designed to test all 5 entity resolution techniques:

| Method | Document Type | Challenge | Example |
|--------|---------------|-----------|---------|
| **VIN Exact Match** (confidence 1.0) | Titles, Tax Forms, Registrations | Perfect match | VIN → T-084 |
| **Unit Number Normalization** (confidence 0.9) | Registrations, Maintenance, Settlements | Format variations | "Unit84", "84", "Unit 84" → T-084 |
| **CDL Exact Match** (confidence 1.0) | (Not in this dataset; in production) | Driver-specific | |
| **License Plate Match** (confidence 1.0) | Registrations | State plate number | "ABCTRK84" → T-084 |
| **Embedding Cosine Similarity** (confidence 0.6–0.8) | Emails | Description-based | "white Cascadia" → T-084 |

---

## Document Statistics

| Category | Count | Avg Size | Primary Keys | Re-usable? |
|----------|-------|----------|--------------|-----------|
| Titles | 10 | ~600 bytes | VIN, Unit Number | ✓ (stable) |
| Registrations | 10 | ~550 bytes | Unit Number, VIN, Plate | ✓ (expires annually) |
| Insurance | 10 | ~700 bytes | Policy Number, VIN | ✓ (expires annually) |
| Tax Forms | 10 | ~800 bytes | VIN, EIN | ✓ (once per year) |
| Fuel Receipts | 60 | ~400 bytes | Receipt #, Date | ✓ (high volume) |
| Maintenance | 40 | ~650 bytes | Invoice #, Date | ✓ (ongoing) |
| Inspections | 10 | ~1000 bytes | Inspection #, Valid Until | ✓ (expires annually) |
| Settlements | 30 | ~700 bytes | Settlement ID, Load #, Date | ✓ (ongoing) |
| Emails | 20 | ~300 bytes | Date, Subject | ✓ (ad-hoc) |
| Toll Receipts | 30 | ~450 bytes | Receipt #, Transponder ID | ✓ (ongoing) |

**Total corpus:** ~230 documents, ~145 KB text

---

## How to Use This Dataset

### 1. Test Entity Resolution

```bash
# Ingest all fuel receipts
curl -X POST http://localhost:8004/ingest \
  -F "documents=@data/synthetic/fuel_receipts/*"

# Check entity links
curl http://localhost:8003/entity/T-084
# Returns: {canonical_id: "T-084", aliases: ["84", "Trk 84", "Unit84", ...], confidence: [...]}
```

### 2. Test Document Classification

```bash
# Classify a fuel receipt
curl -X POST http://localhost:8004/classify \
  -F "doc=@data/synthetic/fuel_receipts/FUEL_0001.txt"

# Expected output: {type: "fuel_receipt", confidence: 0.95}
```

### 3. Test Field Extraction

```bash
# Extract fields from maintenance invoice
curl -X POST http://localhost:8004/extract \
  -F "doc=@data/synthetic/maintenance/MAINT_0001.txt"

# Expected output:
# {
#   "doc_type": "maintenance_invoice",
#   "invoice_number": "INV-0001",
#   "truck_id": "T-084",
#   "total_amount": 383.75,
#   "date": "2026-05-15"
# }
```

### 4. Test Retrieval Quality

```bash
# Query: "What was my fuel spend last month?"
curl -X POST http://localhost:8001/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What was my fuel spend last month?"}'

# Backend will:
# 1. Route to MCP get_expenses(category="fuel", date_from="2026-04-18", date_to="2026-05-18")
# 2. Execute tool
# 3. Retrieve supporting documents (60 fuel receipts) by entity/date filter
# 4. Return answer with citations
```

---

## Document Generation Notes

### How They Were Created

- **Titles, Registrations, Insurance, Tax Forms (40 docs):** Hand-crafted to ensure accuracy
- **Fuel Receipts, Maintenance, Settlements, Toll Receipts, Inspections (160 docs):** Generated via Python script with randomized fields
- **Emails (20 docs):** Hand-written to represent real operational communications

### Data Quality

- **Consistency:** All documents reference the same 10 trucks (units 84, 91, 105, 112, 118, 125, 132, 140, 151, 168)
- **Temporal realism:** Dates span the past 60 days (realistic ingestion window)
- **Name consistency:** Drivers and vendors sampled from fixed pools to match real-world scenarios
- **Mismatch variety:** Intentional format variations in truck/unit references to test entity resolution

### Regeneration

To regenerate all documents with fresh random values:

```bash
cd data/synthetic
python3 generate_synthetic_data.py
```

(Note: Titles, registrations, insurance docs must be regenerated separately or kept static)

---

## Integration with Ingestion Pipeline

### Expected Workflow

1. **Upload** → Place `.txt` files in `data/synthetic/` directories
2. **Classify** → LLM or regex determines doc type (e.g., "fuel_receipt")
3. **Extract** → Type-specific regex/parser pulls key fields
4. **Resolve** → Entity linker maps "Trk 84" → canonical T-084
5. **Store** → Insert into SQLite `documents` table with metadata
6. **Embed** → Full doc text → ChromaDB vector store
7. **Index** → Add to retrieval index with entity/date filters

### Pipeline Validation Checklist

- [ ] All documents classified correctly
- [ ] Entity resolution confidence scores (see Module 2 spec)
- [ ] No documents orphaned (all linked to valid trucks)
- [ ] Dates parsed correctly (past 60 days)
- [ ] Full-text embedding quality (>0.85 cosine similarity for same-entity queries)
- [ ] No SQL injection/malformed fields during extraction
- [ ] Audit log records all ingestion events

---

## FAQ

**Q: Why so many fuel receipts?**
A: Fuel is the highest-volume operational document. 60 receipts over 30 days = ~2 per truck per week, matching real-world frequency.

**Q: Are the amounts/values realistic?**
A: Yes. Fuel prices, maintenance costs, settlement amounts match 2026 industry estimates for Class 8 trucking.

**Q: Can I modify these documents?**
A: Yes. They're test data. Modify, extend, or regenerate as needed for your testing scenario.

**Q: Do these need to be imported before testing?**
A: No. They're pre-generated for copy-paste into the ingestion pipeline. The pipeline API will process them.

**Q: What if I need different trucks/drivers?**
A: Edit `generate_synthetic_data.py` and change the `TRUCK_UNITS`, `DRIVERS`, etc. lists at the top.

---

## Related Documentation

- **Pipeline spec:** `docs/design.md` → Module 3: Document Ingestion Pipeline
- **Entity resolution:** `docs/design.md` → Module 2: Entity Resolution Engine
- **Ingestion code:** `ingestion/src/ingestion.py`, `ingestion/src/classifier.py`, `ingestion/src/extractor.py`

---

**Dataset Version:** 1.0  
**Generated:** 2026-06-18  
**Total Documents:** ~230  
**Total Size:** ~145 KB  
**Format:** Plain text (`.txt`)

# ByteForce — Production AI Hardware Diagnostics & Repair Platform

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel%20Production-black.svg?style=flat&logo=vercel)](https://fixora-ai-omega.vercel.app/)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL%2017-3ECF8E.svg?style=flat&logo=supabase)](https://supabase.com/)
[![Python](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.11+-3776AB.svg?style=flat&logo=python)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-ODbL%20%2F%20CC%20BY--NC--SA-green.svg)](LICENSE)
[![i18n](https://img.shields.io/badge/i18n-English%20%7C%20العربية%20(RTL)-orange.svg)]()

**ByteForce** is a genuine, data-driven hardware diagnosis and repair platform. It connects three certified external open datasets to an enterprise Supabase PostgreSQL database, eliminating all mock, synthetic, fabricated, or hardcoded diagnostic data.

---

## 1. Certified Source Datasets & Exact Roles

| Dataset | Official Source URL | License | Scope & Exact Role in ByteForce | Verified Record Count |
| :--- | :--- | :--- | :--- | :--- |
| **Open Repair Alliance (ORA)** | [Open Repair Alliance GitHub Data](https://raw.githubusercontent.com/openrepair/data/main/OpenRepairData_v0.3_aggregate_202607_eee.csv) | ODbL 1.0 | **Empirical Repair Statistics**: Computes real-world repair success rates, failure mode frequencies, device age benchmarks, and repair barriers across 10 equipment categories. | **416,282** real repair events |
| **MyFixit Dataset** | [MyFixit Dataset (rub-ksv)](https://github.com/rub-ksv/MyFixit-Dataset) | CC BY-NC-SA 3.0 | **Verified Repair Manuals**: Provides authentic step-by-step disassembly instructions, required toolboxes, parts, difficulty ratings, and official iFixit reference URLs. | **18,995** manuals (1,160 imported in Supabase) |
| **Backblaze Drive Stats** | [Backblaze Q2 2026 Drive Data](https://f001.backblazeb2.com/file/Backblaze-Hard-Drive-Data/data_Q2_2026.zip) | Open Research / Attribution | **Hard Drive Failure Prediction**: Trained Random Forest binary classifier ($ROC\text{-}AUC = 0.9117$, $PR\text{-}AUC = 0.7144$) evaluated on SMART drive telemetry. **Storage devices ONLY.** | **12,442** telemetry rows |

---

## 2. Architecture & Data Flow

```
[Raw Datasets]
  ├── OpenRepairData_v0.3_aggregate_202607_eee.csv (416K rows)
  ├── MyFixit JSONL files (15 files, 18,995 manuals)
  └── Backblaze Q2 2026 SMART Telemetry (12.4K rows)
         │
         ▼
[Repeatable Ingestion Pipeline] (scripts/ingest_datasets.py)
  ├── SHA-256 Hash Validation & Schema Verification
  ├── Clean missing values, normalize categories & cluster problems
  └── Batch upsert via PostgREST HTTPS API
         │
         ▼
[Production Database] (Supabase PostgreSQL - EU-West-1)
  ├── public.repair_incidents (3,000 empirical ORA events, indexed)
  ├── public.repair_guides (1,160 verified manuals with steps & tools)
  ├── public.openrepair_statistics (10 categories with empirical fix rates)
  ├── public.backblaze_models (Random Forest weights, metrics, importances)
  └── public.certified_datasets (Integrity registry & source hashes)
         │
         ▼
[FastAPI Serverless Layer] (api/index.py & api/routers/)
  ├── GET  /api/datasets/status   -> Live database verified row counts
  ├── POST /api/diagnosis/analyze -> Truly data-driven diagnosis engine
  ├── GET  /api/guides            -> Filtered verified manual retrieval
  └── POST /api/prediction/hard-drive -> SMART ML failure inference
         │
         ▼
[Frontend UI] (Clean White Theme only - Arabic & English)
  ├── Live counters updated directly from database query
  ├── Circular rotating seal with asterisk (strictly LTR in all languages)
  └── Zero mock fallbacks: returns 503 Dataset Unavailable on outage
```

---

## 3. Zero Mock Data Policy

In strict accordance with production standards, ByteForce has completely purged:
- `handleMockRequest` and client-side fake router fallbacks.
- `initMockStorage` and localStorage-based fake technician/user records.
- `runClientDiagnosis` and static diagnostic probabilities (e.g. fake 99.4% accuracy or 0.94 constant).
- Hardcoded default causes, default screwdrivers, or fabricated disassembly steps.
- If data is lacking for an unknown device or symptom, ByteForce explicitly returns:
  `status: "insufficient_evidence"` with a clear explanation rather than inventing advice.
- If the database is unreachable, ByteForce returns `HTTP 503 Dataset unavailable`.

---

## 4. Ingestion & Migration Commands

### Step 1: Apply Supabase Database Migrations
```bash
python scripts/migrate_supabase.py
```
Applies DDL statements to create `repair_incidents`, `repair_guides`, `openrepair_statistics`, `backblaze_models`, and `certified_datasets` with proper indexes and Row-Level Security policies.

### Step 2: Ingest Datasets into Supabase
```bash
# Ingest all three datasets with configurable sample limits:
python scripts/ingest_datasets.py --guides-limit 1160 --incidents-limit 3000

# Or ingest a specific dataset:
python scripts/ingest_datasets.py --dataset open_repair
python scripts/ingest_datasets.py --dataset myfixit --guides-limit 1500
python scripts/ingest_datasets.py --dataset backblaze
```

### Step 3: Run Automated Verification Tests
```bash
# Run production integrity test suite (scans codebase for zero mocks):
python -m unittest tests/test_production_integrity.py

# Run complete 30-test suite:
python -m unittest discover tests
```

---

## 5. Important Scope & Limitations

1. **Backblaze SMART Failure Prediction**:
   - Strictly restricted to **Storage devices (HDD/SSD)**.
   - Non-storage device categories (Smartphones, Laptops, Consoles, TVs, etc.) are strictly rejected with `applicable: False`.
   - Requires valid SMART attributes (`smart_5_raw`, `smart_197_raw`, `smart_198_raw`, etc.) for inference.
2. **Open Repair Alliance Statistics**:
   - Represents empirical outcomes from community repair events across Europe and North America.
   - Failure frequencies reflect historical repair café encounters, not overall manufacturing defect rates.
3. **MyFixit Attribution**:
   - All repair manuals preserve original guide IDs, component tags, tool requirements, and attribution links to [iFixit](https://www.ifixit.com).
   - CC BY-NC-SA 3.0 license respected.

---

## 6. Environment Variables

See [.env.example](.env.example) for required keys:
- `SUPABASE_URL`: Supabase project URL (`https://czwndaulnxvmncbtzsao.supabase.co`).
- `SUPABASE_ANON_KEY`: Publishable JWT key for client-side and public queries.
- `SUPABASE_SERVICE_ROLE_KEY`: Secret service-role JWT for backend ingestion and migrations.

---

## 7. License
- Platform Code: MIT License
- Open Repair Alliance Data: Open Data Commons Open Database License (ODbL) 1.0
- MyFixit Dataset: Creative Commons Attribution-NonCommercial-ShareAlike (CC BY-NC-SA) 3.0
- Backblaze Drive Stats: Open Research / Attribution

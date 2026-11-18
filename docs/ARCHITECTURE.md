# TechRepair — System Architecture Documentation
## AI-Powered Smart Device Diagnosis & Repair Platform

### 1. Architectural Overview
TechRepair is architected as an asynchronous, decoupled, multi-tier web platform consisting of:
- **Presentation Layer**: Responsive Single Page Application (SPA) with bidirectional internationalization (English & Arabic RTL).
- **Application & Security Gateway**: FastAPI REST API providing rate-limiting, JWT authentication, and Role-Based Access Control (RBAC).
- **AI & Diagnostics Engine**: A multi-stage pipeline combining deterministic safety triage, NLP symptom extraction, and calibrated cause ranking.
- **Data & Persistence Layer**: Relational schema (SQLite / PostgreSQL) managing users, devices, reports, repair guides, and technician bookings.

---

### 2. Multi-Stage AI Diagnosis Pipeline

```
[User Problem Description]
          │
          ▼
┌─────────────────────────────────┐
│ Stage 1: Safety & Hazard Triage │  --> If critical hazard (swollen battery, burning, sparks):
└─────────────────────────────────┘      - Lock dangerous DIY steps
          │                              - Emit critical hazard alerts
          ▼                              - Trigger mandatory technician referral
┌─────────────────────────────────┐
│ Stage 2: Bilingual NLP Parsing  │  --> Regex + Token matching across English & Arabic
└─────────────────────────────────┘      extracts canonical symptom codes.
          │
          ▼
┌─────────────────────────────────┐
│ Stage 3: Dataset KB Retrieval   │  --> Matches symptom vectors against Open Repair Alliance
└─────────────────────────────────┘      failure patterns and MyFixit troubleshooting trees.
          │
          ▼
┌─────────────────────────────────┐
│ Stage 4: Cause Ranking & Scoring│  --> Calculates calibrated probabilities for each root cause
└─────────────────────────────────┘      and assigns severity levels (Low, Medium, High, Critical).
          │
          ▼
┌─────────────────────────────────┐
│ Stage 5: Structured Report Gen  │  --> Emits required tools, step-by-step instructions,
└─────────────────────────────────┘      safety warnings, and persists report to database.
```

---

### 3. Role-Based Access Control (RBAC)

| Role | Permissions & Scope |
| :--- | :--- |
| **Guest / Anonymous** | Can run instant AI device diagnosis, browse published repair guides, view approved technician profiles. |
| **Regular User** (`user`) | Manage registered devices, save and view historical diagnosis reports, submit repair booking requests to technicians. |
| **Technician** (`technician`) | Manage business profile, review incoming repair booking requests, accept/reject requests, update repair status and quotes. |
| **Administrator** (`admin`) | Access administration control center, monitor platform KPIs, approve/reject pending technician applications, toggle user accounts. |

---

### 4. API Specification Summary

- `POST /api/v1/auth/register` — Create user or technician account.
- `POST /api/v1/auth/login` — Authenticate and receive JWT access token.
- `GET  /api/v1/auth/me` — Retrieve current authenticated user profile.
- `POST /api/v1/diagnosis/analyze` — Run AI diagnostic pipeline on problem description.
- `GET  /api/v1/diagnosis/reports` — Fetch user's saved diagnosis reports.
- `GET  /api/v1/guides` — Query repair guides with category, difficulty, and search filters.
- `GET  /api/v1/technicians` — Browse verified technicians by city and specialization.
- `POST /api/v1/bookings/requests` — Submit a repair request to a technician.
- `PATCH /api/v1/bookings/requests/{id}/status` — Update booking status (accepted, in-progress, completed).
- `GET  /api/v1/admin/stats` — Retrieve platform KPI metrics (Admin only).
- `POST /api/v1/admin/technicians/{id}/approve` — Approve technician application (Admin only).

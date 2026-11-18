# TechRepair — AI-Powered Smart Device Diagnosis & Repair Platform

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg?style=flat&logo=python)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![RTL](https://img.shields.io/badge/i18n-English%20%7C%20العربية%20(RTL)-orange.svg)]()

**TechRepair** is an AI-powered device diagnosis and repair platform designed to help users identify technical issues with laptops, computers, and smartphones, understand probable root causes, follow calibrated step-by-step DIY troubleshooting instructions, and connect with certified technicians when repairs exceed safe DIY limits.

---

## Key Features

- **Multi-Stage AI Diagnosis Engine**:
  - Deterministic safety triage (detects critical hazards like swollen batteries, electrical short-circuits, and liquid ingress).
  - Bilingual NLP symptom extractor supporting natural language in English and Arabic.
  - Probabilistic root-cause ranking calibrated on real repair knowledge from the **Open Repair Alliance** and **MyFixit** datasets.
- **Bilingual (English & Arabic RTL)**: Full bidirectional support with smooth layout switching, localized fonts (Cairo & Inter), and mirrored navigation.
- **Role-Based Access Control (RBAC)**:
  - **Customers**: Device registration, diagnosis history, PDF report export, technician booking.
  - **Technicians**: Application submission, verification status, request management, repair quotes.
  - **Administrators**: Platform metrics, technician verification workflow, user status management.
- **Repair Guides Library**: Curated searchable DIY guides with difficulty ratings, time estimates, required tools, and safety precautions.
- **Technician Marketplace**: Directory of vetted hardware specialists filterable by city and specialty.

---

## Technology Stack

- **Backend**: Python 3, FastAPI, SQLite (with native relational schemas), JWT Authentication, Bcrypt.
- **Frontend**: Responsive Single Page Application (SPA), TechRepair Design System, FontAwesome 6, Vanilla ES6+ modules.
- **AI & NLP**: Multi-tier rule engine, symptom token vectorization, calibrated probability scoring.

---

## Quick Start

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/ym1791403-sys/Fixora.git
cd Fixora
pip install -r requirements.txt
```

### 2. Run the Application
Start the unified platform server:
```bash
python backend/run.py
```

Visit the application in your browser:
- **Web App**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive API Docs (Swagger UI)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## Pre-seeded Demo Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@techrepair.com` | `Admin123456!` |
| **Technician** | `cairo.fix@techrepair.com` | `Tech123456!` |
| **Customer** | `user@techrepair.com` | `User123456!` |

---

## Documentation
- [System Architecture](docs/ARCHITECTURE.md)
- [User & Developer Guide](docs/USER_GUIDE.md)

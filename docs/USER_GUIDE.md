# TechRepair — User & Developer Guide

## 1. Quick Start

### Running the Platform
From the repository root (`Fixora`), start the unified server:
```bash
python backend/run.py
```

Open your browser at:
- **Web Application**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive API Documentation (Swagger)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 2. Default Test Accounts (Pre-seeded)

For immediate testing, the database is pre-seeded with the following accounts:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@techrepair.com` | `Admin123456!` | Full admin panel access, statistics, and technician approvals. |
| **Technician (Cairo)** | `cairo.fix@techrepair.com` | `Tech123456!` | Apex Laptop & Board Diagnostics (Verified). |
| **Technician (Alex)** | `alex.tech@techrepair.com` | `Tech123456!` | SmartFix Mobile & Tablet Lab (Verified). |
| **Technician (Giza)** | `giza.pc@techrepair.com` | `Tech123456!` | ProBuild Workstations & Data Recovery (Verified). |
| **Customer** | `user@techrepair.com` | `User123456!` | Ahmed Mansour with a pre-registered Dell XPS 15 laptop. |

> [!TIP]
> On the login modal, you can use the **Quick Demo Logins** buttons to instantly populate credentials for any role with a single click.

---

## 3. Core Features Walkthrough

### 1. Smart Device Diagnosis
1. Click **Diagnose Device** from the navigation bar.
2. Choose your device category (e.g., Laptop, Smartphone, Desktop Computer, Tablet).
3. Enter brand and model (e.g., *Dell XPS 15* or *iPhone 13*).
4. Describe the symptoms in either **English** or **Arabic** (e.g., *"My laptop becomes very hot and shuts down after ten minutes"* or *"اللابتوب يسخن جداً وينطفئ فجأة"*).
5. Click **Run AI Diagnosis**.
6. The system analyzes safety hazards, extracts symptom codes, ranks probable causes with confidence percentages, lists required tools, provides safety warnings, and outputs step-by-step DIY instructions.

### 2. Bilingual English & Arabic (RTL) Switch
- Click the language button in the navbar (**العربية / English**).
- The entire application dynamically flips layout direction (`dir="rtl"` / `dir="ltr"`), adjusts typography (Inter & Cairo fonts), and localizes all forms, alerts, and navigation links.

### 3. Technician Marketplace & Booking
- Browse verified technicians filtered by city (Cairo, Alexandria, Giza) and hardware specialization.
- Click **Book Repair** to open the interactive booking modal with auto-filled device information from your latest diagnosis.
- Technicians can review and accept/update repair requests in real-time from their dashboard.

### 4. Admin Management Center
- Log in with `admin@techrepair.com`.
- Access the **Admin Panel** from the navigation bar.
- View real-time platform KPIs, approve/reject new technician applicants, and manage user accounts.

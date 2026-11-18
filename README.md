# Fixora — AI-Powered Smart Device Diagnosis & Repair Platform

[![Vercel](https://img.shields.io/badge/Deploy-Vercel%20Ready-black.svg?style=flat&logo=vercel)](https://vercel.com/)
[![C++](https://img.shields.io/badge/Core-C%2B%2B17-blue.svg?style=flat&logo=c%2B%2B)](https://isocpp.org/)
[![JavaScript](https://img.shields.io/badge/Frontend-ES6%2B%20SPA-F7DF1E.svg?style=flat&logo=javascript)](https://developer.mozilla.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![RTL](https://img.shields.io/badge/i18n-English%20%7C%20العربية%20(RTL)-orange.svg)]()

**Fixora** (formerly TechRepair) is an AI-powered device diagnosis and repair platform designed to help users identify technical issues with laptops, computers, and smartphones, understand probable root causes, follow calibrated step-by-step DIY troubleshooting instructions, and connect with certified technicians.

---

## Key Features

- **Multi-Stage AI Diagnosis Engine**:
  - Deterministic safety triage (detects critical hazards like swollen batteries, electrical short-circuits, and liquid ingress).
  - Bilingual NLP symptom extractor supporting natural language in English and Arabic.
  - Probabilistic root-cause ranking calibrated on real repair knowledge from Open Repair Alliance and MyFixit datasets.
- **Bilingual (English & Arabic RTL)**: Full bidirectional support with smooth layout switching, localized fonts (Cairo & Inter), and mirrored navigation.
- **Zero-Config Cloud Hosting**: Fully optimized for instant deployment on **Vercel**, GitHub Pages, or Netlify with 0 build errors.
- **High-Performance C++ Core**: Includes a native C++17 implementation in `backend_cpp/` for ultra-fast diagnostic execution.
- **Interactive Repair Guides**: Curated DIY guides with difficulty ratings, time estimates, required tools, and safety precautions.
- **Technician Marketplace**: Directory of vetted hardware specialists filterable by city and specialty.

---

## Project Structure

```text
Fixora/
├── index.html            # Main web application entrypoint (Vercel-ready)
├── css/
│   └── style.css         # Modern responsive styling & animations
├── js/
│   ├── api.js            # Client-side AI diagnosis engine & API client
│   ├── app.js            # Single Page Application (SPA) controller
│   └── i18n.js           # Bilingual English / Arabic localization
├── backend_cpp/          # Native C++17 AI Diagnosis Core
│   ├── ai_engine.hpp     # Safety rules, symptoms & knowledge base
│   ├── main.cpp          # CLI test harness and diagnostic runner
│   ├── CMakeLists.txt    # CMake build configuration
│   └── build.bat         # Windows build script
├── docs/                 # Documentation & Architecture guides
├── vercel.json           # Vercel deployment configuration
└── README.md
```

---

## Quick Start

### 1. Web Application (Browser & Vercel)
No compilation or server dependencies required!
- **Local Preview**: Open `index.html` directly in any web browser.
- **Vercel Deployment**: Push to GitHub and connect to Vercel — deploys instantly in 2 seconds.

### 2. Native C++ Engine
To build and run the high-performance C++ diagnosis engine:
```bash
cd backend_cpp
build.bat
# Or manually with g++:
g++ -std=c++17 -O3 main.cpp -o fixora_engine.exe
./fixora_engine.exe "Laptop overheats and shuts down"
```

---

## License
MIT License.

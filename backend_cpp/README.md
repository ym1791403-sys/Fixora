# Fixora C++ AI Diagnosis Engine

High-performance C++ core engine for deterministic safety triage, bilingual symptom extraction, and probabilistic root-cause diagnosis.

## Building the Engine

### Prerequisites
- Modern C++ compiler supporting C++17 (`g++`, `clang++`, or MSVC `cl.exe`)
- CMake 3.15+ (optional)

### Compilation

#### Windows (Command Prompt / PowerShell)
Run the automated build script:
```cmd
build.bat
```
Or compile directly:
```cmd
g++ -std=c++17 -O3 main.cpp -o fixora_engine.exe
```

#### Linux / macOS
```bash
g++ -std=c++17 -O3 main.cpp -o fixora_engine
./fixora_engine "Laptop overheats and shuts down suddenly"
```

### Features
- **Deterministic Safety Triage**: Identifies critical thermal runaway, battery swelling, and liquid ingress.
- **Bilingual NLP Symptom Matcher**: English and Arabic technical keyword tokenization.
- **Probabilistic Knowledge Base**: Calibrated root-cause ranking and step-by-step DIY guidance.

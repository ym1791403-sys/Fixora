@echo off
echo Building Fixora C++ Engine...
where g++ >nul 2>nul
if %errorlevel% equ 0 (
    g++ -std=c++17 -O3 main.cpp -o fixora_engine.exe
    echo Build complete! Run fixora_engine.exe
    exit /b 0
)

where cl >nul 2>nul
if %errorlevel% equ 0 (
    cl /std:c++17 /O2 /EHsc main.cpp /Fe:fixora_engine.exe
    echo Build complete! Run fixora_engine.exe
    exit /b 0
)

echo No C++ compiler found (g++ or MSVC cl). Please install MinGW or Visual Studio C++ Build Tools.

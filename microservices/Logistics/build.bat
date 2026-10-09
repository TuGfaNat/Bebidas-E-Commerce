@echo off
title Burger 24/7 - Compilador Modulo C++
echo ========================================================
echo   Compilando Modulo de Alto Rendimiento C++ (Logistica)
echo ========================================================

where g++ >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [+] Compilando con GCC / G++...
    g++ -O3 "%~dp0calculator.cpp" -o "%~dp0calculator.exe"
    echo [OK] Modulo C++ compilado exitosamente: microservices\Logistics\calculator.exe
    goto end
)

where clang++ >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [+] Compilando con Clang++...
    clang++ -O3 "%~dp0calculator.cpp" -o "%~dp0calculator.exe"
    echo [OK] Modulo C++ compilado exitosamente: microservices\Logistics\calculator.exe
    goto end
)

where cl >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [+] Compilando con MSVC (CL)...
    cl /O2 /EHsc "%~dp0calculator.cpp" /Fe:"%~dp0calculator.exe"
    echo [OK] Modulo C++ compilado exitosamente: microservices\Logistics\calculator.exe
    goto end
)

echo [INFO] Para compilarlo manualmente puede instalar MinGW / Visual C++.
:end

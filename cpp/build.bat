@echo off
setlocal enabledelayedexpansion

echo =========================================================
echo  Burger 24/7 - Compilador del Modulo Critico C++ (SPEC 2)
echo =========================================================

set "SRC_DIR=%~dp0"
set "SRC_FILE=%SRC_DIR%motor_core.cpp"
set "OUT_FILE=%SRC_DIR%motor_core.exe"

:: 1. Buscar g++ en el PATH
where g++ >nul 2>nul
if %errorlevel% equ 0 (
    set "CXX=g++"
    goto COMPILAR
)

:: 2. Buscar en rutas conocidas comunes en Windows
if exist "D:\w64devkit\bin\g++.exe" (
    set "CXX=D:\w64devkit\bin\g++.exe"
    goto COMPILAR
)
if exist "C:\w64devkit\bin\g++.exe" (
    set "CXX=C:\w64devkit\bin\g++.exe"
    goto COMPILAR
)
if exist "C:\MinGW\bin\g++.exe" (
    set "CXX=C:\MinGW\bin\g++.exe"
    goto COMPILAR
)
if exist "C:\msys64\mingw64\bin\g++.exe" (
    set "CXX=C:\msys64\mingw64\bin\g++.exe"
    goto COMPILAR
)

echo [ERROR] No se encontro el compilador g++ en el PATH ni en rutas conocidas.
echo Por favor asegurese de tener MinGW/w64devkit instalado.
exit /b 1

:COMPILAR
echo Usando compilador: !CXX!
echo Compilando %SRC_FILE% ...

"!CXX!" -O2 -std=c++17 "%SRC_FILE%" -o "%OUT_FILE%"

if %errorlevel% neq 0 (
    echo [ERROR] La compilacion de motor_core.exe fallo con codigo %errorlevel%.
    exit /b %errorlevel%
)

if not exist "%OUT_FILE%" (
    echo [ERROR] El binario %OUT_FILE% no fue generado.
    exit /b 1
)

echo [EXITO] Binario generado correctamente en: %OUT_FILE%
exit /b 0

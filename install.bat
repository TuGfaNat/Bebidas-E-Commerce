@echo off
title Burger 24/7 - Instalacion de Dependencias y Configuracion
echo ========================================================
echo   Burger 24/7 - Instalando Dependencias del Sistema
echo ========================================================
echo.

where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python no esta instalado o no se encuentra en el PATH.
    echo Por favor instale Python 3.10+ desde https://www.python.org/
    echo y marque la casilla "Add Python to PATH" durante la instalacion.
    echo.
    pause
    exit /b 1
)

python "%~dp0setup.py"

echo.
pause

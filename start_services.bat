@echo off
title Burger 24/7 - Sistema E-Commerce & Delivery
chcp 65001 >nul
cls
echo ========================================================
echo    BURGER 24/7 - SISTEMA E-COMMERCE ^& DELIVERY
echo ========================================================
echo Verificando instalacion de Python...

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python no esta instalado o no se agrego al PATH.
    echo.
    echo Pasos para solucionarlo:
    echo 1. Descarga Python desde https://www.python.org/downloads/
    echo 2. Durante la instalacion, MARCA la casilla: "Add python.exe to PATH"
    echo 3. Vuelve a ejecutar este archivo una vez terminada la instalacion.
    echo ========================================================
    pause
    exit /b 1
)

echo [OK] Python detectado correctamente.
echo Abriendo aplicacion en el navegador web (http://localhost:8000)...
timeout /t 1 >nul
start http://localhost:8000
echo.
echo ========================================================
echo Servidor en ejecucion. Para detenerlo presiona Ctrl + C.
echo ========================================================
python "%~dp0server.py" 8000
pause

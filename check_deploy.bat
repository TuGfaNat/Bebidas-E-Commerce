@echo off
title Burger 24/7 - Verificacion de Despliegue XAMPP
echo ========================================================
echo   Burger 24/7 - Verificando Despliegue en XAMPP / Apache
echo ========================================================

REM Asegurar archivo .env antes del chequeo
if not exist "%~dp0.env" (
    if exist "%~dp0.env.example" (
        copy /y "%~dp0.env.example" "%~dp0.env" >nul 2>&1
    )
)

REM Intentar ejecutar con PHP CLI si existe
where php >nul 2>&1
if %ERRORLEVEL% equ 0 (
    php "%~dp0check_deploy.php"
    goto end
)

if exist "C:\xampp\php\php.exe" (
    "C:\xampp\php\php.exe" "%~dp0check_deploy.php"
    goto end
)

if exist "F:\xampp\php\php.exe" (
    "F:\xampp\php\php.exe" "%~dp0check_deploy.php"
    goto end
)

REM Fallback a script Python
python "%~dp0check_deploy.py"

:end
echo.
pause

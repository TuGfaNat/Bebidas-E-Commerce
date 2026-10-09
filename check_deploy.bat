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

REM Intentar ejecutar con PHP CLI si existe en el PATH
where php >nul 2>&1
if %ERRORLEVEL% equ 0 (
    php "%~dp0check_deploy.php"
    goto end
)

REM Buscar PHP en instalaciones comunes de XAMPP
if exist "D:\xampp\php\php.exe" (
    "D:\xampp\php\php.exe" "%~dp0check_deploy.php"
    goto end
)

if exist "C:\xampp\php\php.exe" (
    "C:\xampp\php\php.exe" "%~dp0check_deploy.php"
    goto end
)

if exist "E:\xampp\php\php.exe" (
    "E:\xampp\php\php.exe" "%~dp0check_deploy.php"
    goto end
)

if exist "F:\xampp\php\php.exe" (
    "F:\xampp\php\php.exe" "%~dp0check_deploy.php"
    goto end
)

echo [AVISO] PHP CLI no fue detectado en PATH ni en las rutas estandar de XAMPP.
echo Puedes ver el diagnostico visual directamente en tu navegador abriendo:
echo   http://localhost/Burger-E-Commerce/check_deploy.php
echo.

:end
echo.
pause

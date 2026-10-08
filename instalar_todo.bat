@echo off
setlocal EnableDelayedExpansion
title Burger 24/7 - Instalador Facil
color 0B

echo ====================================================================
echo             BURGER 24/7 - INSTALADOR AUTOMATICO
echo ====================================================================
echo  Configurando el sistema para que funcione en tu computadora...
echo ====================================================================
echo.

set "PROYECTO=%~dp0"
if "%PROYECTO:~-1%"=="\" set "PROYECTO=%PROYECTO:~0,-1%"

:: PASO 1: DETECTAR XAMPP
echo [1/5] Buscando XAMPP en tu equipo...
set "XAMPP="
if exist "D:\xampp\apache\bin\httpd.exe" set "XAMPP=D:\xampp"
if not defined XAMPP if exist "C:\xampp\apache\bin\httpd.exe" set "XAMPP=C:\xampp"
if not defined XAMPP if exist "E:\xampp\apache\bin\httpd.exe" set "XAMPP=E:\xampp"

if defined XAMPP (
    echo   - XAMPP detectado en: %XAMPP%
) else (
    echo   [AVISO] No se encontro XAMPP en C:\xampp ni D:\xampp.
    echo   Por favor descarga XAMPP desde: https://www.apachefriends.org
    echo   Instalalo y luego vuelve a ejecutar este archivo.
)

:: PASO 2: CONFIGURAR ARCHIVO DE ENTORNO .ENV Y JWT
echo.
echo [2/6] Configurando archivo de entorno .env y seguridad JWT...
if not exist "%PROYECTO%\.env" (
    if exist "%PROYECTO%\.env.example" (
        copy /y "%PROYECTO%\.env.example" "%PROYECTO%\.env" >nul 2>&1
        echo   - Archivo .env generado automaticamente desde .env.example
    ) else (
        echo DB_HOST=127.0.0.1> "%PROYECTO%\.env"
        echo DB_PORT=3306>> "%PROYECTO%\.env"
        echo DB_NAME=burger_shop>> "%PROYECTO%\.env"
        echo DB_USER=root>> "%PROYECTO%\.env"
        echo DB_PASS=>> "%PROYECTO%\.env"
        echo DB_CHARSET=utf8mb4>> "%PROYECTO%\.env"
        echo JWT_SECRET=08aef182c3aad21602385a97c86a1cdb11811217df149b666ab353a1e708c2e0>> "%PROYECTO%\.env"
        echo ALLOWED_ORIGINS=http://localhost,http://127.0.0.1,http://localhost:80,http://localhost:8000,http://127.0.0.1:8000,http://localhost:3000>> "%PROYECTO%\.env"
        echo   - Archivo .env creado con configuracion lista.
    )
) else (
    echo   - Archivo .env verificado y listo.
)

:: PASO 3: CREAR CARPETAS NECESARIAS
echo.
echo [3/6] Creando carpetas de almacenamiento...
if not exist "%PROYECTO%\uploads" mkdir "%PROYECTO%\uploads"
if not exist "%PROYECTO%\uploads\ci" mkdir "%PROYECTO%\uploads\ci"
if not exist "%PROYECTO%\uploads\docs" mkdir "%PROYECTO%\uploads\docs"
if not exist "%PROYECTO%\uploads\qr" mkdir "%PROYECTO%\uploads\qr"
if not exist "%PROYECTO%\microservices\Auth\uploads\ci" mkdir "%PROYECTO%\microservices\Auth\uploads\ci"
if not exist "%PROYECTO%\microservices\Auth\uploads\docs" mkdir "%PROYECTO%\microservices\Auth\uploads\docs"
if not exist "%PROYECTO%\microservices\Auth\uploads\qr" mkdir "%PROYECTO%\microservices\Auth\uploads\qr"
echo   - Carpetas de documentos y comprobantes listas.

:: PASO 4: MOTOR CRITICO C++
echo.
echo [4/6] Verificando Motor Critico en C++...
if exist "%PROYECTO%\cpp\motor_core.exe" (
    echo   - Motor C++ verificado y listo: cpp\motor_core.exe
) else (
    echo   - Compilando motor C++...
    if exist "%PROYECTO%\cpp\build.bat" call "%PROYECTO%\cpp\build.bat"
)

:: PASO 5: VINCULAR CON EL SERVIDOR WEB (HTDOCS)
echo.
echo [5/6] Conectando la pagina con el servidor web Apache...
if defined XAMPP (
    if not exist "%XAMPP%\htdocs\Bebidas-E-Commerce" (
        mklink /J "%XAMPP%\htdocs\Bebidas-E-Commerce" "%PROYECTO%" >nul 2>&1
    )
    if not exist "%XAMPP%\htdocs\Burger-E-Commerce" (
        mklink /J "%XAMPP%\htdocs\Burger-E-Commerce" "%PROYECTO%" >nul 2>&1
    )
    echo   - Pagina web vinculada con exito en Apache.
) else (
    echo   - Omitido: XAMPP no detectado.
)

:: PASO 6: CONFIGURAR BASE DE DATOS MYSQL
echo.
echo [6/6] Configurando la Base de Datos burger_shop en MySQL...
if defined XAMPP if exist "%XAMPP%\mysql\bin\mysql.exe" (
    "%XAMPP%\mysql\bin\mysql.exe" -u root -e "CREATE DATABASE IF NOT EXISTS burger_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" >nul 2>&1
    if errorlevel 1 (
        echo   [AVISO] MySQL aun no esta encendido.
        echo   Recuerda abrir el Panel de XAMPP y presionar 'Start' en MySQL.
    ) else (
        if exist "%PROYECTO%\install_db.sql" (
            "%XAMPP%\mysql\bin\mysql.exe" --default-character-set=utf8mb4 -u root burger_shop < "%PROYECTO%\install_db.sql" >nul 2>&1
        )
        if exist "%PROYECTO%\microservices\Catalog\clean_data_charset.php" (
            if exist "%XAMPP%\php\php.exe" (
                "%XAMPP%\php\php.exe" "%PROYECTO%\microservices\Catalog\clean_data_charset.php" >nul 2>&1
            )
        )
        echo   - Base de datos burger_shop lista con usuarios y catalogo.
    )
)

echo.
echo ====================================================================
echo                     INSTALACION TERMINADA
echo ====================================================================
echo  Para entrar a la tienda y jugar con los pedidos:
echo  1. En el panel de XAMPP dale clic a START en Apache y MySQL.
echo  2. Haz doble clic en el archivo: iniciar_sistema.bat
echo ====================================================================
echo.
pause

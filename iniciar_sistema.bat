@echo off
title Burger 24/7 - Iniciador del Sistema
color 0A

echo ====================================================================
echo        BURGER 24/7 - INICIADOR DEL SISTEMA E-COMMERCE
echo ====================================================================
echo.

:: Detectar XAMPP
set "XAMPP="
if exist "D:\xampp\apache\bin\httpd.exe" set "XAMPP=D:\xampp"
if not defined XAMPP if exist "C:\xampp\apache\bin\httpd.exe" set "XAMPP=C:\xampp"
if not defined XAMPP if exist "E:\xampp\apache\bin\httpd.exe" set "XAMPP=E:\xampp"

:: Comprobar Apache (Puerto 80)
netstat -ano | findstr ":80 " >nul 2>&1
if errorlevel 1 (
    echo [AVISO] Apache parece no estar corriendo en el puerto 80.
    if defined XAMPP if exist "%XAMPP%\apache_start.bat" (
        echo Intentando arrancar Apache en segundo plano...
        start "" /B "%XAMPP%\apache\bin\httpd.exe" >nul 2>&1
    )
) else (
    echo [OK] Servidor Web Apache activo en el puerto 80.
)

:: Comprobar MySQL (Puerto 3306)
netstat -ano | findstr ":3306 " >nul 2>&1
if errorlevel 1 (
    echo [AVISO] MySQL parece no estar corriendo en el puerto 3306.
    if defined XAMPP if exist "%XAMPP%\mysql_start.bat" (
        echo Intentando arrancar MySQL en segundo plano...
        start "" /B "%XAMPP%\mysql\bin\mysqld.exe" --defaults-file="%XAMPP%\mysql\bin\my.ini" --standalone >nul 2>&1
    )
) else (
    echo [OK] Base de datos MySQL activa en el puerto 3306.
)

echo.
echo Abriendo Burger 24/7 en tu navegador web predeterminado...
timeout /t 1 >nul
start http://localhost/Bebidas-E-Commerce/

echo.
echo ====================================================================
echo   LISTO! LA PAGINA WEB YA ESTA ABIERTA EN TU NAVEGADOR
echo ====================================================================
echo   Direccion Web: http://localhost/Bebidas-E-Commerce/
echo --------------------------------------------------------------------
echo   CUENTAS DE PRUEBA (Haz clic en 'Cuentas Demo' en la pagina):
echo.
echo    1. Carlos Perez (Cliente que pide comida)
echo       Email: carlos@mail.com       Clave: carlos
echo.
echo    2. Pedro Gomez (Repartidor con moto y GPS)
echo       Email: pedro@mail.com        Clave: pedro
echo.
echo    3. Admin Central (Dueno del restaurante)
echo       Email: admin@mail.com        Clave: admin
echo --------------------------------------------------------------------
echo   QUE PUEDES PROBAR:
echo   * Como Cliente: Elige hamburguesas, pon tu direccion en el mapa y pide.
echo   * Como Rider:   Acepta la entrega, ve la ruta en el mapa y entrega.
echo   * Como Admin:   Mira la flota en vivo y revisa las ganancias.
echo ====================================================================
echo   Cuando termines de usar el sistema, puedes cerrar esta ventana.
echo ====================================================================
echo.
pause

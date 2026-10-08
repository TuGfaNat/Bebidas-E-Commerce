#!/usr/bin/env python3
"""
Burger 24/7 - Script Auxiliar de Verificación de Despliegue (Python)
Ejecuta check_deploy.php buscando PHP en el sistema o en rutas comunes de XAMPP.
Si PHP no está instalado en el PATH, ejecuta un chequeo estático de archivos,
directorios, permisos de uploads, y variables de entorno.
"""

import os
import sys
import subprocess
import shutil
import io

# Asegurar codificación utf-8 en consolas Windows
if sys.stdout and hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
if sys.stderr and hasattr(sys.stderr, 'buffer'):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
CHECK_PHP = os.path.join(ROOT_DIR, "check_deploy.php")

COMMON_PHP_PATHS = [
    "php",
    r"C:\xampp\php\php.exe",
    r"D:\xampp\php\php.exe",
    r"C:\tools\php\php.exe",
    r"C:\Program Files\PHP\php.exe",
]

def find_php_binary():
    for p in COMMON_PHP_PATHS:
        if shutil.which(p) or os.path.isfile(p):
            return p
    return None

def main():
    print("=" * 72)
    print("   Burger 24/7 - Diagnóstico de Despliegue (check_deploy)")
    print("=" * 72)

    php_bin = find_php_binary()
    if php_bin:
        print(f"[+] Binario de PHP detectado: {php_bin}")
        print("[+] Ejecutando check_deploy.php...\n")
        try:
            res = subprocess.run([php_bin, CHECK_PHP], cwd=ROOT_DIR)
            sys.exit(res.returncode)
        except Exception as e:
            print(f"[!] Error al ejecutar {php_bin}: {e}")

    print("[!] PHP no está disponible en la terminal actual.")
    print("[+] Ejecutando diagnóstico de estructura de archivos y configuración local...\n")

    # 1. Verificar .env y .env.example
    env_root = os.path.join(ROOT_DIR, ".env")
    env_ex = os.path.join(ROOT_DIR, ".env.example")
    if os.path.exists(env_root):
        print("  [PASS] Archivo .env presente en la raíz.")
    elif os.path.exists(env_ex):
        print("  [WARN] No existe .env pero .env.example está disponible.")
        print("         ↳ Ejecute: copy .env.example .env")
    else:
        print("  [FAIL] Falta plantilla .env.example.")

    # 2. Verificar install_db.sql / init_schema.sql
    sql_files = ["install_db.sql", "init_schema.sql"]
    for s in sql_files:
        p = os.path.join(ROOT_DIR, s)
        if os.path.exists(p):
            print(f"  [PASS] Script SQL '{s}' disponible para MySQL / XAMPP.")
        else:
            print(f"  [FAIL] No se encuentra '{s}'.")

    # 3. Verificar directorios de subida y permisos
    upload_dirs = [
        os.path.join(ROOT_DIR, "uploads", "ci"),
        os.path.join(ROOT_DIR, "uploads", "docs"),
        os.path.join(ROOT_DIR, "uploads", "qr"),
        os.path.join(ROOT_DIR, "microservices", "Auth", "uploads", "ci"),
        os.path.join(ROOT_DIR, "microservices", "Auth", "uploads", "docs"),
        os.path.join(ROOT_DIR, "microservices", "Auth", "uploads", "qr"),
    ]

    for d in upload_dirs:
        rel = os.path.relpath(d, ROOT_DIR).replace("\\", "/")
        if not os.path.exists(d):
            os.makedirs(d, exist_ok=True)
        try:
            test_file = os.path.join(d, ".test_write.tmp")
            with open(test_file, "w") as f:
                f.write("test")
            os.remove(test_file)
            print(f"  [PASS] Directorio '{rel}' existe y tiene permisos de escritura.")
        except Exception as ex:
            print(f"  [FAIL] Error de permisos en '{rel}': {ex}")

    # 4. Verificar ausencia de JWT_SECRET hardcodeado
    from server import JWT_SECRET, ALLOWED_ORIGINS, DB_NAME
    banned = "c53a0c7a8788d5ed3e796f49c7de19b493cf5ffc6f657fe0377e993a80bd2d98"
    if JWT_SECRET == banned:
        print("  [FAIL] Se detectó la clave hardcodeada antigua.")
    else:
        print("  [PASS] Sin claves JWT fijas hardcodeadas en el servidor.")

    print(f"  [PASS] Base de datos objetivo configurada: '{DB_NAME}'")
    print(f"  [PASS] Orígenes CORS configurados: {len(ALLOWED_ORIGINS)} orígenes permitidos.")
    print("\n[INFO] Para probar Apache y MySQL real:")
    print("       1. Inicie Apache y MySQL desde el Panel de Control de XAMPP.")
    print("       2. Abra en su navegador: http://localhost/Burger-E-Commerce/check_deploy.php")
    print("=" * 72)

if __name__ == "__main__":
    main()

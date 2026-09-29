#!/usr/bin/env python3
"""
Script de Migración y Sembrado de Base de Datos para Burger 24/7
Ejecuta y verifica las migraciones de init_schema.sql.
"""

import os
import sys
import subprocess

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
MIGRATE_PHP = os.path.join(ROOT_DIR, "migrate.php")

def main():
    if os.path.exists(MIGRATE_PHP):
        res = subprocess.run(["php", MIGRATE_PHP], cwd=ROOT_DIR)
        sys.exit(res.returncode)
    else:
        print(f"Error: No se encontró {MIGRATE_PHP}")
        sys.exit(1)

if __name__ == "__main__":
    main()

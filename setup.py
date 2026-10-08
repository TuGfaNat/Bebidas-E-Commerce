#!/usr/bin/env python3
"""
Instalador y Asistente de Configuración Inicial para Burger 24/7
Prepara automáticamente el entorno:
1. Instala dependencias de requirements.txt vía pip
2. Crea archivos .env a partir de las plantillas .env.example
3. Crea directorios de almacenamiento uploads/ y aplica reglas .htaccess protectoras
4. Verifica el estado del entorno y ofrece instrucciones de inicio
"""

import os
import sys
import shutil
import subprocess

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

HTACCESS_CONTENT = """<FilesMatch "\\.(php|phtml|php3|php4|php5|php7|phps|pl|py|cgi|sh|exe|bat|cmd)$">
    Require all denied
</FilesMatch>
Options -Indexes
"""

def print_header():
    print("=" * 72)
    print("    Burger 24/7 - Instalador y Asistente de Configuración Inicial")
    print("=" * 72)

def install_python_dependencies():
    req_file = os.path.join(ROOT_DIR, "requirements.txt")
    if not os.path.exists(req_file):
        print("[-] requirements.txt no encontrado. Saltando instalación de paquetes.")
        return False
    
    print("\n[1/4] Instalando paquetes de Python (requirements.txt)...")
    try:
        cmd = [sys.executable, "-m", "pip", "install", "-r", req_file]
        res = subprocess.run(cmd, cwd=ROOT_DIR, check=True)
        print("  [OK] Dependencias de Python instaladas correctamente.")
        return True
    except subprocess.CalledProcessError as e:
        print(f"  [!] Advertencia: pip terminó con código {e.returncode}. Verifique su conexión.")
        return False
    except Exception as e:
        print(f"  [!] Error al ejecutar pip: {e}")
        return False

def configure_environment_files():
    print("\n[2/4] Verificando archivos de configuración (.env)...")
    env_pairs = [
        (os.path.join(ROOT_DIR, ".env.example"), os.path.join(ROOT_DIR, ".env")),
        (os.path.join(ROOT_DIR, "microservices", "Auth", ".env.example"), os.path.join(ROOT_DIR, "microservices", "Auth", ".env")),
        (os.path.join(ROOT_DIR, "microservices", "Catalog", ".env.example"), os.path.join(ROOT_DIR, "microservices", "Catalog", ".env"))
    ]
    
    for src, dst in env_pairs:
        rel_dst = os.path.relpath(dst, ROOT_DIR)
        if not os.path.exists(dst):
            if os.path.exists(src):
                shutil.copyfile(src, dst)
                print(f"  [+] Creado {rel_dst} a partir de plantilla.")
            else:
                print(f"  [!] Plantilla no encontrada para {rel_dst}.")
        else:
            print(f"  [OK] {rel_dst} ya existe.")

def configure_upload_directories():
    print("\n[3/4] Configurando carpetas de almacenamiento y seguridad (uploads/)...")
    upload_dirs = [
        os.path.join(ROOT_DIR, "uploads", "ci"),
        os.path.join(ROOT_DIR, "uploads", "docs"),
        os.path.join(ROOT_DIR, "uploads", "qr"),
        os.path.join(ROOT_DIR, "microservices", "Auth", "uploads", "ci"),
        os.path.join(ROOT_DIR, "microservices", "Auth", "uploads", "docs"),
        os.path.join(ROOT_DIR, "microservices", "Auth", "uploads", "qr"),
    ]
    
    for folder in upload_dirs:
        os.makedirs(folder, exist_ok=True)
        rel_path = os.path.relpath(folder, ROOT_DIR)
        
        # Archivo protector .htaccess
        htaccess_file = os.path.join(folder, ".htaccess")
        if not os.path.exists(htaccess_file):
            try:
                with open(htaccess_file, "w", encoding="utf-8") as f:
                    f.write(HTACCESS_CONTENT)
                print(f"  [+] Creado directorio y regla .htaccess anti-RCE en: {rel_path}")
            except Exception as e:
                print(f"  [!] No se pudo crear .htaccess en {rel_path}: {e}")
        else:
            print(f"  [OK] Directorio protegido: {rel_path}")

def print_next_steps():
    print("\n[4/4] Verificando opciones de inicio...")
    print("=" * 72)
    print("  ¡INSTALACIÓN COMPLETADA CON ÉXITO!")
    print("=" * 72)
    print("\nPara iniciar el sistema tienes 2 opciones:")
    print("\n  Opción A: Modo Desarrollo Rápido con Python (Recomendado):")
    print("    1. Ejecuta: python server.py 8000  (o doble clic en start_services.bat)")
    print("    2. Abre en tu navegador: http://localhost:8000/")
    print("\n  Opción B: Modo Producción con Apache y MySQL Real (XAMPP):")
    print("    1. Inicia Apache y MySQL desde XAMPP Control Panel.")
    print("    2. Importa la base de datos: mysql -u root < install_db.sql (o vía phpMyAdmin)")
    print("    3. Verifica con: check_deploy.bat (o visita http://localhost/Bebidas-E-Commerce/check_deploy.php)")
    print("    4. Abre en tu navegador: http://localhost/Bebidas-E-Commerce/")
    print("=" * 72)

def main():
    print_header()
    install_python_dependencies()
    configure_environment_files()
    configure_upload_directories()
    print_next_steps()

if __name__ == "__main__":
    main()

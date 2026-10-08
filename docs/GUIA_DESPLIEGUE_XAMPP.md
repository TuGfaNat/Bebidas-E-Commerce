# Guía de Despliegue en XAMPP (Apache + PHP 8.2 + MySQL 8 Real)
## Sistema E-commerce Burger 24/7

Esta guía detalla el procedimiento paso a paso para desplegar la plataforma **Burger 24/7** en un entorno de servidor web **XAMPP (Windows)**, donde **Apache** sirve directamente el frontend y ejecuta los microservicios **PHP** contra una base de datos **MySQL real (`burger_shop`)**, prescindiendo completamente de la emulación en memoria de `server.py` (el cual queda reservado exclusivamente para desarrollo local o demostraciones portátiles).

---

## 1. Requisitos Previos del Sistema

| Componente | Versión Mínima | Rol en el Despliegue |
|---|---|---|
| **Sistema Operativo** | Windows 10 / 11 / Windows Server | Entorno anfitrión |
| **XAMPP** | 8.2.x o superior | Stack integrado Apache + PHP + MariaDB/MySQL |
| **PHP** | 8.2+ con extensiones PDO | Ejecución de microservicios REST |
| **MySQL / MariaDB** | MySQL 8.0+ / MariaDB 10.4+ | Motor relacional con almacenamiento InnoDB y UTF8mb4 |
| **Navegador Web** | Chrome, Edge, Firefox, Brave | Acceso al cliente HTML5/CSS3/JS |

### Extensiones PHP Obligatorias (Verificar en `php.ini`):
- `extension=pdo_mysql` (Conexión PDO a MySQL)
- `extension=openssl` (Firma HMAC-SHA256 de tokens JWT)
- `extension=mbstring` (Soporte seguro UTF-8 multibyte)
- `extension=fileinfo` (Validación de tipo MIME real de documentos C.I. y comprobantes)
- `extension=curl` (Comunicaciones HTTP salientes si aplica)

---

## 2. Paso a Paso: Instalación y Configuración

### Paso 1: Ubicación del Proyecto en Apache
Copie o clone la carpeta del repositorio dentro del directorio de documentos públicos de Apache (`htdocs`):
```text
C:\xampp\htdocs\Bebidas-E-Commerce\
```
La estructura visible debe ser:
```text
C:\xampp\htdocs\Bebidas-E-Commerce\
├── index.html
├── style.css
├── app.js
├── api.js
├── check_deploy.php
├── install_db.sql
├── microservices/
│   ├── Auth/
│   ├── Catalog/
│   ├── Rider/
│   ├── Transactions/
│   └── Logistics/
└── uploads/
```

---

### Paso 2: Creación de la Base de Datos `burger_shop` (Idempotente)

El script SQL [`install_db.sql`](file:///F:/Bebidas-E-Commerce/install_db.sql) (y [`init_schema.sql`](file:///F:/Bebidas-E-Commerce/init_schema.sql)) es **100% idempotente**: utiliza `CREATE DATABASE IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS` y `ON DUPLICATE KEY UPDATE` para las semillas.

Puede importarlo mediante cualquiera de los siguientes métodos:

#### Opción 2.1: Mediante phpMyAdmin (Recomendado)
1. Inicie **Apache** y **MySQL** desde el Panel de Control de XAMPP.
2. Abra en su navegador: `http://localhost/phpmyadmin/`.
3. Vaya a la pestaña **Importar** (o **SQL**).
4. Seleccione el archivo `install_db.sql` y haga clic en **Continuar** / **Ejecutar**.
5. Se creará automáticamente la base de datos `burger_shop` con sus 6 tablas normalizadas y usuarios demo cargados con contraseñas seguras cifradas con Bcrypt.

#### Opción 2.2: Mediante MySQL CLI
Abra la consola de comandos de Windows (cmd o PowerShell):
```powershell
C:\xampp\mysql\bin\mysql.exe -u root -p < C:\xampp\htdocs\Bebidas-E-Commerce\install_db.sql
```

#### Opción 2.3: Mediante el Asistente PHP
```powershell
cd C:\xampp\htdocs\Bebidas-E-Commerce
php migrate.php
```

---

### Paso 3: Configuración de Variables de Entorno (`.env`)

Cree el archivo `.env` en la raíz del proyecto (`C:\xampp\htdocs\Bebidas-E-Commerce\.env`):

```powershell
cd C:\xampp\htdocs\Bebidas-E-Commerce
copy .env.example .env
```

Abra el archivo `.env` y configure sus valores de producción:
```ini
# Base de Datos MySQL (XAMPP)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=burger_shop
DB_USER=root
DB_PASS=
DB_CHARSET=utf8mb4

# Clave Secreta para Firma Criptográfica de Tokens JWT (Mínimo 32 caracteres)
# Genere una clave segura única; NO utilice valores por defecto
JWT_SECRET=4f8b9e2c6a1d7f3e8b0a5c4d2e1f9a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f

# Orígenes Permitidos por CORS (Separados por comas)
ALLOWED_ORIGINS=http://localhost,http://127.0.0.1,http://localhost:80
```

> [!IMPORTANT]
> El repositorio **no contiene ninguna clave JWT hardcodeada por defecto**. Cada instalación debe definir su propio `JWT_SECRET` en el archivo `.env` para garantizar la seguridad criptográfica de las sesiones.

---

### Paso 4: Permisos y Seguridad en Directorios de Carga (`uploads/`)

La plataforma almacena archivos multimedia subidos por usuarios y repartidores:
- `uploads/ci/` y `microservices/Auth/uploads/ci/`: Fotografías de Carnet de Identidad.
- `uploads/docs/` y `microservices/Auth/uploads/docs/`: Licencias de conducir, seguros y CVs.
- `uploads/qr/` y `microservices/Auth/uploads/qr/`: Comprobantes de pago QR.

#### Seguridad de Uploads:
Cada carpeta de subida incluye un archivo `.htaccess` protector que bloquea la ejecución directa de scripts (`.php`, `.phtml`, `.exe`, etc.), previniendo ataques de tipo *Web Shell* o *RCE*:
```apache
<FilesMatch "\.(php|phtml|php3|php4|php5|php7|phps|pl|py|cgi|sh|exe|bat|cmd)$">
    Require all denied
</FilesMatch>
Options -Indexes
```

---

### Paso 5: Verificación Automatizada con `check_deploy`

Para certificar que todo el stack está correctamente configurado antes de iniciar operaciones:

#### Modo Consola:
```powershell
# Usando PHP:
php check_deploy.php

# O mediante el script por lotes:
check_deploy.bat
```

#### Modo Navegador Web (Dashboard Visual):
Abra en su navegador:
👉 **[http://localhost/Bebidas-E-Commerce/check_deploy.php](http://localhost/Bebidas-E-Commerce/check_deploy.php)**

El script verificará:
1. Versión de PHP (>= 8.2) y presencia de extensiones `pdo_mysql`, `openssl`, `mbstring`, `fileinfo`.
2. Detección de `.env`, validación de `JWT_SECRET` y orígenes `ALLOWED_ORIGINS`.
3. Conectividad real a MySQL en `burger_shop` y presencia de las 6 tablas relacionales con sus datos iniciales.
4. Permisos de lectura/escritura en todas las carpetas `uploads/` y presencia de reglas `.htaccess`.
5. Emisión y validación de tokens JWT en PHP.

---

## 3. URLs Operativas en XAMPP

Una vez superado el checklist de verificación, acceda a los servicios:

| Módulo | URL en Apache XAMPP | Descripción |
|---|---|---|
| **Frontend Web** | `http://localhost/Bebidas-E-Commerce/` | Aplicación interactiva multi-actor sin intermediarios |
| **Health Check BD** | `http://localhost/Bebidas-E-Commerce/microservices/Auth/connection.php` | Diagnóstico de conexión en tiempo real |
| **Login REST** | `http://localhost/Bebidas-E-Commerce/microservices/Auth/login.php` | Autenticación real contra MySQL |
| **Catálogo REST** | `http://localhost/Bebidas-E-Commerce/microservices/Catalog/catalog.php` | Catálogo de hamburguesas y combos |
| **Checkout REST** | `http://localhost/Bebidas-E-Commerce/microservices/Transactions/checkout.php` | Transacciones y descuento de inventario |
| **Rider & Entregas**| `http://localhost/Bebidas-E-Commerce/microservices/Rider/assignment.php` | Asignación y despacho logístico |
| **Dashboard Deploy**| `http://localhost/Bebidas-E-Commerce/check_deploy.php` | Monitor visual de despliegue |

---

## 4. Cuentas de Acceso Preconfiguradas (Seed Data)

Las contraseñas se encuentran procesadas en MySQL con hash Bcrypt real:

| Rol | Correo Electrónico | Contraseña | Estado C.I. |
|---|---|---|---|
| **Administrador** | `admin@mail.com` | `admin` | Verificado (Acceso total) |
| **Repartidor (Rider)** | `pedro@mail.com` | `pedro` | Verificado & Aprobado |
| **Cliente** | `carlos@mail.com` | `carlos` | Verificado |
| **Cliente (Pendiente)** | `maria@mail.com` | `maria` | Pendiente de aprobación |
| **Rider (Pendiente)** | `juan@mail.com` | `juan` | Pendiente de aprobación |

---

## 5. Checklist de Aceptación (Ticket 29-BE-009)

- [x] **Apache sirve `index.html` sin `server.py`**: El frontend se adapta dinámicamente al host y ruta de Apache mediante `api.js` y `app.js`.
- [x] **`login.php` devuelve JWT desde `.env` contra MySQL**: Valida credenciales contra la tabla `users` y firma el token con `JWT_SECRET`.
- [x] **Scripts SQL idempotentes**: `install_db.sql` e `init_schema.sql` utilizan `CREATE ... IF NOT EXISTS` y `ON DUPLICATE KEY UPDATE`.
- [x] **`uploads/` con permisos y seguridad**: Carpetas creadas con permisos de escritura y reglas `.htaccess` que bloquean scripts ejecutables.
- [x] **CORS estricto desde `.env`**: `security.php` restringe las cabeceras `Access-Control-Allow-Origin` estrictamente a los dominios listados en `ALLOWED_ORIGINS`.
- [x] **Sin `JWT_SECRET` por defecto en el repositorio**: El servidor autónomo genera un secreto efímero si no existe `.env`, y en PHP se exige definirlo en `.env`.
- [x] **Base de Datos estándar**: Configurada por defecto para la base `burger_shop`.

---
*Documento verificado y validado para el entorno de producción XAMPP 8.2 en Windows.*

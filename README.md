# Burger 24/7 &mdash; Plataforma E-Commerce y Sistema Logístico en Tiempo Real

> **Sistema E-commerce de Comida Rápida y Despacho 24/7 con Arquitectura de Microservicios, Geolocalización en Tiempo Real y Monitoreo de Flota.**

---

## Contenido del Documento

- [1. Descripción General del Proyecto](#1-descripción-general-del-proyecto)
- [2. Arquitectura y Stack Tecnológico](#2-arquitectura-y-stack-tecnológico)
- [3. Estructura del Repositorio](#3-estructura-del-repositorio)
- [4. Requisitos Previos del Sistema](#4-requisitos-previos-del-sistema)
- [5. Guía de Instalación Paso a Paso (Desde `git clone`)](#5-guía-de-instalación-paso-a-paso-desde-git-clone)
  - [Paso 1: Clonar el Repositorio](#paso-1-clonar-el-repositorio)
  - [Paso 2: Configuración de Variables de Entorno (`.env`)](#paso-2-configuración-de-variables-de-entorno-env)
  - [Paso 3: Base de Datos y Migraciones](#paso-3-base-de-datos-y-migraciones)
  - [Paso 4: Puesta en Marcha del Servidor](#paso-4-puesta-en-marcha-del-servidor)
- [6. Credenciales de Acceso Preconfiguradas (Seed Data)](#6-credenciales-de-acceso-preconfiguradas-seed-data)
- [7. Compilación y Extracción de la Tesina / Monografía Técnica](#7-compilación-y-extracción-de-la-tesina--monografía-técnica)
  - [Capítulos Disponibles en la Documentación](#capítulos-disponibles-en-la-documentación)
  - [Compilación Automática a Markdown y HTML/PDF](#compilación-automática-a-markdown-y-htmlpdf)
  - [Cómo Exportar a PDF Profesional](#cómo-exportar-a-pdf-profesional)
  - [Cómo Exportar a Microsoft Word](#cómo-exportar-a-microsoft-word)
- [8. Catálogo de Microservicios y Estándar BMAD](#8-catálogo-de-microservicios-y-estándar-bmad)
- [9. Solución de Problemas Frecuentes (FAQ)](#9-solución-de-problemas-frecuentes-faq)

---

## 1. Descripción General del Proyecto

**Burger 24/7** es una solución integral de comercio electrónico diseñada para la venta, preparación, despacho y reparto de hamburguesas y complementos en horario continuo (24 horas, 7 días a la semana). La plataforma implementa un ecosistema **multi-actor** con tres paneles especializados:

1. **Panel de Cliente:** Exploración interactiva del catálogo por categorías, personalización de pedidos, selección de punto de entrega en mapa interactivo (GPS), pasarela de pago (QR bancario o Pago Contraentrega en efectivo) y seguimiento del estado del pedido en tiempo real.
2. **Panel de Repartidor (Rider):** Notificación de órdenes listas para despacho, cálculo de distancia geodésica y costo de envío mediante el algoritmo Haversine, trazado de rutas viales sobre mapas CartoDB y liquidación de efectivo en caja central.
3. **Panel de Administración (Super Usuario):** Gestión integral del inventario (CRUD de productos con control atómico de stock), monitoreo en vivo de la flota de repartidores con refresco automático cada 10 segundos, aprobación de expedientes de identidad (C.I.) y documentación de conductores, reportes financieros y ledger de auditoría inmutable.

---

## 2. Arquitectura y Stack Tecnológico

| Capa | Tecnología | Rol Principal |
|---|---|---|
| **Frontend UI / UX** | HTML5 Semántico + CSS3 Glassmorphism | Interfaz moderna, responsiva y ligera sin dependencias de frameworks pesados. |
| **Lógica Frontend** | Vanilla JavaScript (ES6+) | Gestión reactiva del estado, renderizado dinámico del DOM y cliente HTTP en [`api.js`](file:///D:/Bebidas-E-Commerce/api.js). |
| **Geolocalización** | Leaflet.js v1.9.4 | Mapas interactivos oscuros (CartoDB Dark Matter), selección de coordenadas y seguimiento. |
| **Iconos & Estilos** | Lucide Icons + Google Fonts (Inter) | Iconografía vectorial consistente y tipografía moderna. |
| **Criptografía** | Bcrypt & HMAC-SHA256 | Cifrado seguro de contraseñas (`password_hash`) y firma criptográfica de tokens JWT. |
| **Backend REST** | PHP 8.2+ (PDO) | Microservicios transaccionales con bloqueo pesimista `FOR UPDATE` e inyección PDO. |
| **Servidor / Motor Logístico** | Python 3.10+ | Servidor HTTP de desarrollo multi-hilo ([`server.py`](file:///D:/Bebidas-E-Commerce/server.py)) y cálculo Haversine. |
| **Persistencia** | MySQL 8.0+ / MariaDB 10.5+ | Base de datos relacional normalizada en 3FN con motor InnoDB y restricciones de integridad. |

---

## 3. Estructura del Repositorio

```
Bebidas-E-Commerce/
├── api.js                           # Capa centralizada de comunicación REST con soporte Bearer JWT
├── app.js                           # Lógica del cliente, manejo de eventos y renderizado de la UI
├── index.html                       # Aplicación SPA (Single Page Application) multi-panel
├── style.css                        # Estilos globales, diseño responsive y tema Glassmorphism
├── server.py                        # Servidor HTTP y orquestador de microservicios autónomo en Python
├── start_services.bat               # Lanzador directo de un solo clic para Windows
├── package.json                     # Metadatos del proyecto y scripts de utilidad (npm run ...)
├── init_schema.sql                  # Esquema DDL normalizado (6 tablas) + Datos Semilla (Seeders)
├── schema_full.sql                  # Esquema relacional exportable a dbdiagram.io
├── schema.dbml                      # Modelo conceptual en Database Markup Language (DBML)
├── migrate.php                      # Motor de migración asistida sobre base de datos MySQL
├── migrate.py                       # Wrapper de ejecución rápida para migraciones
├── view_db.py                       # Visor CLI interactivo de tablas y registros de base de datos
├── export_tesina.py                 # Compilador de la documentación técnica a Markdown y PDF
├── docs/                            # Capítulos técnicos completos de la tesina académica
│   ├── tesina_infrastructure.md     # Capítulo 1: Infraestructura, Arquitectura y Despliegue
│   ├── tesina_diagrams.md           # Capítulo 2: Diagramas del Sistema (C4, ER, Secuencia)
│   ├── tesina_security.md           # Capítulo 3: Arquitectura de Seguridad y Criptografía
│   ├── tesina_transactions.md       # Capítulo 4: Transacciones, Máquinas de Estado y Caja
│   ├── tesina_integration.md        # Capítulo 5: Manual de Integración y Catálogo de APIs
│   ├── tesina_frontend.md           # Capítulo 6: Interfaz de Usuario y Componentes UI
│   └── tesina_manual_conclusion.md  # Capítulo 7: Manual de Usuario, Pruebas y Conclusiones
└── microservices/                   # Microservicios modulares PHP
    ├── Auth/                        # Autenticación, JWT, registro de usuarios y control de sesiones
    │   ├── .env.example             # Plantilla de variables de entorno para Auth
    │   ├── connection.php           # Singleton de conexión y verificación de disponibilidad
    │   ├── jwt.php                  # Validador y generador de tokens HMAC-SHA256
    │   ├── login.php                # Endpoint de inicio de sesión con Bcrypt
    │   ├── register.php             # Registro de clientes con verificación de C.I.
    │   ├── session.php              # Restauración de sesión mediante token Bearer
    │   └── security.php             # Sanitización de entradas y encabezados de seguridad
    ├── Catalog/                     # Catálogo comercial e inventario
    │   ├── .env.example             # Plantilla de variables de entorno para Catalog
    │   ├── Database.php             # Capa de persistencia PDO transaccional
    │   └── catalog.php              # CRUD RESTful de productos con control de roles
    ├── Transactions/                # Procesamiento de pagos, checkout y métricas
    │   ├── checkout.php             # Transacción atómica de pedido con descuento de stock
    │   ├── cancel_order.php         # Cancelación segura y restitución de existencias
    │   ├── live_monitoring.php      # Monitoreo georreferenciado en vivo de pedidos y repartidores
    │   └── report.php               # Reportes de facturación, recaudación y estadísticas
    ├── Rider/                       # Gestión de despachos y repartidores
    │   ├── assignment.php           # Consulta y aceptación de órdenes pendientes
    │   ├── delivery.php             # Transición de estados (en camino / entregado)
    │   └── settle_cash.php          # Conciliación y liquidación de efectivo en caja central
    └── Logistics/                   # Algoritmos geoespaciales
        └── calculator.py            # Cálculo de distancia Haversine, flete y tiempo estimado (ETA)
```

---

## 4. Requisitos Previos del Sistema

Para ejecutar y desarrollar en la plataforma, asegúrate de contar con:

- **Sistema Operativo:** Windows 10/11, Linux (Ubuntu/Debian) o macOS.
- **Git:** Versión 2.30+ ([Descargar Git](https://git-scm.com/)).
- **Python:** Versión 3.10 o superior ([Descargar Python](https://www.python.org/)). *Asegúrate de marcar la casilla "Add Python to PATH" durante la instalación.*
- **PHP (Opcional si usa Apache/XAMPP):** Versión 8.2 o superior con extensiones `pdo_mysql`, `openssl`, `mbstring`.
- **MySQL / MariaDB (Opcional):** Versión 8.0+ o MariaDB 10.5+ (mediante XAMPP, Laragon o Docker).
- **Node.js (Opcional):** Versión 18+ para soporte opcional del comando `npm`.

---

## 5. Guía de Instalación Paso a Paso (Desde `git clone`)

### Paso 1: Clonar el Repositorio

Abre tu terminal de comandos (PowerShell, Git Bash o CMD) y ejecuta:

```bash
# 1. Clonar el repositorio desde GitHub
git clone https://github.com/TuGfaNat/Bebidas-E-Commerce.git

# 2. Ingresar a la carpeta del proyecto
cd Bebidas-E-Commerce
```

---

### Paso 2: Configuración de Variables de Entorno (`.env`)

El repositorio incluye plantillas de configuración (`.env.example`) protegidas para que no se filtren contraseñas al repositorio. Crea los archivos `.env` ejecutando:

#### En Windows (PowerShell):
```powershell
Copy-Item microservices\Auth\.env.example microservices\Auth\.env
Copy-Item microservices\Catalog\.env.example microservices\Catalog\.env
Copy-Item microservices\Auth\.env.example .env
```

#### En Linux / macOS:
```bash
cp microservices/Auth/.env.example microservices/Auth/.env
cp microservices/Catalog/.env.example microservices/Catalog/.env
cp microservices/Auth/.env.example .env
```

#### Parámetros Principales de Configuración:
Si abres cualquiera de los archivos `.env`, verás la configuración estándar:
```ini
# Base de Datos MySQL
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=bebidas_247
DB_USER=root
DB_PASS=
DB_CHARSET=utf8mb4

# Clave Secreta para Firmado Criptográfico de Tokens JWT
JWT_SECRET=c53a0c7a8788d5ed3e796f49c7de19b493cf5ffc6f657fe0377e993a80bd2d98

# Orígenes Permitidos por CORS
ALLOWED_ORIGINS=http://localhost:8000,http://127.0.0.1:8000,http://localhost:3000,http://localhost
```

---

### Paso 3: Base de Datos y Migraciones

La plataforma ofrece **dos modos de ejecución**:

#### Opción A: Modo Autónomo de Desarrollo (Recomendado & Más Rápido)
* No requiere instalar MySQL ni Apache.
* El servidor autónomo en Python ([`server.py`](file:///D:/Bebidas-E-Commerce/server.py)) incluye una **capa de persistencia en memoria y emulación completa de base de datos** precargada con todos los usuarios, productos y pedidos de prueba.
* Puedes pasar directamente al [Paso 4](#paso-4-puesta-en-marcha-del-servidor).

#### Opción B: Modo Producción con MySQL / MariaDB Real (XAMPP / Laragon / Docker)

> [!NOTE]
> **¿Es obligatorio instalar MariaDB/MySQL para usar la plataforma?**  
> **No.** Si solo quieres probar el sistema, hacer pedidos, probar los roles y ver los mapas interactivos, **puedes usar la Opción A (servidor autónomo Python)** que no requiere instalar nada más.  
> Sin embargo, si vas a **defender tu tesina ante un tribunal académico** o deseas ver y administrar las tablas físicamente en **phpMyAdmin**, sigue una de las siguientes guías de instalación:

---

#### 📌 Guía Paso a Paso: Cómo Instalar MariaDB / MySQL en Windows

##### Método 1: Mediante XAMPP (Recomendado & Más Fácil para la Universidad)
**XAMPP** es el paquete estándar que instala en un solo clic el servidor MariaDB/MySQL, el servidor web Apache y la herramienta visual **phpMyAdmin**:

1. **Descargar el Instalador:**
   * Entra a la web oficial: 👉 **[Descargar XAMPP para Windows](https://www.apachefriends.org/es/index.html)** (selecciona la versión con PHP 8.2 o superior).
   * *Opcional vía terminal Windows:* Puedes instalarlo automáticamente ejecutando en PowerShell:
     ```powershell
     winget install ApacheFriends.Xampp.8.2
     ```
2. **Instalación:**
   * Ejecuta el instalador descargado (`xampp-windows-x64-...-installer.exe`).
   * En la pantalla de componentes (*Select Components*), asegúrate de que estén marcados:
     * ✅ **Apache**
     * ✅ **MySQL**
     * ✅ **phpMyAdmin**
   * Deja la ruta de instalación por defecto: `C:\xampp`.
   * Haz clic en *Next* hasta finalizar la instalación.
3. **Iniciar los Servicios:**
   * Abre la aplicación **XAMPP Control Panel** desde el menú Inicio de Windows.
   * En la fila de **MySQL**, haz clic en el botón **Start** (el fondo se pondrá en verde y mostrará el puerto `3306`).
   * En la fila de **Apache**, haz clic en el botón **Start** (necesario para ver phpMyAdmin).
4. **Verificar phpMyAdmin:**
   * Abre tu navegador e ingresa a: **[http://localhost/phpmyadmin/](http://localhost/phpmyadmin/)**.
   * Verás la interfaz gráfica de administración de bases de datos.
5. **Ejecutar las Migraciones Automáticas:**
   * Con MySQL iniciado en XAMPP, abre tu terminal en la carpeta del proyecto y ejecuta:
     ```bash
     npm run migrate
     # o alternativamente:
     python migrate.py
     ```
   * El asistente creará automáticamente la base de datos `bebidas_247`, creará las 6 tablas relacionales normalizadas y cargará los datos iniciales de prueba (usuarios, hamburguesas, documentos de riders y logs de auditoría).
   * Actualiza phpMyAdmin y verás la base de datos `bebidas_247` lista para ser mostrada en tu exposición.

---

##### Método 2: Instalación de MariaDB Server Independiente (Oficial y Ligero)
Si prefieres instalar solo el motor de base de datos sin Apache:

1. **Descargar:**
   * Descarga el instalador MSI desde: 👉 **[MariaDB Server Downloads](https://mariadb.org/download/)**.
   * *Opcional vía terminal Windows:*
     ```powershell
     winget install MariaDB.Server
     ```
2. **Instalación:**
   * Ejecuta el archivo `.msi`.
   * En la pantalla de credenciales de `root`:
     * Puedes dejar la contraseña vacía (por defecto en el proyecto).
     * O si estableces una contraseña (ej: `admin123`), colócala en tu archivo `.env` en la variable `DB_PASS=admin123`.
   * Deja el puerto por defecto: `3306` y codificación `UTF-8`.
   * Finaliza la instalación. El servicio de Windows `MariaDB` se iniciará automáticamente.
3. **Ejecutar Migración:**
   ```bash
   python migrate.py
   ```

---

##### Método 3: Mediante Contenedores Docker (Para Desarrolladores)
Si tienes instalado **Docker Desktop**, puedes levantar MariaDB con un solo comando en tu terminal:

```bash
docker run -d --name burger-mariadb -p 3306:3306 -e MYSQL_DATABASE=bebidas_247 -e MYSQL_ALLOW_EMPTY_PASSWORD=yes mariadb:10.5
```
Luego ejecuta:
```bash
python migrate.py
```

---

#### 🚀 Inspección Rápida de Base de Datos por Consola (`python view_db.py`)

Para auditar, verificar o demostrar el estado de la base de datos relacional directamente desde la terminal (sin necesidad de abrir phpMyAdmin ni instalar herramientas pesadas), el proyecto cuenta con el script **`view_db.py`**:

```bash
python view_db.py
```

Esta herramienta imprime las tablas normalizadas con formato tabular ASCII legible:

1. **`users`:** Muestra los 7 usuarios del sistema clasificados por rol (`cliente`, `rider`, `super_usuario`) junto a su correo y estado de C.I. (`verified`, `pending`, `rejected`).
2. **`productos`:** Muestra el catálogo activo con categoría, nombre, precio en Bolivianos (Bs) y existencias de inventario (`stock`).
3. **`pedidos`:** Detalla cada orden con cliente remitente, repartidor asignado, método de pago (`contraentrega`, `pagado_qr`, `liquidado`), estado del pedido y total.
4. **`documentacion_rider`:** Muestra los expedientes de conductores (licencia, seguro, CV) y su dictamen de aprobación.
5. **`auditoria_logs`:** Registra las últimas transacciones en el Ledger inmutable con tabla afectada, acción (`INSERT`, `UPDATE`, `DELETE`), IP del emisor y marca de tiempo.

---

#### 📋 Consultas SQL Esenciales (Queries para Exposición y Reportes)

El archivo maestro [`init_schema.sql`](file:///D:/Bebidas-E-Commerce/init_schema.sql) contiene el DDL completo. A continuación se presentan las consultas analíticas y operativas más representativas:

##### 1. Listado de Pedidos con JOIN Relacional Completo
```sql
SELECT 
    p.id AS pedido_id,
    c.nombre AS cliente,
    IFNULL(r.nombre, 'Sin Asignar') AS repartidor,
    p.total,
    p.estado_pago,
    p.estado_pedido,
    p.created_at
FROM pedidos p
INNER JOIN users c ON p.cliente_id = c.id
LEFT JOIN users r ON p.rider_id = r.id
ORDER BY p.id DESC;
```

##### 2. Desglose de Artículos por Pedido (JOIN con Catálogo)
```sql
SELECT 
    pd.pedido_id,
    pr.nombre AS producto,
    pr.categoria,
    pd.cantidad,
    pd.precio_unitario,
    (pd.cantidad * pd.precio_unitario) AS subtotal
FROM pedido_detalles pd
INNER JOIN productos pr ON pd.producto_id = pr.id
WHERE pd.pedido_id = 1;
```

##### 3. Liquidación de Efectivo por Cobros Contraentrega para Riders
```sql
SELECT 
    r.id AS rider_id,
    r.nombre AS rider,
    COUNT(p.id) AS entregas_efectivo,
    SUM(p.total) AS total_por_liquidar_bs
FROM pedidos p
INNER JOIN users r ON p.rider_id = r.id
WHERE p.estado_pedido = 'entregado' 
  AND p.estado_pago = 'pagado_efectivo'
GROUP BY r.id, r.nombre;
```

##### 4. Transacción Atómica de Compra (Descuento Concurrente de Stock)
```sql
START TRANSACTION;
UPDATE productos SET stock = stock - 1 WHERE id = 1 AND stock >= 1;
INSERT INTO pedidos (cliente_id, estado_pago, estado_pedido, total, latitud, longitud) 
VALUES (1, 'contraentrega', 'pendiente', 30.08, -16.5090, -68.1340);
INSERT INTO pedido_detalles (pedido_id, producto_id, cantidad, precio_unitario) 
VALUES (LAST_INSERT_ID(), 1, 1, 22.00);
INSERT INTO auditoria_logs (tabla_afectada, registro_id, accion, datos_nuevos, created_by)
VALUES ('pedidos', LAST_INSERT_ID(), 'INSERT', '{"total": 30.08, "pago": "contraentrega"}', 1);
COMMIT;
```

---

### Paso 4: Puesta en Marcha del Servidor

Inicia el entorno de ejecución mediante cualquiera de los siguientes métodos:

#### Método 1: Mediante Python (Universal)
```bash
python server.py 8000
```

#### Método 2: Mediante el Lanzador de Windows
Haz doble clic sobre el archivo:
```
start_services.bat
```

#### Método 3: Mediante NPM
```bash
npm start
```

#### Verificación en el Navegador
Abre tu navegador web y visita:
👉 **[http://localhost:8000/](http://localhost:8000/)**

Verás la aplicación de Burger 24/7 funcionando con catálogo, carrito, mapas interactivos y autenticación conectada.

---

## 6. Credenciales de Acceso Preconfiguradas (Seed Data)

El sistema viene preconfigurado con **7 cuentas de prueba** para evaluar exhaustivamente cada uno de los roles y sus tres estados posibles (Habilitado, Pendiente y Rechazado):

| Rol de Usuario | Nombre Completo | Correo Electrónico | Contraseña | Estado C.I. / Expediente | Funcionalidades Habilitadas |
|---|---|---|---|---|---|
| **Super Usuario** | Admin Central | `admin@mail.com` | `admin` | ✅ Verificado | Control de catálogo (crear/editar hamburguesas), gestión de usuarios y filtros por estado, monitoreo en tiempo real, aprobación de C.I./expedientes y liquidación de caja física. |
| **Cliente** | Carlos Pérez | `carlos@mail.com` | `carlos` | ✅ Verificado | Catálogo desbloqueado con precios, carrito de compras, checkout con Contraentrega (efectivo) o QR Simple y rastreo GPS en vivo. |
| **Cliente (Pendiente)** | María López | `maria@mail.com` | `maria` | ⏳ Pendiente | Precios ocultos y compras deshabilitadas con aviso de *"C.I. pendiente de verificación"*. |
| **Cliente (Rechazado)** | Roberto Flores | `roberto@mail.com` | `roberto` | ❌ Rechazado | Catálogo bloqueado con aviso de *"C.I. rechazado por la administración"*. |
| **Rider (Repartidor)** | Pedro Gómez | `pedro@mail.com` | `pedro` | ✅ Aprobado | Recepción de pedidos en cola, botones Aceptar/Rechazar, cálculo de flete Haversine, navegación de ruta GPS, entrega/cobro y consulta de Historial de Despachos. |
| **Rider (Pendiente)** | Juan Rodríguez | `juan@mail.com` | `juan` | ⏳ Pendiente | Documentos subidos pero en revisión; no puede aceptar órdenes hasta aprobación. |
| **Rider (Rechazado)** | Marcos Vargas | `marcos@mail.com` | `marcos` | ❌ Rechazado | Cuenta bloqueada con aviso de expediente de conductor rechazado. |

> 💡 **Acceso Rápido en la Interfaz Web:**  
> En la esquina inferior izquierda de la pantalla encontrarás la cápsula plegable **`🔑 Cuentas Demo (Abrir ▴)`**. Al hacer clic sobre ella, puedes iniciar sesión instantáneamente con cualquiera de estas cuentas sin tener que escribir correo ni contraseña. Al hacer clic, se pliega automáticamente para no interrumpir tus operaciones.

---

## 7. Compilación y Extracción de la Tesina / Monografía Técnica

El repositorio incluye una **tesina técnica formal completa** redactada bajo estándares académicos de ingeniería de software, dividida en 7 capítulos ubicados en el directorio [`docs/`](file:///D:/Bebidas-E-Commerce/docs/):

### Capítulos Disponibles en la Documentación

1. **[`docs/tesina_infrastructure.md`](file:///D:/Bebidas-E-Commerce/docs/tesina_infrastructure.md):**
   * Justificación del stack tecnológico.
   * Arquitectura orientada a dominio (DDD) y microservicios.
   * Diccionario de datos exhaustivo de las 6 tablas MySQL en 3FN.
   * Guías de despliegue en servidores locales y en la nube.
2. **[`docs/tesina_diagrams.md`](file:///D:/Bebidas-E-Commerce/docs/tesina_diagrams.md):**
   * Diagramas de Contexto, Contenedor y Componentes bajo el Modelo C4.
   * Diagrama Entidad-Relación (DER) completo con restricciones referenciales.
   * Diagramas de secuencia UML para Checkout atómico y flujo de entrega de Riders.
   * Diagramas de máquina de estados para pedidos y caja.
3. **[`docs/tesina_security.md`](file:///D:/Bebidas-E-Commerce/docs/tesina_security.md):**
   * Autenticación con Bcrypt (costo 10) y firma digital HMAC-SHA256 para JWT.
   * Prevención de ataques OWASP Top 10 (SQL Injection, XSS, CSRF).
   * Modelo de control de accesos basado en roles (RBAC) y encabezados HTTP estrictos.
4. **[`docs/tesina_transactions.md`](file:///D:/Bebidas-E-Commerce/docs/tesina_transactions.md):**
   * Control de concurrencia y transacciones ACID con `FOR UPDATE`.
   * Máquina de estados de pedidos (`esperando_pago` $\rightarrow$ `en_camino` $\rightarrow$ `entregado` $\rightarrow$ `liquidado`).
   * Cancelaciones con restitución atómica de inventario.
   * Cuadre y conciliación de caja física para cobros en contraentrega.
5. **[`docs/tesina_integration.md`](file:///D:/Bebidas-E-Commerce/docs/tesina_integration.md):**
   * Catálogo completo de endpoints REST con especificación OpenAPI/Swagger conceptual.
   * Estándar de envolvente de respuesta BMAD (`status`, `data`, `audit`, `error_details`).
   * Guía de consumo desde la librería cliente [`api.js`](file:///D:/Bebidas-E-Commerce/api.js).
6. **[`docs/tesina_frontend.md`](file:///D:/Bebidas-E-Commerce/docs/tesina_frontend.md):**
   * Diseño de interfaz gráfica responsiva basada en Glassmorphism.
   * Integración de mapas geográficos con Leaflet.js y capas CartoDB.
   * Modos de operación (Modo Conectado API REST y Modo Simulado Offline con LocalStorage).
7. **[`docs/tesina_manual_conclusion.md`](file:///D:/Bebidas-E-Commerce/docs/tesina_manual_conclusion.md):**
   * Manual de usuario interactivo paso a paso para Clientes, Riders y Administradores.
   * Matriz de pruebas de validación funcional e integración.
   * Conclusiones académicas, métricas obtenidas y líneas de trabajo futuro.

---

### Compilación Automática a Markdown y HTML/PDF

Para compilar todos los capítulos en un único documento maestro unificado, ejecuta en tu terminal:

```bash
# Mediante el compilador en Python:
python export_tesina.py

# O mediante npm:
npm run export:tesina
```

Este proceso generará automáticamente en la raíz del proyecto:
* **`TESINA_COMPLETA.md`:** Documento maestro en formato Markdown con portada académica formal, índice general hipervinculado y los 7 capítulos unificados.
* **`TESINA_COMPLETA.html`:** Documento web interactivo con tipografía formal (Inter / JetBrains Mono), estilos para tablas, bloques de código, renderizado dinámico de diagramas Mermaid y reglas CSS `@media print` para exportación a PDF.

---

### Cómo Exportar a PDF Profesional

1. Abre el archivo generado **[`TESINA_COMPLETA.html`](file:///D:/Bebidas-E-Commerce/TESINA_COMPLETA.html)** en cualquier navegador web moderno (Google Chrome, Microsoft Edge, Mozilla Firefox o Brave).
2. Haz clic en el botón superior **"Exportar a PDF (Imprimir)"** o presiona la combinación de teclas:
   ```
   Ctrl + P  (en Windows / Linux)
   Cmd + P   (en macOS)
   ```
3. En el cuadro de diálogo de impresión, configura lo siguiente:
   * **Destino:** `Guardar como PDF` (Save as PDF).
   * **Páginas:** `Todas`.
   * **Diseño:** `Vertical`.
   * **Más opciones de configuración:**
     * **Tamaño de papel:** `Carta` (Letter) o `A4`.
     * **Márgenes:** `Predeterminado` o `Personalizado`.
     * **Gráficos de fondo (Background graphics):** ✅ **Marcar casilla** *(para que se visualicen los colores de código, tablas y alertas).*
4. Haz clic en **Guardar** y selecciona la carpeta de tu computadora donde almacenar tu tesina en formato PDF.

---

### Cómo Exportar a Microsoft Word

Si tu universidad o institución te solicita entregar la monografía en formato `.docx` editable:

1. **Opción con Pandoc (Recomendada):**
   Si tienes [Pandoc](https://pandoc.org/) instalado, ejecuta:
   ```bash
   pandoc TESINA_COMPLETA.md -o TESINA_COMPLETA.docx --toc
   ```
2. **Opción Directa desde el Navegador:**
   * Abre `TESINA_COMPLETA.html` en el navegador.
   * Selecciona todo el contenido (`Ctrl + A`) y cópialo (`Ctrl + C`).
   * Abre Microsoft Word o Google Docs y pega el contenido (`Ctrl + V`). Las tablas, encabezados y estilos se transferirán automáticamente.

---

## 8. Catálogo de Microservicios y Estándar BMAD

Todos los microservicios se comunican mediante peticiones HTTP asíncronas devolviendo respuestas bajo el estándar **BMAD (Bounded Microservice Architecture Delivery)**:

```json
{
  "status": "success",
  "data": {
    "pedido_id": 42,
    "total": 54.00,
    "estado": "en_camino"
  },
  "audit": {
    "user_id": "3",
    "timestamp": "2026-09-29T16:15:00.000Z",
    "action": "ORDER_DISPATCH"
  },
  "error_details": null
}
```

### Endpoints Principales:
* **Autenticación:**
  * `POST /microservices/Auth/login.php` &mdash; Inicio de sesión y expedición de JWT.
  * `POST /microservices/Auth/register.php` &mdash; Registro de clientes con subida de C.I.
  * `GET  /microservices/Auth/session.php` &mdash; Validación de sesión por token Bearer.
* **Catálogo & Menú:**
  * `GET    /microservices/Catalog/catalog.php` &mdash; Lista de hamburguesas, combos y bebidas.
  * `POST   /microservices/Catalog/catalog.php` &mdash; Crear nuevo producto (Solo Admin).
  * `PUT    /microservices/Catalog/catalog.php` &mdash; Modificar existencias o precios (Solo Admin).
  * `DELETE /microservices/Catalog/catalog.php` &mdash; Eliminar producto del catálogo (Solo Admin).
* **Transacciones & Facturación:**
  * `POST /microservices/Transactions/checkout.php` &mdash; Checkout atómico con verificación de stock.
  * `POST /microservices/Transactions/cancel_order.php` &mdash; Cancelación y reembolso de stock.
  * `GET  /microservices/Transactions/live_monitoring.php` &mdash; Posiciones GPS y estado de pedidos.
  * `GET  /microservices/Transactions/report.php` &mdash; Resumen de recaudación y métricas.
* **Operaciones de Reparto (Rider):**
  * `GET  /microservices/Rider/assignment.php` &mdash; Consulta de órdenes disponibles para entrega.
  * `POST /microservices/Rider/assignment.php` &mdash; Aceptación y toma de orden por un rider.
  * `POST /microservices/Rider/delivery.php` &mdash; Actualización a pedido entregado.
  * `POST /microservices/Rider/settle_cash.php` &mdash; Liquidación de efectivo en caja central.

---

## 9. Solución de Problemas Frecuentes (FAQ)

### 1. El puerto 8000 ya está en uso
Si al iniciar `python server.py 8000` recibes un error indicando que el puerto está ocupado, puedes especificar cualquier otro puerto en la misma orden:
```bash
python server.py 8080
# o bien
python server.py 3000
```
Luego accede a `http://localhost:8080/`.

### 2. Error al conectar con MySQL (`Detalle de red: 10060` o `Conexión rechazada`)
Este mensaje indica que no hay un servidor MySQL escuchando en el puerto 3306:
* Si deseas usar MySQL real, asegúrate de iniciar el servicio MySQL en **XAMPP / Laragon** o Docker.
* Si **no tienes MySQL instalado**, no te preocupes: ejecuta directamente `python server.py 8000`. El servidor incluye persistencia autónoma y simulación offline para que la aplicación funcione al 100% de inmediato.

### 3. Las imágenes de comprobantes o C.I. no cargan
Asegúrate de que existan los directorios de subida correspondientes dentro del proyecto:
* `microservices/Auth/uploads/ci/`
* `microservices/Auth/uploads/qr/`
* `microservices/Auth/uploads/riders/`

---

## Licencia y Créditos

* **Proyecto:** Sistema E-commerce y Plataforma de Reparto Burger 24/7.
* **Desarrollador / Autor:** TuGfaNat.
* **Licencia:** Distribuido bajo la Licencia ISC.

# 🍔 Burger 24/7 &mdash; Plataforma E-Commerce y Logística en Tiempo Real

[![PHP](https://img.shields.io/badge/PHP-8.2%2B-777BB4?style=flat&logo=php&logoColor=white)](https://www.php.net/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-4479A1?style=flat&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Apache](https://img.shields.io/badge/Apache-2.4%2B-D22128?style=flat&logo=apache&logoColor=white)](https://httpd.apache.org/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?style=flat&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![Estado](https://img.shields.io/badge/Estado-100%25%20Operativo-brightgreen?style=flat)]()
[![Licencia](https://img.shields.io/badge/Licencia-ISC-blue?style=flat)]()

> **Sistema integral de comercio electrónico de comida rápida y despacho continuo (24 horas, 7 días a la semana) con arquitectura de microservicios, geolocalización GPS en vivo y monitoreo de flota en tiempo real.**

---

## 📑 Tabla de Contenido Rápido

1. [¿Qué es Burger 24/7?](#-1-qué-es-burger-247)
2. [📦 Instalación de Dependencias y Preparación (`requirements.txt`)](#-2-instalación-de-dependencias-y-preparación-requirementstxt)
3. [⚡ Puesta en Marcha: ¿Cómo Levantar el Proyecto?](#-3-puesta-en-marcha-cómo-levantar-el-proyecto)
   - [Opción 1: Desarrollo Ultrarrápido (Recomendado para pruebas en 10 segundos)](#opción-1-modo-desarrollo-ultrarrápido-con-python-sin-instalar-mysql-ni-apache)
   - [Opción 2: Modo Producción con XAMPP (Apache + PHP 8.2 + MySQL Real para Tesina)](#opción-2-modo-producción--tesina-con-xampp-apache--php-82--mysql-8-real)
4. [🔑 Cuentas de Acceso Preconfiguradas (Credenciales Demo)](#-4-cuentas-de-acceso-preconfiguradas-credenciales-demo)
5. [🧭 URLs Principales del Sistema](#-5-urls-principales-del-sistema)
6. [🔍 Diagnóstico Automatizado del Sistema (`check_deploy`)](#-6-diagnóstico-automatizado-del-sistema-check_deploy)
7. [📚 Tesina Académica y Documentación Formal](#-7-tesina-académica-y-documentación-formal)
   - [Capítulos Disponibles](#capítulos-disponibles-en-docs)
   - [Compilación a Documento Maestro y Exportación a PDF](#compilación-a-documento-maestro-y-exportación-a-pdf)
8. [🏗️ Arquitectura de Microservicios y Estándar BMAD](#-8-arquitectura-de-microservicios-y-estándar-bmad)
9. [📂 Estructura del Repositorio](#-9-estructura-del-repositorio)
10. [❓ Solución de Problemas Frecuentes (FAQ)](#-10-solución-de-problemas-frecuentes-faq)

---

## 📌 1. ¿Qué es Burger 24/7?

**Burger 24/7** es una plataforma tecnológica concebida para digitalizar y automatizar el ciclo de venta, cobro, preparación y despacho de alimentos a domicilio en horario ininterrumpido. El sistema implementa un entorno **multi-actor** con tres paneles especializados:

* 👤 **Panel de Cliente:** Catálogo dinámico organizado por categorías (Hamburguesas, Combos, Bebidas, Acompañamientos), carrito de compras reactivo, selección visual del punto de entrega en un mapa interactivo (GPS), pasarela de pago (pago móvil QR o pago contraentrega en efectivo) y seguimiento del pedido en tiempo real.
* 🛵 **Panel de Repartidor (Rider):** Notificación de órdenes pendientes de despacho, cálculo automático de distancias y costo de flete mediante el **algoritmo geodésico Haversine**, trazado de rutas viales sobre mapas oscuros y módulo de liquidación de caja en efectivo.
* 👑 **Panel de Administrador (Super Usuario):** Gestión integral del menú e inventario (CRUD de productos con control atómico de existencias), monitoreo geográfico en vivo de la flota de repartidores con refresco automático cada 10 segundos, aprobación de expedientes de identidad (C.I.) y conductores, reportes financieros y ledger de auditoría inmutable.

---

## 📦 2. Instalación de Dependencias y Preparación (`requirements.txt`)

Para instalar automáticamente todas las librerías necesarias y dejar las carpetas configuradas, dispones de tres formas muy sencillas:

### Método A: En Windows con 1 Solo Clic (Recomendado)
Haz doble clic sobre el archivo:
📁 **`install.bat`**

### Método B: Mediante el Asistente Python (Multiplataforma)
Abre tu consola en la carpeta del proyecto y ejecuta:
```powershell
python setup.py
```

### Método C: Vía PIP Directo
Si prefieres instalar únicamente las dependencias de Python:
```powershell
pip install -r requirements.txt
```

### ¿Qué hace el instalador automáticamente?
1. **Instala paquetes de Python ([`requirements.txt`](requirements.txt)):**
   * `python-docx`: Generación y exportación de la tesina y monografía académica en formato Microsoft Word (`.docx`).
   * `python-dotenv`: Lectura y gestión segura de variables de entorno del archivo `.env`.
   * `requests`: Cliente HTTP para pruebas de integración con los microservicios.
   * `bcrypt`: Cifrado y validación de contraseñas seguras.
2. **Inicializa archivos de entorno `.env`:** Si no existen, copia automáticamente las plantillas `.env.example` tanto en la raíz como en los microservicios.
3. **Crea y asegura los directorios `uploads/`:** Crea las carpetas para carnets de identidad (`uploads/ci`), licencias de repartidores (`uploads/docs`) y comprobantes QR (`uploads/qr`), configurando en cada una un archivo protector `.htaccess` que bloquea la ejecución de scripts (Anti-RCE).

---

## ⚡ 3. Puesta en Marcha: ¿Cómo Levantar el Proyecto?

La plataforma ofrece **dos formas de ejecución**. Elige la que mejor se adapte a tu necesidad:

| Comparativa | Opción 1: Servidor Python Autónomo | Opción 2: Servidor XAMPP (Apache + MySQL Real) |
|---|---|---|
| **¿Para qué sirve?** | Pruebas inmediatas, desarrollo y demostración portátil sin configurar nada. | Evaluación formal de tesina, producción, phpMyAdmin y MySQL físico. |
| **Requisitos previos** | Solo tener instalado **Python 3.10+**. | Tener instalado **XAMPP 8.2+** (Apache + PHP 8.2 + MySQL). |
| **Tiempo de inicio** | ⏱️ **Menos de 10 segundos**. | ⏱️ **2 minutos** (requiere importar base de datos y configurar `.env`). |
| **Base de Datos** | Emulada en memoria con datos semilla completos. | Persistente en disco en MySQL real (`burger_shop`). |
| **Comando de inicio** | Doble clic en `start_services.bat` o `python server.py 8000`. | Iniciar Apache y MySQL desde el panel de XAMPP. |
| **URL de acceso** | `http://localhost:8000/` | `http://localhost/Bebidas-E-Commerce/` |

---

### Opción 1: Modo Desarrollo Ultrarrápido con Python (Sin instalar MySQL ni Apache)

Si solo deseas ver la aplicación funcionando, hacer pedidos, probar los roles y navegar por el mapa:

1. **Clonar o descargar el proyecto:**
   ```bash
   git clone https://github.com/TuGfaNat/Bebidas-E-Commerce.git
   cd Bebidas-E-Commerce
   ```

2. **Instalar dependencias:**
   ```bash
   python setup.py
   # o bien:
   pip install -r requirements.txt
   ```

3. **Iniciar el servidor:**
   * En Windows: Haz doble clic sobre el archivo **`start_services.bat`**  
   * O ejecuta en tu terminal:
     ```bash
     python server.py 8000
     ```

4. **Abrir en el navegador:**  
   👉 **[http://localhost:8000/](http://localhost:8000/)**

¡Listo! El servidor autónomo levantará la web con todos los usuarios demo, el catálogo de productos y la simulación de APIs lista para usar.

---

### Opción 2: Modo Producción / Tesina con XAMPP (Apache + PHP 8.2 + MySQL 8 Real)

Si vas a **defender tu proyecto ante un tribunal académico**, deseas ver las tablas en **phpMyAdmin** o desplegar en un servidor real:

#### Paso 1: Ubicar el proyecto en Apache
Copia o clona la carpeta del proyecto dentro del directorio de documentos públicos de XAMPP:
```text
C:\xampp\htdocs\Bebidas-E-Commerce\
```
*(Si instalaste XAMPP en otro disco, como `F:\xampp`, ubícalo en `F:\xampp\htdocs\Bebidas-E-Commerce\`)*.

#### Paso 2: Iniciar Servicios en XAMPP
Abre **XAMPP Control Panel** e inicia:
* ✅ **Apache** (hacer clic en *Start* &mdash; escuchará en puertos `80` y `443`).
* ✅ **MySQL** (hacer clic en *Start* &mdash; escuchará en puerto `3306`).

#### Paso 3: Crear la Base de Datos `burger_shop` (Idempotente)
El archivo [`install_db.sql`](install_db.sql) crea la base de datos `burger_shop`, sus 6 tablas normalizadas y los usuarios con contraseñas Bcrypt:

* **Desde phpMyAdmin (Gráfico):** Abre `http://localhost/phpmyadmin/`, haz clic en **Importar**, selecciona `install_db.sql` y pulsa **Continuar**.
* **O por terminal:**
  ```powershell
  C:\xampp\mysql\bin\mysql.exe -u root < install_db.sql
  ```
* **O mediante el asistente PHP:**
  ```powershell
  php migrate.php
  ```

#### Paso 4: Configurar Variables de Entorno (`.env`)
En la carpeta del proyecto, crea tu archivo `.env` a partir de la plantilla (o ejecuta `python setup.py`):
```powershell
copy .env.example .env
```
*(Las opciones predeterminadas ya vienen listas para conectar con el MySQL de XAMPP en `127.0.0.1:3306`)*.

#### Paso 5: Certificar el Despliegue con `check_deploy`
Ejecuta la herramienta de diagnóstico:
* **Por consola:** Haz doble clic en `check_deploy.bat` o ejecuta `php check_deploy.php`.
* **En el navegador:** Abre 👉 **[http://localhost/Bebidas-E-Commerce/check_deploy.php](http://localhost/Bebidas-E-Commerce/check_deploy.php)**.

Verás el tablero visual certificando las 30 verificaciones en verde.

#### Paso 6: Acceder a la Plataforma
Abre tu navegador en:  
👉 **[http://localhost/Bebidas-E-Commerce/](http://localhost/Bebidas-E-Commerce/)**

> 📖 **Guía Completa de Despliegue:** Para mayores detalles técnicos y consideraciones de seguridad, consulta la [Guía de Despliegue en XAMPP](docs/GUIA_DESPLIEGUE_XAMPP.md).

---

## 🔑 4. Cuentas de Acceso Preconfiguradas (Credenciales Demo)

El sistema incluye **7 cuentas de prueba** para verificar todos los roles y estados posibles de usuario:

| Rol | Nombre Completo | Correo Electrónico | Contraseña | Estado C.I. | ¿Qué puede hacer en el sistema? |
|---|---|---|---|---|---|
| 👑 **Super Usuario (Admin)** | Admin Central | `admin@mail.com` | `admin` | ✅ Verificado | Control total: editar catálogo, modificar stock, ver mapa de repartidores en vivo, aprobar carnets y liquidar caja. |
| 👤 **Cliente (Activo)** | Carlos Pérez | `carlos@mail.com` | `carlos` | ✅ Verificado | Comprar libremente: ver precios, armar carrito, elegir ubicación en el mapa y pagar por QR o efectivo. |
| ⏳ **Cliente (Pendiente)** | María López | `maria@mail.com` | `maria` | ⏳ Pendiente | Cuenta registrada con C.I. en espera de aprobación. Los precios aparecen ocultos hasta que el Admin la apruebe. |
| ❌ **Cliente (Rechazado)** | Roberto Flores | `roberto@mail.com` | `roberto` | ❌ Rechazado | Cuenta bloqueada con aviso administrativo de C.I. rechazado. |
| 🛵 **Rider (Activo)** | Pedro Gómez | `pedro@mail.com` | `pedro` | ✅ Aprobado | Repartidor operativo: ver pedidos disponibles, aceptar entregas, ver rutas GPS, cobrar y ver historial. |
| ⏳ **Rider (Pendiente)** | Juan Rodríguez | `juan@mail.com` | `juan` | ⏳ Pendiente | Repartidor con documentos (licencia, SOAT, CV) en revisión. No puede aceptar órdenes hasta aprobación. |
| ❌ **Rider (Rechazado)** | Marcos Vargas | `marcos@mail.com` | `marcos` | ❌ Rechazado | Repartidor con expediente rechazado. |

> 💡 **Inicio de Sesión en 1 Clic (Sin Escribir):**  
> En la esquina inferior izquierda de la pantalla verás un botón flotante: **`🔑 Cuentas Demo (Abrir ▴)`**. Haz clic en él y pulsa sobre cualquier usuario para iniciar sesión al instante sin tener que escribir correo ni contraseña.

---

## 🧭 5. URLs Principales del Sistema

| Módulo / Servicio | URL en Apache (XAMPP) | URL en Servidor Python | Propósito |
|---|---|---|---|
| **Frontend Web (SPA)** | `http://localhost/Bebidas-E-Commerce/` | `http://localhost:8000/` | Interfaz interactiva de la tienda y paneles. |
| **Diagnóstico de Despliegue** | `http://localhost/Bebidas-E-Commerce/check_deploy.php` | `http://localhost:8000/check_deploy.php` | Monitor visual de salud del servidor y base de datos. |
| **phpMyAdmin** | `http://localhost/phpmyadmin/` | N/A | Gestor visual de base de datos MySQL. |
| **API: Heartbeat Conexión** | `http://localhost/Bebidas-E-Commerce/microservices/Auth/connection.php` | `http://localhost:8000/microservices/Auth/connection.php` | Diagnóstico de conexión en tiempo real. |
| **API: Login REST** | `http://localhost/Bebidas-E-Commerce/microservices/Auth/login.php` | `http://localhost:8000/microservices/Auth/login.php` | Autenticación real y expedición de tokens JWT. |
| **API: Catálogo de Productos**| `http://localhost/Bebidas-E-Commerce/microservices/Catalog/catalog.php` | `http://localhost:8000/microservices/Catalog/catalog.php` | Listado y administración del menú comercial. |
| **API: Checkout de Pedidos** | `http://localhost/Bebidas-E-Commerce/microservices/Transactions/checkout.php` | `http://localhost:8000/microservices/Transactions/checkout.php` | Creación atómica de pedidos y descuento de stock. |
| **API: Asignación de Repartos**| `http://localhost/Bebidas-E-Commerce/microservices/Rider/assignment.php` | `http://localhost:8000/microservices/Rider/assignment.php` | Consulta y aceptación de órdenes para repartidores. |

---

## 🔍 6. Diagnóstico Automatizado del Sistema (`check_deploy`)

El proyecto incorpora una suite de pruebas diagnósticas que verifica **30 puntos críticos** de la instalación antes de operar o exponer el proyecto:

```powershell
# Ejecución directa en Windows:
check_deploy.bat

# O mediante PHP:
php check_deploy.php
```

### ¿Qué comprueba `check_deploy`?
1. **Intérprete PHP:** Versión $\ge 8.2$ y extensiones activadas (`pdo_mysql`, `openssl`, `mbstring`, `fileinfo`).
2. **Variables de Entorno (`.env`):** Existencia del archivo, secreto criptográfico `JWT_SECRET` seguro ($\ge 32$ caracteres y no por defecto) y orígenes autorizados por CORS (`ALLOWED_ORIGINS`).
3. **Persistencia MySQL:** Conexión PDO a `burger_shop`, verificación de las 6 tablas relacionales (`users`, `productos`, `pedidos`, `pedido_detalles`, `documentacion_rider`, `auditoria_logs`) y usuarios demo cargados con contraseñas Bcrypt.
4. **Directorios de Subida (`uploads/`):** Permisos de lectura/escritura en carpetas multimedia y presencia de archivos `.htaccess` protectores que bloquean la ejecución de código malicioso (mitigación anti-RCE).
5. **Criptografía JWT:** Emisión y validación exitosa de firmas HMAC-SHA256 en tiempo de ejecución.

> 🖥️ También puedes abrir `http://localhost/Bebidas-E-Commerce/check_deploy.php` en tu navegador para ver los resultados con un dashboard visual interactivo.

---

## 📚 7. Tesina Académica y Documentación Formal

El repositorio incluye una monografía técnica y tesina de grado completa, redactada con rigor metodológico de ingeniería de software en conformidad con la especificación del proyecto ([`SPEC.md`](SPEC.md)):

### Capítulos Disponibles en [`docs/`](docs/):

1. **[Capítulo 1: Infraestructura, Arquitectura y Despliegue](docs/tesina_infrastructure.md):** Justificación del stack tecnológico, diseño de microservicios, diccionario de datos relacional (3FN) y módulo formal de despliegue en servidor XAMPP.
2. **[Capítulo 2: Diagramas del Sistema y Modelado C4](docs/tesina_diagrams.md):** Diagramas C4 (Contexto, Contenedor, Componentes), Diagrama Entidad-Relación (DER), diagramas de secuencia UML y máquinas de estados.
3. **[Capítulo 3: Arquitectura de Seguridad y Criptografía](docs/tesina_security.md):** Cifrado Bcrypt, firma HMAC-SHA256 de tokens JWT, prevención de vulnerabilidades OWASP Top 10 (SQLi, XSS, CSRF) y control de acceso basado en roles (RBAC).
4. **[Capítulo 4: Transacciones, Máquinas de Estados y Reglas de Negocio](docs/tesina_transactions.md):** Control de concurrencia ACID con `FOR UPDATE`, ciclo de vida de pedidos, cancelaciones atómicas y liquidación de caja en efectivo.
5. **[Capítulo 5: Manual de Integración y Catálogo de APIs](docs/tesina_integration.md):** Especificación completa de endpoints REST, envolvente de respuesta estándar BMAD y guía de consumo desde `api.js`.
6. **[Capítulo 6: Interfaz de Usuario y Componentes Frontend](docs/tesina_frontend.md):** Arquitectura visual Glassmorphism, integración de mapas Leaflet.js y capas CartoDB Dark Matter.
7. **[Capítulo 7: Manual de Usuario, Pruebas Operativas y Conclusiones](docs/tesina_manual_conclusion.md):** Manual de uso paso a paso para cada actor, matriz de pruebas de integración y conclusiones académicas.
8. **[Guía Especializada: Despliegue en XAMPP](docs/GUIA_DESPLIEGUE_XAMPP.md):** Documento técnico del ticket 29-BE-009 estructurado según la jerarquía de tesina de SPEC.md.

---

### Compilación a Documento Maestro y Exportación a PDF

El proyecto incluye un script de compilación automática ([`export_tesina.py`](export_tesina.py)) que une todos los capítulos en un solo archivo con portada, índice numerado y diagramas Mermaid:

```powershell
python export_tesina.py
```

Este comando genera automáticamente:
* **`TESINA_COMPLETA.md`:** Documento maestro unificado en Markdown.
* **`TESINA_COMPLETA.html`:** Documento web formal con tipografía académica, diagramas renderizados y estilos optimizados para impresión.

#### 🖨️ ¿Cómo generar el PDF final para imprimir o presentar?
1. Abre el archivo **`TESINA_COMPLETA.html`** en cualquier navegador web moderno (Google Chrome, Microsoft Edge o Mozilla Firefox).
2. Presiona la combinación de teclas:
   * En Windows: **`Ctrl + P`**
   * En Mac: **`Cmd + P`**
3. En la ventana de impresión, selecciona:
   * **Destino:** *Guardar como PDF*.
   * **Páginas:** *Todas*.
   * **Gráficos de fondo (Background graphics):** ✅ **Marcar casilla** (indispensable para conservar los colores de diagramas, tablas y código).
4. Haz clic en **Guardar**.

---

## 🏗️ 8. Arquitectura de Microservicios y Estándar BMAD

Todos los endpoints devuelven información estructurada bajo el formato estándar **BMAD (Bounded Microservice Architecture Delivery)**, asegurando respuestas determinísticas con auditoría obligatoria:

```json
{
  "status": "success",
  "data": {
    "pedido_id": 1,
    "total": 35.00,
    "estado_pedido": "en_camino"
  },
  "audit": {
    "user_id": 3,
    "timestamp": "2026-10-08T01:30:00Z",
    "action": "ORDER_DISPATCH"
  },
  "error_details": null
}
```

* **`status`:** `"success"` para operaciones exitosas o `"error"` en caso de fallo.
* **`data`:** Contenido devuelto por la operación (objetos, arreglos o identificadores).
* **`audit`:** Trazabilidad obligatoria con ID de usuario, marca temporal ISO-8601 y acción realizada.
* **`error_details`:** Descripción amigable del error en caso de fallo.

---

## 📂 9. Estructura del Repositorio

```text
Bebidas-E-Commerce/
├── requirements.txt             # Dependencias del sistema (python-docx, dotenv, requests, bcrypt)
├── setup.py                     # Asistente instalador y configurador multiplataforma
├── install.bat                  # Instalador automatizado de 1 clic para Windows
├── index.html                   # Interfaz de usuario Single Page Application (SPA)
├── style.css                    # Estilos CSS3 responsivos con tema Glassmorphism
├── app.js                       # Lógica de la interfaz y renderizado reactivo
├── api.js                       # Capa cliente HTTP con soporte Bearer JWT y auto-detección de host
├── server.py                    # Servidor de desarrollo autónomo multi-hilo en Python
├── start_services.bat           # Lanzador rápido de 1 clic para Windows
├── check_deploy.php             # Diagnóstico integral de producción (CLI y Navegador)
├── check_deploy.bat             # Acceso directo al verificador de despliegue
├── check_deploy.py              # Verificador complementario en Python
├── install_db.sql               # Script SQL idempotente (Crea BD, 6 tablas y datos semilla)
├── init_schema.sql              # Esquema DDL completo con integridad referencial
├── migrate.php                  # Asistente de migración interactivo en PHP
├── view_db.py                   # Visor de tablas y registros en consola (Tablas ASCII)
├── export_tesina.py             # Compilador de la tesina completa a Markdown y HTML/PDF
├── .env.example                 # Plantilla de variables de entorno de desarrollo
├── .env.production.example      # Plantilla de variables de entorno de producción
├── docs/                        # Capítulos formales de la tesina académica
│   ├── GUIA_DESPLIEGUE_XAMPP.md # Guía y módulo de despliegue en XAMPP (Ticket 29-BE-009)
│   ├── tesina_infrastructure.md # Cap 1: Infraestructura, Arquitectura y Despliegue
│   ├── tesina_diagrams.md       # Cap 2: Diagramas C4, ER y Secuencia UML
│   ├── tesina_security.md       # Cap 3: Seguridad, Criptografía Bcrypt y JWT
│   ├── tesina_transactions.md   # Cap 4: Transacciones ACID y Máquinas de Estados
│   ├── tesina_integration.md    # Cap 5: Catálogo de APIs REST y BMAD
│   ├── tesina_frontend.md       # Cap 6: Interfaz de Usuario y Mapas Leaflet.js
│   └── tesina_manual_conclusion.md # Cap 7: Manual de Usuario y Pruebas
├── microservices/               # Microservicios modulares en PHP
│   ├── Auth/                    # Autenticación, registro, JWT y aprobaciones
│   ├── Catalog/                 # Catálogo de hamburguesas y combos con stock
│   ├── Transactions/            # Checkout atómico, cancelaciones y reportes
│   ├── Rider/                   # Asignación de despachos y liquidación de caja
│   └── Logistics/               # Cálculo de distancias Haversine y flete GPS
└── uploads/                     # Almacenamiento seguro (.htaccess anti-RCE)
    ├── ci/                      # Fotos de carnet de identidad
    ├── docs/                    # Expedientes vehiculares de riders
    └── qr/                      # Comprobantes de transferencia QR
```

---

## ❓ 10. Solución de Problemas Frecuentes (FAQ)

### 1. ¿Cómo cambiar el puerto si el puerto 8000 ya está ocupado?
Si usas el servidor autónomo en Python y el puerto 8000 está en uso por otra aplicación, puedes indicar cualquier otro puerto:
```powershell
python server.py 8080
# o bien:
python server.py 3000
```
Luego ingresa a `http://localhost:8080/`.

### 2. Error al conectar con MySQL (`Conexión rechazada` o `Error 10060`)
* **Causa:** El servicio de base de datos no está iniciado o el puerto 3306 está cerrado.
* **Solución rápida:** Abre **XAMPP Control Panel** y haz clic en el botón **Start** al lado de **MySQL** hasta que el fondo se pinte de color verde.
* **Alternativa inmediata:** Si no deseas instalar MySQL en este momento, puedes usar la **Opción 1** (`python server.py 8000`), la cual emula la base de datos en memoria y no requiere MySQL instalado.

### 3. Apache en XAMPP no inicia porque los puertos 80 o 443 están ocupados
* **Causa:** Aplicaciones como Skype, VMware, IIS o servicios de Windows pueden usar el puerto 80 o 443.
* **Solución:** En el Panel de XAMPP, haz clic en **Config** al lado de Apache $\rightarrow$ `httpd.conf` y cambia `Listen 80` por `Listen 8080`. Luego en `httpd-ssl.conf` cambia `Listen 443` por `Listen 4433`. Tu acceso en Apache será entonces `http://localhost:8080/Bebidas-E-Commerce/`.

### 4. ¿Cómo ver qué datos hay guardados en la base de datos sin abrir phpMyAdmin?
Ejecuta en tu terminal el visor interactivo:
```powershell
python view_db.py
```
Te mostrará las tablas `users`, `productos`, `pedidos`, `documentacion_rider` y `auditoria_logs` formateadas en texto claro.

---

## 👥 Créditos y Licencia

* **Proyecto:** Plataforma E-Commerce y Reparto Burger 24/7.
* **Desarrollador / Autor:** TuGfaNat.
* **Licencia:** Distribuido bajo la Licencia ISC.

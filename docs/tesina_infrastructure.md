# Infraestructura, Arquitectura y Despliegue - Tesina Técnica

## 1. Stack Tecnológico de la Plataforma

La plataforma **Burger 24/7** ha sido construida seleccionando tecnologías robustas, abiertas y de alto rendimiento que garantizan disponibilidad continua en un entorno de comercio electrónico y reparto 24/7:

| Capa | Tecnología | Versión | Rol en el Ecosistema |
|---|---|---|---|
| **Frontend UI / UX** | HTML5 Semántico + CSS3 Glassmorphism | Estándar W3C | Interfaz responsiva multi-actor (Cliente, Rider, Admin) sin frameworks pesados para minimizar la sobrecarga de red y optimizar tiempos de carga. |
| **Lógica Frontend** | Vanilla JavaScript (ES6+) | ECMAScript 2022+ | Gestión reactiva del estado, renderizado dinámico del DOM, validaciones del cliente y capa de abstracción de red `api.js`. |
| **Mapeo & Georreferenciación** | Leaflet.js | v1.9.4 | Renderizado de mapas interactivos, selección de puntos GPS de entrega, cálculo de rutas visuales y monitoreo de repartidores con capas oscuras CartoDB. |
| **Iconografía** | Lucide Icons | v0.344.0 | Conjunto vectorial moderno y consistente para botones, estados y alertas. |
| **Criptografía Cliente** | Bcrypt.js | v2.4.3 | Verificación segura de credenciales en el cliente durante el modo simulado/offline. |
| **Backend Primario (REST)** | PHP (con extensión PDO) | v8.2+ | Lógica de negocio transaccional, endpoints RESTful modulares, conexión Singleton a base de datos y emisión/validación de tokens JWT. |
| **Procesamiento Geoespacial** | Python | v3.11+ | Motor matemático para cálculo geodésico de distancias (Fórmula Haversine), estimación de tiempos de llegada (ETA) y servidor HTTP de desarrollo (`server.py`). |
| **Motor de Base de Datos** | MySQL Server / MariaDB | v8.0+ / v10.5+ | Persistencia relacional normalizada en Tercera Forma Normal (3FN) con motor de almacenamiento InnoDB, soporte ACID y claves foráneas. |
| **Seguridad y Criptografía** | Bcrypt & HMAC-SHA256 | Nativo PHP / Py | Cifrado unidireccional de contraseñas con salting dinámico (`password_hash`) y firma digital criptográfica de tokens de sesión JWT. |

---

## 2. Arquitectura de Microservicios y Estándar de Comunicación

El backend está organizado como una constelación de **microservicios orientados a dominio (Domain-Driven Design)**, donde cada servicio encapsula su propia lógica y reglas de negocio:

```
microservices/
├── Auth/              # Autenticación, registro con C.I., JWT, sesiones y aprobaciones
│   ├── connection.php      # Verificación de conectividad (Heartbeat)
│   ├── jwt.php             # Generación y validación estricta de tokens JWT
│   ├── login.php           # Autenticación de credenciales con password_hash
│   ├── register.php        # Registro seguro de clientes con verificación C.I.
│   ├── register_rider.php  # Registro de repartidores con expediente digital
│   ├── session.php         # Verificación y restauración de sesión por Bearer Token
│   ├── admin_approval.php  # Aprobación o rechazo administrativo de identidades
│   └── security.php        # Helpers de sanitización y control de headers
├── Catalog/           # Catálogo comercial e inventario
│   ├── Database.php        # Conexión Singleton PDO con transacciones preparadas
│   └── catalog.php         # CRUD REST (GET, POST, PUT, DELETE) con control de roles
├── Transactions/      # Ciclo comercial y financiero
│   ├── checkout.php        # Creación atómica de pedidos con bloqueo FOR UPDATE
│   ├── cancel_order.php    # Cancelación de pedidos con restitución de inventario
│   ├── live_monitoring.php # Monitoreo en vivo, interpolación y recaudación
│   └── report.php          # Métricas de facturación, métodos de pago y rendimiento
├── Rider/             # Flujo operativo del transportista
│   ├── assignment.php      # Asignación y aceptación de órdenes en espera
│   ├── delivery.php        # Transiciones de estado (asignado -> en_camino -> entregado)
│   └── settle_cash.php     # Liquidación y conciliación de caja física central
└── Logistics/         # Cálculo geoespacial
    └── calculator.py       # Algoritmo Haversine de cálculo de distancia, flete y ETA
```

### Estándar de Respuesta Unificada BMAD

Todos los microservicios devuelven sus respuestas en formato JSON bajo una envolvente estándar obligatoria (**BMAD Response Envelope**), facilitando el consumo determinístico en el frontend y garantizando trazabilidad:

```json
{
  "status": "success | error",
  "data": {
    /* Carga útil de la respuesta (entidades, identificadores, listas) */
  },
  "audit": {
    "user_id": "3",
    "timestamp": "2026-09-15T05:04:04.428667+00:00",
    "action": "LIVE_MONITORING"
  },
  "error_details": null
}
```

* **`status`**: Código de estado semántico (`success` para códigos HTTP 2xx, `error` para 4xx y 5xx).
* **`data`**: Objeto o arreglo con los datos procesados. Nulo en caso de error.
* **`audit`**: Firma de auditoría obligatoria generada por el backend, vinculando el ID del operador, la marca temporal UTC y la acción ejecutada.
* **`error_details`**: Mensaje explicativo de la falla o motivo de rechazo cuando `status = error`.

---

## 3. Diccionario de Datos Completo (MySQL InnoDB)

El modelo de datos relacional se compone de 6 tablas normalizadas. Todas las tablas incluyen campos obligatorios de auditoría (`created_at`, `updated_at`, `created_by`, `updated_by`) en conformidad con la Regla de Oro de trazabilidad.

### Tabla: `users`
Almacena las cuentas de usuario y credenciales de acceso para los tres roles del sistema.

| Columna | Tipo de Dato | Nulo | Restricciones / Claves | Descripción |
|---|---|---|---|---|
| `id` | `INT` | NO | `PRIMARY KEY, AUTO_INCREMENT` | Identificador único del usuario. |
| `role` | `ENUM('cliente', 'rider', 'super_usuario', 'admin')` | NO | `DEFAULT 'cliente'` | Perfil de acceso y privilegios en el sistema. |
| `nombre` | `VARCHAR(150)` | NO | - | Nombre completo o razón social del usuario. |
| `email` | `VARCHAR(150)` | NO | `UNIQUE INDEX` | Correo electrónico principal para autenticación. |
| `password_hash` | `VARCHAR(255)` | NO | - | Contraseña encriptada con Bcrypt (costo 10). |
| `fecha_nacimiento` | `DATE` | SÍ | - | Fecha de nacimiento para control de mayoría de edad ($\ge 18$). |
| `ci_url` | `VARCHAR(255)` | SÍ | - | Ruta de almacenamiento del archivo digital del C.I. |
| `ci_status` | `ENUM('pending', 'verified', 'rejected')` | NO | `DEFAULT 'pending'` | Estado de verificación de identidad por el administrador. |
| `created_at` | `TIMESTAMP` | NO | `DEFAULT CURRENT_TIMESTAMP` | Fecha y hora de creación de la cuenta. |
| `updated_at` | `TIMESTAMP` | NO | `DEFAULT CURRENT_TIMESTAMP ON UPDATE` | Fecha y hora de la última modificación. |
| `created_by` | `INT` | SÍ | `FOREIGN KEY (users.id)` | ID del usuario o administrador que creó la cuenta. |
| `updated_by` | `INT` | SÍ | `FOREIGN KEY (users.id)` | ID del usuario o administrador que modificó la cuenta. |

---

### Tabla: `productos`
Almacena el catálogo de hamburguesas, combos, bebidas y acompañamientos disponibles para la venta.

| Columna | Tipo de Dato | Nulo | Restricciones / Claves | Descripción |
|---|---|---|---|---|
| `id` | `INT` | NO | `PRIMARY KEY, AUTO_INCREMENT` | Identificador único del producto. |
| `categoria` | `VARCHAR(50)` | NO | `INDEX` | Categoría: `Hamburguesas`, `Combos`, `Acompañamientos`, `Bebidas`. |
| `nombre` | `VARCHAR(150)` | NO | - | Nombre comercial del producto. |
| `marca` | `VARCHAR(100)` | SÍ | - | Línea o procedencia (Gourmet, Artesanal, Clásica). |
| `sabor` | `VARCHAR(255)` | SÍ | - | Descripción de ingredientes, presentación o tamaño. |
| `precio` | `DECIMAL(10,2)` | NO | `CHECK (precio >= 0)` | Precio unitario de venta al público en Bolivianos (Bs). |
| `stock` | `INT` | NO | `DEFAULT 0, CHECK (stock >= 0)` | Existencias disponibles en el inventario físico. |
| `created_at` | `TIMESTAMP` | NO | `DEFAULT CURRENT_TIMESTAMP` | Fecha y hora de registro en catálogo. |
| `updated_at` | `TIMESTAMP` | NO | `DEFAULT CURRENT_TIMESTAMP ON UPDATE` | Fecha y hora de última modificación de precio/stock. |
| `created_by` | `INT` | SÍ | `FOREIGN KEY (users.id)` | Administrador responsable del alta. |
| `updated_by` | `INT` | SÍ | `FOREIGN KEY (users.id)` | Administrador responsable de la edición. |

---

### Tabla: `pedidos`
Cabecera de las órdenes de compra, controlando el ciclo logístico, financiero y geográfico.

| Columna | Tipo de Dato | Nulo | Restricciones / Claves | Descripción |
|---|---|---|---|---|
| `id` | `INT` | NO | `PRIMARY KEY, AUTO_INCREMENT` | Identificador único del pedido. |
| `cliente_id` | `INT` | NO | `FOREIGN KEY (users.id) ON DELETE RESTRICT` | Cliente que realizó la compra. |
| `rider_id` | `INT` | SÍ | `FOREIGN KEY (users.id) ON DELETE SET NULL` | Repartidor asignado a la entrega. |
| `total` | `DECIMAL(10,2)` | NO | `CHECK (total >= 0)` | Monto final cobrado al cliente (subtotal + envío). |
| `subtotal` | `DECIMAL(10,2)` | SÍ | `DEFAULT 0.00` | Sumatoria de precios de los productos adquiridos. |
| `costo_envio` | `DECIMAL(10,2)` | SÍ | `DEFAULT 5.00` | Tarifa calculada de flete según distancia GPS. |
| `distancia_km` | `DECIMAL(6,2)` | SÍ | `DEFAULT 0.00` | Distancia geodésica tienda-cliente en kilómetros. |
| `latitud` | `DECIMAL(10,8)` | SÍ | - | Latitud geográfica de entrega seleccionada por el cliente. |
| `longitud` | `DECIMAL(11,8)` | SÍ | - | Longitud geográfica de entrega seleccionada por el cliente. |
| `metodo_pago` | `ENUM('qr', 'contraentrega_efectivo')` | NO | `DEFAULT 'contraentrega_efectivo'` | Método de pago convenido para la transacción. |
| `estado_pago` | `ENUM('esperando_pago', 'pagado_qr', 'pagado_efectivo', 'contraentrega', 'liquidado', 'cancelado')` | NO | `DEFAULT 'contraentrega'` | Estado de liquidación del pago. |
| `estado_pedido` | `ENUM('pendiente', 'asignado', 'en_camino', 'entregado', 'cancelado')` | NO | `DEFAULT 'pendiente'` | Fase en la máquina de estados del pedido. |
| `qr_comprobante_url`| `VARCHAR(255)` | SÍ | - | Ruta de almacenamiento de la foto del comprobante QR. |
| `created_at` | `TIMESTAMP` | NO | `DEFAULT CURRENT_TIMESTAMP` | Fecha y hora en que se confirmó el checkout. |
| `updated_at` | `TIMESTAMP` | NO | `DEFAULT CURRENT_TIMESTAMP ON UPDATE` | Fecha y hora del último cambio de estado. |
| `created_by` | `INT` | SÍ | `FOREIGN KEY (users.id)` | ID del cliente creador. |
| `updated_by` | `INT` | SÍ | `FOREIGN KEY (users.id)` | ID del usuario que modificó el estado. |

---

### Tabla: `pedido_detalles`
Tabla relacional de rompimiento que desglosa los ítems incluidos en cada pedido.

| Columna | Tipo de Dato | Nulo | Restricciones / Claves | Descripción |
|---|---|---|---|---|
| `id` | `INT` | NO | `PRIMARY KEY, AUTO_INCREMENT` | Identificador del renglón de detalle. |
| `pedido_id` | `INT` | NO | `FOREIGN KEY (pedidos.id) ON DELETE CASCADE` | Pedido al que pertenece el ítem. |
| `producto_id` | `INT` | NO | `FOREIGN KEY (productos.id) ON DELETE RESTRICT` | Producto adquirido. |
| `cantidad` | `INT` | NO | `CHECK (cantidad > 0)` | Número de unidades adquiridas. |
| `precio_unitario` | `DECIMAL(10,2)`| NO | `CHECK (precio_unitario >= 0)` | Precio unitario congelado al momento de la compra. |
| `subtotal` | `DECIMAL(10,2)`| SÍ | `CHECK (subtotal >= 0)` | Total por renglón (`cantidad * precio_unitario`). |
| `created_at` | `TIMESTAMP` | NO | `DEFAULT CURRENT_TIMESTAMP` | Fecha de creación del ítem. |
| `updated_at` | `TIMESTAMP` | NO | `DEFAULT CURRENT_TIMESTAMP ON UPDATE` | Fecha de actualización del ítem. |
| `created_by` | `INT` | SÍ | `FOREIGN KEY (users.id)` | Usuario creador. |
| `updated_by` | `INT` | SÍ | `FOREIGN KEY (users.id)` | Usuario modificador. |

---

### Tabla: `documentacion_rider`
Contiene el expediente legal y vehicular del repartidor requerido para su habilitación en plataforma.

| Columna | Tipo de Dato | Nulo | Restricciones / Claves | Descripción |
|---|---|---|---|---|
| `id` | `INT` | NO | `PRIMARY KEY, AUTO_INCREMENT` | Identificador único del expediente. |
| `rider_id` | `INT` | NO | `UNIQUE, FOREIGN KEY (users.id) ON DELETE CASCADE` | Relación unívoca 1:1 con el usuario repartidor. |
| `licencia_url` | `VARCHAR(255)` | NO | - | Archivo de licencia de conducir vigente. |
| `seguro_url` | `VARCHAR(255)` | NO | - | Archivo de póliza de seguro automotor / SOAT. |
| `cv_url` | `VARCHAR(255)` | NO | - | Archivo de Hoja de Vida / Curriculum Vitae. |
| `estado_aprobacion`| `ENUM('pendiente', 'aprobado', 'rechazado')` | NO | `DEFAULT 'pendiente'` | Dictamen administrativo del expediente. |
| `created_at` | `TIMESTAMP` | NO | `DEFAULT CURRENT_TIMESTAMP` | Fecha de postulación y carga de documentos. |
| `updated_at` | `TIMESTAMP` | NO | `DEFAULT CURRENT_TIMESTAMP ON UPDATE` | Fecha de dictamen o renovación. |
| `created_by` | `INT` | SÍ | `FOREIGN KEY (users.id)` | ID del rider postulante. |
| `updated_by` | `INT` | SÍ | `FOREIGN KEY (users.id)` | ID del administrador evaluador. |

---

### Tabla: `auditoria_logs`
Ledger inmutable del sistema que registra de manera permanente cada operación de mutación de datos.

| Columna | Tipo de Dato | Nulo | Restricciones / Claves | Descripción |
|---|---|---|---|---|
| `id` | `INT` | NO | `PRIMARY KEY, AUTO_INCREMENT` | Identificador correlativo del log. |
| `tabla_afectada` | `VARCHAR(100)` | NO | `INDEX` | Nombre de la tabla sobre la que operó el cambio. |
| `registro_id` | `INT` | NO | `INDEX` | Clave primaria del registro alterado. |
| `accion` | `ENUM('INSERT', 'UPDATE', 'DELETE')` | NO | - | Naturaleza de la operación DML. |
| `datos_anteriores`| `JSON` | SÍ | - | Snapshot del registro previo a la modificación. |
| `datos_nuevos` | `JSON` | SÍ | - | Snapshot del registro resultante tras la modificación. |
| `ip_address` | `VARCHAR(45)` | SÍ | - | Dirección IPv4 o IPv6 del cliente solicitante. |
| `created_at` | `TIMESTAMP` | NO | `DEFAULT CURRENT_TIMESTAMP` | Marca temporal UTC inmutable del suceso. |
| `created_by` | `INT` | SÍ | `FOREIGN KEY (users.id)` | Operador responsable de la mutación. |
| `updated_by` | `INT` | SÍ | `FOREIGN KEY (users.id)` | Reservado para integridad referencial. |

---

## 4. Guía de Despliegue y Puesta en Producción

### Requisitos del Sistema
- **Sistema Operativo:** Windows 10/11, Linux (Ubuntu 20.04+, Debian 11+) o macOS.
- **Servidor Web:** Apache 2.4+ (con módulos `mod_rewrite`, `mod_headers`) o Nginx 1.18+.
- **Intérprete PHP:** PHP 8.2 o superior con extensiones activadas: `pdo`, `pdo_mysql`, `json`, `mbstring`, `openssl`, `fileinfo`.
- **Servidor de Base de Datos:** MySQL 8.0+ o MariaDB 10.5+ con soporte UTF8mb4.
- **Intérprete Python:** Python 3.10 o superior (para soporte de scripts de cálculo y servidor local).

### Pasos de Despliegue con Apache / XAMPP
1. **Clonación del Repositorio:**
   Copiar la carpeta del proyecto dentro del directorio raíz de documentos del servidor web:
   - En XAMPP (Windows): `C:\xampp\htdocs\Bebidas-E-Commerce`
   - En Linux (Apache): `/var/www/html/Bebidas-E-Commerce`

2. **Inicialización de la Base de Datos:**
   Importar los archivos de esquema SQL en orden utilizando MySQL Workbench, phpMyAdmin o consola de comandos:
   ```bash
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS burger_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   mysql -u root -p burger_shop < init_schema.sql
   mysql -u root -p burger_shop < init_users.sql
   ```

3. **Configuración de Permisos de Archivos:**
   Garantizar que el servidor web posea permisos de escritura sobre las carpetas de subida de archivos:
   - `microservices/Auth/uploads/ci/` (Documentos de identidad de clientes y riders).
   - `microservices/Auth/uploads/qr/` (Comprobantes de transferencias bancarias QR).
   - `microservices/Auth/uploads/riders/` (Expedientes vehiculares de conductores).

4. **Configuración de Parámetros de Conexión:**
   Verificar las credenciales de base de datos en [`microservices/Catalog/Database.php`](file:///F:/Bebidas-E-Commerce/microservices/Catalog/Database.php):
   ```php
   private $host = "localhost";
   private $db_name = "burger_shop";
   private $username = "root";
   private $password = "";
   ```

### Despliegue Rápido en Entorno de Desarrollo (Servidor Autónomo Python)
El proyecto incluye un servidor HTTP multipropósito escrito en Python (`server.py`) que implementa la emulación completa de los microservicios sin requerir una instalación pesada de Apache:
```powershell
# Ejecución directa en consola:
python server.py 8000

# O mediante el script por lotes incluido:
./start_services.bat
```
El servidor quedará disponible en `http://localhost:8000`, ofreciendo soporte simultáneo para servir los activos estáticos del frontend (`index.html`, `style.css`, `app.js`, `api.js`) y atender las peticiones REST con persistencia en memoria y verificación de tokens JWT.

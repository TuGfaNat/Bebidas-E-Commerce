# Estructura de Documentación Técnica - Tesina

## Título del Módulo: Módulo Central de Infraestructura y Registro (Auth, Logística y Catálogo)

### Descripción Técnica
Este módulo implementa la estructura base de bases de datos para el ecosistema E-commerce Bebidas 24/7. Resuelve los requerimientos de la sección de infraestructura mediante la creación de tablas clave relacionadas entre sí usando el motor relacional MySQL. Cumple estrictamente con la Regla de Oro (Sección 3 de `SPEC.md`) asegurando la trazabilidad de operaciones mediante los campos de auditoría. Además, establece la arquitectura base de microservicios con la lógica de registro y subida de C.I. que requiere el protocolo JSON estructurado.

### Diagrama de Flujo / Lógica: Registro de Rider y Aprobación del Super Usuario
1. **Inicio de Solicitud:** El Rider inicia el proceso de registro enviando sus credenciales y subiendo su C.I., junto a la validación de permisos obligatorios (GPS y Cámara).
2. **Procesamiento de C.I.:** El microservicio de Auth (a través de `UserRegistration.php`) procesa el archivo del C.I., guardando la ruta (`ci_url`) en la tabla `users` y cambiando el `ci_status` a `pending`.
3. **Subida de Documentación Extra:** El Rider envía su expediente digital (licencia, seguro, CV), el cual se guarda en `documentacion_rider` con estado de aprobación `pendiente`.
4. **Registro de Auditoría:** Todas las inserciones o actualizaciones generan una entrada automática (vía triggers o lógica de negocio) en la tabla `auditoria_logs`.
5. **Revisión (Super Usuario):** El Super Usuario consulta los registros en estado `pending` o `pendiente`. Visualiza el C.I. y el expediente.
<<<<<<< HEAD
6. **Decisión:**
=======
6. **Decisión:**
>>>>>>> a6ffe8e (Resolve conflict on init_schema.sql by restoring to origin/main and reapplying changes)
   - *Aprobado:* El estado de `ci_status` en `users` y `estado_aprobacion` en `documentacion_rider` cambia a `verified`/`aprobado`. El Rider es notificado.
   - *Rechazado:* Se rechaza la solicitud cambiando a `rejected`/`rechazado`.
7. **Fin del Flujo.**

### Diccionario de Datos

**Tabla: `productos`**
| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Identificador único del producto |
| nombre | VARCHAR(255) | NOT NULL | Nombre del producto |
| marca | VARCHAR(255) | NOT NULL | Marca del producto |
| sabor | VARCHAR(255) | NULL | Sabor específico del producto |
| precio | DECIMAL(10, 2) | NOT NULL | Precio de venta |
| stock | INT | NOT NULL, DEFAULT 0 | Cantidad de inventario disponible |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE | Fecha de actualización |
| created_by | INT | FOREIGN KEY (users.id) | ID del usuario que creó el registro |
| updated_by | INT | FOREIGN KEY (users.id) | ID del usuario que actualizó el registro |

**Tabla: `pedidos`**
| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Identificador único del pedido |
| cliente_id | INT | FOREIGN KEY (users.id) | Referencia al cliente |
| rider_id | INT | FOREIGN KEY (users.id), NULL | Referencia al rider asignado |
| estado_pago | ENUM | NOT NULL | Estado ('qr', 'contraentrega', 'pagado_qr', 'pagado_efectivo', 'cancelado') |
| estado_pedido | ENUM | NOT NULL | Fase del pedido ('pendiente', 'en_camino', 'entregado', 'cancelado') |
| total | DECIMAL(10, 2) | NOT NULL | Total a pagar |
| created_at, updated_at, created_by, updated_by | - | Auditoría Obligatoria | Trazabilidad del pedido |

**Tabla: `documentacion_rider`**
| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | ID único |
| rider_id | INT | UNIQUE, FOREIGN KEY (users.id) | Relación 1:1 con el usuario rider |
| licencia_url | VARCHAR(255) | NOT NULL | Ruta de archivo de la licencia de conducir |
| seguro_url | VARCHAR(255) | NOT NULL | Ruta de archivo del seguro |
| cv_url | VARCHAR(255) | NOT NULL | Ruta de archivo del Curriculum Vitae |
| estado_aprobacion | ENUM | DEFAULT 'pendiente' | Estado de validación por Super Usuario |
| created_at, updated_at, created_by, updated_by | - | Auditoría Obligatoria | Trazabilidad de los documentos |

**Tabla: `auditoria_logs`**
| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | ID del log |
| tabla_afectada | VARCHAR(255) | NOT NULL | Nombre de la tabla modificada |
| registro_id | INT | NOT NULL | ID del registro alterado |
| accion | ENUM | NOT NULL | Tipo de operación ('INSERT', 'UPDATE', 'DELETE') |
| datos_anteriores | JSON | NULL | Snapshot del estado previo del registro |
| datos_nuevos | JSON | NULL | Snapshot del estado posterior del registro |
| ip_address | VARCHAR(45) | NULL | IP desde la cual se realizó la acción |
| created_at, updated_at, created_by, updated_by | - | Auditoría Obligatoria | Registro del responsable de la operación |

### Manual de Pruebas y Prevención (Auditoría de Logs)
**¿Cómo previene `auditoria_logs` el fraude o errores de inventario?**
<<<<<<< HEAD
La tabla de `auditoria_logs` funciona como un ledger inmutable que captura quién, cuándo y cómo alteró la información crítica de la plataforma.
=======
La tabla de `auditoria_logs` funciona como un ledger inmutable que captura quién, cuándo y cómo alteró la información crítica de la plataforma.
>>>>>>> a6ffe8e (Resolve conflict on init_schema.sql by restoring to origin/main and reapplying changes)
1. **Prevención de Fraude de Inventario:** Si el `stock` de la tabla `productos` baja de manera sospechosa o irregular sin estar correlacionado con una venta en `pedidos`, el log captura inmediatamente el `datos_anteriores` y `datos_nuevos` del producto, junto con la IP y el ID (`updated_by`) del empleado o super usuario que realizó la alteración, lo que permite rastrear el robo hormiga o ajustes ilícitos de mercancía.
2. **Prevención en Recaudación (Caja del Rider):** Si un Rider o administrador altera maliciosamente el `estado_pago` de un pedido (por ejemplo, pasándolo de 'contraentrega' a 'cancelado' después de haber cobrado en efectivo para quedarse el dinero), la tabla de auditoría guarda el cambio (la acción 'UPDATE' sobre `pedidos`), evidenciando el intento de desfalco.
3. **Casos de Manejo de Errores (Ej: C.I. Ilegible):** Si el C.I. de un Rider es ilegible o falso, y el Super Usuario rechaza el registro, el sistema guarda este intento fallido en los logs. Si luego, por error humano, el registro se aprueba, la trazabilidad del `updated_by` permite deslindar responsabilidades directas en la auditoría.

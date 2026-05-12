# Manual Técnico de Integración - Tesina

## Título del Módulo: Integración de Gestión, Catálogo y Logística (Sprint Masivo)

### Descripción Técnica
Este manual documenta la integración de tres módulos críticos: el panel de aprobación (Auth), el catálogo dinámico (Catalog) y el motor de cálculo logístico (Logistics). El sistema utiliza PHP para la gestión de datos relacionales y Python para la carga de procesamiento geoespacial, respetando la arquitectura de microservicios.

### Diagrama de Flujo / Lógica Integrada
1. **Verificación de Identidad (Auth):**
   - El Super Usuario accede a `admin_approval.php` y revisa los documentos.
   - Al aprobar a un Cliente (`tipo = user`), el estado en la base de datos cambia a `verified`.
   - Este cambio de estado activa la visibilidad comercial.
2. **Acceso al Catálogo (Catalog):**
   - Un cliente hace una petición a `catalog.php?action=list`.
   - Si su estado es `verified`, el backend le envía el árbol JSON con las jerarquías (Categoría > Marca > Sabor), los `precios` y la bandera `buy_option: true`.
   - Si su estado es `pending`, el precio se oculta con el mensaje `"Oculto - Verifica tu C.I."` y se bloquea la opción de compra.
3. **Cálculo de Envío (Logistics):**
   - Cuando el cliente decide hacer checkout, el frontend envía sus coordenadas GPS al backend.
   - El backend invoca el script de Python `calculator.py`.
   - El motor de Python utiliza la fórmula del Haversine para calcular la `distancia_km`, el `tiempo_estimado` y aplica la tarifa base de `costo_envio_bs`.

### Diccionario de Datos Actualizado

**Tabla: `productos` (Esquema Modificado)**
| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Identificador del producto |
| categoria | VARCHAR(255) | NOT NULL | **[NUEVO]** Clasificación principal (ej. Cervezas, Vinos) |
| nombre | VARCHAR(255) | NOT NULL | Nombre comercial |
| marca | VARCHAR(255) | NOT NULL | Marca del producto |
| sabor | VARCHAR(255) | NULL | Sabor o presentación (ej. Lata 355ml) |
| precio | DECIMAL(10, 2) | NOT NULL | Precio de venta |
| stock | INT | NOT NULL, DEFAULT 0 | Inventario |
| Auditoría | TIMESTAMP/INT | NOT NULL | Campos `created_at, updated_at, created_by, updated_by` |

### Protección de Integridad de Datos de Auditoría
El sistema cumple estrictamente con el **BMAD-METHOD** para proteger el ledger inmutable (`auditoria_logs`):
1. **Forzado en Lógica de Negocio:** En `admin_approval.php`, el script no permite hacer un `UPDATE` sin estar envuelto en una Transacción (`$db->beginTransaction()`). Inmediatamente después de actualizar el estado de un Rider o Cliente, se lanza el `INSERT` hacia `auditoria_logs`. Si alguna de las dos fallara, la transacción se revierte (`$db->rollBack()`), impidiendo alteraciones huérfanas o no trazables.
2. **Responsabilidad Vinculante:** El campo `updated_by` de la tabla afectada recibe el ID exacto del Administrador (pasado como `admin_id`), que es validado en tiempo de ejecución asegurando que solo los perfiles con `role = 'super_usuario'` puedan estampar su firma en el log de autorizaciones. Esto protege contra la alteración fraudulenta de estados de facturación y permisos de entrega.

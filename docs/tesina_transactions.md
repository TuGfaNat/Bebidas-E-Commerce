# Manual de Seguridad y Gestión de Inventario - Tesina

## Título del Módulo: Transacciones, Despacho y Auditoría Financiera

### Descripción Técnica
Este módulo asegura la trazabilidad absoluta de las operaciones monetarias y del inventario en tiempo real. Cumple el doble propósito de proveer endpoints de pasarela de pago (Subida de QR, Contraentrega) para el Cliente, y endpoints operativos para el Rider (Asignación y Despacho), mientras aplica los rigurosos controles del **BMAD-METHOD**.

### Seguridad en Transacciones y Gestión de Inventario
El principal reto de un E-commerce 24/7 descentralizado es evitar el fraude en los cierres de caja y el "robo hormiga" de inventario. La solución implementada basa su seguridad en el Ledger Inmutable (`auditoria_logs`) bajo las siguientes estrategias:

1. **Blindaje de Estados Financieros:**
   - Cuando un Cliente sube su comprobante QR a través de `checkout.php`, la imagen es aislada en la ruta protegida `/uploads/qr/` bajo directivas estricta de `.htaccess`, evitando exposición pública de comprobantes bancarios.
   - Todo cambio en el `estado_pago` de un pedido ('esperando_pago' -> 'pagado_qr') dispara obligatoriamente una entrada en `auditoria_logs`. El registro guarda en JSON el estado anterior y el nuevo estado, firmando criptográficamente a nivel de tabla el `updated_by` con la ID del responsable. Esto impide que administradores cambien un estado de pago a "cancelado" para desviar fondos sin dejar un rastro permanente y rastreable a su cuenta.

2. **Liquidación y Actualización de Inventario en Tiempo Real:**
   - La tabla `pedido_detalles` vincula físicamente los ítems a la transacción maestra.
   - En el script `assignment.php`, la acción de "Aceptar Pedido" por parte del Rider inicia una *Transacción Relacional (ACID)*.
   - Durante este proceso, se descuenta la `cantidad` comprada del `stock` de la tabla `productos`.
   - **Auditoría de Inventario:** Por cada producto descontado, se genera una entrada específica en `auditoria_logs`. Esto previene el fraude logístico: si el stock en tienda no coincide con el sistema, una rápida consulta al log revelará qué Rider restó el stock y en qué exacto pedido, asegurando que la liquidación de caja y mercancía sea exacta a fin de mes.

### Diccionario de Datos Suplementario

**Tabla: `pedido_detalles` (NUEVO)**
| Campo | Tipo | Restricción | Descripción |
|-------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Identificador de fila |
| pedido_id | INT | FOREIGN KEY (`pedidos.id`) | Enlace al pedido maestro |
| producto_id | INT | FOREIGN KEY (`productos.id`) | Enlace al producto comprado |
| cantidad | INT | NOT NULL | Cantidad de unidades |
| precio_unitario | DECIMAL(10,2) | NOT NULL | Precio de venta al momento de comprar |
| Auditoría | - | NOT NULL | `created_at, updated_at, created_by, updated_by` |

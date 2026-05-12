# Documentación Final de Cierre - Tesina

## Manual de Usuario Rápido

### Rol: Cliente
1. **Registro y Verificación:** Regístrate enviando tu correo, fecha de nacimiento (mayor de 18 años) y una foto legible de tu C.I. a través del formulario de `register.php`. Espera la aprobación del Super Usuario para ver precios.
2. **Exploración y Compra:** Navega por el catálogo dinámico filtrando por Categoría y Marca. Agrega bebidas al carrito y presiona "Comprar".
3. **Pago y Seguimiento:** Elige pagar en efectivo ("Contraentrega") o sube tu comprobante bancario en formato JPG/PNG/PDF. Espera a que un Rider acepte tu orden y recíbelo en tu ubicación.

### Rol: Rider
1. **Aprobación del Expediente:** Regístrate subiendo tu licencia, seguro y CV. Una vez el Super Usuario apruebe tus documentos, estarás habilitado.
2. **Asignación de Pedidos:** Entra a la vista de Despacho. El sistema listará automáticamente los pedidos pendientes y calculará (vía Python) tu distancia, tiempo de llegada y costo de ganancia. Haz clic en "Aceptar Pedido".
3. **Entrega y Cierre:** Recoge el producto (el stock se descontará automáticamente). Actualiza el estado a "En Camino" y luego a "Entregado". Si el pedido era contraentrega, al marcar "Entregado" el sistema asumirá que has cobrado el efectivo para la liquidación mensual.

### Rol: Super Usuario (Admin)
1. **Gestión de Identidades:** Revisa el panel de aprobación (`admin_approval.php`) para validar que las fotos de los C.I. de los clientes sean reales y que la documentación de los Riders esté vigente.
2. **Control de Inventario:** Utiliza el módulo de Catálogo para realizar operaciones CRUD (Crear, Actualizar, Eliminar) sobre los productos y ajustar el stock o los precios. Toda acción queda registrada con tu ID.
3. **Reportes y Auditoría:** Accede a `report.php` cada fin de mes para obtener la sumatoria total de ventas, la comparativa de qué método de pago (QR vs Efectivo) se usó más, y el ranking de rendimiento de los Riders.

---

## Conclusión Técnica: Escalabilidad y Seguridad en un Entorno 24/7

El desarrollo de la plataforma E-commerce Bebidas 24/7 ha demostrado que la implementación del **BMAD-METHOD** es crucial para el sostenimiento de operaciones ininterrumpidas.

**Escalabilidad a través de Microservicios:**
Al separar el monolito en microservicios específicos (`Auth`, `Catalog`, `Logistics`, `Transactions`, `Rider`), logramos aislar las responsabilidades. El microservicio de Catálogo en PHP, que recibe la mayor cantidad de tráfico por parte de los clientes vitrineando, puede escalar de forma independiente. Asimismo, delegar el cálculo espacial complejo (Haversine) a un motor especializado en Python previene cuellos de botella en el servidor web PHP, permitiendo que la concurrencia de asignación de Riders sea rápida e ininterrumpida.

**Consistencia y Seguridad Transaccional (MySQL):**
Un negocio de expendio de bebidas requiere que el inventario sea rigurosamente exacto. La utilización del motor relacional MySQL con un diseño normalizado (incluyendo la tabla de rompimiento `pedido_detalles`) y bloqueos transaccionales (`FOR UPDATE`) asegura que dos Riders no puedan descontar el mismo stock simultáneamente.
Además, la regla de oro de la auditoría universal (`auditoria_logs`) ligada a los campos `updated_by` erradica el repudio en las operaciones: el administrador no puede alterar precios ni un Rider puede "perder" mercancía sin que la transacción deje una huella inmutable asociada a sus identidades, blindando así los procesos de cierre de caja mensual.

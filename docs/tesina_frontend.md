# Documentación Técnica - Tesina

## Título del Módulo: Módulo de Interfaz Web Centralizada (Frontend Multi-Actor)

### Descripción Técnica
Este módulo implementa el Frontend de la plataforma **E-commerce Bebidas 24/7**. Utiliza una arquitectura modular estructurada en un archivo de marcado HTML5 semántico ([index.html](file:///F:/Bebidas-E-Commerce/index.html)), un sistema de estilos responsivos y modernos en CSS3 ([style.css](file:///F:/Bebidas-E-Commerce/style.css)) con efectos de glassmorphism y micro-animaciones, y un motor de lógica reactiva en JavaScript ES6 ([app.js](file:///F:/Bebidas-E-Commerce/app.js)).

El módulo unifica las experiencias de los tres actores del sistema:
1. **Cliente:** Quien puede registrarse de forma segura, subir su C.I. y verificar su mayoría de edad ($>18$). Una vez verificado por un administrador, puede explorar el catálogo jerárquico, agregar bebidas al carrito, interactuar con el mapa GPS de checkout y realizar pagos (QR bancario con comprobante o efectivo contraentrega).
2. **Rider:** Quien puede registrarse subiendo su expediente digital de conducción. Al ser aprobado, puede visualizar los pedidos en cola con el cálculo de distancias y ganancias estimadas, aceptar pedidos descontando stock en tiempo real (ACID), y controlar las etapas de tránsito mediante GPS.
3. **Super Usuario (Admin):** Quien cuenta con un centro de mando para aprobar/rechazar clientes y riders, realizar operaciones CRUD sobre los productos de catálogo, visualizar el **Ledger de Auditoría (BMAD)** en tiempo real y consultar reportes estadísticos e indicadores de rendimiento de riders.

---

### Diagrama de Flujo / Lógica de Interacción
1. **Flujo de Registro y Desbloqueo Comercial:**
   - El Cliente se registra en el panel lateral, sube una foto de C.I. y se calcula su edad. El estado se inicializa en `pending`.
   - Al navegar por el catálogo, los precios y botones de compra se muestran bloqueados y difuminados ("Oculto - Verifica tu C.I.").
   - El Super Usuario ingresa al panel de **Aprobación C.I.** y hace clic en **Aprobar**.
   - El estado del cliente cambia a `verified` reactivamente. El catálogo del cliente se desbloquea de inmediato mostrando los precios reales y habilitando la opción de compra.
2. **Flujo de Checkout y Cálculo de Ruta (Logística):**
   - El Cliente agrega productos al carrito y hace clic en **Proceder al Checkout**.
   - En el modal de checkout, el cliente selecciona su ubicación haciendo clic en un mapa interactivo (cuadrícula). El sistema ejecuta el cálculo logístico:
     $$\text{Distancia} = \text{Haversine}(\text{Tienda}, \text{Cliente})$$
     $$\text{Costo Envío} = 5.00\text{ Bs} + (\text{Distancia} \times 2.00\text{ Bs})$$
   - El cliente selecciona el método de pago: si es QR, sube un archivo de imagen; si es contraentrega, se habilita directo. Confirma el pedido.
   - El stock de productos se decrementa en la base de datos y se registra una transacción y log de auditoría múltiple.
3. **Flujo de Despacho y Entrega (Rider):**
   - El Rider visualiza el pedido en la cola de pedidos pendientes con el costo total e información de ruta.
   - Al hacer clic en **Aceptar y Cargar Stock**, el pedido se asocia al Rider (`estado_pedido = 'asignado'`).
   - El Rider marca **Iniciar Despacho** (`estado_pedido = 'en_camino'`). El mapa de rastreo del cliente y del rider muestran el movimiento del transportista en tiempo real.
   - El Rider marca **Finalizar Entrega** (`estado_pedido = 'entregado'`). Si era contraentrega, el estado de pago cambia a `pagado_efectivo` (liquidación de caja).
   - Se actualizan los logs de auditoría del Admin y los gráficos del panel de reportes mensuales.

---

### Diccionario de Datos del Frontend

#### Variables de Estado Global ([app.js](file:///F:/Bebidas-E-Commerce/app.js))
- **`DB` (Object):** Representa la base de datos relacional simulada en el cliente.
  - `users` (Array): Lista de usuarios (id, role, nombre, email, password_hash, fecha_nacimiento, ci_url, ci_status).
  - `productos` (Array): Catálogo de productos (id, categoria, nombre, marca, sabor, precio, stock, created_by, updated_by).
  - `pedidos` (Array): Registros de pedidos de compra (id, cliente_id, rider_id, estado_pago, estado_pedido, total, qr_comprobante_url).
  - `pedido_detalles` (Array): Relación de productos e ítems por pedido (id, pedido_id, producto_id, cantidad, precio_unitario).
  - `documentacion_rider` (Array): Expedientes de conducción (id, rider_id, licencia_url, seguro_url, cv_url, estado_aprobacion).
  - `auditoria_logs` (Array): Historial de logs inmutables (id, tabla_afectada, registro_id, accion, datos_anteriores, datos_nuevos, ip_address, created_at, created_by).
- **`currentSession` (Object):** Almacena las referencias a los usuarios activos simulados para cada rol (`cliente`, `rider`, `admin`).
- **`cart` (Array):** Listado de productos agregados temporalmente en el carrito `{ product: Object, quantity: Number }`.
- **`selectedDeliveryCoords` (Object):** Coordenadas geográficas y cálculo de despacho calculados en el checkout `{ lat, lon, distanceKm, etaMin, costBs }`.

---

### Manual de Pruebas y Casos de Uso

| Caso de Prueba | Entrada de Usuario | Comportamiento Esperado | Estado de Salida |
|---|---|---|---|
| **CP-01: Registro de menor de edad** | Fecha de nacimiento menor a 18 años del día actual. | El sistema calcula la edad, muestra mensaje de error en rojo y bloquea el botón de envío. | Registro denegado. |
| **CP-02: Visualización de Catálogo bloqueado** | Cliente registrado recién con estado `pending`. | Se listan los productos en el catálogo, pero el precio se muestra difuminado como "Oculto" y el botón de compra está deshabilitado. | Compra bloqueada. |
| **CP-03: Aprobación de C.I. por Admin** | Super Usuario entra al panel y hace clic en "Aprobar" sobre el cliente pendiente. | Se ejecuta la actualización de estado y se inserta un log en `auditoria_logs`. Al volver al panel del cliente, los precios se muestran inmediatamente legibles. | Cliente verificado, catálogo abierto. |
| **CP-04: Cálculo de costos GPS en Checkout** | Clic en coordenadas lejanas de la tienda en el mapa. | La distancia aumenta, el costo de envío suma 2.00 Bs por kilómetro a la tarifa base de 5.00 Bs y el total final se actualiza de forma reactiva. | Total incrementado. |
| **CP-05: Asignación y Descuento de Stock** | Rider acepta una orden pendiente. | El pedido pasa a `asignado`, el rider queda enlazado, se descuenta la cantidad correspondiente del stock del catálogo y se generan logs inmutables para el Admin. | Stock actualizado, pedido asignado. |
| **CP-06: Entrega y Cierre de Caja** | Rider hace clic en "Finalizar Entrega" de pedido contraentrega. | El estado de pedido cambia a `entregado` y el estado de pago se actualiza a `pagado_efectivo`, sumando a los reportes financieros del Admin. | Caja liquidada con éxito. |

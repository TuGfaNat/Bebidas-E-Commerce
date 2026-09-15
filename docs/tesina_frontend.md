# Interfaz de Usuario y Componentes Frontend - Tesina Técnica

## 1. Arquitectura de la Interfaz (SPA Multi-Actor)

El frontend de **Burger 24/7** está implementado como una **Single Page Application (SPA)** de alto rendimiento desarrollada en **Vanilla JavaScript (ES6+)**, sin dependencia de frameworks pesados (como React, Angular o Vue), logrando una velocidad de renderizado instantánea, bajo consumo de memoria y compatibilidad universal con navegadores modernos.

### Principios de Diseño
- **Glassmorphism y Tema Oscuro:** Estética visual futurista basada en tarjetas de cristal difuminado (`backdrop-filter: blur(12px)`), bordes sutiles semitransparentes y gradientes de color cálidos (naranja `#f97316`, rojo `#ef4444`, morado `#8b5cf6`).
- **Reactividad Nativa del DOM:** Gestión de estado centralizada mediante objetos JavaScript (`DB`, `currentSession`, `cart`, `config`) que propagan cambios a la interfaz mediante funciones de renderizado dirigidas (`renderProducts`, `renderAdminMonitoringUI`, `updateUIForCurrentRole`).
- **Resiliencia y Modo Dual:** Switch maestro `toggleConnectedMode` que permite operar en **Modo Conectado** consumiendo los microservicios REST PHP/MySQL mediante [`api.js`](file:///F:/Bebidas-E-Commerce/api.js) o en **Modo Simulado** con persistencia local en `localStorage` como fallback ante cortes de red o servidores fuera de línea.

---

## 2. Descripción Detallada de Paneles y Componentes

### A. Panel del Cliente (`#panelCliente`)
Provee la experiencia comercial integral para el consumidor final:
1. **Barra Lateral de Cuenta y Categorías:**
   - Visualiza el estado de identidad del cliente con badges dinámicos: *Pendiente de Aprobación* (amarillo), *C.I. Verificado* (verde) o *C.I. Rechazado* (rojo).
   - Selector de categorías jerárquicas: *Todos*, *Hamburguesas*, *Combos*, *Acompañamientos*, *Bebidas*.
2. **Control de Acceso Comercial (Bloqueo por C.I.):**
   - Si el cliente no ha verificado su C.I. (`ci_status !== 'verified'`), los precios de los productos se difuminan con la leyenda `"Oculto - Verifica tu C.I."` y los botones de compra permanecen deshabilitados, impidiendo compras no autorizadas.
3. **Catálogo Reactivo y Buscador:**
   - Campo de búsqueda en vivo (`#txtSearch`) que filtra productos por nombre, marca o ingredientes en tiempo real.
   - Rejilla responsiva con tarjetas de producto que informan stock en almacén, precio en Bolivianos (Bs) y botón *"Agregar al Carrito"*.
4. **Modal de Checkout y Geolocalización GPS:**
   - Selector interactivo con mapa **Leaflet.js** que permite al cliente hacer clic para fijar el punto exacto de recepción.
   - Cálculo dinámico de distancia en kilómetros desde la central Sopocachi y flete logístico según la fórmula oficial:
     $$\text{Costo Envío} = 5.00\text{ Bs} + (\text{Distancia Km} \times 2.00\text{ Bs})$$
   - Selector de método de pago: *QR Bancario Simple* (con carga obligatoria de imagen de comprobante) o *Contraentrega en Efectivo*.
5. **Seguimiento de Pedido Activo en Tiempo Real:**
   - Línea de tiempo visual en 4 etapas: **1. Pendiente** $\rightarrow$ **2. Asignado** $\rightarrow$ **3. En Camino** $\rightarrow$ **4. Entregado**.
   - Mapa de tracking embebido que muestra la ubicación del cliente, la tienda y la posición en movimiento del repartidor asignado junto al ETA calculado.

---

### B. Panel del Repartidor (`#panelRider`)
Orientado a la gestión ágil de rutas y cobros en calle:
1. **Perfil del Conductor y Expediente Digital:**
   - Muestra el estado de habilitación operativa: *Pendiente*, *Aprobado* o *Rechazado*.
   - Módulo de subida de documentación obligatoria: Licencia de conducir, SOAT/Seguro vehicular y Curriculum Vitae.
   - Bloqueo operativo preventivo: Si el expediente no está aprobado por el Administrador, el sistema prohíbe la toma de pedidos retornando alertas claras.
2. **Cola de Pedidos Pendientes de Despacho:**
   - Lista dinámica que agrupa las órdenes creadas en espera de asignación.
   - Cada tarjeta desglosa el cliente, los productos a retirar, el total monetario a cobrar y el botón *"Aceptar Pedido"*.
3. **Tarjeta de Entrega Activa y Navegación GPS:**
   - Mapa interactivo con ruta trazada entre la cocina de despacho y el domicilio del cliente.
   - Indicadores de telemetría: Distancia de ruta estimada y tiempo aproximado de llegada.
   - Botón de avance de estado:
     - De *Aceptado* pasa a *"Iniciar Entrega (En Camino)"*.
     - De *En Camino* pasa a *"Finalizar Entrega (Entregado)"*.
   - Al finalizar un pedido pagado en contraentrega, el monto se acumula automáticamente en la caja física del conductor para su posterior rendición de cuentas.

---

### C. Panel del Super Usuario / Administrador (`#panelAdmin`)
Centro de mando unificado compuesto por 5 sub-paneles especializados:

```
Centro de Control Administrativo
├── 1. Aprobación C.I. & Expedientes   -> Validación documental de clientes y riders
├── 2. Control de Catálogo (CRUD)      -> Gestión de existencias, precios y altas
├── 3. Monitoreo & Caja Central        -> Mapa operativo en vivo (10s) y cierre de cajas
├── 4. Ledger de Auditoría (BMAD)      -> Bitácora inmutable de eventos del sistema
└── 5. Reporte de Ventas & Riders      -> Métricas de facturación y rankings
```

1. **Subpanel 1: Aprobación C.I. & Expedientes (`#subpanelApprovals`):**
   - Lista clientes pendientes de verificación con vista previa de imagen en modal emergente (`#fileViewerModal`).
   - Lista expedientes de repartidores con accesos directos a licencia, seguro y CV, permitiendo la aprobación o rechazo en un solo clic.
2. **Subpanel 2: Control de Catálogo CRUD (`#subpanelCatalog`):**
   - Tabla administrativa completa con badges de stock (verde para existencias normales, rojo para stock crítico).
   - Formulario de alta y edición con validación de precios positivos y stock no negativo.
   - Acciones de Edición en línea y Eliminación lógica de ítems con registro inmediato en la bitácora de auditoría.
3. **Subpanel 3: Monitoreo en Tiempo Real y Caja Central (`#subpanelMonitoring`):**
   - **Polling Automático de 10 Segundos:** Consulta periódica asíncrona que refresca la lista de pedidos en tránsito sin recargar la página.
   - **Mapa Operativo del Centro de Control:** Instancia Leaflet con capa CartoDB Dark. Representa la central con marcador morado, el cliente con marcador ámbar y el repartidor con ícono de moto 🛵 interpolado dinámicamente entre ambos puntos.
   - **Corrección de Tamaño Leaflet (`invalidateSize`):** Resuelve el problema común de renderizado en blanco al cambiar de pestañas mediante temporizadores de recalculación geométrica.
   - **Liquidación y Cierre de Cajas:** Panel financiero que lista a cada repartidor con el total de efectivo recaudado por cobrar. Al presionar *"Liquidar Caja"*, el dinero pasa a caja central y las órdenes se marcan como `liquidado`.
4. **Subpanel 4: Ledger Inmutable de Auditoría BMAD (`#subpanelAudit`):**
   - Registro cronológico detallado que expone ID, fecha y hora UTC, IP de origen, operador responsable, tabla afectada, tipo de acción (`INSERT`, `UPDATE`, `DELETE`) y comparador JSON con el estado previo y resultante.
5. **Subpanel 5: Reporte de Ventas & Desempeño (`#subpanelReports`):**
   - Tarjetas KPI: Ventas totales acumuladas en Bs, pedidos entregados y repartidores activos.
   - Gráfico comparativo de métodos de pago (Porcentaje cobrado en QR vs Porcentaje cobrado en Efectivo).
   - Tabla de rendimiento de repartidores ordenada por cantidad de entregas exitosas y recaudación.

---

### D. Componentes Globales de Navegación y Soporte
- **Selector Rápido de Cuentas (Tesina Quick Switcher - `#devQuickSwitch`):** Accesos directos de demostración para alternar instantáneamente entre Carlos (Cliente), Pedro (Rider Aprobado) y Central (Administrador).
- **Banner de Estado de Conexión (`#apiStatusText`, `#apiDot`):** Muestra si el sistema opera conectado a la API PHP Backend o en modo simulado local.
- **Sistema Centralizado de Toasts (`showToast`):** Alertas flotantes animadas con código de colores (éxito en verde, información en azul, advertencia en amarillo, peligro en rojo).

---

## 3. Manual de Pruebas Frontend (Casos de Éxito y Error)

| ID | Caso de Prueba | Entrada / Acción del Usuario | Comportamiento Esperado | Tipo | Resultado de Salida |
|---|---|---|---|---|---|
| **CP-FE-01** | Registro con menor de edad | Fecha de nacimiento menor a 18 años respecto a hoy. | Se calcula la edad, se muestra toast de advertencia y se cancela el registro. | Error | Registro bloqueado (`edad < 18`). |
| **CP-FE-02** | Navegación de cliente no verificado | Login como cliente con `ci_status = 'pending'`. | Catálogo renderiza precios como "Oculto - Verifica tu C.I." y deshabilita botones de añadir al carrito. | Éxito (Restricción) | Compra prevenida para usuarios no aprobados. |
| **CP-FE-03** | Aprobación reactiva de C.I. | Administrador presiona "Aprobar" en cliente pendiente. | Se envía petición al backend, cambia a `verified`, se actualiza el badge y se desbloquea el catálogo inmediatamente. | Éxito | Catálogo desbloqueado con precios visibles. |
| **CP-FE-04** | Selección GPS en Checkout | Clic sobre un punto en el mapa interactivo de checkout. | Se ubica el marcador, se calcula la distancia Haversine, el flete en Bs y el total final en tiempo real. | Éxito | Coordenadas y costo calculados reactivamente. |
| **CP-FE-05** | Checkout sin comprobante QR | Selecciona "QR Bancario" pero no adjunta comprobante. | El sistema detecta la ausencia del archivo de pago y detiene el envío mostrando alerta roja. | Error | Checkout retenido hasta adjuntar comprobante. |
| **CP-FE-06** | Rider no aprobado intenta aceptar | Rider con `estado_aprobacion = 'pendiente'` hace clic en "Aceptar Pedido". | El sistema despliega mensaje de restricción: "Debes estar aprobado por la administración". | Error | Asignación denegada (HTTP 403 en modo conectado). |
| **CP-FE-07** | Rider aprobado acepta orden | Rider verificado hace clic en "Aceptar Pedido". | La orden pasa a `asignado`, se descuenta el stock de la tienda y se abre el panel de navegación GPS. | Éxito | Pedido vinculado al conductor; stock restado. |
| **CP-FE-08** | Avance de entrega y cobro | Rider presiona "Iniciar Entrega" y luego "Finalizar Entrega". | El estado cambia a `en_camino` (GPS activado) y luego a `entregado`. La recaudación en efectivo suma a su caja. | Éxito | Pedido entregado y dinero registrado en caja. |
| **CP-FE-09** | Polling en Monitoreo Admin | Administrador permanece en la pestaña "Monitoreo & Caja Central". | Cada 10 segundos el sistema consulta el endpoint sin recargar la página, actualizando los repartidores en el mapa. | Éxito | Datos e interpolación de ruta actualizados. |
| **CP-FE-10** | Liquidación de caja de rider | Administrador presiona "Liquidar Caja" en rider con cobros en mano. | Se invoca `settle_cash.php`, las órdenes pasan a `liquidado`, el saldo pasa a 0.00 Bs y se emite toast verde. | Éxito | Cierre de caja conciliado en base de datos. |

# Manual de Usuario, Pruebas Operativas y Conclusiones - Tesina Técnica

## 1. Manual de Usuario Integral por Rol

La plataforma **Burger 24/7** provee interfaces ergonómicas y flujos de trabajo especializados para cada uno de los tres actores del ecosistema:

---

### A. Guía de Operación: Rol Cliente

#### 1. Registro y Validación de Mayoría de Edad
1. En la pantalla inicial, haz clic en el enlace **"Registrarme Cliente"**.
2. Completa los datos personales: Nombre completo, correo electrónico y contraseña.
3. Ingresa tu **Fecha de Nacimiento**. El sistema calculará tu edad automáticamente; debes tener 18 años o más para continuar.
4. Adjunta una fotografía clara de tu **Cédula de Identidad (C.I.)** en formato JPG, PNG o PDF.
5. Presiona **"Crear Cuenta Cliente"**. Tu cuenta quedará registrada con estado `Pendiente de Aprobación`.

#### 2. Exploración del Catálogo y Compra
1. Tras iniciar sesión, puedes explorar las hamburguesas gourmet, combos, acompañamientos y bebidas.
2. Si tu C.I. aún está pendiente de revisión por el administrador, los precios aparecerán difuminados con la leyenda `"Oculto - Verifica tu C.I."` y la compra estará bloqueada por normativa.
3. Una vez verificado tu documento, los precios se mostrarán en Bolivianos (Bs) y se habilitará el botón **"Agregar al Carrito"**.
4. Puedes filtrar productos por categoría en la barra lateral o utilizar el buscador en vivo para localizar ingredientes específicos.

#### 3. Proceso de Checkout y Geolocalización GPS
1. Abre el carrito flotante y presiona **"Proceder al Checkout"**.
2. **Selección de Ubicación:** En el mapa interactivo de La Paz (Sopocachi y alrededores), haz clic sobre tu calle o domicilio exacto. El sistema trazará la ruta desde la cocina central y calculará automáticamente:
   - La distancia geodésica exacta en kilómetros.
   - El costo de envío: $5.00\text{ Bs (base)} + (2.00\text{ Bs} \times \text{Km})$.
   - El tiempo estimado de entrega (ETA).
3. **Selección de Método de Pago:**
   - **QR Bancario:** Escanea el código QR en pantalla y transfiere desde tu app bancaria. Sube la captura de pantalla del comprobante bancario.
   - **Contraentrega en Efectivo:** Paga en efectivo al repartidor al momento de recibir tu pedido.
4. Presiona **"Confirmar y Enviar Pedido"**. El stock se reservará de manera atómica en la base de datos.

#### 4. Rastreo en Tiempo Real
1. Una vez confirmado el pedido, se activará en tu panel la tarjeta de **Seguimiento en Tiempo Real**.
2. La barra de progreso indicará la fase actual:
   - **1. Pendiente:** Pedido recibido en cocina.
   - **2. Asignado:** Un repartidor ha aceptado tu despacho.
   - **3. En Camino:** El repartidor está en tránsito hacia tu dirección (podrás ver su posición aproximada en el mapa).
   - **4. Entregado:** El pedido ha llegado a tus manos.

---

### B. Guía de Operación: Rol Repartidor (Rider)

#### 1. Postulación y Carga de Expediente Digital
1. En la pantalla inicial, haz clic en **"Postularme Repartidor"**.
2. Registra tus datos personales y carga tu expediente obligatorio:
   - Fotografía de tu **Licencia de Conducir** vigente.
   - Fotografía de tu **SOAT o Póliza de Seguro Vehicular**.
   - Archivo de tu **Curriculum Vitae (Hoja de Vida)**.
3. El expediente quedará en estado `Pendiente de Aprobación`. No podrás aceptar despachos hasta ser verificado.

#### 2. Recepción y Aceptación de Despachos
1. Una vez aprobado por la administración, accede con tus credenciales.
2. En la sección **"Pedidos Pendientes de Despacho"**, visualizarás las órdenes disponibles generadas por los clientes.
3. Cada orden informa la dirección de destino, los productos a transportar, la distancia total y la ganancia por flete.
4. Haz clic en **"Aceptar Pedido"**. La orden se vinculará a tu cuenta y se activará la ruta de navegación.

#### 3. Ejecución de la Entrega y Cobranza
1. Dirígete a la cocina central de Sopocachi para retirar el pedido ya empaquetado.
2. Presiona el botón **"Iniciar Entrega (En Camino)"**. El cliente y la central de monitoreo verán tu movimiento en el mapa.
3. Al llegar a la ubicación del cliente y entregar el paquete, presiona **"Finalizar Entrega"**.
4. Si el pedido era contraentrega, cobra el importe exacto en efectivo. El sistema registrará ese monto en tu caja personal para su posterior liquidación.

---

### C. Guía de Operación: Rol Administrador (Super Usuario)

#### 1. Verificación de Identidades y Expedientes
1. Ingresa a la subpestaña **"Aprobación C.I. & Expedientes"**.
2. En la sección de clientes, haz clic en *"Ver Documento"* para examinar el carnet de identidad. Si es legible y mayor de edad, presiona **"Aprobar"**; de lo contrario, presiona **"Rechazar"**.
3. En la sección de repartidores, revisa la licencia, seguro y CV. Al presionar **"Aprobar"**, el repartidor queda autorizado para trabajar.

#### 2. Control y Administración del Catálogo (CRUD)
1. Ingresa a la subpestaña **"Control de Catálogo (CRUD)"**.
2. **Crear Producto:** Completa el formulario con categoría, nombre, marca, descripción, precio en Bs y stock inicial. Presiona *"Guardar Producto"*.
3. **Modificar Producto:** Haz clic en *"Editar"* sobre cualquier fila de la tabla para ajustar el stock o cambiar el precio.
4. **Eliminar:** Haz clic en *"Eliminar"* para dar de baja un producto descontinuado.

#### 3. Monitoreo en Tiempo Real y Cierre de Cajas
1. Ingresa a la subpestaña **"Monitoreo & Caja Central"**.
2. **Mapa Operativo:** El mapa se actualiza automáticamente cada **10 segundos** mostrando las entregas en curso. La cocina se identifica en morado, los clientes en ámbar y los repartidores en verde con ícono de moto 🛵.
3. **Rastrear Pedido:** Haz clic en *"Rastrear en Mapa"* en cualquier tarjeta para centrar y enfocar su ruta específica.
4. **Cancelar Pedido en Contingencia:** Si un pedido sufre una contingencia antes de su despacho, presiona *"Cancelar Pedido"*. El sistema devolverá automáticamente las unidades al stock en MySQL.
5. **Liquidación de Cajas:** Cuando un repartidor entrega la recaudación física en la central, presiona **"Liquidar Caja"**. El sistema conciliará las órdenes a estado `liquidado`, liberará la caja del conductor y estampará un registro de auditoría.

#### 4. Auditoría y Reportes Financieros
1. **Ledger de Auditoría (BMAD):** Consulta la bitácora inmutable para rastrear con nombre de usuario, IP y hora cada inserción, actualización o eliminación en la plataforma.
2. **Reportes:** Revisa la facturación total acumulada, el porcentaje comparativo de recaudación (QR vs Efectivo) y el ranking de entregas por repartidor.

---

## 2. Matriz de Pruebas Operativas de Extremo a Extremo (E2E)

| Flujo Evaluado | Pasos de la Prueba | Validación Operativa | Resultado del Sistema |
|---|---|---|---|
| **E2E-01: Ciclo Completo de Compra QR** | Cliente verificado $\rightarrow$ Agrega Doble Smash al carrito $\rightarrow$ Selecciona GPS $\rightarrow$ Sube comprobante QR $\rightarrow$ Confirma pedido. | Se genera pedido en estado `esperando_pago` y `pendiente`. Se descuenta stock atómicamente. | Pedido registrado en cola de despacho con comprobante bancario. |
| **E2E-02: Ciclo Completo de Despacho y Cobro** | Rider acepta orden E2E-01 $\rightarrow$ Marca "En Camino" $\rightarrow$ Marca "Entregado". | Estado evoluciona: `asignado` $\rightarrow$ `en_camino` $\rightarrow$ `entregado`. Mapas de cliente y admin reflejan la posición interpolada. | Despacho completado con éxito; cliente satisfecho. |
| **E2E-03: Cierre Financiero de Caja Central** | Pedido contraentrega finalizado $\rightarrow$ Admin entra a Monitoreo $\rightarrow$ Visualiza saldo de 50.70 Bs del rider $\rightarrow$ Clic en "Liquidar Caja". | Se invoca `settle_cash.php`. El saldo pasa a 0.00 Bs. La orden pasa a `liquidado`. Se estampa log inmutable. | Caja física conciliada; cero descuadres de efectivo. |
| **E2E-04: Resiliencia ante Desconexión del Servidor** | Servidor web PHP se apaga $\rightarrow$ Usuario navega por la app $\rightarrow$ Intenta agregar productos o login. | `api.js` detecta fallo de red $\rightarrow$ Activa modo simulado con `localStorage` $\rightarrow$ Muestra Toast informativo. | Cero caídas de pantalla blanca; continuidad operativa garantizada. |

---

## 3. Conclusiones Técnicas y Académicas de la Tesina

El desarrollo e implementación de la plataforma **Burger 24/7** ha aportado valiosas conclusiones técnicas respecto a la ingeniería de software moderna aplicada al comercio electrónico de alta disponibilidad:

### 1. Desacoplamiento Eficiente mediante Microservicios
La separación del sistema en microservicios independientes (`Auth`, `Catalog`, `Transactions`, `Rider`, `Logistics`) superó ampliamente los problemas típicos de las arquitecturas monolíticas:
- **Independencia Funcional:** El microservicio de Catálogo puede procesar cientos de consultas por segundo de usuarios visualizando el menú sin degradar el rendimiento del microservicio transaccional de Checkout.
- **Especialización Tecnológica:** Delegar el cálculo trigonométrico geoespacial (Fórmula Haversine) a Python mientras la persistencia relacional transaccional se gestiona con PHP PDO y MySQL demostró que un enfoque políglota optimiza los recursos de cómputo en servidores cloud.

### 2. Consistencia y Prevención de Fraude con la Regla de Oro (BMAD)
En un negocio con reparto nocturno continuo, el riesgo de fraude en cajas y pérdida de inventario es crítico. La implementación del **Ledger Inmutable de Auditoría (`auditoria_logs`)** combinado con el campo `updated_by` vinculado al token JWT criptográfico proporciona:
- **No Repudio:** Ningún usuario o administrador puede modificar precios, condonar deudas o cancelar órdenes sin dejar un rastro permanente con su identidad y dirección IP.
- **Trazabilidad Completa del Inventario:** Cada hamburguesa descontada o devuelta por cancelación queda asociada a un ID de transacción y a un registro diferencial antes/después en formato JSON.

### 3. Arquitectura Resiliente en Modo Dual
La combinación de una capa de transporte HTTP inteligente ([`api.js`](file:///F:/Bebidas-E-Commerce/api.js)) con un motor de persistencia local en `localStorage` demostró ser una solución sobresaliente para entornos con conectividad inestable, permitiendo que la interfaz siga operando sin errores fatales incluso ante caídas temporales de la infraestructura central.

### 4. Líneas Futuras de Investigación y Expansión
Para futuras versiones del proyecto, se plantean las siguientes líneas de mejora:
1. **Migración de Polling a WebSockets / SSE:** Reemplazar el intervalo de polling de 10 segundos por WebSockets bidireccionales o *Server-Sent Events* para reducir aún más la sobrecarga de red y lograr latencias submétricas en el mapa operativo.
2. **Pasarelas Bancarias Automatizadas:** Integración directa mediante Webhooks con servicios de cobro QR interoperable bancario en tiempo real.
3. **Aplicación Móvil Nativa:** Empaquetar el frontend responsivo o desarrollar clientes nativos en Flutter para aprovechar los sensores de GPS en segundo plano y la cámara del dispositivo móvil de los repartidores.

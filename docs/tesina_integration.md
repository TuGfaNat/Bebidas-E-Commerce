# Manual de Integración Frontend-Backend y Catálogo de APIs - Tesina Técnica

## 1. Arquitectura de Integración (Frontend $\rightarrow$ Backend)

La comunicación entre la interfaz de usuario ([`app.js`](file:///F:/Bebidas-E-Commerce/app.js)) y los microservicios REST desplegados en PHP y Python se realiza a través de una capa centralizada y desacoplada implementada en [`api.js`](file:///F:/Bebidas-E-Commerce/api.js).

```mermaid
graph LR
    subgraph UI ["Capa UI (app.js)"]
        Components["Componentes (Catálogo, Checkout, Rider, Admin)"]
    end

    subgraph APIClient ["Capa de Abstracción de Red (api.js)"]
        Helpers["apiGet() | apiPost() | apiPut() | apiDelete()"]
        AuthInjector["Inyector JWT: Authorization: Bearer <token>"]
        UrlResolver["getApiBaseUrl() (Detección dinámica de origen)"]
    end

    subgraph DualMode ["Gestor de Conectividad y Resiliencia"]
        Switch{"¿Modo Conectado Activo?"}
        Fallback["Motor Fallback (localStorage / Mock DB)"]
    end

    subgraph Backend ["Servidor REST (PHP / Python)"]
        Microservices["Microservicios REST (Auth, Catalog, Transactions, Rider, Logistics)"]
        ResponseEnvelope["Envolvente Estándar BMAD (status, data, audit, error_details)"]
    end

    Components --> Helpers
    Helpers --> AuthInjector
    AuthInjector --> UrlResolver
    UrlResolver --> Switch
    Switch -->|Sí (Online)| Microservices
    Switch -->|No / Falla HTTP| Fallback
    Microservices --> ResponseEnvelope
    ResponseEnvelope --> Helpers
    Fallback --> Components
```

### Funciones Helper Estándar en `api.js`
- **`apiRequest(endpoint, options)`:** Núcleo asíncrono basado en la API nativa `fetch`. Resuelve la URL base, inyecta la cabecera `Authorization: Bearer <token>` obtenida de `localStorage`, formatea cuerpos JSON o `FormData` y normaliza la respuesta.
- **`apiGet(endpoint, params, options)`:** Emite peticiones HTTP GET limpiando parámetros y serializando filtros query string.
- **`apiPost(endpoint, data, options)`:** Envía cargas útiles para inserción o procesamiento transaccional.
- **`apiPut(endpoint, data, options)`:** Envía actualizaciones completas o parciales de registros.
- **`apiDelete(endpoint, params, options)`:** Solicita eliminación de recursos.

### Manejo de Modo Dual y Resiliencia ante Desconexión
La variable global `config.connectedMode` actúa como un conmutador maestro de la plataforma:
1. **Modo Conectado (`true`):** Toda acción del usuario interactúa directamente con los microservicios PHP/MySQL en el backend. Si una petición genera un error de red o el servidor se encuentra apagado, el sistema atrapa la excepción (`catch`), notifica mediante un Toast explicativo y revierte de forma transparente al modo simulado.
2. **Modo Simulado (`false`):** La plataforma opera sobre la estructura en memoria `DB`, respaldada en `localStorage`. Todas las operaciones (registro, checkout, asignación de pedidos, actualización de estados, auditoría) son 100% funcionales localmente, permitiendo evaluar y defender la tesina incluso sin servidor web activo.

---

## 2. Estándar de Respuesta Unificada BMAD

Todos los microservicios emiten sus respuestas respetando la especificación **BMAD-METHOD**:
```json
{
  "status": "success",
  "data": {
    /* Entidades u objetos retornados */
  },
  "audit": {
    "user_id": "3",
    "timestamp": "2026-09-15T05:04:04.428667+00:00",
    "action": "LIVE_MONITORING"
  },
  "error_details": null
}
```

La función `apiRequest()` normaliza esta estructura en una promesa JavaScript estándar:
```javascript
const response = await apiGet('/Catalog/catalog.php');
if (response.ok) {
    console.log("Datos recibidos:", response.data);
    console.log("Auditoría firmada:", response.envelope.audit);
} else {
    console.error("Error en petición:", response.error);
}
```

---

## 3. Catálogo Completo de Endpoints de la Plataforma

### A. Módulo de Autenticación y Cuentas (`microservices/Auth/`)

#### 1. `POST /Auth/login.php`
- **Descripción:** Autentica credenciales y genera el token Bearer JWT firmado.
- **Seguridad / Rol:** Público.
- **Body JSON:**
  ```json
  { "email": "admin@mail.com", "password": "admin" }
  ```
- **Respuesta 200 OK:**
  ```json
  {
    "status": "success",
    "data": {
      "token": "eyJhbGciOiJIUzI1Ni...",
      "user": { "id": 3, "nombre": "Admin Central", "role": "super_usuario", "email": "admin@mail.com", "ci_status": "verified" }
    },
    "audit": { "user_id": "3", "timestamp": "...", "action": "LOGIN_SUCCESS" }
  }
  ```
- **Errores:** 400 (Campos faltantes), 401 (Credenciales inválidas).

#### 2. `POST /Auth/register.php`
- **Descripción:** Registra un nuevo cliente validando mayoría de edad y subida de C.I.
- **Seguridad / Rol:** Público.
- **Body:** `multipart/form-data` con `nombre`, `email`, `password`, `fecha_nacimiento`, `ci_file` (archivo JPG/PNG/PDF).
- **Respuesta 201 Created:**
  ```json
  { "status": "success", "data": { "id": 4, "nombre": "Nuevo Cliente", "ci_status": "pending" }, "audit": { ... } }
  ```
- **Errores:** 400 (Menor de edad $\text{edad} < 18$, formato de archivo no permitido, email duplicado).

#### 3. `POST /Auth/register_rider.php`
- **Descripción:** Registra un repartidor postulante con su expediente digital.
- **Seguridad / Rol:** Público.
- **Body:** `multipart/form-data` con `nombre`, `email`, `password`, `licencia_file`, `seguro_file`, `cv_file`.
- **Respuesta 201 Created:** Cuenta creada con expediente en estado `pendiente`.

#### 4. `GET /Auth/session.php`
- **Descripción:** Restaura la sesión del usuario a partir del Bearer Token JWT activo.
- **Seguridad / Rol:** Cualquier usuario autenticado (`Bearer <token>`).
- **Respuesta 200 OK:** Perfil de usuario y estado de C.I. actualizado.

#### 5. `POST /Auth/admin_approval.php`
- **Descripción:** Aprueba o rechaza el C.I. de un cliente o el expediente de un repartidor.
- **Seguridad / Rol:** Exclusivo Administrador (`admin`, `super_usuario`).
- **Body JSON:**
  ```json
  { "tipo": "user", "id": 2, "accion": "aprobar" }
  ```
- **Respuesta 200 OK:** Estado actualizado y evento registrado en `auditoria_logs`.
- **Errores:** 401 (No autenticado), 403 (Rol insuficiente).

#### 6. `GET /Auth/connection.php`
- **Descripción:** Heartbeat de verificación de conectividad y estado de la base de datos MySQL.
- **Seguridad / Rol:** Público.
- **Respuesta 200 OK:** `{ "status": "success", "data": { "connected": true, "database": "burger_shop" } }`.

---

### B. Módulo de Catálogo e Inventario (`microservices/Catalog/`)

#### 1. `GET /Catalog/catalog.php`
- **Descripción:** Lista los productos disponibles agrupados por categoría.
- **Seguridad / Rol:** Público (con comportamiento adaptativo según C.I. del usuario).
- **Respuesta 200 OK:** Arreglo de productos con `id`, `categoria`, `nombre`, `marca`, `sabor`, `precio`, `stock`.

#### 2. `POST /Catalog/catalog.php`
- **Descripción:** Da de alta un nuevo producto en el menú comercial.
- **Seguridad / Rol:** Exclusivo Administrador (`Bearer Admin`).
- **Body JSON:**
  ```json
  { "categoria": "Hamburguesas", "nombre": "Smash Triple", "marca": "Gourmet", "sabor": "Triple carne", "precio": 35.00, "stock": 40 }
  ```
- **Respuesta 201 Created:** Producto creado con ID asignado y auditoría registrada.

#### 3. `PUT /Catalog/catalog.php`
- **Descripción:** Modifica el precio, stock o datos descriptivos de un producto existente.
- **Seguridad / Rol:** Exclusivo Administrador (`Bearer Admin`).
- **Body JSON:** `{ "id": 1, "precio": 24.00, "stock": 50 }`.
- **Respuesta 200 OK:** Producto actualizado y log diferencial en `auditoria_logs`.

#### 4. `DELETE /Catalog/catalog.php?id=X`
- **Descripción:** Elimina un producto del catálogo comercial.
- **Seguridad / Rol:** Exclusivo Administrador (`Bearer Admin`).
- **Respuesta 200 OK:** Confirmación de eliminación y log de auditoría.

---

### C. Módulo de Transacciones y Finanzas (`microservices/Transactions/`)

#### 1. `POST /Transactions/checkout.php`
- **Descripción:** Procesa la compra con descuento atómico de inventario bajo transacción SQL ACID.
- **Seguridad / Rol:** Cliente autenticado (`Bearer Cliente`).
- **Body JSON:**
  ```json
  {
    "items": [{ "producto_id": 1, "cantidad": 2 }],
    "metodo_pago": "contraentrega_efectivo",
    "latitud": -16.5100,
    "longitud": -68.1350
  }
  ```
- **Respuesta 201 Created:**
  ```json
  {
    "status": "success",
    "data": { "pedido_id": 15, "total": 49.00, "estado_pedido": "pendiente", "distancia_km": 1.2 }
  }
  ```
- **Errores:** 400 (Stock insuficiente, rollback ejecutado sin modificar el inventario).

#### 2. `POST /Transactions/cancel_order.php`
- **Descripción:** Cancela un pedido no despachado y devuelve las unidades al stock en MySQL.
- **Seguridad / Rol:** Cliente propietario o Administrador (`Bearer Token`).
- **Body JSON:** `{ "pedido_id": 15 }`.
- **Respuesta 200 OK:** Pedido cancelado y unidades devueltas al inventario.

#### 3. `GET /Transactions/live_monitoring.php`
- **Descripción:** Monitorea en tiempo real pedidos activos y liquidaciones de caja pendientes.
- **Seguridad / Rol:** Exclusivo Administrador (`Bearer Admin`).
- **Respuesta 200 OK:**
  ```json
  {
    "status": "success",
    "data": {
      "pedidos_activos": [
        {
          "id": 15,
          "estado_pedido": "en_camino",
          "cliente_nombre": "Carlos Cliente",
          "rider_nombre": "Pedro Gómez",
          "distancia_km": 1.5,
          "eta_minutos": 6,
          "posicion_rider": { "lat": -16.5075, "lon": -68.1320, "progreso": 0.5 },
          "detalles": [{ "producto_nombre": "Doble Smash", "cantidad": 2 }]
        }
      ],
      "liquidaciones_pendientes": [
        { "id": 2, "nombre": "Pedro Gómez", "total_recaudado_bs": 120.00, "pedidos_pendientes": 2 }
      ],
      "coordenadas_tienda": { "latitud": -16.5050, "longitud": -68.1290 }
    }
  }
  ```

#### 4. `GET /Transactions/report.php`
- **Descripción:** Consolida métricas de facturación mensual, métodos de pago y ranking de repartidores.
- **Seguridad / Rol:** Exclusivo Administrador (`Bearer Admin`).

---

### D. Módulo de Repartidores (`microservices/Rider/`)

#### 1. `GET /Rider/assignment.php`
- **Descripción:** Lista los pedidos en espera de asignación disponibles para despacho.
- **Seguridad / Rol:** Repartidor Aprobado (`Bearer Rider`).

#### 2. `POST /Rider/assignment.php`
- **Descripción:** El repartidor acepta un pedido pendiente.
- **Seguridad / Rol:** Repartidor Aprobado (`Bearer Rider`).
- **Body JSON:** `{ "pedido_id": 15 }`.
- **Respuesta 200 OK:** Pedido vinculado al conductor (`estado_pedido = 'asignado'`).

#### 3. `PUT /Rider/delivery.php`
- **Descripción:** Actualiza la etapa del despacho (`en_camino` $\rightarrow$ `entregado`).
- **Seguridad / Rol:** Repartidor asignado a la orden (`Bearer Rider`).
- **Body JSON:** `{ "pedido_id": 15, "nuevo_estado": "en_camino" }`.
- **Respuesta 200 OK:** Transición de estado completada.

#### 4. `POST /Rider/settle_cash.php`
- **Descripción:** Liquida y concilia el dinero en efectivo recaudado por un repartidor.
- **Seguridad / Rol:** Exclusivo Administrador (`Bearer Admin`).
- **Body JSON:** `{ "rider_id": 2 }`.
- **Respuesta 200 OK:** Órdenes marcadas como `liquidado` y saldo de caja en cero.

---

## 4. Manual de Pruebas de Integración (Casos de Éxito y Error)

| ID | Endpoint Evaluado | Parámetros Enviados | Simulación / Prueba | Código HTTP | Resultado de Integración |
|---|---|---|---|---|---|
| **CP-INT-01** | `GET /Auth/connection.php` | Ninguno. | Petición de comprobación de servidor en línea. | 200 OK | Banner verde: "Modo Conectado (PHP Server)". |
| **CP-INT-02** | Detección de caída de servidor | Servidor web apagado o puerto inaccesible. | `apiGet()` intercepta error de red `fetch`. | Fallback Local | Toast informativo; alternancia transparente a modo simulado. |
| **CP-INT-03** | `POST /Auth/login.php` | Password errónea. | Verificación de clave con hash Bcrypt. | 401 Unauthorized | Toast rojo: "Credenciales inválidas". No se almacena token. |
| **CP-INT-04** | `GET /live_monitoring.php` | Token de usuario cliente. | Evaluación de rol en middleware de seguridad. | 403 Forbidden | Acceso denegado. Panel de monitoreo protegido. |
| **CP-INT-05** | `POST /Transactions/checkout.php` | Items con stock disponible + coordenadas GPS. | Transacción ACID: despiece, bloqueo y reserva. | 201 Created | Pedido generado; stock disminuido; tracking activado en mapa. |
| **CP-INT-06** | `POST /Transactions/checkout.php` | Cantidad mayor al stock físico existente. | Validación de balance de inventario en MySQL. | 400 Bad Request | Rollback automático; alerta: "Stock insuficiente". |
| **CP-INT-07** | Polling continuo de 10 segundos | Administrador en pestaña de Monitoreo. | Invocaciones periódicas transparentes a `live_monitoring.php`. | 200 OK | Actualización en vivo de posiciones GPS sin parpadeo del DOM. |
| **CP-INT-08** | `POST /Rider/settle_cash.php` | Rider ID con 3 pedidos cobrados en efectivo. | Cierre de caja central y conciliación bancaria. | 200 OK | Pedidos pasan a `liquidado`; total recaudado en panel pasa a 0.00 Bs. |

# Sistema E-commerce Burger 24/7 (Arquitectura de Despliegue y Microservicios)

## 1. Visión General del Proyecto
Plataforma integral de comercio electrónico de comida rápida y despacho continuo (24 horas, 7 días a la semana) con verificación estricta de identidad (KYC), geolocalización en tiempo real y logística multiactor coordinada (Cliente, Rider / Repartidor, Administrador / Central), orientada a despliegue directo en servidor web de producción.

---

## 2. Stack Tecnológico Obligatorio (Arquitectura de Producción)
El sistema implementa una arquitectura orientada a despliegue en servidor web Apache y base de datos relacional, donde cada componente cumple un rol técnico específico, justificado y no negociable:

1. **Backend Core — PHP (8.2+ con extensión PDO):**
   - Microservicios RESTful transaccionales y de negocio ejecutados directamente bajo el servidor web:
     - `Auth`: Autenticación segura, registro, control de sesiones, emisión y validación de tokens JWT (HMAC-SHA256) y RBAC.
     - `Catalog`: Gestión del catálogo jerárquico de productos, categorías, saneamiento de datos e inventario.
     - `Transactions`: Procesamiento transaccional de órdenes (`checkout.php`), liquidación financiera, generación de recibos digitales y control de pagos (QR y efectivo).
     - `Rider`: Gestión de expedientes, asignación logística de pedidos, confirmación de entregas y arqueo de caja.
   - Persistencia relacional mediante PDO con sentencias preparadas y transacciones ACID.
   - Suite de pruebas de integración E2E nativa (`tests/test_e2e_suite.php`) y script de diagnóstico de despliegue (`check_deploy.php`).

2. **Módulo Crítico de Rendimiento — C++ (C++17):**
   - Motor nativo compilado de alto rendimiento (`cpp/motor_core.exe`, código fuente en `cpp/motor_core.cpp`).
   - Tareas de cómputo intensivo desacopladas de la capa de scripting web:
     - Cálculo geodésico ultra rápido de distancias (fórmulas Haversine y euclidiana).
     - Algoritmo de tarificación dinámica de envíos con recargos por distancia en tiempo real.
     - Validación atómica de existencias físicas de stock bajo alta concurrencia transaccional.
   - Comunicación de baja latencia con PHP mediante tuberías seguras (`proc_open` STDIN/STDOUT) con paso de datos en JSON estructurado y latencia de ejecución menor a 150 µs.

3. **Frontend — JavaScript (ES6+), HTML5 Semántico y CSS3 Moderno:**
   - Single Page Application (SPA) interactiva, modular y con diseño moderno Glassmorphism adaptativo.
   - Integración de mapas dinámicos en tiempo real con Leaflet.js y capas CartoDB Dark Matter.
   - Capa cliente desacoplada (`api.js`) para consumo asíncrono de APIs REST directamente contra el servidor web.

4. **Base de Datos — SQL / MySQL (8.0+ / MariaDB):**
   - Motor relacional InnoDB con integridad referencial (claves foráneas) y normalización 3FN.
   - Control estricto de concurrencia mediante bloqueos pesimistas (`SELECT ... FOR UPDATE`) para prevenir condiciones de carrera en stock.
   - Trazabilidad y auditoría obligatoria en todas las tablas del modelo de datos (`burger_shop`).

5. **Servidor Web — Apache HTTP Server (2.4+):**
   - Servidor HTTP de producción con módulo `mod_rewrite` y control de acceso.
   - Protección perimetral `.htaccess` en directorios de subida (`uploads/`) con bloqueo estricto contra ejecución de scripts (Anti-RCE).

---

## 3. Arquitectura y Auditoría (Regla de Oro)
Todas las tablas de la base de datos y los objetos de respuesta deben incluir campos obligatorios de trazabilidad:
- `created_at`: Fecha y hora de creación del registro (formato ISO-8601 o timestamp SQL).
- `updated_at`: Fecha y hora de última modificación.
- `created_by`: Identificador del usuario/actor que originó el registro.
- `updated_by`: Identificador del usuario/actor que modificó el registro.

Adicionalmente, el sistema mantiene un registro centralizado e inmutable de eventos (`audit_logs`) para auditar autenticaciones, aprobaciones administrativas, cambios de estado en pedidos y liquidaciones.

---

## 4. Protocolo de Devolución de Código y Estándares de Entrega
Todo desarrollo en el sistema debe seguir estrictamente los siguientes estándares:

1. **Lógica Backend (PHP / C++):**
   Debe devolver obligatoriamente un objeto JSON estructurado con el envolvente estándar BMAD:
   ```json
   {
     "status": "success | error",
     "data": { "resultado_de_la_operacion" },
     "audit": { "user_id": "ID", "timestamp": "ISO-8601" },
     "error_details": null
   }
   ```

2. **Módulo de Alto Rendimiento (C++):**
   - Código C++17 limpio, robusto y portable.
   - I/O estandarizado mediante streams JSON por STDIN/STDOUT.
   - Códigos de salida (`exit code`) predecibles (0 para éxito, 1 para validaciones de negocio fallidas, 2 para errores de sintaxis/payload).

3. **Frontend (HTML5 / CSS3 / JavaScript):**
   - Código modular con separación de responsabilidades y diseño responsivo sin dependencias pesadas innecesarias.
   - Clases CSS semánticas y variables de diseño unificadas.

4. **Base de Datos (SQL):**
   - Scripts idempotentes y autoejecutables con validación `IF NOT EXISTS`.
   - Índices para optimización de consultas concurrentes y claves foráneas con reglas de integridad claras.

---

## 5. Estructura de Documentación Técnica (Entregables del Sistema)
Para cada módulo o funcionalidad desarrollada, se debe mantener y actualizar la documentación técnica de ingeniería siguiendo esta jerarquía:

1. **Título del Módulo:** Nombre funcional y archivo/binario asociado.
2. **Descripción Técnica y Justificación:** Propósito del código, lenguaje utilizado y cómo cumple con el requerimiento de la arquitectura.
3. **Diagrama de Flujo / Lógica:** Explicación paso a paso del proceso algorítmico o transaccional (Mermaid o diagrama de secuencia).
4. **Diccionario de Datos y Contratos:** Definición de variables, tipos, payloads JSON, endpoints y tablas afectadas.
5. **Manual de Pruebas y Resiliencia:** Casos de éxito, pruebas de límites y manejo de errores (ej. stock agotado, C.I. no legible, credenciales inválidas).

---

## 6. Definición de Usuarios y Flujos Operativos
1. **Cliente:**
   - Registro manual y autenticación OAuth simulada.
   - Subida y verificación de C.I. / documento de identidad.
   - Navegación por catálogo jerárquico de hamburguesas, combos y bebidas.
   - Carrito de compras, cálculo dinámico de tarifa de envío con el motor C++ y checkout con pagos QR/efectivo.
   - Emisión de recibo digital imprimible y seguimiento de orden por GPS.

2. **Rider (Repartidor):**
   - Expediente digital completo (Licencia, C.I., Currículum, SOAT).
   - Aprobación administrativa previa para operar.
   - Gestión y aceptación de pedidos disponibles en su zona.
   - Navegación asistida por mapa GPS en tiempo real.
   - Cobro en efectivo, confirmación de entrega y liquidación de caja.

3. **Super Usuario / Administrador Central:**
   - CRUD integral de usuarios, productos, categorías y pedidos.
   - Monitoreo en vivo de repartidores y órdenes en mapa interactivo.
   - Revisión, aprobación y rechazo de documentos y expedientes de riders y clientes.
   - Registro histórico y visor de logs de auditoría global del sistema.

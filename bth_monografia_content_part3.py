# -*- coding: utf-8 -*-
"""
Módulo de Contenido de la Monografía BTH 2026 - Parte 3
Contiene: Capítulos VIII al XIV, Anexos, y Diagramas Mermaid completos del Sistema.
"""

CAPITULO_VIII = {
    "titulo": "VIII. MARCO PROCEDIMENTAL",
    "secciones": [
        {
            "subtitulo": "8.1 PROPUESTA DE INNOVACIÓN",
            "contenido": (
                "La propuesta de innovación del presente proyecto radica en la creación de un ecosistema tecnológico integral, autónomo y de soberanía propia para la empresa gastronómica nocturna 'Burger 24/7' en La Paz. La innovación se articula en cuatro ejes transformadores:\n\n"
                "1. Independencia Económica Frente a Plataformas Intermediarias: Elimina la dependencia de agregadores comerciales transnacionales (cuyas comisiones de hasta 30% estrangulan a las microempresas locales), recuperando la totalidad del margen de utilidad y canalizando los pedidos directamente a cocina en tiempo real sin recargos ocultos.\n\n"
                "2. Transaccionalidad Concurrente Inmune a Sobreventas: A diferencia de los pedidos informales por WhatsApp o tiendas web básicas que no bloquean inventario en base de datos, el sistema implementa un motor transaccional con aislamiento ACID y bloqueo pesimista a nivel de tupla (`SELECT ... FOR UPDATE`), garantizando que la última hamburguesa en stock sea adjudicada de forma determinista al primer comprador, evitando la frustración del comensal.\n\n"
                "3. Conciliación Criptográfica y Pasarela Simple QR: Sustituye la verificación visual empírica de capturas de pantalla bancarias por un flujo digital que asocia de forma unívoca el comprobante bancario al ID de orden en la base de datos, requiriendo validación en el panel administrativo antes del despacho.\n\n"
                "4. Tarificación Geodésica Automatizada por Haversine: Implementa un servicio de cálculo matemático en Python que determina la distancia física real entre la cocina en Sopocachi y el domicilio del cliente, calculando tarifas justas y transparentes tanto para el consumidor como para el repartidor.\n\n"
                "5. Arqueo Ciego y Expediente Laboral de Riders: Introduce un mecanismo de control de caja donde el repartidor declara el efectivo recaudado al final de su turno sin conocer previamente el monto del sistema, previniendo descuadres y consolidando la doble confirmación administrativa."
            )
        },
        {
            "subtitulo": "8.2 RESULTADOS ESPERADOS",
            "contenido": (
                "Con la implementación del sistema informático Burger 24/7, se establecieron metas operativas y cuantitativas medibles:\n\n"
                "• Reducción del 100% en incidencias de sobreventa de productos por compras simultáneas en horarios pico.\n\n"
                "• Disminución del tiempo promedio de recepción y confirmación de comandas de 12 minutos (vía chat manual) a menos de 45 segundos (mediante interfaz web reactiva y automatizada).\n\n"
                "• Reducción a 0% de pérdidas económicas por comprobantes falsificados o clonados del sistema interbancario Simple QR.\n\n"
                "• Exactitud del 100% en el cálculo de distancias de envío y liquidación de costos de combustible para la flota de repartidores.\n\n"
                "• Cero discrepancias en el arqueo y cierre ciego de caja chica en efectivo entre repartidores y administración general.\n\n"
                "• Incremento proyectado del 35% en el volumen mensual de órdenes procesadas gracias a la disponibilidad ininterrumpida 24/7 de la plataforma."
            )
        }
    ]
}

CAPITULO_IX = {
    "titulo": "IX. METODOLOGÍA",
    "secciones": [
        {
            "subtitulo": "9.1 TIPO DE INVESTIGACIÓN",
            "contenido": (
                "La presente monografía se enmarca en la Investigación Aplicada, Tecnológica y Descriptiva con enfoque experimental/propositivo:\n\n"
                "• Aplicada: Porque no se limita a la especulación conceptual o teórica, sino que utiliza conocimientos consolidados de las ciencias de la computación e ingeniería de software para resolver una problemática económica y operativa real y concreta en el sector productivo de La Paz.\n\n"
                "• Descriptiva: Describe de manera minuciosa las características de los procesos de negocio gastronómicos nocturnos, los cuellos de botella en la gestión de pedidos, los flujos transaccionales y los requisitos técnicos de seguridad y concurrencia.\n\n"
                "• Tecnológica y Experimental: Involucra el diseño, codificación, prueba y verificación de un artefacto informático funcional (software), sometiéndolo a pruebas de estrés transaccional, simulación de concurrencia y validación en un entorno controlado."
            )
        },
        {
            "subtitulo": "9.2 TÉCNICAS E INSTRUMENTOS DE RECOLECCIÓN DE DATOS",
            "contenido": (
                "Para el levantamiento de información y modelado de requerimientos se emplearon tres técnicas fundamentales:\n\n"
                "1. Entrevistas Estructuradas: Realizadas a los propietarios de Burger 24/7, personal de cocina y repartidores urbanos, permitiendo identificar los puntos críticos en el despacho nocturno, la recepción de comprobantes QR y las quejas recurrentes de clientes por demoras.\n\n"
                "2. Observación Directa y Análisis de Procesos: Seguimiento presencial del flujo de preparación de comandas y coordinación de repartos durante tres jornadas nocturnas de fin de semana (viernes a domingo entre las 21:00 y las 04:00 horas), cuantificando tiempos muertos, extravío de comprobantes y errores de cálculo manual en tarifas de envío.\n\n"
                "3. Análisis Documental y Normativo: Revisión exhaustiva de la legislación boliviana sobre comercio electrónico (Ley 164), normativas ASFI para pagos móviles Simple, y especificaciones técnicas de estándares internacionales (RFC 7519 para JWT, estándar EMVCo para QR y especificación W3C para APIs web)."
            )
        }
    ]
}

CAPITULO_X = {
    "titulo": "X. METODOLOGÍA DE DESARROLLO DE SOFTWARE",
    "secciones": [
        {
            "subtitulo": "10.1 ANÁLISIS",
            "contenido": (
                "El análisis de requerimientos del sistema se estructuró bajo el paradigma ágil con enfoque BTH, formalizando las necesidades funcionales y de calidad de la plataforma:\n\n"
                "A. Requerimientos Funcionales (RF):\n"
                "• RF-01 (Catálogo y Menú Digital): El sistema debe desplegar el menú de productos organizado por categorías (Hamburguesas, Bebidas, Combos, Extras) con precios en Bolivianos, imágenes, descripción y stock disponible en tiempo real.\n"
                "• RF-02 (Carrito de Compras Persistente): El sistema debe permitir agregar, modificar cantidades y eliminar productos en un carrito interactivo, persistiendo su estado incluso ante recargas de página.\n"
                "• RF-03 (Geolocalización del Cliente): El sistema debe capturar las coordenadas de entrega del cliente mediante geolocalización GPS del navegador o selección interactiva sobre mapa cartográfico.\n"
                "• RF-04 (Cálculo Geodésico de Envío): El sistema debe calcular la distancia ortodrómica exacta hacia Sopocachi y aplicar la tarifa de entrega automatizada con recargo nocturno.\n"
                "• RF-05 (Checkout y Bloqueo Transaccional): El sistema debe procesar la compra mediante una transacción atómica ACID, adquiriendo bloqueo pesimista (`SELECT ... FOR UPDATE`) sobre el stock.\n"
                "• RF-06 (Pago por Código QR): El sistema debe presentar el código QR dinámico de la empresa y permitir adjuntar la captura del comprobante bancario para validación.\n"
                "• RF-07 (Pago Contra Entrega en Efectivo): El sistema debe registrar pedidos para pago en efectivo, indicando el monto exacto con el que cancelará el cliente para el cálculo del cambio.\n"
                "• RF-08 (Seguimiento de Pedido en Tiempo Real): El cliente debe poder monitorear el estado evolutivo de su orden (`pendiente_pago`, `pagado`, `en_preparacion`, `en_camino`, `entregado`).\n"
                "• RF-09 (Registro y Expediente de Repartidores): Los repartidores deben poder registrarse subiendo obligatoriamente su Cédula de Identidad (C.I.) y datos de contacto.\n"
                "• RF-10 (Aprobación Administrativa de Repartidores): El administrador debe revisar y aprobar o rechazar documentalmente a los nuevos repartidores antes de que puedan recibir asignaciones.\n"
                "• RF-11 (Asignación y Ruta de Despacho): El repartidor debe visualizar órdenes disponibles, aceptar un pedido, consultar la ruta de navegación en mapa y marcar la entrega efectiva.\n"
                "• RF-12 (Arqueo Ciego de Caja Chica): El repartidor debe declarar el dinero recaudado en efectivo al concluir su turno sin ver el total calculado por el sistema, requiriendo confirmación administrativa.\n"
                "• RF-13 (Gestión de Catálogo CRUD): Los administradores deben poder crear, editar precios, actualizar existencias y dar de baja lógica productos del menú.\n"
                "• RF-14 (Monitoreo Transaccional en Vivo): El panel de administración debe refrescar automáticamente cada 10 segundos el flujo de pedidos activos y estado de cocina.\n"
                "• RF-15 (Ledger de Auditoría Inmutable): Toda acción de negocio debe quedar registrada de forma inalterable en `auditoria_logs` con IP, timestamp UTC y detalles del cambio.\n\n"
                "B. Requerimientos No Funcionales (RNF):\n"
                "• RNF-01 (Seguridad y Criptografía): Las contraseñas deben cifrarse con Bcrypt (costo 12) y las sesiones autenticarse mediante tokens JWT con firma HMAC-SHA256.\n"
                "• RNF-02 (Rendimiento y Latencia): El tiempo de respuesta de los endpoints de la API REST no debe superar los 200 milisegundos bajo carga normal de red local.\n"
                "• RNF-03 (Concurrencia e Integridad): El sistema debe soportar transacciones concurrentes simultáneas sin generar sobreventas ni corromper saldos de inventario.\n"
                "• RNF-04 (Diseño Responsivo): La interfaz de usuario debe adaptarse fluidamente a dispositivos móviles (smartphones), tabletas y computadoras de escritorio (Mobile First).\n"
                "• RNF-05 (Resiliencia Offline): En caso de caída temporal del backend, el frontend debe mantener los datos esenciales del usuario en almacenamiento local (`localStorage`)."
            )
        },
        {
            "subtitulo": "10.2 DISEÑO",
            "contenido": (
                "El diseño del sistema se formalizó a través de diagramas estandarizados en modelado C4, Diagrama Entidad-Relación (DER), diagramas de secuencia y máquinas de estados, especificados en sintaxis Mermaid para su visualización y renderizado interactivo."
            )
        }
    ]
}

MERMAID_DIAGRAMS = [
    {
        "id": "diagrama_c4_contexto",
        "numero": "10.1",
        "titulo": "Diagrama C4 Nivel 1: Contexto del Sistema Burger 24/7",
        "descripcion": "Ilustra a los usuarios (Cliente, Repartidor, Administrador), el sistema central Burger 24/7 y las interacciones con sistemas externos (Servicio Cartográfico OpenStreetMap y Red Bancaria Simple QR).",
        "mermaid": (
            "graph TD\n"
            "    UserCliente[\"👤 Cliente Paceño<br/>(Navegador Móvil/Desktop)\"]\n"
            "    UserRider[\"🛵 Repartidor / Rider<br/>(Smartphone Android/iOS)\"]\n"
            "    UserAdmin[\"👨‍💼 Administrador / Cocina<br/>(Centro de Control)\"]\n\n"
            "    SystemBurger[\"🍔 Sistema Web Burger 24/7<br/>(Plataforma E-Commerce & Despacho)\"]\n\n"
            "    ExtMaps[\"🗺️ OpenStreetMap / Leaflet<br/>(Servicio Cartográfico CartoDB)\"]\n"
            "    ExtBank[\"🏦 Ecosistema Simple QR / Bancos<br/>(Interoperabilidad Bancaria Bolivia)\"]\n\n"
            "    UserCliente -->|\"Explora menú, compra y envía comprobante QR\"| SystemBurger\n"
            "    UserRider -->|\"Acepta despachos, navega ruta y liquida efectivo\"| SystemBurger\n"
            "    UserAdmin -->|\"Gestiona inventario, aprueba riders y audita ventas\"| SystemBurger\n\n"
            "    SystemBurger -->|\"Consulta georreferenciación y mosaicos de mapas\"| ExtMaps\n"
            "    SystemBurger -->|\"Valida comprobantes de pago interbancario\"| ExtBank"
        )
    },
    {
        "id": "diagrama_c4_contenedores",
        "numero": "10.2",
        "titulo": "Diagrama C4 Nivel 2: Contenedores y Microservicios del Sistema",
        "descripcion": "Desglosa la arquitectura en capas: Frontend SPA, Capa de Red y Seguridad, Microservicios REST (Auth, Catalog, Transactions, Rider, Logistics) y Capa de Persistencia.",
        "mermaid": (
            "graph TD\n"
            "    subgraph Frontend [\"Capa Cliente (Frontend SPA Vanilla JS ES6+)\"]\n"
            "        UI_Client[\"Portal Cliente<br/>(Catálogo, Carrito, Tracking)\"]\n"
            "        UI_Rider[\"Portal Rider<br/>(Expediente, Despachos, Caja)\"]\n"
            "        UI_Admin[\"Control Admin<br/>(Aprobaciones, Monitoreo, Auditoría)\"]\n"
            "        APILayer[\"api.js<br/>(Fetch REST & Fallback LocalStorage)\"]\n"
            "    end\n\n"
            "    subgraph Gateway [\"Capa de Seguridad & Gateway\"]\n"
            "        JWTAuth[\"Bearer JWT Token (HMAC-SHA256)<br/>+ Cabeceras CORS\"]\n"
            "    end\n\n"
            "    subgraph Microservicios [\"Capa de Microservicios REST (PHP 8.2 & Python 3.11)\"]\n"
            "        MS_Auth[\"Microservicio Auth<br/>(Login, Register, Upload CI, Approve)\"]\n"
            "        MS_Catalog[\"Microservicio Catalog<br/>(CRUD Productos, Categorías)\"]\n"
            "        MS_Trans[\"Microservicio Transactions<br/>(Checkout ACID, FOR UPDATE, Cancel)\"]\n"
            "        MS_Rider[\"Microservicio Rider<br/>(Asignación, Estado Ruta, Settle Cash)\"]\n"
            "        MS_Logistics[\"Microservicio Logistics<br/>(calculator.py - Haversine Geodésico)\"]\n"
            "    end\n\n"
            "    subgraph Persistencia [\"Capa de Datos & Almacenamiento\"]\n"
            "        MySQL[(\"MySQL / MariaDB 8.0<br/>Motor InnoDB (3FN Relacional)\")]\n"
            "        Storage[\"Almacenamiento Seguro<br/>(/uploads/ci/, /uploads/qr/)\"]\n"
            "        Ledger[(\"Ledger Inmutable<br/>(auditoria_logs)\")]\n"
            "    end\n\n"
            "    UI_Client --> APILayer\n"
            "    UI_Rider --> APILayer\n"
            "    UI_Admin --> APILayer\n\n"
            "    APILayer --> JWTAuth\n"
            "    JWTAuth --> MS_Auth\n"
            "    JWTAuth --> MS_Catalog\n"
            "    JWTAuth --> MS_Trans\n"
            "    JWTAuth --> MS_Rider\n"
            "    JWTAuth --> MS_Logistics\n\n"
            "    MS_Auth --> MySQL\n"
            "    MS_Auth --> Storage\n"
            "    MS_Catalog --> MySQL\n"
            "    MS_Trans --> MySQL\n"
            "    MS_Trans --> Ledger\n"
            "    MS_Rider --> MySQL\n"
            "    MS_Rider --> Ledger\n"
            "    MS_Logistics -.-> MS_Trans"
        )
    },
    {
        "id": "diagrama_der_relacional",
        "numero": "10.3",
        "titulo": "Diagrama Entidad-Relación (DER) Físico Normalizado en 3FN",
        "descripcion": "Estructura de las tablas principales de la base de datos MySQL, sus atributos de clave primaria (PK), foránea (FK), restricciones y cardinalidad de relaciones.",
        "mermaid": (
            "erDiagram\n"
            "    USERS ||--o{ PEDIDOS : \"realiza\"\n"
            "    USERS ||--o{ CAJAS : \"opera\"\n"
            "    USERS ||--o{ AUDITORIA_LOGS : \"ejecuta\"\n"
            "    CATEGORIAS ||--o{ PRODUCTOS : \"contiene\"\n"
            "    PEDIDOS ||--|{ PEDIDO_ITEMS : \"desglosa\"\n"
            "    PRODUCTOS ||--o{ PEDIDO_ITEMS : \"incluye\"\n"
            "    USERS ||--o{ PEDIDOS : \"despacha_rider\"\n"
            "    CAJAS ||--o{ MOVIMIENTOS_CAJA : \"registra\"\n\n"
            "    USERS {\n"
            "        int id PK\n"
            "        string nombre\n"
            "        string email UK\n"
            "        string password_hash\n"
            "        string role\n"
            "        string ci_url\n"
            "        string ci_status\n"
            "        timestamp created_at\n"
            "    }\n\n"
            "    CATEGORIAS {\n"
            "        int id PK\n"
            "        string nombre\n"
            "        string descripcion\n"
            "        boolean activo\n"
            "    }\n\n"
            "    PRODUCTOS {\n"
            "        int id PK\n"
            "        int categoria_id FK\n"
            "        string nombre\n"
            "        decimal precio\n"
            "        int stock\n"
            "        boolean activo\n"
            "    }\n\n"
            "    PEDIDOS {\n"
            "        int id PK\n"
            "        int user_id FK\n"
            "        int rider_id FK\n"
            "        decimal total\n"
            "        decimal costo_envio\n"
            "        string metodo_pago\n"
            "        string estado\n"
            "        string comprobante_pago_url\n"
            "        decimal latitud\n"
            "        decimal longitud\n"
            "        timestamp created_at\n"
            "    }\n\n"
            "    PEDIDO_ITEMS {\n"
            "        int id PK\n"
            "        int pedido_id FK\n"
            "        int producto_id FK\n"
            "        int cantidad\n"
            "        decimal precio_unitario\n"
            "        decimal subtotal\n"
            "    }\n\n"
            "    CAJAS {\n"
            "        int id PK\n"
            "        int rider_id FK\n"
            "        decimal saldo_inicial\n"
            "        decimal total_efectivo_recaudado\n"
            "        decimal total_declarado_rider\n"
            "        string estado\n"
            "        timestamp fecha_cierre\n"
            "    }\n\n"
            "    AUDITORIA_LOGS {\n"
            "        int id PK\n"
            "        int user_id FK\n"
            "        string accion\n"
            "        string entidad\n"
            "        int entidad_id\n"
            "        text detalles\n"
            "        string ip_address\n"
            "        timestamp created_at\n"
            "    }"
        )
    },
    {
        "id": "diagrama_secuencia_checkout",
        "numero": "10.4",
        "titulo": "Diagrama de Secuencia: Checkout Concurrente con Bloqueo ACID y Pago QR",
        "descripcion": "Detalla el intercambio de mensajes entre Cliente, Frontend, API Gateway, Microservicio Transactions, MySQL (InnoDB FOR UPDATE) y el Ledger de Auditoría.",
        "mermaid": (
            "sequenceDiagram\n"
            "    autonumber\n"
            "    actor Cliente as 👤 Cliente\n"
            "    participant FE as 💻 Frontend (cart.js)\n"
            "    participant GW as 🛡️ API Gateway (Bearer JWT)\n"
            "    participant TX as ⚙️ MS Transactions (checkout.php)\n"
            "    participant DB as 🗄️ MySQL (InnoDB Engine)\n"
            "    participant AUD as 📝 Ledger Auditoría\n\n"
            "    Cliente->>FE: Confirma pedido y presiona 'Pagar con QR'\n"
            "    FE->>GW: POST /api/transactions/checkout (payload + token)\n"
            "    GW->>TX: Valida Bearer JWT y reenvía petición\n"
            "    TX->>DB: $pdo->beginTransaction()\n"
            "    Note over TX,DB: Adquisición de Bloqueo Pesimista Exclusivo\n"
            "    TX->>DB: SELECT stock FROM productos WHERE id IN (...) FOR UPDATE\n"
            "    DB-->>TX: Retorna stock actual protegido contra lecturas sucias\n"
            "    alt Stock Insuficiente en algún ítem\n"
            "        TX->>DB: $pdo->rollBack()\n"
            "        TX-->>FE: HTTP 400 (BMAD Error: 'Stock no disponible')\n"
            "        FE-->>Cliente: Notifica producto agotado y actualiza carrito\n"
            "    else Stock Válido y Suficiente\n"
            "        TX->>DB: UPDATE productos SET stock = stock - ? WHERE id = ?\n"
            "        TX->>DB: INSERT INTO pedidos (user_id, total, estado='pendiente_pago', ...)\n"
            "        TX->>DB: INSERT INTO pedido_items (pedido_id, producto_id, cantidad, ...)\n"
            "        TX->>AUD: INSERT INTO auditoria_logs ('CHECKOUT_CREATED', order_id)\n"
            "        TX->>DB: $pdo->commit()\n"
            "        TX-->>FE: HTTP 201 (BMAD Success: order_id, total, QR_string)\n"
            "        FE-->>Cliente: Despliega Código QR dinámico Simple para escaneo\n"
            "        Cliente->>FE: Carga foto del comprobante bancario emitido\n"
            "        FE->>GW: POST /api/transactions/upload-voucher (order_id, file)\n"
            "        GW->>TX: Guarda imagen y actualiza estado = 'pagado'\n"
            "        TX-->>FE: Pedido confirmado exitosamente\n"
            "    end"
        )
    },
    {
        "id": "diagrama_estados_pedido",
        "numero": "10.5",
        "titulo": "Diagrama de Máquina de Estados: Ciclo de Vida del Pedido",
        "descripcion": "Modela las transiciones válidas de un pedido comercial desde su creación hasta su entrega exitosa o cancelación con reintegro automático de inventario.",
        "mermaid": (
            "stateDiagram-v2\n"
            "    [*] --> Creado : Cliente envía carrito de compras\n"
            "    Creado --> PendientePago : Stock bloqueado (FOR UPDATE)\n"
            "    \n"
            "    PendientePago --> Pagado : Cliente adjunta comprobante QR o selecciona Efectivo\n"
            "    PendientePago --> Cancelado : Expiración de tiempo (Timeout) o cancelación\n"
            "    \n"
            "    Pagado --> EnPreparacion : Cocina acepta comanda en pantalla\n"
            "    Pagado --> Cancelado : Administrador rechaza comprobante inválido\n"
            "    \n"
            "    EnPreparacion --> ListoDespacho : Cocina finaliza empaque de alimentos\n"
            "    ListoDespacho --> EnCamino : Repartidor (Rider) asignado retira pedido\n"
            "    \n"
            "    EnCamino --> Entregado : Rider entrega comida al comensal y cobra\n"
            "    EnCamino --> NoEntregado : Domicilio inaccesible / No contesta\n"
            "    \n"
            "    Cancelado --> [*] : Reintegro de stock inmediato (Rollback/Update)\n"
            "    NoEntregado --> [*] : Registro de incidencia en auditoría\n"
            "    Entregado --> [*] : Fondos asignados a arqueo de caja chica"
        )
    },
    {
        "id": "diagrama_estados_caja",
        "numero": "10.6",
        "titulo": "Diagrama de Máquina de Estados: Arqueo y Cierre Ciego de Caja Chica",
        "descripcion": "Ilustra el proceso de control financiero de los cobros en efectivo realizados por los repartidores, garantizando el cuadre exacto sin información sesgada.",
        "mermaid": (
            "stateDiagram-v2\n"
            "    [*] --> CajaCerrada\n"
            "    CajaCerrada --> CajaAbierta : Rider inicia turno con fondo de cambio (Bs. 50.00)\n"
            "    \n"
            "    state CajaAbierta {\n"
            "        [*] --> AcumulandoRecaudacion\n"
            "        AcumulandoRecaudacion --> CobroEfectivoRegistrado : Entrega pedido en efectivo\n"
            "        CobroEfectivoRegistrado --> AcumulandoRecaudacion : Sistema suma monto a saldo teórico\n"
            "    }\n"
            "    \n"
            "    CajaAbierta --> EnArqueoCiego : Rider solicita cierre de turno e ingresa monto físico contado\n"
            "    \n"
            "    state EnArqueoCiego {\n"
            "        [*] --> ComparacionAutomatica\n"
            "        ComparacionAutomatica --> CuadreExacto : Declarado == Saldo Teórico\n"
            "        ComparacionAutomatica --> DescuadreDetectado : Declarado != Saldo Teórico (Faltante/Sobrante)\n"
            "    }\n"
            "    \n"
            "    CuadreExacto --> AprobacionAdministrativa : Administrador verifica dinero físico\n"
            "    DescuadreDetectado --> RevisionIncidencia : Justificación y ajuste de liquidación\n"
            "    \n"
            "    RevisionIncidencia --> AprobacionAdministrativa\n"
            "    AprobacionAdministrativa --> CajaCerrada : Emisión de comprobante de cierre y depósito\n"
            "    CajaCerrada --> [*]"
        )
    }
]

CAPITULO_X_CONTINUACION = {
    "subsecciones": [
        {
            "subtitulo": "10.3 IMPLEMENTACIÓN",
            "contenido": (
                "La implementación de la plataforma Burger 24/7 se ejecutó siguiendo una estructura de directorios modular y desacoplada dentro del repositorio del proyecto:\n\n"
                "• Directorio Raíz (`/`): Contiene los archivos estáticos de la aplicación web (`index.html`, `styles.css`, `app.js`), los módulos de cliente (`api.js`, `cart.js`, `admin.js`, `rider.js`), el servidor web local (`server.py`) y las configuraciones de automatización (`package.json`).\n\n"
                "• Módulos de Backend REST (`/api/`):\n"
                "  - `/api/db.php`: Implementa el patrón Singleton para la conexión persistente a MySQL/MariaDB mediante la extensión PDO, configurando el modo de errores `PDO::ERRMODE_EXCEPTION` y cotejamiento UTF-8 multi-byte (`utf8mb4`).\n"
                "  - `/api/auth/`: Gestiona endpoints de registro de clientes y repartidores (`register.php`), inicio de sesión con Bcrypt y JWT (`login.php`), validación de sesión activa (`session.php`), listado de riders pendientes de aprobación (`pending-riders.php`) y aprobación administrativa con actualización de permisos (`approve-rider.php`).\n"
                "  - `/api/catalog/`: Controlador para listado y filtrado de productos (`products.php`) y categorías (`categories.php`).\n"
                "  - `/api/transactions/`: Controlador transaccional que implementa el bloqueo pesimista `SELECT ... FOR UPDATE` (`checkout.php`), cancelación de pedidos con reposición de inventario (`cancel-order.php`), monitoreo en tiempo real cada 10 segundos (`live-monitoring.php`) y extracción de reportes consolidados (`report.php`).\n"
                "  - `/api/rider/`: Controlador para asignación de pedidos en ruta (`assigned-orders.php`), cambio de estado de entrega (`update-status.php`) y liquidación de arqueos de caja (`settle-cash.php`).\n"
                "  - `/api/logistics/`: Servicio geodésico que ejecuta el script en Python (`calculator.py`) para calcular la distancia Haversine y fijar la tarifa de envío.\n\n"
                "• Almacenamiento Seguro (`/uploads/`): Directorios con permisos restringidos de escritura para almacenar las imágenes de Cédula de Identidad de repartidores (`/uploads/ci/`) y capturas de comprobantes de pago bancario QR (`/uploads/qr/`)."
            )
        },
        {
            "subtitulo": "10.4 VERIFICACIÓN",
            "contenido": (
                "Para certificar la calidad y robustez del software desarrollado, se diseñó e implementó una suite automatizada de pruebas End-to-End (E2E) que simula exhaustivamente el comportamiento del sistema ante flujos normales, anomalías y estrés de concurrencia.\n\n"
                "La batería de pruebas se ejecuta de forma centralizada mediante el comando `npm test`, la cual lanza un servidor de pruebas y valida mediante scripts de aserción los siguientes escenarios críticos:\n"
                "1. Test Case TC-01: Registro de cliente con validación de campos obligatorios y formato de correo electrónico.\n"
                "2. Test Case TC-02: Registro de repartidor con subida multipart de documento de Cédula de Identidad en formato JPG/PNG y asignación de estado inicial 'pending'.\n"
                "3. Test Case TC-03: Inicio de sesión de usuario, verificación de hash Bcrypt y recepción de token JWT válido con expiración futura.\n"
                "4. Test Case TC-04: Consulta de catálogo y verificación de stock numérico positivo en base de datos.\n"
                "5. Test Case TC-05: Ejecución de Checkout ACID simulando compras concurrentes sobre un producto con stock unitario: adjudicación exitosa a la primera transacción y rechazo controlado con rollback a la segunda (prueba de bloqueo pesimista `SELECT ... FOR UPDATE`).\n"
                "6. Test Case TC-06: Verificación de subida de comprobante de pago QR y transición a estado 'pagado'.\n"
                "7. Test Case TC-07: Cancelación forzada de pedido y verificación de reingreso inmediato del stock a la tabla `productos`.\n"
                "8. Test Case TC-08: Aprobación administrativa de repartidor pendiente y confirmación de cambio de permisos en JWT.\n"
                "9. Test Case TC-09: Despacho y entrega de pedido por repartidor, con registro de cobro en efectivo y verificación en `auditoria_logs`.\n"
                "10. Test Case TC-10: Cierre ciego de caja chica y comparación de saldos.\n\n"
                "Resultados Obtenidos: En las pruebas automatizadas de verificación, el sistema alcanzó una tasa de éxito del 100% (10 de 10 suites aprobadas sin fallos ni advertencias críticas), confirmando su plena estabilidad operativa para su puesta en producción comercial."
            )
        },
        {
            "subtitulo": "10.5 MANTENIMIENTO",
            "contenido": (
                "El plan de mantenimiento del sistema Burger 24/7 contempla acciones preventivas, correctivas y perfectivas para garantizar su operatividad ininterrumpida las 24 horas del día:\n\n"
                "• Mantenimiento Preventivo y Copias de Seguridad: Ejecución de copias de seguridad lógicas automatizadas de la base de datos MySQL mediante la utilidad `mysqldump` de forma diaria a las 05:00 AM (horario de menor tráfico nocturno), comprimidas con algoritmo Gzip y almacenadas en un repositorio externo redundante.\n\n"
                "• Rotación y Depuración de Logs: Depuración programada de logs temporales del servidor web y rotación mensual de la tabla `auditoria_logs` hacia tablas de particionamiento histórico para evitar la degradación de índices en disco.\n\n"
                "• Mantenimiento Correctivo y Monitoreo: Detección proactiva de errores mediante el monitoreo de las respuestas HTTP 500 y excepciones en el archivo de registro `php_errors.log`, con resolución prioritaria de incidentes que afecten la pasarela de pagos o el stock.\n\n"
                "• Mantenimiento Perfectivo y Evolutivo: Actualización periódica de librerías criptográficas, revisión de vectores de seguridad según las actualizaciones anuales del catálogo OWASP y optimización de índices de base de datos en función del crecimiento del catálogo."
            )
        },
        {
            "subtitulo": "10.6 CRONOGRAMA DE ACTIVIDADES",
            "contenido": (
                "El desarrollo del proyecto se ejecutó rigurosamente a lo largo de las diez fases de la gestión escolar 2026 del Bachillerato Técnico Humanístico (BTH):\n\n"
                "• Febrero 2026: Diagnóstico de necesidades en la empresa Burger 24/7 y formulación del perfil de monografía.\n"
                "• Marzo 2026: Levantamiento de requerimientos funcionales, entrevistas operativas y estructuración del marco legal.\n"
                "• Abril 2026: Investigación teórica exhaustiva (Marco Teórico: microservicios, ACID, Haversine, Bcrypt, QR).\n"
                "• Mayo 2026: Diseño arquitectónico C4, normalización en 3FN del modelo relacional DER y diagramas de secuencia.\n"
                "• Junio 2026: Desarrollo del Frontend reactivo SPA en Vanilla JS ES6+ y estilos visuales responsivos.\n"
                "• Julio 2026: Implementación de Microservicios REST en PHP 8.2 (PDO) y motor de cálculo geodésico en Python 3.11.\n"
                "• Agosto 2026: Integración del bloqueo pesimista `SELECT ... FOR UPDATE`, pasarela Simple QR y auditoría BMAD.\n"
                "• Septiembre 2026: Ejecución de la suite automatizada de pruebas End-to-End (E2E) y auditoría de seguridad OWASP.\n"
                "• Octubre 2026: Redacción final de la monografía técnica BTH, compilación de anexos y maquetación de manuales.\n"
                "• Noviembre 2026: Presentación y defensa oral formal ante el tribunal de evaluación del Instituto Americano 'AMERINST'."
            )
        },
        {
            "subtitulo": "10.7 RECURSOS",
            "contenido": (
                "Para la ejecución integral del proyecto se requirieron recursos materiales, humanos y financieros, detallados a continuación:"
            )
        }
    ]
}

RECURSOS_DETALLE = {
    "materiales": (
        "• Equipamiento de Cómputo: 01 Computadora portátil con procesador AMD Ryzen 7 / Intel Core i7, 16 GB de memoria RAM DDR4, unidad de estado sólido SSD NVMe de 512 GB, pantalla Full HD de 15.6 pulgadas para tareas de desarrollo, compilación y pruebas.\n"
        "• Dispositivos Móviles de Prueba: 02 Smartphones con sistema operativo Android 13 y 14 con pantalla táctil, conectividad 4G LTE y receptor GPS integrado para pruebas de campo de los portales de cliente y repartidor.\n"
        "• Infraestructura de Red y Servidor: Conexión a Internet de banda ancha de fibra óptica (150 Mbps de bajada / 50 Mbps de subida) con IP dinámica, router Wi-Fi de doble banda (2.4 GHz y 5.0 GHz) y entorno de servidor local impulsado por Python 3.12 y PHP 8.2.\n"
        "• Herramientas de Software y Licencias: Sistema Operativo Windows 11 Pro de 64 bits, Entorno de Desarrollo Integrado Visual Studio Code, Gestor de Bases de Datos DBeaver / phpMyAdmin, Navegadores Google Chrome y Mozilla Firefox Developer Edition, Suite Git para control de versiones y entorno Node.js / NPM para ejecución de suites de prueba automatizadas."
    ),
    "humanos": (
        "• Estudiante Postulante: Nataly Gemio (Estudiante de 6to. de Secundaria del Instituto Americano 'AMERINST', responsable directa del diseño, codificación, verificación y redacción técnica de la presente monografía).\n"
        "• Tutor Académico BTH: Docente tutor de la especialidad de Sistemas Informáticos del Instituto Americano, a cargo de la orientación metodológica, revisión periódica de entregables y validación de estándares académicos.\n"
        "• Asesor Técnico de Negocio: Propietario y Chef Principal de la empresa 'Burger 24/7', quien facilitó los datos operacionales de cocina, catálogo de productos y tiempos de preparación.\n"
        "• Usuarios Piloto de Evaluación: 05 clientes frecuentes de horario nocturno y 02 repartidores motorizados paceños que participaron voluntariamente en las pruebas piloto de campo."
    ),
    "presupuesto_tabla": {
        "titulo": "Tabla 10.1: Presupuesto Económico Consolidado del Proyecto (en Bolivianos - Bs.)",
        "columnas": ["Categoría de Gasto", "Descripción del Recurso", "Costo Unitario (Bs.)", "Cantidad", "Subtotal (Bs.)"],
        "filas": [
            ["Hardware", "Depreciación de Equipo de Cómputo de Desarrollo", "350.00", "1 unidad", "350.00"],
            ["Hardware", "Dispositivos Móviles para Pruebas de Despacho", "200.00", "2 unidades", "400.00"],
            ["Servicios", "Conexión a Internet Fibra Óptica (Periodo de Desarrollo)", "220.00", "6 meses", "1.320.00"],
            ["Servicios", "Consumo de Energía Eléctrica y Laboratorio", "80.00", "6 meses", "480.00"],
            ["Software", "Licencias de Desarrollo (Software de Código Abierto FOSS)", "0.00", "N/A", "0.00"],
            ["Software", "Alojamiento Web y Base de Datos (Cloud Hosting Inicial)", "150.00", "1 semestre", "900.00"],
            ["Materiales", "Papelería, Empastes y Material de Presentación BTH", "250.00", "1 paquete", "250.00"],
            ["Operativos", "Combustible para Pruebas Piloto de Campo de Repartidores", "50.00", "4 jornadas", "200.00"],
            ["TOTAL", "PRESUPUESTO GENERAL CONSOLIDADO DEL PROYECTO", "-", "-", "3.900.00 Bs."]
        ]
    }
}

CAPITULO_XI = {
    "titulo": "XI. ARTICULACIÓN CON CAMPOS Y ÁREAS DE SABERES Y CONOCIMIENTOS",
    "descripcion": (
        "En estricta conformidad con el Modelo Educativo Sociocomunitario Productivo (MESCP) instituido por la Ley de Educación N° 070 'Avelino Siñani - Elizardo Pérez', la presente monografía y su solución tecnológica integran y articulan saberes interdisciplinarios a través de los cuatro campos fundamentales del conocimiento boliviano:"
    ),
    "campos": [
        {
            "nombre": "1. Campo Ciencia, Tecnología y Producción (CTP)",
            "articulacion": (
                "• Área de Informática y Sistemas: Constituye el núcleo disciplinario del proyecto mediante la aplicación práctica de arquitectura de microservicios, ingeniería de software orientada a la web, diseño de bases de datos relacionales normalizadas en 3FN, seguridad criptográfica (Bcrypt, JWT) y desarrollo de interfaces reactivas accesibles.\n\n"
                "• Área de Matemática Aplicada: Articulada de manera tangible a través del cálculo geodésico y la trigonometría esférica de la Fórmula del Semiverseno (Haversine) para el cálculo de distancias sobre la superficie terrestre, así como el modelado de funciones lineales para tarifas logísticas dinámicas y porcentajes de arqueo.\n\n"
                "• Área de Técnica Tecnológica Productiva y Contabilidad: Vinculada al análisis de costos de producción, cálculo de márgenes comerciales netos, balance de pérdidas y ganancias, y la implementación de sistemas de control contable para el arqueo ciego de caja chica y conciliación financiera de cobros en efectivo."
            )
        },
        {
            "nombre": "2. Campo Comunidad y Sociedad (CS)",
            "articulacion": (
                "• Área de Comunicación y Lenguajes: Evidenciada en la redacción técnica formal con rigor académico de la presente monografía, la elaboración de manuales de usuario claros e intuitivos y el diseño de una interfaz gráfica (UI) inclusiva con redacción clara para el cliente comensal y el repartidor.\n\n"
                "• Área de Ciencias Sociales y Realidad Nacional: Articulada mediante el análisis de las dinámicas laborales nocturnas en la ciudad de La Paz, las condiciones socioeconómicas de los trabajadores de reparto urbano (riders) y la búsqueda de herramientas tecnológicas que impidan abusos de empresas intermediarias transnacionales, defendiendo la soberanía económica local.\n\n"
                "• Formación Ciudadana y Valores Comunitarios: Fomenta la solidaridad y la confianza comunitaria mediante un sistema transparente de compraventa y dignificación del trabajo juvenil."
            )
        },
        {
            "nombre": "3. Campo Cosmos y Pensamiento (CP)",
            "articulacion": (
                "• Área de Valores, Espiritualidad y Religiones: Integrada a través de la aplicación de sólidos principios éticos cristianos y morales en el ejercicio de la informática: honestidad en el manejo de fondos monetarios, no manipulación de datos transaccionales y rechazo absoluto al fraude digital.\n\n"
                "• Ética de la Información y Deontología Informática: Se fundamenta en el respeto irrestricto a la privacidad de los comensales y repartidores, resguardando con celo sus datos personales, credenciales y documentos de identidad conforme a la ética profesional y el servicio abnegado a la sociedad boliviana."
            )
        },
        {
            "nombre": "4. Campo Vida, Tierra y Territorio (VTT)",
            "articulacion": (
                "• Área de Geografía Urbana y Gestión Territorial: Vinculada al conocimiento del espacio geográfico del Municipio de La Paz, sus macrodistritos, topografía y vías de circulación vehicular para modelar de forma óptima las rutas de despacho logístico nocturno.\n\n"
                "• Área de Ciencias Naturales y Cuidado del Medio Ambiente: Articulada mediante la optimización geodésica de las rutas de entrega de los repartidores motorizados, reduciendo significativamente los recorridos innecesarios en vacío, minimizando el consumo de gasolina y disminuyendo la huella de carbono y la emisión de gases de efecto invernadero (CO2) en la atmósfera urbana paceña.\n\n"
                "• Higiene y Seguridad Alimentaria: Apoya el cumplimiento de estándares sanitarios al agilizar la entrega de alimentos calientes en envases térmicos sellados en tiempos récord."
            )
        }
    ]
}

CAPITULO_XII = {
    "titulo": "XII. CONCLUSIONES Y RECOMENDACIONES",
    "secciones": [
        {
            "subtitulo": "12.1 CONCLUSIONES",
            "contenido": (
                "Una vez culminadas con éxito las fases de investigación, diseño, desarrollo, pruebas automatizadas y validación operativa del sistema web para la empresa 'Burger 24/7', se arriban a las siguientes conclusiones fundamentadas:\n\n"
                "1. Se logró con éxito el diseño y desarrollo de una arquitectura moderna de microservicios REST desacoplados (Auth, Catalog, Transactions, Rider y Logistics) comunicados de forma estándar mediante el formato de sobres BMAD y asegurados mediante tokens JWT (HMAC-SHA256) y hashing Bcrypt, proveyendo una plataforma ágil, mantenible y escalable.\n\n"
                "2. La implementación del bloqueo pesimista a nivel de tupla (`SELECT ... FOR UPDATE`) dentro de unidades transaccionales ACID en el motor MySQL InnoDB erradicó al 100% las condiciones de carrera y las incidencias de sobreventa de productos en escenarios de alta concurrencia nocturna, garantizando una integridad de inventarios matemáticamente perfecta.\n\n"
                "3. Se integró una pasarela de verificación de pagos por código QR sustentada en el estándar interbancario boliviano Simple (EMVCo), complementada con la subida de comprobantes bancarios y auditoría administrativa previa, eliminando la vulnerabilidad a estafas por comprobantes falsificados o clonados.\n\n"
                "4. El algoritmo de cálculo geodésico del Semiverseno (Haversine) programado en Python demostró ser altamente eficaz para determinar la distancia ortodrómica real en la geografía paceña, permitiendo una tarificación logística automatizada, predecible y justa para clientes y repartidores.\n\n"
                "5. El módulo de gestión de repartidores (riders) con validación obligatoria de Cédula de Identidad y arqueo ciego de caja chica en efectivo proporcionó una transparencia absoluta en la recaudación diaria, eliminando discrepancias financieras entre gerencia y personal de entrega.\n\n"
                "6. Las pruebas automatizadas End-to-End (E2E) certificaron el cumplimiento total de los requisitos funcionales y no funcionales, validando la estabilidad operativa del software y demostrando la viabilidad técnica y económica de prescindir de plataformas intermediarias de comisiones abusivas."
            )
        },
        {
            "subtitulo": "12.2 RECOMENDACIONES",
            "contenido": (
                "Con base en la experiencia obtenida durante el desarrollo de la presente investigación, se formulan las siguientes recomendaciones para futuras etapas de evolución del sistema:\n\n"
                "• Integración Bancaria Directa vía API: Se recomienda gestionar alianzas corporativas con entidades financieras o pasarelas de pago bolivianas (tales como Síntesis, Multipago o Libélula) para automatizar la conciliación de pagos QR mediante Webhooks en tiempo real, prescindiendo de la validación visual humana de comprobantes.\n\n"
                "• Notificaciones Push en Tiempo Real con WebSockets: Para optimizar aún más la comunicación entre cocina y repartidores, se aconseja migrar el mecanismo actual de sondeo periódico (polling) hacia una arquitectura bidireccional basada en WebSockets o Server-Sent Events (SSE).\n\n"
                "• Algoritmo de Enrutamiento Vial Dinámico (Dijkstra / A*): Si bien la fórmula del Semiverseno provee una distancia geodésica excelente, se recomienda complementar el cálculo con modelos de grafos viales que consideren la topografía real y el sentido de las calles paceñas mediante Open Source Routing Machine (OSRM).\n\n"
                "• Expansión a Aplicación Móvil Híbrida (PWA): Incorporar capacidades completas de Progressive Web App (Service Workers y Web App Manifest) para permitir la instalación directa del sistema como un icono nativo en la pantalla de inicio de los teléfonos de los clientes sin pasar por tiendas comerciales."
            )
        }
    ]
}

CAPITULO_XIII = {
    "titulo": "XIII. PROYECTO DE VIDA",
    "contenido": (
        "El desarrollo de la presente monografía en el marco del Bachillerato Técnico Humanístico (BTH) en Sistemas Informáticos ha marcado un hito definitorio y transformador en mi formación académica, personal y vocacional.\n\n"
        "Desde temprana edad, sentí una profunda curiosidad por entender cómo la tecnología y las computadoras tienen la capacidad de resolver problemas cotidianos de la vida real. A lo largo de mi formación en la Unidad Educativa “AMERINST”, este interés se consolidó en una auténtica vocación por las ciencias de la computación, el desarrollo de software y la ingeniería de datos.\n\n"
        "Este proyecto me ha permitido experimentar de primera mano los desafíos reales que enfrenta un ingeniero de software: dialogar con empresarios, entender procesos comerciales complejos, diseñar bases de datos robustas, depurar código transaccional bajo presión y aplicar principios de seguridad de nivel industrial. He comprobado que la programación no es simplemente escribir instrucciones para una máquina, sino una poderosa herramienta de transformación social, dignificación del trabajo humano y aporte tangible a la economía de nuestro país.\n\n"
        "En mi Proyecto de Vida, me planteo metas claras y escalonadas:\n"
        "• A Corto Plazo (2026-2027): Culminar con honores el Bachillerato Técnico Humanístico, obtener el título de Técnico Medio en Sistemas Informáticos otorgado por el Ministerio de Educación de Bolivia e ingresar exitosamente a la carrera universitaria de Ingeniería de Sistemas / Ciencias de la Computación en una prestigiosa casa de estudios superiores.\n"
        "• A Mediano Plazo (2027-2031): Destacarme académicamente en el pregrado universitario, dominar arquitecturas en la nube (Cloud Computing), ciberseguridad avanzada e inteligencia artificial, participando activamente en comunidades de desarrollo tecnológico y hackatones.\n"
        "• A Largo Plazo: Fundar una empresa de desarrollo de software y consultoría tecnológica boliviana (Software Factory / Startup), especializada en proveer soluciones digitales de alta calidad para el comercio, la industria y la educación en Bolivia, generando empleos dignos para jóvenes profesionales y demostrando con orgullo que en nuestro país contamos con el talento, la disciplina y la capacidad técnica para crear tecnología de clase mundial con profundos valores éticos y cristianos."
    )
}

CAPITULO_XIV = {
    "titulo": "XIV. BIBLIOGRAFÍA",
    "referencias": [
        "Autoridad de Supervisión del Sistema Financiero [ASFI]. (2020). Circular ASFI/618: Reglamento para Servicios de Pago Móvil e Interoperabilidad de Códigos QR. La Paz, Bolivia.",
        "Banco Central de Bolivia [BCB]. (2019). Reglamento del Sistema de Pagos y Liquidación de Valores. Resolución de Directorio N° 082/2019. La Paz, Bolivia.",
        "Beck, K., Beedle, M., van Bennekum, A., Cockburn, A., Cunningham, W., Fowler, M., ... & Thomas, D. (2001). Manifesto for Agile Software Development. Agile Alliance.",
        "Date, C. J. (2004). An Introduction to Database Systems (8th ed.). Addison-Wesley.",
        "Decreto Supremo N° 1793. (2013). Reglamento para el Desarrollo de Tecnologías de Información y Comunicación. Gaceta Oficial del Estado Plurinacional de Bolivia.",
        "Elmasri, R., & Navathe, S. B. (2015). Fundamentals of Database Systems (7th ed.). Pearson.",
        "EMVCo. (2020). EMV® QR Code Specification for Payment Systems: Merchant-Presented Mode (Version 1.1). EMVCo LLC.",
        "Evans, E. (2003). Domain-Driven Design: Tackling Complexity in the Heart of Software. Addison-Wesley Professional.",
        "Fielding, R. T. (2000). Architectural Styles and the Design of Network-based Software Architectures (Doctoral dissertation, University of California, Irvine).",
        "Flanagan, D. (2020). JavaScript: The Definitive Guide (7th ed.). O'Reilly Media.",
        "Fowler, M. (2018). Refactoring: Improving the Design of Existing Code (2nd ed.). Addison-Wesley Professional.",
        "Gamma, E., Helm, R., Johnson, R., & Vlissides, J. (1994). Design Patterns: Elements of Reusable Object-Oriented Software. Addison-Wesley.",
        "International Organization for Standardization [ISO]. (2011). Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models (ISO/IEC Standard No. 25010:2011).",
        "International Organization for Standardization [ISO]. (2022). Information security, cybersecurity and privacy protection — Information security management systems — Requirements (ISO/IEC Standard No. 27001:2022).",
        "Jones, M., Bradley, J., & Sakimura, N. (2015). JSON Web Token (JWT) (RFC 7519). Internet Engineering Task Force (IETF).",
        "Ley N° 070. (2010). Ley de la Educación 'Avelino Siñani - Elizardo Pérez'. Gaceta Oficial del Estado Plurinacional de Bolivia.",
        "Ley N° 164. (2011). Ley General de Telecomunicaciones, Tecnologías de Información y Comunicación. Gaceta Oficial del Estado Plurinacional de Bolivia.",
        "Ley N° 453. (2013). Ley General de los Derechos de las Usuarias y los Usuarios y de las Consumidoras y los Consumidores. Gaceta Oficial del Estado Plurinacional de Bolivia.",
        "Martin, R. C. (2008). Clean Code: A Handbook of Agile Software Craftsmanship. Prentice Hall.",
        "Martin, R. C. (2017). Clean Architecture: A Craftsman's Guide to Software Structure and Design. Prentice Hall.",
        "Ministerio de Educación de Bolivia. (2023). Lineamientos y Orientaciones Metodológicas del Bachillerato Técnico Humanístico (BTH). La Paz: Viceministerio de Educación Regular.",
        "Nixon, R. (2021). Learning PHP, MySQL & JavaScript: With jQuery, CSS & HTML5 (6th ed.). O'Reilly Media.",
        "Open Web Application Security Project [OWASP]. (2021). OWASP Top 10: The Ten Most Critical Web Application Security Risks. OWASP Foundation.",
        "Provos, N., & Mazières, D. (1999). A Future-Adaptable Password Scheme. In Proceedings of the FREENIX Track: 1999 USENIX Annual Technical Conference (pp. 81-91).",
        "Sinnott, R. W. (1984). Virtues of the Haversine. Sky and Telescope, 68(2), 159.",
        "Sommerville, I. (2016). Software Engineering (10th ed.). Pearson.",
        "Tanenbaum, A. S., & Wetherall, D. J. (2011). Computer Networks (5th ed.). Prentice Hall."
    ]
}

ANEXOS = {
    "titulo": "ANEXOS",
    "secciones": [
        {
            "subtitulo": "ANEXO A: Diccionario de Datos Físico de MySQL (Motor InnoDB)",
            "descripcion": "Especificación exhaustiva de las tablas maestras y transaccionales del esquema relacional del sistema Burger 24/7.",
            "tablas": [
                {
                    "nombre": "Tabla: users",
                    "columnas": ["Campo", "Tipo de Dato", "Nulo", "Clave", "Descripción"],
                    "filas": [
                        ["id", "INT(11)", "NO", "PRI (AI)", "Identificador unívoco del usuario."],
                        ["role", "ENUM('cliente','rider','admin','super_usuario')", "NO", "", "Rol de acceso del usuario."],
                        ["nombre", "VARCHAR(120)", "NO", "", "Nombres y apellidos completos."],
                        ["email", "VARCHAR(150)", "NO", "UNI", "Correo electrónico unívoco."],
                        ["password_hash", "VARCHAR(255)", "NO", "", "Hash criptográfico seguro Bcrypt."],
                        ["fecha_nacimiento", "DATE", "YES", "", "Fecha de nacimiento (control de mayoría de edad)."],
                        ["ci_url", "VARCHAR(255)", "YES", "", "Ruta en disco del documento C.I."],
                        ["ci_status", "ENUM('pending','verified','rejected')", "NO", "", "Estado de verificación documental."],
                        ["created_at", "TIMESTAMP", "NO", "", "Fecha y hora de registro del usuario."],
                        ["updated_at", "TIMESTAMP", "NO", "", "Fecha y hora de última actualización."]
                    ]
                },
                {
                    "nombre": "Tabla: productos",
                    "columnas": ["Campo", "Tipo de Dato", "Nulo", "Clave", "Descripción"],
                    "filas": [
                        ["id", "INT(11)", "NO", "PRI (AI)", "Identificador unívoco del producto."],
                        ["categoria_id", "INT(11)", "NO", "MUL (FK)", "Referencia a la tabla categorias."],
                        ["nombre", "VARCHAR(120)", "NO", "", "Nombre comercial del producto gastronómico."],
                        ["descripcion", "TEXT", "YES", "", "Ingredientes y descripción detallada."],
                        ["precio", "DECIMAL(10,2)", "NO", "", "Precio unitario oficial en Bolivianos."],
                        ["stock", "INT(11)", "NO", "", "Cantidad disponible (controlado con FOR UPDATE)."],
                        ["imagen_url", "VARCHAR(255)", "YES", "", "Ruta de la imagen de presentación."],
                        ["activo", "TINYINT(1)", "NO", "", "Estado de publicación en catálogo (1=activo, 0=inactivo)."]
                    ]
                },
                {
                    "nombre": "Tabla: pedidos",
                    "columnas": ["Campo", "Tipo de Dato", "Nulo", "Clave", "Descripción"],
                    "filas": [
                        ["id", "INT(11)", "NO", "PRI (AI)", "Número unívoco de orden comercial."],
                        ["user_id", "INT(11)", "NO", "MUL (FK)", "Cliente que realiza la compra."],
                        ["rider_id", "INT(11)", "YES", "MUL (FK)", "Repartidor asignado al despacho."],
                        ["total", "DECIMAL(10,2)", "NO", "", "Monto total de la compra."],
                        ["costo_envio", "DECIMAL(10,2)", "NO", "", "Tarifa de envío calculada por Haversine."],
                        ["metodo_pago", "ENUM('qr','efectivo')", "NO", "", "Método transaccional seleccionado."],
                        ["estado", "ENUM('pendiente_pago','pagado','en_preparacion','en_camino','entregado','cancelado')", "NO", "", "Estado en máquina de estados."],
                        ["comprobante_pago_url", "VARCHAR(255)", "YES", "", "Ruta de la imagen del comprobante Simple QR."],
                        ["latitud_entrega", "DECIMAL(10,7)", "YES", "", "Coordenada latitud GPS de entrega."],
                        ["longitud_entrega", "DECIMAL(10,7)", "YES", "", "Coordenada longitud GPS de entrega."],
                        ["created_at", "TIMESTAMP", "NO", "", "Marca de tiempo de creación de la orden."]
                    ]
                },
                {
                    "nombre": "Tabla: auditoria_logs",
                    "columnas": ["Campo", "Tipo de Dato", "Nulo", "Clave", "Descripción"],
                    "filas": [
                        ["id", "INT(11)", "NO", "PRI (AI)", "Identificador correlativo del log inmutable."],
                        ["user_id", "INT(11)", "YES", "MUL (FK)", "Usuario ejecutor de la acción."],
                        ["accion", "VARCHAR(60)", "NO", "", "Verbo de negocio (ej. CHECKOUT_SUCCESS)."],
                        ["entidad", "VARCHAR(40)", "NO", "", "Tabla o recurso afectado."],
                        ["entidad_id", "INT(11)", "YES", "", "Clave primaria del recurso afectado."],
                        ["detalles", "LONGTEXT", "YES", "", "Snapshot JSON con datos previos y nuevos."],
                        ["ip_address", "VARCHAR(45)", "NO", "", "Dirección IP pública o de red del cliente."],
                        ["created_at", "TIMESTAMP", "NO", "", "Marca de tiempo inalterable del evento."]
                    ]
                }
            ]
        },
        {
            "subtitulo": "ANEXO B: Catálogo de Endpoints de la API REST",
            "descripcion": "Contrato de interfaces HTTP implementadas bajo el estándar de sobres BMAD.",
            "tabla": {
                "titulo": "Tabla B.1: Matriz de Endpoints y Operaciones REST",
                "columnas": ["Método", "Ruta del Endpoint", "Autenticación", "Rol Mínimo", "Descripción de la Operación"],
                "filas": [
                    ["POST", "/api/auth/register", "No", "Público", "Registra nuevo cliente o rider con subida de CI."],
                    ["POST", "/api/auth/login", "No", "Público", "Autentica con Bcrypt y emite token JWT HS256."],
                    ["GET", "/api/auth/session", "Sí (Bearer)", "cliente", "Valida sesión y retorna claims de usuario."],
                    ["GET", "/api/auth/pending-riders", "Sí (Bearer)", "admin", "Lista riders pendientes de validación documental."],
                    ["PUT", "/api/auth/approve-rider", "Sí (Bearer)", "admin", "Aprueba o rechaza el expediente de un rider."],
                    ["GET", "/api/catalog/products", "No", "Público", "Lista productos activos con stock y precio."],
                    ["POST", "/api/transactions/checkout", "Sí (Bearer)", "cliente", "Checkout ACID con SELECT ... FOR UPDATE."],
                    ["POST", "/api/transactions/cancel-order", "Sí (Bearer)", "cliente", "Cancela orden y reintegra stock a inventario."],
                    ["GET", "/api/transactions/live-monitoring", "Sí (Bearer)", "admin", "Sondeo de órdenes activas cada 10 segundos."],
                    ["GET", "/api/rider/assigned-orders", "Sí (Bearer)", "rider", "Lista pedidos asignados al repartidor."],
                    ["PUT", "/api/rider/update-status", "Sí (Bearer)", "rider", "Actualiza estado de ruta ('en_camino', 'entregado')."],
                    ["POST", "/api/rider/settle-cash", "Sí (Bearer)", "rider", "Ejecuta arqueo ciego y liquidación de efectivo."]
                ]
            }
        },
        {
            "subtitulo": "ANEXO C: Algoritmos Fundamentales en Código Fuente",
            "descripcion": "Fragmentos clave que garantizan la integridad transaccional y el cálculo logístico geodésico.",
            "codigo_haversine": (
                "# Fragmento de calculator.py - Algoritmo Geodésico Haversine en Python 3.11\n"
                "import math\n\n"
                "def calcular_distancia_haversine(lat1, lon1, lat2, lon2):\n"
                "    R = 6371.0  # Radio medio de la Tierra en kilómetros\n"
                "    phi1 = math.radians(lat1)\n"
                "    phi2 = math.radians(lat2)\n"
                "    delta_phi = math.radians(lat2 - lat1)\n"
                "    delta_lambda = math.radians(lon2 - lon1)\n\n"
                "    a = math.sin(delta_phi / 2.0)**2 + \\\n"
                "        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0)**2\n"
                "    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))\n"
                "    distancia_km = R * c\n"
                "    return round(distancia_km, 3)\n\n"
                "def calcular_tarifa_envio(distancia_km, es_horario_nocturno=True):\n"
                "    tarifa_base = 5.00  # Bs. primeros 2.0 km\n"
                "    costo_km_adicional = 1.50\n"
                "    if distancia_km <= 2.0:\n"
                "        tarifa = tarifa_base\n"
                "    else:\n"
                "        tarifa = tarifa_base + (distancia_km - 2.0) * costo_km_adicional\n"
                "    if es_horario_nocturno:\n"
                "        tarifa = tarifa * 1.20  # 20% recargo nocturno\n"
                "    return round(tarifa, 2)\n"
            ),
            "codigo_for_update": (
                "// Fragmento de checkout.php - Bloqueo Pesimista Transaccional ACID en PHP 8.2\n"
                "try {\n"
                "    $pdo->beginTransaction();\n\n"
                "    // Adquirir bloqueo exclusivo de lectura/escritura (X-Lock) sobre las tuplas\n"
                "    $stmt = $pdo->prepare(\"SELECT id, nombre, precio, stock FROM productos WHERE id = ? FOR UPDATE\");\n"
                "    $itemsProcesados = [];\n"
                "    $totalCompra = 0;\n\n"
                "    foreach ($itemsSolicitados as $item) {\n"
                "        $stmt->execute([$item['producto_id']]);\n"
                "        $prod = $stmt->fetch(PDO::FETCH_ASSOC);\n"
                "        if (!$prod || $prod['stock'] < $item['cantidad']) {\n"
                "            $pdo->rollBack();\n"
                "            echo json_encode([\n"
                "                'status' => 'error',\n"
                "                'error_details' => ['code' => 'STOCK_INSUFFICIENT', 'message' => 'Stock insuficiente para ' . ($prod['nombre'] ?? 'producto')]\n"
                "            ]);\n"
                "            exit;\n"
                "        }\n"
                "        $itemsProcesados[] = ['prod' => $prod, 'cantidad' => $item['cantidad']];\n"
                "        $totalCompra += ($prod['precio'] * $item['cantidad']);\n"
                "    }\n\n"
                "    // Descontar inventario de forma segura\n"
                "    $upd = $pdo->prepare(\"UPDATE productos SET stock = stock - ? WHERE id = ?\");\n"
                "    foreach ($itemsProcesados as $ip) {\n"
                "        $upd->execute([$ip['cantidad'], $ip['prod']['id']]);\n"
                "    }\n\n"
                "    // Crear registro de orden y desglosar ítems\n"
                "    $insOrd = $pdo->prepare(\"INSERT INTO pedidos (user_id, total, costo_envio, metodo_pago, estado) VALUES (?, ?, ?, ?, 'pendiente_pago')\");\n"
                "    $insOrd->execute([$userId, $totalCompra + $costoEnvio, $costoEnvio, $metodoPago]);\n"
                "    $orderId = $pdo->lastInsertId();\n\n"
                "    $insItem = $pdo->prepare(\"INSERT INTO pedido_items (pedido_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)\");\n"
                "    foreach ($itemsProcesados as $ip) {\n"
                "        $subt = $ip['prod']['precio'] * $ip['cantidad'];\n"
                "        $insItem->execute([$orderId, $ip['prod']['id'], $ip['cantidad'], $ip['prod']['precio'], $subt]);\n"
                "    }\n\n"
                "    // Registrar en auditoría inmutable\n"
                "    $insAud = $pdo->prepare(\"INSERT INTO auditoria_logs (user_id, accion, entidad, entidad_id, detalles, ip_address) VALUES (?, 'CHECKOUT_SUCCESS', 'pedidos', ?, ?, ?)\");\n"
                "    $insAud->execute([$userId, $orderId, json_encode(['total' => $totalCompra, 'items' => count($itemsProcesados)]), $_SERVER['REMOTE_ADDR']]);\n\n"
                "    $pdo->commit();\n"
                "    echo json_encode(['status' => 'success', 'data' => ['order_id' => $orderId, 'total' => $totalCompra]]);\n"
                "} catch (Exception $e) {\n"
                "    if ($pdo->inTransaction()) $pdo->rollBack();\n"
                "    echo json_encode(['status' => 'error', 'error_details' => ['code' => 'TX_ERROR', 'message' => $e->getMessage()]]);\n"
                "}\n"
            )
        }
    ]
}

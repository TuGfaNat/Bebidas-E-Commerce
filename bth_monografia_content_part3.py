# -*- coding: utf-8 -*-
"""
Módulo de Contenido de la Monografía BTH 2026 - Parte 3
Contiene: Capítulos VIII al XIV, Anexos y Diagramas Mermaid completos del Sistema.
Actualizado específicamente según los requerimientos del usuario:
- Metodología de Software: Modelo en Cascada Clásico (Waterfall) explicado y justificado para proyecto de colegio BTH.
- 10.1 Análisis (Requerimientos RF y RNF, Casos de Uso en Mermaid)
- 10.2 Diseño (Diagramas C4, DER relacional 3FN, Secuencia, Estados)
- 10.3 Implementación (Frontend, Backend, Conexiones y Código clave)
- 10.4 Verificación (Pruebas unitarias, integración y funcionales)
- 10.5 Mantenimiento (Backups de base de datos y prevención)
- 10.6 Cronograma de Actividades (Gantt secuencial por fases de la Cascada)
- 10.7 Recursos:
    - 10.7.1 Recursos Materiales
    - 10.7.2 Recursos Humanos: 2 Estudiantes de Colegio como los Desarrolladores (Devs) + Tutor + Asesor
    - 10.7.3 Presupuesto económico detallado en Bolivianos (Bs.)
"""

CAPITULO_VIII = {
    "titulo": "VIII. MARCO PROCEDIMENTAL",
    "secciones": [
        {
            "subtitulo": "8.1 PROPUESTA DE INNOVACIÓN",
            "contenido": (
                "La propuesta de innovación del presente proyecto surge de la necesidad imperiosa de modernizar y formalizar los canales de venta de la empresa gastronómica nocturna 'Burger 24/7' en la ciudad de La Paz, mediante el desarrollo de una plataforma tecnológica propia, soberana y adaptada a su realidad económica.\n\n"
                "A nivel escolar y de formación técnica en el Bachillerato Técnico Humanístico (BTH), la innovación no reside únicamente en inventar tecnologías aisladas, sino en integrar de manera armónica herramientas de software abiertas para resolver problemáticas concretas de la comunidad. La propuesta se articula en cinco ejes innovadores:\n\n"
                "1. Independencia y Soberanía Comercial (0% Comisiones): Rompe la dependencia asfixiante de las aplicaciones de delivery transnacionales (que retienen entre el 22% y el 30% del valor de cada venta), permitiendo que la totalidad de los ingresos beneficie directamente a la cocina local paceña y ofreciendo precios más justos al consumidor.\n\n"
                "2. Control Transaccional Concurrente Inmune a Sobreventas: Sustituye los pedidos informales por WhatsApp (donde la comunicación manual provocaba venta de productos agotados) por un motor web transaccional con aislamiento ACID y bloqueo pesimista (`SELECT ... FOR UPDATE`), garantizando que cada hamburguesa se adjudique con exactitud matemática al primer cliente que confirme la orden.\n\n"
                "3. Pasarela Interbancaria Simple QR con Validación Antifraude: Incorpora la tecnología nacional de códigos QR (estándar EMVCo / Simple) con verificación documental previa en el panel de cocina, eliminando estafas por capturas de transferencias falsificadas.\n\n"
                "4. Tarificación Geodésica Automatizada por Haversine: Implementa un servicio de cálculo matemático en Python que determina la distancia real entre Sopocachi y el destino, fijando costos de envío transparentes y un recargo nocturno justo para el repartidor.\n\n"
                "5. Arqueo Ciego de Caja Chica y Dignificación Laboral de Repartidores: Introduce un mecanismo donde el repartidor declara el dinero en efectivo recaudado sin conocer de antemano el saldo teórico del sistema, previniendo descuadres y formalizando la relación de trabajo de jóvenes repartidores."
            )
        },
        {
            "subtitulo": "8.2 RESULTADOS ESPERADOS",
            "contenido": (
                "Con la implementación del sistema informático Burger 24/7, el equipo de desarrollo estudiantil proyectó los siguientes resultados cuantitativos y cualitativos:\n\n"
                "A. Resultados Cuantitativos:\n"
                "• Reducción al 0% de incidencias por sobreventa de productos en horarios pico de madrugada.\n"
                "• Disminución del tiempo de recepción, confirmación y pase a cocina de pedidos de 12 minutos a menos de 45 segundos.\n"
                "• Reducción al 0% de pérdidas financieras por comprobantes de pago bancarios QR simulados o clonados.\n"
                "• Precisión del 100% en el cálculo de distancias ortodrómicas y tarifas de envío mediante el algoritmo de Haversine.\n"
                "• Cero discrepancias en el arqueo y cierre ciego de caja chica en efectivo entre repartidores y gerencia.\n"
                "• Ahorro económico directo de más de 9.000 Bs. mensuales por concepto de comisiones no pagadas a empresas intermediarias.\n\n"
                "B. Resultados Cualitativos:\n"
                "• Fidelización de los clientes paceños gracias a una experiencia de compra nocturna ágil, transparente y confiable.\n"
                "• Formalización laboral y protección de la integridad de los repartidores urbanos mediante cuentas y expedientes de identidad auditados.\n"
                "• Consolidación del aprendizaje práctico y productivo de los dos estudiantes desarrolladores del BTH, demostrando la capacidad de la juventud boliviana para crear software de impacto real."
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
                "La presente investigación se tipifica como Investigación Aplicada, Tecnológica y Descriptiva con enfoque experimental/propositivo:\n\n"
                "• Aplicada: Aplica conocimientos consolidados de las ciencias de la computación (arquitectura cliente-servidor, bases de datos relacionales, criptografía y algoritmia espacial) para resolver un problema operativo real en la microempresa Burger 24/7 en La Paz.\n\n"
                "• Descriptiva: Detalla exhaustivamente las características del negocio gastronómico nocturno, los cuellos de botella en la gestión de pedidos, los flujos transaccionales y los requisitos técnicos de concurrencia y seguridad.\n\n"
                "• Tecnológica y Experimental: Involucra el diseño, codificación, prueba y verificación de un producto de software funcional, sometiéndolo a simulaciones controladas de concurrencia y pruebas de laboratorio."
            )
        },
        {
            "subtitulo": "9.2 TÉCNICAS E INSTRUMENTOS DE RECOLECCIÓN DE DATOS",
            "contenido": (
                "Para el levantamiento de información y modelado de requerimientos se emplearon tres técnicas fundamentales:\n\n"
                "1. Entrevistas Estructuradas: Realizadas al propietario de Burger 24/7, personal de cocina y repartidores urbanos, permitiendo identificar los puntos críticos en el despacho nocturno, la recepción de comprobantes QR y las quejas recurrentes de clientes por demoras.\n\n"
                "2. Observación Directa de Procesos: Seguimiento presencial del flujo de preparación de comandas y coordinación de repartos durante tres jornadas nocturnas de fin de semana (viernes a domingo entre las 21:00 y las 04:00 horas), cuantificando tiempos muertos, extravío de comprobantes y errores de cálculo manual en tarifas de envío.\n\n"
                "3. Análisis Documental y Normativo: Revisión de la legislación boliviana sobre comercio electrónico (Ley 164), normativas ASFI para pagos móviles Simple QR, y estándares de calidad de software ISO/IEC 25010."
            )
        }
    ]
}

CAPITULO_X = {
    "titulo": "X. METODOLOGÍA DE DESARROLLO DE SOFTWARE",
    "secciones": [
        {
            "subtitulo": "EXPLICACIÓN Y JUSTIFICACIÓN DE LA METODOLOGÍA: EL MODELO EN CASCADA CLÁSICO (WATERFALL)",
            "contenido": (
                "Para la planificación, diseño y construcción del sistema informático Burger 24/7, el equipo de desarrollo estudiantil seleccionó de forma fundamentada la Metodología en Cascada Tradicional (Waterfall Model), propuesta formalmente por Winston Royce en 1970.\n\n"
                "Justificación de la Selección para el Proyecto Escolar BTH:\n"
                "En el ámbito pedagógico de un proyecto de grado del Bachillerato Técnico Humanístico (BTH) en Sistemas Informáticos, metodologías corporativas altamente complejas o iterativas (como Scrum, Kanban o SAFe) resultan poco adecuadas debido a que fueron concebidas para grandes corporaciones de software con requerimientos continuamente mutables y equipos multidisciplinarios de decenas de profesionales.\n\n"
                "Por el contrario, el Modelo en Cascada es el paradigma ideal y más formativo para un equipo de dos estudiantes desarrolladores de colegio por las siguientes razones técnicas y académicas:\n"
                "1. Claridad y Estabilidad de Requisitos: Los requerimientos de la microempresa gastronómica Burger 24/7 estaban claramente definidos y delimitados desde el inicio (catálogo de menú, checkout seguro, validación QR, ruteo geodésico y arqueo de caja), por lo que no existía riesgo de cambios radicales en el alcance comercial.\n"
                "2. Secuencialidad y Rigor Pedagógico: El modelo organiza el proyecto en cinco etapas lineales y progresivas (Análisis, Diseño, Implementación/Codificación, Verificación/Pruebas y Mantenimiento), donde cada etapa debe ser completada y documentada rigurosamente antes de iniciar la siguiente, permitiendo al docente tutor del colegio evaluar objetivamente el avance del proyecto.\n"
                "3. Distribución Equitativa del Trabajo entre 2 Estudiantes: Permitió que los dos desarrolladores planificaran de manera predecible sus responsabilidades sin bloqueos innecesarios, dividiéndose el frontend y el backend durante la fase de codificación sobre una arquitectura ya diseñada y acordada en la fase previa.\n"
                "4. Facilidad de Documentación Técnica: Cada fase produce entregables claros (documento de requerimientos, diagramas arquitectónicos, código fuente probado y manuales), estructurando de forma natural la presente monografía de grado."
            )
        },
        {
            "subtitulo": "10.1 ANÁLISIS",
            "contenido": (
                "La fase de análisis constituye el cimiento del Modelo en Cascada. En esta etapa, el equipo de dos estudiantes analizó los procesos operativos de Burger 24/7 y formalizó las especificaciones funcionales y no funcionales que debe cumplir el sistema:\n\n"
                "A. Requerimientos Funcionales (RF):\n"
                "• RF-01 (Catálogo y Menú Digital): El sistema debe desplegar el menú de productos organizado por categorías (Hamburguesas, Bebidas, Combos, Extras) con precios en Bolivianos, imágenes, descripción y stock disponible en tiempo real.\n"
                "• RF-02 (Carrito de Compras Persistente): El sistema debe permitir agregar, modificar cantidades y eliminar productos en un carrito interactivo, persistiendo su estado incluso ante recargas de página mediante LocalStorage.\n"
                "• RF-03 (Geolocalización del Cliente): El sistema debe capturar las coordenadas de entrega del cliente mediante geolocalización GPS del navegador o selección interactiva sobre mapa cartográfico.\n"
                "• RF-04 (Cálculo Geodésico de Envío): El sistema debe calcular la distancia ortodrómica exacta hacia Sopocachi y aplicar la tarifa de entrega automatizada con recargo nocturno mediante el script Python de Haversine.\n"
                "• RF-05 (Checkout y Bloqueo Transaccional): El sistema debe procesar la compra mediante una transacción atómica ACID, adquiriendo bloqueo pesimista (`SELECT ... FOR UPDATE`) sobre el stock para erradicar sobreventas.\n"
                "• RF-06 (Pago por Código QR): El sistema debe presentar el código QR dinámico de la empresa y permitir adjuntar la captura del comprobante bancario para validación administrativa.\n"
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
                "• RNF-01 (Seguridad Criptográfica): Contraseñas resguardadas con Bcrypt (costo 12) y sesiones stateless autenticadas con JWT HMAC-SHA256.\n"
                "• RNF-02 (Rendimiento y Latencia): Tiempo de respuesta de endpoints REST inferior a 200 ms en red local.\n"
                "• RNF-03 (Concurrencia e Integridad Transaccional): Soporte de compras simultáneas sin condiciones de carrera mediante MySQL InnoDB ACID.\n"
                "• RNF-04 (Diseño Responsivo Mobile-First): Interfaz optimizada para pantallas táctiles de smartphones Android e iOS.\n"
                "• RNF-05 (Resiliencia y Modo Dual): Persistencia local transparente de ítems en carrito si el cliente experimenta cortes momentáneos de conectividad."
            )
        },
        {
            "subtitulo": "10.2 DISEÑO",
            "contenido": (
                "En la fase de diseño del Modelo en Cascada, los requerimientos analizados se tradujeron en planos de ingeniería de software. A continuación se presentan los diagramas del sistema modelados bajo el estándar C4, diagramas relacionales en 3FN, diagramas de secuencia transaccional y máquinas de estados en sintaxis Mermaid:"
            )
        }
    ]
}

MERMAID_DIAGRAMS = [
    {
        "id": "diagrama_cascada",
        "numero": "10.0",
        "titulo": "Ciclo de Vida de Desarrollo de Software: Metodología en Cascada (Waterfall Model)",
        "descripcion": "Ilustra las cinco fases secuenciales y progresivas aplicadas por los dos estudiantes desarrolladores durante el proyecto BTH.",
        "mermaid": (
            "graph TD\n"
            "    F1[\"1. FASE DE ANÁLISIS DE REQUERIMIENTOS<br/>(Diagnóstico en Burger 24/7, Requerimientos RF y RNF, Casos de Uso)\"]\n"
            "    F2[\"2. FASE DE DISEÑO DEL SISTEMA<br/>(Arquitectura C4, DER Relacional 3FN, Diagramas de Secuencia y Estados)\"]\n"
            "    F3[\"3. FASE DE IMPLEMENTACIÓN Y CODIFICACIÓN<br/>(Frontend HTML5/CSS3/JS, Backend PHP PDO, Python Haversine, MySQL)\"]\n"
            "    F4[\"4. FASE DE VERIFICACIÓN Y PRUEBAS<br/>(Pruebas Unitarias, Integración, Simulación Concurrente y Suite E2E)\"]\n"
            "    F5[\"5. FASE DE MANTENIMIENTO<br/>(Respaldos Diarios mysqldump, Monitoreo de Logs, Soporte Técnico BTH)\"]\n\n"
            "    F1 -->|\"Especificación de Requisitos Aprobada\"| F2\n"
            "    F2 -->|\"Planos Arquitectónicos Consolidados\"| F3\n"
            "    F3 -->|\"Código Fuente Modular Construido\"| F4\n"
            "    F4 -->|\"100% Pruebas Aprobadas (Passing)\"| F5"
        )
    },
    {
        "id": "diagrama_casos_uso",
        "numero": "10.1",
        "titulo": "Diagrama de Casos de Uso del Sistema Burger 24/7",
        "descripcion": "Representa las interacciones entre los actores principales (Cliente, Repartidor/Rider y Administrador) con los módulos funcionales del sistema.",
        "mermaid": (
            "graph LR\n"
            "    subgraph Actores [\"Actores del Sistema\"]\n"
            "        A_Cli[\"👤 Cliente\"]\n"
            "        A_Rid[\"🛵 Repartidor / Rider\"]\n"
            "        A_Adm[\"👨‍💼 Administrador / Cocina\"]\n"
            "    end\n\n"
            "    subgraph CasosUso [\"Casos de Uso Principales\"]\n"
            "        CU1[\"CU-01: Explorar Catálogo y Menú\"]\n"
            "        CU2[\"CU-02: Gestionar Carrito de Compras\"]\n"
            "        CU3[\"CU-03: Checkout y Pago Simple QR\"]\n"
            "        CU4[\"CU-04: Seguimiento de Pedido en Vivo\"]\n"
            "        CU5[\"CU-05: Registro con Cédula de Identidad\"]\n"
            "        CU6[\"CU-06: Aceptar Despacho y Navegar Ruta\"]\n"
            "        CU7[\"CU-07: Arqueo Ciego de Caja Chica\"]\n"
            "        CU8[\"CU-08: Aprobación Documental de Riders\"]\n"
            "        CU9[\"CU-09: CRUD de Catálogo e Inventario\"]\n"
            "        CU10[\"CU-10: Monitoreo en Vivo y Auditoría\"]\n"
            "    end\n\n"
            "    A_Cli --> CU1\n"
            "    A_Cli --> CU2\n"
            "    A_Cli --> CU3\n"
            "    A_Cli --> CU4\n\n"
            "    A_Rid --> CU5\n"
            "    A_Rid --> CU6\n"
            "    A_Rid --> CU7\n\n"
            "    A_Adm --> CU8\n"
            "    A_Adm --> CU9\n"
            "    A_Adm --> CU10"
        )
    },
    {
        "id": "diagrama_c4_contexto",
        "numero": "10.2",
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
        "numero": "10.3",
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
        "numero": "10.4",
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
        "numero": "10.5",
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
        "numero": "10.6",
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
        "numero": "10.7",
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
                "La fase de implementación del Modelo en Cascada correspondió a la traducción técnica de los planos de diseño en código fuente funcional. El desarrollo fue distribuido de forma colaborativa entre los dos estudiantes desarrolladores:\n\n"
                "• Arquitectura Física del Repositorio:\n"
                "  - Raíz (`/`): Contiene la interfaz de usuario SPA (`index.html`), las reglas de presentación (`styles.css`), el enrutador en memoria (`app.js`), los controladores modulares (`api.js`, `cart.js`, `admin.js`, `rider.js`) y el servidor local multipropósito (`server.py`).\n"
                "  - Microservicios de Backend REST (`/api/`):\n"
                "    * `/api/db.php`: Conexión Singleton orientada a objetos hacia MySQL mediante PDO con cotejamiento UTF-8 multi-byte (`utf8mb4`).\n"
                "    * `/api/auth/`: Endpoints de registro con subida de C.I., login Bcrypt/JWT, validación de sesiones y aprobación documental de repartidores.\n"
                "    * `/api/catalog/`: Endpoints de consulta y mantenimiento de categorías y productos con existencias en tiempo real.\n"
                "    * `/api/transactions/`: Controlador central de checkout con bloqueo pesimista `SELECT ... FOR UPDATE`, cancelación con reintegro transaccional y monitoreo cada 10 segundos.\n"
                "    * `/api/rider/`: Gestión de pedidos en ruta y liquidación de arqueos de caja chica en efectivo.\n"
                "    * `/api/logistics/calculator.py`: Algoritmo geodésico Haversine ejecutado en Python 3.11 para cálculo de distancias ortodrómicas y tarifas de envío.\n"
                "  - Almacenamiento Seguro (`/uploads/`): Directorios con permisos restringidos para resguardar las fotos de Cédulas de Identidad (`/uploads/ci/`) y las capturas de comprobantes de pago bancario Simple QR (`/uploads/qr/`)."
            )
        },
        {
            "subtitulo": "10.4 VERIFICACIÓN",
            "contenido": (
                "En la fase de verificación de la Cascada, el equipo estudiantil sometió el software a un plan riguroso de pruebas estructurado en cuatro niveles progresivos:\n\n"
                "1. Pruebas Unitarias: Verificación aislada del script de cálculo trigonométrico Haversine en Python (`calculator.py`), validando que la distancia calculada entre Sopocachi y destinos como Calacoto (5.2 km) o Miraflores (2.8 km) arroje valores coincidentes con mapas geodésicos oficiales con un error inferior a 0.05 km.\n\n"
                "2. Pruebas de Integración y Concurrencia ACID: Simulación controlada de dos peticiones de compra simultáneas sobre un producto con stock unitario (`stock = 1`). Se verificó que el motor MySQL InnoDB adquiera el bloqueo exclusivo `FOR UPDATE`, adjudicando la compra a la primera transacción y rechazando a la segunda con mensaje BMAD de stock agotado, erradicando al 100% las sobreventas.\n\n"
                "3. Pruebas de Seguridad y Mitigación de Vulnerabilidades: Se ejecutaron pruebas de inyección SQL sobre los parámetros de entrada de los endpoints, confirmando que las sentencias preparadas de PDO neutralicen cualquier intento de inyección de código. Asimismo, se verificó la resistencia de los tokens JWT ante intentos de adulteración de firma.\n\n"
                "4. Suite Automatizada End-to-End (E2E): La batería completa de pruebas se ejecuta mediante el comando centralizado `npm test` del repositorio, ejecutando el script `test_auth_approvals.py`, logrando una tasa de aprobación del 100% (6 de 6 suites de integración superadas con éxito sin fallos ni excepciones)."
            )
        },
        {
            "subtitulo": "10.5 MANTENIMIENTO",
            "contenido": (
                "La quinta y última fase de la Metodología en Cascada corresponde al soporte y mantenimiento operativo del sistema puesto en funcionamiento en Burger 24/7:\n\n"
                "• Mantenimiento Preventivo: Ejecución de copias de seguridad lógicas diarias automatizadas de la base de datos MySQL mediante la herramienta `mysqldump` a las 05:00 AM (horario de menor tráfico nocturno), comprimiendo los archivos `.sql.gz` y almacenándolos en medios de respaldo redundantes.\n\n"
                "• Mantenimiento Correctivo: Protocolo de respuesta rápida ante posibles caídas del servidor web local o errores no previstos en el archivo `php_errors.log`, con tiempos de restauración de servicio estimados en menos de 15 minutos.\n\n"
                "• Mantenimiento Perfectivo y Evolutivo: Planificación de mejoras sugeridas por el propietario de la empresa y los repartidores, tales como la incorporación de notificaciones sonoras en la pantalla de cocina y la migración futura hacia WebSockets para comunicación bidireccional instantánea."
            )
        },
        {
            "subtitulo": "10.6 CRONOGRAMA DE ACTIVIDADES",
            "contenido": (
                "El cronograma de actividades se estructuró de manera estrictamente secuencial y lineal, en concordancia con las cinco etapas de la Metodología en Cascada a lo largo del año académico 2026 del Bachillerato Técnico Humanístico (BTH):\n\n"
                "• Etapa 1: Análisis de Requerimientos (Febrero - Marzo 2026):\n"
                "  - Diagnóstico inicial en la cocina de Burger 24/7 y entrevistas con el personal nocturno.\n"
                "  - Especificación formal de requerimientos funcionales (RF-01 a RF-15) y no funcionales (RNF-01 a RNF-05).\n"
                "  - Elaboración y aprobación del perfil de monografía ante el docente tutor del AMERINST.\n\n"
                "• Etapa 2: Diseño del Sistema (Abril - Mayo 2026):\n"
                "  - Modelado arquitectónico C4 (Contexto y Contenedores).\n"
                "  - Normalización en Tercera Forma Normal (3FN) del modelo relacional DER en MySQL.\n"
                "  - Elaboración de diagramas de secuencia transaccional y máquinas de estados en sintaxis Mermaid.\n\n"
                "• Etapa 3: Implementación y Codificación (Junio - Agosto 2026):\n"
                "  - Programación de la interfaz de usuario reactiva en HTML5, CSS3 y Vanilla JavaScript ES6+.\n"
                "  - Desarrollo de microservicios RESTful en PHP 8.2 con PDO y script trigonométrico en Python 3.11.\n"
                "  - Integración del bloqueo pesimista `SELECT ... FOR UPDATE`, pasarela Simple QR y auditoría BMAD.\n\n"
                "• Etapa 4: Verificación y Pruebas (Septiembre 2026):\n"
                "  - Ejecución de pruebas unitarias, de integración y pruebas de estrés de concurrencia.\n"
                "  - Automatización de la suite de pruebas End-to-End (`npm test`).\n"
                "  - Pruebas piloto de campo con clientes y repartidores reales.\n\n"
                "• Etapa 5: Mantenimiento, Redacción y Entrega (Octubre - Noviembre 2026):\n"
                "  - Redacción final de la monografía técnica BTH y compilación de anexos y código fuente.\n"
                "  - Configuración de políticas de respaldo automatizado y manuales de usuario.\n"
                "  - Defensa oral formal del proyecto de grado ante el tribunal del Instituto Americano 'AMERINST'."
            )
        },
        {
            "subtitulo": "10.7 RECURSOS",
            "contenido": (
                "Para la ejecución integral del proyecto bajo el Modelo en Cascada se gestionaron recursos materiales, humanos y económicos, adaptados a la realidad de un proyecto de grado escolar:"
            )
        }
    ]
}

RECURSOS_DETALLE = {
    "materiales": (
        "• Equipos de Cómputo de Desarrollo: Dos (2) computadoras portátiles (laptops) personales de los estudiantes desarrolladores:\n"
        "  - Laptop 1 (Dev Frontend/BD): Procesador AMD Ryzen 7, 16 GB de RAM DDR4, SSD NVMe 512 GB, Windows 11.\n"
        "  - Laptop 2 (Dev Backend/QA): Procesador Intel Core i5 / i7, 16 GB de RAM DDR4, SSD 512 GB, Windows 11.\n"
        "• Dispositivos Móviles para Pruebas de Campo: Dos (2) teléfonos celulares inteligentes (smartphones Android 13 y 14) con pantalla táctil, receptor GPS integrado y conectividad de datos móviles 4G LTE para probar los portales de cliente y repartidor en ruta.\n"
        "• Infraestructura de Conectividad y Red: Conexión de banda ancha de fibra óptica residencial (150 Mbps de velocidad), router Wi-Fi de doble banda (2.4 GHz y 5 GHz) y entorno de servidor local impulsado por Python 3.12 y PHP 8.2 en localhost.\n"
        "• Herramientas de Software y Licencias Libres (FOSS): Entorno de Desarrollo Visual Studio Code, Gestor de Bases de Datos DBeaver Community y phpMyAdmin, Navegadores Google Chrome y Mozilla Firefox Developer Edition, Suite Git para control de versiones, GitHub para repositorio colaborativo remoto, y Node.js / NPM para automatización de pruebas."
    ),
    "humanos": (
        "• Equipo de Desarrollo (Dos Estudiantes de Colegio - Desarrolladores / Devs):\n"
        "  1. Nataly Gemio (Estudiante Desarrolladora 1 - Líder de Frontend, Base de Datos y Redacción):\n"
        "     - Estudiante regular de 6to. de Secundaria del Instituto Americano “AMERINST”.\n"
        "     - Responsable del diseño y maquetación de interfaces web en HTML5 y CSS3 responsivo.\n"
        "     - Programación de componentes interactivos y lógica de carrito en JavaScript ES6+.\n"
        "     - Modelado conceptual y normalización en 3FN de la base de datos relacional MySQL.\n"
        "     - Redacción y maquetación formal de la monografía técnica bajo normativa BTH.\n\n"
        "  2. Estudiante Co-Desarrollador(a) (Estudiante Desarrollador 2 - Lógica de Backend, Algoritmia y Pruebas):\n"
        "     - Estudiante regular de 6to. de Secundaria del Instituto Americano “AMERINST”.\n"
        "     - Programación de microservicios RESTful en PHP 8.2 con abstracción de datos PDO.\n"
        "     - Implementación del algoritmo geodésico Haversine en Python 3.11 (`calculator.py`).\n"
        "     - Integración de la pasarela de pagos Simple QR y módulo de arqueo ciego de caja.\n"
        "     - Construcción y ejecución de la suite automatizada de pruebas End-to-End (`npm test`).\n\n"
        "• Tutor Académico BTH: Docente tutor de la especialidad técnica de Sistemas Informáticos de la Unidad Educativa “AMERINST”, responsable del seguimiento metodológico, revisiones técnicas y validación pedagógica.\n"
        "• Asesor de Negocio Gastronómico: Propietario y Chef de la empresa 'Burger 24/7', quien facilitó los datos de recetas, costos de insumos, dinámicas nocturnas y validación comercial.\n"
        "• Usuarios de Evaluación Piloto: Cinco (5) clientes paceños de horario nocturno y dos (2) repartidores urbanos motorizados que colaboraron en las pruebas de campo."
    ),
    "presupuesto_tabla": {
        "titulo": "Tabla 10.1: Presupuesto Económico Detallado del Proyecto BTH (en Bolivianos - Bs.)",
        "columnas": ["Categoría de Gasto", "Descripción del Recurso", "Costo Unitario (Bs.)", "Cantidad", "Subtotal (Bs.)"],
        "filas": [
            ["Equipos (Hardware)", "Depreciación de 2 Laptops de Desarrollo", "175.00", "2 equipos", "350.00"],
            ["Equipos (Hardware)", "Dispositivos Móviles para Pruebas de Despacho", "200.00", "2 smartphones", "400.00"],
            ["Conectividad y Red", "Internet Fibra Óptica Residencial (6 meses)", "220.00", "6 meses", "1.320.00"],
            ["Servicios Básicos", "Consumo Eléctrico de Equipos de Laboratorio", "80.00", "6 meses", "480.00"],
            ["Herramientas Software", "Licencias FOSS (VS Code, MySQL, PHP, Python, Git)", "0.00", "N/A (Gratuito)", "0.00"],
            ["Infraestructura Web", "Alojamiento Web y Base de Datos (Cloud Hosting)", "150.00", "1 semestre", "900.00"],
            ["Materiales Escolares", "Papelería, Impresiones, Empastes BTH para el Colegio", "250.00", "1 paquete", "250.00"],
            ["Operativos de Campo", "Gasolina para Pruebas de Entrega de Repartidores", "50.00", "4 salidas", "200.00"],
            ["TOTAL GENERAL", "PRESUPUESTO CONSOLIDADO DEL PROYECTO BTH", "-", "-", "3.900.00 Bs."]
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
                "• Área de Informática y Sistemas: Constituye el núcleo disciplinario del proyecto mediante la aplicación práctica de arquitectura cliente-servidor, ingeniería de software orientada a la web, diseño de bases de datos relacionales normalizadas en 3FN, seguridad criptográfica (Bcrypt, JWT) y desarrollo de interfaces reactivas accesibles.\n\n"
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
                "Una vez culminadas con éxito las cinco fases de la Metodología en Cascada (Análisis, Diseño, Implementación, Verificación y Mantenimiento) del sistema web para la empresa 'Burger 24/7', se arriban a las siguientes conclusiones fundamentadas:\n\n"
                "1. Se demostró la eficacia del Modelo en Cascada Clásico como metodología de desarrollo de software para proyectos de grado del Bachillerato Técnico Humanístico (BTH), permitiendo a dos estudiantes de secundaria técnica estructurar de forma ordenada y rigurosa una solución tecnológica completa y de calidad profesional.\n\n"
                "2. La implementación del bloqueo pesimista a nivel de tupla (`SELECT ... FOR UPDATE`) dentro de unidades transaccionales ACID en MySQL InnoDB erradicó al 100% las condiciones de carrera y las sobreventas de productos en escenarios de concurrencia nocturna, garantizando una integridad de inventarios determinista.\n\n"
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
        "El desarrollo de la presente monografía en el marco del Bachillerato Técnico Humanístico (BTH) en Sistemas Informáticos ha marcado un hito definitorio y transformador en nuestra formación académica, personal y vocacional.\n\n"
        "Desde temprana edad, sentimos una profunda curiosidad por entender cómo la tecnología y las computadoras tienen la capacidad de resolver problemas cotidianos de la vida real. A lo largo de nuestra formación en la Unidad Educativa “AMERINST”, este interés se consolidó en una auténtica vocación por las ciencias de la computación, el desarrollo de software y la ingeniería de datos.\n\n"
        "Este proyecto nos ha permitido experimentar de primera mano los desafíos reales que enfrenta un equipo de desarrollo de software: dialogar con empresarios locales, entender procesos comerciales nocturnos complejos, diseñar bases de datos robustas, depurar código transaccional bajo presión y aplicar principios de seguridad de nivel industrial. Hemos comprobado que la programación no es simplemente escribir instrucciones para una máquina, sino una poderosa herramienta de transformación social, dignificación del trabajo humano y aporte tangible a la economía de nuestro país.\n\n"
        "En nuestro Proyecto de Vida, nos planteamos metas claras y escalonadas:\n"
        "• A Corto Plazo (2026-2027): Culminar con honores el Bachillerato Técnico Humanístico, obtener el título de Técnico Medio en Sistemas Informáticos otorgado por el Ministerio de Educación de Bolivia e ingresar exitosamente a la carrera universitaria de Ingeniería de Sistemas / Ciencias de la Computación en una prestigiosa casa de estudios superiores.\n"
        "• A Mediano Plazo (2027-2031): Destacarnos académicamente en el pregrado universitario, dominar arquitecturas en la nube (Cloud Computing), ciberseguridad avanzada e inteligencia artificial, participando activamente en comunidades de desarrollo tecnológico y hackatones.\n"
        "• A Largo Plazo: Fundar una empresa de desarrollo de software y consultoría tecnológica boliviana (Software Factory / Startup), especializada en proveer soluciones digitales de alta calidad para el comercio, la industria y la educación en Bolivia, generando empleos dignos para jóvenes profesionales y demostrando con orgullo que en nuestro país contamos con el talento, la disciplina y la capacidad técnica para crear tecnología de clase mundial con profundos valores éticos y cristianos."
    )
}

CAPITULO_XIV = {
    "titulo": "XIV. BIBLIOGRAFÍA",
    "referencias": [
        "Autoridad de Supervisión del Sistema Financiero [ASFI]. (2020). Circular ASFI/618: Reglamento para Servicios de Pago Móvil e Interoperabilidad de Códigos QR. La Paz, Bolivia.",
        "Banco Central de Bolivia [BCB]. (2019). Reglamento del Sistema de Pagos y Liquidación de Valores. Resolución de Directorio N° 082/2019. La Paz, Bolivia.",
        "Date, C. J. (2004). An Introduction to Database Systems (8th ed.). Addison-Wesley.",
        "Decreto Supremo N° 1793. (2013). Reglamento para el Desarrollo de Tecnologías de Información y Comunicación. Gaceta Oficial del Estado Plurinacional de Bolivia.",
        "Elmasri, R., & Navathe, S. B. (2015). Fundamentals of Database Systems (7th ed.). Pearson.",
        "EMVCo. (2020). EMV® QR Code Specification for Payment Systems: Merchant-Presented Mode (Version 1.1). EMVCo LLC.",
        "Fielding, R. T. (2000). Architectural Styles and the Design of Network-based Software Architectures (Doctoral dissertation, University of California, Irvine).",
        "Flanagan, D. (2020). JavaScript: The Definitive Guide (7th ed.). O'Reilly Media.",
        "International Organization for Standardization [ISO]. (2011). Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models (ISO/IEC Standard No. 25010:2011).",
        "International Organization for Standardization [ISO]. (2022). Information security, cybersecurity and privacy protection — Information security management systems — Requirements (ISO/IEC Standard No. 27001:2022).",
        "Jones, M., Bradley, J., & Sakimura, N. (2015). JSON Web Token (JWT) (RFC 7519). Internet Engineering Task Force (IETF).",
        "Ley N° 070. (2010). Ley de la Educación 'Avelino Siñani - Elizardo Pérez'. Gaceta Oficial del Estado Plurinacional de Bolivia.",
        "Ley N° 164. (2011). Ley General de Telecomunicaciones, Tecnologías de Información y Comunicación. Gaceta Oficial del Estado Plurinacional de Bolivia.",
        "Ley N° 453. (2013). Ley General de los Derechos de las Usuarias y los Usuarios y de las Consumidoras y los Consumidores. Gaceta Oficial del Estado Plurinacional de Bolivia.",
        "Martin, R. C. (2008). Clean Code: A Handbook of Agile Software Craftsmanship. Prentice Hall.",
        "Ministerio de Educación de Bolivia. (2023). Lineamientos y Orientaciones Metodológicas del Bachillerato Técnico Humanístico (BTH). La Paz: Viceministerio de Educación Regular.",
        "Nixon, R. (2021). Learning PHP, MySQL & JavaScript: With jQuery, CSS & HTML5 (6th ed.). O'Reilly Media.",
        "Open Web Application Security Project [OWASP]. (2021). OWASP Top 10: The Ten Most Critical Web Application Security Risks. OWASP Foundation.",
        "Provos, N., & Mazières, D. (1999). A Future-Adaptable Password Scheme. In Proceedings of the FREENIX Track: 1999 USENIX Annual Technical Conference (pp. 81-91).",
        "Royce, W. W. (1970). Managing the Development of Large Software Systems: Concepts and Techniques. In Proceedings of IEEE WESCON (Vol. 26, pp. 1-9).",
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
            "descripcion": "Especificación exhaustiva de las tablas maestras y transaccionales del esquema relacional del sistema Burger 24/7 normalizado en 3FN.",
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

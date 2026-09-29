# -*- coding: utf-8 -*-
"""
Módulo de Contenido de la Monografía BTH 2026 - Parte 1
Contiene: Carátula, Dedicatoria, Agradecimiento, Cita Bíblica, Abstract, Resumen,
Índice Estructurado, y Capítulos I al VI.
"""

METADATA = {
    "institucion": "UNIDAD EDUCATIVA",
    "colegio": "“AMERINST”\n(INSTITUTO AMERICANO)",
    "especialidad": "SISTEMAS INFORMÁTICOS",
    "subtitulo_bth": "BACHILLERATO TÉCNICO HUMANÍSTICO (BTH) - GESTIÓN 2026",
    "titulo": "SISTEMA WEB DE COMERCIO ELECTRÓNICO Y DESPACHO LOGÍSTICO EN TIEMPO REAL CON CONTROL DE INVENTARIOS APLICANDO CÓDIGOS QR Y GEORREFERENCIACIÓN PARA LA EMPRESA \"BURGER 24/7\"",
    "postulante": "Nataly Gemio",
    "tutor": "Lic. Tutor Académico de Sistemas Informáticos",
    "curso": "6to. de Secundaria",
    "lugar": "La Paz – Bolivia",
    "gestion": "2026"
}

PRELIMINARES = {
    "dedicatoria": (
        "A Dios todopoderoso, por ser la luz que guía mis pasos, la fuente inagotable de sabiduría y la fortaleza en cada momento de desafío académico y personal.\n\n"
        "A mis queridos padres y familia, cuyo amor incondicional, sacrificio constante, principios morales y apoyo constante hicieron posible la culminación de esta etapa formativa de mi vida.\n\n"
        "A mis docentes del Instituto Americano “AMERINST”, por su vocación incansable de enseñanza, su paciencia orientadora y por inculcar en cada estudiante el rigor científico, el espíritu investigativo y la pasión por la tecnología al servicio de la sociedad boliviana."
    ),
    "agradecimiento": (
        "Expreso mi más sincero y profundo agradecimiento:\n\n"
        "• A la Unidad Educativa “AMERINST”, por brindarme un espacio de formación integral con valores cristianos, humanísticos y de excelencia académica, que me ha permitido forjar mi carácter y mi vocación en el área de Sistemas Informáticos.\n\n"
        "• Al plantel docente del área técnica del Bachillerato Técnico Humanístico (BTH), por compartir generosamente sus conocimientos teóricos y prácticos, exigiéndome siempre el más alto estándar de calidad en el desarrollo de software y la resolución de problemas reales.\n\n"
        "• A mi tutor de proyecto, por sus oportunas revisiones, comentarios enriquecedores y guía metodológica indispensable en la estructuración de la presente monografía.\n\n"
        "• A la empresa gastronómica 'Burger 24/7' y a todo su equipo de trabajo, por abrir sus puertas, proveer información operativa vital, permitir el análisis de sus procesos de negocio nocturnos y confiar en este proyecto tecnológico como una alternativa innovadora de transformación digital."
    ),
    "cita_biblica": (
        "“Y todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres; sabiendo que del Señor recibiréis la recompensa de la herencia, porque a Cristo el Señor servís.”\n\n"
        "— Colosenses 3:23-24\n\n"
        "“Encomienda a Jehová tus obras, y tus pensamientos serán afirmados.”\n\n"
        "— Proverbios 16:3"
    ),
    "abstract": (
        "This monograph presents the research, design, implementation, and rigorous verification of a web-based e-commerce and real-time logistics dispatch platform with strict transactional inventory control, interoperable QR code payment verification, and geospatial routing, developed for the commercial enterprise 'Burger 24/7' in the city of La Paz, Bolivia. The modern nocturnal fast-food sector faces severe operational vulnerabilities: inventory oversales resulting from uncoordinated concurrent orders, financial fraud via forged mobile payment vouchers, erratic courier assignment with arbitrary shipping charges, and a complete absence of cryptographic audit logging and blind cash reconciliation. To eliminate these critical bottlenecks, a decoupled microservices architecture was engineered, combining modern ECMAScript 6+ Single Page Application (SPA) frontend interfaces, secure RESTful microservices (Auth, Catalog, Transactions, Rider, and Logistics) programmed in PHP 8.2 (PDO abstraction) and Python 3.11, backed by a fully normalized 3NF MySQL/MariaDB database powered by the InnoDB storage engine. Transactional consistency and race-condition immunity are guaranteed through pessimistic row-level locking (SELECT ... FOR UPDATE) executing strictly isolated ACID units of work. The logistics subengine leverages the Haversine trigonometric formula to calculate orthodromic geodesic distances between the Sopocachi dark kitchen hub and delivery destinations, establishing transparent dynamic pricing. Security is enforced through Bcrypt password hashing (cost factor 12), JSON Web Tokens (JWT HMAC-SHA256), strict role-based access control (RBAC), and immutable audit logs adhering to the Base Model Architecture Definition (BMAD). The system was fully validated through automated End-to-End (E2E) testing suites, achieving zero stock discrepancies, deterministic courier dispatch, and complete mitigation of OWASP Top 10 vulnerabilities.\n\n"
        "Keywords: E-Commerce, Microservices, ACID Transactions, Pessimistic Locking, Haversine Algorithm, QR Code Payment, BMAD Audit, BTH Systems."
    ),
    "resumen": (
        "La presente monografía expone la investigación, diseño, desarrollo y verificación exhaustiva de una plataforma web integral de comercio electrónico y despacho logístico en tiempo real con control estricto de inventarios concurrentes, pasarela de verificación de pagos con código QR y ruteo georreferenciado, desarrollada para la empresa gastronómica nocturna 'Burger 24/7' en la ciudad de La Paz, Bolivia. La industria gastronómica nocturna enfrenta desafíos operativos críticos: sobreventas de productos causadas por concurrencia descontrolada en pedidos simultáneos, vulnerabilidad a fraudes con comprobantes bancarios digitales falsificados, descoordinación en la asignación de repartidores urbanos (riders) y carencia de una auditoría forense inalterable y arqueo ciego de caja en efectivo. Para solucionar de raíz estas problemáticas, se implementó una arquitectura de microservicios REST desacoplada que integra una interfaz web Single Page Application (SPA) en Vanilla JavaScript ES6+, microservicios de backend (Auth, Catalog, Transactions, Rider y Logistics) desarrollados en PHP 8.2 con la extensión PDO y scripts matemáticos en Python 3.11, persistidos en una base de datos relacional normalizada en Tercera Forma Normal (3FN) sobre MySQL/MariaDB con motor InnoDB. La consistencia transaccional y la prevención absoluta de condiciones de carrera se garantizan mediante bloqueo pesimista a nivel de tupla (SELECT ... FOR UPDATE) bajo propiedades ACID. El subsistema logístico calcula la distancia geodésica ortodrómica aplicando la fórmula trigonométrica del Semiverseno (Haversine) desde el nodo central en Sopocachi hasta el domicilio del comensal, fijando tarifas justas y transparentes. La seguridad informática se sustenta en hashing Bcrypt (factor de costo 12), tokens JWT (HMAC-SHA256), control de acceso basado en roles (RBAC) y un registro de auditoría inmutable basado en el estándar de sobres BMAD. El software fue verificado mediante baterías automatizadas de pruebas End-to-End (E2E), logrando 100% de fiabilidad en inventarios, cero sobreventas y cumplimiento cabal de los estándares de calidad BTH e ISO/IEC 25010.\n\n"
        "Palabras Clave: Comercio Electrónico, Microservicios, Transacciones ACID, Bloqueo Pesimista, Algoritmo Haversine, Códigos QR, Auditoría BMAD, BTH Sistemas Informáticos."
    )
}

CAPITULO_I = {
    "titulo": "I. INTRODUCCIÓN",
    "contenido": (
        "En la última década, la aceleración tecnológica y la masificación del acceso a Internet de alta velocidad en dispositivos móviles han transformado de manera radical los hábitos de consumo y los modelos comerciales a nivel global y nacional. En el Estado Plurinacional de Bolivia, y de forma particularmente acentuada en las urbes metropolitanas como La Paz, el comercio electrónico (e-commerce) ha dejado de ser una opción accesoria para convertirse en un canal primario e indispensable de subsistencia y crecimiento empresarial. Tras los fenómenos sociales y sanitarios globales recientes, los consumidores paceños adoptaron con celeridad plataformas digitales para la adquisición de bienes de consumo inmediato, posicionando al sector gastronómico de comida rápida en la vanguardia de esta revolución transaccional.\n\n"
        "No obstante, el auge del comercio electrónico ha revelado severas asimetrías y vulnerabilidades en las micro y pequeñas empresas gastronómicas. Gran parte de estos negocios opera bajo un esquema tradicional o semidigitalizado altamente precario, dependiendo de canales de mensajería instantánea no estructurados (tales como WhatsApp o llamadas telefónicas) o sometiéndose a plataformas internacionales de intermediación por agregadores (delivery apps). Este último modelo impone comisiones comerciales desproporcionadas que oscilan entre el 20% y el 30% sobre el valor bruto de cada venta, asfixiando los márgenes operativos de las empresas locales e incrementando innecesariamente el precio final transferido al consumidor.\n\n"
        "En este escenario comercial surge la empresa 'Burger 24/7', un emprendimiento paceño especializado en la elaboración y expendio de hamburguesas artesanales, complementos y bebidas con un modelo de operación enfocado en el horario nocturno y de madrugada (dark kitchen / cocina fantasma). Dicho segmento temporal, caracterizado por una alta demanda insatisfecha entre las 20:00 y las 06:00 horas, plantea retos logísticos y operativos de extrema complejidad: personal de despacho reducido, clientes dispersos geográficamente a lo largo de la topografía accidentada de la hoyada paceña, requerimiento de entregas ultrarrápidas y un flujo continuo de transacciones concurrentes.\n\n"
        "La operación empírica de Burger 24/7 evidenció fallas sistemáticas críticas: desincronización de inventarios (sobreventa de hamburguesas y bebidas cuyos insumos ya se encontraban agotados en cocina física), demoras operativas en la confirmación de pedidos, falta de verificación fehaciente en la recepción de comprobantes de pago por código QR (lo que generaba pérdidas por estafas con comprobantes bancarios simulados o editados gráficamente), asignación desordenada de repartidores urbanos (riders) y la ausencia total de un control de caja que impidiera el desvío o la confusión de dinero en efectivo recaudado durante las entregas contra entrega.\n\n"
        "Ante esta problemática multidimensional, la presente monografía detalla el proceso científico, técnico y metodológico seguido para diseñar, desarrollar, desplegar y verificar un 'Sistema Web de Comercio Electrónico y Despacho Logístico en Tiempo Real con Control de Inventarios Aplicando Códigos QR y Georreferenciación'. El sistema propone una solución tecnológica de soberanía propia e independiente, basada en una arquitectura moderna de microservicios desacoplados (Auth, Catalog, Transactions, Rider y Logistics) comunicados mediante protocolos REST seguros, con control de concurrencia estricto en bases de datos relacionales MySQL/MariaDB (InnoDB con bloqueo pesimista `SELECT ... FOR UPDATE`), georreferenciación cartográfica mediante la fórmula matemática de Haversine y trazabilidad inmutable bajo el estándar de sobres BMAD.\n\n"
        "La investigación y el artefacto informático resultante se enmarcan en los lineamientos pedagógicos del Bachillerato Técnico Humanístico (BTH) en la especialidad de Sistemas Informáticos del Instituto Americano 'AMERINST', respondiendo a las directrices de la Ley de Educación N° 070 'Avelino Siñani - Elizardo Pérez' para la articulación de la ciencia y la tecnología con la producción comunitaria y la solución tangible de necesidades socioeconómicas del entorno paceño."
    )
}

CAPITULO_II = {
    "titulo": "II. PLANTEAMIENTO DEL PROBLEMA",
    "secciones": [
        {
            "subtitulo": "2.1 PROBLEMA PRINCIPAL",
            "contenido": (
                "La empresa gastronómica 'Burger 24/7' en la ciudad de La Paz carece de un sistema informático transaccional automatizado, centralizado y seguro para la gestión de su comercio electrónico y logística nocturna, lo cual genera sobreventas críticas de productos por falta de control concurrente de inventario, demoras y pérdidas económicas por recepción de pagos digitales no validados fehacientemente mediante códigos QR, desorganización en el despacho georreferenciado de repartidores y falta de conciliación financiera de las ventas en efectivo y caja chica, deteriorando gravemente la rentabilidad, la reputación comercial y la experiencia de los clientes paceños.\n\n"
                "De manera formal, el problema central se sintetiza en la siguiente interrogante de investigación:\n\n"
                "¿De qué manera el diseño e implementación de un sistema web de comercio electrónico con arquitectura de microservicios, control transaccional concurrente de inventarios (bloqueo pesimista), verificación criptográfica de pagos QR y cálculo logístico geodésico optimizará los procesos de venta, control de existencias, despacho en tiempo real y arqueo de caja de la empresa 'Burger 24/7' en la ciudad de La Paz durante la gestión 2026?"
            )
        },
        {
            "subtitulo": "2.2 PROBLEMAS SECUNDARIOS",
            "contenido": (
                "Del problema general identificado se desprenden los siguientes problemas específicos y secundarios que afectan directamente la cadena de valor de la empresa:\n\n"
                "a) Inexistencia de un mecanismo de control de concurrencia a nivel de base de datos para la actualización del stock disponible, lo que propicia condiciones de carrera (race conditions) y sobreventas sistemáticas cuando múltiples comensales realizan pedidos simultáneos en horarios pico.\n\n"
                "b) Vulnerabilidad financiera en la validación de pagos digitales mediante códigos QR del sistema interbancario Simple, debido a la verificación visual empírica de capturas de pantalla enviadas por mensajería, facilitando fraudes por comprobantes clonados o falsificados.\n\n"
                "c) Falta de un motor de cálculo georreferenciado que determine con exactitud geodésica las distancias entre la cocina operativa (Sopocachi) y el destino de entrega del cliente, provocando cobros arbitrarios de tarifa de envío y retrasos por desconocimiento de las rutas óptimas.\n\n"
                "d) Carencia de una plataforma digital dedicada para los repartidores urbanos (riders) que gestione el ciclo de vida de los envíos (asignación, en preparación, en camino, entrega confirmada) y que registre el expediente de identidad laboral para evitar suplantaciones.\n\n"
                "e) Ausencia de un arqueo de caja con doble confirmación para las transacciones liquidadas contra entrega en efectivo, generando descuadres recurrentes entre lo recaudado por el repartidor y lo reportado a gerencia.\n\n"
                "f) Inexistencia de registros de auditoría inmutables (audit trail) que impidan la manipulación malintencionada de estados de pedidos, precios de productos o eliminaciones no autorizadas en la base de datos."
            )
        }
    ]
}

CAPITULO_III = {
    "titulo": "III. JUSTIFICACIÓN",
    "secciones": [
        {
            "subtitulo": "3.1 Justificación Técnica",
            "contenido": (
                "Desde la perspectiva técnica y de la ingeniería de software, el proyecto se fundamenta en la aplicación rigurosa de metodologías modernas de desarrollo, patrones arquitectónicos desacoplados y estándares de seguridad web reconocidos internacionalmente.\n\n"
                "El sistema adopta una arquitectura de microservicios RESTful (Auth, Catalog, Transactions, Rider y Logistics), desacoplando las responsabilidades funcionales y permitiendo que cada componente escale y evolucione de manera independiente. En la capa de persistencia se utiliza el motor transaccional InnoDB de MySQL/MariaDB estructurado bajo la Tercera Forma Normal (3FN), garantizando el cumplimiento estricto de las propiedades ACID (Atomicidad, Consistencia, Aislamiento y Durabilidad). Se implementa el bloqueo pesimista a nivel de tupla (`SELECT ... FOR UPDATE`), resolviendo de forma determinista la concurrencia masiva y eliminando el riesgo de sobreventas.\n\n"
                "Asimismo, en la capa de transporte y frontend se hace uso de estándares abiertos: Vanilla JavaScript moderno (ECMAScript 6+) estructurado en módulos SPA sin la sobrecarga ni la vulnerabilidad de dependencias masivas externas, comunicación asíncrona mediante Fetch API, y la implementación del estándar de sobres BMAD (Base Model Architecture Definition) para estructurar respuestas uniformes (`status`, `data`, `audit`, `error_details`). El cálculo geodésico se apoya en la trigonometría esférica de Haversine programada en Python 3.11, y la seguridad criptográfica se blinda mediante hashing Bcrypt y autenticación de sesiones stateless mediante tokens JWT con firma HMAC-SHA256."
            )
        },
        {
            "subtitulo": "3.2 Justificación Económica",
            "contenido": (
                "En el plano económico, la implementación de una plataforma de comercio electrónico de propiedad exclusiva de 'Burger 24/7' representa un ahorro financiero sustancial e inmediato frente al modelo dependiente de empresas de intermediación de pedidos (delivery aggregators).\n\n"
                "Actualmente, las aplicaciones transnacionales cobran entre el 22% y el 30% de comisión por cada pedido procesado a través de su plataforma. Para una dark kitchen que factura un promedio mensual de 45.000 Bs. en pedidos a domicilio, el pago de comisiones intermediarias representa una fuga de capital de entre 9.900 Bs. y 13.500 Bs. mensuales (más de 120.000 Bs. anuales que abandonan la economía de la empresa).\n\n"
                "Al disponer de un sistema propio, la empresa recupera el 100% del margen de venta directo. La inversión de desarrollo requerida para la puesta en marcha del sistema se amortiza en los primeros dos meses de operación comercial continua. Adicionalmente, el cálculo automatizado de tarifas de envío basado en distancias geodésicas reales transparenta el cobro al consumidor y optimiza los costos de combustible de los repartidores, generando una estructura de costos predecible, altamente competitiva y financieramente sostenible."
            )
        },
        {
            "subtitulo": "3.3 Justificación Social",
            "contenido": (
                "Desde el punto de vista social y comunitario, el proyecto aporta significativamente al bienestar de los ciudadanos paceños y al fortalecimiento del ecosistema laboral juvenil:\n\n"
                "a) Inclusión Laboral Justa: Proporciona a los repartidores urbanos (riders) un canal de trabajo transparente y digno, donde su identidad laboral es validada oficialmente mediante el registro de su Cédula de Identidad (C.I.) y donde el registro de sus entregas y liquidaciones monetarias es público e inalterable, evitando cobros indebidos o deudas ficticias de caja.\n\n"
                "b) Seguridad y Comodidad Ciudadana: En una urbe con complejas dinámicas nocturnas como La Paz, el sistema permite a familias, trabajadores de turno nocturno, estudiantes y personal de salud acceder a alimentación caliente y de calidad sin exponerse a los riesgos de la vía pública en horas de la madrugada.\n\n"
                "c) Inclusión Financiera Digital: Promueve activamente el uso de pagos electrónicos mediante códigos QR interbancarios (Simple), reduciendo el manejo de efectivo físico y disminuyendo los riesgos de robos o recepción de billetes falsificados, coadyuvando a la modernización de los pagos en el comercio minorista boliviano."
            )
        }
    ]
}

CAPITULO_IV = {
    "titulo": "IV. ALCANCES Y DELIMITACIONES",
    "secciones": [
        {
            "subtitulo": "4.1 DESTINATARIOS",
            "contenido": (
                "Los beneficiarios y destinatarios directos e indirectos del presente sistema informático se dividen en cuatro estamentos de usuarios claramente tipificados:\n\n"
                "1. Clientes Finales (Consumidores): Habitantes de la ciudad de La Paz que buscan adquirir alimentos preparados con atención 24/7. Cuentan con un portal responsivo e intuitivo para explorar el menú por categorías, verificar disponibilidad de stock en tiempo real, armar su carrito de compras, ingresar su dirección y punto de georreferenciación GPS, elegir método de pago (QR o Efectivo) y monitorear el avance de su pedido en tiempo real.\n\n"
                "2. Repartidores Urbanos (Riders): Personal logístico motorizado o ciclista encargado del traslado físico del pedido. Disponen de un módulo móvil donde visualizan pedidos listos para retiro, aceptan despachos, acceden al punto de entrega en mapa georreferenciado, confirman la entrega del pedido y gestionan su arqueo de caja chica.\n\n"
                "3. Personal de Cocina y Despacho: Operarios de la dark kitchen que visualizan en una pantalla de comandas los pedidos pagados y autorizados en tiempo real, actualizan el estado de preparación y coordinan la entrega del empaque al repartidor asignado.\n\n"
                "4. Administradores y Gerencia General: Responsables de la gestión del catálogo de productos y precios, aprobación del registro documental de nuevos repartidores (verificación de C.I.), monitoreo de transacciones en vivo, arqueo general de cajas y extracción de reportes financieros consolidados."
            )
        },
        {
            "subtitulo": "4.2 DELIMITACIÓN ESPACIO-TEMPORAL Y TECNOLÓGICA",
            "contenido": (
                "El alcance del proyecto se delimita bajo los siguientes parámetros técnicos y geográficos:\n\n"
                "• Delimitación Espacial (Geográfica): La investigación y el despliegue operativo del sistema se circunscriben al área urbana del Municipio de La Paz, abarcando de forma prioritaria los macrodistritos Centro, Cotahuma (Sopocachi), San Antonio (Miraflores), Sur (Obrajes, Calacoto, San Miguel) y Mallasa, en un radio geodésico inicial de cobertura de 7.5 kilómetros desde el centro operativo de cocina.\n\n"
                "• Delimitación Temporal: El ciclo de análisis, diseño, desarrollo, pruebas de laboratorio y verificación operativa del sistema se ejecutó durante el periodo comprendido entre febrero y octubre de la gestión 2026, correspondiente al calendario académico oficial del BTH.\n\n"
                "• Delimitación Tecnológica: El sistema opera como una aplicación web multiplataforma (Web App SPA) construida bajo estándares W3C, compatible con cualquier navegador web moderno (Google Chrome, Mozilla Firefox, Safari, Microsoft Edge) tanto en entornos de escritorio como en terminales móviles Android e iOS. En la capa de backend se implementan microservicios en PHP 8.2 y Python 3.11, persistidos en base de datos relacional MySQL/MariaDB 8.0."
            )
        }
    ]
}

CAPITULO_V = {
    "titulo": "V. LOCALIZACIÓN O UBICACIÓN",
    "contenido": (
        "El nodo central de operaciones, cocina de producción especializada (dark kitchen) y centro de despacho logístico de la empresa 'Burger 24/7' se encuentra estratégicamente situado en el macrodistrito Cotahuma, zona Sopocachi de la ciudad de La Paz, Estado Plurinacional de Bolivia.\n\n"
        "Dirección Física: Avenida 20 de Octubre esq. Fernando Guachalla, Edificio 'Torre Central', Planta Baja, Local N° 3.\n"
        "Coordenadas Geodésicas de Origen (WGS84):\n"
        "• Latitud: -16.5050° S (-16° 30' 18.0\" S)\n"
        "• Longitud: -68.1290° O (-68° 07' 44.4\" O)\n"
        "• Altitud: 3.620 metros sobre el nivel del mar.\n\n"
        "Esta localización fue seleccionada debido a su ubicación neurálgica y equidistante dentro de la topografía paceña, permitiendo una rápida conectividad vial hacia el Centro Histórico (5 minutos), la Zona Sur a través de la vía troncal de la Avenida Arce y el Puente de las Américas hacia Miraflores (7 minutos), garantizando que las entregas nocturnas mantengan la temperatura óptima de los alimentos en tiempos inferiores a 30 minutos dentro del radio de 7.5 kilómetros."
    )
}

CAPITULO_VI = {
    "titulo": "VI. OBJETIVOS",
    "secciones": [
        {
            "subtitulo": "6.1 OBJETIVO GENERAL",
            "contenido": (
                "Desarrollar e implementar un sistema web integral de comercio electrónico y gestión logística en tiempo real con control estricto de inventarios mediante transacciones ACID con bloqueo pesimista, pasarela de verificación de pagos QR y ruteo georreferenciado, optimizando el ciclo comercial nocturno, la seguridad transaccional y el arqueo de caja de la empresa gastronómica 'Burger 24/7' en la ciudad de La Paz durante la gestión 2026."
            )
        },
        {
            "subtitulo": "6.2 OBJETIVOS ESPECÍFICOS",
            "contenido": (
                "Para alcanzar el objetivo general planteado, se formulan los siguientes objetivos específicos de naturaleza técnica y metodológica:\n\n"
                "1. Diseñar una arquitectura distribuida de microservicios RESTful desacoplados (Auth, Catalog, Transactions, Rider y Logistics) comunicados bajo el estándar de sobres BMAD y asegurados mediante autenticación basada en tokens JSON Web Tokens (JWT HMAC-SHA256) y hashing Bcrypt.\n\n"
                "2. Implementar un módulo transaccional de control concurrente de inventario a nivel de motor de base de datos MySQL/MariaDB InnoDB aplicando la instrucción `SELECT ... FOR UPDATE` dentro de unidades de trabajo ACID para evitar sobreventas o inconsistencias de stock en compras simultáneas.\n\n"
                "3. Desarrollar una pasarela de verificación de comprobantes de pago por código QR acorde a los estándares interbancarios de Bolivia (Simple QR / EMVCo), que asocie unívocamente el comprobante bancario a la orden generada con auditoría visual y administrativa.\n\n"
                "4. Programar un motor de cálculo logístico geodésico en Python basado en la fórmula trigonométrica del Semiverseno (Haversine) integrado con librerías cartográficas Leaflet/OpenStreetMap para calcular distancias ortodrómicas y tarifas de envío dinámicas de forma automatizada.\n\n"
                "5. Construir un módulo especializado para la gestión de repartidores urbanos (riders) que contemple el registro con carga de Cédula de Identidad (C.I.), validación administrativa previa, asignación secuencial de despachos y arqueo ciego de liquidación de dinero en efectivo.\n\n"
                "6. Validar exhaustivamente la seguridad, robustez y mantenibilidad del sistema mediante una suite automatizada de pruebas End-to-End (E2E), matrices de prueba funcionales y evaluación de vulnerabilidades según el estándar OWASP Top 10."
            )
        }
    ]
}

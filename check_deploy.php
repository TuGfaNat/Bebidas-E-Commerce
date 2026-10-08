<?php
/**
 * ============================================================================
 * Burger 24/7 - Script de Diagnóstico y Verificación de Despliegue (check_deploy)
 * ============================================================================
 * Verifica el estado del entorno XAMPP / Apache / PHP 8.2 / MySQL 8:
 *  1. Entorno PHP y Extensiones requeridas (pdo_mysql, openssl, mbstring, json, fileinfo)
 *  2. Archivos y Variables de Entorno (.env, JWT_SECRET, ALLOWED_ORIGINS)
 *  3. Conexión a Base de Datos MySQL (burger_shop, charset utf8mb4, tablas, datos)
 *  4. Permisos de escritura y seguridad (.htaccess) en carpetas uploads/
 *  5. Middleware CORS y generación/validación de tokens JWT
 *
 * Ejecutable tanto desde CLI como desde Navegador Web:
 *   CLI:       php check_deploy.php
 *   Navegador: http://localhost/Burger-E-Commerce/check_deploy.php
 * ============================================================================
 */

$isCli = (php_sapi_name() === 'cli');

// Definir colores para terminal CLI
$cReset  = $isCli ? "\033[0m" : "";
$cGreen  = $isCli ? "\033[32m" : "";
$cRed    = $isCli ? "\033[31m" : "";
$cYellow = $isCli ? "\033[33m" : "";
$cCyan   = $isCli ? "\033[36m" : "";
$cBold   = $isCli ? "\033[1m" : "";

$results = [
    'passed' => 0,
    'warnings' => 0,
    'failed' => 0,
    'details' => []
];

function reportItem($section, $item, $status, $message, $suggestion = null) {
    global $results, $isCli, $cGreen, $cRed, $cYellow, $cReset, $cBold;
    
    if ($status === 'OK') {
        $results['passed']++;
        $tag = $isCli ? "{$cGreen}[PASS]{$cReset}" : "<span style='color: #22c55e; font-weight: bold;'>[PASS]</span>";
    } elseif ($status === 'WARN') {
        $results['warnings']++;
        $tag = $isCli ? "{$cYellow}[WARN]{$cReset}" : "<span style='color: #eab308; font-weight: bold;'>[WARN]</span>";
    } else {
        $results['failed']++;
        $tag = $isCli ? "{$cRed}[FAIL]{$cReset}" : "<span style='color: #ef4444; font-weight: bold;'>[FAIL]</span>";
    }

    $results['details'][] = [
        'section' => $section,
        'item' => $item,
        'status' => $status,
        'message' => $message,
        'suggestion' => $suggestion
    ];

    if ($isCli) {
        echo "  $tag $item: $message\n";
        if ($suggestion && $status !== 'OK') {
            echo "         {$cYellow}↳ Sugerencia: $suggestion{$cReset}\n";
        }
    }
}

function printSectionHeader($title) {
    global $isCli, $cCyan, $cReset, $cBold;
    if ($isCli) {
        echo "\n{$cCyan}{$cBold}=== $title ==={$cReset}\n";
    }
}

// Iniciar encabezado de página si es navegador
if (!$isCli) {
    header('Content-Type: text/html; charset=utf-8');
    echo "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Check Deploy - Burger 24/7</title>";
    echo "<style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; }
        .container { max-width: 900px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 2rem; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        h1 { color: #f97316; margin-top: 0; font-size: 1.8rem; }
        h2 { color: #38bdf8; font-size: 1.2rem; border-bottom: 1px solid #334155; padding-bottom: 0.5rem; margin-top: 1.5rem; }
        .item { display: flex; align-items: baseline; gap: 0.75rem; padding: 0.4rem 0; border-bottom: 1px solid #273549; }
        .item-name { font-weight: 600; min-width: 220px; }
        .item-msg { color: #cbd5e1; flex-grow: 1; }
        .suggestion { font-size: 0.85rem; color: #fbbf24; margin-top: 0.25rem; }
        .summary { margin-top: 2rem; padding: 1.25rem; border-radius: 8px; font-size: 1.1rem; font-weight: bold; }
        .summary-ok { background: #064e3b; color: #6ee7b7; border: 1px solid #059669; }
        .summary-fail { background: #7f1d1d; color: #fca5a5; border: 1px solid #dc2626; }
    </style></head><body><div class='container'>";
    echo "<h1>Burger 24/7 - Checklist de Despliegue en XAMPP / Apache</h1>";
} else {
    echo "========================================================================\n";
    echo "     Burger 24/7 - Script de Diagnóstico de Despliegue (check_deploy)    \n";
    echo "========================================================================\n";
}

// ----------------------------------------------------------------------------
// 1. VERIFICAR VERSIÓN DE PHP Y EXTENSIONES
// ----------------------------------------------------------------------------
printSectionHeader("1. Verificación de Entorno PHP");
$phpVersion = PHP_VERSION;
if (version_compare($phpVersion, '8.2.0', '>=')) {
    reportItem("PHP", "Versión PHP", "OK", "PHP $phpVersion (Cumple el estándar recomendado PHP 8.2+)");
} elseif (version_compare($phpVersion, '8.0.0', '>=')) {
    reportItem("PHP", "Versión PHP", "WARN", "PHP $phpVersion (Funcional, pero se recomienda PHP 8.2+ para producción)", "Actualice PHP en su XAMPP si es posible.");
} else {
    reportItem("PHP", "Versión PHP", "FAIL", "PHP $phpVersion (Se requiere PHP >= 8.0)", "Instale o active XAMPP con PHP 8.2.");
}

$requiredExtensions = [
    'pdo' => 'Capa de abstracción de base de datos PDO',
    'pdo_mysql' => 'Controlador MySQL para PDO',
    'openssl' => 'Criptografía y hashing seguro para JWT',
    'mbstring' => 'Manejo seguro de caracteres multibyte y UTF-8',
    'json' => 'Serialización y deserialización de payloads JSON',
    'fileinfo' => 'Validación segura de tipos MIME en subida de archivos (C.I., licencias, QR)'
];

foreach ($requiredExtensions as $ext => $desc) {
    if (extension_loaded($ext)) {
        reportItem("PHP", "Extensión '$ext'", "OK", "Habilitada ($desc)");
    } else {
        reportItem("PHP", "Extensión '$ext'", "FAIL", "Falta la extensión '$ext' ($desc)", "Habilite extension=$ext en su archivo php.ini de XAMPP.");
    }
}

// ----------------------------------------------------------------------------
// 2. VERIFICAR CARGA DE ARCHIVO .ENV Y SECRETOS
// ----------------------------------------------------------------------------
printSectionHeader("2. Variables de Entorno y Secretos (.env)");

$envPaths = [
    __DIR__ . '/.env',
    __DIR__ . '/microservices/Auth/.env',
    __DIR__ . '/microservices/Catalog/.env'
];

$envFound = false;
$foundPath = null;
foreach ($envPaths as $p) {
    if (file_exists($p)) {
        $envFound = true;
        $foundPath = $p;
        // Cargar variables
        $lines = file($p, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || strpos($line, '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($k, $v) = explode('=', $line, 2);
                $k = trim($k);
                $v = trim($v, "\"' \t\n\r\0\x0B");
                if (!isset($_ENV[$k])) $_ENV[$k] = $v;
                if (getenv($k) === false) putenv("$k=$v");
            }
        }
        break;
    }
}

if ($envFound) {
    reportItem("ENV", "Archivo .env", "OK", "Encontrado en " . basename(dirname($foundPath)) . '/' . basename($foundPath));
} else {
    reportItem("ENV", "Archivo .env", "FAIL", "No se encontró ningún archivo .env", "Copie .env.example como .env: cp .env.example .env");
}

// Validar JWT_SECRET
$jwtSecret = getenv('JWT_SECRET') ?: ($_ENV['JWT_SECRET'] ?? '');
$defaultSecretPlaceholder = 'your_jwt_secret_here_change_in_production';
$bannedHardcodedSecret = 'c53a0c7a8788d5ed3e796f49c7de19b493cf5ffc6f657fe0377e993a80bd2d98';

if (empty($jwtSecret)) {
    reportItem("ENV", "JWT_SECRET", "FAIL", "La variable JWT_SECRET no está definida en .env", "Defina una clave secreta segura de al menos 32 caracteres en .env.");
} elseif ($jwtSecret === $defaultSecretPlaceholder) {
    reportItem("ENV", "JWT_SECRET", "WARN", "JWT_SECRET tiene el valor por defecto de plantilla", "Reemplace el valor por defecto en .env con una clave única generada con: openssl rand -hex 32");
} elseif ($jwtSecret === $bannedHardcodedSecret) {
    reportItem("ENV", "JWT_SECRET", "FAIL", "Está utilizando la clave hardcodeada antigua del repositorio que ya no debe usarse", "Genere un nuevo secreto en .env.");
} elseif (strlen($jwtSecret) < 32) {
    reportItem("ENV", "JWT_SECRET", "WARN", "JWT_SECRET tiene menos de 32 caracteres (Longitud: " . strlen($jwtSecret) . ")", "Use una clave de al menos 32 caracteres para resistencia criptográfica.");
} else {
    reportItem("ENV", "JWT_SECRET", "OK", "Configurado correctamente (" . strlen($jwtSecret) . " caracteres, secreto no expuesto)");
}

// Validar ALLOWED_ORIGINS
$allowedOrigins = getenv('ALLOWED_ORIGINS') ?: ($_ENV['ALLOWED_ORIGINS'] ?? '');
if (empty($allowedOrigins)) {
    reportItem("ENV", "ALLOWED_ORIGINS", "WARN", "ALLOWED_ORIGINS no está configurado en .env", "Defina ALLOWED_ORIGINS=http://localhost,http://127.0.0.1 en .env.");
} else {
    reportItem("ENV", "ALLOWED_ORIGINS", "OK", "Configurado: $allowedOrigins");
}

// Validar DB_NAME
$dbName = getenv('DB_NAME') ?: ($_ENV['DB_NAME'] ?? 'burger_shop');
if ($dbName === 'burger_shop') {
    reportItem("ENV", "DB_NAME", "OK", "Configurado para base de datos objetivo: burger_shop");
} else {
    reportItem("ENV", "DB_NAME", "WARN", "Configurado como '$dbName' (el estándar del ticket es 'burger_shop')", "Verifique si desea cambiarlo a burger_shop en .env.");
}

// ----------------------------------------------------------------------------
// 3. VERIFICAR CONEXIÓN Y ESTRUCTURA DE BASE DE DATOS MYSQL
// ----------------------------------------------------------------------------
printSectionHeader("3. Base de Datos MySQL (burger_shop)");

$dbHost = getenv('DB_HOST') ?: ($_ENV['DB_HOST'] ?? '127.0.0.1');
$dbPort = getenv('DB_PORT') ?: ($_ENV['DB_PORT'] ?? '3306');
$dbUser = getenv('DB_USER') ?: ($_ENV['DB_USER'] ?? 'root');
$dbPass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : ($_ENV['DB_PASS'] ?? '');
$dbCharset = getenv('DB_CHARSET') ?: ($_ENV['DB_CHARSET'] ?? 'utf8mb4');

$pdo = null;
try {
    $dsn = "mysql:host=$dbHost;port=$dbPort;dbname=$dbName;charset=$dbCharset";
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    reportItem("DB", "Conexión MySQL", "OK", "Conectado exitosamente a '$dbName' en $dbHost:$dbPort con usuario '$dbUser'");
} catch (PDOException $e) {
    reportItem("DB", "Conexión MySQL", "FAIL", "Fallo al conectar: " . $e->getMessage(), "Inicie el servicio MySQL en XAMPP y ejecute: php migrate.php o importe install_db.sql.");
}

if ($pdo) {
    // Verificar versión y charset
    try {
        $serverVer = $pdo->query("SELECT VERSION()")->fetchColumn();
        reportItem("DB", "Versión Motor MySQL", "OK", "Versión: $serverVer");
        
        $charStmt = $pdo->query("SHOW VARIABLES LIKE 'character_set_database'");
        $charRow = $charStmt->fetch();
        $dbChar = $charRow['Value'] ?? 'desconocido';
        if (strpos($dbChar, 'utf8') !== false) {
            reportItem("DB", "Charset MySQL", "OK", "Charset de BD: $dbChar (compatible UTF8mb4)");
        } else {
            reportItem("DB", "Charset MySQL", "WARN", "Charset actual: $dbChar (se recomienda utf8mb4)");
        }
    } catch (Exception $e) {
        reportItem("DB", "Metadatos Motor", "WARN", $e->getMessage());
    }

    // Verificar existencia de las 6 tablas
    $expectedTables = ['users', 'productos', 'pedidos', 'pedido_detalles', 'documentacion_rider', 'auditoria_logs'];
    try {
        $tablesStmt = $pdo->query("SHOW TABLES");
        $existingTables = $tablesStmt->fetchAll(PDO::FETCH_COLUMN);
        
        $missing = array_diff($expectedTables, $existingTables);
        if (empty($missing)) {
            reportItem("DB", "Tablas Relacionales", "OK", "Las 6 tablas existen (" . implode(', ', $expectedTables) . ")");
        } else {
            reportItem("DB", "Tablas Relacionales", "FAIL", "Faltan tablas: " . implode(', ', $missing), "Ejecute 'php migrate.php' o importe 'install_db.sql'.");
        }
    } catch (Exception $e) {
        reportItem("DB", "Tablas Relacionales", "FAIL", $e->getMessage());
    }

    // Verificar datos semilla
    try {
        $userCount = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
        if ($userCount > 0) {
            reportItem("DB", "Usuarios Registrados", "OK", "Total: $userCount usuarios en la tabla 'users'");
        } else {
            reportItem("DB", "Usuarios Registrados", "WARN", "Tabla 'users' está vacía", "Ejecute el seed desde install_db.sql.");
        }

        $prodCount = $pdo->query("SELECT COUNT(*) FROM productos")->fetchColumn();
        if ($prodCount > 0) {
            reportItem("DB", "Catálogo de Productos", "OK", "Total: $prodCount productos en la tabla 'productos'");
        } else {
            reportItem("DB", "Catálogo de Productos", "WARN", "Tabla 'productos' está vacía", "Ejecute el seed desde install_db.sql.");
        }
    } catch (Exception $e) {}
}

// ----------------------------------------------------------------------------
// 4. VERIFICAR DIRECTORIOS UPLOADS, PERMISOS DE ESCRITURA Y .HTACCESS
// ----------------------------------------------------------------------------
printSectionHeader("4. Directorios de Carga de Archivos (Uploads) y Seguridad");

$uploadDirectories = [
    __DIR__ . '/uploads/ci',
    __DIR__ . '/uploads/docs',
    __DIR__ . '/uploads/qr',
    __DIR__ . '/microservices/Auth/uploads/ci',
    __DIR__ . '/microservices/Auth/uploads/docs',
    __DIR__ . '/microservices/Auth/uploads/qr'
];

foreach ($uploadDirectories as $dir) {
    $relDir = str_replace(__DIR__ . DIRECTORY_SEPARATOR, '', $dir);
    $relDir = str_replace('\\', '/', $relDir);

    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }

    if (is_dir($dir)) {
        // Probar escritura y borrado real
        $testFile = $dir . '/.write_test_' . time() . '.tmp';
        $writeOk = @file_put_contents($testFile, "test") !== false;
        if ($writeOk && file_exists($testFile)) {
            @unlink($testFile);
            reportItem("Uploads", "Permisos en '$relDir'", "OK", "Directorio existe y tiene permisos de lectura/escritura");
        } else {
            reportItem("Uploads", "Permisos en '$relDir'", "FAIL", "Directorio no tiene permisos de escritura para Apache", "Otorgue permisos de escritura a la carpeta '$relDir'.");
        }

        // Verificar protección .htaccess
        $htaccess = $dir . '/.htaccess';
        $parentHtaccess = dirname($dir) . '/.htaccess';
        if (file_exists($htaccess) || file_exists($parentHtaccess)) {
            reportItem("Uploads", "Seguridad .htaccess en '$relDir'", "OK", "Protección contra ejecución directa de scripts presente");
        } else {
            reportItem("Uploads", "Seguridad .htaccess en '$relDir'", "WARN", "Falta .htaccess para bloquear ejecución de scripts PHP", "Cree un .htaccess que bloquee FilesMatch con extensiones ejecutables.");
        }
    } else {
        reportItem("Uploads", "Directorio '$relDir'", "FAIL", "No se pudo crear ni acceder al directorio", "Cree la carpeta '$relDir' manualmente.");
    }
}

// ----------------------------------------------------------------------------
// 5. VERIFICAR COMPONENTES CRÍTICOS DE CÓDIGO (JWT Y LOGIN CONTRA MYSQL)
// ----------------------------------------------------------------------------
printSectionHeader("5. Validación de Módulos PHP (JWT & Seguridad)");

require_once __DIR__ . '/microservices/Auth/connection.php';
require_once __DIR__ . '/microservices/Auth/jwt.php';
require_once __DIR__ . '/microservices/Auth/security.php';

try {
    $samplePayload = ['user_id' => 999, 'role' => 'cliente', 'email' => 'test@deploy.com'];
    $token = JWTHelper::generateToken($samplePayload, 60);
    $decoded = JWTHelper::validateToken($token);
    
    if ($decoded && $decoded['user_id'] === 999) {
        reportItem("Auth", "Generación y Validación JWT", "OK", "Tokens se firman y validan con éxito utilizando HMAC-SHA256 y .env");
    } else {
        reportItem("Auth", "Generación y Validación JWT", "FAIL", "Fallo al descodificar o validar el token generado.");
    }
} catch (Exception $e) {
    reportItem("Auth", "Generación y Validación JWT", "FAIL", $e->getMessage());
}

// ----------------------------------------------------------------------------
// 6. VERIFICAR MÓDULO CRÍTICO DE RENDIMIENTO EN C++ (SPEC.md Sección 2)
// ----------------------------------------------------------------------------
printSectionHeader("6. Módulo Crítico de Rendimiento en C++ (SPEC §2)");

$cppSource = __DIR__ . '/cpp/motor_core.cpp';
$cppBinary = __DIR__ . '/cpp/motor_core.exe';

if (file_exists($cppSource)) {
    reportItem("C++", "Código Fuente C++", "OK", "Código fuente 'cpp/motor_core.cpp' presente");
} else {
    reportItem("C++", "Código Fuente C++", "FAIL", "No se encontró 'cpp/motor_core.cpp'", "Verifique los archivos del repositorio.");
}

if (file_exists($cppBinary)) {
    // Probar ejecución del binario pasando un JSON mínimo
    $testPayload = json_encode([
        'user_id' => 999,
        'distancia_km' => 1.5,
        'items' => [
            ['producto_id' => 1, 'nombre' => 'Test', 'precio' => 10.0, 'cantidad' => 1, 'stock_disponible' => 5]
        ]
    ]);

    $descriptorspec = [
        0 => ["pipe", "r"],
        1 => ["pipe", "w"],
        2 => ["pipe", "w"]
    ];

    $process = @proc_open('"' . $cppBinary . '"', $descriptorspec, $pipes);
    if (is_resource($process)) {
        fwrite($pipes[0], $testPayload);
        fclose($pipes[0]);
        $out = stream_get_contents($pipes[1]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        $code = proc_close($process);

        $json = json_decode($out, true);
        if ($code === 0 && ($json['status'] ?? '') === 'success') {
            $us = $json['audit']['tiempo_computo_us'] ?? 0;
            reportItem("C++", "Binario Compilado y Operativo", "OK", "motor_core.exe funcional y validado (latencia: {$us}us)");
        } else {
            reportItem("C++", "Binario Compilado y Operativo", "WARN", "motor_core.exe respondió con error (código $code)", "Recompile con cpp/build.bat.");
        }
    } else {
        reportItem("C++", "Binario Compilado y Operativo", "WARN", "No se pudo instanciar motor_core.exe", "Verifique permisos de ejecución.");
    }
} else {
    reportItem("C++", "Binario Compilado y Operativo", "FAIL", "No se encontró el binario 'cpp/motor_core.exe'", "Ejecute 'cpp/build.bat' para compilarlo.");
}

// ----------------------------------------------------------------------------
// RESUMEN Y RESULTADO FINAL
// ----------------------------------------------------------------------------
$totalChecks = $results['passed'] + $results['warnings'] + $results['failed'];

if ($isCli) {
    echo "\n========================================================================\n";
    echo "  RESUMEN DE DIAGNÓSTICO DE DESPLIEGUE:\n";
    echo "  Total Verificaciones: $totalChecks\n";
    echo "  {$cGreen}[PASS] Aprobadas: {$results['passed']}{$cReset}\n";
    echo "  {$cYellow}[WARN] Advertencias: {$results['warnings']}{$cReset}\n";
    echo "  {$cRed}[FAIL] Fallos Críticos: {$results['failed']}{$cReset}\n";
    echo "========================================================================\n";

    if ($results['failed'] === 0) {
        echo "{$cGreen}{$cBold}[EXITO] El entorno se encuentra 100% listo para operar bajo XAMPP Apache + MySQL real!{$cReset}\n";
        exit(0);
    } else {
        echo "{$cRed}{$cBold}[ATENCIÓN] Corrija los fallos críticos señalados arriba antes del despliegue final.{$cReset}\n";
        exit(1);
    }
} else {
    $summaryClass = ($results['failed'] === 0) ? 'summary-ok' : 'summary-fail';
    echo "<div class='summary $summaryClass'>";
    echo "Resumen: {$results['passed']} pasadas, {$results['warnings']} advertencias, {$results['failed']} fallos críticos de $totalChecks chequeos.<br>";
    if ($results['failed'] === 0) {
        echo "🎉 ¡El sistema está listo para operar bajo XAMPP Apache + MySQL real!";
    } else {
        echo "⚠️ Revise y corrija los puntos en rojo para garantizar la estabilidad del sistema.";
    }
    echo "</div></div></body></html>";
}

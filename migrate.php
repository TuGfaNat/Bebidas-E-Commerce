<?php
/**
 * Script de Migración y Sembrado de Base de Datos para Burger 24/7
 * Ejecuta init_schema.sql sobre MySQL utilizando PDO.
 */

$envFiles = [
    __DIR__ . '/microservices/Auth/.env',
    __DIR__ . '/microservices/Catalog/.env',
    __DIR__ . '/.env'
];

foreach ($envFiles as $envPath) {
    if (file_exists($envPath)) {
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || strpos($line, '#') === 0) continue;
            if (strpos($line, '=') !== false) {
                list($k, $v) = explode('=', $line, 2);
                $k = trim($k);
                $v = trim($v);
                if (!isset($_ENV[$k])) $_ENV[$k] = $v;
                if (getenv($k) === false) putenv("$k=$v");
            }
        }
    }
}

$host = getenv('DB_HOST') ?: '127.0.0.1';
$port = getenv('DB_PORT') ?: '3306';
$db   = getenv('DB_NAME') ?: 'bebidas_247';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';
$charset = getenv('DB_CHARSET') ?: 'utf8mb4';

echo "========================================================\n";
echo "    Burger 24/7 - Asistente de Migraciones de Base de Datos\n";
echo "========================================================\n";
echo "Configuración detectada:\n";
echo "  Host: $host:$port\n";
echo "  Base de datos: $db\n";
echo "  Usuario: $user\n";
echo "--------------------------------------------------------\n";

// 1. Probar conectividad socket básica
$socket = @fsockopen($host, (int)$port, $errno, $errstr, 2);
if (!$socket) {
    echo "[AVISO] No se detecta un servidor MySQL activo en $host:$port.\n";
    echo "  Detalle de red: ($errno) $errstr\n\n";
    echo "Notas de entorno:\n";
    echo "  1. Si usa XAMPP, Laragon, WampServer o Docker, inicie el servicio MySQL/MariaDB.\n";
    echo "  2. Recuerde que el servidor autónomo 'python server.py' incluye persistencia\n";
    echo "     local en memoria y simulación offline, por lo que la plataforma puede ser\n";
    echo "     probada de inmediato ejecutando 'python server.py' o 'start_services.bat'.\n";
    echo "  3. El archivo SQL 'init_schema.sql' se encuentra listo para importación manual\n";
    echo "     vía phpMyAdmin o comando: mysql -u $user -p $db < init_schema.sql\n";
    echo "========================================================\n";
    exit(0);
}
fclose($socket);

// 2. Conectar a MySQL sin especificar base de datos para crearla si no existe
try {
    $pdo = new PDO("mysql:host=$host;port=$port;charset=$charset", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    echo "[OK] Conexión establecida con el servidor MySQL.\n";

    // Crear base de datos
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db` CHARACTER SET $charset COLLATE {$charset}_unicode_ci");
    $pdo->exec("USE `$db`");
    echo "[OK] Base de datos '$db' verificada / creada exitosamente.\n";

    // Cargar init_schema.sql
    $sqlFile = __DIR__ . '/init_schema.sql';
    if (!file_exists($sqlFile)) {
        throw new Exception("No se encontró el archivo $sqlFile");
    }

    $sql = file_get_contents($sqlFile);
    // Ejecutar lote SQL
    $pdo->exec($sql);
    echo "[OK] Esquema y tablas creados/actualizados exitosamente.\n";

    // Mostrar resumen de tablas creadas
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "\nTablas existentes en '$db':\n";
    foreach ($tables as $t) {
        $countStmt = $pdo->query("SELECT COUNT(*) FROM `$t`");
        $count = $countStmt->fetchColumn();
        echo "  - $t ($count registros)\n";
    }

    echo "\n[EXITO] Migraciones y sembrado completados correctamente.\n";
    echo "========================================================\n";
} catch (PDOException $e) {
    echo "[ERROR] Error al ejecutar migración: " . $e->getMessage() . "\n";
    exit(1);
} catch (Exception $e) {
    echo "[ERROR] " . $e->getMessage() . "\n";
    exit(1);
}

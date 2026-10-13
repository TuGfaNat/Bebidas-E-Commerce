<?php
// microservices/Transactions/store_config.php
/**
 * ============================================================================
 * 🏪 EXPLICACIÓN FÁCIL: LA FICHA Y DIRECCIÓN OFICIAL DEL RESTAURANTE / COCINA
 * ============================================================================
 * ¿Para qué sirve este archivo?
 * Permite que el Administrador defina dónde queda la hamburguesería / cocina central:
 *  - Nombre de la sucursal o restaurante.
 *  - Dirección física completa (Calle, Número, Zona en La Paz).
 *  - Coordenadas geográficas exactas (Latitud y Longitud) para el GPS y cálculo de fletes.
 *  - Teléfono de atención para coordinar pedidos con clientes y riders.
 * 
 * Tanto los Clientes como los Repartidores (Riders) consultan este archivo para:
 *  - Calcular la ruta y tiempo real en moto.
 *  - Saber exactamente a qué dirección física debe ir el repartidor a recoger la comida.
 * ============================================================================
 */
require_once __DIR__ . '/../Auth/connection.php';
require_once __DIR__ . '/../Auth/jwt.php';
require_once __DIR__ . '/../Auth/security.php';

applyCorsMiddleware();
header('Content-Type: application/json; charset=UTF-8');

function formatResponse($status, $data, $userId = null, $errorDetails = null, $action = "STORE_CONFIG") {
    return json_encode([
        "status" => $status,
        "data" => $data,
        "audit" => [
            "user_id" => $userId ?: "GUEST",
            "timestamp" => date("c"),
            "action" => $action,
            "ip_address" => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
        ],
        "error_details" => $errorDetails
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}

try {
    $db = DatabaseConnection::getInstance()->getConnection();

    // Asegurar tabla configuracion_tienda con campo sucursal
    $db->exec("
        CREATE TABLE IF NOT EXISTS configuracion_tienda (
            id INT PRIMARY KEY DEFAULT 1,
            nombre_tienda VARCHAR(150) NOT NULL DEFAULT 'Burger 24/7',
            sucursal VARCHAR(100) DEFAULT 'Central Sopocachi',
            direccion VARCHAR(255) NOT NULL DEFAULT 'Av. 20 de Octubre #2150, Sopocachi, La Paz',
            zona VARCHAR(100) NOT NULL DEFAULT 'Sopocachi',
            latitud DECIMAL(10, 8) NOT NULL DEFAULT -16.5050,
            longitud DECIMAL(11, 8) NOT NULL DEFAULT -68.1290,
            telefono VARCHAR(50) NOT NULL DEFAULT '+591 71523481',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            updated_by INT,
            FOREIGN KEY (updated_by) REFERENCES users(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    try {
        $db->exec("ALTER TABLE configuracion_tienda ADD COLUMN sucursal VARCHAR(100) DEFAULT 'Central Sopocachi' AFTER nombre_tienda");
    } catch (Exception $colEx) {
        // Columna ya existe
    }

    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

    // =========================================================================
    // GET: Consultar configuración actual de la tienda (Disponible para todos)
    // =========================================================================
    if ($method === 'GET') {
        $stmt = $db->query("SELECT id, nombre_tienda, sucursal, direccion, zona, latitud, longitud, telefono, updated_at FROM configuracion_tienda WHERE id = 1");
        $store = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$store) {
            $defaultStore = [
                'id' => 1,
                'nombre_tienda' => 'Burger 24/7',
                'sucursal' => 'Central Sopocachi',
                'direccion' => 'Av. 20 de Octubre #2150, Sopocachi, La Paz',
                'zona' => 'Sopocachi',
                'latitud' => -16.5050,
                'longitud' => -68.1290,
                'telefono' => '+591 71523481',
                'updated_at' => date('Y-m-d H:i:s')
            ];
            $stmtIns = $db->prepare("INSERT INTO configuracion_tienda (id, nombre_tienda, sucursal, direccion, zona, latitud, longitud, telefono) VALUES (1, ?, ?, ?, ?, ?, ?, ?)");
            $stmtIns->execute([$defaultStore['nombre_tienda'], $defaultStore['sucursal'], $defaultStore['direccion'], $defaultStore['zona'], $defaultStore['latitud'], $defaultStore['longitud'], $defaultStore['telefono']]);
            $store = $defaultStore;
        }

        // Si la sucursal viene vacía o el nombre_tienda incluye ' - ', desglosar limpiamente
        if (empty($store['sucursal']) && strpos($store['nombre_tienda'], ' - ') !== false) {
            $parts = explode(' - ', $store['nombre_tienda'], 2);
            $store['nombre_tienda'] = trim($parts[0]);
            $store['sucursal'] = trim($parts[1]);
        } elseif (empty($store['sucursal'])) {
            $store['sucursal'] = 'Central Sopocachi';
        }

        $store['latitud'] = (float)$store['latitud'];
        $store['longitud'] = (float)$store['longitud'];

        echo formatResponse("success", ["tienda" => $store], null, null, "GET_STORE_CONFIG");
        exit;
    }

    // =========================================================================
    // POST / PUT: Actualizar configuración del restaurante (Solo Super Admin / Admin)
    // =========================================================================
    if ($method === 'POST' || $method === 'PUT') {
        $payload = requireAuth(['super_usuario', 'admin']);
        $adminId = (int)$payload['user_id'];

        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true);
        if (!is_array($input) || empty($input)) {
            $input = $_POST;
        }

        $nombre = trim($input['nombre_tienda'] ?? '');
        $sucursal = trim($input['sucursal'] ?? '');
        $direccion = trim($input['direccion'] ?? '');
        $zona = trim($input['zona'] ?? '');
        $lat = isset($input['latitud']) ? floatval($input['latitud']) : null;
        $lon = isset($input['longitud']) ? floatval($input['longitud']) : null;
        $telefono = trim($input['telefono'] ?? '');

        // Si no se envió sucursal separada pero nombre contiene ' - '
        if (empty($sucursal) && strpos($nombre, ' - ') !== false) {
            $parts = explode(' - ', $nombre, 2);
            $nombre = trim($parts[0]);
            $sucursal = trim($parts[1]);
        }
        if (empty($sucursal)) {
            $sucursal = 'Central Sopocachi';
        }

        if (empty($nombre) || empty($direccion)) {
            http_response_code(400);
            echo formatResponse("error", null, $adminId, "El nombre del restaurante y la dirección física son obligatorios.", "VALIDATION_ERROR");
            exit;
        }

        if ($lat === null || $lon === null || $lat < -90 || $lat > 90 || $lon < -180 || $lon > 180) {
            http_response_code(400);
            echo formatResponse("error", null, $adminId, "Coordenadas GPS de la tienda inválidas.", "INVALID_COORDINATES");
            exit;
        }

        $db->beginTransaction();

        $stmtOld = $db->query("SELECT * FROM configuracion_tienda WHERE id = 1 FOR UPDATE");
        $old = $stmtOld->fetch(PDO::FETCH_ASSOC);

        $stmtUp = $db->prepare("
            INSERT INTO configuracion_tienda (id, nombre_tienda, sucursal, direccion, zona, latitud, longitud, telefono, updated_by, updated_at)
            VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                nombre_tienda = VALUES(nombre_tienda),
                sucursal = VALUES(sucursal),
                direccion = VALUES(direccion),
                zona = VALUES(zona),
                latitud = VALUES(latitud),
                longitud = VALUES(longitud),
                telefono = VALUES(telefono),
                updated_by = VALUES(updated_by),
                updated_at = NOW()
        ");
        $stmtUp->execute([$nombre, $sucursal, $direccion, $zona ?: 'La Paz', $lat, $lon, $telefono ?: '+591 71523481', $adminId]);

        logAudit($db, 'configuracion_tienda', 1, 'UPDATE', $old, [
            'nombre_tienda' => $nombre,
            'sucursal' => $sucursal,
            'direccion' => $direccion,
            'zona' => $zona,
            'latitud' => $lat,
            'longitud' => $lon,
            'telefono' => $telefono
        ], $adminId);

        $db->commit();

        $updated = [
            'id' => 1,
            'nombre_tienda' => $nombre,
            'sucursal' => $sucursal,
            'direccion' => $direccion,
            'zona' => $zona ?: 'La Paz',
            'latitud' => $lat,
            'longitud' => $lon,
            'telefono' => $telefono ?: '+591 71523481'
        ];

        echo formatResponse("success", [
            "mensaje" => "Ubicación y dirección del restaurante actualizadas con éxito.",
            "tienda" => $updated
        ], $adminId, null, "UPDATE_STORE_CONFIG");
        exit;
    }

    http_response_code(405);
    echo formatResponse("error", null, null, "Método HTTP no permitido.", "METHOD_NOT_ALLOWED");

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo formatResponse("error", null, null, $e->getMessage(), "SERVER_ERROR");
}

<?php
// microservices/Transactions/qr_config.php
/**
 * ============================================================================
 * 💳 EXPLICACIÓN FÁCIL: EL CONFIGURADOR DE PAGOS QR DEL JEFE (SUPER ADMIN)
 * ============================================================================
 * ¿Para qué sirve este archivo?
 * Permite que el dueño del restaurante (Super Admin):
 * 1. Suba su propio código QR de su banco (Banco Unión, BCP, BNB, etc.).
 * 2. Configure su nombre de titular, número de cuenta y celular.
 * 3. Permite que cuando el cliente vaya a pagar, el sistema le muestre el QR
 *    oficial con el MONTO EXACTO (costo) del pedido para que pague sin errores.
 * 4. Guarda todo en la base de datos para que los pagos con QR se concatenen
 *    y sumen automáticamente en las estadísticas financieras.
 * ============================================================================
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../Auth/connection.php';
require_once __DIR__ . '/../Auth/jwt.php';
require_once __DIR__ . '/../Auth/security.php';

// Configuración de encabezados CORS y seguridad
applyCorsMiddleware();

/**
 * 🧒 FUNCIÓN: formatResponse (El Mensajero Uniformado BMAD)
 * Envuelve los datos en una cajita bonita estándar para que el frontend los entienda.
 */
function formatResponse(string $status, $data = null, $userId = null, $error = null, string $action = 'QR_CONFIG'): string {
    return json_encode([
        "status" => $status,
        "data" => $data,
        "audit" => [
            "user_id" => $userId !== null ? $userId : "ANONYMOUS",
            "timestamp" => date("c"),
            "action" => $action,
            "ip_address" => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
        ],
        "error_details" => $error
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}

/**
 * 🧒 FUNCIÓN: ensureTableExists (El Constructor del Cajón de Configuración)
 * Revisa que exista la tabla 'configuracion_pagos' en MySQL. Si no existe, la crea
 * e inserta los datos iniciales para que el sistema nunca falle.
 */
function ensureTableExists(PDO $db): void {
    $sql = "CREATE TABLE IF NOT EXISTS configuracion_pagos (
        id INT PRIMARY KEY DEFAULT 1,
        banco VARCHAR(100) NOT NULL DEFAULT 'Banco Unión',
        titular VARCHAR(150) NOT NULL DEFAULT 'Burger 24/7 S.R.L. (Admin Central)',
        cuenta VARCHAR(50) NOT NULL DEFAULT '100000482910',
        alias_qr VARCHAR(100) NOT NULL DEFAULT 'burger247@banco',
        qr_imagen_url VARCHAR(255) DEFAULT NULL,
        modo_qr ENUM('dinamico', 'subido', 'hibrido') NOT NULL DEFAULT 'hibrido',
        costo_fijo DECIMAL(10,2) DEFAULT NULL,
        instrucciones TEXT DEFAULT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_by INT DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    $db->exec($sql);

    // Asegurar que exista la fila id = 1
    $stmt = $db->query("SELECT id FROM configuracion_pagos WHERE id = 1");
    if (!$stmt->fetch()) {
        $insert = "INSERT INTO configuracion_pagos (id, banco, titular, cuenta, alias_qr, modo_qr, instrucciones)
                   VALUES (1, 'Banco Unión', 'Burger 24/7 S.R.L. (Admin Central)', '100000482910', 'burger247@banco', 'hibrido', 'Transfiere el monto exacto del pedido y sube tu comprobante.');";
        $db->exec($insert);
    }
}

try {
    $db = DatabaseConnection::getInstance()->getConnection();
    ensureTableExists($db);

    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    // =========================================================================
    // 📖 MÉTODO GET: Consultar la configuración del QR (Disponible para checkout)
    // =========================================================================
    if ($method === 'GET') {
        $stmt = $db->query("SELECT banco, titular, cuenta, alias_qr, qr_imagen_url, modo_qr, costo_fijo, instrucciones, updated_at FROM configuracion_pagos WHERE id = 1");
        $config = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$config) {
            $config = [
                "banco" => "Banco Unión",
                "titular" => "Burger 24/7 S.R.L.",
                "cuenta" => "100000482910",
                "alias_qr" => "burger247@banco",
                "qr_imagen_url" => null,
                "modo_qr" => "hibrido",
                "costo_fijo" => null,
                "instrucciones" => "Transfiere el monto exacto del pedido y sube tu comprobante."
            ];
        }

        echo formatResponse("success", $config, null, null, "GET_QR_CONFIG");
        exit;
    }

    // =========================================================================
    // ✍️ MÉTODO POST: Actualizar configuración y/o subir imagen de QR (Solo Admin)
    // =========================================================================
    if ($method === 'POST') {
        // Validación de permisos de Super Admin
        $payload = JWTHelper::authenticate();
        $adminId = $payload['user_id'];
        $role = $payload['role'];

        if (!in_array($role, ['super_usuario', 'admin'])) {
            http_response_code(403);
            echo formatResponse("error", null, $adminId, "Permiso denegado. Solo administradores pueden configurar el código QR.", "FORBIDDEN");
            exit;
        }

        // Obtener datos del formulario (soporta multipart y JSON)
        $input = $_POST;
        if (empty($input)) {
            $raw = file_get_contents('php://input');
            if (!empty($raw)) {
                $decoded = json_decode($raw, true);
                if (is_array($decoded)) $input = $decoded;
            }
        }

        // Obtener configuración previa para auditoría
        $stmtOld = $db->query("SELECT * FROM configuracion_pagos WHERE id = 1");
        $oldConfig = $stmtOld->fetch(PDO::FETCH_ASSOC);

        $banco = trim($input['banco'] ?? ($oldConfig['banco'] ?? 'Banco Unión'));
        $titular = trim($input['titular'] ?? ($oldConfig['titular'] ?? 'Burger 24/7 S.R.L.'));
        $cuenta = trim($input['cuenta'] ?? ($oldConfig['cuenta'] ?? '100000482910'));
        $alias = trim($input['alias_qr'] ?? ($oldConfig['alias_qr'] ?? 'burger247@banco'));
        $modo = trim($input['modo_qr'] ?? ($oldConfig['modo_qr'] ?? 'hibrido'));
        $instrucciones = trim($input['instrucciones'] ?? ($oldConfig['instrucciones'] ?? 'Transfiere el monto exacto del pedido y sube tu comprobante.'));
        $costoFijo = isset($input['costo_fijo']) && is_numeric($input['costo_fijo']) ? floatval($input['costo_fijo']) : null;
        $qrImageUrl = $oldConfig['qr_imagen_url'] ?? null;

        // Si se subió un archivo de imagen para el QR oficial
        if (isset($_FILES['qr_image']) && !empty($_FILES['qr_image']['tmp_name'])) {
            $file = $_FILES['qr_image'];
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);

            $allowed = [
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/webp' => 'webp'
            ];

            if (!isset($allowed[$mime])) {
                http_response_code(400);
                echo formatResponse("error", null, $adminId, "Formato de imagen inválido. Solo se admiten JPG, PNG o WebP.", "INVALID_IMAGE");
                exit;
            }

            $ext = $allowed[$mime];
            $filename = 'qr_admin_oficial_' . time() . '.' . $ext;

            // Carpetas de almacenamiento en uploads
            $dirs = [
                __DIR__ . '/../../uploads/qr/',
                __DIR__ . '/../Auth/uploads/qr/'
            ];

            foreach ($dirs as $dir) {
                if (!is_dir($dir)) {
                    @mkdir($dir, 0755, true);
                    @file_put_contents($dir . '.htaccess', "Require all denied\n");
                }
            }

            $destPrincipal = $dirs[0] . $filename;
            $destAuth = $dirs[1] . $filename;

            if (move_uploaded_file($file['tmp_name'], $destPrincipal)) {
                @copy($destPrincipal, $destAuth);
                $qrImageUrl = '/uploads/qr/' . $filename;
            }
        }

        // Si el admin envía una URL directa de imagen
        if (!empty($input['qr_imagen_url'])) {
            $qrImageUrl = trim($input['qr_imagen_url']);
        }

        // Actualizar tabla en MySQL
        $stmtUpdate = $db->prepare("
            UPDATE configuracion_pagos 
            SET banco = ?, titular = ?, cuenta = ?, alias_qr = ?, qr_imagen_url = ?, modo_qr = ?, costo_fijo = ?, instrucciones = ?, updated_by = ?, updated_at = NOW()
            WHERE id = 1
        ");
        $stmtUpdate->execute([
            $banco,
            $titular,
            $cuenta,
            $alias,
            $qrImageUrl,
            $modo,
            $costoFijo,
            $instrucciones,
            $adminId
        ]);

        $newConfig = [
            "banco" => $banco,
            "titular" => $titular,
            "cuenta" => $cuenta,
            "alias_qr" => $alias,
            "qr_imagen_url" => $qrImageUrl,
            "modo_qr" => $modo,
            "costo_fijo" => $costoFijo,
            "instrucciones" => $instrucciones
        ];

        // Auditoría
        try {
            logAudit($db, 'configuracion_pagos', 1, 'UPDATE', $oldConfig, $newConfig, $adminId);
        } catch (\Throwable $e) {}

        echo formatResponse("success", [
            "mensaje" => "Configuración del código QR de cobro actualizada exitosamente.",
            "config" => $newConfig
        ], $adminId, null, "UPDATE_QR_CONFIG");
        exit;
    }

    http_response_code(405);
    echo formatResponse("error", null, null, "Método HTTP no permitido. Use GET o POST.", "METHOD_NOT_ALLOWED");

} catch (PDOException $e) {
    http_response_code(500);
    echo formatResponse("error", null, null, "Error en base de datos: " . $e->getMessage(), "DATABASE_ERROR");
} catch (Exception $e) {
    http_response_code(500);
    echo formatResponse("error", null, null, "Error del servidor: " . $e->getMessage(), "SERVER_ERROR");
}

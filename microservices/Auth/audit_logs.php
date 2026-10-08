<?php
// microservices/Auth/audit_logs.php
require_once __DIR__ . '/connection.php';
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/security.php';

applyCorsMiddleware();
header('Content-Type: application/json; charset=UTF-8');

function formatResponse($status, $data, $userId = null, $errorDetails = null, $action = "AUDIT_LOGS") {
    return json_encode([
        "status" => $status,
        "data" => $data,
        "audit" => [
            "user_id" => $userId ?: "SYSTEM",
            "timestamp" => date("c"),
            "action" => $action,
            "ip_address" => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
        ],
        "error_details" => $errorDetails
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo formatResponse("error", null, null, "Método no permitido. Use GET.", "METHOD_NOT_ALLOWED");
        exit;
    }

    $payload = requireAuth(['super_usuario', 'admin']);
    $adminId = (int)$payload['user_id'];

    $db = DatabaseConnection::getInstance()->getConnection();

    $stmt = $db->query("
        SELECT 
            a.id,
            a.tabla_afectada,
            a.registro_id,
            a.accion,
            a.datos_anteriores,
            a.datos_nuevos,
            a.ip_address,
            a.created_at,
            a.created_by,
            u.nombre as user_nombre,
            u.role as user_role
        FROM auditoria_logs a
        LEFT JOIN users u ON a.created_by = u.id
        ORDER BY a.id DESC
        LIMIT 100
    ");
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo formatResponse("success", $logs, $adminId, null, "GET_AUDIT_LOGS");

} catch (Exception $e) {
    http_response_code(500);
    echo formatResponse("error", null, null, $e->getMessage(), "ERROR");
}

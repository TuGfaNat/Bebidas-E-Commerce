<?php
// microservices/Rider/settle_cash.php
// Microservicio de Liquidación de Caja de Riders - Burger 24/7
require_once __DIR__ . '/../Auth/connection.php';
require_once __DIR__ . '/../Auth/jwt.php';
require_once __DIR__ . '/../Auth/security.php';

// Aplicar CORS
applyCorsMiddleware();

header('Content-Type: application/json; charset=UTF-8');

/**
 * Formato de respuesta estándar BMAD
 */
function formatResponse($status, $data, $userId = null, $errorDetails = null, $action = "SETTLE_CASH") {
    return json_encode([
        "status" => $status,
        "data" => $data,
        "audit" => [
            "user_id" => $userId !== null ? $userId : "ANONYMOUS",
            "timestamp" => date("c"),
            "action" => $action,
            "ip_address" => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
        ],
        "error_details" => $errorDetails
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}

/**
 * Obtiene el cuerpo de la petición (JSON o Form-data)
 */
function getRequestData() {
    $raw = file_get_contents('php://input');
    if (!empty($raw)) {
        $json = json_decode($raw, true);
        if (is_array($json)) {
            return $json;
        }
    }
    return $_POST;
}

try {
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'POST');
    if ($method !== 'POST') {
        http_response_code(405);
        echo formatResponse("error", null, null, "Método no permitido. Utilice POST.", "METHOD_NOT_ALLOWED");
        exit;
    }

    // 1. Validar Autenticación y Autorización (Solo administradores)
    // Criterio de Aceptación: Liquidación de caja por admin (403 para no-admin)
    $payload = requireAuth(['super_usuario', 'admin']);
    $adminId = (int)$payload['user_id'];

    $input = getRequestData();
    $riderId = isset($input['rider_id']) ? (int)$input['rider_id'] : null;

    if (!$riderId) {
        http_response_code(400);
        echo formatResponse("error", null, $adminId, "El parámetro 'rider_id' es obligatorio.", "VALIDATION_ERROR");
        exit;
    }

    $db = DatabaseConnection::getInstance()->getConnection();

    // 2. Verificar existencia del rider
    $stmtRider = $db->prepare("SELECT id, nombre, email, role FROM users WHERE id = ?");
    $stmtRider->execute([$riderId]);
    $rider = $stmtRider->fetch();

    if (!$rider || $rider['role'] !== 'rider') {
        http_response_code(404);
        echo formatResponse("error", null, $adminId, "El usuario con ID #$riderId no existe o no tiene rol de rider.", "RIDER_NOT_FOUND");
        exit;
    }

    $db->beginTransaction();

    // 3. Obtener todas las órdenes entregadas pendientes de liquidar (pagado_efectivo)
    $stmtOrders = $db->prepare("
        SELECT id, total, estado_pago 
        FROM pedidos 
        WHERE rider_id = ? 
          AND estado_pedido = 'entregado' 
          AND estado_pago = 'pagado_efectivo' 
        FOR UPDATE
    ");
    $stmtOrders->execute([$riderId]);
    $orders = $stmtOrders->fetchAll();

    if (empty($orders)) {
        $db->rollBack();
        http_response_code(400);
        echo formatResponse("error", null, $adminId, "El rider " . htmlspecialchars($rider['nombre']) . " no tiene entregas en efectivo pendientes de liquidar.", "NO_PENDING_CASH");
        exit;
    }

    $totalLiquidado = 0.0;
    $pedidosLiquidadosIds = [];

    // 4. Actualizar estado de pago a 'liquidado' y registrar auditoría individual
    foreach ($orders as $order) {
        $pedidoId = (int)$order['id'];
        $monto = floatval($order['total']);
        $totalLiquidado += $monto;
        $pedidosLiquidadosIds[] = $pedidoId;

        $stmtUpdate = $db->prepare("UPDATE pedidos SET estado_pago = 'liquidado', updated_by = ?, updated_at = NOW() WHERE id = ?");
        $stmtUpdate->execute([$adminId, $pedidoId]);

        logAudit(
            $db,
            'pedidos',
            $pedidoId,
            'UPDATE',
            ['estado_pago' => 'pagado_efectivo'],
            ['estado_pago' => 'liquidado', 'motivo' => "Caja liquidada por administrador #$adminId (" . ($payload['nombre'] ?? 'Admin') . ")"],
            $adminId
        );
    }

    $db->commit();

    echo formatResponse("success", [
        "mensaje" => "Caja del rider liquidada exitosamente.",
        "rider_id" => $riderId,
        "nombre_rider" => $rider['nombre'],
        "total_liquidado_bs" => round($totalLiquidado, 2),
        "pedidos_liquidados" => $pedidosLiquidadosIds,
        "cantidad_pedidos" => count($pedidosLiquidadosIds)
    ], $adminId, null, "SETTLE_CASH");
    exit;

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo formatResponse("error", null, $adminId ?? null, $e->getMessage(), "SERVER_ERROR");
}

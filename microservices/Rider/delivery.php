<?php
// microservices/Rider/delivery.php
// Microservicio de Avance y Progreso de Entrega de Pedidos - Burger 24/7
require_once __DIR__ . '/../Auth/connection.php';
require_once __DIR__ . '/../Auth/jwt.php';
require_once __DIR__ . '/../Auth/security.php';

// Aplicar CORS
applyCorsMiddleware();

header('Content-Type: application/json; charset=UTF-8');

/**
 * Formato de respuesta estándar BMAD
 */
function formatResponse($status, $data, $userId = null, $errorDetails = null, $action = "DELIVERY") {
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
    // 1. Validar autenticación vía JWT Bearer
    $payload = requireAuth(['rider', 'super_usuario', 'admin']);
    $userId = (int)$payload['user_id'];
    $userRole = $payload['role'];

    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'PUT');
    $input = getRequestData();

    // Soporte para PUT y POST
    if ($method !== 'PUT' && $method !== 'POST') {
        http_response_code(405);
        echo formatResponse("error", null, $userId, "Método HTTP no permitido. Utilice PUT o POST.", "METHOD_NOT_ALLOWED");
        exit;
    }

    $pedidoId = isset($input['pedido_id']) ? (int)$input['pedido_id'] : null;
    if (!$pedidoId && isset($_GET['pedido_id'])) {
        $pedidoId = (int)$_GET['pedido_id'];
    }

    if (!$pedidoId) {
        http_response_code(400);
        echo formatResponse("error", null, $userId, "Falta el parámetro obligatorio 'pedido_id'.", "VALIDATION_ERROR");
        exit;
    }

    // Determinar nuevo estado solicitado
    $action = $input['action'] ?? ($_GET['action'] ?? null);
    $nuevoEstado = $input['nuevo_estado'] ?? null;

    if ($action === 'marcar_en_camino') {
        $nuevoEstado = 'en_camino';
    } elseif ($action === 'marcar_entregado') {
        $nuevoEstado = 'entregado';
    }

    if (!$nuevoEstado || !in_array($nuevoEstado, ['en_camino', 'entregado'], true)) {
        http_response_code(400);
        echo formatResponse("error", null, $userId, "Estado de destino inválido o no especificado. Valores permitidos: 'en_camino', 'entregado'.", "INVALID_STATE");
        exit;
    }

    $db = DatabaseConnection::getInstance()->getConnection();
    $db->beginTransaction();

    // Consultar pedido actual con bloqueo de fila
    $stmt = $db->prepare("
        SELECT id, cliente_id, rider_id, estado_pedido, estado_pago, total 
        FROM pedidos 
        WHERE id = ? 
        FOR UPDATE
    ");
    $stmt->execute([$pedidoId]);
    $pedido = $stmt->fetch();

    if (!$pedido) {
        $db->rollBack();
        http_response_code(404);
        echo formatResponse("error", null, $userId, "Pedido #$pedidoId no encontrado.", "NOT_FOUND");
        exit;
    }

    // Criterio de Aceptación: Solo rider asignado (o admin) avanza estado
    if ($userRole === 'rider' && (int)$pedido['rider_id'] !== $userId) {
        $db->rollBack();
        http_response_code(403);
        echo formatResponse("error", null, $userId, "Permiso denegado. Solo el rider asignado a este pedido puede actualizar el estado de entrega.", "FORBIDDEN");
        exit;
    }

    $estadoActual = $pedido['estado_pedido'];

    // Validar máquina de estados finita: asignado -> en_camino -> entregado
    if ($nuevoEstado === 'en_camino') {
        if ($estadoActual !== 'asignado') {
            $db->rollBack();
            http_response_code(400);
            echo formatResponse("error", null, $userId, "Transición inválida: El pedido debe estar en estado 'asignado' para pasar a 'en_camino'. Estado actual: '$estadoActual'.", "INVALID_TRANSITION");
            exit;
        }
    } elseif ($nuevoEstado === 'entregado') {
        if ($estadoActual !== 'en_camino') {
            $db->rollBack();
            http_response_code(400);
            echo formatResponse("error", null, $userId, "Transición inválida: El pedido debe estar en estado 'en_camino' para marcarse como 'entregado'. Estado actual: '$estadoActual'.", "INVALID_TRANSITION");
            exit;
        }
    }

    // Actualizar estado del pedido
    $stmtUpdate = $db->prepare("UPDATE pedidos SET estado_pedido = ?, updated_by = ?, updated_at = NOW() WHERE id = ?");
    $stmtUpdate->execute([$nuevoEstado, $userId, $pedidoId]);

    // Registrar auditoría del cambio de estado del pedido
    logAudit(
        $db,
        'pedidos',
        $pedidoId,
        'UPDATE',
        ['estado_pedido' => $estadoActual],
        ['estado_pedido' => $nuevoEstado],
        $userId
    );

    $nuevoEstadoPago = $pedido['estado_pago'];

    // Si el pedido fue entregado y el método era contraentrega, se cobra en efectivo en el acto
    if ($nuevoEstado === 'entregado' && $pedido['estado_pago'] === 'contraentrega') {
        $nuevoEstadoPago = 'pagado_efectivo';
        $stmtPago = $db->prepare("UPDATE pedidos SET estado_pago = 'pagado_efectivo', updated_by = ?, updated_at = NOW() WHERE id = ?");
        $stmtPago->execute([$userId, $pedidoId]);

        logAudit(
            $db,
            'pedidos',
            $pedidoId,
            'UPDATE',
            ['estado_pago' => 'contraentrega'],
            ['estado_pago' => 'pagado_efectivo', 'motivo' => 'Cobro en efectivo contraentrega al momento de la entrega'],
            $userId
        );
    }

    $db->commit();

    echo formatResponse("success", [
        "mensaje" => $nuevoEstado === 'en_camino' ? "Pedido #$pedidoId en camino." : "Pedido #$pedidoId entregado con éxito.",
        "pedido_id" => $pedidoId,
        "estado_anterior" => $estadoActual,
        "estado_pedido" => $nuevoEstado,
        "estado_pago" => $nuevoEstadoPago,
        "rider_id" => (int)$pedido['rider_id']
    ], $userId, null, "ADVANCE_DELIVERY");
    exit;

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo formatResponse("error", null, $userId ?? null, $e->getMessage(), "SERVER_ERROR");
}

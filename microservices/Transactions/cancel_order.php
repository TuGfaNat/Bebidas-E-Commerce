<?php
// microservices/Transactions/cancel_order.php
require_once __DIR__ . '/../Auth/connection.php';
require_once __DIR__ . '/../Auth/jwt.php';
require_once __DIR__ . '/../Auth/security.php';

// Aplicar CORS middleware
applyCorsMiddleware();

header('Content-Type: application/json; charset=UTF-8');

/**
 * Formato de respuesta estándar BMAD
 */
function formatResponse($status, $data, $userId = null, $errorDetails = null, $action = "CANCEL_ORDER") {
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
    // 1. Rechazo de tokens en query string
    if (isset($_GET['token']) || isset($_POST['token']) || isset($_REQUEST['token'])) {
        http_response_code(401);
        echo formatResponse("error", null, null, "Acceso denegado. Tokens por URL no permitidos.", "AUTH_STRICT");
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo formatResponse("error", null, null, "Método no permitido. Use POST.", "METHOD_NOT_ALLOWED");
        exit;
    }

    // 2. Autenticación vía JWT
    $payload = JWTHelper::authenticate();
    $userId = $payload['user_id'];
    $role = $payload['role'];

    $input = getRequestData();
    $pedidoId = isset($_GET['pedido_id']) ? intval($_GET['pedido_id']) : (isset($input['pedido_id']) ? intval($input['pedido_id']) : (isset($input['id']) ? intval($input['id']) : null));

    if (!$pedidoId) {
        http_response_code(400);
        echo formatResponse("error", null, $userId, "El parámetro pedido_id es obligatorio.", "VALIDATION_ERROR");
        exit;
    }

    $db = DatabaseConnection::getInstance()->getConnection();

    // 3. Inicio de Transacción Atómica
    $db->beginTransaction();

    // Bloquear pedido con FOR UPDATE (ACID)
    $stmtOrder = $db->prepare("
        SELECT id, cliente_id, rider_id, estado_pedido, estado_pago, total 
        FROM pedidos 
        WHERE id = ? 
        FOR UPDATE
    ");
    $stmtOrder->execute([$pedidoId]);
    $order = $stmtOrder->fetch();

    if (!$order) {
        $db->rollBack();
        http_response_code(404);
        echo formatResponse("error", null, $userId, "Pedido con ID #$pedidoId no existe.", "NOT_FOUND");
        exit;
    }

    // Validar permisos: Solo el cliente dueño del pedido o un Administrador pueden cancelarlo
    $isAdmin = in_array($role, ['super_usuario', 'admin']);
    $isOwner = ((int)$order['cliente_id'] === (int)$userId);

    if (!$isAdmin && !$isOwner) {
        $db->rollBack();
        http_response_code(403);
        echo formatResponse("error", null, $userId, "Permiso denegado. No tienes autorización para cancelar este pedido.", "FORBIDDEN");
        exit;
    }

    // Validar estado del pedido
    if ($order['estado_pedido'] === 'cancelado') {
        $db->rollBack();
        http_response_code(400);
        echo formatResponse("error", null, $userId, "El pedido #$pedidoId ya se encuentra cancelado.", "ALREADY_CANCELLED");
        exit;
    }

    // Criterio de Aceptación: "Cancelación reembolsa stock solo para pedidos pendientes/asignados"
    if (!in_array($order['estado_pedido'], ['pendiente', 'asignado'])) {
        $db->rollBack();
        http_response_code(400);
        echo formatResponse(
            "error", 
            null, 
            $userId, 
            "Cancelación no permitida: el pedido está en estado '{$order['estado_pedido']}'. Solo se puede cancelar y reembolsar stock en pedidos 'pendiente' o 'asignado'.", 
            "INVALID_ORDER_STATE"
        );
        exit;
    }

    // 4. Reembolsar stock de los productos comprados (Reversión atómica de inventario)
    $stmtDetails = $db->prepare("
        SELECT producto_id, cantidad, precio_unitario 
        FROM pedido_detalles 
        WHERE pedido_id = ? 
        FOR UPDATE
    ");
    $stmtDetails->execute([$pedidoId]);
    $items = $stmtDetails->fetchAll();

    $reembolsos = [];

    foreach ($items as $item) {
        $prodId = (int)$item['producto_id'];
        $qty = (int)$item['cantidad'];

        // Obtener stock actual con bloqueo
        $stmtProd = $db->prepare("SELECT id, nombre, stock FROM productos WHERE id = ? FOR UPDATE");
        $stmtProd->execute([$prodId]);
        $prod = $stmtProd->fetch();

        if ($prod) {
            $oldStock = (int)$prod['stock'];
            $newStock = $oldStock + $qty;

            // Devolver stock al almacén
            $stmtUpdateProd = $db->prepare("UPDATE productos SET stock = ?, updated_by = ?, updated_at = NOW() WHERE id = ?");
            $stmtUpdateProd->execute([$newStock, $userId, $prodId]);

            // Auditoría individual del reembolso de stock
            logAudit(
                $db, 
                'productos', 
                $prodId, 
                'UPDATE', 
                ['stock' => $oldStock], 
                ['stock' => $newStock, 'motivo' => "Reembolso por cancelación de pedido #$pedidoId"], 
                $userId
            );

            $reembolsos[] = [
                'producto_id' => $prodId,
                'nombre' => $prod['nombre'],
                'cantidad_reembolsada' => $qty,
                'stock_restaurado' => $newStock
            ];
        }
    }

    // 5. Actualizar estado del pedido a 'cancelado'
    $oldOrderState = [
        'estado_pedido' => $order['estado_pedido'],
        'estado_pago' => $order['estado_pago']
    ];
    $newOrderState = [
        'estado_pedido' => 'cancelado',
        'estado_pago' => 'cancelado'
    ];

    $stmtCancel = $db->prepare("
        UPDATE pedidos 
        SET estado_pedido = 'cancelado', estado_pago = 'cancelado', updated_by = ?, updated_at = NOW() 
        WHERE id = ?
    ");
    $stmtCancel->execute([$userId, $pedidoId]);

    // Auditoría de la cancelación
    logAudit(
        $db, 
        'pedidos', 
        $pedidoId, 
        'UPDATE', 
        $oldOrderState, 
        $newOrderState, 
        $userId
    );

    // Confirmar transacción
    $db->commit();

    echo formatResponse("success", [
        "mensaje" => "Pedido #$pedidoId cancelado exitosamente y stock reembolsado.",
        "pedido_id" => $pedidoId,
        "estado_anterior" => $oldOrderState['estado_pedido'],
        "nuevo_estado" => "cancelado",
        "reembolsos" => $reembolsos
    ], $userId, null, "CANCEL_ORDER");

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo formatResponse("error", null, $userId ?? null, $e->getMessage(), "INTERNAL_SERVER_ERROR");
}

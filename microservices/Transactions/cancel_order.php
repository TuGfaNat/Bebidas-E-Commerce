<?php
// microservices/Transactions/cancel_order.php
require_once '../Auth/connection.php';
require_once '../Auth/jwt.php';

header('Content-Type: application/json');

function formatResponse($status, $data, $userId = null, $errorDetails = null) {
    return json_encode([
        "status" => $status,
        "data" => $data,
        "audit" => [
            "user_id" => $userId ?: "SYSTEM",
            "timestamp" => date("c")
        ],
        "error_details" => $errorDetails
    ]);
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Método no permitido. Use POST.");
    }

    // 1. Validar Autenticación y Autorización (JWT)
    $payload = JWTHelper::authenticate();
    $adminId = $payload['user_id'];
    $adminRole = $payload['role'];

    if ($adminRole !== 'super_usuario') {
        throw new Exception("Permiso denegado. Se requiere rol de super_usuario para cancelar pedidos.");
    }

    $pedidoId = $_POST['pedido_id'] ?? null;
    if (!$pedidoId) {
        throw new Exception("El parámetro pedido_id es obligatorio.");
    }

    $db = DatabaseConnection::getInstance()->getConnection();

    $db->beginTransaction();

    // 2. Obtener y bloquear el pedido para evitar condiciones de carrera (ACID)
    $stmtOrder = $db->prepare("SELECT id, estado_pedido, estado_pago, total FROM pedidos WHERE id = ? FOR UPDATE");
    $stmtOrder->execute([$pedidoId]);
    $order = $stmtOrder->fetch();

    if (!$order) {
        throw new Exception("El pedido no existe.");
    }

    if ($order['estado_pedido'] === 'cancelado') {
        throw new Exception("El pedido ya está cancelado.");
    }

    if ($order['estado_pedido'] === 'entregado') {
        throw new Exception("No se puede cancelar un pedido que ya ha sido entregado.");
    }

    // 3. Devolver stock de los productos comprados (Reversión de Inventario)
    $stmtDetails = $db->prepare("SELECT producto_id, cantidad FROM pedido_detalles WHERE pedido_id = ? FOR UPDATE");
    $stmtDetails->execute([$pedidoId]);
    $items = $stmtDetails->fetchAll();

    foreach ($items as $item) {
        $prodId = $item['producto_id'];
        $qty = $item['cantidad'];

        // Obtener stock actual para la auditoría
        $stmtProd = $db->prepare("SELECT stock, nombre FROM productos WHERE id = ? FOR UPDATE");
        $stmtProd->execute([$prodId]);
        $prod = $stmtProd->fetch();

        if ($prod) {
            $oldStock = $prod['stock'];
            $newStock = $oldStock + $qty;

            // Actualizar inventario
            $stmtUpdateProd = $db->prepare("UPDATE productos SET stock = ?, updated_by = ? WHERE id = ?");
            $stmtUpdateProd->execute([$newStock, $adminId, $prodId]);

            // Auditoría del incremento de stock
            $stmtLogProd = $db->prepare("INSERT INTO auditoria_logs (tabla_afectada, registro_id, accion, datos_anteriores, datos_nuevos, created_by, updated_by) VALUES (?, ?, 'UPDATE', ?, ?, ?, ?)");
            $stmtLogProd->execute([
                'productos', $prodId,
                json_encode(['stock' => $oldStock]),
                json_encode(['stock' => $newStock, 'motivo' => "Reversión por cancelación de pedido #$pedidoId"]),
                $adminId, $adminId
            ]);
        }
    }

    // 4. Actualizar el pedido a estado 'cancelado'
    $oldOrderState = [
        'estado_pedido' => $order['estado_pedido'],
        'estado_pago' => $order['estado_pago']
    ];
    $newOrderState = [
        'estado_pedido' => 'cancelado',
        'estado_pago' => 'cancelado'
    ];

    $stmtCancelOrder = $db->prepare("UPDATE pedidos SET estado_pedido = 'cancelado', estado_pago = 'cancelado', updated_by = ? WHERE id = ?");
    $stmtCancelOrder->execute([$adminId, $pedidoId]);

    // Auditoría de la cancelación del pedido
    $stmtLogOrder = $db->prepare("INSERT INTO auditoria_logs (tabla_afectada, registro_id, accion, datos_anteriores, datos_nuevos, created_by, updated_by) VALUES (?, ?, 'UPDATE', ?, ?, ?, ?)");
    $stmtLogOrder->execute([
        'pedidos', $pedidoId,
        json_encode($oldOrderState),
        json_encode($newOrderState),
        $adminId, $adminId
    ]);

    $db->commit();

    echo formatResponse("success", [
        "mensaje" => "Pedido #$pedidoId cancelado exitosamente y stock devuelto al almacén.",
        "pedido_id" => $pedidoId
    ], $adminId);

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    echo formatResponse("error", null, null, $e->getMessage());
}

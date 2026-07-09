<?php
// microservices/Rider/settle_cash.php
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

    // 1. Validar Autenticación y Autorización (Admin)
    $payload = JWTHelper::authenticate();
    $adminId = $payload['user_id'];
    $adminRole = $payload['role'];

    if ($adminRole !== 'super_usuario') {
        throw new Exception("Permiso denegado. Se requiere rol de super_usuario para liquidar cajas.");
    }

    $riderId = $_POST['rider_id'] ?? null;
    if (!$riderId) {
        throw new Exception("El parámetro rider_id es obligatorio.");
    }

    $db = DatabaseConnection::getInstance()->getConnection();

    // 2. Verificar que el rider sea válido
    $stmtRider = $db->prepare("SELECT id, nombre, role FROM users WHERE id = ?");
    $stmtRider->execute([$riderId]);
    $rider = $stmtRider->fetch();

    if (!$rider || $rider['role'] !== 'rider') {
        throw new Exception("El usuario especificado no existe o no es un Rider.");
    }

    $db->beginTransaction();

    // 3. Obtener todas las entregas en efectivo pendientes de liquidar (pagado_efectivo)
    $stmtOrders = $db->prepare("
        SELECT id, total, estado_pago 
        FROM pedidos 
        WHERE rider_id = ? AND estado_pedido = 'entregado' AND estado_pago = 'pagado_efectivo' 
        FOR UPDATE
    ");
    $stmtOrders->execute([$riderId]);
    $orders = $stmtOrders->fetchAll();

    if (empty($orders)) {
        throw new Exception("El Rider no tiene montos en efectivo pendientes de liquidar.");
    }

    $totalLiquidado = 0;
    $pedidosLiquidadosIds = [];

    // 4. Actualizar estado de pago y registrar en auditoría por cada orden
    foreach ($orders as $order) {
        $pedidoId = $order['id'];
        $monto = floatval($order['total']);
        $totalLiquidado += $monto;
        $pedidosLiquidadosIds[] = $pedidoId;

        // Actualizar estado de pago a 'liquidado'
        $stmtUpdate = $db->prepare("UPDATE pedidos SET estado_pago = 'liquidado', updated_by = ? WHERE id = ?");
        $stmtUpdate->execute([$adminId, $pedidoId]);

        // Registrar auditoría de liquidación
        $stmtLog = $db->prepare("INSERT INTO auditoria_logs (tabla_afectada, registro_id, accion, datos_anteriores, datos_nuevos, created_by, updated_by) VALUES (?, ?, 'UPDATE', ?, ?, ?, ?)");
        $stmtLog->execute([
            'pedidos', $pedidoId, 'UPDATE',
            json_encode(['estado_pago' => 'pagado_efectivo']),
            json_encode(['estado_pago' => 'liquidado', 'motivo' => "Caja liquidada por administrador #$adminId"]),
            $adminId, $adminId
        ]);
    }

    $db->commit();

    echo formatResponse("success", [
        "mensaje" => "Caja del Rider liquidada con éxito.",
        "rider_id" => $riderId,
        "nombre_rider" => $rider['nombre'],
        "total_liquidado_bs" => $totalLiquidado,
        "pedidos_liquidados" => $pedidosLiquidadosIds
    ], $adminId);

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    echo formatResponse("error", null, null, $e->getMessage());
}

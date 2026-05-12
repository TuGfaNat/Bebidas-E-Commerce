<?php
// microservices/Rider/delivery.php
require_once '../Auth/connection.php';

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
    $action = $_POST['action'] ?? null;
    $riderId = $_POST['rider_id'] ?? null;
    $pedidoId = $_POST['pedido_id'] ?? null;

    if (!$riderId || !$action || !$pedidoId) {
        throw new Exception("Faltan parámetros básicos (action, rider_id, pedido_id).");
    }

    $db = DatabaseConnection::getInstance()->getConnection();

    // Verificar que sea el Rider asignado al pedido
    $stmtRider = $db->prepare("SELECT rider_id, estado_pedido FROM pedidos WHERE id = ?");
    $stmtRider->execute([$pedidoId]);
    $pedido = $stmtRider->fetch();

    if (!$pedido || $pedido['rider_id'] != $riderId) {
        throw new Exception("Pedido no encontrado o no estás asignado a este pedido.");
    }

    $db->beginTransaction();

    if ($action === 'marcar_en_camino') {
        if ($pedido['estado_pedido'] !== 'asignado') throw new Exception("El pedido debe estar 'asignado' para ponerlo en camino.");

        $stmt = $db->prepare("UPDATE pedidos SET estado_pedido = 'en_camino', updated_by = ? WHERE id = ?");
        $stmt->execute([$riderId, $pedidoId]);

        $stmtLog = $db->prepare("INSERT INTO auditoria_logs (tabla_afectada, registro_id, accion, datos_anteriores, datos_nuevos, created_by, updated_by) VALUES (?, ?, 'UPDATE', ?, ?, ?, ?)");
        $stmtLog->execute(['pedidos', $pedidoId, json_encode(['estado_pedido' => 'asignado']), json_encode(['estado_pedido' => 'en_camino']), $riderId, $riderId]);

        $db->commit();
        echo formatResponse("success", ["mensaje" => "Pedido marcado en camino."], $riderId);

    } elseif ($action === 'marcar_entregado') {
        if ($pedido['estado_pedido'] !== 'en_camino') throw new Exception("El pedido debe estar 'en_camino' para entregarlo.");

        $stmt = $db->prepare("UPDATE pedidos SET estado_pedido = 'entregado', updated_by = ? WHERE id = ?");
        $stmt->execute([$riderId, $pedidoId]);

        // Si el pago es contraentrega, al entregar se asume que se recibió el efectivo (logica de caja)
        $stmtPago = $db->prepare("SELECT estado_pago FROM pedidos WHERE id = ?");
        $stmtPago->execute([$pedidoId]);
        $pagoData = $stmtPago->fetch();

        if ($pagoData['estado_pago'] === 'contraentrega') {
            $stmtUpdPago = $db->prepare("UPDATE pedidos SET estado_pago = 'pagado_efectivo', updated_by = ? WHERE id = ?");
            $stmtUpdPago->execute([$riderId, $pedidoId]);

            $stmtLogPago = $db->prepare("INSERT INTO auditoria_logs (tabla_afectada, registro_id, accion, datos_anteriores, datos_nuevos, created_by, updated_by) VALUES (?, ?, 'UPDATE', ?, ?, ?, ?)");
            $stmtLogPago->execute(['pedidos', $pedidoId, json_encode(['estado_pago' => 'contraentrega']), json_encode(['estado_pago' => 'pagado_efectivo']), $riderId, $riderId]);
        }

        $stmtLog = $db->prepare("INSERT INTO auditoria_logs (tabla_afectada, registro_id, accion, datos_anteriores, datos_nuevos, created_by, updated_by) VALUES (?, ?, 'UPDATE', ?, ?, ?, ?)");
        $stmtLog->execute(['pedidos', $pedidoId, json_encode(['estado_pedido' => 'en_camino']), json_encode(['estado_pedido' => 'entregado']), $riderId, $riderId]);

        $db->commit();
        echo formatResponse("success", ["mensaje" => "Pedido entregado con éxito."], $riderId);

    } else {
        throw new Exception("Acción no válida.");
    }

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    echo formatResponse("error", null, $_POST['rider_id'] ?? null, $e->getMessage());
}

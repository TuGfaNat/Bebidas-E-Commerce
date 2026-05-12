<?php
// microservices/Rider/assignment.php
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
    $action = $_GET['action'] ?? null;
    $riderId = $_POST['rider_id'] ?? $_GET['rider_id'] ?? null;

    if (!$riderId || !$action) {
        throw new Exception("Falta rider_id o action.");
    }

    $db = DatabaseConnection::getInstance()->getConnection();

    // Verificar que sea un Rider verificado
    $stmtRider = $db->prepare("SELECT role, ci_status FROM users WHERE id = ?");
    $stmtRider->execute([$riderId]);
    $rider = $stmtRider->fetch();
    if (!$rider || $rider['role'] !== 'rider' || $rider['ci_status'] !== 'verified') {
        throw new Exception("Debes ser un Rider verificado para usar este módulo.");
    }

    if ($action === 'list_pending') {
        // En listar, hipotéticamente pediríamos coordenadas del rider y cruzaríamos con las del cliente.
        // Como no tenemos lat/lon en tabla, simularemos llamando al script de python con coordenadas fijas.

        $stmt = $db->query("SELECT id, cliente_id, total, estado_pago FROM pedidos WHERE estado_pedido = 'pendiente' AND estado_pago IN ('pagado_qr', 'contraentrega')");
        $pedidos = $stmt->fetchAll();

        $disponibles = [];
        foreach ($pedidos as $p) {
            // Simulamos llamada al motor logístico en Python
            $latCliente = -16.5000;
            $lonCliente = -68.1193;
            $latTienda = -16.4897;
            $lonTienda = -68.1193;

            // Ejecutamos el motor de logística (sincrónico para el prototipo)
            $safeRiderId = escapeshellarg($riderId);
            $cmd = escapeshellcmd("python3 ../Logistics/calculator.py $safeRiderId $latCliente $lonCliente $latTienda $lonTienda");
            $pythonOutput = shell_exec($cmd);
            $logisticsData = json_decode($pythonOutput, true);

            $disponibles[] = [
                'pedido_id' => $p['id'],
                'cliente_id' => $p['cliente_id'],
                'total_factura' => $p['total'],
                'estado_pago' => $p['estado_pago'],
                'logistica' => $logisticsData['data'] ?? null
            ];
        }

        echo formatResponse("success", ["pedidos_disponibles" => $disponibles], $riderId);

    } elseif ($action === 'accept_order') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') throw new Exception("Método POST requerido.");

        $pedidoId = $_POST['pedido_id'] ?? null;
        if (!$pedidoId) throw new Exception("Falta ID de pedido.");

        $db->beginTransaction();

        $stmtOld = $db->prepare("SELECT estado_pedido FROM pedidos WHERE id = ? FOR UPDATE");
        $stmtOld->execute([$pedidoId]);
        $oldData = $stmtOld->fetch();

        if (!$oldData || $oldData['estado_pedido'] !== 'pendiente') {
            throw new Exception("El pedido ya fue asignado o no está disponible.");
        }

        // Asignar el pedido al rider
        $stmt = $db->prepare("UPDATE pedidos SET rider_id = ?, estado_pedido = 'asignado', updated_by = ? WHERE id = ?");
        $stmt->execute([$riderId, $riderId, $pedidoId]);

        $stmtLog = $db->prepare("INSERT INTO auditoria_logs (tabla_afectada, registro_id, accion, datos_anteriores, datos_nuevos, created_by, updated_by) VALUES (?, ?, 'UPDATE', ?, ?, ?, ?)");
        $stmtLog->execute(['pedidos', $pedidoId, json_encode(['estado_pedido' => $oldData['estado_pedido']]), json_encode(['estado_pedido' => 'asignado', 'rider_id' => $riderId]), $riderId, $riderId]);

        // Descontar Stock en tiempo real
        // Como implementaremos pedido_detalles en el esquema, iteraríamos acá:
        $stmtDetalles = $db->prepare("SELECT producto_id, cantidad FROM pedido_detalles WHERE pedido_id = ?");
        $stmtDetalles->execute([$pedidoId]);
        $detalles = $stmtDetalles->fetchAll();

        foreach ($detalles as $det) {
            // Actualizamos stock y registramos la auditoría de cada producto afectado
            $stmtStockOld = $db->prepare("SELECT stock FROM productos WHERE id = ? FOR UPDATE");
            $stmtStockOld->execute([$det['producto_id']]);
            $oldStock = $stmtStockOld->fetch()['stock'];

            $newStock = $oldStock - $det['cantidad'];
            if ($newStock < 0) throw new Exception("Stock insuficiente para el producto ID: " . $det['producto_id']);

            $stmtUpdProd = $db->prepare("UPDATE productos SET stock = ?, updated_by = ? WHERE id = ?");
            $stmtUpdProd->execute([$newStock, $riderId, $det['producto_id']]);

            $stmtLogProd = $db->prepare("INSERT INTO auditoria_logs (tabla_afectada, registro_id, accion, datos_anteriores, datos_nuevos, created_by, updated_by) VALUES (?, ?, 'UPDATE', ?, ?, ?, ?)");
            $stmtLogProd->execute(['productos', $det['producto_id'], json_encode(['stock' => $oldStock]), json_encode(['stock' => $newStock]), $riderId, $riderId]);
        }

        $db->commit();
        echo formatResponse("success", ["mensaje" => "Pedido aceptado. El stock ha sido descontado correctamente."], $riderId);

    } else {
        throw new Exception("Acción no reconocida.");
    }

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    echo formatResponse("error", null, $_POST['rider_id'] ?? $_GET['rider_id'] ?? null, $e->getMessage());
}

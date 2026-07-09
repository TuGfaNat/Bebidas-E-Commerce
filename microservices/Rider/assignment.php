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

function haversinePHP($lat1, $lon1, $lat2, $lon2) {
    $R = 6371.0;
    $lat1_rad = deg2rad($lat1);
    $lon1_rad = deg2rad($lon1);
    $lat2_rad = deg2rad($lat2);
    $lon2_rad = deg2rad($lon2);
    $dlon = $lon2_rad - $lon1_rad;
    $dlat = $lat2_rad - $lat1_rad;
    $a = sin($dlat / 2)**2 + cos($lat1_rad) * cos($lat2_rad) * sin($dlon / 2)**2;
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    return $R * $c;
}

try {
    require_once '../Auth/jwt.php';
    $action = $_GET['action'] ?? null;

    if (!$action) {
        throw new Exception("Falta action.");
    }

    $payload = JWTHelper::authenticate();
    $riderId = $payload['user_id'];
    $riderRole = $payload['role'];

    $db = DatabaseConnection::getInstance()->getConnection();

    // Verificar que sea un Rider verificado
    $stmtRider = $db->prepare("SELECT role, ci_status FROM users WHERE id = ?");
    $stmtRider->execute([$riderId]);
    $rider = $stmtRider->fetch();
    if (!$rider || $rider['role'] !== 'rider' || $rider['ci_status'] !== 'verified') {
        throw new Exception("Debes ser un Rider verificado para usar este módulo.");
    }

    if ($action === 'list_pending') {
        // Consultar coordenadas del cliente dinámicamente de pedidos
        $stmt = $db->query("SELECT id, cliente_id, total, estado_pago, latitud, longitud FROM pedidos WHERE estado_pedido = 'pendiente' AND estado_pago IN ('pagado_qr', 'contraentrega')");
        $pedidos = $stmt->fetchAll();

        $disponibles = [];
        foreach ($pedidos as $p) {
            $latCliente = $p['latitud'] ?? -16.5000;
            $lonCliente = $p['longitud'] ?? -68.1193;
            $latTienda = -16.4897;
            $lonTienda = -68.1193;

            // Intentar ejecutar el motor de Python primero (compatibilidad obligatoria stack)
            $safeRiderId = escapeshellarg($riderId);
            $pythonExec = 'python3';
            if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                $pythonExec = 'python';
            }
            
            $cmd = escapeshellcmd("$pythonExec ../Logistics/calculator.py $safeRiderId $latCliente $lonCliente $latTienda $lonTienda");
            $pythonOutput = shell_exec($cmd);
            $logisticsData = json_decode($pythonOutput, true);

            // Fallback en PHP nativo si falla la ejecución del CLI de Python
            if (!$logisticsData || $logisticsData['status'] !== 'success') {
                $distancia_km = haversinePHP($latCliente, $lonCliente, $latTienda, $lonTienda);
                $tiempo_estimado_min = ($distancia_km / 30.0) * 60.0;
                $costo_envio_bs = 5.0 + ($distancia_km * 2.0);
                
                $logData = [
                    "distancia_km" => round($distancia_km, 2),
                    "tiempo_estimado" => round($tiempo_estimado_min) . " min",
                    "costo_envio_bs" => round($costo_envio_bs, 2)
                ];
            } else {
                $logData = $logisticsData['data'];
            }

            $disponibles[] = [
                'pedido_id' => $p['id'],
                'cliente_id' => $p['cliente_id'],
                'total_factura' => $p['total'],
                'estado_pago' => $p['estado_pago'],
                'logistica' => $logData
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

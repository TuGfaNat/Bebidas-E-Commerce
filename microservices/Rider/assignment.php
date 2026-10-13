<?php
// microservices/Rider/assignment.php
/**
 * ============================================================================
 * 📋 EXPLICACIÓN FÁCIL: LA PIZARRA DE PEDIDOS LISTOS PARA LOS REPARTIDORES
 * ============================================================================
 * ¿Para qué sirve este archivo?
 * Cuando las hamburguesas salen calientes de la cocina, se anotan en esta pizarra:
 *  1. 🛵 El repartidor mira la lista y ve qué tan lejos está cada cliente.
 *  2. 🖐️ Presiona "Aceptar Pedido": La pizarra le asigna la bolsa y no deja
 *     que ningún otro repartidor se la quite.
 *  3. ⚠️ Regla de oro: Un repartidor solo puede llevar 1 pedido a la vez para
 *     que la comida nunca se enfríe.
 * ============================================================================
 */
require_once __DIR__ . '/../Auth/connection.php';
require_once __DIR__ . '/../Auth/jwt.php';
require_once __DIR__ . '/../Auth/security.php';

// Aplicar CORS
applyCorsMiddleware();

header('Content-Type: application/json; charset=UTF-8');

/**
 * Formato de respuesta estándar BMAD
 */
function formatResponse($status, $data, $userId = null, $errorDetails = null, $action = "ASSIGNMENT") {
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

/**
 * Cálculo de distancia Haversine en kilómetros
 */
function calculateDistanceKm($lat1, $lon1, $lat2, $lon2) {
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
    // 1. Validar autenticación vía JWT Bearer
    $payload = requireAuth(['rider', 'super_usuario', 'admin']);
    $userId = (int)$payload['user_id'];
    $userRole = $payload['role'];

    $db = DatabaseConnection::getInstance()->getConnection();

    // 2. Si el usuario es rider, validar que su documentación esté en estado 'aprobado'
    // Criterio de Aceptación: Rider no aprobado recibe 403 Forbidden
    if ($userRole === 'rider') {
        requireApprovedRider($db, $userId);
    }

    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $input = getRequestData();
    $action = $_GET['action'] ?? ($input['action'] ?? null);

    // =========================================================================
    // ACCIÓN: Listar Pedidos Pendientes Disponibles (GET)
    // =========================================================================
    if ($method === 'GET' || $action === 'list_pending') {
        // Consultar ubicación y datos oficiales del restaurante desde MySQL
        $stmtStore = $db->query("SELECT nombre_tienda, direccion, zona, latitud, longitud, telefono FROM configuracion_tienda WHERE id = 1");
        $storeData = $stmtStore ? $stmtStore->fetch(PDO::FETCH_ASSOC) : null;

        $latTienda = $storeData ? floatval($storeData['latitud']) : -16.5050;
        $lonTienda = $storeData ? floatval($storeData['longitud']) : -68.1290;
        $storeObj = [
            'nombre' => $storeData['nombre_tienda'] ?? 'Burger 24/7 - Central Sopocachi',
            'direccion' => $storeData['direccion'] ?? 'Av. 20 de Octubre #2150, Sopocachi, La Paz',
            'zona' => $storeData['zona'] ?? 'Sopocachi',
            'latitud' => $latTienda,
            'longitud' => $lonTienda,
            'telefono' => $storeData['telefono'] ?? '+591 71523481'
        ];

        $stmt = $db->query("
            SELECT p.id, p.cliente_id, p.total, p.estado_pago, p.estado_pedido, 
                   p.latitud, p.longitud, p.direccion_entrega, p.referencia_entrega, p.telefono_contacto, p.qr_comprobante_url, p.created_at,
                   u.nombre AS cliente_nombre, u.email AS cliente_email, u.telefono AS cliente_telefono_user
            FROM pedidos p
            LEFT JOIN users u ON p.cliente_id = u.id
            WHERE p.estado_pedido = 'pendiente' 
              AND p.estado_pago IN ('pagado_qr', 'contraentrega')
            ORDER BY p.id DESC
        ");
        $pedidos = $stmt->fetchAll();

        $disponibles = [];
        foreach ($pedidos as $p) {
            $latCliente = floatval($p['latitud'] ?? -16.5000);
            $lonCliente = floatval($p['longitud'] ?? -68.1193);

            // Obtener detalles de productos del pedido
            $stmtDet = $db->prepare("
                SELECT d.producto_id, d.cantidad, d.precio_unitario, pr.nombre AS producto_nombre
                FROM pedido_detalles d
                LEFT JOIN productos pr ON pr.id = d.producto_id
                WHERE d.pedido_id = ?
            ");
            $stmtDet->execute([$p['id']]);
            $detalles = $stmtDet->fetchAll();

            $distanciaKm = calculateDistanceKm($latCliente, $lonCliente, $latTienda, $lonTienda);
            $tiempoEstimadoMin = max(5, round(($distanciaKm / 30.0) * 60.0));
            $costoEnvioBs = round(5.0 + ($distanciaKm * 2.0), 2);

            $disponibles[] = [
                'pedido_id' => (int)$p['id'],
                'cliente_id' => (int)$p['cliente_id'],
                'cliente_nombre' => $p['cliente_nombre'] ?? 'Cliente',
                'cliente_email' => $p['cliente_email'] ?? '',
                'cliente_telefono' => $p['telefono_contacto'] ?: ($p['cliente_telefono_user'] ?? ''),
                'direccion_entrega' => $p['direccion_entrega'] ?: 'Dirección marcada en mapa',
                'referencia_entrega' => $p['referencia_entrega'] ?: '',
                'qr_comprobante_url' => $p['qr_comprobante_url'] ?? null,
                'tienda' => $storeObj,
                'total' => floatval($p['total']),
                'estado_pago' => $p['estado_pago'],
                'estado_pedido' => $p['estado_pedido'],
                'fecha_creacion' => $p['created_at'],
                'items' => array_map(function($d) {
                    return [
                        'producto_id' => (int)$d['producto_id'],
                        'nombre' => $d['producto_nombre'] ?? 'Producto',
                        'cantidad' => (int)$d['cantidad'],
                        'precio_unitario' => floatval($d['precio_unitario'])
                    ];
                }, $detalles),
                'logistica' => [
                    'distancia_km' => round($distanciaKm, 2),
                    'tiempo_estimado' => $tiempoEstimadoMin . " min",
                    'costo_envio_bs' => $costoEnvioBs
                ]
            ];
        }

        // 3. Consultar pedido activo actualmente asignado a este rider
        $pedidoActivo = null;
        $stmtActive = $db->prepare("
            SELECT p.id, p.cliente_id, p.total, p.estado_pago, p.estado_pedido, 
                   p.latitud, p.longitud, p.direccion_entrega, p.referencia_entrega, p.telefono_contacto, p.qr_comprobante_url, p.created_at,
                   u.nombre AS cliente_nombre, u.email AS cliente_email, u.telefono AS cliente_telefono_user
            FROM pedidos p
            LEFT JOIN users u ON p.cliente_id = u.id
            WHERE p.rider_id = ? AND p.estado_pedido IN ('asignado', 'en_camino')
            LIMIT 1
        ");
        $stmtActive->execute([$userId]);
        $activeRow = $stmtActive->fetch();

        if ($activeRow) {
            $latCli = floatval($activeRow['latitud'] ?? -16.5000);
            $lonCli = floatval($activeRow['longitud'] ?? -68.1193);
            $distKm = calculateDistanceKm($latCli, $lonCli, $latTienda, $lonTienda);
            $etaMin = max(5, round(($distKm / 30.0) * 60.0));

            $stmtDetAct = $db->prepare("
                SELECT d.producto_id, d.cantidad, d.precio_unitario, pr.nombre AS producto_nombre
                FROM pedido_detalles d
                LEFT JOIN productos pr ON pr.id = d.producto_id
                WHERE d.pedido_id = ?
            ");
            $stmtDetAct->execute([$activeRow['id']]);
            $detAct = $stmtDetAct->fetchAll();

            $pedidoActivo = [
                'id' => (int)$activeRow['id'],
                'pedido_id' => (int)$activeRow['id'],
                'cliente_id' => (int)$activeRow['cliente_id'],
                'cliente_nombre' => $activeRow['cliente_nombre'] ?? 'Cliente',
                'cliente_email' => $activeRow['cliente_email'] ?? '',
                'cliente_telefono' => $activeRow['telefono_contacto'] ?: ($activeRow['cliente_telefono_user'] ?? ''),
                'direccion_entrega' => $activeRow['direccion_entrega'] ?: 'Dirección marcada en mapa',
                'referencia_entrega' => $activeRow['referencia_entrega'] ?: '',
                'qr_comprobante_url' => $activeRow['qr_comprobante_url'] ?? null,
                'tienda' => $storeObj,
                'total' => floatval($activeRow['total']),
                'estado_pago' => $activeRow['estado_pago'],
                'estado_pedido' => $activeRow['estado_pedido'],
                'latitud' => $latCli,
                'longitud' => $lonCli,
                'items' => array_map(function($d) {
                    return [
                        'producto_id' => (int)$d['producto_id'],
                        'nombre' => $d['producto_nombre'] ?? 'Producto',
                        'cantidad' => (int)$d['cantidad'],
                        'precio_unitario' => floatval($d['precio_unitario'])
                    ];
                }, $detAct),
                'logistica' => [
                    'distancia_km' => round($distKm, 2),
                    'tiempo_estimado' => $etaMin . " min"
                ]
            ];
        }

        // 4. Consultar historial de pedidos entregados/atendidos por el rider
        $stmtHist = $db->prepare("
            SELECT p.id, p.cliente_id, p.total, p.estado_pago, p.estado_pedido, 
                   p.created_at, p.updated_at, p.recepcion_confirmada, p.fecha_recepcion_cliente,
                   u.nombre AS cliente_nombre, u.email AS cliente_email,
                   cp.calificacion_entrega, cp.comentario_entrega, cp.calificacion_comida
            FROM pedidos p
            LEFT JOIN users u ON p.cliente_id = u.id
            LEFT JOIN calificaciones_pedidos cp ON p.id = cp.pedido_id
            WHERE p.rider_id = ?
            ORDER BY p.id DESC
        ");
        $stmtHist->execute([$userId]);
        $histRows = $stmtHist->fetchAll();

        $historial = [];
        foreach ($histRows as $h) {
            $stmtDetH = $db->prepare("
                SELECT d.producto_id, d.cantidad, d.precio_unitario, pr.nombre AS producto_nombre
                FROM pedido_detalles d
                LEFT JOIN productos pr ON pr.id = d.producto_id
                WHERE d.pedido_id = ?
            ");
            $stmtDetH->execute([$h['id']]);
            $detH = $stmtDetH->fetchAll();

            $historial[] = [
                'pedido_id' => (int)$h['id'],
                'cliente_nombre' => $h['cliente_nombre'] ?? 'Cliente',
                'cliente_email' => $h['cliente_email'] ?? '',
                'total' => floatval($h['total']),
                'estado_pago' => $h['estado_pago'],
                'estado_pedido' => $h['estado_pedido'],
                'recepcion_confirmada' => (int)($h['recepcion_confirmada'] ?? 0) === 1,
                'fecha_recepcion_cliente' => $h['fecha_recepcion_cliente'] ?? null,
                'fecha_creacion' => $h['created_at'],
                'fecha_actualizacion' => $h['updated_at'],
                'calificacion_entrega' => isset($h['calificacion_entrega']) && $h['calificacion_entrega'] !== null ? (int)$h['calificacion_entrega'] : null,
                'comentario_entrega' => $h['comentario_entrega'] ?? null,
                'calificacion_comida' => isset($h['calificacion_comida']) && $h['calificacion_comida'] !== null ? (int)$h['calificacion_comida'] : null,
                'items' => array_map(function($d) {
                    return [
                        'producto_id' => (int)$d['producto_id'],
                        'nombre' => $d['producto_nombre'] ?? 'Producto',
                        'cantidad' => (int)$d['cantidad'],
                        'precio_unitario' => floatval($d['precio_unitario'])
                    ];
                }, $detH),
                'distancia_km' => 1.5
            ];
        }

        echo formatResponse("success", [
            "tienda" => $storeObj,
            "pedidos_disponibles" => $disponibles,
            "pedido_activo" => $pedidoActivo,
            "historial_pedidos" => $historial,
            "total" => count($disponibles)
        ], $userId, null, "LIST_PENDING_ORDERS");
        exit;
    }

    // =========================================================================
    // ACCIÓN: Aceptar Pedido y Asignar al Rider (POST)
    // =========================================================================
    elseif ($method === 'POST' || $action === 'accept_order') {
        $pedidoId = isset($input['pedido_id']) ? (int)$input['pedido_id'] : null;
        if (!$pedidoId) {
            http_response_code(400);
            echo formatResponse("error", null, $userId, "Falta el parámetro requerido 'pedido_id'.", "VALIDATION_ERROR");
            exit;
        }

        // Restricción de negocio: Un rider solo puede tener máximo 1 pedido activo simultáneamente
        if ($userRole === 'rider') {
            $stmtActive = $db->prepare("
                SELECT id, estado_pedido 
                FROM pedidos 
                WHERE rider_id = ? AND estado_pedido IN ('asignado', 'en_camino')
            ");
            $stmtActive->execute([$userId]);
            $activeOrder = $stmtActive->fetch();

            if ($activeOrder) {
                http_response_code(409);
                echo formatResponse("error", null, $userId, "Ya tienes una entrega activa en curso (Pedido #" . $activeOrder['id'] . " en estado '" . $activeOrder['estado_pedido'] . "'). Debes finalizarla antes de aceptar otro pedido.", "ACTIVE_ORDER_EXISTS");
                exit;
            }
        }

        $db->beginTransaction();

        $stmtOld = $db->prepare("SELECT id, estado_pedido, rider_id, estado_pago FROM pedidos WHERE id = ? FOR UPDATE");
        $stmtOld->execute([$pedidoId]);
        $oldData = $stmtOld->fetch();

        if (!$oldData) {
            $db->rollBack();
            http_response_code(404);
            echo formatResponse("error", null, $userId, "Pedido no encontrado.", "NOT_FOUND");
            exit;
        }

        if ($oldData['estado_pedido'] !== 'pendiente' || !empty($oldData['rider_id'])) {
            $db->rollBack();
            http_response_code(409);
            echo formatResponse("error", null, $userId, "El pedido ya fue asignado a otro rider o no está disponible.", "ORDER_UNAVAILABLE");
            exit;
        }

        // Validación estricta: Si el cliente pagará con QR, debe haber completado el pago previo (pagado_qr) antes de asignarse.
        // Si es pago en efectivo, es contraentrega directo.
        if ($oldData['estado_pago'] !== 'pagado_qr' && $oldData['estado_pago'] !== 'contraentrega') {
            $db->rollBack();
            http_response_code(400);
            echo formatResponse("error", null, $userId, "El pedido requiere confirmación previa de pago con QR antes de poder ser asignado a un conductor.", "PAYMENT_NOT_CONFIRMED");
            exit;
        }

        // Asignar el pedido al rider
        $stmt = $db->prepare("UPDATE pedidos SET rider_id = ?, estado_pedido = 'asignado', updated_by = ?, updated_at = NOW() WHERE id = ?");
        $stmt->execute([$userId, $userId, $pedidoId]);

        // Registrar auditoría inmutable
        logAudit(
            $db,
            'pedidos',
            $pedidoId,
            'UPDATE',
            ['estado_pedido' => 'pendiente', 'rider_id' => null],
            ['estado_pedido' => 'asignado', 'rider_id' => $userId],
            $userId
        );

        $db->commit();

        echo formatResponse("success", [
            "mensaje" => "Pedido #" . $pedidoId . " aceptado y asignado exitosamente.",
            "pedido_id" => $pedidoId,
            "estado_pedido" => "asignado",
            "rider_id" => $userId
        ], $userId, null, "ACCEPT_ORDER");
        exit;
    }

    elseif ($method === 'POST' && ($action === 'release_order' || $action === 'reject_order')) {
        $pedidoId = isset($input['pedido_id']) ? (int)$input['pedido_id'] : null;
        if (!$pedidoId) {
            http_response_code(400);
            echo formatResponse("error", null, $userId, "Falta 'pedido_id'.", "VALIDATION_ERROR");
            exit;
        }
        $db->beginTransaction();
        $stmt = $db->prepare("UPDATE pedidos SET rider_id = NULL, estado_pedido = 'pendiente', updated_by = ?, updated_at = NOW() WHERE id = ? AND rider_id = ? AND estado_pedido = 'asignado'");
        $stmt->execute([$userId, $pedidoId, $userId]);
        logAudit($db, 'pedidos', $pedidoId, 'UPDATE', ['rider_id' => $userId, 'estado_pedido' => 'asignado'], ['rider_id' => null, 'estado_pedido' => 'pendiente'], $userId);
        $db->commit();
        echo formatResponse("success", ["mensaje" => "Pedido liberado exitosamente.", "pedido_id" => $pedidoId], $userId, null, "RELEASE_ORDER");
    } else {
        http_response_code(405);
        echo formatResponse("error", null, $userId, "Método HTTP no permitido.", "METHOD_NOT_ALLOWED");
        exit;
    }

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo formatResponse("error", null, $userId ?? null, $e->getMessage(), "SERVER_ERROR");
}

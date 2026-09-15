<?php
// microservices/Transactions/live_monitoring.php
require_once __DIR__ . '/../Auth/connection.php';
require_once __DIR__ . '/../Auth/jwt.php';

header('Content-Type: application/json; charset=utf-8');

function formatResponse($status, $data, $userId = null, $errorDetails = null, $action = "LIVE_MONITORING") {
    return json_encode([
        "status" => $status,
        "data" => $data,
        "audit" => [
            "user_id" => $userId !== null ? $userId : "SYSTEM",
            "timestamp" => date("c"),
            "action" => $action,
            "ip_address" => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
        ],
        "error_details" => $errorDetails
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
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
    // 1. Rechazo estricto de tokens en query string
    if (isset($_GET['token']) || isset($_POST['token']) || isset($_REQUEST['token'])) {
        http_response_code(401);
        echo formatResponse("error", null, null, "Acceso denegado. Tokens por URL no están permitidos.", "AUTH_STRICT");
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo formatResponse("error", null, null, "Método no permitido. Use GET.", "METHOD_NOT_ALLOWED");
        exit;
    }

    // 2. Autenticación y Autorización (Admin / super_usuario)
    $payload = JWTHelper::authenticate();
    $adminId = $payload['user_id'];
    $adminRole = $payload['role'];

    if (!in_array($adminRole, ['super_usuario', 'admin'])) {
        http_response_code(403);
        echo formatResponse("error", null, $adminId, "Permiso denegado. Se requieren privilegios de administrador para acceder a monitoreo en vivo.", "FORBIDDEN");
        exit;
    }

    $db = DatabaseConnection::getInstance()->getConnection();

    // 3. Consultar pedidos activos ('asignado', 'en_camino')
    $stmt = $db->query("
        SELECT 
            p.id as pedido_id,
            p.cliente_id,
            p.rider_id,
            p.estado_pedido,
            p.estado_pago,
            p.total,
            p.latitud,
            p.longitud,
            p.created_at,
            p.updated_at,
            u_c.nombre as cliente_nombre,
            u_c.email as cliente_email,
            u_r.nombre as rider_nombre,
            u_r.email as rider_email
        FROM pedidos p
        JOIN users u_c ON p.cliente_id = u_c.id
        LEFT JOIN users u_r ON p.rider_id = u_r.id
        WHERE p.estado_pedido IN ('asignado', 'en_camino')
        ORDER BY p.created_at DESC
    ");
    $activeOrders = $stmt->fetchAll();

    $monitoreoData = [];
    $latTienda = -16.5050;
    $lonTienda = -68.1290;

    foreach ($activeOrders as $order) {
        $latCliente = isset($order['latitud']) ? floatval($order['latitud']) : -16.5090;
        $lonCliente = isset($order['longitud']) ? floatval($order['longitud']) : -68.1340;

        $distancia = haversinePHP($latCliente, $lonCliente, $latTienda, $lonTienda);
        $etaMin = max(5.0, round(($distancia / 25.0) * 60.0));
        $costoEnvio = 5.0 + ($distancia * 2.0);

        // Interpolación lineal de la posición del rider
        // Si el pedido está 'asignado', el rider está en la tienda preparando el despacho
        // Si el pedido está 'en_camino', se interpola linealmente entre tienda y cliente
        $progreso = 0.0;
        if ($order['estado_pedido'] === 'en_camino') {
            $updatedTime = !empty($order['updated_at']) ? strtotime($order['updated_at']) : time();
            $elapsedSec = max(10, time() - $updatedTime);
            $totalEstSec = max(60, $etaMin * 60);
            $progreso = min(0.95, max(0.15, $elapsedSec / $totalEstSec));
        }

        $latRider = $latTienda + ($latCliente - $latTienda) * $progreso;
        $lonRider = $lonTienda + ($lonCliente - $lonTienda) * $progreso;

        // Cargar items del pedido
        $stmtDetails = $db->prepare("
            SELECT pd.id, pd.producto_id, pd.cantidad, pd.precio_unitario, pr.nombre as producto_nombre
            FROM pedido_detalles pd
            LEFT JOIN productos pr ON pd.producto_id = pr.id
            WHERE pd.pedido_id = ?
        ");
        $stmtDetails->execute([$order['pedido_id']]);
        $rawItems = $stmtDetails->fetchAll();
        $items = array_map(function($i) {
            return [
                "producto_id" => intval($i['producto_id']),
                "nombre" => $i['producto_nombre'] ?? 'Producto',
                "cantidad" => intval($i['cantidad']),
                "precio_unitario" => floatval($i['precio_unitario'])
            ];
        }, $rawItems);

        $monitoreoData[] = [
            "id" => intval($order['pedido_id']),
            "pedido_id" => intval($order['pedido_id']),
            "estado_pedido" => $order['estado_pedido'],
            "estado_pago" => $order['estado_pago'],
            "total" => floatval($order['total']),
            "created_at" => $order['created_at'],
            "updated_at" => $order['updated_at'] ?? $order['created_at'],
            "items" => $items,
            "detalles" => $items,
            "cliente_id" => intval($order['cliente_id']),
            "cliente_nombre" => $order['cliente_nombre'],
            "rider_id" => $order['rider_id'] ? intval($order['rider_id']) : null,
            "rider_nombre" => $order['rider_nombre'],
            "latitud" => $latCliente,
            "longitud" => $lonCliente,
            "distancia_km" => round($distancia, 2),
            "eta_minutos" => round($etaMin),
            "posicion_rider" => [
                "lat" => round($latRider, 6),
                "lon" => round($lonRider, 6),
                "progreso" => round($progreso, 2)
            ],
            "cliente" => [
                "id" => intval($order['cliente_id']),
                "nombre" => $order['cliente_nombre'],
                "email" => $order['cliente_email'],
                "latitud" => $latCliente,
                "longitud" => $lonCliente
            ],
            "rider" => $order['rider_id'] ? [
                "id" => intval($order['rider_id']),
                "nombre" => $order['rider_nombre'],
                "email" => $order['rider_email'],
                "ubicacion_actual" => [
                    "latitud" => round($latRider, 6),
                    "longitud" => round($lonRider, 6),
                    "progreso" => round($progreso, 2)
                ]
            ] : null,
            "logistica" => [
                "distancia_km" => round($distancia, 2),
                "tiempo_estimado" => round($etaMin) . " min",
                "costo_envio_bs" => round($costoEnvio, 2)
            ]
        ];
    }

    // 4. Liquidaciones de caja pendientes por rider
    $stmtSettle = $db->query("
        SELECT 
            u.id as rider_id,
            u.nombre as rider_nombre,
            COALESCE(SUM(p.total), 0) as total_efectivo_pendiente,
            COUNT(p.id) as cantidad_pedidos,
            GROUP_CONCAT(p.id) as pedidos_ids
        FROM users u
        JOIN pedidos p ON p.rider_id = u.id
        WHERE u.role = 'rider'
          AND p.estado_pedido = 'entregado'
          AND p.estado_pago = 'pagado_efectivo'
        GROUP BY u.id, u.nombre
        HAVING total_efectivo_pendiente > 0
    ");
    $rawSettlements = $stmtSettle ? $stmtSettle->fetchAll() : [];
    $settlements = array_map(function($r) {
        return [
            "id" => intval($r['rider_id']),
            "rider_id" => intval($r['rider_id']),
            "nombre" => $r['rider_nombre'],
            "pendingCash" => floatval($r['total_efectivo_pendiente']),
            "total_efectivo_pendiente" => floatval($r['total_efectivo_pendiente']),
            "total_recaudado_bs" => floatval($r['total_efectivo_pendiente']),
            "pedidos_pendientes" => intval($r['cantidad_pedidos'] ?? count(explode(',', $r['pedidos_ids'] ?? ''))),
            "orderIds" => !empty($r['pedidos_ids']) ? array_map('intval', explode(',', $r['pedidos_ids'])) : []
        ];
    }, $rawSettlements);

    echo formatResponse("success", [
        "pedidos_activos" => $monitoreoData,
        "total_activos" => count($monitoreoData),
        "riders_liquidaciones" => $settlements,
        "liquidaciones_pendientes" => $settlements,
        "coordenadas_tienda" => [
            "latitud" => $latTienda,
            "longitud" => $lonTienda
        ]
    ], $adminId, null, "LIVE_MONITORING");

} catch (Exception $e) {
    http_response_code(500);
    echo formatResponse("error", null, null, $e->getMessage(), "ERROR");
}

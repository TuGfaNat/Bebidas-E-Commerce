<?php
// microservices/Transactions/live_monitoring.php
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
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        throw new Exception("Método no permitido. Use GET.");
    }

    // 1. Validar Autenticación y Autorización (Admin)
    $payload = JWTHelper::authenticate();
    $adminId = $payload['user_id'];
    $adminRole = $payload['role'];

    if ($adminRole !== 'super_usuario') {
        throw new Exception("Permiso denegado. Se requiere rol de super_usuario para acceder a monitoreo en vivo.");
    }

    $db = DatabaseConnection::getInstance()->getConnection();

    // 2. Consultar pedidos activos ('asignado', 'en_camino')
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
    $latTienda = -16.4897;
    $lonTienda = -68.1193;

    // 3. Procesar datos geoespaciales para cada pedido en curso
    foreach ($activeOrders as $order) {
        $latCliente = $order['latitud'] ?? -16.5000;
        $lonCliente = $order['longitud'] ?? -68.1193;

        // Calcular distancia y ETA
        $distancia = haversinePHP($latCliente, $lonCliente, $latTienda, $lonTienda);
        $etaMin = ($distancia / 30.0) * 60.0;
        $costoEnvio = 5.0 + ($distancia * 2.0);

        // Simulador de ubicación actual del rider en tránsito
        $latRider = $latTienda;
        $lonRider = $lonTienda;
        if ($order['estado_pedido'] === 'en_camino') {
            // El Rider está a mitad de camino (50%) para la simulación
            $latRider = ($latTienda + $latCliente) / 2;
            $lonRider = ($lonTienda + $lonCliente) / 2;
        }

        $monitoreoData[] = [
            "pedido_id" => $order['pedido_id'],
            "estado_pedido" => $order['estado_pedido'],
            "estado_pago" => $order['estado_pago'],
            "total" => floatval($order['total']),
            "created_at" => $order['created_at'],
            "cliente" => [
                "id" => $order['cliente_id'],
                "nombre" => $order['cliente_nombre'],
                "email" => $order['cliente_email'],
                "latitud" => floatval($latCliente),
                "longitud" => floatval($lonCliente)
            ],
            "rider" => $order['rider_id'] ? [
                "id" => $order['rider_id'],
                "nombre" => $order['rider_nombre'],
                "email" => $order['rider_email'],
                "ubicacion_actual" => [
                    "latitud" => floatval($latRider),
                    "longitud" => floatval($lonRider)
                ]
            ] : null,
            "logistica" => [
                "distancia_km" => round($distancia, 2),
                "tiempo_estimado" => round($etaMin) . " min",
                "costo_envio_bs" => round($costoEnvio, 2)
            ]
        ];
    }

    echo formatResponse("success", [
        "pedidos_activos" => $monitoreoData,
        "total_activos" => count($monitoreoData)
    ], $adminId);

} catch (Exception $e) {
    echo formatResponse("error", null, null, $e->getMessage());
}

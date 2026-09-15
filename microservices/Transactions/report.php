<?php
// microservices/Transactions/report.php
require_once __DIR__ . '/../Auth/connection.php';
require_once __DIR__ . '/../Auth/jwt.php';
require_once __DIR__ . '/../Auth/security.php';

// Aplicar CORS middleware
applyCorsMiddleware();

header('Content-Type: application/json; charset=UTF-8');

/**
 * Formato de respuesta estándar BMAD
 */
function formatResponse($status, $data, $userId = null, $errorDetails = null, $action = "GENERATE_REPORT") {
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

try {
    // 1. Rechazo de tokens en query string
    if (isset($_GET['token']) || isset($_POST['token']) || isset($_REQUEST['token'])) {
        http_response_code(401);
        echo formatResponse("error", null, null, "Acceso denegado. Tokens por URL no están permitidos.", "AUTH_STRICT");
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo formatResponse("error", null, null, "Método no permitido. Use GET o POST.", "METHOD_NOT_ALLOWED");
        exit;
    }

    // 2. Autenticación y validación de rol de Administrador
    $payload = JWTHelper::authenticate();
    $adminId = $payload['user_id'];
    $role = $payload['role'];

    if (!in_array($role, ['super_usuario', 'admin'])) {
        http_response_code(403);
        echo formatResponse("error", null, $adminId, "Permiso denegado. Solo administradores pueden generar reportes de ventas.", "FORBIDDEN");
        exit;
    }

    $db = DatabaseConnection::getInstance()->getConnection();

    // 1. Total de Ventas Exitosas y Desglose de Estados
    $stmtTotales = $db->query("
        SELECT 
            COALESCE(SUM(CASE WHEN estado_pedido = 'entregado' THEN total ELSE 0 END), 0) as ventas_totales,
            COUNT(*) as total_pedidos,
            COALESCE(SUM(CASE WHEN estado_pedido = 'entregado' THEN 1 ELSE 0 END), 0) as pedidos_entregados,
            COALESCE(SUM(CASE WHEN estado_pedido = 'cancelado' THEN 1 ELSE 0 END), 0) as pedidos_cancelados,
            COALESCE(SUM(CASE WHEN estado_pedido = 'en_camino' THEN 1 ELSE 0 END), 0) as pedidos_en_camino,
            COALESCE(SUM(CASE WHEN estado_pedido IN ('pendiente', 'asignado') THEN 1 ELSE 0 END), 0) as pedidos_pendientes
        FROM pedidos
    ");
    $resumen = $stmtTotales->fetch();

    // 2. Comparativa de Métodos de Pago
    $stmtPagos = $db->query("
        SELECT 
            estado_pago,
            COUNT(*) as cantidad_pedidos,
            COALESCE(SUM(total), 0) as monto_total
        FROM pedidos
        WHERE estado_pedido != 'cancelado'
        GROUP BY estado_pago
        ORDER BY monto_total DESC
    ");
    $comparativaPagos = $stmtPagos->fetchAll();

    // 3. Ventas por Categoría de Producto
    $stmtCategorias = $db->query("
        SELECT 
            pr.categoria,
            COALESCE(SUM(pd.cantidad), 0) as unidades_vendidas,
            COALESCE(SUM(pd.cantidad * pd.precio_unitario), 0) as recaudacion
        FROM pedido_detalles pd
        JOIN productos pr ON pd.producto_id = pr.id
        JOIN pedidos pe ON pd.pedido_id = pe.id
        WHERE pe.estado_pedido != 'cancelado'
        GROUP BY pr.categoria
        ORDER BY recaudacion DESC
    ");
    $ventasCategorias = $stmtCategorias->fetchAll();

    // 4. Ranking de Riders (Logística y entregas exitosas)
    $stmtRiders = $db->query("
        SELECT 
            u.id as rider_id,
            u.nombre,
            u.email,
            COUNT(p.id) as entregas_exitosas,
            COALESCE(SUM(p.total), 0) as recaudacion_total
        FROM pedidos p
        JOIN users u ON p.rider_id = u.id
        WHERE p.estado_pedido = 'entregado'
        GROUP BY p.rider_id, u.nombre, u.email
        ORDER BY entregas_exitosas DESC
        LIMIT 10
    ");
    $rankingRiders = $stmtRiders->fetchAll();

    // 5. Top Productos más vendidos
    $stmtTopProductos = $db->query("
        SELECT 
            pr.id,
            pr.nombre,
            pr.categoria,
            pr.marca,
            COALESCE(SUM(pd.cantidad), 0) as total_unidades,
            COALESCE(SUM(pd.cantidad * pd.precio_unitario), 0) as total_recaudado
        FROM pedido_detalles pd
        JOIN productos pr ON pd.producto_id = pr.id
        JOIN pedidos pe ON pd.pedido_id = pe.id
        WHERE pe.estado_pedido != 'cancelado'
        GROUP BY pr.id, pr.nombre, pr.categoria, pr.marca
        ORDER BY total_unidades DESC
        LIMIT 5
    ");
    $topProductos = $stmtTopProductos->fetchAll();

    $reportData = [
        "resumen" => [
            "total_ventas_bs" => (float)($resumen['ventas_totales'] ?? 0),
            "total_pedidos" => (int)($resumen['total_pedidos'] ?? 0),
            "pedidos_entregados" => (int)($resumen['pedidos_entregados'] ?? 0),
            "pedidos_cancelados" => (int)($resumen['pedidos_cancelados'] ?? 0),
            "pedidos_en_camino" => (int)($resumen['pedidos_en_camino'] ?? 0),
            "pedidos_pendientes" => (int)($resumen['pedidos_pendientes'] ?? 0)
        ],
        "metodos_pago" => $comparativaPagos,
        "ventas_por_categoria" => $ventasCategorias,
        "ranking_riders" => $rankingRiders,
        "top_productos" => $topProductos
    ];

    // Auditoría de consulta de reportes
    logAudit(
        $db, 
        'pedidos', 
        0, 
        'SELECT', 
        null, 
        ['accion' => 'Generación de Reportes Financieros y de Logística'], 
        $adminId
    );

    echo formatResponse("success", $reportData, $adminId, null, "GENERATE_REPORT");

} catch (Exception $e) {
    http_response_code(500);
    echo formatResponse("error", null, $adminId ?? null, $e->getMessage(), "INTERNAL_SERVER_ERROR");
}

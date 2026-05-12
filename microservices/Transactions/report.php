<?php
// microservices/Transactions/report.php
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
    $adminId = $_GET['admin_id'] ?? null;

    if (!$adminId) {
        throw new Exception("Se requiere admin_id.");
    }

    $db = DatabaseConnection::getInstance()->getConnection();

    // Auth Check
    $stmtAdmin = $db->prepare("SELECT role FROM users WHERE id = ?");
    $stmtAdmin->execute([$adminId]);
    $admin = $stmtAdmin->fetch();
    if (!$admin || $admin['role'] !== 'super_usuario') {
        throw new Exception("Permiso denegado. Se requiere rol de super_usuario.");
    }

    // 1. Total de Ventas Exitosas
    $stmtTotal = $db->query("SELECT SUM(total) as ventas_totales FROM pedidos WHERE estado_pedido = 'entregado'");
    $totalVentas = $stmtTotal->fetch()['ventas_totales'] ?? 0;

    // 2. Comparativa Pagos (QR vs Efectivo)
    $stmtPagos = $db->query("SELECT estado_pago, COUNT(*) as cantidad, SUM(total) as monto FROM pedidos WHERE estado_pedido = 'entregado' GROUP BY estado_pago");
    $comparativaPagos = $stmtPagos->fetchAll();

    // 3. Ranking de Riders
    $stmtRiders = $db->query("
        SELECT u.nombre, COUNT(p.id) as entregas_exitosas, SUM(p.total) as recaudacion
        FROM pedidos p
        JOIN users u ON p.rider_id = u.id
        WHERE p.estado_pedido = 'entregado'
        GROUP BY p.rider_id
        ORDER BY entregas_exitosas DESC
        LIMIT 10
    ");
    $rankingRiders = $stmtRiders->fetchAll();

    $reportData = [
        "resumen" => [
            "total_ventas_bs" => $totalVentas
        ],
        "metodos_pago" => $comparativaPagos,
        "ranking_riders" => $rankingRiders
    ];

    echo formatResponse("success", $reportData, $adminId);

} catch (Exception $e) {
    echo formatResponse("error", null, $_GET['admin_id'] ?? null, $e->getMessage());
}

<?php
/**
 * ============================================================================
 * Burger 24/7 - Microservicio de Perfil de Usuario (Cliente, Rider, Admin)
 * ============================================================================
 * Retorna la información completa del perfil del usuario autenticado vía JWT,
 * incluyendo estado de C.I., expediente vehicular y métricas operativas.
 * Cumple con SPEC §4 (envelope unificado) y SPEC §5 (auditoría).
 * ============================================================================
 */

require_once __DIR__ . '/connection.php';
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/security.php';

applyCorsMiddleware();
header('Content-Type: application/json; charset=UTF-8');

function formatResponse($status, $data, $userId = null, $errorDetails = null, $action = "GET_PROFILE") {
    return json_encode([
        "status" => $status,
        "data" => $data,
        "audit" => [
            "user_id" => $userId ?: "SYSTEM",
            "timestamp" => date("c"),
            "action" => $action,
            "ip_address" => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
        ],
        "error_details" => $errorDetails
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}

try {
    $payload = requireAuth();
    $userId = (int)$payload['user_id'];

    $db = DatabaseConnection::getInstance()->getConnection();
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

    if ($method === 'GET') {
        // Consultar datos del usuario
        $stmtUser = $db->prepare("
            SELECT id, role, nombre, email, fecha_nacimiento, ci_url, ci_status, created_at, updated_at
            FROM users 
            WHERE id = ?
        ");
        $stmtUser->execute([$userId]);
        $userData = $stmtUser->fetch(PDO::FETCH_ASSOC);
        if ($userData) {
            $userData['foto_url'] = $userData['ci_url'] ?? '';
        }

        if (!$userData) {
            http_response_code(404);
            echo formatResponse("error", null, $userId, "Usuario no encontrado en la base de datos.");
            exit;
        }

        $profile = [
            "user" => [
                "id" => (int)$userData['id'],
                "nombre" => $userData['nombre'],
                "email" => $userData['email'],
                "role" => $userData['role'],
                "fecha_nacimiento" => $userData['fecha_nacimiento'],
                "ci_url" => $userData['ci_url'],
                "foto_url" => $userData['foto_url'] ?? '',
                "ci_status" => $userData['ci_status'] ?? 'pending',
                "created_at" => $userData['created_at']
            ],
            "metrics" => []
        ];

        // Detalles específicos según el Rol
        if ($userData['role'] === 'rider') {
            // Documentación y expediente del Rider
            $stmtRiderDoc = $db->prepare("
                SELECT estado_aprobacion, licencia_url, seguro_url, cv_url, created_at
                FROM documentacion_rider
                WHERE rider_id = ?
            ");
            $stmtRiderDoc->execute([$userId]);
            $riderDoc = $stmtRiderDoc->fetch(PDO::FETCH_ASSOC);

            $profile['rider_docs'] = [
                "estado_aprobacion" => $riderDoc['estado_aprobacion'] ?? 'pendiente',
                "licencia_url" => $riderDoc['licencia_url'] ?? null,
                "seguro_url" => $riderDoc['seguro_url'] ?? null,
                "cv_url" => $riderDoc['cv_url'] ?? null,
                "doc_created_at" => $riderDoc['created_at'] ?? null
            ];

            // Métricas de pedidos y recaudación
            $stmtMetrics = $db->prepare("
                SELECT 
                    COUNT(*) as total_asignados,
                    COALESCE(SUM(CASE WHEN estado_pedido = 'entregado' THEN 1 ELSE 0 END), 0) as entregas_completadas,
                    COALESCE(SUM(CASE WHEN estado_pedido IN ('asignado', 'en_camino') THEN 1 ELSE 0 END), 0) as entregas_activas,
                    COALESCE(SUM(CASE WHEN estado_pago = 'pagado_efectivo' THEN total ELSE 0 END), 0.00) as efectivo_recaudado,
                    COALESCE(SUM(CASE WHEN estado_pago = 'liquidado' THEN total ELSE 0 END), 0.00) as efectivo_liquidado
                FROM pedidos
                WHERE rider_id = ?
            ");
            $stmtMetrics->execute([$userId]);
            $m = $stmtMetrics->fetch(PDO::FETCH_ASSOC);

            $profile['metrics'] = [
                "total_asignados" => (int)$m['total_asignados'],
                "entregas_completadas" => (int)$m['entregas_completadas'],
                "entregas_activas" => (int)$m['entregas_activas'],
                "efectivo_en_mano" => (float)$m['efectivo_recaudado'],
                "efectivo_liquidado" => (float)$m['efectivo_liquidado']
            ];

        } elseif ($userData['role'] === 'cliente') {
            // Métricas de compras del Cliente
            $stmtMetrics = $db->prepare("
                SELECT 
                    COUNT(*) as total_pedidos,
                    COALESCE(SUM(CASE WHEN estado_pedido = 'entregado' THEN 1 ELSE 0 END), 0) as pedidos_entregados,
                    COALESCE(SUM(CASE WHEN estado_pedido IN ('pendiente', 'asignado', 'en_camino') THEN 1 ELSE 0 END), 0) as pedidos_activos,
                    COALESCE(SUM(CASE WHEN estado_pedido = 'entregado' THEN total ELSE 0 END), 0.00) as total_gastado,
                    MAX(created_at) as ultimo_pedido
                FROM pedidos
                WHERE cliente_id = ?
            ");
            $stmtMetrics->execute([$userId]);
            $m = $stmtMetrics->fetch(PDO::FETCH_ASSOC);

            $profile['metrics'] = [
                "total_pedidos" => (int)$m['total_pedidos'],
                "pedidos_entregados" => (int)$m['pedidos_entregados'],
                "pedidos_activos" => (int)$m['pedidos_activos'],
                "total_gastado" => (float)$m['total_gastado'],
                "ultimo_pedido" => $m['ultimo_pedido']
            ];

        } elseif ($userData['role'] === 'super_usuario') {
            // Métricas operativas globales de Administración
            $totUsers = (int)$db->query("SELECT COUNT(*) FROM users")->fetchColumn();
            $totClientes = (int)$db->query("SELECT COUNT(*) FROM users WHERE role = 'cliente'")->fetchColumn();
            $totRiders = (int)$db->query("SELECT COUNT(*) FROM users WHERE role = 'rider'")->fetchColumn();
            $pendientes = (int)$db->query("SELECT COUNT(*) FROM documentacion_rider WHERE estado_aprobacion = 'pendiente'")->fetchColumn();
            $totPedidos = (int)$db->query("SELECT COUNT(*) FROM pedidos")->fetchColumn();

            $profile['metrics'] = [
                "total_usuarios" => $totUsers,
                "total_clientes" => $totClientes,
                "total_riders" => $totRiders,
                "riders_pendientes" => $pendientes,
                "total_pedidos_sistema" => $totPedidos
            ];
        }

        echo formatResponse("success", $profile, $userId, null, "GET_USER_PROFILE");
        exit;
    }

    http_response_code(405);
    echo formatResponse("error", null, $userId, "Método HTTP no soportado.");

} catch (Exception $e) {
    if (http_response_code() === 200) {
        http_response_code(500);
    }
    echo formatResponse("error", null, null, $e->getMessage());
}

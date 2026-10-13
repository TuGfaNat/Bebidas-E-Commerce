<?php
// microservices/Transactions/rating.php
/**
 * ============================================================================
 * ⭐ EXPLICACIÓN FÁCIL: CALIFICACIÓN DE ENTREGA, RIDER Y COMIDA
 * ============================================================================
 * ¿Para qué sirve este archivo?
 * 1. Permite al cliente validar y confirmar que ya recibió su comida en la puerta.
 * 2. Guarda la calificación con estrellitas (1 a 5 ⭐) del repartidor/entrega
 *    y los comentarios sobre la rapidez y atención.
 * 3. Guarda la calificación con estrellitas (1 a 5 ⭐) de la comida y los
 *    comentarios sobre el sabor, temperatura y calidad de las hamburguesas.
 * ============================================================================
 */
require_once __DIR__ . '/../Auth/connection.php';
require_once __DIR__ . '/../Auth/jwt.php';
require_once __DIR__ . '/../Auth/security.php';

applyCorsMiddleware();
header('Content-Type: application/json; charset=UTF-8');

function formatResponse($status, $data, $userId = null, $errorDetails = null, $action = "ORDER_RATING") {
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

try {
    $db = DatabaseConnection::getInstance()->getConnection();
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

    // 1. Manejo de GET: Consultar calificaciones
    if ($method === 'GET') {
        $pedidoId = isset($_GET['pedido_id']) ? (int)$_GET['pedido_id'] : (isset($_GET['order_id']) ? (int)$_GET['order_id'] : null);
        $riderId = isset($_GET['rider_id']) ? (int)$_GET['rider_id'] : null;

        if ($pedidoId) {
            $stmt = $db->prepare("
                SELECT cp.*, p.estado_pedido, p.total, p.recepcion_confirmada, p.fecha_recepcion_cliente
                FROM calificaciones_pedidos cp
                JOIN pedidos p ON cp.pedido_id = p.id
                WHERE cp.pedido_id = ?
            ");
            $stmt->execute([$pedidoId]);
            $rating = $stmt->fetch(PDO::FETCH_ASSOC);

            echo formatResponse("success", [
                "calificacion" => $rating ?: null
            ], null, null, "GET_ORDER_RATING");
            exit;
        }

        if ($riderId) {
            $stmt = $db->prepare("
                SELECT 
                    COUNT(*) as total_calificaciones,
                    COALESCE(AVG(calificacion_entrega), 5.0) as promedio_entrega,
                    COALESCE(AVG(calificacion_comida), 5.0) as promedio_comida
                FROM calificaciones_pedidos
                WHERE rider_id = ?
            ");
            $stmt->execute([$riderId]);
            $stats = $stmt->fetch(PDO::FETCH_ASSOC);

            $stmtList = $db->prepare("
                SELECT cp.calificacion_entrega, cp.comentario_entrega, cp.created_at, u.nombre as cliente_nombre
                FROM calificaciones_pedidos cp
                LEFT JOIN users u ON cp.cliente_id = u.id
                WHERE cp.rider_id = ? AND cp.comentario_entrega IS NOT NULL AND TRIM(cp.comentario_entrega) != ''
                ORDER BY cp.id DESC
                LIMIT 10
            ");
            $stmtList->execute([$riderId]);
            $comentarios = $stmtList->fetchAll(PDO::FETCH_ASSOC);

            echo formatResponse("success", [
                "stats" => [
                    "total" => (int)$stats['total_calificaciones'],
                    "promedio_entrega" => round((float)$stats['promedio_entrega'], 1),
                    "promedio_comida" => round((float)$stats['promedio_comida'], 1)
                ],
                "comentarios" => $comentarios
            ], null, null, "GET_RIDER_RATING_STATS");
            exit;
        }

        // Estadísticas generales del restaurante para Super Admin
        $stmtAll = $db->query("
            SELECT 
                COUNT(*) as total_resenas,
                COALESCE(AVG(calificacion_comida), 5.0) as promedio_comida,
                COALESCE(AVG(calificacion_entrega), 5.0) as promedio_entrega
            FROM calificaciones_pedidos
        ");
        $globalStats = $stmtAll->fetch(PDO::FETCH_ASSOC);

        $stmtRecent = $db->query("
            SELECT cp.*, u.nombre as cliente_nombre, r.nombre as rider_nombre
            FROM calificaciones_pedidos cp
            LEFT JOIN users u ON cp.cliente_id = u.id
            LEFT JOIN users r ON cp.rider_id = r.id
            ORDER BY cp.id DESC
            LIMIT 15
        ");
        $recent = $stmtRecent->fetchAll(PDO::FETCH_ASSOC);

        echo formatResponse("success", [
            "global_stats" => [
                "total" => (int)$globalStats['total_resenas'],
                "promedio_comida" => round((float)$globalStats['promedio_comida'], 1),
                "promedio_entrega" => round((float)$globalStats['promedio_entrega'], 1)
            ],
            "resenas_recientes" => $recent
        ], null, null, "GET_GLOBAL_RATING_STATS");
        exit;
    }

    // 2. Manejo de POST: Registrar / Confirmar recepción y Calificar
    if ($method !== 'POST') {
        http_response_code(405);
        echo formatResponse("error", null, null, "Método HTTP no permitido. Use GET o POST.", "METHOD_NOT_ALLOWED");
        exit;
    }

    $payload = requireAuth(['cliente', 'super_usuario', 'admin']);
    $userId = (int)$payload['user_id'];
    $userRole = $payload['role'];

    $input = getRequestData();
    $pedidoId = isset($input['pedido_id']) ? (int)$input['pedido_id'] : (isset($input['order_id']) ? (int)$input['order_id'] : 0);
    $califEntrega = isset($input['calificacion_entrega']) ? (int)$input['calificacion_entrega'] : 0;
    $comentEntrega = isset($input['comentario_entrega']) ? trim($input['comentario_entrega']) : '';
    $califComida = isset($input['calificacion_comida']) ? (int)$input['calificacion_comida'] : 0;
    $comentComida = isset($input['comentario_comida']) ? trim($input['comentario_comida']) : '';
    $confirmarRecibido = !empty($input['confirmar_recibido']) || !empty($input['confirmar_recepcion']);

    if ($pedidoId <= 0) {
        http_response_code(400);
        echo formatResponse("error", null, $userId, "Parámetro obligatorio 'pedido_id' no válido.", "VALIDATION_ERROR");
        exit;
    }

    if ($califEntrega < 1 || $califEntrega > 5) {
        http_response_code(400);
        echo formatResponse("error", null, $userId, "La calificación de entrega debe estar entre 1 y 5 estrellas.", "VALIDATION_ERROR");
        exit;
    }

    if ($califComida < 1 || $califComida > 5) {
        http_response_code(400);
        echo formatResponse("error", null, $userId, "La calificación de la comida debe estar entre 1 y 5 estrellas.", "VALIDATION_ERROR");
        exit;
    }

    $db->beginTransaction();

    // Consultar pedido
    $stmtPed = $db->prepare("
        SELECT id, cliente_id, rider_id, estado_pedido, estado_pago, total, recepcion_confirmada
        FROM pedidos
        WHERE id = ?
        FOR UPDATE
    ");
    $stmtPed->execute([$pedidoId]);
    $pedido = $stmtPed->fetch(PDO::FETCH_ASSOC);

    if (!$pedido) {
        $db->rollBack();
        http_response_code(404);
        echo formatResponse("error", null, $userId, "Pedido #$pedidoId no encontrado.", "NOT_FOUND");
        exit;
    }

    // Verificar que el pedido pertenezca al usuario (salvo super usuario)
    if ($userRole === 'cliente' && (int)$pedido['cliente_id'] !== $userId) {
        $db->rollBack();
        http_response_code(403);
        echo formatResponse("error", null, $userId, "No tienes autorización para calificar un pedido ajeno.", "FORBIDDEN");
        exit;
    }

    // Validar estado del pedido: debe estar 'en_camino' o 'entregado'
    if (!in_array($pedido['estado_pedido'], ['en_camino', 'entregado'], true)) {
        $db->rollBack();
        http_response_code(400);
        echo formatResponse("error", null, $userId, "Solo puedes calificar un pedido que esté en camino o ya entregado.", "INVALID_STATUS");
        exit;
    }

    // Actualizar recepción confirmada en pedidos
    $stmtUpdPed = $db->prepare("
        UPDATE pedidos
        SET recepcion_confirmada = 1,
            fecha_recepcion_cliente = COALESCE(fecha_recepcion_cliente, NOW()),
            estado_pedido = 'entregado',
            updated_at = NOW()
        WHERE id = ?
    ");
    $stmtUpdPed->execute([$pedidoId]);

    // Insertar o actualizar calificación
    $riderId = $pedido['rider_id'] ? (int)$pedido['rider_id'] : null;
    $stmtRating = $db->prepare("
        INSERT INTO calificaciones_pedidos 
            (pedido_id, cliente_id, rider_id, calificacion_entrega, comentario_entrega, calificacion_comida, comentario_comida)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            calificacion_entrega = VALUES(calificacion_entrega),
            comentario_entrega = VALUES(comentario_entrega),
            calificacion_comida = VALUES(calificacion_comida),
            comentario_comida = VALUES(comentario_comida),
            updated_at = NOW()
    ");
    $stmtRating->execute([
        $pedidoId,
        (int)$pedido['cliente_id'],
        $riderId,
        $califEntrega,
        $comentEntrega ?: null,
        $califComida,
        $comentComida ?: null
    ]);

    $db->commit();

    echo formatResponse("success", [
        "pedido_id" => $pedidoId,
        "recepcion_confirmada" => true,
        "calificacion_entrega" => $califEntrega,
        "comentario_entrega" => $comentEntrega,
        "calificacion_comida" => $califComida,
        "comentario_comida" => $comentComida,
        "mensaje" => "¡Muchas gracias! Tu calificación y confirmación de recepción han sido registradas exitosamente."
    ], $userId, null, "SUBMIT_ORDER_RATING");

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo formatResponse("error", null, null, "Error en el servidor al procesar la calificación: " . $e->getMessage(), "SERVER_ERROR");
}

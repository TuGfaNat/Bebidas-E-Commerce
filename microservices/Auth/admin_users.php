<?php
// microservices/Auth/admin_users.php
require_once __DIR__ . '/connection.php';
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/security.php';

applyCorsMiddleware();
header('Content-Type: application/json; charset=UTF-8');

function formatResponse($status, $data, $userId = null, $errorDetails = null, $action = "ADMIN_USERS") {
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
    $payload = requireAuth(['super_usuario', 'admin']);
    $adminId = (int)$payload['user_id'];

    $db = DatabaseConnection::getInstance()->getConnection();
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

    if ($method === 'GET') {
        $stmtUsers = $db->query("
            SELECT id, nombre, email, fecha_nacimiento, ci_url, ci_status, created_at 
            FROM users 
            WHERE role = 'cliente' 
            ORDER BY id DESC
        ");
        $compradores = $stmtUsers->fetchAll(PDO::FETCH_ASSOC);

        $stmtRiders = $db->query("
            SELECT u.id as rider_id, d.id as doc_id, u.nombre, u.email, u.fecha_nacimiento, u.ci_status,
                   COALESCE(d.estado_aprobacion, 'pendiente') as estado_aprobacion,
                   COALESCE(d.licencia_url, '') as licencia_url,
                   COALESCE(d.seguro_url, '') as seguro_url,
                   COALESCE(d.cv_url, '') as cv_url,
                   u.created_at
            FROM users u
            LEFT JOIN documentacion_rider d ON u.id = d.rider_id
            WHERE u.role = 'rider'
            ORDER BY u.id DESC
        ");
        $riders = $stmtRiders->fetchAll(PDO::FETCH_ASSOC);

        echo formatResponse("success", [
            "compradores" => $compradores,
            "riders" => $riders
        ], $adminId, null, "LIST_ALL_USERS");
        exit;
    }

    if ($method === 'PUT') {
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true) ?? [];

        $targetId = isset($input['target_id']) ? (int)$input['target_id'] : 0;
        $tipo = $input['tipo'] ?? null;
        $estado = $input['estado'] ?? null;

        if (!$targetId || !$tipo || !$estado) {
            http_response_code(400);
            echo formatResponse("error", null, $adminId, "Faltan parámetros requeridos: target_id, tipo, estado.", "VALIDATION_ERROR");
            exit;
        }

        $db->beginTransaction();

        if ($tipo === 'cliente') {
            $mappedCi = in_array($estado, ['verified', 'aprobado'], true) ? 'verified' : (in_array($estado, ['rejected', 'rechazado'], true) ? 'rejected' : 'pending');
            $stmtOld = $db->prepare("SELECT ci_status FROM users WHERE id = ? AND role = 'cliente'");
            $stmtOld->execute([$targetId]);
            $old = $stmtOld->fetch();

            if (!$old) {
                $db->rollBack();
                http_response_code(404);
                echo formatResponse("error", null, $adminId, "Cliente no encontrado.", "NOT_FOUND");
                exit;
            }

            $stmtUpdate = $db->prepare("UPDATE users SET ci_status = ?, updated_by = ?, updated_at = NOW() WHERE id = ?");
            $stmtUpdate->execute([$mappedCi, $adminId, $targetId]);

            logAudit($db, 'users', $targetId, 'UPDATE', ['ci_status' => $old['ci_status']], ['ci_status' => $mappedCi], $adminId);
            $db->commit();

            echo formatResponse("success", ["mensaje" => "Estado de cliente actualizado.", "ci_status" => $mappedCi], $adminId, null, "UPDATE_USER_STATUS");
            exit;
        } elseif ($tipo === 'rider') {
            $mappedDoc = in_array($estado, ['aprobado', 'verified'], true) ? 'aprobado' : (in_array($estado, ['rechazado', 'rejected'], true) ? 'rechazado' : 'pendiente');
            $stmtOld = $db->prepare("SELECT estado_aprobacion FROM documentacion_rider WHERE rider_id = ?");
            $stmtOld->execute([$targetId]);
            $oldDoc = $stmtOld->fetch();

            if ($oldDoc) {
                $stmtUpdate = $db->prepare("UPDATE documentacion_rider SET estado_aprobacion = ?, updated_by = ?, updated_at = NOW() WHERE rider_id = ?");
                $stmtUpdate->execute([$mappedDoc, $adminId, $targetId]);
                logAudit($db, 'documentacion_rider', $targetId, 'UPDATE', ['estado_aprobacion' => $oldDoc['estado_aprobacion']], ['estado_aprobacion' => $mappedDoc], $adminId);
            } else {
                $stmtInsert = $db->prepare("INSERT INTO documentacion_rider (rider_id, licencia_url, seguro_url, cv_url, estado_aprobacion, created_by, updated_by) VALUES (?, '', '', '', ?, ?, ?)");
                $stmtInsert->execute([$targetId, $mappedDoc, $adminId, $adminId]);
                logAudit($db, 'documentacion_rider', $targetId, 'INSERT', null, ['estado_aprobacion' => $mappedDoc], $adminId);
            }

            // Actualizar también ci_status del usuario rider si aplica
            $userCiStatus = ($mappedDoc === 'aprobado') ? 'verified' : (($mappedDoc === 'rechazado') ? 'rejected' : 'pending');
            $stmtUserCi = $db->prepare("UPDATE users SET ci_status = ?, updated_by = ?, updated_at = NOW() WHERE id = ?");
            $stmtUserCi->execute([$userCiStatus, $adminId, $targetId]);

            $db->commit();

            echo formatResponse("success", ["mensaje" => "Estado de rider actualizado.", "estado_aprobacion" => $mappedDoc], $adminId, null, "UPDATE_RIDER_STATUS");
            exit;
        } else {
            $db->rollBack();
            http_response_code(400);
            echo formatResponse("error", null, $adminId, "Tipo no reconocido. Debe ser 'cliente' o 'rider'.", "INVALID_TYPE");
            exit;
        }
    }

    http_response_code(405);
    echo formatResponse("error", null, $adminId, "Método HTTP no permitido.", "METHOD_NOT_ALLOWED");

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo formatResponse("error", null, $adminId ?? null, $e->getMessage(), "SERVER_ERROR");
}

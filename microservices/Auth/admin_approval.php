<?php
// microservices/Auth/admin_approval.php
require_once 'connection.php';

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
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'GET') {
        throw new Exception("Método no permitido. Use GET o POST.");
    }

    require_once 'jwt.php';
    $payload = JWTHelper::authenticate();
    $adminId = $payload['user_id'];
    $adminRole = $payload['role'];

    if ($adminRole !== 'super_usuario' && $adminRole !== 'admin') {
        throw new Exception("Permiso denegado. Se requiere rol de super_usuario.");
    }

    $db = DatabaseConnection::getInstance()->getConnection();

    $jsonRaw = file_get_contents('php://input');
    $jsonData = !empty($jsonRaw) ? json_decode($jsonRaw, true) : [];
    if (!is_array($jsonData)) {
        $jsonData = [];
    }

    $tipo = $_REQUEST['tipo'] ?? ($jsonData['tipo'] ?? ($_SERVER['REQUEST_METHOD'] === 'GET' ? 'pending_list' : null));
    $targetId = $_REQUEST['target_id'] ?? ($jsonData['target_id'] ?? null);
    $nuevoEstado = $_REQUEST['estado'] ?? ($jsonData['estado'] ?? null); // 'aprobado' o 'rechazado'

    if ($tipo === 'pending_list') {
        $stmtUsers = $db->query("SELECT id, nombre, email, fecha_nacimiento, ci_url, ci_status, created_at FROM users WHERE role = 'cliente' AND ci_status = 'pending'");
        $pendingUsers = $stmtUsers->fetchAll();

        $stmtRiders = $db->query("SELECT u.id as rider_id, u.nombre, u.email, u.fecha_nacimiento, u.ci_status, d.id as doc_id, d.licencia_url, d.seguro_url, d.cv_url, d.estado_aprobacion, d.created_at FROM documentacion_rider d JOIN users u ON d.rider_id = u.id WHERE d.estado_aprobacion = 'pendiente'");
        $pendingRiders = $stmtRiders->fetchAll();

        echo formatResponse("success", [
            "pending_customers" => $pendingUsers,
            "pending_riders" => $pendingRiders
        ], $adminId);
        exit;
    }

    if (!$targetId || !$tipo) {
        throw new Exception("Faltan parámetros básicos.");
    }

    $db->beginTransaction();

    if ($tipo === 'user') {
        if (!$nuevoEstado) throw new Exception("Falta estado a aprobar.");
        $mappedState = ($nuevoEstado === 'aprobado') ? 'verified' : 'rejected';

        $stmtOld = $db->prepare("SELECT ci_status FROM users WHERE id = ?");
        $stmtOld->execute([$targetId]);
        $oldData = $stmtOld->fetch();

        $stmt = $db->prepare("UPDATE users SET ci_status = ?, updated_by = ? WHERE id = ?");
        $stmt->execute([$mappedState, $adminId, $targetId]);

        $stmtLog = $db->prepare("INSERT INTO auditoria_logs (tabla_afectada, registro_id, accion, datos_anteriores, datos_nuevos, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmtLog->execute([
            'users', $targetId, 'UPDATE',
            json_encode(['ci_status' => $oldData['ci_status']]),
            json_encode(['ci_status' => $mappedState]),
            $adminId, $adminId
        ]);

    } elseif ($tipo === 'view_user') {
        $stmtView = $db->prepare("SELECT id, nombre, email, ci_url, ci_status FROM users WHERE id = ?");
        $stmtView->execute([$targetId]);
        $data = $stmtView->fetch();
        $db->commit();
        echo formatResponse("success", $data, $adminId);
        exit;

    } elseif ($tipo === 'view_rider') {
        $stmtView = $db->prepare("SELECT u.nombre, d.* FROM documentacion_rider d JOIN users u ON d.rider_id = u.id WHERE d.rider_id = ?");
        $stmtView->execute([$targetId]);
        $data = $stmtView->fetch();
        $db->commit();
        echo formatResponse("success", $data, $adminId);
        exit;

    } elseif ($tipo === 'rider') {
        if (!$nuevoEstado) throw new Exception("Falta estado a aprobar.");
        $stmtOld = $db->prepare("SELECT estado_aprobacion FROM documentacion_rider WHERE rider_id = ?");
        $stmtOld->execute([$targetId]);
        $oldData = $stmtOld->fetch();

        if (!$oldData) {
            throw new Exception("Documentación no encontrada para este rider.");
        }

        $stmt = $db->prepare("UPDATE documentacion_rider SET estado_aprobacion = ?, updated_by = ? WHERE rider_id = ?");
        $stmt->execute([$nuevoEstado, $adminId, $targetId]);

        $mappedState = ($nuevoEstado === 'aprobado') ? 'verified' : 'rejected';
        $stmtU = $db->prepare("UPDATE users SET ci_status = ?, updated_by = ? WHERE id = ?");
        $stmtU->execute([$mappedState, $adminId, $targetId]);

        $stmtLog = $db->prepare("INSERT INTO auditoria_logs (tabla_afectada, registro_id, accion, datos_anteriores, datos_nuevos, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmtLog->execute([
            'documentacion_rider', $targetId, 'UPDATE',
            json_encode(['estado_aprobacion' => $oldData['estado_aprobacion']]),
            json_encode(['estado_aprobacion' => $nuevoEstado]),
            $adminId, $adminId
        ]);
    } else {
        throw new Exception("Tipo inválido. Use 'user', 'rider', 'view_user', o 'view_rider'.");
    }

    $db->commit();
    echo formatResponse("success", ["mensaje" => "Estado actualizado exitosamente."], $adminId);

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    echo formatResponse("error", null, $_POST['admin_id'] ?? null, $e->getMessage());
}

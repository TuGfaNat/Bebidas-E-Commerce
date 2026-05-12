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
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Solo se permite método POST.");
    }

    $adminId = $_POST['admin_id'] ?? null;
    $targetId = $_POST['target_id'] ?? null;
    $tipo = $_POST['tipo'] ?? null; // 'user' o 'rider'
    $nuevoEstado = $_POST['estado'] ?? null; // 'aprobado' o 'rechazado'

    if (!$adminId || !$targetId || !$tipo || !$nuevoEstado) {
        throw new Exception("Faltan parámetros: admin_id, target_id, tipo o estado.");
    }

    $db = DatabaseConnection::getInstance()->getConnection();

    // Validar que el admin sea Super Usuario
    $stmtAdmin = $db->prepare("SELECT role FROM users WHERE id = ?");
    $stmtAdmin->execute([$adminId]);
    $admin = $stmtAdmin->fetch();
    if (!$admin || $admin['role'] !== 'super_usuario') {
        throw new Exception("Permiso denegado. Se requiere rol de super_usuario.");
    }

    $db->beginTransaction();

    if ($tipo === 'user') {
        // Aprobación de C.I. del cliente
        $mappedState = ($nuevoEstado === 'aprobado') ? 'verified' : 'rejected';

        // Obtener datos anteriores
        $stmtOld = $db->prepare("SELECT ci_status FROM users WHERE id = ?");
        $stmtOld->execute([$targetId]);
        $oldData = $stmtOld->fetch();

        $stmt = $db->prepare("UPDATE users SET ci_status = ?, updated_by = ? WHERE id = ?");
        $stmt->execute([$mappedState, $adminId, $targetId]);

        // Trigger Auditoria
        $stmtLog = $db->prepare("INSERT INTO auditoria_logs (tabla_afectada, registro_id, accion, datos_anteriores, datos_nuevos, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmtLog->execute([
            'users', $targetId, 'UPDATE',
            json_encode(['ci_status' => $oldData['ci_status']]),
            json_encode(['ci_status' => $mappedState]),
            $adminId, $adminId
        ]);

    } elseif ($tipo === 'view_user') {
        // Visualizar documentos del cliente
        $stmtView = $db->prepare("SELECT id, nombre, email, ci_url, ci_status FROM users WHERE id = ?");
        $stmtView->execute([$targetId]);
        $data = $stmtView->fetch();
        $db->commit();
        echo formatResponse("success", $data, $adminId);
        exit;

    } elseif ($tipo === 'view_rider') {
        // Visualizar documentos del rider
        $stmtView = $db->prepare("SELECT u.nombre, d.* FROM documentacion_rider d JOIN users u ON d.rider_id = u.id WHERE d.rider_id = ?");
        $stmtView->execute([$targetId]);
        $data = $stmtView->fetch();
        $db->commit();
        echo formatResponse("success", $data, $adminId);
        exit;

    } elseif ($tipo === 'rider') {
        // Aprobación de documentos del rider
        $stmtOld = $db->prepare("SELECT estado_aprobacion FROM documentacion_rider WHERE rider_id = ?");
        $stmtOld->execute([$targetId]);
        $oldData = $stmtOld->fetch();

        if (!$oldData) {
            throw new Exception("Documentación no encontrada para este rider.");
        }

        $stmt = $db->prepare("UPDATE documentacion_rider SET estado_aprobacion = ?, updated_by = ? WHERE rider_id = ?");
        $stmt->execute([$nuevoEstado, $adminId, $targetId]);

        // También aprobamos el usuario base
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
        throw new Exception("Tipo inválido. Use 'user' o 'rider'.");
    }

    $db->commit();
    echo formatResponse("success", ["mensaje" => "Estado actualizado exitosamente."], $adminId);

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    echo formatResponse("error", null, $_POST['admin_id'] ?? null, $e->getMessage());
}

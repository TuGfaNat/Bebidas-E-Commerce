<?php
// microservices/Auth/admin_approval.php
/**
 * ============================================================================
 * 👨‍⚖️ EXPLICACIÓN FÁCIL: EL ESCRITORIO DEL JEFE (APROBACIONES CON SELLO VERDE)
 * ============================================================================
 * ¿Para qué sirve este archivo?
 * Es la oficina del Administrador Central.
 * Aquí el jefe revisa:
 *  1. 📄 Los carnets pendientes de los clientes nuevos.
 *  2. 🛵 Las licencias y seguros de los repartidores postulantes.
 * Si la foto es clara y todo está en orden, el jefe le da al botón verde "Aprobado"
 * y el usuario ya puede comprar hamburguesas o hacer entregas.
 * ============================================================================
 */
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
    ], JSON_UNESCAPED_UNICODE);
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
    $motivoRechazo = trim($_REQUEST['motivo_rechazo'] ?? ($jsonData['motivo_rechazo'] ?? ''));

    if ($tipo === 'pending_list') {
        $stmtUsers = $db->query("
            SELECT id, nombre, email, fecha_nacimiento, ci_url, ci_reverso_url, ci_status, motivo_rechazo, apelacion_motivo, apelacion_estado, created_at 
            FROM users 
            WHERE role = 'cliente' AND (ci_status = 'pending' OR apelacion_estado = 'pendiente') 
            ORDER BY id ASC
        ");
        $pendingUsers = $stmtUsers->fetchAll(PDO::FETCH_ASSOC);
        foreach ($pendingUsers as &$u) {
            $u['foto_url'] = $u['ci_url'] ?? '';
        }
        unset($u);

        $stmtRiders = $db->query("
            SELECT u.id as rider_id, u.nombre, u.email, u.fecha_nacimiento, u.ci_status, u.ci_url, u.ci_reverso_url, 
                   d.id as doc_id, d.licencia_url, d.licencia_reverso_url, d.seguro_url, d.cv_url, 
                   d.estado_aprobacion, d.motivo_rechazo, d.apelacion_motivo, d.apelacion_estado, d.created_at 
            FROM documentacion_rider d 
            JOIN users u ON d.rider_id = u.id 
            WHERE (d.estado_aprobacion = 'pendiente' OR d.apelacion_estado = 'pendiente' OR u.apelacion_estado = 'pendiente') 
            ORDER BY u.id ASC
        ");
        $pendingRiders = $stmtRiders->fetchAll(PDO::FETCH_ASSOC);
        foreach ($pendingRiders as &$r) {
            $r['foto_url'] = $r['ci_url'] ?? '';
        }
        unset($r);

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

        if ($mappedState === 'verified') {
            $stmt = $db->prepare("
                UPDATE users 
                SET ci_status = 'verified', 
                    motivo_rechazo = NULL, 
                    apelacion_estado = 'resuelta', 
                    updated_by = ? 
                WHERE id = ?
            ");
            $stmt->execute([$adminId, $targetId]);
        } else {
            $stmt = $db->prepare("
                UPDATE users 
                SET ci_status = 'rejected', 
                    motivo_rechazo = ?, 
                    apelacion_estado = 'resuelta', 
                    updated_by = ? 
                WHERE id = ?
            ");
            $stmt->execute([$motivoRechazo ?: 'Documentación no válida o incompleta.', $adminId, $targetId]);
        }

    } elseif ($tipo === 'view_user') {
        $stmtView = $db->prepare("SELECT id, nombre, email, ci_url, ci_reverso_url, ci_status, motivo_rechazo, apelacion_motivo, apelacion_estado FROM users WHERE id = ?");
        $stmtView->execute([$targetId]);
        $data = $stmtView->fetch();
        $db->commit();
        echo formatResponse("success", $data, $adminId);
        exit;

    } elseif ($tipo === 'view_rider') {
        $stmtView = $db->prepare("
            SELECT u.nombre, u.email, u.ci_url, u.ci_reverso_url, d.* 
            FROM documentacion_rider d 
            JOIN users u ON d.rider_id = u.id 
            WHERE d.rider_id = ?
        ");
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

        if ($nuevoEstado === 'aprobado') {
            $stmt = $db->prepare("
                UPDATE documentacion_rider 
                SET estado_aprobacion = 'aprobado', 
                    motivo_rechazo = NULL, 
                    apelacion_estado = 'resuelta', 
                    updated_by = ? 
                WHERE rider_id = ?
            ");
            $stmt->execute([$adminId, $targetId]);

            $stmtU = $db->prepare("
                UPDATE users 
                SET ci_status = 'verified', 
                    motivo_rechazo = NULL, 
                    apelacion_estado = 'resuelta', 
                    updated_by = ? 
                WHERE id = ?
            ");
            $stmtU->execute([$adminId, $targetId]);
        } else {
            $stmt = $db->prepare("
                UPDATE documentacion_rider 
                SET estado_aprobacion = 'rechazado', 
                    motivo_rechazo = ?, 
                    apelacion_estado = 'resuelta', 
                    updated_by = ? 
                WHERE rider_id = ?
            ");
            $stmt->execute([$motivoRechazo ?: 'Expediente no válido o documentos ilegibles.', $adminId, $targetId]);

            $stmtU = $db->prepare("
                UPDATE users 
                SET ci_status = 'rejected', 
                    motivo_rechazo = ?, 
                    apelacion_estado = 'resuelta', 
                    updated_by = ? 
                WHERE id = ?
            ");
            $stmtU->execute([$motivoRechazo ?: 'Expediente no válido o documentos ilegibles.', $adminId, $targetId]);
        }

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

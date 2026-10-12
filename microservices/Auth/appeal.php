<?php
// microservices/Auth/appeal.php
/**
 * ============================================================================
 * ⚖️ EXPLICACIÓN FÁCIL: EL BUZÓN DE APELACIONES (SEGUNDA OPORTUNIDAD)
 * ============================================================================
 * ¿Para qué sirve este archivo?
 * Si el jefe rechazó el carnet de un cliente o la licencia de un repartidor
 * (por ejemplo porque la foto salió borrosa o estaba vencida):
 * 1. 📬 El usuario escribe una cartita explicando qué pasó ("Ya saqué foto clara").
 * 2. 📸 Sube sus nuevos documentos en anverso y reverso (en PDF o JPG).
 * 3. 🔄 El sistema cambia su estado de "Rechazado" a "Apelación Pendiente"
 *    para que el Administrador lo vuelva a evaluar con sello de apelación.
 * ============================================================================
 */

require_once __DIR__ . '/connection.php';
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/security.php';

applyCorsMiddleware();
header('Content-Type: application/json; charset=UTF-8');

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
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Método no permitido. Use POST para enviar una apelación.");
    }

    // Verificar token JWT del usuario que apela
    $payload = requireAuth();
    $userId = (int)$payload['user_id'];
    $role = $payload['role'] ?? 'cliente';

    $motivo = trim($_POST['motivo'] ?? ($_POST['justificacion'] ?? ''));
    if (empty($motivo)) {
        throw new Exception("Debes ingresar un motivo o justificación para tu apelación.");
    }

    $db = DatabaseConnection::getInstance()->getConnection();

    $allowedMimeTypes = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'application/pdf' => 'pdf'
    ];

    // Helper para guardar archivos de apelación
    $guardarArchivo = function($fileObj, $subcarpeta, $prefijo) use ($allowedMimeTypes) {
        if (!$fileObj || $fileObj['error'] !== UPLOAD_ERR_OK) {
            return null;
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $realMime = finfo_file($finfo, $fileObj['tmp_name']);
        finfo_close($finfo);

        if (!array_key_exists($realMime, $allowedMimeTypes)) {
            throw new Exception("El archivo ($prefijo) no es válido. Solo se admiten formatos JPG, PNG o PDF.");
        }

        $ext = $allowedMimeTypes[$realMime];
        $uploadDir = __DIR__ . '/uploads/' . $subcarpeta . '/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
            file_put_contents($uploadDir . '.htaccess', "Require all denied\n");
        }

        $filename = uniqid('appeal_' . $prefijo . '_') . '.' . $ext;
        $dest = $uploadDir . $filename;
        if (!move_uploaded_file($fileObj['tmp_name'], $dest)) {
            throw new Exception("No se pudo guardar el archivo físico de apelación ($prefijo).");
        }

        return '/uploads/' . $subcarpeta . '/' . $filename;
    };

    $db->beginTransaction();

    if ($role === 'cliente') {
        // Apelación de Cliente: Nuevos C.I. Anverso y Reverso
        $ciAnverso = $_FILES['ci_anverso'] ?? ($_FILES['ci_image'] ?? null);
        $ciReverso = $_FILES['ci_reverso'] ?? null;

        $ciAnversoUrl = $ciAnverso ? $guardarArchivo($ciAnverso, 'ci', 'ci_anverso') : null;
        $ciReversoUrl = $ciReverso ? $guardarArchivo($ciReverso, 'ci', 'ci_reverso') : null;

        $stmt = $db->prepare("
            UPDATE users 
            SET ci_status = 'pending',
                apelacion_motivo = ?,
                apelacion_estado = 'pendiente',
                ci_url = COALESCE(?, ci_url),
                ci_reverso_url = COALESCE(?, ci_reverso_url),
                updated_by = ?
            WHERE id = ?
        ");
        $stmt->execute([$motivo, $ciAnversoUrl, $ciReversoUrl, $userId, $userId]);

    } elseif ($role === 'rider') {
        // Apelación de Repartidor: Nueva Licencia Anverso, Reverso, SOAT o CV
        $licAnverso = $_FILES['licencia_anverso'] ?? ($_FILES['licencia'] ?? null);
        $licReverso = $_FILES['licencia_reverso'] ?? null;
        $seguro = $_FILES['seguro'] ?? null;
        $cv = $_FILES['cv'] ?? null;

        $licAnversoUrl = $licAnverso ? $guardarArchivo($licAnverso, 'docs', 'lic_anverso') : null;
        $licReversoUrl = $licReverso ? $guardarArchivo($licReverso, 'docs', 'lic_reverso') : null;
        $seguroUrl = $seguro ? $guardarArchivo($seguro, 'docs', 'seguro') : null;
        $cvUrl = $cv ? $guardarArchivo($cv, 'docs', 'cv') : null;

        $stmtDoc = $db->prepare("
            UPDATE documentacion_rider
            SET estado_aprobacion = 'pendiente',
                apelacion_motivo = ?,
                apelacion_estado = 'pendiente',
                licencia_url = COALESCE(?, licencia_url),
                licencia_reverso_url = COALESCE(?, licencia_reverso_url),
                seguro_url = COALESCE(?, seguro_url),
                cv_url = COALESCE(?, cv_url),
                updated_by = ?
            WHERE rider_id = ?
        ");
        $stmtDoc->execute([$motivo, $licAnversoUrl, $licReversoUrl, $seguroUrl, $cvUrl, $userId, $userId]);

        $stmtUser = $db->prepare("
            UPDATE users 
            SET ci_status = 'pending',
                apelacion_motivo = ?,
                apelacion_estado = 'pendiente',
                updated_by = ?
            WHERE id = ?
        ");
        $stmtUser->execute([$motivo, $userId, $userId]);

    } else {
        throw new Exception("El rol actual no permite presentar apelaciones.");
    }

    $db->commit();

    echo formatResponse("success", [
        "mensaje" => "Tu apelación y documentos corregidos fueron enviados con éxito. El administrador evaluará tu caso a la brevedad.",
        "user_id" => $userId,
        "apelacion_estado" => "pendiente"
    ], $userId);

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(400);
    echo formatResponse("error", null, null, $e->getMessage());
}

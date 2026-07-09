<?php
// microservices/Auth/register_rider.php
require_once 'connection.php';
require_once 'jwt.php';

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
        throw new Exception("Método no permitido. Use POST.");
    }

    $nombre = $_POST['nombre'] ?? '';
    $correo = $_POST['correo'] ?? '';
    $password = $_POST['password'] ?? '';
    $fecha_nacimiento = $_POST['fecha_nacimiento'] ?? '';

    $licencia = $_FILES['licencia'] ?? null;
    $seguro = $_FILES['seguro'] ?? null;
    $cv = $_FILES['cv'] ?? null;

    if (empty($nombre) || empty($correo) || empty($password) || empty($fecha_nacimiento) || empty($licencia) || empty($seguro) || empty($cv)) {
        throw new Exception("Faltan campos obligatorios o archivos del expediente.");
    }

    // 1. Validación de edad (> 18 años)
    $fechaNac = new DateTime($fecha_nacimiento);
    $hoy = new DateTime();
    $edad = $hoy->diff($fechaNac)->y;

    if ($edad < 18) {
        throw new Exception("El rider debe ser mayor de 18 años.");
    }

    // 2. Validación de formatos de archivos
    $allowedMimeTypes = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'application/pdf' => 'pdf'
    ];

    $uploadedFiles = [];
    $docTypes = ['licencia' => $licencia, 'seguro' => $seguro, 'cv' => $cv];

    $uploadDir = __DIR__ . '/uploads/docs/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
        file_put_contents($uploadDir . '.htaccess', "Require all denied\n");
    }

    foreach ($docTypes as $key => $file) {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new Exception("Error al subir el documento: $key.");
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $realMime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!array_key_exists($realMime, $allowedMimeTypes)) {
            throw new Exception("El formato del archivo $key no es válido (solo JPG, PNG, PDF).");
        }

        $ext = $allowedMimeTypes[$realMime];
        $filename = uniqid('doc_' . $key . '_') . '.' . $ext;
        $destination = $uploadDir . $filename;

        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            throw new Exception("No se pudo guardar el archivo físico: $key.");
        }

        $uploadedFiles[$key] = '/uploads/docs/' . $filename;
    }

    $db = DatabaseConnection::getInstance()->getConnection();

    // 3. Validar si el correo ya existe
    $stmtCheck = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmtCheck->execute([$correo]);
    if ($stmtCheck->fetch()) {
        throw new Exception("El correo ya está registrado.");
    }

    $passwordHash = password_hash($password, PASSWORD_BCRYPT);
    $role = 'rider';

    $db->beginTransaction();

    // 4. Insertar en tabla de usuarios
    $stmtUser = $db->prepare("
        INSERT INTO users (role, nombre, email, password_hash, fecha_nacimiento, ci_status)
        VALUES (?, ?, ?, ?, ?, 'pending')
    ");
    $stmtUser->execute([$role, $nombre, $correo, $passwordHash, $fecha_nacimiento]);
    $newRiderId = $db->lastInsertId();

    // Actualizar campos de auditoría de usuarios
    $stmtUpdateUserAudit = $db->prepare("UPDATE users SET created_by = ?, updated_by = ? WHERE id = ?");
    $stmtUpdateUserAudit->execute([$newRiderId, $newRiderId, $newRiderId]);

    // 5. Insertar en tabla documentacion_rider
    $stmtDoc = $db->prepare("
        INSERT INTO documentacion_rider (rider_id, licencia_url, seguro_url, cv_url, estado_aprobacion, created_by, updated_by)
        VALUES (?, ?, ?, ?, 'pendiente', ?, ?)
    ");
    $stmtDoc->execute([$newRiderId, $uploadedFiles['licencia'], $uploadedFiles['seguro'], $uploadedFiles['cv'], $newRiderId, $newRiderId]);
    $newDocId = $db->lastInsertId();

    // 6. Registro de Logs de Auditoría
    $stmtLogUser = $db->prepare("INSERT INTO auditoria_logs (tabla_afectada, registro_id, accion, datos_nuevos, created_by, updated_by) VALUES (?, ?, 'INSERT', ?, ?, ?)");
    $stmtLogUser->execute(['users', $newRiderId, json_encode(['email' => $correo, 'role' => $role, 'ci_status' => 'pending']), $newRiderId, $newRiderId]);

    $stmtLogDoc = $db->prepare("INSERT INTO auditoria_logs (tabla_afectada, registro_id, accion, datos_nuevos, created_by, updated_by) VALUES (?, ?, 'INSERT', ?, ?, ?)");
    $stmtLogDoc->execute(['documentacion_rider', $newDocId, json_encode(['rider_id' => $newRiderId, 'estado_aprobacion' => 'pendiente']), $newRiderId, $newRiderId]);

    $db->commit();

    // Generar Token JWT
    $token = JWTHelper::generate([
        'user_id' => $newRiderId,
        'role' => $role,
        'email' => $correo
    ]);

    echo formatResponse("success", [
        "mensaje" => "Rider registrado y expediente digital creado exitosamente.",
        "token" => $token,
        "documentos" => $uploadedFiles
    ], $newRiderId);

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    
    // Eliminar archivos físicos subidos si la transacción falló
    if (!empty($uploadedFiles)) {
        foreach ($uploadedFiles as $path) {
            $fullPath = __DIR__ . str_replace('/uploads/docs/', '/uploads/docs/', $path);
            if (file_exists($fullPath)) {
                unlink($fullPath);
            }
        }
    }

    echo formatResponse("error", null, null, $e->getMessage());
}

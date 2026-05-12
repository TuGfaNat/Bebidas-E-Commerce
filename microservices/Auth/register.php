<?php
// microservices/Auth/register.php
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
        throw new Exception("Método no permitido. Use POST.");
    }

    $nombre = $_POST['nombre'] ?? '';
    $correo = $_POST['correo'] ?? '';
    $password = $_POST['password'] ?? '';
    $fecha_nacimiento = $_POST['fecha_nacimiento'] ?? '';
    $ci_image = $_FILES['ci_image'] ?? null;

    if (empty($nombre) || empty($correo) || empty($password) || empty($fecha_nacimiento) || empty($ci_image)) {
        throw new Exception("Faltan campos obligatorios.");
    }

    // Validación de edad (> 18 años)
    $fechaNac = new DateTime($fecha_nacimiento);
    $hoy = new DateTime();
    $edad = $hoy->diff($fechaNac)->y;

    if ($edad < 18) {
        throw new Exception("El usuario debe ser mayor de 18 años.");
    }

    // Validación y guardado de imagen en carpeta protegida
    if ($ci_image['error'] !== UPLOAD_ERR_OK) {
        throw new Exception("Error al subir la imagen del C.I.");
    }

    $allowedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!in_array($ci_image['type'], $allowedMimeTypes)) {
        throw new Exception("El formato del archivo C.I. no es válido (solo JPG, PNG, PDF).");
    }

    $uploadDir = __DIR__ . '/uploads/ci/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
        file_put_contents($uploadDir . '.htaccess', "Require all denied\n");
    }

    $ext = pathinfo($ci_image['name'], PATHINFO_EXTENSION);
    $filename = uniqid('ci_') . '.' . $ext;
    $destination = $uploadDir . $filename;

    if (!move_uploaded_file($ci_image['tmp_name'], $destination)) {
        throw new Exception("No se pudo guardar la imagen del C.I.");
    }

    // Guardar en la base de datos
    $db = DatabaseConnection::getInstance()->getConnection();

    // Validar si el correo ya existe
    $stmtCheck = $db->prepare("SELECT id FROM users WHERE email = ?");
    $stmtCheck->execute([$correo]);
    if ($stmtCheck->fetch()) {
        throw new Exception("El correo ya está registrado.");
    }

    $passwordHash = password_hash($password, PASSWORD_BCRYPT);
    $role = 'cliente'; // Por defecto registramos como cliente
    $ciUrl = '/uploads/ci/' . $filename;

    $db->beginTransaction();

    $stmt = $db->prepare("
        INSERT INTO users (role, nombre, email, password_hash, fecha_nacimiento, ci_url, ci_status)
        VALUES (?, ?, ?, ?, ?, ?, 'pending')
    ");

    $stmt->execute([$role, $nombre, $correo, $passwordHash, $fecha_nacimiento, $ciUrl]);
    $newUserId = $db->lastInsertId();

    // Actualizar campos de auditoría (created_by) con el propio ID
    $stmtUpdateAudit = $db->prepare("UPDATE users SET created_by = ?, updated_by = ? WHERE id = ?");
    $stmtUpdateAudit->execute([$newUserId, $newUserId, $newUserId]);

    // Registro de logs (simulado, asumiendo tabla auditoria_logs si existe)
    $stmtLog = $db->prepare("INSERT INTO auditoria_logs (tabla_afectada, registro_id, accion, datos_nuevos, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?)");
    $stmtLog->execute(['users', $newUserId, 'INSERT', json_encode(['email' => $correo, 'ci_url' => $ciUrl]), $newUserId, $newUserId]);

    $db->commit();

    echo formatResponse("success", ["mensaje" => "Usuario registrado correctamente y C.I. guardado."], $newUserId);

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    echo formatResponse("error", null, null, $e->getMessage());
}

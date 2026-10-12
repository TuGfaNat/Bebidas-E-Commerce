<?php
// microservices/Auth/register.php
/**
 * ============================================================================
 * 📝 EXPLICACIÓN FÁCIL: LA MESA DE REGISTRO DE NUEVOS CLIENTES
 * ============================================================================
 * ¿Para qué sirve este archivo?
 * Cuando una persona nueva quiere crearse una cuenta para pedir hamburguesas:
 * 1. 🎂 Revisa la edad: Comprueba que tenga más de 18 años.
 * 2. 📸 Recibe la foto de su Carnet de Identidad (C.I.): La guarda en una carpeta
 *    blindada con .htaccess para que nadie se la robe.
 * 3. ✍️ Anota su nombre y correo en la base de datos con estado "pending"
 *    (en espera de que el administrador mire la foto y le ponga sello verde).
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
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Método no permitido. Use POST.");
    }

    $nombre = $_POST['nombre'] ?? '';
    $correo = $_POST['correo'] ?? '';
    $password = $_POST['password'] ?? '';
    $fecha_nacimiento = $_POST['fecha_nacimiento'] ?? '';
    $ci_anverso = $_FILES['ci_anverso'] ?? ($_FILES['ci_image'] ?? null);
    $ci_reverso = $_FILES['ci_reverso'] ?? null;

    if (empty($nombre) || empty($correo) || empty($password) || empty($fecha_nacimiento) || empty($ci_anverso)) {
        throw new Exception("Faltan campos obligatorios o el documento anverso del C.I.");
    }

    // Validación de edad (> 18 años)
    $fechaNac = new DateTime($fecha_nacimiento);
    $hoy = new DateTime();
    $edad = $hoy->diff($fechaNac)->y;

    if ($edad < 18) {
        throw new Exception("El usuario debe ser mayor de 18 años.");
    }

    $allowedMimeTypes = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'application/pdf' => 'pdf'
    ];

    $uploadDir = __DIR__ . '/uploads/ci/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
        file_put_contents($uploadDir . '.htaccess', "Require all denied\n");
    }

    // Función para procesar y guardar un archivo de carnet
    $procesarArchivoDoc = function($fileObj, $prefijo) use ($allowedMimeTypes, $uploadDir) {
        if (!$fileObj || $fileObj['error'] !== UPLOAD_ERR_OK) {
            return null;
        }
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $realMime = finfo_file($finfo, $fileObj['tmp_name']);
        finfo_close($finfo);

        if (!array_key_exists($realMime, $allowedMimeTypes)) {
            throw new Exception("El formato del documento ($prefijo) debe ser JPG, PNG o PDF.");
        }
        $ext = $allowedMimeTypes[$realMime];
        $filename = uniqid($prefijo . '_') . '.' . $ext;
        $dest = $uploadDir . $filename;
        if (!move_uploaded_file($fileObj['tmp_name'], $dest)) {
            throw new Exception("No se pudo guardar el archivo del C.I. ($prefijo).");
        }
        return '/uploads/ci/' . $filename;
    };

    $ciAnversoUrl = $procesarArchivoDoc($ci_anverso, 'ci_anverso');
    if (!$ciAnversoUrl) {
        throw new Exception("Error al subir el anverso del C.I.");
    }

    $ciReversoUrl = null;
    if (!empty($ci_reverso) && $ci_reverso['error'] === UPLOAD_ERR_OK) {
        $ciReversoUrl = $procesarArchivoDoc($ci_reverso, 'ci_reverso');
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

    $db->beginTransaction();

    $stmt = $db->prepare("
        INSERT INTO users (role, nombre, email, password_hash, fecha_nacimiento, ci_url, ci_reverso_url, ci_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    ");

    $stmt->execute([$role, $nombre, $correo, $passwordHash, $fecha_nacimiento, $ciAnversoUrl, $ciReversoUrl]);
    $newUserId = $db->lastInsertId();

    // Actualizar campos de auditoría (created_by) con el propio ID
    $stmtUpdateAudit = $db->prepare("UPDATE users SET created_by = ?, updated_by = ? WHERE id = ?");
    $stmtUpdateAudit->execute([$newUserId, $newUserId, $newUserId]);

    $db->commit();

    require_once 'jwt.php';
    $token = JWTHelper::generate([
        'user_id' => $newUserId,
        'role' => $role,
        'email' => $correo
    ]);

    echo formatResponse("success", [
        "mensaje" => "Usuario registrado correctamente y documentos anverso/reverso de C.I. guardados.",
        "user_id" => (int)$newUserId,
        "token" => $token
    ], $newUserId);

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    echo formatResponse("error", null, null, $e->getMessage());
}

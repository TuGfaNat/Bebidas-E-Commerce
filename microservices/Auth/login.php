<?php
// microservices/Auth/login.php
require_once 'connection.php';
require_once 'jwt.php';
require_once 'security.php';

// Aplicar CORS restringido
applyCorsMiddleware();

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

    // Comprobar rate limit por IP antes de procesar
    checkLoginRateLimit(5, 300);

    $correo = $_POST['correo'] ?? '';
    $password = $_POST['password'] ?? '';

    if (empty($correo) || empty($password)) {
        throw new Exception("Correo y contraseña son obligatorios.");
    }

    $db = DatabaseConnection::getInstance()->getConnection();
    
    $stmt = $db->prepare("SELECT id, role, nombre, password_hash, ci_status FROM users WHERE email = ?");
    $stmt->execute([$correo]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        recordLoginFailure(300);
        http_response_code(401);
        throw new Exception("Credenciales incorrectas.");
    }

    // Login exitoso: restablecer intentos fallidos
    recordLoginSuccess();

    $token = JWTHelper::generate([
        'user_id' => $user['id'],
        'role' => $user['role'],
        'email' => $correo
    ]);

    echo formatResponse("success", [
        "token" => $token,
        "user" => [
            "id" => $user['id'],
            "nombre" => $user['nombre'],
            "role" => $user['role'],
            "email" => $correo,
            "ci_status" => $user['ci_status']
        ]
    ], $user['id']);

} catch (Exception $e) {
    if (http_response_code() === 200) {
        http_response_code(400);
    }
    echo formatResponse("error", null, null, $e->getMessage());
}

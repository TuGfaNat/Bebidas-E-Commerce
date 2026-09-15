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

    // Parse form-data or JSON body
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $correo = trim($_POST['correo'] ?? ($_POST['email'] ?? ($input['correo'] ?? ($input['email'] ?? ''))));
    $password = trim($_POST['password'] ?? ($input['password'] ?? ''));

    if (empty($correo) || empty($password)) {
        http_response_code(400);
        throw new Exception("Correo y contraseña son obligatorios.");
    }

    $db = DatabaseConnection::getInstance()->getConnection();
    
    $stmt = $db->prepare("SELECT id, role, nombre, email, password_hash, ci_status FROM users WHERE LOWER(email) = LOWER(?)");
    $stmt->execute([$correo]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'])) {
        recordLoginFailure(300);
        http_response_code(401);
        throw new Exception("Credenciales incorrectas.");
    }

    // Login exitoso: restablecer intentos fallidos
    recordLoginSuccess();

    // Generar JWT firmado con expiración de 24 horas (86400 segundos)
    $token = JWTHelper::generateToken([
        'user_id' => (int)$user['id'],
        'role' => $user['role'],
        'email' => $user['email'],
        'nombre' => $user['nombre'],
        'ci_status' => $user['ci_status']
    ], 86400);

    echo formatResponse("success", [
        "token" => $token,
        "user" => [
            "id" => (int)$user['id'],
            "nombre" => $user['nombre'],
            "role" => $user['role'],
            "email" => $user['email'],
            "ci_status" => $user['ci_status']
        ]
    ], $user['id']);

} catch (Exception $e) {
    if (http_response_code() === 200) {
        http_response_code(400);
    }
    echo formatResponse("error", null, null, $e->getMessage());
}

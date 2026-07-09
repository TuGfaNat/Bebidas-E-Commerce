<?php
// microservices/Auth/login.php
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
        throw new Exception("Credenciales incorrectas.");
    }

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
    echo formatResponse("error", null, null, $e->getMessage());
}

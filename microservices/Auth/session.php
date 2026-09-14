<?php
// microservices/Auth/session.php
require_once __DIR__ . '/connection.php';
require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/security.php';

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
    // Autenticar mediante cabecera Authorization: Bearer <token>
    // Rechaza estrictamente tokens por query string o body parameters
    $payload = JWTHelper::authenticate();
    $userId = $payload['user_id'] ?? null;

    if (!$userId) {
        http_response_code(401);
        throw new Exception("Acceso denegado. Token no contiene identificador de usuario válido.");
    }

    $userData = null;

    // Intentar obtener los datos más recientes de la base de datos
    try {
        $db = DatabaseConnection::getInstance()->getConnection();
        $stmt = $db->prepare("SELECT id, role, nombre, email, ci_status FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $userData = $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (Exception $dbEx) {
        // En caso de que la conexión a MySQL falle, recurrir a los datos contenidos en el payload JWT
        $userData = null;
    }

    // Fallback con los claims del JWT firmado si la DB no está disponible
    if (!$userData) {
        $userData = [
            'id' => (int)$userId,
            'nombre' => $payload['nombre'] ?? 'Usuario',
            'email' => $payload['email'] ?? '',
            'role' => $payload['role'] ?? 'cliente',
            'ci_status' => $payload['ci_status'] ?? 'verified'
        ];
    }

    echo formatResponse("success", [
        "valid" => true,
        "user" => [
            "id" => (int)$userData['id'],
            "nombre" => $userData['nombre'],
            "email" => $userData['email'],
            "role" => $userData['role'],
            "ci_status" => $userData['ci_status']
        ]
    ], $userId);

} catch (Exception $e) {
    if (http_response_code() === 200) {
        http_response_code(401);
    }
    echo formatResponse("error", null, null, $e->getMessage());
}

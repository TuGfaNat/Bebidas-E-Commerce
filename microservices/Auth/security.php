<?php
// microservices/Auth/security.php
// Middleware de seguridad: CORS restringido, Rate-Limiting, y Helpers de Autenticación Reutilizables
require_once __DIR__ . '/jwt.php';

/**
 * Aplica políticas estrictas de CORS restringidas a orígenes permitidos.
 */
function applyCorsMiddleware() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    // Cargar orígenes permitidos desde el entorno o valores seguros por defecto
    $allowedEnv = getenv('ALLOWED_ORIGINS') ?: ($_ENV['ALLOWED_ORIGINS'] ?? '');
    $allowedOrigins = array_filter(array_map('trim', explode(',', $allowedEnv)));
    if (empty($allowedOrigins)) {
        $allowedOrigins = [
            'http://localhost',
            'http://localhost:8000',
            'http://localhost:3000',
            'http://127.0.0.1',
            'http://127.0.0.1:8000',
            'http://127.0.0.1:3000'
        ];
    }

    if ($origin && in_array($origin, $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: $origin");
        header("Access-Control-Allow-Credentials: true");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    } elseif (!$origin) {
        // Solicitudes no-cross-origin o cliente local
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    }

    // Respuesta inmediata a peticiones preflight OPTIONS
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit(0);
    }
}

/**
 * Valida el límite de intentos de login por dirección IP (Rate Limiting).
 * Por defecto: máximo 5 intentos fallidos en una ventana de 5 minutos (300 segundos).
 */
function checkLoginRateLimit($maxAttempts = 5, $decaySeconds = 300) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $sanitizedIp = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $ip);
    $storageDir = sys_get_temp_dir() . '/bebidas_ratelimit';
    if (!is_dir($storageDir)) {
        @mkdir($storageDir, 0777, true);
    }
    $file = $storageDir . '/limit_' . $sanitizedIp . '.json';

    $now = time();
    $data = ['attempts' => 0, 'first_attempt' => $now];

    if (file_exists($file)) {
        $content = @file_get_contents($file);
        $decoded = json_decode($content, true);
        if (is_array($decoded)) {
            $data = $decoded;
        }
    }

    // Reiniciar ventana de tiempo si ya expiró el decay
    if ($now - $data['first_attempt'] > $decaySeconds) {
        $data = ['attempts' => 0, 'first_attempt' => $now];
        @unlink($file);
    }

    if ($data['attempts'] >= $maxAttempts) {
        $waitTime = $decaySeconds - ($now - $data['first_attempt']);
        http_response_code(429);
        header('Retry-After: ' . max(1, $waitTime));
        echo json_encode([
            "status" => "error",
            "data" => null,
            "audit" => [
                "user_id" => "SYSTEM",
                "timestamp" => date("c")
            ],
            "error_details" => "Demasiados intentos fallidos de inicio de sesión. Por favor espere " . max(1, $waitTime) . " segundos antes de reintentar."
        ]);
        exit;
    }
}

/**
 * Registra un fallo de login incrementando el contador para la IP.
 */
function recordLoginFailure($decaySeconds = 300) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $sanitizedIp = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $ip);
    $storageDir = sys_get_temp_dir() . '/bebidas_ratelimit';
    if (!is_dir($storageDir)) {
        @mkdir($storageDir, 0777, true);
    }
    $file = $storageDir . '/limit_' . $sanitizedIp . '.json';

    $now = time();
    $data = ['attempts' => 0, 'first_attempt' => $now];

    if (file_exists($file)) {
        $content = @file_get_contents($file);
        $decoded = json_decode($content, true);
        if (is_array($decoded)) {
            $data = $decoded;
            if ($now - $data['first_attempt'] > $decaySeconds) {
                $data = ['attempts' => 0, 'first_attempt' => $now];
            }
        }
    }

    $data['attempts']++;
    @file_put_contents($file, json_encode($data));
}

/**
 * Restablece el contador de intentos fallidos al iniciar sesión con éxito.
 */
function recordLoginSuccess() {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $sanitizedIp = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $ip);
    $file = sys_get_temp_dir() . '/bebidas_ratelimit/limit_' . $sanitizedIp . '.json';
    if (file_exists($file)) {
        @unlink($file);
    }
}

/**
 * Helper reutilizable para registrar eventos en la tabla auditoria_logs.
 * Cumple con el estándar inmutable y no-repudio del BMAD.
 */
function logAudit($db, $tablaAfectada, $registroId, $accion, $datosAnteriores = null, $datosNuevos = null, $userId = null, $ip = null) {
    if (!$db) return false;
    $clientIp = $ip ?: ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1');
    $uid = $userId;
    if ($uid === null && class_exists('JWTHelper')) {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $payload = JWTHelper::verify($matches[1]);
            if ($payload && isset($payload['user_id'])) {
                $uid = $payload['user_id'];
            }
        }
    }

    $oldJson = is_string($datosAnteriores) ? $datosAnteriores : ($datosAnteriores !== null ? json_encode($datosAnteriores, JSON_UNESCAPED_UNICODE) : null);
    $newJson = is_string($datosNuevos) ? $datosNuevos : ($datosNuevos !== null ? json_encode($datosNuevos, JSON_UNESCAPED_UNICODE) : null);

    $stmt = $db->prepare("
        INSERT INTO auditoria_logs 
        (tabla_afectada, registro_id, accion, datos_anteriores, datos_nuevos, ip_address, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    return $stmt->execute([
        $tablaAfectada,
        $registroId,
        $accion,
        $oldJson,
        $newJson,
        $clientIp,
        $uid,
        $uid
    ]);
}

/**
 * Helper de autenticación centralizada y reutilizable con JWT Bearer.
 * Rechaza terminantemente tokens pasados por query string o URL (HTTP 401).
 * Verifica la firma y vigencia del JWT (HTTP 401).
 * Si se definen roles permitidos, valida que el rol del usuario esté autorizado (HTTP 403).
 *
 * @param array|string $allowedRoles Roles autorizados (ej: ['rider'], ['admin', 'super_usuario']). Vacío para cualquier rol autenticado.
 * @return array Payload del JWT decodificado
 */
function requireAuth($allowedRoles = []) {
    // 1. Rechazo estricto de tokens por URL o query string
    if (isset($_GET['token']) || isset($_REQUEST['token']) || isset($_POST['token'])) {
        http_response_code(401);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            "status" => "error",
            "data" => null,
            "audit" => [
                "user_id" => "ANONYMOUS",
                "timestamp" => date("c"),
                "action" => "AUTH_STRICT",
                "ip_address" => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
            ],
            "error_details" => "Acceso denegado. El envío de tokens por query string o parámetros de petición (?token=) está estrictamente prohibido por seguridad. Utilice el encabezado 'Authorization: Bearer <token>'."
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    // 2. Extraer token del encabezado Authorization
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? '');

    if (!preg_match('/Bearer\s+(.+)$/i', $authHeader, $matches)) {
        http_response_code(401);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            "status" => "error",
            "data" => null,
            "audit" => [
                "user_id" => "ANONYMOUS",
                "timestamp" => date("c"),
                "action" => "AUTH_REQUIRED",
                "ip_address" => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
            ],
            "error_details" => "Acceso denegado. Se requiere encabezado de autorización 'Authorization: Bearer <token>'."
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    $token = trim($matches[1]);
    $payload = JWTHelper::verify($token);
    if (!$payload || !isset($payload['user_id'])) {
        http_response_code(401);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            "status" => "error",
            "data" => null,
            "audit" => [
                "user_id" => "ANONYMOUS",
                "timestamp" => date("c"),
                "action" => "AUTH_INVALID",
                "ip_address" => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
            ],
            "error_details" => "Acceso denegado. Token JWT inválido, expirado o manipulado."
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    // 3. Verificación de roles si aplica
    if (!empty($allowedRoles)) {
        if (is_string($allowedRoles)) {
            $allowedRoles = [$allowedRoles];
        }
        $userRole = $payload['role'] ?? '';
        if (!in_array($userRole, $allowedRoles, true)) {
            http_response_code(403);
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode([
                "status" => "error",
                "data" => null,
                "audit" => [
                    "user_id" => $payload['user_id'] ?? "ANONYMOUS",
                    "timestamp" => date("c"),
                    "action" => "FORBIDDEN",
                    "ip_address" => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
                ],
                "error_details" => "Permiso denegado. El rol '" . htmlspecialchars($userRole) . "' no cuenta con privilegios suficientes para realizar esta operación."
            ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            exit;
        }
    }

    return $payload;
}

/**
 * Valida que el usuario tenga rol 'rider' y su documentación esté en estado 'aprobado'.
 * Si no está aprobado o no es rider, responde con HTTP 403 Forbidden y termina la ejecución.
 *
 * @param PDO $db Conexión activa a base de datos
 * @param int $riderId ID de usuario del rider
 * @return array Datos del rider y estado de su expediente
 */
function requireApprovedRider($db, $riderId) {
    $stmt = $db->prepare("
        SELECT u.id, u.nombre, u.email, u.role, u.ci_status, d.estado_aprobacion 
        FROM users u 
        LEFT JOIN documentacion_rider d ON d.rider_id = u.id 
        WHERE u.id = ?
    ");
    $stmt->execute([$riderId]);
    $rider = $stmt->fetch();

    if (!$rider || $rider['role'] !== 'rider') {
        http_response_code(403);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            "status" => "error",
            "data" => null,
            "audit" => [
                "user_id" => $riderId,
                "timestamp" => date("c"),
                "action" => "RIDER_ROLE_REQUIRED",
                "ip_address" => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
            ],
            "error_details" => "Permiso denegado. El usuario no cuenta con el rol de rider."
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    if ($rider['estado_aprobacion'] !== 'aprobado') {
        http_response_code(403);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            "status" => "error",
            "data" => null,
            "audit" => [
                "user_id" => $riderId,
                "timestamp" => date("c"),
                "action" => "RIDER_NOT_APPROVED",
                "ip_address" => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
            ],
            "error_details" => "Permiso denegado. La documentación del rider se encuentra en estado '" . ($rider['estado_aprobacion'] ?: 'sin_documentos') . "'. Debe estar aprobada por un administrador para realizar entregas."
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    return $rider;
}


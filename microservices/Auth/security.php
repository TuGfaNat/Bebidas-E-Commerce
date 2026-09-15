<?php
// microservices/Auth/security.php
// Middleware de seguridad: CORS restringido y Rate-Limiting para autenticación

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


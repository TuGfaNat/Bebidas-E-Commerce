<?php
// microservices/Auth/jwt.php
require_once __DIR__ . '/connection.php';

if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

class JWTHelper {
    private static function getSecret() {
        // Ensure DatabaseConnection instance is initialized to load environmental variables
        DatabaseConnection::getInstance();
        return getenv('JWT_SECRET') ?: 'bebidas_247_secure_super_secret_key_123_456_789_xyz';
    }

    private static function base64UrlEncode($data) {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }

    private static function base64UrlDecode($data) {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $padlen = 4 - $remainder;
            $data .= str_repeat('=', $padlen);
        }
        return base64_decode(str_replace(['-', '_'], ['+', '/'], $data));
    }

    public static function generate($payload, $expirySeconds = 86400) {
        $secret = self::getSecret();
        $header = json_encode(['alg' => 'HS256', 'typ' => 'JWT']);
        
        $payload['exp'] = time() + $expirySeconds;
        $payload['iat'] = time();

        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode(json_encode($payload));

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
        $base64UrlSignature = self::base64UrlEncode($signature);

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public static function verify($token) {
        if (empty($token)) {
            return null;
        }

        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $parts;
        $secret = self::getSecret();

        $signature = self::base64UrlDecode($base64UrlSignature);
        $expectedSignature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);

        if (!hash_equals($signature, $expectedSignature)) {
            return null;
        }

        $payload = json_decode(self::base64UrlDecode($base64UrlPayload), true);
        
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return null; // Expired
        }

        return $payload;
    }

    public static function authenticate() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        $token = '';

        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
        } elseif (isset($_REQUEST['token'])) {
            $token = $_REQUEST['token'];
        }

        if (empty($token)) {
            throw new Exception("Acceso denegado. Token no proporcionado.");
        }

        $payload = self::verify($token);
        if (!$payload) {
            throw new Exception("Acceso denegado. Token inválido o expirado.");
        }

        return $payload;
    }
}

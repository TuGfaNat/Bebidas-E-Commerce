<?php
// microservices/Auth/connection.php

class DatabaseConnection {
    private static $instance = null;
    private $connection;

    private function __construct() {
        self::loadEnv();

        $host    = getenv('DB_HOST') ?: ($_ENV['DB_HOST'] ?? '127.0.0.1');
        $port    = getenv('DB_PORT') ?: ($_ENV['DB_PORT'] ?? '3306');
        $db      = getenv('DB_NAME') ?: ($_ENV['DB_NAME'] ?? 'burger_shop');
        $user    = getenv('DB_USER') ?: ($_ENV['DB_USER'] ?? 'root');
        $pass    = getenv('DB_PASS') !== false ? getenv('DB_PASS') : ($_ENV['DB_PASS'] ?? '');
        $charset = getenv('DB_CHARSET') ?: ($_ENV['DB_CHARSET'] ?? 'utf8mb4');

        $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        if (defined('Pdo\\Mysql::ATTR_INIT_COMMAND')) {
            $options[\Pdo\Mysql::ATTR_INIT_COMMAND] = "SET NAMES $charset COLLATE utf8mb4_unicode_ci";
        } elseif (defined('PDO::MYSQL_ATTR_INIT_COMMAND')) {
            @$options[PDO::MYSQL_ATTR_INIT_COMMAND] = "SET NAMES $charset COLLATE utf8mb4_unicode_ci";
        }

        try {
            $this->connection = new PDO($dsn, $user, $pass, $options);
        } catch (\PDOException $e) {
            throw new \PDOException("Error de conexión a la base de datos '$db' en $host:$port: " . $e->getMessage(), (int)$e->getCode());
        }
    }

    public static function loadEnv() {
        $rootPath = dirname(dirname(__DIR__));
        $docRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';

        $possiblePaths = [
            $rootPath . '/.env',
            __DIR__ . '/.env',
            __DIR__ . '/../../.env',
            $docRoot . '/Bebidas-E-Commerce/.env',
            $docRoot . '/Burger-E-Commerce/.env',
            $docRoot . '/.env'
        ];

        $envLoaded = false;
        foreach ($possiblePaths as $envPath) {
            if (!empty($envPath) && file_exists($envPath)) {
                $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                foreach ($lines as $line) {
                    $line = trim($line);
                    if (empty($line) || strpos($line, '#') === 0) continue;
                    if (strpos($line, '=') !== false) {
                        list($name, $value) = explode('=', $line, 2);
                        $name = trim($name);
                        $value = trim($value, "\"' \t\n\r\0\x0B");
                        if (!isset($_ENV[$name])) {
                            $_ENV[$name] = $value;
                        }
                        if (getenv($name) === false) {
                            putenv("$name=$value");
                        }
                    }
                }
                $envLoaded = true;
                break;
            }
        }

        // Si no se encontró ningún archivo .env, intentar auto-crearlo desde .env.example
        if (!$envLoaded) {
            $examplePaths = [
                $rootPath . '/.env.example',
                __DIR__ . '/../../.env.example',
                __DIR__ . '/.env.example',
                $docRoot . '/Bebidas-E-Commerce/.env.example',
                $docRoot . '/Burger-E-Commerce/.env.example'
            ];
            foreach ($examplePaths as $exPath) {
                if (!empty($exPath) && file_exists($exPath)) {
                    $targetEnv = dirname($exPath) . '/.env';
                    @copy($exPath, $targetEnv);
                    $lines = file($exPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
                    foreach ($lines as $line) {
                        $line = trim($line);
                        if (empty($line) || strpos($line, '#') === 0) continue;
                        if (strpos($line, '=') !== false) {
                            list($name, $value) = explode('=', $line, 2);
                            $name = trim($name);
                            $value = trim($value, "\"' \t\n\r\0\x0B");
                            if (!isset($_ENV[$name])) {
                                $_ENV[$name] = $value;
                            }
                            if (getenv($name) === false) {
                                putenv("$name=$value");
                            }
                        }
                    }
                    $envLoaded = true;
                    break;
                }
            }
        }

        // Fallbacks seguros de desarrollo y contingencia para garantizar operatividad continua
        $defaults = [
            'DB_HOST' => '127.0.0.1',
            'DB_PORT' => '3306',
            'DB_NAME' => 'burger_shop',
            'DB_USER' => 'root',
            'DB_PASS' => '',
            'DB_CHARSET' => 'utf8mb4',
            'JWT_SECRET' => '08aef182c3aad21602385a97c86a1cdb11811217df149b666ab353a1e708c2e0',
            'ALLOWED_ORIGINS' => 'http://localhost,http://127.0.0.1,http://localhost:80,http://localhost:8000,http://127.0.0.1:8000,http://localhost:3000'
        ];

        foreach ($defaults as $key => $val) {
            $curVal = getenv($key) ?: ($_ENV[$key] ?? '');
            if (empty($curVal) || $curVal === 'your_jwt_secret_here_change_in_production') {
                $_ENV[$key] = $val;
                putenv("$key=$val");
            }
        }
    }

    public static function getInstance() {
        if (!self::$instance) {
            self::$instance = new DatabaseConnection();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->connection;
    }
}

// Si este script es accedido directamente vía HTTP como endpoint de salud/conexión:
if (isset($_SERVER['SCRIPT_FILENAME']) && realpath(__FILE__) === realpath($_SERVER['SCRIPT_FILENAME'])) {
    require_once __DIR__ . '/security.php';
    applyCorsMiddleware();
    header('Content-Type: application/json; charset=utf-8');

    try {
        $conn = DatabaseConnection::getInstance()->getConnection();
        $dbName = getenv('DB_NAME') ?: ($_ENV['DB_NAME'] ?? 'burger_shop');
        echo json_encode([
            "status" => "success",
            "data" => [
                "database" => $dbName,
                "connected" => true,
                "engine" => "MySQL/MariaDB",
                "message" => "Conexión exitosa a la base de datos de Burger 24/7"
            ],
            "audit" => [
                "user_id" => "ANONYMOUS",
                "timestamp" => date("c"),
                "action" => "CONNECTION_TEST"
            ],
            "error_details" => null
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "data" => [
                "connected" => false
            ],
            "audit" => [
                "user_id" => "ANONYMOUS",
                "timestamp" => date("c"),
                "action" => "CONNECTION_TEST"
            ],
            "error_details" => $e->getMessage()
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }
}

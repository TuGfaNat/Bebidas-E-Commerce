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
        if (defined('PDO::MYSQL_ATTR_INIT_COMMAND')) {
            $options[PDO::MYSQL_ATTR_INIT_COMMAND] = "SET NAMES $charset COLLATE utf8mb4_unicode_ci";
        }

        try {
            $this->connection = new PDO($dsn, $user, $pass, $options);
        } catch (\PDOException $e) {
            throw new \PDOException("Error de conexión a la base de datos '$db' en $host:$port: " . $e->getMessage(), (int)$e->getCode());
        }
    }

    public static function loadEnv() {
        $possiblePaths = [
            __DIR__ . '/.env',
            __DIR__ . '/../../.env',
            dirname(dirname(__DIR__)) . '/.env'
        ];

        foreach ($possiblePaths as $envPath) {
            if (file_exists($envPath)) {
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
                break;
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

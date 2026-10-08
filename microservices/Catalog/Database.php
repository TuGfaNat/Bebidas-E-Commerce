<?php
// microservices/Catalog/Database.php

class Database {
    private static $instance = null;
    private $pdo;

    private function __construct() {
        $this->loadEnv();

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
            $this->pdo = new PDO($dsn, $user, $pass, $options);
        } catch (\PDOException $e) {
            throw new \PDOException("Error de conexión a la base de datos '$db' en $host:$port: " . $e->getMessage(), (int)$e->getCode());
        }
    }

    private function loadEnv() {
        $rootPath = dirname(dirname(__DIR__));
        $docRoot = $_SERVER['DOCUMENT_ROOT'] ?? '';

        $possiblePaths = [
            $rootPath . '/.env',
            __DIR__ . '/.env',
            __DIR__ . '/../Auth/.env',
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

        if (!$envLoaded) {
            $examplePaths = [
                $rootPath . '/.env.example',
                __DIR__ . '/../../.env.example',
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

        $defaults = [
            'DB_HOST' => '127.0.0.1',
            'DB_PORT' => '3306',
            'DB_NAME' => 'burger_shop',
            'DB_USER' => 'root',
            'DB_PASS' => '',
            'DB_CHARSET' => 'utf8mb4'
        ];

        foreach ($defaults as $key => $val) {
            $curVal = getenv($key) ?: ($_ENV[$key] ?? '');
            if (empty($curVal)) {
                $_ENV[$key] = $val;
                putenv("$key=$val");
            }
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->pdo;
    }

    public function prepare($sql) {
        return $this->pdo->prepare($sql);
    }

    public function query($sql, $params = []) {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public function fetch($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }

    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }

    public function execute($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->rowCount();
    }

    public function lastInsertId() {
        return $this->pdo->lastInsertId();
    }

    public function beginTransaction() {
        return $this->pdo->beginTransaction();
    }

    public function commit() {
        return $this->pdo->commit();
    }

    public function rollBack() {
        return $this->pdo->rollBack();
    }

    public function inTransaction() {
        return $this->pdo->inTransaction();
    }

    private function __clone() {}
    public function __wakeup() {
        throw new \Exception("Cannot unserialize singleton");
    }
}

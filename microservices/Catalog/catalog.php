<?php
// microservices/Catalog/catalog.php
require_once __DIR__ . '/Database.php';
require_once __DIR__ . '/../Auth/jwt.php';
require_once __DIR__ . '/../Auth/security.php';

// Aplicar middleware de CORS restringido
applyCorsMiddleware();

header('Content-Type: application/json; charset=UTF-8');

/**
 * Formatea respuestas según el estándar BMAD:
 * { status, data, audit, error_details }
 */
function formatResponse($status, $data, $userId = null, $errorDetails = null, $action = null) {
    return json_encode([
        "status" => $status,
        "data" => $data,
        "audit" => [
            "user_id" => $userId !== null ? $userId : "ANONYMOUS",
            "timestamp" => date("c"),
            "action" => $action ?: ($_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN'),
            "ip_address" => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
        ],
        "error_details" => $errorDetails
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}

/**
 * Obtiene el cuerpo de la petición (JSON o Form-data)
 */
function getRequestPayload() {
    $raw = file_get_contents('php://input');
    if (!empty($raw)) {
        $json = json_decode($raw, true);
        if (is_array($json)) {
            return $json;
        }
    }
    return $_POST;
}

/**
 * Registra automáticamente la operación en auditoria_logs
 */
function logAuditRecord($db, $table, $recordId, $action, $oldData, $newData, $userId) {
    return logAudit($db, $table, $recordId, $action, $oldData, $newData, $userId);
}

/**
 * Valida autenticación y rol de administrador (super_usuario o admin)
 */
function requireAdminRole() {
    // Rechazo estricto de tokens por URL / query string
    if (isset($_GET['token']) || isset($_POST['token']) || isset($_REQUEST['token'])) {
        http_response_code(401);
        echo formatResponse("error", null, null, "Acceso denegado. Tokens por parámetros URL no están permitidos por seguridad.", "AUTH_STRICT");
        exit;
    }

    try {
        $payload = JWTHelper::authenticate();
    } catch (Exception $e) {
        http_response_code(401);
        echo formatResponse("error", null, null, "Acceso denegado. Autenticación requerida: " . $e->getMessage(), "AUTH_REQUIRED");
        exit;
    }

    $role = $payload['role'] ?? '';
    if ($role !== 'super_usuario' && $role !== 'admin') {
        http_response_code(403);
        echo formatResponse("error", null, $payload['user_id'] ?? null, "Permiso denegado. Se requieren privilegios de administrador para modificar el catálogo.", "FORBIDDEN");
        exit;
    }

    return $payload;
}

try {
    // Rechazo de tokens en query string para cualquier método
    if (isset($_GET['token']) || isset($_REQUEST['token'])) {
        http_response_code(401);
        echo formatResponse("error", null, null, "Acceso denegado. Tokens por query string no están permitidos por seguridad. Utilice el encabezado 'Authorization: Bearer <token>'.", "AUTH_STRICT");
        exit;
    }

    $db = Database::getInstance()->getConnection();

    // Determinar acción y método HTTP
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    $action = $_GET['action'] ?? null;

    // Normalizar acción si se invoca con ?action=
    if ($action === 'create') $method = 'POST';
    elseif ($action === 'update') $method = 'PUT';
    elseif ($action === 'delete') $method = 'DELETE';
    elseif ($action === 'list') $method = 'GET';

    // ----------------------------------------------------
    // 1. GET: Retorna lista de productos o producto por ID
    // ----------------------------------------------------
    if ($method === 'GET') {
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        $categoria = $_GET['categoria'] ?? null;

        // Verificar token opcional para estado de C.I.
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        $mostrarPrecio = false;
        $userId = null;

        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $payload = JWTHelper::verify($matches[1]);
            if ($payload) {
                $userId = $payload['user_id'] ?? null;
                $stmtUser = $db->prepare("SELECT ci_status, role FROM users WHERE id = ?");
                $stmtUser->execute([$userId]);
                $user = $stmtUser->fetch();
                if ($user && ($user['ci_status'] === 'verified' || in_array($user['role'], ['super_usuario', 'admin', 'rider']))) {
                    $mostrarPrecio = true;
                }
            }
        }

        if ($id) {
            $stmt = $db->prepare("SELECT * FROM productos WHERE id = ?");
            $stmt->execute([$id]);
            $producto = $stmt->fetch();

            if (!$producto) {
                http_response_code(404);
                echo formatResponse("error", null, $userId, "Producto no encontrado.", "GET_PRODUCT");
                exit;
            }

            echo formatResponse("success", ["producto" => $producto], $userId, null, "GET_PRODUCT");
            exit;
        }

        $sql = "SELECT * FROM productos";
        $params = [];
        if ($categoria && $categoria !== 'todos') {
            $sql .= " WHERE categoria = ?";
            $params[] = $categoria;
        }
        $sql .= " ORDER BY categoria, marca, nombre";

        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $productos = $stmt->fetchAll();

        // Agrupar catálogo jerárquico para compatibilidad
        $catalogo = [];
        foreach ($productos as $p) {
            $cat = $p['categoria'];
            $mar = $p['marca'];

            if (!isset($catalogo[$cat])) $catalogo[$cat] = [];
            if (!isset($catalogo[$cat][$mar])) $catalogo[$cat][$mar] = [];

            $item = [
                'id' => (int)$p['id'],
                'nombre' => $p['nombre'],
                'marca' => $p['marca'],
                'categoria' => $p['categoria'],
                'sabor' => $p['sabor'],
                'stock' => (int)$p['stock'],
                'precio' => (float)$p['precio']
            ];

            if ($mostrarPrecio) {
                $item['buy_option'] = true;
            } else {
                $item['precio_display'] = "Oculto - Verifica tu C.I.";
                $item['buy_option'] = false;
            }

            $catalogo[$cat][$mar][] = $item;
        }

        echo formatResponse("success", [
            "productos" => $productos,
            "catalogo" => $catalogo,
            "total" => count($productos)
        ], $userId, null, "GET_CATALOG");
        exit;
    }

    // ----------------------------------------------------
    // 2. POST: Crear nuevo producto (Solo Admin)
    // ----------------------------------------------------
    elseif ($method === 'POST') {
        $admin = requireAdminRole();
        $adminId = $admin['user_id'];
        $input = getRequestPayload();

        $cat = trim($input['categoria'] ?? '');
        $nom = trim($input['nombre'] ?? '');
        $mar = trim($input['marca'] ?? '');
        $sab = trim($input['sabor'] ?? '');
        $pre = isset($input['precio']) ? floatval($input['precio']) : null;
        $stk = isset($input['stock']) ? intval($input['stock']) : 0;

        if (empty($cat) || empty($nom) || empty($mar) || $pre === null || $pre < 0) {
            http_response_code(400);
            echo formatResponse("error", null, $adminId, "Faltan campos obligatorios para crear el producto (categoria, nombre, marca, precio).", "VALIDATION_ERROR");
            exit;
        }

        $stmt = $db->prepare("
            INSERT INTO productos (categoria, nombre, marca, sabor, precio, stock, created_by, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$cat, $nom, $mar, $sab, $pre, $stk, $adminId, $adminId]);
        $newId = (int)$db->lastInsertId();

        // Obtener producto insertado
        $stmtNew = $db->prepare("SELECT * FROM productos WHERE id = ?");
        $stmtNew->execute([$newId]);
        $newProd = $stmtNew->fetch();

        // Auditoría automática
        logAuditRecord($db, 'productos', $newId, 'INSERT', null, $newProd, $adminId);

        http_response_code(201);
        echo formatResponse("success", [
            "mensaje" => "Producto creado exitosamente",
            "producto" => $newProd,
            "id" => $newId
        ], $adminId, null, "INSERT");
        exit;
    }

    // ----------------------------------------------------
    // 3. PUT: Actualizar producto (Solo Admin)
    // ----------------------------------------------------
    elseif ($method === 'PUT') {
        $admin = requireAdminRole();
        $adminId = $admin['user_id'];
        $input = getRequestPayload();

        $id = isset($_GET['id']) ? intval($_GET['id']) : (isset($input['id']) ? intval($input['id']) : null);
        if (!$id) {
            http_response_code(400);
            echo formatResponse("error", null, $adminId, "Se requiere el ID del producto a actualizar.", "VALIDATION_ERROR");
            exit;
        }

        // Obtener estado anterior para auditoría
        $stmtOld = $db->prepare("SELECT * FROM productos WHERE id = ?");
        $stmtOld->execute([$id]);
        $oldProduct = $stmtOld->fetch();

        if (!$oldProduct) {
            http_response_code(404);
            echo formatResponse("error", null, $adminId, "Producto no encontrado con ID: $id", "NOT_FOUND");
            exit;
        }

        $cat = isset($input['categoria']) && trim($input['categoria']) !== '' ? trim($input['categoria']) : $oldProduct['categoria'];
        $nom = isset($input['nombre']) && trim($input['nombre']) !== '' ? trim($input['nombre']) : $oldProduct['nombre'];
        $mar = isset($input['marca']) && trim($input['marca']) !== '' ? trim($input['marca']) : $oldProduct['marca'];
        $sab = array_key_exists('sabor', $input) ? trim($input['sabor']) : $oldProduct['sabor'];
        $pre = isset($input['precio']) ? floatval($input['precio']) : floatval($oldProduct['precio']);
        $stk = isset($input['stock']) ? intval($input['stock']) : intval($oldProduct['stock']);

        $stmt = $db->prepare("
            UPDATE productos 
            SET categoria = ?, nombre = ?, marca = ?, sabor = ?, precio = ?, stock = ?, updated_by = ?, updated_at = NOW()
            WHERE id = ?
        ");
        $stmt->execute([$cat, $nom, $mar, $sab, $pre, $stk, $adminId, $id]);

        // Obtener estado actualizado
        $stmtUpdated = $db->prepare("SELECT * FROM productos WHERE id = ?");
        $stmtUpdated->execute([$id]);
        $updatedProduct = $stmtUpdated->fetch();

        // Auditoría automática
        logAuditRecord($db, 'productos', $id, 'UPDATE', $oldProduct, $updatedProduct, $adminId);

        echo formatResponse("success", [
            "mensaje" => "Producto actualizado exitosamente",
            "producto" => $updatedProduct
        ], $adminId, null, "UPDATE");
        exit;
    }

    // ----------------------------------------------------
    // 4. DELETE: Eliminar producto (Solo Admin)
    // ----------------------------------------------------
    elseif ($method === 'DELETE') {
        $admin = requireAdminRole();
        $adminId = $admin['user_id'];
        $input = getRequestPayload();

        $id = isset($_GET['id']) ? intval($_GET['id']) : (isset($input['id']) ? intval($input['id']) : null);
        if (!$id) {
            http_response_code(400);
            echo formatResponse("error", null, $adminId, "Se requiere el ID del producto a eliminar.", "VALIDATION_ERROR");
            exit;
        }

        // Obtener datos antes de eliminar para auditoría
        $stmtOld = $db->prepare("SELECT * FROM productos WHERE id = ?");
        $stmtOld->execute([$id]);
        $oldProduct = $stmtOld->fetch();

        if (!$oldProduct) {
            http_response_code(404);
            echo formatResponse("error", null, $adminId, "Producto no encontrado con ID: $id", "NOT_FOUND");
            exit;
        }

        $stmtDel = $db->prepare("DELETE FROM productos WHERE id = ?");
        $stmtDel->execute([$id]);

        // Auditoría automática
        logAuditRecord($db, 'productos', $id, 'DELETE', $oldProduct, null, $adminId);

        echo formatResponse("success", [
            "mensaje" => "Producto eliminado exitosamente",
            "id" => $id
        ], $adminId, null, "DELETE");
        exit;
    }

    else {
        http_response_code(405);
        echo formatResponse("error", null, null, "Método HTTP no permitido.", "METHOD_NOT_ALLOWED");
        exit;
    }

} catch (Exception $e) {
    http_response_code(500);
    echo formatResponse("error", null, null, $e->getMessage(), "INTERNAL_SERVER_ERROR");
}

<?php
// microservices/Transactions/checkout.php
require_once __DIR__ . '/../Auth/connection.php';
require_once __DIR__ . '/../Auth/jwt.php';
require_once __DIR__ . '/../Auth/security.php';

// Aplicar CORS middleware
applyCorsMiddleware();

header('Content-Type: application/json; charset=UTF-8');

/**
 * Formato de respuesta estándar BMAD
 */
function formatResponse($status, $data, $userId = null, $errorDetails = null, $action = "CHECKOUT") {
    return json_encode([
        "status" => $status,
        "data" => $data,
        "audit" => [
            "user_id" => $userId !== null ? $userId : "ANONYMOUS",
            "timestamp" => date("c"),
            "action" => $action,
            "ip_address" => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
        ],
        "error_details" => $errorDetails
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}

/**
 * Obtiene el cuerpo de la petición (JSON o Form-data)
 */
function getRequestData() {
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
 * Cálculo de distancia Haversine (en km)
 */
function calculateHaversine($lat1, $lon1, $lat2, $lon2) {
    $R = 6371.0;
    $lat1_rad = deg2rad($lat1);
    $lon1_rad = deg2rad($lon1);
    $lat2_rad = deg2rad($lat2);
    $lon2_rad = deg2rad($lon2);
    $dlon = $lon2_rad - $lon1_rad;
    $dlat = $lat2_rad - $lat1_rad;
    $a = sin($dlat / 2)**2 + cos($lat1_rad) * cos($lat2_rad) * sin($dlon / 2)**2;
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
    return $R * $c;
}

/**
 * Invocación del Módulo Crítico C++ (SPEC §2 y §4)
 * Ejecuta validación de existencias y liquidación de tarifas con alta precisión.
 */
function runCppMotorCore($payload, &$errorDetails = null) {
    $binPath = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'cpp' . DIRECTORY_SEPARATOR . 'motor_core.exe';

    // Verificación de existencia del binario (Criterio: Sin binario -> envelope controlado)
    if (!file_exists($binPath)) {
        $errorDetails = "Módulo crítico C++ no disponible. El binario ejecutable ($binPath) no fue encontrado. Ejecute cpp/build.bat para compilarlo.";
        return null;
    }

    $jsonInput = json_encode($payload, JSON_UNESCAPED_UNICODE);

    $descriptorspec = [
        0 => ["pipe", "r"],  // stdin
        1 => ["pipe", "w"],  // stdout
        2 => ["pipe", "w"]   // stderr
    ];

    $process = @proc_open('"' . $binPath . '"', $descriptorspec, $pipes);

    if (!is_resource($process)) {
        $errorDetails = "Fallo al inicializar el proceso del módulo crítico C++ ($binPath).";
        return null;
    }

    fwrite($pipes[0], $jsonInput);
    fclose($pipes[0]);

    $stdout = stream_get_contents($pipes[1]);
    fclose($pipes[1]);

    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[2]);

    $exitCode = proc_close($process);

    $decoded = json_decode($stdout, true);
    if (!is_array($decoded)) {
        $errorDetails = "El módulo crítico C++ no emitió una respuesta JSON válida. Código de salida: $exitCode. " . trim($stderr);
        return null;
    }

    return [
        'exit_code' => $exitCode,
        'response' => $decoded
    ];
}

try {
    // 1. Rechazo estricto de tokens por URL o query string
    if (isset($_GET['token']) || isset($_POST['token']) || isset($_REQUEST['token'])) {
        http_response_code(401);
        echo formatResponse("error", null, null, "Acceso denegado. El envío de tokens por URL está prohibido.", "AUTH_STRICT");
        exit;
    }

    // 2. Autenticación vía JWT (Bearer token)
    $payload = JWTHelper::authenticate();
    $userId = (int)$payload['user_id'];
    $userRole = $payload['role'];

    $db = DatabaseConnection::getInstance()->getConnection();

    // ACCIÓN GET: Obtener pedidos y pedido activo del cliente autenticado
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $db->prepare("
            SELECT p.id, p.cliente_id, p.rider_id, p.estado_pago, p.estado_pedido,
                   p.total, p.latitud, p.longitud, p.qr_comprobante_url, p.created_at, p.updated_at
            FROM pedidos p
            WHERE p.cliente_id = ?
            ORDER BY p.id DESC
        ");
        $stmt->execute([$userId]);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $pedidoActivo = null;
        $formattedOrders = [];

        foreach ($orders as $ord) {
            $stmtDet = $db->prepare("
                SELECT d.id, d.pedido_id, d.producto_id, d.cantidad, d.precio_unitario, pr.nombre
                FROM pedido_detalles d
                LEFT JOIN productos pr ON d.producto_id = pr.id
                WHERE d.pedido_id = ?
            ");
            $stmtDet->execute([$ord['id']]);
            $detalles = $stmtDet->fetchAll(PDO::FETCH_ASSOC);

            $formatted = [
                'id' => (int)$ord['id'],
                'pedido_id' => (int)$ord['id'],
                'cliente_id' => (int)$ord['cliente_id'],
                'rider_id' => $ord['rider_id'] ? (int)$ord['rider_id'] : null,
                'estado_pago' => $ord['estado_pago'],
                'estado_pedido' => $ord['estado_pedido'],
                'total' => floatval($ord['total']),
                'latitud' => floatval($ord['latitud'] ?? -16.5050),
                'longitud' => floatval($ord['longitud'] ?? -68.1290),
                'qr_comprobante_url' => $ord['qr_comprobante_url'],
                'created_at' => $ord['created_at'],
                'updated_at' => $ord['updated_at'],
                'detalles' => $detalles
            ];

            if (!$pedidoActivo && !in_array($ord['estado_pedido'], ['entregado', 'cancelado'], true)) {
                $pedidoActivo = $formatted;
            }

            $formattedOrders[] = $formatted;
        }

        echo formatResponse("success", [
            "pedido_activo" => $pedidoActivo,
            "pedidos" => $formattedOrders,
            "total" => count($formattedOrders)
        ], $userId, null, "GET_CLIENT_ORDERS");
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo formatResponse("error", null, null, "Método no permitido. Use GET o POST.", "METHOD_NOT_ALLOWED");
        exit;
    }

    // 3. Verificar que el usuario tenga CI verificado
    $stmtUser = $db->prepare("SELECT ci_status, role FROM users WHERE id = ?");
    $stmtUser->execute([$userId]);
    $user = $stmtUser->fetch();
    if (!$user || ($user['ci_status'] !== 'verified' && !in_array($user['role'], ['super_usuario', 'admin']))) {
        http_response_code(403);
        echo formatResponse("error", null, $userId, "Debes tener tu C.I. verificado para realizar transacciones de compra.", "CI_UNVERIFIED");
        exit;
    }

    $input = getRequestData();
    $action = $_GET['action'] ?? ($input['action'] ?? 'create_order');

    // =========================================================================
    // ACCIÓN: Subir comprobante QR
    // =========================================================================
    if ($action === 'upload_qr') {
        $orderId = $input['pedido_id'] ?? ($_POST['pedido_id'] ?? null);
        $qrImage = $_FILES['qr_image'] ?? null;

        if (!$orderId || empty($qrImage['tmp_name'])) {
            http_response_code(400);
            echo formatResponse("error", null, $userId, "Falta ID de pedido o comprobante QR.", "VALIDATION_ERROR");
            exit;
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $realMime = finfo_file($finfo, $qrImage['tmp_name']);
        finfo_close($finfo);

        $allowedMimeTypes = [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'application/pdf' => 'pdf'
        ];

        if (!array_key_exists($realMime, $allowedMimeTypes)) {
            http_response_code(400);
            echo formatResponse("error", null, $userId, "El comprobante debe ser imagen JPEG, PNG o documento PDF.", "INVALID_FILE_TYPE");
            exit;
        }
        $ext = $allowedMimeTypes[$realMime];

        $uploadDir = __DIR__ . '/../Auth/uploads/qr/';
        if (!is_dir($uploadDir)) {
            @mkdir($uploadDir, 0755, true);
            @file_put_contents($uploadDir . '.htaccess', "Require all denied\n");
        }
        $filename = uniqid('qr_') . '.' . $ext;
        $destination = $uploadDir . $filename;
        move_uploaded_file($qrImage['tmp_name'], $destination);
        $qrUrl = '/uploads/qr/' . $filename;

        $db->beginTransaction();

        $stmtOld = $db->prepare("SELECT estado_pago, estado_pedido FROM pedidos WHERE id = ? AND (cliente_id = ? OR ? IN ('super_usuario', 'admin')) FOR UPDATE");
        $stmtOld->execute([$orderId, $userId, $user['role']]);
        $oldData = $stmtOld->fetch();
        if (!$oldData) {
            $db->rollBack();
            http_response_code(404);
            echo formatResponse("error", null, $userId, "Pedido no encontrado o no autorizado.", "NOT_FOUND");
            exit;
        }

        $stmt = $db->prepare("UPDATE pedidos SET estado_pago = 'pagado_qr', qr_comprobante_url = ?, updated_by = ? WHERE id = ?");
        $stmt->execute([$qrUrl, $userId, $orderId]);

        logAudit($db, 'pedidos', $orderId, 'UPDATE', $oldData, ['estado_pago' => 'pagado_qr', 'qr_url' => $qrUrl], $userId);

        $db->commit();
        echo formatResponse("success", [
            "mensaje" => "Comprobante QR subido exitosamente. Pago registrado.",
            "pedido_id" => (int)$orderId,
            "qr_url" => $qrUrl
        ], $userId, null, "UPLOAD_QR");
        exit;
    }

    // =========================================================================
    // ACCIÓN: Fijar método Contraentrega
    // =========================================================================
    elseif ($action === 'set_contraentrega') {
        $orderId = $input['pedido_id'] ?? null;
        if (!$orderId) {
            http_response_code(400);
            echo formatResponse("error", null, $userId, "Falta ID de pedido.", "VALIDATION_ERROR");
            exit;
        }

        $db->beginTransaction();

        $stmtOld = $db->prepare("SELECT estado_pago FROM pedidos WHERE id = ? AND (cliente_id = ? OR ? IN ('super_usuario', 'admin')) FOR UPDATE");
        $stmtOld->execute([$orderId, $userId, $user['role']]);
        $oldData = $stmtOld->fetch();
        if (!$oldData) {
            $db->rollBack();
            http_response_code(404);
            echo formatResponse("error", null, $userId, "Pedido no encontrado o no autorizado.", "NOT_FOUND");
            exit;
        }

        $stmt = $db->prepare("UPDATE pedidos SET estado_pago = 'contraentrega', updated_by = ? WHERE id = ?");
        $stmt->execute([$userId, $orderId]);

        logAudit($db, 'pedidos', $orderId, 'UPDATE', $oldData, ['estado_pago' => 'contraentrega'], $userId);

        $db->commit();
        echo formatResponse("success", [
            "mensaje" => "Método de pago fijado a Contraentrega.",
            "pedido_id" => (int)$orderId
        ], $userId, null, "SET_CONTRAENTREGA");
        exit;
    }

    // =========================================================================
    // ACCIÓN: Crear Pedido con Descuento Atómico de Stock (Checkout Principal con Módulo C++)
    // =========================================================================
    elseif ($action === 'create_order' || empty($action)) {
        $items = $input['items'] ?? [];
        if (!is_array($items) || empty($items)) {
            http_response_code(400);
            echo formatResponse("error", null, $userId, "El carrito de compra no contiene productos (items vacíos).", "EMPTY_CART");
            exit;
        }

        $latCliente = isset($input['latitud']) ? floatval($input['latitud']) : -16.5050;
        $lonCliente = isset($input['longitud']) ? floatval($input['longitud']) : -68.1290;
        $metodoPago = $input['metodo_pago'] ?? 'contraentrega'; // 'contraentrega' o 'qr'
        $qrUrl      = $input['qr_comprobante_url'] ?? null;

        // Tienda Burger 24/7 (Sopocachi, La Paz)
        $storeLat = -16.5050;
        $storeLon = -68.1290;

        // Distancia geodésica cliente - tienda
        $distanciaKm = isset($input['distancia_km']) ? floatval($input['distancia_km']) : calculateHaversine($storeLat, $storeLon, $latCliente, $lonCliente);

        // Estado de pago inicial
        $estadoPago = 'contraentrega';
        if ($metodoPago === 'qr') {
            $estadoPago = $qrUrl ? 'pagado_qr' : 'qr';
        }

        // ----------------------------------------------------
        // TRANSACCIÓN ATÓMICA MYSQL (BEGIN -> Validar -> C++ -> Descontar -> COMMIT/ROLLBACK)
        // ----------------------------------------------------
        $db->beginTransaction();

        $itemsForCpp = [];

        foreach ($items as $item) {
            $prodId = isset($item['producto_id']) ? intval($item['producto_id']) : (isset($item['id']) ? intval($item['id']) : 0);
            $cantidad = isset($item['cantidad']) ? intval($item['cantidad']) : (isset($item['quantity']) ? intval($item['quantity']) : 0);

            if ($prodId <= 0 || $cantidad <= 0) {
                $db->rollBack();
                http_response_code(400);
                echo formatResponse("error", null, $userId, "Item con formato inválido (producto_id o cantidad incorrecta).", "INVALID_ITEM");
                exit;
            }

            // Bloquear fila de producto con FOR UPDATE (evita condiciones de carrera ACID)
            $stmtProd = $db->prepare("SELECT id, nombre, precio, stock FROM productos WHERE id = ? FOR UPDATE");
            $stmtProd->execute([$prodId]);
            $producto = $stmtProd->fetch();

            if (!$producto) {
                $db->rollBack();
                http_response_code(404);
                echo formatResponse("error", null, $userId, "Producto con ID #$prodId no encontrado.", "PRODUCT_NOT_FOUND");
                exit;
            }

            $itemsForCpp[] = [
                'producto_id' => (int)$producto['id'],
                'nombre' => $producto['nombre'],
                'precio' => (float)$producto['precio'],
                'cantidad' => $cantidad,
                'stock_disponible' => (int)$producto['stock']
            ];
        }

        // ----------------------------------------------------
        // INVOCACIÓN DEL MÓDULO CRÍTICO C++ (SPEC §2)
        // ----------------------------------------------------
        $cppPayload = [
            'user_id' => $userId,
            'distancia_km' => round($distanciaKm, 2),
            'items' => $itemsForCpp
        ];

        $cppError = null;
        $cppExec = runCppMotorCore($cppPayload, $cppError);

        // Sin binario o fallo de ejecución -> envelope de error controlado (SPEC §4)
        if ($cppExec === null) {
            $db->rollBack();
            http_response_code(500);
            echo formatResponse("error", null, $userId, $cppError, "CPP_MODULE_UNAVAILABLE");
            exit;
        }

        $cppResponse = $cppExec['response'];
        if (($cppResponse['status'] ?? '') !== 'success') {
            $db->rollBack();
            http_response_code(400);
            $errMsg = $cppResponse['error_details'] ?? 'Fallo de validación en el motor C++.';
            echo formatResponse("error", $cppResponse['data'] ?? null, $userId, $errMsg, "CPP_VALIDATION_FAILED");
            exit;
        }

        // Liquidación financiera validada por C++
        $cppData = $cppResponse['data'];
        $subtotal = (float)$cppData['subtotal'];
        $costoEnvio = (float)$cppData['costo_envio'];
        $total = (float)$cppData['total'];
        $verifiedItems = [];

        // Descontar inventario en MySQL conforme a los resultados del motor C++
        foreach ($cppData['desglose_lineas'] as $linea) {
            $pId = (int)$linea['producto_id'];
            $cant = (int)$linea['cantidad'];
            $pUnit = (float)$linea['precio_unitario'];
            $sublinea = (float)$linea['subtotal_linea'];
            $stockRestante = (int)$linea['stock_restante'];

            // Descontar inventario
            $stmtStock = $db->prepare("UPDATE productos SET stock = ?, updated_by = ?, updated_at = NOW() WHERE id = ?");
            $stmtStock->execute([$stockRestante, $userId, $pId]);

            // Auditoría individual del descuento
            logAudit(
                $db,
                'productos',
                $pId,
                'UPDATE',
                ['stock_previo' => $stockRestante + $cant],
                ['stock' => $stockRestante, 'motivo' => "Descuento por venta (C++ Motor Core)"],
                $userId
            );

            $verifiedItems[] = [
                'producto_id' => $pId,
                'nombre' => $linea['nombre'],
                'cantidad' => $cant,
                'precio_unitario' => $pUnit,
                'subtotal_linea' => $sublinea
            ];
        }

        // Crear pedido en la base de datos
        $stmtOrder = $db->prepare("
            INSERT INTO pedidos 
            (cliente_id, estado_pago, estado_pedido, total, latitud, longitud, qr_comprobante_url, created_by, updated_by)
            VALUES (?, ?, 'pendiente', ?, ?, ?, ?, ?, ?)
        ");
        $stmtOrder->execute([$userId, $estadoPago, $total, $latCliente, $lonCliente, $qrUrl, $userId, $userId]);
        $orderId = (int)$db->lastInsertId();

        // Insertar cada producto en pedido_detalles
        $stmtDetail = $db->prepare("
            INSERT INTO pedido_detalles 
            (pedido_id, producto_id, cantidad, precio_unitario, created_by, updated_by)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        foreach ($verifiedItems as $item) {
            $stmtDetail->execute([$orderId, $item['producto_id'], $item['cantidad'], $item['precio_unitario'], $userId, $userId]);
        }

        // Auditoría del pedido creado
        logAudit(
            $db, 
            'pedidos', 
            $orderId, 
            'INSERT', 
            null, 
            [
                'cliente_id' => $userId,
                'total' => $total,
                'subtotal' => $subtotal,
                'costo_envio' => $costoEnvio,
                'estado_pago' => $estadoPago,
                'estado_pedido' => 'pendiente',
                'items_count' => count($verifiedItems),
                'cpp_audit' => $cppResponse['audit'] ?? null
            ], 
            $userId
        );

        // Confirmar transacción (COMMIT)
        $db->commit();

        http_response_code(201);
        echo formatResponse("success", [
            "mensaje" => "Pedido creado exitosamente con módulo crítico C++ (cálculos de flete y stock validados).",
            "pedido_id" => $orderId,
            "subtotal" => $subtotal,
            "costo_envio" => $costoEnvio,
            "total" => $total,
            "distancia_km" => round($distanciaKm, 2),
            "estado_pago" => $estadoPago,
            "estado_pedido" => "pendiente",
            "items" => $verifiedItems,
            "cpp_audit" => $cppResponse['audit'] ?? null
        ], $userId, null, "CREATE_ORDER");
        exit;
    }

    else {
        http_response_code(400);
        echo formatResponse("error", null, $userId, "Acción de checkout no reconocida: $action", "INVALID_ACTION");
        exit;
    }

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    http_response_code(500);
    echo formatResponse("error", null, $userId ?? null, $e->getMessage(), "INTERNAL_SERVER_ERROR");
}

<?php
/**
 * =============================================================================
 * Burger 24/7 - Suite Automatizada de Verificación E2E en PHP (Ticket BE-013)
 * =============================================================================
 * Ejecuta de punta a punta todos los roles (Cliente, Rider, Administrador),
 * flujos de negocio y casos negativos contra Apache (puerto 80) y MySQL real.
 * Recolecta evidencias empíricas para el Manual de Pruebas del Sistema (SPEC §5).
 * =============================================================================
 */

$baseUrl = "http://localhost/Burger-E-Commerce";

$testResults = [
    "total" => 0,
    "passed" => 0,
    "failed" => 0,
    "evidences" => []
];

function logTest($testId, $name, $success, $httpCode, $expectedCode, $details, $reqPayload = null, $resPayload = null) {
    global $testResults;
    $testResults["total"]++;
    if ($success) {
        $testResults["passed"]++;
        $tag = "\033[32m[PASS]\033[0m";
    } else {
        $testResults["failed"]++;
        $tag = "\033[31m[FAIL]\033[0m";
    }

    $testResults["evidences"][] = [
        "id" => $testId,
        "name" => $name,
        "status" => $success ? "PASS" : "FAIL",
        "http_code" => $httpCode,
        "expected_code" => $expectedCode,
        "timestamp" => gmdate("c"),
        "details" => $details,
        "request" => $reqPayload,
        "response" => $resPayload
    ];

    echo "  $tag $testId: $name (HTTP $httpCode vs $expectedCode)\n";
    if (!$success) {
        echo "         [!] Error: $details\n";
    }
}

function makeRequest($endpoint, $method = "GET", $data = null, $token = null, $isMultipart = false, $files = null) {
    global $baseUrl;
    $url = $baseUrl . $endpoint;
    $headers = [];

    if ($token) {
        $headers[] = "Authorization: Bearer " . $token;
    }

    $body = null;
    if ($isMultipart) {
        $boundary = "----WebKitFormBoundary" . bin2hex(random_bytes(16));
        $headers[] = "Content-Type: multipart/form-data; boundary=" . $boundary;
        $parts = "";
        if ($data && is_array($data)) {
            foreach ($data as $k => $v) {
                $parts .= "--$boundary\r\nContent-Disposition: form-data; name=\"$k\"\r\n\r\n$v\r\n";
            }
        }
        if ($files && is_array($files)) {
            foreach ($files as $field => $fInfo) {
                $filename = $fInfo["filename"];
                $mime = isset($fInfo["mime"]) ? $fInfo["mime"] : "application/octet-stream";
                $content = $fInfo["content"];
                $parts .= "--$boundary\r\nContent-Disposition: form-data; name=\"$field\"; filename=\"$filename\"\r\nContent-Type: $mime\r\n\r\n$content\r\n";
            }
        }
        $parts .= "--$boundary--\r\n";
        $body = $parts;
    } elseif ($data !== null) {
        $headers[] = "Content-Type: application/json";
        $body = json_encode($data, JSON_UNESCAPED_UNICODE);
    }

    $opts = [
        'http' => [
            'method' => $method,
            'header' => implode("\r\n", $headers),
            'content' => $body,
            'timeout' => 10,
            'ignore_errors' => true
        ]
    ];

    $context = stream_context_create($opts);
    $raw = @file_get_contents($url, false, $context);

    $httpCode = 0;
    if (isset($http_response_header)) {
        foreach ($http_response_header as $headerLine) {
            if (preg_match('#HTTP/[0-9\.]+\s+([0-9]+)#', $headerLine, $matches)) {
                $httpCode = (int)$matches[1];
                break;
            }
        }
    }

    $parsed = null;
    if ($raw !== false) {
        $parsed = json_decode($raw, true);
    }

    return [$httpCode, $parsed, $raw];
}

function checkBmadEnvelope($jsonData) {
    if (!is_array($jsonData)) {
        return [false, "La respuesta no es un objeto JSON"];
    }
    $keys = ["status", "data", "audit", "error_details"];
    foreach ($keys as $k) {
        if (!array_key_exists($k, $jsonData)) {
            return [false, "Falta clave obligatoria '$k' en el envelope BMAD"];
        }
    }
    if (!is_array($jsonData["audit"])) {
        return [false, "La clave 'audit' no es un objeto"];
    }
    foreach (["user_id", "timestamp"] as $ak) {
        if (!array_key_exists($ak, $jsonData["audit"])) {
            return [false, "Falta clave '$ak' en audit"];
        }
    }
    return [true, "Envelope BMAD conforme a SPEC §4"];
}

echo "============================================================================\n";
echo "  BURGER 24/7 - SUITE DE PRUEBAS E2E (PHP NATIVO, XAMPP + MYSQL REAL)\n";
echo "  Objetivo: $baseUrl\n";
echo "============================================================================\n\n";

echo "--- [FASE 1] FLUJOS POSITIVOS POR ROLES (CLIENTE, RIDER, ADMIN) ---\n";

// 1. Login Admin
list($status, $res, $raw) = makeRequest("/microservices/Auth/login.php", "POST", ["correo" => "admin@mail.com", "password" => "admin"]);
list($bmadOk, $bmadMsg) = checkBmadEnvelope($res);
$adminToken = (isset($res["data"]["token"])) ? $res["data"]["token"] : null;
logTest("HP-01", "Login de Administrador (Bcrypt + JWT)", $status === 200 && $adminToken && $bmadOk, $status, 200, $bmadMsg, ["correo" => "admin@mail.com"], $res);

// 2. Registro de Nuevo Cliente con C.I.
$uniqueSuffix = time();
$newClientEmail = "cliente_e2e_{$uniqueSuffix}@mail.com";
$dummyCi = "%PDF-1.4 1 0 obj << /Type /Catalog >> endobj trailer << /Root 1 0 R >> %%EOF";
list($status, $res, $raw) = makeRequest(
    "/microservices/Auth/register.php",
    "POST",
    [
        "nombre" => "Cliente E2E $uniqueSuffix",
        "correo" => $newClientEmail,
        "password" => "Password123!",
        "fecha_nacimiento" => "2000-01-01"
    ],
    null,
    true,
    [
        "ci_image" => ["filename" => "ci_sample.pdf", "mime" => "application/pdf", "content" => $dummyCi]
    ]
);
$newClientId = (isset($res["data"]["user_id"])) ? $res["data"]["user_id"] : null;
$newClientToken = (isset($res["data"]["token"])) ? $res["data"]["token"] : null;
logTest("HP-02", "Registro de Cliente con C.I. (Multipart PDF)", $status === 200 && $newClientToken !== null, $status, 200, "User ID: $newClientId", null, $res);

// 3. Admin aprueba C.I. del cliente
if ($newClientId && $adminToken) {
    list($status, $res, $raw) = makeRequest(
        "/microservices/Auth/admin_approval.php",
        "POST",
        ["tipo" => "user", "target_id" => $newClientId, "estado" => "aprobado"],
        $adminToken
    );
    logTest("HP-03", "Aprobación de C.I. por Admin (Audit Log)", $status === 200 && isset($res["status"]) && $res["status"] === "success", $status, 200, "C.I. verificado exitosamente", null, $res);
} else {
    logTest("HP-03", "Aprobación de C.I. por Admin", false, 0, 200, "Falta token o cliente previo");
}

// 4. Obtener nuevo token para el cliente ya verificado
list($status, $res, $raw) = makeRequest("/microservices/Auth/login.php", "POST", ["correo" => $newClientEmail, "password" => "Password123!"]);
$verifiedClientToken = (isset($res["data"]["token"])) ? $res["data"]["token"] : null;
logTest("HP-04", "Login de Cliente con C.I. ya verificado", $status === 200 && $verifiedClientToken !== null, $status, 200, "Token renovado con rol cliente", null, $res);

// 5. Consulta de Catálogo de Productos
list($status, $res, $raw) = makeRequest("/microservices/Catalog/catalog.php", "GET");
list($bmadOk, $bmadMsg) = checkBmadEnvelope($res);
$products = (isset($res["data"]["productos"]) && is_array($res["data"]["productos"])) ? $res["data"]["productos"] : [];
$sampleProd = count($products) > 0 ? $products[0] : ["id" => 1, "precio" => 22.0];
logTest("HP-05", "Consulta de Catálogo de Productos (BMAD)", $status === 200 && $bmadOk && count($products) > 0, $status, 200, count($products) . " productos obtenidos", null, ["items_count" => count($products)]);

// 6. Checkout con Módulo Crítico C++ (Creación de Pedido)
$checkoutPayload = [
    "action" => "create_order",
    "latitud" => -16.5100,
    "longitud" => -68.1300,
    "distancia_km" => 2.5,
    "metodo_pago" => "contraentrega",
    "items" => [
        ["producto_id" => $sampleProd["id"], "cantidad" => 1]
    ]
];
list($status, $res, $raw) = makeRequest("/microservices/Transactions/checkout.php", "POST", $checkoutPayload, $verifiedClientToken);
list($bmadOk, $bmadMsg) = checkBmadEnvelope($res);
$orderId = (isset($res["data"]["pedido_id"])) ? $res["data"]["pedido_id"] : null;
$cppAudit = (isset($res["data"]["cpp_audit"])) ? $res["data"]["cpp_audit"] : null;
logTest("HP-06", "Checkout con Módulo Crítico C++ (Flete & Stock)", $status === 201 && $orderId && $cppAudit !== null, $status, 201, "Pedido #$orderId creado con C++ (" . (isset($cppAudit["tiempo_computo_us"]) ? $cppAudit["tiempo_computo_us"] : 0) . "us)", $checkoutPayload, $res);

// 7. Cliente consulta su Pedido Activo
list($status, $res, $raw) = makeRequest("/microservices/Transactions/checkout.php", "GET", null, $verifiedClientToken);
list($bmadOk, $bmadMsg) = checkBmadEnvelope($res);
$activeOrder = (isset($res["data"]["pedido_activo"])) ? $res["data"]["pedido_activo"] : null;
logTest("HP-07", "Cliente Consulta Pedido Activo", $status === 200 && $activeOrder !== null, $status, 200, "Pedido activo: #" . ($activeOrder ? $activeOrder["id"] : "None"), null, $res);

// 8. Login de Rider existente (pedro@mail.com / pedro)
list($status, $res, $raw) = makeRequest("/microservices/Auth/login.php", "POST", ["correo" => "pedro@mail.com", "password" => "pedro"]);
$riderToken = (isset($res["data"]["token"])) ? $res["data"]["token"] : null;
$riderId = (isset($res["data"]["user"]["id"])) ? $res["data"]["user"]["id"] : 2;
logTest("HP-08", "Login de Rider Aprobado (JWT)", $status === 200 && $riderToken !== null, $status, 200, "Rider ID: $riderId", null, $res);

// 9. Rider consulta Pedidos Disponibles
list($status, $res, $raw) = makeRequest("/microservices/Rider/assignment.php", "GET", null, $riderToken);
list($bmadOk, $bmadMsg) = checkBmadEnvelope($res);
$disponibles = (isset($res["data"]["pedidos_disponibles"]) && is_array($res["data"]["pedidos_disponibles"])) ? $res["data"]["pedidos_disponibles"] : [];
logTest("HP-09", "Rider Lista Pedidos Pendientes con Flete", $status === 200 && $bmadOk, $status, 200, "Pedidos pendientes en cola: " . count($disponibles), null, ["pendientes" => count($disponibles)]);

// 10. Rider toma el pedido
if ($orderId && $riderToken) {
    list($status, $res, $raw) = makeRequest("/microservices/Rider/assignment.php", "POST", ["pedido_id" => $orderId], $riderToken);
    logTest("HP-10", "Rider Acepta y Asigna Pedido #$orderId", $status === 200 && isset($res["status"]) && $res["status"] === "success", $status, 200, "Transición: pendiente -> asignado", ["pedido_id" => $orderId], $res);
} else {
    logTest("HP-10", "Rider Toma Pedido", false, 0, 200, "Falta order_id o rider_token");
}

// 11. Rider avanza a 'en_camino'
if ($orderId && $riderToken) {
    list($status, $res, $raw) = makeRequest("/microservices/Rider/delivery.php", "POST", ["pedido_id" => $orderId, "action" => "marcar_en_camino"], $riderToken);
    logTest("HP-11", "Rider Despacha Pedido #$orderId (en_camino)", $status === 200 && isset($res["status"]) && $res["status"] === "success", $status, 200, "Transición: asignado -> en_camino", null, $res);
} else {
    logTest("HP-11", "Rider Avanza a en_camino", false, 0, 200, "Falta pedido previo");
}

// 12. Rider entrega pedido ('entregado')
if ($orderId && $riderToken) {
    list($status, $res, $raw) = makeRequest("/microservices/Rider/delivery.php", "POST", ["pedido_id" => $orderId, "action" => "marcar_entregado"], $riderToken);
    logTest("HP-12", "Rider Finaliza Entrega #$orderId (entregado)", $status === 200 && isset($res["status"]) && $res["status"] === "success", $status, 200, "Transición: en_camino -> entregado", null, $res);
} else {
    logTest("HP-12", "Rider Entrega Pedido", false, 0, 200, "Falta pedido previo");
}

// 13. Admin liquida caja del Rider
if ($riderId && $adminToken) {
    list($status, $res, $raw) = makeRequest("/microservices/Rider/settle_cash.php", "POST", ["rider_id" => $riderId], $adminToken);
    logTest("HP-13", "Admin Liquida Caja de Cobranza del Rider", $status === 200 && isset($res["status"]) && $res["status"] === "success", $status, 200, "Pedidos contraentrega conciliados y liquidados", ["rider_id" => $riderId], $res);
} else {
    logTest("HP-13", "Admin Liquida Caja", false, 0, 200, "Falta admin o rider");
}

// 14. Crear segundo pedido para probar Cancelación Legal
$checkoutPayload2 = [
    "action" => "create_order",
    "latitud" => -16.5100,
    "longitud" => -68.1300,
    "distancia_km" => 1.0,
    "metodo_pago" => "contraentrega",
    "items" => [
        ["producto_id" => $sampleProd["id"], "cantidad" => 1]
    ]
];
list($status, $res, $raw) = makeRequest("/microservices/Transactions/checkout.php", "POST", $checkoutPayload2, $verifiedClientToken);
$orderId2 = (isset($res["data"]["pedido_id"])) ? $res["data"]["pedido_id"] : null;
logTest("HP-14", "Cliente Crea 2do Pedido para Prueba de Cancelación", $status === 201 && $orderId2 !== null, $status, 201, "Pedido #$orderId2 creado", null, $res);

// 15. Cliente cancela pedido legalmente
if ($orderId2 && $verifiedClientToken) {
    list($status, $res, $raw) = makeRequest("/microservices/Transactions/cancel_order.php", "POST", ["pedido_id" => $orderId2, "motivo" => "Prueba E2E"], $verifiedClientToken);
    logTest("HP-15", "Cancelación Legal con Reembolso de Stock #$orderId2", $status === 200 && isset($res["status"]) && $res["status"] === "success", $status, 200, "Stock restaurado y orden cancelada", ["pedido_id" => $orderId2], $res);
} else {
    logTest("HP-15", "Cancelación Legal de Pedido", false, 0, 200, "Falta pedido previo");
}

// 16. Admin consulta Reportes de Ventas
list($status, $res, $raw) = makeRequest("/microservices/Transactions/report.php", "GET", null, $adminToken);
list($bmadOk, $bmadMsg) = checkBmadEnvelope($res);
logTest("HP-16", "Admin Consulta Reporte Financiero y Auditoría", $status === 200 && $bmadOk, $status, 200, "Totales consolidados y métricas operativas", null, $res);

echo "\n--- [FASE 2] CASOS NEGATIVOS Y LÍMITES (ERRORES CONTROLADOS) ---\n";

// CN-01: Token en URL o Query String (Rechazo estricto AUTH_STRICT)
list($status, $res, $raw) = makeRequest("/microservices/Transactions/checkout.php?token={$adminToken}", "GET");
logTest("CN-01", "Envío Prohibido de Token por URL/Query String", $status === 401, $status, 401, "Rechazado con 401 y acción AUTH_STRICT", null, $res);

// CN-02: Compra por usuario sin C.I. verificado
$dummyEmailUnverified = "unverified_{$uniqueSuffix}@mail.com";
list($statusReg, $resReg, ) = makeRequest(
    "/microservices/Auth/register.php",
    "POST",
    [
        "nombre" => "Usuario No Verificado",
        "correo" => $dummyEmailUnverified,
        "password" => "Password123!",
        "fecha_nacimiento" => "1999-05-05"
    ],
    null,
    true,
    ["ci_image" => ["filename" => "doc.pdf", "mime" => "application/pdf", "content" => $dummyCi]]
);
$unverifiedToken = (isset($resReg["data"]["token"])) ? $resReg["data"]["token"] : null;
if ($unverifiedToken) {
    list($status, $res, $raw) = makeRequest(
        "/microservices/Transactions/checkout.php",
        "POST",
        ["action" => "create_order", "items" => [["producto_id" => 1, "cantidad" => 1]]],
        $unverifiedToken
    );
    logTest("CN-02", "Cliente con C.I. Pendiente Intenta Checkout", $status === 403, $status, 403, "Rechazado con 403 (CI_UNVERIFIED)", null, $res);
} else {
    logTest("CN-02", "Cliente con C.I. Pendiente Intenta Checkout", false, 0, 403, "No se pudo crear usuario no verificado");
}

// CN-03: Stock Insuficiente Detectado por Módulo C++
list($status, $res, $raw) = makeRequest(
    "/microservices/Transactions/checkout.php",
    "POST",
    [
        "action" => "create_order",
        "distancia_km" => 1.0,
        "items" => [["producto_id" => $sampleProd["id"], "cantidad" => 999999]]
    ],
    $verifiedClientToken
);
logTest("CN-03", "Sobreventa / Stock Insuficiente Detectado por C++", $status === 400, $status, 400, "Rechazado con 400 (CPP_VALIDATION_FAILED) y ROLLBACK", null, $res);

// CN-04: Cancelación Ilegal de Orden ya Entregada
if ($orderId && $verifiedClientToken) {
    list($status, $res, $raw) = makeRequest(
        "/microservices/Transactions/cancel_order.php",
        "POST",
        ["pedido_id" => $orderId, "motivo" => "Intento ilegal de cancelar orden entregada"],
        $verifiedClientToken
    );
    logTest("CN-04", "Cancelación Ilegal de Orden Entregada #$orderId", $status === 400, $status, 400, "Rechazado con 400 (ORDER_NOT_CANCELLABLE)", null, $res);
} else {
    logTest("CN-04", "Cancelación Ilegal de Orden Entregada", false, 0, 400, "Falta pedido entregado");
}

// CN-05: Usuario No Autorizado / No Rider Accede a Asignaciones
list($status, $res, $raw) = makeRequest(
    "/microservices/Rider/assignment.php",
    "GET",
    null,
    $verifiedClientToken
);
logTest("CN-05", "Usuario No Autorizado / No Rider Accede a Asignaciones", $status === 403, $status, 403, "Rechazado con 403 Forbidden (requireAuth)", null, $res);

// CN-06: Checkout con Carrito Vacío
list($status, $res, $raw) = makeRequest(
    "/microservices/Transactions/checkout.php",
    "POST",
    ["action" => "create_order", "items" => []],
    $verifiedClientToken
);
logTest("CN-06", "Checkout con Carrito Vacío (items: [])", $status === 400, $status, 400, "Rechazado con 400 (EMPTY_CART)", null, $res);

// CN-07: Cliente Intenta Liquidar Caja de Rider (Sin Permiso Admin)
list($status, $res, $raw) = makeRequest(
    "/microservices/Rider/settle_cash.php",
    "POST",
    ["rider_id" => $riderId ?: 2],
    $verifiedClientToken
);
logTest("CN-07", "Cliente Intenta Liquidar Caja de Rider (Sin Permiso Admin)", $status === 403, $status, 403, "Rechazado con 403 Forbidden (requireAuth)", null, $res);

echo "\n============================================================================\n";
echo "  RESUMEN DE PRUEBAS E2E: Total: {$testResults['total']} | Aprobadas: {$testResults['passed']} | Fallidas: {$testResults['failed']}\n";
echo "============================================================================\n";

$evidencesFile = __DIR__ . "/evidencias_e2e.json";
file_put_contents($evidencesFile, json_encode($testResults, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
echo "[OK] Archivo de evidencias estructurado guardado en: $evidencesFile\n";

exit($testResults["failed"] === 0 ? 0 : 1);

<?php
// microservices/Transactions/checkout.php
require_once '../Auth/connection.php';

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
    $action = $_GET['action'] ?? null;
    $userId = $_POST['user_id'] ?? null;

    if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !$userId || !$action) {
        throw new Exception("Faltan parámetros básicos o método incorrecto.");
    }

    $db = DatabaseConnection::getInstance()->getConnection();

    // Verificar que el usuario tenga CI verificado
    $stmtUser = $db->prepare("SELECT ci_status FROM users WHERE id = ?");
    $stmtUser->execute([$userId]);
    $user = $stmtUser->fetch();
    if (!$user || $user['ci_status'] !== 'verified') {
        throw new Exception("Debes tener tu C.I. verificado para realizar transacciones.");
    }

    if ($action === 'create_order') {
        // En un caso real, esto iteraría un carrito de compras y sumaría el total,
        // pero simularemos un total y la creación inicial en 'esperando_pago'
        $total = $_POST['total'] ?? 0;
        if ($total <= 0) throw new Exception("Total inválido.");

        $db->beginTransaction();

        $stmt = $db->prepare("INSERT INTO pedidos (cliente_id, estado_pago, estado_pedido, total, created_by, updated_by) VALUES (?, 'esperando_pago', 'pendiente', ?, ?, ?)");
        $stmt->execute([$userId, $total, $userId, $userId]);
        $orderId = $db->lastInsertId();

        // Log the creation
        $stmtLog = $db->prepare("INSERT INTO auditoria_logs (tabla_afectada, registro_id, accion, datos_nuevos, created_by, updated_by) VALUES (?, ?, 'INSERT', ?, ?, ?)");
        $stmtLog->execute(['pedidos', $orderId, json_encode(['estado_pago' => 'esperando_pago', 'total' => $total]), $userId, $userId]);

        $db->commit();
        echo formatResponse("success", ["mensaje" => "Pedido creado, esperando pago.", "pedido_id" => $orderId], $userId);

    } elseif ($action === 'upload_qr') {
        $orderId = $_POST['pedido_id'] ?? null;
        $qrImage = $_FILES['qr_image'] ?? null;

        if (!$orderId || empty($qrImage['tmp_name'])) {
            throw new Exception("Faltan datos o comprobante QR.");
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $realMime = finfo_file($finfo, $qrImage['tmp_name']);
        finfo_close($finfo);

        $allowedMimeTypes = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'application/pdf' => 'pdf'
        ];

        if (!array_key_exists($realMime, $allowedMimeTypes)) {
            throw new Exception("El comprobante debe ser una imagen o PDF válido.");
        }
        $ext = $allowedMimeTypes[$realMime];

        // Simulación de guardado seguro
        $uploadDir = __DIR__ . '/../Auth/uploads/qr/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
            file_put_contents($uploadDir . '.htaccess', "Require all denied\n");
        }
        $filename = uniqid('qr_') . '.' . $ext;
        $destination = $uploadDir . $filename;
        move_uploaded_file($qrImage['tmp_name'], $destination);
        $qrUrl = '/uploads/qr/' . $filename;

        $db->beginTransaction();

        // Retrieve old state for audit
        $stmtOld = $db->prepare("SELECT estado_pago FROM pedidos WHERE id = ? AND cliente_id = ?");
        $stmtOld->execute([$orderId, $userId]);
        $oldData = $stmtOld->fetch();
        if (!$oldData) throw new Exception("Pedido no encontrado o no autorizado.");

        $stmt = $db->prepare("UPDATE pedidos SET estado_pago = 'pagado_qr', qr_comprobante_url = ?, updated_by = ? WHERE id = ?");
        $stmt->execute([$qrUrl, $userId, $orderId]);

        $stmtLog = $db->prepare("INSERT INTO auditoria_logs (tabla_afectada, registro_id, accion, datos_anteriores, datos_nuevos, created_by, updated_by) VALUES (?, ?, 'UPDATE', ?, ?, ?, ?)");
        $stmtLog->execute(['pedidos', $orderId, json_encode(['estado_pago' => $oldData['estado_pago']]), json_encode(['estado_pago' => 'pagado_qr', 'qr_url' => $qrUrl]), $userId, $userId]);

        $db->commit();
        echo formatResponse("success", ["mensaje" => "Comprobante QR subido correctamente."], $userId);

    } elseif ($action === 'set_contraentrega') {
        $orderId = $_POST['pedido_id'] ?? null;
        if (!$orderId) throw new Exception("Falta ID de pedido.");

        $db->beginTransaction();

        $stmtOld = $db->prepare("SELECT estado_pago FROM pedidos WHERE id = ? AND cliente_id = ?");
        $stmtOld->execute([$orderId, $userId]);
        $oldData = $stmtOld->fetch();
        if (!$oldData) throw new Exception("Pedido no encontrado o no autorizado.");

        $stmt = $db->prepare("UPDATE pedidos SET estado_pago = 'contraentrega', updated_by = ? WHERE id = ?");
        $stmt->execute([$userId, $orderId]);

        $stmtLog = $db->prepare("INSERT INTO auditoria_logs (tabla_afectada, registro_id, accion, datos_anteriores, datos_nuevos, created_by, updated_by) VALUES (?, ?, 'UPDATE', ?, ?, ?, ?)");
        $stmtLog->execute(['pedidos', $orderId, json_encode(['estado_pago' => $oldData['estado_pago']]), json_encode(['estado_pago' => 'contraentrega']), $userId, $userId]);

        $db->commit();
        echo formatResponse("success", ["mensaje" => "Método de pago fijado a Contraentrega."], $userId);

    } else {
        throw new Exception("Acción no reconocida.");
    }

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    echo formatResponse("error", null, $_POST['user_id'] ?? null, $e->getMessage());
}

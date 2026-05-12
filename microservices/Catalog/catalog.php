<?php
// microservices/Catalog/catalog.php
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
    $userId = $_GET['user_id'] ?? null;

    $db = DatabaseConnection::getInstance()->getConnection();

    if ($action === 'list') {
        $mostrarPrecio = false;
        if ($userId) {
            $stmtUser = $db->prepare("SELECT ci_status FROM users WHERE id = ?");
            $stmtUser->execute([$userId]);
            $user = $stmtUser->fetch();
            if ($user && $user['ci_status'] === 'verified') {
                $mostrarPrecio = true;
            }
        }

        $stmt = $db->query("SELECT * FROM productos ORDER BY categoria, marca, sabor");
        $productos = $stmt->fetchAll();

        $catalogo = [];
        foreach ($productos as $p) {
            $cat = $p['categoria'];
            $mar = $p['marca'];

            if (!isset($catalogo[$cat])) $catalogo[$cat] = [];
            if (!isset($catalogo[$cat][$mar])) $catalogo[$cat][$mar] = [];

            $item = [
                'id' => $p['id'],
                'nombre' => $p['nombre'],
                'sabor' => $p['sabor'],
                'stock' => $p['stock']
            ];

            if ($mostrarPrecio) {
                $item['precio'] = $p['precio'];
                $item['buy_option'] = true;
            } else {
                $item['precio'] = "Oculto - Verifica tu C.I.";
                $item['buy_option'] = false;
            }

            $catalogo[$cat][$mar][] = $item;
        }

        echo formatResponse("success", ["catalogo" => $catalogo], $userId);

    } elseif ($action === 'create' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $stmtAdmin = $db->prepare("SELECT role FROM users WHERE id = ?");
        $stmtAdmin->execute([$userId]);
        $admin = $stmtAdmin->fetch();
        if (!$admin || $admin['role'] !== 'super_usuario') throw new Exception("Permiso denegado. Se requiere rol de super_usuario.");

        $cat = $_POST['categoria'] ?? '';
        $nom = $_POST['nombre'] ?? '';
        $mar = $_POST['marca'] ?? '';
        $sab = $_POST['sabor'] ?? '';
        $pre = $_POST['precio'] ?? 0;
        $stk = $_POST['stock'] ?? 0;

        if (!$cat || !$nom || !$mar || !$pre) {
            throw new Exception("Faltan datos obligatorios para crear producto.");
        }

        $stmt = $db->prepare("INSERT INTO productos (categoria, nombre, marca, sabor, precio, stock, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$cat, $nom, $mar, $sab, $pre, $stk, $userId, $userId]);
        $newId = $db->lastInsertId();

        echo formatResponse("success", ["mensaje" => "Producto creado", "id" => $newId], $userId);

    } elseif ($action === 'update' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $stmtAdmin = $db->prepare("SELECT role FROM users WHERE id = ?");
        $stmtAdmin->execute([$userId]);
        $admin = $stmtAdmin->fetch();
        if (!$admin || $admin['role'] !== 'super_usuario') throw new Exception("Permiso denegado. Se requiere rol de super_usuario.");

        $id = $_POST['id'] ?? null;
        $stk = $_POST['stock'] ?? null;
        $pre = $_POST['precio'] ?? null;
        if (!$id || $stk === null || $pre === null) throw new Exception("Faltan datos para actualizar.");

        $stmt = $db->prepare("UPDATE productos SET stock = ?, precio = ?, updated_by = ? WHERE id = ?");
        $stmt->execute([$stk, $pre, $userId, $id]);

        echo formatResponse("success", ["mensaje" => "Producto actualizado"], $userId);

    } elseif ($action === 'delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $stmtAdmin = $db->prepare("SELECT role FROM users WHERE id = ?");
        $stmtAdmin->execute([$userId]);
        $admin = $stmtAdmin->fetch();
        if (!$admin || $admin['role'] !== 'super_usuario') throw new Exception("Permiso denegado. Se requiere rol de super_usuario.");

        $id = $_POST['id'] ?? null;
        if (!$id) throw new Exception("Falta ID para eliminar.");

        $stmt = $db->prepare("DELETE FROM productos WHERE id = ?");
        $stmt->execute([$id]);

        echo formatResponse("success", ["mensaje" => "Producto eliminado"], $userId);

    } else {
        throw new Exception("Acción no válida o método incorrecto.");
    }

} catch (Exception $e) {
    echo formatResponse("error", null, $_GET['user_id'] ?? null, $e->getMessage());
}

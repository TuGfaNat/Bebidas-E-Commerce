<?php
require_once __DIR__ . '/../Auth/connection.php';

$db = DatabaseConnection::getInstance()->getConnection();
$db->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");

$userUpdates = [
    1 => 'Carlos Pérez',
    2 => 'Pedro Gómez',
    4 => 'María López (Pendiente)',
    5 => 'Juan Rodríguez (Pendiente)'
];

foreach ($userUpdates as $id => $nombre) {
    $stmt = $db->prepare("UPDATE users SET nombre = ? WHERE id = ?");
    $stmt->execute([$nombre, $id]);
}

$prodUpdates = [
    1 => 'Hamburguesa Clásica Simple',
    5 => 'Combo Clásico con Papas y Soda',
    7 => 'Papas Fritas Rústicas',
    11 => 'Sprite Lima-Limón 500ml'
];

foreach ($prodUpdates as $id => $nombre) {
    $stmt = $db->prepare("UPDATE productos SET nombre = ? WHERE id = ?");
    $stmt->execute([$nombre, $id]);
}

$catUpdates = [
    7 => 'Acompañamientos',
    8 => 'Acompañamientos',
    9 => 'Acompañamientos'
];

foreach ($catUpdates as $id => $cat) {
    $stmt = $db->prepare("UPDATE productos SET categoria = ? WHERE id = ?");
    $stmt->execute([$cat, $id]);
}

echo "OK: Data cleansed successfully.\n";

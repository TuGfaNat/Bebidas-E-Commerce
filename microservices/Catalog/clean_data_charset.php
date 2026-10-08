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

$saborUpdates = [
    1 => 'Carne 150g, lechuga, tomate y salsa especial',
    2 => 'Doble medallón smash, queso cheddar x2 y cebolla grillada',
    3 => 'Tocino ahumado crocante, salsa BBQ dulce y queso americano',
    4 => 'Triple carne, huevo frito, tocino, queso y pepinillos',
    5 => 'Hamburguesa Clásica + Papas Medianas + Coca-Cola 500ml',
    6 => 'Doble Smash Cheddar + Papas Rústicas + Bebida 500ml',
    7 => 'Papas crocantes con sal marina y salsa tártara de la casa',
    8 => '8 aros crujientes empanizados con dip BBQ',
    9 => 'Pechuga crocante con salsa de mostaza miel',
    10 => 'Original Fría',
    11 => 'Refrescante Fría',
    12 => 'Refrescante, limón natural y menta fresca'
];

foreach ($saborUpdates as $id => $sabor) {
    $stmt = $db->prepare("UPDATE productos SET sabor = ? WHERE id = ?");
    $stmt->execute([$sabor, $id]);
}

echo "OK: Data cleansed successfully.\n";


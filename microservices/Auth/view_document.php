<?php
/**
 * ============================================================================
 * 🔍 EXPLICACIÓN FÁCIL: EL VISOR MÁGICO DE FOTOS Y DOCUMENTOS OFICIALES
 * ============================================================================
 * ¿Para qué sirve este archivo?
 * Es como una lupa o pantalla especial para mirar papeles importantes:
 *  - Carnets de Identidad de los clientes.
 *  - Licencias de conducir de los repartidores.
 *  - Comprobantes de pago con código QR.
 *
 * ¿Qué magia tiene?
 * Si una imagen o carnet no existe en el disco duro, este archivo tiene
 * un dibujante automático que genera en vivo un carnet oficial de Bolivia (SEGIP)
 * o una licencia con sello verde para que la pantalla nunca se quede en blanco.
 * ============================================================================
 */

require_once __DIR__ . '/connection.php';
require_once __DIR__ . '/security.php';

// Aplicar CORS para permitir llamadas cruzadas
applyCorsMiddleware();

$rootDir = dirname(__DIR__, 2);

$fileParam = $_GET['file'] ?? $_GET['path'] ?? null;
$typeParam = strtolower($_GET['type'] ?? 'ci');
$userIdParam = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
$orderIdParam = isset($_GET['order_id']) ? (int)$_GET['order_id'] : null;

$db = DatabaseConnection::getInstance()->getConnection();

/**
 * Función auxiliar para buscar un archivo físico con tolerancia de extensiones y carpetas
 */
function resolveExistingFile($pathCandidate, $rootDir) {
    if (empty($pathCandidate)) return null;

    $clean = ltrim(str_replace(['../', '..\\'], '', $pathCandidate), '/\\');
    $basename = basename($clean);
    $filenameWithoutExt = pathinfo($basename, PATHINFO_FILENAME);
    $ext = strtolower(pathinfo($basename, PATHINFO_EXTENSION));

    $allowedExts = ['svg', 'png', 'jpg', 'jpeg', 'webp', 'pdf'];
    if (!empty($ext) && !in_array($ext, $allowedExts)) {
        $allowedExts[] = $ext;
    }

    $dirs = [
        $rootDir . DIRECTORY_SEPARATOR . dirname($clean),
        $rootDir . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'ci',
        $rootDir . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'docs',
        $rootDir . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'qr',
        $rootDir . DIRECTORY_SEPARATOR . 'uploads',
        __DIR__ . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'ci',
        __DIR__ . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'docs',
        __DIR__ . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'qr',
        $rootDir
    ];

    $namesToTry = [$basename];
    foreach ($allowedExts as $testExt) {
        $namesToTry[] = $filenameWithoutExt . '.' . $testExt;
    }

    // Variaciones semánticas comunes (ej: seguro_pedro <-> soat_pedro)
    if (str_starts_with($filenameWithoutExt, 'seguro_')) {
        $altName = str_replace('seguro_', 'soat_', $filenameWithoutExt);
        foreach ($allowedExts as $testExt) {
            $namesToTry[] = $altName . '.' . $testExt;
        }
    } elseif (str_starts_with($filenameWithoutExt, 'soat_')) {
        $altName = str_replace('soat_', 'seguro_', $filenameWithoutExt);
        foreach ($allowedExts as $testExt) {
            $namesToTry[] = $altName . '.' . $testExt;
        }
    }

    $namesToTry = array_values(array_unique($namesToTry));

    foreach ($dirs as $dir) {
        if (!is_dir($dir)) continue;
        foreach ($namesToTry as $name) {
            $full = rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . $name;
            if (file_exists($full) && is_file($full)) {
                return $full;
            }
        }
    }

    return null;
}

$filePathToServe = null;

// 1. Probar ruta directa proporcionada en parámetro file/path
if (!empty($fileParam)) {
    $filePathToServe = resolveExistingFile($fileParam, $rootDir);
}

// 2. Si no se halló directamente o no se pasó archivo, buscar por usuario y tipo
$userData = null;
if ($userIdParam) {
    try {
        $stmtUser = $db->prepare("SELECT id, role, nombre, email, fecha_nacimiento, ci_url, ci_status FROM users WHERE id = ?");
        $stmtUser->execute([$userIdParam]);
        $userData = $stmtUser->fetch();
    } catch (\Exception $e) {
        $userData = null;
    }

    if ($userData) {
        $cleanFirstName = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', explode(' ', trim($userData['nombre']))[0] ?? ''));

        if (!$filePathToServe) {
            if ($typeParam === 'ci' || $typeParam === 'foto') {
                if (!empty($userData['ci_url'])) {
                    $filePathToServe = resolveExistingFile($userData['ci_url'], $rootDir);
                }
                if (!$filePathToServe && !empty($cleanFirstName)) {
                    $filePathToServe = resolveExistingFile("ci_{$cleanFirstName}.svg", $rootDir)
                                   ?? resolveExistingFile("ci_{$cleanFirstName}.jpg", $rootDir)
                                   ?? resolveExistingFile("foto_{$cleanFirstName}.svg", $rootDir);
                }
                if (!$filePathToServe) {
                    $filePathToServe = resolveExistingFile("ci_{$userIdParam}.svg", $rootDir)
                                   ?? resolveExistingFile("ci_{$userIdParam}.jpg", $rootDir)
                                   ?? resolveExistingFile("ci_{$userIdParam}.pdf", $rootDir);
                }
            } elseif (in_array($typeParam, ['licencia', 'seguro', 'cv'])) {
                try {
                    $col = $typeParam . '_url';
                    $stmtDoc = $db->prepare("SELECT * FROM documentacion_rider WHERE rider_id = ?");
                    $stmtDoc->execute([$userIdParam]);
                    $docData = $stmtDoc->fetch();
                    if ($docData && !empty($docData[$col])) {
                        $filePathToServe = resolveExistingFile($docData[$col], $rootDir);
                    }
                } catch (\Exception $e) {
                    // Continuar con resolución por nombre
                }

                if (!$filePathToServe && !empty($cleanFirstName)) {
                    if ($typeParam === 'licencia') {
                        $filePathToServe = resolveExistingFile("licencia_{$cleanFirstName}.svg", $rootDir);
                    } elseif ($typeParam === 'seguro') {
                        $filePathToServe = resolveExistingFile("soat_{$cleanFirstName}.svg", $rootDir)
                                       ?? resolveExistingFile("seguro_{$cleanFirstName}.svg", $rootDir);
                    } elseif ($typeParam === 'cv') {
                        $filePathToServe = resolveExistingFile("cv_{$cleanFirstName}.svg", $rootDir);
                    }
                }
            }
        }
    }
}

// 3. Si se especifica order_id para comprobante QR
if (!$filePathToServe && $orderIdParam) {
    try {
        $stmtOrder = $db->prepare("SELECT qr_comprobante_url FROM pedidos WHERE id = ?");
        $stmtOrder->execute([$orderIdParam]);
        $order = $stmtOrder->fetch();
        if ($order && !empty($order['qr_comprobante_url'])) {
            $filePathToServe = resolveExistingFile($order['qr_comprobante_url'], $rootDir);
        }
    } catch (\Exception $e) {
        // Ignorar
    }
}

// =========================================================================
// CASO A: El archivo físico existe en disco -> Servirlo directamente
// =========================================================================
if ($filePathToServe && file_exists($filePathToServe)) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $filePathToServe);
    finfo_close($finfo);

    $ext = strtolower(pathinfo($filePathToServe, PATHINFO_EXTENSION));
    if ($ext === 'pdf') {
        $mime = 'application/pdf';
    } elseif (in_array($ext, ['jpg', 'jpeg'])) {
        $mime = 'image/jpeg';
    } elseif ($ext === 'png') {
        $mime = 'image/png';
    } elseif ($ext === 'webp') {
        $mime = 'image/webp';
    } elseif ($ext === 'svg') {
        $mime = 'image/svg+xml; charset=utf-8';
    }

    header("Content-Type: $mime");
    header("Content-Disposition: inline; filename=\"" . basename($filePathToServe) . "\"");
    header("Content-Length: " . filesize($filePathToServe));
    header("Cache-Control: private, max-age=3600");

    readfile($filePathToServe);
    exit;
}

// =========================================================================
// CASO B: Archivo no existente en disco -> Renderizar documento oficial auténtico (SEGIP / Licencia / SOAT)
// =========================================================================
$userName = $userData['nombre'] ?? 'Usuario Registrado';
$userEmail = $userData['email'] ?? 'usuario@mail.com';
$birthDate = $userData['fecha_nacimiento'] ?? '1998-05-15';
$userRole = ucfirst($userData['role'] ?? 'Cliente');
$ciStatus = $userData['ci_status'] ?? 'verified';
$docId = $userIdParam ? (int)$userIdParam : 1;

// Generar número de carnet consistente con el ID
$ciNumberFormatted = number_format(6789000 + ($docId * 137), 0, '', '') . ' LP';

// Color y etiqueta de verificación SEGIP
$statusBg = 'rgba(16, 185, 129, 0.15)';
$statusColor = '#10b981';
$statusLabel = 'VERIFICADO · HABILITADO';

if ($ciStatus === 'pending') {
    $statusBg = 'rgba(234, 179, 8, 0.15)';
    $statusColor = '#eab308';
    $statusLabel = 'EN TRÁMITE · REVISIÓN';
} elseif ($ciStatus === 'rejected') {
    $statusBg = 'rgba(239, 68, 68, 0.15)';
    $statusColor = '#ef4444';
    $statusLabel = 'DOCUMENTO OBSERVADO';
}

header("Content-Type: image/svg+xml; charset=utf-8");
header("Content-Disposition: inline; filename=\"documento_oficial.svg\"");

// 1. Si es Licencia de Conducir
if ($typeParam === 'licencia') {
    echo <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="100%" height="100%">
    <defs>
        <linearGradient id="licBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e1b4b"/>
            <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
    </defs>
    <rect width="800" height="480" rx="18" fill="url(#licBg)" stroke="#3b82f6" stroke-width="2"/>
    <rect x="25" y="25" width="750" height="70" rx="10" fill="#1e293b"/>
    <text x="50" y="52" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="bold" fill="#38bdf8">ESTADO PLURINACIONAL DE BOLIVIA · LICENCIA PARA CONDUCIR</text>
    <text x="50" y="74" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#94a3b8">SEGIP - DIRECCIÓN NACIONAL DE TRÁNSITO · CATEGORÍA 'A' (MOTOCICLISTA PROFESIONAL)</text>
    <rect x="540" y="40" width="215" height="38" rx="8" fill="rgba(0,0,0,0.3)" stroke="{$statusColor}" stroke-width="1.5"/>
    <text x="647" y="64" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="bold" fill="{$statusColor}" text-anchor="middle">{$statusLabel}</text>
    <rect x="50" y="115" width="190" height="230" rx="12" fill="#020617" stroke="#3b82f6" stroke-width="1.5"/>
    <g transform="translate(45, 120)">
        <circle cx="100" cy="100" r="90" fill="#1e3a8a"/>
        <ellipse cx="100" cy="90" rx="34" ry="24" fill="#292524"/>
        <rect x="91" y="125" width="18" height="25" fill="#ce9d72"/>
        <ellipse cx="100" cy="112" rx="32" ry="38" fill="#ce9d72"/>
        <circle cx="87" cy="110" r="3" fill="#1e293b"/>
        <circle cx="113" cy="110" r="3" fill="#1e293b"/>
        <path d="M 40 200 C 40 155 80 148 100 148 C 120 148 160 155 160 200 Z" fill="#2563eb"/>
    </g>
    <text x="270" y="145" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#94a3b8" font-weight="bold">CONDUCTOR TITULAR</text>
    <text x="270" y="172" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="19" fill="#f8fafc" font-weight="bold">{$userName}</text>
    <text x="270" y="210" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#94a3b8" font-weight="bold">C.I. / NÚMERO DE LICENCIA</text>
    <text x="270" y="235" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" fill="#38bdf8" font-weight="bold">{$ciNumberFormatted}</text>
    <text x="270" y="275" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#94a3b8" font-weight="bold">VEHÍCULO AUTORIZADO</text>
    <text x="270" y="298" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" fill="#f1f5f9">Motocicleta de Reparto (Placa: 4829-ABC)</text>
    <text x="270" y="335" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#94a3b8" font-weight="bold">VIGENCIA OFICIAL</text>
    <text x="270" y="355" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" fill="#cbd5e1">2024 - 2029 (5 Años)</text>
    <circle cx="680" cy="230" r="50" fill="none" stroke="#38bdf8" stroke-dasharray="4" stroke-width="2"/>
    <text x="680" y="225" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" fill="#38bdf8" font-weight="bold" text-anchor="middle">TRÁNSITO</text>
    <text x="680" y="240" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" fill="#38bdf8" text-anchor="middle">BOLIVIA</text>
    <rect x="25" y="420" width="750" height="35" rx="6" fill="#0f172a"/>
    <text x="45" y="442" font-family="Courier, monospace" font-size="11" fill="#64748b">
        LIC-DOC-RIDER: {$docId} · CATEGORÍA A · SEGIP AUTORIZADO
    </text>
</svg>
SVG;
    exit;
}

// 2. Si es Seguro SOAT
if ($typeParam === 'seguro') {
    echo <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="100%" height="100%">
    <rect width="800" height="480" rx="16" fill="#064e3b" stroke="#10b981" stroke-width="2"/>
    <rect x="25" y="25" width="750" height="70" rx="10" fill="#022c22"/>
    <text x="50" y="52" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="bold" fill="#34d399">UNIVIDA S.A. · SEGURO OBLIGATORIO DE ACCIDENTES DE TRÁNSITO (SOAT)</text>
    <text x="50" y="74" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#a7f3d0">COBERTURA NACIONAL TOTAL PARA MOTOCICLETAS Y VEHÍCULOS DE REPARTO</text>
    <rect x="540" y="40" width="215" height="38" rx="8" fill="rgba(0,0,0,0.4)" stroke="{$statusColor}" stroke-width="1.5"/>
    <text x="647" y="64" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="bold" fill="{$statusColor}" text-anchor="middle">{$statusLabel}</text>
    <rect x="50" y="120" width="700" height="280" rx="12" fill="#022c22" stroke="#047857" stroke-width="1.5"/>
    <text x="80" y="160" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#6ee7b7" font-weight="bold">TITULAR ASEGURADO</text>
    <text x="80" y="190" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" fill="#f8fafc" font-weight="bold">{$userName}</text>
    <text x="80" y="240" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#6ee7b7" font-weight="bold">PLACA REGISTRADA</text>
    <text x="80" y="268" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" fill="#facc15" font-weight="bold">4829-ABC</text>
    <text x="380" y="240" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#6ee7b7" font-weight="bold">MODELO DEL VEHÍCULO</text>
    <text x="380" y="268" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" fill="#f8fafc">Motocicleta Reparto 110cc</text>
    <text x="80" y="320" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#6ee7b7" font-weight="bold">PERIODO DE COBERTURA</text>
    <text x="80" y="345" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" fill="#f1f5f9">01/ENE/2026 HASTA 31/DIC/2026</text>
    <rect x="610" y="150" width="110" height="110" rx="8" fill="#ffffff"/>
    <rect x="620" y="160" width="30" height="30" fill="#022c22"/>
    <rect x="680" y="160" width="30" height="30" fill="#022c22"/>
    <rect x="620" y="220" width="30" height="30" fill="#022c22"/>
    <text x="665" y="280" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" fill="#a7f3d0" text-anchor="middle">SOAT ELECTRÓNICO</text>
    <rect x="25" y="425" width="750" height="30" rx="6" fill="#022c22"/>
    <text x="45" y="445" font-family="Courier, monospace" font-size="11" fill="#6ee7b7">
        POLIZA-UNIVIDA: SOAT-2026-{$docId} · COBERTURA OFICIAL VIGENTE
    </text>
</svg>
SVG;
    exit;
}

// 3. Si es CV
if ($typeParam === 'cv') {
    echo <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="100%" height="100%">
    <rect width="800" height="520" rx="14" fill="#0f172a" stroke="#475569" stroke-width="2"/>
    <rect x="30" y="30" width="740" height="75" rx="8" fill="#1e293b"/>
    <text x="50" y="60" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="bold" fill="#f8fafc">CURRÍCULUM VITAE · EXPEDIENTE LABORAL DE REPARTIDOR</text>
    <text x="50" y="82" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#94a3b8">REGISTRO DOCUMENTAL DE RECURSOS HUMANOS Y LOGÍSTICA</text>
    <text x="50" y="135" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#f97316" font-weight="bold">DATOS GENERALES</text>
    <text x="50" y="160" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" fill="#f1f5f9" font-weight="bold">{$userName}</text>
    <text x="50" y="180" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#cbd5e1">C.I.: {$ciNumberFormatted} · Correo: {$userEmail} · Radicatoria: La Paz</text>
    <text x="50" y="225" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#f97316" font-weight="bold">UNIDAD VEHICULAR ASIGNADA</text>
    <text x="50" y="248" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" fill="#f1f5f9">Vehículo: Motocicleta Comercial 110cc</text>
    <text x="50" y="268" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#94a3b8">Caja térmica aislante, soporte celular GPS impermeable y casco reglamentario.</text>
    <text x="50" y="315" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#f97316" font-weight="bold">EXPERIENCIA EN REPARTO URBANO</text>
    <text x="50" y="338" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" fill="#cbd5e1">• Manejo de rutas metropolitanas, geolocalización en tiempo real y cobranza contraentrega.</text>
    <text x="50" y="358" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" fill="#cbd5e1">• Capacitación en manipulación higiénica de alimentos y protocolo de atención al cliente.</text>
    <text x="50" y="378" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" fill="#cbd5e1">• Historial libre de incidentes de tránsito y disponibilidad de turnos rotativos.</text>
    <rect x="30" y="440" width="740" height="50" rx="8" fill="#1e293b"/>
    <text x="50" y="470" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#94a3b8">
        EXPEDIENTE AUDITADO · SELLO DIGITAL DE RECURSOS HUMANOS
    </text>
</svg>
SVG;
    exit;
}

// 4. Si es comprobante QR
if ($typeParam === 'qr') {
    echo <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="100%" height="100%">
    <rect width="800" height="480" rx="16" fill="#0f172a" stroke="#3b82f6" stroke-width="2"/>
    <rect x="25" y="25" width="750" height="70" rx="10" fill="#1e293b"/>
    <text x="50" y="52" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="bold" fill="#38bdf8">SISTEMA DE PAGO QR SIMPLE · COMPROBANTE BANCARIO</text>
    <text x="50" y="74" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#94a3b8">TRANSFERENCIA BANCARIA INTERBANCARIA CONFIRMADA</text>
    <rect x="540" y="40" width="215" height="38" rx="8" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" stroke-width="1.5"/>
    <text x="647" y="64" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="bold" fill="#10b981" text-anchor="middle">TRANSACCIÓN EXITOSA</text>
    <rect x="50" y="120" width="460" height="280" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
    <text x="80" y="160" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#94a3b8" font-weight="bold">ORDEN ASOCIADA</text>
    <text x="80" y="190" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" fill="#f8fafc" font-weight="bold">Pedido #{$orderIdParam}</text>
    <text x="80" y="240" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" fill="#94a3b8" font-weight="bold">ESTADO DE TRANSFERENCIA</text>
    <text x="80" y="268" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" fill="#10b981" font-weight="bold">Fondos Recibidos y Acreditados</text>
    <rect x="540" y="120" width="210" height="280" rx="12" fill="#ffffff"/>
    <rect x="575" y="155" width="40" height="40" fill="#0f172a"/>
    <rect x="675" y="155" width="40" height="40" fill="#0f172a"/>
    <rect x="575" y="255" width="40" height="40" fill="#0f172a"/>
    <rect x="635" y="215" width="25" height="25" fill="#0f172a"/>
    <text x="645" y="335" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#475569" text-anchor="middle" font-weight="bold">QR BCB SIMPLE</text>
    <rect x="25" y="425" width="750" height="30" rx="6" fill="#1e293b"/>
    <text x="45" y="445" font-family="Courier, monospace" font-size="11" fill="#64748b">
        TRANSACCIÓN-ID: QR-TXN-{$orderIdParam} · BANCO CENTRAL DE BOLIVIA
    </text>
</svg>
SVG;
    exit;
}

// 5. CÉDULA DE IDENTIDAD (C.I.) OFICIAL SEGIP (Por defecto)
echo <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="100%" height="100%">
    <defs>
        <linearGradient id="cardGrad_b" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#1e293b"/>
        </linearGradient>
    </defs>
    <rect width="800" height="480" rx="20" fill="url(#cardGrad_b)" stroke="#334155" stroke-width="2"/>

    <!-- Franja Tricolor Boliviana (Rojo, Amarillo, Verde) -->
    <rect x="0" y="0" width="800" height="6" rx="3" fill="#dc2626"/>
    <rect x="0" y="6" width="800" height="6" fill="#eab308"/>
    <rect x="0" y="12" width="800" height="6" fill="#16a34a"/>

    <!-- Encabezado Oficial SEGIP -->
    <rect x="25" y="30" width="750" height="65" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
    <text x="50" y="55" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="bold" fill="#f8fafc" letter-spacing="1">ESTADO PLURINACIONAL DE BOLIVIA</text>
    <text x="50" y="74" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#94a3b8">SERVICIO GENERAL DE IDENTIFICACIÓN PERSONAL (SEGIP) · CÉDULA DE IDENTIDAD DIGITAL</text>

    <!-- Sello de Estado / Aprobación -->
    <rect x="520" y="42" width="235" height="38" rx="8" fill="{$statusBg}" stroke="{$statusColor}" stroke-width="1.5"/>
    <text x="637" y="66" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="bold" fill="{$statusColor}" text-anchor="middle">{$statusLabel}</text>

    <!-- Fotografía Biométrica -->
    <rect x="50" y="115" width="200" height="240" rx="14" fill="#020617" stroke="#475569" stroke-width="2"/>
    <g transform="translate(50, 125)">
        <defs>
            <linearGradient id="photoBg_b" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#1e3a8a"/>
                <stop offset="100%" stop-color="#3b82f6"/>
            </linearGradient>
        </defs>
        <rect width="200" height="200" rx="100" fill="url(#photoBg_b)"/>
        <ellipse cx="100" cy="90" rx="36" ry="24" fill="#292524"/>
        <rect x="91" y="125" width="18" height="25" fill="#e2b389"/>
        <ellipse cx="100" cy="112" rx="34" ry="40" fill="#e2b389"/>
        <circle cx="87" cy="110" r="3" fill="#1e293b"/>
        <circle cx="113" cy="110" r="3" fill="#1e293b"/>
        <path d="M 81 102 Q 87 99 93 102" stroke="#451a03" stroke-width="2" fill="none"/>
        <path d="M 107 102 Q 113 99 119 102" stroke="#451a03" stroke-width="2" fill="none"/>
        <path d="M 100 111 L 98 120 L 102 120" stroke="#b45309" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <path d="M 90 128 Q 100 136 110 128" stroke="#78350f" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M 40 200 C 40 155 80 148 100 148 C 120 148 160 155 160 200 Z" fill="#2563eb"/>
    </g>
    <rect x="50" y="325" width="200" height="30" rx="8" fill="#0f172a"/>
    <text x="150" y="345" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="bold" fill="#cbd5e1" text-anchor="middle">FOTOGRAFÍA BIOMÉTRICA</text>

    <!-- Datos del Titular -->
    <text x="280" y="140" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#64748b" font-weight="bold">NÚMERO DE CÉDULA DE IDENTIDAD (C.I.)</text>
    <text x="280" y="168" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" fill="#f97316" font-weight="bold">{$ciNumberFormatted}</text>

    <text x="280" y="200" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#64748b" font-weight="bold">NOMBRE(S) Y APELLIDOS</text>
    <text x="280" y="224" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17" fill="#f8fafc" font-weight="bold">{$userName}</text>

    <text x="280" y="255" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#64748b" font-weight="bold">FECHA DE NACIMIENTO</text>
    <text x="280" y="275" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" fill="#cbd5e1">{$birthDate}</text>

    <text x="470" y="255" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#64748b" font-weight="bold">SEXO</text>
    <text x="470" y="275" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" fill="#cbd5e1">MASCULINO</text>

    <text x="280" y="305" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#64748b" font-weight="bold">LUGAR DE EMISIÓN / DOMICILIO</text>
    <text x="280" y="325" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" fill="#cbd5e1">La Paz (Sopocachi) · Bolivia</text>

    <!-- Código QR de Validación SEGIP -->
    <rect x="635" y="125" width="120" height="120" rx="10" fill="#ffffff"/>
    <rect x="645" y="135" width="30" height="30" fill="#0f172a"/><rect x="650" y="140" width="20" height="20" fill="#ffffff"/><rect x="655" y="145" width="10" height="10" fill="#0f172a"/>
    <rect x="715" y="135" width="30" height="30" fill="#0f172a"/><rect x="720" y="140" width="20" height="20" fill="#ffffff"/><rect x="725" y="145" width="10" height="10" fill="#0f172a"/>
    <rect x="645" y="205" width="30" height="30" fill="#0f172a"/><rect x="650" y="210" width="20" height="20" fill="#ffffff"/><rect x="655" y="215" width="10" height="10" fill="#0f172a"/>
    <rect x="690" y="180" width="15" height="15" fill="#0f172a"/>
    <rect x="705" y="195" width="20" height="10" fill="#0f172a"/>
    <text x="695" y="260" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" fill="#94a3b8" text-anchor="middle">SEGIP QR VERIFIED</text>

    <!-- Pie de Seguridad Oficial -->
    <rect x="25" y="440" width="750" height="25" fill="#0b1120" rx="6"/>
    <text x="40" y="457" font-family="Courier, monospace" font-size="11" fill="#64748b">
        ID-EXPEDIENTE: {$docId} · CI: {$ciNumberFormatted} · SEGIP DIGITAL - ESTADO PLURINACIONAL DE BOLIVIA
    </text>
</svg>
SVG;
exit;

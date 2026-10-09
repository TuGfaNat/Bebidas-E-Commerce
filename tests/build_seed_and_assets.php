<?php
/**
 * Script Generador de Semilla de Datos Completa y Recursos Visuales SVG
 * Crea 19 usuarios (9 Clientes, 9 Riders, 1 Admin) con fotos y documentos individuales.
 * Mantiene compatibilidad referencial estricta con IDs 1-7 previos y expande 8-19.
 */

$rootDir = dirname(__DIR__);
$ciDir = $rootDir . '/uploads/ci';
$docsDir = $rootDir . '/uploads/docs';
$qrDir = $rootDir . '/uploads/qr';

$authCiDir = $rootDir . '/microservices/Auth/uploads/ci';
$authDocsDir = $rootDir . '/microservices/Auth/uploads/docs';
$authQrDir = $rootDir . '/microservices/Auth/uploads/qr';

foreach ([$ciDir, $docsDir, $qrDir, $authCiDir, $authDocsDir, $authQrDir] as $d) {
    if (!is_dir($d)) {
        mkdir($d, 0777, true);
    }
}

// Definición exhaustiva de los 19 usuarios con compatibilidad estricta
$users = [
    // 1. Carlos Pérez - Cliente Habilitado (Original ID 1)
    [
        'id' => 1,
        'role' => 'cliente',
        'key' => 'carlos',
        'nombre' => 'Carlos Pérez Mendoza',
        'email' => 'carlos@mail.com',
        'pass' => 'carlos',
        'nacimiento' => '1995-04-12',
        'ci' => '6789452 LP',
        'sexo' => 'M',
        'telefono' => '+591 71523481',
        'ciudad' => 'La Paz (Sopocachi)',
        'ci_status' => 'verified',
        'bg_color' => '#1e3a8a',
        'bg_grad' => '#3b82f6',
        'hair_type' => 'short_brown',
        'skin_tone' => '#e2b389',
        'clothes_color' => '#2563eb',
        'clothes_type' => 'jacket',
        'features' => ['smile']
    ],
    // 2. Pedro Gómez - Rider Habilitado (Original ID 2)
    [
        'id' => 2,
        'role' => 'rider',
        'key' => 'pedro',
        'nombre' => 'Pedro Gómez Alarcón',
        'email' => 'pedro@mail.com',
        'pass' => 'pedro',
        'nacimiento' => '1992-08-25',
        'ci' => '5829104 LP',
        'sexo' => 'M',
        'telefono' => '+591 71294830',
        'ciudad' => 'La Paz',
        'vehiculo' => 'Honda Wave 110cc',
        'placa' => '4829-ABC',
        'ci_status' => 'verified',
        'estado_aprobacion' => 'aprobado',
        'bg_color' => '#7c2d12',
        'bg_grad' => '#ea580c',
        'hair_type' => 'bandana_dark',
        'skin_tone' => '#ce9d72',
        'clothes_color' => '#c2410c',
        'clothes_type' => 'jacket',
        'features' => ['stubble', 'smile']
    ],
    // 3. Admin Central - Super Usuario (Original ID 3)
    [
        'id' => 3,
        'role' => 'super_usuario',
        'key' => 'admin',
        'nombre' => 'Admin Central (Gerencia)',
        'email' => 'admin@mail.com',
        'pass' => 'admin',
        'nacimiento' => '1988-11-03',
        'ci' => '4910293 LP',
        'sexo' => 'M',
        'telefono' => '+591 70012345',
        'ciudad' => 'La Paz (Oficina Central)',
        'ci_status' => 'verified',
        'bg_color' => '#090d16',
        'bg_grad' => '#1e293b',
        'hair_type' => 'formal_dark',
        'skin_tone' => '#e8bc99',
        'clothes_color' => '#0f172a',
        'clothes_type' => 'suit',
        'features' => ['glasses', 'tie', 'smile']
    ],
    // 4. María López - Cliente Pendiente (Original ID 4)
    [
        'id' => 4,
        'role' => 'cliente',
        'key' => 'maria',
        'nombre' => 'María López Guzmán',
        'email' => 'maria@mail.com',
        'pass' => 'maria',
        'nacimiento' => '2001-02-14',
        'ci' => '8492014 LP',
        'sexo' => 'F',
        'telefono' => '+591 73091823',
        'ciudad' => 'La Paz (Miraflores)',
        'ci_status' => 'pending',
        'bg_color' => '#831843',
        'bg_grad' => '#db2777',
        'hair_type' => 'wavy_dark',
        'skin_tone' => '#eec29a',
        'clothes_color' => '#f43f5e',
        'clothes_type' => 'top',
        'features' => ['necklace', 'smile']
    ],
    // 5. Juan Rodríguez - Rider Pendiente (Original ID 5)
    [
        'id' => 5,
        'role' => 'rider',
        'key' => 'juan',
        'nombre' => 'Juan Rodríguez Ticona',
        'email' => 'juan@mail.com',
        'pass' => 'juan',
        'nacimiento' => '1999-07-19',
        'ci' => '8201948 LP',
        'sexo' => 'M',
        'telefono' => '+591 73491028',
        'ciudad' => 'La Paz',
        'vehiculo' => 'Bajaj Pulsar 160',
        'placa' => '6281-MNP',
        'ci_status' => 'pending',
        'estado_aprobacion' => 'pendiente',
        'bg_color' => '#1e1b4b',
        'bg_grad' => '#4338ca',
        'hair_type' => 'short_fade',
        'skin_tone' => '#d49b6b',
        'clothes_color' => '#3730a3',
        'clothes_type' => 'jacket',
        'features' => []
    ],
    // 6. Roberto Flores - Cliente Rechazado (Original ID 6)
    [
        'id' => 6,
        'role' => 'cliente',
        'key' => 'roberto',
        'nombre' => 'Roberto Flores Arze',
        'email' => 'roberto@mail.com',
        'pass' => 'roberto',
        'nacimiento' => '1996-05-20',
        'ci' => '4829103 LP',
        'sexo' => 'M',
        'telefono' => '+591 72039481',
        'ciudad' => 'La Paz (Obrajes)',
        'ci_status' => 'rejected',
        'rechazo_motivo' => 'Documento de C.I. borroso e ilegible al escanear bordes.',
        'bg_color' => '#334155',
        'bg_grad' => '#64748b',
        'hair_type' => 'short_black',
        'skin_tone' => '#deb086',
        'clothes_color' => '#475569',
        'clothes_type' => 'polo',
        'features' => []
    ],
    // 7. Marcos Vargas - Rider Rechazado (Original ID 7)
    [
        'id' => 7,
        'role' => 'rider',
        'key' => 'marcos',
        'nombre' => 'Marcos Vargas Huanca',
        'email' => 'marcos@mail.com',
        'pass' => 'marcos',
        'nacimiento' => '1994-09-10',
        'ci' => '6019284 LP',
        'sexo' => 'M',
        'telefono' => '+591 72849102',
        'ciudad' => 'La Paz',
        'vehiculo' => 'Motocicleta Sin Documentos',
        'placa' => '1029-NOREG',
        'ci_status' => 'rejected',
        'estado_aprobacion' => 'rechazado',
        'rechazo_motivo' => 'Licencia de conducir Categoría A adulterada / no figura en SEGIP.',
        'bg_color' => '#450a0a',
        'bg_grad' => '#991b1b',
        'hair_type' => 'buzzcut_black',
        'skin_tone' => '#c28c5e',
        'clothes_color' => '#7f1d1d',
        'clothes_type' => 'jacket',
        'features' => []
    ],
    // 8. Andrea Morales - Cliente Habilitada (Nuevo ID 8)
    [
        'id' => 8,
        'role' => 'cliente',
        'key' => 'andrea',
        'nombre' => 'Andrea Morales Ramos',
        'email' => 'andrea@mail.com',
        'pass' => 'andrea',
        'nacimiento' => '1998-09-18',
        'ci' => '7845123 CB',
        'sexo' => 'F',
        'telefono' => '+591 76239014',
        'ciudad' => 'Cochabamba (Cala Cala)',
        'ci_status' => 'verified',
        'bg_color' => '#581c87',
        'bg_grad' => '#9333ea',
        'hair_type' => 'long_brown',
        'skin_tone' => '#f3cbb3',
        'clothes_color' => '#7c3aed',
        'clothes_type' => 'blouse',
        'features' => ['earrings', 'smile']
    ],
    // 9. Gonzalo Salinas - Cliente Habilitado (Nuevo ID 9)
    [
        'id' => 9,
        'role' => 'cliente',
        'key' => 'gonzalo',
        'nombre' => 'Gonzalo Salinas Castro',
        'email' => 'gonzalo@mail.com',
        'pass' => 'gonzalo',
        'nacimiento' => '1991-12-05',
        'ci' => '5934812 SC',
        'sexo' => 'M',
        'telefono' => '+591 70184920',
        'ciudad' => 'Santa Cruz (Equipetrol)',
        'ci_status' => 'verified',
        'bg_color' => '#064e3b',
        'bg_grad' => '#10b981',
        'hair_type' => 'curly_dark',
        'skin_tone' => '#d69e6e',
        'clothes_color' => '#059669',
        'clothes_type' => 'sweater',
        'features' => ['glasses', 'beard']
    ],
    // 10. Diego Quiroga - Cliente Pendiente (Nuevo ID 10)
    [
        'id' => 10,
        'role' => 'cliente',
        'key' => 'diego',
        'nombre' => 'Diego Quiroga Flores',
        'email' => 'diego@mail.com',
        'pass' => 'diego',
        'nacimiento' => '2003-06-22',
        'ci' => '9123847 LP',
        'sexo' => 'M',
        'telefono' => '+591 77482910',
        'ciudad' => 'La Paz (San Pedro)',
        'ci_status' => 'pending',
        'bg_color' => '#7f1d1d',
        'bg_grad' => '#dc2626',
        'hair_type' => 'messy_brown',
        'skin_tone' => '#f2c5a0',
        'clothes_color' => '#ef4444',
        'clothes_type' => 'tshirt',
        'features' => ['smile']
    ],
    // 11. Camila Navarro - Cliente Pendiente (Nuevo ID 11)
    [
        'id' => 11,
        'role' => 'cliente',
        'key' => 'camila',
        'nombre' => 'Camila Navarro Torrez',
        'email' => 'camila@mail.com',
        'pass' => 'camila',
        'nacimiento' => '2000-11-30',
        'ci' => '8374921 CB',
        'sexo' => 'F',
        'telefono' => '+591 69182734',
        'ciudad' => 'Cochabamba (Recoleta)',
        'ci_status' => 'pending',
        'bg_color' => '#164e63',
        'bg_grad' => '#06b6d4',
        'hair_type' => 'bun_blonde',
        'skin_tone' => '#fcd5b8',
        'clothes_color' => '#0891b2',
        'clothes_type' => 'blouse',
        'features' => ['glasses', 'earrings']
    ],
    // 12. Lucía Paredes - Cliente Rechazada (Nuevo ID 12)
    [
        'id' => 12,
        'role' => 'cliente',
        'key' => 'lucia',
        'nombre' => 'Lucía Paredes Vega',
        'email' => 'lucia@mail.com',
        'pass' => 'lucia',
        'nacimiento' => '2009-08-14',
        'ci' => '1029384 LP',
        'sexo' => 'F',
        'telefono' => '+591 75839201',
        'ciudad' => 'La Paz (Calacoto)',
        'ci_status' => 'rejected',
        'rechazo_motivo' => 'Solicitante no cumple la mayoría de edad (17 años).',
        'bg_color' => '#701a75',
        'bg_grad' => '#c026d3',
        'hair_type' => 'braids_dark',
        'skin_tone' => '#e2ad81',
        'clothes_color' => '#d946ef',
        'clothes_type' => 'hoodie',
        'features' => []
    ],
    // 13. Rodrigo Méndez - Cliente Rechazado (Nuevo ID 13)
    [
        'id' => 13,
        'role' => 'cliente',
        'key' => 'rodrigo',
        'nombre' => 'Rodrigo Méndez Balderrama',
        'email' => 'rodrigo@mail.com',
        'pass' => 'rodrigo',
        'nacimiento' => '1993-01-10',
        'ci' => '6192834 OR',
        'sexo' => 'M',
        'telefono' => '+591 78910293',
        'ciudad' => 'Oruro (Central)',
        'ci_status' => 'rejected',
        'rechazo_motivo' => 'Cédula de Identidad vencida con fecha de expiración 2022.',
        'bg_color' => '#365314',
        'bg_grad' => '#65a30d',
        'hair_type' => 'sidepart_black',
        'skin_tone' => '#cca078',
        'clothes_color' => '#4d7c0f',
        'clothes_type' => 'shirt',
        'features' => ['mustache']
    ],
    // 14. Alejandro Ríos - Rider Habilitado (Nuevo ID 14)
    [
        'id' => 14,
        'role' => 'rider',
        'key' => 'alejandro',
        'nombre' => 'Alejandro Ríos Choque',
        'email' => 'alejandro@mail.com',
        'pass' => 'alejandro',
        'nacimiento' => '1994-03-15',
        'ci' => '6940192 LP',
        'sexo' => 'M',
        'telefono' => '+591 76192834',
        'ciudad' => 'La Paz',
        'vehiculo' => 'Yamaha FZ 150cc',
        'placa' => '5192-XYZ',
        'ci_status' => 'verified',
        'estado_aprobacion' => 'aprobado',
        'bg_color' => '#14532d',
        'bg_grad' => '#16a34a',
        'hair_type' => 'cap_back',
        'skin_tone' => '#c79267',
        'clothes_color' => '#ea580c',
        'clothes_type' => 'vest',
        'features' => ['smile']
    ],
    // 15. Valeria Mamani - Rider Habilitada (Nuevo ID 15)
    [
        'id' => 15,
        'role' => 'rider',
        'key' => 'valeria',
        'nombre' => 'Valeria Mamani Gutiérrez',
        'email' => 'valeria@mail.com',
        'pass' => 'valeria',
        'nacimiento' => '1997-10-08',
        'ci' => '7839201 LP',
        'sexo' => 'F',
        'telefono' => '+591 70583921',
        'ciudad' => 'La Paz',
        'vehiculo' => 'Suzuki GN 125cc',
        'placa' => '3948-BKL',
        'ci_status' => 'verified',
        'estado_aprobacion' => 'aprobado',
        'bg_color' => '#134e4a',
        'bg_grad' => '#0d9488',
        'hair_type' => 'ponytail_dark',
        'skin_tone' => '#cca27c',
        'clothes_color' => '#0f766e',
        'clothes_type' => 'windbreaker',
        'features' => ['smile']
    ],
    // 16. Fernando Blanco - Rider Pendiente (Nuevo ID 16)
    [
        'id' => 16,
        'role' => 'rider',
        'key' => 'fernando',
        'nombre' => 'Fernando Blanco Heredia',
        'email' => 'fernando@mail.com',
        'pass' => 'fernando',
        'nacimiento' => '2000-04-03',
        'ci' => '7482910 SC',
        'sexo' => 'M',
        'telefono' => '+591 77291048',
        'ciudad' => 'Santa Cruz',
        'vehiculo' => 'Honda CG 150cc',
        'placa' => '4729-DFA',
        'ci_status' => 'pending',
        'estado_aprobacion' => 'pendiente',
        'bg_color' => '#292524',
        'bg_grad' => '#57534e',
        'hair_type' => 'spiky_brown',
        'skin_tone' => '#f0c8a6',
        'clothes_color' => '#44403c',
        'clothes_type' => 'hoodie',
        'features' => ['smile']
    ],
    // 17. Paola Zeballos - Rider Pendiente (Nuevo ID 17)
    [
        'id' => 17,
        'role' => 'rider',
        'key' => 'paola',
        'nombre' => 'Paola Zeballos Cruz',
        'email' => 'paola@mail.com',
        'pass' => 'paola',
        'nacimiento' => '2002-09-12',
        'ci' => '8192047 CB',
        'sexo' => 'F',
        'telefono' => '+591 69482019',
        'ciudad' => 'Cochabamba',
        'vehiculo' => 'Kymco Agility 125',
        'placa' => '5821-KJT',
        'ci_status' => 'pending',
        'estado_aprobacion' => 'pendiente',
        'bg_color' => '#713f12',
        'bg_grad' => '#ca8a04',
        'hair_type' => 'straight_brown',
        'skin_tone' => '#e8bc92',
        'clothes_color' => '#eab308',
        'clothes_type' => 'vest',
        'features' => ['earrings']
    ],
    // 18. Gustavo Beltrán - Rider Rechazado (Nuevo ID 18)
    [
        'id' => 18,
        'role' => 'rider',
        'key' => 'gustavo',
        'nombre' => 'Gustavo Beltrán Soto',
        'email' => 'gustavo@mail.com',
        'pass' => 'gustavo',
        'nacimiento' => '1990-12-01',
        'ci' => '5192840 CB',
        'sexo' => 'M',
        'telefono' => '+591 75192840',
        'ciudad' => 'Cochabamba',
        'vehiculo' => 'Torito Mototaxi',
        'placa' => '2918-SOATV',
        'ci_status' => 'rejected',
        'estado_aprobacion' => 'rechazado',
        'rechazo_motivo' => 'Póliza de seguro SOAT vencida y sin inspección técnica vehicular.',
        'bg_color' => '#172554',
        'bg_grad' => '#1e40af',
        'hair_type' => 'beanie_dark',
        'skin_tone' => '#b88255',
        'clothes_color' => '#1e3a8a',
        'clothes_type' => 'sweater',
        'features' => ['beard']
    ],
    // 19. Cristian Colque - Rider Rechazado (Nuevo ID 19)
    [
        'id' => 19,
        'role' => 'rider',
        'key' => 'cristian',
        'nombre' => 'Cristian Colque Poma',
        'email' => 'cristian@mail.com',
        'pass' => 'cristian',
        'nacimiento' => '2004-05-18',
        'ci' => '9283741 LP',
        'sexo' => 'M',
        'telefono' => '+591 78201934',
        'ciudad' => 'La Paz',
        'vehiculo' => 'Bicicleta Sin Casco',
        'placa' => 'S/P',
        'ci_status' => 'rejected',
        'estado_aprobacion' => 'rechazado',
        'rechazo_motivo' => 'No presentó certificado de antecedentes policiales ni licencia vehicular.',
        'bg_color' => '#3b0764',
        'bg_grad' => '#6b21a8',
        'hair_type' => 'messy_dark',
        'skin_tone' => '#d09b6e',
        'clothes_color' => '#581c87',
        'clothes_type' => 'tshirt',
        'features' => []
    ]
];

// Helper para generar avatar SVG distintivo
function generateAvatarSvg($u) {
    $bg1 = $u['bg_color'];
    $bg2 = $u['bg_grad'];
    $skin = $u['skin_tone'];
    $cloth = $u['clothes_color'];

    $hairSvg = '';
    switch ($u['hair_type']) {
        case 'long_brown':
            $hairSvg = '<path d="M 60 120 C 60 60 140 60 140 120 C 145 160 145 200 135 220 L 125 180 C 120 140 80 140 75 180 L 65 220 Z" fill="#451a03"/>';
            break;
        case 'curly_dark':
            $hairSvg = '<ellipse cx="100" cy="85" rx="42" ry="30" fill="#1c1917"/><circle cx="68" cy="88" r="14" fill="#1c1917"/><circle cx="132" cy="88" r="14" fill="#1c1917"/><circle cx="100" cy="68" r="14" fill="#1c1917"/>';
            break;
        case 'wavy_dark':
            $hairSvg = '<path d="M 62 110 C 62 65 138 65 138 110 C 142 150 135 190 128 210 L 120 160 C 115 130 85 130 80 160 L 72 210 Z" fill="#1e1b4b"/>';
            break;
        case 'messy_brown':
            $hairSvg = '<path d="M 65 105 C 65 65 135 65 135 105 C 135 105 125 75 100 80 C 75 75 65 105 65 105 Z" fill="#78350f"/>';
            break;
        case 'bun_blonde':
            $hairSvg = '<circle cx="100" cy="55" r="22" fill="#ca8a04"/><ellipse cx="100" cy="90" rx="36" ry="26" fill="#ca8a04"/>';
            break;
        case 'braids_dark':
            $hairSvg = '<ellipse cx="100" cy="90" rx="38" ry="26" fill="#171717"/><rect x="65" y="110" width="10" height="90" rx="5" fill="#171717"/><rect x="125" y="110" width="10" height="90" rx="5" fill="#171717"/>';
            break;
        case 'sidepart_black':
            $hairSvg = '<path d="M 66 100 C 66 65 134 65 134 100 L 125 80 C 105 75 75 80 66 100 Z" fill="#171717"/>';
            break;
        case 'bandana_dark':
            $hairSvg = '<path d="M 64 95 C 64 70 136 70 136 95 Z" fill="#0f172a"/><rect x="62" y="86" width="76" height="15" rx="4" fill="#ea580c"/>';
            break;
        case 'cap_back':
            $hairSvg = '<ellipse cx="100" cy="85" rx="38" ry="22" fill="#ea580c"/><rect x="80" y="88" width="40" height="8" rx="4" fill="#c2410c"/>';
            break;
        case 'ponytail_dark':
            $hairSvg = '<ellipse cx="100" cy="90" rx="36" ry="26" fill="#1c1917"/><path d="M 130 95 C 150 95 160 130 145 160 C 140 140 135 120 130 95 Z" fill="#1c1917"/>';
            break;
        case 'buzzcut_black':
            $hairSvg = '<ellipse cx="100" cy="95" rx="36" ry="25" fill="#262626"/>';
            break;
        case 'beanie_dark':
            $hairSvg = '<ellipse cx="100" cy="82" rx="38" ry="26" fill="#334155"/><rect x="62" y="82" width="76" height="14" rx="4" fill="#1e293b"/>';
            break;
        case 'formal_dark':
            $hairSvg = '<path d="M 66 98 C 66 66 134 66 134 98 C 120 80 80 80 66 98 Z" fill="#0f172a"/>';
            break;
        default:
            $hairSvg = '<ellipse cx="100" cy="90" rx="36" ry="24" fill="#292524"/>';
            break;
    }

    $extraSvg = '';
    if (in_array('glasses', $u['features'])) {
        $extraSvg .= '<rect x="74" y="104" width="22" height="15" rx="4" fill="none" stroke="#0f172a" stroke-width="3"/>' .
                     '<rect x="104" y="104" width="22" height="15" rx="4" fill="none" stroke="#0f172a" stroke-width="3"/>' .
                     '<line x1="96" y1="111" x2="104" y2="111" stroke="#0f172a" stroke-width="3"/>';
    }
    if (in_array('beard', $u['features'])) {
        $extraSvg .= '<path d="M 78 128 C 82 152 118 152 122 128 C 122 145 78 145 78 128 Z" fill="#1c1917"/>';
    }
    if (in_array('mustache', $u['features'])) {
        $extraSvg .= '<path d="M 88 126 Q 100 120 112 126 Q 100 132 88 126 Z" fill="#171717"/>';
    }
    if (in_array('earrings', $u['features'])) {
        $extraSvg .= '<circle cx="64" cy="118" r="3" fill="#facc15"/><circle cx="136" cy="118" r="3" fill="#facc15"/>';
    }
    if (in_array('tie', $u['features'])) {
        $extraSvg .= '<polygon points="97,148 103,148 105,185 100,192 95,185" fill="#f59e0b"/>';
    }

    $smileSvg = in_array('smile', $u['features']) 
        ? '<path d="M 90 128 Q 100 136 110 128" stroke="#78350f" stroke-width="2.5" fill="none" stroke-linecap="round"/>' 
        : '<line x1="92" y1="129" x2="108" y2="129" stroke="#78350f" stroke-width="2" stroke-linecap="round"/>';

    return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
    <defs>
        <linearGradient id="bgGrad_{$u['id']}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="{$bg1}"/>
            <stop offset="100%" stop-color="{$bg2}"/>
        </linearGradient>
    </defs>
    <rect width="200" height="200" rx="100" fill="url(#bgGrad_{$u['id']})"/>
    {$hairSvg}
    <rect x="91" y="125" width="18" height="25" fill="{$skin}"/>
    <ellipse cx="100" cy="112" rx="34" ry="40" fill="{$skin}"/>
    <circle cx="87" cy="110" r="3" fill="#1e293b"/>
    <circle cx="113" cy="110" r="3" fill="#1e293b"/>
    <path d="M 81 102 Q 87 99 93 102" stroke="#451a03" stroke-width="2" fill="none"/>
    <path d="M 107 102 Q 113 99 119 102" stroke="#451a03" stroke-width="2" fill="none"/>
    <path d="M 100 111 L 98 120 L 102 120" stroke="#b45309" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    {$smileSvg}
    {$extraSvg}
    <path d="M 40 200 C 40 155 80 148 100 148 C 120 148 160 155 160 200 Z" fill="{$cloth}"/>
</svg>
SVG;
}

// Helper para generar C.I. Oficial SVG
function generateCiSvg($u) {
    $avatarSvg = generateAvatarSvg($u);
    $innerAvatar = preg_replace('/<\?xml.*?\?>/i', '', $avatarSvg);
    $innerAvatar = preg_replace('/<svg[^>]*>/i', '', $innerAvatar);
    $innerAvatar = str_replace('</svg>', '', $innerAvatar);

    $statusLabel = ($u['ci_status'] === 'verified') ? 'VERIFICADO · HABILITADO' : (($u['ci_status'] === 'rejected') ? 'RECHAZADO · DENEGADO' : 'PENDIENTE DE VALIDACIÓN');
    $statusColor = ($u['ci_status'] === 'verified') ? '#10b981' : (($u['ci_status'] === 'rejected') ? '#ef4444' : '#f59e0b');
    $statusBg = ($u['ci_status'] === 'verified') ? 'rgba(16, 185, 129, 0.15)' : (($u['ci_status'] === 'rejected') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)');

    $nombre = htmlspecialchars($u['nombre'], ENT_QUOTES, 'UTF-8');
    $ci = htmlspecialchars($u['ci'], ENT_QUOTES, 'UTF-8');
    $nac = htmlspecialchars($u['nacimiento'], ENT_QUOTES, 'UTF-8');
    $ciudad = htmlspecialchars($u['ciudad'], ENT_QUOTES, 'UTF-8');
    $sexo = $u['sexo'] === 'M' ? 'MASCULINO' : 'FEMENINO';
    $motivo = isset($u['rechazo_motivo']) ? htmlspecialchars($u['rechazo_motivo'], ENT_QUOTES, 'UTF-8') : '';

    $motivoSvg = $motivo ? <<<MOT
    <rect x="50" y="385" width="700" height="40" rx="8" fill="#450a0a" stroke="#ef4444" stroke-width="1.5"/>
    <text x="65" y="410" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="12" fill="#fca5a5" font-weight="bold">MOTIVO DE RECHAZO: {$motivo}</text>
MOT : '';

    return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="100%" height="100%">
    <defs>
        <linearGradient id="cardGrad_{$u['id']}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#1e293b"/>
        </linearGradient>
    </defs>
    <rect width="800" height="480" rx="20" fill="url(#cardGrad_{$u['id']})" stroke="#334155" stroke-width="2"/>
    <rect x="0" y="0" width="800" height="6" rx="3" fill="#dc2626"/>
    <rect x="0" y="6" width="800" height="6" fill="#eab308"/>
    <rect x="0" y="12" width="800" height="6" fill="#16a34a"/>
    <rect x="25" y="30" width="750" height="65" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1"/>
    <text x="50" y="55" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="13" font-weight="bold" fill="#f8fafc" letter-spacing="1">ESTADO PLURINACIONAL DE BOLIVIA</text>
    <text x="50" y="74" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="11" fill="#94a3b8">SERVICIO GENERAL DE IDENTIFICACIÓN PERSONAL (SEGIP) · CÉDULA DE IDENTIDAD DIGITAL</text>
    <rect x="520" y="42" width="235" height="38" rx="8" fill="{$statusBg}" stroke="{$statusColor}" stroke-width="1.5"/>
    <text x="637" y="66" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="11" font-weight="bold" fill="{$statusColor}" text-anchor="middle">{$statusLabel}</text>
    <rect x="50" y="115" width="200" height="240" rx="14" fill="#020617" stroke="#475569" stroke-width="2"/>
    <g transform="translate(50, 125) scale(1.0)">
        {$innerAvatar}
    </g>
    <rect x="50" y="325" width="200" height="30" rx="8" fill="#0f172a"/>
    <text x="150" y="345" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="11" font-weight="bold" fill="#cbd5e1" text-anchor="middle">FOTOGRAFÍA BIOMÉTRICA</text>
    <text x="280" y="140" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="11" fill="#64748b" font-weight="bold">NÚMERO DE CÉDULA DE IDENTIDAD (C.I.)</text>
    <text x="280" y="168" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="24" fill="#f97316" font-weight="bold">{$ci}</text>
    <text x="280" y="200" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="11" fill="#64748b" font-weight="bold">NOMBRE(S) Y APELLIDOS</text>
    <text x="280" y="224" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="17" fill="#f8fafc" font-weight="bold">{$nombre}</text>
    <text x="280" y="255" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="11" fill="#64748b" font-weight="bold">FECHA DE NACIMIENTO</text>
    <text x="280" y="275" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="14" fill="#cbd5e1">{$nac}</text>
    <text x="470" y="255" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="11" fill="#64748b" font-weight="bold">SEXO</text>
    <text x="470" y="275" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="14" fill="#cbd5e1">{$sexo}</text>
    <text x="280" y="305" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="11" fill="#64748b" font-weight="bold">LUGAR DE EMISIÓN / DOMICILIO</text>
    <text x="280" y="325" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="14" fill="#cbd5e1">{$ciudad}</text>
    <rect x="635" y="125" width="120" height="120" rx="10" fill="#ffffff"/>
    <rect x="645" y="135" width="30" height="30" fill="#0f172a"/><rect x="650" y="140" width="20" height="20" fill="#ffffff"/><rect x="655" y="145" width="10" height="10" fill="#0f172a"/>
    <rect x="715" y="135" width="30" height="30" fill="#0f172a"/><rect x="720" y="140" width="20" height="20" fill="#ffffff"/><rect x="725" y="145" width="10" height="10" fill="#0f172a"/>
    <rect x="645" y="205" width="30" height="30" fill="#0f172a"/><rect x="650" y="210" width="20" height="20" fill="#ffffff"/><rect x="655" y="215" width="10" height="10" fill="#0f172a"/>
    <text x="695" y="260" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="9" fill="#94a3b8" text-anchor="middle">SEGIP QR VERIFIED</text>
    {$motivoSvg}
    <rect x="25" y="440" width="750" height="25" fill="#0b1120" rx="6"/>
    <text x="40" y="457" font-family="Courier, monospace" font-size="11" fill="#64748b">
        ID-EXPEDIENTE: {$u['id']} · CI: {$ci} · BURGER 24/7 IDENTITY SHA-256
    </text>
</svg>
SVG;
}

// Helper para generar Licencia de Conducir Rider SVG
function generateLicenciaSvg($u) {
    $avatarSvg = generateAvatarSvg($u);
    $innerAvatar = preg_replace('/<\?xml.*?\?>/i', '', $avatarSvg);
    $innerAvatar = preg_replace('/<svg[^>]*>/i', '', $innerAvatar);
    $innerAvatar = str_replace('</svg>', '', $innerAvatar);

    $nombre = htmlspecialchars($u['nombre'], ENT_QUOTES, 'UTF-8');
    $ci = htmlspecialchars($u['ci'], ENT_QUOTES, 'UTF-8');
    $vehiculo = htmlspecialchars($u['vehiculo'] ?? 'Motocicleta 125cc', ENT_QUOTES, 'UTF-8');
    $placa = htmlspecialchars($u['placa'] ?? 'S/P', ENT_QUOTES, 'UTF-8');
    $estado = ($u['estado_aprobacion'] === 'aprobado') ? 'VIGENTE · HABILITADO' : (($u['estado_aprobacion'] === 'rechazado') ? 'REVOCADA / RECHAZADA' : 'EN TRÁMITE');
    $color = ($u['estado_aprobacion'] === 'aprobado') ? '#10b981' : (($u['estado_aprobacion'] === 'rechazado') ? '#ef4444' : '#f59e0b');

    return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="100%" height="100%">
    <defs>
        <linearGradient id="licBg_{$u['id']}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#1e1b4b"/>
            <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
    </defs>
    <rect width="800" height="480" rx="18" fill="url(#licBg_{$u['id']})" stroke="#3b82f6" stroke-width="2"/>
    <rect x="25" y="25" width="750" height="70" rx="10" fill="#1e293b"/>
    <text x="50" y="52" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="14" font-weight="bold" fill="#38bdf8">REPÚBLICA DE BOLIVIA · LICENCIA PARA CONDUCIR VEHÍCULOS</text>
    <text x="50" y="74" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="11" fill="#94a3b8">SEGIP - DIRECCIÓN NACIONAL DE TRÁNSITO · CATEGORÍA 'A' (MOTOCICLISTA PROFESIONAL)</text>
    <rect x="540" y="40" width="215" height="38" rx="8" fill="rgba(0,0,0,0.3)" stroke="{$color}" stroke-width="1.5"/>
    <text x="647" y="64" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="11" font-weight="bold" fill="{$color}" text-anchor="middle">{$estado}</text>
    <rect x="50" y="115" width="190" height="230" rx="12" fill="#020617" stroke="#3b82f6" stroke-width="1.5"/>
    <g transform="translate(45, 120)">
        {$innerAvatar}
    </g>
    <text x="270" y="145" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="11" fill="#94a3b8" font-weight="bold">CONDUCTOR TITULAR</text>
    <text x="270" y="172" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="19" fill="#f8fafc" font-weight="bold">{$nombre}</text>
    <text x="270" y="210" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="11" fill="#94a3b8" font-weight="bold">C.I. / NÚMERO DE LICENCIA</text>
    <text x="270" y="235" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="16" fill="#38bdf8" font-weight="bold">{$ci}</text>
    <text x="270" y="275" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="11" fill="#94a3b8" font-weight="bold">VEHÍCULO AUTORIZADO</text>
    <text x="270" y="298" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="15" fill="#f1f5f9">{$vehiculo} (Placa: {$placa})</text>
    <text x="270" y="335" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="11" fill="#94a3b8" font-weight="bold">VIGENCIA OFICIAL</text>
    <text x="270" y="355" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="13" fill="#cbd5e1">2024 - 2029 (5 Años)</text>
    <circle cx="680" cy="230" r="50" fill="none" stroke="#38bdf8" stroke-dasharray="4" stroke-width="2"/>
    <text x="680" y="225" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="10" fill="#38bdf8" font-weight="bold" text-anchor="middle">TRÁNSITO</text>
    <text x="680" y="240" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="9" fill="#38bdf8" text-anchor="middle">BOLIVIA</text>
    <rect x="25" y="420" width="750" height="35" rx="6" fill="#0f172a"/>
    <text x="45" y="442" font-family="Courier, monospace" font-size="11" fill="#64748b">
        LIC-DOC-RIDER: {$u['id']} · CATEGORÍA A · SEGIP AUTORIZADO
    </text>
</svg>
SVG;
}

// Helper para generar Seguro SOAT SVG
function generateSoatSvg($u) {
    $nombre = htmlspecialchars($u['nombre'], ENT_QUOTES, 'UTF-8');
    $placa = htmlspecialchars($u['placa'] ?? 'S/P', ENT_QUOTES, 'UTF-8');
    $vehiculo = htmlspecialchars($u['vehiculo'] ?? 'Moto', ENT_QUOTES, 'UTF-8');
    $estado = ($u['estado_aprobacion'] === 'aprobado') ? 'PÓLIZA VIGENTE' : (($u['estado_aprobacion'] === 'rechazado') ? 'PÓLIZA VENCIDA' : 'VERIFICACIÓN PENDIENTE');
    $color = ($u['estado_aprobacion'] === 'aprobado') ? '#10b981' : (($u['estado_aprobacion'] === 'rechazado') ? '#ef4444' : '#f59e0b');

    return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="100%" height="100%">
    <rect width="800" height="480" rx="16" fill="#064e3b" stroke="#10b981" stroke-width="2"/>
    <rect x="25" y="25" width="750" height="70" rx="10" fill="#022c22"/>
    <text x="50" y="52" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="16" font-weight="bold" fill="#34d399">UNIVIDA S.A. · SEGURO OBLIGATORIO DE ACCIDENTES DE TRÁNSITO (SOAT)</text>
    <text x="50" y="74" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="11" fill="#a7f3d0">COBERTURA NACIONAL TOTAL PARA MOTOCICLETAS Y VEHÍCULOS DE REPARTO</text>
    <rect x="540" y="40" width="215" height="38" rx="8" fill="rgba(0,0,0,0.4)" stroke="{$color}" stroke-width="1.5"/>
    <text x="647" y="64" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="12" font-weight="bold" fill="{$color}" text-anchor="middle">{$estado}</text>
    <rect x="50" y="120" width="700" height="280" rx="12" fill="#022c22" stroke="#047857" stroke-width="1.5"/>
    <text x="80" y="160" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="12" fill="#6ee7b7" font-weight="bold">TITULAR ASEGURADO</text>
    <text x="80" y="190" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="20" fill="#f8fafc" font-weight="bold">{$nombre}</text>
    <text x="80" y="240" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="12" fill="#6ee7b7" font-weight="bold">PLACA REGISTRADA</text>
    <text x="80" y="268" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="22" fill="#facc15" font-weight="bold">{$placa}</text>
    <text x="380" y="240" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="12" fill="#6ee7b7" font-weight="bold">MODELO DEL VEHÍCULO</text>
    <text x="380" y="268" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="18" fill="#f8fafc">{$vehiculo}</text>
    <text x="80" y="320" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="12" fill="#6ee7b7" font-weight="bold">PERIODO DE COBERTURA</text>
    <text x="80" y="345" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="14" fill="#f1f5f9">01/ENE/2026 HASTA 31/DIC/2026</text>
    <rect x="610" y="150" width="110" height="110" rx="8" fill="#ffffff"/>
    <rect x="620" y="160" width="30" height="30" fill="#022c22"/>
    <rect x="680" y="160" width="30" height="30" fill="#022c22"/>
    <rect x="620" y="220" width="30" height="30" fill="#022c22"/>
    <text x="665" y="280" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="9" fill="#a7f3d0" text-anchor="middle">SOAT ELECTRÓNICO</text>
    <rect x="25" y="425" width="750" height="30" rx="6" fill="#022c22"/>
    <text x="45" y="445" font-family="Courier, monospace" font-size="11" fill="#6ee7b7">
        POLIZA-UNIVIDA: SOAT-2026-{$u['id']} · ASOCIADO A BURGER 24/7 LOGISTICS
    </text>
</svg>
SVG;
}

// Helper para generar CV Profesional SVG
function generateCvSvg($u) {
    $nombre = htmlspecialchars($u['nombre'], ENT_QUOTES, 'UTF-8');
    $ci = htmlspecialchars($u['ci'], ENT_QUOTES, 'UTF-8');
    $vehiculo = htmlspecialchars($u['vehiculo'] ?? 'Moto', ENT_QUOTES, 'UTF-8');
    $telefono = htmlspecialchars($u['telefono'], ENT_QUOTES, 'UTF-8');
    $ciudad = htmlspecialchars($u['ciudad'], ENT_QUOTES, 'UTF-8');

    return <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520" width="100%" height="100%">
    <rect width="800" height="520" rx="14" fill="#0f172a" stroke="#475569" stroke-width="2"/>
    <rect x="30" y="30" width="740" height="75" rx="8" fill="#1e293b"/>
    <text x="50" y="60" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="18" font-weight="bold" fill="#f8fafc">CURRÍCULUM VITAE · EXPEDIENTE LABORAL DE REPARTIDOR</text>
    <text x="50" y="82" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="11" fill="#94a3b8">BURGER 24/7 LOGISTICS FLEET · REGISTRO DOCUMENTAL DE RECURSOS HUMANOS</text>
    <text x="50" y="135" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="11" fill="#f97316" font-weight="bold">DATOS GENERALES</text>
    <text x="50" y="160" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="16" fill="#f1f5f9" font-weight="bold">{$nombre}</text>
    <text x="50" y="180" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="12" fill="#cbd5e1">C.I.: {$ci} · Teléfono: {$telefono} · Radicatoria: {$ciudad}</text>
    <text x="50" y="225" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="11" fill="#f97316" font-weight="bold">UNIDAD VEHICULAR ASIGNADA</text>
    <text x="50" y="248" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="14" fill="#f1f5f9">Vehículo: {$vehiculo}</text>
    <text x="50" y="268" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="12" fill="#94a3b8">Caja térmica aislante, soporte celular GPS impermeable y casco reglamentario.</text>
    <text x="50" y="315" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="11" fill="#f97316" font-weight="bold">EXPERIENCIA EN REPARTO URBANO</text>
    <text x="50" y="338" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="13" fill="#cbd5e1">• Manejo de rutas metropolitanas, geolocalización en tiempo real y cobranza contraentrega.</text>
    <text x="50" y="358" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="13" fill="#cbd5e1">• Capacitación en manipulación higiénica de alimentos y protocolo de atención al cliente.</text>
    <text x="50" y="378" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="13" fill="#cbd5e1">• Historial libre de incidentes de tránsito graves y disponibilidad de turnos rotativos 24/7.</text>
    <rect x="30" y="440" width="740" height="50" rx="8" fill="#1e293b"/>
    <text x="50" y="470" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-size="11" fill="#94a3b8">
        EXPEDIENTE AUDITADO POR BURGER 24/7 · SELLO DIGITAL DE RECURSOS HUMANOS
    </text>
</svg>
SVG;
}

echo "Generando imágenes y documentos SVG para 19 usuarios...\n";

// Guardar archivos físicos
foreach ($users as $u) {
    $k = $u['key'];

    // 1. Avatar de foto
    $avatarSvg = generateAvatarSvg($u);
    file_put_contents("$ciDir/foto_{$k}.svg", $avatarSvg);
    file_put_contents("$authCiDir/foto_{$k}.svg", $avatarSvg);

    // 2. Cédula de Identidad C.I.
    $ciSvg = generateCiSvg($u);
    file_put_contents("$ciDir/ci_{$k}.svg", $ciSvg);
    file_put_contents("$authCiDir/ci_{$k}.svg", $ciSvg);

    // 3. Documentos de Rider (si corresponde)
    if ($u['role'] === 'rider') {
        $licSvg = generateLicenciaSvg($u);
        file_put_contents("$docsDir/licencia_{$k}.svg", $licSvg);
        file_put_contents("$authDocsDir/licencia_{$k}.svg", $licSvg);

        $soatSvg = generateSoatSvg($u);
        file_put_contents("$docsDir/soat_{$k}.svg", $soatSvg);
        file_put_contents("$authDocsDir/soat_{$k}.svg", $soatSvg);

        $cvSvg = generateCvSvg($u);
        file_put_contents("$docsDir/cv_{$k}.svg", $cvSvg);
        file_put_contents("$authDocsDir/cv_{$k}.svg", $cvSvg);
    }
}

echo "[OK] 19 avatares y documentos generados en disco con éxito.\n";

// Construcción del SQL Seed Completo
$sqlUsers = [];
foreach ($users as $u) {
    $hash = password_hash($u['pass'], PASSWORD_BCRYPT);
    $k = $u['key'];
    $ciUrl = "/uploads/ci/ci_{$k}.svg";
    $fotoUrl = "/uploads/ci/foto_{$k}.svg";
    $status = $u['ci_status'];
    $role = $u['role'];
    $nombre = addslashes($u['nombre']);
    $email = $u['email'];
    $nac = $u['nacimiento'];
    $id = $u['id'];

    $sqlUsers[] = "($id, '$role', '$nombre', '$email', '$hash', '$nac', '$ciUrl', '$fotoUrl', '$status', 3, 3)";
}

$sqlDocs = [];
$docId = 1;
foreach ($users as $u) {
    if ($u['role'] === 'rider') {
        $k = $u['key'];
        $riderId = $u['id'];
        $licUrl = "/uploads/docs/licencia_{$k}.svg";
        $soatUrl = "/uploads/docs/soat_{$k}.svg";
        $cvUrl = "/uploads/docs/cv_{$k}.svg";
        $estado = $u['estado_aprobacion'];
        $sqlDocs[] = "($docId, $riderId, '$licUrl', '$soatUrl', '$cvUrl', '$estado', 3, 3)";
        $docId++;
    }
}

// Generar pedidos de ejemplo
$sqlPedidos = [
    "(1, 1, 2, 'liquidado', 'entregado', 45.00, -16.50200000, -68.13100000, NULL, 1, 3)",
    "(2, 8, 14, 'pagado_qr', 'entregado', 58.00, -16.50800000, -68.13300000, '/uploads/qr/comprobante_andrea.jpg', 8, 14)",
    "(3, 9, 15, 'contraentrega', 'en_camino', 78.00, -16.51200000, -68.12500000, NULL, 9, 15)",
    "(4, 1, 2, 'contraentrega', 'asignado', 34.00, -16.50400000, -68.12900000, NULL, 1, 3)",
    "(5, 8, NULL, 'esperando_pago', 'pendiente', 44.00, -16.50900000, -68.13400000, NULL, 8, 8)"
];

$sqlDetalles = [
    "(1, 1, 1, 1, 22.00, 1, 1)",
    "(2, 1, 7, 1, 14.00, 1, 1)",
    "(3, 1, 10, 1, 6.00, 1, 1)",
    "(4, 2, 2, 1, 32.00, 8, 8)",
    "(5, 2, 12, 2, 12.00, 8, 8)",
    "(6, 2, 11, 1, 6.00, 8, 8)",
    "(7, 3, 4, 1, 45.00, 9, 9)",
    "(8, 3, 5, 1, 34.00, 9, 9)",
    "(9, 4, 5, 1, 34.00, 1, 1)",
    "(10, 5, 6, 1, 44.00, 8, 8)"
];

$completeSql = <<<SQL
-- ============================================================================
-- Burger 24/7 - Script de Instalación Idempotente de Base de Datos
-- Base de Datos: burger_shop (MySQL 8.0+ / MariaDB 10.4+ / XAMPP)
-- Juego de Caracteres: utf8mb4 / Collation: utf8mb4_unicode_ci
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `burger_shop` 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE `burger_shop`;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Tabla de Usuarios (users)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    `role` ENUM('cliente', 'rider', 'super_usuario') NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    ci_url VARCHAR(255),
    foto_url VARCHAR(255),
    ci_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla de Productos y Catálogo (productos)
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    categoria VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    marca VARCHAR(255) NOT NULL,
    sabor VARCHAR(255),
    precio DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla de Pedidos (pedidos)
CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    rider_id INT,
    estado_pago ENUM('esperando_pago', 'qr', 'contraentrega', 'pagado_qr', 'pagado_efectivo', 'cancelado', 'liquidado') NOT NULL DEFAULT 'esperando_pago',
    estado_pedido ENUM('pendiente', 'asignado', 'en_camino', 'entregado', 'cancelado') NOT NULL DEFAULT 'pendiente',
    total DECIMAL(10, 2) NOT NULL,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    qr_comprobante_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (cliente_id) REFERENCES users(id),
    FOREIGN KEY (rider_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabla de Detalles del Pedido (pedido_detalles)
CREATE TABLE IF NOT EXISTS pedido_detalles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabla de Documentación de Riders (documentacion_rider)
CREATE TABLE IF NOT EXISTS documentacion_rider (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rider_id INT NOT NULL UNIQUE,
    licencia_url VARCHAR(255) NOT NULL,
    seguro_url VARCHAR(255) NOT NULL,
    cv_url VARCHAR(255) NOT NULL,
    estado_aprobacion ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (rider_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabla de Auditoría Inmutable (auditoria_logs)
CREATE TABLE IF NOT EXISTS auditoria_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tabla_afectada VARCHAR(255) NOT NULL,
    registro_id INT NOT NULL,
    accion ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    datos_anteriores JSON,
    datos_nuevos JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SEED DATA COMPLETO (19 USUARIOS REALES BCRYPT CON FOTOS Y DOCUMENTOS)
-- ============================================================================

INSERT INTO users (id, `role`, nombre, email, password_hash, fecha_nacimiento, ci_url, foto_url, ci_status, created_by, updated_by) VALUES
SQL
. implode(",\n", $sqlUsers) .
<<<SQL

ON DUPLICATE KEY UPDATE 
    password_hash = VALUES(password_hash),
    ci_status = VALUES(ci_status),
    foto_url = VALUES(foto_url),
    ci_url = VALUES(ci_url),
    `role` = VALUES(`role`),
    nombre = VALUES(nombre);

-- Catálogo de Productos (Hamburguesas, Combos, Acompañamientos, Bebidas)
INSERT INTO productos (id, categoria, nombre, marca, sabor, precio, stock, created_by, updated_by) VALUES
(1, 'Hamburguesas', 'Hamburguesa Clásica Simple', 'Burger 24/7', 'Carne 150g, lechuga, tomate y salsa especial', 22.00, 85, 3, 3),
(2, 'Hamburguesas', 'Doble Queso Smash Burger', 'Gourmet', 'Doble medallón smash, queso cheddar x2 y cebolla grillada', 32.00, 70, 3, 3),
(3, 'Hamburguesas', 'Bacon BBQ Crunch', 'Especial', 'Tocino ahumado crocante, salsa BBQ dulce y queso americano', 36.00, 65, 3, 3),
(4, 'Hamburguesas', 'Monster Triple Burger', 'Extrema', 'Triple carne, huevo frito, tocino, queso y pepinillos', 45.00, 40, 3, 3),
(5, 'Combos', 'Combo Clásico con Papas y Soda', 'Combos', 'Hamburguesa Clásica + Papas Medianas + Coca-Cola 500ml', 34.00, 50, 3, 3),
(6, 'Combos', 'Combo Doble Smash + Papas Grandes', 'Combos', 'Doble Smash Cheddar + Papas Rústicas + Bebida 500ml', 44.00, 45, 3, 3),
(7, 'Acompañamientos', 'Papas Fritas Rústicas', 'Sides', 'Papas crocantes con sal marina y salsa tártara de la casa', 14.00, 120, 3, 3),
(8, 'Acompañamientos', 'Aros de Cebolla Crocantes', 'Sides', '8 aros crujientes empanizados con dip BBQ', 16.00, 80, 3, 3),
(9, 'Acompañamientos', 'Nuggets de Pollo Crispy (6 uds)', 'Sides', 'Pechuga crocante con salsa de mostaza miel', 18.00, 90, 3, 3),
(10, 'Bebidas', 'Coca-Cola Original 500ml', 'Coca-Cola', 'Original Fría', 6.00, 200, 3, 3),
(11, 'Bebidas', 'Sprite Lima-Limón 500ml', 'Sprite', 'Refrescante Fría', 6.00, 150, 3, 3),
(12, 'Bebidas', 'Limonada Frozen con Menta', 'Burger 24/7', 'Refrescante, limón natural y menta fresca', 12.00, 100, 3, 3)
ON DUPLICATE KEY UPDATE 
    categoria = VALUES(categoria),
    nombre = VALUES(nombre),
    precio = VALUES(precio),
    stock = VALUES(stock);

-- Documentación de Riders (9 expedientes vehiculares)
INSERT INTO documentacion_rider (id, rider_id, licencia_url, seguro_url, cv_url, estado_aprobacion, created_by, updated_by) VALUES
SQL
. implode(",\n", $sqlDocs) .
<<<SQL

ON DUPLICATE KEY UPDATE 
    licencia_url = VALUES(licencia_url),
    seguro_url = VALUES(seguro_url),
    cv_url = VALUES(cv_url),
    estado_aprobacion = VALUES(estado_aprobacion);

-- Pedidos Iniciales de Demostración
INSERT INTO pedidos (id, cliente_id, rider_id, estado_pago, estado_pedido, total, latitud, longitud, qr_comprobante_url, created_by, updated_by) VALUES
SQL
. implode(",\n", $sqlPedidos) .
<<<SQL

ON DUPLICATE KEY UPDATE
    estado_pago = VALUES(estado_pago),
    estado_pedido = VALUES(estado_pedido),
    total = VALUES(total);

-- Detalles de Pedidos
INSERT INTO pedido_detalles (id, pedido_id, producto_id, cantidad, precio_unitario, created_by, updated_by) VALUES
SQL
. implode(",\n", $sqlDetalles) .
<<<SQL

ON DUPLICATE KEY UPDATE
    cantidad = VALUES(cantidad),
    precio_unitario = VALUES(precio_unitario);

-- Auditoría Inicial
INSERT INTO auditoria_logs (id, tabla_afectada, registro_id, accion, datos_anteriores, datos_nuevos, ip_address, created_by, updated_by) VALUES
(1, 'users', 3, 'INSERT', NULL, '{"nombre":"Admin Central (Gerencia)","role":"super_usuario"}', '127.0.0.1', 3, 3)
ON DUPLICATE KEY UPDATE accion = VALUES(accion);

SET FOREIGN_KEY_CHECKS = 1;
SQL;

file_put_contents("$rootDir/install_db.sql", $completeSql);
file_put_contents("$rootDir/init_schema.sql", $completeSql);

echo "[EXITO] install_db.sql e init_schema.sql actualizados con los 19 usuarios y expedientes completos.\n";

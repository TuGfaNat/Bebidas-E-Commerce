-- ============================================================================
-- Sistema E-commerce Burger 24/7 - DDL Completo de Base de Datos
-- Compatible con importación directa en dbdiagram.io (Import > MySQL)
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    `role` ENUM('cliente', 'rider', 'super_usuario') NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    ci_url VARCHAR(255),
    ci_reverso_url VARCHAR(255),
    foto_url VARCHAR(255),
    ci_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    direccion VARCHAR(255) DEFAULT NULL,
    telefono VARCHAR(50) DEFAULT NULL,
    motivo_rechazo TEXT,
    apelacion_motivo TEXT,
    apelacion_estado ENUM('ninguna', 'pendiente', 'resuelta') DEFAULT 'ninguna',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

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
);

CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    rider_id INT,
    estado_pago ENUM('esperando_pago', 'qr', 'contraentrega', 'pagado_qr', 'pagado_efectivo', 'cancelado', 'liquidado') NOT NULL DEFAULT 'esperando_pago',
    estado_pedido ENUM('pendiente', 'asignado', 'en_camino', 'entregado', 'cancelado') NOT NULL DEFAULT 'pendiente',
    total DECIMAL(10, 2) NOT NULL,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    direccion_entrega VARCHAR(255) DEFAULT NULL,
    referencia_entrega VARCHAR(255) DEFAULT NULL,
    telefono_contacto VARCHAR(50) DEFAULT NULL,
    qr_comprobante_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (cliente_id) REFERENCES users(id),
    FOREIGN KEY (rider_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

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
);

CREATE TABLE IF NOT EXISTS documentacion_rider (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rider_id INT NOT NULL UNIQUE,
    licencia_url VARCHAR(255) NOT NULL,
    licencia_reverso_url VARCHAR(255),
    seguro_url VARCHAR(255) NOT NULL,
    cv_url VARCHAR(255) NOT NULL,
    estado_aprobacion ENUM('pendiente', 'aprobado', 'rechazado') DEFAULT 'pendiente',
    motivo_rechazo TEXT,
    apelacion_motivo TEXT,
    apelacion_estado ENUM('ninguna', 'pendiente', 'resuelta') DEFAULT 'ninguna',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (rider_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

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
);

CREATE TABLE IF NOT EXISTS configuracion_pagos (
    id INT PRIMARY KEY DEFAULT 1,
    banco VARCHAR(100) NOT NULL DEFAULT 'Banco Unión',
    titular VARCHAR(150) NOT NULL DEFAULT 'Burger 24/7 S.R.L. (Admin Central)',
    cuenta VARCHAR(50) NOT NULL DEFAULT '100000482910',
    alias_qr VARCHAR(100) NOT NULL DEFAULT 'burger247@banco',
    qr_imagen_url VARCHAR(255) DEFAULT NULL,
    modo_qr ENUM('dinamico', 'subido', 'hibrido') NOT NULL DEFAULT 'hibrido',
    costo_fijo DECIMAL(10,2) DEFAULT NULL,
    instrucciones TEXT DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS configuracion_tienda (
    id INT PRIMARY KEY DEFAULT 1,
    nombre_tienda VARCHAR(150) NOT NULL DEFAULT 'Burger 24/7 - Central Sopocachi',
    direccion VARCHAR(255) NOT NULL DEFAULT 'Av. 20 de Octubre #2150, Sopocachi, La Paz',
    zona VARCHAR(100) NOT NULL DEFAULT 'Sopocachi',
    telefono VARCHAR(50) NOT NULL DEFAULT '+591 71234567',
    latitud DECIMAL(10,8) NOT NULL DEFAULT -16.50742100,
    longitud DECIMAL(11,8) NOT NULL DEFAULT -68.13098200,
    horario_apertura VARCHAR(100) NOT NULL DEFAULT '18:00 - 02:00',
    tiempo_estimado_min INT NOT NULL DEFAULT 35,
    costo_envio_base DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT DEFAULT NULL
);

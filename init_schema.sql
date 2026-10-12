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

-- Limpieza de tablas previas obsoletas para asegurar esquema integro y evitar error #1054
DROP TABLE IF EXISTS auditoria_logs;
DROP TABLE IF EXISTS pedido_detalles;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS documentacion_rider;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS configuracion_tienda;
DROP TABLE IF EXISTS configuracion_pagos;
DROP TABLE IF EXISTS users;

-- 1. Tabla de Usuarios (users)
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

INSERT INTO users (id, `role`, nombre, email, password_hash, fecha_nacimiento, ci_url, ci_reverso_url, foto_url, ci_status, motivo_rechazo, created_by, updated_by) VALUES
(1, 'cliente', 'Carlos Pérez Mendoza', 'carlos@mail.com', '$2y$12$oBrJVxe/.0RYwzHKH5.zo.c8Wdzt4cLP9wyYfbgQAfAxebAArj7/O', '1995-04-12', '/uploads/ci/carnet_bueno_1.jpg', '/uploads/ci/carnet_bueno_2.jpg', '/uploads/ci/foto_carlos.svg', 'verified', NULL, 3, 3),
(2, 'rider', 'Pedro Gómez Alarcón', 'pedro@mail.com', '$2y$12$kwaN4pWuH0ADm/j14Sx5UOY0exD2qoDG23WO/mWHkHz.6jXTTw5t2', '1992-08-25', '/uploads/ci/carnet_bueno_1.jpg', '/uploads/ci/carnet_bueno_2.jpg', '/uploads/ci/foto_pedro.svg', 'verified', NULL, 3, 3),
(3, 'super_usuario', 'Admin Central (Gerencia)', 'admin@mail.com', '$2y$12$OVN/UBcNDnmSSfTLofnU6evA8C94ZP51xwHBNnkffR32/B.GigQsy', '1988-11-03', '/uploads/ci/carnet_bueno_1.jpg', '/uploads/ci/carnet_bueno_2.jpg', '/uploads/ci/foto_admin.svg', 'verified', NULL, 3, 3),
(4, 'cliente', 'María López Guzmán', 'maria@mail.com', '$2y$12$utDBlLZhtTPMP4HdEDfMIuRsfz2/RdpioV1xq7BCc7VGcJq.1NnfC', '2001-02-14', '/uploads/ci/carnet_revision.jpg', '/uploads/ci/carnet_bueno_2.jpg', '/uploads/ci/foto_maria.svg', 'pending', NULL, 3, 3),
(5, 'rider', 'Juan Rodríguez Ticona', 'juan@mail.com', '$2y$12$DBACYNEPH.B6bfAP5rWonebq2K/b/k4XIYCySAVQm8OC/eJcksd/C', '1999-07-19', '/uploads/ci/carnet_revision.jpg', '/uploads/ci/carnet_bueno_2.jpg', '/uploads/ci/foto_juan.svg', 'pending', NULL, 3, 3),
(6, 'cliente', 'Roberto Flores Arze', 'roberto@mail.com', '$2y$12$rvtYrne0C1twsJXm8sdV4e7q/UFmuax2l8QLaC4MHdqaW88smgbh2', '1996-05-20', '/uploads/ci/carnet_malo.jpg', '/uploads/ci/carnet_malo.jpg', '/uploads/ci/foto_roberto.svg', 'rejected', 'Fotografía de documento ilegible o con reflejos que impiden la verificación.', 3, 3),
(7, 'rider', 'Marcos Vargas Huanca', 'marcos@mail.com', '$2y$12$AJ4nPCvRsjdatgrFECtYpOLUKW9BIVJlR/XUesZVlY9bTSF4D4wLe', '1994-09-10', '/uploads/ci/carnet_malo.jpg', '/uploads/ci/carnet_malo.jpg', '/uploads/ci/foto_marcos.svg', 'rejected', 'Fotografía de documento ilegible o con reflejos que impiden la verificación.', 3, 3),
(8, 'cliente', 'Andrea Morales Ramos', 'andrea@mail.com', '$2y$12$2Jsvn3tAFrrLTAleVB33wuT20znjf172KrwtmlK0ZNGh9jMmDy7Nm', '1998-09-18', '/uploads/ci/carnet_bueno_1.jpg', '/uploads/ci/carnet_bueno_2.jpg', '/uploads/ci/foto_andrea.svg', 'verified', NULL, 3, 3),
(9, 'cliente', 'Gonzalo Salinas Castro', 'gonzalo@mail.com', '$2y$12$.tQkS5VoaBsMbYyjbNRMUuv5c/lLiCqUMH4.nm/mxsWcjEZH63Oo.', '1991-12-05', '/uploads/ci/carnet_bueno_1.jpg', '/uploads/ci/carnet_bueno_2.jpg', '/uploads/ci/foto_gonzalo.svg', 'verified', NULL, 3, 3),
(10, 'cliente', 'Diego Quiroga Flores', 'diego@mail.com', '$2y$12$lcUy.pf72uRvgTaEFt/ebeWC3fcWkliznJcN/ObIol55L7kj2u9gS', '2003-06-22', '/uploads/ci/carnet_revision.jpg', '/uploads/ci/carnet_bueno_2.jpg', '/uploads/ci/foto_diego.svg', 'pending', NULL, 3, 3),
(11, 'cliente', 'Camila Navarro Torrez', 'camila@mail.com', '$2y$12$1tiueWslGF863S79C6Sd3OVWljktMi5Xo6MJXvNZo/EKRM50Hs7wy', '2000-11-30', '/uploads/ci/carnet_revision.jpg', '/uploads/ci/carnet_bueno_2.jpg', '/uploads/ci/foto_camila.svg', 'pending', NULL, 3, 3),
(12, 'cliente', 'Lucía Paredes Vega', 'lucia@mail.com', '$2y$12$xODp/G2wwRJ59RwZ.6ibb.gho6pAMC5U3s.Y6YWrPwVE7r/s1cr86', '2009-08-14', '/uploads/ci/carnet_malo.jpg', '/uploads/ci/carnet_malo.jpg', '/uploads/ci/foto_lucia.svg', 'rejected', 'Fotografía de documento ilegible o con reflejos que impiden la verificación.', 3, 3),
(13, 'cliente', 'Rodrigo Méndez Balderrama', 'rodrigo@mail.com', '$2y$12$c54SUJEWfSUCsou.nw79EOtX21ZZzCfaYvo1Z3Js.dTE2vQUyWU6.', '1993-01-10', '/uploads/ci/carnet_malo.jpg', '/uploads/ci/carnet_malo.jpg', '/uploads/ci/foto_rodrigo.svg', 'rejected', 'Fotografía de documento ilegible o con reflejos que impiden la verificación.', 3, 3),
(14, 'rider', 'Alejandro Ríos Choque', 'alejandro@mail.com', '$2y$12$SU8Kk73j13XUTerxr3dvKe1G4AgP6qSALo0Hcs4mLIWMoKlgSTFYa', '1994-03-15', '/uploads/ci/carnet_bueno_1.jpg', '/uploads/ci/carnet_bueno_2.jpg', '/uploads/ci/foto_alejandro.svg', 'verified', NULL, 3, 3),
(15, 'rider', 'Valeria Mamani Gutiérrez', 'valeria@mail.com', '$2y$12$9mdRjjqt./3au7wKmBCugu4M.x1KQLk9OoiuzQJd6CrSp8J0/dnua', '1997-10-08', '/uploads/ci/carnet_bueno_1.jpg', '/uploads/ci/carnet_bueno_2.jpg', '/uploads/ci/foto_valeria.svg', 'verified', NULL, 3, 3),
(16, 'rider', 'Fernando Blanco Heredia', 'fernando@mail.com', '$2y$12$dacn.eh4b6IJgkbZ1tNQj.UqhYlA7WZ8WQwB7SBWNGKuKRtw1HHkW', '2000-04-03', '/uploads/ci/carnet_revision.jpg', '/uploads/ci/carnet_bueno_2.jpg', '/uploads/ci/foto_fernando.svg', 'pending', NULL, 3, 3),
(17, 'rider', 'Paola Zeballos Cruz', 'paola@mail.com', '$2y$12$p9p676AErhqHgfT4p/yPuuEiBT/8526ItYPx2AO.oyzERGbVZ4ehq', '2002-09-12', '/uploads/ci/carnet_revision.jpg', '/uploads/ci/carnet_bueno_2.jpg', '/uploads/ci/foto_paola.svg', 'pending', NULL, 3, 3),
(18, 'rider', 'Gustavo Beltrán Soto', 'gustavo@mail.com', '$2y$12$rSiCmv4sRlPq2GkYt30gOOu0tMxsF5Uf5AI4hqmywdSqUlVJbMCne', '1990-12-01', '/uploads/ci/carnet_malo.jpg', '/uploads/ci/carnet_malo.jpg', '/uploads/ci/foto_gustavo.svg', 'rejected', 'Fotografía de documento ilegible o con reflejos que impiden la verificación.', 3, 3),
(19, 'rider', 'Cristian Colque Poma', 'cristian@mail.com', '$2y$12$UoB52EGEGABMB.kKveKocetQ6W0b1Slyxn7CEUJbmFvzHzaOK216q', '2004-05-18', '/uploads/ci/carnet_malo.jpg', '/uploads/ci/carnet_malo.jpg', '/uploads/ci/foto_cristian.svg', 'rejected', 'Fotografía de documento ilegible o con reflejos que impiden la verificación.', 3, 3)
ON DUPLICATE KEY UPDATE 
    email = VALUES(email),
    password_hash = VALUES(password_hash),
    ci_status = VALUES(ci_status),
    foto_url = VALUES(foto_url),
    ci_url = VALUES(ci_url),
    ci_reverso_url = VALUES(ci_reverso_url),
    motivo_rechazo = VALUES(motivo_rechazo),
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
INSERT INTO documentacion_rider (id, rider_id, licencia_url, licencia_reverso_url, seguro_url, cv_url, estado_aprobacion, motivo_rechazo, created_by, updated_by) VALUES
(1, 2, '/uploads/docs/licencia_buena.png', '/uploads/docs/Nueva-Licencia-de-Conducir-12.08.2016.png', '/uploads/docs/soat_pedro.svg', '/uploads/docs/cv_bueno.jpg', 'aprobado', NULL, 3, 3),
(2, 5, '/uploads/docs/licencia_buena.png', '/uploads/docs/Nueva-Licencia-de-Conducir-12.08.2016.png', '/uploads/docs/soat_juan.svg', '/uploads/docs/cv_bueno.jpg', 'pendiente', NULL, 3, 3),
(3, 7, '/uploads/docs/licencia_mala.jpg', '/uploads/docs/licencia_mala.jpg', '/uploads/docs/soat_marcos.svg', '/uploads/docs/cv_malo.jpg', 'rechazado', 'Licencia de conducir no vigente / Curriculum vitae ilegible.', 3, 3),
(4, 14, '/uploads/docs/licencia_buena.png', '/uploads/docs/Nueva-Licencia-de-Conducir-12.08.2016.png', '/uploads/docs/soat_alejandro.svg', '/uploads/docs/cv_bueno.jpg', 'aprobado', NULL, 3, 3),
(5, 15, '/uploads/docs/licencia_buena.png', '/uploads/docs/Nueva-Licencia-de-Conducir-12.08.2016.png', '/uploads/docs/soat_valeria.svg', '/uploads/docs/cv_bueno.jpg', 'aprobado', NULL, 3, 3),
(6, 16, '/uploads/docs/licencia_buena.png', '/uploads/docs/Nueva-Licencia-de-Conducir-12.08.2016.png', '/uploads/docs/soat_fernando.svg', '/uploads/docs/cv_bueno.jpg', 'pendiente', NULL, 3, 3),
(7, 17, '/uploads/docs/licencia_buena.png', '/uploads/docs/Nueva-Licencia-de-Conducir-12.08.2016.png', '/uploads/docs/soat_paola.svg', '/uploads/docs/cv_bueno.jpg', 'pendiente', NULL, 3, 3),
(8, 18, '/uploads/docs/licencia_mala.jpg', '/uploads/docs/licencia_mala.jpg', '/uploads/docs/soat_gustavo.svg', '/uploads/docs/cv_malo.jpg', 'rechazado', 'Licencia de conducir no vigente / Curriculum vitae ilegible.', 3, 3),
(9, 19, '/uploads/docs/licencia_mala.jpg', '/uploads/docs/licencia_mala.jpg', '/uploads/docs/soat_cristian.svg', '/uploads/docs/cv_malo.jpg', 'rechazado', 'Licencia de conducir no vigente / Curriculum vitae ilegible.', 3, 3)
ON DUPLICATE KEY UPDATE 
    licencia_url = VALUES(licencia_url),
    licencia_reverso_url = VALUES(licencia_reverso_url),
    seguro_url = VALUES(seguro_url),
    cv_url = VALUES(cv_url),
    estado_aprobacion = VALUES(estado_aprobacion),
    motivo_rechazo = VALUES(motivo_rechazo);

-- Pedidos Iniciales de Demostración
INSERT INTO pedidos (id, cliente_id, rider_id, estado_pago, estado_pedido, total, latitud, longitud, qr_comprobante_url, created_by, updated_by) VALUES(1, 1, 2, 'liquidado', 'entregado', 45.00, -16.50200000, -68.13100000, NULL, 1, 3),
(2, 8, 14, 'pagado_qr', 'entregado', 58.00, -16.50800000, -68.13300000, '/uploads/qr/comprobante_andrea.jpg', 8, 14),
(3, 9, 15, 'contraentrega', 'en_camino', 78.00, -16.51200000, -68.12500000, NULL, 9, 15),
(4, 1, 5, 'contraentrega', 'asignado', 34.00, -16.50400000, -68.12900000, NULL, 1, 3),
(5, 8, NULL, 'esperando_pago', 'pendiente', 44.00, -16.50900000, -68.13400000, NULL, 8, 8)
ON DUPLICATE KEY UPDATE
    estado_pago = VALUES(estado_pago),
    estado_pedido = VALUES(estado_pedido),
    total = VALUES(total);

-- Detalles de Pedidos
INSERT INTO pedido_detalles (id, pedido_id, producto_id, cantidad, precio_unitario, created_by, updated_by) VALUES(1, 1, 1, 1, 22.00, 1, 1),
(2, 1, 7, 1, 14.00, 1, 1),
(3, 1, 10, 1, 6.00, 1, 1),
(4, 2, 2, 1, 32.00, 8, 8),
(5, 2, 12, 2, 12.00, 8, 8),
(6, 2, 11, 1, 6.00, 8, 8),
(7, 3, 4, 1, 45.00, 9, 9),
(8, 3, 5, 1, 34.00, 9, 9),
(9, 4, 5, 1, 34.00, 1, 1),
(10, 5, 6, 1, 44.00, 8, 8)
ON DUPLICATE KEY UPDATE
    cantidad = VALUES(cantidad),
    precio_unitario = VALUES(precio_unitario);

-- Auditoría Inicial
INSERT INTO auditoria_logs (id, tabla_afectada, registro_id, accion, datos_anteriores, datos_nuevos, ip_address, created_by, updated_by) VALUES
(1, 'users', 3, 'INSERT', NULL, '{"nombre":"Admin Central (Gerencia)","role":"super_usuario"}', '127.0.0.1', 3, 3)
ON DUPLICATE KEY UPDATE accion = VALUES(accion);

-- 7. Tabla de Configuración de Pagos y Código QR Oficial
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO configuracion_pagos (id, banco, titular, cuenta, alias_qr, modo_qr, instrucciones)
VALUES (1, 'Banco Unión', 'Burger 24/7 S.R.L. (Admin Central)', '100000482910', 'burger247@banco', 'hibrido', 'Transfiere el monto exacto del pedido y sube tu comprobante.')
ON DUPLICATE KEY UPDATE banco = VALUES(banco);

SET FOREIGN_KEY_CHECKS = 1;
-- Tabla de Configuración de Tienda y Restaurante
CREATE TABLE IF NOT EXISTS configuracion_tienda (
    id INT PRIMARY KEY DEFAULT 1,
    nombre_tienda VARCHAR(150) NOT NULL DEFAULT 'Burger 24/7 - Central Sopocachi',
    direccion VARCHAR(255) NOT NULL DEFAULT 'Av. 20 de Octubre #2150, Sopocachi, La Paz',
    zona VARCHAR(100) NOT NULL DEFAULT 'Sopocachi',
    latitud DECIMAL(10, 8) NOT NULL DEFAULT -16.5050,
    longitud DECIMAL(11, 8) NOT NULL DEFAULT -68.1290,
    telefono VARCHAR(50) NOT NULL DEFAULT '+591 71523481',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO configuracion_tienda (id, nombre_tienda, direccion, zona, latitud, longitud, telefono)
VALUES (1, 'Burger 24/7 - Central Sopocachi', 'Av. 20 de Octubre #2150, Sopocachi, La Paz', 'Sopocachi', -16.5050, -68.1290, '+591 71523481')
ON DUPLICATE KEY UPDATE id=1;

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

-- Asegurar columna foto_url en caso de que la tabla users ya existiese de versiones previas
ALTER TABLE users ADD COLUMN IF NOT EXISTS foto_url VARCHAR(255) NULL AFTER ci_url;

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

INSERT INTO users (id, `role`, nombre, email, password_hash, fecha_nacimiento, ci_url, foto_url, ci_status, created_by, updated_by) VALUES(1, 'cliente', 'Carlos Pérez Mendoza', 'carlos@mail.com', '$2y$10$zCLKEZGphHWQenx1n0AtueOc0IfyoWc6Tsdnf7zFaKqlXtBPG4gxW', '1995-04-12', '/uploads/ci/ci_carlos.svg', '/uploads/ci/foto_carlos.svg', 'verified', 3, 3),
(2, 'rider', 'Pedro Gómez Alarcón', 'pedro@mail.com', '$2y$10$sGhPyidZkniPURvvy0cpMuRDbh9b77M2JjkpUdXrbNmuLXSgp9/Ti', '1992-08-25', '/uploads/ci/ci_pedro.svg', '/uploads/ci/foto_pedro.svg', 'verified', 3, 3),
(3, 'super_usuario', 'Admin Central (Gerencia)', 'admin@mail.com', '$2y$10$I9B4fYAZJtMWr0IZkueWU.uV7QkIE8/uLOabs0edICTWvOWFPoPZu', '1988-11-03', '/uploads/ci/ci_admin.svg', '/uploads/ci/foto_admin.svg', 'verified', 3, 3),
(4, 'cliente', 'María López Guzmán', 'maria@mail.com', '$2y$10$7Z.VtSyy/rZOGvHx7K9bVukBy6v60CRyotjThBU/zJG9hDoT11C3y', '2001-02-14', '/uploads/ci/ci_maria.svg', '/uploads/ci/foto_maria.svg', 'pending', 3, 3),
(5, 'rider', 'Juan Rodríguez Ticona', 'juan@mail.com', '$2y$10$6pBYphI6DYU4LtEYr4fQhOJ.Hg9FpSLjWmlkEGYAM34M.zRfep8nm', '1999-07-19', '/uploads/ci/ci_juan.svg', '/uploads/ci/foto_juan.svg', 'pending', 3, 3),
(6, 'cliente', 'Roberto Flores Arze', 'roberto@mail.com', '$2y$10$8oT1R6XApSbwKTeXESchaOM/80T4r8lSCSH9E.0X81HWECBM/hQ6u', '1996-05-20', '/uploads/ci/ci_roberto.svg', '/uploads/ci/foto_roberto.svg', 'rejected', 3, 3),
(7, 'rider', 'Marcos Vargas Huanca', 'marcos@mail.com', '$2y$10$k9lbObaTKvyrmcISILGI3eZLPjND3lHqr1tchavUcxCB5m4K.x7A6', '1994-09-10', '/uploads/ci/ci_marcos.svg', '/uploads/ci/foto_marcos.svg', 'rejected', 3, 3),
(8, 'cliente', 'Andrea Morales Ramos', 'andrea@mail.com', '$2y$10$1oW.NjUG69VexE72QqsrceeMycE1A03BbWKfNe9qVzpQHtuJ1Jk.2', '1998-09-18', '/uploads/ci/ci_andrea.svg', '/uploads/ci/foto_andrea.svg', 'verified', 3, 3),
(9, 'cliente', 'Gonzalo Salinas Castro', 'gonzalo@mail.com', '$2y$10$j5g8nKSQ1GQOaDFLO8eJb.0fVxuutxP6qfl1DVWpqn1FSLTDRe1P2', '1991-12-05', '/uploads/ci/ci_gonzalo.svg', '/uploads/ci/foto_gonzalo.svg', 'verified', 3, 3),
(10, 'cliente', 'Diego Quiroga Flores', 'diego@mail.com', '$2y$10$WWCoGsoD6/a/.pM8AOgtheR8stX77p1NmCdqHrRCX9PoGibeOiVay', '2003-06-22', '/uploads/ci/ci_diego.svg', '/uploads/ci/foto_diego.svg', 'pending', 3, 3),
(11, 'cliente', 'Camila Navarro Torrez', 'camila@mail.com', '$2y$10$Xy6b5mZJnnSCB1Dw2Kj3h.sC5EZionkzjTDJi5tSV3Z/HQ8ublqci', '2000-11-30', '/uploads/ci/ci_camila.svg', '/uploads/ci/foto_camila.svg', 'pending', 3, 3),
(12, 'cliente', 'Lucía Paredes Vega', 'lucia@mail.com', '$2y$10$b8gukVCZ5evldh3Ek6W3AO9sQcdHOfbH59aZuXmvSKrN6tXOOZI02', '2009-08-14', '/uploads/ci/ci_lucia.svg', '/uploads/ci/foto_lucia.svg', 'rejected', 3, 3),
(13, 'cliente', 'Rodrigo Méndez Balderrama', 'rodrigo@mail.com', '$2y$10$04QLFWu3.GATUlVzLba17u0OQCP/806kihdq3mWBh3YHFA8Q8U5Dq', '1993-01-10', '/uploads/ci/ci_rodrigo.svg', '/uploads/ci/foto_rodrigo.svg', 'rejected', 3, 3),
(14, 'rider', 'Alejandro Ríos Choque', 'alejandro@mail.com', '$2y$10$0zTFIs/NtNmgFdTYJUcXkeQArDe3HGMLyC7twWOAHvI92G0w1A0XC', '1994-03-15', '/uploads/ci/ci_alejandro.svg', '/uploads/ci/foto_alejandro.svg', 'verified', 3, 3),
(15, 'rider', 'Valeria Mamani Gutiérrez', 'valeria@mail.com', '$2y$10$7EBNVefeHmmVcMm7QqyS0eLYMkgbxmwOvOlm97Uw7aInTrWUl22MS', '1997-10-08', '/uploads/ci/ci_valeria.svg', '/uploads/ci/foto_valeria.svg', 'verified', 3, 3),
(16, 'rider', 'Fernando Blanco Heredia', 'fernando@mail.com', '$2y$10$LZPAZC9asZlfXNthj3mcX.QhWHp6f39M8tvneYFoHpRWXHdhld9ti', '2000-04-03', '/uploads/ci/ci_fernando.svg', '/uploads/ci/foto_fernando.svg', 'pending', 3, 3),
(17, 'rider', 'Paola Zeballos Cruz', 'paola@mail.com', '$2y$10$q5aabD1RbDLExY49qAaDeOpiIMhVs1Qp6j2k9lljj90Jf0HmRF3du', '2002-09-12', '/uploads/ci/ci_paola.svg', '/uploads/ci/foto_paola.svg', 'pending', 3, 3),
(18, 'rider', 'Gustavo Beltrán Soto', 'gustavo@mail.com', '$2y$10$wK/b0h.dNL9uZYaXNg7mi.INOCEm7YkzN4ndvTv4wA8L8gqi5AAoW', '1990-12-01', '/uploads/ci/ci_gustavo.svg', '/uploads/ci/foto_gustavo.svg', 'rejected', 3, 3),
(19, 'rider', 'Cristian Colque Poma', 'cristian@mail.com', '$2y$10$4.HtYt5GgEsbwpEuOHtDD.X9KU7vz3tjj90Sd.L37BbCBYV5Dsl2a', '2004-05-18', '/uploads/ci/ci_cristian.svg', '/uploads/ci/foto_cristian.svg', 'rejected', 3, 3)
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
INSERT INTO documentacion_rider (id, rider_id, licencia_url, seguro_url, cv_url, estado_aprobacion, created_by, updated_by) VALUES(1, 2, '/uploads/docs/licencia_pedro.svg', '/uploads/docs/soat_pedro.svg', '/uploads/docs/cv_pedro.svg', 'aprobado', 3, 3),
(2, 5, '/uploads/docs/licencia_juan.svg', '/uploads/docs/soat_juan.svg', '/uploads/docs/cv_juan.svg', 'pendiente', 3, 3),
(3, 7, '/uploads/docs/licencia_marcos.svg', '/uploads/docs/soat_marcos.svg', '/uploads/docs/cv_marcos.svg', 'rechazado', 3, 3),
(4, 14, '/uploads/docs/licencia_alejandro.svg', '/uploads/docs/soat_alejandro.svg', '/uploads/docs/cv_alejandro.svg', 'aprobado', 3, 3),
(5, 15, '/uploads/docs/licencia_valeria.svg', '/uploads/docs/soat_valeria.svg', '/uploads/docs/cv_valeria.svg', 'aprobado', 3, 3),
(6, 16, '/uploads/docs/licencia_fernando.svg', '/uploads/docs/soat_fernando.svg', '/uploads/docs/cv_fernando.svg', 'pendiente', 3, 3),
(7, 17, '/uploads/docs/licencia_paola.svg', '/uploads/docs/soat_paola.svg', '/uploads/docs/cv_paola.svg', 'pendiente', 3, 3),
(8, 18, '/uploads/docs/licencia_gustavo.svg', '/uploads/docs/soat_gustavo.svg', '/uploads/docs/cv_gustavo.svg', 'rechazado', 3, 3),
(9, 19, '/uploads/docs/licencia_cristian.svg', '/uploads/docs/soat_cristian.svg', '/uploads/docs/cv_cristian.svg', 'rechazado', 3, 3)
ON DUPLICATE KEY UPDATE 
    licencia_url = VALUES(licencia_url),
    seguro_url = VALUES(seguro_url),
    cv_url = VALUES(cv_url),
    estado_aprobacion = VALUES(estado_aprobacion);

-- Pedidos Iniciales de Demostración
INSERT INTO pedidos (id, cliente_id, rider_id, estado_pago, estado_pedido, total, latitud, longitud, qr_comprobante_url, created_by, updated_by) VALUES(1, 1, 2, 'liquidado', 'entregado', 45.00, -16.50200000, -68.13100000, NULL, 1, 3),
(2, 8, 14, 'pagado_qr', 'entregado', 58.00, -16.50800000, -68.13300000, '/uploads/qr/comprobante_andrea.jpg', 8, 14),
(3, 9, 15, 'contraentrega', 'en_camino', 78.00, -16.51200000, -68.12500000, NULL, 9, 15),
(4, 1, 2, 'contraentrega', 'asignado', 34.00, -16.50400000, -68.12900000, NULL, 1, 3),
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

SET FOREIGN_KEY_CHECKS = 1;
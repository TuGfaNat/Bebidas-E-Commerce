-- ============================================================================
-- Sistema E-commerce Burger 24/7 - DDL Completo e Inicialización de Base de Datos
-- Incluye estructura normalizada, restricciones de integridad referencial
-- y datos de prueba (seed) con password_hash real (bcrypt).
-- ============================================================================

-- 1. Tabla de Usuarios (users)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    `role` ENUM('cliente', 'rider', 'super_usuario') NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    ci_url VARCHAR(255),
    ci_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

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
);

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
);

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
);

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
);

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
);

-- ============================================================================
-- SEED DATA (Datos Iniciales con password_hash bcrypt real)
-- ============================================================================

-- Contraseñas reales:
-- carlos: carlos
-- pedro: pedro
-- admin: admin
-- maria: maria
-- juan: juan

INSERT INTO users (id, `role`, nombre, email, password_hash, fecha_nacimiento, ci_url, ci_status, created_by, updated_by) VALUES
(1, 'cliente', 'Carlos Pérez', 'carlos@mail.com', '$2y$10$GB.kzxC2cpj2ylTUbm/KzuZsZW/FFg4q0P99Tx1gwxRu.MpXfKx9y', '1995-04-12', '/uploads/ci/ci_carlos.jpg', 'verified', 1, 1),
(2, 'rider', 'Pedro Gómez', 'pedro@mail.com', '$2y$10$VS6OqUtJEgrTYIL2Ad3ypeZ1MBsqg/D5booI.pGQ.HMzs0RFcKbtO', '1992-08-25', '/uploads/ci/ci_pedro.jpg', 'verified', 1, 1),
(3, 'super_usuario', 'Admin Central', 'admin@mail.com', '$2y$10$iwDft1al.qObBhKDoy9QMOfs3mmXxKY8SVPyYSklzFhgeWdYdnaAS', '1988-11-03', '/uploads/ci/ci_admin.jpg', 'verified', 3, 3),
(4, 'cliente', 'María López (Pendiente)', 'maria@mail.com', '$2y$10$NJr/sBFl68EH/xi5t.pe0eD/NfCJf3syzayjCwsoGm0SKD.WUtfqC', '2001-02-14', '/uploads/ci/ci_maria.jpg', 'pending', 1, 1),
(5, 'rider', 'Juan Rodríguez (Pendiente)', 'juan@mail.com', '$2y$10$L99DK8wwYYK6KlhfFAxxKubImqZOn3eyHpVy2iWA0bA4qi.jhpeNW', '1999-07-19', '/uploads/ci/ci_juan.jpg', 'pending', 1, 1)
ON DUPLICATE KEY UPDATE 
    password_hash = VALUES(password_hash),
    ci_status = VALUES(ci_status),
    `role` = VALUES(`role`);

-- Seed Catálogo de Hamburguesas, Combos, Acompañamientos y Bebidas
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

-- Seed Auditoría Inicial
INSERT INTO auditoria_logs (id, tabla_afectada, registro_id, accion, datos_anteriores, datos_nuevos, ip_address, created_by, updated_by) VALUES
(1, 'productos', 1, 'INSERT', NULL, '{"nombre":"Hamburguesa Clásica Simple","stock":85,"precio":22.00}', '127.0.0.1', 3, 3)
ON DUPLICATE KEY UPDATE accion = VALUES(accion);

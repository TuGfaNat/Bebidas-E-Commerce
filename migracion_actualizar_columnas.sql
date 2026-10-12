-- ============================================================================
-- Burger 24/7 - Script de Migración / Actualización de Columnas
-- Ejecuta este script en phpMyAdmin o MySQL si te sale el error:
-- "#1054 - La columna 'ci_reverso_url' en field list es desconocida"
-- ============================================================================

USE `burger_shop`;

-- 1. Agregar columnas a 'users' (si no existen)
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='ci_reverso_url');
SET @sql = IF(@col = 0, 'ALTER TABLE users ADD COLUMN ci_reverso_url VARCHAR(255) NULL AFTER ci_url', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='foto_url');
SET @sql = IF(@col = 0, 'ALTER TABLE users ADD COLUMN foto_url VARCHAR(255) NULL AFTER ci_reverso_url', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='direccion');
SET @sql = IF(@col = 0, 'ALTER TABLE users ADD COLUMN direccion VARCHAR(255) DEFAULT NULL AFTER ci_status', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='telefono');
SET @sql = IF(@col = 0, 'ALTER TABLE users ADD COLUMN telefono VARCHAR(50) DEFAULT NULL AFTER direccion', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='motivo_rechazo');
SET @sql = IF(@col = 0, 'ALTER TABLE users ADD COLUMN motivo_rechazo TEXT AFTER telefono', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='apelacion_motivo');
SET @sql = IF(@col = 0, 'ALTER TABLE users ADD COLUMN apelacion_motivo TEXT AFTER motivo_rechazo', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='apelacion_estado');
SET @sql = IF(@col = 0, "ALTER TABLE users ADD COLUMN apelacion_estado ENUM('ninguna', 'pendiente', 'resuelta') DEFAULT 'ninguna' AFTER apelacion_motivo", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Agregar columnas a 'documentacion_rider' (si no existen)
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='documentacion_rider' AND COLUMN_NAME='licencia_reverso_url');
SET @sql = IF(@col = 0, 'ALTER TABLE documentacion_rider ADD COLUMN licencia_reverso_url VARCHAR(255) NULL AFTER licencia_url', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='documentacion_rider' AND COLUMN_NAME='motivo_rechazo');
SET @sql = IF(@col = 0, 'ALTER TABLE documentacion_rider ADD COLUMN motivo_rechazo TEXT AFTER estado_aprobacion', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='documentacion_rider' AND COLUMN_NAME='apelacion_motivo');
SET @sql = IF(@col = 0, 'ALTER TABLE documentacion_rider ADD COLUMN apelacion_motivo TEXT AFTER motivo_rechazo', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='documentacion_rider' AND COLUMN_NAME='apelacion_estado');
SET @sql = IF(@col = 0, "ALTER TABLE documentacion_rider ADD COLUMN apelacion_estado ENUM('ninguna', 'pendiente', 'resuelta') DEFAULT 'ninguna' AFTER apelacion_motivo", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Agregar columnas a 'pedidos' (si no existen)
SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='pedidos' AND COLUMN_NAME='direccion_entrega');
SET @sql = IF(@col = 0, 'ALTER TABLE pedidos ADD COLUMN direccion_entrega VARCHAR(255) DEFAULT NULL AFTER longitud', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='pedidos' AND COLUMN_NAME='referencia_entrega');
SET @sql = IF(@col = 0, 'ALTER TABLE pedidos ADD COLUMN referencia_entrega VARCHAR(255) DEFAULT NULL AFTER direccion_entrega', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col = (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='pedidos' AND COLUMN_NAME='telefono_contacto');
SET @sql = IF(@col = 0, 'ALTER TABLE pedidos ADD COLUMN telefono_contacto VARCHAR(50) DEFAULT NULL AFTER referencia_entrega', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. Crear tablas de configuración si no existen
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

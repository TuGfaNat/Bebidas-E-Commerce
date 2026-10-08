-- ============================================================================
-- Burger 24/7 - Script de Normalización y Limpieza de Caracteres UTF-8
-- ============================================================================
-- Utiliza literales binarios HEX para garantizar inmunidad total ante codificaciones
-- de consola Windows (CP850 / CP437) y asegurar caracteres UTF-8 puros (tildes y ñ).
-- ============================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 1. Normalización de Nombres en la tabla USERS
UPDATE users SET nombre = 0x4361726C6F732050C3A972657A WHERE id = 1; -- Carlos Pérez
UPDATE users SET nombre = 0x506564726F2047C3B36D657A WHERE id = 2; -- Pedro Gómez
UPDATE users SET nombre = 0x4D6172C3AD61204CC3B370657A202850656E6469656E746529 WHERE id = 4; -- María López (Pendiente)
UPDATE users SET nombre = 0x4A75616E20526F6472C3AD6775657A202850656E6469656E746529 WHERE id = 5; -- Juan Rodríguez (Pendiente)

-- 2. Normalización de Nombres y Categorías en la tabla PRODUCTOS
UPDATE productos SET nombre = 0x48616D627572677565736120436CC3A1736963612053696D706C65 WHERE id = 1; -- Hamburguesa Clásica Simple
UPDATE productos SET nombre = 0x436F6D626F20436CC3A17369636F20636F6E205061706173207920536F6461 WHERE id = 5; -- Combo Clásico con Papas y Soda
UPDATE productos SET nombre = 0x5061706173204672697461732052C3BA737469636173 WHERE id = 7; -- Papas Fritas Rústicas
UPDATE productos SET nombre = 0x537072697465204C696D612D4C696DC3B36E203530306D6C WHERE id = 11; -- Sprite Lima-Limón 500ml

UPDATE productos SET categoria = 0x41636F6D7061C3B1616D69656E746F73 WHERE id IN (7, 8, 9); -- Acompañamientos

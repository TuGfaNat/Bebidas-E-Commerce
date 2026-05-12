# Documentación Técnica de Seguridad - Tesina

## Título del Módulo: Seguridad en el Servicio de Autenticación y Manejo de C.I.

### Descripción Técnica
Este módulo implementa el endpoint de registro (`register.php`) en el microservicio de Auth. El propósito de este código es recibir de manera segura la información de nuevos usuarios (nombre, correo, contraseña, fecha de nacimiento) junto con su documento de identidad (C.I.), asegurando el cumplimiento de las normativas de registro (validación de mayoría de edad).

### Protección de Datos Sensibles del Cliente
La plataforma E-commerce Bebidas 24/7 maneja datos altamente sensibles, por lo que se implementaron los siguientes mecanismos de seguridad y prevención de fugas de información:

1. **Protección del C.I. (Documento de Identidad):**
   - **Directorio Restringido:** Las imágenes del C.I. subidas por los usuarios no se exponen públicamente a través del servidor web. Se almacenan en la ruta `microservices/Auth/uploads/ci/`.
   - **Bloqueo a Nivel de Servidor (Apache):** Se ha colocado un archivo `.htaccess` con la directiva `Require all denied` en la carpeta de subidas. Esto asegura que nadie pueda acceder directamente a una imagen mediante una URL (ej. `misitio.com/uploads/ci/foto.jpg`). Las imágenes sólo pueden ser leídas y servidas internamente a través de los microservicios, previniendo el robo de identidad.
   - **Ofuscación de Nombres:** Los archivos subidos son renombrados utilizando `uniqid()` para evitar la predicción de nombres de archivo y colisiones.

2. **Cifrado de Contraseñas:**
   - La contraseña del usuario nunca se guarda en texto plano. Se procesa mediante el algoritmo de hash `bcrypt` (usando `password_hash()` de PHP). Este algoritmo incorpora un "salt" dinámico que mitiga ataques de fuerza bruta y ataques por diccionario (Rainbow Tables).

3. **Prevención de Inyección SQL (SQLi):**
   - Todas las inserciones a la base de datos se realizan utilizando la extensión PDO con *Sentencias Preparadas* (Prepared Statements). Los parámetros proporcionados por el usuario (`nombre`, `correo`, etc.) no se concatenan directamente en la consulta SQL, bloqueando cualquier intento de manipulación maliciosa de las queries.

4. **Auditoría Estricta (Regla de Oro):**
   - Inmediatamente después de insertar el nuevo registro del usuario, el sistema obtiene el ID generado y actualiza los campos obligatorios de trazabilidad (`created_by`, `updated_by`) asignando la propiedad del registro al usuario mismo. Adicionalmente, la operación queda registrada inmutablemente en la tabla `auditoria_logs`.

### Diagrama de Flujo / Lógica (Proceso de Registro Seguro)
1. **Petición HTTP:** El cliente envía los datos mediante método POST (exclusivo).
2. **Validación de Entradas:** Se verifica que no existan campos vacíos y se calcula la edad basada en la fecha de nacimiento (debe ser $\geq$ 18).
3. **Guardado de Archivo:** El C.I. se mueve al directorio protegido `/uploads/ci/` y se le asigna un nombre ofuscado.
4. **Verificación de Duplicados:** Se comprueba en la base de datos que el correo no esté previamente registrado.
5. **Transacción Segura:**
   - Se hashea el password.
   - Se inserta el usuario en la tabla `users`.
   - Se actualizan los campos `created_by` y `updated_by` con el ID devuelto por `lastInsertId()`.
   - Se inserta un log en `auditoria_logs`.
6. **Respuesta:** Se devuelve un objeto JSON estructurado con el formato requerido en `SPEC.md`.
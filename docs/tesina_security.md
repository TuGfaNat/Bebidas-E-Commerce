# Arquitectura de Seguridad y Protección de Datos - Tesina Técnica

## 1. Autenticación y Autorización basada en JWT (HMAC-SHA256)

El sistema **Burger 24/7** implementa un esquema de autenticación sin estado (*stateless*) fundamentado en **JSON Web Tokens (JWT)** conforme al estándar **RFC 7519**. Este mecanismo garantiza la integridad de la identidad del usuario y permite la validación descentralizada de permisos entre microservicios sin sobrecargar la base de datos con consultas de sesión repetitivas.

### A. Estructura Criptográfica del Token
Cada token emitido por [`microservices/Auth/jwt.php`](file:///F:/Bebidas-E-Commerce/microservices/Auth/jwt.php) consta de tres partes concatenadas por puntos (`.`):

1. **Header:** Define el algoritmo de firma y el tipo de token:
   ```json
   {
     "alg": "HS256",
     "typ": "JWT"
   }
   ```
2. **Payload:** Transporta los reclamos (*claims*) de identidad y control de acceso del usuario:
   ```json
   {
     "user_id": 3,
     "role": "super_usuario",
     "email": "admin@mail.com",
     "nombre": "Admin Central",
     "ci_status": "verified",
     "iat": 1789448640,
     "exp": 1789535040
   }
   ```
3. **Signature:** Firma digital generada mediante el algoritmo **HMAC-SHA256** utilizando una clave secreta segura (*Secret Key*) resguardada en el servidor:
   $$\text{Signature} = \text{HMAC-SHA256}(\text{Base64Url}(\text{Header}) + "." + \text{Base64Url}(\text{Payload}), \text{SECRET\_KEY})$$

### B. Política de Transporte Seguro de Tokens
- **Transporte Exclusivo por Cabecera HTTP:** El token debe ser suministrado obligatoriamente en el encabezado:
  ```http
  Authorization: Bearer <token_jwt>
  ```
- **Rechazo Estricto de Tokens en Query Strings:** Para mitigar el riesgo de fuga de credenciales en bitácoras de servidores proxy, historial de navegación web y cabeceras `Referer`, todos los microservicios rechazan activamente parámetros `?token=...` en la URL. Si una petición intenta pasar el token por query string, el backend la invalida inmediatamente con un código **HTTP 401 Unauthorized**.
- **Ventana de Caducidad:** Los tokens cuentan con un tiempo de expiración programado de 24 horas (`86400` segundos) desde el momento de emisión (`iat`), tras lo cual el cliente debe renovar su sesión.

---

## 2. Control de Acceso Basado en Roles (RBAC)

La plataforma aplica un modelo de **Control de Acceso Basado en Roles (Role-Based Access Control - RBAC)** que gobierna la ejecución de cada operación en los endpoints de los microservicios:

```
                      Matriz de Privilegios RBAC
┌───────────────────────────────┬─────────┬─────────┬─────────────────┐
│ Operación / Endpoint          │ Cliente │  Rider  │ Admin / Central │
├───────────────────────────────┼─────────┼─────────┼─────────────────┤
│ Ver catálogo comercial        │    ✓    │    ✓    │        ✓        │
│ Crear pedidos (Checkout)      │    ✓    │    ✗    │        ✗        │
│ Subir comprobante QR          │    ✓    │    ✗    │        ✗        │
│ Ver pedidos pendientes        │    ✗    │    ✓    │        ✓        │
│ Aceptar despacho (Rider)      │    ✗    │    ✓    │        ✗        │
│ Actualizar tránsito (Rider)   │    ✗    │    ✓    │        ✗        │
│ Aprobar / Rechazar identidades│    ✗    │    ✗    │        ✓        │
│ Modificar catálogo (CRUD)     │    ✗    │    ✗    │        ✓        │
│ Monitoreo en vivo (Live Map)  │    ✗    │    ✗    │        ✓        │
│ Liquidar caja central         │    ✗    │    ✗    │        ✓        │
│ Consultar ledger auditoría    │    ✗    │    ✗    │        ✓        │
│ Generar reportes financieros  │    ✗    │    ✗    │        ✓        │
└───────────────────────────────┴─────────┴─────────┴─────────────────┘
```

### Funciones de Seguridad en Backend:
- **`authenticate()`:** Extrae el Bearer token de las cabeceras HTTP, verifica la firma criptográfica HMAC-SHA256 y comprueba que la fecha actual sea anterior al reclamo `exp`.
- **`requireAuth()`:** Invoca `authenticate()`. Si el token es nulo o inválido, emite una respuesta terminante **HTTP 401 Unauthorized** y detiene la ejecución.
- **`requireAdmin()` / `check_admin_auth()`:** Comprueba adicionalmente que el rol del usuario contenido en el token pertenezca a `('admin', 'super_usuario')`. Si el rol no cumple la condición, emite una respuesta **HTTP 403 Forbidden**.

---

## 3. Cifrado y Hashing de Contraseñas (Bcrypt)

Para neutralizar filtraciones de bases de datos y ataques por tablas arcoíris (*Rainbow Tables*), las contraseñas nunca se procesan ni almacenan en texto claro:
1. **Algoritmo:** Se utiliza el estándar industrial **Bcrypt** mediante las funciones nativas `password_hash($password, PASSWORD_BCRYPT, ['cost' => 10])` en PHP y `bcrypt.hash()` en Python.
2. **Salting Dinámico:** Bcrypt genera automáticamente una sal (*salt*) criptográfica aleatoria de 128 bits para cada usuario, garantizando que dos usuarios con la misma contraseña produzcan hashes totalmente diferentes en la tabla `users`.
3. **Validación en Tiempo Constante:** La autenticación se verifica con `password_verify($password, $hash)`, la cual opera en tiempo constante para neutralizar ataques de temporización (*timing attacks*).

---

## 4. Políticas de CORS y Encabezados de Seguridad

Dado que los microservicios pueden ser consumidos desde orígenes distribuidos, cada script PHP incorpora cabeceras de **Cross-Origin Resource Sharing (CORS)** y seguridad HTTP:

```php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Manejo expedito de pre-flight requests del navegador
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
```

---

## 5. Prevención de Vulnerabilidades Web Críticas

### A. Prevención de Inyección SQL (SQLi)
- **100% Sentencias Preparadas (Prepared Statements):** Ninguna consulta a la base de datos concatena parámetros provenientes del usuario (`$_GET`, `$_POST`, o cuerpo JSON).
- **PDO Parametrizado:** Se emplean marcadores de posición (`?` o `:param`) que separan estrictamente la estructura sintáctica SQL de los datos proporcionados por el usuario, haciendo imposible la alteración de la lógica de consulta mediante inyecciones SQL.

### B. Prevención de Cross-Site Scripting (XSS)
- **Sanitización de Entradas:** Todas las cadenas recibidas que van a ser persistidas o reflejadas se limpian mediante `htmlspecialchars($data, ENT_QUOTES, 'UTF-8')` y `strip_tags()`.
- **Renderizado Seguro en el Frontend:** En [`app.js`](file:///F:/Bebidas-E-Commerce/app.js), los datos provenientes de la API se inyectan en el DOM preferentemente mediante propiedades `innerText` o plantillas con escape de caracteres peligrosos (`<`, `>`, `"`, `'`, `&`).

### C. Seguridad en la Subida de Archivos (File Upload Security)
Para evitar la carga de archivos ejecutables maliciosos (ej. webshells en PHP):
1. **Validación de Tipos MIME Reales:** No se confía en la extensión enviada por el navegador (`$_FILES['file']['name']`); se analiza el contenido binario del archivo usando `finfo_file()` para constatar que corresponda a imágenes legítimas (`image/jpeg`, `image/png`) o documentos (`application/pdf`).
2. **Ofuscación Criptográfica de Nombres:** Los archivos almacenados en servidor son renombrados utilizando identificadores únicos no predecibles: `ci_` + `uniqid('', true)` + extensión limpia.
3. **Aislamiento en Servidor con `.htaccess`:** En los directorios de almacenamiento privado (`uploads/ci/`, `uploads/qr/`, `uploads/riders/`), se ha desplegado un archivo `.htaccess` con la siguiente directiva:
   ```apache
   # uploads/ci/.htaccess
   Require all denied
   ```
   Esto bloquea totalmente cualquier intento de acceder directamente a una imagen mediante una URL pública del navegador (evitando el robo masivo de documentos de identidad). Las imágenes solo pueden ser leídas por los microservicios autorizados a través de los canales internos de la plataforma.

### D. Rate Limiting y Detección de Fuerza Bruta
- Cada intento de autenticación fallido y cada operación CRUD se registra con su dirección IP de origen en `auditoria_logs`.
- La plataforma detecta ráfagas anómalas de peticiones sobre el endpoint de login y emite retardos de respuesta para mitigar ataques automatizados de diccionario.

---

## 6. Manual de Pruebas de Seguridad (Casos de Éxito y Error)

| ID | Vector de Ataque / Escenario | Petición / Parámetros Enviados | Mecanismo de Defensa | Código HTTP | Resultado del Sistema |
|---|---|---|---|---|---|
| **CP-SEC-01** | Acceso sin token de autorización | GET `/live_monitoring.php` sin cabecera `Authorization`. | Middleware `requireAuth()` evalúa ausencia de credenciales. | 401 Unauthorized | Acceso denegado: "Token de autorización no proporcionado". |
| **CP-SEC-02** | Token manipulado (Firma inválida) | Petición con JWT cuyo payload fue alterado manualmente en Base64. | `jwt.php` recalcula el HMAC-SHA256 con la Secret Key del servidor y detecta discrepancia. | 401 Unauthorized | Token rechazado por firma criptográfica inválida. |
| **CP-SEC-03** | Token transmitido por Query String | GET `/live_monitoring.php?token=eyJhbG...` | El microservicio rechaza explícitamente tokens en la URL. | 401 Unauthorized | Petición rechazada para prevenir fugas de token en logs. |
| **CP-SEC-04** | Escalación de privilegios RBAC | Cliente verificado intenta invocar `settle_cash.php` o `catalog.php` (POST). | `requireAdmin()` comprueba `role === 'cliente'` y deniega la operación. | 403 Forbidden | Permiso denegado: "Solo administradores pueden realizar esta acción". |
| **CP-SEC-05** | Intento de Inyección SQL (SQLi) | Intento de login con `' OR '1'='1` en el campo email. | Consulta PDO preparada con placeholder `WHERE email = ?`. El string se trata como literal. | 401 Unauthorized | No se altera la consulta; el usuario no existe. Cero brechas SQLi. |
| **CP-SEC-06** | Carga de archivo malicioso (.php) | Intento de subir un archivo `shell.php` renombrado como `foto.jpg`. | `finfo_file` detecta que el MIME real es `text/x-php` y no `image/jpeg`. | 400 Bad Request | Carga cancelada: "Formato de archivo no permitido". |
| **CP-SEC-07** | Acceso directo a carpeta protegida | Navegación directa hacia `http://localhost/uploads/ci/foto.jpg`. | Archivo `.htaccess` con `Require all denied` intercepta la petición a nivel de servidor web. | 403 Forbidden | Acceso bloqueado por el servidor web Apache. Documentos protegidos. |
| **CP-SEC-08** | Inyección de script malicioso (XSS) | Producto creado con nombre `<script>alert('xss')</script>`. | Sanitización con `htmlspecialchars` y renderizado seguro en el DOM del cliente. | 200 / 201 | El script no se ejecuta; se renderiza como texto inerte en pantalla. |
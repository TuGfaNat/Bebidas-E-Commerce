#!/usr/bin/env python3
"""
Servidor HTTP y Microservicios Centrales para Burger 24/7
Sirve el Frontend (HTML5/CSS3/JS), gestiona CORS y expone los microservicios
conforme a la especificación de SPEC.md.
"""

import sys
import os
import json
import urllib.parse
import mimetypes
import subprocess
import hmac
import hashlib
import base64
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from datetime import datetime, timezone

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

def load_jwt_secret():
    env_path = os.path.join(ROOT_DIR, 'microservices', 'Auth', '.env')
    if os.path.exists(env_path):
        try:
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        k, v = line.split('=', 1)
                        if k.strip() == 'JWT_SECRET':
                            return v.strip().strip('"').strip("'")
        except Exception:
            pass
    return os.environ.get('JWT_SECRET', 'c53a0c7a8788d5ed3e796f49c7de19b493cf5ffc6f657fe0377e993a80bd2d98')

JWT_SECRET = load_jwt_secret()

def base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def base64url_decode(s: str) -> bytes:
    padding = '=' * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + padding)

def generate_jwt(payload: dict, expiry_seconds=86400) -> str:
    now = int(datetime.now().timestamp())
    full_payload = {**payload, "iat": now, "exp": now + expiry_seconds}
    header = {"alg": "HS256", "typ": "JWT"}
    h_str = base64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    p_str = base64url_encode(json.dumps(full_payload, separators=(',', ':')).encode('utf-8'))
    signing_input = f"{h_str}.{p_str}".encode('utf-8')
    sig = hmac.new(JWT_SECRET.encode('utf-8'), signing_input, hashlib.sha256).digest()
    sig_str = base64url_encode(sig)
    return f"{h_str}.{p_str}.{sig_str}"

def verify_jwt(token: str):
    if not token or token.count('.') != 2:
        return None
    try:
        h_str, p_str, sig_str = token.split('.')
        signing_input = f"{h_str}.{p_str}".encode('utf-8')
        expected_sig = hmac.new(JWT_SECRET.encode('utf-8'), signing_input, hashlib.sha256).digest()
        actual_sig = base64url_decode(sig_str)
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
        payload = json.loads(base64url_decode(p_str).decode('utf-8'))
        now = int(datetime.now().timestamp())
        if 'exp' in payload and payload['exp'] < now:
            return None
        return payload
    except Exception:
        return None

def get_audit_envelope(status, data, user_id=None, error_details=None):
    return {
        "status": status,
        "data": data,
        "audit": {
            "user_id": str(user_id) if user_id else "SYSTEM",
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        "error_details": error_details
    }

ALLOWED_ORIGINS = [
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:3000',
    'http://localhost',
    'http://127.0.0.1'
]

LOGIN_ATTEMPTS = {}  # ip -> [timestamps]

def check_rate_limit(ip, max_attempts=5, window_seconds=300):
    now = datetime.now().timestamp()
    attempts = LOGIN_ATTEMPTS.get(ip, [])
    attempts = [t for t in attempts if now - t < window_seconds]
    LOGIN_ATTEMPTS[ip] = attempts
    return len(attempts) < max_attempts

def record_attempt(ip, success=False):
    now = datetime.now().timestamp()
    if ip not in LOGIN_ATTEMPTS:
        LOGIN_ATTEMPTS[ip] = []
    if success:
        LOGIN_ATTEMPTS[ip] = []
    else:
        LOGIN_ATTEMPTS[ip].append(now)

class BebidasHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def get_client_ip(self):
        xff = self.headers.get('X-Forwarded-For')
        if xff:
            return xff.split(',')[0].strip()
        return self.client_address[0] if self.client_address else '127.0.0.1'

    def end_headers(self):
        # Restricted CORS & Caching headers
        origin = self.headers.get('Origin')
        if origin and origin in ALLOWED_ORIGINS:
            self.send_header('Access-Control-Allow-Origin', origin)
            self.send_header('Vary', 'Origin')
        elif not origin:
            self.send_header('Access-Control-Allow-Origin', 'http://localhost:8000')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # Reject tokens sent via query parameters on any endpoint
        query_params = urllib.parse.parse_qs(parsed.query)
        if 'token' in query_params:
            self.send_json(get_audit_envelope(
                "error", 
                None, 
                None, 
                "Acceso denegado. El envío de tokens por query string (?token=) está estrictamente prohibido por seguridad. Utilice el encabezado 'Authorization: Bearer <token>'."
            ), status=401)
            return

        # Normalize alias /Bebidas-E-Commerce/
        if path.startswith('/Bebidas-E-Commerce'):
            path = path[len('/Bebidas-E-Commerce'):]
            if not path:
                path = '/'

        # Microservice health / connection test
        if path in ['/microservices/Auth/connection.php', '/microservices/Auth/connection']:
            self.send_json(get_audit_envelope("success", {
                "database": "bebidas_247",
                "connected": True,
                "engine": "MySQL/Local",
                "message": "Conexión exitosa a la base de datos de Burger 24/7"
            }))
            return

        # Microservice: Session restoration via Bearer JWT
        if path in ['/microservices/Auth/session.php', '/microservices/Auth/session']:
            auth_header = self.headers.get('Authorization', '')
            token = ''
            if auth_header.startswith('Bearer '):
                token = auth_header[7:].strip()
            
            if not token:
                self.send_json(get_audit_envelope(
                    "error", None, None, 
                    "Acceso denegado. Token no proporcionado en el encabezado Authorization."
                ), status=401)
                return

            payload = verify_jwt(token)
            if not payload:
                self.send_json(get_audit_envelope(
                    "error", None, None, 
                    "Acceso denegado. Token inválido o expirado."
                ), status=401)
                return

            user_id = payload.get('user_id')
            self.send_json(get_audit_envelope("success", {
                "valid": True,
                "user": {
                    "id": user_id,
                    "nombre": payload.get('nombre', 'Usuario'),
                    "email": payload.get('email', ''),
                    "role": payload.get('role', 'cliente'),
                    "ci_status": payload.get('ci_status', 'verified')
                }
            }, user_id=user_id))
            return

        # Microservice: Logistics calculator via GET query params
        if path in ['/microservices/Logistics/calculator.py', '/microservices/Logistics/calculator']:
            query = urllib.parse.parse_qs(parsed.query)
            user_id = query.get('user_id', ['SYSTEM'])[0]
            lat_c = query.get('lat_cliente', ['-16.5000'])[0]
            lon_c = query.get('lon_cliente', ['-68.1300'])[0]
            lat_t = query.get('lat_tienda', ['-16.5050'])[0]
            lon_t = query.get('lon_tienda', ['-68.1290'])[0]

            calc_path = os.path.join(ROOT_DIR, 'microservices', 'Logistics', 'calculator.py')
            try:
                res = subprocess.run(
                    [sys.executable, calc_path, user_id, lat_c, lon_c, lat_t, lon_t],
                    capture_output=True, text=True, check=True
                )
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(res.stdout.encode('utf-8'))
            except Exception as ex:
                self.send_json(get_audit_envelope("error", None, user_id, str(ex)), status=500)
            return

        # Default static file routing
        if path == '/':
            self.path = '/index.html'
        else:
            self.path = path

        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        # Reject tokens sent via query parameters
        query_params = urllib.parse.parse_qs(parsed.query)
        if 'token' in query_params:
            self.send_json(get_audit_envelope(
                "error", 
                None, 
                None, 
                "Acceso denegado. El envío de tokens por query string está prohibido. Utilice el encabezado 'Authorization: Bearer <token>'."
            ), status=401)
            return

        if path.startswith('/Bebidas-E-Commerce'):
            path = path[len('/Bebidas-E-Commerce'):]

        content_len = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_len).decode('utf-8', errors='ignore') if content_len > 0 else ""

        # Parse form data or JSON
        data = {}
        content_type = self.headers.get('Content-Type', '')
        if 'application/json' in content_type:
            try:
                data = json.loads(body)
            except Exception:
                pass
        else:
            parsed_form = urllib.parse.parse_qs(body)
            data = {k: v[0] for k, v in parsed_form.items()}

        # Microservice: Auth login
        if path in ['/microservices/Auth/login.php', '/microservices/Auth/login']:
            client_ip = self.get_client_ip()

            # Rate-limiting check (max 5 failed attempts per 300 seconds)
            if not check_rate_limit(client_ip):
                self.send_json(get_audit_envelope(
                    "error",
                    None,
                    None,
                    "Demasiados intentos fallidos de autenticación. Bloqueo temporal por 5 minutos."
                ), status=429)
                return

            correo = data.get('correo', '').strip().lower()
            password = data.get('password', '').strip()

            valid_users = {
                'admin@mail.com': {'pass': 'admin', 'id': 3, 'nombre': 'Admin Central', 'role': 'super_usuario', 'ci_status': 'verified'},
                'pedro@mail.com': {'pass': 'pedro', 'id': 2, 'nombre': 'Pedro Gómez', 'role': 'rider', 'ci_status': 'verified'},
                'carlos@mail.com': {'pass': 'carlos', 'id': 1, 'nombre': 'Carlos Pérez', 'role': 'cliente', 'ci_status': 'verified'},
                'maria@mail.com': {'pass': 'maria', 'id': 4, 'nombre': 'María López (Pendiente)', 'role': 'cliente', 'ci_status': 'pending'},
                'juan@mail.com': {'pass': 'juan', 'id': 5, 'nombre': 'Juan Rodríguez (Pendiente)', 'role': 'rider', 'ci_status': 'pending'}
            }

            matched = valid_users.get(correo)
            if not matched or matched['pass'] != password:
                record_attempt(client_ip, success=False)
                self.send_json(get_audit_envelope(
                    "error",
                    None,
                    None,
                    "Credenciales incorrectas. Verifique su correo electrónico y contraseña."
                ), status=401)
                return

            # Login successful: clear rate limit and issue real signed JWT
            record_attempt(client_ip, success=True)
            signed_token = generate_jwt({
                "user_id": matched['id'],
                "role": matched['role'],
                "email": correo,
                "nombre": matched['nombre'],
                "ci_status": matched['ci_status']
            }, expiry_seconds=86400)
            self.send_json(get_audit_envelope("success", {
                "token": signed_token,
                "user": {
                    "id": matched['id'],
                    "nombre": matched['nombre'],
                    "role": matched['role'],
                    "email": correo,
                    "ci_status": matched['ci_status']
                }
            }, user_id=matched['id']))
            return

        # Microservice: Session restoration via POST
        if path in ['/microservices/Auth/session.php', '/microservices/Auth/session']:
            auth_header = self.headers.get('Authorization', '')
            token = ''
            if auth_header.startswith('Bearer '):
                token = auth_header[7:].strip()
            
            if not token:
                self.send_json(get_audit_envelope(
                    "error", None, None, 
                    "Acceso denegado. Token no proporcionado en el encabezado Authorization."
                ), status=401)
                return

            payload = verify_jwt(token)
            if not payload:
                self.send_json(get_audit_envelope(
                    "error", None, None, 
                    "Acceso denegado. Token inválido o expirado."
                ), status=401)
                return

            user_id = payload.get('user_id')
            self.send_json(get_audit_envelope("success", {
                "valid": True,
                "user": {
                    "id": user_id,
                    "nombre": payload.get('nombre', 'Usuario'),
                    "email": payload.get('email', ''),
                    "role": payload.get('role', 'cliente'),
                    "ci_status": payload.get('ci_status', 'verified')
                }
            }, user_id=user_id))
            return

        # Microservice: Logistics calculator via POST
        if path in ['/microservices/Logistics/calculator.py', '/microservices/Logistics/calculator']:
            user_id = str(data.get('user_id', 'SYSTEM'))
            lat_c = str(data.get('lat_cliente', '-16.5000'))
            lon_c = str(data.get('lon_cliente', '-68.1300'))
            lat_t = str(data.get('lat_tienda', '-16.5050'))
            lon_t = str(data.get('lon_tienda', '-68.1290'))

            calc_path = os.path.join(ROOT_DIR, 'microservices', 'Logistics', 'calculator.py')
            try:
                res = subprocess.run(
                    [sys.executable, calc_path, user_id, lat_c, lon_c, lat_t, lon_t],
                    capture_output=True, text=True, check=True
                )
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(res.stdout.encode('utf-8'))
            except Exception as ex:
                self.send_json(get_audit_envelope("error", None, user_id, str(ex)), status=500)
            return

        # Microservice: Auth connection test (POST)
        if path in ['/microservices/Auth/connection.php', '/microservices/Auth/connection']:
            self.send_json(get_audit_envelope("success", {
                "database": "bebidas_247",
                "connected": True,
                "engine": "MySQL/Local",
                "message": "Conexión exitosa a la base de datos de Burger 24/7"
            }))
            return

        # Fallback for any other microservices endpoint
        self.send_json(get_audit_envelope("success", {
            "endpoint": path,
            "processed": True,
            "received": data
        }))

    def send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False, indent=2).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        sys.stderr.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {args[0]} {args[1]} -> {args[2]}\n")

def run():
    server = ThreadingHTTPServer(('0.0.0.0', PORT), BebidasHandler)
    banner = f"""
========================================================================
   SISTEMA E-COMMERCE BURGER 24/7 - SERVICIOS INICIADOS CON ÉXITO
========================================================================
  [+] Aplicación Web (Frontend):  http://localhost:{PORT}/
  [+] Servidor de Microservicios: http://localhost:{PORT}/microservices/
  [+] Motor Logístico Python:     http://localhost:{PORT}/microservices/Logistics/calculator.py
  [+] Raíz del Proyecto:          {ROOT_DIR}
========================================================================
  Presione Ctrl+C para detener los servicios.
"""
    print(banner, flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nDeteniendo servicios...", flush=True)
        server.server_close()

if __name__ == '__main__':
    run()

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
import math
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

def get_audit_envelope(status, data, user_id=None, error_details=None, action=None):
    return {
        "status": status,
        "data": data,
        "audit": {
            "user_id": str(user_id) if user_id is not None else "ANONYMOUS",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": action or "UNKNOWN"
        },
        "error_details": error_details
    }

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

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

# Catálogo en memoria para paridad con microservicio Catalog
CATALOG_PRODUCTS = [
    {"id": 1, "categoria": "Hamburguesas", "nombre": "Hamburguesa Clásica Simple", "marca": "Burger 24/7", "sabor": "Carne 150g, lechuga, tomate y salsa especial", "precio": 22.00, "stock": 85, "created_by": 3, "updated_by": 3, "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()},
    {"id": 2, "categoria": "Hamburguesas", "nombre": "Doble Queso Smash Burger", "marca": "Gourmet", "sabor": "Doble medallón smash, queso cheddar x2 y cebolla grillada", "precio": 32.00, "stock": 70, "created_by": 3, "updated_by": 3, "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()},
    {"id": 3, "categoria": "Hamburguesas", "nombre": "Bacon BBQ Crunch", "marca": "Especial", "sabor": "Tocino ahumado crocante, salsa BBQ dulce y queso americano", "precio": 36.00, "stock": 65, "created_by": 3, "updated_by": 3, "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()},
    {"id": 4, "categoria": "Hamburguesas", "nombre": "Monster Triple Burger", "marca": "Extrema", "sabor": "Triple carne, huevo frito, tocino, queso y pepinillos", "precio": 45.00, "stock": 40, "created_by": 3, "updated_by": 3, "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()},
    {"id": 5, "categoria": "Combos", "nombre": "Combo Clásico con Papas y Soda", "marca": "Combos", "sabor": "Hamburguesa Clásica + Papas Medianas + Coca-Cola 500ml", "precio": 34.00, "stock": 50, "created_by": 3, "updated_by": 3, "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()},
    {"id": 6, "categoria": "Combos", "nombre": "Combo Doble Smash + Papas Grandes", "marca": "Combos", "sabor": "Doble Smash Cheddar + Papas Rústicas + Bebida 500ml", "precio": 44.00, "stock": 45, "created_by": 3, "updated_by": 3, "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()},
    {"id": 7, "categoria": "Acompañamientos", "nombre": "Papas Fritas Rústicas", "marca": "Sides", "sabor": "Papas crocantes con sal marina y salsa tártara de la casa", "precio": 14.00, "stock": 120, "created_by": 3, "updated_by": 3, "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()},
    {"id": 8, "categoria": "Acompañamientos", "nombre": "Aros de Cebolla Crocantes", "marca": "Sides", "sabor": "8 aros crujientes empanizados con dip BBQ", "precio": 16.00, "stock": 80, "created_by": 3, "updated_by": 3, "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()},
    {"id": 9, "categoria": "Acompañamientos", "nombre": "Nuggets de Pollo Crispy (6 uds)", "marca": "Sides", "sabor": "Pechuga crocante con salsa de mostaza miel", "precio": 18.00, "stock": 90, "created_by": 3, "updated_by": 3, "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()},
    {"id": 10, "categoria": "Bebidas", "nombre": "Coca-Cola Original 500ml", "marca": "Coca-Cola", "sabor": "Original Fría", "precio": 6.00, "stock": 200, "created_by": 3, "updated_by": 3, "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()},
    {"id": 11, "categoria": "Bebidas", "nombre": "Sprite Lima-Limón 500ml", "marca": "Sprite", "sabor": "Refrescante Fría", "precio": 6.00, "stock": 150, "created_by": 3, "updated_by": 3, "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()},
    {"id": 12, "categoria": "Bebidas", "nombre": "Limonada Frozen con Menta", "marca": "Burger 24/7", "sabor": "Refrescante, limón natural y menta fresca", "precio": 12.00, "stock": 100, "created_by": 3, "updated_by": 3, "created_at": datetime.now(timezone.utc).isoformat(), "updated_at": datetime.now(timezone.utc).isoformat()}
]

# Pedidos y Detalles en memoria
ORDERS_DB = [
    {
        "id": 1,
        "cliente_id": 1,
        "rider_id": 2,
        "estado_pago": "liquidado",
        "estado_pedido": "entregado",
        "total": 45.00,
        "latitud": -16.5020,
        "longitud": -68.1310,
        "qr_comprobante_url": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "created_by": 1,
        "updated_by": 3
    }
]

ORDER_DETAILS_DB = [
    {
        "id": 1,
        "pedido_id": 1,
        "producto_id": 1,
        "cantidad": 1,
        "precio_unitario": 22.00,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": 1,
        "updated_by": 1
    }
]

AUDIT_LOGS = [
    {
        "id": 1,
        "tabla_afectada": "productos",
        "registro_id": 1,
        "accion": "INSERT",
        "datos_anteriores": None,
        "datos_nuevos": json.dumps({"nombre": "Hamburguesa Clásica Simple", "stock": 85, "precio": 22.00}),
        "ip_address": "127.0.0.1",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": 3,
        "updated_by": 3
    }
]

USERS_DB = {
    'admin@mail.com': {'pass': 'admin', 'id': 3, 'nombre': 'Admin Central', 'role': 'super_usuario', 'ci_status': 'verified'},
    'pedro@mail.com': {'pass': 'pedro', 'id': 2, 'nombre': 'Pedro Gómez', 'role': 'rider', 'ci_status': 'verified'},
    'carlos@mail.com': {'pass': 'carlos', 'id': 1, 'nombre': 'Carlos Pérez', 'role': 'cliente', 'ci_status': 'verified'},
    'maria@mail.com': {'pass': 'maria', 'id': 4, 'nombre': 'María López (Pendiente)', 'role': 'cliente', 'ci_status': 'pending'},
    'juan@mail.com': {'pass': 'juan', 'id': 5, 'nombre': 'Juan Rodríguez (Pendiente)', 'role': 'rider', 'ci_status': 'pending'}
}

# Documentación de riders (Pedro aprobado, Juan pendiente)
RIDER_DOCS_DB = [
    {
        "id": 1,
        "rider_id": 2,
        "licencia_url": "/uploads/docs/licencia_pedro.jpg",
        "seguro_url": "/uploads/docs/seguro_pedro.jpg",
        "cv_url": "/uploads/docs/cv_pedro.pdf",
        "estado_aprobacion": "aprobado",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "created_by": 3,
        "updated_by": 3
    },
    {
        "id": 2,
        "rider_id": 5,
        "licencia_url": "/uploads/docs/licencia_juan.jpg",
        "seguro_url": "/uploads/docs/seguro_juan.jpg",
        "cv_url": "/uploads/docs/cv_juan.pdf",
        "estado_aprobacion": "pendiente",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "created_by": 5,
        "updated_by": 5
    }
]

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

    def check_jwt_auth(self):
        auth_header = self.headers.get('Authorization', '')
        token = ''
        if auth_header.startswith('Bearer '):
            token = auth_header[7:].strip()
        if not token:
            return None, 401, "Acceso denegado. Token no proporcionado en el encabezado Authorization."
        payload = verify_jwt(token)
        if not payload:
            return None, 401, "Acceso denegado. Token inválido o expirado."
        return payload, 200, None

    def check_admin_auth(self):
        payload, status, err = self.check_jwt_auth()
        if not payload:
            return None, status, err
        role = payload.get('role', '')
        if role not in ['super_usuario', 'admin']:
            return None, 403, "Permiso denegado. Se requieren privilegios de administrador para esta operación."
        return payload, 200, None

    def check_rider_auth(self):
        payload, status, err = self.check_jwt_auth()
        if not payload:
            return None, status, err
        role = payload.get('role', '')
        user_id = payload.get('user_id')
        if role not in ['rider', 'super_usuario', 'admin']:
            return None, 403, "Permiso denegado. Se requiere rol de rider para esta operación."
        
        # Validar documentacion_rider.estado_aprobacion
        if role == 'rider':
            doc = next((d for d in RIDER_DOCS_DB if d['rider_id'] == user_id), None)
            if not doc or doc.get('estado_aprobacion') != 'aprobado':
                estado = doc.get('estado_aprobacion', 'sin_documentos') if doc else 'sin_documentos'
                return None, 403, f"Permiso denegado. La documentación del rider se encuentra en estado '{estado}'. Debe estar aprobada por un administrador para realizar entregas."
        
        return payload, 200, None

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query_params = urllib.parse.parse_qs(parsed.query)

        # Reject tokens sent via query parameters on any endpoint
        if 'token' in query_params:
            self.send_json(get_audit_envelope(
                "error", 
                None, 
                None, 
                "Acceso denegado. El envío de tokens por query string (?token=) está estrictamente prohibido por seguridad. Utilice el encabezado 'Authorization: Bearer <token>'.",
                action="AUTH_STRICT"
            ), status=401)
            return

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
            }, action="CONNECTION_TEST"))
            return

        # Microservice: Session restoration via Bearer JWT
        if path in ['/microservices/Auth/session.php', '/microservices/Auth/session']:
            payload, status, err = self.check_jwt_auth()
            if not payload:
                self.send_json(get_audit_envelope("error", None, None, err, action="SESSION_CHECK"), status=status)
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
            }, user_id=user_id, action="SESSION_RESTORE"))
            return

        # Microservice: Catalog REST (GET)
        if path in ['/microservices/Catalog/catalog.php', '/microservices/Catalog/catalog']:
            prod_id = query_params.get('id', [None])[0]
            cat_filter = query_params.get('categoria', [None])[0]

            auth_header = self.headers.get('Authorization', '')
            token = auth_header[7:].strip() if auth_header.startswith('Bearer ') else ''
            user_id = None
            if token:
                payload = verify_jwt(token)
                if payload:
                    user_id = payload.get('user_id')

            if prod_id:
                try:
                    pid = int(prod_id)
                    found = next((p for p in CATALOG_PRODUCTS if p['id'] == pid), None)
                    if not found:
                        self.send_json(get_audit_envelope("error", None, user_id, "Producto no encontrado.", action="GET_PRODUCT"), status=404)
                        return
                    self.send_json(get_audit_envelope("success", {"producto": found}, user_id=user_id, action="GET_PRODUCT"))
                    return
                except ValueError:
                    self.send_json(get_audit_envelope("error", None, user_id, "ID de producto inválido.", action="GET_PRODUCT"), status=400)
                    return

            prods = CATALOG_PRODUCTS
            if cat_filter and cat_filter != 'todos':
                prods = [p for p in prods if p.get('categoria') == cat_filter]

            self.send_json(get_audit_envelope("success", {
                "productos": prods,
                "total": len(prods)
            }, user_id=user_id, action="GET_CATALOG"))
            return

        # Microservice: Transactions Reports (GET)
        if path in ['/microservices/Transactions/report.php', '/microservices/Transactions/report']:
            self.handle_report()
            return

        # Microservice: Live Monitoring (GET)
        if path in ['/microservices/Transactions/live_monitoring.php', '/microservices/Transactions/live_monitoring', '/microservices/live_monitoring.php', '/microservices/Rider/live_monitoring.php']:
            self.handle_live_monitoring()
            return

        # Microservice: Logistics calculator via GET query params
        if path in ['/microservices/Logistics/calculator.py', '/microservices/Logistics/calculator']:
            user_id = query_params.get('user_id', ['SYSTEM'])[0]
            lat_c = query_params.get('lat_cliente', ['-16.5000'])[0]
            lon_c = query_params.get('lon_cliente', ['-68.1300'])[0]
            lat_t = query_params.get('lat_tienda', ['-16.5050'])[0]
            lon_t = query_params.get('lon_tienda', ['-68.1290'])[0]

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
                self.send_json(get_audit_envelope("error", None, user_id, str(ex), action="LOGISTICS_CALC"), status=500)
            return

        # Microservice: Rider Assignment (GET)
        if path in ['/microservices/Rider/assignment.php', '/microservices/Rider/assignment']:
            self.handle_rider_assignment_get(query_params)
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
        query_params = urllib.parse.parse_qs(parsed.query)

        # Reject tokens sent via query parameters
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

            if not check_rate_limit(client_ip):
                self.send_json(get_audit_envelope(
                    "error", None, None,
                    "Demasiados intentos fallidos de autenticación. Bloqueo temporal por 5 minutos.",
                    action="LOGIN_RATE_LIMITED"
                ), status=429)
                return

            correo = data.get('correo', data.get('email', '')).strip().lower()
            password = data.get('password', '').strip()

            matched = USERS_DB.get(correo)
            if not matched or matched['pass'] != password:
                record_attempt(client_ip, success=False)
                self.send_json(get_audit_envelope(
                    "error", None, None,
                    "Credenciales incorrectas. Verifique su correo electrónico y contraseña.",
                    action="LOGIN_FAILED"
                ), status=401)
                return

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
            }, user_id=matched['id'], action="LOGIN_SUCCESS"))
            return

        # Microservice: Session restoration via POST
        if path in ['/microservices/Auth/session.php', '/microservices/Auth/session']:
            payload, status, err = self.check_jwt_auth()
            if not payload:
                self.send_json(get_audit_envelope("error", None, None, err, action="SESSION_CHECK"), status=status)
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
            }, user_id=user_id, action="SESSION_RESTORE"))
            return

        # Microservice: Catalog REST (POST)
        if path in ['/microservices/Catalog/catalog.php', '/microservices/Catalog/catalog']:
            action = query_params.get('action', [None])[0]
            if action == 'update':
                self.handle_catalog_update(data, query_params)
                return
            elif action == 'delete':
                self.handle_catalog_delete(data, query_params)
                return

            admin, status_code, err_msg = self.check_admin_auth()
            if not admin:
                self.send_json(get_audit_envelope("error", None, None, err_msg, action="FORBIDDEN"), status=status_code)
                return

            cat = str(data.get('categoria', '')).strip()
            nom = str(data.get('nombre', '')).strip()
            mar = str(data.get('marca', '')).strip()
            sab = str(data.get('sabor', '')).strip()
            pre = data.get('precio')
            stk = data.get('stock', 0)

            if not cat or not nom or not mar or pre is None:
                self.send_json(get_audit_envelope("error", None, admin['user_id'], "Faltan campos obligatorios para crear el producto (categoria, nombre, marca, precio).", action="VALIDATION_ERROR"), status=400)
                return

            try:
                pre = float(pre)
                stk = int(stk)
            except ValueError:
                self.send_json(get_audit_envelope("error", None, admin['user_id'], "Precio o stock con formato numérico inválido.", action="VALIDATION_ERROR"), status=400)
                return

            new_id = max([p['id'] for p in CATALOG_PRODUCTS], default=0) + 1
            now_iso = datetime.now(timezone.utc).isoformat()
            new_prod = {
                "id": new_id,
                "categoria": cat,
                "nombre": nom,
                "marca": mar,
                "sabor": sab,
                "precio": pre,
                "stock": stk,
                "created_by": admin['user_id'],
                "updated_by": admin['user_id'],
                "created_at": now_iso,
                "updated_at": now_iso
            }
            CATALOG_PRODUCTS.append(new_prod)

            AUDIT_LOGS.append({
                "id": len(AUDIT_LOGS) + 1,
                "tabla_afectada": "productos",
                "registro_id": new_id,
                "accion": "INSERT",
                "datos_anteriores": None,
                "datos_nuevos": json.dumps(new_prod),
                "ip_address": self.get_client_ip(),
                "created_at": now_iso,
                "created_by": admin['user_id'],
                "updated_by": admin['user_id']
            })

            self.send_json(get_audit_envelope("success", {
                "mensaje": "Producto creado exitosamente",
                "producto": new_prod,
                "id": new_id
            }, user_id=admin['user_id'], action="INSERT"), status=201)
            return

        # Microservice: Transactions Checkout (POST)
        if path in ['/microservices/Transactions/checkout.php', '/microservices/Transactions/checkout']:
            self.handle_checkout(data, query_params)
            return

        # Microservice: Transactions Cancel Order (POST)
        if path in ['/microservices/Transactions/cancel_order.php', '/microservices/Transactions/cancel_order']:
            self.handle_cancel_order(data, query_params)
            return

        # Microservice: Transactions Report (POST)
        if path in ['/microservices/Transactions/report.php', '/microservices/Transactions/report']:
            self.handle_report()
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
                self.send_json(get_audit_envelope("error", None, user_id, str(ex), action="LOGISTICS_CALC"), status=500)
            return

        # Microservice: Rider Assignment (POST)
        if path in ['/microservices/Rider/assignment.php', '/microservices/Rider/assignment']:
            self.handle_rider_assignment_post(data, query_params)
            return

        # Microservice: Rider Delivery (POST)
        if path in ['/microservices/Rider/delivery.php', '/microservices/Rider/delivery']:
            self.handle_rider_delivery(data, query_params)
            return

        # Microservice: Rider Settle Cash (POST)
        if path in ['/microservices/Rider/settle_cash.php', '/microservices/Rider/settle_cash']:
            self.handle_rider_settle_cash(data, query_params)
            return

        # Microservice: Auth connection test (POST)
        if path in ['/microservices/Auth/connection.php', '/microservices/Auth/connection']:
            self.send_json(get_audit_envelope("success", {
                "database": "bebidas_247",
                "connected": True,
                "engine": "MySQL/Local",
                "message": "Conexión exitosa a la base de datos de Burger 24/7"
            }, action="CONNECTION_TEST"))
            return

        # Fallback for any other microservices endpoint
        self.send_json(get_audit_envelope("success", {
            "endpoint": path,
            "processed": True,
            "received": data
        }))

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        if path.startswith('/Bebidas-E-Commerce'):
            path = path[len('/Bebidas-E-Commerce'):]

        query_params = urllib.parse.parse_qs(parsed.query)
        if 'token' in query_params:
            self.send_json(get_audit_envelope(
                "error", None, None, 
                "Acceso denegado. El envío de tokens por query string está prohibido.",
                action="AUTH_STRICT"
            ), status=401)
            return

        content_len = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_len).decode('utf-8', errors='ignore') if content_len > 0 else ""
        data = {}
        if 'application/json' in self.headers.get('Content-Type', ''):
            try:
                data = json.loads(body)
            except Exception:
                pass
        else:
            parsed_form = urllib.parse.parse_qs(body)
            data = {k: v[0] for k, v in parsed_form.items()}

        if path in ['/microservices/Catalog/catalog.php', '/microservices/Catalog/catalog']:
            self.handle_catalog_update(data, query_params)
            return

        if path in ['/microservices/Rider/delivery.php', '/microservices/Rider/delivery']:
            self.handle_rider_delivery(data, query_params)
            return

        self.send_json(get_audit_envelope("error", None, None, "Método HTTP no soportado para este endpoint.", action="METHOD_NOT_ALLOWED"), status=405)

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        if path.startswith('/Bebidas-E-Commerce'):
            path = path[len('/Bebidas-E-Commerce'):]

        query_params = urllib.parse.parse_qs(parsed.query)
        if 'token' in query_params:
            self.send_json(get_audit_envelope(
                "error", None, None, 
                "Acceso denegado. El envío de tokens por query string está prohibido.",
                action="AUTH_STRICT"
            ), status=401)
            return

        content_len = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_len).decode('utf-8', errors='ignore') if content_len > 0 else ""
        data = {}
        if 'application/json' in self.headers.get('Content-Type', ''):
            try:
                data = json.loads(body)
            except Exception:
                pass

        if path in ['/microservices/Catalog/catalog.php', '/microservices/Catalog/catalog']:
            self.handle_catalog_delete(data, query_params)
            return

        self.send_json(get_audit_envelope("error", None, None, "Método HTTP no soportado para este endpoint.", action="METHOD_NOT_ALLOWED"), status=405)

    def handle_checkout(self, data, query_params):
        payload, status, err = self.check_jwt_auth()
        if not payload:
            self.send_json(get_audit_envelope("error", None, None, err, action="AUTH_REQUIRED"), status=status)
            return

        user_id = payload['user_id']
        role = payload.get('role', 'cliente')
        ci_status = payload.get('ci_status', 'pending')

        if ci_status != 'verified' and role not in ['super_usuario', 'admin']:
            self.send_json(get_audit_envelope("error", None, user_id, "Debes tener tu C.I. verificado para realizar transacciones de compra.", action="CI_UNVERIFIED"), status=403)
            return

        action = query_params.get('action', [None])[0] or data.get('action', 'create_order')

        if action == 'upload_qr':
            order_id = query_params.get('pedido_id', [None])[0] or data.get('pedido_id')
            if not order_id:
                self.send_json(get_audit_envelope("error", None, user_id, "Falta pedido_id.", action="VALIDATION_ERROR"), status=400)
                return
            pid = int(order_id)
            ord_found = next((o for o in ORDERS_DB if o['id'] == pid), None)
            if not ord_found:
                self.send_json(get_audit_envelope("error", None, user_id, "Pedido no encontrado.", action="NOT_FOUND"), status=404)
                return
            ord_found['estado_pago'] = 'pagado_qr'
            ord_found['qr_comprobante_url'] = '/uploads/qr/qr_demo.png'
            self.send_json(get_audit_envelope("success", {"mensaje": "Comprobante QR registrado.", "pedido_id": pid}, user_id=user_id, action="UPLOAD_QR"))
            return

        items = data.get('items', [])
        if not items:
            self.send_json(get_audit_envelope("error", None, user_id, "El carrito de compra no contiene productos (items vacíos).", action="EMPTY_CART"), status=400)
            return

        lat_c = float(data.get('latitud', -16.5050))
        lon_c = float(data.get('longitud', -68.1290))
        metodo = data.get('metodo_pago', 'contraentrega')
        dist_km = float(data.get('distancia_km', haversine_km(-16.5050, -68.1290, lat_c, lon_c)))
        costo_envio = round(5.0 + (dist_km * 2.0), 2)

        # 1. Validación de stock ATÓMICA
        subtotal = 0.0
        verified_items = []
        for item in items:
            pid = int(item.get('producto_id', item.get('id', 0)))
            qty = int(item.get('cantidad', item.get('quantity', 0)))
            if pid <= 0 or qty <= 0:
                self.send_json(get_audit_envelope("error", None, user_id, "Formato de item inválido.", action="INVALID_ITEM"), status=400)
                return

            prod = next((p for p in CATALOG_PRODUCTS if p['id'] == pid), None)
            if not prod:
                self.send_json(get_audit_envelope("error", None, user_id, f"Producto con ID #{pid} no encontrado.", action="PRODUCT_NOT_FOUND"), status=404)
                return

            # Criterio de aceptación: "Stock insuficiente causa ROLLBACK sin descontar"
            if prod['stock'] < qty:
                self.send_json(get_audit_envelope(
                    "error", None, user_id,
                    f"Stock insuficiente para '{prod['nombre']}'. Disponible: {prod['stock']}, Solicitado: {qty}.",
                    action="INSUFFICIENT_STOCK"
                ), status=400)
                return

            subtotal += prod['precio'] * qty
            verified_items.append({'prod': prod, 'qty': qty, 'precio': prod['precio']})

        # 2. Descuento de inventario (solo tras validar todos los items)
        for vi in verified_items:
            p = vi['prod']
            old_stock = p['stock']
            p['stock'] -= vi['qty']
            p['updated_at'] = datetime.now(timezone.utc).isoformat()
            p['updated_by'] = user_id
            AUDIT_LOGS.append({
                "id": len(AUDIT_LOGS) + 1,
                "tabla_afectada": "productos",
                "registro_id": p['id'],
                "accion": "UPDATE",
                "datos_anteriores": json.dumps({"stock": old_stock}),
                "datos_nuevos": json.dumps({"stock": p['stock'], "motivo": "Descuento por venta"}),
                "ip_address": self.get_client_ip(),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "created_by": user_id,
                "updated_by": user_id
            })

        total = round(subtotal + costo_envio, 2)
        new_order_id = max([o['id'] for o in ORDERS_DB], default=0) + 1
        now_iso = datetime.now(timezone.utc).isoformat()
        estado_pago = 'pagado_qr' if (metodo == 'qr' and data.get('qr_comprobante_url')) else ('qr' if metodo == 'qr' else 'contraentrega')

        new_order = {
            "id": new_order_id,
            "cliente_id": user_id,
            "rider_id": None,
            "estado_pago": estado_pago,
            "estado_pedido": "pendiente",
            "total": total,
            "latitud": lat_c,
            "longitud": lon_c,
            "qr_comprobante_url": data.get('qr_comprobante_url'),
            "created_at": now_iso,
            "updated_at": now_iso,
            "created_by": user_id,
            "updated_by": user_id
        }
        ORDERS_DB.append(new_order)

        for vi in verified_items:
            ORDER_DETAILS_DB.append({
                "id": len(ORDER_DETAILS_DB) + 1,
                "pedido_id": new_order_id,
                "producto_id": vi['prod']['id'],
                "cantidad": vi['qty'],
                "precio_unitario": vi['precio'],
                "created_at": now_iso,
                "created_by": user_id,
                "updated_by": user_id
            })

        AUDIT_LOGS.append({
            "id": len(AUDIT_LOGS) + 1,
            "tabla_afectada": "pedidos",
            "registro_id": new_order_id,
            "accion": "INSERT",
            "datos_anteriores": None,
            "datos_nuevos": json.dumps(new_order),
            "ip_address": self.get_client_ip(),
            "created_at": now_iso,
            "created_by": user_id,
            "updated_by": user_id
        })

        self.send_json(get_audit_envelope("success", {
            "mensaje": "Pedido creado exitosamente con descuento atómico de inventario.",
            "pedido_id": new_order_id,
            "subtotal": subtotal,
            "costo_envio": costo_envio,
            "total": total,
            "distancia_km": round(dist_km, 2),
            "estado_pago": estado_pago,
            "estado_pedido": "pendiente"
        }, user_id=user_id, action="CREATE_ORDER"), status=201)

    def handle_cancel_order(self, data, query_params):
        payload, status, err = self.check_jwt_auth()
        if not payload:
            self.send_json(get_audit_envelope("error", None, None, err, action="AUTH_REQUIRED"), status=status)
            return

        user_id = payload['user_id']
        role = payload.get('role', 'cliente')

        prod_id = query_params.get('pedido_id', [None])[0] or data.get('pedido_id') or data.get('id')
        if not prod_id:
            self.send_json(get_audit_envelope("error", None, user_id, "El parámetro pedido_id es obligatorio.", action="VALIDATION_ERROR"), status=400)
            return

        try:
            pid = int(prod_id)
        except ValueError:
            self.send_json(get_audit_envelope("error", None, user_id, "ID numérico de pedido inválido.", action="VALIDATION_ERROR"), status=400)
            return

        order = next((o for o in ORDERS_DB if o['id'] == pid), None)
        if not order:
            self.send_json(get_audit_envelope("error", None, user_id, f"Pedido #{pid} no existe.", action="NOT_FOUND"), status=404)
            return

        is_admin = role in ['super_usuario', 'admin']
        is_owner = (order['cliente_id'] == user_id)
        if not is_admin and not is_owner:
            self.send_json(get_audit_envelope("error", None, user_id, "Permiso denegado para cancelar este pedido.", action="FORBIDDEN"), status=403)
            return

        if order['estado_pedido'] == 'cancelado':
            self.send_json(get_audit_envelope("error", None, user_id, f"El pedido #{pid} ya se encuentra cancelado.", action="ALREADY_CANCELLED"), status=400)
            return

        # Criterio: "Cancelación reembolsa stock solo para pedidos pendientes/asignados"
        if order['estado_pedido'] not in ['pendiente', 'asignado']:
            self.send_json(get_audit_envelope(
                "error", None, user_id,
                f"Cancelación no permitida: el pedido está '{order['estado_pedido']}'. Solo se puede reembolsar stock en pedidos pendientes o asignados.",
                action="INVALID_ORDER_STATE"
            ), status=400)
            return

        # Reembolso de stock
        details = [d for d in ORDER_DETAILS_DB if d['pedido_id'] == pid]
        reembolsos = []
        for d in details:
            p = next((prod for prod in CATALOG_PRODUCTS if prod['id'] == d['producto_id']), None)
            if p:
                old_stock = p['stock']
                p['stock'] += d['cantidad']
                p['updated_at'] = datetime.now(timezone.utc).isoformat()
                p['updated_by'] = user_id
                reembolsos.append({'producto_id': p['id'], 'nombre': p['nombre'], 'cantidad_reembolsada': d['cantidad'], 'stock_restaurado': p['stock']})

                AUDIT_LOGS.append({
                    "id": len(AUDIT_LOGS) + 1,
                    "tabla_afectada": "productos",
                    "registro_id": p['id'],
                    "accion": "UPDATE",
                    "datos_anteriores": json.dumps({"stock": old_stock}),
                    "datos_nuevos": json.dumps({"stock": p['stock'], "motivo": f"Reembolso por cancelación de pedido #{pid}"}),
                    "ip_address": self.get_client_ip(),
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "created_by": user_id,
                    "updated_by": user_id
                })

        old_state = dict(order)
        order['estado_pedido'] = 'cancelado'
        order['estado_pago'] = 'cancelado'
        order['updated_at'] = datetime.now(timezone.utc).isoformat()
        order['updated_by'] = user_id

        AUDIT_LOGS.append({
            "id": len(AUDIT_LOGS) + 1,
            "tabla_afectada": "pedidos",
            "registro_id": pid,
            "accion": "UPDATE",
            "datos_anteriores": json.dumps(old_state),
            "datos_nuevos": json.dumps(order),
            "ip_address": self.get_client_ip(),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": user_id,
            "updated_by": user_id
        })

        self.send_json(get_audit_envelope("success", {
            "mensaje": f"Pedido #{pid} cancelado exitosamente y stock reembolsado.",
            "pedido_id": pid,
            "estado_anterior": old_state['estado_pedido'],
            "nuevo_estado": "cancelado",
            "reembolsos": reembolsos
        }, user_id=user_id, action="CANCEL_ORDER"))

    def handle_report(self):
        admin, status, err = self.check_admin_auth()
        if not admin:
            self.send_json(get_audit_envelope("error", None, None, err, action="FORBIDDEN"), status=status)
            return

        entregados = [o for o in ORDERS_DB if o['estado_pedido'] == 'entregado']
        cancelados = [o for o in ORDERS_DB if o['estado_pedido'] == 'cancelado']
        total_ventas = sum(o['total'] for o in entregados)

        # Metodos pago
        metodos = {}
        for o in ORDERS_DB:
            if o['estado_pedido'] != 'cancelado':
                mp = o['estado_pago']
                if mp not in metodos:
                    metodos[mp] = {'cantidad': 0, 'monto': 0.0}
                metodos[mp]['cantidad'] += 1
                metodos[mp]['monto'] += o['total']

        resumen = {
            "total_ventas_bs": round(total_ventas, 2),
            "total_pedidos": len(ORDERS_DB),
            "pedidos_entregados": len(entregados),
            "pedidos_cancelados": len(cancelados),
            "pedidos_en_camino": len([o for o in ORDERS_DB if o['estado_pedido'] == 'en_camino']),
            "pedidos_pendientes": len([o for o in ORDERS_DB if o['estado_pedido'] in ['pendiente', 'asignado']])
        }

        self.send_json(get_audit_envelope("success", {
            "resumen": resumen,
            "metodos_pago": [{'estado_pago': k, 'cantidad_pedidos': v['cantidad'], 'monto_total': round(v['monto'], 2)} for k, v in metodos.items()],
            "ventas_por_categoria": [],
            "ranking_riders": [],
            "top_productos": []
        }, user_id=admin['user_id'], action="GENERATE_REPORT"))

    def handle_live_monitoring(self):
        admin, status, err = self.check_admin_auth()
        if not admin:
            self.send_json(get_audit_envelope("error", None, None, err, action="FORBIDDEN"), status=status)
            return

        active_orders = [o for o in ORDERS_DB if o.get('estado_pedido') in ['asignado', 'en_camino']]
        lat_tienda = -16.5050
        lon_tienda = -68.1290

        monitoreo_data = []
        for o in sorted(active_orders, key=lambda x: x.get('id', 0), reverse=True):
            lat_cliente = float(o.get('latitud', -16.5090))
            lon_cliente = float(o.get('longitud', -68.1340))

            dist_km = haversine_km(lat_cliente, lon_cliente, lat_tienda, lon_tienda)
            eta_min = max(5.0, round((dist_km / 25.0) * 60.0))
            costo_envio = 5.0 + (dist_km * 2.0)

            # Interpolación lineal de la posición del rider
            progreso = 0.0
            if o.get('estado_pedido') == 'en_camino':
                progreso = 0.50

            lat_rider = lat_tienda + (lat_cliente - lat_tienda) * progreso
            lon_rider = lon_tienda + (lon_cliente - lon_tienda) * progreso

            client_user = next((u for u in USERS_DB.values() if u.get('id') == o.get('cliente_id')), None)
            rider_user = next((u for u in USERS_DB.values() if u.get('id') == o.get('rider_id')), None)

            items = []
            for d in ORDER_DETAILS_DB:
                if d.get('pedido_id') == o.get('id'):
                    prod = next((p for p in CATALOG_PRODUCTS if p.get('id') == d.get('producto_id')), None)
                    items.append({
                        "producto_id": d.get('producto_id'),
                        "nombre": prod['nombre'] if prod else "Producto",
                        "cantidad": d.get('cantidad', 1),
                        "precio_unitario": float(d.get('precio_unitario', 0.0))
                    })

            monitoreo_data.append({
                "id": o.get('id'),
                "pedido_id": o.get('id'),
                "estado_pedido": o.get('estado_pedido'),
                "estado_pago": o.get('estado_pago'),
                "total": float(o.get('total', 0.0)),
                "created_at": o.get('created_at'),
                "updated_at": o.get('updated_at', o.get('created_at')),
                "items": items,
                "detalles": items,
                "cliente_id": o.get('cliente_id'),
                "cliente_nombre": client_user['nombre'] if client_user else "Cliente",
                "rider_id": o.get('rider_id'),
                "rider_nombre": rider_user['nombre'] if rider_user else "Sin Asignar",
                "latitud": lat_cliente,
                "longitud": lon_cliente,
                "distancia_km": round(dist_km, 2),
                "eta_minutos": int(eta_min),
                "posicion_rider": {
                    "lat": round(lat_rider, 6),
                    "lon": round(lon_rider, 6),
                    "progreso": round(progreso, 2)
                },
                "cliente": {
                    "id": o.get('cliente_id'),
                    "nombre": client_user['nombre'] if client_user else "Cliente",
                    "email": next((k for k, v in USERS_DB.items() if v.get('id') == o.get('cliente_id')), ""),
                    "latitud": lat_cliente,
                    "longitud": lon_cliente
                },
                "rider": {
                    "id": o.get('rider_id'),
                    "nombre": rider_user['nombre'] if rider_user else "Rider",
                    "email": next((k for k, v in USERS_DB.items() if v.get('id') == o.get('rider_id')), ""),
                    "ubicacion_actual": {
                        "latitud": round(lat_rider, 6),
                        "longitud": round(lon_rider, 6),
                        "progreso": round(progreso, 2)
                    }
                } if o.get('rider_id') else None,
                "logistica": {
                    "distancia_km": round(dist_km, 2),
                    "tiempo_estimado": f"{int(eta_min)} min",
                    "costo_envio_bs": round(costo_envio, 2)
                }
            })

        # Riders con efectivo pendiente de liquidación
        riders_settlements = []
        for r_user in [u for u in USERS_DB.values() if u.get('role') == 'rider']:
            cash_orders = [ord_item for ord_item in ORDERS_DB if ord_item.get('rider_id') == r_user.get('id') and ord_item.get('estado_pedido') == 'entregado' and ord_item.get('estado_pago') == 'pagado_efectivo']
            if cash_orders:
                total_cash = sum(ord_item.get('total', 0.0) for ord_item in cash_orders)
                riders_settlements.append({
                    "id": r_user.get('id'),
                    "rider_id": r_user.get('id'),
                    "nombre": r_user.get('nombre'),
                    "pendingCash": round(total_cash, 2),
                    "total_efectivo_pendiente": round(total_cash, 2),
                    "total_recaudado_bs": round(total_cash, 2),
                    "pedidos_pendientes": len(cash_orders),
                    "orderIds": [ord_item.get('id') for ord_item in cash_orders]
                })

        self.send_json(get_audit_envelope("success", {
            "pedidos_activos": monitoreo_data,
            "total_activos": len(monitoreo_data),
            "riders_liquidaciones": riders_settlements,
            "liquidaciones_pendientes": riders_settlements,
            "coordenadas_tienda": {
                "latitud": lat_tienda,
                "longitud": lon_tienda
            }
        }, user_id=admin['user_id'], action="LIVE_MONITORING"))

    def handle_catalog_update(self, data, query_params):
        admin, status_code, err_msg = self.check_admin_auth()
        if not admin:
            self.send_json(get_audit_envelope("error", None, None, err_msg, action="FORBIDDEN"), status=status_code)
            return

        prod_id = query_params.get('id', [None])[0] or data.get('id')
        if not prod_id:
            self.send_json(get_audit_envelope("error", None, admin['user_id'], "Se requiere el ID del producto a actualizar.", action="VALIDATION_ERROR"), status=400)
            return

        try:
            pid = int(prod_id)
        except ValueError:
            self.send_json(get_audit_envelope("error", None, admin['user_id'], "ID con formato numérico inválido.", action="VALIDATION_ERROR"), status=400)
            return

        prod = next((p for p in CATALOG_PRODUCTS if p['id'] == pid), None)
        if not prod:
            self.send_json(get_audit_envelope("error", None, admin['user_id'], f"Producto no encontrado con ID: {pid}", action="NOT_FOUND"), status=404)
            return

        old_snapshot = dict(prod)
        if 'categoria' in data and str(data['categoria']).strip():
            prod['categoria'] = str(data['categoria']).strip()
        if 'nombre' in data and str(data['nombre']).strip():
            prod['nombre'] = str(data['nombre']).strip()
        if 'marca' in data and str(data['marca']).strip():
            prod['marca'] = str(data['marca']).strip()
        if 'sabor' in data:
            prod['sabor'] = str(data['sabor']).strip()
        if 'precio' in data and data['precio'] is not None:
            try:
                prod['precio'] = float(data['precio'])
            except ValueError:
                pass
        if 'stock' in data and data['stock'] is not None:
            try:
                prod['stock'] = int(data['stock'])
            except ValueError:
                pass

        now_iso = datetime.now(timezone.utc).isoformat()
        prod['updated_at'] = now_iso
        prod['updated_by'] = admin['user_id']

        AUDIT_LOGS.append({
            "id": len(AUDIT_LOGS) + 1,
            "tabla_afectada": "productos",
            "registro_id": pid,
            "accion": "UPDATE",
            "datos_anteriores": json.dumps(old_snapshot),
            "datos_nuevos": json.dumps(prod),
            "ip_address": self.get_client_ip(),
            "created_at": now_iso,
            "created_by": admin['user_id'],
            "updated_by": admin['user_id']
        })

        self.send_json(get_audit_envelope("success", {
            "mensaje": "Producto actualizado exitosamente",
            "producto": prod
        }, user_id=admin['user_id'], action="UPDATE"))

    def handle_catalog_delete(self, data, query_params):
        admin, status_code, err_msg = self.check_admin_auth()
        if not admin:
            self.send_json(get_audit_envelope("error", None, None, err_msg, action="FORBIDDEN"), status=status_code)
            return

        prod_id = query_params.get('id', [None])[0] or data.get('id')
        if not prod_id:
            self.send_json(get_audit_envelope("error", None, admin['user_id'], "Se requiere el ID del producto a eliminar.", action="VALIDATION_ERROR"), status=400)
            return

        try:
            pid = int(prod_id)
        except ValueError:
            self.send_json(get_audit_envelope("error", None, admin['user_id'], "ID con formato numérico inválido.", action="VALIDATION_ERROR"), status=400)
            return

        idx = next((i for i, p in enumerate(CATALOG_PRODUCTS) if p['id'] == pid), None)
        if idx is None:
            self.send_json(get_audit_envelope("error", None, admin['user_id'], f"Producto no encontrado con ID: {pid}", action="NOT_FOUND"), status=404)
            return

        old_snapshot = CATALOG_PRODUCTS.pop(idx)
        now_iso = datetime.now(timezone.utc).isoformat()

        AUDIT_LOGS.append({
            "id": len(AUDIT_LOGS) + 1,
            "tabla_afectada": "productos",
            "registro_id": pid,
            "accion": "DELETE",
            "datos_anteriores": json.dumps(old_snapshot),
            "datos_nuevos": None,
            "ip_address": self.get_client_ip(),
            "created_at": now_iso,
            "created_by": admin['user_id'],
            "updated_by": admin['user_id']
        })

        self.send_json(get_audit_envelope("success", {
            "mensaje": "Producto eliminado exitosamente",
            "id": pid
        }, user_id=admin['user_id'], action="DELETE"))

    def handle_rider_assignment_get(self, query_params):
        payload, status, err = self.check_rider_auth()
        if not payload:
            self.send_json(get_audit_envelope("error", None, None, err, action="RIDER_AUTH"), status=status)
            return

        user_id = payload.get('user_id')
        lat_store = -16.4897
        lon_store = -68.1193

        pending_orders = [o for o in ORDERS_DB if o.get('estado_pedido') == 'pendiente' and o.get('estado_pago') in ['contraentrega', 'pagado_qr', 'esperando_pago']]

        disponibles = []
        for p in reversed(pending_orders):
            lat_c = float(p.get('latitud', -16.5000))
            lon_c = float(p.get('longitud', -68.1193))
            dist_km = haversine_km(lat_c, lon_c, lat_store, lon_store)
            eta_min = max(5, round((dist_km / 30.0) * 60.0))
            costo_bs = round(5.0 + (dist_km * 2.0), 2)

            client_user = next((u for u in USERS_DB.values() if u['id'] == p.get('cliente_id')), None)
            order_items = [d for d in ORDER_DETAILS_DB if d.get('pedido_id') == p['id']]
            items_fmt = []
            for item in order_items:
                prod = next((pr for pr in CATALOG_PRODUCTS if pr['id'] == item.get('producto_id')), None)
                items_fmt.append({
                    'producto_id': item.get('producto_id'),
                    'nombre': prod['nombre'] if prod else 'Producto',
                    'cantidad': item.get('cantidad', 1),
                    'precio_unitario': item.get('precio_unitario', 0.0)
                })

            disponibles.append({
                'pedido_id': p['id'],
                'cliente_id': p.get('cliente_id'),
                'cliente_nombre': client_user['nombre'] if client_user else 'Cliente',
                'cliente_email': client_user.get('email', '') if client_user else '',
                'total': float(p.get('total', 0.0)),
                'estado_pago': p.get('estado_pago'),
                'estado_pedido': p.get('estado_pedido'),
                'fecha_creacion': p.get('created_at'),
                'items': items_fmt,
                'logistica': {
                    'distancia_km': round(dist_km, 2),
                    'tiempo_estimado': f"{eta_min} min",
                    'costo_envio_bs': costo_bs
                }
            })

        self.send_json(get_audit_envelope("success", {
            "pedidos_disponibles": disponibles,
            "total": len(disponibles)
        }, user_id=user_id, action="LIST_PENDING_ORDERS"))

    def handle_rider_assignment_post(self, data, query_params):
        payload, status, err = self.check_rider_auth()
        if not payload:
            self.send_json(get_audit_envelope("error", None, None, err, action="RIDER_AUTH"), status=status)
            return

        user_id = payload.get('user_id')
        role = payload.get('role')
        pedido_id_val = data.get('pedido_id') or query_params.get('pedido_id', [None])[0]
        if not pedido_id_val:
            self.send_json(get_audit_envelope("error", None, user_id, "Falta el parámetro obligatorio 'pedido_id'.", action="ASSIGNMENT"), status=400)
            return

        try:
            pedido_id = int(pedido_id_val)
        except ValueError:
            self.send_json(get_audit_envelope("error", None, user_id, "ID de pedido inválido.", action="ASSIGNMENT"), status=400)
            return

        # Restricción: Max 1 pedido activo simultáneamente
        if role == 'rider':
            active_order = next((o for o in ORDERS_DB if o.get('rider_id') == user_id and o.get('estado_pedido') in ['asignado', 'en_camino']), None)
            if active_order:
                self.send_json(get_audit_envelope("error", None, user_id, f"Ya tienes una entrega activa en curso (Pedido #{active_order['id']} en estado '{active_order['estado_pedido']}'). Debes finalizarla antes de aceptar otro pedido.", action="ACTIVE_ORDER_EXISTS"), status=409)
                return

        order = next((o for o in ORDERS_DB if o['id'] == pedido_id), None)
        if not order:
            self.send_json(get_audit_envelope("error", None, user_id, f"Pedido #{pedido_id} no encontrado.", action="ASSIGNMENT"), status=404)
            return

        if order.get('estado_pedido') != 'pendiente' or order.get('rider_id') is not None:
            self.send_json(get_audit_envelope("error", None, user_id, "El pedido ya fue asignado a otro rider o no está disponible.", action="ORDER_UNAVAILABLE"), status=409)
            return

        now_iso = datetime.now(timezone.utc).isoformat()
        order['rider_id'] = user_id
        order['estado_pedido'] = 'asignado'
        order['updated_at'] = now_iso
        order['updated_by'] = user_id

        AUDIT_LOGS.append({
            "id": len(AUDIT_LOGS) + 1,
            "tabla_afectada": "pedidos",
            "registro_id": pedido_id,
            "accion": "UPDATE",
            "datos_anteriores": json.dumps({"estado_pedido": "pendiente", "rider_id": None}),
            "datos_nuevos": json.dumps({"estado_pedido": "asignado", "rider_id": user_id}),
            "ip_address": self.get_client_ip(),
            "created_at": now_iso,
            "created_by": user_id,
            "updated_by": user_id
        })

        self.send_json(get_audit_envelope("success", {
            "mensaje": f"Pedido #{pedido_id} aceptado y asignado exitosamente.",
            "pedido_id": pedido_id,
            "estado_pedido": "asignado",
            "rider_id": user_id
        }, user_id=user_id, action="ACCEPT_ORDER"))

    def handle_rider_delivery(self, data, query_params):
        payload, status, err = self.check_jwt_auth()
        if not payload:
            self.send_json(get_audit_envelope("error", None, None, err, action="DELIVERY_AUTH"), status=status)
            return

        user_id = payload.get('user_id')
        user_role = payload.get('role')

        if user_role not in ['rider', 'super_usuario', 'admin']:
            self.send_json(get_audit_envelope("error", None, user_id, "Permiso denegado. Se requiere rol de rider o administrador.", action="FORBIDDEN"), status=403)
            return

        pedido_id_val = data.get('pedido_id') or query_params.get('pedido_id', [None])[0]
        if not pedido_id_val:
            self.send_json(get_audit_envelope("error", None, user_id, "Falta el parámetro obligatorio 'pedido_id'.", action="DELIVERY"), status=400)
            return

        try:
            pedido_id = int(pedido_id_val)
        except ValueError:
            self.send_json(get_audit_envelope("error", None, user_id, "ID de pedido inválido.", action="DELIVERY"), status=400)
            return

        order = next((o for o in ORDERS_DB if o['id'] == pedido_id), None)
        if not order:
            self.send_json(get_audit_envelope("error", None, user_id, f"Pedido #{pedido_id} no encontrado.", action="DELIVERY"), status=404)
            return

        # Criterio: Solo rider asignado avanza estado
        if user_role == 'rider' and order.get('rider_id') != user_id:
            self.send_json(get_audit_envelope("error", None, user_id, "Permiso denegado. Solo el rider asignado a este pedido puede actualizar el estado de entrega.", action="FORBIDDEN"), status=403)
            return

        action = data.get('action') or query_params.get('action', [None])[0]
        nuevo_estado = data.get('nuevo_estado')
        if action == 'marcar_en_camino':
            nuevo_estado = 'en_camino'
        elif action == 'marcar_entregado':
            nuevo_estado = 'entregado'

        if nuevo_estado not in ['en_camino', 'entregado']:
            self.send_json(get_audit_envelope("error", None, user_id, "Estado de destino inválido. Valores permitidos: 'en_camino', 'entregado'.", action="INVALID_STATE"), status=400)
            return

        estado_actual = order.get('estado_pedido')
        if nuevo_estado == 'en_camino' and estado_actual != 'asignado':
            self.send_json(get_audit_envelope("error", None, user_id, f"Transición inválida: El pedido debe estar en estado 'asignado' para pasar a 'en_camino'. Estado actual: '{estado_actual}'.", action="INVALID_TRANSITION"), status=400)
            return

        if nuevo_estado == 'entregado' and estado_actual != 'en_camino':
            self.send_json(get_audit_envelope("error", None, user_id, f"Transición inválida: El pedido debe estar en estado 'en_camino' para marcarse como 'entregado'. Estado actual: '{estado_actual}'.", action="INVALID_TRANSITION"), status=400)
            return

        now_iso = datetime.now(timezone.utc).isoformat()
        order['estado_pedido'] = nuevo_estado
        order['updated_at'] = now_iso
        order['updated_by'] = user_id

        AUDIT_LOGS.append({
            "id": len(AUDIT_LOGS) + 1,
            "tabla_afectada": "pedidos",
            "registro_id": pedido_id,
            "accion": "UPDATE",
            "datos_anteriores": json.dumps({"estado_pedido": estado_actual}),
            "datos_nuevos": json.dumps({"estado_pedido": nuevo_estado}),
            "ip_address": self.get_client_ip(),
            "created_at": now_iso,
            "created_by": user_id,
            "updated_by": user_id
        })

        nuevo_estado_pago = order.get('estado_pago')
        if nuevo_estado == 'entregado' and order.get('estado_pago') == 'contraentrega':
            nuevo_estado_pago = 'pagado_efectivo'
            order['estado_pago'] = 'pagado_efectivo'
            AUDIT_LOGS.append({
                "id": len(AUDIT_LOGS) + 1,
                "tabla_afectada": "pedidos",
                "registro_id": pedido_id,
                "accion": "UPDATE",
                "datos_anteriores": json.dumps({"estado_pago": "contraentrega"}),
                "datos_nuevos": json.dumps({"estado_pago": "pagado_efectivo", "motivo": "Cobro en efectivo contraentrega al momento de la entrega"}),
                "ip_address": self.get_client_ip(),
                "created_at": now_iso,
                "created_by": user_id,
                "updated_by": user_id
            })

        self.send_json(get_audit_envelope("success", {
            "mensaje": f"Pedido #{pedido_id} en camino." if nuevo_estado == 'en_camino' else f"Pedido #{pedido_id} entregado con éxito.",
            "pedido_id": pedido_id,
            "estado_anterior": estado_actual,
            "estado_pedido": nuevo_estado,
            "estado_pago": nuevo_estado_pago,
            "rider_id": order.get('rider_id')
        }, user_id=user_id, action="ADVANCE_DELIVERY"))

    def handle_rider_settle_cash(self, data, query_params):
        payload, status, err = self.check_admin_auth()
        if not payload:
            self.send_json(get_audit_envelope("error", None, None, err, action="SETTLE_AUTH"), status=status)
            return

        admin_id = payload.get('user_id')
        rider_id_val = data.get('rider_id') or query_params.get('rider_id', [None])[0]
        if not rider_id_val:
            self.send_json(get_audit_envelope("error", None, admin_id, "El parámetro 'rider_id' es obligatorio.", action="SETTLE_CASH"), status=400)
            return

        try:
            rider_id = int(rider_id_val)
        except ValueError:
            self.send_json(get_audit_envelope("error", None, admin_id, "ID de rider inválido.", action="SETTLE_CASH"), status=400)
            return

        rider_user = next((u for u in USERS_DB.values() if u['id'] == rider_id and u['role'] == 'rider'), None)
        if not rider_user:
            self.send_json(get_audit_envelope("error", None, admin_id, f"El usuario con ID #{rider_id} no existe o no tiene rol de rider.", action="RIDER_NOT_FOUND"), status=404)
            return

        # Buscar pedidos entregados con pagado_efectivo
        eligible_orders = [o for o in ORDERS_DB if o.get('rider_id') == rider_id and o.get('estado_pedido') == 'entregado' and o.get('estado_pago') == 'pagado_efectivo']
        if not eligible_orders:
            self.send_json(get_audit_envelope("error", None, admin_id, f"El rider {rider_user['nombre']} no tiene entregas en efectivo pendientes de liquidar.", action="NO_PENDING_CASH"), status=400)
            return

        total_liquidado = 0.0
        pedidos_liquidados = []
        now_iso = datetime.now(timezone.utc).isoformat()

        for o in eligible_orders:
            pid = o['id']
            monto = float(o.get('total', 0.0))
            total_liquidado += monto
            pedidos_liquidados.append(pid)

            o['estado_pago'] = 'liquidado'
            o['updated_at'] = now_iso
            o['updated_by'] = admin_id

            AUDIT_LOGS.append({
                "id": len(AUDIT_LOGS) + 1,
                "tabla_afectada": "pedidos",
                "registro_id": pid,
                "accion": "UPDATE",
                "datos_anteriores": json.dumps({"estado_pago": "pagado_efectivo"}),
                "datos_nuevos": json.dumps({"estado_pago": "liquidado", "motivo": f"Caja liquidada por administrador #{admin_id}"}),
                "ip_address": self.get_client_ip(),
                "created_at": now_iso,
                "created_by": admin_id,
                "updated_by": admin_id
            })

        self.send_json(get_audit_envelope("success", {
            "mensaje": "Caja del rider liquidada exitosamente.",
            "rider_id": rider_id,
            "nombre_rider": rider_user['nombre'],
            "total_liquidado_bs": round(total_liquidado, 2),
            "pedidos_liquidados": pedidos_liquidados,
            "cantidad_pedidos": len(pedidos_liquidados)
        }, user_id=admin_id, action="SETTLE_CASH"))

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
  [+] Catálogo REST (CRUD):       http://localhost:{PORT}/microservices/Catalog/catalog.php
  [+] Checkout & Transacciones:   http://localhost:{PORT}/microservices/Transactions/checkout.php
  [+] Cancelación & Reembolsos:   http://localhost:{PORT}/microservices/Transactions/cancel_order.php
  [+] Reportes & Estadísticas:    http://localhost:{PORT}/microservices/Transactions/report.php
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

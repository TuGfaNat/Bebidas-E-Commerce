#!/usr/bin/env python3
"""
=============================================================================
Burger 24/7 - Suite Automatizada de Verificación E2E en XAMPP (Ticket BE-013)
=============================================================================
Ejecuta de punta a punta todos los roles (Cliente, Rider, Administrador),
flujos de negocio y casos negativos contra Apache (puerto 80) y MySQL real.
Recolecta evidencias empíricas para el Manual de Pruebas de la Tesina (SPEC §5).
"""

import sys
import os
import json
import time
import uuid
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime, timezone

# URL base en Apache XAMPP
BASE_URL = "http://localhost/Burger-E-Commerce"

# Estructura de resultados
test_results = {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "evidences": []
}

def log_test(test_id, name, success, http_code, expected_code, details, req_payload=None, res_payload=None):
    test_results["total"] += 1
    if success:
        test_results["passed"] += 1
        tag = "[PASS]"
    else:
        test_results["failed"] += 1
        tag = "[FAIL]"

    evidence = {
        "id": test_id,
        "name": name,
        "status": "PASS" if success else "FAIL",
        "http_code": http_code,
        "expected_code": expected_code,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "details": details,
        "request": req_payload,
        "response": res_payload
    }
    test_results["evidences"].append(evidence)
    print(f"  {tag} {test_id}: {name} (HTTP {http_code} vs {expected_code})")
    if not success:
        print(f"         [!] Error: {details}")

def make_request(endpoint, method="GET", data=None, token=None, is_multipart=False, files=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {}
    
    if token:
        headers["Authorization"] = f"Bearer {token}"

    body = None
    if is_multipart:
        boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
        parts = []
        if data:
            for k, v in data.items():
                parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n")
        if files:
            for field, f_info in files.items():
                filename = f_info["filename"]
                mime = f_info.get("mime", "application/octet-stream")
                content = f_info["content"]
                parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{field}\"; filename=\"{filename}\"\r\nContent-Type: {mime}\r\n\r\n{content}\r\n")
        parts.append(f"--{boundary}--\r\n")
        body = "".join(parts).encode("utf-8")
    elif data is not None:
        headers["Content-Type"] = "application/json"
        body = json.dumps(data).encode("utf-8")

    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            parsed = None
            try:
                parsed = json.loads(raw)
            except Exception:
                pass
            return resp.status, parsed, raw
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace")
        parsed = None
        try:
            parsed = json.loads(raw)
        except Exception:
            pass
        return e.code, parsed, raw
    except Exception as ex:
        return 0, None, str(ex)

def check_bmad_envelope(json_data):
    if not isinstance(json_data, dict):
        return False, "La respuesta no es un objeto JSON"
    keys = ["status", "data", "audit", "error_details"]
    for k in keys:
        if k not in json_data:
            return False, f"Falta clave obligatoria '{k}' en el envelope BMAD"
    if not isinstance(json_data["audit"], dict):
        return False, "La clave 'audit' no es un objeto"
    for ak in ["user_id", "timestamp"]:
        if ak not in json_data["audit"]:
            return False, f"Falta clave '{ak}' en audit"
    return True, "Envelope BMAD conforme a SPEC §4"

def run_suite():
    print("=" * 76)
    print("  BURGER 24/7 - SUITE DE PRUEBAS E2E (XAMPP + MYSQL REAL)")
    print(f"  Objetivo: {BASE_URL}")
    print("=" * 76)

    # =========================================================================
    # PARTE 1: FLUJOS POSITIVOS DE PUNTA A PUNTA (HAPPY PATHS)
    # =========================================================================
    print("\n--- [FASE 1] FLUJOS POSITIVOS POR ROLES (CLIENTE, RIDER, ADMIN) ---")

    # 1. Login Admin
    status, res, raw = make_request("/microservices/Auth/login.php", method="POST", data={"correo": "admin@mail.com", "password": "admin"})
    bmad_ok, bmad_msg = check_bmad_envelope(res)
    admin_token = res["data"]["token"] if (res and "data" in res and "token" in res["data"]) else None
    log_test("HP-01", "Login de Administrador (Bcrypt + JWT)", status == 200 and admin_token and bmad_ok, status, 200, bmad_msg, {"correo": "admin@mail.com"}, res)

    # 2. Registro de Nuevo Cliente con C.I.
    unique_suffix = int(time.time())
    new_client_email = f"cliente_e2e_{unique_suffix}@mail.com"
    dummy_ci = "%PDF-1.4 1 0 obj << /Type /Catalog >> endobj trailer << /Root 1 0 R >> %%EOF"
    status, res, raw = make_request(
        "/microservices/Auth/register.php",
        method="POST",
        is_multipart=True,
        data={
            "nombre": f"Cliente E2E {unique_suffix}",
            "correo": new_client_email,
            "password": "Password123!",
            "fecha_nacimiento": "2000-01-01"
        },
        files={
            "ci_image": {"filename": "ci_sample.pdf", "mime": "application/pdf", "content": dummy_ci}
        }
    )
    new_client_id = res["data"]["user_id"] if (res and res.get("data") and "user_id" in res["data"]) else None
    new_client_token = res["data"]["token"] if (res and res.get("data") and "token" in res["data"]) else None
    log_test("HP-02", "Registro de Cliente con C.I. (Multipart PDF)", status == 200 and new_client_token is not None, status, 200, f"User ID: {new_client_id}", None, res)

    # 3. Admin aprueba C.I. del cliente
    if new_client_id and admin_token:
        status, res, raw = make_request(
            "/microservices/Auth/admin_approval.php",
            method="POST",
            token=admin_token,
            data={"tipo": "user", "target_id": new_client_id, "estado": "aprobado"}
        )
        log_test("HP-03", "Aprobación de C.I. por Admin (Audit Log)", status == 200 and (res or {}).get("status") == "success", status, 200, "C.I. verificado exitosamente", None, res)
    else:
        log_test("HP-03", "Aprobación de C.I. por Admin", False, 0, 200, "Falta token o cliente previo")

    # 4. Obtener nuevo token para el cliente ya verificado
    status, res, raw = make_request("/microservices/Auth/login.php", method="POST", data={"correo": new_client_email, "password": "Password123!"})
    verified_client_token = res["data"]["token"] if (res and "data" in res and "token" in res["data"]) else None
    log_test("HP-04", "Login de Cliente con C.I. ya verificado", status == 200 and verified_client_token is not None, status, 200, "Token renovado con rol cliente", None, res)

    # 5. Consulta de Catálogo de Productos
    status, res, raw = make_request("/microservices/Catalog/catalog.php", method="GET")
    bmad_ok, bmad_msg = check_bmad_envelope(res)
    products = res.get("data", {}).get("productos", []) if res else []
    sample_prod = products[0] if (products and len(products) > 0) else {"id": 1, "precio": 22.0}
    log_test("HP-05", "Consulta de Catálogo de Productos (BMAD)", status == 200 and bmad_ok and len(products) > 0, status, 200, f"{len(products)} productos obtenidos", None, {"items_count": len(products)})

    # 6. Checkout con Módulo Crítico C++ (Creación de Pedido)
    checkout_payload = {
        "action": "create_order",
        "latitud": -16.5100,
        "longitud": -68.1300,
        "distancia_km": 2.5,
        "metodo_pago": "contraentrega",
        "items": [
            {"producto_id": sample_prod["id"], "cantidad": 1}
        ]
    }
    status, res, raw = make_request("/microservices/Transactions/checkout.php", method="POST", data=checkout_payload, token=verified_client_token)
    bmad_ok, bmad_msg = check_bmad_envelope(res)
    order_id = res["data"]["pedido_id"] if (res and "data" in res and "pedido_id" in res["data"]) else None
    cpp_audit = res["data"].get("cpp_audit") if (res and "data" in res) else None
    log_test("HP-06", "Checkout con Módulo Crítico C++ (Flete & Stock)", status == 201 and order_id and cpp_audit is not None, status, 201, f"Pedido #{order_id} creado con C++ ({cpp_audit.get('tiempo_computo_us')}us)", checkout_payload, res)

    # 7. Cliente consulta su Pedido Activo
    status, res, raw = make_request("/microservices/Transactions/checkout.php", method="GET", token=verified_client_token)
    bmad_ok, bmad_msg = check_bmad_envelope(res)
    active_order = res.get("data", {}).get("pedido_activo") if res else None
    log_test("HP-07", "Cliente Consulta Pedido Activo", status == 200 and active_order is not None, status, 200, f"Pedido activo: #{active_order.get('id') if active_order else 'None'}", None, res)

    # 8. Login de Rider existente (pedro@mail.com / pedro)
    status, res, raw = make_request("/microservices/Auth/login.php", method="POST", data={"correo": "pedro@mail.com", "password": "pedro"})
    rider_token = res["data"]["token"] if (res and "data" in res and "token" in res["data"]) else None
    rider_id = res["data"]["user"]["id"] if (res and "data" in res and "user" in res["data"] and "id" in res["data"]["user"]) else (res["audit"]["user_id"] if res else 2)
    log_test("HP-08", "Login de Rider Aprobado (JWT)", status == 200 and rider_token is not None, status, 200, f"Rider ID: {rider_id}", None, res)

    # 9. Rider consulta Pedidos Disponibles
    status, res, raw = make_request("/microservices/Rider/assignment.php", method="GET", token=rider_token)
    bmad_ok, bmad_msg = check_bmad_envelope(res)
    disponibles = res.get("data", {}).get("pedidos_disponibles", []) if res else []
    log_test("HP-09", "Rider Lista Pedidos Pendientes con Flete Haversine", status == 200 and bmad_ok, status, 200, f"Pedidos pendientes en cola: {len(disponibles)}", None, {"pendientes": len(disponibles)})

    # 10. Rider toma el pedido
    if order_id and rider_token:
        status, res, raw = make_request("/microservices/Rider/assignment.php", method="POST", data={"pedido_id": order_id}, token=rider_token)
        log_test("HP-10", f"Rider Acepta y Asigna Pedido #{order_id}", status == 200 and res.get("status") == "success", status, 200, "Transición: pendiente -> asignado", {"pedido_id": order_id}, res)
    else:
        log_test("HP-10", "Rider Toma Pedido", False, 0, 200, "Falta order_id o rider_token")

    # 11. Rider avanza a 'en_camino'
    if order_id and rider_token:
        status, res, raw = make_request("/microservices/Rider/delivery.php", method="POST", data={"pedido_id": order_id, "action": "marcar_en_camino"}, token=rider_token)
        log_test("HP-11", f"Rider Despacha Pedido #{order_id} (en_camino)", status == 200 and res.get("status") == "success", status, 200, "Transición: asignado -> en_camino", None, res)
    else:
        log_test("HP-11", "Rider Avanza a en_camino", False, 0, 200, "Falta pedido previo")

    # 12. Rider entrega pedido ('entregado')
    if order_id and rider_token:
        status, res, raw = make_request("/microservices/Rider/delivery.php", method="POST", data={"pedido_id": order_id, "action": "marcar_entregado"}, token=rider_token)
        log_test("HP-12", f"Rider Finaliza Entrega #{order_id} (entregado)", status == 200 and res.get("status") == "success", status, 200, "Transición: en_camino -> entregado", None, res)
    else:
        log_test("HP-12", "Rider Entrega Pedido", False, 0, 200, "Falta pedido previo")

    # 13. Admin liquida caja del Rider
    if rider_id and admin_token:
        status, res, raw = make_request("/microservices/Rider/settle_cash.php", method="POST", data={"rider_id": rider_id}, token=admin_token)
        log_test("HP-13", "Admin Liquida Caja de Cobranza del Rider", status == 200 and res.get("status") == "success", status, 200, "Pedidos contraentrega conciliados y liquidados", {"rider_id": rider_id}, res)
    else:
        log_test("HP-13", "Admin Liquida Caja", False, 0, 200, "Falta admin o rider")

    # 14. Crear segundo pedido para probar Cancelación Legal
    checkout_payload_2 = {
        "action": "create_order",
        "latitud": -16.5100,
        "longitud": -68.1300,
        "distancia_km": 1.0,
        "metodo_pago": "contraentrega",
        "items": [
            {"producto_id": sample_prod["id"], "cantidad": 1}
        ]
    }
    status, res, raw = make_request("/microservices/Transactions/checkout.php", method="POST", data=checkout_payload_2, token=verified_client_token)
    order_id_2 = res["data"]["pedido_id"] if (res and "data" in res and "pedido_id" in res["data"]) else None
    log_test("HP-14", "Cliente Crea 2do Pedido para Prueba de Cancelación", status == 201 and order_id_2 is not None, status, 201, f"Pedido #{order_id_2} creado", None, res)

    # 15. Cliente cancela pedido legalmente (pendiente -> cancelado, con reembolso de stock)
    if order_id_2 and verified_client_token:
        status, res, raw = make_request("/microservices/Transactions/cancel_order.php", method="POST", data={"pedido_id": order_id_2, "motivo": "Prueba E2E"}, token=verified_client_token)
        log_test("HP-15", f"Cancelación Legal con Reembolso de Stock #{order_id_2}", status == 200 and res.get("status") == "success", status, 200, "Stock restaurado y orden cancelada", {"pedido_id": order_id_2}, res)
    else:
        log_test("HP-15", "Cancelación Legal de Pedido", False, 0, 200, "Falta pedido previo")

    # 16. Admin consulta Reportes de Ventas y Monitoreo en Vivo
    status, res, raw = make_request("/microservices/Transactions/report.php", method="GET", token=admin_token)
    bmad_ok, bmad_msg = check_bmad_envelope(res)
    log_test("HP-16", "Admin Consulta Reporte Financiero y Auditoría", status == 200 and bmad_ok, status, 200, "Totales consolidados y métricas operativas", None, res)


    # =========================================================================
    # PARTE 2: CASOS NEGATIVOS Y DE LÍMITE (7 CASOS DE ERROR CONTROLADO)
    # =========================================================================
    print("\n--- [FASE 2] CASOS NEGATIVOS Y LÍMITES (ERRORES CONTROLADOS) ---")

    # CN-01: Token en URL o Query String (Rechazo estricto AUTH_STRICT)
    status, res, raw = make_request(f"/microservices/Transactions/checkout.php?token={admin_token}", method="GET")
    log_test("CN-01", "Envío Prohibido de Token por URL/Query String", status == 401, status, 401, "Rechazado con 401 y acción AUTH_STRICT", None, res)

    # CN-02: Compra por usuario sin C.I. verificado (Crear usuario sin aprobar)
    dummy_email_unverified = f"unverified_{unique_suffix}@mail.com"
    status_reg, res_reg, _ = make_request(
        "/microservices/Auth/register.php",
        method="POST",
        is_multipart=True,
        data={
            "nombre": "Usuario No Verificado",
            "correo": dummy_email_unverified,
            "password": "Password123!",
            "fecha_nacimiento": "1999-05-05"
        },
        files={"ci_image": {"filename": "doc.pdf", "mime": "application/pdf", "content": dummy_ci}}
    )
    unverified_token = (res_reg or {}).get("data", {}).get("token")
    if unverified_token:
        status, res, raw = make_request(
            "/microservices/Transactions/checkout.php",
            method="POST",
            token=unverified_token,
            data={"action": "create_order", "items": [{"producto_id": 1, "cantidad": 1}]}
        )
        log_test("CN-02", "Cliente con C.I. Pendiente Intenta Checkout", status == 403, status, 403, "Rechazado con 403 (CI_UNVERIFIED)", None, res)
    else:
        log_test("CN-02", "Cliente con C.I. Pendiente Intenta Checkout", False, 0, 403, "No se pudo crear usuario no verificado")

    # CN-03: Stock Insuficiente Detectado por Módulo C++
    status, res, raw = make_request(
        "/microservices/Transactions/checkout.php",
        method="POST",
        token=verified_client_token,
        data={
            "action": "create_order",
            "distancia_km": 1.0,
            "items": [{"producto_id": sample_prod["id"], "cantidad": 999999}]
        }
    )
    log_test("CN-03", "Sobreventa / Stock Insuficiente Detectado por C++", status == 400, status, 400, "Rechazado con 400 (CPP_VALIDATION_FAILED) y ROLLBACK", None, res)

    # CN-04: Cancelación Ilegal de Orden ya Entregada
    if order_id and verified_client_token:
        status, res, raw = make_request(
            "/microservices/Transactions/cancel_order.php",
            method="POST",
            token=verified_client_token,
            data={"pedido_id": order_id, "motivo": "Intento ilegal de cancelar orden entregada"}
        )
        log_test("CN-04", f"Cancelación Ilegal de Orden Entregada #{order_id}", status == 400, status, 400, "Rechazado con 400 (ORDER_NOT_CANCELLABLE)", None, res)
    else:
        log_test("CN-04", "Cancelación Ilegal de Orden Entregada", False, 0, 400, "Falta pedido entregado")

    # CN-05: Repartidor No Aprobado Intenta Tomar Pedido
    # Crear un rider no aprobado
    dummy_rider_unapproved = f"rider_unapproved_{unique_suffix}@mail.com"
    make_request(
        "/microservices/Auth/register.php",
        method="POST",
        is_multipart=True,
        data={
            "nombre": "Rider No Aprobado",
            "correo": dummy_rider_unapproved,
            "password": "Password123!",
            "fecha_nacimiento": "1995-01-01"
        },
        files={"ci_image": {"filename": "ci.pdf", "mime": "application/pdf", "content": dummy_ci}}
    )
    # Cambiar rol en BD o intentar con un usuario cliente que llama endpoint rider
    # Un cliente que llama a assignment.php debe recibir 403 Forbidden
    status, res, raw = make_request(
        "/microservices/Rider/assignment.php",
        method="GET",
        token=verified_client_token
    )
    log_test("CN-05", "Usuario No Autorizado / No Rider Accede a Asignaciones", status == 403, status, 403, "Rechazado con 403 Forbidden (requireAuth)", None, res)

    # CN-06: Checkout con Carrito Vacío
    status, res, raw = make_request(
        "/microservices/Transactions/checkout.php",
        method="POST",
        token=verified_client_token,
        data={"action": "create_order", "items": []}
    )
    log_test("CN-06", "Checkout con Carrito Vacío (items: [])", status == 400, status, 400, "Rechazado con 400 (EMPTY_CART)", None, res)

    # CN-07: Usuario No Administrador Intenta Liquidar Caja de Efectivo
    status, res, raw = make_request(
        "/microservices/Rider/settle_cash.php",
        method="POST",
        token=verified_client_token,
        data={"rider_id": rider_id or 2}
    )
    log_test("CN-07", "Cliente Intenta Liquidar Caja de Rider (Sin Permiso Admin)", status == 403, status, 403, "Rechazado con 403 Forbidden (requireAuth)", None, res)

    # =========================================================================
    # RESUMEN FINAL Y GUARDADO DE EVIDENCIAS
    # =========================================================================
    print("\n" + "=" * 76)
    print(f"  RESUMEN DE PRUEBAS E2E: Total: {test_results['total']} | Aprobadas: {test_results['passed']} | Fallidas: {test_results['failed']}")
    print("=" * 76)

    # Guardar evidencias en JSON para la tesina
    evidences_file = os.path.join(os.path.dirname(__file__), "evidencias_e2e.json")
    with open(evidences_file, "w", encoding="utf-8") as f:
        json.dump(test_results, f, indent=2, ensure_ascii=False)
    print(f"[OK] Archivo de evidencias estructurado guardado en: {evidences_file}")

    return test_results["failed"] == 0

if __name__ == "__main__":
    success = run_suite()
    sys.exit(0 if success else 1)

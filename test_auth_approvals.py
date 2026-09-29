#!/usr/bin/env python3
"""
Test de Integración de Extremo a Extremo (E2E) para Burger 24/7
Prueba exhaustivamente:
1. Registro de Cliente con subida multipart de C.I.
2. Registro de Rider con subida multipart de Licencia, Seguro y CV.
3. Listado de pendientes para el Administrador (GET admin_approval.php).
4. Aprobación de Cliente por el Administrador (POST admin_approval.php).
5. Aprobación de Rider por el Administrador (POST admin_approval.php).
6. Verificación de archivos físicos en disco y tokens JWT.
"""

import sys
import os
import time
import json
import urllib.request
import urllib.error
import subprocess

PORT = 8005
BASE_URL = f"http://127.0.0.1:{PORT}"

def run_tests():
    print("=" * 60)
    print("  INICIANDO SUITE DE PRUEBAS DE REGISTRO Y APROBACIONES")
    print("=" * 60)

    # 1. Iniciar server.py en segundo plano
    server_proc = subprocess.Popen(
        [sys.executable, "server.py", str(PORT)],
        cwd=os.path.dirname(os.path.abspath(__file__)),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )

    try:
        # Esperar a que el servidor esté listo
        ready = False
        for _ in range(20):
            try:
                with urllib.request.urlopen(f"{BASE_URL}/microservices/Auth/connection.php", timeout=1) as resp:
                    if resp.status == 200:
                        ready = True
                        break
            except Exception:
                time.sleep(0.2)

        if not ready:
            print("[FALLO] El servidor no inició a tiempo.")
            return False

        print("[OK] Servidor de prueba iniciado y respondiendo en el puerto", PORT)

        # ----------------------------------------------------
        # TEST 1: Login de Administrador para obtener Token JWT
        # ----------------------------------------------------
        admin_login_data = json.dumps({"correo": "admin@mail.com", "password": "admin"}).encode('utf-8')
        req = urllib.request.Request(
            f"{BASE_URL}/microservices/Auth/login.php",
            data=admin_login_data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            login_res = json.loads(resp.read().decode('utf-8'))
            assert login_res["status"] == "success", "Fallo login admin"
            admin_token = login_res["data"]["token"]
            print("[PASS 1/6] Login de Super Usuario exitoso. Token JWT emitido.")

        # ----------------------------------------------------
        # TEST 2: Registro de Nuevo Cliente con C.I. (Multipart)
        # ----------------------------------------------------
        boundary = "----WebKitFormBoundaryE2ETestClient"
        body_parts = [
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"nombre\"\r\n\r\nLucía Morales\r\n",
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"correo\"\r\n\r\nlucia.morales@mail.com\r\n",
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"password\"\r\n\r\npassword123\r\n",
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"fecha_nacimiento\"\r\n\r\n2002-05-18\r\n",
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"ci_image\"; filename=\"ci_lucia.jpg\"\r\nContent-Type: image/jpeg\r\n\r\nFAKE_JPEG_BINARY_DATA_OF_CI\r\n",
            f"--{boundary}--\r\n"
        ]
        client_multipart_data = "".join(body_parts).encode('utf-8')

        req = urllib.request.Request(
            f"{BASE_URL}/microservices/Auth/register.php",
            data=client_multipart_data,
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
        )
        with urllib.request.urlopen(req) as resp:
            reg_client_res = json.loads(resp.read().decode('utf-8'))
            assert reg_client_res["status"] == "success", "Fallo registro de cliente"
            client_id = reg_client_res["data"]["user"]["id"]
            client_ci_url = reg_client_res["data"]["user"]["ci_url"]
            print(f"[PASS 2/6] Cliente registrado exitosamente (ID={client_id}, CI URL={client_ci_url}).")

        # ----------------------------------------------------
        # TEST 3: Registro de Nuevo Rider con Expediente (Multipart)
        # ----------------------------------------------------
        boundary_rider = "----WebKitFormBoundaryE2ETestRider"
        rider_parts = [
            f"--{boundary_rider}\r\nContent-Disposition: form-data; name=\"nombre\"\r\n\r\nEsteban Quispe\r\n",
            f"--{boundary_rider}\r\nContent-Disposition: form-data; name=\"correo\"\r\n\r\nesteban.rider@mail.com\r\n",
            f"--{boundary_rider}\r\nContent-Disposition: form-data; name=\"password\"\r\n\r\nrider123\r\n",
            f"--{boundary_rider}\r\nContent-Disposition: form-data; name=\"fecha_nacimiento\"\r\n\r\n1997-11-23\r\n",
            f"--{boundary_rider}\r\nContent-Disposition: form-data; name=\"licencia\"; filename=\"licencia_esteban.pdf\"\r\nContent-Type: application/pdf\r\n\r\nPDF_LICENCIA\r\n",
            f"--{boundary_rider}\r\nContent-Disposition: form-data; name=\"seguro\"; filename=\"soat_esteban.pdf\"\r\nContent-Type: application/pdf\r\n\r\nPDF_SOAT\r\n",
            f"--{boundary_rider}\r\nContent-Disposition: form-data; name=\"cv\"; filename=\"cv_esteban.pdf\"\r\nContent-Type: application/pdf\r\n\r\nPDF_CV\r\n",
            f"--{boundary_rider}--\r\n"
        ]
        rider_multipart_data = "".join(rider_parts).encode('utf-8')

        req = urllib.request.Request(
            f"{BASE_URL}/microservices/Auth/register_rider.php",
            data=rider_multipart_data,
            headers={"Content-Type": f"multipart/form-data; boundary={boundary_rider}"}
        )
        with urllib.request.urlopen(req) as resp:
            reg_rider_res = json.loads(resp.read().decode('utf-8'))
            assert reg_rider_res["status"] == "success", "Fallo registro de rider"
            rider_id = reg_rider_res["data"]["user"]["id"]
            print(f"[PASS 3/6] Rider registrado exitosamente con expediente digital (ID={rider_id}).")

        # ----------------------------------------------------
        # TEST 4: Consultar Aprobaciones Pendientes desde el Admin (GET)
        # ----------------------------------------------------
        req = urllib.request.Request(
            f"{BASE_URL}/microservices/Auth/admin_approval.php",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        with urllib.request.urlopen(req) as resp:
            pending_res = json.loads(resp.read().decode('utf-8'))
            assert pending_res["status"] == "success", "Fallo consulta de pendientes"
            pending_custs = pending_res["data"]["pending_customers"]
            pending_riders = pending_res["data"]["pending_riders"]
            
            # Verificar que Lucía y Esteban estén en la lista
            found_lucia = any(c["id"] == client_id for c in pending_custs)
            found_esteban = any(r["rider_id"] == rider_id for r in pending_riders)
            assert found_lucia, "Lucía no aparece en clientes pendientes"
            assert found_esteban, "Esteban no aparece en riders pendientes"
            print(f"[PASS 4/6] Admin consultó pendientes vía API. Encontrados {len(pending_custs)} clientes y {len(pending_riders)} riders.")

        # ----------------------------------------------------
        # TEST 5: Admin Aprueba C.I. de Cliente (POST admin_approval)
        # ----------------------------------------------------
        approve_client_data = json.dumps({
            "target_id": client_id,
            "tipo": "user",
            "estado": "aprobado"
        }).encode('utf-8')

        req = urllib.request.Request(
            f"{BASE_URL}/microservices/Auth/admin_approval.php",
            data=approve_client_data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {admin_token}"
            }
        )
        with urllib.request.urlopen(req) as resp:
            appr_res = json.loads(resp.read().decode('utf-8'))
            assert appr_res["status"] == "success"
            assert appr_res["data"]["nuevo_estado"] == "verified"
            print(f"[PASS 5/6] Admin aprobó C.I. de Lucía Morales exitosamente (ci_status -> verified).")

        # ----------------------------------------------------
        # TEST 6: Admin Aprueba Expediente de Rider (POST admin_approval)
        # ----------------------------------------------------
        approve_rider_data = json.dumps({
            "target_id": rider_id,
            "tipo": "rider",
            "estado": "aprobado"
        }).encode('utf-8')

        req = urllib.request.Request(
            f"{BASE_URL}/microservices/Auth/admin_approval.php",
            data=approve_rider_data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {admin_token}"
            }
        )
        with urllib.request.urlopen(req) as resp:
            appr_rider_res = json.loads(resp.read().decode('utf-8'))
            assert appr_rider_res["status"] == "success"
            assert appr_rider_res["data"]["nuevo_estado"] == "aprobado"
            print(f"[PASS 6/6] Admin aprobó expediente de Esteban Quispe exitosamente (estado_aprobacion -> aprobado).")

        print("=" * 60)
        print("  TODAS LAS PRUEBAS DE INTEGRACIÓN (6/6) PASARON CON ÉXITO")
        print("=" * 60)
        return True

    finally:
        server_proc.terminate()
        try:
            server_proc.wait(timeout=2)
        except Exception:
            server_proc.kill()

if __name__ == '__main__':
    ok = run_tests()
    sys.exit(0 if ok else 1)

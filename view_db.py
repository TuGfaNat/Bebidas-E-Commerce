#!/usr/bin/env python3
"""
Visor de Base de Datos por Consola para Burger 24/7
Muestra las tablas relacionales activas del sistema:
- users
- productos
- pedidos & pedido_detalles
- documentacion_rider
- auditoria_logs
"""

import sys, io, json, os

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT_DIR)

from server import USERS_DB, CATALOG_PRODUCTS, ORDERS_DB, ORDER_DETAILS_DB, RIDER_DOCS_DB, AUDIT_LOGS

def print_separator(title):
    print("\n" + "=" * 80)
    print(f"  TABLA: {title.upper()}")
    print("=" * 80)

def view_users():
    print_separator("users")
    print(f"{'ID':<4} | {'ROL':<14} | {'NOMBRE':<22} | {'EMAIL':<22} | {'ESTADO C.I.'}")
    print("-" * 80)
    for email, u in sorted(USERS_DB.items(), key=lambda item: item[1]['id']):
        print(f"{u['id']:<4} | {u.get('role',''):<14} | {u.get('nombre',''):<22} | {email:<22} | {u.get('ci_status','')}")

def view_products():
    print_separator("productos")
    print(f"{'ID':<4} | {'CATEGORIA':<16} | {'NOMBRE':<32} | {'PRECIO':<10} | {'STOCK'}")
    print("-" * 80)
    for p in sorted(CATALOG_PRODUCTS, key=lambda x: x['id']):
        print(f"{p['id']:<4} | {p.get('categoria',''):<16} | {p.get('nombre',''):<32} | {p.get('precio',0.0):<10.2f} | {p.get('stock',0)}")

def view_orders():
    print_separator("pedidos")
    print(f"{'ID':<4} | {'CLIENTE':<18} | {'RIDER':<16} | {'PAGO':<14} | {'ESTADO':<12} | {'TOTAL'}")
    print("-" * 80)
    for o in sorted(ORDERS_DB, key=lambda x: x['id']):
        client = next((u['nombre'] for u in USERS_DB.values() if u['id'] == o.get('cliente_id')), 'N/A')
        rider = next((u['nombre'] for u in USERS_DB.values() if u['id'] == o.get('rider_id')), 'Sin Asignar')
        print(f"{o['id']:<4} | {client:<18} | {rider:<16} | {o.get('estado_pago',''):<14} | {o.get('estado_pedido',''):<12} | {o.get('total',0.0):.2f} Bs")

def view_docs():
    print_separator("documentacion_rider")
    print(f"{'ID':<4} | {'RIDER ID':<10} | {'ESTADO':<14} | {'LICENCIA':<25} | {'SEGURO'}")
    print("-" * 80)
    for d in RIDER_DOCS_DB:
        print(f"{d['id']:<4} | {d.get('rider_id',''):<10} | {d.get('estado_aprobacion',''):<14} | {os.path.basename(d.get('licencia_url','')):<25} | {os.path.basename(d.get('seguro_url',''))}")

def view_audit():
    print_separator("auditoria_logs (Últimos registros)")
    print(f"{'ID':<4} | {'TABLA':<12} | {'ACCION':<8} | {'REGISTRO':<8} | {'IP':<12} | {'FECHA'}")
    print("-" * 80)
    for a in list(reversed(AUDIT_LOGS))[:10]:
        date_short = a.get('created_at', '')[:19]
        print(f"{a['id']:<4} | {a.get('tabla_afectada',''):<12} | {a.get('accion',''):<8} | {str(a.get('registro_id','')):<8} | {a.get('ip_address',''):<12} | {date_short}")

def main():
    print("\n" + "#" * 80)
    print("      BURGER 24/7 - VISOR DE BASE DE DATOS LOCAL (TABLAS Y REGISTROS)")
    print("#" * 80)
    view_users()
    view_products()
    view_orders()
    view_docs()
    view_audit()
    print("\n" + "=" * 80)
    print("  Fin de registros. Para ver las sentencias DDL y DML completas:")
    print("  Revisa el archivo SQL: init_schema.sql")
    print("=" * 80 + "\n")

if __name__ == "__main__":
    main()

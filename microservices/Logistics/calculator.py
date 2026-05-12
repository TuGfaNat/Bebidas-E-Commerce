import sys
import json
import math
from datetime import datetime, timezone

def format_response(status, data, user_id=None, error_details=None):
    return json.dumps({
        "status": status,
        "data": data,
        "audit": {
            "user_id": user_id if user_id else "SYSTEM",
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        "error_details": error_details
    })

def haversine(lat1, lon1, lat2, lon2):
    # Radio de la Tierra en km
    R = 6371.0

    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad

    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    distance = R * c
    return distance

def main():
    if len(sys.argv) < 6:
        print(format_response("error", None, None, "Se requieren argumentos: user_id lat_cliente lon_cliente lat_tienda lon_tienda"))
        sys.exit(1)

    try:
        user_id = sys.argv[1]
        lat_cliente = float(sys.argv[2])
        lon_cliente = float(sys.argv[3])
        lat_tienda = float(sys.argv[4])
        lon_tienda = float(sys.argv[5])

        distancia_km = haversine(lat_cliente, lon_cliente, lat_tienda, lon_tienda)

        # Lógica de simulación
        # Velocidad promedio asumida: 30 km/h
        tiempo_estimado_min = (distancia_km / 30.0) * 60.0

        # Tarifa base 5 Bs + 2 Bs por Km extra
        costo_envio_bs = 5.0 + (distancia_km * 2.0)

        data = {
            "distancia_km": round(distancia_km, 2),
            "tiempo_estimado": f"{round(tiempo_estimado_min)} min",
            "costo_envio_bs": round(costo_envio_bs, 2)
        }

        print(format_response("success", data, user_id))

    except Exception as e:
        user_id = sys.argv[1] if len(sys.argv) > 1 else None
        print(format_response("error", None, user_id, str(e)))

if __name__ == "__main__":
    main()

/**
 * Módulo Crítico de Rendimiento en C++ (SPEC.md Sección 2)
 * Sistema E-Commerce Burger 24/7 - Servicio de Logística Geoespacial
 *
 * Propósito:
 * Cálculo geodésico de alto rendimiento mediante la fórmula Haversine,
 * estimación de tiempo de arribo (ETA) y liquidación de tarifa de flete.
 *
 * Estándar de Retorno:
 * Devuelve un payload JSON conforme a la especificación de envolvente BMAD.
 */

#include <iostream>
#include <cmath>
#include <iomanip>
#include <string>
#include <sstream>
#include <chrono>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

// Conversión de grados a radianes
inline double toRadians(double degrees) {
    return degrees * (M_PI / 180.0);
}

// Algoritmo Geodésico Haversine
// Retorna la distancia en kilómetros entre dos coordenadas (WGS84)
double haversineDistance(double lat1, double lon1, double lat2, double lon2) {
    const double EARTH_RADIUS_KM = 6371.0;

    double dLat = toRadians(lat2 - lat1);
    double dLon = toRadians(lon2 - lon1);

    double radLat1 = toRadians(lat1);
    double radLat2 = toRadians(lat2);

    double a = std::sin(dLat / 2.0) * std::sin(dLat / 2.0) +
               std::cos(radLat1) * std::cos(radLat2) *
               std::sin(dLon / 2.0) * std::sin(dLon / 2.0);

    double c = 2.0 * std::atan2(std::sqrt(a), std::sqrt(1.0 - a));
    return EARTH_RADIUS_KM * c;
}

// Obtener marca temporal UTC en formato ISO-8601
std::string getTimestampISO8601() {
    auto now = std::chrono::system_clock::now();
    std::time_t now_c = std::chrono::system_clock::to_time_t(now);
    std::tm now_tm;
#if defined(_WIN32) || defined(_WIN64)
    gmtime_s(&now_tm, &now_c);
#else
    gmtime_r(&now_c, &now_tm);
#endif
    char buf[64];
    std::strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &now_tm);
    return std::string(buf);
}

// Generador de respuesta estructurada BMAD
std::string formatBmadResponse(const std::string& status,
                               const std::string& jsonData,
                               const std::string& userId,
                               const std::string& errorDetails) {
    std::ostringstream ss;
    ss << "{\n";
    ss << "  \"status\": \"" << status << "\",\n";
    ss << "  \"data\": " << (jsonData.empty() ? "null" : jsonData) << ",\n";
    ss << "  \"audit\": {\n";
    ss << "    \"user_id\": \"" << userId << "\",\n";
    ss << "    \"timestamp\": \"" << getTimestampISO8601() << "\",\n";
    ss << "    \"engine\": \"C++ Optimized Native Core (SPEC.md Sec 2)\"\n";
    ss << "  },\n";
    if (errorDetails.empty()) {
        ss << "  \"error_details\": null\n";
    } else {
        ss << "  \"error_details\": \"" << errorDetails << "\"\n";
    }
    ss << "}";
    return ss.str();
}

int main(int argc, char* argv[]) {
    // Parámetros esperados:
    // argv[1]: user_id
    // argv[2]: lat_cliente
    // argv[3]: lon_cliente
    // argv[4]: lat_tienda
    // argv[5]: lon_tienda
    if (argc < 6) {
        std::cerr << formatBmadResponse(
            "error",
            "null",
            "SYSTEM",
            "Parámetros insuficientes. Uso: calculator <user_id> <lat_cliente> <lon_cliente> <lat_tienda> <lon_tienda>"
        ) << std::endl;
        return 1;
    }

    try {
        std::string userId = argv[1];
        double latCliente = std::stod(argv[2]);
        double lonCliente = std::stod(argv[3]);
        double latTienda = std::stod(argv[4]);
        double lonTienda = std::stod(argv[5]);

        // 1. Cálculo de distancia de alta precisión
        double distKm = haversineDistance(latCliente, lonCliente, latTienda, lonTienda);

        // 2. Estimación de tiempo (velocidad promedio 30 km/h)
        double tiempoEstimadoMin = (distKm / 30.0) * 60.0;

        // 3. Tarifa de flete: 5 Bs base + 2 Bs por km
        double costoEnvioBs = 5.0 + (distKm * 2.0);

        // Construir JSON de datos
        std::ostringstream dataStream;
        dataStream << std::fixed << std::setprecision(2);
        dataStream << "{\n";
        dataStream << "    \"distancia_km\": " << distKm << ",\n";
        dataStream << "    \"tiempo_estimado\": \"" << static_cast<int>(std::round(tiempoEstimadoMin)) << " min\",\n";
        dataStream << "    \"costo_envio_bs\": " << costoEnvioBs << ",\n";
        dataStream << "    \"velocidad_promedio_kmh\": 30.0\n";
        dataStream << "  }";

        std::cout << formatBmadResponse("success", dataStream.str(), userId, "") << std::endl;
        return 0;
    } catch (const std::exception& ex) {
        std::cerr << formatBmadResponse("error", "null", "SYSTEM", ex.what()) << std::endl;
        return 1;
    }
}

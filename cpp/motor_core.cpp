/**
 * ============================================================================
 * Módulo Crítico de Rendimiento en C++ (SPEC.md Sección 2)
 * Sistema E-Commerce Burger 24/7 - Motor Core de Tarifas y Validación de Stock
 * ============================================================================
 *
 * Propósito:
 * Ejecutar con latencia ultra-baja y precisión estricta de punto flotante:
 * 1. Validación atómica de existencias (stock disponible vs solicitado).
 * 2. Liquidación algorítmica de tarifa de flete geodésico y despacho.
 * 3. Cálculo de subtotales por línea y total general de la transacción.
 *
 * Estándar de Retorno:
 * Devuelve un payload JSON conforme a la especificación de envolvente BMAD (SPEC §4).
 */

#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <iomanip>
#include <cmath>
#include <chrono>
#include <ctime>

// Estructura para ítems del pedido
struct ItemPedido {
    int producto_id;
    std::string nombre;
    double precio;
    int cantidad;
    int stock_disponible;
};

// Utilidad para formatear números flotantes con precisión fija
std::string formatDouble(double val, int precision = 2) {
    std::ostringstream ss;
    ss << std::fixed << std::setprecision(precision) << val;
    return ss.str();
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

// Escapar cadenas para JSON seguro
std::string escapeJson(const std::string& str) {
    std::ostringstream ss;
    for (char c : str) {
        if (c == '"') ss << "\\\"";
        else if (c == '\\') ss << "\\\\";
        else if (c == '\b') ss << "\\b";
        else if (c == '\f') ss << "\\f";
        else if (c == '\n') ss << "\\n";
        else if (c == '\r') ss << "\\r";
        else if (c == '\t') ss << "\\t";
        else ss << c;
    }
    return ss.str();
}

// Parser simple y robusto de parámetros JSON sin librerías externas
bool parsePayload(const std::string& json, double& distanciaKm, std::vector<ItemPedido>& items, int& userId, std::string& err) {
    // 1. Extraer user_id
    size_t posUser = json.find("\"user_id\"");
    if (posUser != std::string::npos) {
        size_t colon = json.find(':', posUser);
        if (colon != std::string::npos) {
            userId = std::atoi(json.c_str() + colon + 1);
        }
    }

    // 2. Extraer distancia_km
    size_t posDist = json.find("\"distancia_km\"");
    if (posDist != std::string::npos) {
        size_t colon = json.find(':', posDist);
        if (colon != std::string::npos) {
            distanciaKm = std::atof(json.c_str() + colon + 1);
        }
    } else {
        distanciaKm = 1.0;
    }

    // 3. Extraer array de items
    size_t posItems = json.find("\"items\"");
    if (posItems == std::string::npos) {
        err = "El payload JSON no contiene la clave 'items'.";
        return false;
    }

    size_t startArray = json.find('[', posItems);
    size_t endArray = json.find(']', startArray);
    if (startArray == std::string::npos || endArray == std::string::npos) {
        err = "Formato inválido del arreglo de ítems en el payload JSON.";
        return false;
    }

    std::string arrayContent = json.substr(startArray + 1, endArray - startArray - 1);
    size_t curr = 0;

    while (curr < arrayContent.size()) {
        size_t startObj = arrayContent.find('{', curr);
        if (startObj == std::string::npos) break;
        size_t endObj = arrayContent.find('}', startObj);
        if (endObj == std::string::npos) break;

        std::string objStr = arrayContent.substr(startObj, endObj - startObj + 1);
        ItemPedido item;
        item.producto_id = 0;
        item.nombre = "Producto";
        item.precio = 0.0;
        item.cantidad = 0;
        item.stock_disponible = 0;

        // producto_id
        size_t pId = objStr.find("\"producto_id\"");
        if (pId == std::string::npos) pId = objStr.find("\"id\"");
        if (pId != std::string::npos) {
            size_t c = objStr.find(':', pId);
            if (c != std::string::npos) item.producto_id = std::atoi(objStr.c_str() + c + 1);
        }

        // nombre
        size_t pNom = objStr.find("\"nombre\"");
        if (pNom != std::string::npos) {
            size_t c = objStr.find(':', pNom);
            if (c != std::string::npos) {
                size_t q1 = objStr.find('"', c);
                size_t q2 = (q1 != std::string::npos) ? objStr.find('"', q1 + 1) : std::string::npos;
                if (q1 != std::string::npos && q2 != std::string::npos) {
                    item.nombre = objStr.substr(q1 + 1, q2 - q1 - 1);
                }
            }
        }

        // precio
        size_t pPre = objStr.find("\"precio\"");
        if (pPre == std::string::npos) pPre = objStr.find("\"precio_unitario\"");
        if (pPre != std::string::npos) {
            size_t c = objStr.find(':', pPre);
            if (c != std::string::npos) item.precio = std::atof(objStr.c_str() + c + 1);
        }

        // cantidad
        size_t pCant = objStr.find("\"cantidad\"");
        if (pCant != std::string::npos) {
            size_t c = objStr.find(':', pCant);
            if (c != std::string::npos) item.cantidad = std::atoi(objStr.c_str() + c + 1);
        }

        // stock
        size_t pStock = objStr.find("\"stock\"");
        if (pStock == std::string::npos) pStock = objStr.find("\"stock_disponible\"");
        if (pStock != std::string::npos) {
            size_t c = objStr.find(':', pStock);
            if (c != std::string::npos) item.stock_disponible = std::atoi(objStr.c_str() + c + 1);
        }

        if (item.producto_id > 0) {
            items.push_back(item);
        }

        curr = endObj + 1;
    }

    if (items.empty()) {
        err = "El arreglo de ítems no contiene productos válidos.";
        return false;
    }

    return true;
}

// Función principal
int main(int argc, char* argv[]) {
    auto tStart = std::chrono::high_resolution_clock::now();

    std::string inputJson = "";

    // Leer entrada desde argumento CLI o desde stdin
    if (argc > 1) {
        inputJson = argv[1];
    } else {
        std::string line;
        while (std::getline(std::cin, line)) {
            inputJson += line;
        }
    }

    if (inputJson.empty()) {
        std::cout << "{\n"
                  << "  \"status\": \"error\",\n"
                  << "  \"data\": null,\n"
                  << "  \"audit\": {\n"
                  << "    \"user_id\": \"SYSTEM\",\n"
                  << "    \"timestamp\": \"" << getTimestampISO8601() << "\",\n"
                  << "    \"action\": \"CPP_MOTOR_CORE_ERROR\"\n"
                  << "  },\n"
                  << "  \"error_details\": \"No se recibieron datos de entrada para el módulo C++.\"\n"
                  << "}\n";
        return 1;
    }

    double distanciaKm = 1.0;
    std::vector<ItemPedido> items;
    int userId = 1;
    std::string parseError = "";

    if (!parsePayload(inputJson, distanciaKm, items, userId, parseError)) {
        std::cout << "{\n"
                  << "  \"status\": \"error\",\n"
                  << "  \"data\": null,\n"
                  << "  \"audit\": {\n"
                  << "    \"user_id\": " << userId << ",\n"
                  << "    \"timestamp\": \"" << getTimestampISO8601() << "\",\n"
                  << "    \"action\": \"CPP_PARSE_ERROR\"\n"
                  << "  },\n"
                  << "  \"error_details\": \"" << escapeJson(parseError) << "\"\n"
                  << "}\n";
        return 1;
    }

    // 1. Verificación Estricta de Stock
    for (const auto& it : items) {
        if (it.cantidad <= 0) {
            std::cout << "{\n"
                      << "  \"status\": \"error\",\n"
                      << "  \"data\": null,\n"
                      << "  \"audit\": {\n"
                      << "    \"user_id\": " << userId << ",\n"
                      << "    \"timestamp\": \"" << getTimestampISO8601() << "\",\n"
                      << "    \"action\": \"CPP_VALIDATE_STOCK\"\n"
                      << "  },\n"
                      << "  \"error_details\": \"Cantidad inválida (" << it.cantidad << ") para el producto '" << escapeJson(it.nombre) << "'.\"\n"
                      << "}\n";
            return 2;
        }

        if (it.cantidad > it.stock_disponible) {
            std::ostringstream errOss;
            errOss << "Stock insuficiente para '" << it.nombre << "' (ID #" << it.producto_id << "). "
                   << "Solicitado: " << it.cantidad << ", Disponible en cocina: " << it.stock_disponible << ".";

            std::cout << "{\n"
                      << "  \"status\": \"error\",\n"
                      << "  \"data\": {\n"
                      << "    \"valido\": false,\n"
                      << "    \"producto_id\": " << it.producto_id << ",\n"
                      << "    \"solicitado\": " << it.cantidad << ",\n"
                      << "    \"stock_actual\": " << it.stock_disponible << "\n"
                      << "  },\n"
                      << "  \"audit\": {\n"
                      << "    \"user_id\": " << userId << ",\n"
                      << "    \"timestamp\": \"" << getTimestampISO8601() << "\",\n"
                      << "    \"action\": \"CPP_STOCK_EXCEEDED\"\n"
                      << "  },\n"
                      << "  \"error_details\": \"" << escapeJson(errOss.str()) << "\"\n"
                      << "}\n";
            return 2;
        }
    }

    // 2. Liquidación de Subtotal y Flete
    double subtotal = 0.0;
    for (const auto& it : items) {
        subtotal += (it.cantidad * it.precio);
    }

    // Fórmula del negocio para costo de envío: Base 5.0 Bs + 2.0 Bs por km
    double costoEnvio = 5.0 + (distanciaKm * 2.0);
    if (costoEnvio < 5.0) costoEnvio = 5.0;

    double total = subtotal + costoEnvio;

    auto tEnd = std::chrono::high_resolution_clock::now();
    auto elapsedUs = std::chrono::duration_cast<std::chrono::microseconds>(tEnd - tStart).count();

    // 3. Respuesta JSON conforme al Estándar BMAD
    std::cout << "{\n"
              << "  \"status\": \"success\",\n"
              << "  \"data\": {\n"
              << "    \"valido\": true,\n"
              << "    \"subtotal\": " << formatDouble(subtotal, 2) << ",\n"
              << "    \"costo_envio\": " << formatDouble(costoEnvio, 2) << ",\n"
              << "    \"total\": " << formatDouble(total, 2) << ",\n"
              << "    \"distancia_km\": " << formatDouble(distanciaKm, 2) << ",\n"
              << "    \"items_verificados\": " << items.size() << ",\n"
              << "    \"desglose_lineas\": [\n";

    for (size_t i = 0; i < items.size(); ++i) {
        const auto& it = items[i];
        double sublinea = it.cantidad * it.precio;
        int stockRestante = it.stock_disponible - it.cantidad;

        std::cout << "      {\n"
                  << "        \"producto_id\": " << it.producto_id << ",\n"
                  << "        \"nombre\": \"" << escapeJson(it.nombre) << "\",\n"
                  << "        \"cantidad\": " << it.cantidad << ",\n"
                  << "        \"precio_unitario\": " << formatDouble(it.precio, 2) << ",\n"
                  << "        \"subtotal_linea\": " << formatDouble(sublinea, 2) << ",\n"
                  << "        \"stock_restante\": " << stockRestante << "\n"
                  << "      }" << (i + 1 < items.size() ? "," : "") << "\n";
    }

    std::cout << "    ]\n"
              << "  },\n"
              << "  \"audit\": {\n"
              << "    \"user_id\": " << userId << ",\n"
              << "    \"timestamp\": \"" << getTimestampISO8601() << "\",\n"
              << "    \"action\": \"CPP_MOTOR_CORE_CALCULATION\",\n"
              << "    \"motor\": \"C++ Native Core (SPEC §2)\",\n"
              << "    \"tiempo_computo_us\": " << elapsedUs << "\n"
              << "  },\n"
              << "  \"error_details\": null\n"
              << "}\n";

    return 0;
}

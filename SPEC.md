Sistema E-commerce Bebidas 24/7 (Arquitectura Microservicios)
1. Visión General del Proyecto
Plataforma de expendio de bebidas 24/7 con verificación de identidad y logística multiactor (Cliente, Rider, Admin).  

2. Stack Tecnológico Obligatorio
Backend: PHP (Servicios Core) y Python (Lógica de rutas/GPS).  

Frontend: HTML5, CSS3.  

Base de Datos: MySQL (Motor Relacional).  

Rendimiento: C++ para módulos críticos.  

3. Arquitectura y Auditoría (Regla de Oro)
Todas las tablas y objetos de respuesta deben incluir campos de trazabilidad:  

created_at, updated_at, created_by, updated_by.

4. Protocolo de Devolución de Código (Output Format)
Cuando se solicite desarrollo, Jules debe devolver la respuesta siguiendo este estándar:

Lógica Backend (PHP/Python): Debe devolver un objeto JSON estructurado con el siguiente formato:
{
  "status": "success | error",
  "data": { "resultado_de_la_operacion" },
  "audit": { "user_id": "ID", "timestamp": "ISO-8601" },
  "error_details": null
}

Frontend (HTML/CSS): Código modular, utilizando clases semánticas y diseño responsivo.

Base de Datos (SQL): Scripts autoejecutables con validación IF NOT EXISTS.

5. Estructura de Documentación Técnica (Entregables)
Para cada módulo desarrollado, Jules debe generar automáticamente una sección de documentación con esta jerarquía para la tesina:

Título del Módulo: Nombre funcional.

Descripción Técnica: Propósito del código y cómo cumple con el requerimiento.  

Diagrama de Flujo / Lógica: Explicación paso a paso del proceso.

Diccionario de Datos: Definición de variables, tipos y tablas afectadas.

Manual de Pruebas: Casos de éxito y manejo de errores (ej. ¿qué pasa si el C.I. es ilegible?).

6. Definición de Usuarios (Resumen)
Cliente: Registro OAuth/Manual, subida de C.I., catálogo jerárquico, pagos QR/Efectivo, seguimiento GPS.  

Rider: Expediente digital completo (Licencia, CV, Seguro), gestión de stock y liquidación de caja.  

Super Usuario: CRUD total, auditoría de logs, monitoreo en vivo y control de cancelaciones.

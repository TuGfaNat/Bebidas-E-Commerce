<?php
// microservices/Auth/UserRegistration.php

require_once 'connection.php';

class UserRegistration {
    private $db;

    public function __construct() {
        $this->db = DatabaseConnection::getInstance()->getConnection();
    }

    /**
     * Devuelve una respuesta estructurada según el SPEC.md (Sección 4).
     */
    private function formatResponse($status, $data, $userId = null, $errorDetails = null) {
        return json_encode([
            "status" => $status,
            "data" => $data,
            "audit" => [
                "user_id" => $userId ?: "SYSTEM",
                "timestamp" => date("c") // ISO-8601
            ],
            "error_details" => $errorDetails
        ]);
    }

    /**
     * Procesa la subida del C.I. y guarda el registro.
     */
    public function procesarSubidaCI($userId, $fileData) {
        try {
            // Lógica simulada de validación de archivo y almacenamiento en S3/local
            if (empty($fileData['tmp_name'])) {
                return $this->formatResponse("error", null, $userId, "No se proporcionó ningún archivo de C.I.");
            }

            $rutaDestino = '/uploads/ci/' . basename($fileData['name']);
            // move_uploaded_file($fileData['tmp_name'], $rutaDestino);
            $ciStatus = 'pending';

            $stmt = $this->db->prepare("UPDATE users SET ci_url = ?, ci_status = ?, updated_by = ? WHERE id = ?");
            $stmt->execute([$rutaDestino, $ciStatus, $userId, $userId]);

            // Auditoría lógica de la base de datos (se debe hacer por trigger, o explícitamente en el código si es necesario)
            $this->logAuditoria('users', $userId, 'UPDATE', null, json_encode(['ci_url' => $rutaDestino, 'ci_status' => $ciStatus]), $userId);

            return $this->formatResponse("success", ["mensaje" => "C.I. subido correctamente y en estado pendiente de verificación."], $userId);

        } catch (\Exception $e) {
            return $this->formatResponse("error", null, $userId, $e->getMessage());
        }
    }

    /**
     * Maneja la solicitud de permisos de GPS y Cámara.
     */
    public function validarPermisos($userId, $gpsEnabled, $cameraEnabled) {
        try {
            // Lógica para registrar que el usuario aceptó los permisos obligatorios.
            if (!$gpsEnabled || !$cameraEnabled) {
                return $this->formatResponse("error", null, $userId, "Los permisos de GPS y Cámara son obligatorios para el Rider.");
            }

            // Aquí se actualizarían los metadatos o tabla de permisos si existiera, devolvemos success.
            return $this->formatResponse("success", ["mensaje" => "Permisos validados correctamente."], $userId);

        } catch (\Exception $e) {
             return $this->formatResponse("error", null, $userId, $e->getMessage());
        }
    }

    private function logAuditoria($tabla, $registroId, $accion, $datosAnteriores, $datosNuevos, $userId) {
        $stmt = $this->db->prepare("INSERT INTO auditoria_logs (tabla_afectada, registro_id, accion, datos_anteriores, datos_nuevos, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$tabla, $registroId, $accion, $datosAnteriores, $datosNuevos, $userId, $userId]);
    }
}

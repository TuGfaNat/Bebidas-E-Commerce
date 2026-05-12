# Diagramas del Sistema - Tesina

## Diagrama Entidad-Relación (DER)
El siguiente diagrama muestra la estructura completa de la base de datos, incluyendo la tabla de usuarios, transacciones y la auditoría obligatoria.

```mermaid
erDiagram
    users {
        INT id PK
        ENUM role
        VARCHAR nombre
        VARCHAR email
        VARCHAR password_hash
        DATE fecha_nacimiento
        VARCHAR ci_url
        ENUM ci_status
        TIMESTAMP created_at
        TIMESTAMP updated_at
        INT created_by FK
        INT updated_by FK
    }

    productos {
        INT id PK
        VARCHAR categoria
        VARCHAR nombre
        VARCHAR marca
        VARCHAR sabor
        DECIMAL precio
        INT stock
        TIMESTAMP created_at
        TIMESTAMP updated_at
        INT created_by FK
        INT updated_by FK
    }

    pedidos {
        INT id PK
        INT cliente_id FK
        INT rider_id FK
        ENUM estado_pago
        ENUM estado_pedido
        DECIMAL total
        VARCHAR qr_comprobante_url
        TIMESTAMP created_at
        TIMESTAMP updated_at
        INT created_by FK
        INT updated_by FK
    }

    pedido_detalles {
        INT id PK
        INT pedido_id FK
        INT producto_id FK
        INT cantidad
        DECIMAL precio_unitario
        TIMESTAMP created_at
        TIMESTAMP updated_at
        INT created_by FK
        INT updated_by FK
    }

    documentacion_rider {
        INT id PK
        INT rider_id FK
        VARCHAR licencia_url
        VARCHAR seguro_url
        VARCHAR cv_url
        ENUM estado_aprobacion
        TIMESTAMP created_at
        TIMESTAMP updated_at
        INT created_by FK
        INT updated_by FK
    }

    auditoria_logs {
        INT id PK
        VARCHAR tabla_afectada
        INT registro_id
        ENUM accion
        JSON datos_anteriores
        JSON datos_nuevos
        VARCHAR ip_address
        TIMESTAMP created_at
        TIMESTAMP updated_at
        INT created_by FK
        INT updated_by FK
    }

    users ||--o{ productos : "crea/actualiza"
    users ||--o{ pedidos : "realiza (cliente)"
    users ||--o{ pedidos : "entrega (rider)"
    users ||--o{ documentacion_rider : "posee (rider)"
    users ||--o{ auditoria_logs : "audita operaciones"

    pedidos ||--o{ pedido_detalles : "contiene"
    productos ||--o{ pedido_detalles : "incluido en"
```

## Diagrama de Proceso: Transacción y Despacho
Este diagrama de flujo describe el ciclo de vida de un pedido, desde que el Cliente procesa el pago hasta que el Rider realiza la entrega, incluyendo las validaciones de auditoría.

```mermaid
sequenceDiagram
    actor Cliente
    participant Módulo_Pago as Checkout (Auth)
    participant Módulo_Logística as Logística (Python)
    actor Rider
    participant Módulo_Rider as Assignment (Rider)
    participant Auditoría as Base de Datos (Auditoria_Logs)

    Cliente->>Módulo_Pago: Confirma Carrito y selecciona "Pagar con QR"
    Módulo_Pago->>Auditoría: INSERT pedido (estado_pago='esperando_pago', estado_pedido='pendiente')
    Cliente->>Módulo_Pago: Sube Comprobante QR
    Módulo_Pago->>Auditoría: UPDATE pedido (estado_pago='pagado_qr') e INSERT Log
    Módulo_Pago-->>Cliente: JSON: "Comprobante subido"

    Rider->>Módulo_Rider: Solicita pedidos pendientes cercanos
    Módulo_Rider->>Módulo_Logística: Enviar Coordenadas GPS (Cliente/Rider/Tienda)
    Módulo_Logística-->>Módulo_Rider: Devuelve distancia, tiempo, costo
    Módulo_Rider-->>Rider: Muestra lista de pedidos disponibles

    Rider->>Módulo_Rider: Clic en "Aceptar Pedido"
    Módulo_Rider->>Auditoría: UPDATE pedido (estado_pedido='asignado', rider_id=ID) e INSERT Log
    Módulo_Rider->>Auditoría: UPDATE productos (restar stock en tiempo real) e INSERT Logs
    Módulo_Rider-->>Rider: JSON: "Pedido aceptado y stock descontado"

    Rider->>Cliente: Rider se dirige al destino
    Rider->>Módulo_Rider: Marca como "En Camino"
    Módulo_Rider->>Auditoría: UPDATE pedido (estado_pedido='en_camino') e INSERT Log

    Rider->>Cliente: Entrega Bebidas
    Rider->>Módulo_Rider: Marca como "Entregado"
    Módulo_Rider->>Auditoría: UPDATE pedido (estado_pedido='entregado') e INSERT Log
    Módulo_Rider-->>Rider: JSON: "Entrega Finalizada"
```

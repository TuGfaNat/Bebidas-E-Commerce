// app.js

// Global Database State
let DB = {
    users: [],
    productos: [],
    pedidos: [],
    pedido_detalles: [],
    documentacion_rider: [],
    auditoria_logs: []
};

// Current Session Info
let currentSession = {
    cliente: null,
    rider: null,
    admin: null,
    currentUser: null
};

// Configuration & Connectivity State
let config = {
    connectedMode: false,
    apiUrl: (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file:'))
        ? `${window.location.origin}${window.location.pathname.replace(/\/[^\/]*$/, '')}/microservices`
        : 'http://localhost/Bebidas-E-Commerce/microservices'
};

// Cart State
let cart = [];

// Geolocation of Store (La Paz, Sopocachi)
const STORE_COORDS = { lat: -16.5050, lon: -68.1290 };

// Selected client delivery coordinates during checkout
let selectedDeliveryCoords = null;

// Leaflet Map Instances
let checkoutMapInstance = null;
let clientTrackingMapInstance = null;
let riderTrackingMapInstance = null;
let adminMonitoringMapInstance = null;

// Leaflet Markers
let checkoutMarkerStore = null;
let checkoutMarkerClient = null;
let clientTrackingMarkerStore = null;
let clientTrackingMarkerClient = null;
let clientTrackingMarkerRider = null;
let clientTrackingRouteLine = null;

let riderTrackingMarkerStore = null;
let riderTrackingMarkerClient = null;
let riderTrackingMarkerRider = null;
let riderTrackingRouteLine = null;

// Admin map markers
let adminMonitoringMarkerStore = null;
let adminMonitoringMarkerClient = null;
let adminMonitoringMarkerRider = null;
let adminMonitoringRouteLine = null;

// Selected order ID to track in Admin panel
let selectedAdminMonitoringOrderId = null;

// Initialize System
document.addEventListener('DOMContentLoaded', () => {
    initDatabase();
    setupEventListeners();
    initLucide();
});

// Load icons
function initLucide() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// ----------------------------------------------------
// 1. DATABASE & INITIAL DATA SEEDING
// ----------------------------------------------------
function initDatabase() {
    // Check if localStorage has database, otherwise seed
    const localDb = localStorage.getItem('bebidas_247_db');
    if (localDb) {
        DB = JSON.parse(localDb);
        // Automatic upgrade to Burger Shop if old beverage database is detected
        if (DB.productos && DB.productos.some(p => p.categoria === 'Cervezas' || p.categoria === 'Vinos' || p.categoria === 'Licores')) {
            DB.productos = getBurgerProducts();
            saveDatabase();
        }
        // Upgrade legacy password hashes to real bcrypt hashes
        if (DB.users && Array.isArray(DB.users)) {
            const realHashes = {
                1: '$2a$10$NHYkGy/q.W57QI7bIumQ9.J7DfEZm9d32MxvdvY5z7XHhwh7KPj/e', // carlos
                2: '$2a$10$Of//sDFxLZrPBXCb7BNuPe.FQSqxu3du7iMj.K7.M9QXr5OXtMwN2', // pedro
                3: '$2a$10$yvebu1TvWJgj7wE7L1QCDuroqNwHJaELe4E.R3UNDIzwG06EFIJOq', // admin
                4: '$2b$12$TYK.4OXjw6rT6CvUeIUH3O6CawYZp4qyouHv1Urv5p9Gws9kkr8Ym', // maria
                5: '$2b$12$ARkI5fD1NdgTtJmJRQo0Y.sbSRPzKgWGpbDtmYzS9yV8eS6sGG0s6'  // juan
            };
            let updated = false;
            DB.users.forEach(u => {
                if (realHashes[u.id] && (!u.password_hash || u.password_hash.includes('...'))) {
                    u.password_hash = realHashes[u.id];
                    updated = true;
                }
            });
            if (updated) {
                saveDatabase();
            }
        }
    } else {
        seedDatabase();
        saveDatabase();
    }

    // Initialize Auth view
    renderAuthCard('login');

    // Restore session if exists
    const savedUser = localStorage.getItem('bebidas_user_session');
    if (savedUser) {
        const u = JSON.parse(savedUser);
        const match = DB.users.find(usr => usr.id === u.id);
        if (match) {
            onLoginSuccess(match, false);
            return;
        }
    }
    
    // Otherwise show login screen
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('headerUserStatus').style.display = 'none';
}

function saveDatabase() {
    localStorage.setItem('bebidas_247_db', JSON.stringify(DB));
}

function seedDatabase() {
    // 1. Seed Users (with secure bcrypt hashes for demo accounts)
    DB.users = [
        {
            id: 1,
            role: 'cliente',
            nombre: 'Carlos Pérez',
            email: 'carlos@mail.com',
            password_hash: '$2a$10$NHYkGy/q.W57QI7bIumQ9.J7DfEZm9d32MxvdvY5z7XHhwh7KPj/e', // carlos
            fecha_nacimiento: '1992-05-15',
            ci_url: '/uploads/ci/ci_carlos.png',
            ci_status: 'verified',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 1,
            updated_by: 1
        },
        {
            id: 2,
            role: 'rider',
            nombre: 'Pedro Gómez',
            email: 'pedro@mail.com',
            password_hash: '$2a$10$Of//sDFxLZrPBXCb7BNuPe.FQSqxu3du7iMj.K7.M9QXr5OXtMwN2', // pedro
            fecha_nacimiento: '1995-10-22',
            ci_url: '/uploads/ci/ci_pedro.png',
            ci_status: 'verified',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 2,
            updated_by: 2
        },
        {
            id: 3,
            role: 'super_usuario',
            nombre: 'Admin Central',
            email: 'admin@mail.com',
            password_hash: '$2a$10$yvebu1TvWJgj7wE7L1QCDuroqNwHJaELe4E.R3UNDIzwG06EFIJOq', // admin
            fecha_nacimiento: '1988-01-01',
            ci_url: null,
            ci_status: 'verified',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 3,
            updated_by: 3
        },
        {
            id: 4,
            role: 'cliente',
            nombre: 'María López (Pendiente)',
            email: 'maria@mail.com',
            password_hash: '$2b$12$TYK.4OXjw6rT6CvUeIUH3O6CawYZp4qyouHv1Urv5p9Gws9kkr8Ym', // maria
            fecha_nacimiento: '2000-09-12',
            ci_url: '/uploads/ci/ci_maria.jpg',
            ci_status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 4,
            updated_by: 4
        },
        {
            id: 5,
            role: 'rider',
            nombre: 'Juan Rodríguez (Pendiente)',
            email: 'juan@mail.com',
            password_hash: '$2b$12$ARkI5fD1NdgTtJmJRQo0Y.sbSRPzKgWGpbDtmYzS9yV8eS6sGG0s6', // juan
            fecha_nacimiento: '1996-03-08',
            ci_url: '/uploads/ci/ci_juan.jpg',
            ci_status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 5,
            updated_by: 5
        }
    ];

    // 2. Seed Rider Documentation
    DB.documentacion_rider = [
        {
            id: 1,
            rider_id: 2, 
            licencia_url: '/uploads/docs/licencia_pedro.jpg',
            seguro_url: '/uploads/docs/seguro_pedro.jpg',
            cv_url: '/uploads/docs/cv_pedro.pdf',
            estado_aprobacion: 'aprobado',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 3,
            updated_by: 3
        },
        {
            id: 2,
            rider_id: 5, 
            licencia_url: '/uploads/docs/licencia_juan.jpg',
            seguro_url: '/uploads/docs/seguro_juan.jpg',
            cv_url: '/uploads/docs/cv_juan.pdf',
            estado_aprobacion: 'pendiente',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 5,
            updated_by: 5
        }
    ];

    // 3. Seed Products (Burger Shop)
    DB.productos = getBurgerProducts();
}

function getBurgerProducts() {
    return [
        { id: 1, categoria: 'Hamburguesas', nombre: 'Hamburguesa Clásica Simple', marca: 'Burger 24/7', sabor: 'Carne 150g, lechuga, tomate y salsa especial', precio: 22.00, stock: 85, created_by: 3, updated_by: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 2, categoria: 'Hamburguesas', nombre: 'Doble Queso Smash Burger', marca: 'Gourmet', sabor: 'Doble medallón smash, queso cheddar x2 y cebolla grillada', precio: 32.00, stock: 70, created_by: 3, updated_by: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 3, categoria: 'Hamburguesas', nombre: 'Bacon BBQ Crunch', marca: 'Especial', sabor: 'Tocino ahumado crocante, salsa BBQ dulce y queso americano', precio: 36.00, stock: 65, created_by: 3, updated_by: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 4, categoria: 'Hamburguesas', nombre: 'Monster Triple Burger', marca: 'Extrema', sabor: 'Triple carne, huevo frito, tocino, queso y pepinillos', precio: 45.00, stock: 40, created_by: 3, updated_by: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 5, categoria: 'Combos', nombre: 'Combo Clásico con Papas y Soda', marca: 'Combos', sabor: 'Hamburguesa Clásica + Papas Medianas + Coca-Cola 500ml', precio: 34.00, stock: 50, created_by: 3, updated_by: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 6, categoria: 'Combos', nombre: 'Combo Doble Smash + Papas Grandes', marca: 'Combos', sabor: 'Doble Smash Cheddar + Papas Rústicas + Bebida 500ml', precio: 44.00, stock: 45, created_by: 3, updated_by: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 7, categoria: 'Acompañamientos', nombre: 'Papas Fritas Rústicas', marca: 'Sides', sabor: 'Papas crocantes con sal marina y salsa tártara de la casa', precio: 14.00, stock: 120, created_by: 3, updated_by: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 8, categoria: 'Acompañamientos', nombre: 'Aros de Cebolla Crocantes', marca: 'Sides', sabor: '8 aros crujientes empanizados con dip BBQ', precio: 16.00, stock: 80, created_by: 3, updated_by: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 9, categoria: 'Acompañamientos', nombre: 'Nuggets de Pollo Crispy (6 uds)', marca: 'Sides', sabor: 'Pechuga crocante con salsa de mostaza miel', precio: 18.00, stock: 90, created_by: 3, updated_by: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 10, categoria: 'Bebidas', nombre: 'Coca-Cola Original 500ml', marca: 'Coca-Cola', sabor: 'Original Fría', precio: 6.00, stock: 200, created_by: 3, updated_by: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 11, categoria: 'Bebidas', nombre: 'Sprite Lima-Limón 500ml', marca: 'Sprite', sabor: 'Refrescante Fría', precio: 6.00, stock: 150, created_by: 3, updated_by: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 12, categoria: 'Bebidas', nombre: 'Cerveza Huari 620ml', marca: 'Huari', sabor: 'Tradicional Helada', precio: 18.00, stock: 100, created_by: 3, updated_by: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];

    // 4. Seed Audit Logs
    DB.auditoria_logs = [
        {
            id: 1,
            tabla_afectada: 'productos',
            registro_id: 1,
            accion: 'INSERT',
            datos_anteriores: null,
            datos_nuevos: JSON.stringify({ nombre: 'Paceña Pilsen Lata 355ml', stock: 120, precio: 12.00 }),
            ip_address: '127.0.0.1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 3,
            updated_by: 3
        },
        {
            id: 2,
            tabla_afectada: 'users',
            registro_id: 1,
            accion: 'INSERT',
            datos_anteriores: null,
            datos_nuevos: JSON.stringify({ email: 'carlos@mail.com', nombre: 'Carlos Pérez', role: 'cliente' }),
            ip_address: '127.0.0.1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 1,
            updated_by: 1
        }
    ];

    // 5. Seed Pedidos (history)
    DB.pedidos = [
        {
            id: 1,
            cliente_id: 1,
            rider_id: 2,
            estado_pago: 'pagado_qr',
            estado_pedido: 'entregado',
            total: 62.00,
            latitud: -16.5090,
            longitud: -68.1340,
            qr_comprobante_url: '/uploads/qr/comprobante_carlos1.jpg',
            created_at: new Date(Date.now() - 3600000 * 24).toISOString(), 
            updated_at: new Date(Date.now() - 3600000 * 23).toISOString(),
            created_by: 1,
            updated_by: 2
        }
    ];

    DB.pedido_detalles = [
        { id: 1, pedido_id: 1, producto_id: 1, cantidad: 2, precio_unitario: 12.00, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: 1, updated_by: 1 },
        { id: 2, pedido_id: 1, producto_id: 3, cantidad: 1, precio_unitario: 38.00, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: 1, updated_by: 1 }
    ];
}

// ----------------------------------------------------
// 2. AUDIT LOG WRITER (BMAD METHOD)
// ----------------------------------------------------
function logAuditoria(tabla, registroId, accion, datosAnteriores, datosNuevos, userId) {
    const newLog = {
        id: DB.auditoria_logs.length + 1,
        tabla_afectada: tabla,
        registro_id: registroId,
        accion: accion,
        datos_anteriores: datosAnteriores ? JSON.stringify(datosAnteriores) : null,
        datos_nuevos: datosNuevos ? JSON.stringify(datosNuevos) : null,
        ip_address: '127.0.0.1', 
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: userId,
        updated_by: userId
    };
    DB.auditoria_logs.unshift(newLog); 
    saveDatabase();
}

// ----------------------------------------------------
// 3. HAVERSINE FORMULA & LOGISTICS
// ----------------------------------------------------
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371.0; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Calculate delivery metrics
function calculateLogistics(lat, lon) {
    const distance = haversine(STORE_COORDS.lat, STORE_COORDS.lon, lat, lon);
    const timeMin = (distance / 30.0) * 60.0;
    const shippingCost = 5.0 + (distance * 2.0);

    return {
        lat: lat,
        lon: lon,
        distanceKm: distance.toFixed(2),
        etaMin: Math.round(timeMin),
        costBs: shippingCost.toFixed(2)
    };
}

// ----------------------------------------------------
// 4. EVENT LISTENERS SETUP
// ----------------------------------------------------
function setupEventListeners() {
    document.getElementById('btnLogo').addEventListener('click', () => {
        if (currentSession.currentUser) {
            const role = currentSession.currentUser.role;
            switchRole(role === 'super_usuario' ? 'admin' : role);
        }
    });

    document.getElementById('btnHeaderLogout').addEventListener('click', handleLogout);

    document.getElementById('toggleConnectedMode').addEventListener('change', (e) => {
        config.connectedMode = e.target.checked;
        const apiDot = document.getElementById('apiDot');
        const apiText = document.getElementById('apiStatusText');

        if (config.connectedMode) {
            apiDot.className = 'status-dot inactive';
            apiText.innerText = 'Intentando conectar a PHP...';
            
            fetch(`${config.apiUrl}/Auth/connection.php`)
                .then(() => {
                    apiDot.className = 'status-dot active';
                    apiText.innerText = 'Modo Conectado (PHP Server)';
                    showToast('Conectado a la base de datos MySQL mediante PHP.', 'success');
                })
                .catch(err => {
                    apiDot.className = 'status-dot inactive';
                    apiText.innerText = 'Servidor Offline - Modo Simulado Activo';
                    e.target.checked = false;
                    config.connectedMode = false;
                    showToast('No se pudo conectar al servidor PHP local. Reversión a simulación.', 'error');
                });
        } else {
            apiDot.className = 'status-dot active';
            apiText.innerText = 'Modo Simulado (Local)';
            showToast('Modo Simulado re-activado.', 'info');
        }
        if (currentSession.currentUser) {
            updateUIForCurrentRole();
        }
    });

    document.getElementById('txtSearch').addEventListener('input', (e) => {
        renderProducts(getActiveCategory(), e.target.value);
    });

    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.category-item').forEach(c => c.classList.remove('active'));
            item.classList.add('active');
            renderProducts(item.dataset.category, document.getElementById('txtSearch').value);
        });
    });

    document.getElementById('btnFloatingCart').addEventListener('click', openCartDrawer);
    document.getElementById('btnCloseDrawer').addEventListener('click', closeCartDrawer);

    document.getElementById('cartDrawerBody').addEventListener('click', (e) => {
        if (e.target.classList.contains('cart-qty-btn') || e.target.closest('.cart-qty-btn')) {
            const btn = e.target.classList.contains('cart-qty-btn') ? e.target : e.target.closest('.cart-qty-btn');
            const index = parseInt(btn.dataset.index);
            const action = btn.dataset.action;
            updateCartQuantity(index, action);
        }
    });

    document.getElementById('btnCheckout').addEventListener('click', openCheckoutModal);
    document.getElementById('btnCancelCheckout').addEventListener('click', closeCheckoutModal);

    document.getElementById('payOptQr').addEventListener('click', () => {
        document.getElementById('payOptQr').classList.add('active');
        document.getElementById('payOptCash').classList.remove('active');
        document.getElementById('qrUploadBlock').style.display = 'block';
        document.getElementById('cashDetailsBlock').style.display = 'none';
        validateCheckoutForm();
    });
    document.getElementById('payOptCash').addEventListener('click', () => {
        document.getElementById('payOptCash').classList.add('active');
        document.getElementById('payOptQr').classList.remove('active');
        document.getElementById('qrUploadBlock').style.display = 'none';
        document.getElementById('cashDetailsBlock').style.display = 'block';
        validateCheckoutForm();
    });

    document.getElementById('fileQrComprobante').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('qrFileName').innerText = file.name;
            document.getElementById('qrUploadPreview').style.display = 'flex';
            validateCheckoutForm();
        }
    });
    document.getElementById('btnRemoveQrFile').addEventListener('click', () => {
        document.getElementById('fileQrComprobante').value = '';
        document.getElementById('qrUploadPreview').style.display = 'none';
        validateCheckoutForm();
    });

    document.getElementById('btnPlaceOrder').addEventListener('click', submitOrderCheckout);

    document.getElementById('btnRiderAction').addEventListener('click', processRiderActiveOrderStep);
    document.getElementById('btnRiderCancel').addEventListener('click', cancelRiderActiveOrder);

    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.admin-subpanel').forEach(panel => panel.classList.remove('active'));
            const tabId = btn.dataset.tab;
            document.getElementById(`subpanel${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`).classList.add('active');
            
            if (tabId === 'monitoring') {
                renderAdminMonitoring();
            }
        });
    });

    document.getElementById('adminProductForm').addEventListener('submit', handleProductFormSubmit);
    document.getElementById('btnCancelEdit').addEventListener('click', resetProductForm);

    document.getElementById('btnFileViewerClose').addEventListener('click', () => {
        document.getElementById('fileViewerModal').classList.remove('active');
    });
}

function getActiveCategory() {
    const activeItem = document.querySelector('.category-item.active');
    return activeItem ? activeItem.dataset.category : 'todos';
}

function switchRole(role) {
    document.querySelectorAll('.panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    const panelId = `panel${role.charAt(0).toUpperCase() + role.slice(1)}`;
    const targetPanel = document.getElementById(panelId);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }

    updateUIForCurrentRole();
}

// ----------------------------------------------------
// 5. AUTHENTICATION CONTROLLER (LOGIN/REGISTRATION)
// ----------------------------------------------------
function renderAuthCard(view = 'login') {
    const screen = document.getElementById('loginScreen');
    if (!screen) return;

    let content = '';

    if (view === 'login') {
        content = `
            <div class="login-card glass-card">
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <div class="logo-icon" style="margin: 0 auto 0.75rem; width: 44px; height: 44px; display:flex; align-items:center; justify-content:center; background:var(--accent-purple); color:#fff; border-radius:var(--radius-md);"><i data-lucide="zap"></i></div>
                    <h2 style="font-weight: 700; font-size: 1.6rem;">Bebidas 24/7</h2>
                    <p style="font-size: 0.85rem; color: var(--text-secondary);">Acceso Seguro al E-Commerce</p>
                </div>
                
                <form id="formAuthLogin">
                    <div class="form-group" style="margin-bottom: 1rem;">
                        <label style="font-size: 0.8rem; margin-bottom: 0.25rem; display: block;">Correo Electrónico</label>
                        <input type="email" class="form-control" id="loginEmail" placeholder="correo@mail.com" required>
                    </div>
                    <div class="form-group" style="margin-bottom: 1.25rem;">
                        <label style="font-size: 0.8rem; margin-bottom: 0.25rem; display: block;">Contraseña</label>
                        <input type="password" class="form-control" id="loginPassword" placeholder="••••••••" required>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Ingresar</button>
                </form>

                <div style="text-align: center; font-size: 0.8rem; border-top: 1px solid var(--border-color); margin-top: 1.25rem; padding-top: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem;">
                    <span style="color:var(--text-secondary);">¿No tienes cuenta?</span>
                    <div style="display:flex; justify-content:center; gap:1rem;">
                        <a href="#" id="linkGoRegisterClient" style="color: var(--accent-purple); text-decoration: none; font-weight: 600;">Registrarme Cliente</a>
                        <span style="color:var(--border-color);">|</span>
                        <a href="#" id="linkGoRegisterRider" style="color: var(--accent-purple); text-decoration: none; font-weight: 600;">Postularme Repartidor</a>
                    </div>
                </div>
            </div>
        `;
    } 
    else if (view === 'register_client') {
        content = `
            <div class="login-card glass-card" style="max-width: 480px;">
                <div style="text-align: center; margin-bottom: 1.25rem;">
                    <h2>Registro de Cliente</h2>
                    <p style="font-size: 0.85rem; color: var(--text-secondary);">Sube tu C.I. para desbloquear el catálogo</p>
                </div>
                <form id="formAuthRegisterClient" style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div class="form-group">
                        <input type="text" class="form-control" id="regClientName" placeholder="Nombre completo" required>
                    </div>
                    <div class="form-group">
                        <input type="email" class="form-control" id="regClientEmail" placeholder="Correo electrónico" required>
                    </div>
                    <div class="form-group">
                        <input type="password" class="form-control" id="regClientPass" placeholder="Contraseña" required>
                    </div>
                    <div class="form-group">
                        <label style="font-size: 0.75rem; margin-bottom: 0.2rem; display:block;">Fecha de Nacimiento:</label>
                        <input type="date" class="form-control" id="regClientDob" required>
                        <div id="clientDobStatus" class="age-checker-status"></div>
                    </div>
                    <div class="form-group">
                        <label style="font-size: 0.75rem; margin-bottom: 0.2rem; display:block;">Carga tu C.I. (Foto/PDF):</label>
                        <div class="file-upload-styled" style="padding: 0.65rem;">
                            <i data-lucide="upload" style="width: 18px; height: 18px; margin-bottom: 0;"></i>
                            <span style="font-size: 0.8rem;" id="lblRegClientCiFile">Elegir Archivo</span>
                            <input type="file" id="regClientCiFile" accept="image/*,application/pdf" required>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary" id="btnSubmitRegClient" style="width: 100%; margin-top: 0.5rem;">Registrarme</button>
                    <button type="button" class="btn btn-secondary" onclick="renderAuthCard('login')" style="width: 100%;">Volver al Login</button>
                </form>
            </div>
        `;
    } 
    else if (view === 'register_rider') {
        content = `
            <div class="login-card glass-card" style="max-width: 500px;">
                <div style="text-align: center; margin-bottom: 1.25rem;">
                    <h2>Postulación de Repartidor</h2>
                    <p style="font-size: 0.85rem; color: var(--text-secondary);">Carga tu expediente digital de conducción</p>
                </div>
                <form id="formAuthRegisterRider" style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div class="form-group">
                        <input type="text" class="form-control" id="regRiderName" placeholder="Nombre completo" required>
                    </div>
                    <div class="form-group">
                        <input type="email" class="form-control" id="regRiderEmail" placeholder="Correo electrónico" required>
                    </div>
                    <div class="form-group">
                        <input type="password" class="form-control" id="regRiderPass" placeholder="Contraseña" required>
                    </div>
                    <div class="form-group">
                        <label style="font-size: 0.75rem; margin-bottom: 0.2rem; display:block;">Fecha de Nacimiento:</label>
                        <input type="date" class="form-control" id="regRiderDob" required>
                        <div id="riderDobStatus" class="age-checker-status"></div>
                    </div>
                    <div class="form-group" style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
                        <div>
                            <label style="font-size: 0.75rem; display:block;">Licencia Conducir:</label>
                            <input type="file" class="form-control" id="regRiderLicencia" accept="image/*,application/pdf" required>
                        </div>
                        <div>
                            <label style="font-size: 0.75rem; display:block;">Seguro SOAT:</label>
                            <input type="file" class="form-control" id="regRiderSeguro" accept="image/*,application/pdf" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label style="font-size: 0.75rem; display:block;">Curriculum Vitae (PDF):</label>
                        <input type="file" class="form-control" id="regRiderCv" accept="application/pdf" required>
                    </div>
                    <button type="submit" class="btn btn-primary" id="btnSubmitRegRider" style="width: 100%; margin-top: 0.5rem;">Enviar Postulación</button>
                    <button type="button" class="btn btn-secondary" onclick="renderAuthCard('login')" style="width: 100%;">Volver al Login</button>
                </form>
            </div>
        `;
    }

    screen.innerHTML = content;
    initLucide();
    setupAuthFormListeners(view);
}

function setupAuthFormListeners(view) {
    if (view === 'login') {
        document.getElementById('linkGoRegisterClient').addEventListener('click', (e) => {
            e.preventDefault();
            renderAuthCard('register_client');
        });
        document.getElementById('linkGoRegisterRider').addEventListener('click', (e) => {
            e.preventDefault();
            renderAuthCard('register_rider');
        });
        document.getElementById('formAuthLogin').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const pass = document.getElementById('loginPassword').value;
            handleLogin(email, pass);
        });
    } 
    else if (view === 'register_client') {
        const dobInput = document.getElementById('regClientDob');
        const submitBtn = document.getElementById('btnSubmitRegClient');
        const statusLbl = document.getElementById('clientDobStatus');

        dobInput.addEventListener('change', () => {
            const age = calculateAge(dobInput.value);
            if (age >= 18) {
                statusLbl.innerHTML = `<span class="age-valid">✓ Mayor de edad (${age} años)</span>`;
                submitBtn.disabled = false;
            } else {
                statusLbl.innerHTML = `<span class="age-invalid">✗ Debes ser mayor de 18 años (${age} años)</span>`;
                submitBtn.disabled = true;
            }
        });

        document.getElementById('regClientCiFile').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                document.getElementById('lblRegClientCiFile').innerText = file.name;
            }
        });

        document.getElementById('formAuthRegisterClient').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('regClientName').value;
            const email = document.getElementById('regClientEmail').value;
            const pass = document.getElementById('regClientPass').value;
            const dob = dobInput.value;
            const file = document.getElementById('regClientCiFile').files[0];

            if (!name || !email || !pass || !dob || !file) {
                showToast('Faltan campos obligatorios.', 'error');
                return;
            }

            const newId = DB.users.length + 1;
            const newClient = {
                id: newId,
                role: 'cliente',
                nombre: name,
                email: email,
                password_hash: hashPassword(pass),
                fecha_nacimiento: dob,
                ci_url: `/uploads/ci/ci_${newId}_${file.name}`,
                ci_status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: newId,
                updated_by: newId
            };

            DB.users.push(newClient);
            logAuditoria('users', newId, 'INSERT', null, { email, name, role: 'cliente', ci_status: 'pending' }, newId);
            saveDatabase();

            showToast('Cliente registrado con éxito. Esperando aprobación de C.I.', 'success');
            onLoginSuccess(newClient);
        });
    } 
    else if (view === 'register_rider') {
        const dobInput = document.getElementById('regRiderDob');
        const submitBtn = document.getElementById('btnSubmitRegRider');
        const statusLbl = document.getElementById('riderDobStatus');

        dobInput.addEventListener('change', () => {
            const age = calculateAge(dobInput.value);
            if (age >= 18) {
                statusLbl.innerHTML = `<span class="age-valid">✓ Mayor de edad (${age} años)</span>`;
                submitBtn.disabled = false;
            } else {
                statusLbl.innerHTML = `<span class="age-invalid">✗ Debes ser mayor de 18 años (${age} años)</span>`;
                submitBtn.disabled = true;
            }
        });

        document.getElementById('formAuthRegisterRider').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('regRiderName').value;
            const email = document.getElementById('regRiderEmail').value;
            const pass = document.getElementById('regRiderPass').value;
            const dob = dobInput.value;

            const l = document.getElementById('regRiderLicencia').files[0];
            const s = document.getElementById('regRiderSeguro').files[0];
            const c = document.getElementById('regRiderCv').files[0];

            if (!name || !email || !pass || !dob || !l || !s || !c) {
                showToast('Faltan campos u hojas de postulación.', 'error');
                return;
            }

            const newId = DB.users.length + 1;
            const newRider = {
                id: newId,
                role: 'rider',
                nombre: name,
                email: email,
                password_hash: hashPassword(pass),
                fecha_nacimiento: dob,
                ci_url: `/uploads/ci/ci_${newId}_rider.jpg`,
                ci_status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: newId,
                updated_by: newId
            };

            DB.users.push(newRider);

            const docId = DB.documentacion_rider.length + 1;
            const newDocs = {
                id: docId,
                rider_id: newId,
                licencia_url: `/uploads/docs/licencia_${newId}_${l.name}`,
                seguro_url: `/uploads/docs/soat_${newId}_${s.name}`,
                cv_url: `/uploads/docs/cv_${newId}_${c.name}`,
                estado_aprobacion: 'pendiente',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: newId,
                updated_by: newId
            };
            DB.documentacion_rider.push(newDocs);

            logAuditoria('users', newId, 'INSERT', null, { email, name, role: 'rider', ci_status: 'pending' }, newId);
            logAuditoria('documentacion_rider', docId, 'INSERT', null, { rider_id: newId, estado_aprobacion: 'pendiente' }, newId);
            
            saveDatabase();

            showToast('Postulación enviada. Pendiente de revisión del administrador.', 'success');
            onLoginSuccess(newRider);
        });
    }
}

// ----------------------------------------------------
// PASSWORD HASHING & BCRYPT VERIFICATION
// ----------------------------------------------------
function verifyPassword(password, hash) {
    if (!password || !hash) return false;

    const bcryptLib = (typeof dcodeIO !== 'undefined' && dcodeIO.bcrypt) 
        ? dcodeIO.bcrypt 
        : (typeof bcrypt !== 'undefined' ? bcrypt : null);

    if (bcryptLib && typeof bcryptLib.compareSync === 'function') {
        try {
            // PHP password_hash uses $2y$, bcryptjs supports $2a$ and $2b$
            const normalizedHash = hash.replace(/^\$2y\$/, '$2a$');
            if (bcryptLib.compareSync(password, normalizedHash)) {
                return true;
            }
        } catch (e) {
            console.warn('Bcrypt compareSync error:', e);
        }
    }

    // Direct fallback for demo accounts if bcrypt library fails to load
    const demoHashes = {
        'carlos': ['$2a$10$NHYkGy/q.W57QI7bIumQ9.J7DfEZm9d32MxvdvY5z7XHhwh7KPj/e', '$2y$10$xyz...'],
        'pedro': ['$2a$10$Of//sDFxLZrPBXCb7BNuPe.FQSqxu3du7iMj.K7.M9QXr5OXtMwN2', '$2y$10$abc...'],
        'admin': ['$2a$10$yvebu1TvWJgj7wE7L1QCDuroqNwHJaELe4E.R3UNDIzwG06EFIJOq', '$2y$10$admin...'],
        'maria': ['$2b$12$TYK.4OXjw6rT6CvUeIUH3O6CawYZp4qyouHv1Urv5p9Gws9kkr8Ym', '$2y$10$maria...'],
        'juan': ['$2b$12$ARkI5fD1NdgTtJmJRQo0Y.sbSRPzKgWGpbDtmYzS9yV8eS6sGG0s6', '$2y$10$juan...']
    };

    if (demoHashes[password] && demoHashes[password].includes(hash)) {
        return true;
    }

    return false;
}

function hashPassword(password) {
    const bcryptLib = (typeof dcodeIO !== 'undefined' && dcodeIO.bcrypt) 
        ? dcodeIO.bcrypt 
        : (typeof bcrypt !== 'undefined' ? bcrypt : null);

    if (bcryptLib && typeof bcryptLib.hashSync === 'function') {
        try {
            return bcryptLib.hashSync(password, 10);
        } catch (e) {
            console.warn('Bcrypt hashSync error:', e);
        }
    }
    return `$2a$10$sim_${Date.now()}_${btoa(password).replace(/=/g, '')}`;
}

function handleLogin(email, password) {
    if (config.connectedMode) {
        // Connected mode real auth
        fetch(`${config.apiUrl}/Auth/login.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `correo=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
        })
        .then(res => res.json())
        .then(res => {
            if (res.status === 'success') {
                localStorage.setItem('bebidas_jwt_token', res.data.token);
                // Decode token to match local user simulation
                const payload = parseJwt(res.data.token);
                if (payload) {
                    const match = DB.users.find(usr => usr.id === payload.user_id);
                    if (match) {
                        onLoginSuccess(match);
                    } else {
                        // Create runtime simulation user
                        const mockUser = {
                            id: payload.user_id,
                            nombre: payload.nombre || email.split('@')[0],
                            email: payload.email || email,
                            role: payload.role,
                            ci_status: 'verified'
                        };
                        onLoginSuccess(mockUser);
                    }
                }
            } else {
                showToast(res.error_details || 'Credenciales inválidas.', 'error');
            }
        })
        .catch(err => {
            showToast('Error de red al intentar conectar con PHP.', 'error');
        });
    } else {
        // Simulated local login
        const found = DB.users.find(usr => usr.email.toLowerCase() === email.toLowerCase());
        if (!found) {
            showToast('Usuario no registrado.', 'error');
            return;
        }

        // Real password validation in simulated mode
        if (!verifyPassword(password, found.password_hash)) {
            showToast('Contraseña incorrecta. Acceso denegado.', 'error');
            return;
        }

        onLoginSuccess(found);
    }
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

function onLoginSuccess(user, notify = true) {
    currentSession.currentUser = user;
    localStorage.setItem('bebidas_user_session', JSON.stringify(user));

    // Map role variables for view renderers
    if (user.role === 'cliente') {
        currentSession.cliente = user;
        currentSession.rider = null;
        currentSession.admin = null;
    } else if (user.role === 'rider') {
        currentSession.rider = user;
        currentSession.cliente = null;
        currentSession.admin = null;
    } else if (user.role === 'super_usuario') {
        currentSession.admin = user;
        currentSession.cliente = null;
        currentSession.rider = null;
    }

    // Update Header Status UI
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('headerUserStatus').style.display = 'flex';
    document.getElementById('lblHeaderUserName').innerText = `${user.nombre} (${user.role.toUpperCase().replace('_', ' ')})`;

    // Display appropriate panel
    const roleKey = user.role === 'super_usuario' ? 'admin' : user.role;
    switchRole(roleKey);

    if (notify) {
        showToast(`¡Sesión iniciada como ${user.nombre}!`, 'success');
    }
}

function handleLogout() {
    currentSession.currentUser = null;
    currentSession.cliente = null;
    currentSession.rider = null;
    currentSession.admin = null;

    localStorage.removeItem('bebidas_user_session');
    localStorage.removeItem('bebidas_jwt_token');

    // Hide panels
    document.querySelectorAll('.panel').forEach(panel => {
        panel.classList.remove('active');
    });

    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('headerUserStatus').style.display = 'none';
    
    // Clear maps elements
    checkoutMapInstance = null;
    clientTrackingMapInstance = null;
    riderTrackingMapInstance = null;
    adminMonitoringMapInstance = null;

    showToast('Sesión cerrada correctamente.', 'info');
    renderAuthCard('login');
}

// Global quick-login function for presentation
window.quickLogin = function(email, password) {
    document.getElementById('loginEmail').value = email;
    document.getElementById('loginPassword').value = password;
    handleLogin(email, password);
};

// ----------------------------------------------------
// 6. CLIENT PORTAL LOGIC
// ----------------------------------------------------
function renderClienteAccountInfo() {
    const box = document.getElementById('clienteAuthContent');
    const u = currentSession.cliente;

    if (!u) return;

    let badgeClass = 'badge-pending';
    let statusLabel = 'Pendiente de Aprobación';
    if (u.ci_status === 'verified') {
        badgeClass = 'badge-verified';
        statusLabel = 'C.I. Verificado';
    } else if (u.ci_status === 'rejected') {
        badgeClass = 'badge-rejected';
        statusLabel = 'C.I. Rechazado';
    }

    box.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <p><strong>Nombre:</strong> ${u.nombre}</p>
            <p><strong>Email:</strong> ${u.email}</p>
            <p><strong>Edad:</strong> ${calculateAge(u.fecha_nacimiento)} años</p>
            <div>
                <span class="badge ${badgeClass}">${statusLabel}</span>
            </div>
            
            <div style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
                <label style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem; display:block;">Simular otro Cliente:</label>
                <select class="form-control" id="selClientSwitcher" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">
                    ${DB.users.filter(usr => usr.role === 'cliente').map(usr => `
                        <option value="${usr.id}" ${usr.id === u.id ? 'selected' : ''}>${usr.nombre} (${usr.ci_status})</option>
                    `).join('')}
                </select>
            </div>
        </div>
    `;

    document.getElementById('selClientSwitcher').addEventListener('change', (e) => {
        const val = e.target.value;
        const targetUsr = DB.users.find(usr => usr.id === parseInt(val));
        onLoginSuccess(targetUsr, false);
    });
}

function renderProducts(category = 'todos', searchQuery = '') {
    const grid = document.getElementById('productsGrid');
    const u = currentSession.cliente;
    const isVerified = u && u.ci_status === 'verified';
    
    const alertBox = document.getElementById('catalogVerifiedAlert');
    if (!u) {
        alertBox.innerHTML = `<span class="badge badge-pending"><i data-lucide="info"></i> Inicia sesión para comprar</span>`;
    } else if (u.ci_status === 'pending') {
        alertBox.innerHTML = `<span class="badge badge-pending"><i data-lucide="clock"></i> Tu C.I. está pendiente de aprobación. Precios ocultos.</span>`;
    } else if (u.ci_status === 'rejected') {
        alertBox.innerHTML = `<span class="badge badge-rejected"><i data-lucide="octagon-alert"></i> C.I. rechazado. Sube un documento legible.</span>`;
    } else {
        alertBox.innerHTML = `<span class="badge badge-verified"><i data-lucide="circle-check"></i> Catalogo desbloqueado</span>`;
    }
    initLucide();

    let filtered = DB.productos;
    if (category !== 'todos') {
        filtered = filtered.filter(p => p.categoria === category);
    }
    if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
            p.nombre.toLowerCase().includes(query) || 
            p.marca.toLowerCase().includes(query)
        );
    }

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 3rem;">No se encontraron productos en esta sección.</div>`;
        return;
    }

    grid.innerHTML = filtered.map(p => {
        const buyButton = isVerified 
            ? `<button class="btn btn-primary btn-sm" onclick="addToCart(${p.id})"><i data-lucide="shopping-cart" style="width:16px;height:16px;"></i> Comprar</button>` 
            : `<button class="btn btn-secondary btn-sm" disabled><i data-lucide="lock" style="width:16px;height:16px;"></i> Bloqueado</button>`;

        const priceDisplay = isVerified 
            ? `${p.precio.toFixed(2)} Bs` 
            : `<span class="price-hidden" title="Debes verificar tu C.I. primero">Oculto</span>`;

        let iconName = 'flame';
        if (p.categoria === 'Combos') iconName = 'sparkles';
        else if (p.categoria === 'Acompañamientos') iconName = 'drumstick';
        else if (p.categoria === 'Bebidas') iconName = 'cup-soda';

        return `
            <div class="product-card">
                <div class="product-image">
                    <i data-lucide="${iconName}"></i>
                    <span class="product-stock" style="color: ${p.stock <= 5 ? 'var(--accent-red)' : 'var(--accent-green)'}">Stock: ${p.stock}</span>
                </div>
                <div class="product-info">
                    <span class="product-brand">${p.marca}</span>
                    <span class="product-name">${p.nombre}</span>
                    <span class="product-flavor">${p.sabor || ''}</span>
                    <div class="product-footer">
                        <span class="product-price">${priceDisplay}</span>
                        ${buyButton}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    initLucide();
}

// ----------------------------------------------------
// 7. CLIENT CART LOGIC
// ----------------------------------------------------
window.addToCart = function(productId) {
    const prod = DB.productos.find(p => p.id === productId);
    if (!prod) return;

    if (prod.stock <= 0) {
        showToast('Producto agotado.', 'error');
        return;
    }

    const existing = cart.find(item => item.product.id === productId);
    if (existing) {
        if (existing.quantity >= prod.stock) {
            showToast('Alcanzaste el límite de stock de este producto.', 'warning');
            return;
        }
        existing.quantity++;
    } else {
        cart.push({ product: prod, quantity: 1 });
    }

    updateCartBadge();
    showToast(`${prod.nombre} agregado al carrito.`, 'success');
};

function updateCartBadge() {
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    
    const u = currentSession.cliente;
    const isVerified = u && u.ci_status === 'verified';
    document.getElementById('btnFloatingCart').style.display = (isVerified && count > 0) ? 'flex' : 'none';
    document.getElementById('cartCount').innerText = count;
}

function openCartDrawer() {
    renderCartItems();
    document.getElementById('cartDrawer').classList.add('open');
}

function closeCartDrawer() {
    document.getElementById('cartDrawer').classList.remove('open');
}

function renderCartItems() {
    const body = document.getElementById('cartDrawerBody');
    if (cart.length === 0) {
        body.innerHTML = `<div style="text-align: center; color: var(--text-secondary); margin-top: 3rem;">El carrito está vacío.</div>`;
        document.getElementById('cartSubtotal').innerText = '0.00 Bs';
        document.getElementById('cartTotal').innerText = '0.00 Bs';
        document.getElementById('btnCheckout').disabled = true;
        return;
    }

    body.innerHTML = cart.map((item, idx) => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.product.nombre}</div>
                <div class="cart-item-price">${item.product.precio.toFixed(2)} Bs</div>
            </div>
            <div class="cart-qty-ctrl">
                <button class="cart-qty-btn" data-index="${idx}" data-action="decrease"><i data-lucide="minus" style="width:12px;height:12px;"></i></button>
                <div class="cart-qty-val">${item.quantity}</div>
                <button class="cart-qty-btn" data-index="${idx}" data-action="increase"><i data-lucide="plus" style="width:12px;height:12px;"></i></button>
            </div>
        </div>
    `).join('');
    initLucide();

    const subtotal = cart.reduce((acc, item) => acc + (item.product.precio * item.quantity), 0);
    document.getElementById('cartSubtotal').innerText = `${subtotal.toFixed(2)} Bs`;
    document.getElementById('cartTotal').innerText = `${subtotal.toFixed(2)} Bs`;
    document.getElementById('btnCheckout').disabled = false;
}

function updateCartQuantity(index, action) {
    const item = cart[index];
    if (action === 'increase') {
        if (item.quantity >= item.product.stock) {
            showToast('Stock máximo alcanzado.', 'warning');
            return;
        }
        item.quantity++;
    } else {
        item.quantity--;
        if (item.quantity <= 0) {
            cart.splice(index, 1);
        }
    }
    renderCartItems();
    updateCartBadge();
}

// ----------------------------------------------------
// 8. CLIENT CHECKOUT & LEAFLET MAPS INTEGRATION
// ----------------------------------------------------
function openCheckoutModal() {
    closeCartDrawer();
    document.getElementById('checkoutModal').classList.add('active');
    
    selectedDeliveryCoords = null;
    document.getElementById('lblDistance').innerText = 'Elige en el mapa';
    document.getElementById('lblShippingCost').innerText = '-';
    document.getElementById('lblEta').innerText = '-';
    
    document.getElementById('fileQrComprobante').value = '';
    document.getElementById('qrUploadPreview').style.display = 'none';

    const subtotal = cart.reduce((acc, item) => acc + (item.product.precio * item.quantity), 0);
    document.getElementById('lblCheckoutTotal').innerText = `${subtotal.toFixed(2)} Bs`;
    
    validateCheckoutForm();
    initCheckoutMap();
}

function initCheckoutMap() {
    setTimeout(() => {
        if (!checkoutMapInstance) {
            checkoutMapInstance = L.map('gpsSelectorMap', {
                zoomControl: true
            }).setView([STORE_COORDS.lat, STORE_COORDS.lon], 14);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '© OpenStreetMap & CartoDB'
            }).addTo(checkoutMapInstance);

            checkoutMarkerStore = L.marker([STORE_COORDS.lat, STORE_COORDS.lon], {
                icon: L.divIcon({
                    className: 'node-store-wrap',
                    html: '<div style="background:#8b5cf6; width:14px; height:14px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #8b5cf6;"></div>',
                    iconSize: [14, 14],
                    iconAnchor: [7, 7]
                })
            }).addTo(checkoutMapInstance).bindPopup("Tienda Central Bebidas 24/7").openPopup();

            checkoutMapInstance.on('click', (e) => {
                const { lat, lng } = e.latlng;

                if (checkoutMarkerClient) {
                    checkoutMarkerClient.setLatLng(e.latlng);
                } else {
                    checkoutMarkerClient = L.marker(e.latlng, {
                        icon: L.divIcon({
                            className: 'node-client-wrap',
                            html: '<div style="background:#f59e0b; width:14px; height:14px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #f59e0b;"></div>',
                            iconSize: [14, 14],
                            iconAnchor: [7, 7]
                        })
                    }).addTo(checkoutMapInstance);
                }

                const logistics = calculateLogistics(lat, lng);
                selectedDeliveryCoords = logistics;

                document.getElementById('lblDistance').innerText = `${logistics.distanceKm} Km`;
                document.getElementById('lblShippingCost').innerText = `${logistics.costBs} Bs`;
                document.getElementById('lblEta').innerText = `${logistics.etaMin} min`;

                updateCheckoutFinalTotal();
            });
        } else {
            checkoutMapInstance.invalidateSize();
            if (checkoutMarkerClient) {
                checkoutMapInstance.removeLayer(checkoutMarkerClient);
                checkoutMarkerClient = null;
            }
            checkoutMapInstance.setView([STORE_COORDS.lat, STORE_COORDS.lon], 14);
        }
    }, 200);
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').classList.remove('active');
}

function updateCheckoutFinalTotal() {
    const subtotal = cart.reduce((acc, item) => acc + (item.product.precio * item.quantity), 0);
    const shipping = selectedDeliveryCoords ? parseFloat(selectedDeliveryCoords.costBs) : 0;
    const finalTotal = subtotal + shipping;
    document.getElementById('lblCheckoutTotal').innerText = `${finalTotal.toFixed(2)} Bs`;
    validateCheckoutForm();
}

function validateCheckoutForm() {
    const hasLocation = selectedDeliveryCoords !== null;
    const isQr = document.getElementById('payOptQr').classList.contains('active');
    const hasQrFile = document.getElementById('fileQrComprobante').files.length > 0;
    
    const placeBtn = document.getElementById('btnPlaceOrder');
    placeBtn.disabled = !(hasLocation && (!isQr || hasQrFile));
}

function submitOrderCheckout() {
    if (cart.length === 0 || !selectedDeliveryCoords) return;

    const u = currentSession.cliente;
    const isQr = document.getElementById('payOptQr').classList.contains('active');
    
    const estadoPago = isQr ? 'pagado_qr' : 'contraentrega';
    const totalPedido = parseFloat(cart.reduce((acc, item) => acc + (item.product.precio * item.quantity), 0)) + parseFloat(selectedDeliveryCoords.costBs);

    let qrUrl = null;
    if (isQr) {
        const file = document.getElementById('fileQrComprobante').files[0];
        qrUrl = `/uploads/qr/qr_${Date.now()}_${file ? file.name : 'comprobante.png'}`;
    }

    const orderId = DB.pedidos.length + 1;
    const newOrder = {
        id: orderId,
        cliente_id: u.id,
        rider_id: null, 
        estado_pago: estadoPago,
        estado_pedido: 'pendiente',
        total: totalPedido,
        latitud: selectedDeliveryCoords.lat,
        longitud: selectedDeliveryCoords.lon,
        qr_comprobante_url: qrUrl,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: u.id,
        updated_by: u.id
    };

    DB.pedidos.push(newOrder);

    logAuditoria('pedidos', orderId, 'INSERT', null, { 
        cliente_id: u.id, 
        estado_pago: estadoPago, 
        estado_pedido: 'pendiente', 
        total: totalPedido,
        latitud: newOrder.latitud,
        longitud: newOrder.longitud,
        qr_url: qrUrl 
    }, u.id);

    cart.forEach(item => {
        const detailId = DB.pedido_detalles.length + 1;
        const newDetail = {
            id: detailId,
            pedido_id: orderId,
            producto_id: item.product.id,
            cantidad: item.quantity,
            precio_unitario: item.product.precio,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: u.id,
            updated_by: u.id
        };
        DB.pedido_detalles.push(newDetail);

        const prod = DB.productos.find(p => p.id === item.product.id);
        const oldStock = prod.stock;
        prod.stock -= item.quantity;
        prod.updated_at = new Date().toISOString();
        prod.updated_by = u.id;

        logAuditoria('productos', prod.id, 'UPDATE', { stock: oldStock }, { stock: prod.stock }, u.id);
    });

    saveDatabase();
    closeCheckoutModal();
    
    cart = [];
    updateCartBadge();
    showToast('¡Pedido enviado con éxito! Un Rider asignará tu orden a la brevedad.', 'success');
    
    renderClienteActiveOrderTracker();
}

function renderClienteActiveOrderTracker() {
    const box = document.getElementById('clienteActiveOrderBox');
    const u = currentSession.cliente;

    if (!u) {
        box.style.display = 'none';
        return;
    }

    const activeOrder = DB.pedidos.slice().reverse().find(p => p.cliente_id === u.id && p.estado_pedido !== 'entregado' && p.estado_pedido !== 'cancelado');

    if (!activeOrder) {
        box.style.display = 'none';
        return;
    }

    box.style.display = 'block';

    const states = ['pendiente', 'asignado', 'en_camino', 'entregado'];
    const activeIdx = states.indexOf(activeOrder.estado_pedido);

    document.querySelectorAll('#clienteActiveOrderBox .step-node').forEach((node, idx) => {
        node.className = 'step-node';
        if (idx < activeIdx) {
            node.classList.add('completed');
        } else if (idx === activeIdx) {
            node.classList.add('active');
        }
    });

    document.getElementById('clientActiveOrderTitle').innerText = `Pedido #${activeOrder.id} - ${activeOrder.estado_pedido.toUpperCase()}`;
    
    const details = DB.pedido_detalles.filter(d => d.pedido_id === activeOrder.id);
    const detailsText = details.map(d => {
        const p = DB.productos.find(prod => prod.id === d.producto_id);
        return `${d.cantidad}x ${p ? p.nombre : 'Producto'}`;
    }).join(', ');

    document.getElementById('clientActiveOrderItems').innerHTML = `<strong>Items:</strong> ${detailsText}`;
    document.getElementById('clientActiveOrderPayment').innerHTML = `<strong>Pago:</strong> ${activeOrder.estado_pago.toUpperCase()}`;
    document.getElementById('clientActiveOrderTotal').innerHTML = `<strong>Total a pagar:</strong> ${activeOrder.total.toFixed(2)} Bs`;

    const latCliente = activeOrder.latitud || -16.5090;
    const lonCliente = activeOrder.longitud || -68.1340;

    setTimeout(() => {
        if (!clientTrackingMapInstance) {
            clientTrackingMapInstance = L.map('activeOrderMap', {
                zoomControl: false
            });

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '© OpenStreetMap & CartoDB'
            }).addTo(clientTrackingMapInstance);

            clientTrackingMarkerStore = L.marker([STORE_COORDS.lat, STORE_COORDS.lon], {
                icon: L.divIcon({
                    className: 'node-store-wrap',
                    html: '<div style="background:#8b5cf6; width:12px; height:12px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #8b5cf6;"></div>',
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                })
            }).addTo(clientTrackingMapInstance);
        } else {
            clientTrackingMapInstance.invalidateSize();
        }

        if (clientTrackingMarkerClient) {
            clientTrackingMarkerClient.setLatLng([latCliente, lonCliente]);
        } else {
            clientTrackingMarkerClient = L.marker([latCliente, lonCliente], {
                icon: L.divIcon({
                    className: 'node-client-wrap',
                    html: '<div style="background:#f59e0b; width:12px; height:12px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #f59e0b;"></div>',
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                })
            }).addTo(clientTrackingMapInstance);
        }

        if (clientTrackingRouteLine) {
            clientTrackingRouteLine.setLatLngs([
                [STORE_COORDS.lat, STORE_COORDS.lon],
                [latCliente, lonCliente]
            ]);
        } else {
            clientTrackingRouteLine = L.polyline([
                [STORE_COORDS.lat, STORE_COORDS.lon],
                [latCliente, lonCliente]
            ], {
                color: '#8b5cf6',
                weight: 3,
                dashArray: '5, 5'
            }).addTo(clientTrackingMapInstance);
        }

        const bounds = L.latLngBounds([
            [STORE_COORDS.lat, STORE_COORDS.lon],
            [latCliente, lonCliente]
        ]);
        clientTrackingMapInstance.fitBounds(bounds, { padding: [20, 20] });

        if (activeOrder.estado_pedido === 'pendiente') {
            if (clientTrackingMarkerRider) {
                clientTrackingMapInstance.removeLayer(clientTrackingMarkerRider);
                clientTrackingMarkerRider = null;
            }
            document.getElementById('clientActiveOrderEta').innerText = 'Esperando aceptación de Rider...';
        } else {
            let riderLat = STORE_COORDS.lat;
            let riderLon = STORE_COORDS.lon;

            if (activeOrder.estado_pedido === 'en_camino') {
                riderLat = (STORE_COORDS.lat + latCliente) / 2;
                riderLon = (STORE_COORDS.lon + lonCliente) / 2;
                document.getElementById('clientActiveOrderEta').innerText = 'Rider en camino a tu ubicación...';
            } else if (activeOrder.estado_pedido === 'asignado') {
                document.getElementById('clientActiveOrderEta').innerText = 'Rider preparando el despacho...';
            }

            if (clientTrackingMarkerRider) {
                clientTrackingMarkerRider.setLatLng([riderLat, riderLon]);
            } else {
                clientTrackingMarkerRider = L.marker([riderLat, riderLon], {
                    icon: L.divIcon({
                        className: 'node-rider-wrap',
                        html: '<div style="background:#10b981; width:16px; height:16px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #10b981; display:flex; align-items:center; justify-content:center; color:#fff; font-size:8px;"><i class="lucide-bike" style="width:8px;height:8px;fill:currentColor;"></i></div>',
                        iconSize: [16, 16],
                        iconAnchor: [8, 8]
                    })
                }).addTo(clientTrackingMapInstance);
            }
        }
    }, 200);
}

// ----------------------------------------------------
// 9. RIDER PORTAL LOGIC
// ----------------------------------------------------
function renderRiderProfile() {
    const box = document.getElementById('riderAuthContent');
    const r = currentSession.rider;

    if (!r) {
        box.innerHTML = `<p style="color: var(--text-secondary);">Sesión de Rider no cargada. Por favor regístrate.</p>`;
        return;
    }

    const doc = DB.documentacion_rider.find(d => d.rider_id === r.id);
    let statusClass = 'badge-pending';
    let statusText = 'Expediente Pendiente';
    
    if (doc && doc.estado_aprobacion === 'aprobado') {
        statusClass = 'badge-verified';
        statusText = 'Expediente Aprobado';
    } else if (doc && doc.estado_aprobacion === 'rechazado') {
        statusClass = 'badge-rejected';
        statusText = 'Expediente Rechazado';
    }

    box.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem;">
            <p><strong>Nombre:</strong> ${r.nombre}</p>
            <p><strong>Email:</strong> ${r.email}</p>
            <div>
                <span class="badge ${statusClass}">${statusText}</span>
            </div>
            
            <div style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
                <label style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem; display:block;">Simular otro Rider:</label>
                <select class="form-control" id="selRiderSwitcher" style="font-size: 0.8rem; padding: 0.4rem 0.8rem;">
                    ${DB.users.filter(usr => usr.role === 'rider').map(usr => {
                        const d = DB.documentacion_rider.find(docR => docR.rider_id === usr.id);
                        const status = d ? d.estado_aprobacion : 'Sin Documentos';
                        return `<option value="${usr.id}" ${usr.id === r.id ? 'selected' : ''}>${usr.nombre} (${status})</option>`;
                    }).join('')}
                </select>
            </div>
        </div>
    `;

    document.getElementById('selRiderSwitcher').addEventListener('change', (e) => {
        const targetR = DB.users.find(usr => usr.id === parseInt(e.target.value));
        onLoginSuccess(targetR, false);
    });

    const docsContainer = document.getElementById('riderDocsContainer');
    docsContainer.innerHTML = `
        <h3>Documentación Digital</h3>
        
        <div class="doc-upload-item">
            <div class="doc-upload-item-info">
                <span class="doc-upload-name">Licencia de Conducir (Categoría A/M)</span>
                <span class="doc-upload-status ${doc && doc.estado_aprobacion === 'aprobado' ? 'age-valid' : 'text-secondary'}">
                    ${doc ? '✓ Subido' : 'No cargado'}
                </span>
            </div>
            ${!doc ? `<button class="btn btn-secondary btn-sm" onclick="uploadMockDoc('licencia_url')">Subir</button>` : ''}
        </div>

        <div class="doc-upload-item">
            <div class="doc-upload-item-info">
                <span class="doc-upload-name">Seguro contra Accidentes (SOAT)</span>
                <span class="doc-upload-status ${doc && doc.estado_aprobacion === 'aprobado' ? 'age-valid' : 'text-secondary'}">
                    ${doc ? '✓ Subido' : 'No cargado'}
                </span>
            </div>
            ${!doc ? `<button class="btn btn-secondary btn-sm" onclick="uploadMockDoc('seguro_url')">Subir</button>` : ''}
        </div>

        <div class="doc-upload-item">
            <div class="doc-upload-item-info">
                <span class="doc-upload-name">Curriculum Vitae</span>
                <span class="doc-upload-status ${doc && doc.estado_aprobacion === 'aprobado' ? 'age-valid' : 'text-secondary'}">
                    ${doc ? '✓ Subido' : 'No cargado'}
                </span>
            </div>
            ${!doc ? `<button class="btn btn-secondary btn-sm" onclick="uploadMockDoc('cv_url')">Subir</button>` : ''}
        </div>
    `;
}

window.uploadMockDoc = function(docType) {
    const r = currentSession.rider;
    let doc = DB.documentacion_rider.find(d => d.rider_id === r.id);
    
    if (!doc) {
        doc = {
            id: DB.documentacion_rider.length + 1,
            rider_id: r.id,
            licencia_url: '',
            seguro_url: '',
            cv_url: '',
            estado_aprobacion: 'pendiente',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: r.id,
            updated_by: r.id
        };
        DB.documentacion_rider.push(doc);
    }
    
    doc[docType] = `/uploads/docs/doc_${Date.now()}_mock_${docType.replace('_url', '')}.jpg`;
    
    if (doc.licencia_url && doc.seguro_url && doc.cv_url) {
        doc.estado_aprobacion = 'pendiente';
        showToast('Expediente completo y enviado para aprobación del administrador.', 'success');
        
        logAuditoria('documentacion_rider', doc.id, 'INSERT', null, { 
            rider_id: r.id, 
            estado_aprobacion: 'pendiente', 
            licencia: doc.licencia_url,
            seguro: doc.seguro_url,
            cv: doc.cv_url
        }, r.id);
    } else {
        showToast('Documento subido correctamente.', 'info');
    }
    
    saveDatabase();
    renderRiderProfile();
    updateUIForCurrentRole();
};

function renderRiderOrderQueue() {
    const list = document.getElementById('orderQueueList');
    const r = currentSession.rider;
    const doc = DB.documentacion_rider.find(d => d.rider_id === r.id);

    if (!doc || doc.estado_aprobacion !== 'aprobado') {
        list.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 2rem;">Tu cuenta no está aprobada para realizar despachos. Por favor carga tus documentos y contacta al Administrador.</div>`;
        return;
    }

    const hasActiveJob = DB.pedidos.some(p => p.rider_id === r.id && p.estado_pedido !== 'entregado' && p.estado_pedido !== 'cancelado');
    if (hasActiveJob) {
        list.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 2rem;">Tienes una entrega activa en progreso. Finalízala antes de aceptar nuevos pedidos.</div>`;
        return;
    }

    const pendings = DB.pedidos.filter(p => p.estado_pedido === 'pendiente' && (p.estado_pago === 'pagado_qr' || p.estado_pago === 'contraentrega'));

    if (pendings.length === 0) {
        list.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 2rem;">No hay pedidos pendientes disponibles en este momento.</div>`;
        return;
    }

    list.innerHTML = pendings.map(p => {
        const latCliente = p.latitud || -16.5090;
        const lonCliente = p.longitud || -68.1340;
        const logData = calculateLogistics(latCliente, lonCliente);

        const items = DB.pedido_detalles.filter(d => d.pedido_id === p.id);
        const itemsText = items.map(d => {
            const prod = DB.productos.find(pr => pr.id === d.producto_id);
            return `${d.cantidad}x ${prod ? prod.nombre : 'Producto'}`;
        }).join(', ');

        const clientUser = DB.users.find(usr => usr.id === p.cliente_id);

        return `
            <div class="order-card">
                <div class="order-card-header">
                    <span class="order-id">Pedido #${p.id}</span>
                    <span class="badge ${p.estado_pago === 'pagado_qr' ? 'badge-verified' : 'badge-pending'}">${p.estado_pago.replace('_', ' ')}</span>
                </div>
                <div class="order-card-body">
                    <div>
                        <div class="order-meta-label">Cliente</div>
                        <div class="order-meta-val">${clientUser ? clientUser.nombre : 'Cliente Anónimo'}</div>
                    </div>
                    <div>
                        <div class="order-meta-label">Monto del Pedido</div>
                        <div class="order-meta-val">${p.total.toFixed(2)} Bs</div>
                    </div>
                    <div class="order-items-summary">
                        <div class="order-meta-label">Artículos del Pedido</div>
                        <div class="order-meta-val" style="font-weight: 500;">${itemsText}</div>
                    </div>
                    <div>
                        <div class="order-meta-label">Distancia de Ruta</div>
                        <div class="order-meta-val">${logData.distanceKm} Km</div>
                    </div>
                    <div>
                        <div class="order-meta-label">Tiempo Estimado</div>
                        <div class="order-meta-val">${logData.etaMin} Minutos</div>
                    </div>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
                    <button class="btn btn-primary" onclick="acceptRiderOrder(${p.id})">Aceptar y Cargar Stock</button>
                </div>
            </div>
        `;
    }).join('');
}

window.acceptRiderOrder = function(orderId) {
    const r = currentSession.rider;
    const order = DB.pedidos.find(p => p.id === orderId);

    if (!order || order.estado_pedido !== 'pendiente') {
        showToast('El pedido ya no está disponible.', 'error');
        return;
    }

    const oldState = order.estado_pedido;
    order.estado_pedido = 'asignado';
    order.rider_id = r.id;
    order.updated_at = new Date().toISOString();
    order.updated_by = r.id;

    logAuditoria('pedidos', orderId, 'UPDATE', { estado_pedido: oldState }, { estado_pedido: 'asignado', rider_id: r.id }, r.id);

    saveDatabase();
    showToast('Pedido aceptado correctamente.', 'success');
    updateUIForCurrentRole();
};

function renderRiderActiveOrderPanel() {
    const box = document.getElementById('riderActiveOrderBox');
    const r = currentSession.rider;

    if (!r) {
        box.style.display = 'none';
        return;
    }

    const activeOrder = DB.pedidos.find(p => p.rider_id === r.id && p.estado_pedido !== 'entregado' && p.estado_pedido !== 'cancelado');

    if (!activeOrder) {
        box.style.display = 'none';
        return;
    }

    box.style.display = 'block';

    const states = ['asignado', 'en_camino', 'entregado'];
    const idxActive = states.indexOf(activeOrder.estado_pedido);

    document.querySelectorAll('#riderActiveOrderBox .step-node').forEach((node, idx) => {
        node.className = 'step-node';
        if (idx < idxActive) {
            node.classList.add('completed');
        } else if (idx === idxActive) {
            node.classList.add('active');
        }
    });

    document.getElementById('riderActiveOrderTitle').innerText = `Entrega Activa #${activeOrder.id}`;
    const clientUser = DB.users.find(u => u.id === activeOrder.cliente_id);
    document.getElementById('riderActiveOrderClient').innerHTML = `<strong>Cliente:</strong> ${clientUser ? clientUser.nombre : 'Cliente'}`;
    
    const details = DB.pedido_detalles.filter(d => d.pedido_id === activeOrder.id);
    const detailsText = details.map(d => {
        const p = DB.productos.find(prod => prod.id === d.producto_id);
        return `${d.cantidad}x ${p ? p.nombre : 'Producto'}`;
    }).join(', ');
    
    document.getElementById('riderActiveOrderItems').innerHTML = `<strong>Detalles:</strong> ${detailsText}`;
    document.getElementById('riderActiveOrderPayment').innerHTML = `<strong>Total a Cobrar:</strong> ${activeOrder.total.toFixed(2)} Bs (${activeOrder.estado_pago.toUpperCase()})`;

    const latCliente = activeOrder.latitud || -16.5090;
    const lonCliente = activeOrder.longitud || -68.1340;
    const logData = calculateLogistics(latCliente, lonCliente);

    document.getElementById('riderOrderDistance').innerText = `Distancia: ${logData.distanceKm} Km`;
    document.getElementById('riderOrderEta').innerText = `ETA: ${logData.etaMin} min`;

    const activeBtn = document.getElementById('btnRiderAction');
    const cancelBtn = document.getElementById('btnRiderCancel');

    if (activeOrder.estado_pedido === 'asignado') {
        activeBtn.innerText = 'Iniciar Despacho (En Camino)';
        activeBtn.className = 'btn btn-primary';
        cancelBtn.style.display = 'block';
    } 
    else if (activeOrder.estado_pedido === 'en_camino') {
        activeBtn.innerText = 'Finalizar Entrega (Cobrar)';
        activeBtn.className = 'btn btn-success';
        cancelBtn.style.display = 'none';
    }

    setTimeout(() => {
        if (!riderTrackingMapInstance) {
            riderTrackingMapInstance = L.map('riderOrderMap', {
                zoomControl: false
            });

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '© OpenStreetMap & CartoDB'
            }).addTo(riderTrackingMapInstance);

            riderTrackingMarkerStore = L.marker([STORE_COORDS.lat, STORE_COORDS.lon], {
                icon: L.divIcon({
                    className: 'node-store-wrap',
                    html: '<div style="background:#8b5cf6; width:12px; height:12px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #8b5cf6;"></div>',
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                })
            }).addTo(riderTrackingMapInstance);
        } else {
            riderTrackingMapInstance.invalidateSize();
        }

        if (riderTrackingMarkerClient) {
            riderTrackingMarkerClient.setLatLng([latCliente, lonCliente]);
        } else {
            riderTrackingMarkerClient = L.marker([latCliente, lonCliente], {
                icon: L.divIcon({
                    className: 'node-client-wrap',
                    html: '<div style="background:#f59e0b; width:12px; height:12px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #f59e0b;"></div>',
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                })
            }).addTo(riderTrackingMapInstance);
        }

        if (riderTrackingRouteLine) {
            riderTrackingRouteLine.setLatLngs([
                [STORE_COORDS.lat, STORE_COORDS.lon],
                [latCliente, lonCliente]
            ]);
        } else {
            riderTrackingRouteLine = L.polyline([
                [STORE_COORDS.lat, STORE_COORDS.lon],
                [latCliente, lonCliente]
            ], {
                color: '#8b5cf6',
                weight: 3,
                dashArray: '5, 5'
            }).addTo(riderTrackingMapInstance);
        }

        const bounds = L.latLngBounds([
            [STORE_COORDS.lat, STORE_COORDS.lon],
            [latCliente, lonCliente]
        ]);
        riderTrackingMapInstance.fitBounds(bounds, { padding: [20, 20] });

        let riderLat = STORE_COORDS.lat;
        let riderLon = STORE_COORDS.lon;

        if (activeOrder.estado_pedido === 'en_camino') {
            riderLat = (STORE_COORDS.lat + latCliente) / 2;
            riderLon = (STORE_COORDS.lon + lonCliente) / 2;
        }

        if (riderTrackingMarkerRider) {
            riderTrackingMarkerRider.setLatLng([riderLat, riderLon]);
        } else {
            riderTrackingMarkerRider = L.marker([riderLat, riderLon], {
                icon: L.divIcon({
                    className: 'node-rider-wrap',
                    html: '<div style="background:#10b981; width:16px; height:16px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #10b981; display:flex; align-items:center; justify-content:center; color:#fff; font-size:8px;"><i data-lucide="bike" style="width:8px;height:8px;fill:currentColor;"></i></div>',
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                })
            }).addTo(riderTrackingMapInstance);
        }
    }, 200);
}

function processRiderActiveOrderStep() {
    const r = currentSession.rider;
    const activeOrder = DB.pedidos.find(p => p.rider_id === r.id && p.estado_pedido !== 'entregado' && p.estado_pedido !== 'cancelado');

    if (!activeOrder) return;

    const oldState = activeOrder.estado_pedido;
    let nextState = 'entregado';
    let msg = 'Pedido completado con éxito.';

    if (oldState === 'asignado') {
        nextState = 'en_camino';
        msg = 'Viaje iniciado. Conduce con cuidado.';
        activeOrder.estado_pedido = nextState;
        logAuditoria('pedidos', activeOrder.id, 'UPDATE', { estado_pedido: oldState }, { estado_pedido: nextState }, r.id);
    } 
    else if (oldState === 'en_camino') {
        nextState = 'entregado';
        activeOrder.estado_pedido = nextState;
        activeOrder.updated_at = new Date().toISOString();
        activeOrder.updated_by = r.id;

        logAuditoria('pedidos', activeOrder.id, 'UPDATE', { estado_pedido: oldState }, { estado_pedido: nextState }, r.id);

        if (activeOrder.estado_pago === 'contraentrega') {
            const oldPayState = activeOrder.estado_pago;
            activeOrder.estado_pago = 'pagado_efectivo';
            logAuditoria('pedidos', activeOrder.id, 'UPDATE', { estado_pago: oldPayState }, { estado_pago: 'pagado_efectivo' }, r.id);
        }
    }

    saveDatabase();
    showToast(msg, 'success');
    updateUIForCurrentRole();
}

function cancelRiderActiveOrder() {
    const r = currentSession.rider;
    const activeOrder = DB.pedidos.find(p => p.rider_id === r.id && p.estado_pedido === 'asignado');

    if (!activeOrder) return;

    const details = DB.pedido_detalles.filter(d => d.pedido_id === activeOrder.id);
    details.forEach(d => {
        const prod = DB.productos.find(p => p.id === d.producto_id);
        const oldStock = prod.stock;
        prod.stock += d.cantidad;
        logAuditoria('productos', prod.id, 'UPDATE', { stock: oldStock }, { stock: prod.stock }, r.id);
    });

    const oldState = activeOrder.estado_pedido;
    activeOrder.estado_pedido = 'pendiente';
    activeOrder.rider_id = null;
    activeOrder.updated_at = new Date().toISOString();
    activeOrder.updated_by = r.id;

    logAuditoria('pedidos', activeOrder.id, 'UPDATE', { estado_pedido: oldState }, { estado_pedido: 'pendiente', rider_id: null }, r.id);

    saveDatabase();
    showToast('Pedido cancelado. El stock ha sido devuelto al inventario.', 'info');
    updateUIForCurrentRole();
}

// ----------------------------------------------------
// 10. ADMIN PORTAL LOGIC & LIVE OPERATIONS
// ----------------------------------------------------
function renderAdminPendingApprovals() {
    const custContainer = document.getElementById('pendingCustomersList');
    const riderContainer = document.getElementById('pendingRidersList');

    const pendingCustomers = DB.users.filter(u => u.role === 'cliente' && u.ci_status === 'pending');

    if (pendingCustomers.length === 0) {
        custContainer.innerHTML = `<div style="color: var(--text-secondary); font-size: 0.9rem;">No hay clientes pendientes de verificación de edad.</div>`;
    } else {
        custContainer.innerHTML = pendingCustomers.map(u => `
            <div class="approval-card">
                <div class="approval-card-header">
                    <div class="approval-user-info">
                        <strong>${u.nombre}</strong>
                        <span style="font-size:0.75rem; color:var(--text-secondary);">${u.email}</span>
                    </div>
                    <span class="badge badge-pending">Pendiente</span>
                </div>
                <div class="approval-details-row">
                    <span>Nacimiento: ${u.fecha_nacimiento}</span>
                    <span>Edad: ${calculateAge(u.fecha_nacimiento)} años</span>
                </div>
                <div style="display: flex; align-items:center; justify-content:space-between;">
                    <a class="file-view-trigger" onclick="openFileViewer('${u.ci_url}', 'C.I. - ${u.nombre}')"><i data-lucide="eye" style="width:14px;height:14px;"></i> Ver C.I.</a>
                    <div class="approval-actions">
                        <button class="btn btn-danger btn-sm" onclick="approveUser(${u.id}, 'rejected')">Rechazar</button>
                        <button class="btn btn-success btn-sm" onclick="approveUser(${u.id}, 'verified')">Aprobar</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    const pendingRidersDocs = DB.documentacion_rider.filter(d => d.estado_aprobacion === 'pendiente');

    if (pendingRidersDocs.length === 0) {
        riderContainer.innerHTML = `<div style="color: var(--text-secondary); font-size: 0.9rem;">No hay expedientes de riders pendientes de aprobación.</div>`;
    } else {
        riderContainer.innerHTML = pendingRidersDocs.map(d => {
            const riderUser = DB.users.find(u => u.id === d.rider_id);
            const riderName = riderUser ? riderUser.nombre : 'Rider Desconocido';
            const riderEmail = riderUser ? riderUser.email : '';

            return `
                <div class="approval-card">
                    <div class="approval-card-header">
                        <div class="approval-user-info">
                            <strong>${riderName}</strong>
                            <span style="font-size:0.75rem; color:var(--text-secondary);">${riderEmail}</span>
                        </div>
                        <span class="badge badge-pending">Expediente</span>
                    </div>
                    <div style="display: flex; flex-direction:column; gap:0.35rem; font-size: 0.85rem; border:1px solid var(--border-color); padding:0.5rem; border-radius:var(--radius-md); background: rgba(0,0,0,0.1);">
                        <a class="file-view-trigger" onclick="openFileViewer('${d.licencia_url}', 'Licencia - ${riderName}')"><i data-lucide="file-text" style="width:14px;height:14px;"></i> Licencia de Conducir</a>
                        <a class="file-view-trigger" onclick="openFileViewer('${d.seguro_url}', 'Seguro SOAT - ${riderName}')"><i data-lucide="file-text" style="width:14px;height:14px;"></i> Seguro SOAT</a>
                        <a class="file-view-trigger" onclick="openFileViewer('${d.cv_url}', 'CV - ${riderName}')"><i data-lucide="file-text" style="width:14px;height:14px;"></i> Currículum Vitae</a>
                    </div>
                    <div class="approval-actions" style="justify-content: flex-end;">
                        <button class="btn btn-danger btn-sm" onclick="approveRiderDocs(${d.id}, 'rechazado')">Rechazar</button>
                        <button class="btn btn-success btn-sm" onclick="approveRiderDocs(${d.id}, 'aprobado')">Aprobar Rider</button>
                    </div>
                </div>
            `;
        }).join('');
    }
    initLucide();
}

window.approveUser = function(userId, status) {
    const admin = currentSession.admin;
    const u = DB.users.find(usr => usr.id === userId);

    if (!u) return;

    const oldState = u.ci_status;
    u.ci_status = status;
    u.updated_at = new Date().toISOString();
    u.updated_by = admin.id;

    logAuditoria('users', userId, 'UPDATE', { ci_status: oldState }, { ci_status: status }, admin.id);
    saveDatabase();
    
    showToast(`Cliente ${u.nombre} ha sido ${status === 'verified' ? 'aprobado' : 'rechazado'}.`, 'success');
    renderAdminPendingApprovals();
};

window.approveRiderDocs = function(docId, status) {
    const admin = currentSession.admin;
    const doc = DB.documentacion_rider.find(d => d.id === docId);

    if (!doc) return;

    const oldApprove = doc.estado_aprobacion;
    doc.estado_aprobacion = status;
    doc.updated_at = new Date().toISOString();
    doc.updated_by = admin.id;

    logAuditoria('documentacion_rider', docId, 'UPDATE', { estado_aprobacion: oldApprove }, { estado_aprobacion: status }, admin.id);

    const riderUser = DB.users.find(u => u.id === doc.rider_id);
    if (riderUser) {
        const oldCiStatus = riderUser.ci_status;
        const newCi = (status === 'aprobado') ? 'verified' : 'rejected';
        riderUser.ci_status = newCi;
        riderUser.updated_at = new Date().toISOString();
        riderUser.updated_by = admin.id;
        logAuditoria('users', riderUser.id, 'UPDATE', { ci_status: oldCiStatus }, { ci_status: newCi }, admin.id);
    }

    saveDatabase();
    showToast(`El expediente del Rider ha sido ${status}.`, 'success');
    renderAdminPendingApprovals();
};

window.openFileViewer = function(fileUrl, title) {
    const modal = document.getElementById('fileViewerModal');
    const img = document.getElementById('imgFileViewer');
    
    if (title.includes('C.I.')) {
        img.src = 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=500&auto=format&fit=crop&q=60'; 
    } else if (title.includes('Licencia')) {
        img.src = 'https://images.unsplash.com/photo-1598550476439-6847785fce6e?w=500&auto=format&fit=crop&q=60'; 
    } else if (title.includes('Seguro')) {
        img.src = 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&auto=format&fit=crop&q=60'; 
    } else {
        img.src = 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&auto=format&fit=crop&q=60'; 
    }
    
    modal.classList.add('active');
};

function renderAdminProductsTable() {
    const tbody = document.getElementById('adminProductsTableBody');
    tbody.innerHTML = DB.productos.map(p => `
        <tr>
            <td><strong>#${p.id}</strong></td>
            <td><span class="badge" style="background:rgba(255,255,255,0.05); color:var(--text-primary); border:1px solid var(--border-color);">${p.categoria}</span></td>
            <td>${p.nombre}</td>
            <td>${p.marca}</td>
            <td><strong>${p.precio.toFixed(2)} Bs</strong></td>
            <td>
                <span class="badge ${p.stock <= 5 ? 'badge-rejected' : 'badge-verified'}">${p.stock} U.</span>
            </td>
            <td>
                <div style="display:flex; gap:0.25rem;">
                    <button class="btn btn-secondary btn-sm" onclick="editProduct(${p.id})" style="padding:0.35rem 0.6rem;"><i data-lucide="edit" style="width:12px;height:12px;"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})" style="padding:0.35rem 0.6rem;"><i data-lucide="trash" style="width:12px;height:12px;"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
    initLucide();
}

function handleProductFormSubmit(e) {
    e.preventDefault();
    const admin = currentSession.admin;

    const prodId = document.getElementById('txtProdId').value;
    const category = document.getElementById('txtProdCategory').value;
    const name = document.getElementById('txtProdName').value;
    const brand = document.getElementById('txtProdBrand').value;
    const flavor = document.getElementById('txtProdFlavor').value;
    const price = parseFloat(document.getElementById('txtProdPrice').value);
    const stock = parseInt(document.getElementById('txtProdStock').value);

    if (prodId) {
        const id = parseInt(prodId);
        const prod = DB.productos.find(p => p.id === id);
        const oldState = { ...prod };

        prod.categoria = category;
        prod.nombre = name;
        prod.marca = brand;
        prod.sabor = flavor;
        prod.precio = price;
        prod.stock = stock;
        prod.updated_at = new Date().toISOString();
        prod.updated_by = admin.id;

        logAuditoria('productos', id, 'UPDATE', oldState, prod, admin.id);
        showToast('Producto actualizado correctamente.', 'success');
    } else {
        const newId = DB.productos.length + 1;
        const newProd = {
            id: newId,
            categoria: category,
            nombre: name,
            marca: brand,
            sabor: flavor,
            precio: price,
            stock: stock,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: admin.id,
            updated_by: admin.id
        };

        DB.productos.push(newProd);
        logAuditoria('productos', newId, 'INSERT', null, newProd, admin.id);
        showToast('Producto agregado al catálogo.', 'success');
    }

    saveDatabase();
    resetProductForm();
    renderAdminProductsTable();
}

window.editProduct = function(productId) {
    const prod = DB.productos.find(p => p.id === productId);
    if (!prod) return;

    document.getElementById('txtProdId').value = prod.id;
    document.getElementById('txtProdCategory').value = prod.categoria;
    document.getElementById('txtProdName').value = prod.nombre;
    document.getElementById('txtProdBrand').value = prod.marca;
    document.getElementById('txtProdFlavor').value = prod.sabor || '';
    document.getElementById('txtProdPrice').value = prod.precio;
    document.getElementById('txtProdStock').value = prod.stock;

    document.getElementById('adminProductFormTitle').innerText = `Editar Producto #${prod.id}`;
    document.getElementById('btnCancelEdit').style.display = 'inline-flex';
};

window.deleteProduct = function(productId) {
    const admin = currentSession.admin;
    const idx = DB.productos.findIndex(p => p.id === productId);
    if (idx === -1) return;

    const oldProduct = DB.productos[idx];
    DB.productos.splice(idx, 1);
    
    logAuditoria('productos', productId, 'DELETE', oldProduct, null, admin.id);
    saveDatabase();
    
    showToast('Producto eliminado del catálogo.', 'warning');
    renderAdminProductsTable();
};

function resetProductForm() {
    document.getElementById('txtProdId').value = '';
    document.getElementById('adminProductForm').reset();
    document.getElementById('adminProductFormTitle').innerText = 'Agregar Nuevo Producto';
    document.getElementById('btnCancelEdit').style.display = 'none';
}

function renderAdminAuditLogs() {
    const tbody = document.getElementById('auditTableBody');
    tbody.innerHTML = '';

    DB.auditoria_logs.forEach(log => {
        const tr = document.createElement('tr');

        const opUser = DB.users.find(u => u.id === log.created_by);
        const nameUser = opUser ? `${opUser.nombre} (${opUser.role.replace('_', ' ')})` : 'SYSTEM';

        let preData = '-';
        if (log.datos_anteriores) {
            try {
                preData = JSON.stringify(typeof log.datos_anteriores === 'string' ? JSON.parse(log.datos_anteriores) : log.datos_anteriores, null, 2);
            } catch (e) {
                preData = String(log.datos_anteriores);
            }
        }

        let postData = '-';
        if (log.datos_nuevos) {
            try {
                postData = JSON.stringify(typeof log.datos_nuevos === 'string' ? JSON.parse(log.datos_nuevos) : log.datos_nuevos, null, 2);
            } catch (e) {
                postData = String(log.datos_nuevos);
            }
        }

        let badgeClass = 'badge-verified'; 
        if (log.accion === 'UPDATE') badgeClass = 'badge-pending'; 
        else if (log.accion === 'DELETE') badgeClass = 'badge-rejected'; 

        // Col 1: ID
        const tdId = document.createElement('td');
        const strongId = document.createElement('strong');
        strongId.textContent = `#${log.id}`;
        tdId.appendChild(strongId);
        tr.appendChild(tdId);

        // Col 2: Fecha e IP
        const tdDate = document.createElement('td');
        tdDate.style.fontSize = '0.75rem';
        tdDate.style.color = 'var(--text-secondary)';
        tdDate.appendChild(document.createTextNode(new Date(log.created_at).toLocaleString()));
        tdDate.appendChild(document.createElement('br'));
        const spanIp = document.createElement('span');
        spanIp.style.color = 'var(--text-muted)';
        spanIp.textContent = `IP: ${log.ip_address || '127.0.0.1'}`;
        tdDate.appendChild(spanIp);
        tr.appendChild(tdDate);

        // Col 3: Usuario
        const tdUser = document.createElement('td');
        tdUser.textContent = nameUser;
        tr.appendChild(tdUser);

        // Col 4: Tabla afectada
        const tdTable = document.createElement('td');
        const spanTable = document.createElement('span');
        spanTable.style.fontFamily = 'monospace';
        spanTable.style.color = 'var(--accent-purple)';
        spanTable.textContent = log.tabla_afectada;
        tdTable.appendChild(spanTable);
        tr.appendChild(tdTable);

        // Col 5: Acción
        const tdAction = document.createElement('td');
        const spanAction = document.createElement('span');
        spanAction.className = `badge ${badgeClass}`;
        spanAction.textContent = log.accion;
        tdAction.appendChild(spanAction);
        tr.appendChild(tdAction);

        // Col 6: ID de registro
        const tdRecId = document.createElement('td');
        const strongRecId = document.createElement('strong');
        strongRecId.textContent = `#${log.registro_id}`;
        tdRecId.appendChild(strongRecId);
        tr.appendChild(tdRecId);

        // Col 7: Datos anteriores (Seguro contra XSS)
        const tdPre = document.createElement('td');
        const preElem = document.createElement('pre');
        preElem.className = 'json-render';
        preElem.textContent = preData;
        tdPre.appendChild(preElem);
        tr.appendChild(tdPre);

        // Col 8: Datos nuevos (Seguro contra XSS)
        const tdPost = document.createElement('td');
        const postElem = document.createElement('pre');
        postElem.className = 'json-render';
        postElem.textContent = postData;
        tdPost.appendChild(postElem);
        tr.appendChild(tdPost);

        tbody.appendChild(tr);
    });
}

function renderAdminReports() {
    const delivers = DB.pedidos.filter(p => p.estado_pedido === 'entregado');
    const totalSalesSum = delivers.reduce((acc, p) => acc + p.total, 0);

    document.getElementById('reportTotalSales').innerText = `${totalSalesSum.toFixed(2)} Bs`;
    document.getElementById('reportTotalOrders').innerText = delivers.length;
    document.getElementById('reportActiveRiders').innerText = DB.users.filter(u => u.role === 'rider').length;

    const qrSum = delivers.filter(p => p.estado_pago === 'pagado_qr').reduce((acc, p) => acc + p.total, 0);
    const cashSum = delivers.filter(p => p.estado_pago === 'pagado_efectivo' || p.estado_pago === 'contraentrega' || p.estado_pago === 'liquidado').reduce((acc, p) => acc + p.total, 0);
    
    const totalPayments = qrSum + cashSum;
    const qrPct = totalPayments > 0 ? (qrSum / totalPayments) * 100 : 0;
    const cashPct = totalPayments > 0 ? (cashSum / totalPayments) * 100 : 0;

    document.getElementById('chartQrVal').innerText = `${qrSum.toFixed(2)} Bs (${Math.round(qrPct)}%)`;
    document.getElementById('chartQrBar').style.width = `${qrPct}%`;
    document.getElementById('chartCashVal').innerText = `${cashSum.toFixed(2)} Bs (${Math.round(cashPct)}%)`;
    document.getElementById('chartCashBar').style.width = `${cashPct}%`;

    const riders = DB.users.filter(u => u.role === 'rider');
    const rankings = riders.map(r => {
        const riderDelivers = DB.pedidos.filter(p => p.rider_id === r.id && p.estado_pedido === 'entregado');
        const totalEarned = riderDelivers.reduce((acc, p) => acc + p.total, 0);
        return {
            id: r.id,
            nombre: r.nombre,
            ordersCount: riderDelivers.length,
            earned: totalEarned
        };
    }).sort((a, b) => b.ordersCount - a.ordersCount); 

    const list = document.getElementById('riderLeaderboard');
    if (rankings.length === 0) {
        list.innerHTML = `<div style="text-align: center; color: var(--text-secondary); font-size: 0.9rem; padding: 1rem;">No hay registros de riders activos en entregas.</div>`;
        return;
    }

    list.innerHTML = rankings.map((rider, idx) => `
        <li class="leaderboard-item">
            <span class="rider-rank ${idx === 0 ? 'rider-rank-1' : ''}">${idx + 1}</span>
            <div class="rider-info-main">
                <div class="rider-name-lead">${rider.nombre}</div>
                <div class="rider-orders-lead">${rider.ordersCount} entregas completadas</div>
            </div>
            <span class="rider-earnings-lead">${rider.earned.toFixed(2)} Bs Recaudados</span>
        </li>
    `).join('');
}

// ----------------------------------------------------
// 12. ADMIN LIVE MONITORING & CASH SETTLEMENTS
// ----------------------------------------------------
function renderAdminMonitoring() {
    const listActive = document.getElementById('adminLiveOrdersList');
    const listSettlements = document.getElementById('adminRiderSettlementsList');
    
    if (!listActive) return;

    const activeOrders = DB.pedidos.filter(p => p.estado_pedido === 'asignado' || p.estado_pedido === 'en_camino');

    if (activeOrders.length === 0) {
        listActive.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 2rem;">No hay despachos ni envíos en camino activos.</div>`;
        selectedAdminMonitoringOrderId = null;
        initAdminMonitoringMap(null);
    } else {
        listActive.innerHTML = activeOrders.map(p => {
            const clientUser = DB.users.find(usr => usr.id === p.cliente_id);
            const riderUser = DB.users.find(usr => usr.id === p.rider_id);
            const items = DB.pedido_detalles.filter(d => d.pedido_id === p.id);
            const itemsText = items.map(d => {
                const prod = DB.productos.find(pr => pr.id === d.producto_id);
                return `${d.cantidad}x ${prod ? prod.nombre : 'Producto'}`;
            }).join(', ');

            return `
                <div class="order-card" style="border-color: ${selectedAdminMonitoringOrderId === p.id ? 'var(--accent-purple)' : 'var(--border-color)'}">
                    <div class="order-card-header">
                        <span class="order-id">Pedido #${p.id} - ${p.estado_pedido.toUpperCase()}</span>
                        <span class="badge ${p.estado_pago === 'pagado_qr' ? 'badge-verified' : 'badge-pending'}">${p.estado_pago.replace('_', ' ')}</span>
                    </div>
                    <div style="font-size:0.85rem; margin-bottom: 0.75rem;">
                        <p><strong>Cliente:</strong> ${clientUser ? clientUser.nombre : 'Anónimo'}</p>
                        <p><strong>Repartidor:</strong> ${riderUser ? riderUser.nombre : 'Sin Asignar'}</p>
                        <p><strong>Detalles:</strong> ${itemsText}</p>
                        <p><strong>Monto:</strong> ${p.total.toFixed(2)} Bs</p>
                    </div>
                    <div style="display:flex; gap:0.5rem; justify-content:flex-end;">
                        <button class="btn btn-danger btn-sm" onclick="cancelAdminOrder(${p.id})">Cancelar Pedido</button>
                        <button class="btn btn-primary btn-sm" onclick="selectAdminOrderToTrack(${p.id})">Rastrear en Mapa</button>
                    </div>
                </div>
            `;
        }).join('');

        if (selectedAdminMonitoringOrderId === null || !activeOrders.some(p => p.id === selectedAdminMonitoringOrderId)) {
            selectedAdminMonitoringOrderId = activeOrders[0].id;
        }
        initAdminMonitoringMap(selectedAdminMonitoringOrderId);
    }

    const riders = DB.users.filter(u => u.role === 'rider');
    const settlements = riders.map(r => {
        const cashOrders = DB.pedidos.filter(p => p.rider_id === r.id && p.estado_pedido === 'entregado' && p.estado_pago === 'pagado_efectivo');
        const pendingCash = cashOrders.reduce((acc, p) => acc + p.total, 0);
        return {
            id: r.id,
            nombre: r.nombre,
            pendingCash: pendingCash,
            orderIds: cashOrders.map(p => p.id)
        };
    }).filter(r => r.pendingCash > 0);

    if (settlements.length === 0) {
        listSettlements.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">Todos los Riders están al día con sus liquidaciones de caja.</div>`;
    } else {
        listSettlements.innerHTML = settlements.map(r => `
            <li class="leaderboard-item" style="border-left: 3px solid var(--accent-amber); border-radius: 0 var(--radius-md) var(--radius-md) 0;">
                <div class="rider-info-main">
                    <div class="rider-name-lead">${r.nombre}</div>
                    <div class="rider-orders-lead">${r.orderIds.length} cobros en efectivo pendientes de liquidación</div>
                </div>
                <div style="display:flex; align-items:center; gap:1rem;">
                    <span class="rider-earnings-lead" style="color:var(--accent-amber);">${r.pendingCash.toFixed(2)} Bs</span>
                    <button class="btn btn-primary btn-sm" onclick="settleRiderCash(${r.id})">Liquidar Caja</button>
                </div>
            </li>
        `).join('');
    }
}

window.selectAdminOrderToTrack = function(orderId) {
    selectedAdminMonitoringOrderId = orderId;
    renderAdminMonitoring();
};

window.cancelAdminOrder = function(orderId) {
    const admin = currentSession.admin;
    const order = DB.pedidos.find(p => p.id === orderId);

    if (!order || order.estado_pedido === 'cancelado' || order.estado_pedido === 'entregado') {
        showToast('No se puede cancelar este pedido.', 'error');
        return;
    }

    const details = DB.pedido_detalles.filter(d => d.pedido_id === orderId);
    details.forEach(d => {
        const prod = DB.productos.find(p => p.id === d.producto_id);
        const oldStock = prod.stock;
        prod.stock += d.cantidad;
        logAuditoria('productos', prod.id, 'UPDATE', { stock: oldStock }, { stock: prod.stock }, admin.id);
    });

    const oldState = order.estado_pedido;
    order.estado_pedido = 'cancelado';
    order.estado_pago = 'cancelado';
    order.updated_at = new Date().toISOString();
    order.updated_by = admin.id;

    logAuditoria('pedidos', orderId, 'UPDATE', { estado_pedido: oldState }, { estado_pedido: 'cancelado', estado_pago: 'cancelado' }, admin.id);

    saveDatabase();
    showToast(`Pedido #${orderId} cancelado. El stock ha sido reembolsado.`, 'warning');
    updateUIForCurrentRole();
};

window.settleRiderCash = function(riderId) {
    const admin = currentSession.admin;
    const cashOrders = DB.pedidos.filter(p => p.rider_id === riderId && p.estado_pedido === 'entregado' && p.estado_pago === 'pagado_efectivo');
    
    if (cashOrders.length === 0) return;

    let totalSettle = 0;
    cashOrders.forEach(p => {
        totalSettle += p.total;
        p.estado_pago = 'liquidado';
        p.updated_at = new Date().toISOString();
        p.updated_by = admin.id;

        logAuditoria('pedidos', p.id, 'UPDATE', { estado_pago: 'pagado_efectivo' }, { estado_pago: 'liquidado', motivo: 'Caja liquidada central' }, admin.id);
    });

    saveDatabase();
    showToast(`Liquidación completada. Recaudados ${totalSettle.toFixed(2)} Bs de la caja del rider.`, 'success');
    updateUIForCurrentRole();
};

function initAdminMonitoringMap(orderId) {
    setTimeout(() => {
        if (!adminMonitoringMapInstance) {
            adminMonitoringMapInstance = L.map('adminMonitoringMap', {
                zoomControl: true
            }).setView([STORE_COORDS.lat, STORE_COORDS.lon], 14);

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '© OpenStreetMap & CartoDB'
            }).addTo(adminMonitoringMapInstance);

            adminMonitoringMarkerStore = L.marker([STORE_COORDS.lat, STORE_COORDS.lon], {
                icon: L.divIcon({
                    className: 'node-store-wrap',
                    html: '<div style="background:#8b5cf6; width:12px; height:12px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #8b5cf6;"></div>',
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                })
            }).addTo(adminMonitoringMapInstance);
        } else {
            adminMonitoringMapInstance.invalidateSize();
        }

        if (adminMonitoringMarkerClient) {
            adminMonitoringMapInstance.removeLayer(adminMonitoringMarkerClient);
            adminMonitoringMarkerClient = null;
        }
        if (adminMonitoringMarkerRider) {
            adminMonitoringMapInstance.removeLayer(adminMonitoringMarkerRider);
            adminMonitoringMarkerRider = null;
        }
        if (adminMonitoringRouteLine) {
            adminMonitoringMapInstance.removeLayer(adminMonitoringRouteLine);
            adminMonitoringRouteLine = null;
        }

        if (orderId === null) {
            adminMonitoringMapInstance.setView([STORE_COORDS.lat, STORE_COORDS.lon], 14);
            return;
        }

        const order = DB.pedidos.find(p => p.id === orderId);
        if (!order) return;

        const latCliente = order.latitud || -16.5090;
        const lonCliente = order.longitud || -68.1340;

        adminMonitoringMarkerClient = L.marker([latCliente, lonCliente], {
            icon: L.divIcon({
                className: 'node-client-wrap',
                html: '<div style="background:#f59e0b; width:12px; height:12px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #f59e0b;"></div>',
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            })
        }).addTo(adminMonitoringMapInstance);

        adminMonitoringRouteLine = L.polyline([
            [STORE_COORDS.lat, STORE_COORDS.lon],
            [latCliente, lonCliente]
        ], {
            color: '#8b5cf6',
            weight: 3,
            dashArray: '5, 5'
        }).addTo(adminMonitoringMapInstance);

        const bounds = L.latLngBounds([
            [STORE_COORDS.lat, STORE_COORDS.lon],
            [latCliente, lonCliente]
        ]);
        adminMonitoringMapInstance.fitBounds(bounds, { padding: [30, 30] });

        let riderLat = STORE_COORDS.lat;
        let riderLon = STORE_COORDS.lon;
        if (order.estado_pedido === 'en_camino') {
            riderLat = (STORE_COORDS.lat + latCliente) / 2;
            riderLon = (STORE_COORDS.lon + lonCliente) / 2;
        }

        adminMonitoringMarkerRider = L.marker([riderLat, riderLon], {
            icon: L.divIcon({
                className: 'node-rider-wrap',
                html: `<div style="background:#10b981; width:16px; height:16px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #10b981; display:flex; align-items:center; justify-content:center; color:#fff; font-size:8px;"><i class="lucide-bike" style="width:8px;height:8px;fill:currentColor;"></i></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            })
        }).addTo(adminMonitoringMapInstance);
    }, 200);
}

// ----------------------------------------------------
// 13. GENERAL UTILITY FUNCTIONS
// ----------------------------------------------------
function calculateAge(dobString) {
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.top = '1.5rem';
    toast.style.right = '1.5rem';
    toast.style.padding = '0.75rem 1.5rem';
    toast.style.borderRadius = 'var(--radius-md)';
    toast.style.fontSize = '0.9rem';
    toast.style.fontWeight = '600';
    toast.style.color = '#fff';
    toast.style.zIndex = '3000';
    toast.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.4)';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '0.5rem';
    toast.style.border = '1px solid rgba(255, 255, 255, 0.1)';
    toast.style.animation = 'toastIn 0.3s ease-out forwards';

    if (type === 'success') {
        toast.style.background = 'rgba(16, 185, 129, 0.95)';
        toast.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.2)';
    } else if (type === 'error') {
        toast.style.background = 'rgba(239, 68, 68, 0.95)';
        toast.style.boxShadow = '0 4px 15px rgba(239, 68, 68, 0.2)';
    } else if (type === 'warning') {
        toast.style.background = 'rgba(245, 158, 11, 0.95)';
        toast.style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.2)';
    } else {
        toast.style.background = 'rgba(139, 92, 246, 0.95)';
        toast.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.2)';
    }

    toast.innerText = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease-out forwards';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3500);
}

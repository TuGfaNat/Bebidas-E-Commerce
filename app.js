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

// Configuration & Connectivity State — connects strictly to PHP Microservices on current origin
const detectMicroservicesUrl = () => {
    if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file:')) {
        const basePath = window.location.pathname ? window.location.pathname.replace(/\/[^\/]*$/, '') : '';
        const url = `${window.location.origin}${basePath}/microservices`;
        return url.replace(/([^:]\/)\/+/g, '$1');
    }
    const origin = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null') ? window.location.origin : '';
    return `${origin}/microservices`.replace(/([^:]\/)\/+/g, '$1');
};

let config = {
    connectedMode: true,
    apiUrl: detectMicroservicesUrl()
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
let adminMonitoringIntervalId = null;
let adminMonitoringCachedOrders = [];

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

// Helpers de Utilidad y Diagnóstico de API PHP
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function showGlobalApiError(message, retryCallback = null) {
    const banner = document.getElementById('globalApiErrorBanner');
    const msgEl = document.getElementById('globalApiErrorMessage');
    const retryBtn = document.getElementById('btnRetryApiConnection');
    const apiDot = document.getElementById('apiDot');
    const apiStatusTxt = document.getElementById('apiStatusText');

    if (apiDot) apiDot.className = 'status-dot inactive';
    if (apiStatusTxt) apiStatusTxt.innerText = 'Desconectado · Error de API';

    if (banner && msgEl) {
        msgEl.innerHTML = `<strong>Error de conexión con la API PHP/MySQL:</strong> ${escapeHtml(message || 'No se pudo comunicar con el servidor.')} <span style="font-size:0.8rem; color:#fca5a5;">(Verifique que Apache y MySQL estén activos)</span>`;
        banner.style.display = 'flex';
        if (retryBtn) {
            retryBtn.onclick = () => {
                banner.style.display = 'none';
                checkApiHealth().then(() => {
                    if (typeof retryCallback === 'function') retryCallback();
                });
            };
        }
    }
    initLucide();
}

function hideGlobalApiError() {
    const banner = document.getElementById('globalApiErrorBanner');
    if (banner) banner.style.display = 'none';
}

async function checkApiHealth() {
    const apiDot = document.getElementById('apiDot');
    const apiStatusTxt = document.getElementById('apiStatusText');
    const currentHost = (typeof window !== 'undefined' && window.location && window.location.host) ? window.location.host : 'servidor';

    try {
        const res = await apiGet('/Auth/connection.php', null, { skipAuth: true });
        if (res.ok) {
            if (apiDot) apiDot.className = 'status-dot active';
            if (apiStatusTxt) apiStatusTxt.innerText = `Conectado · API PHP (${currentHost})`;
            hideGlobalApiError();
            return true;
        } else {
            const err = res.error || 'Base de datos o servidor no responde';
            showGlobalApiError(err);
            return false;
        }
    } catch (e) {
        showGlobalApiError('Servidor o base de datos offline. Inicie Apache y MySQL.');
        return false;
    }
}

// ----------------------------------------------------
// 1. DATABASE & INITIAL DATA SEEDING
// ----------------------------------------------------
function initDatabase() {
    // Limpieza preventiva de datos simulados en localStorage
    localStorage.removeItem('burger_247_db');
    localStorage.removeItem('connected_mode');

    // Inicializar estado en memoria vacío
    DB = {
        users: [],
        productos: [],
        pedidos: [],
        pedido_detalles: [],
        documentacion_rider: [],
        auditoria_logs: []
    };

    // Inicializar vista de Autenticación
    renderAuthCard('login');

    // Forzar modo conectado permanentemente
    config.connectedMode = true;

    // Verificar salud y conectividad con la API
    checkApiHealth();

    // Restauración de sesión mediante token JWT contra la API
    const token = getAuthToken();
    if (token) {
        apiGet('/Auth/session.php')
            .then(res => {
                if (res.ok && res.data && res.data.user) {
                    onLoginSuccess(res.data.user, false);
                    syncProductsFromBackend();
                } else {
                    console.warn('Sesión JWT expirada o inválida:', res.error);
                    handleLogout(false);
                }
            })
            .catch(err => {
                console.warn('Error validando sesión remota con la API:', err);
                showGlobalApiError('No se pudo verificar la sesión remota con la API.');
                handleLogout(false);
            });
        return;
    }

    // Si no hay token autenticado, mostrar pantalla de login y sincronizar catálogo desde la API
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('headerUserStatus').style.display = 'none';
    syncProductsFromBackend();
}

function updateApiStatusUI(connected) {
    const apiDot = document.getElementById('apiDot');
    const apiText = document.getElementById('apiStatusText');
    if (!apiDot || !apiText) return;
    if (connected) {
        apiDot.className = 'status-dot active';
        apiText.innerText = 'Modo Conectado (PHP Server)';
    } else {
        apiDot.className = 'status-dot active';
        apiText.innerText = 'Modo Simulado (Local)';
    }
}

function restoreLocalSavedSession() {
    const savedUser = localStorage.getItem('burger_user_session');
    if (savedUser) {
        try {
            const u = JSON.parse(savedUser);
            const match = DB.users ? DB.users.find(usr => usr.id === u.id) : null;
            if (match) {
                onLoginSuccess(match, false);
                return;
            } else if (u && u.id && u.role) {
                onLoginSuccess(u, false);
                return;
            }
        } catch (e) {}
    }
    
    // Otherwise show login screen
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('headerUserStatus').style.display = 'none';
}

function saveDatabase() {
    // En arquitectura 100% conectada a la API PHP, toda la persistencia se realiza en MySQL mediante endpoints REST.
}

function seedDatabase() {
    // Cero datos demo en produccion. MySQL es la unica fuente de verdad.
    DB.users = [];
    DB.documentacion_rider = [];
    DB.productos = [];
    DB.pedidos = [];
    DB.pedido_detalles = [];
    DB.auditoria_logs = [];
}

function getBurgerProducts() {
    return [];
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

    const btnHeaderCart = document.getElementById('btnHeaderCart');
    if (btnHeaderCart) btnHeaderCart.addEventListener('click', openCartDrawer);

    const btnSidebarCart = document.getElementById('btnSidebarCart');
    if (btnSidebarCart) btnSidebarCart.addEventListener('click', openCartDrawer);

    const btnUseDefaultLoc = document.getElementById('btnUseDefaultLocation');
    if (btnUseDefaultLoc) btnUseDefaultLoc.addEventListener('click', () => {
        setCheckoutDeliveryCoords(-16.5090, -68.1340);
        showToast('Ubicación fijada en Sopocachi Central.', 'info');
    });

    // Toggle para desplegar/plegar Acceso Rápido Demo
    const qsHeader = document.getElementById('quickSwitchHeader');
    const qsPanel = document.getElementById('devQuickSwitch');
    const qsContent = document.getElementById('quickSwitchContent');
    const qsToggleTxt = document.getElementById('quickSwitchToggleText');

    if (qsHeader && qsPanel && qsContent) {
        qsHeader.addEventListener('click', () => {
            const isCollapsed = qsPanel.classList.toggle('collapsed');
            qsContent.style.display = isCollapsed ? 'none' : 'flex';
            if (qsToggleTxt) {
                qsToggleTxt.innerText = isCollapsed ? '(Abrir ▴)' : '(Cerrar ▾)';
            }
        });
    }

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
            const targetPanel = document.getElementById(`subpanel${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
            if (targetPanel) targetPanel.classList.add('active');
            
            if (tabId === 'monitoring') {
                renderAdminMonitoring();
                setTimeout(() => {
                    if (adminMonitoringMapInstance) adminMonitoringMapInstance.invalidateSize();
                }, 150);
            } else {
                stopAdminMonitoringPolling();
                if (tabId === 'reports') {
                    renderAdminReports();
                } else if (tabId === 'catalog' || tabId === 'products') {
                    renderAdminProductsTable();
                    if (config.connectedMode) syncProductsFromBackend();
                } else if (tabId === 'approvals') {
                    renderAdminPendingApprovals();
                } else if (tabId === 'users') {
                    renderAdminAllUsers();
                } else if (tabId === 'audit') {
                    renderAdminAuditLogs();
                }
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

function updateUIForCurrentRole() {
    if (currentSession.cliente) {
        renderClienteAccountInfo();
        renderProducts();
        renderClienteActiveOrderTracker();
        updateCartBadge();
    } else if (currentSession.rider) {
        renderRiderProfile();
        renderRiderOrderQueue();
        renderRiderActiveOrderPanel();
        renderRiderOrderHistory();
    } else if (currentSession.admin) {
        renderAdminPendingApprovals();
        renderAdminProductsTable();
        renderAdminReports();
        renderAdminMonitoring();
        renderAdminAuditLogs();
        syncProductsFromBackend();
    }
}

function switchRole(role) {
    if (role !== 'admin') {
        stopAdminMonitoringPolling();
    }

    document.querySelectorAll('.panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    const panelId = `panel${role.charAt(0).toUpperCase() + role.slice(1)}`;
    const targetPanel = document.getElementById(panelId);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }

    updateUIForCurrentRole();

    // Invalidate Leaflet map size on panel transitions
    setTimeout(() => {
        if (role === 'cliente' && clientTrackingMapInstance) clientTrackingMapInstance.invalidateSize();
        if (role === 'rider' && riderTrackingMapInstance) riderTrackingMapInstance.invalidateSize();
        if (role === 'admin' && adminMonitoringMapInstance) adminMonitoringMapInstance.invalidateSize();
    }, 150);
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
                    <div class="logo-icon" style="margin: 0 auto 0.75rem; width: 44px; height: 44px; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg, #f97316, #ef4444); color:#fff; border-radius:var(--radius-md);"><i data-lucide="flame"></i></div>
                    <h2 style="font-weight: 700; font-size: 1.6rem;">Burger 24/7</h2>
                    <p style="font-size: 0.85rem; color: var(--text-secondary);">Hamburguesería Gourmet & Delivery Rápido</p>
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
                    <button type="submit" class="btn btn-primary" style="width: 100%;">Ingresar a Burger 24/7</button>
                </form>

                <div style="text-align: center; font-size: 0.8rem; border-top: 1px solid var(--border-color); margin-top: 1.25rem; padding-top: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem;">
                    <span style="color:var(--text-secondary);">¿No tienes cuenta?</span>
                    <div style="display:flex; justify-content:center; gap:1rem;">
                        <a href="#" id="linkGoRegisterClient" style="color: #f97316; text-decoration: none; font-weight: 600;">Registrarme Cliente</a>
                        <span style="color:var(--border-color);">|</span>
                        <a href="#" id="linkGoRegisterRider" style="color: #f97316; text-decoration: none; font-weight: 600;">Postularme Repartidor</a>
                    </div>
                </div>
            </div>
        `;
    } 
    else if (view === 'register_client') {
        content = `
            <div class="login-card glass-card" style="max-width: 480px;">
                <div style="text-align: center; margin-bottom: 1.25rem;">
                    <div class="logo-icon" style="margin: 0 auto 0.75rem; width: 44px; height: 44px; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg, #f97316, #ef4444); color:#fff; border-radius:var(--radius-md);"><i data-lucide="flame"></i></div>
                    <h2>Registro de Cliente - Burger 24/7</h2>
                    <p style="font-size: 0.85rem; color: var(--text-secondary);">Sube tu C.I. para desbloquear el menú de hamburguesas gourmet</p>
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
                    <div class="logo-icon" style="margin: 0 auto 0.75rem; width: 44px; height: 44px; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg, #f97316, #ef4444); color:#fff; border-radius:var(--radius-md);"><i data-lucide="bike"></i></div>
                    <h2>Postulación de Repartidor - Burger 24/7</h2>
                    <p style="font-size: 0.85rem; color: var(--text-secondary);">Carga tu expediente digital para entregas de pedidos de hamburguesas</p>
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

        document.getElementById('formAuthRegisterClient').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('regClientName').value.trim();
            const email = document.getElementById('regClientEmail').value.trim();
            const pass = document.getElementById('regClientPass').value.trim();
            const dob = dobInput.value;
            const file = document.getElementById('regClientCiFile').files[0];

            if (!name || !email || !pass || !dob || !file) {
                showToast('Faltan campos obligatorios.', 'error');
                return;
            }

            const formData = new FormData();
            formData.append('nombre', name);
            formData.append('correo', email);
            formData.append('password', pass);
            formData.append('fecha_nacimiento', dob);
            formData.append('ci_image', file);

            try {
                const res = await apiPost('/Auth/register.php', formData, { skipAuth: true });
                if (res.ok && res.data) {
                    if (res.data.token) {
                        localStorage.setItem('burger_jwt_token', res.data.token);
                    }
                    const registeredUser = res.data.user || {
                        id: (res.envelope && res.envelope.audit && res.envelope.audit.user_id) || 1,
                        role: 'cliente',
                        nombre: name,
                        email: email,
                        ci_status: 'pending',
                        ci_url: `/uploads/ci/ci_${file.name}`
                    };
                    showToast('Cliente registrado con éxito en el backend MySQL. Esperando aprobación de C.I.', 'success');
                    onLoginSuccess(registeredUser);
                } else {
                    showToast(`Error al registrar cliente: ${res.error || 'No se pudo completar el registro en la API.'}`, 'danger');
                }
            } catch (err) {
                console.error('Error en registro de cliente:', err);
                showToast(`Fallo de conexión con la API PHP: ${err.message || 'Error de red'}`, 'danger');
                showGlobalApiError('Error de conexión al registrar cliente.');
            }
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

        document.getElementById('formAuthRegisterRider').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('regRiderName').value.trim();
            const email = document.getElementById('regRiderEmail').value.trim();
            const pass = document.getElementById('regRiderPass').value.trim();
            const dob = dobInput.value;

            const l = document.getElementById('regRiderLicencia').files[0];
            const s = document.getElementById('regRiderSeguro').files[0];
            const c = document.getElementById('regRiderCv').files[0];

            if (!name || !email || !pass || !dob || !l || !s || !c) {
                showToast('Faltan campos u hojas de postulación.', 'error');
                return;
            }

            const formData = new FormData();
            formData.append('nombre', name);
            formData.append('correo', email);
            formData.append('password', pass);
            formData.append('fecha_nacimiento', dob);
            formData.append('licencia', l);
            formData.append('seguro', s);
            formData.append('cv', c);

            try {
                const res = await apiPost('/Auth/register_rider.php', formData, { skipAuth: true });
                if (res.ok && res.data) {
                    if (res.data.token) {
                        localStorage.setItem('burger_jwt_token', res.data.token);
                    }
                    const registeredRider = res.data.user || {
                        id: (res.envelope && res.envelope.audit && res.envelope.audit.user_id) || 1,
                        role: 'rider',
                        nombre: name,
                        email: email,
                        ci_status: 'pending'
                    };
                    showToast('Rider registrado y expediente digital guardado en MySQL con éxito.', 'success');
                    onLoginSuccess(registeredRider);
                } else {
                    showToast(`Error al postular: ${res.error || 'No se pudo procesar la postulación.'}`, 'danger');
                }
            } catch (err) {
                console.error('Error en registro de rider:', err);
                showToast(`Fallo de conexión al postular rider: ${err.message || 'API no disponible'}`, 'danger');
                showGlobalApiError('Error de conexión al registrar rider.');
            }
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
        'juan': ['$2b$12$ARkI5fD1NdgTtJmJRQo0Y.sbSRPzKgWGpbDtmYzS9yV8eS6sGG0s6', '$2y$10$juan...'],
        'roberto': ['$2a$10$NHYkGy/q.W57QI7bIumQ9.J7DfEZm9d32MxvdvY5z7XHhwh7KPj/e'],
        'marcos': ['$2a$10$Of//sDFxLZrPBXCb7BNuPe.FQSqxu3du7iMj.K7.M9QXr5OXtMwN2']
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
    // Autenticación obligatoria mediante API PHP / MySQL
    apiPost('/Auth/login.php', { correo: email, email: email, password: password }, { skipAuth: true })
        .then(res => {
            if (res.ok && res.data && res.data.token) {
                const token = res.data.token;
                localStorage.setItem('burger_jwt_token', token);

                // Obtener datos del usuario desde los claims del token JWT verificado
                const jwtData = parseJwt(token);
                const userObj = {
                    id: (jwtData && jwtData.user_id) || (res.data.user && res.data.user.id) || 1,
                    nombre: (jwtData && jwtData.nombre) || (res.data.user && res.data.user.nombre) || email,
                    email: (jwtData && jwtData.email) || (res.data.user && res.data.user.email) || email,
                    role: (jwtData && jwtData.role) || (res.data.user && res.data.user.role) || 'cliente',
                    ci_status: (jwtData && jwtData.ci_status) || (res.data.user && res.data.user.ci_status) || 'verified'
                };

                onLoginSuccess(userObj, true);
                hideGlobalApiError();
            } else {
                showToast(res.error || 'Credenciales inválidas. Acceso denegado.', 'error');
            }
        })
        .catch(err => {
            console.error('Error al conectar con la API de autenticación:', err);
            showToast('Error de conexión con la API PHP: ' + (err.message || 'Servidor inaccesible'), 'danger');
            showGlobalApiError('No se pudo conectar con el servicio de autenticación en MySQL.');
        });
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
    let activeUser = { ...user };

    // In connected mode, obtain/ensure claims come directly from the verified JWT
    if (config.connectedMode) {
        const token = localStorage.getItem('burger_jwt_token');
        if (token) {
            const jwtData = parseJwt(token);
            if (jwtData) {
                activeUser = {
                    id: jwtData.user_id || activeUser.id,
                    nombre: jwtData.nombre || activeUser.nombre,
                    email: jwtData.email || activeUser.email,
                    role: jwtData.role || activeUser.role,
                    ci_status: jwtData.ci_status || activeUser.ci_status || 'verified'
                };
            }
        }
    }

    currentSession.currentUser = activeUser;
    localStorage.setItem('burger_user_session', JSON.stringify(activeUser));

    // Map role variables for view renderers
    if (activeUser.role === 'cliente') {
        currentSession.cliente = activeUser;
        currentSession.rider = null;
        currentSession.admin = null;
    } else if (activeUser.role === 'rider') {
        currentSession.rider = activeUser;
        currentSession.cliente = null;
        currentSession.admin = null;
    } else if (activeUser.role === 'super_usuario') {
        currentSession.admin = activeUser;
        currentSession.cliente = null;
        currentSession.rider = null;
    }

    // Update Header Status UI
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('headerUserStatus').style.display = 'flex';
    document.getElementById('lblHeaderUserName').innerText = `${activeUser.nombre} (${activeUser.role.toUpperCase().replace('_', ' ')})`;

    // Display appropriate panel
    const roleKey = activeUser.role === 'super_usuario' ? 'admin' : activeUser.role;
    switchRole(roleKey);

    if (notify) {
        showToast(`¡Sesión iniciada como ${activeUser.nombre}!`, 'success');
    }
}

function handleLogout(notify = true) {
    currentSession.currentUser = null;
    currentSession.cliente = null;
    currentSession.rider = null;
    currentSession.admin = null;

    localStorage.removeItem('burger_user_session');
    localStorage.removeItem('burger_jwt_token');

    // Hide panels
    document.querySelectorAll('.panel').forEach(panel => {
        panel.classList.remove('active');
    });

    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('headerUserStatus').style.display = 'none';
    
    // Stop live monitoring interval if running
    stopAdminMonitoringPolling();

    // Clear maps elements
    checkoutMapInstance = null;
    clientTrackingMapInstance = null;
    riderTrackingMapInstance = null;
    adminMonitoringMapInstance = null;

    if (notify) {
        showToast('Sesión cerrada correctamente.', 'info');
    }
    cart = [];
    updateCartBadge();
    renderAuthCard('login');
}

// Global quick-login function for presentation
window.quickLogin = function(email, password) {
    // Make sure email/pass inputs exist (they're in loginScreen rendered via renderAuthCard)
    const emailEl = document.getElementById('loginEmail');
    const passEl = document.getElementById('loginPassword');
    if (emailEl) emailEl.value = email;
    if (passEl) passEl.value = password;

    // Auto-plegar el panel demo al iniciar sesión para no interrumpir operaciones
    const qsPanel = document.getElementById('devQuickSwitch');
    const qsContent = document.getElementById('quickSwitchContent');
    const qsToggleTxt = document.getElementById('quickSwitchToggleText');
    if (qsPanel && qsContent) {
        qsPanel.classList.add('collapsed');
        qsContent.style.display = 'none';
        if (qsToggleTxt) qsToggleTxt.innerText = '(Abrir ▴)';
    }

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

    let pendingMsg = '';
    if (u.ci_status === 'pending') {
        pendingMsg = `<div style="margin-top:0.75rem; padding:0.75rem; background:rgba(245,158,11,0.1); border-radius:var(--radius-md); border:1px solid rgba(245,158,11,0.25); font-size:0.85rem; color:var(--accent-amber);">
            ⏳ Tu C.I. está pendiente de aprobación. El administrador revisará tu documentación a la brevedad.
        </div>`;
    } else if (u.ci_status === 'rejected') {
        pendingMsg = `<div style="margin-top:0.75rem; padding:0.75rem; background:rgba(239,68,68,0.1); border-radius:var(--radius-md); border:1px solid rgba(239,68,68,0.25); font-size:0.85rem; color:var(--accent-red);">
            ❌ Tu C.I. fue rechazado. Contacta al administrador o vuelve a registrarte con un documento más claro.
        </div>`;
    }

    box.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <p><strong>Nombre:</strong> ${u.nombre}</p>
            <p><strong>Email:</strong> ${u.email}</p>
            <p><strong>Edad:</strong> ${calculateAge(u.fecha_nacimiento)} años</p>
            <div>
                <span class="badge ${badgeClass}">${statusLabel}</span>
            </div>
            ${pendingMsg}
        </div>
    `;
}

async function renderProducts(category = 'todos', searchQuery = '') {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    const u = currentSession.cliente;
    const isVerified = u && u.ci_status === 'verified';
    
    const alertBox = document.getElementById('catalogVerifiedAlert');
    if (alertBox) {
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
    }

    let apiError = null;
    try {
        const res = await apiGet('/Catalog/catalog.php');
        if (res.ok && res.data && Array.isArray(res.data.productos)) {
            DB.productos = res.data.productos.map(p => ({
                id: parseInt(p.id, 10),
                categoria: p.categoria,
                nombre: p.nombre,
                marca: p.marca,
                sabor: p.sabor || '',
                precio: parseFloat(p.precio),
                stock: parseInt(p.stock, 10),
                created_at: p.created_at,
                updated_at: p.updated_at
            }));
            hideGlobalApiError();
        } else {
            DB.productos = [];
            apiError = (res && res.error) || 'Fallo de respuesta al consultar el catálogo';
        }
    } catch (err) {
        DB.productos = [];
        apiError = err.message || 'Error de conexión con la API de Catálogo';
    }

    if (apiError) {
        grid.innerHTML = `
            <div class="api-error-card" style="grid-column: 1/-1;">
                <i data-lucide="alert-triangle" style="width: 44px; height: 44px; color: var(--accent-red); margin-bottom: 0.75rem;"></i>
                <h3>Error al Cargar Catálogo desde la API PHP</h3>
                <p>No se pudieron obtener los productos de la base de datos MySQL real. Verifique que Apache y MySQL estén en ejecución.</p>
                <div class="api-error-detail">${escapeHtml(apiError)}</div>
                <div>
                    <button class="btn btn-secondary btn-sm" onclick="renderProducts('${category}', '${searchQuery}')">
                        <i data-lucide="refresh-cw"></i> Reintentar Carga
                    </button>
                </div>
            </div>
        `;
        initLucide();
        showGlobalApiError(apiError, () => renderProducts(category, searchQuery));
        return;
    }

    let filtered = DB.productos;
    if (category !== 'todos') {
        filtered = filtered.filter(p => p.categoria === category);
    }
    if (searchQuery && searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
            (p.nombre && p.nombre.toLowerCase().includes(query)) || 
            (p.marca && p.marca.toLowerCase().includes(query)) ||
            (p.sabor && p.sabor.toLowerCase().includes(query))
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

    // Floating cart button: show whenever client is active
    const floatingBtn = document.getElementById('btnFloatingCart');
    if (floatingBtn) {
        floatingBtn.style.display = u ? 'flex' : 'none';
    }
    const cartCountEl = document.getElementById('cartCount');
    if (cartCountEl) cartCountEl.innerText = count;

    // Header cart button
    const headerCartBtn = document.getElementById('btnHeaderCart');
    const headerCartCountEl = document.getElementById('headerCartCount');
    if (headerCartBtn) {
        headerCartBtn.style.display = u ? 'inline-flex' : 'none';
    }
    if (headerCartCountEl) headerCartCountEl.innerText = count;

    // Sidebar cart button
    const sidebarCartBtn = document.getElementById('btnSidebarCart');
    const sidebarCartCountEl = document.getElementById('sidebarCartCount');
    if (sidebarCartBtn) {
        sidebarCartBtn.style.display = u ? 'flex' : 'none';
    }
    if (sidebarCartCountEl) sidebarCartCountEl.innerText = count;
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
        body.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary); padding: 3rem 1rem;">
                <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(249, 115, 22, 0.1); color: #f97316; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                    <i data-lucide="shopping-basket" style="width: 28px; height: 28px;"></i>
                </div>
                <h4 style="font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">Tu carrito está vacío</h4>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1.5rem;">Agrega deliciosas hamburguesas o combos para continuar.</p>
                <button class="btn btn-primary btn-sm" onclick="closeCartDrawer()"><i data-lucide="utensils"></i> Explorar Menú</button>
            </div>
        `;
        document.getElementById('cartSubtotal').innerText = '0.00 Bs';
        document.getElementById('cartTotal').innerText = '0.00 Bs';
        document.getElementById('btnCheckout').disabled = true;
        initLucide();
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
function setCheckoutDeliveryCoords(lat, lng) {
    if (checkoutMarkerClient) {
        checkoutMarkerClient.setLatLng([lat, lng]);
    } else if (checkoutMapInstance) {
        checkoutMarkerClient = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'node-client-wrap',
                html: '<div style="background:#f59e0b; width:14px; height:14px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #f59e0b;"></div>',
                iconSize: [14, 14],
                iconAnchor: [7, 7]
            })
        }).addTo(checkoutMapInstance);
    }
    if (checkoutMapInstance) {
        checkoutMapInstance.setView([lat, lng], 14);
    }

    const logistics = calculateLogistics(lat, lng);
    selectedDeliveryCoords = logistics;

    const lblDist = document.getElementById('lblDistance');
    if (lblDist) lblDist.innerText = `${logistics.distanceKm} Km`;
    const lblShip = document.getElementById('lblShippingCost');
    if (lblShip) lblShip.innerText = `${logistics.costBs} Bs`;
    const lblEta = document.getElementById('lblEta');
    if (lblEta) lblEta.innerText = `${logistics.etaMin} min`;

    updateCheckoutFinalTotal();
}

function openCheckoutModal() {
    if (cart.length === 0) {
        showToast('Agrega productos al carrito antes de proceder al pago.', 'warning');
        return;
    }

    closeCartDrawer();
    document.getElementById('checkoutModal').classList.add('active');

    // Default payment method: Contraentrega
    const payCash = document.getElementById('payOptCash');
    const payQr = document.getElementById('payOptQr');
    if (payCash) payCash.classList.add('active');
    if (payQr) payQr.classList.remove('active');
    const cashBlock = document.getElementById('cashDetailsBlock');
    if (cashBlock) cashBlock.style.display = 'block';
    const qrBlock = document.getElementById('qrUploadBlock');
    if (qrBlock) qrBlock.style.display = 'none';

    document.getElementById('fileQrComprobante').value = '';
    const qrPrev = document.getElementById('qrUploadPreview');
    if (qrPrev) qrPrev.style.display = 'none';

    // Auto-select suggested coords (Sopocachi Sur)
    setCheckoutDeliveryCoords(-16.5090, -68.1340);

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
                    html: '<div style="background:#f97316; width:14px; height:14px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #f97316;"></div>',
                    iconSize: [14, 14],
                    iconAnchor: [7, 7]
                })
            }).addTo(checkoutMapInstance).bindPopup("Burger 24/7 - Central Sopocachi (Cocina & Despacho)").openPopup();

            checkoutMapInstance.on('click', (e) => {
                setCheckoutDeliveryCoords(e.latlng.lat, e.latlng.lng);
            });
        } else {
            checkoutMapInstance.invalidateSize();
            if (selectedDeliveryCoords) {
                setCheckoutDeliveryCoords(selectedDeliveryCoords.lat, selectedDeliveryCoords.lon);
            }
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

    const isCash = document.getElementById('payOptCash').classList.contains('active');
    const placeBtn = document.getElementById('btnPlaceOrder');
    if (placeBtn) {
        if (isCash) {
            placeBtn.innerText = `Confirmar Pedido (Pagar en Efectivo al Recibir: ${finalTotal.toFixed(2)} Bs)`;
            placeBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        } else {
            placeBtn.innerText = `Confirmar Pedido (Pago con QR: ${finalTotal.toFixed(2)} Bs)`;
            placeBtn.style.background = 'linear-gradient(135deg, #8b5cf6, #6d28d9)';
        }
    }
    validateCheckoutForm();
}

function validateCheckoutForm() {
    const hasLocation = selectedDeliveryCoords !== null;
    const isQr = document.getElementById('payOptQr').classList.contains('active');
    const hasQrFile = document.getElementById('fileQrComprobante').files.length > 0;
    
    const placeBtn = document.getElementById('btnPlaceOrder');
    if (placeBtn) {
        // For Contraentrega, location is enough! No file upload required!
        // For QR, location and QR file are needed
        placeBtn.disabled = !(hasLocation && (!isQr || hasQrFile));
    }
}

async function submitOrderCheckout() {
    if (cart.length === 0 || !selectedDeliveryCoords) return;

    const u = currentSession.cliente;
    const isQr = document.getElementById('payOptQr').classList.contains('active');
    const metodoPago = isQr ? 'qr' : 'contraentrega';

    let qrUrl = null;
    if (isQr) {
        const file = document.getElementById('fileQrComprobante').files[0];
        qrUrl = `/uploads/qr/qr_${Date.now()}_${file ? file.name : 'comprobante.png'}`;
    }

    // Proceso de Checkout atómico contra backend MySQL
    const token = getAuthToken();
    if (!token) {
        showToast('Error 401: Sesión no autenticada. Inicia sesión para continuar.', 'danger');
        return;
    }

    const itemsPayload = cart.map(item => ({
        producto_id: item.product.id,
        cantidad: item.quantity
    }));

    try {
        const res = await apiPost('/Transactions/checkout.php', {
            items: itemsPayload,
            latitud: selectedDeliveryCoords.lat,
            longitud: selectedDeliveryCoords.lon,
            metodo_pago: metodoPago,
            distancia_km: selectedDeliveryCoords.distKm,
            qr_comprobante_url: qrUrl
        });

        if (!res.ok) {
            if (res.status === 400 && res.error && res.error.includes('Stock insuficiente')) {
                showToast(`Error: ${res.error}`, 'danger');
                return;
            } else if (res.status === 403) {
                showToast(`Error 403: ${res.error || 'Debes tener tu C.I. verificado para realizar compras.'}`, 'danger');
                return;
            }
            showToast(`Error en checkout: ${res.error || 'No se pudo procesar la transacción.'}`, 'danger');
            showGlobalApiError('Error al procesar el checkout en el servidor: ' + (res.error || 'Operación rechazada.'));
            return;
        }

        closeCheckoutModal();
        cart = [];
        updateCartBadge();
        showToast('¡Pedido registrado en MySQL exitosamente! Inventario descontado.', 'success');
        await renderClienteActiveOrderTracker();
        await renderProducts();
    } catch (err) {
        console.error('Error enviando checkout a backend:', err);
        showToast('Error de conexión con la API PHP. No se pudo registrar el pedido.', 'danger');
        showGlobalApiError('No se pudo procesar la compra en el servidor. Por favor verifica la conexión con la API PHP.');
    }
}

async function renderClienteActiveOrderTracker() {
    const box = document.getElementById('clienteActiveOrderBox');
    const u = currentSession.cliente;

    if (!u) {
        if (box) box.style.display = 'none';
        return;
    }

    let activeOrder = null;
    const token = getAuthToken();
    if (token) {
        try {
            const res = await apiGet('/Transactions/checkout.php');
            if (res.ok && res.data) {
                activeOrder = res.data.pedido_activo || null;
            } else if (!res.ok) {
                console.warn('Fallo consultando pedidos del cliente:', res.error);
            }
        } catch (err) {
            console.error('Error de red al consultar pedido del cliente:', err);
            showGlobalApiError('No se pudo consultar el pedido activo en el servidor.');
        }
    }

    if (!activeOrder) {
        if (box) box.style.display = 'none';
        return;
    }

    if (box) box.style.display = 'block';

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

    const titleEl = document.getElementById('clientActiveOrderTitle');
    if (titleEl) titleEl.innerText = `Pedido #${activeOrder.id} - ${(activeOrder.estado_pedido || '').toUpperCase()}`;
    
    const details = activeOrder.detalles || [];
    const detailsText = details.map(d => `${d.cantidad}x ${d.nombre || 'Producto'}`).join(', ');

    const isContra = activeOrder.estado_pago === 'contraentrega' || activeOrder.estado_pago === 'pagado_efectivo';
    const qrBtn = activeOrder.qr_comprobante_url
        ? ` <button class="btn btn-secondary btn-sm" onclick="openFileViewer('${activeOrder.qr_comprobante_url}', 'Comprobante QR - Pedido #${activeOrder.id}', 'qr', null)" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; margin-left: 0.4rem; vertical-align: middle;"><i data-lucide="receipt" style="width:12px;height:12px;"></i> Ver Comprobante QR</button>`
        : '';

    const canCancel = ['pendiente', 'asignado'].includes(activeOrder.estado_pedido);
    const cancelBtn = canCancel
        ? ` <button class="btn btn-danger btn-sm" onclick="clienteCancelarPedido(${activeOrder.id})" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; margin-left: 0.5rem; vertical-align: middle;"><i data-lucide="x-circle" style="width:12px;height:12px;"></i> Cancelar</button>`
        : '';

    const payBadge = isContra
        ? '<span class="badge" style="background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.3); font-size:0.8rem; font-weight:600;"><i data-lucide="banknote" style="width:13px;height:13px;vertical-align:middle;"></i> Contraentrega (Pagarás en efectivo al recibir)</span>'
        : `<span class="badge" style="background:rgba(139,92,246,0.15); color:#8b5cf6; border:1px solid rgba(139,92,246,0.3); font-size:0.8rem; font-weight:600;"><i data-lucide="qr-code" style="width:13px;height:13px;vertical-align:middle;"></i> Pagado con QR</span>${qrBtn}`;

    const payEl = document.getElementById('clientActiveOrderPayment');
    if (payEl) payEl.innerHTML = `<strong>Método de Pago:</strong> ${payBadge}`;

    const totalEl = document.getElementById('clientActiveOrderTotal');
    if (totalEl) totalEl.innerHTML = `<strong>Total a pagar:</strong> ${Number(activeOrder.total).toFixed(2)} Bs ${cancelBtn}`;
    initLucide();

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

window.clienteCancelarPedido = async function(orderId) {
    if (!confirm(`¿Estás seguro de que deseas cancelar el Pedido #${orderId}? Tu dinero/stock será reembolsado inmediatamente.`)) {
        return;
    }
    try {
        const res = await apiPost('/Transactions/cancel_order.php', {
            pedido_id: orderId,
            motivo: 'Cancelado por el cliente desde la app'
        });
        if (res.ok) {
            showToast('Pedido cancelado exitosamente y stock reembolsado.', 'success');
            await renderClienteActiveOrderTracker();
            await renderProducts();
        } else {
            showToast(res.error || 'No se pudo cancelar el pedido.', 'danger');
        }
    } catch (err) {
        showToast('Error de red al cancelar pedido.', 'danger');
    }
};

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

    let riderStatusMsg = '';
    if (doc && doc.estado_aprobacion === 'rechazado') {
        riderStatusMsg = `<div style="margin-top:0.75rem; padding:0.75rem; background:rgba(239,68,68,0.1); border-radius:var(--radius-md); border:1px solid rgba(239,68,68,0.25); font-size:0.85rem; color:var(--accent-red);">
            ❌ Tu expediente fue rechazado por el Administrador. Contacta con la administración para más información.
        </div>`;
    } else if (!doc || doc.estado_aprobacion === 'pendiente') {
        riderStatusMsg = `<div style="margin-top:0.75rem; padding:0.75rem; background:rgba(245,158,11,0.1); border-radius:var(--radius-md); border:1px solid rgba(245,158,11,0.25); font-size:0.85rem; color:var(--accent-amber);">
            ⏳ Tu expediente está en revisión. Se te notificará cuando el administrador lo apruebe.
        </div>`;
    }

    box.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem;">
            <p><strong>Nombre:</strong> ${r.nombre}</p>
            <p><strong>Email:</strong> ${r.email}</p>
            <div>
                <span class="badge ${statusClass}">${statusText}</span>
            </div>
            ${riderStatusMsg}
        </div>
    `;

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

async function renderRiderOrderQueue() {
    const list = document.getElementById('orderQueueList');
    const r = currentSession.rider;
    if (!list || !r) return;

    const token = getAuthToken();
    if (!token) {
        list.innerHTML = `<div class="api-error-card"><h4><i data-lucide="lock"></i> Inicia sesión</h4><p>Debes iniciar sesión como repartidor.</p></div>`;
        initLucide();
        return;
    }

    try {
        const res = await apiGet('/Rider/assignment.php');
        if (res.status === 403) {
            list.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 2rem;">Tu cuenta no está aprobada para realizar despachos. Por favor carga tus documentos y contacta al Administrador.</div>`;
            window._riderActiveOrder = null;
            renderRiderActiveOrderPanel();
            return;
        }

        if (!res.ok) {
            list.innerHTML = `
                <div class="api-error-card">
                    <h4><i data-lucide="alert-triangle"></i> Error al consultar pedidos</h4>
                    <p>${escapeHtml(res.error || 'No se pudo obtener la cola de pedidos desde la API PHP.')}</p>
                    <button class="btn btn-primary btn-sm" onclick="renderRiderOrderQueue()"><i data-lucide="refresh-cw"></i> Reintentar</button>
                </div>
            `;
            showGlobalApiError('Error al consultar pedidos disponibles para repartidores.');
            initLucide();
            return;
        }

        // Cache active order and history from API response
        window._riderActiveOrder = res.data ? res.data.pedido_activo : null;
        if (res.data && Array.isArray(res.data.historial_pedidos)) {
            window._riderOrderHistory = res.data.historial_pedidos;
        }

        renderRiderActiveOrderPanel();

        const pendings = (res.data && Array.isArray(res.data.pedidos_disponibles)) ? res.data.pedidos_disponibles : [];
        if (window._riderActiveOrder) {
            list.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 2rem;">Tienes una entrega activa en progreso. Finalízala antes de aceptar nuevos pedidos.</div>`;
            return;
        }

        if (pendings.length === 0) {
            list.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 2rem;">No hay pedidos pendientes disponibles en este momento.</div>`;
            return;
        }

        list.innerHTML = pendings.map(p => {
            const logData = p.logistica || { distancia_km: 1.5, tiempo_estimado: '10 min' };
            const itemsText = (p.items || []).map(d => `${d.cantidad}x ${d.nombre}`).join(', ');
            return `
                <div class="order-card">
                    <div class="order-card-header">
                        <span class="order-id">Pedido #${p.pedido_id}</span>
                        <span class="badge ${p.estado_pago === 'pagado_qr' ? 'badge-verified' : 'badge-pending'}">${(p.estado_pago || '').replace('_', ' ')}</span>
                    </div>
                    <div class="order-card-body">
                        <div>
                            <div class="order-meta-label">Cliente</div>
                            <div class="order-meta-val">${escapeHtml(p.cliente_nombre || 'Cliente Anónimo')}</div>
                        </div>
                        <div>
                            <div class="order-meta-label">Monto del Pedido</div>
                            <div class="order-meta-val">${Number(p.total).toFixed(2)} Bs</div>
                        </div>
                        <div class="order-items-summary">
                            <div class="order-meta-label">Artículos del Pedido</div>
                            <div class="order-meta-val" style="font-weight: 500;">${escapeHtml(itemsText || 'Combo / Hamburguesa')}</div>
                        </div>
                        <div>
                            <div class="order-meta-label">Distancia de Ruta</div>
                            <div class="order-meta-val">${logData.distancia_km || logData.distanceKm || 1.5} Km</div>
                        </div>
                        <div>
                            <div class="order-meta-label">Tiempo Estimado</div>
                            <div class="order-meta-val">${logData.tiempo_estimado || logData.etaMin || '10 min'}</div>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
                        <button class="btn btn-danger btn-sm" onclick="rejectRiderAvailableOrder(${p.pedido_id})"><i data-lucide="x"></i> Rechazar</button>
                        <button class="btn btn-primary btn-sm" onclick="acceptRiderOrder(${p.pedido_id})"><i data-lucide="check"></i> Aceptar Pedido</button>
                    </div>
                </div>
            `;
        }).join('');
        initLucide();
    } catch (err) {
        console.error('Fallo consultando assignment.php:', err);
        list.innerHTML = `
            <div class="api-error-card">
                <h4><i data-lucide="alert-triangle"></i> Error de conexión con la API PHP</h4>
                <p>No se pudo conectar con el microservicio de asignación de pedidos. Verifica que el servidor Apache/MySQL esté activo.</p>
                <button class="btn btn-primary btn-sm" onclick="renderRiderOrderQueue()"><i data-lucide="refresh-cw"></i> Reintentar</button>
            </div>
        `;
        showGlobalApiError('Fallo de conexión al consultar los pedidos para repartidores.');
        initLucide();
    }
}

window.acceptRiderOrder = async function(orderId) {
    const token = getAuthToken();
    if (!token) {
        showToast('Error 401: Sesión no autorizada.', 'danger');
        return;
    }

    try {
        const res = await apiPost('/Rider/assignment.php', { pedido_id: orderId });
        if (res.status === 403) {
            showToast('Error 403: Tu cuenta de rider no está aprobada para aceptar pedidos.', 'danger');
            return;
        } else if (res.status === 409) {
            showToast(`Conflicto: ${res.error || 'El pedido no está disponible o ya tienes uno activo.'}`, 'warning');
            return;
        } else if (!res.ok) {
            showToast(`Error al aceptar: ${res.error || 'Operación rechazada.'}`, 'danger');
            return;
        }

        showToast('¡Pedido aceptado exitosamente desde la API PHP!', 'success');
        await renderRiderOrderQueue();
    } catch (err) {
        console.error('Error en assignment.php:', err);
        showToast('Error de red al conectar con la API PHP.', 'danger');
        showGlobalApiError('No se pudo comunicar con el servidor para aceptar el pedido.');
    }
};

function renderRiderActiveOrderPanel() {
    const box = document.getElementById('riderActiveOrderBox');
    const r = currentSession.rider;

    if (!box || !r) {
        if (box) box.style.display = 'none';
        return;
    }

    const activeOrder = window._riderActiveOrder;

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

    const titleEl = document.getElementById('riderActiveOrderTitle');
    if (titleEl) titleEl.innerText = `Entrega Activa #${activeOrder.id}`;
    
    const clientEl = document.getElementById('riderActiveOrderClient');
    if (clientEl) clientEl.innerHTML = `<strong>Cliente:</strong> ${escapeHtml(activeOrder.cliente_nombre || 'Cliente')}`;
    
    const details = activeOrder.items || [];
    const detailsText = details.map(d => `${d.cantidad}x ${d.nombre || 'Producto'}`).join(', ');
    
    const itemsEl = document.getElementById('riderActiveOrderItems');
    if (itemsEl) itemsEl.innerHTML = `<strong>Detalles:</strong> ${escapeHtml(detailsText || 'Sin detalles')}`;
    
    const payEl = document.getElementById('riderActiveOrderPayment');
    if (payEl) payEl.innerHTML = `<strong>Total a Cobrar:</strong> ${Number(activeOrder.total).toFixed(2)} Bs (${(activeOrder.estado_pago || '').toUpperCase()})`;

    const latCliente = activeOrder.latitud || -16.5090;
    const lonCliente = activeOrder.longitud || -68.1340;
    const logData = calculateLogistics(latCliente, lonCliente);

    const distEl = document.getElementById('riderOrderDistance');
    if (distEl) distEl.innerText = `Distancia: ${logData.distanceKm} Km`;
    
    const etaEl = document.getElementById('riderOrderEta');
    if (etaEl) etaEl.innerText = `ETA: ${logData.etaMin} min`;

    const activeBtn = document.getElementById('btnRiderAction');
    const cancelBtn = document.getElementById('btnRiderCancel');

    if (activeBtn && cancelBtn) {
        if (activeOrder.estado_pedido === 'asignado') {
            activeBtn.innerText = 'Iniciar Despacho (En Camino)';
            activeBtn.className = 'btn btn-primary';
            cancelBtn.style.display = 'block';
        } else if (activeOrder.estado_pedido === 'en_camino') {
            activeBtn.innerText = 'Finalizar Entrega (Cobrar)';
            activeBtn.className = 'btn btn-success';
            cancelBtn.style.display = 'none';
        }
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
                color: '#10b981',
                weight: 3,
                dashArray: '5, 5'
            }).addTo(riderTrackingMapInstance);
        }

        const bounds = L.latLngBounds([
            [STORE_COORDS.lat, STORE_COORDS.lon],
            [latCliente, lonCliente]
        ]);
        riderTrackingMapInstance.fitBounds(bounds, { padding: [20, 20] });

        const riderPos = (activeOrder.estado_pedido === 'asignado')
            ? [STORE_COORDS.lat, STORE_COORDS.lon]
            : [
                STORE_COORDS.lat + 0.6 * (latCliente - STORE_COORDS.lat),
                STORE_COORDS.lon + 0.6 * (lonCliente - STORE_COORDS.lon)
            ];

        if (riderTrackingMarkerRider) {
            riderTrackingMarkerRider.setLatLng(riderPos);
        } else {
            riderTrackingMarkerRider = L.marker(riderPos, {
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

async function processRiderActiveOrderStep() {
    const r = currentSession.rider;
    const activeOrder = window._riderActiveOrder;

    if (!activeOrder) return;

    const oldState = activeOrder.estado_pedido;
    const nextState = oldState === 'asignado' ? 'en_camino' : 'entregado';
    let msg = nextState === 'en_camino' ? 'Viaje iniciado. Conduce con cuidado.' : 'Pedido entregado con éxito.';

    const token = getAuthToken();
    if (!token) {
        showToast('Error: No se encontró sesión activa de repartidor.', 'danger');
        return;
    }

    try {
        const res = await apiPut('/Rider/delivery.php', { pedido_id: activeOrder.id, nuevo_estado: nextState });
        if (res.status === 403) {
            showToast('Error 403: No estás autorizado para gestionar este pedido.', 'danger');
            return;
        } else if (!res.ok) {
            showToast(`Error al avanzar pedido: ${res.error || 'Operación rechazada por la API PHP'}`, 'danger');
            return;
        }

        showToast(msg, 'success');
        await renderRiderOrderQueue();
        await renderRiderOrderHistory();
    } catch (err) {
        console.error('Error en delivery.php:', err);
        showToast('Error de conexión con la API PHP al actualizar entrega.', 'danger');
        showGlobalApiError('No se pudo registrar el avance del pedido en el servidor.');
    }
}

async function cancelRiderActiveOrder() {
    const activeOrder = window._riderActiveOrder;
    if (!activeOrder) return;

    const token = getAuthToken();
    if (!token) {
        showToast('Error: No hay sesión de repartidor activa.', 'danger');
        return;
    }

    try {
        const res = await apiPost('/Rider/assignment.php', { action: 'release_order', pedido_id: activeOrder.id });
        if (!res.ok) {
            showToast(`Error al liberar pedido: ${res.error || 'Operación rechazada'}`, 'danger');
            return;
        }
        showToast('Pedido liberado exitosamente en el servidor.', 'info');
        await renderRiderOrderQueue();
    } catch (err) {
        console.error('Error liberando pedido en backend:', err);
        showToast('Error de conexión al liberar pedido.', 'danger');
    }
}

// ----------------------------------------------------
// 10. ADMIN PORTAL LOGIC & LIVE OPERATIONS
// ----------------------------------------------------

// -------------------------------------------------------
// RIDER: HISTORIAL DE PEDIDOS (Entregados, Rechazados, etc.)
// -------------------------------------------------------
async function renderRiderOrderHistory(filter = 'all') {
    const listEl = document.getElementById('riderHistoryList');
    if (!listEl) return;
    const r = currentSession.rider;
    if (!r) return;

    let historyOrders = window._riderOrderHistory || [];

    if (!historyOrders.length) {
        const token = getAuthToken();
        if (token) {
            try {
                const res = await apiGet('/Rider/assignment.php');
                if (res.ok && res.data && Array.isArray(res.data.historial_pedidos)) {
                    historyOrders = res.data.historial_pedidos;
                    window._riderOrderHistory = historyOrders;
                } else if (!res.ok) {
                    listEl.innerHTML = `
                        <div class="api-error-card">
                            <h4><i data-lucide="alert-triangle"></i> Error al consultar historial</h4>
                            <p>${escapeHtml(res.error || 'No se pudo obtener el historial de entregas de la API PHP.')}</p>
                        </div>
                    `;
                    initLucide();
                    return;
                }
            } catch (err) {
                console.error('Fallo obteniendo historial de rider:', err);
                listEl.innerHTML = `
                    <div class="api-error-card">
                        <h4><i data-lucide="alert-triangle"></i> Error de conexión con la API PHP</h4>
                        <p>No se pudo conectar con el servidor para consultar el historial de entregas.</p>
                    </div>
                `;
                initLucide();
                return;
            }
        }
    }

    window._riderOrderHistory = historyOrders;
    renderFilteredRiderHistory(filter);
    setupRiderHistoryFilterListeners();
}

function renderFilteredRiderHistory(filter = 'all') {
    const listEl = document.getElementById('riderHistoryList');
    if (!listEl) return;
    const all = window._riderOrderHistory || [];

    let filtered = all;
    if (filter === 'entregado') {
        filtered = all.filter(o => o.estado_pedido === 'entregado');
    } else if (filter === 'activo') {
        filtered = all.filter(o => o.estado_pedido === 'asignado' || o.estado_pedido === 'en_camino');
    } else if (filter === 'rechazado') {
        filtered = all.filter(o => o.estado_pedido === 'rechazado' || o.estado_pedido === 'cancelado');
    }

    if (!filtered.length) {
        listEl.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 2rem; font-size: 0.9rem;">
            No tienes pedidos registrados en la categoría seleccionada (${filter}).
        </div>`;
        return;
    }

    listEl.innerHTML = filtered.map(o => {
        let badgeHtml = '';
        if (o.estado_pedido === 'entregado') {
            badgeHtml = '<span class="badge badge-verified"><i data-lucide="check-check"></i> Entregado</span>';
        } else if (o.estado_pedido === 'rechazado') {
            badgeHtml = '<span class="badge badge-rejected"><i data-lucide="x-circle"></i> Rechazado</span>';
        } else if (o.estado_pedido === 'cancelado') {
            badgeHtml = '<span class="badge badge-rejected"><i data-lucide="ban"></i> Cancelado</span>';
        } else if (o.estado_pedido === 'en_camino') {
            badgeHtml = '<span class="badge badge-pending"><i data-lucide="bike"></i> En Camino</span>';
        } else {
            badgeHtml = '<span class="badge badge-pending"><i data-lucide="clock"></i> Aceptado</span>';
        }

        const itemsText = (o.items || []).map(i => `${i.cantidad}x ${i.nombre}`).join(', ') || 'Productos varios';
        const isContraentrega = o.estado_pago === 'contraentrega' || o.estado_pago === 'pagado_efectivo' || o.estado_pago === 'liquidado';
        const payBadge = isContraentrega
            ? '<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3);">💵 Contraentrega (Efectivo)</span>'
            : '<span class="badge" style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.3);">📱 Pago QR</span>';

        const rawDate = o.fecha_actualizacion || o.fecha_creacion;
        let dateStr = 'Reciente';
        if (rawDate) {
            try {
                dateStr = new Date(rawDate).toLocaleString('es-BO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            } catch(e) {}
        }

        const motivoHtml = (o.estado_pedido === 'rechazado' || o.estado_pedido === 'cancelado') && o.motivo_cancelacion
            ? `<div style="margin-top: 0.5rem; padding: 0.5rem 0.75rem; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: var(--radius-sm); font-size: 0.8rem; color: var(--accent-red);">
                <strong>Motivo:</strong> ${o.motivo_cancelacion}
               </div>`
            : '';

        return `
            <div class="order-card" style="border-left: 3px solid ${o.estado_pedido === 'entregado' ? '#10b981' : (o.estado_pedido === 'rechazado' || o.estado_pedido === 'cancelado' ? '#ef4444' : '#8b5cf6')};">
                <div class="order-card-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
                    <div>
                        <span class="order-id" style="font-weight:700;">Pedido #${o.pedido_id}</span>
                        <span style="font-size:0.75rem; color:var(--text-muted); margin-left:0.5rem;">${dateStr}</span>
                    </div>
                    <div style="display:flex; gap:0.4rem; align-items:center;">
                        ${payBadge}
                        ${badgeHtml}
                    </div>
                </div>
                <div class="order-card-body" style="grid-template-columns: 1fr 1fr 1.5fr;">
                    <div>
                        <div class="order-meta-label">Cliente</div>
                        <div class="order-meta-val">${o.cliente_nombre || 'Cliente'}</div>
                    </div>
                    <div>
                        <div class="order-meta-label">Monto Cobrado / Total</div>
                        <div class="order-meta-val" style="font-weight:700; color:var(--text-primary);">${Number(o.total).toFixed(2)} Bs</div>
                    </div>
                    <div>
                        <div class="order-meta-label">Artículos del Pedido</div>
                        <div class="order-meta-val" style="font-size:0.85rem;">${itemsText}</div>
                    </div>
                </div>
                ${motivoHtml}
            </div>
        `;
    }).join('');
    initLucide();
}

function setupRiderHistoryFilterListeners() {
    document.querySelectorAll('.rider-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.rider-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderFilteredRiderHistory(btn.dataset.filter);
        });
    });
}

window.rejectRiderAvailableOrder = async function(orderId) {
    const r = currentSession.rider;
    const motivo = prompt('Ingresa el motivo del rechazo del pedido:', 'Zona fuera de cobertura / Dificultad climática');
    if (!motivo) return;

    try {
        const res = await apiPost('/Rider/assignment.php', {
            pedido_id: orderId,
            action: 'reject',
            motivo: motivo
        });
        if (!res.ok) {
            showToast(`Error al rechazar pedido: ${res.error || 'Operación denegada'}`, 'danger');
            showGlobalApiError('No se pudo rechazar el pedido en el backend.');
            return;
        }
        showToast('Pedido rechazado y archivado en tu historial.', 'info');
        updateUIForCurrentRole();
    } catch (err) {
        console.error('Error enviando rechazo al backend:', err);
        showToast('Error de red al rechazar pedido.', 'danger');
        showGlobalApiError('Error de red al contactar al servidor PHP.');
    }
};

async function renderAdminPendingApprovals() {
    const custContainer = document.getElementById('pendingCustomersList');
    const riderContainer = document.getElementById('pendingRidersList');
    if (!custContainer || !riderContainer) return;

    let pendingCustomers = [];
    let pendingRidersDocs = [];

    try {
        const res = await apiGet('/Auth/admin_approval.php');
        if (!res.ok) {
            const errHtml = `
                <div class="api-error-card">
                    <h4><i data-lucide="alert-triangle"></i> Error en la API PHP</h4>
                    <p>${escapeHtml(res.error || 'No se pudieron consultar las aprobaciones pendientes.')}</p>
                    <button class="btn btn-primary btn-sm" onclick="renderAdminPendingApprovals()"><i data-lucide="refresh-cw"></i> Reintentar</button>
                </div>
            `;
            custContainer.innerHTML = errHtml;
            riderContainer.innerHTML = errHtml;
            showGlobalApiError('Error al consultar aprobaciones pendientes de clientes y repartidores.');
            initLucide();
            return;
        }
        if (res.data) {
            if (Array.isArray(res.data.pending_customers)) {
                pendingCustomers = res.data.pending_customers;
            }
            if (Array.isArray(res.data.pending_riders)) {
                pendingRidersDocs = res.data.pending_riders;
            }
        }
    } catch (err) {
        console.error('Fallo consulta a /Auth/admin_approval.php:', err);
        const errHtml = `
            <div class="api-error-card">
                <h4><i data-lucide="alert-triangle"></i> Error de conexión con la API PHP</h4>
                <p>No se pudo conectar con el servidor para obtener las aprobaciones pendientes.</p>
                <button class="btn btn-primary btn-sm" onclick="renderAdminPendingApprovals()"><i data-lucide="refresh-cw"></i> Reintentar</button>
            </div>
        `;
        custContainer.innerHTML = errHtml;
        riderContainer.innerHTML = errHtml;
        showGlobalApiError('Error al consultar aprobaciones pendientes de clientes y repartidores.');
        initLucide();
        return;
    }

    if (pendingCustomers.length === 0) {
        custContainer.innerHTML = `<div style="color: var(--text-secondary); font-size: 0.9rem;">No hay clientes pendientes de verificación de C.I.</div>`;
    } else {
        custContainer.innerHTML = pendingCustomers.map(u => `
            <div class="approval-card">
                <div class="approval-card-header">
                    <div class="approval-user-info">
                        <strong>${escapeHtml(u.nombre)}</strong>
                        <span style="font-size:0.75rem; color:var(--text-secondary);">${escapeHtml(u.email)}</span>
                    </div>
                    <span class="badge badge-pending">Pendiente</span>
                </div>
                <div class="approval-details-row">
                    <span>Nacimiento: ${u.fecha_nacimiento || 'N/A'}</span>
                    <span>Edad: ${u.fecha_nacimiento ? calculateAge(u.fecha_nacimiento) : 18} años</span>
                </div>
                <div style="display: flex; align-items:center; justify-content:space-between;">
                    <a class="file-view-trigger" onclick="openFileViewer('${u.ci_url || ''}', 'C.I. - ${escapeHtml(u.nombre)}', 'ci', ${u.id})"><i data-lucide="eye" style="width:14px;height:14px;"></i> Ver C.I.</a>
                    <div class="approval-actions">
                        <button class="btn btn-danger btn-sm" onclick="approveUser(${u.id}, 'rejected')">Rechazar</button>
                        <button class="btn btn-success btn-sm" onclick="approveUser(${u.id}, 'verified')">Aprobar</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    if (pendingRidersDocs.length === 0) {
        riderContainer.innerHTML = `<div style="color: var(--text-secondary); font-size: 0.9rem;">No hay expedientes de riders pendientes de aprobación.</div>`;
    } else {
        riderContainer.innerHTML = pendingRidersDocs.map(d => {
            const riderId = d.rider_id || d.id;
            const riderName = d.nombre || 'Rider';
            const riderEmail = d.email || '';

            return `
                <div class="approval-card">
                    <div class="approval-card-header">
                        <div class="approval-user-info">
                            <strong>${escapeHtml(riderName)}</strong>
                            <span style="font-size:0.75rem; color:var(--text-secondary);">${escapeHtml(riderEmail)}</span>
                        </div>
                        <span class="badge badge-pending">Expediente</span>
                    </div>
                    <div style="display: flex; flex-direction:column; gap:0.35rem; font-size: 0.85rem; border:1px solid var(--border-color); padding:0.5rem; border-radius:var(--radius-md); background: rgba(0,0,0,0.1);">
                        <a class="file-view-trigger" onclick="openFileViewer('${d.licencia_url}', 'Licencia de Conducir - ${escapeHtml(riderName)}', 'licencia', ${riderId})"><i data-lucide="file-text" style="width:14px;height:14px;"></i> Licencia de Conducir</a>
                        <a class="file-view-trigger" onclick="openFileViewer('${d.seguro_url}', 'Seguro SOAT - ${escapeHtml(riderName)}', 'seguro', ${riderId})"><i data-lucide="file-text" style="width:14px;height:14px;"></i> Seguro SOAT</a>
                        <a class="file-view-trigger" onclick="openFileViewer('${d.cv_url}', 'Currículum Vitae - ${escapeHtml(riderName)}', 'cv', ${riderId})"><i data-lucide="file-text" style="width:14px;height:14px;"></i> Currículum Vitae</a>
                    </div>
                    <div class="approval-actions" style="justify-content: flex-end;">
                        <button class="btn btn-danger btn-sm" onclick="approveRiderDocs(${riderId}, 'rechazado')">Rechazar</button>
                        <button class="btn btn-success btn-sm" onclick="approveRiderDocs(${riderId}, 'aprobado')">Aprobar Rider</button>
                    </div>
                </div>
            `;
        }).join('');
    }
    initLucide();
}

window.approveUser = async function(userId, status) {
    const mappedState = (status === 'verified' ? 'aprobado' : 'rechazado');

    try {
        const res = await apiPost('/Auth/admin_approval.php', {
            target_id: userId,
            tipo: 'user',
            estado: mappedState
        });
        if (res.ok) {
            showToast(`Cliente ${status === 'verified' ? 'aprobado' : 'rechazado'} en MySQL exitosamente.`, 'success');
            await renderAdminPendingApprovals();
            await renderAdminAllUsers();
        } else {
            showToast(`Error al procesar cliente: ${res.error || 'Operación rechazada.'}`, 'danger');
        }
    } catch (err) {
        console.error('Fallo llamada a /Auth/admin_approval.php:', err);
        showToast('Error de conexión con la API PHP al actualizar cliente.', 'danger');
    }
};

window.approveRiderDocs = async function(riderOrDocId, status) {
    const doc = (window._adminAllRiders || []).find(d => d.doc_id === riderOrDocId || d.rider_id === riderOrDocId);
    const targetRiderId = doc ? doc.rider_id : riderOrDocId;

    try {
        const res = await apiPost('/Auth/admin_approval.php', {
            target_id: targetRiderId,
            tipo: 'rider',
            estado: status
        });
        if (res.ok) {
            showToast(`Expediente de Rider ${status} en MySQL exitosamente.`, 'success');
            await renderAdminPendingApprovals();
            await renderAdminAllUsers();
        } else {
            showToast(`Error al procesar rider: ${res.error || 'Operación rechazada.'}`, 'danger');
        }
    } catch (err) {
        console.error('Fallo llamada a /Auth/admin_approval.php para rider:', err);
        showToast('Error de conexión con la API PHP al actualizar rider.', 'danger');
    }
};

window.resolveFileUrl = function(rawUrl, type = 'ci', userId = null) {
    if (!rawUrl && !userId) return '';
    
    // Si ya es una URL completa
    if (rawUrl && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:'))) {
        return rawUrl;
    }

    // Ruta base del host
    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    const hostBase = window.location.origin + basePath;

    // Usar el endpoint inteligente view_document.php
    let serviceUrl = `${hostBase}microservices/Auth/view_document.php`;
    const params = [];

    if (rawUrl) {
        params.push(`file=${encodeURIComponent(rawUrl)}`);
    }
    if (type) {
        params.push(`type=${encodeURIComponent(type)}`);
    }
    if (userId) {
        params.push(`user_id=${encodeURIComponent(userId)}`);
    }

    return `${serviceUrl}?${params.join('&')}`;
};

window.openFileViewer = function(fileUrl, title = 'Documento Oficial', type = 'ci', userId = null) {
    const modal = document.getElementById('fileViewerModal');
    const titleEl = document.getElementById('fileViewerTitle');
    const subtitleEl = document.getElementById('fileViewerSubtitle');
    const imgEl = document.getElementById('imgFileViewer');
    const pdfEl = document.getElementById('pdfFileViewer');
    const externalBtn = document.getElementById('btnFileViewerExternal');
    const iconEl = document.getElementById('fileViewerIcon');

    if (!modal) return;

    // Resolver URL dinámica
    const targetUrl = window.resolveFileUrl(fileUrl, type, userId);

    // Ajustar títulos
    if (titleEl) titleEl.innerText = title;
    if (subtitleEl) subtitleEl.innerText = `Burger 24/7 · Documento Digital Oficial`;
    if (externalBtn) externalBtn.href = targetUrl;

    // Determinar si es PDF
    const isPdf = (fileUrl && fileUrl.toLowerCase().includes('.pdf')) || (type === 'cv');

    if (isPdf) {
        if (imgEl) {
            imgEl.style.display = 'none';
            imgEl.src = '';
        }
        if (pdfEl) {
            pdfEl.style.display = 'block';
            pdfEl.src = targetUrl;
        }
        if (iconEl) iconEl.setAttribute('data-lucide', 'file-text');
    } else {
        if (pdfEl) {
            pdfEl.style.display = 'none';
            pdfEl.src = '';
        }
        if (imgEl) {
            imgEl.style.display = 'block';
            imgEl.src = targetUrl;
        }
        if (iconEl) iconEl.setAttribute('data-lucide', 'image');
    }

    modal.classList.add('active');
    initLucide();
};

// -------------------------------------------------------
// ADMIN: GESTIÓN COMPLETA DE USUARIOS (todos los estados)
// -------------------------------------------------------
async function renderAdminAllUsers() {
    const compList = document.getElementById('compradoresList');
    const riderListEl = document.getElementById('ridersList');
    if (!compList || !riderListEl) return;

    compList.innerHTML = '<div style="color:var(--text-secondary);padding:1rem;">Cargando compradores...</div>';
    riderListEl.innerHTML = '<div style="color:var(--text-secondary);padding:1rem;">Cargando riders...</div>';

    let compradores = [];
    let riders = [];

    // Fetch from backend
    try {
        const res = await apiGet('/Auth/admin_users.php');
        if (!res.ok) {
            compList.innerHTML = `<div class="api-error-card"><h4><i data-lucide="alert-triangle"></i> Error en la API PHP</h4><p>${escapeHtml(res.error || 'No se pudieron consultar los compradores.')}</p></div>`;
            riderListEl.innerHTML = `<div class="api-error-card"><h4><i data-lucide="alert-triangle"></i> Error en la API PHP</h4><p>${escapeHtml(res.error || 'No se pudieron consultar los riders.')}</p></div>`;
            initLucide();
            return;
        }
        if (res.data) {
            if (Array.isArray(res.data.compradores)) compradores = res.data.compradores;
            if (Array.isArray(res.data.riders)) riders = res.data.riders;
        }
    } catch (err) {
        console.error('Fallo GET /Auth/admin_users:', err);
        compList.innerHTML = `<div class="api-error-card"><h4><i data-lucide="alert-triangle"></i> Error de conexión con la API PHP</h4><p>No se pudo conectar con el servidor.</p></div>`;
        riderListEl.innerHTML = `<div class="api-error-card"><h4><i data-lucide="alert-triangle"></i> Error de conexión con la API PHP</h4><p>No se pudo conectar con el servidor.</p></div>`;
        initLucide();
        return;
    }

    // ---- CACHED data for filtering ----
    window._adminAllCompradores = compradores;
    window._adminAllRiders = riders;

    renderCompradoresList('all');
    renderRidersList('all');
    setupUsersFilterButtons();
    initLucide();
}

function getStatusBadge(status, isRider = false) {
    if (isRider) {
        if (status === 'aprobado') return '<span class="badge badge-verified">Habilitado</span>';
        if (status === 'rechazado') return '<span class="badge badge-rejected">Rechazado</span>';
        return '<span class="badge badge-pending">Pendiente</span>';
    }
    if (status === 'verified') return '<span class="badge badge-verified">Habilitado</span>';
    if (status === 'rejected') return '<span class="badge badge-rejected">Rechazado</span>';
    return '<span class="badge badge-pending">Pendiente</span>';
}

function renderCompradoresList(filter) {
    const el = document.getElementById('compradoresList');
    if (!el) return;
    const all = window._adminAllCompradores || [];
    const filtered = filter === 'all' ? all : all.filter(u => u.ci_status === filter);

    if (!filtered.length) {
        el.innerHTML = '<div style="color:var(--text-secondary);font-size:0.9rem;padding:0.5rem;">No hay clientes en este estado.</div>';
        return;
    }

    el.innerHTML = filtered.map(u => {
        const canEnable = u.ci_status !== 'verified';
        const canReject = u.ci_status !== 'rejected';
        return `<div class="approval-card">
            <div class="approval-card-header">
                <div class="approval-user-info">
                    <strong>${u.nombre}</strong>
                    <span style="font-size:0.75rem;color:var(--text-secondary);">${u.email}</span>
                </div>
                ${getStatusBadge(u.ci_status)}
            </div>
            <div class="approval-details-row">
                <span>Nacimiento: ${u.fecha_nacimiento || 'N/A'}</span>
                <span>ID #${u.id}</span>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between; margin-top:0.5rem;">
                <a class="file-view-trigger" onclick="openFileViewer('${u.ci_url || ''}', 'C.I. - ${escapeHtml(u.nombre)}', 'ci', ${u.id})"><i data-lucide="eye" style="width:14px;height:14px;"></i> Ver C.I.</a>
                <div class="approval-actions">
                    ${canReject ? `<button class="btn btn-danger btn-sm" onclick="adminUpdateUser(${u.id},'cliente','rejected')">Rechazar</button>` : ''}
                    ${canEnable ? `<button class="btn btn-success btn-sm" onclick="adminUpdateUser(${u.id},'cliente','verified')">Habilitar</button>` : ''}
                    ${!canReject && !canEnable ? '<span style="color:var(--text-secondary);font-size:0.8rem;">Sin cambios posibles</span>' : ''}
                </div>
            </div>
        </div>`;
    }).join('');
    initLucide();
}

function renderRidersList(filter) {
    const el = document.getElementById('ridersList');
    if (!el) return;
    const all = window._adminAllRiders || [];
    const filtered = filter === 'all' ? all : all.filter(r => r.estado_aprobacion === filter);

    if (!filtered.length) {
        el.innerHTML = '<div style="color:var(--text-secondary);font-size:0.9rem;padding:0.5rem;">No hay riders en este estado.</div>';
        return;
    }

    el.innerHTML = filtered.map(r => {
        const canApprove = r.estado_aprobacion !== 'aprobado';
        const canReject = r.estado_aprobacion !== 'rechazado';
        return `<div class="approval-card">
            <div class="approval-card-header">
                <div class="approval-user-info">
                    <strong>${escapeHtml(r.nombre)}</strong>
                    <span style="font-size:0.75rem;color:var(--text-secondary);">${escapeHtml(r.email)}</span>
                </div>
                ${getStatusBadge(r.estado_aprobacion, true)}
            </div>
            <div class="approval-details-row">
                <span>Nacimiento: ${r.fecha_nacimiento || 'N/A'}</span>
                <span>Rider ID #${r.rider_id}</span>
            </div>
            <div style="display:flex; flex-direction:column; gap:0.35rem; font-size:0.85rem; border:1px solid var(--border-color); padding:0.5rem; border-radius:var(--radius-md); background:rgba(0,0,0,0.1); margin-top:0.5rem;">
                <a class="file-view-trigger" onclick="openFileViewer('${r.licencia_url}','Licencia de Conducir - ${escapeHtml(r.nombre)}','licencia',${r.rider_id})"><i data-lucide="file-text" style="width:14px;height:14px;"></i> Licencia de Conducir</a>
                <a class="file-view-trigger" onclick="openFileViewer('${r.seguro_url}','Seguro SOAT - ${escapeHtml(r.nombre)}','seguro',${r.rider_id})"><i data-lucide="file-text" style="width:14px;height:14px;"></i> Seguro SOAT</a>
                <a class="file-view-trigger" onclick="openFileViewer('${r.cv_url}','Currículum Vitae - ${escapeHtml(r.nombre)}','cv',${r.rider_id})"><i data-lucide="file-text" style="width:14px;height:14px;"></i> Curriculum Vitae</a>
            </div>
            <div class="approval-actions" style="justify-content:flex-end; margin-top:0.5rem;">
                ${canReject ? `<button class="btn btn-danger btn-sm" onclick="adminUpdateUser(${r.rider_id},'rider','rechazado')">Rechazar</button>` : ''}
                ${canApprove ? `<button class="btn btn-success btn-sm" onclick="adminUpdateUser(${r.rider_id},'rider','aprobado')">Habilitar Rider</button>` : ''}
            </div>
        </div>`;
    }).join('');
    initLucide();
}

function setupUsersFilterButtons() {
    document.querySelectorAll('.users-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            const filter = btn.dataset.filter;
            // Update active class for this target's buttons
            document.querySelectorAll(`.users-filter-btn[data-target="${target}"]`).forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (target === 'compradores') renderCompradoresList(filter);
            else if (target === 'riders') renderRidersList(filter);
        });
    });
}

window.adminUpdateUser = async function(targetId, tipo, estado) {
    try {
        const res = await apiRequest('/Auth/admin_users.php', { method: 'PUT', data: { target_id: targetId, tipo, estado } });
        if (res.ok) {
            showToast('Estado actualizado en MySQL correctamente.', 'success');
            await renderAdminAllUsers();
            await renderAdminPendingApprovals();
        } else {
            showToast(`Aviso: ${res.error || 'No se pudo actualizar.'}`, 'danger');
        }
    } catch (err) {
        console.error('Fallo PUT /Auth/admin_users:', err);
        showToast('Error de conexión con la API PHP al actualizar usuario.', 'danger');
    }
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

async function syncProductsFromBackend() {
    // Always connected to Python server — sync catalog
    try {
        const res = await apiGet('/Catalog/catalog.php');
        if (res.ok && res.data && Array.isArray(res.data.productos)) {
            DB.productos = res.data.productos.map(p => ({
                id: parseInt(p.id, 10),
                categoria: p.categoria,
                nombre: p.nombre,
                marca: p.marca,
                sabor: p.sabor || '',
                precio: parseFloat(p.precio),
                stock: parseInt(p.stock, 10),
                created_at: p.created_at,
                updated_at: p.updated_at
            }));
            saveDatabase();
            renderProducts();
            if (document.getElementById('adminProductsTableBody')) {
                renderAdminProductsTable();
            }
        }
    } catch (err) {
        console.warn('Error sincronizando catálogo con backend:', err);
    }
}

async function handleProductFormSubmit(e) {
    e.preventDefault();
    const admin = currentSession.admin;

    const prodId = document.getElementById('txtProdId').value;
    const category = document.getElementById('txtProdCategory').value;
    const name = document.getElementById('txtProdName').value;
    const brand = document.getElementById('txtProdBrand').value;
    const flavor = document.getElementById('txtProdFlavor').value;
    const price = parseFloat(document.getElementById('txtProdPrice').value);
    const stock = parseInt(document.getElementById('txtProdStock').value);

    const token = getAuthToken();
    if (!token) {
        showToast('Error 401: No se encontró token JWT. Inicia sesión como administrador.', 'danger');
        return;
    }

    const isEdit = !!prodId;
    const payload = {
        categoria: category,
        nombre: name,
        marca: brand,
        sabor: flavor,
        precio: price,
        stock: stock
    };
    if (isEdit) payload.id = parseInt(prodId);

    try {
        const res = isEdit
            ? await apiPut('/Catalog/catalog.php', payload)
            : await apiPost('/Catalog/catalog.php', payload);

        if (res.status === 403) {
            showToast('Error 403: Permiso denegado. Solo administradores pueden modificar el catálogo.', 'danger');
            return;
        } else if (res.status === 401) {
            showToast('Error 401: Sesión no autorizada o expirada.', 'danger');
            return;
        } else if (!res.ok) {
            showToast('Error: ' + (res.error || 'No se pudo guardar el producto.'), 'danger');
            return;
        }

        showToast(isEdit ? 'Producto actualizado en MySQL exitosamente.' : 'Producto registrado en MySQL exitosamente.', 'success');
        resetProductForm();
        await syncProductsFromBackend();
    } catch (err) {
        console.error('Error conectando con catalog.php:', err);
        showToast('Error de conexión con la API PHP al guardar producto.', 'danger');
        showGlobalApiError('No se pudo guardar el producto en el catálogo.');
    }
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

window.deleteProduct = async function(productId) {
    const token = getAuthToken();
    if (!token) {
        showToast('Error 401: Se requiere sesión de administrador para eliminar.', 'danger');
        return;
    }

    try {
        const res = await apiDelete('/Catalog/catalog.php', { id: productId });

        if (res.status === 403) {
            showToast('Error 403: Permiso denegado. Solo administradores pueden eliminar productos.', 'danger');
            return;
        } else if (res.status === 401) {
            showToast('Error 401: Sesión no autorizada o expirada.', 'danger');
            return;
        } else if (!res.ok) {
            showToast('Error: ' + (res.error || 'No se pudo eliminar el producto.'), 'danger');
            return;
        }

        showToast('Producto eliminado de MySQL correctamente.', 'warning');
        await syncProductsFromBackend();
    } catch (err) {
        console.error('Error eliminando en catalog.php:', err);
        showToast('Error de conexión con la API PHP al eliminar producto.', 'danger');
        showGlobalApiError('No se pudo eliminar el producto del catálogo.');
    }
};

function resetProductForm() {
    document.getElementById('txtProdId').value = '';
    document.getElementById('adminProductForm').reset();
    document.getElementById('adminProductFormTitle').innerText = 'Agregar Nuevo Producto';
    document.getElementById('btnCancelEdit').style.display = 'none';
}

async function renderAdminAuditLogs() {
    const tbody = document.getElementById('auditTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:1.5rem; color:var(--text-secondary);">Cargando registros de auditoría desde MySQL...</td></tr>';

    try {
        const res = await apiGet('/Auth/audit_logs.php');
        if (!res.ok || !res.data) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:1.5rem; color:var(--accent-red);"><i data-lucide="alert-triangle"></i> Error al cargar logs de auditoría desde la API PHP.</td></tr>';
            initLucide();
            showGlobalApiError('Error al consultar auditoria_logs desde MySQL.');
            return;
        }

        const logs = res.data;
        if (!Array.isArray(logs) || logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:1.5rem; color:var(--text-secondary);">No hay registros de auditoría en la base de datos.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        logs.forEach(log => {
            const tr = document.createElement('tr');
            const nameUser = log.user_nombre ? `${log.user_nombre} (${log.user_role || 'usuario'})` : (log.created_by ? `User #${log.created_by}` : 'SYSTEM');

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
    } catch (err) {
        console.error('Error cargando audit logs:', err);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:1.5rem; color:var(--accent-red);"><i data-lucide="alert-triangle"></i> Error de red conectando con la API de auditoría.</td></tr>';
        initLucide();
        showGlobalApiError('Error de red al consultar auditoria_logs.');
    }
}

async function renderAdminReports() {
    const list = document.getElementById('riderLeaderboard');
    const elSales = document.getElementById('reportTotalSales');
    const elOrders = document.getElementById('reportTotalOrders');
    const elActiveRiders = document.getElementById('reportActiveRiders');
    const elQrVal = document.getElementById('chartQrVal');
    const elQrBar = document.getElementById('chartQrBar');
    const elCashVal = document.getElementById('chartCashVal');
    const elCashBar = document.getElementById('chartCashBar');

    try {
        const res = await apiGet('/Transactions/report.php');
        if (!res.ok || !res.data) {
            if (list) list.innerHTML = `<div class="api-error-card"><h4><i data-lucide="alert-triangle"></i> Error en Reportes</h4><p>${res.error || 'No se pudo obtener información del reporte desde la API PHP.'}</p></div>`;
            if (elSales) elSales.innerText = '---';
            if (elOrders) elOrders.innerText = '---';
            initLucide();
            showGlobalApiError('Error al consultar reportes financieros desde MySQL.');
            return;
        }

        const data = res.data;
        const resumen = data.resumen || {};
        if (elSales) elSales.innerText = `${parseFloat(resumen.total_ventas_bs || 0).toFixed(2)} Bs`;
        if (elOrders) elOrders.innerText = resumen.pedidos_entregados || 0;

        const ridersRanking = Array.isArray(data.ranking_riders) ? data.ranking_riders : [];
        if (elActiveRiders) elActiveRiders.innerText = ridersRanking.length;

        // Métodos de pago desde MySQL
        const metodos = Array.isArray(data.metodos_pago) ? data.metodos_pago : [];
        let qrSum = 0;
        let cashSum = 0;

        metodos.forEach(m => {
            const totalMonto = parseFloat(m.monto_total || 0);
            if (m.estado_pago === 'pagado_qr') {
                qrSum += totalMonto;
            } else if (['pagado_efectivo', 'contraentrega', 'liquidado'].includes(m.estado_pago)) {
                cashSum += totalMonto;
            }
        });

        const totalPayments = qrSum + cashSum;
        const qrPct = totalPayments > 0 ? (qrSum / totalPayments) * 100 : 0;
        const cashPct = totalPayments > 0 ? (cashSum / totalPayments) * 100 : 0;

        if (elQrVal) elQrVal.innerText = `${qrSum.toFixed(2)} Bs (${Math.round(qrPct)}%)`;
        if (elQrBar) elQrBar.style.width = `${qrPct}%`;
        if (elCashVal) elCashVal.innerText = `${cashSum.toFixed(2)} Bs (${Math.round(cashPct)}%)`;
        if (elCashBar) elCashBar.style.width = `${cashPct}%`;

        // Ranking de riders desde MySQL
        if (list) {
            if (ridersRanking.length === 0) {
                list.innerHTML = `<div style="text-align: center; color: var(--text-secondary); font-size: 0.9rem; padding: 1rem;">No hay registros de riders activos en entregas en MySQL.</div>`;
            } else {
                list.innerHTML = ridersRanking.map((rider, idx) => `
                    <li class="leaderboard-item">
                        <span class="rider-rank ${idx === 0 ? 'rider-rank-1' : ''}">${idx + 1}</span>
                        <div class="rider-info-main">
                            <div class="rider-name-lead">${rider.nombre}</div>
                            <div class="rider-orders-lead">${rider.entregas_exitosas || 0} entregas completadas</div>
                        </div>
                        <span class="rider-earnings-lead">${parseFloat(rider.recaudacion_total || 0).toFixed(2)} Bs Recaudados</span>
                    </li>
                `).join('');
            }
        }
    } catch (err) {
        console.error('Error cargando reportes desde API:', err);
        if (list) list.innerHTML = `<div class="api-error-card"><h4><i data-lucide="wifi-off"></i> Fallo de Conexión</h4><p>No se pudo conectar con el microservicio report.php.</p></div>`;
        if (elSales) elSales.innerText = '---';
        if (elOrders) elOrders.innerText = '---';
        initLucide();
        showGlobalApiError('Error de red al consultar reportes financieros.');
    }
}

// ----------------------------------------------------
// 12. ADMIN LIVE MONITORING & CASH SETTLEMENTS
// ----------------------------------------------------
function calculateRiderInterpolatedPosition(latStore, lonStore, latClient, lonClient, progress = 0.5) {
    const t = Math.max(0, Math.min(1, progress));
    return {
        lat: latStore + t * (latClient - latStore),
        lon: lonStore + t * (lonClient - lonStore)
    };
}

function stopAdminMonitoringPolling() {
    if (adminMonitoringIntervalId) {
        clearInterval(adminMonitoringIntervalId);
        adminMonitoringIntervalId = null;
    }
}

async function fetchAndUpdateAdminMonitoring() {
    const listActive = document.getElementById('adminLiveOrdersList');
    const listSettlements = document.getElementById('adminRiderSettlementsList');
    if (!listActive || !listSettlements) return;

    try {
        const res = await apiGet('/Transactions/live_monitoring.php');
        if (!res.ok || !res.data) {
            listActive.innerHTML = `<div class="api-error-card"><h4><i data-lucide="alert-triangle"></i> Error en Monitoreo</h4><p>${res.error || 'No se pudo obtener el monitoreo en vivo de la API PHP.'}</p></div>`;
            listSettlements.innerHTML = `<div class="api-error-card"><h4><i data-lucide="alert-triangle"></i> Error en Liquidaciones</h4><p>No se pudo conectar con la API de liquidaciones.</p></div>`;
            initLucide();
            showGlobalApiError('Error al consultar live_monitoring.php desde MySQL.');
            initAdminMonitoringMap(null);
            return;
        }

        const activeOrders = res.data.pedidos_activos || [];
        const settlements = res.data.liquidaciones_pendientes || [];
        adminMonitoringCachedOrders = activeOrders;
        renderAdminMonitoringUI(activeOrders, settlements);
    } catch (err) {
        console.error('Error en live_monitoring.php:', err);
        listActive.innerHTML = `<div class="api-error-card"><h4><i data-lucide="wifi-off"></i> Fallo de Red</h4><p>Error de conexión al consultar el monitoreo de pedidos.</p></div>`;
        listSettlements.innerHTML = `<div class="api-error-card"><h4><i data-lucide="wifi-off"></i> Fallo de Red</h4><p>Error de conexión con la API PHP.</p></div>`;
        initLucide();
        showGlobalApiError('Error de red al consultar monitoreo en vivo.');
        initAdminMonitoringMap(null);
    }
}

function renderAdminMonitoringUI(activeOrders, settlements) {
    const listActive = document.getElementById('adminLiveOrdersList');
    const listSettlements = document.getElementById('adminRiderSettlementsList');
    if (!listActive || !listSettlements) return;

    if (activeOrders.length === 0) {
        listActive.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 2rem;">No hay despachos ni envíos en camino activos.</div>`;
        selectedAdminMonitoringOrderId = null;
        initAdminMonitoringMap(null);
    } else {
        listActive.innerHTML = activeOrders.map(p => {
            const clientUser = (DB.users || []).find(usr => usr.id === p.cliente_id);
            const riderUser = (DB.users || []).find(usr => usr.id === p.rider_id);
            const clientName = p.cliente_nombre || (clientUser ? clientUser.nombre : 'Anónimo');
            const riderName = p.rider_nombre || (riderUser ? riderUser.nombre : 'Sin Asignar');

            let itemsText = '';
            if (p.detalles && Array.isArray(p.detalles) && p.detalles.length > 0) {
                itemsText = p.detalles.map(d => `${d.cantidad}x ${d.producto_nombre || 'Producto'}`).join(', ');
            } else {
                const items = (DB.pedido_detalles || []).filter(d => d.pedido_id === p.id);
                itemsText = items.map(d => {
                    const prod = (DB.productos || []).find(pr => pr.id === d.producto_id);
                    return `${d.cantidad}x ${prod ? prod.nombre : 'Producto'}`;
                }).join(', ');
            }

            const etaInfo = p.eta_minutos ? ` • ETA: ~${p.eta_minutos} min (${p.distancia_km} km)` : '';

            return `
                <div class="order-card" id="adminOrderCard_${p.id}" style="border-color: ${selectedAdminMonitoringOrderId === p.id ? 'var(--accent-purple)' : 'var(--border-color)'}">
                    <div class="order-card-header">
                        <span class="order-id">Pedido #${p.id} - ${p.estado_pedido.toUpperCase()}${etaInfo}</span>
                        <span class="badge ${p.estado_pago === 'pagado_qr' ? 'badge-verified' : 'badge-pending'}">${p.estado_pago ? p.estado_pago.replace('_', ' ') : 'Pendiente'}</span>
                    </div>
                    <div style="font-size:0.85rem; margin-bottom: 0.75rem;">
                        <p><strong>Cliente:</strong> ${clientName}</p>
                        <p><strong>Repartidor:</strong> ${riderName}</p>
                        <p><strong>Detalles:</strong> ${itemsText || 'Sin detalles'}</p>
                        <p><strong>Monto:</strong> ${parseFloat(p.total).toFixed(2)} Bs</p>
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
        initAdminMonitoringMap(selectedAdminMonitoringOrderId, activeOrders);
    }

    if (settlements.length === 0) {
        listSettlements.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">Todos los Riders están al día con sus liquidaciones de caja.</div>`;
    } else {
        listSettlements.innerHTML = settlements.map(r => `
            <li class="leaderboard-item" style="border-left: 3px solid var(--accent-amber); border-radius: 0 var(--radius-md) var(--radius-md) 0;">
                <div class="rider-info-main">
                    <div class="rider-name-lead">${r.nombre}</div>
                    <div class="rider-orders-lead">${r.pedidos_pendientes || 0} cobros en efectivo pendientes de liquidación</div>
                </div>
                <div style="display:flex; align-items:center; gap:1rem;">
                    <span class="rider-earnings-lead" style="color:var(--accent-amber);">${parseFloat(r.total_recaudado_bs).toFixed(2)} Bs</span>
                    <button class="btn btn-primary btn-sm" onclick="settleRiderCash(${r.id})">Liquidar Caja</button>
                </div>
            </li>
        `).join('');
    }
}

function renderAdminMonitoring() {
    stopAdminMonitoringPolling();
    fetchAndUpdateAdminMonitoring();
    adminMonitoringIntervalId = setInterval(fetchAndUpdateAdminMonitoring, 10000);
}

window.selectAdminOrderToTrack = function(orderId) {
    selectedAdminMonitoringOrderId = orderId;
    document.querySelectorAll('#adminLiveOrdersList .order-card').forEach(card => {
        card.style.borderColor = 'var(--border-color)';
    });
    const selectedCard = document.getElementById(`adminOrderCard_${orderId}`);
    if (selectedCard) {
        selectedCard.style.borderColor = 'var(--accent-purple)';
    }
    initAdminMonitoringMap(orderId, adminMonitoringCachedOrders);
};

window.cancelAdminOrder = async function(orderId) {
    try {
        const res = await apiPost('/Transactions/cancel_order.php', { pedido_id: orderId });
        if (!res.ok) {
            showToast(`Error al cancelar: ${res.error || 'Cancelación rechazada.'}`, 'danger');
            showGlobalApiError('No se pudo cancelar el pedido en el backend.');
            return;
        }
        showToast(`Pedido #${orderId} cancelado en el backend y stock reembolsado.`, 'warning');
        await fetchAndUpdateAdminMonitoring();
        await syncProductsFromBackend();
    } catch (err) {
        console.error('Error cancelando pedido en backend:', err);
        showToast('Error de red al cancelar el pedido.', 'danger');
        showGlobalApiError('Error de conexión al cancelar pedido.');
    }
};

window.settleRiderCash = async function(riderId) {
    try {
        const res = await apiPost('/Rider/settle_cash.php', { rider_id: riderId });
        if (res.status === 403) {
            showToast('Error 403: Permiso denegado. Solo administradores pueden liquidar cajas.', 'danger');
            return;
        } else if (!res.ok) {
            showToast(`Error al liquidar caja: ${res.error || 'Error desconocido'}`, 'danger');
            showGlobalApiError('No se pudo liquidar la caja del repartidor en MySQL.');
            return;
        }
        showToast(`Liquidación completada en backend. Recaudados ${res.data?.total_liquidado_bs || 0} Bs del rider.`, 'success');
        await fetchAndUpdateAdminMonitoring();
    } catch (err) {
        console.error('Error en settle_cash.php:', err);
        showToast('Error de conexión con la API PHP al liquidar caja.', 'danger');
        showGlobalApiError('Error de red al liquidar caja del repartidor.');
    }
};

function initAdminMonitoringMap(orderId, ordersList = null) {
    setTimeout(() => {
        const mapContainer = document.getElementById('adminMonitoringMap');
        if (!mapContainer) return;

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
                    html: '<div style="background:#8b5cf6; width:14px; height:14px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #8b5cf6;"></div>',
                    iconSize: [14, 14],
                    iconAnchor: [7, 7]
                })
            }).addTo(adminMonitoringMapInstance).bindPopup("<b>Burger 24/7 Central Sopocachi</b><br>Cocina & Despacho");
        }

        adminMonitoringMapInstance.invalidateSize();

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

        if (orderId === null || orderId === undefined) {
            adminMonitoringMapInstance.setView([STORE_COORDS.lat, STORE_COORDS.lon], 14);
            return;
        }

        const orders = ordersList || adminMonitoringCachedOrders || DB.pedidos || [];
        const order = orders.find(p => p.id === orderId);
        if (!order) return;

        const latCliente = parseFloat(order.latitud) || -16.5090;
        const lonCliente = parseFloat(order.longitud) || -68.1340;
        const clientName = order.cliente_nombre || 'Cliente Destino';
        const riderName = order.rider_nombre || 'Rider';

        adminMonitoringMarkerClient = L.marker([latCliente, lonCliente], {
            icon: L.divIcon({
                className: 'node-client-wrap',
                html: '<div style="background:#f59e0b; width:14px; height:14px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #f59e0b;"></div>',
                iconSize: [14, 14],
                iconAnchor: [7, 7]
            })
        }).addTo(adminMonitoringMapInstance);
        adminMonitoringMarkerClient.bindPopup(`<b>Cliente: ${clientName}</b><br>Pedido #${order.id}`);

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
        adminMonitoringMapInstance.fitBounds(bounds, { padding: [35, 35] });

        let riderLat = STORE_COORDS.lat;
        let riderLon = STORE_COORDS.lon;

        if (order.posicion_rider && typeof order.posicion_rider.lat === 'number' && typeof order.posicion_rider.lon === 'number') {
            riderLat = order.posicion_rider.lat;
            riderLon = order.posicion_rider.lon;
        } else if (order.estado_pedido === 'en_camino') {
            const interpolated = calculateRiderInterpolatedPosition(STORE_COORDS.lat, STORE_COORDS.lon, latCliente, lonCliente, 0.5);
            riderLat = interpolated.lat;
            riderLon = interpolated.lon;
        }

        adminMonitoringMarkerRider = L.marker([riderLat, riderLon], {
            icon: L.divIcon({
                className: 'node-rider-wrap',
                html: `<div style="background:#10b981; width:18px; height:18px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 10px #10b981; display:flex; align-items:center; justify-content:center; color:#fff; font-size:10px;">🛵</div>`,
                iconSize: [18, 18],
                iconAnchor: [9, 9]
            })
        }).addTo(adminMonitoringMapInstance);
        adminMonitoringMarkerRider.bindPopup(`<b>Rider: ${riderName}</b><br>Estado: ${order.estado_pedido.toUpperCase()}`);

        adminMonitoringMapInstance.invalidateSize();
    }, 150);
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

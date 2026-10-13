// app.js
/**
 * ============================================================================
 * 📱 EXPLICACIÓN FÁCIL: LA TABLET MÁGICA Y PANTALLA PRINCIPAL (FRONTEND SPA)
 * ============================================================================
 * ¿Para qué sirve este archivo?
 * Es el cerebro de la pantalla interactiva. Aquí ocurre toda la diversión visual:
 *  1. 🍔 La Lupa del Menú (renderProducts): Muestra las hamburguesas y busca al escribir.
 *  2. 🛒 La Mochila de Compras (cart): Guarda lo que quieres pedir y suma el precio.
 *  3. 🗺️ El Mapa GPS de La Paz (Leaflet & OSRM): Traza la ruta real por las calles paceñas.
 *  4. 🛵 El Panel del Repartidor: Donde la moto acepta pedidos y los marca como entregados.
 *  5. 👑 El Panel del Administrador: Donde el jefe ve las motos en vivo y cuenta el dinero.
 * ============================================================================
 */

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

// Geolocation of Store (Dinámica desde base de datos MySQL)
const STORE_COORDS = {
    lat: -16.5050,
    lon: -68.1290,
    nombre: 'Burger 24/7',
    sucursal: 'Central Sopocachi',
    direccion: 'Av. 20 de Octubre #2150, Sopocachi, La Paz',
    zona: 'Sopocachi',
    telefono: '+591 71523481'
};

async function syncStoreConfigFromBackend() {
    try {
        const res = await apiGet('/Transactions/store_config.php');
        if (res && res.ok && res.data && res.data.tienda) {
            const t = res.data.tienda;
            STORE_COORDS.lat = parseFloat(t.latitud) || -16.5050;
            STORE_COORDS.lon = parseFloat(t.longitud) || -68.1290;
            STORE_COORDS.nombre = t.nombre_tienda || 'Burger 24/7';
            STORE_COORDS.sucursal = t.sucursal || 'Central Sopocachi';
            STORE_COORDS.direccion = t.direccion || 'Av. 20 de Octubre #2150, Sopocachi, La Paz';
            STORE_COORDS.zona = t.zona || 'Sopocachi';
            STORE_COORDS.telefono = t.telefono || '+591 71523481';
            updateAdminStorePreview();
        }
    } catch (e) {
        console.warn('No se pudo sincronizar la configuración de la tienda:', e);
    }
}

function updateAdminStorePreview() {
    const pNom = document.getElementById('previewAdminStoreNombre');
    const pSuc = document.getElementById('previewAdminStoreSucursal');
    const pDir = document.getElementById('previewAdminStoreDireccion');
    const pZon = document.getElementById('previewAdminStoreZona');
    const pTel = document.getElementById('previewAdminStoreTelefono');
    const pCoo = document.getElementById('previewAdminStoreCoords');

    if (pNom) pNom.innerText = STORE_COORDS.nombre;
    if (pSuc) pSuc.innerText = STORE_COORDS.sucursal;
    if (pDir) pDir.innerText = STORE_COORDS.direccion;
    if (pZon) pZon.innerText = STORE_COORDS.zona;
    if (pTel) pTel.innerText = STORE_COORDS.telefono;
    if (pCoo) pCoo.innerText = `${STORE_COORDS.lat.toFixed(4)}, ${STORE_COORDS.lon.toFixed(4)}`;

    const inNom = document.getElementById('adminStoreNombre');
    const inSuc = document.getElementById('adminStoreSucursal');
    const inDir = document.getElementById('adminStoreDireccion');
    const inZon = document.getElementById('adminStoreZona');
    const inTel = document.getElementById('adminStoreTelefono');
    const inLat = document.getElementById('adminStoreLat');
    const inLon = document.getElementById('adminStoreLon');

    if (inNom && !inNom.value) inNom.value = STORE_COORDS.nombre;
    if (inSuc && !inSuc.value) inSuc.value = STORE_COORDS.sucursal;
    if (inDir && !inDir.value) inDir.value = STORE_COORDS.direccion;
    if (inZon && !inZon.value) inZon.value = STORE_COORDS.zona;
    if (inTel && !inTel.value) inTel.value = STORE_COORDS.telefono;
    if (inLat && !inLat.value) inLat.value = STORE_COORDS.lat;
    if (inLon && !inLon.value) inLon.value = STORE_COORDS.lon;
}

window.handleAdminStoreZoneChange = function(val) {
    if (!val || val === 'personalizado') return;
    const parts = val.split('|');
    if (parts.length >= 3) {
        const zona = parts[0];
        const lat = parseFloat(parts[1]);
        const lon = parseFloat(parts[2]);
        const inLat = document.getElementById('adminStoreLat');
        const inLon = document.getElementById('adminStoreLon');
        const inZon = document.getElementById('adminStoreZona');
        if (inLat) inLat.value = lat;
        if (inLon) inLon.value = lon;
        if (inZon) inZon.value = zona;
        const pCoo = document.getElementById('previewAdminStoreCoords');
        if (pCoo) pCoo.innerText = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        const pZon = document.getElementById('previewAdminStoreZona');
        if (pZon) pZon.innerText = zona;
    }
};

window.renderAdminStoreConfig = async function() {
    await syncStoreConfigFromBackend();
    const inNom = document.getElementById('adminStoreNombre');
    const inSuc = document.getElementById('adminStoreSucursal');
    const inDir = document.getElementById('adminStoreDireccion');
    const inZon = document.getElementById('adminStoreZona');
    const inTel = document.getElementById('adminStoreTelefono');
    const inLat = document.getElementById('adminStoreLat');
    const inLon = document.getElementById('adminStoreLon');

    if (inNom) inNom.value = STORE_COORDS.nombre;
    if (inSuc) inSuc.value = STORE_COORDS.sucursal;
    if (inDir) inDir.value = STORE_COORDS.direccion;
    if (inZon) inZon.value = STORE_COORDS.zona;
    if (inTel) inTel.value = STORE_COORDS.telefono;
    if (inLat) inLat.value = STORE_COORDS.lat;
    if (inLon) inLon.value = STORE_COORDS.lon;

    updateAdminStorePreview();
};

window.handleSaveAdminStoreConfig = async function(event) {
    if (event) event.preventDefault();

    const nombreEl = document.getElementById('adminStoreNombre');
    const sucursalEl = document.getElementById('adminStoreSucursal');
    const dirEl = document.getElementById('adminStoreDireccion');
    const zonaEl = document.getElementById('adminStoreZona');
    const telEl = document.getElementById('adminStoreTelefono');
    const latEl = document.getElementById('adminStoreLat');
    const lonEl = document.getElementById('adminStoreLon');

    const nombre = nombreEl ? nombreEl.value.trim() : '';
    const sucursal = (sucursalEl && sucursalEl.value.trim()) ? sucursalEl.value.trim() : (STORE_COORDS.sucursal || 'Central Sopocachi');
    const direccion = dirEl ? dirEl.value.trim() : '';
    const zona = (zonaEl && zonaEl.value.trim()) ? zonaEl.value.trim() : (STORE_COORDS.zona || 'Sopocachi');
    const telefono = telEl ? telEl.value.trim() : '';
    let lat = latEl ? parseFloat(latEl.value) : NaN;
    let lon = lonEl ? parseFloat(lonEl.value) : NaN;

    if (!nombre || !direccion) {
        showToast('El nombre del restaurante y la dirección física son obligatorios.', 'warning');
        return;
    }
    if (isNaN(lat) || isNaN(lon)) {
        lat = STORE_COORDS.lat || -16.5050;
        lon = STORE_COORDS.lon || -68.1290;
        if (latEl) latEl.value = lat;
        if (lonEl) lonEl.value = lon;
    }

    const btn = document.getElementById('btnSaveAdminStore');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Guardando...';
    }

    try {
        const res = await apiPost('/Transactions/store_config.php', {
            nombre_tienda: nombre,
            sucursal: sucursal,
            direccion: direccion,
            zona: zona,
            latitud: lat,
            longitud: lon,
            telefono: telefono
        });

        if (!res.ok) {
            showToast(`Error: ${res.error || 'No se pudo guardar la ubicación del restaurante.'}`, 'danger');
            return;
        }

        STORE_COORDS.nombre = nombre;
        STORE_COORDS.sucursal = sucursal;
        STORE_COORDS.direccion = direccion;
        STORE_COORDS.zona = zona;
        STORE_COORDS.lat = lat;
        STORE_COORDS.lon = lon;
        STORE_COORDS.telefono = telefono;

        updateAdminStorePreview();
        showToast('¡Ubicación y sede del restaurante guardadas exitosamente!', 'success');
    } catch (e) {
        console.error('Error guardando store config:', e);
        showToast('Fallo de red al conectar con el servidor.', 'danger');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="save"></i> Guardar Ubicación del Restaurante';
            initLucide();
        }
    }
};

// Delimitación geográfica de La Paz, Bolivia (Evita salirse del área metropolitana)
const LA_PAZ_BOUNDS = [
    [-16.5900, -68.2300], // Suroeste (Sur / Ceja)
    [-16.4400, -68.0300]  // Noreste (Norte / Achumani / Casco Central)
];

// ============================================================================
// 🗺️ CATÁLOGO DE HITOS, AVENIDAS Y PLAZAS DE LA PAZ (BÚSQUEDA TIPO GOOGLE MAPS)
// ============================================================================
const LA_PAZ_LANDMARKS = [
    { name: "Plaza Abaroa", street: "Av. 20 de Octubre y Pedro Salazar", zone: "Sopocachi", lat: -16.5090, lon: -68.1340, keywords: ["abaroa", "sopocachi", "octubre", "pedro salazar", "belisario salinas"] },
    { name: "Av. 20 de Octubre", street: "Av. 20 de Octubre #2150", zone: "Sopocachi", lat: -16.5050, lon: -68.1290, keywords: ["octubre", "20 de octubre", "sopocachi", "avenida", "guachalla"] },
    { name: "Plaza España", street: "Calle Víctor Sanjinés y Presbítero Medina", zone: "Sopocachi", lat: -16.5135, lon: -68.1325, keywords: ["españa", "sopocachi", "sanjines", "teleferico amarillo", "monticulo"] },
    { name: "El Montículo", street: "Paseo de El Montículo, Calle Presley", zone: "Sopocachi", lat: -16.5140, lon: -68.1295, keywords: ["monticulo", "parque", "sopocachi", "mirador"] },
    { name: "Av. 6 de Agosto", street: "Av. 6 de Agosto #2430", zone: "Sopocachi", lat: -16.5085, lon: -68.1280, keywords: ["6 de agosto", "agosto", "sopocachi", "san jorge", "campos"] },
    { name: "El Prado (Paseo del Prado)", street: "Av. 16 de Julio #1440", zone: "Centro", lat: -16.4985, lon: -68.1335, keywords: ["prado", "16 de julio", "centro", "estudiante", "monje campero", "colombia"] },
    { name: "Plaza del Estudiante", street: "Av. Villazón y Av. 16 de Julio", zone: "Centro", lat: -16.5040, lon: -68.1310, keywords: ["estudiante", "monolito", "villazon", "umsa", "centro", "universidad"] },
    { name: "Plaza Murillo", street: "Calle Comercio y Socabaya", zone: "Casco Urbano Central", lat: -16.4955, lon: -68.1330, keywords: ["murillo", "palacio quemado", "congreso", "comercio", "catedral", "gobierno"] },
    { name: "Basílica de San Francisco", street: "Plaza Mayor San Francisco / Av. Mariscal Santa Cruz", zone: "Centro Histórico", lat: -16.4965, lon: -68.1370, keywords: ["san francisco", "sagarnaga", "santa cruz", "iglesia", "perez velasco"] },
    { name: "Calle Sagárnaga", street: "Calle Sagárnaga #220", zone: "San Francisco", lat: -16.4975, lon: -68.1385, keywords: ["sagarnaga", "brujas", "artesanias", "linares", "san francisco"] },
    { name: "Plaza Sucre (San Pedro)", street: "Calle Colombia y Nicolás Acosta", zone: "San Pedro", lat: -16.5015, lon: -68.1375, keywords: ["san pedro", "sucre", "colombia", "nicolas acosta", "mercado san pedro"] },
    { name: "Plaza Triangular", street: "Av. Saavedra y Calle Díaz Romero", zone: "Miraflores", lat: -16.5045, lon: -68.1205, keywords: ["triangular", "miraflores", "saavedra", "teleferico blanco", "diaz romero"] },
    { name: "Estadio Hernando Siles", street: "Av. Simón Bolívar y Av. Saavedra", zone: "Miraflores", lat: -16.4990, lon: -68.1225, keywords: ["siles", "estadio", "miraflores", "bolivar", "curva sur", "curva norte"] },
    { name: "Av. Busch", street: "Av. Busch #1320", zone: "Miraflores", lat: -16.5020, lon: -68.1190, keywords: ["busch", "avenida busch", "miraflores", "monumento busch", "villalobos"] },
    { name: "Hospital de Clínicas", street: "Av. Saavedra #2240", zone: "Miraflores", lat: -16.5065, lon: -68.1200, keywords: ["hospital", "clinicas", "complejo hospitalario", "saavedra", "miraflores"] },
    { name: "Av. Arce (Multicine)", street: "Av. Arce #2631", zone: "San Jorge", lat: -16.5125, lon: -68.1245, keywords: ["arce", "multicine", "san jorge", "embajada", "plaza isabel", "goitia"] },
    { name: "Plaza Isabel La Católica", street: "Av. Arce y Calle Pedro Salazar", zone: "San Jorge", lat: -16.5110, lon: -68.1265, keywords: ["isabel", "catolica", "san jorge", "puente gemelo", "arce"] },
    { name: "Teleférico Celeste San Jorge", street: "Av. del Poeta", zone: "San Jorge", lat: -16.5105, lon: -68.1250, keywords: ["celeste", "teleferico", "del poeta", "san jorge", "curva holguin"] },
    { name: "Obrajes Calle 17", street: "Av. Hernando Siles #5420, Calle 17", zone: "Obrajes", lat: -16.5280, lon: -68.1120, keywords: ["obrajes", "calle 17", "hernando siles", "zona sur", "puente calacoto"] },
    { name: "Obrajes Calle 6 (Plaza 16 de Julio)", street: "Av. Hernando Siles y Calle 6", zone: "Obrajes", lat: -16.5210, lon: -68.1180, keywords: ["obrajes", "calle 6", "16 de julio", "plaza obrajes", "siles"] },
    { name: "Calacoto San Miguel", street: "Av. Montenegro y Calle 21 de Calacoto", zone: "Calacoto", lat: -16.5410, lon: -68.0860, keywords: ["san miguel", "calacoto", "montenegro", "calle 21", "comercio sur", "pancara"] },
    { name: "Calacoto Calle 21", street: "Av. Ballivián #1580, Calle 21", zone: "Calacoto", lat: -16.5390, lon: -68.0875, keywords: ["calle 21", "ballivian", "calacoto", "iglesia san miguel"] },
    { name: "Calacoto Calle 8", street: "Av. Ballivián y Calle 8", zone: "Calacoto", lat: -16.5330, lon: -68.0930, keywords: ["calle 8", "ballivian", "calacoto", "zona sur", "teleferico verde"] },
    { name: "Achumani (Av. Alexander)", street: "Av. García Lanza y Av. Alexander #320", zone: "Achumani", lat: -16.5385, lon: -68.0670, keywords: ["achumani", "alexander", "garcia lanza", "the strongest", "calle 11"] },
    { name: "Irpavi Megacenter", street: "Av. Rafael Pabón #100", zone: "Irpavi", lat: -16.5315, lon: -68.0815, keywords: ["megacenter", "irpavi", "cine", "pabon", "colegio militar", "teleferico verde"] },
    { name: "Cota Cota Calle 30 (UMSA)", street: "Av. Muñoz Reyes y Calle 30", zone: "Cota Cota", lat: -16.5440, lon: -68.0665, keywords: ["cota cota", "calle 30", "umsa", "campus", "muñoz reyes", "laguna"] },
    { name: "Los Pinos", street: "Av. José María Aguirre Acha", zone: "Los Pinos", lat: -16.5360, lon: -68.0770, keywords: ["los pinos", "plaza pinos", "aguirre acha", "zona sur"] },
    { name: "Chasquipampa Calle 50", street: "Av. Principal #450, Calle 50", zone: "Chasquipampa", lat: -16.5480, lon: -68.0580, keywords: ["chasquipampa", "calle 50", "principal", "sur", "pedregal"] },
    { name: "Villa Fátima (Plaza del Maestro)", street: "Av. Las Américas #840", zone: "Villa Fátima", lat: -16.4810, lon: -68.1170, keywords: ["villa fatima", "maestro", "americas", "yungas", "terminal minasa"] },
    { name: "Tembladerani", street: "Calle Castrillo y Av. Buenos Aires", zone: "Tembladerani", lat: -16.5110, lon: -68.1450, keywords: ["tembladerani", "bolivar", "cancha", "castrillo", "mercado"] },
    { name: "Cementerio General", street: "Av. Baptista y Av. Entre Ríos", zone: "Cementerio", lat: -16.4920, lon: -68.1475, keywords: ["cementerio", "baptista", "entre rios", "teleferico rojo"] },
    { name: "Alto Obrajes", street: "Av. Del Maestro, Sector A", zone: "Alto Obrajes", lat: -16.5180, lon: -68.1090, keywords: ["alto obrajes", "piscina olimpica", "del maestro", "sector a", "escuela militar"] },
    { name: "Mallasa (Valle de la Luna)", street: "Av. Hernando Siles / Carretera a Mallasa", zone: "Mallasa", lat: -16.5680, lon: -68.0920, keywords: ["mallasa", "valle de la luna", "zoologico", "rio abajo", "golf"] },
    { name: "La Florida (Plaza Humboldt)", street: "Calle 8 de Calacoto y Av. Arequipa", zone: "La Florida", lat: -16.5335, lon: -68.0910, keywords: ["florida", "humboldt", "arequipa", "sur"] },
    { name: "Següencoma", street: "Av. Costanera y Calle Las Palmeras", zone: "Bajo Següencoma", lat: -16.5260, lon: -68.1030, keywords: ["seguencoma", "costanera", "palmeras", "sur", "gramadal"] },
    { name: "Pampahasi", street: "Av. Circunvalación #1020", zone: "Pampahasi", lat: -16.4980, lon: -68.0980, keywords: ["pampahasi", "circunvalacion", "este", "samapa"] },
    { name: "Villa Copacabana", street: "Av. Tito Yupanqui #450", zone: "Villa Copacabana", lat: -16.4910, lon: -68.1060, keywords: ["copacabana", "yupanqui", "plaza mercado", "este"] },
    { name: "Av. Buenos Aires", street: "Av. Buenos Aires #720", zone: "Max Paredes", lat: -16.4990, lon: -68.1460, keywords: ["buenos aires", "max paredes", "uyustus", "tumusla", "garita de lima"] }
];

/**
 * Motor de búsqueda híbrido estilo Google Maps para La Paz:
 * 1. Matching instantáneo (0ms) en catálogo local de 38+ zonas e hitos paceños.
 * 2. Consulta asíncrona a OpenStreetMap Nominatim para números de puerta y calles no catalogadas.
 */
async function searchLaPazAddresses(query) {
    if (!query || typeof query !== 'string') return [];
    const q = query.trim().toLowerCase();
    if (q.length === 0) return [];

    const results = [];
    const seen = new Set();
    const qTokens = q.split(/\s+/).filter(t => t.length > 1);

    // 1. Filtrado local inmediato
    for (const lm of LA_PAZ_LANDMARKS) {
        const fullSearchText = `${lm.name} ${lm.street} ${lm.zone} ${lm.keywords.join(' ')}`.toLowerCase();
        let matches = false;
        if (qTokens.length > 0) {
            matches = qTokens.every(token => fullSearchText.includes(token));
        } else {
            matches = fullSearchText.includes(q);
        }

        if (matches) {
            const dist = haversine(STORE_COORDS.lat, STORE_COORDS.lon, lm.lat, lm.lon);
            const key = `${lm.lat.toFixed(4)},${lm.lon.toFixed(4)}`;
            if (!seen.has(key)) {
                seen.add(key);
                results.push({
                    title: lm.name,
                    subtitle: `${lm.street}, ${lm.zone} (La Paz)`,
                    display_name: `${lm.street}, ${lm.zone}, La Paz`,
                    zone: lm.zone,
                    lat: lm.lat,
                    lon: lm.lon,
                    distanceKm: dist.toFixed(1),
                    isLocal: true
                });
            }
        }
    }

    // 2. Consulta en vivo a OpenStreetMap Nominatim con límite metropolitano si q >= 3
    if (q.length >= 3) {
        try {
            const ctrl = new AbortController();
            const timeout = setTimeout(() => ctrl.abort(), 1800);
            const searchUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ' La Paz Bolivia')}&viewbox=-68.25,-16.42,-68.02,-16.60&bounded=0&limit=5`;
            const resp = await fetch(searchUrl, {
                headers: { 'Accept': 'application/json' },
                signal: ctrl.signal
            });
            clearTimeout(timeout);
            if (resp.ok) {
                const osmList = await resp.json();
                if (Array.isArray(osmList)) {
                    for (const item of osmList) {
                        const lat = parseFloat(item.lat);
                        const lon = parseFloat(item.lon);
                        if (isNaN(lat) || isNaN(lon)) continue;
                        if (lat < -16.65 || lat > -16.40 || lon < -68.28 || lon > -68.00) continue;

                        const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
                        if (!seen.has(key)) {
                            seen.add(key);
                            const dist = haversine(STORE_COORDS.lat, STORE_COORDS.lon, lat, lon);
                            const parts = (item.display_name || '').split(',').map(s => s.trim());
                            const mainTitle = parts[0] || 'Ubicación en La Paz';
                            const subTitle = parts.slice(1, 4).join(', ') || 'La Paz, Bolivia';

                            results.push({
                                title: mainTitle,
                                subtitle: subTitle,
                                display_name: `${mainTitle}, ${subTitle}`,
                                zone: parts[1] || 'La Paz',
                                lat: lat,
                                lon: lon,
                                distanceKm: dist.toFixed(1),
                                isLocal: false
                            });
                        }
                    }
                }
            }
        } catch (e) {
            // Continúa fluidamente con catálogo local ante problemas de red
        }
    }

    results.sort((a, b) => parseFloat(a.distanceKm) - parseFloat(b.distanceKm));
    return results.slice(0, 7);
}

/**
 * Geocodificación inversa: Convierte coordenadas GPS en una dirección humana en La Paz.
 */
async function reverseGeocodeLaPaz(lat, lon) {
    let closest = LA_PAZ_LANDMARKS[0];
    let minD = Infinity;
    for (const lm of LA_PAZ_LANDMARKS) {
        const d = haversine(lat, lon, lm.lat, lm.lon);
        if (d < minD) {
            minD = d;
            closest = lm;
        }
    }

    let bestName = minD <= 0.35 ? `${closest.street}, ${closest.zone}, La Paz` : `Cerca de ${closest.name}, ${closest.zone}, La Paz`;

    try {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 1400);
        const revUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
        const resp = await fetch(revUrl, {
            headers: { 'Accept': 'application/json' },
            signal: ctrl.signal
        });
        clearTimeout(timeout);
        if (resp.ok) {
            const data = await resp.json();
            if (data && data.address) {
                const road = data.address.road || data.address.pedestrian || data.address.path || data.address.suburb;
                const suburb = data.address.suburb || data.address.neighbourhood || closest.zone;
                const house = data.address.house_number ? ` #${data.address.house_number}` : '';
                if (road) {
                    bestName = `${road}${house}, ${suburb}, La Paz`;
                }
            }
        }
    } catch (e) {}

    return bestName;
}

/**
 * Vinculador de UI para autocompletado interactivo estilo Google Maps.
 */
function setupPlacesAutocomplete(inputId, clearBtnId, dropdownId, onSelectCallback) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    const clearBtn = clearBtnId ? document.getElementById(clearBtnId) : null;
    if (!input || !dropdown) return;

    let debounceTimer = null;

    const hideDropdown = () => {
        dropdown.style.display = 'none';
        dropdown.innerHTML = '';
    };

    const doSearch = async (val) => {
        const query = (val || '').trim();
        if (query.length < 2) {
            hideDropdown();
            return;
        }

        dropdown.innerHTML = `
            <div style="padding: 0.6rem 0.8rem; font-size: 0.78rem; color: #94a3b8; display: flex; align-items: center; gap: 0.4rem;">
                <span class="spin" style="display:inline-block;">⏳</span> Buscando en La Paz...
            </div>
        `;
        dropdown.style.display = 'block';

        const results = await searchLaPazAddresses(query);
        if (results.length === 0) {
            dropdown.innerHTML = `
                <div style="padding: 0.65rem 0.8rem; font-size: 0.78rem; color: #94a3b8; text-align: center;">
                    No se encontraron resultados para "<strong>${escapeHtml(query)}</strong>".<br>
                    <span style="font-size:0.72rem; color:#64748b;">Haz clic directo en el mapa para marcar tu puerta.</span>
                </div>
            `;
            return;
        }

        dropdown.innerHTML = results.map((item, idx) => `
            <div class="places-suggestion-item" data-index="${idx}">
                <div class="places-suggestion-icon">${item.isLocal ? '📍' : '🗺️'}</div>
                <div style="overflow: hidden; flex: 1;">
                    <div class="places-suggestion-title">${escapeHtml(item.title)}</div>
                    <div class="places-suggestion-subtitle">${escapeHtml(item.subtitle)}</div>
                </div>
                <div class="places-suggestion-dist">${item.distanceKm} Km</div>
            </div>
        `).join('');

        dropdown.querySelectorAll('.places-suggestion-item').forEach(el => {
            el.addEventListener('click', () => {
                const idx = parseInt(el.dataset.index, 10);
                const chosen = results[idx];
                if (chosen) {
                    input.value = chosen.display_name;
                    if (clearBtn) clearBtn.style.display = 'block';
                    hideDropdown();
                    if (typeof onSelectCallback === 'function') {
                        onSelectCallback(chosen);
                    }
                }
            });
        });
    };

    input.addEventListener('input', (e) => {
        const val = e.target.value;
        if (clearBtn) {
            clearBtn.style.display = val.length > 0 ? 'block' : 'none';
        }
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => doSearch(val), 260);
    });

    input.addEventListener('focus', () => {
        if (input.value.trim().length >= 2) {
            doSearch(input.value);
        }
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            input.value = '';
            clearBtn.style.display = 'none';
            hideDropdown();
            input.focus();
        });
    }

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            hideDropdown();
        }
    });
}

// Capa de mapas estándar OpenStreetMap con visualización nítida de calles paceñas
const MAP_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const MAP_TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Cache en memoria para rutas trazadas de calles OSRM (evita peticiones repetitivas)
const routePathCache = new Map();

/**
 * Traza una ruta de navegación profesional estilo Google Maps / PedidosYa
 * Si hay conectividad, consulta el algoritmo de calles de OSRM en La Paz.
 * Si no, dibuja una línea suave y redondeada con resplandor exterior.
 */
async function renderDeliveryRoute(mapInstance, start, end, existingLayerGroup, options = {}) {
    if (!mapInstance || !start || !end) return null;

    const coreColor = options.color || '#2563eb';
    const glowColor = options.glowColor || 'rgba(37, 99, 235, 0.35)';
    const cacheKey = `${Number(start[0]).toFixed(4)},${Number(start[1]).toFixed(4)}->${Number(end[0]).toFixed(4)},${Number(end[1]).toFixed(4)}`;

    let initialPoints = [start, end];

    if (!existingLayerGroup) {
        existingLayerGroup = L.layerGroup().addTo(mapInstance);
    } else {
        existingLayerGroup.clearLayers();
    }

    // Trazo exterior difuminado (resplandor suave de la ruta)
    const glowPolyline = L.polyline(initialPoints, {
        color: glowColor,
        weight: 8,
        opacity: 0.6,
        lineCap: 'round',
        lineJoin: 'round'
    }).addTo(existingLayerGroup);

    // Trazo interior nítido
    const corePolyline = L.polyline(initialPoints, {
        color: coreColor,
        weight: 4,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
    }).addTo(existingLayerGroup);

    // Si ya teníamos la ruta calculada en caché, aplicarla directamente
    if (routePathCache.has(cacheKey)) {
        const cached = routePathCache.get(cacheKey);
        glowPolyline.setLatLngs(cached);
        corePolyline.setLatLngs(cached);
        return existingLayerGroup;
    }

    // Consulta asíncrona a OSRM para seguir las calles reales de La Paz
    try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 2000);
        const res = await fetch(osrmUrl, { signal: ctrl.signal });
        clearTimeout(timeout);
        if (res.ok) {
            const data = await res.json();
            if (data.routes && data.routes[0] && data.routes[0].geometry && data.routes[0].geometry.coordinates) {
                const streetPoints = data.routes[0].geometry.coordinates.map(pt => [pt[1], pt[0]]);
                if (streetPoints.length > 1) {
                    routePathCache.set(cacheKey, streetPoints);
                    glowPolyline.setLatLngs(streetPoints);
                    corePolyline.setLatLngs(streetPoints);
                }
            }
        }
    } catch (e) {
        // En caso de corte o desconexión, la línea directa redondeada ya está visible
    }

    return existingLayerGroup;
}

function createStorePinIcon(title = null) {
    const storeTitle = title || (STORE_COORDS && STORE_COORDS.nombre) || 'Burger 24/7 Central Sopocachi';
    return L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="background:#f97316; width:28px; height:28px; border-radius:50%; border:2px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; font-size:14px; cursor:pointer;" title="${escapeHtml(storeTitle)}">🍔</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });
}

function createClientPinIcon(label = "Punto de Entrega") {
    return L.divIcon({
        className: 'custom-map-pin',
        html: '<div style="background:#ef4444; width:28px; height:28px; border-radius:50%; border:2px solid #fff; box-shadow:0 2px 8px rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center; font-size:14px; cursor:pointer;" title="' + label + '">📍</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });
}

function createRiderPinIcon() {
    return L.divIcon({
        className: 'custom-map-pin rider-pulse-pin',
        html: '<div style="background:#10b981; width:30px; height:30px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 12px #10b981; display:flex; align-items:center; justify-content:center; font-size:15px; cursor:pointer;" title="Repartidor en Ruta">🛵</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
}

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
    syncStoreConfigFromBackend();
});

// Load icons
function initLucide() {
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Helpers de Utilidad y Diagnóstico de API PHP
function cleanText(str) {
    if (!str) return '';
    return String(str)
        .replace(/P├írez/g, 'Pérez')
        .replace(/G├│mez/g, 'Gómez')
        .replace(/├í/g, 'á')
        .replace(/├®/g, 'é')
        .replace(/├¡/g, 'í')
        .replace(/├│/g, 'ó')
        .replace(/├║/g, 'ú')
        .replace(/├▒/g, 'ñ');
}

function escapeHtml(str) {
    if (!str) return '';
    const cleaned = cleanText(str);
    return String(cleaned)
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
    if (apiStatusTxt) apiStatusTxt.innerText = 'Desconectado';

    if (banner && msgEl) {
        msgEl.innerHTML = `<strong>Error de conexión:</strong> ${escapeHtml(message || 'No se pudo comunicar con el servidor.')} <span style="font-size:0.8rem; color:#fca5a5;">(Verifique que los servicios estén activos)</span>`;
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
            if (apiStatusTxt) apiStatusTxt.innerText = 'Servicio Activo';
            hideGlobalApiError();
            return true;
        } else {
            const err = res.error || 'El servidor no responde';
            showGlobalApiError(err);
            return false;
        }
    } catch (e) {
        showGlobalApiError('Servidor o base de datos offline. Inicie los servicios en XAMPP.');
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
        apiText.innerText = 'Servicio Activo';
    } else {
        apiDot.className = 'status-dot active';
        apiText.innerText = 'Servicio Local';
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
// 2. AUDITORÍA (MÓDULO SIMPLIFICADO / DESHABILITADO)
// ----------------------------------------------------
function logAuditoria(tabla, registroId, accion, datosAnteriores, datosNuevos, userId) {
    // No-op: Auditoría desactivada para aligerar y simplificar el sistema
}

// ----------------------------------------------------
// 3. 🤖 MOTOR DE CÁLCULO EN FRONTEND: FÓRMULA HAVERSINE Y LOGÍSTICA
// ----------------------------------------------------
// 🧒 EXPLICACIÓN FÁCIL:
// La regla matemática de la Tierra. Mide la distancia en línea recta entre dos puntos GPS.
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

// 🧒 EXPLICACIÓN FÁCIL:
// Calcula cuánto debe pagar el cliente por el envío (5 Bs base + 2 Bs por km)
// y cuántos minutos tardará la moto en llegar a su casa.
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

    // ----------------------------------------------------
    // BUSCADOR GOOGLE MAPS INTERACTIVO & GPS (CHECKOUT)
    // ----------------------------------------------------
    setupPlacesAutocomplete('inputSearchCheckoutAddress', 'btnClearCheckoutSearch', 'checkoutSearchSuggestions', (item) => {
        setCheckoutDeliveryCoords(item.lat, item.lon);
        if (checkoutMapInstance) {
            checkoutMapInstance.flyTo([item.lat, item.lon], 16, { duration: 1 });
        }
        const txtDir = document.getElementById('txtCheckoutDireccion');
        if (txtDir) txtDir.value = item.display_name;
        
        // Sincronizar chips visuales
        document.querySelectorAll('.zone-chip').forEach(c => {
            const cName = (c.dataset.name || '').toLowerCase();
            if (cName.includes((item.zone || '').toLowerCase()) || cName.includes((item.title || '').toLowerCase())) {
                c.classList.add('active');
            } else {
                c.classList.remove('active');
            }
        });

        showToast(`📍 Entrega fijada en: ${item.title}`, 'info');
        validateCheckoutForm();
    });

    // Chips de Zonas Populares en La Paz (1 solo toque)
    document.querySelectorAll('.zone-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.zone-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            const coordsStr = chip.dataset.coords;
            const name = chip.dataset.name || 'La Paz';
            if (coordsStr) {
                const [latStr, lonStr] = coordsStr.split(',');
                const lat = parseFloat(latStr);
                const lon = parseFloat(lonStr);
                setCheckoutDeliveryCoords(lat, lon);
                if (checkoutMapInstance) {
                    checkoutMapInstance.flyTo([lat, lon], 16, { duration: 1 });
                }
                const inputSearch = document.getElementById('inputSearchCheckoutAddress');
                if (inputSearch) inputSearch.value = name;
                const txtDir = document.getElementById('txtCheckoutDireccion');
                if (txtDir && (!txtDir.value || txtDir.value.includes('Plaza') || txtDir.value.includes('Av.'))) {
                    txtDir.value = `${name}, La Paz`;
                }
                showToast(`📍 Zona seleccionada: ${name}`, 'info');
                validateCheckoutForm();
            }
        });
    });

    // Botón GPS en Vivo (Geolocalización del navegador)
    const btnGpsCheckout = document.getElementById('btnGeolocateCheckout');
    if (btnGpsCheckout) {
        btnGpsCheckout.addEventListener('click', () => {
            if (!navigator.geolocation) {
                showToast('Tu navegador no soporta geolocalización GPS.', 'warning');
                return;
            }
            showToast('📡 Obteniendo señal GPS de tu dispositivo...', 'info');
            btnGpsCheckout.innerHTML = '<span class="spin">⏳</span> Buscando...';

            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    btnGpsCheckout.innerHTML = '<i data-lucide="crosshair" style="width: 12px; height: 12px;"></i> Mi GPS en Vivo';
                    initLucide();
                    let lat = pos.coords.latitude;
                    let lon = pos.coords.longitude;

                    // Si las coordenadas están dentro del radio metropolitano de La Paz, usarlas
                    const isWithinLaPaz = (lat >= -16.65 && lat <= -16.40 && lon >= -68.28 && lon <= -68.00);
                    if (!isWithinLaPaz) {
                        showToast('📡 GPS obtenido. Ajustando al área de cobertura oficial de La Paz.', 'info');
                        lat = -16.5090;
                        lon = -68.1340;
                    }

                    setCheckoutDeliveryCoords(lat, lon);
                    if (checkoutMapInstance) {
                        checkoutMapInstance.flyTo([lat, lon], 16, { duration: 1.2 });
                    }

                    const readableAddress = await reverseGeocodeLaPaz(lat, lon);
                    const txtDir = document.getElementById('txtCheckoutDireccion');
                    if (txtDir) txtDir.value = readableAddress;
                    const inputSearch = document.getElementById('inputSearchCheckoutAddress');
                    if (inputSearch) inputSearch.value = readableAddress;

                    showToast(`🎯 ¡Ubicación GPS fijada! ${readableAddress}`, 'success');
                    validateCheckoutForm();
                },
                (err) => {
                    btnGpsCheckout.innerHTML = '<i data-lucide="crosshair" style="width: 12px; height: 12px;"></i> Mi GPS en Vivo';
                    initLucide();
                    console.warn('Fallo GPS:', err);
                    showToast('No se pudo acceder a tu GPS. Por favor escribe tu calle o toca el mapa.', 'warning');
                },
                { enableHighAccuracy: true, timeout: 6000 }
            );
        });
    }

    const btnUseDefaultLoc = document.getElementById('btnUseDefaultLocation');
    if (btnUseDefaultLoc) btnUseDefaultLoc.addEventListener('click', () => {
        setCheckoutDeliveryCoords(STORE_COORDS.lat, STORE_COORDS.lon);
        if (checkoutMapInstance) checkoutMapInstance.flyTo([STORE_COORDS.lat, STORE_COORDS.lon], 16);
        const txtDir = document.getElementById('txtCheckoutDireccion');
        if (txtDir) txtDir.value = STORE_COORDS.direccion;
        const inputSearch = document.getElementById('inputSearchCheckoutAddress');
        if (inputSearch) inputSearch.value = STORE_COORDS.direccion;
        showToast('Ubicación centrada en la Sede Central del Restaurante.', 'info');
        validateCheckoutForm();
    });

    // ----------------------------------------------------
    // BUSCADOR EN VIVO PARA SEDE DEL RESTAURANTE (ADMIN)
    // ----------------------------------------------------
    setupPlacesAutocomplete('adminStoreDireccion', 'btnClearStoreSearch', 'storeSearchSuggestions', (item) => {
        const inDir = document.getElementById('adminStoreDireccion');
        const inZon = document.getElementById('adminStoreZona');
        const inLat = document.getElementById('adminStoreLat');
        const inLon = document.getElementById('adminStoreLon');
        const pDir = document.getElementById('previewAdminStoreDireccion');
        const pCoo = document.getElementById('previewAdminStoreCoords');
        const pZon = document.getElementById('previewAdminStoreZona');

        if (inDir) inDir.value = item.display_name;
        if (inZon && item.zone) inZon.value = item.zone;
        if (inLat) inLat.value = item.lat.toFixed(6);
        if (inLon) inLon.value = item.lon.toFixed(6);
        if (pDir) pDir.innerText = item.display_name;
        if (pCoo) pCoo.innerText = `${item.lat.toFixed(4)}, ${item.lon.toFixed(4)}`;
        if (pZon && item.zone) pZon.innerText = item.zone;

        showToast(`📍 Ubicación seleccionada: ${item.title}`, 'info');
    });

    // ----------------------------------------------------
    // BUSCADOR EN VIVO PARA DIRECCIÓN DE PERFIL
    // ----------------------------------------------------
    setupPlacesAutocomplete('profileInputDireccion', null, 'profileSearchSuggestions', (item) => {
        const pDir = document.getElementById('profileInputDireccion');
        if (pDir) pDir.value = item.display_name;
        showToast(`🏠 Dirección seleccionada: ${item.title}`, 'info');
    });



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

    // Cerrar al hacer clic en el backdrop fuera del contenido
    const checkoutModalEl = document.getElementById('checkoutModal');
    if (checkoutModalEl) {
        checkoutModalEl.addEventListener('click', (e) => {
            if (e.target === checkoutModalEl) {
                closeCheckoutModal();
            }
        });
    }

    // Auto-reajustar mapa interactivo de checkout en resize
    window.addEventListener('resize', () => {
        if (checkoutModalEl && checkoutModalEl.classList.contains('active') && checkoutMapInstance) {
            checkoutMapInstance.invalidateSize();
        }
    });

    document.getElementById('payOptQr').addEventListener('click', () => {
        document.getElementById('payOptQr').classList.add('active');
        document.getElementById('payOptCash').classList.remove('active');
        document.getElementById('qrUploadBlock').style.display = 'block';
        document.getElementById('cashDetailsBlock').style.display = 'none';
        updateCheckoutFinalTotal();
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

    const txtCheckDir = document.getElementById('txtCheckoutDireccion');
    if (txtCheckDir) txtCheckDir.addEventListener('input', validateCheckoutForm);
    const txtCheckTel = document.getElementById('txtCheckoutTelefono');
    if (txtCheckTel) txtCheckTel.addEventListener('input', validateCheckoutForm);

    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.admin-subpanel').forEach(panel => panel.classList.remove('active'));
            const tabId = btn.dataset.tab;
            let targetPanel = document.getElementById(`subpanel${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`);
            if (!targetPanel && tabId === 'qrconfig') targetPanel = document.getElementById('subpanelQrConfig');
            if (!targetPanel && tabId === 'storeconfig') targetPanel = document.getElementById('subpanelStoreconfig');
            if (targetPanel) {
                targetPanel.classList.add('active');
                targetPanel.style.display = 'block';
            }
            
            // Ocultar los demás subpaneles explícitamente para evitar solapamientos
            document.querySelectorAll('.admin-subpanel').forEach(panel => {
                if (panel !== targetPanel) panel.style.display = 'none';
            });

            if (tabId === 'monitoring') {
                renderAdminMonitoring();
                setTimeout(() => {
                    if (adminMonitoringMapInstance) adminMonitoringMapInstance.invalidateSize();
                }, 150);
            } else {
                stopAdminMonitoringPolling();
                if (tabId === 'reports') {
                    renderAdminReports();
                } else if (tabId === 'qrconfig') {
                    renderAdminQrConfig();
                } else if (tabId === 'storeconfig') {
                    renderAdminStoreConfig();
                } else if (tabId === 'catalog' || tabId === 'products') {
                    renderAdminProductsTable();
                    if (config.connectedMode) syncProductsFromBackend();
                } else if (tabId === 'approvals') {
                    renderAdminPendingApprovals();
                } else if (tabId === 'users') {
                    renderAdminAllUsers();
                }
            }
        });
    });

    document.getElementById('adminProductForm').addEventListener('submit', handleProductFormSubmit);
    document.getElementById('btnCancelEdit').addEventListener('click', resetProductForm);

    document.getElementById('btnFileViewerClose').addEventListener('click', () => {
        document.getElementById('fileViewerModal').classList.remove('active');
    });

    const fileModal = document.getElementById('fileViewerModal');
    if (fileModal) {
        fileModal.addEventListener('click', (e) => {
            if (e.target === fileModal) fileModal.classList.remove('active');
        });
    }

    const btnProf = document.getElementById('btnHeaderProfile');
    if (btnProf) {
        btnProf.addEventListener('click', () => {
            if (window.openUserProfile) window.openUserProfile();
        });
    }

    const btnProfClose = document.getElementById('btnProfileModalClose');
    if (btnProfClose) {
        btnProfClose.addEventListener('click', () => {
            if (window.closeUserProfile) window.closeUserProfile();
        });
    }

    const btnProfCloseAct = document.getElementById('btnProfileModalCloseAction');
    if (btnProfCloseAct) {
        btnProfCloseAct.addEventListener('click', () => {
            if (window.closeUserProfile) window.closeUserProfile();
        });
    }

    const profModal = document.getElementById('userProfileModal');
    if (profModal) {
        profModal.addEventListener('click', (e) => {
            if (e.target === profModal && window.closeUserProfile) window.closeUserProfile();
        });
    }

    const btnRecPrint = document.getElementById('btnReceiptPrint');
    if (btnRecPrint) {
        btnRecPrint.addEventListener('click', () => {
            window.print();
        });
    }

    const btnRecClose = document.getElementById('btnReceiptClose');
    if (btnRecClose) {
        btnRecClose.addEventListener('click', () => {
            if (window.closeReceiptModal) window.closeReceiptModal();
        });
    }

    const btnRecCloseAct = document.getElementById('btnReceiptCloseAction');
    if (btnRecCloseAct) {
        btnRecCloseAct.addEventListener('click', () => {
            if (window.closeReceiptModal) window.closeReceiptModal();
        });
    }

    const recModal = document.getElementById('orderReceiptModal');
    if (recModal) {
        recModal.addEventListener('click', (e) => {
            if (e.target === recModal && window.closeReceiptModal) window.closeReceiptModal();
        });
    }

    // Modal Calificación de Entrega y Comida Listeners
    const btnRateClose = document.getElementById('btnCloseRatingModal');
    if (btnRateClose) {
        btnRateClose.addEventListener('click', () => {
            if (window.closeOrderRatingModal) window.closeOrderRatingModal();
        });
    }

    const rateModal = document.getElementById('orderRatingModal');
    if (rateModal) {
        rateModal.addEventListener('click', (e) => {
            if (e.target === rateModal && window.closeOrderRatingModal) window.closeOrderRatingModal();
        });
    }

    const btnRateSubmit = document.getElementById('btnSubmitOrderRating');
    if (btnRateSubmit) {
        btnRateSubmit.addEventListener('click', () => {
            if (window.submitOrderRating) window.submitOrderRating();
        });
    }

    initStarPickers();

    // Modal Historial de Pedidos del Cliente Listeners
    const btnClientHistClose = document.getElementById('btnCloseClientOrdersHistory');
    if (btnClientHistClose) {
        btnClientHistClose.addEventListener('click', () => {
            if (window.closeClientOrdersHistoryModal) window.closeClientOrdersHistoryModal();
        });
    }
    const btnClientHistCloseBtn = document.getElementById('btnCloseClientOrdersHistoryBtn');
    if (btnClientHistCloseBtn) {
        btnClientHistCloseBtn.addEventListener('click', () => {
            if (window.closeClientOrdersHistoryModal) window.closeClientOrdersHistoryModal();
        });
    }
    const clientHistModal = document.getElementById('clientOrdersHistoryModal');
    if (clientHistModal) {
        clientHistModal.addEventListener('click', (e) => {
            if (e.target === clientHistModal && window.closeClientOrdersHistoryModal) window.closeClientOrdersHistoryModal();
        });
    }

    // Modal Historial de Pedidos por Usuario (Admin) Listeners
    const btnAdminUserHistClose = document.getElementById('btnCloseAdminUserHistory');
    if (btnAdminUserHistClose) {
        btnAdminUserHistClose.addEventListener('click', () => {
            if (window.closeAdminUserHistoryModal) window.closeAdminUserHistoryModal();
        });
    }
    const btnAdminUserHistCloseBtn = document.getElementById('btnCloseAdminUserHistoryBtn');
    if (btnAdminUserHistCloseBtn) {
        btnAdminUserHistCloseBtn.addEventListener('click', () => {
            if (window.closeAdminUserHistoryModal) window.closeAdminUserHistoryModal();
        });
    }
    const adminUserHistModal = document.getElementById('adminUserHistoryModal');
    if (adminUserHistModal) {
        adminUserHistModal.addEventListener('click', (e) => {
            if (e.target === adminUserHistModal && window.closeAdminUserHistoryModal) window.closeAdminUserHistoryModal();
        });
    }

    // Modal Apelación de Rechazo Listeners
    const btnAppClose = document.getElementById('btnAppealModalClose');
    if (btnAppClose) {
        btnAppClose.addEventListener('click', () => {
            if (window.closeAppealModal) window.closeAppealModal();
        });
    }

    const btnAppCancel = document.getElementById('btnAppealCancel');
    if (btnAppCancel) {
        btnAppCancel.addEventListener('click', () => {
            if (window.closeAppealModal) window.closeAppealModal();
        });
    }

    const appealModal = document.getElementById('appealModal');
    if (appealModal) {
        appealModal.addEventListener('click', (e) => {
            if (e.target === appealModal && window.closeAppealModal) window.closeAppealModal();
        });
    }

    const formAppeal = document.getElementById('formSubmitAppeal');
    if (formAppeal) {
        formAppeal.addEventListener('submit', async (e) => {
            e.preventDefault();
            const u = currentSession.currentUser;
            if (!u) return;

            const motivo = document.getElementById('txtAppealMotivo').value.trim();
            if (!motivo) {
                showToast('Ingresa un motivo para la apelación.', 'warning');
                return;
            }

            const formData = new FormData();
            formData.append('motivo', motivo);

            if (u.role === 'rider') {
                const lAnv = document.getElementById('fileAppealLicenciaAnverso').files[0];
                const lRev = document.getElementById('fileAppealLicenciaReverso').files[0];
                const seg = document.getElementById('fileAppealSeguro').files[0];
                const cv = document.getElementById('fileAppealCv').files[0];

                if (!lAnv || !lRev) {
                    showToast('Debes subir la licencia en anverso y reverso (PDF o JPG).', 'warning');
                    return;
                }
                formData.append('licencia_anverso', lAnv);
                formData.append('licencia_reverso', lRev);
                if (seg) formData.append('seguro', seg);
                if (cv) formData.append('cv', cv);
            } else {
                const ciAnv = document.getElementById('fileAppealCiAnverso').files[0];
                const ciRev = document.getElementById('fileAppealCiReverso').files[0];

                if (!ciAnv || !ciRev) {
                    showToast('Debes subir tu C.I. en anverso y reverso (PDF o JPG).', 'warning');
                    return;
                }
                formData.append('ci_anverso', ciAnv);
                formData.append('ci_reverso', ciRev);
            }

            const btnSub = document.getElementById('btnAppealSubmit');
            if (btnSub) {
                btnSub.disabled = true;
                btnSub.innerText = 'Enviando apelación...';
            }

            try {
                const res = await apiPost('/Auth/appeal.php', formData);
                if (res.ok) {
                    showToast('¡Apelación enviada con éxito! El administrador evaluará tu caso.', 'success');
                    window.closeAppealModal();
                    u.ci_status = 'pending';
                    u.apelacion_estado = 'pendiente';
                    u.apelacion_motivo = motivo;
                    localStorage.setItem('burger_user_session', JSON.stringify(u));
                    updateUIForCurrentRole();
                } else {
                    showToast(`Error al enviar apelación: ${res.error || 'Rechazado por el servidor'}`, 'danger');
                }
            } catch (err) {
                console.error('Error enviando apelación:', err);
                showToast(`Error de conexión al enviar apelación: ${err.message}`, 'danger');
            } finally {
                if (btnSub) {
                    btnSub.disabled = false;
                    btnSub.innerText = 'Enviar Apelación al Administrador';
                }
            }
        });
    }
}

function getActiveCategory() {
    const activeItem = document.querySelector('.category-item.active');
    return activeItem ? activeItem.dataset.category : 'todos';
}

function updateUIForCurrentRole() {
    const btnHeaderOrders = document.getElementById('btnHeaderOrders');
    if (currentSession.cliente) {
        if (btnHeaderOrders) btnHeaderOrders.style.display = 'inline-flex';
        renderClienteAccountInfo();
        renderProducts();
        renderClienteActiveOrderTracker();
        updateCartBadge();
    } else {
        if (btnHeaderOrders) btnHeaderOrders.style.display = 'none';
        if (currentSession.rider) {
            renderRiderProfile();
            renderRiderOrderQueue();
            renderRiderActiveOrderPanel();
            renderRiderOrderHistory();
        } else if (currentSession.admin) {
            renderAdminPendingApprovals();
            renderAdminProductsTable();
            renderAdminReports();
            renderAdminMonitoring();
            syncProductsFromBackend();
        }
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
                    <div class="logo-icon" style="margin: 0 auto 0.75rem; width: 44px; height: 44px; display:flex; align-items:center; justify-content:center; background:var(--accent-purple); color:#fff; border-radius:var(--radius-md);"><i data-lucide="flame"></i></div>
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
                    <div class="logo-icon" style="margin: 0 auto 0.75rem; width: 44px; height: 44px; display:flex; align-items:center; justify-content:center; background:var(--accent-purple); color:#fff; border-radius:var(--radius-md);"><i data-lucide="flame"></i></div>
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
                    <div class="form-group" style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
                        <div>
                            <label style="font-size: 0.73rem; margin-bottom: 0.2rem; display:block;">C.I. (Anverso):</label>
                            <input type="file" class="form-control" id="regClientCiAnverso" accept="image/jpeg,image/png,application/pdf" required>
                        </div>
                        <div>
                            <label style="font-size: 0.73rem; margin-bottom: 0.2rem; display:block;">C.I. (Reverso):</label>
                            <input type="file" class="form-control" id="regClientCiReverso" accept="image/jpeg,image/png,application/pdf" required>
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
            <div class="login-card glass-card" style="max-width: 520px;">
                <div style="text-align: center; margin-bottom: 1.25rem;">
                    <div class="logo-icon" style="margin: 0 auto 0.75rem; width: 44px; height: 44px; display:flex; align-items:center; justify-content:center; background:var(--accent-purple); color:#fff; border-radius:var(--radius-md);"><i data-lucide="bike"></i></div>
                    <h2>Postulación de Repartidor - Burger 24/7</h2>
                    <p style="font-size: 0.85rem; color: var(--text-secondary);">Carga tu expediente digital con anverso y reverso (PDF o JPG)</p>
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
                            <label style="font-size: 0.73rem; display:block;">Licencia (Anverso):</label>
                            <input type="file" class="form-control" id="regRiderLicenciaAnverso" accept="image/jpeg,image/png,application/pdf" required>
                        </div>
                        <div>
                            <label style="font-size: 0.73rem; display:block;">Licencia (Reverso):</label>
                            <input type="file" class="form-control" id="regRiderLicenciaReverso" accept="image/jpeg,image/png,application/pdf" required>
                        </div>
                    </div>
                    <div class="form-group" style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
                        <div>
                            <label style="font-size: 0.73rem; display:block;">Seguro SOAT:</label>
                            <input type="file" class="form-control" id="regRiderSeguro" accept="image/jpeg,image/png,application/pdf" required>
                        </div>
                        <div>
                            <label style="font-size: 0.73rem; display:block;">CV (PDF):</label>
                            <input type="file" class="form-control" id="regRiderCv" accept="application/pdf" required>
                        </div>
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

        document.getElementById('formAuthRegisterClient').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('regClientName').value.trim();
            const email = document.getElementById('regClientEmail').value.trim();
            const pass = document.getElementById('regClientPass').value.trim();
            const dob = dobInput.value;
            const fileAnverso = document.getElementById('regClientCiAnverso').files[0];
            const fileReverso = document.getElementById('regClientCiReverso').files[0];

            if (!name || !email || !pass || !dob || !fileAnverso || !fileReverso) {
                showToast('Faltan campos obligatorios o documentos de C.I. anverso/reverso.', 'error');
                return;
            }

            const formData = new FormData();
            formData.append('nombre', name);
            formData.append('correo', email);
            formData.append('password', pass);
            formData.append('fecha_nacimiento', dob);
            formData.append('ci_anverso', fileAnverso);
            formData.append('ci_reverso', fileReverso);

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
                        ci_url: `/uploads/ci/ci_${fileAnverso.name}`
                    };
                    showToast('Cliente registrado con éxito. C.I. Anverso y Reverso enviados a revisión.', 'success');
                    onLoginSuccess(registeredUser);
                } else {
                    showToast(`Error al registrar cliente: ${res.error || 'No se pudo completar el registro en la API.'}`, 'danger');
                }
            } catch (err) {
                console.error('Error en registro de cliente:', err);
                showToast(`Fallo de conexión con el servidor: ${err.message || 'Error de red'}`, 'danger');
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

            const lAnverso = document.getElementById('regRiderLicenciaAnverso').files[0];
            const lReverso = document.getElementById('regRiderLicenciaReverso').files[0];
            const s = document.getElementById('regRiderSeguro').files[0];
            const c = document.getElementById('regRiderCv').files[0];

            if (!name || !email || !pass || !dob || !lAnverso || !lReverso || !s || !c) {
                showToast('Faltan campos u hojas de postulación (licencia anverso/reverso, seguro o CV).', 'error');
                return;
            }

            const formData = new FormData();
            formData.append('nombre', name);
            formData.append('correo', email);
            formData.append('password', pass);
            formData.append('fecha_nacimiento', dob);
            formData.append('licencia_anverso', lAnverso);
            formData.append('licencia_reverso', lReverso);
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
                    showToast('Rider registrado y expediente digital (anverso/reverso) guardado con éxito.', 'success');
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

// ========================================================================================
// 🚪 FUNCIÓN: handleLogin (La Puerta de Entrada al Restaurante)
// ¿Para qué sirve?
// Cuando un cliente o repartidor llega y escribe su correo y clave, esta función va con el
// servidor (Auth/login.php) a preguntar si es bienvenido. Si todo está bien, nos dan una
// "pulsera mágica" (token JWT) que guardamos para saber quién es en las siguientes compras.
// ========================================================================================
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
                    fecha_nacimiento: (jwtData && jwtData.fecha_nacimiento) || (res.data.user && res.data.user.fecha_nacimiento) || '1995-04-12',
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
            showToast('Error de conexión: ' + (err.message || 'Servidor inaccesible'), 'danger');
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
                    fecha_nacimiento: jwtData.fecha_nacimiento || activeUser.fecha_nacimiento || '1995-04-12',
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
    document.getElementById('lblHeaderUserName').innerText = `${cleanText(activeUser.nombre)} (${activeUser.role.toUpperCase().replace('_', ' ')})`;

    const headerAvatar = document.getElementById('headerUserAvatarImg');
    const headerIcon = document.getElementById('headerUserDefaultIcon');
    const photoUrl = activeUser.foto_url || activeUser.ci_url;
    if (headerAvatar && photoUrl) {
        headerAvatar.src = resolveFileUrl(photoUrl, 'foto', activeUser.id);
        headerAvatar.style.display = 'inline-block';
        if (headerIcon) headerIcon.style.display = 'none';
    } else {
        if (headerAvatar) headerAvatar.style.display = 'none';
        if (headerIcon) headerIcon.style.display = 'inline-block';
    }

    // Display appropriate panel
    const roleKey = activeUser.role === 'super_usuario' ? 'admin' : activeUser.role;
    switchRole(roleKey);

    if (notify) {
        showToast(`¡Sesión iniciada como ${cleanText(activeUser.nombre)}!`, 'success');
    }
}

function handleLogout(notify = true) {
    currentSession.currentUser = null;
    currentSession.cliente = null;
    currentSession.rider = null;
    currentSession.admin = null;

    const headerAvatar = document.getElementById('headerUserAvatarImg');
    const headerIcon = document.getElementById('headerUserDefaultIcon');
    if (headerAvatar) headerAvatar.style.display = 'none';
    if (headerIcon) headerIcon.style.display = 'inline-block';

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
        const enApelacion = u.apelacion_estado === 'pendiente';
        pendingMsg = `<div style="margin-top:0.75rem; padding:0.75rem; background:rgba(245,158,11,0.1); border-radius:var(--radius-md); border:1px solid rgba(245,158,11,0.25); font-size:0.85rem; color:var(--accent-amber);">
            ⏳ ${enApelacion ? 'Tu apelación con nuevos documentos está en revisión por la administración.' : 'Tu C.I. (anverso y reverso) está pendiente de aprobación por el administrador.'}
        </div>`;
    } else if (u.ci_status === 'rejected') {
        pendingMsg = `<div style="margin-top:0.75rem; padding:0.75rem; background:rgba(239,68,68,0.12); border-radius:var(--radius-md); border:1px solid rgba(239,68,68,0.3); font-size:0.85rem; color:var(--accent-red);">
            <div style="font-weight:700; margin-bottom:0.25rem;">❌ Tu C.I. fue rechazado</div>
            ${u.motivo_rechazo ? `<div style="font-size:0.78rem; margin-bottom:0.45rem; color:#fca5a5;"><strong>Motivo:</strong> ${escapeHtml(u.motivo_rechazo)}</div>` : ''}
            ${u.apelacion_estado === 'pendiente' 
                ? `<div style="font-size:0.78rem; color:#fde047; font-weight:600;">⚖️ Apelación enviada: En revisión administrativa.</div>` 
                : `<button class="btn btn-warning btn-sm" onclick="openAppealModal()" style="width:100%; margin-top:0.35rem; font-size:0.78rem; font-weight:700; background:#f59e0b; color:#1e1b4b; border:none; padding:0.4rem;">
                    ⚖️ Apelar Rechazo (Subir Anverso/Reverso)
                   </button>`}
        </div>`;
    }

    box.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            <p><strong>Nombre:</strong> ${escapeHtml(u.nombre)}</p>
            <p><strong>Email:</strong> ${escapeHtml(u.email)}</p>
            <p><strong>Edad:</strong> ${calculateAge(u.fecha_nacimiento)} años</p>
            <div>
                <span class="badge ${badgeClass}">${statusLabel}</span>
            </div>
            ${pendingMsg}
            <button class="btn btn-secondary btn-sm" onclick="openUserProfile()" style="margin-top: 0.4rem; width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.45rem 0.75rem;">
                <i data-lucide="user" style="width: 14px; height: 14px; color: #f97316;"></i>
                <span>Ver Mi Perfil Completo</span>
            </button>
        </div>
    `;
    initLucide();
}

// ----------------------------------------------------
// 🔍 MOTOR DE BÚSQUEDA Y MENÚ EN FRONTEND (LA LUPA MÁGICA)
// ----------------------------------------------------
// 🧒 EXPLICACIÓN FÁCIL:
// Esta función es la Lupa Mágica del menú:
// 1. Pide todas las hamburguesas a MySQL llamando a /Catalog/catalog.php.
// 2. Filtra por categoría (Hamburguesas, Combos, Acompañamientos, Bebidas).
// 3. Busca en vivo las palabras que escribas (nombre, marca o sabor).
// 4. Si tu carnet está verificado te muestra el precio y te deja comprar;
//    si aún está pendiente, oculta el precio para protegerte.
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
            alertBox.innerHTML = `<span class="badge badge-verified"><i data-lucide="check-circle"></i> Catalogo desbloqueado</span>`;
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
                <h3>Error al Cargar Catálogo</h3>
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
// 7. CLIENT CART LOGIC (LA MOCHILA DE COMPRAS)
// ----------------------------------------------------
// 🧒 EXPLICACIÓN FÁCIL:
// Mete la hamburguesa seleccionada a la bolsa del carrito.
// Si ya la tenías, le suma +1 a la cantidad, pero cuida que no pidas más del stock que existe.
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
            icon: createClientPinIcon("Punto de Entrega")
        }).addTo(checkoutMapInstance);
    }
    if (checkoutMapInstance) {
        checkoutMapInstance.setView([lat, lng], 14);
        renderDeliveryRoute(checkoutMapInstance, [STORE_COORDS.lat, STORE_COORDS.lon], [lat, lng], checkoutRouteLine, {
            color: '#3b82f6',
            glowColor: 'rgba(59, 130, 246, 0.35)'
        }).then(layer => {
            checkoutRouteLine = layer;
        });
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

    // Cargar configuración oficial del código QR y datos bancarios
    fetchPaymentQrConfig();

    // Auto-completar dirección y teléfono de contacto guardados del perfil del cliente
    const curUser = currentSession.cliente || currentSession.currentUser;
    const txtDir = document.getElementById('txtCheckoutDireccion');
    const txtTel = document.getElementById('txtCheckoutTelefono');
    const searchInput = document.getElementById('inputSearchCheckoutAddress');
    if (txtDir && !txtDir.value && curUser && curUser.direccion) {
        txtDir.value = curUser.direccion;
    }
    if (searchInput && !searchInput.value && curUser && curUser.direccion) {
        searchInput.value = curUser.direccion;
    }
    if (txtTel && !txtTel.value && curUser && curUser.telefono) {
        txtTel.value = curUser.telefono;
    }

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
                zoomControl: true,
                maxBounds: LA_PAZ_BOUNDS,
                minZoom: 12,
                maxZoom: 18
            }).setView([STORE_COORDS.lat, STORE_COORDS.lon], 14);

            L.tileLayer(MAP_TILE_URL, {
                attribution: MAP_TILE_ATTR,
                maxZoom: 19
            }).addTo(checkoutMapInstance);

            checkoutMarkerStore = L.marker([STORE_COORDS.lat, STORE_COORDS.lon], {
                icon: createStorePinIcon()
            }).addTo(checkoutMapInstance).bindPopup(`<b>${escapeHtml(STORE_COORDS.nombre)}</b><br>${escapeHtml(STORE_COORDS.direccion)} (La Paz)`);

            checkoutMapInstance.on('click', async (e) => {
                const lat = e.latlng.lat;
                const lng = e.latlng.lng;
                setCheckoutDeliveryCoords(lat, lng);
                const readable = await reverseGeocodeLaPaz(lat, lng);
                const txtDir = document.getElementById('txtCheckoutDireccion');
                if (txtDir) txtDir.value = readable;
                const inSearch = document.getElementById('inputSearchCheckoutAddress');
                if (inSearch) inSearch.value = readable;
                showToast(`📍 Ubicación seleccionada en mapa: ${readable}`, 'info');
                validateCheckoutForm();
            });
        } else {
            checkoutMapInstance.invalidateSize();
            if (checkoutMarkerStore) {
                checkoutMarkerStore.setLatLng([STORE_COORDS.lat, STORE_COORDS.lon]);
                checkoutMarkerStore.setPopupContent(`<b>${escapeHtml(STORE_COORDS.nombre)}</b><br>${escapeHtml(STORE_COORDS.direccion)} (La Paz)`);
            }
            if (selectedDeliveryCoords) {
                setCheckoutDeliveryCoords(selectedDeliveryCoords.lat, selectedDeliveryCoords.lon);
            }
        }

        // Forzar recalculo de dimensiones del mapa inmediatamente y post animación modal
        if (checkoutMapInstance) {
            checkoutMapInstance.invalidateSize();
            setTimeout(() => {
                if (checkoutMapInstance) checkoutMapInstance.invalidateSize();
            }, 250);
        }
    }, 150);
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').classList.remove('active');
}

function updateCheckoutFinalTotal() {
    const subtotal = cart.reduce((acc, item) => acc + (item.product.precio * item.quantity), 0);
    const shipping = selectedDeliveryCoords ? parseFloat(selectedDeliveryCoords.costBs) : 0;
    const finalTotal = subtotal + shipping;
    document.getElementById('lblCheckoutTotal').innerText = `${finalTotal.toFixed(2)} Bs`;

    // Actualizar el código QR con el costo exacto del pedido
    updateCheckoutQrDisplay(finalTotal);

    const isCash = document.getElementById('payOptCash').classList.contains('active');
    const placeBtn = document.getElementById('btnPlaceOrder');
    if (placeBtn) {
        if (isCash) {
            placeBtn.innerText = `Confirmar Pedido (Pagar en Efectivo al Recibir: ${finalTotal.toFixed(2)} Bs)`;
            placeBtn.style.background = 'var(--accent-green)';
        } else {
            placeBtn.innerText = `Confirmar y Enviar Comprobante QR (Total: ${finalTotal.toFixed(2)} Bs)`;
            placeBtn.style.background = 'var(--accent-purple)';
        }
    }
    validateCheckoutForm();
}

function validateCheckoutForm() {
    const hasLocation = selectedDeliveryCoords !== null;
    const isQr = document.getElementById('payOptQr').classList.contains('active');
    const qrInput = document.getElementById('fileQrComprobante');
    const hasQrFile = qrInput && qrInput.files && qrInput.files.length > 0;
    const txtDir = document.getElementById('txtCheckoutDireccion');
    const txtTel = document.getElementById('txtCheckoutTelefono');
    const hasAddress = txtDir ? txtDir.value.trim().length > 0 : true;
    const hasPhone = txtTel ? txtTel.value.trim().length > 0 : true;
    
    const placeBtn = document.getElementById('btnPlaceOrder');
    if (placeBtn) {
        // Para Contraentrega: requiere ubicación, dirección y teléfono.
        // Para QR: requiere ubicación, dirección, teléfono Y comprobante QR para despachar a cocina.
        placeBtn.disabled = !(hasLocation && hasAddress && hasPhone && (!isQr || hasQrFile));
    }
}

// 🧒 EXPLICACIÓN FÁCIL:
// ¡El momento de la verdad! Cuando aprietas "Confirmar Pedido":
// 1. Empaqueta tu carrito, dirección exacta, teléfono y ubicación de tu casa.
// 2. Llama al mesero de internet (apiPost /Transactions/checkout.php).
// 3. La caja registradora llama al Robot C++, descuenta las hamburguesas de la cocina
//    y te muestra tu recibo digital oficial en pantalla.
async function submitOrderCheckout() {
    if (cart.length === 0 || !selectedDeliveryCoords) return;

    const dirEl = document.getElementById('txtCheckoutDireccion');
    const refEl = document.getElementById('txtCheckoutReferencia');
    const telEl = document.getElementById('txtCheckoutTelefono');

    const direccionEntrega = dirEl ? dirEl.value.trim() : '';
    const referenciaEntrega = refEl ? refEl.value.trim() : '';
    const telefonoContacto = telEl ? telEl.value.trim() : '';

    if (!direccionEntrega) {
        showToast('Por favor escribe tu dirección exacta de entrega.', 'warning');
        if (dirEl) dirEl.focus();
        return;
    }
    if (!telefonoContacto) {
        showToast('Por favor escribe tu teléfono o celular de contacto.', 'warning');
        if (telEl) telEl.focus();
        return;
    }

    const isQr = document.getElementById('payOptQr').classList.contains('active');
    const metodoPago = isQr ? 'qr' : 'contraentrega';
    const qrFileInput = document.getElementById('fileQrComprobante');
    const qrFile = (isQr && qrFileInput && qrFileInput.files && qrFileInput.files.length > 0) ? qrFileInput.files[0] : null;

    if (isQr && !qrFile) {
        showToast('Por favor adjunta la foto o captura de tu comprobante de pago QR antes de continuar.', 'warning');
        return;
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

    const placeBtn = document.getElementById('btnPlaceOrder');
    const origBtnText = placeBtn ? placeBtn.innerHTML : '';
    if (placeBtn) {
        placeBtn.disabled = true;
        placeBtn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Procesando Pedido...';
    }

    try {
        const res = await apiPost('/Transactions/checkout.php', {
            items: itemsPayload,
            latitud: selectedDeliveryCoords.lat,
            longitud: selectedDeliveryCoords.lon,
            metodo_pago: metodoPago,
            distancia_km: selectedDeliveryCoords.distKm,
            qr_comprobante_url: null,
            direccion_entrega: direccionEntrega,
            referencia_entrega: referenciaEntrega,
            telefono_contacto: telefonoContacto
        });

        if (!res.ok) {
            if (placeBtn) {
                placeBtn.disabled = false;
                placeBtn.innerHTML = origBtnText;
            }
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

        const newOrderId = res.data && res.data.pedido_id ? res.data.pedido_id : null;

        // Si es pago QR y el usuario subió su comprobante, vincular el archivo real vía upload_qr
        if (isQr && qrFile && newOrderId) {
            try {
                const formData = new FormData();
                formData.append('pedido_id', newOrderId);
                formData.append('qr_image', qrFile);
                const uploadRes = await apiPost('/Transactions/checkout.php?action=upload_qr', formData);
                if (uploadRes.ok) {
                    showToast('¡Comprobante QR vinculado exitosamente! Pago registrado.', 'success');
                } else {
                    console.warn('Fallo al subir archivo comprobante QR:', uploadRes.error);
                }
            } catch (upErr) {
                console.warn('Error subiendo archivo comprobante:', upErr);
            }
        }

        closeCheckoutModal();
        cart = [];
        updateCartBadge();

        if (currentSession.currentUser) {
            currentSession.currentUser.direccion = direccionEntrega;
            currentSession.currentUser.telefono = telefonoContacto;
        }
        if (currentSession.cliente) {
            currentSession.cliente.direccion = direccionEntrega;
            currentSession.cliente.telefono = telefonoContacto;
        }
        const pDirIn = document.getElementById('profileInputDireccion');
        if (pDirIn) pDirIn.value = direccionEntrega;
        const pTelIn = document.getElementById('profileInputTelefono');
        if (pTelIn) pTelIn.value = telefonoContacto;

        const successMsg = isQr
            ? '¡Pedido registrado y pagado con QR! Enviado a cocina para preparación.'
            : '¡Pedido registrado con pago Contraentrega! El repartidor cobrará al entregar.';
        showToast(successMsg, 'success');

        await renderClienteActiveOrderTracker();
        await renderProducts();
        if (newOrderId && window.openReceiptModal) {
            window.openReceiptModal(newOrderId);
        }
    } catch (err) {
        console.error('Error enviando checkout a backend:', err);
        if (placeBtn) {
            placeBtn.disabled = false;
            placeBtn.innerHTML = origBtnText;
        }
        showToast('Error de conexión. No se pudo registrar el pedido.', 'danger');
        showGlobalApiError('No se pudo procesar la compra en el servidor. Por favor verifica la conexión.');
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
    window._clientActiveOrder = activeOrder;

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

    const itemsEl = document.getElementById('clientActiveOrderItems');
    if (itemsEl) {
        const dirHtml = activeOrder.direccion_entrega ? `<div style="margin-top:0.35rem; font-size:0.8rem; color:#38bdf8;">🏠 <strong>Entrega:</strong> ${escapeHtml(activeOrder.direccion_entrega)}${activeOrder.referencia_entrega ? ` (${escapeHtml(activeOrder.referencia_entrega)})` : ''}</div>` : '';
        const storeHtml = `<div style="margin-top:0.2rem; font-size:0.78rem; color:var(--text-secondary);">🏪 <strong>Desde Cocina:</strong> ${escapeHtml(STORE_COORDS.direccion)}</div>`;
        itemsEl.innerHTML = `<strong>Detalles:</strong> ${escapeHtml(detailsText || 'Sin detalles')}${dirHtml}${storeHtml}`;
    }

    const isContra = activeOrder.estado_pago === 'contraentrega' || activeOrder.estado_pago === 'pagado_efectivo';
    const isQrPaid = activeOrder.estado_pago === 'pagado_qr';
    const qrBtn = activeOrder.qr_comprobante_url
        ? ` <button class="btn btn-secondary btn-sm" onclick="openFileViewer('${activeOrder.qr_comprobante_url}', 'Comprobante QR - Pedido #${activeOrder.id}', 'qr', null)" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; margin-left: 0.4rem; vertical-align: middle;"><i data-lucide="receipt" style="width:12px;height:12px;"></i> Ver Comprobante QR</button>`
        : '';

    const canCancel = ['pendiente', 'asignado'].includes(activeOrder.estado_pedido);
    const cancelBtn = canCancel
        ? ` <button class="btn btn-danger btn-sm" onclick="clienteCancelarPedido(${activeOrder.id})" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; margin-left: 0.5rem; vertical-align: middle;"><i data-lucide="x-circle" style="width:12px;height:12px;"></i> Cancelar</button>`
        : '';

    let payBadge = '';
    if (isContra) {
        payBadge = '<span class="badge" style="background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.3); font-size:0.8rem; font-weight:700;"><i data-lucide="banknote" style="width:13px;height:13px;vertical-align:middle;"></i> Contraentrega (Pagarás en efectivo al recibir)</span>';
    } else if (isQrPaid) {
        payBadge = `<span class="badge" style="background:rgba(139,92,246,0.18); color:var(--accent-purple); border:1px solid rgba(139,92,246,0.4); font-size:0.8rem; font-weight:700;"><i data-lucide="qr-code" style="width:13px;height:13px;vertical-align:middle;"></i> Pagado con QR (Verificado)</span>${qrBtn}`;
    } else {
        payBadge = '<span class="badge" style="background:rgba(234,179,8,0.18); color:#facc15; border:1px solid rgba(234,179,8,0.4); font-size:0.8rem; font-weight:700;"><i data-lucide="clock" style="width:13px;height:13px;vertical-align:middle;"></i> Pago con QR (Pendiente de Comprobante)</span>';
    }

    const payEl = document.getElementById('clientActiveOrderPayment');
    if (payEl) payEl.innerHTML = `<strong>Método de Pago:</strong> ${payBadge}`;

    const receiptBtn = ` <button class="btn btn-secondary btn-sm" onclick="openReceiptModal(${activeOrder.id})" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; margin-left: 0.4rem; vertical-align: middle;"><i data-lucide="receipt" style="width:12px;height:12px;"></i> Recibo Digital</button>`;

    const rateBtn = ['en_camino', 'entregado'].includes(activeOrder.estado_pedido)
        ? ` <button class="btn btn-warning btn-sm" onclick="openOrderRatingModal(${activeOrder.id})" style="padding: 0.25rem 0.6rem; font-size: 0.75rem; margin-left: 0.4rem; vertical-align: middle; background: #f59e0b; color: #0f172a; font-weight: 700; border: none; border-radius: var(--radius-sm);"><i data-lucide="star" style="width:12px;height:12px;vertical-align:middle;"></i> ${activeOrder.calificacion ? 'Mi Calificación' : 'Calificar'}</button>`
        : '';

    const totalEl = document.getElementById('clientActiveOrderTotal');
    if (totalEl) totalEl.innerHTML = `<strong>Total a pagar:</strong> ${Number(activeOrder.total).toFixed(2)} Bs ${receiptBtn} ${rateBtn} ${cancelBtn}`;

    // Renderizar Card de Validación de Recepción y Calificación
    const feedbackBox = document.getElementById('clientOrderFeedbackCard');
    if (feedbackBox) {
        if (activeOrder.estado_pedido === 'en_camino' || activeOrder.estado_pedido === 'entregado') {
            feedbackBox.style.display = 'block';
            if (activeOrder.calificacion) {
                const c = activeOrder.calificacion;
                const starStr = (n) => '★'.repeat(n) + '☆'.repeat(5 - n);
                feedbackBox.innerHTML = `
                    <div class="order-rated-badge-card">
                        <div class="rated-header">
                            <i data-lucide="check-circle-2" style="width: 17px; height: 17px; color: #10b981;"></i>
                            <strong>¡Pedido Recibido y Calificado! Muchas gracias</strong>
                        </div>
                        <div class="rated-stars-summary">
                            <span>🛵 <strong>Entrega / Rider:</strong> <span style="color:#f59e0b; letter-spacing:1px;">${starStr(c.calificacion_entrega)}</span> (${c.calificacion_entrega}/5)</span>
                            <span>🍔 <strong>Comida / Sabor:</strong> <span style="color:#f59e0b; letter-spacing:1px;">${starStr(c.calificacion_comida)}</span> (${c.calificacion_comida}/5)</span>
                        </div>
                        ${c.comentario_comida ? `<p class="rated-quote">“${escapeHtml(c.comentario_comida)}”</p>` : ''}
                        <button class="btn btn-outline btn-sm" onclick="openOrderRatingModal(${activeOrder.id})" style="margin-top: 0.5rem; font-size: 0.73rem; padding: 0.25rem 0.6rem; color: #cbd5e1; border: 1px solid rgba(255,255,255,0.18); border-radius: var(--radius-sm); cursor: pointer; background: rgba(255,255,255,0.03);">
                            <i data-lucide="edit-3" style="width:12px;height:12px;vertical-align:middle;"></i> Ver o Editar Calificación
                        </button>
                    </div>
                `;
            } else {
                const isEntregado = activeOrder.estado_pedido === 'entregado';
                feedbackBox.innerHTML = `
                    <div class="order-reception-action-card">
                        <div class="action-card-text">
                            <div class="action-icon">
                                <i data-lucide="${isEntregado ? 'package-check' : 'bell-ring'}"></i>
                            </div>
                            <div>
                                <strong>${isEntregado ? '¡Tu comida ha sido entregada!' : '¿Ya llegó tu repartidor a tu puerta?'}</strong>
                                <p>Confirma que recibiste tu pedido y califica la entrega y la comida con estrellitas.</p>
                            </div>
                        </div>
                        <button type="button" class="btn btn-primary btn-rate-action" onclick="openOrderRatingModal(${activeOrder.id})">
                            <i data-lucide="star" style="width:14px;height:14px;"></i> Confirmar y Calificar
                        </button>
                    </div>
                `;
            }
        } else {
            feedbackBox.style.display = 'none';
        }
    }
    initLucide();

    const latCliente = activeOrder.latitud || -16.5090;
    const lonCliente = activeOrder.longitud || -68.1340;

    setTimeout(() => {
        if (!clientTrackingMapInstance) {
            clientTrackingMapInstance = L.map('activeOrderMap', {
                zoomControl: false,
                maxBounds: LA_PAZ_BOUNDS,
                minZoom: 12
            });

            L.tileLayer(MAP_TILE_URL, {
                attribution: MAP_TILE_ATTR,
                maxZoom: 19
            }).addTo(clientTrackingMapInstance);

            clientTrackingMarkerStore = L.marker([STORE_COORDS.lat, STORE_COORDS.lon], {
                icon: createStorePinIcon()
            }).addTo(clientTrackingMapInstance).bindPopup(`<b>${escapeHtml(STORE_COORDS.nombre)}</b><br>${escapeHtml(STORE_COORDS.direccion)} (Cocina)`);
        } else {
            clientTrackingMapInstance.invalidateSize();
            if (clientTrackingMarkerStore) {
                clientTrackingMarkerStore.setLatLng([STORE_COORDS.lat, STORE_COORDS.lon]);
                clientTrackingMarkerStore.setPopupContent(`<b>${escapeHtml(STORE_COORDS.nombre)}</b><br>${escapeHtml(STORE_COORDS.direccion)} (Cocina)`);
            }
        }

        if (clientTrackingMarkerClient) {
            clientTrackingMarkerClient.setLatLng([latCliente, lonCliente]);
        } else {
            clientTrackingMarkerClient = L.marker([latCliente, lonCliente], {
                icon: createClientPinIcon("Tu Ubicación de Entrega")
            }).addTo(clientTrackingMapInstance).bindPopup("<b>Tu Ubicación de Entrega</b>");
        }

        renderDeliveryRoute(
            clientTrackingMapInstance,
            [STORE_COORDS.lat, STORE_COORDS.lon],
            [latCliente, lonCliente],
            clientTrackingRouteLine,
            { color: '#2563eb', glowColor: 'rgba(37, 99, 235, 0.35)' }
        ).then(layer => {
            clientTrackingRouteLine = layer;
        });

        const bounds = L.latLngBounds([
            [STORE_COORDS.lat, STORE_COORDS.lon],
            [latCliente, lonCliente]
        ]);
        clientTrackingMapInstance.fitBounds(bounds, { padding: [25, 25] });

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
                    icon: createRiderPinIcon()
                }).addTo(clientTrackingMapInstance).bindPopup("<b>Rider Asignado</b><br>Despacho en curso");
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
    const esRechazado = (doc && doc.estado_aprobacion === 'rechazado') || r.ci_status === 'rejected';
    const enApelacion = (doc && doc.apelacion_estado === 'pendiente') || r.apelacion_estado === 'pendiente';
    const motivoRechazo = (doc && doc.motivo_rechazo) || r.motivo_rechazo;

    if (esRechazado) {
        riderStatusMsg = `<div style="margin-top:0.75rem; padding:0.75rem; background:rgba(239,68,68,0.12); border-radius:var(--radius-md); border:1px solid rgba(239,68,68,0.3); font-size:0.85rem; color:var(--accent-red);">
            <div style="font-weight:700; margin-bottom:0.25rem;">❌ Expediente Rechazado</div>
            ${motivoRechazo ? `<div style="font-size:0.78rem; margin-bottom:0.45rem; color:#fca5a5;"><strong>Motivo:</strong> ${escapeHtml(motivoRechazo)}</div>` : ''}
            ${enApelacion 
                ? `<div style="font-size:0.78rem; color:#fde047; font-weight:600;">⚖️ Apelación enviada: En evaluación por la administración.</div>` 
                : `<button class="btn btn-warning btn-sm" onclick="openAppealModal()" style="width:100%; margin-top:0.35rem; font-size:0.78rem; font-weight:700; background:#f59e0b; color:#1e1b4b; border:none; padding:0.4rem;">
                    ⚖️ Apelar Rechazo y Resubir Expediente
                   </button>`}
        </div>`;
    } else if (!doc || doc.estado_aprobacion === 'pendiente') {
        riderStatusMsg = `<div style="margin-top:0.75rem; padding:0.75rem; background:rgba(245,158,11,0.1); border-radius:var(--radius-md); border:1px solid rgba(245,158,11,0.25); font-size:0.85rem; color:var(--accent-amber);">
            ⏳ ${enApelacion ? 'Tu apelación con documentos corregidos está en revisión administrativa.' : 'Tu expediente está en revisión. Se te notificará cuando el administrador lo apruebe.'}
        </div>`;
    }

    box.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem;">
            <p><strong>Nombre:</strong> ${escapeHtml(r.nombre)}</p>
            <p><strong>Email:</strong> ${escapeHtml(r.email)}</p>
            <div>
                <span class="badge ${statusClass}">${statusText}</span>
            </div>
            ${riderStatusMsg}
            <button class="btn btn-secondary btn-sm" onclick="openUserProfile()" style="margin-top: 0.4rem; width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.45rem 0.75rem;">
                <i data-lucide="user" style="width: 14px; height: 14px; color: #f97316;"></i>
                <span>Ver Mi Perfil Completo</span>
            </button>
        </div>
    `;

    const docsContainer = document.getElementById('riderDocsContainer');
    docsContainer.innerHTML = `
        <h3>Documentación Digital</h3>
        
        <div class="doc-upload-item">
            <div class="doc-upload-item-info">
                <span class="doc-upload-name">Licencia de Conducir (Anverso)</span>
                <span class="doc-upload-status ${doc && doc.estado_aprobacion === 'aprobado' ? 'age-valid' : 'text-secondary'}">
                    ${doc ? '✓ Subido' : 'No cargado'}
                </span>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="openFileViewer('${doc ? (doc.licencia_url || '') : ''}', 'Licencia Anverso - ${escapeHtml(r.nombre)}', 'licencia', ${r.id})">
                <i data-lucide="eye" style="width:12px;height:12px;"></i> Ver
            </button>
        </div>

        <div class="doc-upload-item">
            <div class="doc-upload-item-info">
                <span class="doc-upload-name">Licencia de Conducir (Reverso)</span>
                <span class="doc-upload-status ${doc && doc.licencia_reverso_url ? 'age-valid' : 'text-secondary'}">
                    ${doc && doc.licencia_reverso_url ? '✓ Subido' : 'Opcional / Carga'}
                </span>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="openFileViewer('${doc ? (doc.licencia_reverso_url || doc.licencia_url || '') : ''}', 'Licencia Reverso - ${escapeHtml(r.nombre)}', 'licencia', ${r.id})">
                <i data-lucide="eye" style="width:12px;height:12px;"></i> Ver
            </button>
        </div>

        <div class="doc-upload-item">
            <div class="doc-upload-item-info">
                <span class="doc-upload-name">Seguro contra Accidentes (SOAT)</span>
                <span class="doc-upload-status ${doc && doc.estado_aprobacion === 'aprobado' ? 'age-valid' : 'text-secondary'}">
                    ${doc ? '✓ Subido' : 'No cargado'}
                </span>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="openFileViewer('${doc ? (doc.seguro_url || '') : ''}', 'Seguro SOAT - ${escapeHtml(r.nombre)}', 'seguro', ${r.id})">
                <i data-lucide="eye" style="width:12px;height:12px;"></i> Ver
            </button>
        </div>

        <div class="doc-upload-item">
            <div class="doc-upload-item-info">
                <span class="doc-upload-name">Curriculum Vitae (PDF)</span>
                <span class="doc-upload-status ${doc && doc.estado_aprobacion === 'aprobado' ? 'age-valid' : 'text-secondary'}">
                    ${doc ? '✓ Subido' : 'No cargado'}
                </span>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="openFileViewer('${doc ? (doc.cv_url || '') : ''}', 'Currículum Vitae - ${escapeHtml(r.nombre)}', 'cv', ${r.id})">
                <i data-lucide="eye" style="width:12px;height:12px;"></i> Ver
            </button>
        </div>
    `;
    initLucide();
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
                    <p>${escapeHtml(res.error || 'No se pudo obtener la cola de pedidos del servidor.')}</p>
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
            const tienda = p.tienda_recogida || STORE_COORDS;
            const dirEntrega = p.direccion_entrega || 'Ubicación seleccionada en mapa';
            const refEntrega = p.referencia_entrega ? `(${escapeHtml(p.referencia_entrega)})` : '';
            const telEntrega = p.telefono_contacto || p.cliente_telefono || '';
            const telTienda = tienda.telefono || STORE_COORDS.telefono || '';
            const isQrPaid = p.estado_pago === 'pagado_qr';

            const headerBadge = isQrPaid
                ? `<span class="badge" style="background: rgba(139, 92, 246, 0.2); color: #c4b5fd; border: 1px solid var(--accent-purple); font-weight: 700; font-size: 0.74rem;"><i data-lucide="qr-code" style="width: 12px; height: 12px; vertical-align: middle;"></i> PAGADO VÍA QR</span>`
                : `<span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid #10b981; font-weight: 700; font-size: 0.74rem;"><i data-lucide="banknote" style="width: 12px; height: 12px; vertical-align: middle;"></i> PAGO CONTRAENTREGA</span>`;

            const paymentBanner = isQrPaid ? `
                <div style="grid-column: span 2; background: rgba(139, 92, 246, 0.12); border: 1.5px solid rgba(139, 92, 246, 0.45); border-radius: 6px; padding: 0.6rem 0.75rem;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span style="font-size: 0.78rem; font-weight: 800; color: #c4b5fd; display: flex; align-items: center; gap: 0.35rem;">
                            <i data-lucide="qr-code" style="width: 14px; height: 14px;"></i> PAGO CON QR: <strong style="color: #4ade80;">PAGADO PREVIAMENTE</strong>
                        </span>
                        <span class="badge" style="background: #10b981; color: #fff; font-size: 0.68rem; font-weight: 800; padding: 0.2rem 0.45rem;">NO COBRAR AL CLIENTE</span>
                    </div>
                    <div style="font-size: 0.74rem; color: #cbd5e1; line-height: 1.4;">
                        ✓ El cliente ya transfirió los <strong>${Number(p.total).toFixed(2)} Bs</strong> vía QR bancario. No solicites dinero en efectivo al entregar.
                    </div>
                    ${p.qr_comprobante_url ? `
                    <div style="margin-top: 0.35rem;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="openFileViewer('${p.qr_comprobante_url}', 'Comprobante QR - Pedido #${p.pedido_id}', 'qr', null)" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">
                            <i data-lucide="receipt"></i> Ver Comprobante QR
                        </button>
                    </div>` : ''}
                </div>
            ` : `
                <div style="grid-column: span 2; background: rgba(234, 179, 8, 0.12); border: 1.5px solid rgba(234, 179, 8, 0.5); border-radius: 6px; padding: 0.6rem 0.75rem;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem;">
                        <span style="font-size: 0.78rem; font-weight: 800; color: #facc15; display: flex; align-items: center; gap: 0.35rem;">
                            <i data-lucide="banknote" style="width: 14px; height: 14px;"></i> PAGO CONTRAENTREGA: <strong style="color: #fbbf24;">EFECTIVO</strong>
                        </span>
                        <span class="badge" style="background: #f59e0b; color: #000; font-size: 0.68rem; font-weight: 800; padding: 0.2rem 0.45rem;">COBRAR EN EFECTIVO</span>
                    </div>
                    <div style="font-size: 0.74rem; color: #cbd5e1; line-height: 1.4;">
                        ⚠️ <strong>Cobrar al Cliente en Mano:</strong> <span style="font-size: 0.88rem; font-weight: 800; color: #fff;">${Number(p.total).toFixed(2)} Bs</span> en efectivo al momento de entregar el pedido.
                    </div>
                </div>
            `;

            return `
                <div class="order-card">
                    <div class="order-card-header">
                        <span class="order-id">Pedido #${p.pedido_id}</span>
                        ${headerBadge}
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

                        ${paymentBanner}

                        <!-- Dirección de Recogida (Restaurante / Cocina) -->
                        <div style="grid-column: span 2; background: rgba(249, 115, 22, 0.08); border: 1px solid rgba(249, 115, 22, 0.25); border-radius: 6px; padding: 0.5rem 0.65rem;">
                            <div style="font-size: 0.72rem; font-weight: 700; color: #f97316; margin-bottom: 0.2rem; display: flex; align-items: center; gap: 0.35rem;">
                                🏪 Punto de Recogida (Restaurante / Cocina Central):
                            </div>
                            <div style="font-size: 0.8rem; color: #f8fafc;">
                                <strong>${escapeHtml(tienda.nombre || STORE_COORDS.nombre)}</strong> — ${escapeHtml(tienda.direccion || STORE_COORDS.direccion)}
                            </div>
                            ${telTienda ? `<div style="font-size: 0.74rem; color: #fdba74; margin-top: 0.2rem;">📞 Cocina: ${escapeHtml(telTienda)}</div>` : ''}
                        </div>

                        <!-- Dirección de Entrega (Cliente) -->
                        <div style="grid-column: span 2; background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 6px; padding: 0.5rem 0.65rem;">
                            <div style="font-size: 0.72rem; font-weight: 700; color: #38bdf8; margin-bottom: 0.2rem; display: flex; align-items: center; gap: 0.35rem;">
                                🏠 Punto de Entrega (Domicilio del Cliente):
                            </div>
                            <div style="font-size: 0.8rem; color: #f8fafc;">
                                <strong>${escapeHtml(dirEntrega)}</strong> ${refEntrega}
                            </div>
                            ${telEntrega ? `<div style="font-size: 0.74rem; color: var(--accent-green); margin-top: 0.2rem;">📞 Tel Cliente: <a href="tel:${escapeHtml(telEntrega)}" style="color:var(--accent-green); font-weight:700;">${escapeHtml(telEntrega)}</a></div>` : ''}
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
                    <div style="display: flex; justify-content: flex-end; gap: 0.5rem; flex-wrap: wrap;">
                        <button class="btn btn-secondary btn-sm" onclick="openReceiptModal(${p.pedido_id})"><i data-lucide="receipt"></i> Ver Recibo</button>
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
                <h4><i data-lucide="alert-triangle"></i> Error de conexión con el servidor</h4>
                <p>No se pudo conectar con el microservicio de asignación de pedidos. Verifica que el servidor Apache/MySQL esté activo.</p>
                <button class="btn btn-primary btn-sm" onclick="renderRiderOrderQueue()"><i data-lucide="refresh-cw"></i> Reintentar</button>
            </div>
        `;
        showGlobalApiError('Fallo de conexión al consultar los pedidos para repartidores.');
        initLucide();
    }
}

// 🧒 EXPLICACIÓN FÁCIL:
// El repartidor presiona "Aceptar Pedido" para decir "¡Yo llevo esta comida en mi moto!".
// Llama a /Rider/assignment.php y bloquea el pedido para que nadie más se lo quite.
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

        showToast('¡Pedido aceptado exitosamente!', 'success');
        await renderRiderOrderQueue();
    } catch (err) {
        console.error('Error en assignment.php:', err);
        showToast('Error de red al conectar con el servidor.', 'danger');
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
    if (titleEl) {
        titleEl.innerHTML = `Entrega Activa #${activeOrder.id} <button class="btn btn-secondary btn-sm" onclick="openReceiptModal(${activeOrder.id})" style="padding: 0.2rem 0.55rem; font-size: 0.74rem; margin-left: 0.5rem; vertical-align: middle;"><i data-lucide="receipt" style="width:13px;height:13px;vertical-align:middle;"></i> Ver Recibo</button>`;
    }
    
    const clientEl = document.getElementById('riderActiveOrderClient');
    if (clientEl) clientEl.innerHTML = `<strong>Cliente:</strong> ${escapeHtml(activeOrder.cliente_nombre || 'Cliente')}`;

    // Desglose oficial de Direcciones (Recogida en Tienda + Entrega a Cliente)
    const addrEl = document.getElementById('riderActiveOrderAddress');
    if (addrEl) {
        const storeInfo = activeOrder.tienda_recogida || STORE_COORDS;
        const dirCli = activeOrder.direccion_entrega || 'Ubicación seleccionada en mapa';
        const refCli = activeOrder.referencia_entrega ? `(${escapeHtml(activeOrder.referencia_entrega)})` : '';
        const telCli = activeOrder.telefono_contacto || activeOrder.cliente_telefono || '';
        const telStore = storeInfo.telefono || STORE_COORDS.telefono || '';

        addrEl.innerHTML = `
            <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 0.75rem; margin-top: 0.5rem; display: flex; flex-direction: column; gap: 0.6rem;">
                <div style="display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.82rem;">
                    <span style="background: #f97316; color: #fff; padding: 0.2rem 0.45rem; border-radius: 4px; font-size: 0.72rem; font-weight: 700; flex-shrink: 0;">RECOGIDA</span>
                    <div>
                        <strong style="color: #fff;">${escapeHtml(storeInfo.nombre || STORE_COORDS.nombre)}</strong><br>
                        <span style="color: var(--text-secondary); font-size: 0.78rem;">📍 ${escapeHtml(storeInfo.direccion || STORE_COORDS.direccion)}</span>
                        ${telStore ? `<br><span style="color: var(--accent-green); font-size: 0.76rem;">📞 Tel Cocina: <a href="tel:${escapeHtml(telStore)}" style="color:var(--accent-green); font-weight:700;">${escapeHtml(telStore)}</a></span>` : ''}
                    </div>
                </div>
                <div style="border-top: 1px dashed rgba(255,255,255,0.12); padding-top: 0.5rem; display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.82rem;">
                    <span style="background: #38bdf8; color: #0f172a; padding: 0.2rem 0.45rem; border-radius: 4px; font-size: 0.72rem; font-weight: 700; flex-shrink: 0;">ENTREGA</span>
                    <div>
                        <strong style="color: #fff;">${escapeHtml(activeOrder.cliente_nombre || 'Cliente')}</strong><br>
                        <span style="color: var(--text-secondary); font-size: 0.78rem;">🏠 ${escapeHtml(dirCli)} ${refCli}</span>
                        ${telCli ? `<br><span style="color: var(--accent-green); font-size: 0.76rem;">📞 Cel Cliente: <a href="tel:${escapeHtml(telCli)}" style="color:var(--accent-green); font-weight:700;">${escapeHtml(telCli)}</a></span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    const details = activeOrder.items || [];
    const detailsText = details.map(d => `${d.cantidad}x ${d.nombre || 'Producto'}`).join(', ');
    
    const itemsEl = document.getElementById('riderActiveOrderItems');
    if (itemsEl) itemsEl.innerHTML = `<strong>Detalles:</strong> ${escapeHtml(detailsText || 'Sin detalles')}`;
    
    const payEl = document.getElementById('riderActiveOrderPayment');
    const isQrPaid = activeOrder.estado_pago === 'pagado_qr';
    if (payEl) {
        if (isQrPaid) {
            payEl.innerHTML = `
                <div style="background: rgba(139, 92, 246, 0.12); border: 1.5px solid rgba(139, 92, 246, 0.45); border-radius: 6px; padding: 0.65rem 0.85rem; margin-top: 0.5rem;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem;">
                        <strong style="color: #c4b5fd; font-size: 0.82rem; display: flex; align-items: center; gap: 0.35rem;">
                            <i data-lucide="qr-code" style="width: 14px; height: 14px;"></i> Estado de Pago: PAGADO CON QR
                        </strong>
                        <span class="badge" style="background: #10b981; color: #fff; font-size: 0.7rem; font-weight: 800; padding: 0.2rem 0.5rem;">NO COBRAR AL CLIENTE</span>
                    </div>
                    <div style="color: #cbd5e1; font-size: 0.76rem; line-height: 1.4;">
                        ✓ El monto de <strong>${Number(activeOrder.total).toFixed(2)} Bs</strong> ya fue transferido por el cliente vía QR bancario. No solicites dinero en efectivo al entregar.
                    </div>
                    ${activeOrder.qr_comprobante_url ? `
                    <div style="margin-top: 0.4rem;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="openFileViewer('${activeOrder.qr_comprobante_url}', 'Comprobante QR - Pedido #${activeOrder.id}', 'qr', null)" style="font-size: 0.72rem; padding: 0.2rem 0.5rem;">
                            <i data-lucide="receipt"></i> Inspeccionar Comprobante QR
                        </button>
                    </div>` : ''}
                </div>
            `;
        } else {
            payEl.innerHTML = `
                <div style="background: rgba(234, 179, 8, 0.12); border: 1.5px solid rgba(234, 179, 8, 0.5); border-radius: 6px; padding: 0.65rem 0.85rem; margin-top: 0.5rem;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem;">
                        <strong style="color: #facc15; font-size: 0.82rem; display: flex; align-items: center; gap: 0.35rem;">
                            <i data-lucide="banknote" style="width: 14px; height: 14px;"></i> Estado de Pago: CONTRAENTREGA EN EFECTIVO
                        </strong>
                        <span class="badge" style="background: #f59e0b; color: #000; font-size: 0.7rem; font-weight: 800; padding: 0.2rem 0.5rem;">COBRAR EN EFECTIVO</span>
                    </div>
                    <div style="color: #cbd5e1; font-size: 0.76rem; line-height: 1.4;">
                        ⚠️ <strong>Cobrar en Mano al Cliente:</strong> <span style="font-size: 0.95rem; font-weight: 800; color: #fff;">${Number(activeOrder.total).toFixed(2)} Bs</span> en efectivo al entregar el pedido.
                    </div>
                </div>
            `;
        }
    }

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
            if (isQrPaid) {
                activeBtn.innerText = 'Finalizar Entrega (Entregar sin Cobro)';
                activeBtn.className = 'btn btn-success';
            } else {
                activeBtn.innerText = `Finalizar Entrega (Cobrar ${Number(activeOrder.total).toFixed(2)} Bs)`;
                activeBtn.className = 'btn btn-success';
            }
            cancelBtn.style.display = 'none';
        }
    }

    setTimeout(() => {
        if (!riderTrackingMapInstance) {
            riderTrackingMapInstance = L.map('riderOrderMap', {
                zoomControl: false,
                maxBounds: LA_PAZ_BOUNDS,
                minZoom: 12
            });

            L.tileLayer(MAP_TILE_URL, {
                attribution: MAP_TILE_ATTR,
                maxZoom: 19
            }).addTo(riderTrackingMapInstance);

            riderTrackingMarkerStore = L.marker([STORE_COORDS.lat, STORE_COORDS.lon], {
                icon: createStorePinIcon()
            }).addTo(riderTrackingMapInstance).bindPopup(`<b>${escapeHtml(STORE_COORDS.nombre)}</b><br>${escapeHtml(STORE_COORDS.direccion)}<br>📞 ${escapeHtml(STORE_COORDS.telefono || '')}`);
        } else {
            riderTrackingMapInstance.invalidateSize();
            if (riderTrackingMarkerStore) {
                riderTrackingMarkerStore.setLatLng([STORE_COORDS.lat, STORE_COORDS.lon]);
                riderTrackingMarkerStore.setPopupContent(`<b>${escapeHtml(STORE_COORDS.nombre)}</b><br>${escapeHtml(STORE_COORDS.direccion)}<br>📞 ${escapeHtml(STORE_COORDS.telefono || '')}`);
            }
        }

        const clientPopupText = `<b>${escapeHtml(activeOrder.cliente_nombre || 'Cliente')}</b><br>🏠 ${escapeHtml(activeOrder.direccion_entrega || 'Dirección de Entrega')}${activeOrder.telefono_contacto ? '<br>📞 ' + escapeHtml(activeOrder.telefono_contacto) : ''}`;
        if (riderTrackingMarkerClient) {
            riderTrackingMarkerClient.setLatLng([latCliente, lonCliente]);
            riderTrackingMarkerClient.setPopupContent(clientPopupText);
        } else {
            riderTrackingMarkerClient = L.marker([latCliente, lonCliente], {
                icon: createClientPinIcon("Dirección del Cliente")
            }).addTo(riderTrackingMapInstance).bindPopup(clientPopupText);
        }

        renderDeliveryRoute(
            riderTrackingMapInstance,
            [STORE_COORDS.lat, STORE_COORDS.lon],
            [latCliente, lonCliente],
            riderTrackingRouteLine,
            { color: '#10b981', glowColor: 'rgba(16, 185, 129, 0.35)' }
        ).then(layer => {
            riderTrackingRouteLine = layer;
        });

        const bounds = L.latLngBounds([
            [STORE_COORDS.lat, STORE_COORDS.lon],
            [latCliente, lonCliente]
        ]);
        riderTrackingMapInstance.fitBounds(bounds, { padding: [25, 25] });

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
                icon: createRiderPinIcon()
            }).addTo(riderTrackingMapInstance).bindPopup("<b>Tu Posición (Repartidor)</b>");
        }
    }, 200);
}

// ========================================================================================
// 🛵 FUNCIÓN: processRiderActiveOrderStep (El Semáforo de la Motito)
// ¿Para qué sirve?
// Hace avanzar el viaje en la motito paso a paso:
// 1. Si estaba "asignado", cambia a "en camino" (la moto arranca hacia la casa).
// 2. Si estaba "en camino", cambia a "entregado" (el cliente recibe su comida caliente).
// ========================================================================================
async function processRiderActiveOrderStep() {
    const r = currentSession.rider;
    const activeOrder = window._riderActiveOrder;

    if (!activeOrder) return;

    const oldState = activeOrder.estado_pedido;
    const nextState = oldState === 'asignado' ? 'en_camino' : 'entregado';
    const isContra = activeOrder.estado_pago === 'contraentrega' || activeOrder.estado_pago === 'pagado_efectivo';
    let msg = nextState === 'en_camino'
        ? 'Viaje iniciado hacia el domicilio del cliente. Conduce con precaución.'
        : (isContra
            ? `¡Pedido entregado con éxito! Has cobrado ${Number(activeOrder.total).toFixed(2)} Bs en efectivo.`
            : '¡Pedido entregado con éxito! (Pedido ya cancelado previamente vía QR, no se cobró dinero).');

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
            showToast(`Error al avanzar pedido: ${res.error || 'Operación rechazada por el servidor'}`, 'danger');
            return;
        }

        showToast(msg, 'success');
        await renderRiderOrderQueue();
        await renderRiderOrderHistory();
    } catch (err) {
        console.error('Error en delivery.php:', err);
        showToast('Error de conexión al actualizar entrega.', 'danger');
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
                            <p>${escapeHtml(res.error || 'No se pudo obtener el historial de entregas del servidor.')}</p>
                        </div>
                    `;
                    initLucide();
                    return;
                }
            } catch (err) {
                console.error('Fallo obteniendo historial de rider:', err);
                listEl.innerHTML = `
                    <div class="api-error-card">
                        <h4><i data-lucide="alert-triangle"></i> Error de conexión con el servidor</h4>
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

function renderFilteredRiderHistory(filter = 'all', searchQuery = '') {
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

    if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(o => {
            const itemsStr = (o.items || []).map(i => i.nombre || '').join(' ').toLowerCase();
            return (o.cliente_nombre || '').toLowerCase().includes(q) ||
                   String(o.pedido_id).includes(q) ||
                   itemsStr.includes(q);
        });
    }

    if (!filtered.length) {
        listEl.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 2rem; font-size: 0.9rem;">
            No tienes pedidos registrados en la categoría seleccionada (${filter}) ${searchQuery ? `con término "${escapeHtml(searchQuery)}"` : ''}.
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
            ? `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); font-weight:700;"><i data-lucide="banknote" style="width:12px;height:12px;vertical-align:middle;"></i> Contraentrega (Cobrado ${Number(o.total).toFixed(2)} Bs)</span>`
            : `<span class="badge" style="background: rgba(139, 92, 246, 0.15); color: var(--accent-purple); border: 1px solid rgba(139, 92, 246, 0.3); font-weight:700;"><i data-lucide="qr-code" style="width:12px;height:12px;vertical-align:middle;"></i> Pagado vía QR</span>`;

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

        const receptionHtml = o.recepcion_confirmada
            ? `<div style="margin-top: 0.45rem; padding: 0.35rem 0.65rem; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-sm); font-size: 0.78rem; color: #10b981; display: flex; align-items: center; gap: 0.4rem;">
                <i data-lucide="package-check" style="width:13px;height:13px;"></i>
                <span><strong>Comida Recibida por el Cliente</strong>${o.fecha_recepcion_cliente ? ` (${new Date(o.fecha_recepcion_cliente).toLocaleString('es-BO')})` : ''}</span>
               </div>`
            : (o.estado_pedido === 'entregado'
                ? `<div style="margin-top: 0.45rem; padding: 0.35rem 0.65rem; background: rgba(234, 179, 8, 0.08); border: 1px solid rgba(234, 179, 8, 0.25); border-radius: var(--radius-sm); font-size: 0.78rem; color: #facc15; display: flex; align-items: center; gap: 0.4rem;">
                    <i data-lucide="clock" style="width:13px;height:13px;"></i>
                    <span>Esperando confirmación de recepción del cliente</span>
                   </div>`
                : '');

        const ratingHtml = o.calificacion_entrega
            ? `<div style="margin-top: 0.45rem; padding: 0.45rem 0.75rem; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: var(--radius-sm); font-size: 0.8rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;">
                <span>⭐ <strong>Calificación del Cliente:</strong> <span style="color:#f59e0b; font-weight:700;">${'★'.repeat(o.calificacion_entrega)}${'☆'.repeat(5 - o.calificacion_entrega)}</span> (${o.calificacion_entrega}/5)</span>
                ${o.comentario_entrega ? `<span style="color:var(--text-secondary); font-style:italic;">“${escapeHtml(o.comentario_entrega)}”</span>` : ''}
               </div>`
            : '';

        return `
            <div class="order-card" style="border-left: 3px solid ${o.estado_pedido === 'entregado' ? '#10b981' : (o.estado_pedido === 'rechazado' || o.estado_pedido === 'cancelado' ? '#ef4444' : '#f97316')};">
                <div class="order-card-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
                    <div>
                        <span class="order-id" style="font-weight:700;">Pedido #${o.pedido_id}</span>
                        <span style="font-size:0.75rem; color:var(--text-muted); margin-left:0.5rem;">${dateStr}</span>
                    </div>
                    <div style="display:flex; gap:0.4rem; align-items:center;">
                        <button class="btn btn-secondary btn-sm" onclick="openReceiptModal(${o.pedido_id})" style="padding: 0.2rem 0.5rem; font-size: 0.72rem;"><i data-lucide="receipt" style="width:12px;height:12px;vertical-align:middle;"></i> Recibo</button>
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
                ${receptionHtml}
                ${ratingHtml}
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
            const searchVal = document.getElementById('txtRiderHistorySearch')?.value || '';
            renderFilteredRiderHistory(btn.dataset.filter, searchVal);
        });
    });

    const searchInput = document.getElementById('txtRiderHistorySearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const activeFilter = document.querySelector('.rider-filter-btn.active')?.dataset.filter || 'all';
            renderFilteredRiderHistory(activeFilter, e.target.value);
        });
    }
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
                    <h4><i data-lucide="alert-triangle"></i> Error en el servidor</h4>
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
                <h4><i data-lucide="alert-triangle"></i> Error de conexión con el servidor</h4>
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
        custContainer.innerHTML = pendingCustomers.map(u => {
            const isAppeal = u.apelacion_estado === 'pendiente';
            return `
            <div class="approval-card">
                <div class="approval-card-header">
                    <div style="display:flex; align-items:center; gap:0.65rem;">
                        <img src="${resolveFileUrl(u.foto_url || u.ci_url, 'foto', u.id)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:1.5px solid rgba(255,255,255,0.15);flex-shrink:0;" />
                        <div class="approval-user-info">
                            <strong>${escapeHtml(u.nombre)}</strong>
                            <span style="font-size:0.75rem; color:var(--text-secondary);">${escapeHtml(u.email)}</span>
                        </div>
                    </div>
                    <span class="badge ${isAppeal ? 'badge-warning' : 'badge-pending'}">${isAppeal ? '⚖️ Apelación' : 'Pendiente'}</span>
                </div>
                ${isAppeal ? `
                <div style="background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.3); border-radius:6px; padding:0.45rem 0.6rem; font-size:0.78rem; margin:0.45rem 0;">
                    <strong style="color:#f59e0b;">⚖️ Motivo de Apelación:</strong> ${escapeHtml(u.apelacion_motivo || 'Revisión solicitada')}
                    ${u.motivo_rechazo ? `<div style="color:#fca5a5; font-size:0.72rem; margin-top:0.2rem;">Rechazo previo: ${escapeHtml(u.motivo_rechazo)}</div>` : ''}
                </div>` : ''}
                <div class="approval-details-row">
                    <span>Nacimiento: ${u.fecha_nacimiento || 'N/A'}</span>
                    <span>Edad: ${u.fecha_nacimiento ? calculateAge(u.fecha_nacimiento) : 18} años</span>
                </div>
                <div style="display: flex; gap: 0.45rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
                    <a class="file-view-trigger" onclick="openFileViewer('${u.ci_url || ''}', 'C.I. Anverso - ${escapeHtml(u.nombre)}', 'ci', ${u.id})"><i data-lucide="eye" style="width:13px;height:13px;"></i> C.I. Anverso</a>
                    <a class="file-view-trigger" onclick="openFileViewer('${u.ci_reverso_url || u.ci_url || ''}', 'C.I. Reverso - ${escapeHtml(u.nombre)}', 'ci', ${u.id})"><i data-lucide="eye" style="width:13px;height:13px;"></i> C.I. Reverso</a>
                </div>
                <div class="approval-actions" style="justify-content: flex-end;">
                    <button class="btn btn-danger btn-sm" onclick="promptRejectUser(${u.id})">Rechazar</button>
                    <button class="btn btn-success btn-sm" onclick="approveUser(${u.id}, 'verified')">Aprobar</button>
                </div>
            </div>
        `;
        }).join('');
    }

    if (pendingRidersDocs.length === 0) {
        riderContainer.innerHTML = `<div style="color: var(--text-secondary); font-size: 0.9rem;">No hay expedientes de riders pendientes de aprobación.</div>`;
    } else {
        riderContainer.innerHTML = pendingRidersDocs.map(d => {
            const riderId = d.rider_id || d.id;
            const riderName = d.nombre || 'Rider';
            const riderEmail = d.email || '';
            const isAppeal = d.apelacion_estado === 'pendiente';

            return `
                <div class="approval-card">
                    <div class="approval-card-header">
                        <div style="display:flex; align-items:center; gap:0.65rem;">
                            <img src="${resolveFileUrl(d.foto_url || d.ci_url, 'foto', riderId)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:1.5px solid rgba(255,255,255,0.15);flex-shrink:0;" />
                            <div class="approval-user-info">
                                <strong>${escapeHtml(riderName)}</strong>
                                <span style="font-size:0.75rem; color:var(--text-secondary);">${escapeHtml(riderEmail)}</span>
                            </div>
                        </div>
                        <span class="badge ${isAppeal ? 'badge-warning' : 'badge-pending'}">${isAppeal ? '⚖️ Apelación' : 'Expediente'}</span>
                    </div>
                    ${isAppeal ? `
                    <div style="background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.3); border-radius:6px; padding:0.45rem 0.6rem; font-size:0.78rem; margin:0.45rem 0;">
                        <strong style="color:#f59e0b;">⚖️ Motivo de Apelación:</strong> ${escapeHtml(d.apelacion_motivo || 'Revisión solicitada')}
                        ${d.motivo_rechazo ? `<div style="color:#fca5a5; font-size:0.72rem; margin-top:0.2rem;">Rechazo previo: ${escapeHtml(d.motivo_rechazo)}</div>` : ''}
                    </div>` : ''}
                    <div style="display: flex; flex-direction:column; gap:0.35rem; font-size: 0.85rem; border:1px solid var(--border-color); padding:0.5rem; border-radius:var(--radius-md); background: rgba(0,0,0,0.1);">
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.35rem;">
                            <a class="file-view-trigger" onclick="openFileViewer('${d.licencia_url}', 'Licencia Anverso - ${escapeHtml(riderName)}', 'licencia', ${riderId})"><i data-lucide="file-text" style="width:13px;height:13px;"></i> Lic. Anverso</a>
                            <a class="file-view-trigger" onclick="openFileViewer('${d.licencia_reverso_url || d.licencia_url}', 'Licencia Reverso - ${escapeHtml(riderName)}', 'licencia', ${riderId})"><i data-lucide="file-text" style="width:13px;height:13px;"></i> Lic. Reverso</a>
                        </div>
                        <a class="file-view-trigger" onclick="openFileViewer('${d.seguro_url}', 'Seguro SOAT - ${escapeHtml(riderName)}', 'seguro', ${riderId})"><i data-lucide="shield" style="width:13px;height:13px;"></i> Seguro SOAT</a>
                        <a class="file-view-trigger" onclick="openFileViewer('${d.cv_url}', 'Currículum Vitae - ${escapeHtml(riderName)}', 'cv', ${riderId})"><i data-lucide="file-check" style="width:13px;height:13px;"></i> Currículum Vitae (PDF)</a>
                    </div>
                    <div class="approval-actions" style="justify-content: flex-end; margin-top:0.5rem;">
                        <button class="btn btn-danger btn-sm" onclick="promptRejectRider(${riderId})">Rechazar</button>
                        <button class="btn btn-success btn-sm" onclick="approveRiderDocs(${riderId}, 'aprobado')">Aprobar Rider</button>
                    </div>
                </div>
            `;
        }).join('');
    }
    initLucide();
}

window.promptRejectUser = function(userId) {
    const motivo = prompt('Por favor, ingresa el motivo del rechazo del C.I. (el usuario podrá verlo para apelar):', 'C.I. ilegible o fotos borrosas');
    if (motivo !== null) {
        approveUser(userId, 'rejected', motivo);
    }
};

window.promptRejectRider = function(riderId) {
    const motivo = prompt('Por favor, ingresa el motivo del rechazo del expediente (el rider podrá verlo para apelar):', 'Documentos ilegibles o incompletos');
    if (motivo !== null) {
        approveRiderDocs(riderId, 'rechazado', motivo);
    }
};

window.approveUser = async function(userId, status, motivo = null) {
    const mappedState = (status === 'verified' ? 'aprobado' : 'rechazado');

    try {
        const payload = {
            target_id: userId,
            tipo: 'user',
            estado: mappedState
        };
        if (motivo) {
            payload.motivo_rechazo = motivo;
        }

        const res = await apiPost('/Auth/admin_approval.php', payload);
        if (res.ok) {
            showToast(`Cliente ${status === 'verified' ? 'aprobado' : 'rechazado'} en MySQL exitosamente.`, 'success');
            await renderAdminPendingApprovals();
            await renderAdminAllUsers();
        } else {
            showToast(`Error al procesar cliente: ${res.error || 'Operación rechazada.'}`, 'danger');
        }
    } catch (err) {
        console.error('Fallo llamada a /Auth/admin_approval.php:', err);
        showToast('Error de conexión al actualizar cliente.', 'danger');
    }
};

window.approveRiderDocs = async function(riderOrDocId, status, motivo = null) {
    const doc = (window._adminAllRiders || []).find(d => d.doc_id === riderOrDocId || d.rider_id === riderOrDocId);
    const targetRiderId = doc ? doc.rider_id : riderOrDocId;

    try {
        const payload = {
            target_id: targetRiderId,
            tipo: 'rider',
            estado: status
        };
        if (motivo) {
            payload.motivo_rechazo = motivo;
        }

        const res = await apiPost('/Auth/admin_approval.php', payload);
        if (res.ok) {
            showToast(`Expediente de Rider ${status} en MySQL exitosamente.`, 'success');
            await renderAdminPendingApprovals();
            await renderAdminAllUsers();
        } else {
            showToast(`Error al procesar rider: ${res.error || 'Operación rechazada.'}`, 'danger');
        }
    } catch (err) {
        console.error('Fallo llamada a /Auth/admin_approval.php para rider:', err);
        showToast('Error de conexión al actualizar rider.', 'danger');
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
    if (subtitleEl) {
        if (type === 'ci') subtitleEl.innerText = 'Cédula de Identidad Oficial (SEGIP)';
        else if (type === 'licencia') subtitleEl.innerText = 'Licencia de Conducir (Tránsito Bolivia)';
        else if (type === 'seguro') subtitleEl.innerText = 'Póliza de Seguro SOAT (UNIVIDA S.A.)';
        else if (type === 'cv') subtitleEl.innerText = 'Currículum Vitae y Registro Documental';
        else if (type === 'qr') subtitleEl.innerText = 'Comprobante de Pago QR Bancario';
        else subtitleEl.innerText = 'Documento Oficial Verificado';
    }
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
            imgEl.onerror = () => {
                imgEl.style.display = 'none';
                if (pdfEl) {
                    pdfEl.style.display = 'block';
                    pdfEl.src = targetUrl;
                }
            };
        }
        if (iconEl) iconEl.setAttribute('data-lucide', 'image');
    }

    modal.classList.add('active');
    initLucide();
};

// -------------------------------------------------------
// MODAL "MI PERFIL" INTERACTIVO (CLIENTE, RIDER, ADMIN)
// -------------------------------------------------------
window.openUserProfile = async function() {
    const modal = document.getElementById('userProfileModal');
    if (!modal) return;

    const u = currentSession.currentUser;
    if (!u) {
        showToast('Debes iniciar sesión para consultar tu perfil.', 'warning');
        return;
    }

    const nameEl = document.getElementById('profileModalUserName');
    const emailEl = document.getElementById('profileModalUserEmail');
    const avatarEl = document.getElementById('profileRoleAvatar');
    const roleBadgeEl = document.getElementById('profileBadgeRole');
    const ciBadgeEl = document.getElementById('profileBadgeCI');
    const memberSinceEl = document.getElementById('profileMemberSince');
    const birthEl = document.getElementById('profileBirthDate');
    const userIdEl = document.getElementById('profileUserId');
    const btnViewCI = document.getElementById('btnProfileViewCI');
    const riderSection = document.getElementById('profileRiderSection');
    const metricsContent = document.getElementById('profileMetricsContent');

    const cleanUserName = cleanText(u.nombre || 'Usuario');
    if (nameEl) nameEl.innerText = cleanUserName;
    if (emailEl) emailEl.innerText = u.email || '';

    const avatarImg = document.getElementById('profileUserAvatarImg');
    const avatarLetter = document.getElementById('profileUserAvatarLetter');
    const photoSrc = u.foto_url || u.ci_url;
    if (avatarImg && photoSrc) {
        avatarImg.src = resolveFileUrl(photoSrc, 'foto', u.id);
        avatarImg.style.display = 'block';
        if (avatarLetter) avatarLetter.style.display = 'none';
    } else {
        if (avatarImg) avatarImg.style.display = 'none';
        if (avatarLetter) {
            avatarLetter.style.display = 'inline-block';
            avatarLetter.innerText = (cleanUserName.charAt(0) || 'U').toUpperCase();
        }
    }
    if (userIdEl) userIdEl.innerText = `#${u.id}`;

    // Role badge
    let roleText = 'Cliente';
    let roleBadgeClass = 'badge-primary';
    if (u.role === 'rider') {
        roleText = 'Repartidor / Rider';
        roleBadgeClass = 'badge-warning';
    } else if (u.role === 'super_usuario' || u.role === 'admin') {
        roleText = 'Administrador Central';
        roleBadgeClass = 'badge-danger';
    }
    if (roleBadgeEl) roleBadgeEl.innerHTML = `<span class="badge ${roleBadgeClass}">${roleText}</span>`;

    // CI badge
    let ciText = 'Verificado';
    let ciClass = 'badge-verified';
    if (u.ci_status === 'pending') {
        ciText = 'Pendiente de Aprobación';
        ciClass = 'badge-pending';
    } else if (u.ci_status === 'rejected') {
        ciText = 'Rechazado';
        ciClass = 'badge-rejected';
    }
    if (ciBadgeEl) ciBadgeEl.innerHTML = `<span class="badge ${ciClass}">${ciText}</span>`;

    // Wire view CI buttons (Anverso y Reverso)
    const btnViewCIReverso = document.getElementById('btnProfileViewCIReverso');
    if (btnViewCI) {
        btnViewCI.onclick = () => {
            window.openFileViewer(u.ci_url || '', `C.I. Anverso - ${cleanUserName}`, 'ci', u.id);
        };
    }
    if (btnViewCIReverso) {
        btnViewCIReverso.onclick = () => {
            window.openFileViewer(u.ci_reverso_url || u.ci_url || '', `C.I. Reverso - ${cleanUserName}`, 'ci', u.id);
        };
    }

    // Banner de Rechazo en el Perfil
    const rejectionBanner = document.getElementById('profileRejectionBanner');
    const rejectionReasonText = document.getElementById('profileRejectionReasonText');
    const btnProfileOpenAppeal = document.getElementById('btnProfileOpenAppeal');

    const esRechazado = u.ci_status === 'rejected';
    const motivoRechazo = u.motivo_rechazo || 'Documento ilegible o no válido.';

    if (rejectionBanner) {
        if (esRechazado) {
            rejectionBanner.style.display = 'block';
            if (rejectionReasonText) {
                rejectionReasonText.innerHTML = `<strong>Motivo reportado:</strong> ${escapeHtml(motivoRechazo)}`;
            }
            if (btnProfileOpenAppeal) {
                if (u.apelacion_estado === 'pendiente') {
                    btnProfileOpenAppeal.innerText = '⚖️ Apelación Enviada (En Revisión)';
                    btnProfileOpenAppeal.disabled = true;
                } else {
                    btnProfileOpenAppeal.innerText = '⚖️ Presentar Apelación y Resubir Documentos';
                    btnProfileOpenAppeal.disabled = false;
                    btnProfileOpenAppeal.onclick = () => {
                        window.closeUserProfile();
                        window.openAppealModal();
                    };
                }
            }
        } else {
            rejectionBanner.style.display = 'none';
        }
    }

    // Default loading metrics
    if (metricsContent) {
        metricsContent.innerHTML = `<div style="grid-column: span 2; color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 0.5rem;">
            <i data-lucide="loader-2" class="spin"></i> Cargando métricas actualizadas...
        </div>`;
    }

    // Show modal immediately
    modal.classList.add('active');
    initLucide();

    // Query microservices/Auth/profile.php for real MySQL data
    try {
        const res = await apiGet('/Auth/profile.php');
        if (res.ok && res.data) {
            const data = res.data;
            const fullUser = data.user || {};
            const metrics = data.metrics || {};
            const riderDocs = data.rider_docs || {};

            if (birthEl) {
                birthEl.innerText = fullUser.fecha_nacimiento ? `${fullUser.fecha_nacimiento} (${calculateAge(fullUser.fecha_nacimiento)} años)` : 'No especificada';
            }
            if (memberSinceEl) {
                memberSinceEl.innerText = fullUser.created_at ? fullUser.created_at.substring(0, 10) : 'Activo';
            }

            // Población de Dirección habitual y Teléfono de contacto
            const inputDir = document.getElementById('profileInputDireccion');
            const inputTel = document.getElementById('profileInputTelefono');
            if (inputDir) inputDir.value = fullUser.direccion || (currentSession.currentUser ? currentSession.currentUser.direccion : '') || '';
            if (inputTel) inputTel.value = fullUser.telefono || (currentSession.currentUser ? currentSession.currentUser.telefono : '') || '';

            // Actualizar botones de CI con datos del perfil real
            if (btnViewCI) {
                btnViewCI.onclick = () => window.openFileViewer(fullUser.ci_url || '', `C.I. Anverso - ${cleanUserName}`, 'ci', fullUser.id);
            }
            if (btnViewCIReverso) {
                btnViewCIReverso.onclick = () => window.openFileViewer(fullUser.ci_reverso_url || fullUser.ci_url || '', `C.I. Reverso - ${cleanUserName}`, 'ci', fullUser.id);
            }

            // Rider Section
            if (fullUser.role === 'rider') {
                if (riderSection) riderSection.style.display = 'block';

                const btnLic = document.getElementById('btnProfileViewLicencia');
                const btnLicRev = document.getElementById('btnProfileViewLicenciaReverso');
                const btnSoat = document.getElementById('btnProfileViewSOAT');
                const btnCv = document.getElementById('btnProfileViewCV');
                const cashEl = document.getElementById('profileRiderCash');
                const delivEl = document.getElementById('profileRiderDeliveries');

                if (cashEl) cashEl.innerText = `${Number(metrics.efectivo_en_mano || 0).toFixed(2)} Bs`;
                if (delivEl) delivEl.innerText = metrics.entregas_completadas || 0;

                if (btnLic) {
                    btnLic.onclick = () => window.openFileViewer(riderDocs.licencia_url || '', `Licencia Anverso - ${cleanUserName}`, 'licencia', fullUser.id);
                }
                if (btnLicRev) {
                    btnLicRev.onclick = () => window.openFileViewer(riderDocs.licencia_reverso_url || riderDocs.licencia_url || '', `Licencia Reverso - ${cleanUserName}`, 'licencia', fullUser.id);
                }
                if (btnSoat) {
                    btnSoat.onclick = () => window.openFileViewer(riderDocs.seguro_url || '', `SOAT - ${cleanUserName}`, 'soat', fullUser.id);
                }
                if (btnCv) {
                    btnCv.onclick = () => window.openFileViewer(riderDocs.cv_url || '', `Currículum Vitae - ${cleanUserName}`, 'cv', fullUser.id);
                }

                // Banner de rechazo específico de rider
                if (rejectionBanner && (riderDocs.estado_aprobacion === 'rechazado' || fullUser.ci_status === 'rejected')) {
                    rejectionBanner.style.display = 'block';
                    if (rejectionReasonText) {
                        rejectionReasonText.innerHTML = `<strong>Motivo de rechazo de expediente:</strong> ${escapeHtml(riderDocs.motivo_rechazo || fullUser.motivo_rechazo || 'Documentación no aprobada.')}`;
                    }
                }

                if (metricsContent) {
                    metricsContent.innerHTML = `
                        <div class="profile-metric-card">
                            <span class="metric-lbl">Total Entregas</span>
                            <span class="metric-val" style="color: #10b981;">${metrics.entregas_completadas || 0}</span>
                        </div>
                        <div class="profile-metric-card">
                            <span class="metric-lbl">Entregas en Curso</span>
                            <span class="metric-val" style="color: #3b82f6;">${metrics.entregas_activas || 0}</span>
                        </div>
                        <div class="profile-metric-card">
                            <span class="metric-lbl">Efectivo por Rendir</span>
                            <span class="metric-val" style="color: #f59e0b;">${Number(metrics.efectivo_en_mano || 0).toFixed(2)} Bs</span>
                        </div>
                        <div class="profile-metric-card">
                            <span class="metric-lbl">Efectivo ya Rendido</span>
                            <span class="metric-val" style="color: #f97316;">${Number(metrics.efectivo_liquidado || 0).toFixed(2)} Bs</span>
                        </div>
                    `;
                }

            } else if (fullUser.role === 'cliente') {
                if (riderSection) riderSection.style.display = 'none';

                if (metricsContent) {
                    metricsContent.innerHTML = `
                        <div class="profile-metric-card">
                            <span class="metric-lbl">Total de Pedidos</span>
                            <span class="metric-val" style="color: #3b82f6;">${metrics.total_pedidos || 0}</span>
                        </div>
                        <div class="profile-metric-card">
                            <span class="metric-lbl">Pedidos Entregados</span>
                            <span class="metric-val" style="color: #10b981;">${metrics.pedidos_entregados || 0}</span>
                        </div>
                        <div class="profile-metric-card">
                            <span class="metric-lbl">Pedidos en Camino</span>
                            <span class="metric-val" style="color: #f59e0b;">${metrics.pedidos_activos || 0}</span>
                        </div>
                        <div class="profile-metric-card">
                            <span class="metric-lbl">Total Invertido</span>
                            <span class="metric-val" style="color: #ec4899;">${Number(metrics.total_gastado || 0).toFixed(2)} Bs</span>
                        </div>
                    `;
                }

            } else if (fullUser.role === 'super_usuario' || fullUser.role === 'admin') {
                if (riderSection) riderSection.style.display = 'none';

                if (metricsContent) {
                    metricsContent.innerHTML = `
                        <div class="profile-metric-card">
                            <span class="metric-lbl">Usuarios en Sistema</span>
                            <span class="metric-val" style="color: #3b82f6;">${metrics.total_usuarios || 0}</span>
                        </div>
                        <div class="profile-metric-card">
                            <span class="metric-lbl">Clientes Registrados</span>
                            <span class="metric-val" style="color: #10b981;">${metrics.total_clientes || 0}</span>
                        </div>
                        <div class="profile-metric-card">
                            <span class="metric-lbl">Flota de Riders</span>
                            <span class="metric-val" style="color: #f97316;">${metrics.total_riders || 0}</span>
                        </div>
                        <div class="profile-metric-card">
                            <span class="metric-lbl">Postulaciones Pendientes</span>
                            <span class="metric-val" style="color: #f59e0b;">${metrics.riders_pendientes || 0}</span>
                        </div>
                    `;
                }
            }
        }
    } catch (err) {
        console.warn('Fallo al obtener métricas completas de perfil:', err);
        if (metricsContent) {
            metricsContent.innerHTML = `<div style="grid-column:span 2; color:var(--text-muted); font-size:0.8rem; text-align:center;">Perfil sincronizado localmente.</div>`;
        }
    }

    initLucide();
};

window.closeUserProfile = function() {
    const modal = document.getElementById('userProfileModal');
    if (modal) modal.classList.remove('active');
};

window.handleSaveProfileContact = async function(event) {
    if (event) event.preventDefault();

    const dirEl = document.getElementById('profileInputDireccion');
    const telEl = document.getElementById('profileInputTelefono');
    const direccion = dirEl ? dirEl.value.trim() : '';
    const telefono = telEl ? telEl.value.trim() : '';

    const btn = document.getElementById('btnSaveProfileContact');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Guardando...';
    }

    try {
        const res = await apiPut('/Auth/profile.php', { direccion, telefono });
        if (!res.ok) {
            showToast(`Error: ${res.error || 'No se pudo actualizar los datos de contacto.'}`, 'danger');
            return;
        }

        if (currentSession.currentUser) {
            currentSession.currentUser.direccion = direccion;
            currentSession.currentUser.telefono = telefono;
        }
        if (currentSession.cliente) {
            currentSession.cliente.direccion = direccion;
            currentSession.cliente.telefono = telefono;
        }

        // Si el checkout está abierto o tiene campos vacíos, auto-completarlos también
        const checkDir = document.getElementById('txtCheckoutDireccion');
        const checkTel = document.getElementById('txtCheckoutTelefono');
        if (checkDir && !checkDir.value) checkDir.value = direccion;
        if (checkTel && !checkTel.value) checkTel.value = telefono;

        showToast('¡Tus datos de dirección y teléfono se guardaron exitosamente!', 'success');
    } catch (e) {
        console.error('Error guardando perfil:', e);
        showToast('Error de red al actualizar datos de contacto.', 'danger');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="save"></i> Guardar Mis Datos';
            initLucide();
        }
    }
};

// =======================================================
// ⚖️ SISTEMA DE APELACIÓN DE RECHAZO (CLIENTES Y RIDERS)
// =======================================================
window.openAppealModal = function() {
    const modal = document.getElementById('appealModal');
    if (!modal) return;

    const u = currentSession.currentUser;
    if (!u) {
        showToast('Debes iniciar sesión para apelar un rechazo.', 'warning');
        return;
    }

    const clientFields = document.getElementById('appealClientFields');
    const riderFields = document.getElementById('appealRiderFields');

    if (u.role === 'rider') {
        if (clientFields) clientFields.style.display = 'none';
        if (riderFields) riderFields.style.display = 'flex';
        // Configurar required para rider
        const lAnv = document.getElementById('fileAppealLicenciaAnverso');
        const lRev = document.getElementById('fileAppealLicenciaReverso');
        if (lAnv) lAnv.required = true;
        if (lRev) lRev.required = true;
        const ciAnv = document.getElementById('fileAppealCiAnverso');
        const ciRev = document.getElementById('fileAppealCiReverso');
        if (ciAnv) ciAnv.required = false;
        if (ciRev) ciRev.required = false;
    } else {
        if (clientFields) clientFields.style.display = 'flex';
        if (riderFields) riderFields.style.display = 'none';
        const ciAnv = document.getElementById('fileAppealCiAnverso');
        const ciRev = document.getElementById('fileAppealCiReverso');
        if (ciAnv) ciAnv.required = true;
        if (ciRev) ciRev.required = true;
        const lAnv = document.getElementById('fileAppealLicenciaAnverso');
        const lRev = document.getElementById('fileAppealLicenciaReverso');
        if (lAnv) lAnv.required = false;
        if (lRev) lRev.required = false;
    }

    const txtMotivo = document.getElementById('txtAppealMotivo');
    if (txtMotivo) txtMotivo.value = '';

    modal.classList.add('active');
    initLucide();
};

window.closeAppealModal = function() {
    const modal = document.getElementById('appealModal');
    if (modal) modal.classList.remove('active');
};

// -------------------------------------------------------
// MODAL "RECIBO DIGITAL / TICKET DE COMPRA" (PRINT READY)
// -------------------------------------------------------
window.openReceiptModal = async function(orderId) {
    const modal = document.getElementById('orderReceiptModal');
    if (!modal) return;

    const lblNumber = document.getElementById('lblReceiptNumber');
    const lblDate = document.getElementById('lblReceiptDate');
    const lblClient = document.getElementById('lblReceiptClient');
    const lblEmail = document.getElementById('lblReceiptEmail');
    const lblPayment = document.getElementById('lblReceiptPayment');
    const lblStatus = document.getElementById('lblReceiptStatus');
    const lblRider = document.getElementById('lblReceiptRider');
    const tbody = document.getElementById('receiptItemsTbody');
    const lblSubtotal = document.getElementById('lblReceiptSubtotal');
    const lblShipping = document.getElementById('lblReceiptShipping');
    const lblTotal = document.getElementById('lblReceiptTotal');
    const lblHash = document.getElementById('lblReceiptHash');

    if (lblNumber) lblNumber.innerText = `REC-${String(orderId).padStart(6, '0')}`;
    if (tbody) tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 1rem; color: #64748b;">Cargando detalle del recibo...</td></tr>`;

    modal.classList.add('active');
    initLucide();

    try {
        const res = await apiGet('/Transactions/checkout.php', { order_id: orderId });
        if (res.ok && res.data && res.data.recibo) {
            const r = res.data.recibo;
            if (lblNumber) lblNumber.innerText = r.nro_recibo || `REC-${String(orderId).padStart(6, '0')}`;
            if (lblDate) lblDate.innerText = r.created_at ? new Date(r.created_at).toLocaleString('es-BO') : new Date().toLocaleString('es-BO');
            if (lblClient) lblClient.innerText = cleanText(r.cliente ? r.cliente.nombre : 'Cliente');
            if (lblEmail) lblEmail.innerText = r.cliente ? r.cliente.email : '-';
            
            const isContra = r.estado_pago === 'contraentrega' || r.estado_pago === 'pagado_efectivo';
            if (lblPayment) lblPayment.innerText = isContra ? 'CONTRAENTREGA (EFECTIVO)' : 'PAGO QR ELECTRÓNICO';
            if (lblStatus) lblStatus.innerText = (r.estado_pedido || 'PENDIENTE').toUpperCase();
            if (lblRider) lblRider.innerText = r.rider ? cleanText(r.rider.nombre) : 'Asignando repartidor...';

            const lblStoreName = document.getElementById('lblReceiptStoreName');
            const lblStoreBranch = document.getElementById('lblReceiptStoreBranch');
            const lblStoreAddress = document.getElementById('lblReceiptStoreAddress');
            const lblStorePhone = document.getElementById('lblReceiptStorePhone');
            const lblAddress = document.getElementById('lblReceiptAddress');

            if (r.tienda) {
                let storeName = r.tienda.nombre_tienda || 'BURGER 24/7';
                let branchName = r.tienda.sucursal || '';
                if (!branchName && storeName.includes(' - ')) {
                    const parts = storeName.split(' - ');
                    storeName = parts[0].trim();
                    branchName = parts[1].trim();
                }
                if (lblStoreName) lblStoreName.innerText = storeName.toUpperCase();
                if (lblStoreBranch) {
                    if (branchName) {
                        lblStoreBranch.innerText = branchName.toLowerCase().startsWith('sucursal') ? branchName : `Sucursal ${branchName}`;
                        lblStoreBranch.style.display = 'block';
                    } else {
                        lblStoreBranch.style.display = 'none';
                    }
                }
                if (lblStoreAddress) lblStoreAddress.innerText = r.tienda.direccion || 'Av. 20 de Octubre #2150, Sopocachi, La Paz';
                if (lblStorePhone) lblStorePhone.innerText = `Tlf: ${r.tienda.telefono || '+591 71523481'}`;
            }

            if (lblAddress) {
                const telStr = r.telefono_contacto ? ` (Tel: ${r.telefono_contacto})` : '';
                const refStr = r.referencia_entrega ? ` - Ref: ${r.referencia_entrega}` : '';
                const baseAddr = r.direccion_entrega || 'Ubicación GPS registrada (La Paz)';
                lblAddress.innerText = `${baseAddr}${refStr}${telStr}`;
            }

            if (tbody) {
                const items = Array.isArray(r.detalles) ? r.detalles : [];
                if (items.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 0.5rem; color: #64748b;">Sin productos registrados.</td></tr>`;
                } else {
                    tbody.innerHTML = items.map(it => {
                        const cant = it.cantidad || 1;
                        const pu = Number(it.precio_unitario || 0);
                        const sub = (pu * cant).toFixed(2);
                        return `
                            <tr style="border-bottom: 1px dotted #e2e8f0;">
                                <td style="padding: 0.25rem 0; font-weight: 700;">${cant}x</td>
                                <td style="padding: 0.25rem 0;">${escapeHtml(it.nombre || 'Producto')}</td>
                                <td style="padding: 0.25rem 0; text-align: right;">${pu.toFixed(2)}</td>
                                <td style="padding: 0.25rem 0; text-align: right; font-weight: 700;">${sub}</td>
                            </tr>
                        `;
                    }).join('');
                }
            }

            if (lblSubtotal) lblSubtotal.innerText = `${Number(r.subtotal || 0).toFixed(2)} Bs`;
            if (lblShipping) lblShipping.innerText = `${Number(r.costo_envio || 0).toFixed(2)} Bs`;
            if (lblTotal) lblTotal.innerText = `${Number(r.total || 0).toFixed(2)} Bs`;
            if (lblHash) lblHash.innerText = `ID Pedido: #${r.id} · C++ Motor Core Tarifa & Stock Verificado`;

        } else {
            const msg = (res && res.error) ? res.error : 'No se pudo cargar el recibo digital desde el servidor.';
            showToast(msg, 'warning');
        }
    } catch (err) {
        console.error('Error cargando recibo digital:', err);
        showToast('Error al consultar el recibo en el servidor: ' + (err.message || ''), 'danger');
    }
};

window.closeReceiptModal = function() {
    const modal = document.getElementById('orderReceiptModal');
    if (modal) modal.classList.remove('active');
};

// ----------------------------------------------------
// CALIFICACIÓN DE ENTREGA, RIDER Y COMIDA (FRONTEND)
// ----------------------------------------------------
const DELIVERY_STAR_LABELS = {
    1: 'Mala entrega o paquete dañado ⚠️',
    2: 'Entrega regular o con retraso ⏳',
    3: 'Entrega aceptable 👍',
    4: 'Muy buena entrega y puntual 🛵',
    5: '¡Excelente entrega y trato! 🚀'
};

const FOOD_STAR_LABELS = {
    1: 'No me gustó la comida ❌',
    2: 'Comida regular o fría 😕',
    3: 'Comida buena y aceptable 🍔',
    4: '¡Muy rica y sabrosa! 😋',
    5: '¡Exquisita, hamburguesa insuperable! 🍔🔥'
};

function setStarPickerValue(type, value) {
    const val = Math.max(1, Math.min(5, parseInt(value, 10) || 5));
    const container = document.getElementById(type === 'delivery' ? 'starPickerDelivery' : 'starPickerFood');
    const input = document.getElementById(type === 'delivery' ? 'valRatingDelivery' : 'valRatingFood');
    const label = document.getElementById(type === 'delivery' ? 'lblDeliveryStarFeedback' : 'lblFoodStarFeedback');
    const labelsMap = type === 'delivery' ? DELIVERY_STAR_LABELS : FOOD_STAR_LABELS;

    if (input) input.value = val;
    if (label) label.innerText = labelsMap[val] || `${val} estrellas`;

    if (container) {
        container.querySelectorAll('.star-btn').forEach(btn => {
            const btnVal = parseInt(btn.dataset.value, 10);
            if (btnVal <= val) {
                btn.classList.add('selected');
            } else {
                btn.classList.remove('selected');
            }
        });
    }
}

function initStarPickers() {
    ['delivery', 'food'].forEach(type => {
        const container = document.getElementById(type === 'delivery' ? 'starPickerDelivery' : 'starPickerFood');
        const labelsMap = type === 'delivery' ? DELIVERY_STAR_LABELS : FOOD_STAR_LABELS;
        const label = document.getElementById(type === 'delivery' ? 'lblDeliveryStarFeedback' : 'lblFoodStarFeedback');
        const input = document.getElementById(type === 'delivery' ? 'valRatingDelivery' : 'valRatingFood');

        if (!container) return;

        container.querySelectorAll('.star-btn').forEach(btn => {
            const btnVal = parseInt(btn.dataset.value, 10);

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                setStarPickerValue(type, btnVal);
            });

            btn.addEventListener('mouseenter', () => {
                container.querySelectorAll('.star-btn').forEach(b => {
                    const bVal = parseInt(b.dataset.value, 10);
                    if (bVal <= btnVal) {
                        b.classList.add('hovered');
                    } else {
                        b.classList.remove('hovered');
                    }
                });
                if (label) label.innerText = labelsMap[btnVal] || `${btnVal} estrellas`;
            });
        });

        container.addEventListener('mouseleave', () => {
            container.querySelectorAll('.star-btn').forEach(b => b.classList.remove('hovered'));
            const currentVal = parseInt(input ? input.value : 5, 10) || 5;
            setStarPickerValue(type, currentVal);
        });
    });
}

window.openOrderRatingModal = async function(orderId) {
    const modal = document.getElementById('orderRatingModal');
    if (!modal) return;

    const orderIdInput = document.getElementById('ratingOrderId');
    const orderTitle = document.getElementById('ratingOrderTitle');
    const orderSubtitle = document.getElementById('ratingOrderSubtitle');
    const chkReceived = document.getElementById('chkRatingConfirmReceived');
    const txtDeliv = document.getElementById('txtDeliveryComment');
    const txtFood = document.getElementById('txtFoodComment');

    if (orderIdInput) orderIdInput.value = orderId;
    if (orderTitle) orderTitle.innerText = `Pedido #${orderId}`;

    // Valores por defecto: 5 estrellas, comentarios limpios, confirmación marcada
    setStarPickerValue('delivery', 5);
    setStarPickerValue('food', 5);
    if (txtDeliv) txtDeliv.value = '';
    if (txtFood) txtFood.value = '';
    if (chkReceived) chkReceived.checked = true;

    let active = window._clientActiveOrder;
    if (active && String(active.id) === String(orderId)) {
        if (orderSubtitle) {
            const rName = active.rider_nombre ? `Repartidor: ${cleanText(active.rider_nombre)}` : 'Tu repartidor asignado';
            orderSubtitle.innerText = `${rName} · Confirma la entrega y cuéntanos tu experiencia`;
        }
        if (active.calificacion) {
            const c = active.calificacion;
            setStarPickerValue('delivery', c.calificacion_entrega || 5);
            setStarPickerValue('food', c.calificacion_comida || 5);
            if (txtDeliv) txtDeliv.value = c.comentario_entrega || '';
            if (txtFood) txtFood.value = c.comentario_comida || '';
        }
    } else {
        try {
            const res = await apiGet('/Transactions/rating.php', { order_id: orderId });
            if (res.ok && res.data && res.data.calificacion) {
                const c = res.data.calificacion;
                setStarPickerValue('delivery', c.calificacion_entrega || 5);
                setStarPickerValue('food', c.calificacion_comida || 5);
                if (txtDeliv) txtDeliv.value = c.comentario_entrega || '';
                if (txtFood) txtFood.value = c.comentario_comida || '';
            }
        } catch (e) {
            console.warn('No se pudo precargar calificación previa:', e);
        }
    }

    modal.classList.add('active');
    initLucide();
};

window.closeOrderRatingModal = function() {
    const modal = document.getElementById('orderRatingModal');
    if (modal) modal.classList.remove('active');
};

window.submitOrderRating = async function() {
    const orderIdInput = document.getElementById('ratingOrderId');
    const chkReceived = document.getElementById('chkRatingConfirmReceived');
    const inputDeliv = document.getElementById('valRatingDelivery');
    const inputFood = document.getElementById('valRatingFood');
    const txtDeliv = document.getElementById('txtDeliveryComment');
    const txtFood = document.getElementById('txtFoodComment');
    const btnSubmit = document.getElementById('btnSubmitOrderRating');

    const orderId = orderIdInput ? parseInt(orderIdInput.value, 10) : null;
    if (!orderId) {
        showToast('ID de pedido inválido para calificar.', 'danger');
        return;
    }

    if (chkReceived && !chkReceived.checked) {
        showToast('Por favor confirma que ya recibiste tu comida marcando la casilla correspondiente.', 'warning');
        chkReceived.focus();
        return;
    }

    const califEntrega = parseInt(inputDeliv ? inputDeliv.value : 5, 10) || 5;
    const califComida = parseInt(inputFood ? inputFood.value : 5, 10) || 5;
    const commentEntrega = txtDeliv ? txtDeliv.value.trim() : '';
    const commentComida = txtFood ? txtFood.value.trim() : '';

    const payload = {
        order_id: orderId,
        calificacion_entrega: califEntrega,
        comentario_entrega: commentEntrega,
        calificacion_comida: califComida,
        comentario_comida: commentComida,
        confirmar_recepcion: chkReceived && chkReceived.checked ? 1 : 0
    };

    const originalBtnText = btnSubmit ? btnSubmit.innerHTML : 'Confirmar y Enviar Calificación';
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<span class="spin">⏳</span> Guardando calificación...';
    }

    try {
        const res = await apiPost('/Transactions/rating.php', payload);
        if (res.ok) {
            showToast('⭐ ¡Muchas gracias! Tu calificación y recepción fueron registradas con éxito.', 'success');
            window.closeOrderRatingModal();
            if (typeof renderClienteActiveOrderTracker === 'function') {
                await renderClienteActiveOrderTracker();
            }
        } else {
            showToast(res.error || 'No se pudo guardar la calificación en el servidor.', 'danger');
        }
    } catch (err) {
        console.error('Error al calificar pedido:', err);
        showToast('Error de conexión al enviar la calificación: ' + (err.message || ''), 'danger');
    } finally {
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = originalBtnText;
            initLucide();
        }
    }
};

// -------------------------------------------------------
// HISTORIAL DE PEDIDOS Y CALIFICACIONES DEL CLIENTE
// -------------------------------------------------------
window.openClientOrdersHistoryModal = async function(filter = 'all') {
    const modal = document.getElementById('clientOrdersHistoryModal');
    if (!modal) return;

    if (!currentSession.cliente) {
        showToast('Inicia sesión como cliente para ver tu historial de pedidos.', 'info');
        openAuthModal();
        return;
    }

    modal.style.display = 'flex';
    initLucide();

    // Resetear botones de filtro y buscador
    document.querySelectorAll('.client-hist-filter-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.filter === filter);
    });
    const searchInput = document.getElementById('txtClientOrdersSearch');
    if (searchInput) searchInput.value = '';

    const listEl = document.getElementById('clientOrdersHistoryContainer');
    if (listEl) {
        listEl.innerHTML = '<div style="text-align:center; padding:2.5rem; color:var(--text-secondary);"><i data-lucide="loader-2" class="spin" style="width:28px;height:28px;margin-bottom:0.5rem;color:#38bdf8;"></i><br>Cargando tus pedidos...</div>';
        initLucide();
    }

    try {
        const res = await apiGet('/Transactions/checkout.php');
        if (!res.ok) {
            if (listEl) {
                listEl.innerHTML = `<div class="api-error-card"><h4><i data-lucide="alert-triangle"></i> No se pudo cargar el historial</h4><p>${escapeHtml(res.error || 'Error al conectar con el servidor')}</p></div>`;
                initLucide();
            }
            return;
        }

        window._clientAllOrders = (res.data && res.data.pedidos) ? res.data.pedidos : [];
        renderClientOrdersHistoryList(filter, '');
        setupClientOrdersHistoryListeners();
    } catch (err) {
        console.error('Error cargando historial de pedidos del cliente:', err);
        if (listEl) {
            listEl.innerHTML = `<div class="api-error-card"><h4><i data-lucide="wifi-off"></i> Error de conexión</h4><p>No se pudo conectar con el servidor.</p></div>`;
            initLucide();
        }
    }
};

window.closeClientOrdersHistoryModal = function() {
    const modal = document.getElementById('clientOrdersHistoryModal');
    if (modal) modal.style.display = 'none';
};

window.renderClientOrdersHistoryList = function(filter = 'all', searchQuery = '') {
    const container = document.getElementById('clientOrdersHistoryContainer');
    if (!container) return;

    const all = window._clientAllOrders || [];
    let filtered = all;

    if (filter === 'entregado') {
        filtered = all.filter(o => o.estado_pedido === 'entregado');
    } else if (filter === 'en_camino') {
        filtered = all.filter(o => ['en_camino', 'asignado', 'preparando', 'buscando_rider'].includes(o.estado_pedido));
    } else if (filter === 'pendiente') {
        filtered = all.filter(o => o.estado_pedido === 'pendiente');
    }

    if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(o => {
            const itemsStr = (o.detalles || []).map(d => d.nombre || '').join(' ').toLowerCase();
            return String(o.id).includes(q) ||
                   itemsStr.includes(q) ||
                   (o.rider_nombre || '').toLowerCase().includes(q) ||
                   (o.direccion_entrega || '').toLowerCase().includes(q);
        });
    }

    if (!filtered.length) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary); padding: 3rem 1.5rem; background: rgba(255,255,255,0.02); border-radius: var(--radius-md); border: 1px dashed rgba(255,255,255,0.08);">
                <i data-lucide="shopping-bag" style="width: 42px; height: 42px; color: #64748b; margin-bottom: 0.75rem;"></i>
                <h4 style="margin: 0 0 0.35rem 0; color: #cbd5e1;">No se encontraron pedidos</h4>
                <p style="margin: 0; font-size: 0.82rem; color: var(--text-muted);">
                    ${searchQuery ? `No hay resultados para "${escapeHtml(searchQuery)}"` : 'Aún no tienes pedidos registrados en esta categoría.'}
                </p>
            </div>
        `;
        initLucide();
        return;
    }

    container.innerHTML = filtered.map(o => {
        let statusBadge = '';
        if (o.estado_pedido === 'entregado') {
            statusBadge = '<span class="badge badge-verified"><i data-lucide="check-check"></i> Entregado</span>';
        } else if (o.estado_pedido === 'en_camino') {
            statusBadge = '<span class="badge badge-pending" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);"><i data-lucide="bike"></i> En Camino</span>';
        } else if (o.estado_pedido === 'cancelado') {
            statusBadge = '<span class="badge badge-rejected"><i data-lucide="x-circle"></i> Cancelado</span>';
        } else {
            statusBadge = `<span class="badge badge-pending"><i data-lucide="clock"></i> ${escapeHtml(o.estado_pedido || 'Pendiente')}</span>`;
        }

        let receptionBadge = '';
        if (o.recepcion_confirmada) {
            const dateFmt = o.fecha_recepcion_cliente ? ` (${new Date(o.fecha_recepcion_cliente).toLocaleString('es-BO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})` : '';
            receptionBadge = `<span class="history-reception-badge confirmed"><i data-lucide="package-check" style="width:13px;height:13px;"></i> Comida recibida en tu puerta${dateFmt}</span>`;
        } else if (o.estado_pedido === 'entregado') {
            receptionBadge = `<span class="history-reception-badge pending" style="background: rgba(234, 179, 8, 0.1); color: #facc15; border-color: rgba(234, 179, 8, 0.25);"><i data-lucide="clock" style="width:13px;height:13px;"></i> Entregado por rider (Pendiente tu confirmación)</span>`;
        } else {
            receptionBadge = `<span class="history-reception-badge pending"><i data-lucide="truck" style="width:13px;height:13px;"></i> En proceso de entrega</span>`;
        }

        let ratingHtml = '';
        if (o.calificacion && (o.calificacion.calificacion_entrega || o.calificacion.calificacion_comida)) {
            const c = o.calificacion;
            ratingHtml = `
                <div class="history-rating-stars-box" style="margin-top: 0.6rem; padding: 0.6rem 0.85rem; background: rgba(245, 158, 11, 0.06); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: var(--radius-sm); font-size: 0.8rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.4rem; margin-bottom: 0.35rem;">
                        <span style="font-weight: 700; color: #f59e0b; display: flex; align-items: center; gap: 0.35rem;">
                            <i data-lucide="star" style="width:14px;height:14px;"></i> Tus Calificaciones
                        </span>
                        <button class="btn btn-secondary btn-sm" onclick="closeClientOrdersHistoryModal(); openOrderRatingModal(${o.id});" style="font-size: 0.72rem; padding: 0.2rem 0.5rem; border: 1px solid rgba(245, 158, 11, 0.3); color: #f59e0b;">
                            <i data-lucide="edit-3" style="width:11px;height:11px;"></i> Editar
                        </button>
                    </div>
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem;">
                        ${c.calificacion_entrega ? `
                            <div style="background: rgba(0,0,0,0.2); padding: 0.4rem 0.6rem; border-radius: 4px;">
                                <div style="color: var(--text-muted); font-size: 0.72rem;">Entrega (Rider):</div>
                                <div style="color: #f59e0b; font-weight: 700; font-size: 0.9rem;">
                                    ${'★'.repeat(c.calificacion_entrega)}${'☆'.repeat(5 - c.calificacion_entrega)} <span style="font-size: 0.75rem; color: var(--text-secondary);">(${c.calificacion_entrega}/5)</span>
                                </div>
                                ${c.comentario_entrega ? `<div style="font-style: italic; color: #cbd5e1; font-size: 0.75rem; margin-top: 0.2rem;">"${escapeHtml(c.comentario_entrega)}"</div>` : ''}
                            </div>
                        ` : ''}
                        ${c.calificacion_comida ? `
                            <div style="background: rgba(0,0,0,0.2); padding: 0.4rem 0.6rem; border-radius: 4px;">
                                <div style="color: var(--text-muted); font-size: 0.72rem;">Comida:</div>
                                <div style="color: #f59e0b; font-weight: 700; font-size: 0.9rem;">
                                    ${'★'.repeat(c.calificacion_comida)}${'☆'.repeat(5 - c.calificacion_comida)} <span style="font-size: 0.75rem; color: var(--text-secondary);">(${c.calificacion_comida}/5)</span>
                                </div>
                                ${c.comentario_comida ? `<div style="font-style: italic; color: #cbd5e1; font-size: 0.75rem; margin-top: 0.2rem;">"${escapeHtml(c.comentario_comida)}"</div>` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        } else if (o.estado_pedido === 'entregado') {
            ratingHtml = `
                <div style="margin-top: 0.55rem; padding: 0.55rem 0.85rem; background: rgba(56, 189, 248, 0.05); border: 1px dashed rgba(56, 189, 248, 0.25); border-radius: var(--radius-sm); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
                    <span style="font-size: 0.8rem; color: #94a3b8;">¡Pedido recibido! ¿Cómo fue tu experiencia?</span>
                    <button class="btn btn-primary btn-sm" onclick="closeClientOrdersHistoryModal(); openOrderRatingModal(${o.id});" style="font-size: 0.75rem; padding: 0.3rem 0.75rem; background: linear-gradient(135deg, #f59e0b, #d97706); border: none; font-weight: 700; color: #0f172a;">
                        <i data-lucide="star" style="width:13px;height:13px;"></i> Calificar Entrega y Comida
                    </button>
                </div>
            `;
        }

        const itemsList = (o.detalles || []).map(d => `${d.cantidad}x ${escapeHtml(d.nombre || 'Item')}`).join(', ') || 'Productos varios';
        let dateStr = 'Reciente';
        if (o.created_at) {
            try {
                dateStr = new Date(o.created_at).toLocaleString('es-BO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            } catch(e) {}
        }

        return `
            <div class="history-order-card">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.6rem;">
                    <div>
                        <div style="display:flex; align-items:center; gap:0.5rem;">
                            <strong style="color:#f8fafc; font-size:1rem;">Pedido #${o.id}</strong>
                            <span style="font-size:0.75rem; color:var(--text-muted);">${dateStr}</span>
                        </div>
                        <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:0.2rem;">
                            ${o.rider_nombre ? `<span style="color:#38bdf8;">🛵 Repartidor: ${escapeHtml(o.rider_nombre)}</span>` : '<span style="color:var(--text-muted);">Sin repartidor asignado</span>'}
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap;">
                        <button class="btn btn-secondary btn-sm" onclick="openReceiptModal(${o.id})" style="font-size:0.73rem; padding:0.25rem 0.6rem;">
                            <i data-lucide="receipt" style="width:12px;height:12px;"></i> Recibo
                        </button>
                        ${statusBadge}
                    </div>
                </div>

                <div style="background: rgba(0,0,0,0.25); border-radius: var(--radius-sm); padding: 0.55rem 0.75rem; margin-bottom: 0.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.4rem;">
                    <div style="font-size: 0.83rem; color: #e2e8f0; flex: 1; min-width: 200px;">
                        <i data-lucide="package" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:4px;color:var(--text-muted);"></i>
                        ${itemsList}
                    </div>
                    <div style="font-weight: 800; font-size: 0.95rem; color: var(--accent-green); white-space: nowrap;">
                        ${Number(o.total).toFixed(2)} Bs
                    </div>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.4rem; font-size:0.78rem;">
                    <div>${receptionBadge}</div>
                    ${o.direccion_entrega ? `<div style="color:var(--text-muted); max-width: 320px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${escapeHtml(o.direccion_entrega)}">📍 ${escapeHtml(o.direccion_entrega)}</div>` : ''}
                </div>

                ${ratingHtml}
            </div>
        `;
    }).join('');

    initLucide();
};

window.setupClientOrdersHistoryListeners = function() {
    document.querySelectorAll('.client-hist-filter-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.client-hist-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const searchVal = document.getElementById('txtClientOrdersSearch')?.value || '';
            renderClientOrdersHistoryList(btn.dataset.filter, searchVal);
        };
    });

    const searchInput = document.getElementById('txtClientOrdersSearch');
    if (searchInput) {
        searchInput.oninput = (e) => {
            const activeFilter = document.querySelector('.client-hist-filter-btn.active')?.dataset.filter || 'all';
            renderClientOrdersHistoryList(activeFilter, e.target.value);
        };
    }
};

// -------------------------------------------------------
// ADMIN: HISTORIAL DE PEDIDOS Y CALIFICACIONES POR USUARIO (CLIENTE O RIDER)
// -------------------------------------------------------
window.openAdminUserOrderHistory = async function(userId, role, userName) {
    const modal = document.getElementById('adminUserHistoryModal');
    if (!modal) return;

    modal.style.display = 'flex';

    // Set Avatar & Info header
    const avatarCircle = document.getElementById('adminUserHistAvatarCircle');
    const nameEl = document.getElementById('adminUserHistName');
    const roleBadge = document.getElementById('adminUserHistRoleBadge');
    const emailEl = document.getElementById('adminUserHistEmail');

    if (nameEl) nameEl.textContent = userName || `Usuario #${userId}`;
    if (emailEl) emailEl.textContent = 'Cargando datos de usuario...';

    if (role === 'rider') {
        if (avatarCircle) {
            avatarCircle.innerHTML = '🛵';
            avatarCircle.style.background = 'rgba(139, 92, 246, 0.2)';
            avatarCircle.style.borderColor = 'var(--accent-purple)';
            avatarCircle.style.color = 'var(--accent-purple)';
        }
        if (roleBadge) {
            roleBadge.textContent = 'Repartidor / Rider';
            roleBadge.style.background = 'rgba(139, 92, 246, 0.2)';
            roleBadge.style.color = 'var(--accent-purple)';
        }
    } else {
        if (avatarCircle) {
            avatarCircle.innerHTML = '👤';
            avatarCircle.style.background = 'rgba(56, 189, 248, 0.2)';
            avatarCircle.style.borderColor = '#38bdf8';
            avatarCircle.style.color = '#38bdf8';
        }
        if (roleBadge) {
            roleBadge.textContent = 'Cliente Comprador';
            roleBadge.style.background = 'rgba(56, 189, 248, 0.2)';
            roleBadge.style.color = '#38bdf8';
        }
    }

    // Reset filtros
    document.querySelectorAll('.admin-hist-filter-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.filter === 'all');
    });
    const searchInput = document.getElementById('txtAdminUserHistSearch');
    if (searchInput) searchInput.value = '';

    const statsBar = document.getElementById('adminUserHistStatsBar');
    if (statsBar) statsBar.innerHTML = '<span style="color:var(--text-muted);font-size:0.8rem;">Calculando métricas del historial...</span>';

    const ordersList = document.getElementById('adminUserHistOrdersList');
    if (ordersList) {
        ordersList.innerHTML = '<div style="text-align:center; padding:2.5rem; color:var(--text-secondary);"><i data-lucide="loader-2" class="spin" style="width:28px;height:28px;margin-bottom:0.5rem;color:var(--accent-purple);"></i><br>Cargando pedidos asociados...</div>';
        initLucide();
    }

    try {
        const queryParam = role === 'rider' ? `rider_id=${userId}` : `cliente_id=${userId}`;
        const res = await apiGet(`/Transactions/checkout.php?${queryParam}`);

        if (!res.ok) {
            if (ordersList) {
                ordersList.innerHTML = `<div class="api-error-card"><h4><i data-lucide="alert-triangle"></i> Error al consultar historial</h4><p>${escapeHtml(res.error || 'No se pudo obtener la información del servidor.')}</p></div>`;
                initLucide();
            }
            return;
        }

        const data = res.data || {};
        const targetUser = data.target_user || {};
        const orders = data.pedidos || [];

        if (emailEl) {
            emailEl.textContent = targetUser.email || (orders[0] ? (role === 'rider' ? '' : orders[0].cliente_email) : 'Sin correo registrado');
        }

        window._adminCurrentUserHistory = {
            userId,
            role,
            userName,
            user: targetUser,
            orders: orders
        };

        // Render Stats Bar
        const totalCount = orders.length;
        const deliveredCount = orders.filter(o => o.estado_pedido === 'entregado').length;
        const totalMoney = orders.reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0);
        const receptionCount = orders.filter(o => o.recepcion_confirmada).length;

        // Ratings
        const ratingField = role === 'rider' ? 'calificacion_entrega' : 'calificacion_comida';
        const ratedOrders = orders.filter(o => o.calificacion && o.calificacion[ratingField]);
        const avgRating = ratedOrders.length
            ? (ratedOrders.reduce((sum, o) => sum + o.calificacion[ratingField], 0) / ratedOrders.length).toFixed(1)
            : 'N/A';

        if (statsBar) {
            statsBar.innerHTML = `
                <div style="display:flex; flex-direction:column; min-width:110px;">
                    <span style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.04em;">${role === 'rider' ? 'Total Entregas' : 'Total Pedidos'}</span>
                    <strong style="font-size:1.15rem; color:#f8fafc;">${totalCount} <span style="font-size:0.75rem; color:#10b981;">(${deliveredCount} completados)</span></strong>
                </div>
                <div style="display:flex; flex-direction:column; min-width:110px;">
                    <span style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.04em;">${role === 'rider' ? 'Volumen Generado' : 'Total Gastado'}</span>
                    <strong style="font-size:1.15rem; color:var(--accent-green);">${totalMoney.toFixed(2)} Bs</strong>
                </div>
                <div style="display:flex; flex-direction:column; min-width:110px;">
                    <span style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.04em;">${role === 'rider' ? 'Promedio Servicio Rider' : 'Promedio Comida Recibida'}</span>
                    <strong style="font-size:1.15rem; color:#f59e0b;">⭐ ${avgRating} ${avgRating !== 'N/A' ? `<span style="font-size:0.75rem; color:var(--text-secondary);">(${ratedOrders.length} votos)</span>` : ''}</strong>
                </div>
                <div style="display:flex; flex-direction:column; min-width:110px;">
                    <span style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.04em;">Recepción Confirmada</span>
                    <strong style="font-size:1.15rem; color:#38bdf8;">${receptionCount} <span style="font-size:0.75rem; color:var(--text-secondary);">en puerta</span></strong>
                </div>
            `;
        }

        renderAdminUserHistoryOrdersList('all', '');
        setupAdminUserHistoryListeners();
    } catch (err) {
        console.error('Error cargando historial del usuario en admin:', err);
        if (ordersList) {
            ordersList.innerHTML = `<div class="api-error-card"><h4><i data-lucide="wifi-off"></i> Error de conexión</h4><p>No se pudo conectar con el servidor.</p></div>`;
            initLucide();
        }
    }
};

window.closeAdminUserHistoryModal = function() {
    const modal = document.getElementById('adminUserHistoryModal');
    if (modal) modal.style.display = 'none';
};

window.renderAdminUserHistoryOrdersList = function(filter = 'all', searchQuery = '') {
    const container = document.getElementById('adminUserHistOrdersList');
    if (!container) return;

    const hist = window._adminCurrentUserHistory || { orders: [] };
    const all = hist.orders || [];
    let filtered = all;

    if (filter === 'entregado') {
        filtered = all.filter(o => o.estado_pedido === 'entregado');
    } else if (filter === 'en_camino') {
        filtered = all.filter(o => ['en_camino', 'asignado', 'preparando', 'buscando_rider'].includes(o.estado_pedido));
    } else if (filter === 'cancelado') {
        filtered = all.filter(o => ['cancelado', 'rechazado'].includes(o.estado_pedido));
    }

    if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(o => {
            const itemsStr = (o.detalles || []).map(d => d.nombre || '').join(' ').toLowerCase();
            return String(o.id).includes(q) ||
                   itemsStr.includes(q) ||
                   (o.cliente_nombre || '').toLowerCase().includes(q) ||
                   (o.cliente_email || '').toLowerCase().includes(q) ||
                   (o.rider_nombre || '').toLowerCase().includes(q) ||
                   (o.direccion_entrega || '').toLowerCase().includes(q);
        });
    }

    if (!filtered.length) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--text-secondary); padding: 3rem 1.5rem; background: rgba(255,255,255,0.02); border-radius: var(--radius-md); border: 1px dashed rgba(255,255,255,0.08);">
                <i data-lucide="inbox" style="width: 42px; height: 42px; color: #64748b; margin-bottom: 0.75rem;"></i>
                <h4 style="margin: 0 0 0.35rem 0; color: #cbd5e1;">Sin pedidos que mostrar</h4>
                <p style="margin: 0; font-size: 0.82rem; color: var(--text-muted);">
                    ${searchQuery ? `No hay resultados para "${escapeHtml(searchQuery)}"` : 'Este usuario no tiene pedidos registrados en este estado.'}
                </p>
            </div>
        `;
        initLucide();
        return;
    }

    container.innerHTML = filtered.map(o => {
        let statusBadge = '';
        if (o.estado_pedido === 'entregado') {
            statusBadge = '<span class="badge badge-verified"><i data-lucide="check-check"></i> Entregado</span>';
        } else if (o.estado_pedido === 'en_camino') {
            statusBadge = '<span class="badge badge-pending" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);"><i data-lucide="bike"></i> En Camino</span>';
        } else if (o.estado_pedido === 'cancelado' || o.estado_pedido === 'rechazado') {
            statusBadge = '<span class="badge badge-rejected"><i data-lucide="x-circle"></i> Cancelado</span>';
        } else {
            statusBadge = `<span class="badge badge-pending"><i data-lucide="clock"></i> ${escapeHtml(o.estado_pedido || 'Pendiente')}</span>`;
        }

        let receptionBadge = '';
        if (o.recepcion_confirmada) {
            const dateFmt = o.fecha_recepcion_cliente ? ` (${new Date(o.fecha_recepcion_cliente).toLocaleString('es-BO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})` : '';
            receptionBadge = `<span class="history-reception-badge confirmed"><i data-lucide="package-check" style="width:13px;height:13px;"></i> Confirmado recibido en puerta${dateFmt}</span>`;
        } else if (o.estado_pedido === 'entregado') {
            receptionBadge = `<span class="history-reception-badge pending" style="background: rgba(234, 179, 8, 0.1); color: #facc15; border-color: rgba(234, 179, 8, 0.25);"><i data-lucide="clock" style="width:13px;height:13px;"></i> Entregado por rider (Pendiente confirmación cliente)</span>`;
        } else {
            receptionBadge = `<span class="history-reception-badge pending"><i data-lucide="truck" style="width:13px;height:13px;"></i> En tránsito de entrega</span>`;
        }

        let ratingBox = '';
        if (o.calificacion && (o.calificacion.calificacion_entrega || o.calificacion.calificacion_comida)) {
            const c = o.calificacion;
            ratingBox = `
                <div class="history-rating-stars-box" style="margin-top: 0.6rem; padding: 0.6rem 0.85rem; background: rgba(245, 158, 11, 0.06); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: var(--radius-sm); font-size: 0.8rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.35rem;">
                        <span style="font-weight: 700; color: #f59e0b; display: flex; align-items: center; gap: 0.35rem;">
                            <i data-lucide="star" style="width:13px;height:13px;"></i> Calificación Registrada
                        </span>
                        ${c.fecha ? `<span style="font-size: 0.72rem; color: var(--text-muted);">${new Date(c.fecha).toLocaleString('es-BO')}</span>` : ''}
                    </div>
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.5rem;">
                        ${c.calificacion_entrega ? `
                            <div style="background: rgba(0,0,0,0.25); padding: 0.4rem 0.6rem; border-radius: 4px;">
                                <div style="color: var(--text-muted); font-size: 0.72rem;">Entrega (Servicio Rider):</div>
                                <div style="color: #f59e0b; font-weight: 700; font-size: 0.85rem;">
                                    ${'★'.repeat(c.calificacion_entrega)}${'☆'.repeat(5 - c.calificacion_entrega)} (${c.calificacion_entrega}/5)
                                </div>
                                ${c.comentario_entrega ? `<div style="font-style: italic; color: #cbd5e1; font-size: 0.75rem; margin-top: 0.2rem;">"${escapeHtml(c.comentario_entrega)}"</div>` : ''}
                            </div>
                        ` : ''}
                        ${c.calificacion_comida ? `
                            <div style="background: rgba(0,0,0,0.25); padding: 0.4rem 0.6rem; border-radius: 4px;">
                                <div style="color: var(--text-muted); font-size: 0.72rem;">Calidad de la Comida:</div>
                                <div style="color: #f59e0b; font-weight: 700; font-size: 0.85rem;">
                                    ${'★'.repeat(c.calificacion_comida)}${'☆'.repeat(5 - c.calificacion_comida)} (${c.calificacion_comida}/5)
                                </div>
                                ${c.comentario_comida ? `<div style="font-style: italic; color: #cbd5e1; font-size: 0.75rem; margin-top: 0.2rem;">"${escapeHtml(c.comentario_comida)}"</div>` : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        const itemsList = (o.detalles || []).map(d => `${d.cantidad}x ${escapeHtml(d.nombre || 'Item')}`).join(', ') || 'Productos varios';
        let dateStr = 'Reciente';
        if (o.created_at) {
            try {
                dateStr = new Date(o.created_at).toLocaleString('es-BO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            } catch(e) {}
        }

        const partyInfo = hist.role === 'rider'
            ? `<span style="color:#38bdf8;">👤 Cliente: <strong>${escapeHtml(o.cliente_nombre || 'Cliente')}</strong> ${o.cliente_email ? `(${escapeHtml(o.cliente_email)})` : ''}</span>`
            : `<span style="color:var(--accent-purple);">🛵 Repartidor: <strong>${escapeHtml(o.rider_nombre || 'Sin asignar')}</strong></span>`;

        return `
            <div class="history-order-card">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.6rem;">
                    <div>
                        <div style="display:flex; align-items:center; gap:0.5rem;">
                            <strong style="color:#f8fafc; font-size:1rem;">Pedido #${o.id}</strong>
                            <span style="font-size:0.75rem; color:var(--text-muted);">${dateStr}</span>
                        </div>
                        <div style="font-size:0.8rem; margin-top:0.25rem;">
                            ${partyInfo}
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:0.4rem; flex-wrap:wrap;">
                        <button class="btn btn-secondary btn-sm" onclick="openReceiptModal(${o.id})" style="font-size:0.73rem; padding:0.25rem 0.6rem;">
                            <i data-lucide="receipt" style="width:12px;height:12px;"></i> Recibo Digital
                        </button>
                        ${statusBadge}
                    </div>
                </div>

                <div style="background: rgba(0,0,0,0.25); border-radius: var(--radius-sm); padding: 0.55rem 0.75rem; margin-bottom: 0.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.4rem;">
                    <div style="font-size: 0.83rem; color: #e2e8f0; flex: 1; min-width: 200px;">
                        <i data-lucide="package" style="width:13px;height:13px;display:inline-block;vertical-align:middle;margin-right:4px;color:var(--text-muted);"></i>
                        ${itemsList}
                    </div>
                    <div style="font-weight: 800; font-size: 0.95rem; color: var(--accent-green); white-space: nowrap;">
                        ${Number(o.total).toFixed(2)} Bs
                    </div>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.4rem; font-size:0.78rem;">
                    <div>${receptionBadge}</div>
                    ${o.direccion_entrega ? `<div style="color:var(--text-muted); max-width: 340px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${escapeHtml(o.direccion_entrega)}">📍 ${escapeHtml(o.direccion_entrega)}</div>` : ''}
                </div>

                ${ratingBox}
            </div>
        `;
    }).join('');

    initLucide();
};

window.setupAdminUserHistoryListeners = function() {
    document.querySelectorAll('.admin-hist-filter-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.admin-hist-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const searchVal = document.getElementById('txtAdminUserHistSearch')?.value || '';
            renderAdminUserHistoryOrdersList(btn.dataset.filter, searchVal);
        };
    });

    const searchInput = document.getElementById('txtAdminUserHistSearch');
    if (searchInput) {
        searchInput.oninput = (e) => {
            const activeFilter = document.querySelector('.admin-hist-filter-btn.active')?.dataset.filter || 'all';
            renderAdminUserHistoryOrdersList(activeFilter, e.target.value);
        };
    }
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
            compList.innerHTML = `<div class="api-error-card"><h4><i data-lucide="alert-triangle"></i> Error en el servidor</h4><p>${escapeHtml(res.error || 'No se pudieron consultar los compradores.')}</p></div>`;
            riderListEl.innerHTML = `<div class="api-error-card"><h4><i data-lucide="alert-triangle"></i> Error en el servidor</h4><p>${escapeHtml(res.error || 'No se pudieron consultar los riders.')}</p></div>`;
            initLucide();
            return;
        }
        if (res.data) {
            if (Array.isArray(res.data.compradores)) compradores = res.data.compradores;
            if (Array.isArray(res.data.riders)) riders = res.data.riders;
        }
    } catch (err) {
        console.error('Fallo GET /Auth/admin_users:', err);
        compList.innerHTML = `<div class="api-error-card"><h4><i data-lucide="alert-triangle"></i> Error de conexión con el servidor</h4><p>No se pudo conectar con el servidor.</p></div>`;
        riderListEl.innerHTML = `<div class="api-error-card"><h4><i data-lucide="alert-triangle"></i> Error de conexión con el servidor</h4><p>No se pudo conectar con el servidor.</p></div>`;
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

function renderCompradoresList(filter = 'all', searchQuery = '') {
    const el = document.getElementById('compradoresList');
    if (!el) return;
    const all = window._adminAllCompradores || [];
    let filtered = filter === 'all' ? all : all.filter(u => u.ci_status === filter);

    if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(u => 
            (u.nombre || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            String(u.id).includes(q) ||
            (u.telefono || '').includes(q)
        );
    }

    if (!filtered.length) {
        el.innerHTML = `<div style="color:var(--text-secondary);font-size:0.9rem;padding:0.75rem;text-align:center;">
            No se encontraron clientes ${searchQuery ? `que coincidan con "${escapeHtml(searchQuery)}"` : 'en este estado'}.
        </div>`;
        return;
    }

    el.innerHTML = filtered.map(u => {
        const canEnable = u.ci_status !== 'verified';
        const canReject = u.ci_status !== 'rejected';
        const isAppeal = u.apelacion_estado === 'pendiente';
        return `<div class="approval-card" style="${isAppeal ? 'border: 1px solid #eab308; box-shadow: 0 0 10px rgba(234, 179, 8, 0.2);' : ''}">
            <div class="approval-card-header">
                <div style="display:flex; align-items:center; gap:0.65rem;">
                    <img src="${resolveFileUrl(u.foto_url || u.ci_url, 'foto', u.id)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:1.5px solid rgba(255,255,255,0.15);flex-shrink:0;" />
                    <div class="approval-user-info">
                        <strong>${escapeHtml(u.nombre)}</strong>
                        <span style="font-size:0.75rem;color:var(--text-secondary);">${escapeHtml(u.email)}</span>
                    </div>
                </div>
                <div style="display:flex; gap:0.35rem; align-items:center;">
                    ${isAppeal ? '<span class="badge" style="background:rgba(234, 179, 8, 0.2); color:#eab308; border:1px solid #eab308;"><i data-lucide="help-circle" style="width:12px;height:12px;margin-right:2px;"></i> Apelación</span>' : ''}
                    ${getStatusBadge(u.ci_status)}
                </div>
            </div>
            <div class="approval-details-row">
                <span>Nacimiento: ${u.fecha_nacimiento || 'N/A'}</span>
                <span>ID #${u.id}</span>
            </div>
            ${u.direccion ? `<div style="font-size:0.78rem; color:#38bdf8; margin-top:0.35rem; display:flex; align-items:flex-start; gap:0.3rem;"><span>🏠</span> <span><strong>Dirección:</strong> ${escapeHtml(u.direccion)}</span></div>` : ''}
            ${u.telefono ? `<div style="font-size:0.78rem; color:#94a3b8; margin-top:0.2rem; display:flex; align-items:center; gap:0.3rem;"><span>📞</span> <span><strong>Teléfono:</strong> <a href="tel:${escapeHtml(u.telefono)}" style="color:var(--accent-green); font-weight:700;">${escapeHtml(u.telefono)}</a></span></div>` : ''}
            ${u.motivo_rechazo ? `<div style="font-size:0.8rem; color:#ef4444; background:rgba(239,68,68,0.1); padding:0.4rem 0.6rem; border-radius:var(--radius-sm); margin-top:0.4rem;"><strong>Motivo rechazo:</strong> ${escapeHtml(u.motivo_rechazo)}</div>` : ''}
            ${u.apelacion_motivo ? `<div style="font-size:0.8rem; color:#eab308; background:rgba(234,179,8,0.1); padding:0.4rem 0.6rem; border-radius:var(--radius-sm); margin-top:0.4rem;"><strong>Motivo apelación:</strong> ${escapeHtml(u.apelacion_motivo)}</div>` : ''}
            <div style="display:flex; align-items:center; justify-content:space-between; margin-top:0.5rem; flex-wrap:wrap; gap:0.5rem;">
                <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                    <a class="file-view-trigger" onclick="openFileViewer('${u.ci_url || ''}', 'C.I. Anverso - ${escapeHtml(u.nombre)}', 'ci', ${u.id})"><i data-lucide="eye" style="width:14px;height:14px;"></i> C.I. Anverso</a>
                    ${u.ci_reverso_url ? `<a class="file-view-trigger" onclick="openFileViewer('${u.ci_reverso_url}', 'C.I. Reverso - ${escapeHtml(u.nombre)}', 'ci', ${u.id})"><i data-lucide="eye" style="width:14px;height:14px;"></i> C.I. Reverso</a>` : ''}
                </div>
                <div class="approval-actions" style="display:flex; gap:0.4rem; align-items:center; flex-wrap:wrap;">
                    <button class="btn btn-secondary btn-sm" onclick="openAdminUserOrderHistory(${u.id}, 'cliente', '${escapeHtml(u.nombre)}')" style="display:inline-flex; align-items:center; gap:0.35rem; font-size:0.75rem; padding:0.3rem 0.6rem; border:1px solid rgba(56,189,248,0.3); color:#38bdf8;" title="Ver historial de pedidos y calificaciones">
                        <i data-lucide="history" style="width:13px;height:13px;"></i> Ver Historial
                    </button>
                    ${canReject ? `<button class="btn btn-danger btn-sm" onclick="adminUpdateUser(${u.id},'cliente','rejected')">Rechazar</button>` : ''}
                    ${canEnable ? `<button class="btn btn-success btn-sm" onclick="adminUpdateUser(${u.id},'cliente','verified')">Habilitar</button>` : ''}
                    ${!canReject && !canEnable ? '<span style="color:var(--text-secondary);font-size:0.8rem;">Sin cambios</span>' : ''}
                </div>
            </div>
        </div>`;
    }).join('');
    initLucide();
}

function renderRidersList(filter = 'all', searchQuery = '') {
    const el = document.getElementById('ridersList');
    if (!el) return;
    const all = window._adminAllRiders || [];
    let filtered = filter === 'all' ? all : all.filter(r => r.estado_aprobacion === filter);

    if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(r => 
            (r.nombre || '').toLowerCase().includes(q) ||
            (r.email || '').toLowerCase().includes(q) ||
            String(r.rider_id).includes(q) ||
            (r.telefono || '').includes(q)
        );
    }

    if (!filtered.length) {
        el.innerHTML = `<div style="color:var(--text-secondary);font-size:0.9rem;padding:0.75rem;text-align:center;">
            No se encontraron riders ${searchQuery ? `que coincidan con "${escapeHtml(searchQuery)}"` : 'en este estado'}.
        </div>`;
        return;
    }

    el.innerHTML = filtered.map(r => {
        const canApprove = r.estado_aprobacion !== 'aprobado';
        const canReject = r.estado_aprobacion !== 'rechazado';
        const isAppeal = r.apelacion_estado === 'pendiente';
        return `<div class="approval-card" style="${isAppeal ? 'border: 1px solid #eab308; box-shadow: 0 0 10px rgba(234, 179, 8, 0.2);' : ''}">
            <div class="approval-card-header">
                <div style="display:flex; align-items:center; gap:0.65rem;">
                    <img src="${resolveFileUrl(r.foto_url || r.ci_url, 'foto', r.rider_id)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:1.5px solid rgba(255,255,255,0.15);flex-shrink:0;" />
                    <div class="approval-user-info">
                        <strong>${escapeHtml(r.nombre)}</strong>
                        <span style="font-size:0.75rem;color:var(--text-secondary);">${escapeHtml(r.email)}</span>
                    </div>
                </div>
                <div style="display:flex; gap:0.35rem; align-items:center;">
                    ${isAppeal ? '<span class="badge" style="background:rgba(234, 179, 8, 0.2); color:#eab308; border:1px solid #eab308;"><i data-lucide="help-circle" style="width:12px;height:12px;margin-right:2px;"></i> Apelación</span>' : ''}
                    ${getStatusBadge(r.estado_aprobacion, true)}
                </div>
            </div>
            <div class="approval-details-row">
                <span>Nacimiento: ${r.fecha_nacimiento || 'N/A'}</span>
                <span>Rider ID #${r.rider_id}</span>
            </div>
            ${r.direccion ? `<div style="font-size:0.78rem; color:#38bdf8; margin-top:0.35rem; display:flex; align-items:flex-start; gap:0.3rem;"><span>🏠</span> <span><strong>Dirección:</strong> ${escapeHtml(r.direccion)}</span></div>` : ''}
            ${r.telefono ? `<div style="font-size:0.78rem; color:#94a3b8; margin-top:0.2rem; display:flex; align-items:center; gap:0.3rem;"><span>📞</span> <span><strong>Teléfono:</strong> <a href="tel:${escapeHtml(r.telefono)}" style="color:var(--accent-green); font-weight:700;">${escapeHtml(r.telefono)}</a></span></div>` : ''}
            ${r.motivo_rechazo ? `<div style="font-size:0.8rem; color:#ef4444; background:rgba(239,68,68,0.1); padding:0.4rem 0.6rem; border-radius:var(--radius-sm); margin-top:0.4rem;"><strong>Motivo rechazo:</strong> ${escapeHtml(r.motivo_rechazo)}</div>` : ''}
            ${r.apelacion_motivo ? `<div style="font-size:0.8rem; color:#eab308; background:rgba(234,179,8,0.1); padding:0.4rem 0.6rem; border-radius:var(--radius-sm); margin-top:0.4rem;"><strong>Motivo apelación:</strong> ${escapeHtml(r.apelacion_motivo)}</div>` : ''}
            <div style="display:flex; flex-direction:column; gap:0.35rem; font-size:0.85rem; border:1px solid var(--border-color); padding:0.5rem; border-radius:var(--radius-md); background:rgba(0,0,0,0.1); margin-top:0.5rem;">
                <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                    <a class="file-view-trigger" onclick="openFileViewer('${r.licencia_url}','Licencia Anverso - ${escapeHtml(r.nombre)}','licencia',${r.rider_id})"><i data-lucide="file-text" style="width:14px;height:14px;"></i> Licencia Anverso</a>
                    ${r.licencia_reverso_url ? `<a class="file-view-trigger" onclick="openFileViewer('${r.licencia_reverso_url}','Licencia Reverso - ${escapeHtml(r.nombre)}','licencia',${r.rider_id})"><i data-lucide="file-text" style="width:14px;height:14px;"></i> Licencia Reverso</a>` : ''}
                </div>
                ${r.ci_url ? `<div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                    <a class="file-view-trigger" onclick="openFileViewer('${r.ci_url}','C.I. Anverso - ${escapeHtml(r.nombre)}','ci',${r.rider_id})"><i data-lucide="file-text" style="width:14px;height:14px;"></i> C.I. Anverso</a>
                    ${r.ci_reverso_url ? `<a class="file-view-trigger" onclick="openFileViewer('${r.ci_reverso_url}', 'C.I. Reverso - ${escapeHtml(r.nombre)}','ci',${r.rider_id})"><i data-lucide="file-text" style="width:14px;height:14px;"></i> C.I. Reverso</a>` : ''}
                </div>` : ''}
                <a class="file-view-trigger" onclick="openFileViewer('${r.seguro_url}','Seguro SOAT - ${escapeHtml(r.nombre)}','seguro',${r.rider_id})"><i data-lucide="file-text" style="width:14px;height:14px;"></i> Seguro SOAT</a>
                <a class="file-view-trigger" onclick="openFileViewer('${r.cv_url}','Currículum Vitae - ${escapeHtml(r.nombre)}','cv',${r.rider_id})"><i data-lucide="file-text" style="width:14px;height:14px;"></i> Curriculum Vitae</a>
            </div>
            <div class="approval-actions" style="justify-content:flex-end; margin-top:0.5rem; display:flex; gap:0.4rem; align-items:center; flex-wrap:wrap;">
                <button class="btn btn-secondary btn-sm" onclick="openAdminUserOrderHistory(${r.rider_id}, 'rider', '${escapeHtml(r.nombre)}')" style="display:inline-flex; align-items:center; gap:0.35rem; font-size:0.75rem; padding:0.3rem 0.6rem; border:1px solid rgba(139,92,246,0.3); color:var(--accent-purple);" title="Ver historial de entregas y calificaciones">
                    <i data-lucide="history" style="width:13px;height:13px;"></i> Ver Historial
                </button>
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
            document.querySelectorAll(`.users-filter-btn[data-target="${target}"]`).forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const searchVal = document.getElementById('txtAdminUserSearch')?.value || '';
            if (target === 'compradores') renderCompradoresList(filter, searchVal);
            else if (target === 'riders') renderRidersList(filter, searchVal);
        });
    });

    const userSearchInput = document.getElementById('txtAdminUserSearch');
    if (userSearchInput) {
        userSearchInput.addEventListener('input', (e) => {
            const val = e.target.value;
            const compFilter = document.querySelector('.users-filter-btn[data-target="compradores"].active')?.dataset.filter || 'all';
            const riderFilter = document.querySelector('.users-filter-btn[data-target="riders"].active')?.dataset.filter || 'all';
            renderCompradoresList(compFilter, val);
            renderRidersList(riderFilter, val);
        });
    }
}

window.adminUpdateUser = async function(targetId, tipo, estado) {
    let motivoRechazo = '';
    if (estado === 'rejected' || estado === 'rechazado') {
        const input = prompt('Ingrese el motivo del rechazo para informar al usuario:');
        if (input === null) return;
        motivoRechazo = input.trim();
        if (!motivoRechazo) {
            showToast('Debe ingresar un motivo para el rechazo.', 'warning');
            return;
        }
    }
    try {
        const res = await apiRequest('/Auth/admin_users.php', { 
            method: 'PUT', 
            data: { 
                target_id: targetId, 
                tipo, 
                estado, 
                motivo_rechazo: motivoRechazo 
            } 
        });
        if (res.ok) {
            showToast('Estado actualizado en MySQL correctamente.', 'success');
            await renderAdminAllUsers();
            await renderAdminPendingApprovals();
        } else {
            showToast(`Aviso: ${res.error || 'No se pudo actualizar.'}`, 'danger');
        }
    } catch (err) {
        console.error('Fallo PUT /Auth/admin_users:', err);
        showToast('Error de conexión al actualizar usuario.', 'danger');
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
    // Sincronizar catálogo desde la API de backend
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
        showToast('Error de conexión al guardar producto.', 'danger');
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
        showToast('Error de conexión al eliminar producto.', 'danger');
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
    return;
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
            if (list) list.innerHTML = `<div class="api-error-card"><h4><i data-lucide="alert-triangle"></i> Error en Reportes</h4><p>${res.error || 'No se pudo obtener información del reporte del servidor.'}</p></div>`;
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

        // Métodos de pago desde MySQL (concatenando pagos por QR y efectivo)
        const metodos = Array.isArray(data.metodos_pago) ? data.metodos_pago : [];
        let qrSum = 0;
        let cashSum = 0;

        if (data.estadisticas_qr) {
            qrSum = parseFloat(data.estadisticas_qr.total_qr_bs || 0);
            cashSum = parseFloat(data.estadisticas_qr.total_efectivo_bs || 0);
        } else {
            metodos.forEach(m => {
                const totalMonto = parseFloat(m.monto_total || 0);
                if (m.estado_pago === 'pagado_qr' || m.estado_pago === 'qr') {
                    qrSum += totalMonto;
                } else if (['pagado_efectivo', 'contraentrega', 'liquidado'].includes(m.estado_pago)) {
                    cashSum += totalMonto;
                }
            });
        }

        const totalPayments = qrSum + cashSum;
        const qrPct = totalPayments > 0 ? (qrSum / totalPayments) * 100 : 0;
        const cashPct = totalPayments > 0 ? (cashSum / totalPayments) * 100 : 0;

        if (elQrVal) elQrVal.innerText = `${qrSum.toFixed(2)} Bs (${Math.round(qrPct)}%)`;
        if (elQrBar) elQrBar.style.width = `${qrPct}%`;
        if (elCashVal) elCashVal.innerText = `${cashSum.toFixed(2)} Bs (${Math.round(cashPct)}%)`;
        if (elCashBar) elCashBar.style.width = `${cashPct}%`;

        // Concatenación del Total QR en el badge superior de la tabla
        const badgeQrTotal = document.getElementById('badgeTotalQrSales');
        if (badgeQrTotal) {
            badgeQrTotal.innerText = `Total Recaudado por QR: ${qrSum.toFixed(2)} Bs`;
        }

        // Tabla de Transacciones QR Recientes
        const tableQr = document.getElementById('tableAdminQrTransactions');
        if (tableQr) {
            const qrList = (data.estadisticas_qr && Array.isArray(data.estadisticas_qr.transacciones_recientes)) 
                ? data.estadisticas_qr.transacciones_recientes 
                : [];

            if (qrList.length === 0) {
                tableQr.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No se registran transacciones por QR aún.</td></tr>`;
            } else {
                tableQr.innerHTML = qrList.map(tx => `
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <td style="padding: 0.6rem; font-weight: 700; color: #fff;">#${tx.pedido_id}</td>
                        <td style="padding: 0.6rem; color: var(--text-secondary);">${escapeHtml(tx.cliente_nombre || 'Cliente')} <small style="display:block; font-size:0.75rem; color:var(--text-muted);">${escapeHtml(tx.cliente_email || '')}</small></td>
                        <td style="padding: 0.6rem; font-weight: 700; color: var(--accent-purple);">${parseFloat(tx.total).toFixed(2)} Bs</td>
                        <td style="padding: 0.6rem;">
                            <span class="badge ${tx.estado_pedido === 'entregado' ? 'badge-verified' : 'badge-pending'}" style="font-size: 0.72rem;">
                                ${tx.estado_pedido}
                            </span>
                        </td>
                        <td style="padding: 0.6rem; font-size: 0.75rem; color: var(--text-muted);">${new Date(tx.created_at).toLocaleString()}</td>
                        <td style="padding: 0.6rem; text-align: right; white-space: nowrap;">
                            <button class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 0.3rem 0.6rem; margin-right: 0.25rem;" onclick="openReceiptModal(${tx.pedido_id})">
                                <i data-lucide="receipt" style="width:12px;height:12px;vertical-align:middle;"></i> Recibo Digital
                            </button>
                            ${tx.qr_comprobante_url ? `
                                <button class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 0.3rem 0.6rem;" onclick="openFileViewer('${tx.qr_comprobante_url}', 'Comprobante Pedido #${tx.pedido_id}', 'qr', null)">
                                    <i data-lucide="eye" style="width:12px;height:12px;vertical-align:middle;"></i> Ver QR
                                </button>
                            ` : ''}
                        </td>
                    </tr>
                `).join('');
                initLucide();
            }
        }

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

// ========================================================================================
// 📡 FUNCIÓN: fetchAndUpdateAdminMonitoring (El Radar del Dueño de la Tienda)
// ¿Para qué sirve?
// Pregunta cada pocos segundos a Transactions/live_monitoring.php:
// "¿Dónde están todos los repartidores y qué pedidos faltan entregar?".
// Luego actualiza la pantalla del jefe con el mapa en vivo y las cuentas de dinero.
// ========================================================================================
async function fetchAndUpdateAdminMonitoring() {
    const listActive = document.getElementById('adminLiveOrdersList');
    const listSettlements = document.getElementById('adminRiderSettlementsList');
    if (!listActive || !listSettlements) return;

    try {
        const res = await apiGet('/Transactions/live_monitoring.php');
        if (!res.ok || !res.data) {
            listActive.innerHTML = `<div class="api-error-card"><h4><i data-lucide="alert-triangle"></i> Error en Monitoreo</h4><p>${res.error || 'No se pudo obtener el monitoreo en vivo del servidor.'}</p></div>`;
            listSettlements.innerHTML = `<div class="api-error-card"><h4><i data-lucide="alert-triangle"></i> Error en Liquidaciones</h4><p>No se pudo conectar con el servicio de liquidaciones.</p></div>`;
            initLucide();
            showGlobalApiError('Error al consultar el monitoreo en vivo.');
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
        listSettlements.innerHTML = `<div class="api-error-card"><h4><i data-lucide="wifi-off"></i> Fallo de Red</h4><p>Error de conexión con el servidor.</p></div>`;
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
                        ${p.direccion_entrega ? `<p style="color:#38bdf8; font-size:0.82rem; margin:0.2rem 0;"><strong>🏠 Entrega:</strong> ${escapeHtml(p.direccion_entrega)}${p.referencia_entrega ? ` <em>(${escapeHtml(p.referencia_entrega)})</em>` : ''}</p>` : ''}
                        ${p.telefono_contacto ? `<p style="color:#94a3b8; font-size:0.8rem; margin:0.2rem 0;"><strong>📞 Teléfono:</strong> <a href="tel:${escapeHtml(p.telefono_contacto)}" style="color:var(--accent-green); font-weight:700;">${escapeHtml(p.telefono_contacto)}</a></p>` : ''}
                        <p style="color:#fdba74; font-size:0.8rem; margin:0.2rem 0;"><strong>🏪 Recogida (Tienda):</strong> ${escapeHtml(p.tienda_direccion || STORE_COORDS.direccion)}</p>
                        <p><strong>Repartidor:</strong> ${riderName}</p>
                        <p><strong>Detalles:</strong> ${itemsText || 'Sin detalles'}</p>
                        <p><strong>Monto:</strong> ${parseFloat(p.total).toFixed(2)} Bs</p>
                    </div>
                    <div style="display:flex; gap:0.5rem; justify-content:flex-end; flex-wrap:wrap;">
                        <button class="btn btn-secondary btn-sm" onclick="openReceiptModal(${p.id})"><i data-lucide="receipt"></i> Ver Recibo</button>
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

// ========================================================================================
// 💰 FUNCIÓN: settleRiderCash (La Entrega de la Alcancía del Repartidor)
// ¿Para qué sirve?
// Cuando el repartidor vuelve de entregar hamburguesas pagadas en efectivo, el jefe aprieta
// este botón. Llama a Rider/settle_cash.php para registrar que los billetes ya entraron a la
// caja registradora principal del restaurante y la cuenta del repartidor queda limpia en 0.
// ========================================================================================
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
        showToast('Error de conexión al liquidar caja.', 'danger');
        showGlobalApiError('Error de red al liquidar caja del repartidor.');
    }
};

function initAdminMonitoringMap(orderId, ordersList = null) {
    setTimeout(() => {
        const mapContainer = document.getElementById('adminMonitoringMap');
        if (!mapContainer) return;

        if (!adminMonitoringMapInstance) {
            adminMonitoringMapInstance = L.map('adminMonitoringMap', {
                zoomControl: true,
                maxBounds: LA_PAZ_BOUNDS,
                minZoom: 12,
                maxZoom: 18
            }).setView([STORE_COORDS.lat, STORE_COORDS.lon], 14);

            L.tileLayer(MAP_TILE_URL, {
                attribution: MAP_TILE_ATTR,
                maxZoom: 19
            }).addTo(adminMonitoringMapInstance);

            adminMonitoringMarkerStore = L.marker([STORE_COORDS.lat, STORE_COORDS.lon], {
                icon: createStorePinIcon()
            }).addTo(adminMonitoringMapInstance).bindPopup(`<b>${escapeHtml(STORE_COORDS.nombre)}</b><br>${escapeHtml(STORE_COORDS.direccion)} (Cocina Central)`);
        } else {
            if (adminMonitoringMarkerStore) {
                adminMonitoringMarkerStore.setLatLng([STORE_COORDS.lat, STORE_COORDS.lon]);
                adminMonitoringMarkerStore.setPopupContent(`<b>${escapeHtml(STORE_COORDS.nombre)}</b><br>${escapeHtml(STORE_COORDS.direccion)} (Cocina Central)`);
            }
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
            icon: createClientPinIcon(`Cliente: ${clientName}`)
        }).addTo(adminMonitoringMapInstance);
        const clientPopupContent = `<b>Cliente: ${escapeHtml(clientName)}</b><br>Pedido #${order.id}${order.direccion_entrega ? `<br>🏠 <strong>Entrega:</strong> ${escapeHtml(order.direccion_entrega)}` : ''}${order.telefono_contacto ? `<br>📞 <strong>Tel:</strong> ${escapeHtml(order.telefono_contacto)}` : ''}`;
        adminMonitoringMarkerClient.bindPopup(clientPopupContent);

        renderDeliveryRoute(
            adminMonitoringMapInstance,
            [STORE_COORDS.lat, STORE_COORDS.lon],
            [latCliente, lonCliente],
            adminMonitoringRouteLine,
            { color: '#6366f1', glowColor: 'rgba(99, 102, 241, 0.35)' }
        ).then(layer => {
            adminMonitoringRouteLine = layer;
        });

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
            icon: createRiderPinIcon()
        }).addTo(adminMonitoringMapInstance);
        adminMonitoringMarkerRider.bindPopup(`<b>Rider: ${riderName}</b><br>Estado: ${order.estado_pedido.toUpperCase()}`);

        adminMonitoringMapInstance.invalidateSize();
    }, 150);
}

// ----------------------------------------------------
// 13. GENERAL UTILITY FUNCTIONS
// ----------------------------------------------------
function calculateAge(dobString) {
    if (!dobString || dobString === 'N/A') return 29;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return 29;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return (isNaN(age) || age <= 0) ? 29 : age;
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
        toast.style.background = '#ea580c';
        toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)';
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

// ========================================================================================
// 💳 ESTADO Y CONFIGURACIÓN DEL CÓDIGO QR DE PAGO (SUPER ADMIN & CHECKOUT)
// ========================================================================================
let paymentQrConfig = {
    banco: 'Banco Unión',
    titular: 'Burger 24/7 S.R.L. (Admin Central)',
    cuenta: '100000482910',
    alias_qr: 'burger247@banco',
    qr_imagen_url: null,
    modo_qr: 'hibrido',
    costo_fijo: null
};

// 🧒 EXPLICACIÓN FÁCIL:
// Pregunta a la cocina central (Transactions/qr_config.php) qué cuenta bancaria y QR
// tiene configurado el dueño del restaurante para cobrar.
async function fetchPaymentQrConfig() {
    try {
        const res = await apiGet('/Transactions/qr_config.php');
        if (res.ok && res.data) {
            paymentQrConfig = Object.assign(paymentQrConfig, res.data);
            const subtotal = cart.reduce((acc, item) => acc + (item.product.precio * item.quantity), 0);
            const shipping = selectedDeliveryCoords ? parseFloat(selectedDeliveryCoords.costBs) : 0;
            updateCheckoutQrDisplay(subtotal + shipping);
        }
    } catch (err) {
        console.warn('No se pudo cargar la configuración del QR desde la API:', err);
    }
}

// 🧒 EXPLICACIÓN FÁCIL:
// Dibuja el código QR en la pantalla del cliente con el COSTO EXACTO del pedido
// (para que cuando escanee con su app del banco, sepa cuánto dinero transferir).
function updateCheckoutQrDisplay(totalBs) {
    const cost = parseFloat(totalBs || 0);
    const lblCost = document.getElementById('lblQrMontoCost');
    if (lblCost) lblCost.innerText = `${cost.toFixed(2)} Bs`;

    const lblBank = document.getElementById('lblQrBankName');
    if (lblBank) lblBank.innerText = paymentQrConfig.banco || 'Banco Unión';

    const lblTitular = document.getElementById('lblQrTitular');
    if (lblTitular) lblTitular.innerText = paymentQrConfig.titular || 'Burger 24/7 S.R.L.';

    const lblCuenta = document.getElementById('lblQrCuenta');
    if (lblCuenta) lblCuenta.innerText = paymentQrConfig.cuenta || '100000482910';

    const imgQr = document.getElementById('imgCheckoutQr');
    if (imgQr) {
        if (paymentQrConfig.qr_imagen_url) {
            imgQr.src = resolveFileUrl(paymentQrConfig.qr_imagen_url, 'qr');
        } else {
            const qrPayload = `PAGO BURGER 24/7 | MONTO: ${cost.toFixed(2)} Bs | BANCO: ${paymentQrConfig.banco} | TITULAR: ${paymentQrConfig.titular} | CUENTA: ${paymentQrConfig.cuenta}`;
            imgQr.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrPayload)}`;
        }
    }
}

// 🧒 EXPLICACIÓN FÁCIL:
// Abre el escritorio del Super Admin donde puede cambiar su banco, su cuenta o subir
// una foto de su propio QR bancario oficial.
async function renderAdminQrConfig() {
    try {
        const res = await apiGet('/Transactions/qr_config.php');
        const data = (res.ok && res.data && res.data.config) ? res.data.config : ((res.ok && res.data) ? res.data : paymentQrConfig);
        paymentQrConfig = Object.assign(paymentQrConfig, data);

        const inpBanco = document.getElementById('adminQrBanco');
        const inpTitular = document.getElementById('adminQrTitular');
        const inpCuenta = document.getElementById('adminQrCuenta');
        const inpAlias = document.getElementById('adminQrAlias');

        if (inpBanco) inpBanco.value = data.banco || '';
        if (inpTitular) inpTitular.value = data.titular || '';
        if (inpCuenta) inpCuenta.value = data.cuenta || '';
        if (inpAlias) inpAlias.value = data.alias_qr || '';

        updateAdminQrPreview();
        initAdminQrInputListeners();
    } catch (err) {
        console.error('Error al cargar configuración QR de admin:', err);
    }
}

function updateAdminQrPreview() {
    const banco = document.getElementById('adminQrBanco')?.value || paymentQrConfig.banco || 'Banco Unión';
    const titular = document.getElementById('adminQrTitular')?.value || paymentQrConfig.titular || 'Burger 24/7 S.R.L.';
    const cuenta = document.getElementById('adminQrCuenta')?.value || paymentQrConfig.cuenta || '100000482910';

    const prevBanco = document.getElementById('previewAdminQrBanco');
    if (prevBanco) prevBanco.innerText = banco;
    const prevTitular = document.getElementById('previewAdminQrTitular');
    if (prevTitular) prevTitular.innerText = titular;
    const prevCuenta = document.getElementById('previewAdminQrCuenta');
    if (prevCuenta) prevCuenta.innerText = cuenta;

    const prevImg = document.getElementById('previewAdminQrImg');
    if (prevImg) {
        if (paymentQrConfig.qr_imagen_url) {
            prevImg.src = resolveFileUrl(paymentQrConfig.qr_imagen_url, 'qr');
        } else {
            const qrData = `PAGO BURGER 24/7 | MONTO: 45.00 Bs | BANCO: ${banco} | TITULAR: ${titular} | CUENTA: ${cuenta}`;
            prevImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrData)}`;
        }
    }
}

let adminQrListenersAttached = false;
function initAdminQrInputListeners() {
    if (adminQrListenersAttached) return;
    adminQrListenersAttached = true;

    ['adminQrBanco', 'adminQrTitular', 'adminQrCuenta'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateAdminQrPreview);
    });


    const fileInput = document.getElementById('fileAdminQrImage');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const prevImg = document.getElementById('previewAdminQrImg');
                    if (prevImg) prevImg.src = ev.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

window.handleSaveAdminQrConfig = async function(event) {
    if (event) event.preventDefault();
    const banco = document.getElementById('adminQrBanco')?.value || '';
    const titular = document.getElementById('adminQrTitular')?.value || '';
    const cuenta = document.getElementById('adminQrCuenta')?.value || '';
    const alias = document.getElementById('adminQrAlias')?.value || '';
    const fileInput = document.getElementById('fileAdminQrImage');
    const btn = document.getElementById('btnSaveAdminQr');

    const token = getAuthToken();
    if (!token) {
        showToast('Error 401: Sesión no válida de Administrador.', 'danger');
        return;
    }

    const formData = new FormData();
    formData.append('banco', banco);
    formData.append('titular', titular);
    formData.append('cuenta', cuenta);
    formData.append('alias_qr', alias);
    formData.append('modo_qr', (fileInput && fileInput.files.length > 0) ? 'subido' : 'hibrido');

    if (fileInput && fileInput.files[0]) {
        formData.append('qr_image', fileInput.files[0]);
    }

    try {
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<i data-lucide="loader" class="spin"></i> Guardando...`;
            initLucide();
        }

        const res = await apiPost('/Transactions/qr_config.php', formData);

        if (!res.ok) {
            showToast(`Error al guardar QR: ${res.error || 'Operación rechazada'}`, 'danger');
            return;
        }

        showToast('¡Configuración de Código QR actualizada con éxito!', 'success');
        if (res.data && res.data.config) {
            paymentQrConfig = Object.assign(paymentQrConfig, res.data.config);
            updateAdminQrPreview();
        }
    } catch (err) {
        console.error('Error guardando configuración QR:', err);
        showToast('Error de red al guardar configuración del código QR.', 'danger');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i data-lucide="save"></i> Guardar Configuración QR`;
            initLucide();
        }
    }
};

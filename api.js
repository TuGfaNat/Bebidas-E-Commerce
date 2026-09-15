// api.js
// Capa centralizada de comunicación HTTP con Microservicios REST PHP/MySQL para Burger 24/7
// Provee funciones helper estándar: apiRequest, apiGet, apiPost, apiPut, apiDelete
// Cumple con el estándar BMAD: { status, data, audit, error_details }

/**
 * Obtiene la URL base de los microservicios configurada o la autodetecta según el origen
 */
function getApiBaseUrl() {
    if (typeof window !== 'undefined' && window.config && window.config.apiUrl) {
        return window.config.apiUrl;
    }
    const origin = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null' && !window.location.origin.startsWith('file:'))
        ? `${window.location.origin}${window.location.pathname.replace(/\/[^\/]*$/, '')}/microservices`
        : 'http://localhost/Bebidas-E-Commerce/microservices';
    return origin;
}

/**
 * Obtiene el token JWT actual almacenado en el navegador
 */
function getAuthToken() {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem('burger_jwt_token') || localStorage.getItem('bebidas_jwt_token');
}

/**
 * Función centralizada para peticiones HTTP
 * @param {string} endpoint Ruta relativa o absoluta (ej: '/Catalog/catalog.php')
 * @param {object} options Opciones { method, data, params, headers, skipAuth }
 * @returns {Promise<{ ok: boolean, status: number, data: any, error: string|null, envelope: any }>}
 */
async function apiRequest(endpoint, options = {}) {
    const {
        method = 'GET',
        data = null,
        params = null,
        headers = {},
        skipAuth = false
    } = options;

    let url = endpoint;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
        const cleanEndpoint = endpoint.replace(/^\/+/, '');
        url = `${baseUrl}/${cleanEndpoint}`;
    }

    // Agregar query params si existen (asegurando que NO enviemos tokens por query string)
    if (params && typeof params === 'object') {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && k !== 'token') {
                queryParams.append(k, v);
            }
        });
        const qs = queryParams.toString();
        if (qs) {
            url += (url.includes('?') ? '&' : '?') + qs;
        }
    }

    const reqHeaders = {
        'Accept': 'application/json',
        ...headers
    };

    if (!skipAuth) {
        const token = getAuthToken();
        if (token && !reqHeaders['Authorization'] && !reqHeaders['authorization']) {
            reqHeaders['Authorization'] = `Bearer ${token}`;
        }
    }

    const fetchOptions = {
        method: method.toUpperCase(),
        headers: reqHeaders
    };

    if (data !== null && data !== undefined && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(fetchOptions.method)) {
        if (typeof FormData !== 'undefined' && data instanceof FormData) {
            fetchOptions.body = data;
        } else {
            reqHeaders['Content-Type'] = 'application/json';
            fetchOptions.body = JSON.stringify(data);
        }
    }

    try {
        const response = await fetch(url, fetchOptions);
        const contentType = response.headers.get('content-type') || '';
        let result = null;

        if (contentType.includes('application/json')) {
            result = await response.json().catch(() => null);
        } else {
            const text = await response.text();
            try {
                result = JSON.parse(text);
            } catch (e) {
                result = { status: response.ok ? 'success' : 'error', raw: text };
            }
        }

        const isSuccess = response.ok && result && result.status === 'success';
        const errorMessage = (result && result.error_details)
            ? result.error_details
            : (result && result.message)
                ? result.message
                : (!response.ok ? `Error HTTP ${response.status}: ${response.statusText}` : null);

        return {
            ok: isSuccess,
            status: response.status,
            data: result && result.data !== undefined ? result.data : result,
            error: errorMessage,
            envelope: result
        };
    } catch (networkError) {
        return {
            ok: false,
            status: 0,
            data: null,
            error: networkError.message || 'Error de conexión de red',
            envelope: null
        };
    }
}

/**
 * Helper GET
 */
async function apiGet(endpoint, params = null, options = {}) {
    return apiRequest(endpoint, { ...options, method: 'GET', params });
}

/**
 * Helper POST
 */
async function apiPost(endpoint, data = null, options = {}) {
    return apiRequest(endpoint, { ...options, method: 'POST', data });
}

/**
 * Helper PUT
 */
async function apiPut(endpoint, data = null, options = {}) {
    return apiRequest(endpoint, { ...options, method: 'PUT', data });
}

/**
 * Helper DELETE
 */
async function apiDelete(endpoint, params = null, options = {}) {
    return apiRequest(endpoint, { ...options, method: 'DELETE', params });
}

// Exportar globalmente en window para navegador
if (typeof window !== 'undefined') {
    window.apiRequest = apiRequest;
    window.apiGet = apiGet;
    window.apiPost = apiPost;
    window.apiPut = apiPut;
    window.apiDelete = apiDelete;
    window.API = {
        request: apiRequest,
        get: apiGet,
        post: apiPost,
        put: apiPut,
        delete: apiDelete,
        getBaseUrl: getApiBaseUrl,
        getToken: getAuthToken
    };
}

// Exportar para entorno NodeJS / tests si aplica
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { apiRequest, apiGet, apiPost, apiPut, apiDelete, getApiBaseUrl, getAuthToken };
}

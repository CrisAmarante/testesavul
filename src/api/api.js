/**
 * API - Comunicação com o backend via fetch + JWT
 * Gerencia requisições autenticadas e token
 */
import { API_BASE_URL, REQUEST_TIMEOUT } from './config.js';

// ====================================================================
// GERENCIAMENTO DE TOKEN
// ====================================================================
function getToken() {
  return sessionStorage.getItem('penso_token');
}

function setToken(token) {
  sessionStorage.setItem('penso_token', token);
}

function removeToken() {
  sessionStorage.removeItem('penso_token');
}

function getUserData() {
  try {
    const data = sessionStorage.getItem('penso_user');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function setUserData(user) {
  sessionStorage.setItem('penso_user', JSON.stringify(user));
}

function removeUserData() {
  sessionStorage.removeItem('penso_user');
}

// ====================================================================
// REQUISIÇÃO BASE
// ====================================================================
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  // Timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  config.signal = controller.signal;

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    // Se for 401 (não autorizado), remove token e redireciona para login
    if (response.status === 401) {
      removeToken();
      removeUserData();
      // Dispara evento de logout
      window.dispatchEvent(new CustomEvent('penso:logout'));
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    // Tenta parsear JSON, mesmo se for erro
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const erro = data.erro || data.message || `Erro ${response.status}`;
      throw new Error(erro);
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Tempo limite excedido. Verifique sua conexão.');
    }
    throw error;
  }
}

// ====================================================================
// MÉTODOS AUXILIARES
// ====================================================================
function get(endpoint, params = {}) {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      url.searchParams.append(key, params[key]);
    }
  });
  return apiRequest(url.pathname + url.search, { method: 'GET' });
}

function post(endpoint, data) {
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

function put(endpoint, data) {
  return apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

function del(endpoint) {
  return apiRequest(endpoint, { method: 'DELETE' });
}

function patch(endpoint, data) {
  return apiRequest(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ====================================================================
// EXPORTAÇÕES
// ====================================================================
export default {
  get,
  post,
  put,
  patch,
  delete: del,
  apiRequest,
  getToken,
  setToken,
  removeToken,
  getUserData,
  setUserData,
  removeUserData,
};

// Exporta individualmente para compatibilidade com o código antigo
export { get, post, put, del as delete, patch, getToken, setToken, removeToken, getUserData, setUserData, removeUserData };
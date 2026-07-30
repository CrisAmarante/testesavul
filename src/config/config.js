/**
 * CONFIGURAÇÕES GERAIS
 * URL da API do backend (Render)
 */
export const API_BASE_URL = 'https://penso-backend.onrender.com/api';

// Endpoints específicos (usados nos módulos)
export const ENDPOINTS = {
  LOGIN: '/auth/login',
  TERMINAIS: '/terminals',
  TERMINAIS_TODOS: '/terminals/all',
  INSPECOES: '/inspections',
  RELATORIOS: '/reports',
  CONFIG: '/config',
  ADMIN_USUARIOS: '/admin/users',
  ADMIN_CONFIG: '/config',
};

// Timeout padrão para requisições (ms)
export const REQUEST_TIMEOUT = 30000; // 30 segundos
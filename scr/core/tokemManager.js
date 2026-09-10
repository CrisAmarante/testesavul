/**
 * Gerenciador de Token JWT
 * Centraliza operações com token e dados do usuário
 */
import api from '../api.js';

// ====================================================================
// GETTERS / SETTERS
// ====================================================================
export function getToken() {
  return sessionStorage.getItem('penso_token');
}

export function setToken(token) {
  sessionStorage.setItem('penso_token', token);
}

export function removeToken() {
  sessionStorage.removeItem('penso_token');
}

export function getUserData() {
  try {
    const data = sessionStorage.getItem('penso_user');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function setUserData(user) {
  sessionStorage.setItem('penso_user', JSON.stringify(user));
}

export function removeUserData() {
  sessionStorage.removeItem('penso_user');
}

// ====================================================================
// VALIDAÇÃO DO TOKEN (verifica se ainda é válido)
// ====================================================================
export function isTokenValid() {
  const token = getToken();
  if (!token) return false;
  
  try {
    // Decodifica o payload do JWT (parte do meio)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // converte para ms
    return Date.now() < exp;
  } catch {
    return false;
  }
}

// ====================================================================
// VERIFICA SE USUÁRIO ESTÁ LOGADO
// ====================================================================
export function isLoggedIn() {
  return !!getToken() && !!getUserData() && isTokenValid();
}

// ====================================================================
// EXPORTAÇÃO PADRÃO
// ====================================================================
export default {
  getToken,
  setToken,
  removeToken,
  getUserData,
  setUserData,
  removeUserData,
  isTokenValid,
  isLoggedIn,
};
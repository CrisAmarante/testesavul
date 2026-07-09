/**
 * Configuração da aplicação
 * Backend: Firebase (Firestore + Authentication)
 */

// ============================================================================
// CONFIGURAÇÃO DO FIREBASE
// Substitua os valores abaixo pelas credenciais do seu projeto Firebase
// ============================================================================
const FIREBASE_CONFIG = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

// URLs e configurações legacy (mantidas para compatibilidade durante migração)
const URL_PLANILHA = "https://script.google.com/macros/s/AKfycbzAgdn_o_yfeUg2jvVhTMk65BbL3fUr8bCUlEZI7P-PV1ClCwXccieGAWrHy7BR7ML5qw/exec";

// Coleções do Firestore
const FIRESTORE_COLLECTIONS = {
  USUARIOS: 'usuarios',
  INSPETORES: 'inspetores',
  TERMINAIS: 'terminais',
  INSPECOES: 'inspecoes',
  ENVIOS: 'envios',
  LOGS: 'logs',
  CONFIG: 'config',
  MODAIS: 'modais'
};

window.FIREBASE_CONFIG = FIREBASE_CONFIG;
window.FIRESTORE_COLLECTIONS = FIRESTORE_COLLECTIONS;
window.URL_PLANILHA = URL_PLANILHA;

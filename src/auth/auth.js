/**
 * Autenticação e Controle de Acesso
 * Gerencia login, logout, permissões e ajustes de UI por perfil
 */
import api, { getToken, setToken, setUserData, removeToken, removeUserData } from './api.js';
import { ENDPOINTS } from './config.js';

// ====================================================================
// VARIÁVEIS DE AUTENTICAÇÃO E PERMISSÕES
// ====================================================================
const ROLES_ALLOWED_INSPECTION = ['INSPETOR', 'ENCARREGADO', 'ADMIN', 'GERENTE', 'FISCAL', 'PLANTONISTA'];
let currentUserRole = '';
let canCreateInspection = false;
let inactivityTimer = null;
let INACTIVITY_TIMEOUT = 20 * 60 * 1000; // 20 minutos padrão

// ====================================================================
// CARREGAR TIMEOUT DO BACKEND
// ====================================================================
export async function carregarTimeoutInatividade() {
  try {
    const config = await api.get(ENDPOINTS.CONFIG);
    if (config && config.TIMEOUT_INATIVIDADE) {
      INACTIVITY_TIMEOUT = parseInt(config.TIMEOUT_INATIVIDADE, 10);
      console.log(`✅ Timeout de inatividade carregado: ${INACTIVITY_TIMEOUT / 60000} minutos`);
    }
  } catch (err) {
    console.warn('⚠️ Falha ao carregar timeout do servidor, usando padrão:', err);
  }
}

// ====================================================================
// VERIFICAR STATUS DE LOGIN
// ====================================================================
export async function checkLoginStatus() {
  const token = getToken();
  const userData = api.getUserData();
  
  const main = document.getElementById('main-screen');
  const insp = document.getElementById('inspector-screen');
  const btnInspecao = document.getElementById('btn-inspecao-veicular');
  const btnEnvio = document.getElementById('btn-envio-informacoes');
  const btnAdmin = document.getElementById('btn-painel-admin');
  const logoutBtn = insp?.querySelector('.logout-btn');
  
  if (token && userData) {
    currentUserRole = userData.funcao || '';
    canCreateInspection = (currentUserRole === 'FISCAL' || currentUserRole === 'INSPETOR');
    
    // Mostra/oculta cards especiais
    if (btnInspecao && currentUserRole !== 'MONITOR') btnInspecao.style.display = 'flex';
    else if (btnInspecao) btnInspecao.style.display = 'none';
    
    if (btnEnvio && currentUserRole !== 'MONITOR') btnEnvio.style.display = 'flex';
    else if (btnEnvio) btnEnvio.style.display = 'none';
    
    // Mostra botão do Painel Admin apenas para ADMIN
    if (btnAdmin) {
      if (currentUserRole === 'ADMIN') {
        btnAdmin.style.display = 'flex';
        btnAdmin.onclick = function(e) {
          e.preventDefault();
          if (typeof abrirModalAdmin === 'function') abrirModalAdmin();
        };
      } else {
        btnAdmin.style.display = 'none';
      }
    }
    
    ajustarCardsPorPerfil(currentUserRole);
    
    if (main) main.style.display = 'none';
    if (insp) insp.style.display = 'flex';
    
    showWelcomeToast(userData.apelido);
    
    // Inicia timer de inatividade
    resetInactivityTimer();
    setupInactivityListeners();
    
    if (typeof verificarNotificacoesAoIniciar === 'function') {
      verificarNotificacoesAoIniciar();
    }
    
    if (logoutBtn) logoutBtn.innerHTML = `Sair<small>${userData.apelido}</small>`;
    
    return true;
  } else {
    // Não logado
    removeToken();
    removeUserData();
    if (main) main.style.display = 'flex';
    if (insp) insp.style.display = 'none';
    return false;
  }
}

// ====================================================================
// LOGIN
// ====================================================================
export async function login(apelido, senha) {
  try {
    const response = await api.post(ENDPOINTS.LOGIN, { apelido, senha });
    
    if (response.sucesso) {
      setToken(response.token);
      setUserData({
        nome: response.nome,
        apelido: response.apelido,
        funcao: response.funcao,
      });
      
      // Fecha modal de login
      const modalLogin = document.getElementById('modal-login');
      if (modalLogin) modalLogin.classList.remove('is-open');
      
      await checkLoginStatus();
      return { sucesso: true };
    } else {
      return { sucesso: false, erro: response.erro || 'Credenciais inválidas' };
    }
  } catch (error) {
    console.error('Erro no login:', error);
    return { sucesso: false, erro: error.message || 'Erro de conexão' };
  }
}

// ====================================================================
// LOGOUT
// ====================================================================
export function logoutInspector() {
  // Limpa timer de inatividade
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
  
  // Remove listeners de inatividade
  document.removeEventListener('click', resetInactivityTimer);
  document.removeEventListener('keydown', resetInactivityTimer);
  document.removeEventListener('mousemove', resetInactivityTimer);
  document.removeEventListener('scroll', resetInactivityTimer);
  document.removeEventListener('touchstart', resetInactivityTimer);
  
  removeToken();
  removeUserData();
  checkLoginStatus();
}

// ====================================================================
// CONTROLE DE INATIVIDADE
// ====================================================================
function resetInactivityTimer() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
  }
  
  inactivityTimer = setTimeout(() => {
    const userData = api.getUserData();
    if (userData) {
      alert(`⚠️ Sessão expirada por inatividade.\n\nUsuário: ${userData.apelido}\n\nVocê será deslogado agora.`);
      logoutInspector();
    }
  }, INACTIVITY_TIMEOUT);
}

function setupInactivityListeners() {
  document.addEventListener('click', resetInactivityTimer);
  document.addEventListener('keydown', resetInactivityTimer);
  document.addEventListener('mousemove', resetInactivityTimer);
  document.addEventListener('scroll', resetInactivityTimer);
  document.addEventListener('touchstart', resetInactivityTimer);
}

// ====================================================================
// TOAST DE BOAS-VINDAS
// ====================================================================
function showWelcomeToast(apelido) {
  const toast = document.getElementById('welcome-toast');
  if (!toast) return;
  
  const nameEl = document.getElementById('toast-name');
  if (nameEl) nameEl.textContent = apelido;
  
  toast.classList.add('show');
  setTimeout(() => hideWelcomeToast(), 5000);
  
  const clickHandler = () => { 
    hideWelcomeToast(); 
    document.removeEventListener('click', clickHandler); 
  };
  setTimeout(() => document.addEventListener('click', clickHandler), 300);
}

function hideWelcomeToast() { 
  const t = document.getElementById('welcome-toast'); 
  if (t) t.classList.remove('show'); 
}

// ====================================================================
// AJUSTAR VISIBILIDADE DOS CARDS POR PERFIL
// ====================================================================
function ajustarCardsPorPerfil(role) {
  const todosCards = document.querySelectorAll('#inspector-screen .inspector-card');
  const cardInspecao = document.getElementById('btn-inspecao-veicular');
  const cardEnvio = document.getElementById('btn-envio-informacoes');
  
  const cardRelatorioDiario = document.querySelector('a.inspector-card[href*="docs.google.com/forms/d/e/1FAIpQLSe82OZRZPC_WTgXqF0N2pAuiFaudKONLYRuSnfnBpLPS0fYpw"]');
  const cardConsultaPlacas = document.querySelector('a.inspector-card[href*="app.powerbi.com/view"]');
  const cardSolicitacaoImagem = document.querySelector('a.inspector-card[href*="forms.office.com/pages/responsepage.aspx?id=BT9x5o7JaUGYVqezBC5ZcbsSouziSbdKtQ1p901JfchUREIxR1pNUzQ0OEJLUTlGNzFRTEZKMTI1OC4u"]');
  
  if (role === 'FISCAL') {
    todosCards.forEach(card => {
      if (card === cardInspecao || card === cardEnvio) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  } else if (role === 'SAF') {
    todosCards.forEach(card => {
      if (card === cardRelatorioDiario || card === cardConsultaPlacas || 
          card === cardSolicitacaoImagem || card === cardEnvio) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  } else {
    todosCards.forEach(card => {
      card.style.display = 'flex';
    });
  }
}

// ====================================================================
// EXPORTAÇÕES
// ====================================================================
export {
  currentUserRole,
  canCreateInspection,
  checkLoginStatus,
  login,
  logoutInspector,
  carregarTimeoutInatividade,
  resetInactivityTimer,
  setupInactivityListeners,
  ajustarCardsPorPerfil,
};
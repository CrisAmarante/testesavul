/**
 * Autenticação e Controle de Acesso
 * Gerencia login, logout, permissões e ajustes de UI por perfil
 */

// ====================================================================
// VARIÁVEIS DE AUTENTICAÇÃO E PERMISSÕES
// ====================================================================
const ROLES_ALLOWED_INSPECTION = ['INSPETOR', 'ENCARREGADO', 'ADMIN', 'GERENTE', 'FISCAL', 'PLANTONISTA'];
let currentUserRole = '';
let canCreateInspection = false;
let inactivityTimer = null;
let INACTIVITY_TIMEOUT = 20 * 60 * 1000; // 20 minutos padrão (pode ser atualizado pelo admin)

// ====================================================================
// CARREGAR TIMEOUT DO BACKEND
// ====================================================================
function carregarTimeoutInatividade() {
  return new Promise((resolve) => {
    // JSONP com partida adiada: nunca bloqueia o handler que o disparou e
    // falha em silêncio se a rede/extensão bloquear a requisição.
    criarRequestJSONP(URL_PLANILHA, { acao: 'admin_get_config' }, {
      callbackPrefix: 'configTimeoutCallback',
      timeout: 10000,
      onSuccess: function (data) {
        if (data && data.sucesso && data.dados && data.dados.timeout) {
          INACTIVITY_TIMEOUT = data.dados.timeout;
          console.log(`✅ Timeout de inatividade carregado: ${INACTIVITY_TIMEOUT / 60000} minutos`);
        }
        resolve();
      },
      onError: function () {
        // Erro esperado em ambientes sem backend configurado - usa valor padrão
        resolve();
      }
    });
  });
}

// ====================================================================
// VERIFICAR STATUS DE LOGIN
// ====================================================================
async function checkLoginStatus() {
  const logado = localStorage.getItem('inspectorLoggedIn');
  const nome = localStorage.getItem('inspectorName');
  const apelido = localStorage.getItem('inspectorApelido');
  const roleSalva = localStorage.getItem('inspectorRole');
  const main = getEl('main-screen');
  const insp = getEl('inspector-screen');
  const btnInspecao = getEl('btn-inspecao-veicular');
  const btnEnvio = getEl('btn-envio-informacoes');
  
  if (logado === 'true' && nome && apelido) {
    let role = roleSalva;
    
    // Atualiza papel se necessário
    if (INSPETORES[apelido]) {
      const roleFromServer = INSPETORES[apelido].funcao;
      if (roleFromServer !== role) {
        role = roleFromServer;
        localStorage.setItem('inspectorRole', role);
      }
    }
    
    if (!role) {
      logoutInspector();
      return;
    }
    
    currentUserRole = role;
    // Regra de criação: FISCAL, INSPETOR e ADMIN podem criar inspeções e tacógrafos
    canCreateInspection = (role === 'FISCAL' || role === 'INSPETOR' || role === 'ADMIN');
    
    // Mostra/oculta cards especiais
    if (btnInspecao && role !== 'MONITOR') btnInspecao.style.display = 'flex';
    else if (btnInspecao) btnInspecao.style.display = 'none';
    
    if (btnEnvio && role !== 'MONITOR') btnEnvio.style.display = 'flex';
    else if (btnEnvio) btnEnvio.style.display = 'none';
    
    // Mostra botão do Painel Admin apenas para ADMIN
    const btnAdmin = getEl('btn-painel-admin');
    if (btnAdmin) {
      if (role === 'ADMIN') {
        btnAdmin.style.display = 'flex';
        btnAdmin.onclick = function(e) {
          e.preventDefault();
          abrirModalAdmin();
        };
      } else {
        btnAdmin.style.display = 'none';
      }
    }
    
    ajustarCardsPorPerfil(role);
    
    main.style.display = 'none';
    insp.style.display = 'flex';
    showWelcomeToast(apelido);
    
    // Inicia timer de inatividade
    resetInactivityTimer();
    setupInactivityListeners();
    
    if (typeof verificarNotificacoesAoIniciar === 'function') {
      verificarNotificacoesAoIniciar();
    }
    
    const logoutBtn = insp.querySelector('.logout-btn');
    if (logoutBtn) logoutBtn.innerHTML = `Sair<small>${apelido}</small>`;
    
  } else {
    localStorage.removeItem('inspectorLoggedIn');
    localStorage.removeItem('inspectorName');
    localStorage.removeItem('inspectorApelido');
    localStorage.removeItem('inspectorRole');
    main.style.display = 'flex';
    insp.style.display = 'none';
  }
}

// ====================================================================
// LOGIN
// ====================================================================
async function login(e) {
  e.preventDefault();
  const senha = getEl('password').value.trim();
  const errorMsg = getEl('login-error');
  const btnSubmit = e.target.querySelector('button[type="submit"]');
  
  const textoOriginal = btnSubmit.innerHTML;
  btnSubmit.innerHTML = 'Verificando...';
  btnSubmit.disabled = true;
  errorMsg.style.display = 'none';

  // Restaura o botão e exibe mensagens SEM alert(): o alert bloqueava a thread
  // enquanto o navegador ainda tratava o erro da requisição, gerando
  // "[Violation] 'error' handler took 2001ms".
  const restaurar = function () {
    btnSubmit.innerHTML = textoOriginal;
    btnSubmit.disabled = false;
  };

  criarRequestJSONP(URL_PLANILHA, { acao: 'login', senha: senha }, {
    callbackPrefix: 'loginCallback',
    timeout: 20000,
    onSuccess: function (resposta) {
      restaurar();

      if (resposta && resposta.sucesso) {
        localStorage.setItem('inspectorLoggedIn', 'true');
        localStorage.setItem('inspectorName', resposta.nome);
        localStorage.setItem('inspectorApelido', resposta.apelido);
        localStorage.setItem('inspectorRole', resposta.funcao);

        // Limpa o campo de senha após login bem-sucedido
        getEl('password').value = '';

        refreshInspetores().then(() => registrarLog(resposta.apelido)).catch(() => {});

        window.modals.login.close();
        checkLoginStatus();
      } else {
        errorMsg.textContent = (resposta && resposta.erro) || 'Senha incorreta. Tente novamente.';
        errorMsg.style.display = 'block';
        getEl('password').value = '';
        getEl('password').focus();
      }
    },
    onError: function () {
      restaurar();
      errorMsg.textContent = 'Erro de conexão. Verifique sua internet e tente novamente.';
      errorMsg.style.display = 'block';
      mostrarToast('Sem conexão com o servidor. Tente novamente.', 'erro');
    }
  });
}

// ====================================================================
// LOGOUT
// ====================================================================
function logoutInspector() {
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
  
  localStorage.removeItem('inspectorLoggedIn');
  localStorage.removeItem('inspectorName');
  localStorage.removeItem('inspectorApelido');
  localStorage.removeItem('inspectorRole');
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
    const apelido = localStorage.getItem('inspectorApelido');
    if (apelido) {
      // Toast em vez de alert(): não bloqueia a thread nem gera violação de handler
      logoutInspector();
      mostrarToast(`Sessão de "${apelido}" expirou por inatividade.`, 'aviso');
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
  const toast = getEl('welcome-toast');
  if (!toast) return;
  
  getEl('toast-name').textContent = apelido;
  toast.classList.add('show');
  setTimeout(() => hideWelcomeToast(), 5000); // 5 segundos
  
  const clickHandler = () => { 
    hideWelcomeToast(); 
    document.removeEventListener('click', clickHandler); 
  };
  setTimeout(() => document.addEventListener('click', clickHandler), 300);
}

function hideWelcomeToast() { 
  const t = getEl('welcome-toast'); 
  if (t) t.classList.remove('show'); 
}

// ====================================================================
// BANNER DE AVISOS
// ====================================================================
function fecharBanner() { 
  const b = getEl('aviso-temporario'); 
  if (b) b.style.display = 'none'; 
}

function mostrarBannerAviso() {
  const agora = new Date();
  const banner = getEl('aviso-temporario');
  if (banner) {
    banner.style.display = (agora >= DATA_INICIO_BANNER && agora < DATA_FIM_BANNER) ? 'flex' : 'none';
  }
}

function aplicarBloqueioDeDatas() {
  const now = new Date();
  for (const [id, date] of Object.entries(disableDates)) {
    const btn = getEl(id);
    if (btn && now < date) {
      btn.classList.add('disabled');
      btn.setAttribute('href', '#');
      btn.title = `Disponível a partir de ${date.toLocaleDateString('pt-BR')}`;
      btn.style.pointerEvents = 'none';
      btn.style.opacity = '0.45';
    }
  }
}

// ====================================================================
// AJUSTAR VISIBILIDADE DOS CARDS POR PERFIL
// ====================================================================
function ajustarCardsPorPerfil(role) {
  const todosCards = document.querySelectorAll('#inspector-screen .inspector-card');
  const cardInspecao = document.getElementById('btn-inspecao-veicular');
  const cardEnvio = document.getElementById('btn-envio-informacoes');
  const cardTacografo = document.getElementById('btn-tacografo');
  
  const cardRelatorioDiario = document.querySelector('a.inspector-card[href*="docs.google.com/forms/d/e/1FAIpQLSe82OZRZPC_WTgXqF0N2pAuiFaudKONLYRuSnfnBpLPS0fYpw"]');
  const cardConsultaPlacas = document.querySelector('a.inspector-card[href*="app.powerbi.com/view"]');
  const cardSolicitacaoImagem = document.querySelector('a.inspector-card[href*="forms.office.com/pages/responsepage.aspx?id=BT9x5o7JaUGYVqezBC5ZcbsSouziSbdKtQ1p901JfchUREIxR1pNUzQ0OEJLUTlGNzFRTEZKMTI1OC4u"]');
  
  if (role === 'FISCAL') {
    todosCards.forEach(card => {
      if (card === cardInspecao || card === cardEnvio || card === cardTacografo) {
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

// Exportar para escopo global
window.currentUserRole = currentUserRole;
window.canCreateInspection = canCreateInspection;
window.checkLoginStatus = checkLoginStatus;
window.login = login;
window.logoutInspector = logoutInspector;
window.ajustarCardsPorPerfil = ajustarCardsPorPerfil;
window.mostrarBannerAviso = mostrarBannerAviso;
window.aplicarBloqueioDeDatas = aplicarBloqueioDeDatas;
window.resetInactivityTimer = resetInactivityTimer;
window.setupInactivityListeners = setupInactivityListeners;
window.carregarTimeoutInatividade = carregarTimeoutInatividade;

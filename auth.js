// ====================================================================
// auth.js - Autenticação, sessão, permissões de usuário e avisos personalizados
// ====================================================================

// ====================================================================
// Variáveis globais de autenticação e permissões
// ====================================================================
const ROLES_ALLOWED_INSPECTION = ['INSPETOR', 'ENCARREGADO', 'ADMIN', 'GERENTE', 'FISCAL', 'PLANTONISTA'];
let currentUserRole = '';
let canCreateInspection = false;

// ====================================================================
// Mapeamento de permissões por funcionalidade (usado pelo painel admin)
// ====================================================================
const PERMISSOES_OCORRENCIA = {
  podeCriar: ['INSPETOR', 'SAF', 'ENCARREGADO', 'ADMIN', 'GERENTE'],
  podeConsultar: ['ENCARREGADO', 'GERENTE', 'SAF', 'ADMIN', 'INSPETOR'],
  podeAtribuir: ['ENCARREGADO', 'SAF', 'ADMIN', 'GERENTE']
};

// ====================================================================
// Verifica se o usuário está logado e restaura a sessão a partir do localStorage
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
    
    // Atualiza o papel a partir do servidor se disponível (INSPETORES carregado via api.js)
    if (window.INSPETORES && INSPETORES[apelido]) {
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
    canCreateInspection = (role === 'FISCAL' || role === 'INSPETOR' || role === 'ENCARREGADO' || role === 'ADMIN' || role === 'GERENTE' || role === 'PLANTONISTA');
    
    // Exibir/ocultar botões conforme perfil (inspeção e envio)
    if (btnInspecao) btnInspecao.style.display = (role !== 'MONITOR' && (role === 'FISCAL' || role === 'INSPETOR' || role === 'ENCARREGADO' || role === 'ADMIN' || role === 'GERENTE' || role === 'PLANTONISTA')) ? 'flex' : 'none';
    if (btnEnvio) btnEnvio.style.display = (role !== 'MONITOR' && role !== 'FISCAL') ? 'flex' : 'none';
    
    // Ajusta os cards da área logada (chama função definida em main.js)
    if (typeof ajustarCardsPorPerfil === 'function') ajustarCardsPorPerfil(role);
    
    if (main) main.style.display = 'none';
    if (insp) insp.style.display = 'flex';
    
    showWelcomeToast(apelido);
    const logoutBtn = insp ? insp.querySelector('.logout-btn') : null;
    if (logoutBtn) logoutBtn.innerHTML = `Sair<small>${apelido}</small>`;
    
    // Carrega avisos personalizados (admin.js) para a área logada
    if (typeof carregarAvisosPublicos === 'function') {
      carregarAvisosPublicos();
    }
    
  } else {
    // Usuário não logado: limpa sessão e mostra tela principal
    localStorage.removeItem('inspectorLoggedIn');
    localStorage.removeItem('inspectorName');
    localStorage.removeItem('inspectorApelido');
    localStorage.removeItem('inspectorRole');
    if (main) main.style.display = 'flex';
    if (insp) insp.style.display = 'none';
  }
}

// ====================================================================
// Função de login chamada pelo formulário – valida PIN via Google Apps Script
// ====================================================================
async function login(e) {
  e.preventDefault();
  const senha = getEl('password').value.trim();
  const errorMsg = getEl('login-error');
  const btnSubmit = e.target.querySelector('button[type="submit"]');
  
  const textoOriginal = btnSubmit.innerHTML;
  btnSubmit.innerHTML = 'Verificando...';
  btnSubmit.disabled = true;
  if (errorMsg) errorMsg.style.display = 'none';

  const callbackName = 'loginCallback_' + Date.now();
  
  window[callbackName] = async function(resposta) {
    delete window[callbackName];
    btnSubmit.innerHTML = textoOriginal;
    btnSubmit.disabled = false;

    if (resposta && resposta.sucesso) {
      localStorage.setItem('inspectorLoggedIn', 'true');
      localStorage.setItem('inspectorName', resposta.nome);
      localStorage.setItem('inspectorApelido', resposta.apelido);
      localStorage.setItem('inspectorRole', resposta.funcao);
      
      // Garante que a lista de inspetores esteja atualizada (api.js)
      if (typeof refreshInspetores === 'function') await refreshInspetores();
      
      registrarLog(resposta.apelido);
      window.modals.login.close();
      checkLoginStatus();
    } else {
      if (errorMsg) errorMsg.style.display = 'block';
      const pwdField = getEl('password');
      if (pwdField) {
        pwdField.value = '';
        pwdField.focus();
      }
    }
  };

  const script = document.createElement('script');
  script.src = `${URL_PLANILHA}?acao=login&senha=${encodeURIComponent(senha)}&callback=${callbackName}`;
  script.onerror = () => {
    delete window[callbackName];
    btnSubmit.innerHTML = textoOriginal;
    btnSubmit.disabled = false;
    alert('Erro de conexão. Verifique sua internet.');
  };
  document.body.appendChild(script);
}

// ====================================================================
// Logout do inspetor – limpa sessão e recarrega a tela inicial
// ====================================================================
function logoutInspector() {
  localStorage.removeItem('inspectorLoggedIn');
  localStorage.removeItem('inspectorName');
  localStorage.removeItem('inspectorApelido');
  localStorage.removeItem('inspectorRole');
  checkLoginStatus();
}

// ====================================================================
// Exibe toast de boas-vindas com o apelido do usuário logado
// ====================================================================
function showWelcomeToast(apelido) {
  const toast = getEl('welcome-toast');
  if (!toast) return;
  const nameSpan = getEl('toast-name');
  if (nameSpan) nameSpan.textContent = apelido;
  toast.classList.add('show');
  setTimeout(() => hideWelcomeToast(), 3500);
  const clickHandler = () => { hideWelcomeToast(); document.removeEventListener('click', clickHandler); };
  setTimeout(() => document.addEventListener('click', clickHandler), 300);
}

function hideWelcomeToast() {
  const t = getEl('welcome-toast');
  if (t) t.classList.remove('show');
}

// ====================================================================
// Bloqueia botões de modais que possuem data de liberação futura
// ====================================================================
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
// Fecha o banner de aviso temporário (quando clicado no X)
// ====================================================================
function fecharBanner() {
  const b = getEl('aviso-temporario');
  if (b) b.style.display = 'none';
}

// ====================================================================
// Mostra banner de aviso apenas dentro do período definido (DATA_INICIO_BANNER até DATA_FIM_BANNER)
// ====================================================================
function mostrarBannerAviso() {
  const agora = new Date();
  const banner = getEl('aviso-temporario');
  if (banner) {
    banner.style.display = (agora >= DATA_INICIO_BANNER && agora < DATA_FIM_BANNER) ? 'flex' : 'none';
  }
}

// ====================================================================
// Ajusta a visibilidade dos cards na tela do inspetor baseado no perfil (chamada após login)
// ====================================================================
function ajustarCardsPorPerfil(role) {
  const todosCards = document.querySelectorAll('#inspector-screen .inspector-card');
  const cardInspecao = document.getElementById('btn-inspecao-veicular');
  const cardEnvio = document.getElementById('btn-envio-informacoes');
  
  if (role === 'FISCAL') {
    todosCards.forEach(card => {
      if (card === cardInspecao) {
        card.style.display = 'flex';
      } else if (card === cardEnvio) {
        card.style.display = 'none';
      } else {
        card.style.display = 'none';
      }
    });
  } else {
    // Demais perfis – todos os cards ficam visíveis, mas as permissões específicas são aplicadas em aplicarPermissoesPorPerfil()
    todosCards.forEach(card => {
      card.style.display = 'flex';
    });
  }
}

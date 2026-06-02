// ====================================================================
// main.js - PENSO Relatório de Acidentes
// Configurações gerais, inicialização, modais, tema, eventos principais
// ====================================================================

// ====================================================================
// CONFIGURAÇÕES GLOBAIS
// ====================================================================
const DATA_INICIO_BANNER = new Date('2026-07-10T00:00:00');
const DATA_FIM_BANNER    = new Date('2026-07-21T00:01:00');

// NOTA: A variável currentUserRole é definida em auth.js (global window.currentUserRole)

// ====================================================================
// INICIALIZAÇÃO DOS MODAIS (apenas login)
// ====================================================================
function initModals() {
  window.modals = {
    login: new ModalController('modal-login')
  };
}

// ====================================================================
// EVENTOS PRINCIPAIS
// ====================================================================
function initEventListeners() {
  // Botão de abrir login (segunda tela)
  const btnLogin = getEl('btn-segunda-tela');
  if (btnLogin) {
    btnLogin.addEventListener('click', (e) => {
      e.preventDefault();
      getEl('login-error').style.display = 'none';
      getEl('senha').value = '';
      window.modals.login.open();
    });
  }

  // Formulário de login
  const loginForm = getEl('login-form');
  if (loginForm) {
    loginForm.removeEventListener('submit', login);
    loginForm.addEventListener('submit', login);
  }

  // Botão fechar banner
  const btnFecharBanner = getEl('btn-fechar-banner');
  if (btnFecharBanner) btnFecharBanner.addEventListener('click', fecharBanner);

  // Botão principal: Relatório de Acidentes
  const btnAcidente = getEl('btn-envio-informacoes');
  if (btnAcidente) {
    btnAcidente.addEventListener('click', (e) => {
      e.preventDefault();
      abrirModalEnvio(); // função definida em acidente.js
    });
  }
}

// ====================================================================
// TEMA (CLARO/ESCURO)
// ====================================================================
function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark");
    const toggle = getEl('theme-toggle');
    if (toggle) toggle.innerHTML = "☀️";
  } else {
    document.body.classList.remove("dark");
    const toggle = getEl('theme-toggle');
    if (toggle) toggle.innerHTML = "🌙";
  }
}

function initTheme() {
  const tt = getEl('theme-toggle');
  if (!tt) return;
  const saved = localStorage.getItem("theme") || "light";
  applyTheme(saved);
  tt.addEventListener("click", () => {
    const cur = localStorage.getItem("theme") === "dark" ? "light" : "dark";
    localStorage.setItem("theme", cur);
    applyTheme(cur);
  });
}

// ====================================================================
// SERVICE WORKER
// ====================================================================
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(r => console.log('SW registrado:', r.scope))
      .catch(e => console.error('Falha no SW:', e));
  }
}

// ====================================================================
// BANNER TEMPORÁRIO
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

// ====================================================================
// INICIALIZAÇÃO PRINCIPAL
// ====================================================================
async function inicializar() {
  initModals();
  initEventListeners();
  initTheme();
  registerServiceWorker();

  // Carrega os dados dos inspetores (necessário para validar login)
  // NOTA: refreshInspetores foi removido porque não existe mais no api.js
  // Se você ainda usa INSPETORES em algum lugar, comente ou remova esta linha.
  // await refreshInspetores();

  // Verifica se já existe usuário logado
  checkLoginStatus();

  // Mostra banner se aplicável
  mostrarBannerAviso();

  // Carregamento de terminais removido (não utilizado no novo sistema)
  // Se precisar deles, descomente as linhas abaixo:
  // await carregarTerminais().then(() => preencherSelectTerminais());

  // Eventos de retorno à página (pageshow / visibilitychange) recarregam estado
  window.addEventListener('pageshow', async (e) => {
    if (e.persisted) {
      checkLoginStatus();
      // Se houver necessidade de recarregar terminais, descomente:
      // await carregarTerminais(true);
      // preencherSelectTerminais();
    }
  });

  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
      checkLoginStatus();
      // await carregarTerminais(true);
      // preencherSelectTerminais();
    }
  });
}

// Inicializa quando o DOM estiver pronto
window.addEventListener('DOMContentLoaded', inicializar);

// ====================================================================
// FUNÇÕES AUXILIARES EXPORTADAS (caso necessário para outros módulos)
// ====================================================================
window.fecharBanner = fecharBanner;

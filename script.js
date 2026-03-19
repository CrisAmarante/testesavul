
// ====================================================================
// CONFIGURAÇÕES GERAIS
// ====================================================================
const URL_PLANILHA = "https://script.google.com/macros/s/AKfycbwOdmBDWJPVRkepk05SZ7JDSYSCzW8kW6Hb8YTjLWQDp-vykS7bd5-_e_thkwpcbVFL/exec";

let INSPETORES = {};

// Datas de bloqueio de botões
const DISABLE_DATES = {
  'btn-osasco': new Date('2026-02-19'),
  'btn-santana': new Date('2026-02-03')
};

// Período do banner
const DATA_INICIO_BANNER = new Date('2026-03-10T00:00:00');
const DATA_FIM_BANNER    = new Date('2026-03-21T00:01:00');

// ====================================================================
// UTILITÁRIOS
// ====================================================================
function logDebug(...args) {
  // Facilita desligar logs depois
  console.log('[PENSO]', ...args);
}

function getEl(id) {
  return document.getElementById(id);
}

// ====================================================================
// CONTROLE DE MODAIS (UX + ACESSIBILIDADE)
// ====================================================================
class ModalController {
  constructor(modalId) {
    this.modal = getEl(modalId);
    if (!this.modal) {
      console.warn(`Modal com id "${modalId}" não encontrado.`);
      return;
    }

    this.content = this.modal.querySelector('.modal-content');
    this.isOpen = false;

    this.handleBackgroundClick = this.handleBackgroundClick.bind(this);
    this.handleEsc = this.handleEsc.bind(this);
  }

  open() {
    if (!this.modal || this.isOpen) return;

    this.modal.classList.add('is-open');
    document.body.classList.add('no-scroll');
    this.isOpen = true;

    this.modal.addEventListener('click', this.handleBackgroundClick);
    document.addEventListener('keydown', this.handleEsc);

    // Foco no primeiro input ou botão
    const firstFocusable = this.modal.querySelector('input, button, select, textarea');
    if (firstFocusable) {
      firstFocusable.focus();
    }

    logDebug(`Modal "${this.modal.id}" aberto.`);
  }

  close() {
    if (!this.modal || !this.isOpen) return;

    this.modal.classList.add('is-closing');

    // Tempo deve bater com a animação no CSS
    setTimeout(() => {
      this.modal.classList.remove('is-open', 'is-closing');
      document.body.classList.remove('no-scroll');
      this.isOpen = false;

      this.modal.removeEventListener('click', this.handleBackgroundClick);
      document.removeEventListener('keydown', this.handleEsc);

      logDebug(`Modal "${this.modal.id}" fechado.`);
    }, 200);
  }

  handleBackgroundClick(e) {
    if (e.target === this.modal) {
      this.close();
    }
  }

  handleEsc(e) {
    if (e.key === 'Escape') {
      this.close();
    }
  }
}

// ====================================================================
// LOG DE ACESSO (POST → Apps Script)
// ====================================================================
async function registrarLog(nomeApelido) {
  try {
    const formData = new URLSearchParams();
    formData.append("nome", nomeApelido);
    formData.append("acao", "Login bem-sucedido");

    await fetch(URL_PLANILHA, {
      method: "POST",
      body: formData,
      mode: "no-cors"
    });

    logDebug("Log de acesso enviado para:", nomeApelido);
  } catch (err) {
    console.warn("Não foi possível registrar o log:", err);
  }
}

// ====================================================================
// CARREGAMENTO DA LISTA DE INSPETORES (JSONP)
// ====================================================================
function processarDadosPlanilha(dados) {
  INSPETORES = dados || {};
  logDebug("Lista de inspetores carregada com sucesso.");
}

function carregarInspetores() {
  const script = document.createElement('script');
  script.src = `${URL_PLANILHA}?callback=processarDadosPlanilha`;
  document.body.appendChild(script);
}

// ====================================================================
// LOGIN / LOGOUT
// ====================================================================
function checkLoginStatus() {
  const logado = localStorage.getItem('inspectorLoggedIn');
  const nomeInspetor = localStorage.getItem('inspectorName');

  const mainScreen = getEl('main-screen');
  const inspectorScreen = getEl('inspector-screen');
  const welcomeMsg = getEl('welcome-msg');

  if (!mainScreen || !inspectorScreen) return;

  if (logado === 'true' && nomeInspetor) {
    mainScreen.style.display = 'none';
    inspectorScreen.style.display = 'flex';

    if (welcomeMsg) {
      welcomeMsg.innerText = `Bem-vindo, Inspetor ${nomeInspetor}!`;
    }
  } else {
    mainScreen.style.display = 'flex';
    inspectorScreen.style.display = 'none';
  }
}

function login(e) {
  e.preventDefault();

  const senhaInput = getEl('password');
  const errorMsg = getEl('login-error');

  if (!senhaInput) return;

  const senhaDigitada = senhaInput.value.trim();

  const nomeEncontrado = Object.keys(INSPETORES).find(
    nome => INSPETORES[nome] === senhaDigitada
  );

  if (nomeEncontrado) {
    localStorage.setItem('inspectorLoggedIn', 'true');
    localStorage.setItem('inspectorName', nomeEncontrado);

    registrarLog(nomeEncontrado);

    if (window.modals && window.modals.login) {
      window.modals.login.close();
    }

    checkLoginStatus();
  } else {
    if (errorMsg) {
      errorMsg.style.display = 'block';
    }
    senhaInput.value = '';
    senhaInput.focus();
  }
}

function logoutInspector() {
  localStorage.removeItem('inspectorLoggedIn');
  localStorage.removeItem('inspectorName');
  checkLoginStatus();
}

// ====================================================================
// BLOQUEIO DE BOTÕES POR DATA
// ====================================================================
function aplicarBloqueioDeDatas() {
  const now = new Date();

  Object.entries(DISABLE_DATES).forEach(([id, date]) => {
    const btn = getEl(id);
    if (!btn) return;

    if (now < date) {
      btn.classList.add('disabled');
      btn.setAttribute('href', '#');
      btn.setAttribute('aria-disabled', 'true');
      btn.title = 'Disponível a partir de ' + date.toLocaleDateString('pt-BR');
    }
  });
}

// ====================================================================
// BANNER TEMPORÁRIO
// ====================================================================
function fecharBanner() {
  const banner = getEl('aviso-temporario');
  if (banner) {
    banner.style.display = 'none';
    logDebug("Banner fechado pelo botão.");
  }
}

function mostrarBannerAviso() {
  const agora = new Date();
  const banner = getEl('aviso-temporario');

  if (!banner) {
    console.warn("Elemento #aviso-temporario não encontrado");
    return;
  }

  logDebug("Verificando banner:", agora.toLocaleString('pt-BR'));

  if (agora >= DATA_INICIO_BANNER && agora < DATA_FIM_BANNER) {
    logDebug("→ Banner deve aparecer");
    banner.style.display = 'flex';

    setTimeout(() => {
      if (banner.style.display !== 'none') {
        banner.style.display = 'none';
        logDebug("Banner fechado automaticamente após 3s");
      }
    }, 3000);
  } else {
    logDebug("→ Banner fora do período → escondido");
    banner.style.display = 'none';
  }
}

// ====================================================================
// INICIALIZAÇÃO GERAL
// ====================================================================
function initModals() {
  window.modals = {
    login: new ModalController('modal-login'),
    clandestinosRto: new ModalController('modal-clandestinos-rto'),
    levantamentos: new ModalController('modal-levantamentos'),
    inspecoes5s: new ModalController('modal-inspecoes-5s')
  };
}

function initEventListeners() {
  // Botão que abre o modal de login
  const btnSegundaTela = getEl('btn-segunda-tela');
  if (btnSegundaTela && window.modals?.login) {
    btnSegundaTela.addEventListener('click', (e) => {
      e.preventDefault();
      const errorMsg = getEl('login-error');
      const senhaInput = getEl('password');

      if (errorMsg) errorMsg.style.display = 'none';
      if (senhaInput) {
        senhaInput.value = '';
      }

      window.modals.login.open();
    });
  }

  // Formulário de login
  const loginForm = getEl('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', login);
  }

  // Modais específicos
  const btnClandestinos = getEl('btn-clandestinos-rto');
  if (btnClandestinos && window.modals?.clandestinosRto) {
    btnClandestinos.addEventListener('click', (e) => {
      e.preventDefault();
      window.modals.clandestinosRto.open();
    });
  }

  const btnLevantamentos = getEl('btn-levantamentos');
  if (btnLevantamentos && window.modals?.levantamentos) {
    btnLevantamentos.addEventListener('click', (e) => {
      e.preventDefault();
      window.modals.levantamentos.open();
    });
  }

  const btnInspecoes5s = getEl('btn-inspecoes-5s');
  if (btnInspecoes5s && window.modals?.inspecoes5s) {
    btnInspecoes5s.addEventListener('click', (e) => {
      e.preventDefault();
      window.modals.inspecoes5s.open();
    });
  }

  // Fechar banner (se tiver botão de fechar)
  const btnFecharBanner = getEl('btn-fechar-banner');
  if (btnFecharBanner) {
    btnFecharBanner.addEventListener('click', (e) => {
      e.preventDefault();
      fecharBanner();
    });
  }
}

window.addEventListener('load', () => {
  initModals();
  initEventListeners();

  carregarInspetores();
  checkLoginStatus();
  aplicarBloqueioDeDatas();
  mostrarBannerAviso();
});
// ============================================================
// TEMA ESCURO / CLARO
// ============================================================
const themeToggle = document.getElementById("theme-toggle");

function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️";
  } else {
    document.body.classList.remove("dark");
    themeToggle.textContent = "🌙";
  }
}

themeToggle.addEventListener("click", () => {
  const current = localStorage.getItem("theme") === "dark" ? "light" : "dark";
  localStorage.setItem("theme", current);
  applyTheme(current);
});

// Carrega tema salvo
applyTheme(localStorage.getItem("theme") || "light");

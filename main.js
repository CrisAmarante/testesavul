// ====================================================================
// main.js - Inicialização e eventos globais da PWA PENSO
// ====================================================================

// ====================================================================
// Configurações gerais (banner, datas bloqueadas)
// ====================================================================
const DATA_INICIO_BANNER = new Date('2026-07-10T00:00:00');
const DATA_FIM_BANNER    = new Date('2026-07-21T00:01:00');

const disableDates = {
  'btn-osasco': new Date('2026-07-19'),
  'btn-santana': new Date('2026-07-03')
};

// ====================================================================
// Inicialização dos modais (login, clandestinos, levantamentos, 5S, inspeção veicular, ocorrência)
// ====================================================================
function initModals() {
  window.modals = {
    login: new ModalController('modal-login'),
    clandestinosRto: new ModalController('modal-clandestinos-rto'),
    levantamentos: new ModalController('modal-levantamentos'),
    inspecoes5s: new ModalController('modal-inspecoes-5s')
  };
  window.modals.inspecaoVeicular = new InspecaoVeicular();
  window.modals.ocorrencia = { open: abrirModalOcorrencia, close: fecharModalOcorrencia };
}

// ====================================================================
// Configuração de eventos globais (cliques nos botões, formulários, etc.)
// ====================================================================
function initEventListeners() {
  // Botão de login (segunda tela)
  getEl('btn-segunda-tela')?.addEventListener('click', (e) => {
    e.preventDefault();
    const errorMsg = getEl('login-error');
    if (errorMsg) errorMsg.style.display = 'none';
    const passwordField = getEl('password');
    if (passwordField) passwordField.value = '';
    window.modals.login.open();
  });

  // Formulário de login
  const loginForm = getEl('login-form');
  if (loginForm) {
    loginForm.removeEventListener('submit', login);
    loginForm.addEventListener('submit', login);
  }

  // Botões dos modais existentes
  getEl('btn-clandestinos-rto')?.addEventListener('click', (e) => { e.preventDefault(); window.modals.clandestinosRto.open(); });
  getEl('btn-levantamentos')?.addEventListener('click', (e) => { e.preventDefault(); window.modals.levantamentos.open(); });
  getEl('btn-inspecoes-5s')?.addEventListener('click', (e) => { e.preventDefault(); window.modals.inspecoes5s.open(); });
  getEl('btn-fechar-banner')?.addEventListener('click', fecharBanner);

  // Botões do módulo de envio
  getEl('btn-envio-informacoes')?.addEventListener('click', (e) => { e.preventDefault(); abrirModalEnvio(); });
  getEl('btn-salvar-rascunho')?.addEventListener('click', salvarRascunho);
  getEl('btn-enviar-relatorio')?.addEventListener('click', enviarRelatorio);
  getEl('btn-consultar-envios')?.addEventListener('click', consultarEnvios);

  // Eventos dinâmicos de área/motivo (envio)
  document.querySelectorAll('input[name="areaDestino"]').forEach(radio => radio.addEventListener('change', aplicarRegrasPorArea));
  document.querySelectorAll('input[name="motivo"]').forEach(radio => radio.addEventListener('change', aplicarRegrasPorMotivo));

  // Botão de ocorrência
  getEl('btn-ocorrencia')?.addEventListener('click', (e) => { e.preventDefault(); abrirModalOcorrencia(); });

  // Painel de filtros da lista de envios (criado dinamicamente, mas os eventos são atribuídos na função)
}

// ====================================================================
// Tema (claro/escuro) – persistência em localStorage
// ====================================================================
function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark");
    const toggleBtn = getEl('theme-toggle');
    if (toggleBtn) toggleBtn.innerHTML = "☀️";
  } else {
    document.body.classList.remove("dark");
    const toggleBtn = getEl('theme-toggle');
    if (toggleBtn) toggleBtn.innerHTML = "🌙";
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
// Service Worker – registra para funcionamento offline e cache
// ====================================================================
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(r => console.log('SW registrado:', r.scope))
      .catch(e => console.error('Falha no SW:', e));
  }
}

// ====================================================================
// Inicialização da aplicação (chamada no load)
// ====================================================================
async function inicializar() {
  initModals();
  initEventListeners();
  initTheme();
  registerServiceWorker();
  
  // Verifica estado de login e aplica permissões
  checkLoginStatus();
  
  // Aguarda um pouco para que o perfil esteja disponível e aplica permissões visuais
  setTimeout(() => {
    if (typeof aplicarPermissoesPorPerfil === 'function') aplicarPermissoesPorPerfil();
    if (typeof inicializarAdmin === 'function') inicializarAdmin();
    if (typeof inicializarOcorrencia === 'function') inicializarOcorrencia();
  }, 100);
  
  mostrarBannerAviso();
  aplicarBloqueioDeDatas();
  
  // Carrega terminais para os selects
  carregarTerminais().then(() => preencherSelectTerminais());
  
  // Atualiza interface quando a página for restaurada do cache (ex: navegação back/forward)
  window.addEventListener('pageshow', async (e) => {
    if (e.persisted) {
      checkLoginStatus();
      await carregarTerminais(true);
      preencherSelectTerminais();
    }
  });
  
  // Atualiza quando a aba/página ganhar foco novamente
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
      checkLoginStatus();
      await carregarTerminais(true);
      preencherSelectTerminais();
    }
  });
}

// ====================================================================
// Aplica permissões visuais dos cards na área logada conforme o perfil
// ====================================================================
function aplicarPermissoesPorPerfil() {
  const role = currentUserRole;
  if (!role) return;
  
  // Mapeamento de permissões (pode ser sincronizado com o backend via admin)
  const perfilPermissoes = {
    'FISCAL': ['inspecao', 'consultar_inspecoes'],
    'INSPETOR': ['inspecao', 'envio', 'relatorio_diario', 'consulta_placas', '5s_guaritas', 'solicitacao_imagem', 'ocorrencia_criar', 'consultar_ocorrencias'],
    'ENCARREGADO': ['inspecao', 'envio', 'relatorio_diario', 'consulta_placas', '5s_guaritas', 'solicitacao_imagem', 'ocorrencia_criar', 'ocorrencia_atribuir', 'consultar_ocorrencias'],
    'PLANTONISTA': ['inspecao', 'envio', 'relatorio_diario', 'consulta_placas', '5s_guaritas', 'solicitacao_imagem', 'consultar_ocorrencias'],
    'SAF': ['envio', 'relatorio_diario', 'consulta_placas', 'ocorrencia_criar', 'ocorrencia_atribuir', 'consultar_ocorrencias'],
    'ADMIN': ['inspecao', 'envio', 'relatorio_diario', 'consulta_placas', '5s_guaritas', 'solicitacao_imagem', 'ocorrencia_criar', 'ocorrencia_atribuir', 'consultar_ocorrencias', 'admin_panel'],
    'GERENTE': ['inspecao', 'envio', 'relatorio_diario', 'consulta_placas', '5s_guaritas', 'solicitacao_imagem', 'consultar_ocorrencias', 'admin_panel']
  };
  
  const permissoes = perfilPermissoes[role] || perfilPermissoes['INSPETOR'];
  
  const elementos = {
    'btn-inspecao-veicular': 'inspecao',
    'btn-envio-informacoes': 'envio',
    'btn-relatorio-diario': 'relatorio_diario',
    'btn-consulta-placas': 'consulta_placas',
    'btn-5s-guaritas': '5s_guaritas',
    'btn-solicitacao-imagem': 'solicitacao_imagem',
    'btn-ocorrencia': 'ocorrencia_criar'
  };
  
  for (const [id, func] of Object.entries(elementos)) {
    const el = getEl(id);
    if (el) el.style.display = permissoes.includes(func) ? 'flex' : 'none';
  }
}

// ====================================================================
// Executa após o carregamento da página
// ====================================================================
window.addEventListener('load', inicializar);

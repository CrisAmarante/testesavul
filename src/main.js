/**
 * Módulo Principal de Inicialização
 * Configura modais, event listeners e inicializa a aplicação
 */
import { checkLoginStatus, login, logoutInspector, carregarTimeoutInatividade } from './auth.js';
import { ModalController } from './core/utils.js';
import InspecaoVeicular from './modules/inspecao/inspecao.js';
import { abrirModalEnvio, fecharModalEnvio, carregarRascunho } from './modules/envio/envio-base.js';
import { enviarRelatorio, salvarRascunho } from './modules/envio/envio-actions.js';
import { consultarEnvios, consultarEnviosComFiltro } from './modules/envio/envio-consulta.js';
import { initAdminPanel, abrirModalAdmin } from './admin.js';

// ====================================================================
// CONFIGURAÇÕES GERAIS
// ====================================================================
const DATA_INICIO_BANNER = new Date('2026-06-18T01:00:00');
const DATA_FIM_BANNER    = new Date('2026-06-28T00:01:00');

const disableDates = {
  'btn-santana': new Date('2026-06-19')
};

// ====================================================================
// INICIALIZAÇÃO DE MODAIS
// ====================================================================
function initModals() {
  window.modals = {
    login: new ModalController('modal-login'),
    clandestinosRto: new ModalController('modal-clandestinos-rto'),
    levantamentos: new ModalController('modal-levantamentos'),
    inspecoes5s: new ModalController('modal-inspecoes-5s')
  };
  window.modals.inspecaoVeicular = new InspecaoVeicular();
  
  // Inicializa painel admin
  initAdminPanel();
}

// ====================================================================
// INICIALIZAÇÃO DE EVENT LISTENERS
// ====================================================================
function initEventListeners() {
  document.getElementById('btn-segunda-tela')?.addEventListener('click', (e) => { 
    e.preventDefault(); 
    const errorMsg = document.getElementById('login-error');
    if (errorMsg) errorMsg.style.display = 'none';
    const senhaInput = document.getElementById('password');
    if (senhaInput) senhaInput.value = '';
    window.modals.login.open(); 
  });
  
  const loginForm = document.getElementById('login-form'); 
  if (loginForm) { 
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const senha = document.getElementById('password').value.trim();
      const errorMsg = document.getElementById('login-error');
      const btnSubmit = e.target.querySelector('button[type="submit"]');
      const textoOriginal = btnSubmit.innerHTML;
      btnSubmit.innerHTML = 'Verificando...';
      btnSubmit.disabled = true;
      errorMsg.style.display = 'none';

      const apelido = 'admin'; // Você pode adaptar para ter um campo de apelido
      const result = await login(apelido, senha);
      
      btnSubmit.innerHTML = textoOriginal;
      btnSubmit.disabled = false;
      
      if (!result.sucesso) {
        errorMsg.style.display = 'block';
        document.getElementById('password').value = '';
        document.getElementById('password').focus();
      } else {
        window.modals.login.close();
      }
    });
  }
  
  document.getElementById('btn-clandestinos-rto')?.addEventListener('click', (e) => { 
    e.preventDefault(); 
    window.modals.clandestinosRto.open(); 
  });
  
  document.getElementById('btn-levantamentos')?.addEventListener('click', (e) => { 
    e.preventDefault(); 
    window.modals.levantamentos.open(); 
  });
  
  document.getElementById('btn-inspecoes-5s')?.addEventListener('click', (e) => { 
    e.preventDefault(); 
    window.modals.inspecoes5s.open(); 
  });
  
  document.getElementById('btn-fechar-banner')?.addEventListener('click', fecharBanner);
  document.getElementById('btn-envio-informacoes')?.addEventListener('click', (e) => { 
    e.preventDefault(); 
    abrirModalEnvio(); 
  });
  
  document.getElementById('btn-salvar-rascunho')?.addEventListener('click', salvarRascunho);
  document.getElementById('btn-enviar-relatorio')?.addEventListener('click', enviarRelatorio);
  document.getElementById('btn-consultar-envios')?.addEventListener('click', consultarEnvios);
  
  document.querySelectorAll('input[name="areaDestino"]').forEach(radio => 
    radio.addEventListener('change', () => {
      if (typeof window.aplicarRegrasPorArea === 'function') window.aplicarRegrasPorArea();
    })
  );
  
  document.querySelectorAll('input[name="motivo"]').forEach(radio => 
    radio.addEventListener('change', () => {
      if (typeof window.aplicarRegrasPorMotivo === 'function') window.aplicarRegrasPorMotivo();
    })
  );
}

// ====================================================================
// TEMA (DARK/LIGHT)
// ====================================================================
function applyTheme(theme) { 
  if (theme === "dark") { 
    document.body.classList.add("dark"); 
    document.getElementById('theme-toggle').innerHTML = "☀️"; 
  } else { 
    document.body.classList.remove("dark"); 
    document.getElementById('theme-toggle').innerHTML = "🌙"; 
  } 
}

function initTheme() { 
  const tt = document.getElementById('theme-toggle'); 
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
// BANNER DE AVISOS
// ====================================================================
function fecharBanner() { 
  const b = document.getElementById('aviso-temporario'); 
  if (b) b.style.display = 'none'; 
}

function mostrarBannerAviso() {
  const agora = new Date();
  const banner = document.getElementById('aviso-temporario');
  if (banner) {
    banner.style.display = (agora >= DATA_INICIO_BANNER && agora < DATA_FIM_BANNER) ? 'flex' : 'none';
  }
}

function aplicarBloqueioDeDatas() {
  const now = new Date();
  for (const [id, date] of Object.entries(disableDates)) {
    const btn = document.getElementById(id);
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
// INICIALIZAÇÃO PRINCIPAL
// ====================================================================
async function inicializar() {
  // Carrega timeout de inatividade do backend
  await carregarTimeoutInatividade();
  
  initModals(); 
  initEventListeners(); 
  initTheme(); 
  registerServiceWorker();
  
  await checkLoginStatus();
  
  mostrarBannerAviso(); 
  aplicarBloqueioDeDatas();
  
  window.addEventListener('pageshow', async (e) => { 
    if (e.persisted) { 
      await checkLoginStatus();
    } 
  });
  
  document.addEventListener('visibilitychange', async () => { 
    if (document.visibilityState === 'visible') { 
      await checkLoginStatus();
    } 
  });
}

window.addEventListener('load', inicializar);
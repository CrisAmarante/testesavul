/**
 * Utilitários básicos da aplicação
 */

// ====================================================================
// UTILITÁRIOS DE DOM
// ====================================================================
function getEl(id) { 
  return document.getElementById(id); 
}

function logDebug(...args) { 
  console.log('[PENSO]', ...args); 
}

// ====================================================================
// HASH - Criptografia de senha
// ====================================================================
async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ====================================================================
// MODAL CONTROLLER
// ====================================================================
class ModalController {
  constructor(modalId) {
    this.modal = getEl(modalId);
    if (!this.modal) return;
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
    const firstFocusable = this.modal.querySelector('input, button, a, select, textarea');
    if (firstFocusable) firstFocusable.focus();
  }

  close() {
    if (!this.modal || !this.isOpen) return;
    this.modal.classList.add('is-closing');
    setTimeout(() => {
      this.modal.classList.remove('is-open', 'is-closing');
      document.body.classList.remove('no-scroll');
      this.isOpen = false;
      this.modal.removeEventListener('click', this.handleBackgroundClick);
      document.removeEventListener('keydown', this.handleEsc);
    }, 220);
  }

  handleBackgroundClick(e) { 
    if (e.target === this.modal) this.close(); 
  }

  handleEsc(e) { 
    if (e.key === 'Escape') this.close(); 
  }
}

// ====================================================================
// FORMATAÇÃO DE DATA E HORA
// ====================================================================
function formatarData(data) {
  if (!data) return 'N/I';
  
  if (data instanceof Date) {
    const dia = data.getDate().toString().padStart(2, '0');
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }
  
  if (typeof data === 'string') {
    let dataStr = data.split('T')[0].split(' ')[0];
    if (dataStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      const [ano, mes, dia] = dataStr.split('-');
      return `${dia}/${mes}/${ano}`;
    }
    if (dataStr.match(/^\d{2}\/\d{2}\/\d{4}/)) return dataStr;
  }
  
  const match = String(data).match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) return match[0];
  
  return 'N/I';
}

function formatarHora(hora) {
  if (!hora) return 'N/I';
  
  if (hora instanceof Date) {
    const horas = hora.getHours().toString().padStart(2, '0');
    const minutos = hora.getMinutes().toString().padStart(2, '0');
    return `${horas}:${minutos}`;
  }
  
  if (typeof hora === 'string') {
    if (hora.includes('T')) {
      const match = hora.match(/T(\d{2}):(\d{2})/);
      if (match) return `${match[1]}:${match[2]}`;
    }
    if (hora.match(/^\d{2}:\d{2}/)) return hora;
  }
  
  return 'N/I';
}

// ====================================================================
// LOADING OVERLAY
// ====================================================================
let loadingOverlay = null;
let loadingTimeout = null;

function criarLoadingOverlay() {
  if (document.getElementById('loading-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'loading-overlay';
  overlay.style.cssText = `
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 99999;
    justify-content: center;
    align-items: center;
    backdrop-filter: blur(4px);
  `;
  overlay.innerHTML = `
    <div style="background: var(--modal-bg); padding: 30px 40px; border-radius: 16px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3); min-width: 200px;">
      <div class="spinner" style="margin: 0 auto 15px; width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      <p id="loading-message" style="margin: 0; font-weight: 500; color: var(--text);">Processando...</p>
    </div>
  `;
  document.body.appendChild(overlay);
  // Adicionar keyframes para o spinner se não existirem
  if (!document.getElementById('loading-spinner-style')) {
    const style = document.createElement('style');
    style.id = 'loading-spinner-style';
    style.textContent = `
      @keyframes spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
  }
  loadingOverlay = overlay;
}

function mostrarLoading(mensagem = 'Processando...') {
  if (!loadingOverlay) criarLoadingOverlay();
  const msgEl = document.getElementById('loading-message');
  if (msgEl) msgEl.textContent = mensagem;
  if (loadingOverlay) {
    loadingOverlay.style.display = 'flex';
  }
  // Forçar timeout de segurança (evita loading infinito)
  if (loadingTimeout) clearTimeout(loadingTimeout);
  loadingTimeout = setTimeout(() => {
    ocultarLoading();
  }, 30000); // 30 segundos
}

function ocultarLoading() {
  if (loadingOverlay) {
    loadingOverlay.style.display = 'none';
  }
  if (loadingTimeout) {
    clearTimeout(loadingTimeout);
    loadingTimeout = null;
  }
}

// Exportar para escopo global
window.getEl = getEl;
window.formatarData = formatarData;
window.formatarHora = formatarHora;
window.ModalController = ModalController;
window.hashPassword = hashPassword;
window.logDebug = logDebug;
window.mostrarLoading = mostrarLoading;
window.ocultarLoading = ocultarLoading;

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
// LOADING INDICATOR
// ====================================================================
let loadingTimeout = null;

function mostrarLoading(mensagem = 'Carregando...') {
  // Remove loading existente se houver
  ocultarLoading();
  
  const loadingHtml = `
    <div id="loading-overlay" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999;">
      <div style="background: white; padding: 20px 30px; border-radius: 8px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
        <p style="margin: 0; color: #333; font-size: 14px;">${mensagem}</p>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', loadingHtml);
  
  // Adiciona animação de spin se não existir
  if (!document.getElementById('spin-style')) {
    const style = document.createElement('style');
    style.id = 'spin-style';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
}

function ocultarLoading() {
  const loading = document.getElementById('loading-overlay');
  if (loading) {
    loading.remove();
  }
  if (loadingTimeout) {
    clearTimeout(loadingTimeout);
    loadingTimeout = null;
  }
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
/**
 * Formata uma data para DD/MM/YYYY, corrigindo problemas de fuso horário.
 * - Se for string ISO (YYYY-MM-DD), extrai diretamente.
 * - Se for objeto Date, usa getDate, getMonth, getFullYear (fuso local).
 * - Caso contrário, tenta extrair uma data no formato dd/mm/aaaa.
 */
function formatarData(data) {
  if (!data) return 'N/I';

  // Caso seja string ISO (YYYY-MM-DD)
  if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}/.test(data)) {
    const partes = data.split('-');
    // Pode vir com hora "YYYY-MM-DD HH:mm:ss"
    const dia = partes[2].substring(0, 2);
    return `${dia}/${partes[1]}/${partes[0]}`;
  }

  // Caso seja objeto Date
  if (data instanceof Date) {
    const dia = data.getDate().toString().padStart(2, '0');
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  // Tentar extrair via regex
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

// Exportar para escopo global
window.getEl = getEl;
window.formatarData = formatarData;
window.formatarHora = formatarHora;
window.ModalController = ModalController;
window.hashPassword = hashPassword;
window.logDebug = logDebug;
window.mostrarLoading = mostrarLoading;
window.ocultarLoading = ocultarLoading;

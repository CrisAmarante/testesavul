// ====================================================================
// UTILITÁRIOS BÁSICOS
// ====================================================================
function logDebug(...args) { console.log('[PENSO]', ...args); }

// Cache de elementos DOM para evitar consultas repetidas
const domCache = new Map();
function getEl(id) {
  if (!domCache.has(id)) {
    const el = document.getElementById(id);
    if (el) domCache.set(id, el);
    return el;
  }
  return domCache.get(id);
}

// Limpar cache DOM quando necessário (ex: após navegação)
function clearDomCache() {
  domCache.clear();
}
// ====================================================================
// HASH
// ====================================================================
async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ====================================================================
// MODAL
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
    this.modal.addEventListener('click', this.handleBackgroundClick, { passive: true });
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
  handleBackgroundClick(e) { if (e.target === this.modal) this.close(); }
  handleEsc(e) { if (e.key === 'Escape') this.close(); }
}

// ====================================================================
// UTILITÁRIO DE FORMATAÇÃO DE DATA E HORA
// ====================================================================
const dateCache = new Map();
function formatarData(data) {
  if (!data) return 'N/I';
  const cacheKey = `date_${data}`;
  if (dateCache.has(cacheKey)) return dateCache.get(cacheKey);
  
  let result;
  if (data instanceof Date) {
    const dia = data.getDate().toString().padStart(2, '0');
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const ano = data.getFullYear();
    result = `${dia}/${mes}/${ano}`;
  } else if (typeof data === 'string') {
    let dataStr = data.split('T')[0].split(' ')[0];
    if (dataStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      const [ano, mes, dia] = dataStr.split('-');
      result = `${dia}/${mes}/${ano}`;
    } else if (dataStr.match(/^\d{2}\/\d{2}\/\d{4}/)) {
      result = dataStr;
    } else {
      const match = String(data).match(/(\d{2})\/(\d{2})\/(\d{4})/);
      result = match ? match[0] : 'N/I';
    }
  } else {
    const match = String(data).match(/(\d{2})\/(\d{2})\/(\d{4})/);
    result = match ? match[0] : 'N/I';
  }
  
  dateCache.set(cacheKey, result);
  return result;
}

const timeCache = new Map();
function formatarHora(hora) {
  if (!hora) return 'N/I';
  const cacheKey = `time_${hora}`;
  if (timeCache.has(cacheKey)) return timeCache.get(cacheKey);
  
  let result;
  if (hora instanceof Date) {
    const horas = hora.getHours().toString().padStart(2, '0');
    const minutos = hora.getMinutes().toString().padStart(2, '0');
    result = `${horas}:${minutos}`;
  } else if (typeof hora === 'string') {
    if (hora.includes('T')) {
      const match = hora.match(/T(\d{2}):(\d{2})/);
      result = match ? `${match[1]}:${match[2]}` : 'N/I';
    } else if (hora.match(/^\d{2}:\d{2}/)) {
      result = hora;
    } else {
      result = 'N/I';
    }
  } else {
    result = 'N/I';
  }
  
  timeCache.set(cacheKey, result);
  return result;
}

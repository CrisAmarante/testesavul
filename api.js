// ====================================================================
// API.JS – Apenas funções de rede e terminais (sem INSPETORES)
// ====================================================================

let terminaisCache = [];
let terminaisTimestamp = 0;
const TERMINAIS_CACHE_DURACAO = 30 * 60 * 1000; // 30 minutos
let terminaisPromise = null;
let todosTerminaisCache = [];
let todosTerminaisPromise = null;

// ====================================================================
// LOG (mantido – apenas registra login bem-sucedido)
// ====================================================================
async function registrarLog(nomeApelido) {
  try {
    const formData = new URLSearchParams();
    formData.append("nome", nomeApelido);
    formData.append("acao", "Login bem-sucedido");
    console.log('[Log] Registrando login:', nomeApelido);
    await fetch(URL_PLANILHA, { method: "POST", body: formData, mode: "no-cors" });
    console.log('[Log] Registrado com sucesso');
  } catch (err) { 
    console.warn("[Log ERRO] Falha ao registrar log:", err); 
  }
}
// ====================================================================
// TERMINAIS (apenas SIM) com cache e Promise pooling
// ====================================================================
function carregarTerminais(forceRefresh = false) {
  const agora = Date.now();
  if (!forceRefresh && terminaisCache.length && (agora - terminaisTimestamp < TERMINAIS_CACHE_DURACAO)) {
    return Promise.resolve(terminaisCache);
  }
  if (terminaisPromise) return terminaisPromise;
  
  terminaisPromise = new Promise((resolve) => {
    const callbackName = 'carregarTerminaisCallback_' + Date.now();
    window[callbackName] = function(terminais) {
      terminaisCache = terminais;
      terminaisTimestamp = Date.now();
      delete window[callbackName];
      terminaisPromise = null;
      resolve(terminais);
    };
    const script = document.createElement('script');
    const urlCompleta = `${URL_PLANILHA}?acao=terminais&callback=${callbackName}&_=${Date.now()}`;
    console.log('[Terminais] Carregando:', urlCompleta);
    script.src = urlCompleta;
    script.onerror = () => {
      delete window[callbackName];
      terminaisPromise = null;
      terminaisCache = ['Terminal A', 'Terminal B', 'Terminal C', 'Terminal D'];
      terminaisTimestamp = Date.now();
      console.warn('[Terminais ERRO] Falha ao carregar. URL:', urlCompleta);
      console.warn('[Terminais] Usando fallback padrão');
      resolve(terminaisCache);
    };
    // Timeout para evitar bloqueio
    const timeoutId = setTimeout(() => {
      if (document.body.contains(script)) {
        delete window[callbackName];
        terminaisPromise = null;
        terminaisCache = ['Terminal A', 'Terminal B', 'Terminal C', 'Terminal D'];
        terminaisTimestamp = Date.now();
        document.body.removeChild(script);
        console.warn('[Terminais TIMEOUT] Requisição excedeu 5s. URL:', urlCompleta);
        console.warn('[Terminais] Usando fallback padrão');
        resolve(terminaisCache);
      }
    }, 5000);
    script.onload = () => {
      clearTimeout(timeoutId);
      console.log('[Terminais OK] Carregados com sucesso');
    };
    document.body.appendChild(script);
  });
  return terminaisPromise;
}

// ====================================================================
// TERMINAIS (todos, para local no envio – se ainda usado) com cache
// ====================================================================
function carregarTodosTerminais(forceRefresh = false) {
  if (!forceRefresh && todosTerminaisCache.length) return Promise.resolve(todosTerminaisCache);
  if (todosTerminaisPromise) return todosTerminaisPromise;
  
  todosTerminaisPromise = new Promise((resolve) => {
    const callbackName = 'carregarTodosTerminaisCallback_' + Date.now();
    window[callbackName] = function(terminais) {
      if (timeoutId) clearTimeout(timeoutId);
      todosTerminaisCache = terminais;
      delete window[callbackName];
      todosTerminaisPromise = null;
      resolve(terminais);
    };
    const script = document.createElement('script');
    const urlCompleta = `${URL_PLANILHA}?acao=terminais_todos&callback=${callbackName}&_=${Date.now()}`;
    console.log('[Todos Terminais] Carregando:', urlCompleta);
    script.src = urlCompleta;
    script.onerror = () => {
      delete window[callbackName];
      todosTerminaisPromise = null;
      todosTerminaisCache = ['Terminal A', 'Terminal B', 'Terminal C', 'Terminal D'];
      console.warn('[Todos Terminais ERRO] Falha ao carregar. URL:', urlCompleta);
      console.warn('[Todos Terminais] Usando fallback padrão');
      resolve(todosTerminaisCache);
    };
    // Timeout para evitar bloqueio
    const timeoutId = setTimeout(() => {
      if (document.body.contains(script)) {
        delete window[callbackName];
        todosTerminaisPromise = null;
        todosTerminaisCache = ['Terminal A', 'Terminal B', 'Terminal C', 'Terminal D'];
        document.body.removeChild(script);
        console.warn('[Todos Terminais TIMEOUT] Requisição excedeu 5s. URL:', urlCompleta);
        console.warn('[Todos Terminais] Usando fallback padrão');
        resolve(todosTerminaisCache);
      }
    }, 5000);
    script.onload = () => { if (timeoutId) clearTimeout(timeoutId); console.log('[Todos Terminais OK] Carregados com sucesso'); };
    document.body.appendChild(script);
  });
  return todosTerminaisPromise;
}

function preencherSelectTerminais() {
  const select = getEl('envio-local');
  if (!select) return;
  carregarTerminais().then(terminais => {
    const valorAtual = select.value;
    select.innerHTML = '<option value="">Selecione...</option>';
    terminais.forEach(t => { const opt = document.createElement('option'); opt.value = t; opt.textContent = t; select.appendChild(opt); });
    if (valorAtual && terminais.includes(valorAtual)) select.value = valorAtual;
  });
}

function preencherSelectLocal() {
  const select = getEl('envio-local');
  if (!select) return;
  carregarTodosTerminais().then(terminais => {
    const valorAtual = select.value;
    select.innerHTML = '<option value="">Selecione...</option>';
    terminais.forEach(t => { const opt = document.createElement('option'); opt.value = t; opt.textContent = t; select.appendChild(opt); });
    if (valorAtual && terminais.includes(valorAtual)) select.value = valorAtual;
  });
}

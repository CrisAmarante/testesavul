/**
 * API - Comunicação com backend (Google Apps Script)
 * Gerencia inspetores, terminais e logs
 */

let INSPETORES = {};
let refreshPromise = null;
let terminaisCache = [];
let terminaisTimestamp = 0;
const TERMINAIS_CACHE_DURACAO = 30 * 60 * 1000; // 30 minutos
let terminaisPromise = null;
let todosTerminaisCache = [];
let todosTerminaisPromise = null;

// ====================================================================
// UTILITÁRIO JSONP COM PARTIDA ADIADA E TIMEOUT
// ====================================================================
// Todos os acessos ao Apps Script usam <script src="..."> (JSONP). Se o
// navegador bloquear o recurso (Tracking Prevention / uBlock / CSP), a
// extensão de rede dispara "beforeScriptExecution" e só depois chama o
// onerror — que pode levar SEGUNDOS dentro do handler de clique. Isso gera
// os avisos "[Violation] 'error' handler took 2001ms".
// Para evitar: adicionamos o script ao DOM apenas no próximo tick
// (setTimeout 0) e aplicamos um timeout curto. Assim o handler do evento
// original sempre retorna imediatamente.
const JSONP_TIMEOUT_PADRAO = 15000;

function criarRequestJSONP(baseURL, params, opts = {}) {
  const timeout = opts.timeout || JSONP_TIMEOUT_PADRAO;
  const onSuccess = opts.onSuccess;
  const onError = opts.onError || function () {};
  const callbackName = (opts.callbackPrefix || 'jsonpCallback') + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

  let resolvido = false;
  let timerId = null;
  let script = null;

  const limpar = () => {
    if (timerId) { clearTimeout(timerId); timerId = null; }
    delete window[callbackName];
    if (script && script.parentNode) script.parentNode.removeChild(script);
    script = null;
  };

  const falhar = (motivo) => {
    if (resolvido) return;
    resolvido = true;
    limpar();
    onError(motivo);
  };

  window[callbackName] = function (dados) {
    if (resolvido) return;
    resolvido = true;
    limpar();
    onSuccess(dados);
  };

  const query = new URLSearchParams(params || {});
  query.set('callback', callbackName);
  query.set('_', String(Date.now()));

  const executar = () => {
    if (resolvido) return; // cancelado antes de começar
    try {
      script = document.createElement('script');
    script.async = true;
    script.src = `${baseURL}${baseURL.includes('?') ? '&' : '?'}${query.toString()}`;
      script.onerror = () => falhar('network');
      document.body.appendChild(script);
      timerId = setTimeout(() => falhar('timeout'), timeout);
    } catch (e) {
      // DOM indisponível (raro): trata como falha imediata, sem estourar erro
      falhar('exception');
    }
  };

  // Partida adiada: devolve o controle ao chamador (e ao navegador) antes da rede
  setTimeout(executar, 0);

  return {
    abort: () => { if (!resolvido) { resolvido = true; limpar(); } },
    callbackName
  };
}

// ====================================================================
// LOG DE ATIVIDADES
// ====================================================================
async function registrarLog(nomeApelido) {
  try {
    const formData = new URLSearchParams();
    formData.append("nome", nomeApelido);
    formData.append("acao", "Login bem-sucedido");
    await fetch(URL_PLANILHA, { method: "POST", body: formData, mode: "no-cors" });
  } catch (err) { 
    console.warn("Falha ao registrar log:", err); 
  }
}

// ====================================================================
// CARREGAR INSPETORES
// ====================================================================
function processarDadosPlanilha(dados) {
  if (Array.isArray(dados)) {
    const novoObjeto = {};
    dados.forEach(row => {
      if (row.apelido && row.hash && row.ativo === "SIM") {
        novoObjeto[row.apelido] = { 
          hash: row.hash, 
          nome: row.nome, 
          funcao: row.funcao 
        };
      }
    });
    INSPETORES = novoObjeto;
  } else { 
    INSPETORES = dados || {}; 
  }
}

// Snapshot dos inspetores no localStorage: permite renderizar a tela
// imediatamente na próxima visita, revalidando com o servidor em seguida.
const INSPETORES_CACHE_KEY = 'inspetoresCache';

function salvarSnapshotInspetores() {
  try {
    // Não persiste hashes de senha em texto claro no dispositivo
    const snapshot = {};
    for (const chave in INSPETORES) {
      const u = INSPETORES[chave];
      snapshot[chave] = { nome: u.nome, funcao: u.funcao };
    }
    localStorage.setItem(INSPETORES_CACHE_KEY, JSON.stringify(snapshot));
  } catch (e) { /* armazenamento indisponível - ignora */ }
}

async function refreshInspetores() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = new Promise((resolve, reject) => {
    criarRequestJSONP(URL_PLANILHA, {}, {
      callbackPrefix: 'processarDadosPlanilha',
      onSuccess: function (dados) {
        processarDadosPlanilha(dados);
        salvarSnapshotInspetores();
        refreshPromise = null;
        resolve();
      },
      onError: function () {
        refreshPromise = null;
        // Falha silenciosa: existe snapshot no localStorage e novas tentativas
        // acontecem em "pageshow"/"visibilitychange". Sem alert nem bloqueio.
        reject();
      }
    });
  });

  return refreshPromise;
}

// ====================================================================
// TERMINAIS (apenas SIM) com cache
// ====================================================================
function carregarTerminais(forceRefresh = false) {
  const agora = Date.now();
  
  if (!forceRefresh && terminaisCache.length && (agora - terminaisTimestamp < TERMINAIS_CACHE_DURACAO)) {
    return Promise.resolve(terminaisCache);
  }
  
  if (terminaisPromise) return terminaisPromise;
  
  terminaisPromise = new Promise((resolve) => {
    criarRequestJSONP(URL_PLANILHA, { acao: 'terminais' }, {
      callbackPrefix: 'carregarTerminaisCallback',
      onSuccess: function (terminais) {
        terminaisCache = terminais;
        terminaisTimestamp = Date.now();
        terminaisPromise = null;
        resolve(terminais);
      },
      onError: function () {
        terminaisPromise = null;
        terminaisCache = ['Terminal A', 'Terminal B', 'Terminal C', 'Terminal D'];
        terminaisTimestamp = Date.now();
        resolve(terminaisCache);
      }
    });
  });

  return terminaisPromise;
}

function preencherSelectTerminais() {
  const selects = [getEl('terminal'), getEl('tacografo-terminal')].filter(Boolean);
  if (!selects.length) return;
  
  carregarTerminais().then(terminais => {
    selects.forEach(select => {
      const valorAtual = select.value;
      select.innerHTML = '<option value="">Selecione...</option>';
      terminais.forEach(t => { 
        const opt = document.createElement('option'); 
        opt.value = t; 
        opt.textContent = t; 
        select.appendChild(opt); 
      });
      if (valorAtual && terminais.includes(valorAtual)) select.value = valorAtual;
    });
  });
}

// ====================================================================
// TODOS OS TERMINAIS (para local no envio)
// ====================================================================
function carregarTodosTerminais(forceRefresh = false) {
  if (!forceRefresh && todosTerminaisCache.length) {
    return Promise.resolve(todosTerminaisCache);
  }
  
  if (todosTerminaisPromise) return todosTerminaisPromise;
  
  todosTerminaisPromise = new Promise((resolve) => {
    criarRequestJSONP(URL_PLANILHA, { acao: 'terminais_todos' }, {
      callbackPrefix: 'carregarTodosTerminaisCallback',
      onSuccess: function (terminais) {
        todosTerminaisCache = terminais;
        todosTerminaisPromise = null;
        resolve(terminais);
      },
      onError: function () {
        todosTerminaisPromise = null;
        todosTerminaisCache = ['Terminal A', 'Terminal B', 'Terminal C', 'Terminal D'];
        resolve(todosTerminaisCache);
      }
    });
  });

  return todosTerminaisPromise;
}

function preencherSelectLocal() {
  const select = getEl('envio-local');
  if (!select) return;
  
  carregarTodosTerminais().then(terminais => {
    const valorAtual = select.value;
    select.innerHTML = '<option value="">Selecione...</option>';
    terminais.forEach(t => { 
      const opt = document.createElement('option'); 
      opt.value = t; 
      opt.textContent = t; 
      select.appendChild(opt); 
    });
    if (valorAtual && terminais.includes(valorAtual)) select.value = valorAtual;
  });
}

// Exportar para escopo global
window.INSPETORES = INSPETORES;
window.refreshInspetores = refreshInspetores;
window.carregarTerminais = carregarTerminais;
window.preencherSelectTerminais = preencherSelectTerminais;
window.carregarTodosTerminais = carregarTodosTerminais;
window.preencherSelectLocal = preencherSelectLocal;
window.registrarLog = registrarLog;
window.criarRequestJSONP = criarRequestJSONP;
window.JSONP_TIMEOUT_PADRAO = JSONP_TIMEOUT_PADRAO;

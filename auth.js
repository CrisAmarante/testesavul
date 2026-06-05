// ====================================================================
// AUTENTICAÇÃO – Login, logout, verificação de sessão e permissões 
// ====================================================================

// Variável global de papel do usuário (acessível a todos os módulos)
window.currentUserRole = '';

// ====================================================================
// VERIFICAR STATUS DE LOGIN (agora sem INSPETORES)
// ====================================================================
async function checkLoginStatus() {
  const logado = localStorage.getItem('inspectorLoggedIn');
  const nome = localStorage.getItem('inspectorName');
  const apelido = localStorage.getItem('inspectorApelido');
  const role = localStorage.getItem('inspectorRole');
  const main = getEl('main-screen');
  const insp = getEl('inspector-screen');
  
  if (logado === 'true' && nome && apelido && role) {
    window.currentUserRole = role;
    main.style.display = 'none';
    insp.style.display = 'flex';
    showWelcomeToast(apelido);
    
    // Verificar ocorrências incompletas após o toast
    setTimeout(() => {
      verificarOcorrenciasIncompletas();
    }, 4000);
    
    const logoutBtn = insp.querySelector('.logout-btn');
    if (logoutBtn) logoutBtn.innerHTML = `Sair<small>${apelido}</small>`;
  } else {
    // Usuário não logado ou dados incompletos: limpa e mostra tela principal
    localStorage.removeItem('inspectorLoggedIn');
    localStorage.removeItem('inspectorName');
    localStorage.removeItem('inspectorApelido');
    localStorage.removeItem('inspectorRole');
    window.currentUserRole = '';
    main.style.display = 'flex';
    insp.style.display = 'none';
  }
}

// ====================================================================
// VERIFICAR OCORRÊNCIAS INCOMPLETAS
// ====================================================================
async function verificarOcorrenciasIncompletas() {
  const currentUser = localStorage.getItem('inspectorApelido');
  const currentChapa = localStorage.getItem('inspectorChapa');
  
  // Não mostrar toast de ocorrências incompletas para usuário de teste (55555)
  if (currentChapa === '55555') {
    return;
  }
  
  if (!currentUser) return;
  
  try {
    // Buscar ocorrências incompletas no backend
    const url = `${URL_PLANILHA}?acao=buscar_ocorrencias_incompletas&apelido=${encodeURIComponent(currentUser)}`;
    console.log('[Ocorrências Incompletas] Buscando:', url);
    const response = await fetch(url, { timeout: 5000 });
    console.log('[Ocorrências Incompletas] Resposta recebida, status:', response.status);
    const ocorrenciasBackend = await response.json();
    
    // Também buscar rascunhos locais (para casos offline ou não sincronizados)
    const ocorrenciasLocais = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('rascunho_acidente_')) {
        try {
          const dados = JSON.parse(localStorage.getItem(key));
          if (dados.fiscal === currentUser && !dados.finalizado) {
            // Verificar se já não está no backend
            const existeNoBackend = ocorrenciasBackend.some(o => o.id === dados.id);
            if (!existeNoBackend) {
              ocorrenciasLocais.push({
                id: dados.id,
                prefixo: dados.cadastro?.prefixo || 'N/A',
                apelido: dados.cadastro?.apelido || 'N/A',
                data: dados.cadastro?.data || '',
                origem: 'local'
              });
            }
          }
        } catch (e) {
          console.warn('Erro ao ler rascunho local:', key, e);
        }
      }
    }
    
    // Combinar resultados (backend tem prioridade)
    const todasOcorrencias = [...ocorrenciasBackend, ...ocorrenciasLocais];
    
    if (todasOcorrencias.length > 0) {
      mostrarModalOcorrenciasIncompletas(todasOcorrencias);
    }
  } catch (e) {
    console.error('[Ocorrências Incompletas ERRO]', e);
    // Fallback para busca local em caso de erro
    fallbackVerificacaoLocal(currentUser);
  }
}

function fallbackVerificacaoLocal(currentUser) {
  const ocorrenciasIncompletas = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('rascunho_acidente_')) {
      try {
        const dados = JSON.parse(localStorage.getItem(key));
        if (dados.fiscal === currentUser && !dados.finalizado) {
          ocorrenciasIncompletas.push({
            id: dados.id,
            prefixo: dados.cadastro?.prefixo || 'N/A',
            apelido: dados.cadastro?.apelido || 'N/A',
            data: dados.cadastro?.data || ''
          });
        }
      } catch (e) {
        console.warn('Erro ao ler rascunho:', key, e);
      }
    }
  }
  
  if (ocorrenciasIncompletas.length > 0) {
    mostrarModalOcorrenciasIncompletas(ocorrenciasIncompletas);
  }
}

function mostrarModalOcorrenciasIncompletas(ocorrencias) {
  // Criar modal dinamicamente se não existir
  let modal = document.getElementById('modal-ocorrencias-incompletas');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-ocorrencias-incompletas';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title">⚠️ Ocorrências Incompletas</h2>
          <button class="modal-close" onclick="fecharModalOcorrenciasIncompletas()">×</button>
        </div>
        <div class="modal-body">
          <p>Existe(m) <strong>${ocorrencias.length} ocorrência(s) incompleta(s)</strong> em seu perfil:</p>
          <div id="lista-ocorrencias-incompletas" class="lista-ocorrencias"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="button" onclick="abrirNovaOcorrencia()">➕ Nova Ocorrência</button>
          <button type="button" class="button-secundario" onclick="fecharModalOcorrenciasIncompletas()">Fechar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  // Preencher lista
  const lista = modal.querySelector('#lista-ocorrencias-incompletas');
  if (lista) {
    let html = '<table class="tabela-ocorrencias"><thead><tr><th>Prefixo</th><th>Motorista</th><th>Ações</th></tr></thead><tbody>';
    ocorrencias.forEach(oc => {
      // Buscar nome do motorista pela chapa se disponível
      const motoristaDisplay = oc.motoristaChapa ? `${oc.apelido} (${oc.motoristaChapa})` : oc.apelido;
      html += `<tr>
        <td>${oc.prefixo || 'N/A'}</td>
        <td>${motoristaDisplay || 'N/A'}</td>
        <td><button class="btn-editar" onclick="editarOcorrencia('${oc.id}')" title="Editar"><i class="fas fa-pencil-alt"></i></button></td>
      </tr>`;
    });
    html += '</tbody></table>';
    lista.innerHTML = html;
  }
  
  modal.classList.add('is-open');
}

function fecharModalOcorrenciasIncompletas() {
  const modal = document.getElementById('modal-ocorrencias-incompletas');
  if (modal) modal.classList.remove('is-open');
}

function editarOcorrencia(acidenteId) {
  fecharModalOcorrenciasIncompletas();
  abrirModalEnvio(acidenteId);
}

function abrirNovaOcorrencia() {
  fecharModalOcorrenciasIncompletas();
  abrirModalEnvio();
}

// ====================================================================
// LOGIN (via JSONP, compatível com o backend atual)
// ====================================================================
async function login(e) {
  e.preventDefault();
  const chapa = document.getElementById('chapa').value.trim();
  const senha = document.getElementById('senha').value.trim();
  const errorMsg = document.getElementById('login-error');
  const btnSubmit = e.target.querySelector('button[type="submit"]');
  
  // Usuário de teste/demo 55555 - login automático sem validação backend
  if (chapa === '55555') {
    btnSubmit.innerHTML = 'Entrando...';
    btnSubmit.disabled = true;
    
    setTimeout(() => {
      localStorage.setItem('inspectorLoggedIn', 'true');
      localStorage.setItem('inspectorName', 'Usuário Teste');
      localStorage.setItem('inspectorApelido', 'Inspetor de Testes');
      localStorage.setItem('inspectorRole', 'Inspetor');
      localStorage.setItem('inspectorChapa', '55555');
      window.currentUserRole = 'Inspetor';
      
      registrarLog('Inspetor de Testes');
      window.modals.login.close();
      checkLoginStatus();
      
      btnSubmit.innerHTML = 'Entrar';
      btnSubmit.disabled = false;
      
      // Ativa modo de demonstração após login
      setTimeout(() => {
        if (window.ativarModoDemonstracao) {
          window.ativarModoDemonstracao();
        }
      }, 1000);
    }, 500);
    
    return;
  }
  
  if (!chapa || !senha) {
    errorMsg.textContent = 'Digite chapa e senha!';
    errorMsg.style.display = 'block';
    return;
  }
  
  const textoOriginal = btnSubmit.innerHTML;
  btnSubmit.innerHTML = 'Verificando...';
  btnSubmit.disabled = true;
  errorMsg.style.display = 'none';

  const callbackName = 'loginCallback_' + Date.now();
  
  window[callbackName] = function(resposta) {
    // Limpa timeout se existir
    if (script.timeout) clearTimeout(script.timeout);
    delete window[callbackName];
    btnSubmit.innerHTML = textoOriginal;
    btnSubmit.disabled = false;

    if (resposta && resposta.sucesso) {
      localStorage.setItem('inspectorLoggedIn', 'true');
      localStorage.setItem('inspectorName', resposta.nome);
      localStorage.setItem('inspectorApelido', resposta.apelido);
      localStorage.setItem('inspectorRole', resposta.funcao);
      localStorage.setItem('inspectorChapa', resposta.chapa);
      window.currentUserRole = resposta.funcao;
      
      registrarLog(resposta.apelido);
      window.modals.login.close();
      checkLoginStatus();
    } else {
      errorMsg.style.display = 'block';
      document.getElementById('chapa').value = '';
      document.getElementById('senha').value = '';
      document.getElementById('chapa').focus();
    }
  };

  const script = document.createElement('script');
  const urlCompleta = `${URL_PLANILHA}?acao=login&chapa=${encodeURIComponent(chapa)}&senha=${encodeURIComponent(senha)}&callback=${callbackName}`;
  console.log('[Login] Tentando conectar:', urlCompleta);
  script.src = urlCompleta;
  script.onerror = () => {
    delete window[callbackName];
    btnSubmit.innerHTML = textoOriginal;
    btnSubmit.disabled = false;
    console.error('[Login ERRO] Falha ao carregar script. URL:', urlCompleta);
    console.error('[Login ERRO] Verifique: 1) Internet, 2) Backend ativo, 3) CORS/Apps Script deployado');
    errorMsg.textContent = 'Erro de conexão com servidor. Verifique sua internet.';
    errorMsg.style.display = 'block';
  };
  // Timeout para evitar bloqueio se a resposta demorar muito
  script.timeout = setTimeout(() => {
    if (document.body.contains(script)) {
      delete window[callbackName];
      btnSubmit.innerHTML = textoOriginal;
      btnSubmit.disabled = false;
      console.error('[Login TIMEOUT] Requisição excedeu 5s. URL:', urlCompleta);
      errorMsg.textContent = 'Tempo de resposta excedido. Tente novamente.';
      errorMsg.style.display = 'block';
      document.body.removeChild(script);
    }
  }, 5000);
  script.onload = () => {
    clearTimeout(script.timeout);
    console.log('[Login OK] Script carregado com sucesso');
  };
  document.body.appendChild(script);
}

// ====================================================================
// LOGOUT
// ====================================================================
function logoutInspector() {
  localStorage.removeItem('inspectorLoggedIn');
  localStorage.removeItem('inspectorName');
  localStorage.removeItem('inspectorApelido');
  localStorage.removeItem('inspectorRole');
  window.currentUserRole = '';
  checkLoginStatus();
}

// ====================================================================
// TOAST DE BOAS-VINDAS
// ====================================================================
function showWelcomeToast(apelido) {
  const toast = getEl('welcome-toast');
  if (!toast) return;
  const toastName = getEl('toast-name');
  if (toastName) toastName.textContent = apelido;
  toast.classList.add('show');
  setTimeout(() => hideWelcomeToast(), 3500);
  const clickHandler = () => { hideWelcomeToast(); document.removeEventListener('click', clickHandler); };
  setTimeout(() => document.addEventListener('click', clickHandler), 300);
}

function hideWelcomeToast() { const t = getEl('welcome-toast'); if (t) t.classList.remove('show'); }

// ====================================================================
// BANNER (se ainda usado)
// ====================================================================
function fecharBanner() { const b = getEl('aviso-temporario'); if (b) b.style.display = 'none'; }
function mostrarBannerAviso() {
  const agora = new Date();
  const banner = getEl('aviso-temporario');
  if (banner) banner.style.display = (agora >= DATA_INICIO_BANNER && agora < DATA_FIM_BANNER) ? 'flex' : 'none';
}

// Exportar funções para o escopo global
window.verificarOcorrenciasIncompletas = verificarOcorrenciasIncompletas;
window.mostrarModalOcorrenciasIncompletas = mostrarModalOcorrenciasIncompletas;
window.fecharModalOcorrenciasIncompletas = fecharModalOcorrenciasIncompletas;
window.editarOcorrencia = editarOcorrencia;
window.abrirNovaOcorrencia = abrirNovaOcorrencia;

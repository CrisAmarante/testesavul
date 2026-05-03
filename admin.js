// ====================================================================
// ADMIN.JS - PAINEL DE ADMINISTRAÇÃO (VERSÃO ATUALIZADA)
// ====================================================================

// Função chamada pelo card "Administração"
window.abrirModalAdmin = function() {
  const senhaAdmin = prompt("🔐 Acesso restrito. Digite a senha de administrador:");
  if (!senhaAdmin) return;
  
  const callbackName = 'verificarAdmin_' + Date.now();
  window[callbackName] = function(resposta) {
    delete window[callbackName];
    if (resposta && resposta.sucesso) {
      carregarPainelAdmin();
    } else {
      alert("Senha incorreta. Acesso negado.");
    }
  };
  
  const script = document.createElement('script');
  script.src = `${URL_PLANILHA}?acao=admin_verificar&senha=${encodeURIComponent(senhaAdmin)}&callback=${callbackName}`;
  document.body.appendChild(script);
};

function carregarPainelAdmin() {
  const modal = document.getElementById('modal-admin-panel');
  const container = document.getElementById('admin-panel-conteudo');
  if (!modal || !container) return;

  container.innerHTML = `
    <div class="admin-tabs">
      <button class="admin-tab active" data-tab="usuarios">👥 Usuários</button>
      <button class="admin-tab" data-tab="terminais">🚏 Terminais</button>
      <button class="admin-tab" data-tab="botoes">🔘 Botões Modais</button>
      <button class="admin-tab" data-tab="config">⚙️ Configurações</button>
    </div>
    <div class="admin-panel-body" id="admin-panel-body"></div>
  `;
  
  modal.classList.add('is-open');
  carregarAbaAdmin('usuarios');

  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      carregarAbaAdmin(tab.dataset.tab);
    });
  });
}

async function carregarAbaAdmin(aba) {
  const body = document.getElementById('admin-panel-body');
  if (!body) return;
  body.innerHTML = '<div style="text-align:center; padding:20px;">Carregando...</div>';

  switch(aba) {
    case 'usuarios':
      await carregarGestaoUsuarios(body);
      break;
    case 'terminais':
      await carregarGestaoTerminais(body);
      break;
    case 'botoes':
      body.innerHTML = '<h4>🔘 Configurar Botões</h4><p>Funcionalidade em desenvolvimento para gerir links de 5S e Levantamentos.</p>';
      break;
    case 'config':
      body.innerHTML = '<h4>⚙️ Configurações Gerais</h4><p>Área para troca de Banner de avisos e imagem de fundo (Campanhas).</p>';
      break;
    default:
      body.innerHTML = '<p>Selecione uma aba válida.</p>';
  }
}

// ====================================================================
// GESTÃO DE USUÁRIOS (LAYOUT HORIZONTAL)
// ====================================================================
let usuariosCache = [];

async function carregarGestaoUsuarios(container) {
  if (usuariosCache.length === 0) {
    await buscarUsuariosServidor();
  }

  container.innerHTML = `
    <!-- NOVO USUÁRIO -->
    <div class="admin-form">
      <h4 style="color: var(--accent);">+ NOVO USUÁRIO</h4>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 8px;">
        <input type="text" id="novo-matricula" placeholder="Matrícula">
        <input type="text" id="novo-apelido" placeholder="Apelido">
        <select id="novo-funcao">${gerarOpcoesFuncao('')}</select>
      </div>
      <div style="display: grid; grid-template-columns: 2fr 1.5fr 0.5fr; gap: 10px;">
        <input type="text" id="novo-nome" placeholder="Nome completo">
        <input type="password" id="novo-senha" placeholder="Senha">
        <button onclick="criarNovoUsuario()" class="btn-salvar" style="height: 42px; background: #10b981;">Criar</button>
      </div>
    </div>

    <!-- BUSCA -->
    <div class="admin-form" style="margin-top: 20px;">
      <h4 style="color: var(--accent);">🔍 BUSCAR USUÁRIO POR MATRÍCULA</h4>
      <div style="display: flex; gap: 10px;">
        <input type="text" id="busca-matricula" placeholder="Digite a matrícula..." style="flex: 1;">
        <button onclick="buscarUsuarioPorMatricula()" class="btn-editar" style="background: #f59e0b; width: 120px;">Buscar</button>
      </div>
    </div>
    <div id="resultado-usuario"></div>
  `;
}

function buscarUsuarioPorMatricula() {
  const matricula = document.getElementById('busca-matricula').value.trim();
  const usuario = usuariosCache.find(u => String(u.matricula) === matricula);
  const div = document.getElementById('resultado-usuario');
  
  if (!usuario) {
    div.innerHTML = `<p style="padding:15px; text-align:center;">❌ Usuário não encontrado.</p>`;
    return;
  }

  div.innerHTML = `
    <div class="admin-form" style="padding:0; overflow:hidden; border: 1px solid #444;">
      <div style="background: #333; color: #fff; padding: 8px 12px; font-weight: bold; font-size: 0.9rem;">Edita usuário</div>
      <div style="background: #000; color: #fff; display: grid; grid-template-columns: 1fr 1fr 1.5fr 1fr 1fr; padding: 6px 12px; font-size: 0.7rem; font-weight: bold;">
        <span>MATRÍCULA</span><span>APELIDO</span><span>NOME</span><span>FUNÇÃO</span><span>ATIVO</span>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1.5fr 1fr 1fr; gap: 8px; padding: 12px; align-items: center;">
        <input type="text" value="${usuario.matricula}" disabled style="background: #eee; color: #666;">
        <input type="text" id="edit-apelido" value="${usuario.apelido}">
        <input type="text" id="edit-nome" value="${usuario.nome}">
        <select id="edit-funcao">${gerarOpcoesFuncao(usuario.funcao)}</select>
        <select id="edit-ativo">
          <option value="SIM" ${usuario.ativo === 'SIM' ? 'selected' : ''}>SIM</option>
          <option value="NÃO" ${usuario.ativo === 'NÃO' ? 'selected' : ''}>NÃO</option>
        </select>
      </div>
      <div style="padding: 0 12px 12px;">
        <button onclick="salvarUsuarioEdicao('${usuario.apelido}')" class="btn-salvar" style="width: 120px; background: #10b981;">SALVAR</button>
      </div>
    </div>
  `;
}

// ====================================================================
// GESTÃO DE TERMINAIS (LAYOUT COMPACTO)
// ====================================================================
let terminaisCache = [];

async function carregarGestaoTerminais(container) {
  if (terminaisCache.length === 0) {
    await buscarTerminaisServidor();
  }

  container.innerHTML = `
    <div class="admin-form">
      <h4 style="color: var(--accent);">+ NOVO TERMINAL</h4>
      <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; align-items: flex-end;">
        <div>
          <label style="font-size: 0.7rem; font-weight: bold;">Nome do terminal</label>
          <input type="text" id="novo-terminal-nome" placeholder="Ex: Terminal Osasco">
        </div>
        <div>
          <label style="font-size: 0.7rem; font-weight: bold;">Ativo</label>
          <select id="novo-terminal-status"><option value="SIM">Sim</option><option value="NÃO">Não</option></select>
        </div>
        <button onclick="adicionarNovoTerminal()" class="btn-salvar" style="height: 42px; background: #10b981;">ADICIONAR</button>
      </div>
    </div>

    <div class="admin-form" style="margin-top: 20px; padding: 0; border: 1px solid #444; overflow: hidden;">
      <div style="background: #000; color: #fff; padding: 8px 12px; font-weight: bold; font-size: 0.9rem;">HABILITA E DESABILITA TERMINAL</div>
      <div style="background: #000; color: #fff; display: grid; grid-template-columns: 2fr 1fr 1fr; padding: 6px 12px; font-size: 0.7rem; font-weight: bold; border-top: 1px solid #333;">
        <span>TERMINAL</span><span>ATIVO</span><span>AÇÃO</span>
      </div>
      <div id="lista-terminais-admin" style="max-height: 300px; overflow-y: auto;"></div>
    </div>
  `;
  renderizarListaTerminaisAdmin();
}

function renderizarListaTerminaisAdmin() {
  const lista = document.getElementById('lista-terminais-admin');
  lista.innerHTML = terminaisCache.map(t => `
    <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; padding: 8px 12px; border-bottom: 1px solid rgba(0,0,0,0.1); align-items: center;">
      <span style="font-style: italic; font-size: 0.85rem;">${t.terminal}</span>
      <select id="status-t-${t.id}" style="padding: 4px;">
        <option value="SIM" ${t.status === 'SIM' ? 'selected' : ''}>Sim</option>
        <option value="NÃO" ${t.status === 'NÃO' ? 'selected' : ''}>Não</option>
      </select>
      <button onclick="atualizarStatusTerminal(${t.id})" class="btn-salvar" style="padding: 6px; font-size: 0.7rem; background: #10b981;">SALVAR</button>
    </div>
  `).join('');
}

// ====================================================================
// COMUNICAÇÃO COM O SERVIDOR (API)
// ====================================================================

async function buscarUsuariosServidor() {
  return new Promise((resolve) => {
    const callback = 'cb_list_usr_' + Date.now();
    window[callback] = (dados) => { usuariosCache = dados || []; delete window[callback]; resolve(); };
    const script = document.createElement('script');
    script.src = `${URL_PLANILHA}?acao=admin_listar_usuarios&callback=${callback}`;
    document.body.appendChild(script);
  });
}

async function buscarTerminaisServidor() {
  return new Promise((resolve) => {
    const callback = 'cb_list_term_' + Date.now();
    window[callback] = (dados) => { terminaisCache = dados || []; delete window[callback]; resolve(); };
    const script = document.createElement('script');
    script.src = `${URL_PLANILHA}?acao=admin_listar_terminais_completos&callback=${callback}`;
    document.body.appendChild(script);
  });
}

async function enviarAdminPost(endpoint, dados) {
  return new Promise((resolve) => {
    const callback = 'cb_post_adm_' + Date.now();
    window[callback] = (res) => { delete window[callback]; resolve(res); };
    const params = new URLSearchParams({ acao: endpoint, dados: JSON.stringify(dados), callback });
    const script = document.createElement('script');
    script.src = `${URL_PLANILHA}?${params}`;
    document.body.appendChild(script);
  });
}

// ====================================================================
// FUNÇÕES DE AÇÃO (SALVAR / CRIAR)
// ====================================================================

async function salvarUsuarioEdicao(apelido) {
  const nome = document.getElementById('edit-nome').value;
  const funcao = document.getElementById('edit-funcao').value;
  const ativo = document.getElementById('edit-ativo').value;
  
  const res = await enviarAdminPost('admin_usuarios', { acao: 'atualizar', apelido, campos: { nome, funcao, ativo } });
  if(res.sucesso) { alert("✅ Usuário atualizado!"); usuariosCache = []; carregarAbaAdmin('usuarios'); }
  else alert("❌ Erro: " + res.erro);
}

async function atualizarStatusTerminal(id) {
  const status = document.getElementById(`status-t-${id}`).value;
  const res = await enviarAdminPost('admin_terminais', { acao: 'editar_status', id, status });
  if(res.sucesso) { alert("✅ Status atualizado!"); terminaisCache = []; carregarAbaAdmin('terminais'); }
  else alert("❌ Erro: " + res.erro);
}

function gerarOpcoesFuncao(atual) {
  const funcoes = ['FISCAL', 'INSPETOR', 'ADMIN', 'GERENTE', 'ENCARREGADO', 'SAF', 'MONITOR'];
  return funcoes.map(f => `<option value="${f}" ${f === atual ? 'selected' : ''}>${f}</option>`).join('');
}

function fecharModalAdmin() {
  const modal = document.getElementById('modal-admin-panel');
  if (modal) modal.classList.remove('is-open');
}

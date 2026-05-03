// ====================================================================
// ADMIN.JS - PAINEL DE ADMINISTRAÇÃO (VERSÃO FINAL COM ROLAGEM)
// ====================================================================

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
    <div class="admin-panel-body" id="admin-panel-body" style="max-height: 70vh; overflow-y: auto; padding: 15px;"></div>
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
    case 'usuarios': await carregarGestaoUsuarios(body); break;
    case 'terminais': await carregarGestaoTerminais(body); break;
    default: body.innerHTML = '<h4>Em desenvolvimento</h4>';
  }
}

// ====================================================================
// GESTÃO DE USUÁRIOS
// ====================================================================
let usuariosCache = [];

async function carregarGestaoUsuarios(container) {
  if (usuariosCache.length === 0) await buscarUsuariosServidor();

  container.innerHTML = `
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

    <div class="admin-form" style="margin-top: 20px;">
      <h4 style="color: var(--accent);">🔍 BUSCA</h4>
      <div style="display: flex; gap: 10px;">
        <input type="text" id="busca-matricula" placeholder="Matrícula..." style="flex: 1;">
        <button onclick="buscarUsuarioPorMatricula()" class="btn-editar" style="background: #f59e0b; width: 100px;">Buscar</button>
        <button onclick="listarTodosUsuarios()" class="btn-secundario" style="width: 120px;">Listar Todos</button>
      </div>
    </div>
    <div id="resultado-usuario" style="margin-top:15px; max-height: 400px; overflow-y: auto; border-radius: 8px;"></div>
  `;
}

async function criarNovoUsuario() {
  const matricula = document.getElementById('novo-matricula').value.trim();
  const apelido = document.getElementById('novo-apelido').value.trim();
  const nome = document.getElementById('novo-nome').value.trim();
  const funcao = document.getElementById('novo-funcao').value;
  const senha = document.getElementById('novo-senha').value.trim();

  if (!matricula || !apelido || !nome || !senha) return alert("Preencha todos os campos!");

  const res = await enviarAdminPost('admin_usuarios', { acao: 'criar', matricula, apelido, nome, funcao, senha });
  if (res.sucesso) {
    alert("✅ Usuário criado com sucesso!");
    usuariosCache = [];
    carregarAbaAdmin('usuarios');
  } else alert("❌ Erro: " + res.erro);
}

function listarTodosUsuarios() {
  const div = document.getElementById('resultado-usuario');
  let html = `
    <table class="admin-table" style="width:100%; border-collapse: collapse; font-size: 0.8rem;">
      <thead style="position: sticky; top: 0; background: var(--accent); color: white;">
        <tr><th>Mat.</th><th>Apelido</th><th>Função</th><th>Ativo</th><th>Ação</th></tr>
      </thead>
      <tbody>`;
  
  usuariosCache.forEach(u => {
    html += `
      <tr style="border-bottom: 1px solid #444;">
        <td style="padding: 8px;">${u.matricula}</td>
        <td>${u.apelido}</td>
        <td><select id="role-${u.apelido}" style="font-size:0.7rem;">${gerarOpcoesFuncao(u.funcao)}</select></td>
        <td><select id="status-${u.apelido}" style="font-size:0.7rem;"><option value="SIM" ${u.ativo === 'SIM' ? 'selected' : ''}>SIM</option><option value="NÃO" ${u.ativo === 'NÃO' ? 'selected' : ''}>NÃO</option></select></td>
        <td><button onclick="salvarUsuarioLista('${u.apelido}')" class="btn-salvar" style="padding:4px 8px; font-size:0.6rem; background:#10b981;">OK</button></td>
      </tr>`;
  });
  html += `</tbody></table>`;
  div.innerHTML = html;
}

// ====================================================================
// GESTÃO DE TERMINAIS
// ====================================================================

async function carregarGestaoTerminais(container) {
  if (terminaisCache.length === 0) await buscarTerminaisServidor();

  container.innerHTML = `
    <div class="admin-form">
      <h4 style="color: var(--accent);">+ NOVO TERMINAL</h4>
      <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; align-items: flex-end;">
        <div><label style="font-size:0.7rem;">Nome</label><input type="text" id="novo-terminal-nome"></div>
        <div><label style="font-size:0.7rem;">Ativo</label><select id="novo-terminal-status"><option value="SIM">Sim</option><option value="NÃO">Não</option></select></div>
        <button onclick="adicionarNovoTerminal()" class="btn-salvar" style="height: 42px; background: #10b981;">Adicionar</button>
      </div>
    </div>

    <div class="admin-form" style="margin-top: 20px;">
      <h4 style="color: var(--accent);">🔍 TERMINAIS</h4>
      <button onclick="renderizarListaTerminaisAdmin()" class="btn-secundario" style="width: 100%;">Listar Todos os Terminais</button>
      <div id="lista-terminais-admin" style="margin-top:15px; max-height: 400px; overflow-y: auto; border: 1px solid #444; border-radius: 8px;"></div>
    </div>
  `;
}

async function adicionarNovoTerminal() {
  const nome = document.getElementById('novo-terminal-nome').value.trim();
  const status = document.getElementById('novo-terminal-status').value;
  if (!nome) return alert("Digite o nome do terminal!");

  const res = await enviarAdminPost('admin_terminais', { acao: 'criar', nome, status });
  if (res.sucesso) {
    alert("✅ Terminal adicionado!");
    terminaisCache = [];
    carregarAbaAdmin('terminais');
  } else alert("❌ Erro: " + res.erro);
}

function renderizarListaTerminaisAdmin() {
  const lista = document.getElementById('lista-terminais-admin');
  lista.innerHTML = `
    <div style="background: #000; color: #fff; display: grid; grid-template-columns: 2fr 1fr 1fr; padding: 10px; font-weight: bold; font-size: 0.7rem; position: sticky; top: 0;">
      <span>TERMINAL</span><span>ATIVO</span><span>AÇÃO</span>
    </div>` + 
    terminaisCache.map(t => `
    <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 10px; padding: 8px 10px; border-bottom: 1px solid #444; align-items: center;">
      <span style="font-size: 0.8rem;">${t.terminal}</span>
      <select id="status-t-${t.id}" style="font-size:0.7rem;"><option value="SIM" ${t.status === 'SIM' ? 'selected' : ''}>Sim</option><option value="NÃO" ${t.status === 'NÃO' ? 'selected' : ''}>Não</option></select>
      <button onclick="atualizarStatusTerminal(${t.id})" class="btn-salvar" style="padding: 6px; font-size: 0.6rem; background: #10b981;">Salvar</button>
    </div>
  `).join('');
}

// ====================================================================
// UTILITÁRIOS E API
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

async function salvarUsuarioLista(apelido) {
  const funcao = document.getElementById(`role-${apelido}`).value;
  const ativo = document.getElementById(`status-${apelido}`).value;
  const res = await enviarAdminPost('admin_usuarios', { acao: 'atualizar', apelido, campos: { funcao, ativo } });
  if(res.sucesso) alert("✅ Atualizado!");
  else alert("❌ Erro");
}

async function atualizarStatusTerminal(id) {
  const status = document.getElementById(`status-t-${id}`).value;
  const res = await enviarAdminPost('admin_terminais', { acao: 'editar_status', id, status });
  if(res.sucesso) alert("✅ Terminal atualizado!");
  else alert("❌ Erro");
}

function gerarOpcoesFuncao(atual) {
  const funcoes = ['FISCAL', 'INSPETOR', 'ADMIN', 'GERENTE', 'ENCARREGADO', 'SAF', 'MONITOR'];
  return funcoes.map(f => `<option value="${f}" ${f === atual ? 'selected' : ''}>${f}</option>`).join('');
}

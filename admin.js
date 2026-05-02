// ====================================================================
// ADMIN.JS - PAINEL DE ADMINISTRAÇÃO (APENAS PARA PERFIL ADMIN)
// ====================================================================

// Torna a função global para ser chamada pelo card
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
      <button class="admin-tab" data-tab="visibilidade">👁️ Visibilidade</button>
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
  switch(aba) {
    case 'usuarios':
      body.innerHTML = '<div style="text-align:center">Carregando usuários...</div>';
      await carregarGestaoUsuarios(body);
      break;
    case 'terminais':
      body.innerHTML = '<div style="text-align:center">Carregando terminais...</div>';
      await carregarGestaoTerminais(body);
      break;
    default:
      body.innerHTML = '<p>Funcionalidade em breve</p>';
  }
}

// ======================= GESTÃO DE USUÁRIOS =======================
let usuariosAdminCache = [];

async function carregarGestaoUsuarios(container) {
  // Carrega a lista de usuários do backend
  await new Promise((resolve) => {
    const callback = 'carregaUsuarios_' + Date.now();
    window[callback] = (dados) => {
      usuariosAdminCache = dados || [];
      delete window[callback];
      resolve();
    };
    const script = document.createElement('script');
    script.src = `${URL_PLANILHA}?acao=admin_listar_usuarios&callback=${callback}`;
    document.body.appendChild(script);
  });

  // Monta o layout
  container.innerHTML = `
    <div class="admin-section">
      <h3>➕ NOVO USUÁRIO</h3>
      <div class="admin-form">
        <div class="form-row">
          <input type="text" id="novo-matricula" placeholder="Matrícula" style="flex:1">
          <input type="text" id="novo-nome" placeholder="Nome completo" style="flex:2">
          <input type="text" id="novo-apelido" placeholder="Apelido" style="flex:1">
          <input type="password" id="nova-senha" placeholder="Senha" style="flex:1">
          <select id="nova-funcao" style="flex:1">
            <option value="FISCAL">FISCAL</option>
            <option value="INSPETOR">INSPETOR</option>
            <option value="ADMIN">ADMIN</option>
            <option value="GERENTE">GERENTE</option>
            <option value="ENCARREGADO">ENCARREGADO</option>
            <option value="SAF">SAF</option>
            <option value="MONITOR">MONITOR</option>
          </select>
          <button id="btn-criar-usuario" class="btn-salvar">Criar</button>
        </div>
      </div>
    </div>

    <div class="admin-section">
      <h3>✏️ EDITAR USUÁRIOS</h3>
      <table class="admin-table">
        <thead>
          <tr><th>MATRÍCULA</th><th>APELIDO</th><th>NOME</th><th>FUNÇÃO</th><th>ATIVO</th><th>AÇÃO</th></tr>
        </thead>
        <tbody id="tabela-usuarios-body">
          ${usuariosAdminCache.map(u => `
            <tr data-apelido="${u.apelido}">
              <td>${u.matricula}</td>
              <td>${u.apelido}</td>
              <td><input type="text" class="edit-nome" value="${u.nome.replace(/"/g, '&quot;')}" style="width:100%"></td>
              <td><select class="edit-funcao">${gerarOpcoesFuncao(u.funcao)}</select></td>
              <td><select class="edit-ativo">
                <option value="SIM" ${u.ativo === 'SIM' ? 'selected' : ''}>SIM</option>
                <option value="NÃO" ${u.ativo === 'NÃO' ? 'selected' : ''}>NÃO</option>
              </select></td>
              <td><button class="btn-editar" onclick="salvarUsuarioEdicao('${u.apelido}', this)">SALVAR</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('btn-criar-usuario').onclick = () => criarUsuarioAdmin();
}

function gerarOpcoesFuncao(atual) {
  const funcoes = ['FISCAL', 'INSPETOR', 'ADMIN', 'GERENTE', 'ENCARREGADO', 'SAF', 'MONITOR'];
  return funcoes.map(f => `<option value="${f}" ${f === atual ? 'selected' : ''}>${f}</option>`).join('');
}

async function criarUsuarioAdmin() {
  const matricula = document.getElementById('novo-matricula').value.trim();
  const nome = document.getElementById('novo-nome').value.trim();
  const apelido = document.getElementById('novo-apelido').value.trim();
  const senha = document.getElementById('nova-senha').value;
  const funcao = document.getElementById('nova-funcao').value;

  if (!matricula || !nome || !apelido || !senha || !funcao) {
    alert("Preencha todos os campos.");
    return;
  }

  const dados = { acao: 'criar', matricula, nome, apelido, senha, funcao, ativo: 'SIM' };
  const resposta = await enviarAdminPost('admin_usuarios', dados);
  if (resposta && resposta.sucesso) {
    alert("Usuário criado com sucesso!");
    // Recarrega a aba
    carregarGestaoUsuarios(document.getElementById('admin-panel-body'));
  } else {
    alert(resposta?.erro || "Erro ao criar usuário");
  }
}

window.salvarUsuarioEdicao = async function(apelido, btn) {
  const row = btn.closest('tr');
  const nome = row.querySelector('.edit-nome').value.trim();
  const funcao = row.querySelector('.edit-funcao').value;
  const ativo = row.querySelector('.edit-ativo').value;
  if (!nome) { alert("Nome não pode ficar vazio."); return; }
  const resposta = await enviarAdminPost('admin_usuarios', { acao: 'atualizar', apelido, campos: { nome, funcao, ativo } });
  if (resposta && resposta.sucesso) {
    alert("Usuário atualizado!");
    carregarGestaoUsuarios(document.getElementById('admin-panel-body'));
  } else {
    alert(resposta?.erro || "Erro ao atualizar");
  }
};

// ======================= GESTÃO DE TERMINAIS =======================
let terminaisAdminCache = [];

async function carregarGestaoTerminais(container) {
  // Carrega a lista de terminais
  await new Promise((resolve) => {
    const callback = 'carregaTerminais_' + Date.now();
    window[callback] = (dados) => {
      terminaisAdminCache = dados || [];
      delete window[callback];
      resolve();
    };
    const script = document.createElement('script');
    script.src = `${URL_PLANILHA}?acao=admin_listar_terminais_completos&callback=${callback}`;
    document.body.appendChild(script);
  });

  container.innerHTML = `
    <div class="admin-section">
      <h3>➕ NOVO TERMINAL</h3>
      <div class="admin-form">
        <div class="form-row">
          <input type="text" id="novo-terminal-nome" placeholder="Nome do terminal" style="flex:2">
          <select id="novo-terminal-status" style="flex:1">
            <option value="SIM">ATIVO (SIM)</option>
            <option value="NÃO">INATIVO (NÃO)</option>
          </select>
          <button id="btn-criar-terminal" class="btn-salvar">ADICIONAR</button>
        </div>
      </div>
    </div>

    <div class="admin-section">
      <h3>✏️ HABILITA E DESABILITA TERMINAL</h3>
      <table class="admin-table">
        <thead>
          <tr><th>TERMINAL</th><th>STATUS (ATIVO)</th><th>AÇÃO</th></tr>
        </thead>
        <tbody id="tabela-terminais-body">
          ${terminaisAdminCache.map(t => `
            <tr data-id="${t.id}">
              <td><input type="text" class="edit-terminal-nome" value="${t.terminal.replace(/"/g, '&quot;')}" style="width:100%"></td>
              <td>
                <select class="edit-terminal-status">
                  <option value="SIM" ${t.status === 'SIM' ? 'selected' : ''}>SIM (Ativo)</option>
                  <option value="NÃO" ${t.status === 'NÃO' ? 'selected' : ''}>NÃO (Inativo)</option>
                </select>
              </td>
              <td><button class="btn-editar" onclick="salvarTerminalEdicao(${t.id}, this)">SALVAR</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('btn-criar-terminal').onclick = () => criarTerminalAdmin();
}

async function criarTerminalAdmin() {
  const nome = document.getElementById('novo-terminal-nome').value.trim();
  const status = document.getElementById('novo-terminal-status').value;
  if (!nome) { alert("Digite o nome do terminal."); return; }
  const resposta = await enviarAdminPost('admin_terminais', { acao: 'adicionar', nome, status });
  if (resposta && resposta.sucesso) {
    alert("Terminal adicionado!");
    carregarGestaoTerminais(document.getElementById('admin-panel-body'));
  } else {
    alert(resposta?.erro || "Erro ao adicionar terminal");
  }
}

window.salvarTerminalEdicao = async function(id, btn) {
  const row = btn.closest('tr');
  const nome = row.querySelector('.edit-terminal-nome').value.trim();
  const status = row.querySelector('.edit-terminal-status').value;
  if (!nome) { alert("Nome não pode ficar vazio."); return; }
  const resposta = await enviarAdminPost('admin_terminais', { acao: 'editar', id, nome, status });
  if (resposta && resposta.sucesso) {
    alert("Terminal atualizado!");
    carregarGestaoTerminais(document.getElementById('admin-panel-body'));
  } else {
    alert(resposta?.erro || "Erro ao atualizar terminal");
  }
};

// ======================= FUNÇÃO AUXILIAR =======================
function enviarAdminPost(endpoint, dados) {
  return new Promise((resolve) => {
    const callback = 'adminPost_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    window[callback] = (res) => { delete window[callback]; resolve(res); };
    const params = new URLSearchParams({ acao: endpoint, dados: JSON.stringify(dados), callback });
    const script = document.createElement('script');
    script.src = `${URL_PLANILHA}?${params}`;
    script.onerror = () => { delete window[callback]; resolve({ erro: 'Erro de conexão' }); };
    document.body.appendChild(script);
  });
}

function fecharModalAdmin() {
  const modal = document.getElementById('modal-admin-panel');
  if (modal) modal.classList.remove('is-open');
}

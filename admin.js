// ====================================================================
// ADMIN.JS - PAINEL DE ADMINISTRAÇÃO (APENAS PARA PERFIL ADMIN)
// ====================================================================
console.log("✅ admin.js carregado e executado");
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
      body.innerHTML = '<div style="text-align:center">Carregando...</div>';
      await carregarGestaoUsuarios(body);
      break;
    case 'terminais':
      body.innerHTML = '<div style="text-align:center">Carregando...</div>';
      await carregarGestaoTerminais(body);
      break;
    default:
      body.innerHTML = '<p>Funcionalidade em breve</p>';
  }
}

// ======================= GESTÃO DE USUÁRIOS =======================
let usuariosCache = [];

async function carregarGestaoUsuarios(container) {
  if (usuariosCache.length === 0) {
    await new Promise((resolve) => {
      const callback = 'carregaUsuarios_' + Date.now();
      window[callback] = (dados) => {
        usuariosCache = dados || [];
        delete window[callback];
        resolve();
      };
      const script = document.createElement('script');
      script.src = `${URL_PLANILHA}?acao=admin_listar_usuarios&callback=${callback}`;
      document.body.appendChild(script);
    });
  }
  container.innerHTML = `
    <div class="admin-form">
      <h4>🔍 Buscar Usuário por Matrícula</h4>
      <div class="form-row">
        <input type="text" id="busca-matricula" placeholder="Digite a matrícula" style="flex:2">
        <button id="btn-buscar" class="btn-editar">Buscar</button>
        <button id="btn-listar-todos" class="btn-secundario">📋 Listar Todos</button>
      </div>
    </div>
    <div id="resultado-usuario"></div>
  `;
  document.getElementById('btn-buscar').onclick = () => buscarUsuario();
  document.getElementById('btn-listar-todos').onclick = () => listarTodosUsuarios();
}

function buscarUsuario() {
  const matricula = document.getElementById('busca-matricula').value.trim();
  if (!matricula) return alert("Digite a matrícula");
  const usuario = usuariosCache.find(u => String(u.matricula) === matricula);
  const div = document.getElementById('resultado-usuario');
  if (!usuario) {
    div.innerHTML = `<p>❌ Usuário não encontrado</p>`;
    return;
  }
  div.innerHTML = `
    <div class="admin-form">
      <h4>✏️ Editando: ${usuario.apelido}</h4>
      <div class="form-row">
        <label>Matrícula:</label><input type="text" value="${usuario.matricula}" disabled>
        <label>Apelido:</label><input type="text" value="${usuario.apelido}" disabled>
        <label>Nome:</label><input type="text" id="edit-nome" value="${usuario.nome}">
      </div>
      <div class="form-row">
        <label>Função:</label>
        <select id="edit-funcao">${gerarOpcoesFuncao(usuario.funcao)}</select>
        <label>Ativo:</label>
        <select id="edit-ativo">
          <option value="SIM" ${usuario.ativo === 'SIM' ? 'selected' : ''}>SIM</option>
          <option value="NÃO" ${usuario.ativo === 'NÃO' ? 'selected' : ''}>NÃO</option>
        </select>
      </div>
      <button id="salvar-edicao" class="btn-salvar">Salvar</button>
      <button id="resetar-senha" class="btn-editar">Resetar Senha</button>
    </div>
  `;
  document.getElementById('salvar-edicao').onclick = () => salvarUsuario(usuario.apelido);
  document.getElementById('resetar-senha').onclick = () => resetarSenhaUsuario(usuario.apelido);
}

function gerarOpcoesFuncao(atual) {
  const funcoes = ['FISCAL', 'INSPETOR', 'ADMIN', 'GERENTE', 'ENCARREGADO', 'SAF', 'MONITOR'];
  return funcoes.map(f => `<option value="${f}" ${f === atual ? 'selected' : ''}>${f}</option>`).join('');
}

async function salvarUsuario(apelido) {
  const nome = document.getElementById('edit-nome').value.trim();
  const funcao = document.getElementById('edit-funcao').value;
  const ativo = document.getElementById('edit-ativo').value;
  if (!nome) return alert("Nome não pode ficar vazio.");
  const resposta = await enviarAdminPost('admin_usuarios', { acao: 'atualizar', apelido, campos: { nome, funcao, ativo } });
  if (resposta && resposta.sucesso) {
    alert("Usuário atualizado!");
    usuariosCache = [];
    carregarGestaoUsuarios(document.getElementById('admin-panel-body'));
  } else {
    alert(resposta?.erro || "Erro");
  }
}

function listarTodosUsuarios() {
  let html = `<table class="admin-table"><thead><tr><th>Matrícula</th><th>Apelido</th><th>Nome</th><th>Função</th><th>Ativo</th><th>Ações</th></tr></thead><tbody>`;
  usuariosCache.forEach(u => {
    html += `
      <tr>
        <tr>${u.matricula}</td>
        <td>${u.apelido}</td>
        <td>${u.nome}</td>
        <td><select class="edit-funcao-lista">${gerarOpcoesFuncao(u.funcao)}</select></td>
        <td><select class="edit-ativo-lista">
          <option value="SIM" ${u.ativo === 'SIM' ? 'selected' : ''}>SIM</option>
          <option value="NÃO" ${u.ativo === 'NÃO' ? 'selected' : ''}>NÃO</option>
        </select></td>
        <td><button class="btn-salvar" onclick="salvarUsuarioLista('${u.apelido}', this)">Salvar</button></td>
      </tr>`;
  });
  html += `</tbody></table>`;
  document.getElementById('resultado-usuario').innerHTML = html;
}

window.salvarUsuarioLista = async function(apelido, btn) {
  const row = btn.closest('tr');
  const funcao = row.querySelector('.edit-funcao-lista').value;
  const ativo = row.querySelector('.edit-ativo-lista').value;
  const resposta = await enviarAdminPost('admin_usuarios', { acao: 'atualizar', apelido, campos: { funcao, ativo } });
  if (resposta && resposta.sucesso) {
    alert("Atualizado!");
    usuariosCache = [];
    carregarGestaoUsuarios(document.getElementById('admin-panel-body'));
  } else {
    alert(resposta?.erro || "Erro");
  }
};

async function resetarSenhaUsuario(apelido) {
  const novaSenha = prompt("Nova senha:");
  if (!novaSenha) return;
  const resposta = await enviarAdminPost('admin_usuarios', { acao: 'resetar_senha', apelido, novaSenha });
  alert(resposta?.sucesso ? "Senha resetada" : (resposta?.erro || "Erro"));
}

// ======================= GESTÃO DE TERMINAIS =======================
let terminaisCache = [];

async function carregarGestaoTerminais(container) {
  if (terminaisCache.length === 0) {
    await new Promise((resolve) => {
      const callback = 'carregaTerminais_' + Date.now();
      window[callback] = (dados) => {
        terminaisCache = dados || [];
        delete window[callback];
        resolve();
      };
      const script = document.createElement('script');
      script.src = `${URL_PLANILHA}?acao=admin_listar_terminais_completos&callback=${callback}`;
      document.body.appendChild(script);
    });
  }
  container.innerHTML = `
    <div class="admin-form">
      <h4>🔍 Buscar Terminal por Nome</h4>
      <div class="form-row">
        <input type="text" id="busca-terminal" placeholder="Nome do terminal" style="flex:2">
        <button id="btn-buscar-terminal" class="btn-editar">Buscar</button>
        <button id="btn-listar-terminais" class="btn-secundario">📋 Listar Todos</button>
      </div>
    </div>
    <div id="resultado-terminal"></div>
  `;
  document.getElementById('btn-buscar-terminal').onclick = () => buscarTerminal();
  document.getElementById('btn-listar-terminais').onclick = () => listarTerminais();
}

function buscarTerminal() {
  const nome = document.getElementById('busca-terminal').value.trim().toLowerCase();
  if (!nome) return alert("Digite o nome");
  const filtrados = terminaisCache.filter(t => t.terminal.toLowerCase().includes(nome));
  if (filtrados.length === 0) {
    document.getElementById('resultado-terminal').innerHTML = `<p>❌ Nenhum terminal encontrado</p>`;
    return;
  }
  exibirTerminais(filtrados);
}

function listarTerminais() {
  exibirTerminais(terminaisCache);
}

function exibirTerminais(terminais) {
  let html = `<table class="admin-table"><thead><tr><th>ID</th><th>Nome</th><th>Status</th><th>Ações</th></tr></thead><tbody>`;
  terminais.forEach(t => {
    html += `
      <tr data-id="${t.id}">
        <td>${t.id}</td>
        <td><input type="text" class="edit-nome-terminal" value="${t.terminal.replace(/"/g, '&quot;')}" style="width:100%"></td>
        <td><select class="edit-status-terminal">
          <option value="SIM" ${t.status === 'SIM' ? 'selected' : ''}>SIM</option>
          <option value="NÃO" ${t.status === 'NÃO' ? 'selected' : ''}>NÃO</option>
        </select></td>
        <td><button class="btn-salvar" onclick="salvarTerminal(${t.id})">Salvar</button></td>
      </tr>`;
  });
  html += `</tbody></table>`;
  document.getElementById('resultado-terminal').innerHTML = html;
}

window.salvarTerminal = async function(id) {
  const row = document.querySelector(`tr[data-id="${id}"]`);
  const nome = row.querySelector('.edit-nome-terminal').value.trim();
  const status = row.querySelector('.edit-status-terminal').value;
  if (!nome) return alert("Nome não pode ficar vazio");
  const resposta = await enviarAdminPost('admin_terminais', { acao: 'editar', id, nome, status });
  if (resposta && resposta.sucesso) {
    alert("Terminal atualizado!");
    terminaisCache = [];
    carregarGestaoTerminais(document.getElementById('admin-panel-body'));
  } else {
    alert(resposta?.erro || "Erro");
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

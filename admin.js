// ====================================================================
// ADMIN.JS - PAINEL DE ADMINISTRAÇÃO (APENAS PARA PERFIL ADMIN)
// ====================================================================

// Abre o modal de administração com segunda validação
function abrirModalAdmin() {
  const senhaAdmin = prompt("🔐 Acesso restrito. Digite a senha de administrador:");
  if (!senhaAdmin) return;
  
  console.log("Senha digitada:", senhaAdmin);

  const callbackName = 'verificarAdmin_' + Date.now();
  window[callbackName] = function(resposta) {
    console.log("Resposta do servidor:", resposta);
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
}

// Carrega o conteúdo do painel administrativo (modal)
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

// Carrega a aba ativa
async function carregarAbaAdmin(aba) {
  const body = document.getElementById('admin-panel-body');
  if (!body) return;
  switch(aba) {
    case 'usuarios':
      await carregarGestaoUsuarios(body);
      break;
    case 'terminais':
      await carregarGestaoTerminais(body);
      break;
    default:
      body.innerHTML = '<p>Funcionalidade em breve</p>';
  }
}

// ======================= GESTÃO DE USUÁRIOS =======================
// Cache global de usuários (carregado uma vez)
let usuariosCache = [];

async function carregarGestaoUsuarios(container) {
  if (usuariosCache.length === 0) {
    container.innerHTML = '<div style="text-align:center">Carregando base de usuários...</div>';
    await carregarListaUsuarios();
  }
  mostrarFormularioUsuario(container);
}

function carregarListaUsuarios() {
  return new Promise((resolve) => {
    const callbackName = 'listarUsuarios_' + Date.now();
    window[callbackName] = function(usuarios) {
      delete window[callbackName];
      usuariosCache = usuarios || [];
      resolve();
    };
    const script = document.createElement('script');
    script.src = `${URL_PLANILHA}?acao=admin_listar_usuarios&callback=${callbackName}`;
    document.body.appendChild(script);
  });
}

function mostrarFormularioUsuario(container) {
  container.innerHTML = `
    <div class="admin-form">
      <h4>🔍 Buscar Usuário por Matrícula (Chapa)</h4>
      <div class="form-row">
        <input type="text" id="busca-matricula" placeholder="Digite a matrícula (ex: 27610)" style="flex:2">
        <button id="btn-buscar-usuario" class="btn-editar">Buscar</button>
        <button id="btn-listar-todos-usuarios" class="btn-secundario">📋 Listar Todos</button>
      </div>
    </div>
    <div id="resultado-usuario"></div>
  `;
  document.getElementById('btn-buscar-usuario').addEventListener('click', () => buscarUsuarioPorMatricula());
  document.getElementById('btn-listar-todos-usuarios').addEventListener('click', () => listarTodosUsuarios());
}

function buscarUsuarioPorMatricula() {
  const matricula = document.getElementById('busca-matricula').value.trim();
  if (!matricula) { alert("Digite a matrícula."); return; }
  const usuario = usuariosCache.find(u => String(u.matricula) === matricula);
  if (!usuario) {
    document.getElementById('resultado-usuario').innerHTML = `<p>❌ Nenhum usuário encontrado com a matrícula ${matricula}.</p>`;
    return;
  }
  exibirUsuarioParaEdicao(usuario);
}

function listarTodosUsuarios() {
  if (usuariosCache.length === 0) return;
  let html = `<table class="admin-table"><thead><tr><th>Matrícula</th><th>Apelido</th><th>Nome</th><th>Função</th><th>Ativo</th><th>Ações</th></tr></thead><tbody>`;
  usuariosCache.forEach(u => {
    html += `
      <tr data-apelido="${u.apelido}">
        <td>${u.matricula}</td>
        <td>${u.apelido}</td>
        <td>${u.nome}</td>
        <td><select class="edit-funcao">${gerarOpcoesFuncao(u.funcao)}</select></td>
        <td><select class="edit-ativo">
          <option value="SIM" ${u.ativo === 'SIM' ? 'selected' : ''}>SIM</option>
          <option value="NÃO" ${u.ativo === 'NÃO' ? 'selected' : ''}>NÃO</option>
        </select></td>
        <td>
          <button class="btn-salvar" onclick="salvarEdicaoUsuario('${u.apelido}')">Salvar</button>
          <button class="btn-editar" onclick="resetarSenhaUsuario('${u.apelido}')">Resetar Senha</button>
        </td>
      </tr>`;
  });
  html += `</tbody></table>`;
  document.getElementById('resultado-usuario').innerHTML = html;
}

function exibirUsuarioParaEdicao(usuario) {
  const html = `
    <div class="admin-form">
      <h4>✏️ Editando Usuário: ${usuario.apelido} (${usuario.matricula})</h4>
      <div class="form-row">
        <label>Matrícula:</label><input type="text" id="edit-matricula" value="${usuario.matricula}" disabled>
        <label>Apelido:</label><input type="text" id="edit-apelido" value="${usuario.apelido}" disabled>
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
      <div class="form-row">
        <button id="btn-salvar-edicao" class="btn-salvar">Salvar Alterações</button>
        <button id="btn-resetar-senha" class="btn-editar">Resetar Senha</button>
        <button id="btn-cancelar" class="btn-cancelar">Cancelar</button>
      </div>
    </div>
  `;
  const container = document.getElementById('resultado-usuario');
  container.innerHTML = html;
  document.getElementById('btn-salvar-edicao').addEventListener('click', () => salvarEdicaoUsuarioCompleta(usuario.apelido));
  document.getElementById('btn-resetar-senha').addEventListener('click', () => resetarSenhaUsuario(usuario.apelido));
  document.getElementById('btn-cancelar').addEventListener('click', () => mostrarFormularioUsuario(document.getElementById('admin-panel-body')));
}

async function salvarEdicaoUsuarioCompleta(apelido) {
  const novoNome = document.getElementById('edit-nome').value.trim();
  const novaFuncao = document.getElementById('edit-funcao').value;
  const novoAtivo = document.getElementById('edit-ativo').value;
  if (!novoNome) { alert("O nome não pode ficar vazio."); return; }
  const dados = { acao: 'atualizar', apelido, campos: { nome: novoNome, funcao: novaFuncao, ativo: novoAtivo } };
  const resposta = await enviarAdminPost('admin_usuarios', dados);
  if (resposta && resposta.sucesso) {
    alert("Usuário atualizado com sucesso!");
    await carregarListaUsuarios(); // recarrega cache
    mostrarFormularioUsuario(document.getElementById('admin-panel-body'));
  } else {
    alert(resposta?.erro || "Erro ao atualizar usuário.");
  }
}

async function salvarEdicaoUsuario(apelido) {
  const row = document.querySelector(`tr[data-apelido="${apelido}"]`);
  if (!row) return;
  const novaFuncao = row.querySelector('.edit-funcao').value;
  const novoAtivo = row.querySelector('.edit-ativo').value;
  const dados = { acao: 'atualizar', apelido, campos: { funcao: novaFuncao, ativo: novoAtivo } };
  const resposta = await enviarAdminPost('admin_usuarios', dados);
  if (resposta && resposta.sucesso) {
    alert("Usuário atualizado!");
    await carregarListaUsuarios();
    listarTodosUsuarios();
  } else {
    alert(resposta?.erro || "Erro ao atualizar");
  }
}

async function resetarSenhaUsuario(apelido) {
  const novaSenha = prompt(`Digite a nova senha para ${apelido}:`);
  if (!novaSenha) return;
  const dados = { acao: 'resetar_senha', apelido, novaSenha };
  const resposta = await enviarAdminPost('admin_usuarios', dados);
  if (resposta && resposta.sucesso) {
    alert("Senha resetada com sucesso!");
  } else {
    alert(resposta?.erro || "Erro ao resetar senha");
  }
}

function gerarOpcoesFuncao(atual) {
  const funcoes = ['FISCAL', 'INSPETOR', 'ADMIN', 'GERENTE', 'ENCARREGADO', 'SAF', 'MONITOR'];
  return funcoes.map(f => `<option value="${f}" ${f === atual ? 'selected' : ''}>${f}</option>`).join('');
}

// ======================= GESTÃO DE TERMINAIS =======================
let terminaisCache = [];

async function carregarGestaoTerminais(container) {
  if (terminaisCache.length === 0) {
    container.innerHTML = '<div style="text-align:center">Carregando base de terminais...</div>';
    await carregarListaTerminais();
  }
  mostrarFormularioTerminal(container);
}

function carregarListaTerminais() {
  return new Promise((resolve) => {
    const callbackName = 'listarTerminaisCompletos_' + Date.now();
    window[callbackName] = function(terminais) {
      delete window[callbackName];
      terminaisCache = terminais || [];
      resolve();
    };
    const script = document.createElement('script');
    script.src = `${URL_PLANILHA}?acao=admin_listar_terminais_completos&callback=${callbackName}`;
    document.body.appendChild(script);
  });
}

function mostrarFormularioTerminal(container) {
  container.innerHTML = `
    <div class="admin-form">
      <h4>🔍 Buscar Terminal por Nome</h4>
      <div class="form-row">
        <input type="text" id="busca-terminal" placeholder="Nome do terminal (ex: Vila Yara 1)" style="flex:2">
        <button id="btn-buscar-terminal" class="btn-editar">Buscar</button>
        <button id="btn-listar-todos-terminais" class="btn-secundario">📋 Listar Todos</button>
      </div>
    </div>
    <div id="resultado-terminal"></div>
  `;
  document.getElementById('btn-buscar-terminal').addEventListener('click', () => buscarTerminalPorNome());
  document.getElementById('btn-listar-todos-terminais').addEventListener('click', () => listarTodosTerminais());
}

function buscarTerminalPorNome() {
  const nome = document.getElementById('busca-terminal').value.trim().toLowerCase();
  if (!nome) { alert("Digite o nome do terminal."); return; }
  const terminais = terminaisCache.filter(t => t.terminal.toLowerCase().includes(nome));
  if (terminais.length === 0) {
    document.getElementById('resultado-terminal').innerHTML = `<p>❌ Nenhum terminal encontrado com "${nome}".</p>`;
    return;
  }
  exibirListaTerminais(terminais);
}

function listarTodosTerminais() {
  exibirListaTerminais(terminaisCache);
}

function exibirListaTerminais(terminais) {
  let html = `<table class="admin-table"><thead><tr><th>ID</th><th>Nome do Terminal</th><th>Status</th><th>Ações</th></tr></thead><tbody>`;
  terminais.forEach(t => {
    html += `
      <tr data-id="${t.id}">
        <td>${t.id}</td>
        <td><input type="text" class="edit-terminal-nome" value="${t.terminal.replace(/"/g, '&quot;')}" style="width:100%"></td>
        <td>
          <select class="edit-terminal-status">
            <option value="SIM" ${t.status === 'SIM' ? 'selected' : ''}>SIM</option>
            <option value="NÃO" ${t.status === 'NÃO' ? 'selected' : ''}>NÃO</option>
          </select>
        </td>
        <td><button class="btn-salvar" onclick="salvarEdicaoTerminal(${t.id})">Salvar</button></td>
      </tr>`;
  });
  html += `</tbody></table>`;
  document.getElementById('resultado-terminal').innerHTML = html;
}

async function salvarEdicaoTerminal(id) {
  const row = document.querySelector(`tr[data-id="${id}"]`);
  if (!row) return;
  const novoNome = row.querySelector('.edit-terminal-nome').value.trim();
  const novoStatus = row.querySelector('.edit-terminal-status').value;
  if (!novoNome) { alert("Nome não pode ficar vazio."); return; }
  const dados = { acao: 'editar', id, nome: novoNome, status: novoStatus };
  const resposta = await enviarAdminPost('admin_terminais', dados);
  if (resposta && resposta.sucesso) {
    alert("Terminal atualizado!");
    await carregarListaTerminais();
    listarTodosTerminais();
  } else {
    alert(resposta?.erro || "Erro ao atualizar terminal");
  }
}

// ======================= FUNÇÃO AUXILIAR PARA POST ADMIN =======================
function enviarAdminPost(endpoint, dados) {
  return new Promise((resolve) => {
    const callbackName = 'adminPost_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    window[callbackName] = (resposta) => {
      delete window[callbackName];
      resolve(resposta);
    };
    const formData = new URLSearchParams();
    formData.append('acao', endpoint);
    formData.append('dados', JSON.stringify(dados));
    formData.append('callback', callbackName);
    const script = document.createElement('script');
    script.src = `${URL_PLANILHA}?${formData.toString()}`;
    script.onerror = () => {
      delete window[callbackName];
      resolve({ erro: 'Erro de conexão' });
    };
    document.body.appendChild(script);
  });
}

// ======================= FECHAR MODAL ADMIN =======================
function fecharModalAdmin() {
  const modal = document.getElementById('modal-admin-panel');
  if (modal) modal.classList.remove('is-open');
}

// Exportar funções para uso global (onclick)
window.salvarEdicaoUsuario = salvarEdicaoUsuario;
window.resetarSenhaUsuario = resetarSenhaUsuario;
window.salvarEdicaoTerminal = salvarEdicaoTerminal;

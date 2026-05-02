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

// ======================= GESTÃO DE USUÁRIOS (com busca) =======================
let usuariosAdminCache = [];

async function carregarGestaoUsuarios(container) {
  // Carrega a lista de usuários em segundo plano (cache)
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

  // Monta a interface sem exibir a lista completa
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
      <h3>🔍 BUSCAR USUÁRIO POR MATRÍCULA</h3>
      <div class="admin-form">
        <div class="form-row">
          <input type="text" id="busca-matricula" placeholder="Matrícula" style="flex:2">
          <button id="btn-buscar-usuario" class="btn-editar">Buscar</button>
        </div>
      </div>
      <div id="resultado-usuario">
        <p style="color: #888;">Nenhum usuário selecionado. Digite uma matrícula e clique em Buscar.</p>
      </div>
    </div>
  `;

  document.getElementById('btn-criar-usuario').onclick = () => criarUsuarioAdmin();
  document.getElementById('btn-buscar-usuario').onclick = () => buscarUsuarioPorMatricula();
}

function buscarUsuarioPorMatricula() {
  const matricula = document.getElementById('busca-matricula').value.trim();
  const resultadoDiv = document.getElementById('resultado-usuario');
  if (!matricula) {
    resultadoDiv.innerHTML = '<p style="color: red;">Digite uma matrícula.</p>';
    return;
  }
  const usuario = usuariosAdminCache.find(u => String(u.matricula) === matricula);
  if (!usuario) {
    resultadoDiv.innerHTML = `<p style="color: red;">❌ Usuário com matrícula ${matricula} não encontrado.</p>`;
    return;
  }
  resultadoDiv.innerHTML = `
    <div class="admin-form">
      <h4>✏️ Editando: ${usuario.apelido}</h4>
      <div class="form-row">
        <label>Matrícula:</label><input type="text" value="${usuario.matricula}" disabled>
        <label>Apelido:</label><input type="text" value="${usuario.apelido}" disabled>
        <label>Nome:</label><input type="text" id="edit-nome" value="${usuario.nome.replace(/"/g, '&quot;')}">
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
      <button id="salvar-edicao-usuario" class="btn-salvar">SALVAR</button>
    </div>
  `;
  document.getElementById('salvar-edicao-usuario').onclick = () => salvarUsuarioEditado(usuario.apelido);
}

async function salvarUsuarioEditado(apelido) {
  const nome = document.getElementById('edit-nome').value.trim();
  const funcao = document.getElementById('edit-funcao').value;
  const ativo = document.getElementById('edit-ativo').value;
  if (!nome) { alert("Nome não pode ficar vazio."); return; }
  const resposta = await enviarAdminPost('admin_usuarios', { acao: 'atualizar', apelido, campos: { nome, funcao, ativo } });
  if (resposta && resposta.sucesso) {
    alert("Usuário atualizado!");
    // Recarrega o cache e limpa a busca
    await recarregarCacheUsuarios();
    document.getElementById('busca-matricula').value = '';
    document.getElementById('resultado-usuario').innerHTML = '<p style="color: #888;">Nenhum usuário selecionado. Digite uma matrícula e clique em Buscar.</p>';
  } else {
    alert(resposta?.erro || "Erro ao atualizar");
  }
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
    // Limpa formulário e recarrega cache
    document.getElementById('novo-matricula').value = '';
    document.getElementById('novo-nome').value = '';
    document.getElementById('novo-apelido').value = '';
    document.getElementById('nova-senha').value = '';
    await recarregarCacheUsuarios();
  } else {
    alert(resposta?.erro || "Erro ao criar usuário");
  }
}

function gerarOpcoesFuncao(atual) {
  const funcoes = ['FISCAL', 'INSPETOR', 'ADMIN', 'GERENTE', 'ENCARREGADO', 'SAF', 'MONITOR'];
  return funcoes.map(f => `<option value="${f}" ${f === atual ? 'selected' : ''}>${f}</option>`).join('');
}

async function recarregarCacheUsuarios() {
  await new Promise((resolve) => {
    const callback = 'recarregaUsuarios_' + Date.now();
    window[callback] = (dados) => {
      usuariosAdminCache = dados || [];
      delete window[callback];
      resolve();
    };
    const script = document.createElement('script');
    script.src = `${URL_PLANILHA}?acao=admin_listar_usuarios&callback=${callback}`;
    document.body.appendChild(script);
  });
}

// ======================= GESTÃO DE TERMINAIS (com busca) =======================
let terminaisAdminCache = [];

async function carregarGestaoTerminais(container) {
  // Carrega a lista completa de terminais em background
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
      <h3>🔍 BUSCAR TERMINAL POR NOME</h3>
      <div class="admin-form">
        <div class="form-row">
          <input type="text" id="busca-terminal-nome" placeholder="Nome do terminal (ou parte)" style="flex:2">
          <button id="btn-buscar-terminal" class="btn-editar">Buscar</button>
        </div>
      </div>
      <div id="resultado-terminal">
        <p style="color: #888;">Nenhum terminal selecionado. Digite um nome e clique em Buscar.</p>
      </div>
    </div>
  `;

  document.getElementById('btn-criar-terminal').onclick = () => criarTerminalAdmin();
  document.getElementById('btn-buscar-terminal').onclick = () => buscarTerminalPorNome();
}

function buscarTerminalPorNome() {
  const nomeBusca = document.getElementById('busca-terminal-nome').value.trim().toLowerCase();
  const resultadoDiv = document.getElementById('resultado-terminal');
  if (!nomeBusca) {
    resultadoDiv.innerHTML = '<p style="color: red;">Digite um nome de terminal.</p>';
    return;
  }
  const filtrados = terminaisAdminCache.filter(t => t.terminal.toLowerCase().includes(nomeBusca));
  if (filtrados.length === 0) {
    resultadoDiv.innerHTML = `<p style="color: red;">❌ Nenhum terminal encontrado com "${nomeBusca}".</p>`;
    return;
  }
  // Exibe tabela com os resultados
  let html = `<table class="admin-table"><thead><tr><th>TERMINAL</th><th>STATUS (ATIVO)</th><th>AÇÃO</th></tr></thead><tbody>`;
  filtrados.forEach(t => {
    html += `
      <tr data-id="${t.id}">
        <td><input type="text" class="edit-term-nome" value="${t.terminal.replace(/"/g, '&quot;')}" style="width:100%"></td>
        <td>
          <select class="edit-term-status">
            <option value="SIM" ${t.status === 'SIM' ? 'selected' : ''}>SIM (Ativo)</option>
            <option value="NÃO" ${t.status === 'NÃO' ? 'selected' : ''}>NÃO (Inativo)</option>
          </select>
        </td>
        <td><button class="btn-salvar" onclick="salvarTerminalEditado(${t.id}, this)">SALVAR</button></td>
      </tr>
    `;
  });
  html += `</tbody></table>`;
  resultadoDiv.innerHTML = html;
}

async function criarTerminalAdmin() {
  const nome = document.getElementById('novo-terminal-nome').value.trim();
  const status = document.getElementById('novo-terminal-status').value;
  if (!nome) { alert("Digite o nome do terminal."); return; }
  const resposta = await enviarAdminPost('admin_terminais', { acao: 'adicionar', nome, status });
  if (resposta && resposta.sucesso) {
    alert("Terminal adicionado!");
    document.getElementById('novo-terminal-nome').value = '';
    await recarregarCacheTerminais();
    document.getElementById('busca-terminal-nome').value = '';
    document.getElementById('resultado-terminal').innerHTML = '<p style="color: #888;">Nenhum terminal selecionado. Digite um nome e clique em Buscar.</p>';
  } else {
    alert(resposta?.erro || "Erro ao adicionar terminal");
  }
}

window.salvarTerminalEditado = async function(id, btn) {
  const row = btn.closest('tr');
  const nome = row.querySelector('.edit-term-nome').value.trim();
  const status = row.querySelector('.edit-term-status').value;
  if (!nome) { alert("Nome não pode ficar vazio."); return; }
  const resposta = await enviarAdminPost('admin_terminais', { acao: 'editar', id, nome, status });
  if (resposta && resposta.sucesso) {
    alert("Terminal atualizado!");
    await recarregarCacheTerminais();
    // recarrega a busca com o mesmo termo (opcional)
    const termo = document.getElementById('busca-terminal-nome').value.trim();
    if (termo) buscarTerminalPorNome();
    else document.getElementById('resultado-terminal').innerHTML = '<p style="color: #888;">Nenhum terminal selecionado. Digite um nome e clique em Buscar.</p>';
  } else {
    alert(resposta?.erro || "Erro ao atualizar terminal");
  }
};

async function recarregarCacheTerminais() {
  await new Promise((resolve) => {
    const callback = 'recarregaTerminais_' + Date.now();
    window[callback] = (dados) => {
      terminaisAdminCache = dados || [];
      delete window[callback];
      resolve();
    };
    const script = document.createElement('script');
    script.src = `${URL_PLANILHA}?acao=admin_listar_terminais_completos&callback=${callback}`;
    document.body.appendChild(script);
  });
}

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

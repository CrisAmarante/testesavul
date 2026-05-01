// ====================================================================
// ADMIN.JS - PAINEL DE ADMINISTRAÇÃO (APENAS PARA PERFIL ADMIN)
// ====================================================================

// Abre o modal de administração com segunda validação
function abrirModalAdmin() {
  const senhaAdmin = prompt("🔐 Acesso restrito. Digite a senha de administrador:");
  console.log('Enviando requisição para verificar admin com senha:', senhaAdmin);//***
  if (!senhaAdmin) return;

  const callbackName = 'verificarAdmin_' + Date.now();
  console.log('Resposta do servidor:', resposta);
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
}

// Carrega o conteúdo do painel administrativo (modal)
function carregarPainelAdmin() {
  const modal = getEl('modal-admin-panel');
  const container = getEl('admin-panel-conteudo');
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

  // Eventos das abas
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const aba = tab.dataset.tab;
      carregarAbaAdmin(aba);
    });
  });
}

// Carrega o conteúdo de cada aba
async function carregarAbaAdmin(aba) {
  const body = getEl('admin-panel-body');
  if (!body) return;

  switch(aba) {
    case 'usuarios':
      await carregarGestaoUsuarios(body);
      break;
    case 'terminais':
      await carregarGestaoTerminais(body);
      break;
    case 'botoes':
      body.innerHTML = '<p>Funcionalidade em breve</p>';
      break;
    case 'visibilidade':
      body.innerHTML = '<p>Funcionalidade em breve</p>';
      break;
    case 'config':
      body.innerHTML = '<p>Funcionalidade em breve</p>';
      break;
    default:
      body.innerHTML = '<p>Selecione uma aba</p>';
  }
}

// ======================= GESTÃO DE USUÁRIOS =======================
async function carregarGestaoUsuarios(container) {
  container.innerHTML = '<div style="text-align:center">Carregando usuários...</div>';
  
  const callbackName = 'listarUsuarios_' + Date.now();
  window[callbackName] = function(usuarios) {
    delete window[callbackName];
    if (!usuarios || usuarios.erro) {
      container.innerHTML = '<p>Erro ao carregar usuários</p>';
      return;
    }
    const html = `
      <div class="admin-form">
        <h4>➕ Novo Usuário</h4>
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
      <table class="admin-table">
        <thead><tr><th>Matrícula</th><th>Apelido</th><th>Nome</th><th>Função</th><th>Ativo</th><th>Ações</th></tr></thead>
        <tbody id="tabela-usuarios-body">
          ${usuarios.map(u => `
            <tr data-apelido="${u.apelido}">
              <td>${u.matricula}</td>
              <td>${u.apelido}</td>
              <td>${u.nome}</td>
              <td><select class="edit-funcao">${gerarOpcoesFuncao(u.funcao)}</select></td>
              <td><select class="edit-ativo"><option value="SIM" ${u.ativo === 'SIM' ? 'selected' : ''}>SIM</option><option value="NÃO" ${u.ativo === 'NÃO' ? 'selected' : ''}>NÃO</option></select></td>
              <td>
                <button class="btn-editar" onclick="salvarEdicaoUsuario('${u.apelido}')">Salvar</button>
                <button class="btn-editar" onclick="resetarSenhaUsuario('${u.apelido}')">Resetar Senha</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    container.innerHTML = html;
    document.getElementById('btn-criar-usuario')?.addEventListener('click', criarUsuario);
  };

  const script = document.createElement('script');
  script.src = `${URL_PLANILHA}?acao=admin_listar_usuarios&callback=${callbackName}`;
  document.body.appendChild(script);
}

function gerarOpcoesFuncao(atual) {
  const funcoes = ['FISCAL', 'INSPETOR', 'ADMIN', 'GERENTE', 'ENCARREGADO', 'SAF', 'MONITOR'];
  return funcoes.map(f => `<option value="${f}" ${f === atual ? 'selected' : ''}>${f}</option>`).join('');
}

async function criarUsuario() {
  const matricula = document.getElementById('novo-matricula')?.value.trim();
  const nome = document.getElementById('novo-nome')?.value.trim();
  const apelido = document.getElementById('novo-apelido')?.value.trim();
  const senha = document.getElementById('nova-senha')?.value;
  const funcao = document.getElementById('nova-funcao')?.value;

  if (!matricula || !nome || !apelido || !senha || !funcao) {
    alert('Preencha todos os campos.');
    return;
  }

  const dados = { acao: 'criar', matricula, nome, apelido, senha, funcao, ativo: 'SIM' };
  
  const resposta = await enviarAdminPost('admin_usuarios', dados);
  if (resposta && resposta.sucesso) {
    alert('Usuário criado com sucesso!');
    carregarGestaoUsuarios(getEl('admin-panel-body'));
  } else {
    alert(resposta?.erro || 'Erro ao criar usuário');
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
    alert('Usuário atualizado!');
    carregarGestaoUsuarios(getEl('admin-panel-body'));
  } else {
    alert(resposta?.erro || 'Erro ao atualizar');
  }
}

async function resetarSenhaUsuario(apelido) {
  const novaSenha = prompt(`Digite a nova senha para ${apelido}:`);
  if (!novaSenha) return;

  const dados = { acao: 'resetar_senha', apelido, novaSenha };
  const resposta = await enviarAdminPost('admin_usuarios', dados);
  if (resposta && resposta.sucesso) {
    alert('Senha resetada com sucesso!');
  } else {
    alert(resposta?.erro || 'Erro ao resetar senha');
  }
}

// ======================= GESTÃO DE TERMINAIS =======================
async function carregarGestaoTerminais(container) {
  container.innerHTML = '<div style="text-align:center">Carregando terminais...</div>';
  
  const callbackName = 'listarTerminais_' + Date.now();
  window[callbackName] = function(terminais) {
    delete window[callbackName];
    if (!terminais || terminais.erro) {
      container.innerHTML = '<p>Erro ao carregar terminais</p>';
      return;
    }
    const html = `
      <div class="admin-form">
        <h4>➕ Novo Terminal</h4>
        <div class="form-row">
          <input type="text" id="novo-terminal-nome" placeholder="Nome do terminal" style="flex:2">
          <select id="novo-terminal-status" style="flex:1">
            <option value="SIM">SIM</option>
            <option value="NÃO">NÃO</option>
          </select>
          <button id="btn-criar-terminal" class="btn-salvar">Adicionar</button>
        </div>
      </div>
      <table class="admin-table">
        <thead><tr><th>#</th><th>Terminal</th><th>Status</th><th>Ações</th></tr></thead>
        <tbody id="tabela-terminais-body">
          ${terminais.map(t => `
            <tr data-id="${t.id}">
              <td>${t.id}</td>
              <td><input type="text" class="edit-terminal-nome" value="${t.terminal.replace(/"/g, '&quot;')}" style="width:100%"></td>
              <td><select class="edit-terminal-status">
                <option value="SIM" ${t.status === 'SIM' ? 'selected' : ''}>SIM</option>
                <option value="NÃO" ${t.status === 'NÃO' ? 'selected' : ''}>NÃO</option>
              </select></td>
              <td><button class="btn-editar" onclick="salvarEdicaoTerminal(${t.id})">Salvar</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    container.innerHTML = html;
    document.getElementById('btn-criar-terminal')?.addEventListener('click', criarTerminal);
  };

  const script = document.createElement('script');
  script.src = `${URL_PLANILHA}?acao=admin_listar_terminais_completos&callback=${callbackName}`;
  document.body.appendChild(script);
}

async function criarTerminal() {
  const nome = document.getElementById('novo-terminal-nome')?.value.trim();
  const status = document.getElementById('novo-terminal-status')?.value;
  if (!nome) { alert('Digite o nome do terminal.'); return; }

  const dados = { acao: 'adicionar', nome, status };
  const resposta = await enviarAdminPost('admin_terminais', dados);
  if (resposta && resposta.sucesso) {
    alert('Terminal adicionado!');
    carregarGestaoTerminais(getEl('admin-panel-body'));
  } else {
    alert(resposta?.erro || 'Erro ao adicionar terminal');
  }
}

async function salvarEdicaoTerminal(id) {
  const row = document.querySelector(`tr[data-id="${id}"]`);
  if (!row) return;
  const novoNome = row.querySelector('.edit-terminal-nome').value.trim();
  const novoStatus = row.querySelector('.edit-terminal-status').value;
  if (!novoNome) { alert('Nome não pode ficar vazio.'); return; }

  const dados = { acao: 'editar', id, nome: novoNome, status: novoStatus };
  const resposta = await enviarAdminPost('admin_terminais', dados);
  if (resposta && resposta.sucesso) {
    alert('Terminal atualizado!');
    carregarGestaoTerminais(getEl('admin-panel-body'));
  } else {
    alert(resposta?.erro || 'Erro ao atualizar terminal');
  }
}

// ======================= FUNÇÃO AUXILIAR PARA POST ADMIN =======================
async function enviarAdminPost(endpoint, dados) {
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
  const modal = getEl('modal-admin-panel');
  if (modal) modal.classList.remove('is-open');
}

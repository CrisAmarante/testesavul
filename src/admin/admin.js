/**
 * Módulo de Administração do Sistema
 * Gerencia painel administrativo, edição de botões e configurações
 */

// ====================================================================
// VARIÁVEIS GLOBAIS DO MÓDULO ADMIN
// ====================================================================
let adminData = {
  botoes: {
    clandestinos: [],
    levantamentos: [],
    inspecoes5s: []
  },
  timeout: 900000, // 15 minutos
  modoDebug: false
};

// ====================================================================
// API DE COMUNICAÇÃO COM BACKEND (Admin)
// ====================================================================
async function adminGetConfigAPI() {
  return new Promise((resolve, reject) => {
    const callbackName = 'adminGetConfigCallback_' + Date.now();
    
    window[callbackName] = function(resposta) {
      delete window[callbackName];
      if (resposta && resposta.sucesso) {
        resolve(resposta.dados);
      } else {
        reject(new Error(resposta?.erro || 'Falha ao obter configurações'));
      }
    };
    
    const script = document.createElement('script');
    script.src = `${URL_PLANILHA}?acao=admin_get_config&callback=${callbackName}&_=${Date.now()}`;
    script.onerror = () => {
      delete window[callbackName];
      reject(new Error('Erro de rede ao buscar configurações'));
    };
    document.body.appendChild(script);
  });
}

async function adminSaveConfigAPI(dados) {
  return new Promise((resolve, reject) => {
    const formData = new URLSearchParams();
    formData.append('acao', 'admin_save_config');
    formData.append('dados', JSON.stringify(dados));
    
    fetch(URL_PLANILHA, {
      method: 'POST',
      body: formData,
      mode: 'no-cors'
    })
    .then(() => {
      resolve({ sucesso: true, mensagem: 'Configurações salvas com sucesso!' });
    })
    .catch(err => {
      reject(new Error('Erro ao salvar configurações: ' + err.message));
    });
  });
}

// ====================================================================
// API DE USUÁRIOS (Admin)
// ====================================================================
async function adminGetUsuariosAPI(filtro = '') {
  return new Promise((resolve, reject) => {
    const callbackName = 'adminGetUsuariosCallback_' + Date.now();
    
    window[callbackName] = function(resposta) {
      delete window[callbackName];
      if (resposta && resposta.sucesso) {
        resolve(resposta.usuarios);
      } else {
        reject(new Error(resposta?.erro || 'Falha ao obter usuários'));
      }
    };
    
    const script = document.createElement('script');
    const url = filtro 
      ? `${URL_PLANILHA}?acao=admin_get_usuarios&filtro=${encodeURIComponent(filtro)}&callback=${callbackName}&_=${Date.now()}`
      : `${URL_PLANILHA}?acao=admin_get_usuarios&callback=${callbackName}&_=${Date.now()}`;
    script.src = url;
    script.onerror = () => {
      delete window[callbackName];
      reject(new Error('Erro de rede ao buscar usuários'));
    };
    document.body.appendChild(script);
  });
}

async function adminSaveUsuarioAPI(usuario) {
  return new Promise((resolve, reject) => {
    const formData = new URLSearchParams();
    formData.append('acao', 'admin_save_usuario');
    formData.append('dados', JSON.stringify(usuario));
    
    fetch(URL_PLANILHA, {
      method: 'POST',
      body: formData,
      mode: 'no-cors'
    })
    .then(() => {
      resolve({ sucesso: true, mensagem: 'Usuário salvo com sucesso!' });
    })
    .catch(err => {
      reject(new Error('Erro ao salvar usuário: ' + err.message));
    });
  });
}

async function adminCreateUsuarioAPI(usuario) {
  return new Promise((resolve, reject) => {
    const formData = new URLSearchParams();
    formData.append('acao', 'admin_create_usuario');
    formData.append('dados', JSON.stringify(usuario));
    
    fetch(URL_PLANILHA, {
      method: 'POST',
      body: formData,
      mode: 'no-cors'
    })
    .then(() => {
      resolve({ sucesso: true, mensagem: 'Usuário criado com sucesso!' });
    })
    .catch(err => {
      reject(new Error('Erro ao criar usuário: ' + err.message));
    });
  });
}

async function adminDeleteUsuarioAPI(apelido) {
  return new Promise((resolve, reject) => {
    const formData = new URLSearchParams();
    formData.append('acao', 'admin_delete_usuario');
    formData.append('apelido', apelido);
    
    fetch(URL_PLANILHA, {
      method: 'POST',
      body: formData,
      mode: 'no-cors'
    })
    .then(() => {
      resolve({ sucesso: true, mensagem: 'Usuário excluído com sucesso!' });
    })
    .catch(err => {
      reject(new Error('Erro ao excluir usuário: ' + err.message));
    });
  });
}

async function adminToggleUsuarioAPI(apelido, ativo) {
  return new Promise((resolve, reject) => {
    const formData = new URLSearchParams();
    formData.append('acao', 'admin_toggle_usuario');
    formData.append('apelido', apelido);
    formData.append('ativo', ativo ? 'SIM' : 'NAO');
    
    fetch(URL_PLANILHA, {
      method: 'POST',
      body: formData,
      mode: 'no-cors'
    })
    .then(() => {
      resolve({ sucesso: true, mensagem: `Usuário ${ativo ? 'habilitado' : 'desabilitado'} com sucesso!` });
    })
    .catch(err => {
      reject(new Error('Erro ao alterar status do usuário: ' + err.message));
    });
  });
}

// ====================================================================
// CONTROLLER DO MODAL DE ADMINISTRAÇÃO
// ====================================================================
class AdminPanelController {
  constructor() {
    this.modalElement = null;
    this.contentElement = null;
    this.configCarregada = false;
  }

  async init() {
    this.modalElement = getEl('modal-admin-panel');
    this.contentElement = getEl('admin-panel-conteudo');
    
    if (!this.modalElement || !this.contentElement) {
      console.error('Elementos do painel admin não encontrados');
      return false;
    }
    
    // Carrega configurações do backend
    await this.carregarConfiguracoes();
    
    return true;
  }

  async carregarConfiguracoes() {
    try {
      const config = await adminGetConfigAPI();
      adminData.botoes = config.botoes || { clandestinos: [], levantamentos: [], inspecoes5s: [] };
      adminData.timeout = config.timeout || 900000;
      adminData.modoDebug = config.modoDebug || false;
      this.configCarregada = true;
      console.log('✅ Configurações admin carregadas:', adminData);
    } catch (err) {
      console.warn('⚠️ Falha ao carregar configurações do servidor, usando fallback local:', err);
      // Fallback: tenta carregar do localStorage
      const botoesSalvos = JSON.parse(localStorage.getItem('adminBotoes') || '{}');
      if (Object.keys(botoesSalvos).length > 0) {
        adminData.botoes = botoesSalvos;
      }
      const timeoutLocal = localStorage.getItem('adminTimeout');
      if (timeoutLocal) adminData.timeout = parseInt(timeoutLocal, 10);
      const debugLocal = localStorage.getItem('adminModoDebug');
      if (debugLocal) adminData.modoDebug = debugLocal === 'true';
      this.configCarregada = true;
    }
  }

  async salvarConfiguracoes() {
    try {
      await adminSaveConfigAPI({
        botoes: adminData.botoes,
        timeout: adminData.timeout,
        modoDebug: adminData.modoDebug
      });
      
      // Atualiza localStorage como cache
      localStorage.setItem('adminBotoes', JSON.stringify(adminData.botoes));
      localStorage.setItem('adminTimeout', String(adminData.timeout));
      localStorage.setItem('adminModoDebug', String(adminData.modoDebug));
      
      alert('✅ Configurações salvas com sucesso!');
      return true;
    } catch (err) {
      console.error('❌ Erro ao salvar configurações:', err);
      alert('⚠️ Erro ao salvar configurações. Verifique sua conexão.');
      return false;
    }
  }

  open() {
    if (!this.init()) return;
    
    // Verifica se usuário é ADMIN
    const role = window.currentUserRole || localStorage.getItem('inspectorRole');
    if (role !== 'ADMIN') {
      alert('⛔ Acesso restrito a administradores.');
      return;
    }
    
    this.render();
    this.modalElement.style.display = 'flex';
  }

  close() {
    if (this.modalElement) {
      this.modalElement.style.display = 'none';
    }
  }

  render() {
    if (!this.contentElement) return;
    
    this.contentElement.innerHTML = `
      <div class="admin-tabs">
        <button class="admin-tab active" data-tab="botoes">🔘 Botões</button>
        <button class="admin-tab" data-tab="usuarios">👥 Usuários</button>
        <button class="admin-tab" data-tab="config">⚙️ Configurações</button>
      </div>
      <div class="admin-tab-content" id="tab-botoes">
        ${this.renderTabBotoes()}
      </div>
      <div class="admin-tab-content" id="tab-usuarios" style="display:none;">
        ${this.renderTabUsuarios()}
      </div>
      <div class="admin-tab-content" id="tab-config" style="display:none;">
        ${this.renderTabConfig()}
      </div>
    `;
    
    this.attachTabListeners();
  }

  renderTabBotoes() {
    // Renderiza botões a partir dos dados carregados
    setTimeout(() => this.renderizarListaBotoes(), 100);
    
    return `
      <h3>Gerenciar Botões da Tela Inicial</h3>
      <div class="admin-section">
        <h4>Clandestinos/RTO</h4>
        <div id="admin-botoes-clandestinos"></div>
        <button class="btn-admin-add" onclick="adminPanel.adicionarBotao('clandestinos')">+ Adicionar</button>
      </div>
      <div class="admin-section">
        <h4>Levantamentos</h4>
        <div id="admin-botoes-levantamentos"></div>
        <button class="btn-admin-add" onclick="adminPanel.adicionarBotao('levantamentos')">+ Adicionar</button>
      </div>
      <div class="admin-section">
        <h4>Inspeções 5S</h4>
        <div id="admin-botoes-inspecoes5s"></div>
        <button class="btn-admin-add" onclick="adminPanel.adicionarBotao('inspecoes5s')">+ Adicionar</button>
      </div>
      <div class="admin-actions">
        <button class="btn-principal" onclick="adminPanel.salvarBotoes()">💾 Salvar Alterações</button>
      </div>
    `;
  }

  renderizarListaBotoes() {
    ['clandestinos', 'levantamentos', 'inspecoes5s'].forEach(tipo => {
      const container = getEl(`admin-botoes-${tipo}`);
      if (!container) return;
      
      container.innerHTML = '';
      const botoes = adminData.botoes[tipo] || [];
      
      botoes.forEach((botao, idx) => {
        const div = document.createElement('div');
        div.className = 'admin-botao-item';
        div.innerHTML = `
          <input type="text" placeholder="Texto do botão" class="admin-input-texto" value="${botao.texto || ''}">
          <input type="url" placeholder="URL" class="admin-input-url" value="${botao.url || ''}">
          <button class="btn-admin-remove" onclick="adminPanel.removerBotao(this, '${tipo}', ${idx})">🗑️</button>
        `;
        container.appendChild(div);
      });
    });
  }

  renderTabUsuarios() {
    return `
      <h3>Gerenciar Usuários</h3>
      <div class="admin-section">
        <div class="usuarios-search-bar">
          <input type="text" id="usuario-pesquisa-input" placeholder="Pesquisar por Matrícula, Apelido/Chapa ou Nome..." oninput="adminPanel.pesquisarUsuarios()">
          <button class="btn-principal" onclick="adminPanel.pesquisarUsuarios()">🔍 Pesquisar</button>
        </div>
        <div id="usuarios-lista-container"></div>
        <div class="admin-actions">
          <button class="btn-principal" onclick="adminPanel.abrirModalNovoUsuario()">+ Novo Usuário</button>
        </div>
      </div>
    `;
  }

  async pesquisarUsuarios() {
    const input = getEl('usuario-pesquisa-input');
    const filtro = input ? input.value.trim() : '';
    if (filtro.length > 0 && filtro.length < 3) {
      return;
    }
    
    try {
      const usuarios = await adminGetUsuariosAPI(filtro);
      this.renderizarListaUsuarios(usuarios);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      // Não mostra alert durante a digitação, apenas no log
      if (filtro.length >= 2) {
        alert('⚠️ Erro ao buscar usuários. Verifique sua conexão.');
      }
    }
  }

  renderizarListaUsuarios(usuarios) {
    const container = getEl('usuarios-lista-container');
    if (!container) return;
    
    if (!usuarios || usuarios.length === 0) {
      container.innerHTML = '<p class="admin-info">Nenhum usuário encontrado.</p>';
      return;
    }
    
    container.innerHTML = `
      <table class="admin-usuarios-tabela">
        <thead>
          <tr>
            <th>Chapa</th>
            <th>Nome</th>
            <th>Apelido</th>
            <th>Função</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${usuarios.map(u => `
            <tr data-apelido="${u.apelido}">
              <td>${u.matricula || ''}</td>
              <td>${u.nome}</td>
              <td>${u.apelido}</td>
              <td>${u.funcao || ''}</td>
              <td><span class="status-badge ${u.ativo === 'SIM' ? 'ativo' : 'inativo'}">${u.ativo === 'SIM' ? 'Ativo' : 'Inativo'}</span></td>
              <td>
                <button class="btn-admin-action" onclick="adminPanel.editarUsuario('${u.apelido}')" title="Editar">✏️</button>
                <button class="btn-admin-action" onclick="adminPanel.toggleUsuario('${u.apelido}', ${u.ativo === 'SIM'})" title="${u.ativo === 'SIM' ? 'Desabilitar' : 'Habilitar'}">${u.ativo === 'SIM' ? '🔒' : '🔓'}</button>
                <button class="btn-admin-action btn-delete" onclick="adminPanel.confirmarExclusao('${u.apelido}')" title="Excluir">🗑️</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  abrirModalNovoUsuario() {
    const modal = getEl('modal-admin-usuario');
    const form = getEl('form-admin-usuario');
    const titulo = getEl('modal-usuario-titulo');
    
    if (!modal || !form) {
      this.criarModalUsuario();
      return;
    }
    
    titulo.textContent = 'Novo Usuário';
    form.reset();
    form.dataset.mode = 'create';
    form.dataset.apelido = '';
    
    // Mostrar campos de matrícula e apelido para criação
    const matriculaField = getEl('usuario-matricula-field');
    const apelidoField = getEl('usuario-apelido-field');
    if (matriculaField) matriculaField.style.display = 'block';
    if (apelidoField) apelidoField.style.display = 'block';
    
    modal.style.display = 'flex';
  }

  async editarUsuario(apelido) {
    const usuarios = await adminGetUsuariosAPI(apelido);
    if (!usuarios || usuarios.length === 0) {
      alert('⚠️ Usuário não encontrado.');
      return;
    }
    
    const usuario = usuarios[0];
    const modal = getEl('modal-admin-usuario');
    const form = getEl('form-admin-usuario');
    const titulo = getEl('modal-usuario-titulo');
    
    if (!modal || !form) {
      this.criarModalUsuario();
      setTimeout(() => this.editarUsuario(apelido), 100);
      return;
    }
    
    titulo.textContent = 'Editar Usuário: ' + usuario.nome;
    form.dataset.mode = 'edit';
    form.dataset.apelido = apelido;
    
    // Preencher campos
    getEl('usuario-matricula').value = usuario.matricula || '';
    getEl('usuario-nome').value = usuario.nome;
    getEl('usuario-funcao').value = usuario.funcao || '';
    getEl('usuario-senha').value = '';
    getEl('usuario-senha-confirm').value = '';
    
    // Esconder campos de matrícula e apelido na edição (não editáveis)
    const matriculaField = getEl('usuario-matricula-field');
    const apelidoField = getEl('usuario-apelido-field');
    if (matriculaField) matriculaField.style.display = 'none';
    if (apelidoField) apelidoField.style.display = 'none';
    
    modal.style.display = 'flex';
  }

  async salvarUsuario() {
    const form = getEl('form-admin-usuario');
    if (!form) return;
    
    const matricula = getEl('usuario-matricula').value.trim();
    const nome = getEl('usuario-nome').value.trim();
    const apelidoInput = getEl('usuario-apelido').value.trim();
    const funcao = getEl('usuario-funcao').value.trim();
    const senha = getEl('usuario-senha').value;
    const senhaConfirm = getEl('usuario-senha-confirm').value;
    const mode = form.dataset.mode;
    const apelido = form.dataset.apelido;
    
    if (!nome || !funcao) {
      alert('⚠️ Nome e Função são obrigatórios.');
      return;
    }
    
    if (mode === 'create') {
      if (!matricula) {
        alert('⚠️ Matrícula é obrigatória para criar usuário.');
        return;
      }
      if (!apelidoInput) {
        alert('⚠️ Apelido/Chapa é obrigatório para criar usuário.');
        return;
      }
      if (!senha || !senhaConfirm) {
        alert('⚠️ Senha e confirmação são obrigatórias para criar usuário.');
        return;
      }
      if (senha !== senhaConfirm) {
        alert('⚠️ As senhas não coincidem.');
        return;
      }
      
      try {
        await adminCreateUsuarioAPI({
          matricula: matricula,
          nome: nome,
          apelido: apelidoInput,
          funcao: funcao,
          senha: senha
        });
        alert('✅ Usuário criado com sucesso!');
        fecharModalAdminUsuario();
        this.pesquisarUsuarios();
      } catch (err) {
        alert('⚠️ Erro ao criar usuário: ' + err.message);
      }
    } else {
      // Edição - apenas função e senha
      try {
        const dadosAtualizar = {
          apelido: apelido,
          funcao: funcao
        };
        
        if (senha) {
          if (!senhaConfirm) {
            alert('⚠️ Confirme a nova senha.');
            return;
          }
          if (senha !== senhaConfirm) {
            alert('⚠️ As senhas não coincidem.');
            return;
          }
          dadosAtualizar.senha = senha;
        }
        
        await adminSaveUsuarioAPI(dadosAtualizar);
        alert('✅ Usuário atualizado com sucesso!');
        fecharModalAdminUsuario();
        this.pesquisarUsuarios();
      } catch (err) {
        alert('⚠️ Erro ao atualizar usuário: ' + err.message);
      }
    }
  }

  async toggleUsuario(apelido, ativoAtual) {
    const novoStatus = !ativoAtual;
    const confirmacao = confirm(`Tem certeza que deseja ${novoStatus ? 'habilitar' : 'desabilitar'} este usuário?`);
    if (!confirmacao) return;
    
    try {
      await adminToggleUsuarioAPI(apelido, novoStatus);
      alert(`✅ Usuário ${novoStatus ? 'habilitado' : 'desabilitado'} com sucesso!`);
      this.pesquisarUsuarios();
    } catch (err) {
      alert('⚠️ Erro ao alterar status do usuário.');
    }
  }

  async confirmarExclusao(apelido) {
    const confirmacao = confirm('⚠️ Tem certeza que deseja EXCLUIR este usuário? Esta ação não pode ser desfeita!');
    if (!confirmacao) return;
    
    try {
      await adminDeleteUsuarioAPI(apelido);
      alert('✅ Usuário excluído com sucesso!');
      this.pesquisarUsuarios();
    } catch (err) {
      alert('⚠️ Erro ao excluir usuário.');
    }
  }

  criarModalUsuario() {
    // Criar modal dinamicamente se não existir
    const modalHtml = `
      <div id="modal-admin-usuario" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title" id="modal-usuario-titulo">Usuário</h2>
            <button class="modal-close" onclick="fecharModalAdminUsuario()">×</button>
          </div>
          <form id="form-admin-usuario" data-mode="" data-apelido="">
            <div class="form-group" id="usuario-matricula-field">
              <label>Matrícula:</label>
              <input type="text" id="usuario-matricula" placeholder="Digite a matrícula" required>
            </div>
            <div class="form-group" id="usuario-apelido-field">
              <label>Apelido/Chapa:</label>
              <input type="text" id="usuario-apelido" placeholder="Digite o apelido/chapa" required>
            </div>
            <div class="form-group">
              <label>Nome Completo:</label>
              <input type="text" id="usuario-nome" placeholder="Digite o nome completo" required>
            </div>
            <div class="form-group">
              <label>Função:</label>
              <input type="text" id="usuario-funcao" placeholder="Digite a função" required>
            </div>
            <div class="form-group">
              <label>Nova Senha:</label>
              <input type="password" id="usuario-senha" placeholder="Digite a senha (deixe em branco para manter na edição)">
            </div>
            <div class="form-group">
              <label>Confirmar Senha:</label>
              <input type="password" id="usuario-senha-confirm" placeholder="Confirme a senha">
            </div>
            <div class="admin-actions">
              <button type="button" class="btn-secundario" onclick="fecharModalAdminUsuario()">Cancelar</button>
              <button type="button" class="btn-principal" onclick="adminPanel.salvarUsuario()">💾 Salvar</button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  renderTabConfig() {
    // Converte timeout de ms para minutos para exibição
    const timeoutMinutos = Math.floor(adminData.timeout / 60000);
    
    return `
      <h3>Configurações do Sistema</h3>
      <div class="admin-section">
        <h4>Timeout de Inatividade</h4>
        <label>
          Tempo (minutos): 
          <input type="number" id="admin-timeout-input" value="${timeoutMinutos}" min="1" max="120" style="width: 80px;">
        </label>
        <p class="admin-info">Usuário será deslogado após este período de inatividade.</p>
        <button class="btn-secundario" onclick="adminPanel.salvarTimeout()">💾 Salvar Timeout</button>
      </div>
      <div class="admin-section">
        <h4>Modo Debug</h4>
        <label>
          <input type="checkbox" id="admin-debug-mode" ${adminData.modoDebug ? 'checked' : ''} onchange="adminPanel.toggleDebugMode(this.checked)">
          Ativar console móvel (vConsole)
        </label>
        <p class="admin-info">Útil para depuração em dispositivos móveis.</p>
      </div>
      <div class="admin-section">
        <h4>Cache</h4>
        <button class="btn-secundario" onclick="adminPanel.limparCache()">🗑️ Limpar Cache Local</button>
        <p class="admin-info">Limpa localStorage e sessionStorage, depois recarrega a aplicação.</p>
      </div>
    `;
  }

  salvarTimeout() {
    const input = getEl('admin-timeout-input');
    if (!input) return;
    
    const minutos = parseInt(input.value, 10);
    if (isNaN(minutos) || minutos < 1 || minutos > 120) {
      alert('⚠️ Digite um valor entre 1 e 120 minutos.');
      return;
    }
    
    adminData.timeout = minutos * 60000; // Converte para milissegundos
    
    this.salvarConfiguracoes().then(() => {
      alert(`✅ Timeout atualizado para ${minutos} minutos!`);
    });
  }

  attachTabListeners() {
    const tabs = this.contentElement.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const tabName = tab.dataset.tab;
        ['botoes', 'usuarios', 'config'].forEach(t => {
          const el = getEl(`tab-${t}`);
          if (el) el.style.display = t === tabName ? 'block' : 'none';
        });
      });
    });
  }

  adicionarBotao(tipo) {
    const container = getEl(`admin-botoes-${tipo}`);
    if (!container) return;
    
    const id = Date.now();
    const div = document.createElement('div');
    div.className = 'admin-botao-item';
    div.dataset.id = id;
    div.innerHTML = `
      <input type="text" placeholder="Texto do botão" class="admin-input-texto" value="Novo Botão">
      <input type="url" placeholder="URL" class="admin-input-url" value="https://">
      <button class="btn-admin-remove" onclick="adminPanel.removerBotao(this, '${tipo}', -1)">🗑️</button>
    `;
    container.appendChild(div);
  }

  removerBotao(btn, tipo, idx) {
    const item = btn.closest('.admin-botao-item');
    if (!item) return;
    
    // Se idx >= 0, remove do array adminData
    if (idx >= 0 && tipo) {
      adminData.botoes[tipo].splice(idx, 1);
    }
    
    item.remove();
  }

  salvarBotoes() {
    // Captura botões da UI e atualiza adminData
    adminData.botoes.clandestinos = this.capturarBotoes('clandestinos');
    adminData.botoes.levantamentos = this.capturarBotoes('levantamentos');
    adminData.botoes.inspecoes5s = this.capturarBotoes('inspecoes5s');
    
    // Salva no backend
    this.salvarConfiguracoes().then(() => {
      alert('✅ Botões salvos com sucesso! As alterações serão visíveis após recarregar a página.');
      this.close();
    });
  }

  capturarBotoes(tipo) {
    const container = getEl(`admin-botoes-${tipo}`);
    if (!container) return [];
    
    const items = container.querySelectorAll('.admin-botao-item');
    return Array.from(items).map(item => ({
      texto: item.querySelector('.admin-input-texto').value,
      url: item.querySelector('.admin-input-url').value
    }));
  }

  toggleDebugMode(enabled) {
    if (enabled) {
      localStorage.setItem('debugMode', 'true');
      if (typeof VConsole !== 'undefined' && !window.vConsoleInstance) {
        window.vConsoleInstance = new VConsole();
        console.log('🐛 Modo debug ativado!');
      }
    } else {
      localStorage.removeItem('debugMode');
      alert('Recarregue a página para desativar completamente o debug.');
    }
  }

  limparCache() {
    if (confirm('Tem certeza que deseja limpar todo o cache local?')) {
      localStorage.clear();
      sessionStorage.clear();
      alert('Cache limpo! A página será recarregada.');
      location.reload();
    }
  }
}

// ====================================================================
// FUNÇÕES GLOBAIS PARA O PAINEL ADMIN
// ====================================================================
function abrirModalAdmin() {
  if (window.adminPanel) {
    window.adminPanel.open();
  }
}

function fecharModalAdmin() {
  if (window.adminPanel) {
    window.adminPanel.close();
  }
}

function abrirModalEditarBotoes(tipo) {
  const modal = getEl('modal-editar-botoes');
  const conteudo = getEl('editar-botoes-conteudo');
  const titulo = getEl('modal-botoes-titulo');
  
  if (!modal || !conteudo) return;
  
  const titulos = {
    clandestinos: 'Editar Botões - Clandestinos/RTO',
    levantamentos: 'Editar Botões - Levantamentos',
    inspecoes5s: 'Editar Botões - Inspeções 5S'
  };
  
  titulo.textContent = titulos[tipo] || 'Editar Botões';
  
  const botoesSalvos = JSON.parse(localStorage.getItem('adminBotoes') || '{}');
  const botoes = botoesSalvos[tipo] || [];
  
  if (botoes.length === 0) {
    conteudo.innerHTML = '<p>Nenhum botão configurado.</p>';
  } else {
    conteudo.innerHTML = botoes.map((botao, idx) => `
      <div class="botao-item">
        <input type="text" value="${botao.texto}" class="edit-botao-texto" placeholder="Texto">
        <input type="url" value="${botao.url}" class="edit-botao-url" placeholder="URL">
        <button onclick="removerBotaoLista('${tipo}', ${idx})">🗑️</button>
      </div>
    `).join('');
  }
  
  conteudo.innerHTML += `
    <button class="btn-secundario" onclick="adicionarBotaoLista('${tipo}')">+ Adicionar</button>
    <button class="btn-principal" onclick="salvarBotoesLista('${tipo}')">💾 Salvar</button>
  `;
  
  modal.style.display = 'flex';
}

function fecharModalEditarBotoes() {
  const modal = getEl('modal-editar-botoes');
  if (modal) modal.style.display = 'none';
}

function adicionarBotaoLista(tipo) {
  const conteudo = getEl('editar-botoes-conteudo');
  const div = document.createElement('div');
  div.className = 'botao-item';
  div.innerHTML = `
    <input type="text" value="Novo Botão" class="edit-botao-texto" placeholder="Texto">
    <input type="url" value="https://" class="edit-botao-url" placeholder="URL">
    <button onclick="this.parentElement.remove()">🗑️</button>
  `;
  conteudo.insertBefore(div, conteudo.lastElementChild.previousElementSibling);
}

function removerBotaoLista(tipo, idx) {
  const botoesSalvos = JSON.parse(localStorage.getItem('adminBotoes') || '{}');
  const botoes = botoesSalvos[tipo] || [];
  botoes.splice(idx, 1);
  botoesSalvos[tipo] = botoes;
  localStorage.setItem('adminBotoes', JSON.stringify(botoesSalvos));
  abrirModalEditarBotoes(tipo);
}

function salvarBotoesLista(tipo) {
  const conteudo = getEl('editar-botoes-conteudo');
  const itens = conteudo.querySelectorAll('.botao-item');
  
  const botoes = Array.from(itens).map(item => ({
    texto: item.querySelector('.edit-botao-texto').value,
    url: item.querySelector('.edit-botao-url').value
  }));
  
  const botoesSalvos = JSON.parse(localStorage.getItem('adminBotoes') || '{}');
  botoesSalvos[tipo] = botoes;
  localStorage.setItem('adminBotoes', JSON.stringify(botoesSalvos));
  
  alert('✅ Botões salvos!');
  fecharModalEditarBotoes();
}

// ====================================================================
// INICIALIZAÇÃO
// ====================================================================
function initAdminPanel() {
  window.adminPanel = new AdminPanelController();
  
  // Carrega botões salvos ao iniciar
  const botoesSalvos = JSON.parse(localStorage.getItem('adminBotoes') || '{}');
  if (Object.keys(botoesSalvos).length > 0) {
    aplicarBotoesPersonalizados(botoesSalvos);
  }
}

function aplicarBotoesPersonalizados(botoes) {
  // Implementação futura para personalizar botões dinamicamente
  console.log('Botões personalizados carregados:', botoes);
}

// Exportar para escopo global
window.AdminPanelController = AdminPanelController;
window.abrirModalAdmin = abrirModalAdmin;
window.fecharModalAdmin = fecharModalAdmin;
window.abrirModalEditarBotoes = abrirModalEditarBotoes;
window.fecharModalEditarBotoes = fecharModalEditarBotoes;
window.adicionarBotaoLista = adicionarBotaoLista;
window.removerBotaoLista = removerBotaoLista;
window.salvarBotoesLista = salvarBotoesLista;
window.initAdminPanel = initAdminPanel;
window.adminGetConfigAPI = adminGetConfigAPI;
window.adminSaveConfigAPI = adminSaveConfigAPI;
window.adminGetUsuariosAPI = adminGetUsuariosAPI;
window.adminSaveUsuarioAPI = adminSaveUsuarioAPI;
window.adminCreateUsuarioAPI = adminCreateUsuarioAPI;
window.adminDeleteUsuarioAPI = adminDeleteUsuarioAPI;
window.adminToggleUsuarioAPI = adminToggleUsuarioAPI;

// Função global para fechar modal de usuário
function fecharModalAdminUsuario() {
  const modal = getEl('modal-admin-usuario');
  if (modal) modal.style.display = 'none';
}

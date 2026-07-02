/**
 * Módulo de Administração do Sistema
 * Gerencia apenas usuários do sistema
 */

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
  }

  init() {
    this.modalElement = getEl('modal-admin-panel');
    this.contentElement = getEl('admin-panel-conteudo');
    
    if (!this.modalElement || !this.contentElement) {
      console.error('Elementos do painel admin não encontrados');
      return false;
    }
    
    return true;
  }

  open() {
    if (!this.init()) return;
    
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
        <button class="admin-tab active" data-tab="usuarios">👥 Usuários</button>
      </div>
      <div class="admin-tab-content" id="tab-usuarios">
        ${this.renderTabUsuarios()}
      </div>
    `;
    
    this.attachTabListeners();
    this.pesquisarUsuarios();
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
    if (filtro.length > 0 && filtro.length < 3) return;
    
    try {
      const usuarios = await adminGetUsuariosAPI(filtro);
      this.renderizarListaUsuarios(usuarios);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      if (filtro.length >= 2) alert('⚠️ Erro ao buscar usuários. Verifique sua conexão.');
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
    let modal = getEl('modal-admin-usuario');
    if (!modal) {
      this.criarModalUsuario();
      modal = getEl('modal-admin-usuario');
    }
    
    const form = getEl('form-admin-usuario');
    const titulo = getEl('modal-usuario-titulo');
    
    titulo.textContent = 'Novo Usuário';
    form.reset();
    form.dataset.mode = 'create';
    form.dataset.apelido = '';
    
    getEl('usuario-matricula-field').style.display = 'block';
    getEl('usuario-apelido-field').style.display = 'block';
    
    modal.style.display = 'flex';
  }

  async editarUsuario(apelido) {
    try {
      const usuarios = await adminGetUsuariosAPI(apelido);
      if (!usuarios || usuarios.length === 0) {
        alert('⚠️ Usuário não encontrado.');
        return;
      }
      
      const usuario = usuarios[0];
      let modal = getEl('modal-admin-usuario');
      if (!modal) {
        this.criarModalUsuario();
        modal = getEl('modal-admin-usuario');
      }
      
      const form = getEl('form-admin-usuario');
      const titulo = getEl('modal-usuario-titulo');
      
      titulo.textContent = 'Editar Usuário: ' + usuario.nome;
      form.dataset.mode = 'edit';
      form.dataset.apelido = apelido;
      
      getEl('usuario-matricula').value = usuario.matricula || '';
      getEl('usuario-nome').value = usuario.nome;
      getEl('usuario-funcao').value = usuario.funcao || '';
      getEl('usuario-senha').value = '';
      getEl('usuario-senha-confirm').value = '';
      
      getEl('usuario-matricula-field').style.display = 'none';
      getEl('usuario-apelido-field').style.display = 'none';
      
      modal.style.display = 'flex';
    } catch (err) {
      console.error('Erro ao carregar usuário:', err);
      alert('⚠️ Erro ao carregar dados do usuário.');
    }
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
      if (!matricula || !apelidoInput) {
        alert('⚠️ Matrícula e Apelido/Chapa são obrigatórios para criar usuário.');
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
        await adminCreateUsuarioAPI({ matricula, nome, apelido: apelidoInput, funcao, senha });
        alert('✅ Usuário criado com sucesso!');
        fecharModalAdminUsuario();
        this.pesquisarUsuarios();
      } catch (err) {
        alert('⚠️ Erro ao criar usuário: ' + err.message);
      }
    } else {
      const dadosAtualizar = { apelido, funcao };
      
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
      
      try {
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
    if (!confirm(`Tem certeza que deseja ${novoStatus ? 'habilitar' : 'desabilitar'} este usuário?`)) return;
    
    try {
      await adminToggleUsuarioAPI(apelido, novoStatus);
      alert(`✅ Usuário ${novoStatus ? 'habilitado' : 'desabilitado'} com sucesso!`);
      this.pesquisarUsuarios();
    } catch (err) {
      alert('⚠️ Erro ao alterar status do usuário.');
    }
  }

  async confirmarExclusao(apelido) {
    if (!confirm('⚠️ Tem certeza que deseja EXCLUIR este usuário? Esta ação não pode ser desfeita!')) return;
    
    try {
      await adminDeleteUsuarioAPI(apelido);
      alert('✅ Usuário excluído com sucesso!');
      this.pesquisarUsuarios();
    } catch (err) {
      alert('⚠️ Erro ao excluir usuário.');
    }
  }

  criarModalUsuario() {
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

  attachTabListeners() {
    const tabs = this.contentElement.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const tabName = tab.dataset.tab;
        ['usuarios'].forEach(t => {
          const el = getEl(`tab-${t}`);
          if (el) el.style.display = t === tabName ? 'block' : 'none';
        });
      });
    });
  }
}

// ====================================================================
// FUNÇÕES GLOBAIS
// ====================================================================
function abrirModalAdmin() {
  if (window.adminPanel) window.adminPanel.open();
}

function fecharModalAdmin() {
  if (window.adminPanel) window.adminPanel.close();
}

function fecharModalAdminUsuario() {
  const modal = getEl('modal-admin-usuario');
  if (modal) modal.style.display = 'none';
}

function initAdminPanel() {
  window.adminPanel = new AdminPanelController();
}

// Exportar para escopo global
window.AdminPanelController = AdminPanelController;
window.abrirModalAdmin = abrirModalAdmin;
window.fecharModalAdmin = fecharModalAdmin;
window.fecharModalAdminUsuario = fecharModalAdminUsuario;
window.initAdminPanel = initAdminPanel;
window.adminGetUsuariosAPI = adminGetUsuariosAPI;
window.adminSaveUsuarioAPI = adminSaveUsuarioAPI;
window.adminCreateUsuarioAPI = adminCreateUsuarioAPI;
window.adminDeleteUsuarioAPI = adminDeleteUsuarioAPI;
window.adminToggleUsuarioAPI = adminToggleUsuarioAPI;

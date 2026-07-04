/**
 * Módulo de Administração do Sistema
 * Gerencia apenas usuários do sistema
 */

// ====================================================================
// API DE USUÁRIOS (Admin)
// ====================================================================
async function adminGetUsuariosAPI(filtro = '', revelarSenha = false, senhaAdmin = '', apelidoAdmin = '') {
  return new Promise((resolve, reject) => {
    const callbackName = 'adminGetUsuariosCallback_' + Date.now();
    
    window[callbackName] = function(resposta) {
      delete window[callbackName];
      if (resposta && resposta.sucesso) {
        resolve({ usuarios: resposta.usuarios, senhasReveladas: resposta.senhasReveladas || false });
      } else {
        reject(new Error(resposta?.erro || 'Falha ao obter usuários'));
      }
    };
    
    const script = document.createElement('script');
    let url = `${URL_PLANILHA}?acao=admin_get_usuarios&callback=${callbackName}&_=${Date.now()}`;
    
    if (filtro) {
      url += `&filtro=${encodeURIComponent(filtro)}`;
    }
    if (revelarSenha) {
      url += `&revelarSenha=true&senhaAdmin=${encodeURIComponent(senhaAdmin)}&apelidoAdmin=${encodeURIComponent(apelidoAdmin)}`;
    }
    
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

/**
 * Valida a senha do admin antes de executar ações sensíveis
 */
async function validarSenhaAdmin() {
  return new Promise((resolve, reject) => {
    const modalHtml = `
      <div id="modal-validacao-senha" class="modal">
        <div class="modal-content" style="max-width: 400px;">
          <div class="modal-header">
            <h2 class="modal-title">🔐 Validação de Segurança</h2>
            <button class="modal-close" onclick="fecharModalValidacaoSenha()">×</button>
          </div>
          <div style="padding: 20px;">
            <p style="margin-bottom: 15px; color: #666;">Para continuar, digite sua senha de administrador:</p>
            <input type="password" id="admin-validacao-senha" placeholder="Sua senha" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px;">
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
              <button class="btn-secundario" onclick="fecharModalValidacaoSenha()">Cancelar</button>
              <button class="btn-principal" onclick="confirmarValidacaoSenha()">Confirmar</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    const existingModal = document.getElementById('modal-validacao-senha');
    if (existingModal) {
      existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const input = document.getElementById('admin-validacao-senha');
    input.focus();
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') confirmarValidacaoSenha();
    });
    
    window.validacaoResolve = resolve;
  });
}

function fecharModalValidacaoSenha() {
  const modal = document.getElementById('modal-validacao-senha');
  if (modal) modal.remove();
  if (window.validacaoResolve) {
    window.validacaoResolve({ valido: false });
    window.validacaoResolve = null;
  }
}

async function confirmarValidacaoSenha() {
  const senha = document.getElementById('admin-validacao-senha').value;
  const apelido = localStorage.getItem('inspectorApelido') || sessionStorage.getItem('inspectorApelido');
  
  if (!senha || !apelido) {
    alert('⚠️ Dados insuficientes para validação.');
    fecharModalValidacaoSenha();
    return;
  }
  
  try {
    const response = await fetch(`${URL_PLANILHA}?acao=validar_senha_admin&apelido=${encodeURIComponent(apelido)}&senha=${encodeURIComponent(senha)}`, {
      method: 'GET'
    });
    const result = await response.json();
    
    if (result.sucesso) {
      fecharModalValidacaoSenha();
      if (window.validacaoResolve) {
        window.validacaoResolve({ valido: true, senha: senha });
        window.validacaoResolve = null;
      }
    } else {
      alert('⚠️ Senha incorreta!');
      document.getElementById('admin-validacao-senha').value = '';
      document.getElementById('admin-validacao-senha').focus();
    }
  } catch (err) {
    alert('⚠️ Erro ao validar senha: ' + err.message);
    fecharModalValidacaoSenha();
  }
}

/**
 * Gera token/senha baseado na chapa e apelido
 * Regras: contém ao menos 3 dos números da chapa e uma das letras do apelido/chapa
 * A letra pode estar em qualquer posição
 */
function gerarTokenUsuario(matricula, apelido) {
  // Extrai apenas números da matrícula
  const numerosMatricula = matricula.replace(/[^0-9]/g, '');
  // Extrai apenas letras do apelido (maiúsculas)
  const letrasApelido = apelido.replace(/[^a-zA-Z]/g, '').toUpperCase();
  
  // Seleciona até 3 números da matrícula
  let numerosSelecionados = '';
  for (let i = 0; i < Math.min(3, numerosMatricula.length); i++) {
    numerosSelecionados += numerosMatricula[i];
  }
  
  // Se não tiver 3 números, completa com números sequenciais
  while (numerosSelecionados.length < 3) {
    numerosSelecionados += String.fromCharCode(48 + Math.floor(Math.random() * 10));
  }
  
  // Seleciona uma letra do apelido
  let letraSelecionada = '';
  if (letrasApelido.length > 0) {
    letraSelecionada = letrasApelido[Math.floor(Math.random() * letrasApelido.length)];
  } else {
    // Se não tiver letras no apelido, usa uma letra genérica
    const letrasGenericas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    letraSelecionada = letrasGenericas[Math.floor(Math.random() * letrasGenericas.length)];
  }
  
  // Combina números e letra em ordem aleatória
  const caracteres = numerosSelecionados.split('').concat([letraSelecionada]);
  
  // Embaralha os caracteres
  for (let i = caracteres.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
  }
  
  return caracteres.join('');
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
    // Não carrega usuários automaticamente - aguarda digitação de 4 caracteres
    const container = getEl('usuarios-lista-container');
    if (container) {
      container.innerHTML = '<p class="admin-info">Digite pelo menos 4 caracteres para buscar usuários.</p>';
    }
  }

  renderTabUsuarios() {
    return `
      <h3>Gerenciar Usuários</h3>
      <div class="admin-section">
        <div class="usuarios-search-bar">
          <input type="text" id="usuario-pesquisa-input" placeholder="Digite pelo menos 4 caracteres para pesquisar..." oninput="adminPanel.pesquisarUsuarios()">
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
    // Só busca após digitar 4 caracteres (requisito do usuário)
    if (filtro.length > 0 && filtro.length < 4) {
      const container = getEl('usuarios-lista-container');
      if (container) {
        container.innerHTML = '<p class="admin-info">Digite pelo menos 4 caracteres para buscar usuários.</p>';
      }
      return;
    }
    
    try {
      const resultado = await adminGetUsuariosAPI(filtro);
      this.renderizarListaUsuarios(resultado.usuarios, resultado.senhasReveladas);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      if (filtro.length >= 4) alert('⚠️ Erro ao buscar usuários. Verifique sua conexão.');
    }
  }

  renderizarListaUsuarios(usuarios, senhasReveladas = false) {
    const container = getEl('usuarios-lista-container');
    if (!container) return;
    
    if (!usuarios || usuarios.length === 0) {
      container.innerHTML = '<p class="admin-info">Nenhum usuário encontrado.</p>';
      return;
    }
    
    // Botão para revelar senhas se ainda não foram reveladas
    let botaoRevelarSenha = '';
    if (!senhasReveladas) {
      botaoRevelarSenha = `
        <div style="margin-bottom: 15px; padding: 10px; background: #fff3cd; border-radius: 5px;">
          <p style="margin: 0 0 10px 0; color: #856404;">🔐 As senhas estão ocultas por segurança.</p>
          <button class="btn-principal" onclick="adminPanel.revelarSenhas()" style="padding: 8px 15px; font-size: 0.9rem;">👁️ Revelar Senhas dos Usuários</button>
        </div>
      `;
    } else {
      botaoRevelarSenha = `
        <div style="margin-bottom: 15px; padding: 10px; background: #d4edda; border-radius: 5px;">
          <p style="margin: 0; color: #155724;">✅ Senhas reveladas com sucesso!</p>
        </div>
      `;
    }
    
    container.innerHTML = `
      ${botaoRevelarSenha}
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

  async revelarSenhas() {
    // Solicita a senha do admin com validação dupla
    try {
      const validacao = await validarSenhaAdmin();
      if (!validacao.valido) {
        alert('⚠️ Validação de senha necessária para revelar senhas.');
        return;
      }
      
      // Busca usuários com senhas reveladas
      const apelidoAdmin = localStorage.getItem('inspectorApelido') || sessionStorage.getItem('inspectorApelido');
      const resultado = await adminGetUsuariosAPI('', true, validacao.senha, apelidoAdmin);
      this.renderizarListaUsuarios(resultado.usuarios, resultado.senhasReveladas);
    } catch (err) {
      console.error('Erro ao revelar senhas:', err);
      alert('⚠️ Erro ao revelar senhas: ' + err.message);
    }
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
      const resultado = await adminGetUsuariosAPI(apelido);
      const usuarios = resultado.usuarios || resultado;
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
    
    // Validação dupla da senha do admin para criação e edição com senha
    if (mode === 'create' || (mode === 'edit' && senha)) {
      try {
        const validacao = await validarSenhaAdmin();
        if (!validacao.valido) {
          alert('⚠️ Validação de senha necessária para continuar.');
          return;
        }
      } catch (err) {
        alert('⚠️ Erro na validação: ' + err.message);
        return;
      }
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
        alert('✅ Usuário criado com sucesso!\n\nSenha definida: ' + senha);
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
    // Validação dupla da senha do admin para exclusão
    try {
      const validacao = await validarSenhaAdmin();
      if (!validacao.valido) {
        alert('⚠️ Validação de senha necessária para excluir usuário.');
        return;
      }
    } catch (err) {
      alert('⚠️ Erro na validação: ' + err.message);
      return;
    }
    
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
              <input type="text" id="usuario-apelido" placeholder="Digite o apelido/chapa" required onblur="gerarSenhaSugerida()">
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
              <div style="display: flex; gap: 10px; align-items: center;">
                <input type="password" id="usuario-senha" placeholder="Digite a senha (deixe em branco para manter na edição)" style="flex: 1;">
                <button type="button" id="btn-toggle-senha" class="btn-icon" onclick="toggleSenhaVisibility('usuario-senha')" title="Mostrar/Ocultar senha">👁️</button>
                <button type="button" id="btn-gerar-senha" class="btn-icon" onclick="gerarSenhaSugerida()" title="Gerar senha sugerida">🎲</button>
              </div>
              <small id="senha-sugerida-info" style="color: #666; font-size: 0.8rem; margin-top: 5px; display: none;">Senha sugerida: <strong id="senha-sugerida-text"></strong></small>
            </div>
            <div class="form-group">
              <label>Confirmar Senha:</label>
              <div style="display: flex; gap: 10px; align-items: center;">
                <input type="password" id="usuario-senha-confirm" placeholder="Confirme a senha" style="flex: 1;">
                <button type="button" class="btn-icon" onclick="toggleSenhaVisibility('usuario-senha-confirm')" title="Mostrar/Ocultar senha">👁️</button>
              </div>
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
window.validarSenhaAdmin = validarSenhaAdmin;
window.fecharModalValidacaoSenha = fecharModalValidacaoSenha;
window.confirmarValidacaoSenha = confirmarValidacaoSenha;
window.gerarTokenUsuario = gerarTokenUsuario;
window.revelarSenhas = function() {
  if (window.adminPanel) window.adminPanel.revelarSenhas();
};

/**
 * Alterna visibilidade da senha
 */
function toggleSenhaVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}

/**
 * Gera e mostra senha sugerida baseada na matrícula e apelido
 */
function gerarSenhaSugerida() {
  const matricula = document.getElementById('usuario-matricula')?.value || '';
  const apelido = document.getElementById('usuario-apelido')?.value || '';
  
  if (!matricula || !apelido) return;
  
  const senhaGerada = gerarTokenUsuario(matricula, apelido);
  
  // Mostra a senha sugerida
  const infoEl = document.getElementById('senha-sugerida-info');
  const textoEl = document.getElementById('senha-sugerida-text');
  const senhaInput = document.getElementById('usuario-senha');
  const confirmInput = document.getElementById('usuario-senha-confirm');
  
  if (infoEl && textoEl) {
    textoEl.textContent = senhaGerada;
    infoEl.style.display = 'block';
  }
  
  // Preenche os campos de senha automaticamente
  if (senhaInput) senhaInput.value = senhaGerada;
  if (confirmInput) confirmInput.value = senhaGerada;
}

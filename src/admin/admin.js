/**
 * Módulo de Administração do Sistema
 * Gerencia apenas usuários do sistema
 */

// ====================================================================
// API DE USUÁRIOS (Admin) - AGORA COM FETCH CORS
// ====================================================================

// Obtém token de sessão do ADMIN
function getAdminToken() {
  return localStorage.getItem('inspectorToken') || '';
}

function getAdminApelido() {
  return localStorage.getItem('inspectorApelido') || '';
}

async function adminGetUsuariosAPI(filtro = '') {
  mostrarLoading('Buscando usuários...');
  try {
    const apelidoAdmin = getAdminApelido();
    const tokenAdmin = getAdminToken();
    const url = `${URL_PLANILHA}?acao=admin_get_usuarios&filtro=${encodeURIComponent(filtro)}&apelidoAdmin=${encodeURIComponent(apelidoAdmin)}&tokenAdmin=${encodeURIComponent(tokenAdmin)}&_=${Date.now()}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.sucesso) {
      return { usuarios: data.usuarios, senhasReveladas: false };
    } else {
      throw new Error(data.erro || 'Falha ao obter usuários');
    }
  } catch (err) {
    console.error('Erro adminGetUsuariosAPI:', err);
    throw err;
  } finally {
    ocultarLoading();
  }
}

async function adminSaveUsuarioAPI(usuario) {
  mostrarLoading('Salvando usuário...');
  try {
    const apelidoAdmin = getAdminApelido();
    const tokenAdmin = getAdminToken();
    const dados = { ...usuario, apelidoAdmin, tokenAdmin };
    const response = await fetch(URL_PLANILHA, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ acao: 'admin_save_usuario', dados: JSON.stringify(dados) })
    });
    const data = await response.json();
    if (data.sucesso) {
      return data;
    } else {
      throw new Error(data.erro || 'Erro ao salvar usuário');
    }
  } catch (err) {
    console.error('Erro adminSaveUsuarioAPI:', err);
    throw err;
  } finally {
    ocultarLoading();
  }
}

async function adminCreateUsuarioAPI(usuario) {
  mostrarLoading('Criando usuário...');
  try {
    const apelidoAdmin = getAdminApelido();
    const tokenAdmin = getAdminToken();
    const dados = { ...usuario, apelidoAdmin, tokenAdmin };
    const response = await fetch(URL_PLANILHA, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ acao: 'admin_create_usuario', dados: JSON.stringify(dados) })
    });
    const data = await response.json();
    if (data.sucesso) {
      return data;
    } else {
      throw new Error(data.erro || 'Erro ao criar usuário');
    }
  } catch (err) {
    console.error('Erro adminCreateUsuarioAPI:', err);
    throw err;
  } finally {
    ocultarLoading();
  }
}

async function adminDeleteUsuarioAPI(apelido) {
  mostrarLoading('Excluindo usuário...');
  try {
    const apelidoAdmin = getAdminApelido();
    const tokenAdmin = getAdminToken();
    const response = await fetch(URL_PLANILHA, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        acao: 'admin_delete_usuario',
        apelido: apelido,
        apelidoAdmin: apelidoAdmin,
        tokenAdmin: tokenAdmin
      })
    });
    const data = await response.json();
    if (data.sucesso) {
      return data;
    } else {
      throw new Error(data.erro || 'Erro ao excluir usuário');
    }
  } catch (err) {
    console.error('Erro adminDeleteUsuarioAPI:', err);
    throw err;
  } finally {
    ocultarLoading();
  }
}

async function adminToggleUsuarioAPI(apelido, ativo) {
  mostrarLoading('Alterando status...');
  try {
    const apelidoAdmin = getAdminApelido();
    const tokenAdmin = getAdminToken();
    const response = await fetch(URL_PLANILHA, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        acao: 'admin_toggle_usuario',
        apelido: apelido,
        ativo: ativo ? 'SIM' : 'NAO',
        apelidoAdmin: apelidoAdmin,
        tokenAdmin: tokenAdmin
      })
    });
    const data = await response.json();
    if (data.sucesso) {
      return data;
    } else {
      throw new Error(data.erro || 'Erro ao alterar status');
    }
  } catch (err) {
    console.error('Erro adminToggleUsuarioAPI:', err);
    throw err;
  } finally {
    ocultarLoading();
  }
}

/**
 * Valida a senha do admin antes de executar ações sensíveis
 * Retorna true se o apelido existir, tiver função ADMIN e a senha bater com o hash
 */
async function validarAdmin(apelido, senha) {
  try {
    const response = await fetch(`${URL_PLANILHA}?acao=validar_senha_admin&apelido=${encodeURIComponent(apelido)}&senha=${encodeURIComponent(senha)}`, {
      method: 'GET'
    });
    const result = await response.json();
    return result.sucesso === true;
  } catch (err) {
    console.error('Erro ao validar admin:', err);
    return false;
  }
}

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
    this.funcoesDisponiveis = [];
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
    
    // Carrega lista de funções disponíveis
    this.carregarFuncoes();
    
    this.render();
    this.modalElement.style.display = 'flex';
  }

  close() {
    if (this.modalElement) {
      this.modalElement.style.display = 'none';
    }
  }

  async carregarFuncoes() {
    try {
      const resultado = await adminGetUsuariosAPI('');
      const usuarios = resultado.usuarios || [];
      const funcoesSet = new Set();
      usuarios.forEach(u => {
        if (u.funcao) funcoesSet.add(u.funcao.trim().toUpperCase());
      });
      // Adiciona funções padrão caso não haja
      const padrao = ['ADMIN','FISCAL','INSPETOR','SAF','ENCARREGADO','GERENTE','MONITOR','PLANTAO','PLANTONISTA','TEC. EMBARCADA','SUPERV. PLANEJAMENTO','PLANEJAMENTO'];
      padrao.forEach(f => funcoesSet.add(f));
      this.funcoesDisponiveis = Array.from(funcoesSet).sort();
    } catch (err) {
      console.warn('Erro ao carregar funções, usando lista padrão:', err);
      this.funcoesDisponiveis = ['ADMIN','FISCAL','INSPETOR','SAF','ENCARREGADO','GERENTE','MONITOR','PLANTAO','PLANTONISTA','TEC. EMBARCADA','SUPERV. PLANEJAMENTO','PLANEJAMENTO'];
    }
  }

  render() {
    if (!this.contentElement) return;
    
    this.contentElement.innerHTML = `
      <div class="admin-tabs">
        <button class="admin-tab active" data-tab="usuarios">👥 Usuários</button>
        <button class="admin-tab" data-tab="modais">🔗 Modais</button>
      </div>
      <div class="admin-tab-content" id="tab-usuarios">
        ${this.renderTabUsuarios()}
      </div>
      <div class="admin-tab-content" id="tab-modais" style="display: none;">
        ${this.renderTabModais()}
      </div>
    `;
    
    this.attachTabListeners();
    // Não carrega usuários automaticamente - aguarda digitação de 4 caracteres
    const container = getEl('usuarios-lista-container');
    if (container) {
      container.innerHTML = '<p class="admin-info">Digite pelo menos 4 caracteres para buscar usuários.</p>';
    }
    // Inicializa tab de modais
    this.carregarModais();
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
    
    // Mostra indicador de carregamento
    const container = getEl('usuarios-lista-container');
    if (container) {
      container.innerHTML = '<p class="admin-info">⏳ Buscando usuários...</p>';
    }
    
    try {
      const resultado = await adminGetUsuariosAPI(filtro);
      this.renderizarListaUsuarios(resultado.usuarios, resultado.senhasReveladas);
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      if (filtro.length >= 4) {
        alert('⚠️ Erro ao buscar usuários: ' + err.message);
      }
    }
  }

  renderizarListaUsuarios(usuarios, senhasReveladas = false) {
    const container = getEl('usuarios-lista-container');
    if (!container) return;
    
    if (!usuarios || usuarios.length === 0) {
      container.innerHTML = '<p class="admin-info">Nenhum usuário encontrado.</p>';
      return;
    }
    
    // Ordenação da tabela
    let ordenacaoHtml = `
      <div style="margin-bottom: 15px; display: flex; gap: 10px; align-items: center;">
        <span style="font-weight: bold;">Ordenar por:</span>
        <button class="btn-secundario" onclick="adminPanel.ordenarTabela('nome')" style="padding: 5px 10px; font-size: 0.85rem;">Nome</button>
        <button class="btn-secundario" onclick="adminPanel.ordenarTabela('apelido')" style="padding: 5px 10px; font-size: 0.85rem;">Apelido</button>
        <button class="btn-secundario" onclick="adminPanel.ordenarTabela('matricula')" style="padding: 5px 10px; font-size: 0.85rem;">Chapa</button>
        <button class="btn-secundario" onclick="adminPanel.ordenarTabela('funcao')" style="padding: 5px 10px; font-size: 0.85rem;">Função</button>
      </div>
    `;
    
    container.innerHTML = `
      ${ordenacaoHtml}
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
                <button class="btn-admin-action" onclick="adminPanel.redefinirSenha('${u.apelido}', '${u.nome}')" title="Redefinir Senha">🔑</button>
                <button class="btn-admin-action" onclick="adminPanel.toggleUsuario('${u.apelido}', ${u.ativo === 'SIM'})" title="${u.ativo === 'SIM' ? 'Desabilitar' : 'Habilitar'}">${u.ativo === 'SIM' ? '🔒' : '🔓'}</button>
                <button class="btn-admin-action btn-delete" onclick="adminPanel.confirmarExclusao('${u.apelido}')" title="Excluir">🗑️</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  /**
   * Renderiza a aba de Modais com o novo layout (título, link, ativo, perfis)
   */
  renderTabModais() {
    const funcoesOptions = this.funcoesDisponiveis.map(f => `<option value="${f}">${f}</option>`).join('');
    return `
      <h3>Gerenciar Modais</h3>
      <div class="admin-section">
        <p class="admin-info" style="margin-bottom: 20px;">Configure os botões dos modais 5S, Levantamentos e Clandestinos. Cada modal pode ter até 5 botões.</p>
        
        <div class="modais-container">
          <!-- Modal 5S -->
          <div class="modal-config-card">
            <h4>📋 Inspeções 5S</h4>
            <div id="modais-5s-buttons" class="modal-buttons-list"></div>
            <button class="btn-principal" onclick="adminPanel.adicionarBotaoModal('5s')" style="margin-top: 10px;">+ Adicionar Botão</button>
          </div>
          
          <!-- Modal Levantamentos -->
          <div class="modal-config-card">
            <h4>📝 Levantamentos</h4>
            <div id="modais-levantamentos-buttons" class="modal-buttons-list"></div>
            <button class="btn-principal" onclick="adminPanel.adicionarBotaoModal('levantamentos')" style="margin-top: 10px;">+ Adicionar Botão</button>
          </div>
          
          <!-- Modal Clandestinos -->
          <div class="modal-config-card">
            <h4>🚫 Clandestinos</h4>
            <div id="modais-clandestinos-buttons" class="modal-buttons-list"></div>
            <button class="btn-principal" onclick="adminPanel.adicionarBotaoModal('clandestinos')" style="margin-top: 10px;">+ Adicionar Botão</button>
          </div>
        </div>
        
        <div class="admin-actions" style="margin-top: 20px;">
          <button class="btn-principal" onclick="adminPanel.salvarConfiguracaoModais()">💾 Salvar Alterações</button>
        </div>
      </div>
    `;
  }

  /**
   * Carrega configuração dos modais e renderiza nos containers
   */
  async carregarModais() {
    try {
      const response = await fetch(`${URL_PLANILHA}?acao=get_config_modais&_=${Date.now()}`);
      const config = await response.json();
      
      this.configModais = config || {
        '5s': [],
        'levantamentos': [],
        'clandestinos': []
      };
      
      // Garantir que os botões antigos tenham campo perfis
      for (const key of ['5s','levantamentos','clandestinos']) {
        if (this.configModais[key]) {
          this.configModais[key] = this.configModais[key].map(b => {
            if (!b.perfis) b.perfis = [];
            return b;
          });
        }
      }
      
      this.renderizarBotoesModais();
      this.renderizarModaisNaTela();
    } catch (err) {
      console.error('Erro ao carregar modais:', err);
      // Inicializa com configuração vazia
      this.configModais = {
        '5s': [],
        'levantamentos': [],
        'clandestinos': []
      };
      this.renderizarBotoesModais();
      this.renderizarModaisNaTela();
    }
  }

  /**
   * Renderiza os botões dos modais na tela principal (considerando perfil)
   */
  renderizarModaisNaTela() {
    const userRole = window.currentUserRole || localStorage.getItem('inspectorRole') || '';
    // Mapeamento entre config e containers
    const mapeamento = {
      '5s': 'inspecoes-5s-buttons-container',
      'levantamentos': 'levantamentos-buttons-container',
      'clandestinos': 'clandestinos-buttons-container'
    };
    
    Object.entries(mapeamento).forEach(([configKey, containerId]) => {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      const botoes = this.configModais[configKey] || [];
      
      // Filtra por ativo e perfil
      const botoesFiltrados = botoes.filter(b => {
        if (b.ativo === false) return false;
        // Se não tem perfis definidos ou array vazio, visível para todos
        if (!b.perfis || b.perfis.length === 0) return true;
        return b.perfis.includes(userRole);
      });
      
      if (botoesFiltrados.length === 0) {
        container.innerHTML = '<p style="color: #666; padding: 20px; text-align: center;">Nenhum botão disponível para seu perfil.</p>';
        return;
      }
      
      container.innerHTML = botoesFiltrados
        .map(botao => `<a class="modal-btn" href="${botao.url}" target="_blank">${botao.texto}</a>`)
        .join('');
    });
  }

  /**
   * Renderiza os botões de cada modal (admin) com campos Título, Link, Ativo, Perfis
   */
  renderizarBotoesModais() {
    const funcoesOptions = this.funcoesDisponiveis.map(f => `<option value="${f}">${f}</option>`).join('');
    ['5s', 'levantamentos', 'clandestinos'].forEach(modalType => {
      const container = document.getElementById(`modais-${modalType}-buttons`);
      if (!container) return;
      
      const botoes = this.configModais[modalType] || [];
      
      if (botoes.length === 0) {
        container.innerHTML = '<p class="admin-info" style="font-size: 0.9rem; color: #666;">Nenhum botão configurado</p>';
        return;
      }
      
      container.innerHTML = botoes.map((botao, index) => {
        // Cria string de opções selecionadas
        const selectedPerfis = botao.perfis || [];
        const optionsHtml = this.funcoesDisponiveis.map(f => 
          `<option value="${f}" ${selectedPerfis.includes(f) ? 'selected' : ''}>${f}</option>`
        ).join('');
        
        return `
          <div class="modal-button-item ${botao.ativo === false ? 'desabilitado' : ''}" data-index="${index}">
            <div class="button-item-header">
              <span class="button-order">#${index + 1}</span>
              <span class="button-status">${botao.ativo === false ? '🔴 Desabilitado' : '🟢 Habilitado'}</span>
            </div>
            <div class="button-item-fields">
              <div class="field-group">
                <label>Título</label>
                <input type="text" value="${botao.texto || ''}" placeholder="Título do botão" onchange="adminPanel.atualizarBotaoModal('${modalType}', ${index}, 'texto', this.value)" style="width:100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
              </div>
              <div class="field-group">
                <label>Link</label>
                <input type="url" value="${botao.url || ''}" placeholder="URL do link" onchange="adminPanel.atualizarBotaoModal('${modalType}', ${index}, 'url', this.value)" style="width:100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
              </div>
              <div class="field-group" style="flex: 0 0 100px;">
                <label>Ativo</label>
                <input type="checkbox" ${botao.ativo !== false ? 'checked' : ''} onchange="adminPanel.toggleBotaoModal('${modalType}', ${index})" style="display: block; margin-top: 6px;">
              </div>
              <div class="field-group" style="flex: 1.5;">
                <label>Perfis Visíveis</label>
                <select multiple onchange="adminPanel.atualizarBotaoModal('${modalType}', ${index}, 'perfis', Array.from(this.selectedOptions, opt => opt.value))" style="width:100%; height: 60px; padding: 4px; border: 1px solid #ddd; border-radius: 4px;">
                  ${optionsHtml}
                </select>
                <small style="font-size: 0.7rem; color: #666;">Segure Ctrl para múltiplos. Vazio = todos.</small>
              </div>
            </div>
            <div class="button-item-actions">
              <button class="btn-admin-action" onclick="adminPanel.moverBotaoModal('${modalType}', ${index}, -1)" title="Mover para cima" ${index === 0 ? 'disabled' : ''}>⬆️</button>
              <button class="btn-admin-action" onclick="adminPanel.moverBotaoModal('${modalType}', ${index}, 1)" title="Mover para baixo" ${index === botoes.length - 1 ? 'disabled' : ''}>⬇️</button>
              <button class="btn-admin-action btn-delete" onclick="adminPanel.removerBotaoModal('${modalType}', ${index})" title="Remover">🗑️</button>
            </div>
          </div>
        `;
      }).join('');
    });
  }

  /**
   * Adiciona novo botão ao modal
   */
  adicionarBotaoModal(modalType) {
    if (!this.configModais[modalType]) {
      this.configModais[modalType] = [];
    }
    
    if (this.configModais[modalType].length >= 5) {
      alert('⚠️ Cada modal pode ter no máximo 5 botões.');
      return;
    }
    
    this.configModais[modalType].push({
      texto: '',
      url: '',
      ativo: true,
      perfis: [] // vazio = todos os perfis
    });
    
    this.renderizarBotoesModais();
  }

  /**
   * Atualiza propriedades de um botão
   */
  atualizarBotaoModal(modalType, index, campo, valor) {
    if (this.configModais[modalType] && this.configModais[modalType][index]) {
      this.configModais[modalType][index][campo] = valor;
    }
  }

  /**
   * Toggle habilitar/desabilitar botão
   */
  toggleBotaoModal(modalType, index) {
    if (this.configModais[modalType] && this.configModais[modalType][index]) {
      this.configModais[modalType][index].ativo = !this.configModais[modalType][index].ativo;
      this.renderizarBotoesModais();
    }
  }

  /**
   * Move botão para cima ou para baixo
   */
  moverBotaoModal(modalType, index, direcao) {
    if (!this.configModais[modalType]) return;
    
    const newIndex = index + direcao;
    if (newIndex < 0 || newIndex >= this.configModais[modalType].length) return;
    
    // Swap
    [this.configModais[modalType][index], this.configModais[modalType][newIndex]] = 
    [this.configModais[modalType][newIndex], this.configModais[modalType][index]];
    
    this.renderizarBotoesModais();
  }

  /**
   * Remove botão do modal
   */
  removerBotaoModal(modalType, index) {
    if (!confirm('⚠️ Tem certeza que deseja remover este botão?')) return;
    
    if (this.configModais[modalType]) {
      this.configModais[modalType].splice(index, 1);
      this.renderizarBotoesModais();
    }
  }

  /**
   * Salva configuração dos modais com validação dupla (senha + token)
   */
  async salvarConfiguracaoModais() {
    try {
      // Validação da senha do admin
      const validacao = await validarSenhaAdmin();
      if (!validacao.valido) {
        alert('⚠️ Validação de senha necessária para salvar alterações.');
        return;
      }
      
      const apelidoAdmin = localStorage.getItem('inspectorApelido') || sessionStorage.getItem('inspectorApelido');
      const tokenAdmin = localStorage.getItem('inspectorToken') || '';
      
      // Prepara dados para salvamento
      mostrarLoading('Salvando configuração dos modais...');
      const response = await fetch(URL_PLANILHA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          acao: 'save_config_modais',
          config: JSON.stringify(this.configModais),
          apelidoAdmin: apelidoAdmin,
          senhaAdmin: validacao.senha,
          tokenAdmin: tokenAdmin
        })
      });
      const result = await response.json();
      ocultarLoading();
      
      if (!result.sucesso) {
        if (result.erro && result.erro.includes('Sessão')) {
          alert('⚠️ Sessão expirada. Faça login novamente.');
          logoutInspector();
          return;
        }
        throw new Error(result.erro || 'Erro ao salvar configuração');
      }
      
      // Registra log das alterações
      await this.registrarLogModais(apelidoAdmin);
      
      alert('✅ Configuração dos modais salva com sucesso!');
      this.carregarModais();
      
    } catch (err) {
      ocultarLoading();
      console.error('Erro ao salvar modais:', err);
      alert('⚠️ Erro ao salvar configuração: ' + err.message);
    }
  }

  /**
   * Registra log das alterações nos modais
   */
  async registrarLogModais(apelidoAdmin) {
    try {
      const tokenAdmin = localStorage.getItem('inspectorToken') || '';
      const formData = new URLSearchParams();
      formData.append('acao', 'registrar_log_modais');
      formData.append('apelido', apelidoAdmin);
      formData.append('acao_log', 'Alteração nos modais');
      formData.append('detalhes', JSON.stringify(this.configModais));
      formData.append('tokenAdmin', tokenAdmin);
      
      await fetch(URL_PLANILHA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
      });
    } catch (err) {
      console.error('Erro ao registrar log:', err);
    }
  }

  /**
   * Ordena a tabela de usuários por coluna
   */
  ordenarTabela(coluna) {
    const container = getEl('usuarios-lista-container');
    if (!container) return;
    
    const table = container.querySelector('table');
    if (!table) return;
    
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    rows.sort((a, b) => {
      let aValue, bValue;
      
      switch(coluna) {
        case 'nome':
          aValue = a.cells[1].textContent.trim();
          bValue = b.cells[1].textContent.trim();
          break;
        case 'apelido':
          aValue = a.cells[2].textContent.trim();
          bValue = b.cells[2].textContent.trim();
          break;
        case 'matricula':
          aValue = a.cells[0].textContent.trim();
          bValue = b.cells[0].textContent.trim();
          break;
        case 'funcao':
          aValue = a.cells[3].textContent.trim();
          bValue = b.cells[3].textContent.trim();
          break;
        default:
          return 0;
      }
      
      return aValue.localeCompare(bValue, 'pt-BR');
    });
    
    // Reordena as linhas na tabela
    rows.forEach(row => tbody.appendChild(row));
  }

  /**
   * Redefine a senha de um usuário
   */
  async redefinirSenha(apelido, nome) {
    if (!confirm(`⚠️ Deseja gerar uma nova senha para o usuário "${nome}"?\n\nA nova senha será exibida uma única vez e o hash será atualizado automaticamente.`)) {
      return;
    }
    
    // Validação da senha do admin
    try {
      const validacao = await validarSenhaAdmin();
      if (!validacao.valido) {
        alert('⚠️ Validação de senha necessária para redefinir senha.');
        return;
      }
      
      // Gera uma nova senha aleatória
      const novaSenha = Math.random().toString(36).substring(2, 10).toUpperCase() + 
                        Math.floor(Math.random() * 100).toString();
      
      const apelidoAdmin = localStorage.getItem('inspectorApelido') || sessionStorage.getItem('inspectorApelido');
      const tokenAdmin = localStorage.getItem('inspectorToken') || '';
      
      mostrarLoading('Redefinindo senha...');
      const response = await fetch(URL_PLANILHA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          acao: 'admin_redefinir_senha',
          apelido: apelido,
          novaSenha: novaSenha,
          senhaAdmin: validacao.senha,
          apelidoAdmin: apelidoAdmin,
          tokenAdmin: tokenAdmin
        })
      });
      const result = await response.json();
      ocultarLoading();
      
      if (!result.sucesso) {
        if (result.erro && result.erro.includes('Sessão')) {
          alert('⚠️ Sessão expirada. Faça login novamente.');
          logoutInspector();
          return;
        }
        throw new Error(result.erro || 'Erro ao redefinir senha');
      }
      
      alert(`✅ Senha redefinida com sucesso!\n\nUsuário: ${nome}\nNova senha: ${novaSenha}\n\n⚠️ Esta senha não será exibida novamente. Oriente o usuário a alterá-la no próximo login.`);
      
    } catch (err) {
      ocultarLoading();
      console.error('Erro ao redefinir senha:', err);
      alert('⚠️ Erro ao redefinir senha: ' + err.message);
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
      alert('⚠️ Erro ao carregar dados do usuário: ' + err.message);
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
    
    try {
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
        
        const result = await adminCreateUsuarioAPI({ 
          matricula, 
          nome, 
          apelido: apelidoInput, 
          funcao, 
          senha 
        });
        alert('✅ ' + result.mensagem + '\n\nSenha definida: ' + senha);
        fecharModalAdminUsuario();
        this.pesquisarUsuarios();
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
        
        const result = await adminSaveUsuarioAPI(dadosAtualizar);
        alert('✅ ' + result.mensagem);
        fecharModalAdminUsuario();
        this.pesquisarUsuarios();
      }
    } catch (err) {
      alert('⚠️ ' + err.message);
    }
  }

  async toggleUsuario(apelido, ativoAtual) {
    const novoStatus = !ativoAtual;
    if (!confirm(`Tem certeza que deseja ${novoStatus ? 'habilitar' : 'desabilitar'} este usuário?`)) return;
    
    try {
      const result = await adminToggleUsuarioAPI(apelido, novoStatus);
      alert('✅ ' + result.mensagem);
      this.pesquisarUsuarios();
    } catch (err) {
      alert('⚠️ ' + err.message);
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
      const result = await adminDeleteUsuarioAPI(apelido);
      alert('✅ ' + result.mensagem);
      this.pesquisarUsuarios();
    } catch (err) {
      alert('⚠️ ' + err.message);
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
        ['usuarios', 'modais'].forEach(t => {
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
window.validarAdmin = validarAdmin;
window.fecharModalValidacaoSenha = fecharModalValidacaoSenha;
window.confirmarValidacaoSenha = confirmarValidacaoSenha;
window.gerarTokenUsuario = gerarTokenUsuario;
window.toggleSenhaVisibility = toggleSenhaVisibility;
window.gerarSenhaSugerida = gerarSenhaSugerida;
window.renderizarModaisNaTela = function() {
  if (window.adminPanel && window.adminPanel.renderizarModaisNaTela) {
    window.adminPanel.renderizarModaisNaTela();
  }
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

// Exportar funções para escopo global (depois de definidas)
window.toggleSenhaVisibility = toggleSenhaVisibility;
window.gerarSenhaSugerida = gerarSenhaSugerida;

/**
 * Módulo de Administração do Sistema
 * Gerencia usuários, configurações e botões dinâmicos via API
 * 
 * Dependências:
 * - api.js (para requisições autenticadas)
 * - config.js (ENDPOINTS)
 * - tokenManager.js (para obter token e dados do usuário)
 */
import api from './api.js';
import { ENDPOINTS } from './config.js';
import { getUserData } from './tokenManager.js';

// ====================================================================
// API DE USUÁRIOS (Admin)
// ====================================================================
async function adminGetUsuariosAPI(filtro = '') {
  try {
    const params = filtro ? { filtro } : {};
    const data = await api.get(ENDPOINTS.ADMIN_USUARIOS, params);
    return { sucesso: true, usuarios: data };
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
    return { sucesso: false, erro: err.message, usuarios: [] };
  }
}

async function adminSaveUsuarioAPI(usuario) {
  try {
    const data = await api.put(`${ENDPOINTS.ADMIN_USUARIOS}/${usuario.apelido}`, usuario);
    return { sucesso: true, mensagem: 'Usuário atualizado com sucesso!' };
  } catch (err) {
    return { sucesso: false, erro: err.message };
  }
}

async function adminCreateUsuarioAPI(usuario) {
  try {
    const data = await api.post(ENDPOINTS.ADMIN_USUARIOS, usuario);
    return { sucesso: true, mensagem: 'Usuário criado com sucesso!' };
  } catch (err) {
    return { sucesso: false, erro: err.message };
  }
}

async function adminDeleteUsuarioAPI(apelido) {
  try {
    await api.delete(`${ENDPOINTS.ADMIN_USUARIOS}/${apelido}`);
    return { sucesso: true, mensagem: 'Usuário excluído com sucesso!' };
  } catch (err) {
    return { sucesso: false, erro: err.message };
  }
}

async function adminToggleUsuarioAPI(apelido, ativo) {
  try {
    await api.patch(`${ENDPOINTS.ADMIN_USUARIOS}/${apelido}/toggle`, { ativo });
    return { sucesso: true, mensagem: `Usuário ${ativo ? 'habilitado' : 'desabilitado'} com sucesso!` };
  } catch (err) {
    return { sucesso: false, erro: err.message };
  }
}

// ====================================================================
// API DE CONFIGURAÇÕES (Botões, timeout, etc.)
// ====================================================================
async function adminGetConfigAPI() {
  try {
    const data = await api.get(ENDPOINTS.CONFIG);
    return { sucesso: true, dados: data };
  } catch (err) {
    return { sucesso: false, erro: err.message };
  }
}

async function adminSaveConfigAPI(config) {
  try {
    await api.put(ENDPOINTS.CONFIG, config);
    return { sucesso: true, mensagem: 'Configurações salvas com sucesso!' };
  } catch (err) {
    return { sucesso: false, erro: err.message };
  }
}

// ====================================================================
// CONTROLLER DO MODAL DE ADMINISTRAÇÃO
// ====================================================================
class AdminPanelController {
  constructor() {
    this.modalElement = null;
    this.contentElement = null;
    this.currentConfig = null;
    this.usuariosCache = [];
  }

  init() {
    this.modalElement = document.getElementById('modal-admin-panel');
    this.contentElement = document.getElementById('admin-panel-conteudo');
    if (!this.modalElement || !this.contentElement) {
      console.error('Elementos do painel admin não encontrados');
      return false;
    }
    return true;
  }

  open() {
    if (!this.init()) return;
    const userData = getUserData();
    if (!userData || userData.funcao !== 'ADMIN') {
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
        <button class="admin-tab" data-tab="botoes">🔘 Botões</button>
        <button class="admin-tab" data-tab="config">⚙️ Configurações</button>
        <button class="admin-tab" data-tab="logs">📋 Logs</button>
      </div>
      <div class="admin-tab-content" id="tab-usuarios" style="display:block;">
        ${this.renderTabUsuarios()}
      </div>
      <div class="admin-tab-content" id="tab-botoes" style="display:none;">
        ${this.renderTabBotoes()}
      </div>
      <div class="admin-tab-content" id="tab-config" style="display:none;">
        ${this.renderTabConfig()}
      </div>
      <div class="admin-tab-content" id="tab-logs" style="display:none;">
        ${this.renderTabLogs()}
      </div>
    `;
    this.attachTabListeners();
    this.carregarConfiguracoes();
    // Carrega usuários após renderizar
    this.pesquisarUsuarios();
  }

  // ====================================================================
  // ABA: USUÁRIOS
  // ====================================================================
  renderTabUsuarios() {
    return `
      <h3>Gerenciar Usuários</h3>
      <div class="admin-section">
        <div class="usuarios-search-bar">
          <input type="text" id="usuario-pesquisa-input" placeholder="Pesquisar por nome, apelido ou matrícula..." oninput="adminPanel.pesquisarUsuarios()">
          <button class="btn-principal" onclick="adminPanel.pesquisarUsuarios()">🔍 Pesquisar</button>
        </div>
        <div id="usuarios-lista-container">
          <p class="admin-info">Digite para pesquisar usuários.</p>
        </div>
        <div class="admin-actions">
          <button class="btn-principal" onclick="adminPanel.abrirModalNovoUsuario()">+ Novo Usuário</button>
        </div>
      </div>
    `;
  }

  async pesquisarUsuarios() {
    const input = document.getElementById('usuario-pesquisa-input');
    const filtro = input ? input.value.trim() : '';
    const container = document.getElementById('usuarios-lista-container');
    if (container) {
      container.innerHTML = '<p class="admin-info">⏳ Buscando usuários...</p>';
    }
    try {
      const resultado = await adminGetUsuariosAPI(filtro);
      if (resultado.sucesso) {
        this.usuariosCache = resultado.usuarios || [];
        this.renderizarListaUsuarios(this.usuariosCache);
      } else {
        container.innerHTML = `<p class="admin-info" style="color:#d11a2d;">⚠️ ${resultado.erro}</p>`;
      }
    } catch (err) {
      container.innerHTML = `<p class="admin-info" style="color:#d11a2d;">⚠️ Erro ao buscar usuários: ${err.message}</p>`;
    }
  }

  renderizarListaUsuarios(usuarios) {
    const container = document.getElementById('usuarios-lista-container');
    if (!container) return;
    if (!usuarios || usuarios.length === 0) {
      container.innerHTML = '<p class="admin-info">Nenhum usuário encontrado.</p>';
      return;
    }

    let html = `
      <div style="margin-bottom: 15px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
        <span style="font-weight: bold;">Ordenar por:</span>
        <button class="btn-secundario" onclick="adminPanel.ordenarTabela('nome')" style="padding: 5px 10px; font-size: 0.85rem;">Nome</button>
        <button class="btn-secundario" onclick="adminPanel.ordenarTabela('apelido')" style="padding: 5px 10px; font-size: 0.85rem;">Apelido</button>
        <button class="btn-secundario" onclick="adminPanel.ordenarTabela('matricula')" style="padding: 5px 10px; font-size: 0.85rem;">Chapa</button>
        <button class="btn-secundario" onclick="adminPanel.ordenarTabela('funcao')" style="padding: 5px 10px; font-size: 0.85rem;">Função</button>
      </div>
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
    `;

    usuarios.forEach(u => {
      html += `
        <tr data-apelido="${u.apelido}">
          <td>${u.matricula || ''}</td>
          <td>${u.nome}</td>
          <td>${u.apelido}</td>
          <td>${u.funcao || ''}</td>
          <td><span class="status-badge ${u.ativo === true ? 'ativo' : 'inativo'}">${u.ativo === true ? 'Ativo' : 'Inativo'}</span></td>
          <td>
            <button class="btn-admin-action" onclick="adminPanel.editarUsuario('${u.apelido}')" title="Editar">✏️</button>
            <button class="btn-admin-action" onclick="adminPanel.redefinirSenha('${u.apelido}', '${u.nome}')" title="Redefinir Senha">🔑</button>
            <button class="btn-admin-action" onclick="adminPanel.toggleUsuario('${u.apelido}', ${u.ativo === true})" title="${u.ativo === true ? 'Desabilitar' : 'Habilitar'}">${u.ativo === true ? '🔒' : '🔓'}</button>
            <button class="btn-admin-action btn-delete" onclick="adminPanel.confirmarExclusao('${u.apelido}')" title="Excluir">🗑️</button>
          </td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
  }

  ordenarTabela(coluna) {
    const container = document.getElementById('usuarios-lista-container');
    if (!container) return;
    const table = container.querySelector('table');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    rows.sort((a, b) => {
      let aValue, bValue;
      const idx = { nome: 1, apelido: 2, matricula: 0, funcao: 3 };
      aValue = a.cells[idx[coluna]]?.textContent.trim() || '';
      bValue = b.cells[idx[coluna]]?.textContent.trim() || '';
      return aValue.localeCompare(bValue, 'pt-BR');
    });
    rows.forEach(row => tbody.appendChild(row));
  }

  // ====================================================================
  // USUÁRIO - CRUD
  // ====================================================================
  abrirModalNovoUsuario() {
    let modal = document.getElementById('modal-admin-usuario');
    if (!modal) this.criarModalUsuario();
    modal = document.getElementById('modal-admin-usuario');
    if (!modal) return;

    document.getElementById('modal-usuario-titulo').textContent = 'Novo Usuário';
    const form = document.getElementById('form-admin-usuario');
    form.reset();
    form.dataset.mode = 'create';
    form.dataset.apelido = '';
    document.getElementById('usuario-matricula-field').style.display = 'block';
    document.getElementById('usuario-apelido-field').style.display = 'block';
    modal.style.display = 'flex';
  }

  async editarUsuario(apelido) {
    try {
      const resultado = await adminGetUsuariosAPI(apelido);
      if (!resultado.sucesso || !resultado.usuarios || resultado.usuarios.length === 0) {
        alert('⚠️ Usuário não encontrado.');
        return;
      }
      const usuario = resultado.usuarios[0];
      let modal = document.getElementById('modal-admin-usuario');
      if (!modal) this.criarModalUsuario();
      modal = document.getElementById('modal-admin-usuario');
      if (!modal) return;

      document.getElementById('modal-usuario-titulo').textContent = 'Editar Usuário: ' + usuario.nome;
      const form = document.getElementById('form-admin-usuario');
      form.dataset.mode = 'edit';
      form.dataset.apelido = apelido;
      document.getElementById('usuario-matricula').value = usuario.matricula || '';
      document.getElementById('usuario-nome').value = usuario.nome;
      document.getElementById('usuario-funcao').value = usuario.funcao || '';
      document.getElementById('usuario-senha').value = '';
      document.getElementById('usuario-senha-confirm').value = '';
      document.getElementById('usuario-matricula-field').style.display = 'none';
      document.getElementById('usuario-apelido-field').style.display = 'none';
      modal.style.display = 'flex';
    } catch (err) {
      alert('⚠️ Erro ao carregar dados do usuário.');
    }
  }

  async salvarUsuario() {
    const form = document.getElementById('form-admin-usuario');
    if (!form) return;
    const matricula = document.getElementById('usuario-matricula')?.value.trim() || '';
    const nome = document.getElementById('usuario-nome').value.trim();
    const apelidoInput = document.getElementById('usuario-apelido')?.value.trim() || '';
    const funcao = document.getElementById('usuario-funcao').value.trim();
    const senha = document.getElementById('usuario-senha').value;
    const senhaConfirm = document.getElementById('usuario-senha-confirm').value;
    const mode = form.dataset.mode;
    const apelido = form.dataset.apelido;

    if (!nome || !funcao) {
      alert('⚠️ Nome e Função são obrigatórios.');
      return;
    }

    if (mode === 'create') {
      if (!matricula || !apelidoInput) {
        alert('⚠️ Matrícula e Apelido são obrigatórios para criar usuário.');
        return;
      }
      if (!senha || !senhaConfirm) {
        alert('⚠️ Senha e confirmação são obrigatórias.');
        return;
      }
      if (senha !== senhaConfirm) {
        alert('⚠️ As senhas não coincidem.');
        return;
      }
      try {
        const result = await adminCreateUsuarioAPI({ matricula, nome, apelido: apelidoInput, funcao, senha });
        if (result.sucesso) {
          alert('✅ Usuário criado com sucesso!');
          this.fecharModalUsuario();
          this.pesquisarUsuarios();
        } else {
          alert('⚠️ ' + result.erro);
        }
      } catch (err) {
        alert('⚠️ Erro ao criar usuário: ' + err.message);
      }
    } else {
      const dadosAtualizar = { apelido, funcao };
      if (senha) {
        if (!senhaConfirm) { alert('⚠️ Confirme a nova senha.'); return; }
        if (senha !== senhaConfirm) { alert('⚠️ As senhas não coincidem.'); return; }
        dadosAtualizar.senha = senha;
      }
      try {
        const result = await adminSaveUsuarioAPI(dadosAtualizar);
        if (result.sucesso) {
          alert('✅ Usuário atualizado com sucesso!');
          this.fecharModalUsuario();
          this.pesquisarUsuarios();
        } else {
          alert('⚠️ ' + result.erro);
        }
      } catch (err) {
        alert('⚠️ Erro ao atualizar usuário: ' + err.message);
      }
    }
  }

  async toggleUsuario(apelido, ativoAtual) {
    const novoStatus = !ativoAtual;
    if (!confirm(`Tem certeza que deseja ${novoStatus ? 'habilitar' : 'desabilitar'} este usuário?`)) return;
    try {
      const result = await adminToggleUsuarioAPI(apelido, novoStatus);
      if (result.sucesso) {
        alert(result.mensagem);
        this.pesquisarUsuarios();
      } else {
        alert('⚠️ ' + result.erro);
      }
    } catch (err) {
      alert('⚠️ Erro ao alterar status.');
    }
  }

  async confirmarExclusao(apelido) {
    if (!confirm('⚠️ Tem certeza que deseja EXCLUIR este usuário? Esta ação não pode ser desfeita!')) return;
    try {
      const result = await adminDeleteUsuarioAPI(apelido);
      if (result.sucesso) {
        alert(result.mensagem);
        this.pesquisarUsuarios();
      } else {
        alert('⚠️ ' + result.erro);
      }
    } catch (err) {
      alert('⚠️ Erro ao excluir usuário.');
    }
  }

  async redefinirSenha(apelido, nome) {
    if (!confirm(`⚠️ Deseja gerar uma nova senha para "${nome}"?`)) return;
    try {
      const novaSenha = Math.random().toString(36).substring(2, 10).toUpperCase() +
                        Math.floor(Math.random() * 100).toString();
      const result = await adminSaveUsuarioAPI({ apelido, senha: novaSenha });
      if (result.sucesso) {
        alert(`✅ Nova senha para ${nome}: ${novaSenha}\n\n⚠️ Esta senha não será exibida novamente.`);
        this.pesquisarUsuarios();
      } else {
        alert('⚠️ ' + result.erro);
      }
    } catch (err) {
      alert('⚠️ Erro ao redefinir senha.');
    }
  }

  fecharModalUsuario() {
    const modal = document.getElementById('modal-admin-usuario');
    if (modal) modal.style.display = 'none';
  }

  criarModalUsuario() {
    const modalHtml = `
      <div id="modal-admin-usuario" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title" id="modal-usuario-titulo">Usuário</h2>
            <button class="modal-close" onclick="adminPanel.fecharModalUsuario()">×</button>
          </div>
          <form id="form-admin-usuario" data-mode="" data-apelido="">
            <div class="form-group" id="usuario-matricula-field">
              <label>Matrícula:</label>
              <input type="text" id="usuario-matricula" placeholder="Digite a matrícula">
            </div>
            <div class="form-group" id="usuario-apelido-field">
              <label>Apelido:</label>
              <input type="text" id="usuario-apelido" placeholder="Digite o apelido">
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
                <input type="password" id="usuario-senha" placeholder="Digite a senha (deixe em branco para manter)" style="flex:1;">
                <button type="button" class="btn-icon" onclick="toggleSenhaVisibility('usuario-senha')">👁️</button>
                <button type="button" class="btn-icon" onclick="adminPanel.gerarSenhaSugerida()">🎲</button>
              </div>
              <small id="senha-sugerida-info" style="color:#666;font-size:0.8rem;display:none;">Senha sugerida: <strong id="senha-sugerida-text"></strong></small>
            </div>
            <div class="form-group">
              <label>Confirmar Senha:</label>
              <div style="display: flex; gap: 10px; align-items: center;">
                <input type="password" id="usuario-senha-confirm" placeholder="Confirme a senha" style="flex:1;">
                <button type="button" class="btn-icon" onclick="toggleSenhaVisibility('usuario-senha-confirm')">👁️</button>
              </div>
            </div>
            <div class="admin-actions">
              <button type="button" class="btn-secundario" onclick="adminPanel.fecharModalUsuario()">Cancelar</button>
              <button type="button" class="btn-principal" onclick="adminPanel.salvarUsuario()">💾 Salvar</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  gerarSenhaSugerida() {
    const matricula = document.getElementById('usuario-matricula')?.value || '';
    const apelido = document.getElementById('usuario-apelido')?.value || '';
    if (!matricula || !apelido) return;
    const senhaGerada = this.gerarTokenUsuario(matricula, apelido);
    const infoEl = document.getElementById('senha-sugerida-info');
    const textoEl = document.getElementById('senha-sugerida-text');
    const senhaInput = document.getElementById('usuario-senha');
    const confirmInput = document.getElementById('usuario-senha-confirm');
    if (infoEl && textoEl) {
      textoEl.textContent = senhaGerada;
      infoEl.style.display = 'block';
    }
    if (senhaInput) senhaInput.value = senhaGerada;
    if (confirmInput) confirmInput.value = senhaGerada;
  }

  gerarTokenUsuario(matricula, apelido) {
    const numerosMatricula = matricula.replace(/[^0-9]/g, '');
    const letrasApelido = apelido.replace(/[^a-zA-Z]/g, '').toUpperCase();
    let numerosSelecionados = '';
    for (let i = 0; i < Math.min(3, numerosMatricula.length); i++) {
      numerosSelecionados += numerosMatricula[i];
    }
    while (numerosSelecionados.length < 3) {
      numerosSelecionados += Math.floor(Math.random() * 10);
    }
    let letraSelecionada = '';
    if (letrasApelido.length > 0) {
      letraSelecionada = letrasApelido[Math.floor(Math.random() * letrasApelido.length)];
    } else {
      const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      letraSelecionada = letras[Math.floor(Math.random() * letras.length)];
    }
    const caracteres = numerosSelecionados.split('').concat([letraSelecionada]);
    for (let i = caracteres.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]];
    }
    return caracteres.join('');
  }

  // ====================================================================
  // ABA: BOTÕES
  // ====================================================================
  renderTabBotoes() {
    return `
      <h3>Gerenciar Botões Dinâmicos</h3>
      <div class="admin-section">
        <h4>Botões - Clandestinos / RTO</h4>
        <div id="botoes-clandestinos-container"></div>
        <button class="btn-admin-add" onclick="adminPanel.adicionarBotao('clandestinos')">+ Adicionar Botão</button>
      </div>
      <div class="admin-section">
        <h4>Botões - Levantamentos</h4>
        <div id="botoes-levantamentos-container"></div>
        <button class="btn-admin-add" onclick="adminPanel.adicionarBotao('levantamentos')">+ Adicionar Botão</button>
      </div>
      <div class="admin-section">
        <h4>Botões - Inspeções 5S</h4>
        <div id="botoes-inspecoes5s-container"></div>
        <button class="btn-admin-add" onclick="adminPanel.adicionarBotao('inspecoes5s')">+ Adicionar Botão</button>
      </div>
      <div class="admin-actions">
        <button class="btn-principal" onclick="adminPanel.salvarBotoes()">💾 Salvar Botões</button>
      </div>
    `;
  }

  renderBotoes(categoria, botoes) {
    const containerId = `botoes-${categoria}-container`;
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!botoes || botoes.length === 0) {
      container.innerHTML = '<p class="admin-info">Nenhum botão configurado.</p>';
      return;
    }
    let html = '';
    botoes.forEach((botao, idx) => {
      html += `
        <div class="admin-botao-item" data-idx="${idx}">
          <input type="text" class="admin-input-texto" value="${botao.texto || ''}" placeholder="Texto do botão" style="flex:1;">
          <input type="url" class="admin-input-url" value="${botao.url || ''}" placeholder="URL" style="flex:2;">
          <button class="btn-admin-remove" onclick="adminPanel.removerBotao('${categoria}', ${idx})">❌</button>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  adicionarBotao(categoria) {
    const botoes = this.getBotoesCategoria(categoria);
    botoes.push({ texto: 'Novo Botão', url: 'https://' });
    this.renderBotoes(categoria, botoes);
  }

  removerBotao(categoria, idx) {
    const botoes = this.getBotoesCategoria(categoria);
    if (idx >= 0 && idx < botoes.length) {
      botoes.splice(idx, 1);
      this.renderBotoes(categoria, botoes);
    }
  }

  getBotoesCategoria(categoria) {
    const key = categoria === 'clandestinos' ? 'BOTOES_CLANDESTINOS' :
                categoria === 'levantamentos' ? 'BOTOES_LEVANTAMENTOS' :
                'BOTOES_INSPICOES_5S';
    return this.currentConfig && this.currentConfig[key] ? JSON.parse(this.currentConfig[key]) : [];
  }

  setBotoesCategoria(categoria, botoes) {
    const key = categoria === 'clandestinos' ? 'BOTOES_CLANDESTINOS' :
                categoria === 'levantamentos' ? 'BOTOES_LEVANTAMENTOS' :
                'BOTOES_INSPICOES_5S';
    this.currentConfig[key] = JSON.stringify(botoes);
  }

  async salvarBotoes() {
    // Coleta dados dos inputs
    const categorias = ['clandestinos', 'levantamentos', 'inspecoes5s'];
    for (const cat of categorias) {
      const container = document.getElementById(`botoes-${cat}-container`);
      if (!container) continue;
      const items = container.querySelectorAll('.admin-botao-item');
      const botoes = [];
      items.forEach(item => {
        const texto = item.querySelector('.admin-input-texto')?.value?.trim() || '';
        const url = item.querySelector('.admin-input-url')?.value?.trim() || '';
        if (texto && url) {
          botoes.push({ texto, url });
        }
      });
      this.setBotoesCategoria(cat, botoes);
    }
    // Salva no backend
    try {
      const result = await adminSaveConfigAPI(this.currentConfig);
      if (result.sucesso) {
        alert('✅ Botões salvos com sucesso!');
        this.carregarConfiguracoes();
      } else {
        alert('⚠️ ' + result.erro);
      }
    } catch (err) {
      alert('⚠️ Erro ao salvar botões: ' + err.message);
    }
  }

  // ====================================================================
  // ABA: CONFIGURAÇÕES
  // ====================================================================
  renderTabConfig() {
    return `
      <h3>Configurações Gerais</h3>
      <div class="admin-section">
        <div class="form-group">
          <label>Timeout de Inatividade (ms):</label>
          <input type="number" id="admin-timeout" value="${this.currentConfig?.TIMEOUT_INATIVIDADE || 1200000}" step="60000">
          <small style="display:block;color:#666;font-size:0.8rem;">Valor em milissegundos (ex: 1200000 = 20 min)</small>
        </div>
        <div class="form-group" style="margin-top:15px;">
          <label>
            <input type="checkbox" id="admin-debug" ${this.currentConfig?.MODO_DEBUG === 'true' ? 'checked' : ''}>
            Modo Debug
          </label>
        </div>
        <div class="admin-actions" style="margin-top:15px;">
          <button class="btn-principal" onclick="adminPanel.salvarConfig()">💾 Salvar Configurações</button>
        </div>
      </div>
    `;
  }

  async salvarConfig() {
    const timeout = parseInt(document.getElementById('admin-timeout')?.value) || 1200000;
    const debug = document.getElementById('admin-debug')?.checked ? 'true' : 'false';
    const config = {
      TIMEOUT_INATIVIDADE: String(timeout),
      MODO_DEBUG: debug,
      ...this.currentConfig
    };
    try {
      const result = await adminSaveConfigAPI(config);
      if (result.sucesso) {
        alert('✅ Configurações salvas com sucesso!');
        this.currentConfig = config;
        // Atualiza timeout em tempo real
        if (typeof window.carregarTimeoutInatividade === 'function') {
          window.carregarTimeoutInatividade();
        }
      } else {
        alert('⚠️ ' + result.erro);
      }
    } catch (err) {
      alert('⚠️ Erro ao salvar configurações: ' + err.message);
    }
  }

  // ====================================================================
  // ABA: LOGS
  // ====================================================================
  renderTabLogs() {
    return `
      <h3>Logs de Acesso</h3>
      <div class="admin-section">
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:15px;">
          <input type="text" id="filtro-logs-usuario" placeholder="Filtrar por usuário" style="flex:1;padding:8px;border:1px solid #ccc;border-radius:6px;">
          <input type="date" id="filtro-logs-inicio" style="padding:8px;border:1px solid #ccc;border-radius:6px;">
          <input type="date" id="filtro-logs-fim" style="padding:8px;border:1px solid #ccc;border-radius:6px;">
          <button class="btn-principal" onclick="adminPanel.carregarLogs()">🔍 Buscar</button>
        </div>
        <div id="logs-lista-container">
          <p class="admin-info">Clique em "Buscar" para carregar os logs.</p>
        </div>
      </div>
    `;
  }

  async carregarLogs() {
    const usuario = document.getElementById('filtro-logs-usuario')?.value || '';
    const dataInicio = document.getElementById('filtro-logs-inicio')?.value || '';
    const dataFim = document.getElementById('filtro-logs-fim')?.value || '';
    const container = document.getElementById('logs-lista-container');
    if (container) container.innerHTML = '<p class="admin-info">⏳ Carregando logs...</p>';
    try {
      const params = {};
      if (usuario) params.email = usuario;
      if (dataInicio) params.dataInicio = dataInicio;
      if (dataFim) params.dataFim = dataFim;
      const logs = await api.get('/logs', params);
      if (logs && logs.length > 0) {
        let html = `<table class="admin-usuarios-tabela"><thead><tr><th>Data/Hora</th><th>Usuário</th><th>Ação</th><th>Detalhes</th></tr></thead><tbody>`;
        logs.forEach(log => {
          const dataHora = log.timestamp ? new Date(log.timestamp).toLocaleString('pt-BR') : '';
          html += `<tr><td>${dataHora}</td><td>${log.usuario || 'Anonimo'}</td><td>${log.acao || ''}</td><td>${log.detalhes || ''}</td></tr>`;
        });
        html += `</tbody></table>`;
        container.innerHTML = html;
      } else {
        container.innerHTML = '<p class="admin-info">Nenhum log encontrado.</p>';
      }
    } catch (err) {
      container.innerHTML = `<p class="admin-info" style="color:#d11a2d;">⚠️ Erro ao carregar logs: ${err.message}</p>`;
    }
  }

  // ====================================================================
  // CARREGAR CONFIGURAÇÕES
  // ====================================================================
  async carregarConfiguracoes() {
    try {
      const result = await adminGetConfigAPI();
      if (result.sucesso) {
        this.currentConfig = result.dados;
        // Atualiza abas que dependem das configurações
        this.renderBotoes('clandestinos', this.getBotoesCategoria('clandestinos'));
        this.renderBotoes('levantamentos', this.getBotoesCategoria('levantamentos'));
        this.renderBotoes('inspecoes5s', this.getBotoesCategoria('inspecoes5s'));
        // Atualiza aba de configurações se estiver visível
        const tabConfig = document.getElementById('tab-config');
        if (tabConfig && tabConfig.style.display !== 'none') {
          tabConfig.innerHTML = this.renderTabConfig();
          // Reaplica valores
          const timeoutInput = document.getElementById('admin-timeout');
          if (timeoutInput) timeoutInput.value = this.currentConfig.TIMEOUT_INATIVIDADE || 1200000;
          const debugInput = document.getElementById('admin-debug');
          if (debugInput) debugInput.checked = this.currentConfig.MODO_DEBUG === 'true';
        }
      } else {
        console.warn('Erro ao carregar configurações:', result.erro);
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    }
  }

  // ====================================================================
  // TABS
  // ====================================================================
  attachTabListeners() {
    const tabs = this.contentElement.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const tabName = tab.dataset.tab;
        ['usuarios', 'botoes', 'config', 'logs'].forEach(id => {
          const el = document.getElementById(`tab-${id}`);
          if (el) el.style.display = id === tabName ? 'block' : 'none';
        });
        if (tabName === 'logs') this.carregarLogs();
        if (tabName === 'config') {
          // Recarrega configurações se a aba for aberta
          this.carregarConfiguracoes();
        }
        if (tabName === 'botoes') {
          this.renderBotoes('clandestinos', this.getBotoesCategoria('clandestinos'));
          this.renderBotoes('levantamentos', this.getBotoesCategoria('levantamentos'));
          this.renderBotoes('inspecoes5s', this.getBotoesCategoria('inspecoes5s'));
        }
      });
    });
  }
}

// ====================================================================
// FUNÇÕES GLOBAIS PARA USO NOS ONCLICK HTML
// ====================================================================
let adminPanelInstance = null;

export function initAdminPanel() {
  if (!adminPanelInstance) {
    adminPanelInstance = new AdminPanelController();
  }
  return adminPanelInstance;
}

// Funções expostas globalmente para os eventos inline do HTML
window.adminPanel = null;
window.abrirModalAdmin = function() {
  if (!window.adminPanel) {
    window.adminPanel = initAdminPanel();
  }
  window.adminPanel.open();
};
window.fecharModalAdmin = function() {
  if (window.adminPanel) window.adminPanel.close();
};
window.fecharModalAdminUsuario = function() {
  if (window.adminPanel) window.adminPanel.fecharModalUsuario();
};

// Função auxiliar para toggle de senha (global)
window.toggleSenhaVisibility = function(inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
};

// Exporta a instância para uso em outros módulos
export default adminPanelInstance;
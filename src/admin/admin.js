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
  }
};

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

  renderTabUsuarios() {
    return `
      <h3>Gerenciar Usuários</h3>
      <p class="admin-info">Funcionalidade em desenvolvimento. Gerencie usuários diretamente na planilha.</p>
      <div class="admin-section">
        <button class="btn-secundario" onclick="window.open('https://sheets.google.com', '_blank')">📊 Abrir Planilha</button>
      </div>
    `;
  }

  renderTabConfig() {
    return `
      <h3>Configurações do Sistema</h3>
      <div class="admin-section">
        <label>
          <input type="checkbox" id="admin-debug-mode" onchange="adminPanel.toggleDebugMode(this.checked)">
          Modo Debug
        </label>
        <p class="admin-info">Ativa console móvel (vConsole) para depuração.</p>
      </div>
      <div class="admin-section">
        <button class="btn-secundario" onclick="adminPanel.limparCache()">🗑️ Limpar Cache</button>
        <p class="admin-info">Limpa cache local e recarrega a aplicação.</p>
      </div>
    `;
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
      <button class="btn-admin-remove" onclick="adminPanel.removerBotao(this)">🗑️</button>
    `;
    container.appendChild(div);
  }

  removerBotao(btn) {
    const item = btn.closest('.admin-botao-item');
    if (item) item.remove();
  }

  salvarBotoes() {
    const botoes = {
      clandestinos: this.capturarBotoes('clandestinos'),
      levantamentos: this.capturarBotoes('levantamentos'),
      inspecoes5s: this.capturarBotoes('inspecoes5s')
    };
    
    localStorage.setItem('adminBotoes', JSON.stringify(botoes));
    alert('✅ Botões salvos com sucesso! As alterações serão visíveis após recarregar a página.');
    this.close();
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

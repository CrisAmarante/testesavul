// ====================================================================
// acidente.js - Módulo de Relatório de Acidentes (VERSÃO OTIMIZADA)
// 
// ====================================================================
// ====================================================================
// VARIÁVEIS GLOBAIS DO MÓDULO
// ====================================================================
let acidenteAtualId = null;
let editMode = false;
let originalStatus = null;

// Dados por aba
let dadosCadastro = {};
let dadosAnalise = {};
let bensArray = [];
let vitimasArray = [];
let testemunhasArray = [];
let dadosParecer = {};

// Anexos
let fotosColetivoArray = [];
let fotosLocalArray = [];
let fotoCNHBase64 = null;

// Contadores para veículos/vítimas/testemunhas
let veiculoCounter = 0;
let vitimaCounter = 0;
let testemunhaCounter = 0;

// Autoridades presentes
let autoridadesPresentes = {};

// ====================================================================
// INICIALIZAÇÃO DOS EVENTOS DO MODAL
// ====================================================================
function initAcidenteModal() {
  // Event listeners para abas
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      ativarAba(tabId);
    });
  });

  // Carregar dados do inspetor na aba parecer
  carregarDadosInspetor();

  // Inicializar autocomplete
  iniciarAutoComplete();

  // Carregar lista de linhas no select
  carregarListaLinhas();

  // Preencher data atual
  preencherDataAtual();
  
  // Restaurar dados da sessionStorage se existirem (para persistência)
  restaurarDadosSessionStorage();
}

// ====================================================================
// RESTAURAR DADOS DO SESSIONSTORAGE
// ====================================================================
function restaurarDadosSessionStorage() {
  const isTestUser = localStorage.getItem('inspectorChapa') === '55555';
  
  // Restaurar dados do veículo
  const veiculoStr = sessionStorage.getItem('veiculo_atual');
  if (veiculoStr) {
    try {
      const veiculo = JSON.parse(veiculoStr);
      if (getEl('cadastro-placa') && veiculo.placa) getEl('cadastro-placa').value = veiculo.placa;
      if (getEl('cadastro-renavan') && veiculo.renavan) getEl('cadastro-renavan').value = veiculo.renavan;
      if (getEl('cadastro-ano-fab') && veiculo.ano) getEl('cadastro-ano-fab').value = veiculo.ano;
      if (getEl('cadastro-marca') && veiculo.marca) getEl('cadastro-marca').value = veiculo.marca;
      if (getEl('cadastro-modelo') && veiculo.modelo) getEl('cadastro-modelo').value = veiculo.modelo;
      if (getEl('cadastro-cor') && veiculo.cor) getEl('cadastro-cor').value = veiculo.cor;
      if (getEl('cadastro-cidade-onibus') && veiculo.cidade) getEl('cadastro-cidade-onibus').value = veiculo.cidade;
    } catch(e) { console.warn('Erro ao restaurar veículo:', e); }
  }
  
  // Restaurar dados do motorista
  const motoristaStr = sessionStorage.getItem('motorista_atual');
  if (motoristaStr) {
    try {
      const motorista = JSON.parse(motoristaStr);
      if (getEl('cadastro-apelido') && motorista.apelido) getEl('cadastro-apelido').value = motorista.apelido;
      if (getEl('cadastro-nome-completo') && motorista.nome) getEl('cadastro-nome-completo').value = motorista.nome;
      if (getEl('cadastro-cnh') && motorista.cnh) getEl('cadastro-cnh').value = motorista.cnh;
      if (getEl('cadastro-validade-cnh') && motorista.validade_cnh) getEl('cadastro-validade-cnh').value = motorista.validade_cnh;
      if (getEl('cadastro-moto-logradouro') && motorista.endereco) getEl('cadastro-moto-logradouro').value = motorista.endereco;
      if (getEl('cadastro-moto-bairro') && motorista.bairro) getEl('cadastro-moto-bairro').value = motorista.bairro;
      if (getEl('cadastro-moto-cidade') && motorista.cidade) getEl('cadastro-moto-cidade').value = motorista.cidade;
      if (getEl('cadastro-moto-complemento') && motorista.complemento) getEl('cadastro-moto-complemento').value = motorista.complemento;
      if (getEl('cadastro-nascimento') && motorista.nascimento) getEl('cadastro-nascimento').value = motorista.nascimento;
      if (getEl('cadastro-naturalidade') && motorista.naturalidade) getEl('cadastro-naturalidade').value = motorista.naturalidade;
      if (getEl('cadastro-nome-mae') && motorista.nome_mae) getEl('cadastro-nome-mae').value = motorista.nome_mae;
      if (getEl('cadastro-celular') && motorista.celular) getEl('cadastro-celular').value = motorista.celular;
    } catch(e) { console.warn('Erro ao restaurar motorista:', e); }
  }
}

function ativarAba(tabId) {
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const targetContent = document.getElementById(`tab-${tabId}`);
  if (targetContent) targetContent.classList.add('active');
  const targetBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
  if (targetBtn) targetBtn.classList.add('active');
}

// ====================================================================
// ABRIR E FECHAR MODAL
// ====================================================================
function abrirModalEnvio(acidenteId = null) {
  const modal = getEl('modal-envio-informacoes');
  if (!modal) return;
  
  if (!acidenteId) {
    iniciarNovoAcidente();
  } else {
    carregarAcidenteExistente(acidenteId);
  }
  
  modal.classList.add('is-open');
  initAcidenteModal();
}

function fecharModalEnvio() {
  const modal = getEl('modal-envio-informacoes');
  if (modal) modal.classList.remove('is-open');
}

// ====================================================================
// NOVO ACIDENTE
// ====================================================================
function iniciarNovoAcidente() {
  acidenteAtualId = Date.now().toString();
  editMode = false;
  originalStatus = null;
  
  // Resetar arrays
  bensArray = [];
  vitimasArray = [];
  testemunhasArray = [];
  fotosColetivoArray = [];
  fotosLocalArray = [];
  fotoCNHBase64 = null;
  veiculoCounter = 0;
  vitimaCounter = 0;
  testemunhaCounter = 0;
  autoridadesPresentes = {};
  
  // Resetar formulários
  limparFormularioCadastro();
  limparFormularioAnalise();
  limparFormularioParecer();
  
  // Renderizar containers vazios
  renderizarBensFixos();
  renderizarVitimasFixas();
  renderizarTestemunhasFixas();
  renderizarFotosColetivo();
  renderizarFotosLocal();
  
  // Limpar sessionStorage de dados temporários
  sessionStorage.removeItem('veiculo_atual');
  sessionStorage.removeItem('motorista_atual');
  
  // Carregar rascunho se existir
  carregarRascunhoLocal();
}

function limparFormularioCadastro() {
  const ids = ['cadastro-data', 'cadastro-hora', 'cadastro-logradouro', 'cadastro-bairro', 
               'cadastro-cidade', 'cadastro-cep', 'cadastro-codigo-linha', 'cadastro-nome-linha',
               'cadastro-sentido-linha', 'cadastro-prefixo', 'cadastro-placa', 'cadastro-renavan',
               'cadastro-ano-fab', 'cadastro-marca', 'cadastro-modelo', 'cadastro-cor',
               'cadastro-cidade-onibus', 'cadastro-chapa', 'cadastro-apelido', 'cadastro-nome-completo',
               'cadastro-cnh', 'cadastro-validade-cnh', 'cadastro-moto-logradouro', 'cadastro-moto-bairro',
               'cadastro-moto-cidade', 'cadastro-moto-complemento', 'cadastro-nascimento',
               'cadastro-naturalidade', 'cadastro-nome-mae', 'cadastro-celular', 'cadastro-historico'];
  ids.forEach(id => {
    const el = getEl(id);
    if (el) el.value = '';
  });
  
  // Reset radio buttons
  document.querySelectorAll('input[name="tipo-acidente"]').forEach(r => r.checked = false);
  
  // Clear preview
  const preview = getEl('preview-foto-cnh');
  if (preview) preview.innerHTML = '';
}

function limparFormularioAnalise() {
  // Clear checkboxes
  document.querySelectorAll('#tab-analise input[type="checkbox"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('#tab-analise input[type="radio"]').forEach(r => r.checked = false);
  
  // Clear text inputs
  const ids = ['analise-velocidade', 'analise-lotacao', 'analise-outros-local', 
               'analise-orgao', 'analise-responsavel-gestor', 'analise-protocolo'];
  ids.forEach(id => {
    const el = getEl(id);
    if (el) el.value = '';
  });
  
  // Hide conditional fields
  hideElement('div-movimentacao');
  hideElement('div-parado');
  hideElement('outros-local-desc');
  hideElement('orgao-gestor-fields');
  
  // Clear authority fields container
  const container = getEl('autoridades-fields-container');
  if (container) container.innerHTML = '';
}

function limparFormularioParecer() {
  const ids = ['parecer-visao', 'parecer-culpa-outros', 'parecer-motivo'];
  ids.forEach(id => {
    const el = getEl(id);
    if (el) el.value = '';
  });
  document.querySelectorAll('input[name="atribuicao-culpa"]').forEach(r => r.checked = false);
}

// ====================================================================
// RASCUNHO LOCAL
// ====================================================================
function carregarRascunhoLocal() {
  const chave = `rascunho_acidente_${acidenteAtualId}`;
  const dadosSalvos = localStorage.getItem(chave);
  if (dadosSalvos) {
    try {
      const rascunho = JSON.parse(dadosSalvos);
      preencherFormularioComDados(rascunho);
    } catch(e) { console.warn('Erro ao carregar rascunho local', e); }
  }
}

function preencherFormularioComDados(dados) {
  // Preencher cadastro
  if (dados.cadastro) {
    Object.keys(dados.cadastro).forEach(key => {
      const el = getEl(`cadastro-${key}`);
      if (el && key !== 'fotoCNH') el.value = dados.cadastro[key];
    });
  }
  
  // Preencher análise
  if (dados.analise) {
    Object.keys(dados.analise).forEach(key => {
      const el = getEl(`analise-${key}`);
      if (el) el.value = dados.analise[key];
    });
  }
  
  // Restaurar arrays
  if (dados.bens) { bensArray = dados.bens; renderizarBensFixos(); }
  if (dados.vitimas) { vitimasArray = dados.vitimas; renderizarVitimasFixas(); }
  if (dados.testemunhas) { testemunhasArray = dados.testemunhas; renderizarTestemunhasFixas(); }
  
  // Salvar dados em sessionStorage para persistência (se houver veículo e motorista)
  if (dados.cadastro?.prefixo) {
    sessionStorage.setItem('veiculo_atual', JSON.stringify({
      prefixo: dados.cadastro.prefixo,
      placa: dados.cadastro.placa || '',
      renavan: dados.cadastro.renavan || '',
      ano: dados.cadastro.anoFab || '',
      marca: dados.cadastro.marca || '',
      modelo: dados.cadastro.modelo || '',
      cor: dados.cadastro.cor || '',
      cidade: dados.cadastro.cidadeOnibus || ''
    }));
  }
  if (dados.cadastro?.chapa) {
    sessionStorage.setItem('motorista_atual', JSON.stringify({
      chapa: dados.cadastro.chapa,
      apelido: dados.cadastro.apelido || '',
      nome: dados.cadastro.nomeCompleto || '',
      cnh: dados.cadastro.cnh || '',
      validade_cnh: dados.cadastro.validadeCnh || '',
      endereco: dados.cadastro.motoLogradouro || '',
      bairro: dados.cadastro.motoBairro || '',
      cidade: dados.cadastro.motoCidade || '',
      complemento: dados.cadastro.motoComplemento || '',
      nascimento: dados.cadastro.nascimento || '',
      naturalidade: dados.cadastro.naturalidade || '',
      nome_mae: dados.cadastro.nomeMae || '',
      celular: dados.cadastro.celular || ''
    }));
  }
  
  // Avisar se havia fotos no rascunho original
  if (dados._temFotos) {
    console.log('ℹ️ Este rascunho continha fotos que não foram salvas localmente. Você precisará reenviá-las.');
  } else {
    if (dados.fotosColetivo) { fotosColetivoArray = dados.fotosColetivo; renderizarFotosColetivo(); }
    if (dados.fotosLocal) { fotosLocalArray = dados.fotosLocal; renderizarFotosLocal(); }
  }
}

function salvarRascunhoLocal() {
  try {
    const dados = montarObjetoAcidenteCompleto();
    
    // Criar cópia para rascunho SEM as fotos (para não estourar quota do localStorage)
    const dadosParaRascunho = {
      id: dados.id,
      status: dados.status,
      fiscal: dados.fiscal,
      cadastro: { ...dados.cadastro, fotoCNH: null }, // Remove foto CNH
      analise: dados.analise,
      bens: dados.bens,
      vitimas: dados.vitimas,
      testemunhas: dados.testemunhas,
      parecer: dados.parecer,
      fotosColetivo: [], // Remove fotos coletivo
      fotosLocal: [],    // Remove fotos local
      finalizado: dados.finalizado,
      _temFotos: !!(dados.cadastro.fotoCNH || dados.fotosColetivo?.length || dados.fotosLocal?.length)
    };
    
    const chave = `rascunho_acidente_${acidenteAtualId}`;
    const dadosString = JSON.stringify(dadosParaRascunho);
    
    // Verificar tamanho antes de salvar
    const tamanhoEstimado = new Blob([dadosString]).size;
    if (tamanhoEstimado > 4 * 1024 * 1024) { // 4MB de segurança
      console.warn('⚠️ Rascunho muito grande (' + Math.round(tamanhoEstimado/1024) + 'KB). Salvamento local pode falhar.');
    }
    
    localStorage.setItem(chave, dadosString);
    console.log('✓ Rascunho salvo localmente (' + Math.round(tamanhoEstimado/1024) + 'KB)');
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      console.error('❌ Quota do localStorage excedida! Dados podem ter sido perdidos no rascunho local.');
      alert('⚠️ Aviso: O rascunho local não pôde ser salvo devido ao limite de armazenamento do navegador.\n\nIsso não afeta o salvamento final no servidor. Recomendamos finalizar o relatório o quanto antes.');
    } else {
      console.error('Erro ao salvar rascunho local:', e);
    }
  }
}

// ====================================================================
// SALVAR ABAS INDIVIDUAIS
// ====================================================================
async function salvarAbaCadastro() {
  coletarDadosCadastro();
  salvarRascunhoLocal();
  mostrarFeedback('✅ Dados da aba Cadastro salvos!');
}

async function salvarAbaAnalise() {
  coletarDadosAnalise();
  salvarRascunhoLocal();
  mostrarFeedback('✅ Dados da aba Análise salvos!');
}

async function salvarAbaBens() {
  salvarRascunhoLocal();
  mostrarFeedback('✅ Dados da aba Bens salvos!');
}

async function salvarAbaVitimas() {
  salvarRascunhoLocal();
  mostrarFeedback('✅ Dados da aba Vítimas salvos!');
}

async function salvarAbaTestemunhas() {
  salvarRascunhoLocal();
  mostrarFeedback('✅ Dados da aba Testemunhas salvos!');
}

async function salvarAbaParecer() {
  coletarDadosParecer();
  salvarRascunhoLocal();
  mostrarFeedback('✅ Dados da aba Parecer salvos!');
}

function mostrarFeedback(mensagem) {
  alert(mensagem);
}

// ====================================================================
// COLETAR DADOS DAS ABAS
// ====================================================================
function coletarDadosCadastro() {
  dadosCadastro = {
    tipoAcidente: getSelectedRadioValue('tipo-acidente'),
    data: getEl('cadastro-data')?.value || '',
    hora: getEl('cadastro-hora')?.value || '',
    logradouro: getEl('cadastro-logradouro')?.value || '',
    bairro: getEl('cadastro-bairro')?.value || '',
    cidade: getEl('cadastro-cidade')?.value || '',
    cep: getEl('cadastro-cep')?.value || '',
    codigoLinha: getEl('cadastro-codigo-linha')?.value || '',
    nomeLinha: getEl('cadastro-nome-linha')?.value || '',
    sentidoLinha: getEl('cadastro-sentido-linha')?.value || '',
    prefixo: getEl('cadastro-prefixo')?.value || '',
    placa: getEl('cadastro-placa')?.value || '',
    renavan: getEl('cadastro-renavan')?.value || '',
    anoFab: getEl('cadastro-ano-fab')?.value || '',
    marca: getEl('cadastro-marca')?.value || '',
    modelo: getEl('cadastro-modelo')?.value || '',
    cor: getEl('cadastro-cor')?.value || '',
    cidadeOnibus: getEl('cadastro-cidade-onibus')?.value || '',
    chapa: getEl('cadastro-chapa')?.value || '',
    apelido: getEl('cadastro-apelido')?.value || '',
    nomeCompleto: getEl('cadastro-nome-completo')?.value || '',
    cnh: getEl('cadastro-cnh')?.value || '',
    validadeCnh: getEl('cadastro-validade-cnh')?.value || '',
    motoLogradouro: getEl('cadastro-moto-logradouro')?.value || '',
    motoBairro: getEl('cadastro-moto-bairro')?.value || '',
    motoCidade: getEl('cadastro-moto-cidade')?.value || '',
    motoComplemento: getEl('cadastro-moto-complemento')?.value || '',
    nascimento: getEl('cadastro-nascimento')?.value || '',
    naturalidade: getEl('cadastro-naturalidade')?.value || '',
    nomeMae: getEl('cadastro-nome-mae')?.value || '',
    celular: getEl('cadastro-celular')?.value || '',
    historico: getEl('cadastro-historico')?.value || '',
    fotoCNH: fotoCNHBase64
  };
}

function coletarDadosAnalise() {
  dadosAnalise = {
    situacaoOnibus: getCheckedValues('situacao-onibus'),
    movimentacao: getCheckedValues('movimentacao'),
    velocidade: getEl('analise-velocidade')?.value || '',
    paradoSituacao: getCheckedValues('parado-situacao'),
    lotacao: getEl('analise-lotacao')?.value || '',
    parteAvariada: getCheckedValues('parte-avariada'),
    danosResultantes: getCheckedValues('danos-resultantes'),
    periodo: getCheckedValues('periodo'),
    clima: getCheckedValues('clima'),
    iluminacao: getCheckedValues('iluminacao'),
    visibilidade: getCheckedValues('visibilidade'),
    tipoAcidenteAnalise: getCheckedValues('tipo-acidente-analise'),
    localPreenchimento: getCheckedValues('local-preenchimento'),
    outrosLocal: getEl('analise-outros-local')?.value || '',
    autoridades: getCheckedValues('autoridades'),
    orgaoGestor: getSelectedRadioValue('orgao_gestor'),
    orgao: getEl('analise-orgao')?.value || '',
    responsavelGestor: getEl('analise-responsavel-gestor')?.value || '',
    protocolo: getEl('analise-protocolo')?.value || ''
  };
}

function coletarDadosParecer() {
  dadosParecer = {
    inspetor: getEl('parecer-inspetor')?.value || '',
    chapa: getEl('parecer-chapa')?.value || '',
    nomeCompleto: getEl('parecer-nome-completo')?.value || '',
    visao: getEl('parecer-visao')?.value || '',
    atribuicaoCulpa: getSelectedRadioValue('atribuicao-culpa'),
    culpaOutros: getEl('parecer-culpa-outros')?.value || '',
    motivo: getEl('parecer-motivo')?.value || ''
  };
}

// ====================================================================
// MONTAR OBJETO COMPLETO DO ACIDENTE
// ====================================================================
function montarObjetoAcidenteCompleto() {
  return {
    id: acidenteAtualId,
    status: editMode ? originalStatus : 'EM_ANDAMENTO',
    fiscal: localStorage.getItem('inspectorApelido'),
    cadastro: dadosCadastro,
    analise: dadosAnalise,
    bens: bensArray,
    vitimas: vitimasArray,
    testemunhas: testemunhasArray,
    parecer: dadosParecer,
    fotosColetivo: fotosColetivoArray,
    fotosLocal: fotosLocalArray,
    finalizado: (originalStatus === 'FINALIZADO') ? true : false
  };
}

// ====================================================================
// FINALIZAR ACIDENTE COMPLETO
// ====================================================================
async function finalizarAcidenteCompleto() {
  // Coletar todos os dados
  coletarDadosCadastro();
  coletarDadosAnalise();
  coletarDadosParecer();
  
  const dados = montarObjetoAcidenteCompleto();
  dados.finalizado = true;
  dados.status = 'FINALIZADO';
  
  try {
    // Salvar rascunho final no backend (com fotos completas)
    await salvarNoBackend(dados, 'salvar_rascunho_acidente');
    
    // Finalizar
    await salvarNoBackend({ id: acidenteAtualId }, 'finalizar_acidente');
    
    alert('✅ Relatório finalizado e enviado com sucesso!');
    
    // Limpar rascunho local após salvamento bem-sucedido
    localStorage.removeItem(`rascunho_acidente_${acidenteAtualId}`);
    
    fecharModalEnvio();
    
    // Recarregar consulta se estiver aberta
    const modalConsulta = getEl('modal-consulta-acidentes');
    if (modalConsulta && modalConsulta.style.display !== 'none') {
      document.getElementById('btn-buscar-acidentes')?.click();
    }
  } catch (error) {
    console.error('Erro ao finalizar:', error);
    alert('Erro ao finalizar o relatório. Verifique o console.\n\nDica: Se o erro persistir, verifique sua conexão com a internet.');
  }
}

async function salvarNoBackend(payload, acao) {
  const params = new URLSearchParams();
  params.append('acao', acao);
  params.append('dados', JSON.stringify(payload));
  
  const response = await fetch(URL_PLANILHA, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });
  
  return await response.text();
}

// ====================================================================
// FUNÇÕES DE UI - TOGGLE CAMPOS CONDICIONAIS
// ====================================================================
function toggleSituacaoOnibus() {
  const transitando = document.querySelector('input[name="situacao-onibus"][value="transitando"]');
  const parado = document.querySelector('input[name="situacao-onibus"][value="parado"]');
  
  if (transitando && transitando.checked) {
    showElement('div-movimentacao');
    hideElement('div-parado');
  } else if (parado && parado.checked) {
    showElement('div-parado');
    hideElement('div-movimentacao');
  } else {
    hideElement('div-movimentacao');
    hideElement('div-parado');
  }
}

function toggleOutrosLocal(elementId) {
  const el = getEl(elementId);
  if (el) {
    const isChecked = document.querySelector('input[name="local-preenchimento"][value="outros"]')?.checked;
    if (isChecked) showElement(elementId);
    else hideElement(elementId);
  }
}

function toggleOutrosSinalizacao(elementId) {
  const el = getEl(elementId);
  if (el) {
    const isChecked = document.querySelector('input[name="sinalizacao-vertical"][value="outros"]')?.checked;
    if (isChecked) showElement(elementId);
    else hideElement(elementId);
  }
}

function toggleOrgaoGestor(isSim) {
  if (isSim) showElement('orgao-gestor-fields');
  else hideElement('orgao-gestor-fields');
}

function toggleOutrosCulpa(elementId) {
  const outros = document.querySelector('input[name="atribuicao-culpa"][value="outros"]');
  if (outros && outros.checked) showElement(elementId);
  else hideElement(elementId);
}

function toggleAutoridadeFields(valor) {
  const checkbox = document.querySelector(`input[name="autoridades"][value="${valor}"]`);
  const container = getEl('autoridades-fields-container');
  if (!container) return;
  
  if (checkbox && checkbox.checked) {
    // Criar campos para esta autoridade
    if (!autoridadesPresentes[valor]) {
      autoridadesPresentes[valor] = true;
      const html = `
        <div class="veiculo-card" id="auth-fields-${valor}">
          <h4>${valor.toUpperCase()} - Dados</h4>
          <div class="form-row">
            <div class="field"><label>Nº Viatura</label><input type="text" id="auth-viatura-${valor}"></div>
            <div class="field"><label>Responsável</label><input type="text" id="auth-resp-${valor}"></div>
          </div>
          <div class="field"><label>Distrato/Batalhão/Delegacia</label><input type="text" id="auth-dist-${valor}"></div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', html);
    }
  } else {
    // Remover campos
    autoridadesPresentes[valor] = false;
    const fieldsEl = getEl(`auth-fields-${valor}`);
    if (fieldsEl) fieldsEl.remove();
  }
}

function showElement(id) {
  const el = getEl(id);
  if (el) el.classList.add('show');
}

function hideElement(id) {
  const el = getEl(id);
  if (el) el.classList.remove('show');
}

// ====================================================================
// BUSCAR CEP
// ====================================================================
async function buscarCEP() {
  const cep = getEl('cadastro-cep')?.value || '';
  if (cep.length < 8) {
    alert('Digite um CEP válido (8 dígitos)');
    return;
  }
  
  const cepLimpo = cep.replace(/\D/g, '');
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    const data = await response.json();
    if (data.erro) {
      alert('CEP não encontrado');
      return;
    }
    if (getEl('cadastro-logradouro')) getEl('cadastro-logradouro').value = data.logradouro;
    if (getEl('cadastro-bairro')) getEl('cadastro-bairro').value = data.bairro;
    if (getEl('cadastro-cidade')) getEl('cadastro-cidade').value = data.localidade;
  } catch (e) {
    console.warn('Erro ao buscar CEP', e);
    alert('Erro ao buscar CEP. Tente novamente.');
  }
}

// ====================================================================
// BUSCAR ENDEREÇO POR CEP (REVERSO - BUSCA CEP A PARTIR DO ENDEREÇO)
// ====================================================================
async function buscarEnderecoPorCEP() {
  const logradouro = getEl('cadastro-logradouro')?.value || '';
  const bairro = getEl('cadastro-bairro')?.value || '';
  const cidade = getEl('cadastro-cidade')?.value || '';
  
  if (!logradouro && !bairro && !cidade) {
    alert('Preencha pelo menos um campo de endereço (logradouro, bairro ou cidade)');
    return;
  }
  
  try {
    // Usando a API do BrasilAPI para busca reversa de CEP
    const url = `https://brasilapi.com.br/api/cep/v2/${encodeURIComponent(logradouro || '')}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('CEP não encontrado');
    const data = await response.json();
    
    // Verifica se o bairro e cidade correspondem
    if (data && Array.isArray(data)) {
      // Procura o CEP que melhor corresponde
      const cepEncontrado = data.find(cep => 
        (!bairro || cep.bairro?.toLowerCase().includes(bairro.toLowerCase())) &&
        (!cidade || cep.localidade?.toLowerCase().includes(cidade.toLowerCase()))
      );
      
      if (cepEncontrado) {
        if (getEl('cadastro-cep')) getEl('cadastro-cep').value = cepEncontrado.cep;
        if (getEl('cadastro-logradouro')) getEl('cadastro-logradouro').value = cepEncontrado.logradouro;
        if (getEl('cadastro-bairro')) getEl('cadastro-bairro').value = cepEncontrado.bairro;
        if (getEl('cadastro-cidade')) getEl('cadastro-cidade').value = cepEncontrado.localidade;
        alert('CEP encontrado: ' + cepEncontrado.cep);
        return;
      }
    }
    
    // Se não encontrou pela BrasilAPI, tenta OpenStreetMap Nominatim
    const query = `${logradouro}, ${bairro}, ${cidade}, Brasil`;
    const nomResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
    const nomData = await nomResponse.json();
    
    if (nomData && nomData.length > 0) {
      const result = nomData[0];
      // Extrair informações do resultado
      const display = result.display_name.split(',');
      if (display.length >= 3) {
        if (getEl('cadastro-logradouro')) getEl('cadastro-logradouro').value = display[0].trim();
        if (display.length >= 4) {
          if (getEl('cadastro-bairro')) getEl('cadastro-bairro').value = display[1].trim();
        }
        // CEP pode estar em display_name
        const cepMatch = result.display_name.match(/(\d{5}-?\d{3})/);
        if (cepMatch && getEl('cadastro-cep')) getEl('cadastro-cep').value = cepMatch[1];
      }
      alert('Endereço encontrado! CEP sugerido: ' + (cepMatch ? cepMatch[1] : 'Não disponível'));
    } else {
      alert('Não foi possível encontrar o CEP com os dados informados. Preencha manualmente.');
    }
  } catch (e) {
    console.warn('Erro ao buscar endereço por CEP', e);
    alert('Erro ao buscar CEP pelo endereço. Tente novamente ou preencha manualmente.');
  }
}

// ====================================================================
// BUSCAR DADOS DA LINHA
// ====================================================================
async function buscarDadosLinha() {
  const codigo = getEl('cadastro-codigo-linha')?.value || '';
  if (codigo.length < 2) return;
  
  try {
    const url = `${URL_PLANILHA}?acao=buscar_linhas&termo=${encodeURIComponent(codigo)}`;
    const resp = await fetch(url);
    const linhas = await resp.json();
    if (linhas && linhas.length > 0) {
      // Pega a primeira linha encontrada
      const linha = linhas[0];
      if (getEl('cadastro-nome-linha')) getEl('cadastro-nome-linha').value = linha.nome || linha.descricao || '';
      if (getEl('cadastro-sentido-linha')) getEl('cadastro-sentido-linha').value = linha.sentido || '';
    }
  } catch (e) { console.warn('Erro ao buscar linha', e); }
}

// ====================================================================
// BUSCAR DADOS DO VEÍCULO
// ====================================================================
async function buscarDadosVeiculo() {
  // Esta função foi desativada para evitar interferências
  // O preenchimento automático é feito exclusivamente em iniciarAutoComplete()
  console.log('[DEBUG] buscarDadosVeiculo chamada - função desativada');
}

// ====================================================================
// BUSCAR DADOS DO MOTORISTA
// ====================================================================
async function buscarDadosMotorista() {
  // Esta função foi desativada para evitar interferências
  // O preenchimento automático é feito exclusivamente em iniciarAutoComplete()
  console.log('[DEBUG] buscarDadosMotorista chamada - função desativada');
}

// ====================================================================
// CARREGAR DADOS DO INSPETOR
// ====================================================================
function carregarDadosInspetor() {
  const apelido = localStorage.getItem('inspectorApelido') || '';
  const chapa = localStorage.getItem('inspectorChapa') || '';
  const nome = localStorage.getItem('inspectorNome') || '';
  
  if (getEl('parecer-inspetor')) getEl('parecer-inspetor').value = apelido;
  if (getEl('parecer-chapa')) getEl('parecer-chapa').value = chapa;
  if (getEl('parecer-nome-completo')) getEl('parecer-nome-completo').value = nome;
}

// ====================================================================
// ANEXOS - FOTOS
// ====================================================================
async function anexarFotosColetivo(modo = 'ambos') {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = 'image/*';
  
  // Configura o input baseado no modo selecionado
  if (modo === 'camera') {
    input.capture = 'environment';
  } else if (modo === 'galeria') {
    // Não adiciona capture, permitindo apenas galeria
    input.removeAttribute('capture');
  }
  // Se modo === 'ambos', não define capture, permitindo que o navegador decida
  
  input.onchange = async (e) => {
    const files = Array.from(e.target.files);
    if (fotosColetivoArray.length + files.length > 6) {
      alert('Máximo de 6 fotos do coletivo.');
      return;
    }
    for (const file of files) {
      const base64 = await fileToBase64(file);
      fotosColetivoArray.push({
        base64: base64.split(',')[1],
        mimeType: file.type,
        nome: `coletivo_${fotosColetivoArray.length + 1}.${file.type.split('/')[1]}`
      });
    }
    renderizarFotosColetivo();
  };
  input.click();
}

async function anexarFotosLocal(modo = 'ambos') {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = 'image/*';
  
  // Configura o input baseado no modo selecionado
  if (modo === 'camera') {
    input.capture = 'environment';
  } else if (modo === 'galeria') {
    // Não adiciona capture, permitindo apenas galeria
    input.removeAttribute('capture');
  }
  // Se modo === 'ambos', não define capture, permitindo que o navegador decida
  
  input.onchange = async (e) => {
    const files = Array.from(e.target.files);
    if (fotosLocalArray.length + files.length > 6) {
      alert('Máximo de 6 fotos do local.');
      return;
    }
    for (const file of files) {
      const base64 = await fileToBase64(file);
      fotosLocalArray.push({
        base64: base64.split(',')[1],
        mimeType: file.type,
        nome: `local_${fotosLocalArray.length + 1}.${file.type.split('/')[1]}`
      });
    }
    renderizarFotosLocal();
  };
  input.click();
}

async function anexarFotosVeiculo(index, modo = 'ambos') {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = 'image/*';
  
  // Configura o input baseado no modo selecionado
  if (modo === 'camera') {
    input.capture = 'environment';
  } else if (modo === 'galeria') {
    // Não adiciona capture, permitindo apenas galeria
    input.removeAttribute('capture');
  }
  // Se modo === 'ambos', não define capture, permitindo que o navegador decida
  
  input.onchange = async (e) => {
    const files = Array.from(e.target.files);
    if (!bensArray[index].fotos) bensArray[index].fotos = [];
    if (bensArray[index].fotos.length + files.length > 6) {
      alert('Máximo de 6 fotos por veículo.');
      return;
    }
    for (const file of files) {
      const base64 = await fileToBase64(file);
      bensArray[index].fotos.push({
        base64: base64.split(',')[1],
        mimeType: file.type,
        nome: `veiculo${index+1}_${bensArray[index].fotos.length + 1}.${file.type.split('/')[1]}`
      });
    }
    renderizarBensFixos();
  };
  input.click();
}

async function anexarFotosVitima(index, modo = 'ambos') {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = 'image/*';
  
  // Configura o input baseado no modo selecionado
  if (modo === 'camera') {
    input.capture = 'environment';
  } else if (modo === 'galeria') {
    // Não adiciona capture, permitindo apenas galeria
    input.removeAttribute('capture');
  }
  // Se modo === 'ambos', não define capture, permitindo que o navegador decida
  
  input.onchange = async (e) => {
    const files = Array.from(e.target.files);
    if (!vitimasArray[index].fotos) vitimasArray[index].fotos = [];
    if (vitimasArray[index].fotos.length + files.length > 6) {
      alert('Máximo de 6 fotos por vítima.');
      return;
    }
    for (const file of files) {
      const base64 = await fileToBase64(file);
      vitimasArray[index].fotos.push({
        base64: base64.split(',')[1],
        mimeType: file.type,
        nome: `vitima${index+1}_${vitimasArray[index].fotos.length + 1}.${file.type.split('/')[1]}`
      });
    }
    renderizarVitimasFixas();
  };
  input.click();
}

function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

function handleFotoCNH(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    fotoCNHBase64 = e.target.result.split(',')[1];
    const preview = getEl('preview-foto-cnh');
    if (preview) preview.innerHTML = `<img src="${e.target.result}" alt="CNH">`;
  };
  reader.readAsDataURL(file);
}

function renderizarFotosColetivo() {
  const container = getEl('lista-fotos-coletivo');
  if (!container) return;
  if (fotosColetivoArray.length === 0) {
    container.innerHTML = '<small>Nenhuma foto</small>';
    return;
  }
  let html = '';
  fotosColetivoArray.forEach((f, idx) => {
    html += `<div class="anexo-item">📷 ${f.nome}<button class="btn-remover-pequeno" onclick="removerFotoColetivo(${idx})">❌</button></div>`;
  });
  container.innerHTML = html;
}

function renderizarFotosLocal() {
  const container = getEl('lista-fotos-local');
  if (!container) return;
  if (fotosLocalArray.length === 0) {
    container.innerHTML = '<small>Nenhuma foto</small>';
    return;
  }
  let html = '';
  fotosLocalArray.forEach((f, idx) => {
    html += `<div class="anexo-item">📷 ${f.nome}<button class="btn-remover-pequeno" onclick="removerFotoLocal(${idx})">❌</button></div>`;
  });
  container.innerHTML = html;
}

function removerFotoColetivo(index) {
  fotosColetivoArray.splice(index, 1);
  renderizarFotosColetivo();
}

function removerFotoLocal(index) {
  fotosLocalArray.splice(index, 1);
  renderizarFotosLocal();
}

// ====================================================================
// BENS AVARIADOS - CAMPOS FIXOS
// ====================================================================
function adicionarVeiculoBem() {
  veiculoCounter++;
  bensArray.push({
    id: veiculoCounter,
    tipo: 'Veículo ' + veiculoCounter,
    placa: '',
    modelo: '',
    ano: '',
    cor: '',
    proprietario: '',
    telefone: '',
    danos: '',
    fotos: []
  });
  renderizarBensFixos();
}

function removerVeiculoBem(index) {
  if (confirm('Remover este veículo?')) {
    bensArray.splice(index, 1);
    renderizarBensFixos();
  }
}

function atualizarVeiculoBem(index, campo, valor) {
  bensArray[index][campo] = valor;
}

function renderizarBensFixos() {
  const container = getEl('bens-fixos-container');
  if (!container) return;
  
  if (bensArray.length === 0) {
    container.innerHTML = '<div class="empty-list"><small>Nenhum veículo adicionado.</small></div>';
    return;
  }
  
  let html = '';
  bensArray.forEach((bem, idx) => {
    html += `
      <div class="veiculo-card">
        <button class="btn-remover-veiculo" onclick="removerVeiculoBem(${idx})">🗑️</button>
        <h4>Veículo ${bem.id}</h4>
        <div class="form-row">
          <div class="field"><label>Tipo</label><input type="text" value="${bem.tipo}" onchange="atualizarVeiculoBem(${idx}, 'tipo', this.value)"></div>
          <div class="field"><label>Placa</label><input type="text" value="${bem.placa || ''}" onchange="atualizarVeiculoBem(${idx}, 'placa', this.value)"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>Modelo</label><input type="text" value="${bem.modelo || ''}" onchange="atualizarVeiculoBem(${idx}, 'modelo', this.value)"></div>
          <div class="field"><label>Ano</label><input type="text" value="${bem.ano || ''}" onchange="atualizarVeiculoBem(${idx}, 'ano', this.value)"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>Cor</label><input type="text" value="${bem.cor || ''}" onchange="atualizarVeiculoBem(${idx}, 'cor', this.value)"></div>
          <div class="field"><label>Proprietário</label><input type="text" value="${bem.proprietario || ''}" onchange="atualizarVeiculoBem(${idx}, 'proprietario', this.value)"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>Telefone</label><input type="tel" value="${bem.telefone || ''}" onchange="atualizarVeiculoBem(${idx}, 'telefone', this.value)"></div>
          <div class="field"><label>Danos</label><input type="text" value="${bem.danos || ''}" onchange="atualizarVeiculoBem(${idx}, 'danos', this.value)"></div>
        </div>
        <div class="field">
          <label>Fotos do Terceiro (até 6)</label>
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <button type="button" class="btn-secundario" onclick="anexarFotosVeiculo(${idx}, 'camera')">📷 Câmera</button>
            <button type="button" class="btn-secundario" onclick="anexarFotosVeiculo(${idx}, 'galeria')">🖼️ Galeria</button>
          </div>
          <div class="grid-anexos-preview" style="margin-top: 8px;">
            ${bem.fotos && bem.fotos.length > 0 ? bem.fotos.map((f, i) => `<span class="anexo-item">📷 ${f.nome}</span>`).join('') : '<small>Nenhuma foto</small>'}
          </div>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

// ====================================================================
// VÍTIMAS - CAMPOS FIXOS
// ====================================================================
function adicionarVitima() {
  vitimaCounter++;
  vitimasArray.push({
    id: vitimaCounter,
    nome: '',
    documento: '',
    contato: '',
    lesões: '',
    atendimento: '',
    fotos: []
  });
  renderizarVitimasFixas();
}

function removerVitima(index) {
  if (confirm('Remover esta vítima?')) {
    vitimasArray.splice(index, 1);
    renderizarVitimasFixas();
  }
}

function atualizarVitima(index, campo, valor) {
  vitimasArray[index][campo] = valor;
}

function renderizarVitimasFixas() {
  const container = getEl('vitimas-fixas-container');
  if (!container) return;
  
  if (vitimasArray.length === 0) {
    container.innerHTML = '<div class="empty-list"><small>Nenhuma vítima adicionada.</small></div>';
    return;
  }
  
  let html = '';
  vitimasArray.forEach((v, idx) => {
    html += `
      <div class="vitima-card">
        <button class="btn-remover-vitima" onclick="removerVitima(${idx})">🗑️</button>
        <h4>Vítima ${v.id}</h4>
        <div class="form-row">
          <div class="field"><label>Nome</label><input type="text" value="${v.nome || ''}" onchange="atualizarVitima(${idx}, 'nome', this.value)"></div>
          <div class="field"><label>Documento (RG/CPF)</label><input type="text" value="${v.documento || ''}" onchange="atualizarVitima(${idx}, 'documento', this.value)"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>Contato</label><input type="tel" value="${v.contato || ''}" onchange="atualizarVitima(${idx}, 'contato', this.value)"></div>
          <div class="field"><label>Lesões</label><input type="text" value="${v.lesões || ''}" onchange="atualizarVitima(${idx}, 'lesões', this.value)"></div>
        </div>
        <div class="field"><label>Atendimento</label><input type="text" value="${v.atendimento || ''}" onchange="atualizarVitima(${idx}, 'atendimento', this.value)"></div>
        <div class="field">
          <label>Fotos (opcional)</label>
          <div style="display: flex; gap: 8px; margin-bottom: 8px;">
            <button type="button" class="btn-secundario" onclick="anexarFotosVitima(${idx}, 'camera')">📷 Câmera</button>
            <button type="button" class="btn-secundario" onclick="anexarFotosVitima(${idx}, 'galeria')">🖼️ Galeria</button>
          </div>
          <div class="grid-anexos-preview" style="margin-top: 8px;">
            ${v.fotos && v.fotos.length > 0 ? v.fotos.map((f, i) => `<span class="anexo-item">📷 ${f.nome}</span>`).join('') : '<small>Nenhuma foto</small>'}
          </div>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

// ====================================================================
// TESTEMUNHAS - CAMPOS FIXOS
// ====================================================================
function adicionarTestemunha() {
  testemunhaCounter++;
  testemunhasArray.push({
    id: testemunhaCounter,
    nome: '',
    documento: '',
    contato: '',
    relato: ''
  });
  renderizarTestemunhasFixas();
}

function removerTestemunha(index) {
  if (confirm('Remover esta testemunha?')) {
    testemunhasArray.splice(index, 1);
    renderizarTestemunhasFixas();
  }
}

function atualizarTestemunha(index, campo, valor) {
  testemunhasArray[index][campo] = valor;
}

function renderizarTestemunhasFixas() {
  const container = getEl('testemunhas-fixas-container');
  if (!container) return;
  
  if (testemunhasArray.length === 0) {
    container.innerHTML = '<div class="empty-list"><small>Nenhuma testemunha adicionada.</small></div>';
    return;
  }
  
  let html = '';
  testemunhasArray.forEach((t, idx) => {
    html += `
      <div class="testemunha-card">
        <button class="btn-remover-testemunha" onclick="removerTestemunha(${idx})">🗑️</button>
        <h4>Testemunha ${t.id}</h4>
        <div class="form-row">
          <div class="field"><label>Nome</label><input type="text" value="${t.nome || ''}" onchange="atualizarTestemunha(${idx}, 'nome', this.value)"></div>
          <div class="field"><label>Documento (RG/CPF)</label><input type="text" value="${t.documento || ''}" onchange="atualizarTestemunha(${idx}, 'documento', this.value)"></div>
        </div>
        <div class="form-row">
          <div class="field"><label>Contato</label><input type="tel" value="${t.contato || ''}" onchange="atualizarTestemunha(${idx}, 'contato', this.value)"></div>
        </div>
        <div class="field"><label>Relato</label><textarea rows="3" onchange="atualizarTestemunha(${idx}, 'relato', this.value)">${t.relato || ''}</textarea></div>
      </div>
    `;
  });
  container.innerHTML = html;
}

// ====================================================================
// DITADO POR VOZ (HISTÓRICO E PARECER) - Speech-to-Text
// ====================================================================
let recognitionHistorico = null;
let recognitionParecer = null;
let ditandoHistorico = false;
let ditandoParecer = false;

function iniciarReconhecimentoFala() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert('Seu navegador não suporta reconhecimento de fala. Use o Chrome ou Edge.');
    return null;
  }
  
  const recognition = new SpeechRecognition();
  recognition.lang = 'pt-BR';
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  
  return recognition;
}

async function gravarHistorico() {
  // Verifica se é usuário de teste (chapa 55555)
  const chapa = getEl('cadastro-chapa')?.value || '';
  const isDemoUser = chapa === '55555';

  if (isDemoUser) {
    // MODO DEMONSTRAÇÃO: Simula digitação sem usar o microfone real
    iniciarSimulacaoDitadoHistorico();
    return;
  }

  // Validações completas apenas para usuários normais
  const tipoAcidenteEl = document.querySelector('input[name="tipo-acidente"]:checked');
  const tipoAcidente = tipoAcidenteEl ? tipoAcidenteEl.value : '';
  
  const logradouro = getEl('cadastro-logradouro')?.value || '';
  const prefixo = getEl('cadastro-prefixo')?.value || '';
  
  const demoConditionsMet = isDemoUser && 
                           tipoAcidente === 'colisao_com_vitimas' && 
                           logradouro.toLowerCase().includes('av. hum, 1345') && 
                           prefixo === '210';

  if (ditandoHistorico) {
    // Parar ditado
    if (recognitionHistorico) {
      recognitionHistorico.stop();
    }
    ditandoHistorico = false;
    // Remove estilos ativos
    const textarea = getEl('cadastro-historico');
    const btn = document.querySelector('.btn-gravar[onclick="gravarHistorico()"]');
    if (textarea) textarea.style.borderColor = '';
    if (btn) btn.innerHTML = '<i class="fas fa-microphone"></i> Gravar';
    return;
  }
  
  try {
    const recognition = iniciarReconhecimentoFala();
    if (!recognition) return;
    
    recognitionHistorico = recognition;
    const textarea = getEl('cadastro-historico');
    if (!textarea) return;
    
    // Adiciona moldura verde-clara e muda ícone do botão
    textarea.style.borderColor = '#90EE90';
    const btn = document.querySelector('.btn-gravar[onclick="gravarHistorico()"]');
    if (btn) btn.innerHTML = '<i class="fas fa-volume-up"></i> Ouvindo...';
    
    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      const existing = textarea.value;
      textarea.value = existing + (existing ? ' ' : '') + transcript;
    };
    
    recognition.onerror = (event) => {
      // Silencia erros comuns de network e no-speech que ocorrem frequentemente
      if (event.error === 'no-speech' || event.error === 'network') {
        ditandoHistorico = false;
        // Remove estilos ativos
        textarea.style.borderColor = '';
        if (btn) btn.innerHTML = '<i class="fas fa-microphone"></i> Gravar';
        return;
      }
      
      console.warn('Erro no reconhecimento de fala:', event.error);
      alert('Erro no reconhecimento de fala: ' + event.error);
      ditandoHistorico = false;
      // Remove estilos ativos
      textarea.style.borderColor = '';
      if (btn) btn.innerHTML = '<i class="fas fa-microphone"></i> Gravar';
    };
    
    recognition.onend = () => {
      if (ditandoHistorico) {
        recognition.start(); // Reinicia se ainda estiver no modo ditado
      } else {
        // Remove estilos ativos quando parar
        textarea.style.borderColor = '';
        if (btn) btn.innerHTML = '<i class="fas fa-microphone"></i> Gravar';
      }
    };
    
    recognition.start();
    ditandoHistorico = true;
  } catch (e) {
    console.warn('Erro ao iniciar reconhecimento de fala', e);
    alert('Não foi possível iniciar o reconhecimento de fala. Verifique as permissões e se seu navegador é compatível.');
  }
}

function iniciarSimulacaoDitadoHistorico() {
  const textoCompleto = "Eu estava trafegando normalmente com o ônibus pelo local dos fatos, quando eu estava indo para a direita para para no ponto, uma motocicleta foi me ultrapassar pela direita e acabou colidindo com minha lateral direita traseira. Após a queda, o motociclista caiu e sofreu arranhões leves. A moto foi pra debaixo do ônibus e ficou danificada.";
  
  // Divide em palavras para simular digitação/fala
  const palavras = textoCompleto.split(' ');
  let indice = 0;
  
  const textarea = getEl('cadastro-historico');
  if (!textarea) return;
  
  // Adiciona moldura verde-clara e muda ícone do botão
  textarea.style.borderColor = '#90EE90';
  const btn = document.querySelector('.btn-gravar[onclick="gravarHistorico()"]');
  if (btn) btn.innerHTML = '<i class="fas fa-volume-up"></i> Ouvindo...';
  
  textarea.value = "";
  ditandoHistorico = true;
  
  const intervalo = setInterval(() => {
    if (indice < palavras.length) {
      textarea.value += (indice > 0 ? ' ' : '') + palavras[indice];
      textarea.scrollTop = textarea.scrollHeight; // Auto-scroll
      indice++;
    } else {
      clearInterval(intervalo);
      ditandoHistorico = false;
      // Remove estilos ativos
      textarea.style.borderColor = '';
      if (btn) btn.innerHTML = '<i class="fas fa-microphone"></i> Gravar';
      // Salva automaticamente após o ditado
      salvarRascunho(); 
    }
  }, 150); // Velocidade de digitação/fala
}

async function gravarParecer() {
  if (ditandoParecer) {
    if (recognitionParecer) {
      recognitionParecer.stop();
    }
    ditandoParecer = false;
    return;
  }
  
  try {
    const recognition = iniciarReconhecimentoFala();
    if (!recognition) return;
    
    recognitionParecer = recognition;
    const textarea = getEl('parecer-visao');
    if (!textarea) return;
    
    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      const existing = textarea.value;
      textarea.value = existing + (existing ? ' ' : '') + transcript;
    };
    
    recognition.onerror = (event) => {
      // Silencia erros comuns de network e no-speech que ocorrem frequentemente
      if (event.error === 'no-speech' || event.error === 'network') {
        console.debug('Speech recognition: ', event.error);
        ditandoParecer = false;
        return;
      }
      
      console.warn('Erro no reconhecimento de fala:', event.error);
      alert('Erro no reconhecimento de fala: ' + event.error);
      ditandoParecer = false;
    };
    
    recognition.onend = () => {
      if (ditandoParecer) {
        recognition.start();
      }
    };
    
    recognition.start();
    ditandoParecer = true;
    alert('🎤 Ditando... Clique em \"Gravar\" novamente para parar.');
  } catch (e) {
    console.warn('Erro ao iniciar reconhecimento de fala', e);
    alert('Não foi possível iniciar o reconhecimento de fala. Verifique as permissões e se seu navegador é compatível.');
  }
}

// ====================================================================
// AUTOCOMPLETE
// ====================================================================
function iniciarAutoComplete() {
  const prefixoInput = getEl('cadastro-prefixo');
  const motoristaInput = getEl('cadastro-chapa');
  const logradouroInput = getEl('analise-logradouro');
  const datalistVeiculos = getEl('lista-veiculos');
  const datalistMotoristas = getEl('lista-motoristas');
  
  // Verifica se é usuário de teste (chapa 55555) - ISOLAMENTO TOTAL
  const isTestUser = localStorage.getItem('inspectorChapa') === '55555';
  
  // ====================================================================
  // MODO DE DEMONSTRAÇÃO (USUÁRIO 55555) - DADOS FIXOS
  // ====================================================================
  if (isTestUser) {
    // Configura opções fixas para demonstração
    if (datalistVeiculos) {
      datalistVeiculos.innerHTML = '<option value="210">STC-4F92 - Mercedes Benz Apache Vip V (Inspetor de Testes)"></option>';
    }
    if (datalistMotoristas) {
      datalistMotoristas.innerHTML = '<option value="98765">João da Silva Teste (Motorista Teste)</option>';
    }
    
    // Evento para veículo (apenas 210)
    if (prefixoInput) {
      prefixoInput.addEventListener('input', function() {
        if (this.value === '210') {
          preencherDadosVeiculoTeste();
        }
      });
    }
    
    // Evento para motorista (apenas 98765)
    if (motoristaInput) {
      motoristaInput.addEventListener('input', function() {
        if (this.value === '98765') {
          preencherDadosMotoristaTeste();
        }
      });
    }
    
    console.log('[MODO DEMO] Autocomplete configurado para usuário 55555');
    return; // Sai da função - não executa código de produção
  }
  
  // ====================================================================
  // MODO PRODUÇÃO (OUTROS USUÁRIOS) - API REAL
  // ====================================================================
  console.log('[MODO PRODUÇÃO] Autocomplete configurado para usuário comum');
  
  // Configura autocomplete de veículos via API
  if (prefixoInput && datalistVeiculos) {
    prefixoInput.addEventListener('input', debounce(async function() {
      const termo = this.value;
      if (termo.length < 2) return;
      
      const url = `${URL_PLANILHA}?acao=buscar_veiculo&prefixo=${encodeURIComponent(termo)}`;
      try {
        const resp = await fetch(url);
        const veiculo = await resp.json();
        if (veiculo && veiculo.prefixo) {
          datalistVeiculos.innerHTML = `<option value="${veiculo.prefixo}">${veiculo.placa} - ${veiculo.modelo || ''}</option>`;
          sessionStorage.setItem('veiculo_atual', JSON.stringify(veiculo));
        }
      } catch(e) { 
        console.warn('Erro ao buscar veículo:', e);
      }
    }, 500));
  }
  
  // Configura autocomplete de motoristas via API
  if (motoristaInput && datalistMotoristas) {
    motoristaInput.addEventListener('input', debounce(async function() {
      const termo = this.value;
      if (termo.length < 2) return;
      
      const url = `${URL_PLANILHA}?acao=buscar_operador&termo=${encodeURIComponent(termo)}`;
      try {
        const resp = await fetch(url);
        const operadores = await resp.json();
        if (operadores && operadores.length) {
          datalistMotoristas.innerHTML = operadores.map(op => `<option value="${op.chapa}">${op.nome} (${op.apelido})</option>`).join('');
          if (operadores[0]) {
            sessionStorage.setItem('motorista_atual', JSON.stringify(operadores[0]));
          }
        }
      } catch(e) { 
        console.warn('Erro ao buscar operador:', e);
      }
    }, 500));
  }
}

// ====================================================================
// PREENCHER DADOS DE VEÍCULO DE TESTE
// ====================================================================
function preencherDadosVeiculoTeste() {
  const veiculoTeste = {
    prefixo: '210',
    placa: 'STC-4F92',
    renavan: '123456789',
    ano: '2020',
    marca: 'Mercedes Benz',
    modelo: 'Apache Vip V',
    cor: 'Branco',
    cidade: 'São Paulo'
  };
  
  // Salva em sessionStorage para persistência
  sessionStorage.setItem('veiculo_atual', JSON.stringify(veiculoTeste));
  
  // Preenche os campos
  if (getEl('cadastro-placa')) getEl('cadastro-placa').value = veiculoTeste.placa;
  if (getEl('cadastro-renavan')) getEl('cadastro-renavan').value = veiculoTeste.renavan;
  if (getEl('cadastro-ano-fab')) getEl('cadastro-ano-fab').value = veiculoTeste.ano;
  if (getEl('cadastro-marca')) getEl('cadastro-marca').value = veiculoTeste.marca;
  if (getEl('cadastro-modelo')) getEl('cadastro-modelo').value = veiculoTeste.modelo;
  if (getEl('cadastro-cor')) getEl('cadastro-cor').value = veiculoTeste.cor;
  if (getEl('cadastro-cidade-onibus')) getEl('cadastro-cidade-onibus').value = veiculoTeste.cidade;
}

// ====================================================================
// PREENCHER DADOS DE MOTORISTA DE TESTE
// ====================================================================
function preencherDadosMotoristaTeste() {
  const motoristaTeste = {
    chapa: '98765',
    apelido: 'Motorista Teste',
    nome: 'João da Silva Teste',
    cnh: '12345678900',
    validade_cnh: '12/2025',
    endereco: 'Rua das Flores, 123',
    bairro: 'Centro',
    cidade: 'São Paulo',
    complemento: 'Apto 45',
    nascimento: '13/05/1974',
    naturalidade: 'São Paulo - SP',
    nome_mae: 'Maria da Silva',
    celular: '(11) 99999-9999'
  };
  
  // Salva em sessionStorage para persistência
  sessionStorage.setItem('motorista_atual', JSON.stringify(motoristaTeste));
  
  // Preenche os campos
  if (getEl('cadastro-apelido')) getEl('cadastro-apelido').value = motoristaTeste.apelido;
  if (getEl('cadastro-nome-completo')) getEl('cadastro-nome-completo').value = motoristaTeste.nome;
  if (getEl('cadastro-cnh')) getEl('cadastro-cnh').value = motoristaTeste.cnh;
  if (getEl('cadastro-validade-cnh')) getEl('cadastro-validade-cnh').value = motoristaTeste.validade_cnh;
  if (getEl('cadastro-moto-logradouro')) getEl('cadastro-moto-logradouro').value = motoristaTeste.endereco;
  if (getEl('cadastro-moto-bairro')) getEl('cadastro-moto-bairro').value = motoristaTeste.bairro;
  if (getEl('cadastro-moto-cidade')) getEl('cadastro-moto-cidade').value = motoristaTeste.cidade;
  if (getEl('cadastro-moto-complemento')) getEl('cadastro-moto-complemento').value = motoristaTeste.complemento;
  if (getEl('cadastro-nascimento')) getEl('cadastro-nascimento').value = motoristaTeste.nascimento;
  if (getEl('cadastro-naturalidade')) getEl('cadastro-naturalidade').value = motoristaTeste.naturalidade;
  if (getEl('cadastro-nome-mae')) getEl('cadastro-nome-mae').value = motoristaTeste.nome_mae;
  if (getEl('cadastro-celular')) getEl('cadastro-celular').value = motoristaTeste.celular;
}

// ====================================================================
// CARREGAR LISTA DE LINHAS
// ====================================================================
async function carregarListaLinhas() {
  const selectLinha = getEl('cadastro-codigo-linha');
  if (!selectLinha) return;
  
  try {
    // Para o modo de demonstração, adiciona a linha 033 manualmente
    // Limpa opções existentes (mantém a primeira vazia)
    selectLinha.innerHTML = '<option value="">Selecione...</option>';
    
    // Adiciona linha de demonstração 033
    const optionDemo = document.createElement('option');
    optionDemo.value = '033';
    optionDemo.textContent = '033 - Sta. Antônio (Inspetor de Testes)';
    selectLinha.appendChild(optionDemo);
    
    // Tenta carregar demais linhas da API
    const url = `${URL_PLANILHA}?acao=buscar_linhas&termo=`;
    const resp = await fetch(url);
    const linhas = await resp.json();
    
    if (linhas && linhas.length > 0) {
      // Ordena por número da linha
      linhas.sort((a, b) => {
        const numA = parseInt(a.numero) || 0;
        const numB = parseInt(b.numero) || 0;
        return numA - numB;
      });
      
      // Adiciona todas as linhas ao select (exceto a 033 que já foi adicionada)
      linhas.forEach(linha => {
        if (linha.numero !== '033') {
          const option = document.createElement('option');
          option.value = linha.numero;
          option.textContent = `${linha.numero} - ${linha.nome || ''}`;
          selectLinha.appendChild(option);
        }
      });
    }
  } catch (e) {
    console.warn('Erro ao carregar lista de linhas:', e);
  }
}

// ====================================================================
// UTILITÁRIOS
// ====================================================================
function getEl(id) {
  return document.getElementById(id);
}

function getCheckedValues(name) {
  const checkboxes = document.querySelectorAll(`input[name="${name}"]:checked`);
  return Array.from(checkboxes).map(cb => cb.value);
}

function getSelectedRadioValue(name) {
  const radio = document.querySelector(`input[name="${name}"]:checked`);
  return radio ? radio.value : '';
}

function preencherDataAtual() {
  const dataInput = getEl('cadastro-data');
  if (dataInput && !dataInput.value) {
    const hoje = new Date().toISOString().split('T')[0];
    dataInput.value = hoje;
  }
  const horaInput = getEl('cadastro-hora');
  if (horaInput && !horaInput.value) {
    const agora = new Date();
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    horaInput.value = `${horas}:${minutos}`;
  }
}

const debounceTimers = new Map();
function debounce(func, wait) {
  return function executedFunction(...args) {
    const context = this;
    if (debounceTimers.has(func)) {
      clearTimeout(debounceTimers.get(func));
    }
    const timeoutId = setTimeout(() => {
      func.apply(context, args);
      debounceTimers.delete(func);
    }, wait);
    debounceTimers.set(func, timeoutId);
  };
}

// ====================================================================
// CARREGAR ACIDENTE EXISTENTE
// ====================================================================
async function carregarAcidenteExistente(id) {
  const url = `${URL_PLANILHA}?acao=obter_acidente&id=${id}`;
  const response = await fetch(url);
  const acidente = await response.json();
  if (!acidente) return;
  
  acidenteAtualId = acidente.id;
  originalStatus = acidente.status;
  editMode = true;
  
  // Preencher formulário com dados existentes
  preencherFormularioComDados(acidente);
  
  const currentUser = localStorage.getItem('inspectorApelido');
  const podeEditar = (window.currentUserRole === 'ADMIN' || window.currentUserRole === 'SAF' || window.currentUserRole === 'ENCARREGADO' || acidente.fiscal === currentUser);
  
  if (acidente.status === 'FINALIZADO' || !podeEditar) {
    desabilitarEdicao();
    alert('Este relatório está finalizado ou você não tem permissão para editar. Modo somente leitura.');
  } else {
    habilitarEdicao();
  }
}

function desabilitarEdicao() {
  const inputs = document.querySelectorAll('#modal-envio-informacoes input, #modal-envio-informacoes textarea, #modal-envio-informacoes select, #modal-envio-informacoes button');
  inputs.forEach(el => el.disabled = true);
}

function habilitarEdicao() {
  const inputs = document.querySelectorAll('#modal-envio-informacoes input, #modal-envio-informacoes textarea, #modal-envio-informacoes select');
  inputs.forEach(el => el.disabled = false);
}

// ====================================================================
// EXPORTAR FUNÇÕES PARA ESCOPO GLOBAL
// ====================================================================
window.abrirModalEnvio = abrirModalEnvio;
window.fecharModalEnvio = fecharModalEnvio;
window.salvarAbaCadastro = salvarAbaCadastro;
window.salvarAbaAnalise = salvarAbaAnalise;
window.salvarAbaBens = salvarAbaBens;
window.salvarAbaVitimas = salvarAbaVitimas;
window.salvarAbaTestemunhas = salvarAbaTestemunhas;
window.salvarAbaParecer = salvarAbaParecer;
window.finalizarAcidenteCompleto = finalizarAcidenteCompleto;
window.buscarCEP = buscarCEP;
window.buscarEnderecoPorCEP = buscarEnderecoPorCEP;
window.buscarDadosLinha = buscarDadosLinha;
window.buscarDadosVeiculo = buscarDadosVeiculo;
window.buscarDadosMotorista = buscarDadosMotorista;
window.carregarListaLinhas = carregarListaLinhas;
window.toggleSituacaoOnibus = toggleSituacaoOnibus;
window.toggleOutrosLocal = toggleOutrosLocal;
window.toggleOrgaoGestor = toggleOrgaoGestor;
window.toggleOutrosCulpa = toggleOutrosCulpa;
window.toggleAutoridadeFields = toggleAutoridadeFields;
window.toggleOutrosSinalizacao = toggleOutrosSinalizacao;
window.anexarFotosColetivo = anexarFotosColetivo;
window.anexarFotosLocal = anexarFotosLocal;
window.anexarFotosVeiculo = anexarFotosVeiculo;
window.anexarFotosVitima = anexarFotosVitima;
window.handleFotoCNH = handleFotoCNH;
window.removerFotoColetivo = removerFotoColetivo;
window.removerFotoLocal = removerFotoLocal;
window.adicionarVeiculoBem = adicionarVeiculoBem;
window.removerVeiculoBem = removerVeiculoBem;
window.atualizarVeiculoBem = atualizarVeiculoBem;
window.adicionarVitima = adicionarVitima;
window.removerVitima = removerVitima;
window.atualizarVitima = atualizarVitima;
window.adicionarTestemunha = adicionarTestemunha;
window.removerTestemunha = removerTestemunha;
window.atualizarTestemunha = atualizarTestemunha;
window.gravarHistorico = gravarHistorico;
window.gravarParecer = gravarParecer;
window.preencherDadosVeiculoTeste = preencherDadosVeiculoTeste;
window.preencherDadosMotoristaTeste = preencherDadosMotoristaTeste;
window.restaurarDadosSessionStorage = restaurarDadosSessionStorage;

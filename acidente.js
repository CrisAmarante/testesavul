// ====================================================================
// acidente.js - Módulo de Relatório de Acidentes
// Abas, rascunho parcial, anexos, bens, vítimas/testemunhas, consulta
// ====================================================================

// ====================================================================
// VARIÁVEIS GLOBAIS DO MÓDULO
// ====================================================================
let acidenteAtualId = null;           // ID do acidente em edição
let bensArray = [];                   // Lista de objetos de bens avariados
let pessoasArray = [];                // Lista de objetos de pessoas (vítimas/testemunhas)
let anexosPrincipaisArray = [];       // Array de {base64, mimeType, nome} (anexos gerais)
let editMode = false;                 // true se estiver editando um acidente existente
let originalStatus = null;            // 'EM_ANDAMENTO' ou 'FINALIZADO'

// Elementos DOM (usaremos getEl do utils.js)
// ====================================================================
// INICIALIZAÇÃO DOS EVENTOS DO MODAL
// ====================================================================
function initAcidenteModal() {
  // Botões do modal
  const btnSalvar = getEl('btn-salvar-rascunho');
  const btnFinalizar = getEl('btn-finalizar-acidente');
  const btnConsultar = getEl('btn-consultar-acidentes');
  const btnAdicionarBem = getEl('btn-adicionar-bem');
  const btnAdicionarVitima = getEl('btn-adicionar-vitima');
  const btnAdicionarTestemunha = getEl('btn-adicionar-testemunha');
  const btnAnexarPrincipal = getEl('btn-anexar-principal');

  if (btnSalvar) btnSalvar.addEventListener('click', salvarRascunhoAcidente);
  if (btnFinalizar) btnFinalizar.addEventListener('click', finalizarAcidente);
  if (btnConsultar) btnConsultar.addEventListener('click', abrirModalConsultaAcidentes);
  if (btnAdicionarBem) btnAdicionarBem.addEventListener('click', adicionarBem);
  if (btnAdicionarVitima) btnAdicionarVitima.addEventListener('click', () => adicionarPessoa('Vítima'));
  if (btnAdicionarTestemunha) btnAdicionarTestemunha.addEventListener('click', () => adicionarPessoa('Testemunha'));
  if (btnAnexarPrincipal) btnAnexarPrincipal.addEventListener('click', anexarArquivosPrincipais);

  // Eventos de input para auto-salvamento (debounce)
  const autoSaveFields = ['acidente-data', 'acidente-hora', 'acidente-local', 'acidente-prefixo', 'acidente-motorista', 'acidente-descricao'];
  autoSaveFields.forEach(id => {
    const el = getEl(id);
    if (el) el.addEventListener('input', debounce(salvarRascunhoAcidente, 800));
  });

  // Abas
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      ativarAba(tabId);
    });
  });
}

function ativarAba(tabId) {
  // Esconde todos os conteúdos
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  // Remove classe active dos botões
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  // Ativa a aba correspondente
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
  
  // Resetar estado
  if (!acidenteId) {
    iniciarNovoAcidente();
  } else {
    carregarAcidenteExistente(acidenteId);
  }
  
  modal.classList.add('is-open');
  preencherResponsavel();
  preencherDataAtual();
  iniciarAutoComplete();
  initAcidenteModal(); // garante eventos
}

function fecharModalEnvio() {
  const modal = getEl('modal-envio-informacoes');
  if (modal) modal.classList.remove('is-open');
}

// ====================================================================
// NOVO ACIDENTE (ID TEMPORÁRIO, RESETA DADOS)
// ====================================================================
function iniciarNovoAcidente() {
  acidenteAtualId = Date.now().toString();
  bensArray = [];
  pessoasArray = [];
  anexosPrincipaisArray = [];
  editMode = false;
  originalStatus = null;
  limparFormularioAcidente();
  carregarRascunhoLocal(); // Tenta carregar do localStorage se houver rascunho para este ID
  renderizarListaBens();
  renderizarListaPessoas();
  renderizarListaAnexosPrincipais();
}

function limparFormularioAcidente() {
  getEl('acidente-data').value = '';
  getEl('acidente-hora').value = '';
  getEl('acidente-local').value = '';
  getEl('acidente-prefixo').value = '';
  getEl('acidente-motorista').value = '';
  getEl('acidente-descricao').value = '';
}

// ====================================================================
// RASCUNHO LOCAL (localStorage)
// ====================================================================
function carregarRascunhoLocal() {
  const chave = `rascunho_acidente_${acidenteAtualId}`;
  const dadosSalvos = localStorage.getItem(chave);
  if (dadosSalvos) {
    try {
      const rascunho = JSON.parse(dadosSalvos);
      preencherFormularioComDados(rascunho);
      bensArray = rascunho.bens || [];
      pessoasArray = rascunho.pessoas || [];
      anexosPrincipaisArray = rascunho.anexosPrincipais || [];
      renderizarListaBens();
      renderizarListaPessoas();
      renderizarListaAnexosPrincipais();
    } catch(e) { console.warn('Erro ao carregar rascunho local', e); }
  }
}

function preencherFormularioComDados(dados) {
  getEl('acidente-data').value = dados.dataAcidente || '';
  getEl('acidente-hora').value = dados.horaAcidente || '';
  getEl('acidente-local').value = dados.local || '';
  getEl('acidente-prefixo').value = dados.prefixo || '';
  getEl('acidente-motorista').value = dados.motoristaChapa || '';
  getEl('acidente-descricao').value = dados.descricaoAnalise || '';
}

function salvarRascunhoLocal() {
  const dados = montarObjetoAcidente();
  const chave = `rascunho_acidente_${acidenteAtualId}`;
  localStorage.setItem(chave, JSON.stringify(dados));
}

// ====================================================================
// MONTAR OBJETO ACIDENTE (para envio ao backend)
// ====================================================================
function montarObjetoAcidente() {
  return {
    id: acidenteAtualId,
    status: editMode ? originalStatus : 'EM_ANDAMENTO',
    fiscal: localStorage.getItem('inspectorApelido'),
    dataAcidente: getEl('acidente-data').value,
    horaAcidente: getEl('acidente-hora').value,
    local: getEl('acidente-local').value,
    prefixo: getEl('acidente-prefixo').value,
    motoristaChapa: getEl('acidente-motorista').value,
    descricaoAnalise: getEl('acidente-descricao').value,
    anexosPrincipais: anexosPrincipaisArray,
    bens: bensArray,
    pessoas: pessoasArray,
    finalizado: (originalStatus === 'FINALIZADO') ? true : false
  };
}

// ====================================================================
// SALVAR RASCUNHO (local + backend)
// ====================================================================
function salvarRascunhoAcidente() {
  if (!acidenteAtualId) return;
  const dados = montarObjetoAcidente();
  // Salva localmente
  localStorage.setItem(`rascunho_acidente_${acidenteAtualId}`, JSON.stringify(dados));
  
  // Envia ao backend (não bloqueante)
  const payload = { acao: 'salvar_rascunho_acidente', dados: JSON.stringify(dados) };
  fetch(URL_PLANILHA, {
    method: 'POST',
    mode: 'no-cors',
    body: new URLSearchParams(payload)
  }).catch(console.warn);
  
  // Pequeno feedback visual (opcional)
  const btn = getEl('btn-salvar-rascunho');
  if (btn) {
    const originalText = btn.innerHTML;
    btn.innerHTML = '💾 Salvando...';
    setTimeout(() => { btn.innerHTML = originalText; }, 1000);
  }
}

// ====================================================================
// FINALIZAR ACIDENTE (envia ao backend e remove rascunho local)
// ====================================================================
async function finalizarAcidente() {
  if (!validarFormularioAcidente()) return;
  
  const dados = montarObjetoAcidente();
  dados.finalizado = true;
  dados.status = 'FINALIZADO';
  
  // Primeiro salva rascunho final
  await fetch(URL_PLANILHA, {
    method: 'POST',
    mode: 'no-cors',
    body: new URLSearchParams({ acao: 'salvar_rascunho_acidente', dados: JSON.stringify(dados) })
  });
  
  // Depois finaliza
  const resp = await fetch(URL_PLANILHA, {
    method: 'POST',
    mode: 'no-cors',
    body: new URLSearchParams({ acao: 'finalizar_acidente', dados: JSON.stringify({ id: acidenteAtualId }) })
  });
  
  alert('✅ Relatório finalizado com sucesso!');
  localStorage.removeItem(`rascunho_acidente_${acidenteAtualId}`);
  fecharModalEnvio();
  // Recarregar consulta se estiver aberta
  if (getEl('modal-consulta-acidentes') && getEl('modal-consulta-acidentes').style.display !== 'none') {
    document.getElementById('btn-buscar-acidentes')?.click();
  }
}

function validarFormularioAcidente() {
  const data = getEl('acidente-data').value;
  const local = getEl('acidente-local').value;
  if (!data) { alert('Data do acidente é obrigatória.'); return false; }
  if (!local) { alert('Local é obrigatório.'); return false; }
  return true;
}

// ====================================================================
// BENS AVARIADOS (CRUD)
// ====================================================================
function adicionarBem() {
  const bem = {
    tipoBem: prompt('Tipo de bem (ex: Carro, Moto, Muro, Poste, etc.):') || '',
    placa: prompt('Placa (se veículo):') || '',
    ano: prompt('Ano:') || '',
    cor: prompt('Cor:') || '',
    modelo: prompt('Modelo:') || '',
    renavan: prompt('Renavan (se veículo):') || '',
    proprietario: prompt('Proprietário / Responsável:') || '',
    telefone: prompt('Telefone para contato:') || '',
    danos: prompt('Danos identificados:') || '',
    anexos: []  // Anexos específicos do bem (podem ser implementados depois)
  };
  bensArray.push(bem);
  renderizarListaBens();
  salvarRascunhoAcidente();
}

function removerBem(index) {
  if (confirm('Remover este bem?')) {
    bensArray.splice(index, 1);
    renderizarListaBens();
    salvarRascunhoAcidente();
  }
}

function renderizarListaBens() {
  const container = getEl('bens-list');
  if (!container) return;
  if (bensArray.length === 0) {
    container.innerHTML = '<div class="empty-list"><small>Nenhum bem adicionado.</small></div>';
    return;
  }
  let html = '<div class="cards-list">';
  bensArray.forEach((bem, idx) => {
    html += `
      <div class="bem-card" data-idx="${idx}">
        <div class="card-header"><strong>${bem.tipoBem || 'Bem'} - ${bem.placa || 'Sem placa'}</strong>
          <button class="btn-remover" onclick="removerBem(${idx})">🗑️</button>
        </div>
        <div class="card-body">
          ${bem.modelo ? `<div><strong>Modelo:</strong> ${bem.modelo}</div>` : ''}
          ${bem.cor ? `<div><strong>Cor:</strong> ${bem.cor}</div>` : ''}
          ${bem.ano ? `<div><strong>Ano:</strong> ${bem.ano}</div>` : ''}
          ${bem.proprietario ? `<div><strong>Proprietário:</strong> ${bem.proprietario}</div>` : ''}
          ${bem.telefone ? `<div><strong>Telefone:</strong> ${bem.telefone}</div>` : ''}
          ${bem.danos ? `<div><strong>Danos:</strong> ${bem.danos}</div>` : ''}
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

// ====================================================================
// VÍTIMAS E TESTEMUNHAS (CRUD)
// ====================================================================
function adicionarPessoa(tipo) {
  const nome = prompt(`Nome da ${tipo}:`);
  if (!nome) return;
  const documento = prompt('Documento (RG/CPF) ou identificação:');
  const contato = prompt('Telefone / Contato:');
  const observacoes = prompt(`Observações (ex: lesões para vítimas, relato para testemunhas):`);
  pessoasArray.push({
    tipo: tipo,
    nome: nome,
    documento: documento || '',
    contato: contato || '',
    observacoes: observacoes || ''
  });
  renderizarListaPessoas();
  salvarRascunhoAcidente();
}

function removerPessoa(index) {
  if (confirm('Remover esta pessoa?')) {
    pessoasArray.splice(index, 1);
    renderizarListaPessoas();
    salvarRascunhoAcidente();
  }
}

function renderizarListaPessoas() {
  const containerVitimas = getEl('vitimas-list');
  const containerTestemunhas = getEl('testemunhas-list');
  if (!containerVitimas || !containerTestemunhas) return;
  
  const vitimas = pessoasArray.filter(p => p.tipo === 'Vítima');
  const testemunhas = pessoasArray.filter(p => p.tipo === 'Testemunha');
  
  const renderGrupo = (lista, tipo) => {
    if (lista.length === 0) return `<div class="empty-list"><small>Nenhum(a) ${tipo.toLowerCase()} adicionado(a).</small></div>`;
    let html = '<div class="cards-list">';
    lista.forEach((pessoa, idx) => {
      const globalIdx = pessoasArray.findIndex(p => p === pessoa);
      html += `
        <div class="pessoa-card" data-idx="${globalIdx}">
          <div class="card-header"><strong>${pessoa.nome}</strong>
            <button class="btn-remover" onclick="removerPessoa(${globalIdx})">🗑️</button>
          </div>
          <div class="card-body">
            ${pessoa.documento ? `<div><strong>Documento:</strong> ${pessoa.documento}</div>` : ''}
            ${pessoa.contato ? `<div><strong>Contato:</strong> ${pessoa.contato}</div>` : ''}
            ${pessoa.observacoes ? `<div><strong>Observações:</strong> ${pessoa.observacoes}</div>` : ''}
          </div>
        </div>
      `;
    });
    html += '</div>';
    return html;
  };
  
  containerVitimas.innerHTML = renderGrupo(vitimas, 'Vítima');
  containerTestemunhas.innerHTML = renderGrupo(testemunhas, 'Testemunha');
}

// ====================================================================
// ANEXOS PRINCIPAIS (até 4 arquivos)
// ====================================================================
function anexarArquivosPrincipais() {
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.accept = 'image/*,application/pdf';
  input.onchange = async (e) => {
    const files = Array.from(e.target.files);
    if (anexosPrincipaisArray.length + files.length > 4) {
      alert('Máximo de 4 anexos gerais por acidente.');
      return;
    }
    for (const file of files) {
      const base64 = await fileToBase64(file);
      anexosPrincipaisArray.push({
        base64: base64.split(',')[1],
        mimeType: file.type,
        nome: file.name
      });
    }
    renderizarListaAnexosPrincipais();
    salvarRascunhoAcidente();
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

function removerAnexoPrincipal(index) {
  anexosPrincipaisArray.splice(index, 1);
  renderizarListaAnexosPrincipais();
  salvarRascunhoAcidente();
}

function renderizarListaAnexosPrincipais() {
  const container = getEl('lista-anexos-principais');
  if (!container) return;
  if (anexosPrincipaisArray.length === 0) {
    container.innerHTML = '<small>Nenhum anexo geral</small>';
    return;
  }
  let html = '';
  anexosPrincipaisArray.forEach((a, idx) => {
    html += `<div class="anexo-item">
              📎 ${a.nome}
              <button class="btn-remover-pequeno" onclick="removerAnexoPrincipal(${idx})">❌</button>
            </div>`;
  });
  container.innerHTML = html;
}

// ====================================================================
// CARREGAR ACIDENTE EXISTENTE (para edição ou visualização)
// ====================================================================
async function carregarAcidenteExistente(id) {
  const url = `${URL_PLANILHA}?acao=obter_acidente&id=${id}`;
  const response = await fetch(url);
  const acidente = await response.json();
  if (!acidente) return;
  
  acidenteAtualId = acidente.id;
  originalStatus = acidente.status;
  editMode = true;
  
  // Preencher campos principais
  getEl('acidente-data').value = acidente.dataAcidente || '';
  getEl('acidente-hora').value = acidente.horaAcidente || '';
  getEl('acidente-local').value = acidente.local || '';
  getEl('acidente-prefixo').value = acidente.prefixo || '';
  getEl('acidente-motorista').value = acidente.motoristaChapa || '';
  getEl('acidente-descricao').value = acidente.descricaoAnalise || '';
  
  bensArray = acidente.bens || [];
  pessoasArray = acidente.pessoas || [];
  anexosPrincipaisArray = acidente.anexosPrincipais || [];
  
  renderizarListaBens();
  renderizarListaPessoas();
  renderizarListaAnexosPrincipais();
  
  // Verificar permissão de edição
  const currentUser = localStorage.getItem('inspectorApelido');
  const podeEditar = (currentUserRole === 'ADMIN' || currentUserRole === 'SAF' || currentUserRole === 'ENCARREGADO' || acidente.fiscal === currentUser);
  
  if (acidente.status === 'FINALIZADO' || !podeEditar) {
    // Modo somente leitura
    desabilitarEdicao();
    alert('Este relatório está finalizado ou você não tem permissão para editar. Modo somente leitura.');
  } else {
    habilitarEdicao();
  }
}

function desabilitarEdicao() {
  const inputs = document.querySelectorAll('#modal-envio-informacoes input, #modal-envio-informacoes textarea, #modal-envio-informacoes select, #modal-envio-informacoes button');
  inputs.forEach(el => el.disabled = true);
  // Botão finalizar especificamente
  const btnFinal = getEl('btn-finalizar-acidente');
  if (btnFinal) btnFinal.disabled = true;
}

function habilitarEdicao() {
  const inputs = document.querySelectorAll('#modal-envio-informacoes input, #modal-envio-informacoes textarea, #modal-envio-informacoes select');
  inputs.forEach(el => el.disabled = false);
  const btnFinal = getEl('btn-finalizar-acidente');
  if (btnFinal) btnFinal.disabled = false;
  const btnSalvar = getEl('btn-salvar-rascunho');
  if (btnSalvar) btnSalvar.disabled = false;
}

// ====================================================================
// AUTOCOMPLETE (veículos e operadores via backend)
// ====================================================================
function iniciarAutoComplete() {
  const prefixoInput = getEl('acidente-prefixo');
  const motoristaInput = getEl('acidente-motorista');
  const datalistVeiculos = getEl('lista-veiculos');
  const datalistMotoristas = getEl('lista-motoristas');
  
  if (prefixoInput && datalistVeiculos) {
    prefixoInput.addEventListener('input', debounce(async function() {
      const termo = this.value;
      if (termo.length < 2) return;
      const url = `${URL_PLANILHA}?acao=buscar_veiculo&prefixo=${encodeURIComponent(termo)}`;
      try {
        const resp = await fetch(url);
        const veiculo = await resp.json();
        if (veiculo && veiculo.prefixo) {
          datalistVeiculos.innerHTML = `<option value="${veiculo.prefixo}">${veiculo.placa} - ${veiculo.modeloChassi || ''}</option>`;
        } else {
          datalistVeiculos.innerHTML = '';
        }
      } catch(e) { console.warn(e); }
    }, 500));
  }
  
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
        } else {
          datalistMotoristas.innerHTML = '';
        }
      } catch(e) { console.warn(e); }
    }, 500));
  }
}

// ====================================================================
// CONSULTA DE ACIDENTES (MODAL)
// ====================================================================
function abrirModalConsultaAcidentes() {
  const modal = getEl('modal-consulta-acidentes');
  if (!modal) return;
  modal.style.display = 'flex';
  
  const btnBuscar = getEl('btn-buscar-acidentes');
  if (btnBuscar) {
    btnBuscar.onclick = () => {
      const params = new URLSearchParams({
        acao: 'consultar_acidentes',
        prefixo: getEl('filtro-prefixo')?.value || '',
        motorista: getEl('filtro-motorista')?.value || '',
        dataInicio: getEl('filtro-data-inicio')?.value || '',
        dataFim: getEl('filtro-data-fim')?.value || '',
        status: getEl('filtro-status')?.value || '',
        papel: currentUserRole,
        apelido: localStorage.getItem('inspectorApelido')
      });
      fetch(`${URL_PLANILHA}?${params.toString()}`)
        .then(res => res.json())
        .then(acidentes => {
          const container = getEl('lista-acidentes-resultados');
          if (!container) return;
          if (!acidentes.length) {
            container.innerHTML = '<p>Nenhum acidente encontrado.</p>';
            return;
          }
          let html = '<div class="acidentes-lista">';
          acidentes.forEach(ac => {
            html += `
              <div class="acidente-item">
                <div><strong>${ac.dataAcidente || 'Data não informada'}</strong> - ${ac.local || 'Local não informado'}</div>
                <div>Prefixo: ${ac.prefixo || '-'} | Motorista: ${ac.motorista || '-'}</div>
                <div>Status: ${ac.status} | Fiscal: ${ac.fiscal}</div>
                <div class="acoes">
                  <button onclick="abrirModalEnvio('${ac.id}')" class="btn-secundario pequeno">
                    ${ac.status === 'EM_ANDAMENTO' ? '✏️ Continuar edição' : '👁️ Visualizar'}
                  </button>
                </div>
              </div>
            `;
          });
          html += '</div>';
          container.innerHTML = html;
        })
        .catch(err => {
          console.error(err);
          alert('Erro na consulta.');
        });
    };
  }
}

function fecharModalConsulta() {
  const modal = getEl('modal-consulta-acidentes');
  if (modal) modal.style.display = 'none';
}

// ====================================================================
// DETALHES (visualização rápida) – opcional
// ====================================================================
function abrirModalDetalheAcidente(id) {
  fetch(`${URL_PLANILHA}?acao=obter_acidente&id=${id}`)
    .then(res => res.json())
    .then(ac => {
      const modal = getEl('modal-detalhe-acidente');
      const container = getEl('detalhe-acidente-conteudo');
      if (!modal || !container) return;
      let html = `
        <div><strong>Data/Hora:</strong> ${ac.dataAcidente} ${ac.horaAcidente || ''}</div>
        <div><strong>Local:</strong> ${ac.local}</div>
        <div><strong>Prefixo:</strong> ${ac.prefixo || '-'}</div>
        <div><strong>Motorista:</strong> ${ac.motoristaChapa || '-'}</div>
        <div><strong>Descrição:</strong> ${ac.descricaoAnalise || '-'}</div>
        <hr><h4>Bens avariados</h4>
      `;
      if (ac.bens && ac.bens.length) {
        ac.bens.forEach(b => {
          html += `<div><strong>${b.tipoBem}</strong> - Placa: ${b.placa} - Danos: ${b.danos}</div>`;
        });
      } else html += '<div>Nenhum bem informado</div>';
      html += `<hr><h4>Vítimas e testemunhas</h4>`;
      if (ac.pessoas && ac.pessoas.length) {
        ac.pessoas.forEach(p => {
          html += `<div><strong>${p.tipo}:</strong> ${p.nome} - ${p.observacoes || ''}</div>`;
        });
      } else html += '<div>Nenhuma pessoa informada</div>`;
      container.innerHTML = html;
      modal.style.display = 'flex';
    });
}

function fecharModalDetalhe() {
  const modal = getEl('modal-detalhe-acidente');
  if (modal) modal.style.display = 'none';
}

// ====================================================================
// UTILITÁRIOS
// ====================================================================
function preencherResponsavel() {
  const resp = getEl('aciente-responsavel'); // não existe no novo HTML, mas deixamos para compatibilidade
  // Não usado no acidente.js diretamente, mas manter função vazia para evitar erro
}

function preencherDataAtual() {
  const dataInput = getEl('acidente-data');
  if (dataInput && !dataInput.value) {
    const hoje = new Date().toISOString().split('T')[0];
    dataInput.value = hoje;
  }
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Exportar funções para o escopo global (necessário para onclick nos botões dinâmicos)
window.adicionarBem = adicionarBem;
window.removerBem = removerBem;
window.removerPessoa = removerPessoa;
window.removerAnexoPrincipal = removerAnexoPrincipal;
window.abrirModalEnvio = abrirModalEnvio;
window.fecharModalEnvio = fecharModalEnvio;
window.finalizarAcidente = finalizarAcidente;
window.salvarRascunhoAcidente = salvarRascunhoAcidente;
window.abrirModalConsultaAcidentes = abrirModalConsultaAcidentes;
window.fecharModalConsulta = fecharModalConsulta;
window.abrirModalDetalheAcidente = abrirModalDetalheAcidente;
window.fecharModalDetalhe = fecharModalDetalhe;
window.anexarArquivosPrincipais = anexarArquivosPrincipais;

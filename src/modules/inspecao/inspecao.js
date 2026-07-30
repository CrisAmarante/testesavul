/**
 * Módulo de Inspeção Veicular
 * Formulário e consulta de inspeções - Versão com nova API
 */
import api from '../../api.js';
import { ENDPOINTS } from '../../config.js';
import { ModalController } from '../../core/utils.js';
import { currentUserRole, canCreateInspection } from '../../auth.js';

class InspecaoVeicular {
  constructor() {
    this.modal = new ModalController('modal-inspecao-veicular');
    this.initEventListeners();
  }

  close() {
    this.modal.close();
  }

  initEventListeners() {
    document.getElementById('btn-inspecao-veicular')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.open();
    });

    // Configura os checkboxes e inputs de observação/posição
    this.setupRowListeners();

    document.getElementById('btn-enviar-inspecao')?.addEventListener('click', () => this.enviarInspecao());
    document.getElementById('btn-conferir-inspecoes')?.addEventListener('click', () => this.conferirInspecoes());
  }

  setupRowListeners() {
    document.querySelectorAll('#tabela-inspecao tbody tr.inspection-row').forEach(row => {
      const cbOk = row.querySelector('.ok');
      const cbDef = row.querySelector('.defeito');
      const item = row.dataset.item;
      const obsRow = document.querySelector(`#tabela-inspecao tbody tr.obs-row[data-item="${item}"]`);
      const obsInput = obsRow ? obsRow.querySelector('.obs-input') : null;
      const posBtns = row.querySelectorAll('.pos-btn');

      const atualizarEstadoLinha = () => {
        const isDefective = cbDef.checked;

        if (obsInput) {
          obsInput.disabled = !isDefective;
          if (!isDefective) obsInput.value = '';
        }

        if (posBtns && posBtns.length > 0) {
          posBtns.forEach(btn => {
            btn.disabled = !isDefective;
            if (!isDefective) btn.classList.remove('active');
          });
        }
      };

      if (cbOk && cbDef) {
        cbOk.addEventListener('change', () => {
          if (cbOk.checked) cbDef.checked = false;
          atualizarEstadoLinha();
        });
        cbDef.addEventListener('change', () => {
          if (cbDef.checked) cbOk.checked = false;
          atualizarEstadoLinha();
        });
      }

      atualizarEstadoLinha();
    });

    // Botões de posição (F, M, T)
    document.querySelectorAll('.pos-btn').forEach(btn =>
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!btn.disabled) {
          btn.classList.toggle('active');
        }
      })
    );
  }

  async open() {
    if (canCreateInspection) {
      await this.carregarTerminais();
      this.openForm();
    } else {
      await this.conferirInspecoes();
    }
  }

  async carregarTerminais() {
    try {
      const terminais = await api.get(ENDPOINTS.TERMINAIS);
      const select = document.getElementById('terminal');
      if (select) {
        const valorAtual = select.value;
        select.innerHTML = '<option value="">Selecione...</option>';
        terminais.forEach(t => {
          const opt = document.createElement('option');
          opt.value = t;
          opt.textContent = t;
          select.appendChild(opt);
        });
        if (valorAtual && terminais.includes(valorAtual)) select.value = valorAtual;
      }
    } catch (err) {
      console.error('Erro ao carregar terminais:', err);
    }
  }

  openForm() {
    this.modal.open();
    this.preencherAutomatico();
    this.resetarFormulario();
    const btn = document.getElementById('btn-conferir-inspecoes');
    if (btn) {
      btn.style.display = (currentUserRole === 'FISCAL' || currentUserRole === 'INSPETOR') ? 'block' : 'none';
    }
  }

  preencherAutomatico() {
    const userData = api.getUserData();
    const apelido = userData?.apelido || 'Inspetor';
    const fiscalInput = document.getElementById('fiscal');
    if (fiscalInput) fiscalInput.value = apelido;
    
    const agora = new Date();
    const dataInput = document.getElementById('data');
    if (dataInput) dataInput.value = agora.toLocaleDateString('pt-BR');
    
    const horaInput = document.getElementById('hora');
    if (horaInput) horaInput.value = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  atualizarDataHora() {
    const agora = new Date();
    const dataInput = document.getElementById('data');
    if (dataInput) dataInput.value = agora.toLocaleDateString('pt-BR');
    const horaInput = document.getElementById('hora');
    if (horaInput) horaInput.value = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  resetarFormulario() {
    const carroInput = document.getElementById('carro');
    if (carroInput) carroInput.value = '';
    
    document.querySelectorAll('#tabela-inspecao tbody tr.inspection-row .ok, #tabela-inspecao tbody tr.inspection-row .defeito')
      .forEach(cb => cb.checked = false);

    document.querySelectorAll('.obs-input').forEach(inp => {
      inp.value = '';
      inp.disabled = true;
    });

    document.querySelectorAll('.pos-btn').forEach(btn => {
      btn.classList.remove('active');
      btn.disabled = true;
    });
  }

  coletarDados() {
    const carro = document.getElementById('carro')?.value?.trim() || '';
    const terminal = document.getElementById('terminal')?.value || '';
    const fiscal = document.getElementById('fiscal')?.value || '';
    
    if (!carro || !terminal) {
      alert('Preencha o campo CARRO e selecione o TERMINAL.');
      return null;
    }
    
    const itens = {};
    document.querySelectorAll('#tabela-inspecao tbody tr.inspection-row').forEach(row => {
      const item = row.dataset.item;
      const ok = row.querySelector('.ok')?.checked || false;
      const defeito = row.querySelector('.defeito')?.checked || false;
      const obsRow = document.querySelector(`#tabela-inspecao tbody tr.obs-row[data-item="${item}"]`);
      const obs = obsRow ? obsRow.querySelector('.obs-input')?.value?.trim() || '' : '';
      itens[item] = { status: ok ? 'OK' : defeito ? 'DEFEITO' : '', obs: obs };
      if (item === 'ventilador') {
        itens[item].posicao = Array.from(row.querySelectorAll('.pos-btn.active'))
          .map(btn => btn.dataset.pos)
          .join(',');
      }
    });
    return { carro, terminal, fiscal, itens };
  }

  async enviarInspecao() {
    if (!canCreateInspection) {
      alert('Seu perfil não permite criar inspeções.');
      return;
    }
    this.atualizarDataHora();
    const dados = this.coletarDados();
    if (!dados) return;

    const dadosEnvio = {
      carro: dados.carro,
      terminal: dados.terminal,
      fiscal: dados.fiscal,
      thoreb: dados.itens.thoreb,
      elevador: dados.itens.elevador,
      limpeza: dados.itens.limpeza,
      ventilador: dados.itens.ventilador,
    };

    let resumo = `CONFIRMAR ENVIO?\n\nCarro: ${dadosEnvio.carro}\nTerminal: ${dadosEnvio.terminal}\nFiscal: ${dadosEnvio.fiscal}\n\nItens:\n`;
    for (const [item, info] of Object.entries(dados.itens)) {
      let status = info.status || 'NÃO INFORMADO';
      resumo += `- ${item.toUpperCase()}: ${status}`;
      if (info.obs) resumo += ` (Obs: ${info.obs})`;
      if (info.posicao) resumo += ` (Pos: ${info.posicao})`;
      resumo += '\n';
    }
    if (!confirm(resumo + '\n\nDeseja enviar os dados?')) return;

    try {
      await api.post(ENDPOINTS.INSPECOES, dadosEnvio);
      alert('✅ Inspeção enviada com sucesso!');
      this.resetarFormulario();
    } catch (err) {
      console.error(err);
      alert('❌ Erro ao enviar: ' + err.message);
    }
  }

  // ======================== CONSULTAS ========================
  conferirInspecoes() {
    const hoje = new Date().toISOString().split('T')[0];
    this.conferirInspecoesComFiltro(hoje, hoje, null, null);
  }

  async conferirInspecoesComFiltro(dataInicio, dataFim, carro, fiscalFiltro) {
    const hojeStr = new Date().toISOString().split('T')[0];
    if (dataInicio && dataInicio > hojeStr) {
      alert('A data de início não pode ser maior que a data atual.');
      return;
    }
    if (dataFim && dataFim > hojeStr) {
      alert('A data de fim não pode ser maior que a data atual.');
      return;
    }
    if (dataInicio && dataFim && dataInicio > dataFim) {
      alert('A data de início não pode ser maior que a data de fim.');
      return;
    }

    const params = {};
    if (dataInicio) params.dataInicio = dataInicio;
    if (dataFim) params.dataFim = dataFim;
    if (carro) params.carro = carro;
    if (fiscalFiltro) params.fiscalFiltro = fiscalFiltro;

    // FISCAL vê apenas suas próprias inspeções
    if (currentUserRole === 'FISCAL') {
      const userData = api.getUserData();
      params.fiscal = userData?.apelido || '';
    }

    try {
      const inspecoes = await api.get(ENDPOINTS.INSPECOES, params);
      mostrarModalConferir(inspecoes || [], currentUserRole, params);
    } catch (err) {
      alert('Erro ao consultar inspeções: ' + err.message);
    }
  }
}

// ====================================================================
// FUNÇÕES GLOBAIS DO MODAL DE CONSULTA
// ====================================================================
function mostrarModalConferir(inspecoes, role, params) {
  // Mantém a mesma lógica de renderização do HTML (não alteramos)
  // A função já existente em inspecao.js pode ser mantida,
  // ou você pode reescrevê-la aqui. Como é extensa, sugiro manter a original.
  // Apenas substitua a chamada JSONP por esta função que recebe dados já prontos.
  // Vou assumir que a função original existe e apenas chamo ela.
  if (typeof window.mostrarModalConferirOriginal === 'function') {
    window.mostrarModalConferirOriginal(inspecoes, role, params);
  } else {
    // Fallback simples
    const container = document.getElementById('lista-inspecoes');
    if (container) {
      container.innerHTML = inspecoes.map(i => `<div>${i.carro} - ${i.terminal}</div>`).join('');
    }
    const modal = document.getElementById('modal-conferir-inspecoes');
    if (modal) modal.classList.add('is-open');
  }
}

// Exportar
export default InspecaoVeicular;
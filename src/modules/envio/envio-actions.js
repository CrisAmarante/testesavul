/**
 * Módulo de Envio de Informações - Parte 3
 * Rascunho, envio e consulta de relatórios usando nova API
 */
import api from '../../api.js';
import { ENDPOINTS } from '../../config.js';
import { anexosArray, rascunhoAtualId, atualizarListaAnexos, limparFormularioEnvio, preencherResponsavel, validarFormulario } from './envio-base.js';
import { consultarEnvios } from './envio-consulta.js';

// ====================================================================
// RASCUNHO
// ====================================================================
export function salvarRascunho() {
  if (!validarFormulario()) return;
  
  const areaDestino = document.querySelector('input[name="areaDestino"]:checked')?.value;
  let areaDestinoFinal = areaDestino === 'OUTRAS ÁREAS' ? document.getElementById('envio-outras-area').value.trim() : areaDestino;
  
  const motivo = document.querySelector('input[name="motivo"]:checked')?.value;
  let motivoFinal = motivo === 'OUTROS' ? document.getElementById('envio-outros-motivo').value.trim() : motivo;
  
  const agora = new Date();
  const dataPreenchimento = agora.toLocaleDateString('pt-BR');
  const horaPreenchimento = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  const dados = {
    id: rascunhoAtualId || Date.now().toString(),
    areaDestino: areaDestinoFinal,
    motivo: motivoFinal,
    carro: document.getElementById('envio-carro').value,
    linha: document.getElementById('envio-linha').value,
    motorista: document.getElementById('envio-motorista').value,
    cobrador: document.getElementById('envio-cobrador').value,
    hora: document.getElementById('envio-hora').value,
    sentido: document.getElementById('envio-sentido').value,
    historico: document.getElementById('envio-historico').value,
    local: document.getElementById('envio-local').value,
    data: document.getElementById('envio-data').value,
    anexos: anexosArray.map(a => ({ base64: a.base64, mimeType: a.mimeType, nome: a.nome })),
    fiscal: api.getUserData()?.apelido || '',
    dataPreenchimento: dataPreenchimento,
    horaPreenchimento: horaPreenchimento
  };
  
  localStorage.setItem(`rascunho_${dados.id}`, JSON.stringify(dados));
  window.rascunhoAtualId = dados.id;
  alert('Rascunho salvo!');
}

export function carregarRascunho() {
  if (!window.rascunhoAtualId) {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('rascunho_'));
    if (keys.length) window.rascunhoAtualId = keys[0].replace('rascunho_', '');
    else { limparFormularioEnvio(); preencherResponsavel(); return; }
  }
  
  const dados = JSON.parse(localStorage.getItem(`rascunho_${window.rascunhoAtualId}`));
  if (dados) {
    // Preenche os campos (mesma lógica anterior)
    if (['FISCALIZAÇÃO','SAF','PLANTÃO'].includes(dados.areaDestino)) {
      document.querySelector(`input[name="areaDestino"][value="${dados.areaDestino}"]`).checked = true;
    } else {
      document.querySelector(`input[name="areaDestino"][value="OUTRAS ÁREAS"]`).checked = true;
      document.getElementById('envio-outras-area').value = dados.areaDestino;
      document.getElementById('campo-outras-area').style.display = 'block';
    }
    
    if (['AVARIAS','PEDIDO DE FOLGAS','SOLICITAÇÃO DE MATERIAIS'].includes(dados.motivo)) {
      document.querySelector(`input[name="motivo"][value="${dados.motivo}"]`).checked = true;
    } else {
      document.querySelector(`input[name="motivo"][value="OUTROS"]`).checked = true;
      document.getElementById('envio-outros-motivo').value = dados.motivo;
      document.getElementById('campo-outros-motivo').style.display = 'block';
    }
    
    document.getElementById('envio-carro').value = dados.carro || '';
    document.getElementById('envio-linha').value = dados.linha || '';
    document.getElementById('envio-motorista').value = dados.motorista || '';
    document.getElementById('envio-cobrador').value = dados.cobrador || '';
    document.getElementById('envio-hora').value = dados.hora || '';
    document.getElementById('envio-sentido').value = dados.sentido || '';
    document.getElementById('envio-historico').value = dados.historico || '';
    document.getElementById('envio-local').value = dados.local || '';
    document.getElementById('envio-data').value = dados.data || '';
    
    if (dados.anexos && Array.isArray(dados.anexos)) {
      anexosArray = dados.anexos;
      atualizarListaAnexos();
    }
    
    preencherResponsavel();
    if (typeof habilitarCamposSecundarios === 'function') habilitarCamposSecundarios(true);
    if (typeof aplicarRegrasPorArea === 'function') aplicarRegrasPorArea();
    if (typeof aplicarRegrasPorMotivo === 'function') aplicarRegrasPorMotivo();
  } else {
    limparFormularioEnvio();
    preencherResponsavel();
  }
}

// ====================================================================
// ENVIO PARA O SERVIDOR (via API)
// ====================================================================
export async function enviarRelatorio() {
  if (!validarFormulario()) return;
  
  const areaDestino = document.querySelector('input[name="areaDestino"]:checked')?.value;
  let areaDestinoFinal = areaDestino === 'OUTRAS ÁREAS' ? document.getElementById('envio-outras-area').value.trim() : areaDestino;
  
  const motivo = document.querySelector('input[name="motivo"]:checked')?.value;
  let motivoFinal = motivo === 'OUTROS' ? document.getElementById('envio-outros-motivo').value.trim() : motivo;

  const btnEnviar = document.getElementById('btn-enviar-relatorio');
  const textoBotaoOriginal = btnEnviar.innerHTML;
  btnEnviar.innerHTML = '⏳ Enviando...';
  btnEnviar.disabled = true;

  const agora = new Date();
  const dataPreenchimento = agora.toLocaleDateString('pt-BR');
  const horaPreenchimento = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const dadosEnvio = {
    areaDestino: areaDestinoFinal,
    motivo: motivoFinal,
    carro: document.getElementById('envio-carro').value,
    linha: document.getElementById('envio-linha').value,
    motorista: document.getElementById('envio-motorista').value,
    cobrador: document.getElementById('envio-cobrador').value,
    hora: document.getElementById('envio-hora').value,
    sentido: document.getElementById('envio-sentido').value,
    historico: document.getElementById('envio-historico').value,
    local: document.getElementById('envio-local').value,
    data: document.getElementById('envio-data').value,
    anexos: anexosArray.map(a => ({ base64: a.base64, mimeType: a.mimeType, nome: a.nome })),
    fiscal: api.getUserData()?.apelido || '',
    dataPreenchimento: dataPreenchimento,
    horaPreenchimento: horaPreenchimento
  };

  console.log('📤 Enviando dados:', dadosEnvio);

  try {
    await api.post(ENDPOINTS.RELATORIOS, dadosEnvio);
    alert('✅ Relatório e anexos enviados com sucesso!');
    if (window.rascunhoAtualId) localStorage.removeItem(`rascunho_${window.rascunhoAtualId}`);
    limparFormularioEnvio();
    fecharModalEnvio();
  } catch (error) {
    console.error('❌ Erro no envio:', error);
    alert('Erro ao enviar: ' + error.message);
  } finally {
    btnEnviar.innerHTML = textoBotaoOriginal;
    btnEnviar.disabled = false;
  }
}

// Função para fechar modal (definida em envio-base.js)
function fecharModalEnvio() {
  const m = document.getElementById('modal-envio-informacoes');
  if (m) m.classList.remove('is-open');
}
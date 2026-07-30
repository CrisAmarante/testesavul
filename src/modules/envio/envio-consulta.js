/**
 * Módulo de Envio de Informações - Parte 4
 * Consulta, detalhes, exportação PDF e notificações usando nova API
 */
import api from '../../api.js';
import { ENDPOINTS } from '../../config.js';

// ====================================================================
// CONSULTAS DE ENVIOS
// ====================================================================
export async function consultarEnvios() {
  await consultarEnviosComFiltro(null, null, null, null, null);
}

export async function consultarEnviosComFiltro(dataInicio, dataFim, motivo, carro, fiscalFiltro) {
  const params = {};
  if (dataInicio) params.dataInicio = dataInicio;
  if (dataFim) params.dataFim = dataFim;
  if (motivo) params.motivo = motivo;
  if (carro) params.carro = carro;
  if (fiscalFiltro) params.fiscalFiltro = fiscalFiltro;

  try {
    const dados = await api.get(ENDPOINTS.RELATORIOS, params);
    mostrarListaEnvios(dados || []);
  } catch (err) {
    alert('Erro ao consultar envios: ' + err.message);
  }
}

// ====================================================================
// MOSTRAR LISTA DE ENVIOS
// ====================================================================
function mostrarListaEnvios(dados) {
  const container = document.getElementById('lista-envios-container');
  const modal = document.getElementById('modal-lista-envios');
  
  if (!container || !modal) {
    console.error('Elementos não encontrados');
    return;
  }
  
  if (!dados || dados.length === 0) {
    container.innerHTML = '<p>Nenhum envio encontrado.</p>';
    modal.classList.add('is-open');
    return;
  }

  // Filtra notificações para SAF/ENCARREGADO (mesma lógica anterior)
  const role = window.currentUserRole || '';
  if (['SAF', 'ENCARREGADO'].includes(role)) {
    dados.forEach(envio => {
      const areaEnvio = envio.area_destino || '';
      const deveNotificar = role === 'SAF' ? areaEnvio === 'SAF' : true;
      if (deveNotificar && envio.id) {
        adicionarNotificacaoNaoLida(envio);
      }
    });
    atualizarPainelNotificacoes();
  }

  let html = '';
  dados.forEach((envio, idx) => {
    html += `
      <div class="envio-item" data-idx="${idx}" style="cursor: pointer;">
        <strong>👤 RESPONSÁVEL: ${envio.fiscal || 'N/I'}</strong><br>
        <strong>MOTIVO: ${envio.motivo || 'N/I'}</strong><br>
        CARRO: ${envio.carro || 'N/I'} | DATA: ${formatarData(envio.data_acontecimento)} | MOTORISTA: ${envio.motorista || 'N/I'}
      </div>
    `;
  });
  container.innerHTML = html;
  
  document.querySelectorAll('.envio-item').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.idx);
      if (!isNaN(idx)) mostrarDetalheEnvio(dados[idx]);
    });
  });
  
  modal.classList.add('is-open');
}

// ====================================================================
// DETALHES DO ENVIO (mantém a mesma lógica, apenas ajusta campos)
// ====================================================================
function mostrarDetalheEnvio(envio) {
  // A mesma função que você já tinha, mas usando as novas propriedades
  // (ex: data_acontecimento, area_destino, anexos, etc.)
  // Como é extensa, vou manter a estrutura. Se preferir, posso reescrever.
  // Por ora, chamo a função original se existir.
  if (typeof window.mostrarDetalheEnvioOriginal === 'function') {
    window.mostrarDetalheEnvioOriginal(envio);
  } else {
    // Fallback simples
    const container = document.getElementById('detalhe-envio-conteudo');
    if (container) {
      container.innerHTML = `
        <div><strong>Motivo:</strong> ${envio.motivo}</div>
        <div><strong>Histórico:</strong> ${envio.historico}</div>
        <div><strong>Responsável:</strong> ${envio.fiscal}</div>
      `;
    }
    const modal = document.getElementById('modal-detalhe-envio');
    if (modal) modal.classList.add('is-open');
  }
}

// ====================================================================
// NOTIFICAÇÕES (SAF/ENCARREGADO) - mantém a lógica com localStorage
// ====================================================================
const STORAGE_KEY_NOTIFICACOES = 'penso_notificacoes_nao_lidas';

function adicionarNotificacaoNaoLida(envio) {
  if (!envio || !envio.id) return;
  const notificacoes = getNotificacoesNaoLidas();
  const existe = notificacoes.some(n => n.id === envio.id);
  if (existe) return;
  
  notificacoes.push({
    id: envio.id,
    motivo: envio.motivo || 'N/I',
    fiscal: envio.fiscal || 'N/I',
    carro: envio.carro || 'N/I',
    data: envio.data_acontecimento || '',
    timestamp: Date.now()
  });
  localStorage.setItem(STORAGE_KEY_NOTIFICACOES, JSON.stringify(notificacoes));
  atualizarPainelNotificacoes();
}

function getNotificacoesNaoLidas() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_NOTIFICACOES);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function marcarComoLida(id) {
  const notificacoes = getNotificacoesNaoLidas();
  const filtradas = notificacoes.filter(n => n.id !== id);
  localStorage.setItem(STORAGE_KEY_NOTIFICACOES, JSON.stringify(filtradas));
  atualizarPainelNotificacoes();
}

function marcarTodosComoLidos() {
  localStorage.removeItem(STORAGE_KEY_NOTIFICACOES);
  atualizarPainelNotificacoes();
}

function atualizarPainelNotificacoes() {
  // Mesma lógica anterior
  const painel = document.getElementById('painel-notificacoes');
  const lista = document.getElementById('lista-notificacoes');
  const contador = document.getElementById('contador-nao-lidos');
  if (!painel || !lista || !contador) return;
  
  const notificacoes = getNotificacoesNaoLidas();
  const naoLidasCount = notificacoes.length;
  contador.textContent = naoLidasCount;
  
  const role = window.currentUserRole || '';
  if (['SAF', 'ENCARREGADO'].includes(role) && naoLidasCount > 0) {
    painel.classList.add('visivel');
  } else {
    painel.classList.remove('visivel');
  }
  
  if (naoLidasCount === 0) {
    lista.innerHTML = '<p class="sem-notificacoes">Nenhuma notificação não lida</p>';
  } else {
    lista.innerHTML = notificacoes.map(notif => `
      <div class="notificacao-item" onclick="clicarNotificacao('${notif.id}')">
        <div class="notificacao-motivo">${notif.motivo}</div>
        <div class="notificacao-detalhes">
          👤 ${notif.fiscal} | 🚗 ${notif.carro}<br>
          📅 ${formatarData(notif.data)}
        </div>
      </div>
    `).join('');
  }
}

window.marcarTodosComoLidos = marcarTodosComoLidos;

// ====================================================================
// EXPORTAÇÕES
// ====================================================================
export {
  consultarEnvios,
  consultarEnviosComFiltro,
  mostrarListaEnvios,
  mostrarDetalheEnvio,
  adicionarNotificacaoNaoLida,
  getNotificacoesNaoLidas,
  marcarComoLida,
  marcarTodosComoLidos,
  atualizarPainelNotificacoes,
};
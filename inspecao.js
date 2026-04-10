// ====================================================================
// MÓDULO DE INSPEÇÃO VEICULAR OTIMIZADO
// ====================================================================
class InspecaoVeicular {
  constructor() {
    this.modal = new ModalController('modal-inspecao-veicular');
    this.initEventListeners();
  }

  close() { this.modal.close(); }

  initEventListeners() {
    getEl('btn-inspecao-veicular')?.addEventListener('click', (e) => { e.preventDefault(); this.open(); });

    document.querySelectorAll('#tabela-inspecao tbody tr').forEach(row => {
      const cbOk = row.querySelector('.ok'), cbDef = row.querySelector('.defeito');
      const obsInput = row.querySelector('.obs-input'), posBtns = row.querySelectorAll('.pos-btn');

      const atualizarEstado = () => {
        const isDef = cbDef.checked;
        if (obsInput) { obsInput.disabled = !isDef; if (!isDef) obsInput.value = ''; }
        posBtns.forEach(btn => { btn.disabled = !isDef; if (!isDef) btn.classList.remove('active'); });
      };

      cbOk?.addEventListener('change', () => { if (cbOk.checked) cbDef.checked = false; atualizarEstado(); });
      cbDef?.addEventListener('change', () => { if (cbDef.checked) cbOk.checked = false; atualizarEstado(); });
    });

    document.querySelectorAll('.pos-btn').forEach(btn => btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!btn.disabled) btn.classList.toggle('active');
    }));

    getEl('btn-enviar-inspecao')?.addEventListener('click', () => this.enviarInspecao());
    getEl('btn-conferir-inspecoes')?.addEventListener('click', () => this.conferirInspecoes());
  }

  async open() {
    if (canCreateInspection) {
      preencherSelectTerminais();
      this.modal.open();
      this.preencherAutomatico();
      this.resetarFormulario();
      getEl('btn-conferir-inspecoes').style.display = (['FISCAL', 'INSPETOR'].includes(currentUserRole)) ? 'block' : 'none';
    } else {
      await this.conferirInspecoes();
    }
  }

  preencherAutomatico() {
    getEl('fiscal').value = localStorage.getItem('inspectorApelido') || 'Inspetor';
    const agora = new Date();
    getEl('data').value = agora.toLocaleDateString('pt-BR');
    getEl('hora').value = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  resetarFormulario() {
    getEl('carro').value = '';
    document.querySelectorAll('#tabela-inspecao tbody tr').forEach(row => {
      row.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
      const obs = row.querySelector('.obs-input');
      if (obs) { obs.value = ''; obs.disabled = true; }
      row.querySelectorAll('.pos-btn').forEach(b => { b.classList.remove('active'); b.disabled = true; });
    });
  }

  coletarDados() {
    const carro = getEl('carro').value.trim(), terminal = getEl('terminal').value;
    if (!carro || !terminal) return alert('Preencha CARRO e TERMINAL.'), null;

    const itens = {};
    document.querySelectorAll('#tabela-inspecao tbody tr').forEach(row => {
      const id = row.dataset.item;
      itens[id] = {
        status: row.querySelector('.ok').checked ? 'OK' : (row.querySelector('.defeito').checked ? 'DEFEITO' : ''),
        obs: row.querySelector('.obs-input').value.trim(),
        posicao: id === 'ventilador' ? Array.from(row.querySelectorAll('.pos-btn.active')).map(b => b.dataset.pos).join(',') : ''
      };
    });
    return { carro, terminal, fiscal: getEl('fiscal').value, data: getEl('data').value, hora: getEl('hora').value, itens };
  }

  async enviarInspecao() {
    const d = this.coletarDados();
    if (!d) return;

    let resumo = `CONFIRMAR ENVIO?\n\nCarro: ${d.carro}\nItens:\n` + 
      Object.entries(d.itens).map(([k, v]) => `- ${k.toUpperCase()}: ${v.status || 'N/A'} ${v.obs ? '('+v.obs+')' : ''}`).join('\n');

    if (!confirm(resumo)) return;

    try {
      await fetch(URL_PLANILHA, {
        method: 'POST', mode: 'no-cors',
        body: new URLSearchParams({ acao: 'inspecao_veicular', dados: JSON.stringify({ ...d, ...d.itens }) })
      });
      alert('✅ Enviado!'); this.resetarFormulario();
    } catch (e) { alert('❌ Erro ao enviar.'); }
  }

  conferirInspecoes() {
    const hoje = new Date().toISOString().split('T')[0];
    const p = new URLSearchParams({ acao: 'consultar_inspecoes', dataInicio: hoje, dataFim: hoje });
    if (currentUserRole === 'FISCAL') p.append('fiscal', localStorage.getItem('inspectorApelido'));
    this._executarConsulta(p);
  }

  _executarConsulta(params) {
    const callback = `cb_${Date.now()}`;
    window[callback] = (d) => { mostrarModalConferir(d || [], currentUserRole, params); delete window[callback]; };
    const s = document.createElement('script');
    s.src = `${URL_PLANILHA}?${params}&callback=${callback}`;
    document.body.appendChild(s);
  }
}

// Funções globais de UI permanecem similares, mas note que o "gerarTextoExportacao" 
// agora pegará dinamicamente os itens, incluindo LIMPEZA.
function gerarTextoExportacao(inspecoes, role) {
  let txt = `=== INSPEÇÕES ${new Date().toLocaleDateString()} ===\n\n`;
  inspecoes.forEach(ins => {
    const defs = ['thoreb', 'elevador', 'limpeza', 'ventilador']
      .filter(k => ins[k]?.status === 'DEFEITO')
      .map(k => `${k.toUpperCase()}: ${ins[k].obs || 's/ obs'} ${ins[k].posicao ? '(Pos:'+ins[k].posicao+')' : ''}`);
    
    if (defs.length) txt += `CARRO: ${ins.carro} (${ins.terminal})\nDefeitos:\n- ${defs.join('\n- ')}\n\n`;
  });
  return txt;
}

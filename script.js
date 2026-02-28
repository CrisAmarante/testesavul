// ==========================================================================
// CONFIGURAÇÕES
// ==========================================================================
const URL_PLANILHA = "https://script.google.com/macros/s/AKfycbza6e4tIw9DQ-sweGed3aQf2o_tOOf8Qg-BkgXWQq-A7KUuTmrYC0rOmv5l60MD6zcf/exec"; 

let INSPETORES = {};

// Datas de bloqueio (Santana alterado para Junho conforme seu arquivo)
const disableDates = {
    'btn-osasco': new Date('2026-02-19'),
    'btn-santana': new Date('2026-06-03')
};

// ==========================================================================
// CONTROLE DE INTERFACE (LOADING E MODAIS)
// ==========================================================================
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = show ? 'flex' : 'none';
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// ==========================================================================
// INTEGRAÇÃO GOOGLE SHEETS (JSONP)
// ==========================================================================

// Esta função É OBRIGATÓRIA para destravar a tela de carregamento
function processarDadosPlanilha(dados) {
    if (dados && !dados.erro) {
        INSPETORES = dados;
        console.log("✅ Lista de inspetores carregada!");
    } else {
        console.error("⚠️ Erro na planilha:", dados ? dados.erro : "Sem resposta");
    }
    showLoading(false); // Destrava a tela
}

function carregarInspetores() {
    showLoading(true);
    const script = document.createElement('script');
    // Adiciona timestamp para evitar cache e callback para processar os dados
    script.src = `${URL_PLANILHA}?callback=processarDadosPlanilha&t=${new Date().getTime()}`;
    script.onerror = () => {
        console.error("❌ Falha ao carregar o script da planilha");
        showLoading(false);
    };
    document.body.appendChild(script);
}

function registrarLog(nome) {
    const script = document.createElement('script');
    // Envia o log silenciosamente para a aba Log_Entradas
    script.src = `${URL_PLANILHA}?callback=console.log&acao=log&nome=${encodeURIComponent(nome)}`;
    document.body.appendChild(script);
}

// ==========================================================================
// SISTEMA DE LOGIN E SESSÃO
// ==========================================================================

function checkLoginStatus() {
    const logado = localStorage.getItem('inspectorLoggedIn');
    const nomeInspetor = localStorage.getItem('inspectorName');

    if (logado === 'true' && nomeInspetor) {
        document.getElementById('main-screen').style.display = 'none';
        document.getElementById('inspector-screen').style.display = 'flex';
        document.getElementById('welcome-msg').innerHTML = `Bem-vindo, <strong>${nomeInspetor}</strong>!`;
    } else {
        document.getElementById('main-screen').style.display = 'flex';
        document.getElementById('inspector-screen').style.display = 'none';
    }
}

function login(e) {
    e.preventDefault();
    const senhaDigitada = document.getElementById('password').value.trim();
    
    // Busca o apelido na Coluna C usando a senha da Coluna D
    const nomeEncontrado = Object.keys(INSPETORES).find(nome => INSPETORES[nome] === senhaDigitada);

    if (nomeEncontrado) {
        localStorage.setItem('inspectorLoggedIn', 'true');
        localStorage.setItem('inspectorName', nomeEncontrado);
        
        registrarLog(nomeEncontrado);
        
        closeModal('modal-login');
        checkLoginStatus();
    } else {
        document.getElementById('login-error').style.display = 'block';
        document.getElementById('password').value = '';
    }
}

function logoutInspector() {
    localStorage.removeItem('inspectorLoggedIn');
    localStorage.removeItem('inspectorName');
    checkLoginStatus();
}

function aplicarBloqueioDeDatas() {
    const now = new Date();
    for (const [id, date] of Object.entries(disableDates)) {
        const btn = document.getElementById(id);
        if (btn && now < date) {
            btn.classList.add('disabled');
            btn.setAttribute('href', '#');
        }
    }
}

// ==========================================================================
// INICIALIZAÇÃO
// ==========================================================================
window.addEventListener('load', () => {
    carregarInspetores();
    checkLoginStatus();
    aplicarBloqueioDeDatas();
});

// Eventos de clique
document.getElementById('btn-segunda-tela').addEventListener('click', (e) => {
    e.preventDefault();
    openModal('modal-login');
    document.getElementById('login-error').style.display = 'none';
    document.getElementById('password').value = '';
    document.getElementById('password').focus();
});

document.getElementById('login-form').addEventListener('submit', login);

document.getElementById('btn-clandestinos-rto').addEventListener('click', (e) => {
    e.preventDefault(); openModal('modal-clandestinos-rto');
});

document.getElementById('btn-inspecoes-5s').addEventListener('click', (e) => {
    e.preventDefault(); openModal('modal-inspecoes-5s');
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) e.target.style.display = 'none';
});

document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
});

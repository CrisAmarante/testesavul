// ==========================================================================
// CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
// ==========================================================================
const URL_PLANILHA = "https://script.google.com/macros/s/AKfycbw0JR--eavuUYN5LM1prpI7gWKnqNgMb7A260-dnP-YL4cuTdBeIXOKdeDmRjgyeCrF/exec"; 
let INSPETORES = {};

// Datas de bloqueio para os botões de 5S
const disableDates = {
    'btn-osasco': new Date('2026-02-19'),
    'btn-santana': new Date('2026-02-03')
};

// ==========================================================================
// 1. INTEGRAÇÃO COM GOOGLE SHEETS (JSONP)
// ==========================================================================

// Função global de retorno para carregar inspetores
function processarDadosPlanilha(dados) {
    INSPETORES = dados;
    console.log("Lista de inspetores sincronizada com a planilha.");
}

// Carrega os dados da planilha como um script externo
function carregarInspetores() {
    const script = document.createElement('script');
    script.src = `${URL_PLANILHA}?callback=processarDadosPlanilha`;
    document.body.appendChild(script);
}

// Envia o log de acesso para a aba LOGS na planilha
function registrarLog(nome) {
    const script = document.createElement('script');
    // Utilizamos o console.log como callback apenas para cumprir o requisito do JSONP
    script.src = `${URL_PLANILHA}?callback=console.log&acao=log&nome=${encodeURIComponent(nome)}`;
    document.body.appendChild(script);
}

// ==========================================================================
// 2. SISTEMA DE LOGIN E CONTROLE DE TELAS
// ==========================================================================

function checkLoginStatus() {
    const logado = localStorage.getItem('inspectorLoggedIn');
    const nomeInspetor = localStorage.getItem('inspectorName');

    if (logado === 'true') {
        document.getElementById('main-screen').style.display = 'none';
        document.getElementById('inspector-screen').style.display = 'flex';
        const welcomeMsg = document.getElementById('welcome-msg');
        if (welcomeMsg) welcomeMsg.innerText = `Bem-vindo, Inspetor ${nomeInspetor}!`;
    } else {
        document.getElementById('main-screen').style.display = 'flex';
        document.getElementById('inspector-screen').style.display = 'none';
    }
}

function login(e) {
    e.preventDefault();
    const senhaDigitada = document.getElementById('password').value.trim();
    
    // Busca o nome correspondente à senha na lista vinda da planilha
    const nomeEncontrado = Object.keys(INSPETORES).find(nome => INSPETORES[nome] === senhaDigitada);

    if (nomeEncontrado) {
        localStorage.setItem('inspectorLoggedIn', 'true');
        localStorage.setItem('inspectorName', nomeEncontrado);
        
        // Registra o acesso na aba LOGS antes de trocar de tela
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

// ==========================================================================
// 3. GERENCIAMENTO DE INTERFACE (MODAIS E BLOQUEIOS)
// ==========================================================================

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function aplicarBloqueioDeDatas() {
    const now = new Date();
    for (const [id, date] of Object.entries(disableDates)) {
        const btn = document.getElementById(id);
        if (btn && now < date) {
            btn.classList.add('disabled');
            btn.setAttribute('href', '#');
            btn.setAttribute('title', `Disponível após ${date.toLocaleDateString()}`);
        }
    }
}

// ==========================================================================
// 4. INICIALIZAÇÃO DE EVENTOS
// ==========================================================================

window.addEventListener('load', () => {
    carregarInspetores();
    checkLoginStatus();
    aplicarBloqueioDeDatas();
});

// Eventos de clique para abrir modais
document.getElementById('btn-segunda-tela').addEventListener('click', (e) => {
    e.preventDefault();
    openModal('modal-login');
    document.getElementById('login-error').style.display = 'none';
    document.getElementById('password').value = '';
    document.getElementById('password').focus();
});

document.getElementById('login-form').addEventListener('submit', login);

document.getElementById('btn-clandestinos-rto').addEventListener('click', (e) => {
    e.preventDefault();
    openModal('modal-clandestinos-rto');
});

document.getElementById('btn-inspecoes-5s').addEventListener('click', (e) => {
    e.preventDefault();
    openModal('modal-inspecoes-5s');
});

// Fechamento de modais (Clique fora ou tecla ESC)
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) e.target.style.display = 'none';
});

document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    }
});

// Tooltip para dispositivos touch (Usina de Ideias)
const tooltipBtn = document.getElementById('btn-ideias');
if (tooltipBtn) {
    tooltipBtn.addEventListener('touchstart', () => {
        tooltipBtn.classList.add('touch');
        setTimeout(() => tooltipBtn.classList.remove('touch'), 2000);
    });
}

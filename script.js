// ==========================================================================
// CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
// ==========================================================================
const URL_PLANILHA = "https://script.google.com/macros/s/AKfycbzzcOujA4G5S0E5Vu6iVRrf8f9d8F_uU6p7X-0MGxeNtOO1ayz_-Rq2jiaFyh5S3G0/exec"; // URL gerada no Google Apps Script
let INSPETORES = {};

// Datas de bloqueio para os botões de 5S
const disableDates = {
    'btn-osasco': new Date('2026-02-19'),
    'btn-santana': new Date('2026-02-03')
};

// ==========================================================================
// 1. INTEGRAÇÃO COM GOOGLE SHEETS
// ==========================================================================
async function carregarInspetores() {
    try {
        const response = await fetch(URL_PLANILHA);
        INSPETORES = await response.json();
        console.log("Lista de inspetores sincronizada com a planilha.");
    } catch (error) {
        console.error("Erro ao carregar inspetores:", error);
        // Backup de segurança para acesso administrativo
        INSPETORES = { "Admin": "123456" };
    }
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
        // Atualiza a saudação personalizada
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
    
    // Verifica se a senha corresponde a algum inspetor na lista da planilha
    const nomeEncontrado = Object.keys(INSPETORES).find(nome => INSPETORES[nome] === senhaDigitada);

    if (nomeEncontrado) {
        localStorage.setItem('inspectorLoggedIn', 'true');
        localStorage.setItem('inspectorName', nomeEncontrado);
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
// 3. GERENCIAMENTO DE MODAIS E BOTÕES
// ==========================================================================
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Lógica de desativação de botões baseada em data
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
// 4. INICIALIZAÇÃO E EVENTOS
// ==========================================================================
window.addEventListener('load', () => {
    carregarInspetores();
    checkLoginStatus();
    aplicarBloqueioDeDatas();
});

// Eventos de Clique
document.getElementById('btn-segunda-tela').addEventListener('click', (e) => {
    e.preventDefault();
    openModal('modal-login');
    document.getElementById('login-error').style.display = 'none';
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

// Fechar modais ao clicar fora ou ESC
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) e.target.style.display = 'none';
});

document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    }
});

// Tooltip para dispositivos touch
const tooltipBtn = document.getElementById('btn-ideias');
if (tooltipBtn) {
    tooltipBtn.addEventListener('touchstart', () => {
        tooltipBtn.classList.add('touch');
        setTimeout(() => tooltipBtn.classList.remove('touch'), 2000);
    });
}

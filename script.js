const URL_PLANILHA = "https://script.google.com/macros/s/AKfycbxoKF1xIXO_OMy0EtxnqtIwyiKquld5VAh3vu2kYhnAcOikUjVG8f3NcEiEz1iX63o/exec";
const URL_LOG = "https://script.google.com/macros/s/SEU_NOVO_ENDPOINT_DE_LOG/exec"; // Você criará este endpoint

let USUARIOS = {};
let currentUser = null;

// Datas de bloqueio para os botões de 5S
const disableDates = {
    'btn-osasco': new Date('2026-02-19'),
    'btn-santana': new Date('2026-02-03')
};

// --- CARREGAMENTO DOS DADOS ---
function processarDadosPlanilha(dados) {
    USUARIOS = dados;
    console.log("Lista de usuários carregada.");
    hideLoading();
}

function carregarUsuarios() {
    showLoading();
    const script = document.createElement('script');
    script.src = `${URL_PLANILHA}?callback=processarDadosPlanilha`;
    document.body.appendChild(script);
}

// --- LOGGING ---
async function registrarLog(acao, detalhes = {}) {
    if (!currentUser) return;
    
    const logData = {
        usuario: currentUser.nome,
        perfil: currentUser.perfil,
        acao: acao,
        detalhes: JSON.stringify(detalhes),
        data: new Date().toISOString(),
        userAgent: navigator.userAgent
    };
    
    // Tenta obter IP via fetch (opcional)
    try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        logData.ip = ipData.ip;
    } catch (e) {
        logData.ip = 'não disponível';
    }
    
    // Envia log para o Google Sheets (usando fetch, não JSONP)
    fetch(URL_LOG, {
        method: 'POST',
        mode: 'no-cors', // Importante para Apps Script
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData)
    }).catch(err => console.log('Log não pôde ser enviado:', err));
}

// --- INTERFACE DE LOGIN ---
function showLoading() {
    document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

function showLoginModal() {
    document.getElementById('main-screen').style.display = 'none';
    document.getElementById('inspector-screen').style.display = 'none';
    openModal('modal-login');
    document.getElementById('login-error').style.display = 'none';
    document.getElementById('password').value = '';
    document.getElementById('password').focus();
}

// --- LÓGICA DE LOGIN ---
function login(e) {
    e.preventDefault();
    const senhaDigitada = document.getElementById('password').value.trim();
    
    // Busca usuário pela senha (considerando que senha é única)
    const usuarioEncontrado = Object.values(USUARIOS).find(u => u.senha === senhaDigitada);
    
    if (usuarioEncontrado) {
        // Login bem-sucedido
        currentUser = {
            nome: usuarioEncontrado.nome,
            perfil: usuarioEncontrado.perfil
        };
        
        // Salva na sessão (apenas indica que está logado, não a senha)
        sessionStorage.setItem('userLoggedIn', 'true');
        sessionStorage.setItem('userName', usuarioEncontrado.nome);
        sessionStorage.setItem('userProfile', usuarioEncontrado.perfil);
        
        closeModal('modal-login');
        
        // Registrar log de login
        registrarLog('LOGIN', { metodo: 'senha' });
        
        // Configura interface baseada no perfil
        configurarInterfacePorPerfil();
        
    } else {
        document.getElementById('login-error').style.display = 'block';
        document.getElementById('password').value = '';
        registrarLog('TENTATIVA_LOGIN_FALHA', { senhaTentada: senhaDigitada });
    }
}

function logout() {
    if (currentUser) {
        registrarLog('LOGOUT', {});
    }
    
    currentUser = null;
    sessionStorage.removeItem('userLoggedIn');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('userProfile');
    
    showLoginModal();
}

function configurarInterfacePorPerfil() {
    const perfil = sessionStorage.getItem('userProfile');
    const userName = sessionStorage.getItem('userName');
    
    // Esconde todas as telas primeiro
    document.getElementById('main-screen').style.display = 'none';
    document.getElementById('inspector-screen').style.display = 'none';
    
    // Configura baseado no perfil
    switch(perfil) {
        case 'inspetor':
            document.getElementById('inspector-screen').style.display = 'flex';
            document.getElementById('welcome-msg').innerText = `Bem-vindo, Inspetor ${userName}!`;
            break;
            
        case 'fiscal':
            document.getElementById('main-screen').style.display = 'flex';
            // Fiscal não vê o botão de acesso a inspetores
            document.getElementById('btn-segunda-tela').style.display = 'none';
            break;
            
        case 'admin':
            document.getElementById('main-screen').style.display = 'flex';
            // Admin vê todos os botões, incluindo um para ver logs
            adicionarBotaoLogs();
            break;
            
        default:
            showLoginModal();
    }
}

function adicionarBotaoLogs() {
    // Verifica se botão já existe
    if (document.getElementById('btn-logs')) return;
    
    const container = document.querySelector('#main-screen');
    const botaoLogs = document.createElement('a');
    botaoLogs.id = 'btn-logs';
    botaoLogs.className = 'button';
    botaoLogs.href = '#'; // Link para uma página de logs ou modal
    botaoLogs.innerHTML = '<i class="fas fa-history"></i> LOGS DE ACESSO';
    botaoLogs.addEventListener('click', (e) => {
        e.preventDefault();
        abrirModalLogs();
        registrarLog('VISUALIZOU_LOGS', {});
    });
    container.appendChild(botaoLogs);
}

function abrirModalLogs() {
    // Aqui você pode buscar os logs do Google Sheets e exibir
    // Por enquanto, apenas um modal simples
    const logsExemplo = [
        {usuario: 'João', acao: 'LOGIN', data: new Date().toLocaleString()},
        {usuario: 'Maria', acao: 'ACESSOU_RELATORIO', data: new Date().toLocaleString()}
    ];
    
    alert('Funcionalidade de visualização de logs será implementada. Por enquanto, verifique sua planilha.');
    console.log('Logs:', logsExemplo);
}

// --- VERIFICAÇÃO DE SESSÃO ---
function checkSession() {
    const logado = sessionStorage.getItem('userLoggedIn');
    const perfil = sessionStorage.getItem('userProfile');
    const nome = sessionStorage.getItem('userName');
    
    if (logado === 'true' && perfil && nome) {
        currentUser = {
            nome: nome,
            perfil: perfil
        };
        configurarInterfacePorPerfil();
    } else {
        showLoginModal();
    }
}

// --- INTERFACE ---
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
    registrarLog('ABRIU_MODAL', { modal: modalId });
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
        }
    }
}

// --- INICIALIZAÇÃO ---
window.addEventListener('load', () => {
    carregarUsuarios();
    aplicarBloqueioDeDatas();
    checkSession();
    
    // Registrar acesso à página (após login, será registrado no login)
});

// --- EVENT LISTENERS ---
document.getElementById('login-form').addEventListener('submit', login);

document.getElementById('btn-segunda-tela').addEventListener('click', (e) => {
    e.preventDefault();
    openModal('modal-login');
});

document.getElementById('btn-clandestinos-rto').addEventListener('click', (e) => {
    e.preventDefault();
    openModal('modal-clandestinos-rto');
    registrarLog('ACESSOU_CLANDESTINOS', { tipo: 'rto' });
});

document.getElementById('btn-levantamentos').addEventListener('click', (e) => {
    e.preventDefault();
    openModal('modal-levantamentos');
    registrarLog('ACESSOU_LEVANTAMENTOS', {});
});

document.getElementById('btn-inspecoes-5s').addEventListener('click', (e) => {
    e.preventDefault();
    openModal('modal-inspecoes-5s');
    registrarLog('ACESSOU_INSPECOES_5S', {});
});

// Log para links externos
document.querySelectorAll('.button[href^="http"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const acao = btn.innerText.trim().substring(0, 50); // Pega parte do texto
        registrarLog('CLICK_LINK_EXTERNO', { link: btn.href, texto: acao });
    });
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) e.target.style.display = 'none';
});

document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    }
});

// Botão de logout na tela de inspetor
function logoutInspector() {
    logout();
}

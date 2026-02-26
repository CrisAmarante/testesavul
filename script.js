// ==========================================================================
// CONFIGURAÇÕES
// ==========================================================================
const URL_PLANILHA = "https://script.google.com/macros/s/AKfycbz1ebxMTHunYR5u1kj5YlYfgh5xnbcpwpNV2qfBwTnGmY2IkY1nQl7sZBeL22SKCTR9/exec"; 
// ← COLE AQUI A NOVA URL DO DEPLOY (a que você acabou de copiar)

let INSPETORES = {};

// Datas de bloqueio
const disableDates = {
    'btn-osasco': new Date('2026-02-19'),
    'btn-santana': new Date('2026-06-03')
};

// ==========================================================================
// LOADING + CACHE OFFLINE
// ==========================================================================
function showLoading(show) {
    document.getElementById('loading-overlay').style.display = show ? 'flex' : 'none';
}

function saveCache(dados) {
    localStorage.setItem('inspetoresCache', JSON.stringify(dados));
}

function loadFromCache() {
    const cached = localStorage.getItem('inspetoresCache');
    if (cached) {
        INSPETORES = JSON.parse(cached);
        console.log("✅ Usando cache offline");
        return true;
    }
    return false;
}

// ==========================================================================
// CARREGAR INSPETORES (FETCH)
// ==========================================================================
async function carregarInspetores() {
    showLoading(true);
    try {
        const response = await fetch(URL_PLANILHA);
        if (!response.ok) throw new Error('Falha na conexão');

        const dados = await response.json();
        if (dados.erro) throw new Error(dados.erro);

        INSPETORES = dados;
        saveCache(dados);
        console.log(`✅ ${Object.keys(dados).length} inspetores carregados!`);
    } catch (err) {
        console.warn("⚠️ Sem internet → usando cache");
        loadFromCache();
    } finally {
        showLoading(false);
    }
}

// ==========================================================================
// LOGIN + LOG
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
    
    const nomeEncontrado = Object.keys(INSPETORES).find(nome => INSPETORES[nome] === senhaDigitada);

    if (nomeEncontrado) {
        localStorage.setItem('inspectorLoggedIn', 'true');
        localStorage.setItem('inspectorName', nomeEncontrado);
        
        registrarLog(nomeEncontrado);   // ← grava na aba Log_Entradas
        
        closeModal('modal-login');
        checkLoginStatus();
    } else {
        document.getElementById('login-error').style.display = 'block';
        document.getElementById('password').value = '';
    }
}

function registrarLog(nome) {
    fetch(URL_PLANILHA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nome })
    }).catch(() => {}); // não trava o login se estiver offline
}

function logoutInspector() {
    localStorage.removeItem('inspectorLoggedIn');
    localStorage.removeItem('inspectorName');
    checkLoginStatus();
}

// ==========================================================================
// MODAIS E BLOQUEIOS
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
        }
    }
}

// ==========================================================================
// INICIALIZAÇÃO
// ==========================================================================
window.addEventListener('load', async () => {
    await carregarInspetores();
    checkLoginStatus();
    aplicarBloqueioDeDatas();
});

// Eventos
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

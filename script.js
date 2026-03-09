const URL_LOGIN = "https://script.google.com/macros/s/AKfycbz1furBNDhQrJeRSOLX8o9MUuUbSEETTkoaViCCCw-0DShhZX0oTRvfhI267kygajaq/exec"; 

// Datas de bloqueio para os botões de 5S
const disableDates = {
    'btn-osasco': new Date('2026-02-19'),
    'btn-santana': new Date('2026-02-03')
};

// --- LÓGICA DE LOGIN ---
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

    // Envia POST para o Apps Script
    fetch(URL_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: senhaDigitada })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem('inspectorLoggedIn', 'true');
            localStorage.setItem('inspectorName', data.name);
            closeModal('modal-login');
            checkLoginStatus();
        } else {
            document.getElementById('login-error').innerText = data.error || 'Senha não reconhecida!';
            document.getElementById('login-error').style.display = 'block';
            document.getElementById('password').value = '';
        }
    })
    .catch(err => {
        console.error('Erro no login:', err);
        document.getElementById('login-error').innerText = 'Erro de conexão. Tente novamente.';
        document.getElementById('login-error').style.display = 'block';
    });
}

function logoutInspector() {
    localStorage.removeItem('inspectorLoggedIn');
    localStorage.removeItem('inspectorName');
    checkLoginStatus();
}

// --- INTERFACE ---
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

// --- INICIALIZAÇÃO ---
window.addEventListener('load', () => {
    checkLoginStatus();
    aplicarBloqueioDeDatas();
});

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
document.getElementById('btn-levantamentos').addEventListener('click', (e) => {
    e.preventDefault();
    openModal('modal-levantamentos');
});

document.getElementById('btn-inspecoes-5s').addEventListener('click', (e) => {
    e.preventDefault();
    openModal('modal-inspecoes-5s');
});

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) e.target.style.display = 'none';
});

document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    }
});

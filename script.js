const URL_PLANILHA = "https://script.google.com/macros/s/AKfycbzDzqC5d30qOfp-2_8jYwnklvspOStsm1lHCOwBOqzxSIfCEuhwbx2MCBrCcuCNMezK/exec";

let INSPETORES = {};

// === FUNÇÃO NOVA: REGISTRA O LOG NO GOOGLE SHEETS ===
async function registrarLog(nomeApelido) {
  try {
    const formData = new URLSearchParams();
    formData.append("nome", nomeApelido);
    formData.append("acao", "Login bem-sucedido");

    await fetch(URL_PLANILHA, {
      method: "POST",
      body: formData
    });
    // Não precisa esperar resposta (fire-and-forget)
  } catch (err) {
    console.warn("Log não registrado (sem internet ou erro):", err);
  }
}

// --- CARREGAMENTO DOS DADOS ---
function processarDadosPlanilha(dados) {
  INSPETORES = dados;
  console.log("Login restaurado: Lista carregada.");
}

function carregarInspetores() {
  const script = document.createElement('script');
  script.src = `${URL_PLANILHA}?callback=processarDadosPlanilha`;
  document.body.appendChild(script);
}

// --- LÓGICA DE LOGIN (ALTERADA) ---
function checkLoginStatus() { ... } // (mantido igual)

function login(e) {
  e.preventDefault();
  const senhaDigitada = document.getElementById('password').value.trim();
  const nomeEncontrado = Object.keys(INSPETORES).find(nome => INSPETORES[nome] === senhaDigitada);

  if (nomeEncontrado) {
    localStorage.setItem('inspectorLoggedIn', 'true');
    localStorage.setItem('inspectorName', nomeEncontrado);
    
    // === NOVA LINHA: REGISTRA O LOG ===
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
    carregarInspetores();
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


// O resto do arquivo (modais, bloqueio de datas, etc.) fica IGUAL
// ... (cole o resto do seu script.js aqui, a partir da linha 60 em diante)

// ==========================================================================
// CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
// ==========================================================================
const URL_PLANILHA = "https://script.google.com/macros/s/AKfycbxXsk9vOaTKezL06fG0P-fftA5QF-TAL6AzUxbz4FisCn7_j2HdTwQi-Tu76dtTp9uo/exec"; 
let INSPETORES = {};

// Datas de bloqueio para os botões de 5S (mantido igual)
const disableDates = {
    'btn-osasco': new Date('2026-02-19'),
    'btn-santana': new Date('2026-02-03')
};
// ==========================================================================
// DEBUG: Mostrar o que está chegando da planilha
// ==========================================================================
const originalProcessarDados = processarDadosPlanilha;
processarDadosPlanilha = function(dados) {
    console.log("🔥 Dados CRUOS recebidos da planilha:", dados);
    console.log("🔥 Tipo dos dados:", typeof dados);
    console.log("🔥 É um objeto?", dados !== null && typeof dados === 'object');
    console.log("🔥 Chaves recebidas:", Object.keys(dados));
    
    // Mostrar o primeiro inspetor como exemplo
    const primeiraChave = Object.keys(dados)[0];
    if (primeiraChave) {
        console.log(`🔥 Exemplo: ${primeiraChave} -> ${dados[primeiraChave]}`);
        console.log(`🔥 Tamanho do hash: ${dados[primeiraChave].length} caracteres`);
    }
    
    // Chamar a função original
    originalProcessarDados(dados);
};
// ==========================================================================
// FUNÇÃO HASH SHA-256 (nova segurança)
// ==========================================================================
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// ==========================================================================
// 1. CARREGAR INSPETORES (agora com hashes)
// ==========================================================================
function processarDadosPlanilha(dados) {
  if (dados && !dados.erro) {
    
    console.log("✅ Lista de inspetores com hashes carregada com segurança.");
  } else {
    console.error("Erro ao carregar inspetores:", dados);
  }
}

function carregarInspetores() {
  const script = document.createElement("script");
  script.src = `${URL_PLANILHA}?callback=processarDadosPlanilha`;
  document.body.appendChild(script);
}

// ==========================================================================
// 2. LOGIN SEGURO + LOG AUTOMÁTICO
// ==========================================================================
// ==========================================================================
// FUNÇÃO DE LOGIN COM DEBUG DETALHADO
// ==========================================================================
async function login(e) {
  e.preventDefault();
  const senhaDigitada = document.getElementById("password").value.trim();

  if (senhaDigitada.length !== 4 || !/^\d{4}$/.test(senhaDigitada)) {
    mostrarErro("Digite exatamente 4 números!");
    return;
  }

  console.log("🔍 Tentando login com senha:", senhaDigitada);
  
  const hashDigitado = await sha256(senhaDigitada);
  console.log("🔐 Hash gerado:", hashDigitado);
  console.log("🔐 Tamanho do hash gerado:", hashDigitado.length);
  
  console.log("📋 INSPETORES carregados:", INSPETORES);
  console.log("📋 Total de inspetores:", Object.keys(INSPETORES).length);
  
  if (Object.keys(INSPETORES).length === 0) {
    console.error("❌ ERRO CRÍTICO: INSPETORES está vazio!");
    mostrarErro("Erro no sistema. Contate o suporte.");
    return;
  }
  
  // Listar todos os hashes para comparação
  console.log("📋 Hashes disponíveis na planilha:");
  for (let [nome, hash] of Object.entries(INSPETORES)) {
    console.log(`   ${nome}: ${hash} (${hash.length} caracteres)`);
  }
  
  // Procurar match
  let encontrado = false;
  let nomeEncontrado = null;
  
  for (let [nome, hash] of Object.entries(INSPETORES)) {
    console.log(`🔍 Comparando: ${hash} com ${hashDigitado}`);
    console.log(`   São iguais? ${hash === hashDigitado}`);
    
    if (hash === hashDigitado) {
      console.log(`✅ MATCH ENCONTRADO: ${nome}`);
      encontrado = true;
      nomeEncontrado = nome;
      break;
    }
  }
  
  if (encontrado && nomeEncontrado) {
    console.log("🎉 Login autorizado para:", nomeEncontrado);
    
    try {
      await fetch(`${URL_PLANILHA}?action=log&nome=${encodeURIComponent(nomeEncontrado)}`);
      console.log("📝 Log registrado com sucesso");
    } catch (err) {
      console.warn("Log não pôde ser gravado, mas login foi efetuado.");
    }

    localStorage.setItem("inspectorLoggedIn", "true");
    localStorage.setItem("inspectorName", nomeEncontrado);
    closeModal("modal-login");
    checkLoginStatus();
  } else {
    console.log("❌ Nenhum match encontrado");
    console.log("🔎 Possíveis causas:");
    console.log("   1. A senha na planilha não é um hash SHA-256 válido");
    console.log("   2. A coluna de hash na planilha está vazia ou incorreta");
    console.log("   3. O formato do hash (maiúsculas/minúsculas) não corresponde");
    mostrarErro("Senha não reconhecida!");
    document.getElementById("password").value = "";
  }
}
// ==========================================================================
// Funções existentes (checkLoginStatus, logout, modais, etc.) — mantidas iguais
// ==========================================================================
function checkLoginStatus() {
  const logado = localStorage.getItem("inspectorLoggedIn");
  const nomeInspetor = localStorage.getItem("inspectorName");

  if (logado === "true") {
    document.getElementById("main-screen").style.display = "none";
    document.getElementById("inspector-screen").style.display = "flex";
    const welcomeMsg = document.getElementById("welcome-msg");
    if (welcomeMsg) welcomeMsg.innerText = `Bem-vindo, Inspetor ${nomeInspetor}!`;
  } else {
    document.getElementById("main-screen").style.display = "flex";
    document.getElementById("inspector-screen").style.display = "none";
  }
}

function logoutInspector() {
  localStorage.removeItem("inspectorLoggedIn");
  localStorage.removeItem("inspectorName");
  checkLoginStatus();
}

function openModal(modalId) {
  document.getElementById(modalId).style.display = "flex";
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = "none";
}

function aplicarBloqueioDeDatas() {
  const now = new Date();
  for (const [id, date] of Object.entries(disableDates)) {
    const btn = document.getElementById(id);
    if (btn && now < date) {
      btn.classList.add("disabled");
      btn.setAttribute("href", "#");
    }
  }
}

// ==========================================================================
// INICIALIZAÇÃO
// ==========================================================================
window.addEventListener("load", () => {
  carregarInspetores();
  checkLoginStatus();
  aplicarBloqueioDeDatas();
});

document.getElementById("btn-segunda-tela").addEventListener("click", (e) => {
  e.preventDefault();
  openModal("modal-login");
  document.getElementById("login-error").style.display = "none";
  document.getElementById("password").value = "";
  document.getElementById("password").focus();
});

document.getElementById("login-form").addEventListener("submit", login);

document.getElementById("btn-clandestinos-rto").addEventListener("click", (e) => {
  e.preventDefault();
  openModal("modal-clandestinos-rto");
});

document.getElementById("btn-inspecoes-5s").addEventListener("click", (e) => {
  e.preventDefault();
  openModal("modal-inspecoes-5s");
});

window.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) e.target.style.display = "none";
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal").forEach(m => m.style.display = "none");
  }
});

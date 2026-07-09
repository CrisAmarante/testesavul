/**
 * Módulo Firebase - Backend Moderno
 * Gerencia conexão, autenticação e operações com Firestore
 */

// ============================================================================
// VARIÁVEIS GLOBAIS DO FIREBASE
// ============================================================================
let db = null;
let auth = null;
let firestoreInitialized = false;
let authInitialized = false;

// ============================================================================
// INICIALIZAR FIREBASE
// ============================================================================
async function initFirebase() {
  try {
    // Importar Firebase via CDN (ES Modules)
    const [
      { initializeApp },
      { getFirestore, enableIndexedDbPersistence },
      { getAuth, setPersistence, browserLocalPersistence }
    ] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js'),
      import('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js')
    ]);

    // Inicializar Firebase App
    const app = initializeApp(FIREBASE_CONFIG);
    
    // Inicializar Firestore
    db = getFirestore(app);
    
    // Tentar habilitar persistência offline (pode falhar em alguns navegadores)
    try {
      await enableIndexedDbPersistence(db);
      console.log('✅ Persistência offline do Firestore habilitada');
    } catch (err) {
      console.warn('⚠️ Persistência offline não disponível:', err.code);
    }
    
    // Inicializar Authentication
    auth = getAuth(app);
    
    // Configurar persistência de sessão
    await setPersistence(auth, browserLocalPersistence);
    
    firestoreInitialized = true;
    authInitialized = true;
    
    console.log('✅ Firebase inicializado com sucesso!');
    return true;
    
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error);
    return false;
  }
}

// ============================================================================
// AUTENTICAÇÃO COM FIREBASE
// ============================================================================

/**
 * Login com email e senha
 */
async function firebaseLogin(email, password) {
  if (!authInitialized) {
    throw new Error('Firebase Auth não inicializado');
  }
  
  try {
    const { signInWithEmailAndPassword } = await import(
      'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js'
    );
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Buscar dados adicionais do usuário no Firestore
    const userData = await getUsuarioPorEmail(user.email);
    
    return {
      sucesso: true,
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      ...userData
    };
  } catch (error) {
    console.error('Erro no login Firebase:', error);
    return {
      sucesso: false,
      erro: traduzirErroFirebase(error.code)
    };
  }
}

/**
 * Logout
 */
async function firebaseLogout() {
  if (!authInitialized) return;
  
  try {
    const { signOut } = await import(
      'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js'
    );
    await signOut(auth);
    console.log('✅ Logout realizado com sucesso');
  } catch (error) {
    console.error('Erro no logout:', error);
  }
}

/**
 * Verificar status de autenticação
 */
function checkFirebaseAuthStatus() {
  if (!authInitialized) return null;
  
  const user = auth.currentUser;
  if (user) {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      isVerified: user.emailVerified
    };
  }
  return null;
}

/**
 * Traduzir códigos de erro do Firebase para português
 */
function traduzirErroFirebase(codigo) {
  const erros = {
    'auth/invalid-email': 'Email inválido',
    'auth/user-disabled': 'Usuário desativado',
    'auth/user-not-found': 'Usuário não encontrado',
    'auth/wrong-password': 'Senha incorreta',
    'auth/email-already-in-use': 'Email já cadastrado',
    'auth/weak-password': 'Senha muito fraca',
    'auth/operation-not-allowed': 'Operação não permitida',
    'auth/network-request-failed': 'Erro de conexão. Verifique sua internet'
  };
  return erros[codigo] || 'Erro de autenticação';
}

// ============================================================================
// OPERAÇÕES COM FIRESTORE
// ============================================================================

/**
 * Obter documento por ID
 */
async function getDocument(collection, docId) {
  if (!firestoreInitialized) throw new Error('Firestore não inicializado');
  
  const { doc, getDoc } = await import(
    'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js'
  );
  
  const docRef = doc(db, collection, docId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    return null;
  }
}

/**
 * Obter múltiplos documentos com filtro opcional
 */
async function getCollection(collection, filters = []) {
  if (!firestoreInitialized) throw new Error('Firestore não inicializado');
  
  const { collection as firestoreCollection, getDocs, query, where } = await import(
    'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js'
  );
  
  let q = query(firestoreCollection(db, collection));
  
  // Aplicar filtros se existirem
  if (filters.length > 0) {
    const conditions = filters.map(f => where(f.field, f.operator, f.value));
    q = query(firestoreCollection(db, collection), ...conditions);
  }
  
  const querySnapshot = await getDocs(q);
  const results = [];
  
  querySnapshot.forEach((doc) => {
    results.push({ id: doc.id, ...doc.data() });
  });
  
  return results;
}

/**
 * Adicionar documento
 */
async function addDocument(collection, data) {
  if (!firestoreInitialized) throw new Error('Firestore não inicializado');
  
  const { collection as firestoreCollection, addDoc, serverTimestamp } = await import(
    'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js'
  );
  
  // Adicionar timestamps automáticos
  const dataComTimestamp = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  const docRef = await addDoc(firestoreCollection(db, collection), dataComTimestamp);
  return docRef.id;
}

/**
 * Atualizar documento
 */
async function updateDocument(collection, docId, data) {
  if (!firestoreInitialized) throw new Error('Firestore não inicializado');
  
  const { doc, updateDoc, serverTimestamp } = await import(
    'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js'
  );
  
  const docRef = doc(db, collection, docId);
  
  // Adicionar timestamp de atualização
  const dataComTimestamp = {
    ...data,
    updatedAt: serverTimestamp()
  };
  
  await updateDoc(docRef, dataComTimestamp);
}

/**
 * Deletar documento
 */
async function deleteDocument(collection, docId) {
  if (!firestoreInitialized) throw new Error('Firestore não inicializado');
  
  const { doc, deleteDoc } = await import(
    'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js'
  );
  
  const docRef = doc(db, collection, docId);
  await deleteDoc(docRef);
}

// ============================================================================
// FUNÇÕES ESPECÍFICAS DA APLICAÇÃO
// ============================================================================

/**
 * Buscar usuário por email
 */
async function getUsuarioPorEmail(email) {
  try {
    const usuarios = await getCollection(FIRESTORE_COLLECTIONS.USUARIOS, [
      { field: 'email', operator: '==', value: email }
    ]);
    
    if (usuarios.length > 0) {
      return usuarios[0];
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return null;
  }
}

/**
 * Buscar usuário por apelido
 */
async function getUsuarioPorApelido(apelido) {
  try {
    const usuarios = await getCollection(FIRESTORE_COLLECTIONS.USUARIOS, [
      { field: 'apelido', operator: '==', value: apelido }
    ]);
    
    if (usuarios.length > 0) {
      return usuarios[0];
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar usuário por apelido:', error);
    return null;
  }
}

/**
 * Salvar log de atividade
 */
async function registrarLogFirebase(nomeApelido, acao, detalhes = {}) {
  try {
    await addDocument(FIRESTORE_COLLECTIONS.LOGS, {
      nome: nomeApelido,
      acao: acao,
      detalhes: detalhes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.warn('Falha ao registrar log:', error);
  }
}

/**
 * Carregar inspetores do Firestore
 */
async function carregarInspetoresFirebase() {
  try {
    const inspetores = await getCollection(FIRESTORE_COLLECTIONS.INSPETORES, [
      { field: 'ativo', operator: '==', value: true }
    ]);
    
    const objetoInspetores = {};
    inspetores.forEach(inspetor => {
      if (inspetor.apelido && inspetor.hash) {
        objetoInspetores[inspetor.apelido] = {
          hash: inspetor.hash,
          nome: inspetor.nome,
          funcao: inspetor.funcao,
          ativo: inspetor.ativo
        };
      }
    });
    
    return objetoInspetores;
  } catch (error) {
    console.error('Erro ao carregar inspetores:', error);
    return {};
  }
}

/**
 * Carregar terminais do Firestore
 */
async function carregarTerminaisFirebase(apenasSim = true) {
  try {
    const filtros = apenasSim ? [{ field: 'ativo', operator: '==', value: true }] : [];
    const terminais = await getCollection(FIRESTORE_COLLECTIONS.TERMINAIS, filtros);
    
    return terminais.map(t => t.nome).sort();
  } catch (error) {
    console.error('Erro ao carregar terminais:', error);
    return ['Terminal A', 'Terminal B', 'Terminal C', 'Terminal D'];
  }
}

/**
 * Salvar inspeção no Firestore
 */
async function salvarInspecaoFirebase(dados) {
  try {
    await addDocument(FIRESTORE_COLLECTIONS.INSPECOES, {
      ...dados,
      tipo: 'inspecao_veicular'
    });
    return { sucesso: true };
  } catch (error) {
    console.error('Erro ao salvar inspeção:', error);
    return { sucesso: false, erro: error.message };
  }
}

/**
 * Salvar envio no Firestore
 */
async function salvarEnvioFirebase(dados) {
  try {
    await addDocument(FIRESTORE_COLLECTIONS.ENVIOS, {
      ...dados,
      tipo: 'envio_informacoes'
    });
    return { sucesso: true };
  } catch (error) {
    console.error('Erro ao salvar envio:', error);
    return { sucesso: false, erro: error.message };
  }
}

/**
 * Consultar inspeções com filtros
 */
async function consultarInspecoesFirebase(filtros) {
  try {
    const filtrosQuery = [];
    
    if (filtros.dataInicio) {
      filtrosQuery.push({ field: 'data', operator: '>=', value: filtros.dataInicio });
    }
    if (filtros.dataFim) {
      filtrosQuery.push({ field: 'data', operator: '<=', value: filtros.dataFim });
    }
    if (filtros.carro) {
      filtrosQuery.push({ field: 'carro', operator: '==', value: filtros.carro });
    }
    if (filtros.fiscal) {
      filtrosQuery.push({ field: 'fiscal', operator: '==', value: filtros.fiscal });
    }
    
    const inspecoes = await getCollection(FIRESTORE_COLLECTIONS.INSPECOES, filtrosQuery);
    return inspecoes.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.seconds - a.createdAt.seconds;
      }
      return 0;
    });
  } catch (error) {
    console.error('Erro ao consultar inspeções:', error);
    return [];
  }
}

/**
 * Consultar envios com filtros
 */
async function consultarEnviosFirebase(filtros) {
  try {
    const filtrosQuery = [];
    
    if (filtros.dataInicio) {
      filtrosQuery.push({ field: 'data', operator: '>=', value: filtros.dataInicio });
    }
    if (filtros.dataFim) {
      filtrosQuery.push({ field: 'data', operator: '<=', value: filtros.dataFim });
    }
    if (filtros.motivo) {
      filtrosQuery.push({ field: 'motivo', operator: '==', value: filtros.motivo });
    }
    if (filtros.carro) {
      filtrosQuery.push({ field: 'carro', operator: '==', value: filtros.carro });
    }
    if (filtros.fiscal) {
      filtrosQuery.push({ field: 'fiscal', operator: '==', value: filtros.fiscal });
    }
    
    const envios = await getCollection(FIRESTORE_COLLECTIONS.ENVIOS, filtrosQuery);
    return envios.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.seconds - a.createdAt.seconds;
      }
      return 0;
    });
  } catch (error) {
    console.error('Erro ao consultar envios:', error);
    return [];
  }
}

// Exportar para escopo global
window.initFirebase = initFirebase;
window.firebaseLogin = firebaseLogin;
window.firebaseLogout = firebaseLogout;
window.checkFirebaseAuthStatus = checkFirebaseAuthStatus;
window.getDocument = getDocument;
window.getCollection = getCollection;
window.addDocument = addDocument;
window.updateDocument = updateDocument;
window.deleteDocument = deleteDocument;
window.getUsuarioPorEmail = getUsuarioPorEmail;
window.getUsuarioPorApelido = getUsuarioPorApelido;
window.registrarLogFirebase = registrarLogFirebase;
window.carregarInspetoresFirebase = carregarInspetoresFirebase;
window.carregarTerminaisFirebase = carregarTerminaisFirebase;
window.salvarInspecaoFirebase = salvarInspecaoFirebase;
window.salvarEnvioFirebase = salvarEnvioFirebase;
window.consultarInspecoesFirebase = consultarInspecoesFirebase;
window.consultarEnviosFirebase = consultarEnviosFirebase;
window.db = db;
window.auth = auth;

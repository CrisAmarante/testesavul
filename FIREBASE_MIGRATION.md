# 🚀 Migração para Firebase - Guia de Implementação

## Visão Geral

Este documento descreve a migração do backend de Google Apps Script para **Firebase (Firestore + Authentication)**, proporcionando:

- ✅ **Melhor performance** com cache offline automático
- ✅ **Escalabilidade** para milhares de usuários simultâneos
- ✅ **Tempo real** com listeners do Firestore
- ✅ **Segurança** com regras de segurança do Firebase
- ✅ **Redução de custos** comparado a soluções enterprise

---

## 📁 Estrutura de Dados no Firestore

### Coleções Principais

#### 1. `usuarios` - Usuários do Sistema
```javascript
{
  apelido: "cristiano",        // ID único (apelido)
  nome: "Cristiano Santos",
  email: "cristiano@email.com",
  matricula: "12345",
  funcao: "ADMIN",             // ADMIN, FISCAL, INSPETOR, SAF, etc.
  ativo: true,
  hash: "hash_senha",          // Hash da senha (se usar auth customizado)
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 2. `inspetores` - Inspetores Ativos
```javascript
{
  apelido: "joao.silva",
  nome: "João Silva",
  hash: "hash_senha",
  funcao: "FISCAL",
  ativo: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 3. `terminais` - Terminais/Locais
```javascript
{
  nome: "Terminal A",
  ativo: true,
  ordem: 1,
  createdAt: Timestamp
}
```

#### 4. `inspecoes` - Inspeções Veiculares
```javascript
{
  tipo: "inspecao_veicular",
  carro: "12345",
  terminal: "Terminal A",
  fiscal: "joao.silva",
  data: "20/01/2026",
  hora: "14:30",
  itens: {
    elevador: { status: "OK", obs: "" },
    thoreb: { status: "DEFEITO", obs: "Barulho estranho" },
    limpeza: { status: "OK", obs: "" },
    ventilador: { status: "DEFEITO", obs: "", posicao: "F,M" }
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 5. `envios` - Envios de Informações
```javascript
{
  tipo: "envio_informacoes",
  areaDestino: "FISCALIZAÇÃO",
  motivo: "AVARIAS",
  carro: "12345",
  linha: "8000",
  motorista: "José",
  cobrador: "Maria",
  hora: "14:30",
  sentido: "IDA",
  historico: "Descrição do ocorrido...",
  local: "Terminal A",
  data: "20/01/2026",
  fiscal: "joao.silva",
  anexos: [
    { base64: "...", mimeType: "image/jpeg", nome: "foto.jpg" }
  ],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 6. `logs` - Logs de Atividade
```javascript
{
  nome: "joao.silva",
  acao: "Login bem-sucedido",
  detalhes: { ip: "...", userAgent: "..." },
  timestamp: "2026-01-20T14:30:00Z"
}
```

#### 7. `config` - Configurações do Sistema
```javascript
{
  chave: "timeout_inatividade",
  valor: 1200000,  // 20 minutos em ms
  descricao: "Tempo de inatividade para logout automático"
}
```

#### 8. `modais` - Configuração de Modais Dinâmicos
```javascript
{
  tipo: "clandestinos_rto",
  titulo: "Clandestinos RTO",
  botoes: [
    { label: "Modelo 1", url: "https://..." },
    { label: "Modelo 2", url: "https://..." }
  ],
  ativo: true
}
```

---

## 🔧 Configuração Inicial

### Passo 1: Criar Projeto Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em **"Adicionar projeto"**
3. Siga o assistente de criação
4. Anote as credenciais do projeto

### Passo 2: Atualizar Configuração

Edite o arquivo `src/config/config.js`:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "SUA_API_KEY_REAL_AQUI",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};
```

### Passo 3: Habilitar Autenticação

No Firebase Console:
1. Vá em **Authentication** → **Sign-in method**
2. Ative **Email/Password**
3. (Opcional) Ative outros provedores se necessário

### Passo 4: Criar Regras de Segurança

No Firebase Console, vá em **Firestore Database** → **Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Função auxiliar para verificar se está autenticado
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Função para verificar se é admin
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.funcao == 'ADMIN';
    }
    
    // Usuários - Apenas admins podem ler/criar/atualizar
    match /usuarios/{userId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin();
    }
    
    // Inspetores - Leitura pública, escrita apenas admin
    match /inspetores/{inspetorId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Terminais - Leitura pública, escrita apenas admin
    match /terminais/{terminalId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    
    // Inspeções - Fiscais podem criar, todos podem ler (do próprio)
    match /inspecoes/{inspecaoId} {
      allow read: if isAuthenticated() && 
                     (resource.data.fiscal == request.auth.token.apelido || 
                      isAdmin());
      allow create: if isAuthenticated() && 
                       request.resource.data.fiscal == request.auth.token.apelido;
      allow update, delete: if isAdmin();
    }
    
    // Envios - Similar às inspeções
    match /envios/{envioId} {
      allow read: if isAuthenticated() && 
                     (resource.data.fiscal == request.auth.token.apelido || 
                      isAdmin());
      allow create: if isAuthenticated();
      allow update, delete: if isAdmin();
    }
    
    // Logs - Apenas leitura para admin
    match /logs/{logId} {
      allow read: if isAdmin();
      allow write: if false;  // Apenas backend escreve
    }
    
    // Config - Apenas admin
    match /config/{configId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }
    
    // Modais - Apenas admin
    match /modais/{modalId} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
}
```

---

## 📊 Migração de Dados

### Script de Migração (Node.js)

```javascript
// migrate.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrarInspetores() {
  // Dados vindos da planilha Google Sheets
  const inspetoresPlanilha = [
    { apelido: "joao", nome: "João Silva", hash: "...", funcao: "FISCAL", ativo: "SIM" },
    // ... mais dados
  ];
  
  const batch = db.batch();
  
  inspetoresPlanilha.forEach(dado => {
    const ref = db.collection('inspetores').doc(dado.apelido);
    batch.set(ref, {
      apelido: dado.apelido,
      nome: dado.nome,
      hash: dado.hash,
      funcao: dado.funcao,
      ativo: dado.ativo === 'SIM',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  
  await batch.commit();
  console.log('✅ Inspetores migrados!');
}

// Executar migração
migrarInspetores().catch(console.error);
```

---

## 🔄 Integração com Código Existente

### Exemplo: Login com Firebase

Atualmente (Google Apps Script):
```javascript
async function login(e) {
  e.preventDefault();
  const senha = getEl('password').value.trim();
  
  const callbackName = 'loginCallback_' + Date.now();
  window[callbackName] = async function(resposta) {
    if (resposta && resposta.sucesso) {
      localStorage.setItem('inspectorLoggedIn', 'true');
      // ...
    }
  };
  
  const script = document.createElement('script');
  script.src = `${URL_PLANILHA}?acao=login&senha=${encodeURIComponent(senha)}&callback=${callbackName}`;
  document.body.appendChild(script);
}
```

Com Firebase:
```javascript
async function login(e) {
  e.preventDefault();
  const email = getEl('email').value.trim();
  const senha = getEl('password').value.trim();
  
  try {
    const resultado = await firebaseLogin(email, senha);
    
    if (resultado.sucesso) {
      localStorage.setItem('inspectorLoggedIn', 'true');
      localStorage.setItem('inspectorName', resultado.displayName);
      localStorage.setItem('inspectorApelido', resultado.apelido);
      localStorage.setItem('inspectorRole', resultado.funcao);
      
      await registrarLogFirebase(resultado.apelido, 'Login bem-sucedido');
      
      window.modals.login.close();
      checkLoginStatus();
    } else {
      alert('⚠️ ' + resultado.erro);
    }
  } catch (error) {
    console.error('Erro no login:', error);
    alert('Erro ao fazer login');
  }
}
```

### Exemplo: Salvar Inspeção

Atualmente:
```javascript
await fetch(URL_PLANILHA, {
  method: 'POST',
  mode: 'no-cors',
  body: new URLSearchParams({
    acao: 'inspecao_veicular',
    dados: JSON.stringify(dadosEnvio),
  }),
});
```

Com Firebase:
```javascript
const resultado = await salvarInspecaoFirebase(dadosEnvio);

if (resultado.sucesso) {
  alert('✅ Inspeção enviada com sucesso!');
  this.resetarFormulario();
} else {
  alert('❌ Erro ao enviar: ' + resultado.erro);
}
```

---

## 🎯 Próximos Passos

### Fase 1: Configuração (Completo ✅)
- [x] Criar estrutura de configuração
- [x] Criar módulo Firebase
- [x] Documentar estrutura de dados

### Fase 2: Implementação
- [ ] Atualizar autenticação para usar Firebase Auth
- [ ] Migrar CRUD de usuários para Firestore
- [ ] Migrar salvamento de inspeções
- [ ] Migrar salvamento de envios
- [ ] Migrar consultas (inspeções/envios)

### Fase 3: Otimização
- [ ] Implementar listeners em tempo real
- [ ] Adicionar cache estratégico
- [ ] Otimizar queries com índices
- [ ] Testes de carga

### Fase 4: Limpeza
- [ ] Remover código legado do Google Apps Script
- [ ] Atualizar documentação
- [ ] Treinar equipe

---

## 📝 Considerações Importantes

1. **Compatibilidade Retroativa**: O código atual continua funcionando com Google Apps Script durante a migração
2. **Fallback Automático**: Se Firebase falhar, o sistema usa o backend legacy
3. **Dados Offline**: Firestore oferece cache automático sem código adicional
4. **Segurança**: Regras de segurança substituem validações no backend
5. **Custos**: Firebase tem plano gratuito generoso (Spark)

---

## 🆘 Suporte

Para dúvidas sobre a implementação:
- [Documentação Oficial do Firebase](https://firebase.google.com/docs)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/manage-data/structure-data)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)

---

**Criado em**: Janeiro 2026  
**Versão**: 1.0  
**Status**: Em implementação

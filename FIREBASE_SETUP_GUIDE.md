# 🚀 Guia Completo: Migração para Firebase

Este guia cobre **todo o processo** desde a criação do projeto no Firebase Console até a migração dos dados e colocação do sistema no ar.

---

## 📋 Índice

1. [Criar Projeto no Firebase Console](#1-criar-projeto-no-firebase-console)
2. [Configurar Firestore Database](#2-configurar-firestore-database)
3. [Configurar Autenticação](#3-configurar-autenticação)
4. [Obter Credenciais do Projeto](#4-obter-credenciais-do-projeto)
5. [Configurar o Sistema Local](#5-configurar-o-sistema-local)
6. [Configurar Regras de Segurança](#6-configurar-regras-de-segurança)
7. [Migrar Dados da Planilha](#7-migrar-dados-da-planilha)
8. [Testar e Colocar no Ar](#8-testar-e-colocar-no-ar)
9. [Solução de Problemas](#9-solução-de-problemas)

---

## 1. Criar Projeto no Firebase Console

### Passo 1.1: Acessar o Firebase Console
1. Abra seu navegador e acesse: https://console.firebase.google.com/
2. Faça login com sua conta Google (a mesma que usava no Apps Script, se possível)

### Passo 1.2: Criar Novo Projeto
1. Clique no botão **"Adicionar projeto"** (ou "+ Create a project")
2. Preencha as informações:
   - **Nome do projeto**: `sistema-inspecoes` (ou outro nome de sua preferência)
   - **ID do projeto**: Será gerado automaticamente (ex: `sistema-inspecoes-12345`)
   - **Conta do Google**: Selecione sua conta
   
3. Clique em **"Continuar"**

### Passo 1.3: Configurar Google Analytics (Opcional)
1. Ative ou desative o Google Analytics conforme sua necessidade
   - Para começar rápido, pode **desativar**
2. Clique em **"Criar projeto"**

### Passo 1.4: Aguardar Criação
1. Aguarde alguns segundos enquanto o Firebase cria seu projeto
2. Quando estiver pronto, clique em **"Continuar"**

### Passo 1.5: Adicionar Apps ao Projeto
Na visão geral do projeto, você verá ícones para adicionar plataformas:

1. **Para Web App** (nosso caso):
   - Clique no ícone **Web** (`</>`)
   - Dê um apelido para o app: `Sistema Inspeções Web`
   - **Marque** a opção "Also set up Firebase Hosting" (opcional, para deploy futuro)
   - Clique em **"Registrar app"**

2. **Para Android/iOS** (futuro, se necessário):
   - Pode registrar depois quando precisar de apps móveis

---

## 2. Configurar Firestore Database

### Passo 2.1: Acessar Firestore
1. No menu lateral esquerdo, clique em **"Build"** → **"Firestore Database"**
2. Clique em **"Criar banco de dados"**

### Passo 2.2: Escolher Modo de Segurança
1. Selecione **"Iniciar no modo de teste"** (vamos configurar regras seguras depois)
2. Clique em **"Avançar"**

### Passo 2.3: Escolher Localização
1. Selecione a região mais próxima dos seus usuários:
   - **América do Sul**: `southamerica-east1` (São Paulo) ⭐ **Recomendado para Brasil**
   - **América do Norte**: `us-central1` (Iowa)
   - **Europa**: `europe-west1` (Bélgica)

2. Clique em **"Ativar"**

### Passo 2.4: Aguardar Criação
- Aguarde alguns minutos enquanto o Firestore é provisionado
- Quando terminar, você verá a interface do Firestore

---

## 3. Configurar Autenticação

### Passo 3.1: Acessar Autenticação
1. No menu lateral, clique em **"Build"** → **"Authentication"**
2. Clique em **"Começar"** (Get started)

### Passo 3.2: Habilitar Provedores de Login
Habilite os provedores que seu sistema usará:

#### Email/Senha:
1. Clique em **"Email/Senha"**
2. Ative a chave **"Email/senha"**
3. (Opcional) Ative "Link de email" se quiser login sem senha
4. Clique em **"Salvar"**

#### Google Sign-In (Opcional mas recomendado):
1. Clique em **"Google"**
2. Ative a chave
3. Digite um email de suporte técnico
4. Clique em **"Salvar"**

#### Outros provedores (conforme necessidade):
- **Telefone**: Para login por SMS
- **Microsoft**, **Facebook**, etc.

---

## 4. Obter Credenciais do Projeto

### Passo 4.1: Acessar Configurações do Projeto
1. Clique no ícone de **engrenagem** ⚙️ ao lado de "Visão geral do projeto"
2. Selecione **"Configurações do projeto"**

### Passo 4.2: Copiar Configuração do Web App
1. Role até a seção **"Seus apps"**
2. Se já registrou o app web, verá as credenciais
3. Se não registrou, clique no ícone **Web** (`</>`) e registre agora

### Passo 4.3: Copiar o Objeto de Configuração
Você verá um código como este:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "sistema-inspecoes-12345.firebaseapp.com",
  projectId: "sistema-inspecoes-12345",
  storageBucket: "sistema-inspecoes-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890",
  measurementId: "G-XXXXXXXXXX"
};
```

**📝 IMPORTANTE**: Copie TODO este objeto, você precisará dele no próximo passo!

### Passo 4.4: (Opcional) Baixar Arquivo de Configuração
- Clique em **"Baixar config"** para baixar um arquivo `google-services.json` ou `GoogleService-Info.plist`
- Útil para backup das credenciais

---

## 5. Configurar o Sistema Local

### Passo 5.1: Atualizar Arquivo de Configuração

Abra o arquivo `src/config/config.js` e substitua as credenciais:

```javascript
// src/config/config.js

export const FIREBASE_CONFIG = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "SEU_PROJECT_ID.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_PROJECT_ID.appspot.com",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};
```

**Substitua pelos valores copiados no Passo 4.3!**

### Passo 5.2: Verificar Instalação das Dependências

No terminal, na pasta do projeto:

```bash
# Verificar se o Firebase SDK está instalado
npm list firebase

# Se não estiver instalado, instale:
npm install firebase
```

### Passo 5.3: Testar Conexão Local

Crie um arquivo de teste temporário `test-firebase.html`:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teste Firebase</title>
</head>
<body>
    <h1>Teste de Conexão Firebase</h1>
    <div id="status">Conectando...</div>
    <div id="result"></div>

    <script type="module">
        import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
        import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
        
        // SUAS CREDENCIAIS AQUI
        const firebaseConfig = {
            apiKey: "SUA_API_KEY",
            authDomain: "SEU_PROJECT.firebaseapp.com",
            projectId: "SEU_PROJECT_ID",
            storageBucket: "SEU_PROJECT.appspot.com",
            messagingSenderId: "SEU_SENDER_ID",
            appId: "SEU_APP_ID"
        };

        try {
            const app = initializeApp(firebaseConfig);
            const db = getFirestore(app);
            
            document.getElementById('status').innerHTML = '✅ Conectado com sucesso!';
            document.getElementById('status').style.color = 'green';
            
            // Testar leitura (pode falhar se não houver dados ainda)
            getDocs(collection(db, 'inspections'))
                .then(snapshot => {
                    document.getElementById('result').innerHTML = 
                        `📊 Coleção 'inspections' tem ${snapshot.size} documentos`;
                })
                .catch(err => {
                    document.getElementById('result').innerHTML = 
                        `ℹ️ Coleção vazia ou sem permissão (isso é normal): ${err.message}`;
                });
                
        } catch (error) {
            document.getElementById('status').innerHTML = '❌ Erro na conexão: ' + error.message;
            document.getElementById('status').style.color = 'red';
            console.error('Erro:', error);
        }
    </script>
</body>
</html>
```

Abra este arquivo no navegador para testar a conexão.

---

## 6. Configurar Regras de Segurança

### Passo 6.1: Acessar Regras do Firestore
1. No Firebase Console, vá em **"Build"** → **"Firestore Database"**
2. Clique na aba **"Regras"** (Rules)

### Passo 6.2: Aplicar Regras de Segurança

Substitua o conteúdo atual por estas regras:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Função auxiliar para verificar se usuário está autenticado
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Função para verificar se usuário é admin
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Função para verificar se usuário é dono do documento
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Coleção: users
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }
    
    // Coleção: inspections
    match /inspections/{inspectionId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && 
                       request.resource.data.inspectorId == request.auth.uid;
      allow update: if isAuthenticated() && 
                       (resource.data.inspectorId == request.auth.uid || isAdmin());
      allow delete: if isAdmin();
    }
    
    // Coleção: submissions
    match /submissions/{submissionId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && 
                       request.resource.data.submittedBy == request.auth.uid;
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    // Coleção: logs
    match /logs/{logId} {
      allow read: if isAdmin();
      allow create: if isAuthenticated();
      allow update, delete: if false; // Logs são imutáveis
    }
    
    // Coleção: checklists
    match /checklists/{checklistId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin();
    }
    
    // Coleção: vehicles
    match /vehicles/{vehicleId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin();
    }
    
    // Coleção: drivers
    match /drivers/{driverId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin();
    }
    
    // Coleção: settings
    match /settings/{settingId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin();
    }
  }
}
```

### Passo 6.3: Publicar Regras
1. Clique em **"Publicar"**
2. Confirme a publicação

### ⚠️ Importante sobre Regras

- **Modo Teste**: Se estiver com problemas, pode usar regras temporárias:
  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if request.time < timestamp.date(2025, 12, 31);
      }
    }
  }
  ```
  Isso permite acesso total até 31/12/2025 para testes.

- **Produção**: SEMPRE use regras restritivas em produção!

---

## 7. Migrar Dados da Planilha

Existem **3 métodos** para migrar dados. Escolha o que melhor se adapta ao seu caso:

### Método 1: Script de Migração Automática (Recomendado)

#### Passo 7.1.1: Exportar Dados da Planilha

1. Abra sua planilha Google Sheets
2. Para cada aba:
   - `File` → `Download` → `Comma-separated values (.csv)`
   - Salve com nomes claros: `users.csv`, `inspections.csv`, etc.

#### Passo 7.1.2: Instalar Ferramentas de Migração

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Fazer login no Firebase
firebase login

# Inicializar projeto (na pasta do seu projeto)
firebase init firestore
```

#### Passo 7.1.3: Criar Script de Migração

Crie um arquivo `migrate-data.js`:

```javascript
// migrate-data.js
const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

// Configurar serviço administrativo
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Mapeamento de coleções
const COLLECTIONS = {
  users: 'users',
  inspections: 'inspections',
  submissions: 'submissions',
  logs: 'logs',
  checklists: 'checklists',
  vehicles: 'vehicles',
  drivers: 'drivers',
  settings: 'settings'
};

async function migrateCollection(csvFile, collectionName) {
  console.log(`\n📊 Migrando ${collectionName}...`);
  
  const results = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFile)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          const batch = db.batch();
          let count = 0;
          
          results.forEach((row, index) => {
            // Converter dados
            const docData = convertRowToDoc(row, collectionName);
            
            // Criar referência do documento
            const docRef = db.collection(collectionName).doc();
            
            // Adicionar ID original se existir
            if (row.id || row.ID) {
              docData.legacyId = row.id || row.ID;
            }
            
            // Adicionar metadados de migração
            docData.migratedAt = admin.firestore.FieldValue.serverTimestamp();
            docData.migratedFrom = 'google-sheets';
            
            batch.set(docRef, docData);
            count++;
            
            // Firestore limita batches a 500 operações
            if (count % 500 === 0) {
              console.log(`  ✅ ${count} documentos processados...`);
            }
          });
          
          await batch.commit();
          console.log(`  ✅ ${collectionName}: ${results.length} documentos migrados!`);
          resolve(results.length);
        } catch (error) {
          console.error(`  ❌ Erro ao migrar ${collectionName}:`, error);
          reject(error);
        }
      });
  });
}

function convertRowToDoc(row, collection) {
  const doc = {};
  
  Object.keys(row).forEach(key => {
    const value = row[key];
    
    // Ignorar campos vazios
    if (value === '' || value === null || value === undefined) {
      return;
    }
    
    // Converter tipos
    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('data')) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        doc[key] = admin.firestore.Timestamp.fromDate(date);
      } else {
        doc[key] = value;
      }
    } else if (key.toLowerCase().includes('time') || key.toLowerCase().includes('hora')) {
      doc[key] = value;
    } else if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('valor') || key.toLowerCase().includes('price')) {
      const num = parseFloat(value.replace(/[R$,]/g, '').trim());
      doc[key] = isNaN(num) ? value : num;
    } else if (key.toLowerCase().includes('qty') || key.toLowerCase().includes('quantidade') || key.toLowerCase().includes('count')) {
      const num = parseInt(value);
      doc[key] = isNaN(num) ? value : num;
    } else if (value === 'true' || value === 'false') {
      doc[key] = value === 'true';
    } else if (key.toLowerCase().includes('id') && !isNaN(value)) {
      doc[key] = value;
    } else {
      doc[key] = value.trim();
    }
  });
  
  return doc;
}

async function main() {
  console.log('🚀 Iniciando migração para Firebase Firestore...\n');
  
  const csvDir = './csv-data'; // Pasta com os arquivos CSV
  
  for (const [sheetName, collectionName] of Object.entries(COLLECTIONS)) {
    const csvFile = path.join(csvDir, `${sheetName}.csv`);
    
    if (fs.existsSync(csvFile)) {
      await migrateCollection(csvFile, collectionName);
    } else {
      console.log(`⚠️  Arquivo ${csvFile} não encontrado, pulando...`);
    }
  }
  
  console.log('\n✅ Migração concluída!');
}

main().catch(console.error);
```

#### Passo 7.1.4: Gerar Chave de Serviço

1. No Firebase Console, vá em **Project Settings** ⚙️
2. Clique na aba **"Service accounts"**
3. Clique em **"Generate new private key"**
4. Salve o arquivo JSON como `serviceAccountKey.json` na raiz do projeto
5. **⚠️ NUNCA commit este arquivo no Git!** Adicione ao `.gitignore`

#### Passo 7.1.5: Executar Migração

```bash
# Organizar CSVs em uma pasta
mkdir csv-data
mv *.csv csv-data/

# Instalar dependências do script
npm install csv-parser

# Executar migração
node migrate-data.js
```

---

### Método 2: Importação Manual via Console (Pequenos Volumes)

Para poucos dados (< 100 registros por coleção):

#### Passo 7.2.1: Acessar Firestore Console
1. Vá em **"Build"** → **"Firestore Database"**
2. Clique em **"Start collection"**

#### Passo 7.2.2: Criar Coleção
1. Digite o ID da coleção: `users`, `inspections`, etc.
2. Clique em **"Next"**

#### Passo 7.2.3: Adicionar Documentos
1. Clique em **"Add document"**
2. Preencha os campos manualmente copiando da planilha
3. Use tipos corretos:
   - **String**: Texto
   - **Number**: Números
   - **Boolean**: Verdadeiro/Falso
   - **Timestamp**: Datas
   - **Array**: Listas

#### Passo 7.2.4: Repetir para Cada Coleção

---

### Método 3: Usar Firebase Extensions (Automático)

#### Passo 7.3.1: Instalar Extensão
1. No Firebase Console, vá em **"Extensions"**
2. Clique em **"Install extension"**
3. Busque por **"Import Data"** ou **"Sheets to Firestore"**

#### Passo 7.3.2: Configurar Extensão
1. Conecte sua planilha Google Sheets
2. Mapeie as colunas para campos do Firestore
3. Configure sincronização automática (opcional)

---

## 8. Testar e Colocar no Ar

### Passo 8.1: Testes Locais

#### Testar Autenticação
```bash
# Iniciar servidor local
npm run dev  # ou npm start

# Abrir http://localhost:3000 (ou porta configurada)
```

Teste:
- [ ] Login com email/senha
- [ ] Logout
- [ ] Criação de novo usuário
- [ ] Recuperação de senha

#### Testar Operações CRUD
- [ ] Listar inspeções
- [ ] Criar nova inspeção
- [ ] Editar inspeção existente
- [ ] Excluir inspeção
- [ ] Upload de imagens (se aplicável)

#### Testar Permissões
- [ ] Usuário comum não acessa área admin
- [ ] Admin acessa todas as áreas
- [ ] Usuário só vê seus próprios dados

### Passo 8.2: Configurar Deploy (Hosting)

#### Opção A: Firebase Hosting (Recomendado)

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Fazer login
firebase login

# Inicializar hosting
firebase init hosting

# Responder às perguntas:
# - Use an existing project: Yes (selecione seu projeto)
# - Public directory: dist ou build (onde está seu site compilado)
# - Single-page app: Yes
# - GitHub auto-deploy: Opcional

# Build do projeto
npm run build

# Deploy
firebase deploy --only hosting
```

#### Opção B: Vercel/Netlify

```bash
# Vercel
npm install -g vercel
vercel

# Netlify
npm install -g netlify-cli
netlify deploy --prod
```

### Passo 8.3: Configurar Domínio Próprio (Opcional)

1. No Firebase Console: **Hosting** → **Add custom domain**
2. Digite seu domínio: `www.seudominio.com`
3. Siga as instruções para configurar DNS
4. Aguarde propagação (até 48 horas)

### Passo 8.4: Monitoramento

#### Configurar Alerts
1. Vá em **"Monitor"** → **"Alerts"**
2. Crie alertas para:
   - Erros de autenticação
   - Falhas nas regras de segurança
   - Uso excessivo do banco

#### Analytics (Opcional)
1. Habilite Google Analytics nas configurações
2. Adicione o código de tracking ao seu app

---

## 9. Solução de Problemas

### Problema: Erro de Permissão "Missing or insufficient permissions"

**Solução:**
1. Verifique as regras de segurança no Firestore
2. Certifique-se de que o usuário está autenticado
3. Teste com regras de modo teste temporariamente

### Problema: Dados não aparecem após migração

**Solução:**
```bash
# Verificar se dados foram importados
firebase firestore:indexes

# Ou via console:
# Build → Firestore Database → Ver coleções
```

### Problema: Lentidão nas consultas

**Solução:**
1. Crie índices compostos no Firestore
2. Use queries otimizadas
3. Implemente paginação

### Problema: Erro de CORS

**Solução:**
Adicione ao seu `index.html`:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self' https://*.firebaseio.com https://*.googleapis.com;">
```

### Problema: Usuários não conseguem fazer login

**Solução:**
1. Verifique se Authentication está habilitado
2. Confirme provedores de login ativos
3. Verifique quotas e limites do projeto

---

## 📞 Suporte e Recursos

### Links Úteis:
- [Documentação Firebase](https://firebase.google.com/docs)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase Pricing](https://firebase.google.com/pricing)

### Comunidades:
- [Stack Overflow - Firebase](https://stackoverflow.com/questions/tagged/firebase)
- [Firebase Community](https://firebase.community/)
- [Reddit r/firebase](https://www.reddit.com/r/firebase/)

---

## ✅ Checklist Final

Antes de colocar em produção, verifique:

- [ ] Projeto criado no Firebase Console
- [ ] Firestore Database ativado
- [ ] Authentication configurado
- [ ] Credenciais atualizadas no `config.js`
- [ ] Regras de segurança publicadas
- [ ] Dados migrados com sucesso
- [ ] Testes de autenticação passando
- [ ] Testes de CRUD passando
- [ ] Testes de permissão passando
- [ ] Deploy configurado
- [ ] Domínio configurado (se aplicável)
- [ ] Monitoramento ativado
- [ ] Backup dos dados configurado

---

## 🎉 Parabéns!

Seu sistema agora está rodando no Firebase com:
- ✅ Alta performance
- ✅ Escalabilidade automática
- ✅ Cache offline
- ✅ Segurança robusta
- ✅ Tempo real

**Próximos passos recomendados:**
1. Implementar notificações push (Cloud Messaging)
2. Adicionar Functions para automações
3. Configurar backups automáticos
4. Implementar analytics avançado

Boa sorte com seu projeto! 🚀

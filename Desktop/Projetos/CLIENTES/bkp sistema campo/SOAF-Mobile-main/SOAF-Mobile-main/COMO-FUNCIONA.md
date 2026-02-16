# 📚 COMO O SISTEMA FUNCIONA - Guia Visual

## 🔄 FLUXO DE AUTENTICAÇÃO (Como os Usuários São Encontrados)

```
┌─────────────────────────────────────────────────────────────────┐
│                     USUÁRIO (Você)                              │
│                  Abre http://localhost:5173                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
        ┌─────────────────────────────────────┐
        │    FRONTEND (Navegador - React)     │
        │  App.jsx - LoginScreen              │
        │                                     │
        │  1. Mostra tela de LOGIN            │
        │  2. Você digita:                    │
        │     • CNPJ (ex: 12345678912345)    │
        │     • SENHA (ex: 123456)            │
        │  3. Clica em "Entrar"               │
        └────────────────┬────────────────────┘
                         │
                 ▼ (Busca prestadores)
        ┌─────────────────────────────────────┐
        │   BACKEND (Node.js - Express)       │
        │   server/server.js                  │
        │                                     │
        │  GET /api/prestadores               │
        └────────────────┬────────────────────┘
                         │
              ▼ (Lê credenciais)
        ┌─────────────────────────────────────┐
        │   GOOGLE SERVICE ACCOUNT            │
        │   server/service-account.json       │
        │  (JWT authentication)               │
        └────────────────┬────────────────────┘
                         │
              ▼ (Google Cloud API)
        ┌─────────────────────────────────────┐
        │   GOOGLE SHEETS API                 │
        │   Sheets v4 API                     │
        └────────────────┬────────────────────┘
                         │
              ▼ (Busca dados)
        ┌─────────────────────────────────────┐
        │   PLANILHA GOOGLE SHEETS            │
        │   ID: 1EiSWfN5--3-fvHB3...         │
        │                                     │
        │   Aba: DADOS                        │
        │   ┌───────────────────────────────┐ │
        │   │CNPJ│SENHA│NOME│EMAIL│PRIMEIRO│ │
        │   ├───────────────────────────────┤ │
        │   │1234│1234│João│joao@│SIM      │ │
        │   │9876│5678│Maria│mar│NÃO       │ │
        │   └───────────────────────────────┘ │
        └────────────────┬────────────────────┘
                         │
              ▼ (Retorna dados)
        ┌─────────────────────────────────────┐
        │   BACKEND (API Response)            │
        │   server.js (getPrestadores)        │
        │                                     │
        │  [{                                 │
        │    "cnpj": "12345678912345",       │
        │    "senha": "123456",              │
        │    "nome": "João Silva",           │
        │    "email": "joao@empresa.com",    │
        │    ...                             │
        │  }]                                 │
        └────────────────┬────────────────────┘
                         │
              ▼ (Compara no Frontend)
        ┌─────────────────────────────────────┐
        │   FRONTEND - LoginScreen.handleLogin│
        │                                     │
        │  1. Procura CNPJ digitado na lista │
        │  2. Se encontrar:                   │
        │     - Valida SENHA                  │
        │     - Se correta → Dashboard        │
        │     - Se errada → Erro mensagem     │
        │  3. Se não encontrar:               │
        │     - "CNPJ não encontrado"         │
        └─────────────────────────────────────┘
```

---

## 🚨 ONDE PODE DAR ERRO?

### ❌ ERRO 1: "Credenciais não encontradas"

```
CAUSA: server/service-account.json não existe
       ou está no caminho errado

[BACKEND]
  ↓
Tenta ler: service-account.json
❌ Arquivo não encontrado
  ↓
[ERRO] Credenciais do service account não encontradas

SOLUÇÃO: Coloque service-account.json em ./server/
```

### ❌ ERRO 2: "Nenhuma linha retornada pela planilha"

```
CAUSA: Planilha não compartilhada 
       ou não tem dados na aba DADOS

[BACKEND]          [GOOGLE SHEETS]
  ↓                    ↓
Faz autenticação ← Nega acesso (não compartilhada)
  ↓
❌ rows = []
  ↓
[WARN] Nenhuma linha retornada

SOLUÇÃO: Compartilhe planilha com:
         bot-telegram@saof-462713.iam.gserviceaccount.com
```

### ❌ ERRO 3: "CNPJ não encontrado"

```
CAUSA: Backend retorna items vazio
       ou CNPJ do usuário não existe na planilha

[FRONTEND]        [BACKEND]
  ↓                  ↓
Você digita:      GET /api/prestadores
CNPJ=123...       ↓
  ↓               return items = [] (vazio!)
Procura na lista
  ↓
❌ find() = undefined
  ↓
"CNPJ não encontrado"

SOLUÇÃO: Verifique se planilha tem dados em DADOS
```

### ❌ ERRO 4: "Senha incorreta"

```
CAUSA: CNPJ existe mas senha está errada

[FRONTEND]           [PLANILHA]
  ↓                      ↓
Você digita:         CNPJ encontrado ✅
CNPJ=123... ✅       SENHA esperada: 123456
SENHA=999... ❌      SENHA recebida: 999...
  ↓
❌ Não corresponde
  ↓
"Senha incorreta. 2 tentativas restantes"
```

---

## 🔑 COMPONENTES PRINCIPAIS

### 1️⃣ FRONTEND (React - src/App.jsx)

```jsx
LoginScreen
├── login (CNPJ)
├── password (SENHA)
└── handleLogin()
    ├── Normaliza CNPJ
    ├── Busca em prestadores[]
    ├── Valida SENHA
    └── Redireciona para Dashboard

Dashboard
├── Tasks (ROTA DIA)
├── Report (TOTAL DE SERVIÇOS)
├── Discounts (DESCONTOS)
└── Closing (Fechamento Prestadores)
```

### 2️⃣ BACKEND (Node.js - server/server.js)

```javascript
getPrestadores()
├── Lê service-account.json
├── Autentica com Google
├── Busca Google Sheets API
├── SELECT * FROM "DADOS"
└── return items[]

getTarefas()
├── Busca "ROTA DIA"
└── return items[]

getRelatorio()
├── Busca "TOTAL DE SERVIÇOS"
└── return items[]

getDescontos()
├── Busca "DESCONTOS"
└── return items[]

getFechamento()
├── Busca "Fechamento Prestadores"
└── return items[]
```

### 3️⃣ GOOGLE SHEETS (Banco de Dados)

```
┌─ ID: 1EiSWfN5--3-fvHB3lc7tHG9Dls8qM5I61y_2ixx-rWI
│
├─ ABA: DADOS
│  ├─ CNPJ (número 14 dígitos)
│  ├─ SENHA (texto qualquer)
│  ├─ NOME (texto)
│  ├─ EMAIL (email)
│  ├─ PRIMEIRO_ACESSO (SIM/NÃO)
│  └─ CPF (número 11 dígitos)
│
├─ ABA: ROTA DIA
│  ├─ CNPJ PRESTADOR
│  ├─ SA (número do atendimento)
│  ├─ CLIENTE (nome empresa)
│  ├─ ENDERECO (de atendimento)
│  ├─ TIPO DE SERVIÇO
│  ├─ DATA
│  ├─ PRAZO MAX
│  ├─ STATUS SF
│  ├─ PLANO DO CLIENTE
│  └─ TELEFONE
│
├─ ABA: TOTAL DE SERVIÇOS
│  ├─ CNPJ PRESTADOR
│  ├─ SA
│  ├─ CLIENTE
│  └─ ... (outros campos)
│
├─ ABA: DESCONTOS
│  ├─ CNPJ PRESTADOR
│  └─ ... (dados de descontos)
│
├─ ABA: Fechamento Prestadores
│  ├─ CNPJ
│  ├─ DATA
│  └─ ... (dados financeiros)
│
└─ ABA: LOGS
   ├─ DATA
   ├─ HORA
   ├─ TIPO
   ├─ CNPJ
   ├─ NOME
   ├─ IP
   ├─ ACAO
   └─ DETALHES
```

---

## 🔄 CICLO DE VIDA DO REQUEST

### 1️⃣ USUÁRIO CLICA EM "ENTRAR"

```javascript
const handleLogin = (e) => {
  e.preventDefault();
  
  const cnpjNormalized = login.replace(/\D/g, '');  // Remove formatação
  
  // Procura na lista de prestadores (já carregada do backend)
  const found = prestadores.find(p => 
    p.cnpj.replace(/\D/g, '') === cnpjNormalized
  );
  
  if (found) {
    if (found.senha === password) {
      // ✅ Login correto
      setUserId(cnpjNormalized);
      setAppPhase('dashboard');
    } else {
      // ❌ Senha errada
      setError('Senha incorreta');
    }
  } else {
    // ❌ CNPJ não encontrado
    setError('CNPJ não encontrado na planilha');
  }
};
```

### 2️⃣ BACKEND CARREGA PRESTADORES (ao iniciar app)

```javascript
// GET http://localhost:4000/api/prestadores

async function getPrestadores() {
  // 1. Valida service-account.json
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    throw new Error('Credenciais não encontradas');
  }
  
  // 2. Autentica com Google
  const cred = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const client = new google.auth.JWT(...);
  await client.authorize();  // Faz OAuth2
  
  // 3. Cria cliente Sheets
  const sheets = google.sheets({ version: 'v4', auth: client });
  
  // 4. Busca dados
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'DADOS'  // Nome da aba
  });
  
  // 5. Processa
  const rows = res.data.values || [];
  const headers = rows[0];  // Primeira linha = headers
  const items = rows.slice(1);  // Resto = dados
  
  // 6. Retorna
  return items;  // [{cnpj: '...', senha: '...', ...}, ...]
}
```

### 3️⃣ GOOGLE SHEETS RETORNA DADOS

```
GET /spreadsheets/values/SPREADSHEET_ID?range=DADOS
↓
[
  ['CNPJ', 'SENHA', 'NOME', 'EMAIL', 'PRIMEIRO_ACESSO'],  // headers
  ['12345678912345', '123456', 'João Silva', 'joao@...', 'SIM'],
  ['98765432109876', '654321', 'Maria Santos', 'maria@...', 'NÃO']
]
↓
Backend processa e retorna JSON
↓
Frontend recebe e armazena em prestadores[]
```

---

## 📊 TABELA DE STATUS

| Componente | Status | Como saber |
|-----------|--------|-----------|
| Frontend | OK | App abre, vê tela de login |
| Backend (Local) | OK | `npm start` mostra "rodando na porta 4000" |
| Backend (Prod) | OK | URL responde sem erro 500 |
| Service Account | OK | Arquivo `server/service-account.json` existe |
| Google Auth | OK | Backend log mostra "Autorização JWT bem-sucedida" |
| Planilha Compartilhada | OK | Backend consegue ler dados (não retorna erro) |
| Dados na Planilha | OK | `/api/prestadores` retorna `items` com dados |
| Login Funciona | OK | Usuario consegue fazer login |

---

## 🧪 TESTES RÁPIDOS

### Teste 1: Backend está online?
```bash
curl http://localhost:4000/
# ou
curl https://soaf-mobile-backend.onrender.com/
```

### Teste 2: Tem prestadores?
```bash
curl http://localhost:4000/api/prestadores
```

### Teste 3: Validate CNPJ existe?
```bash
curl -X POST http://localhost:4000/api/validar-cpf \
  -H "Content-Type: application/json" \
  -d '{"cnpj":"12345678912345","cpf":"12345678901"}'
```

---

## 💡 RESUMO FINAL

Para o sistema FUNCIONAR, você precisa de:

```
✅ Frontend rodando (npm run dev)
✅ Backend rodando (npm start em ./server)
✅ service-account.json em ./server/
✅ Planilha com dados em DADOS
✅ Planilha compartilhada com service account
✅ Nome das colunas corretos
✅ CNPJ tem 14 dígitos na planilha
✅ SENHA tem pelo menos um valor
```

Se TODOS esses itens estão OK → **O SISTEMA FUNCIONA!** 🎉

---

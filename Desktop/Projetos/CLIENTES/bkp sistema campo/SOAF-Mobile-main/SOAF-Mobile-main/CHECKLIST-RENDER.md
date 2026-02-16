# ✅ CHECKLIST DE CONFIGURAÇÃO DO RENDER - SOAF Mobile

## 🔍 DIAGNÓSTICO DO PROBLEMA DE AUTENTICAÇÃO

O app não está autenticando porque o **backend no Render precisa estar configurado corretamente**. O frontend busca os dados de login (CNPJs e senhas) da planilha Google Sheets através do backend.

---

## 📋 CONFIGURAÇÕES OBRIGATÓRIAS NO RENDER

Acesse: **https://dashboard.render.com** → Seu serviço **SOAF-Mobile**

### 1️⃣ **ENVIRONMENT VARIABLES** (Variáveis de Ambiente)

Vá em: **Environment** → Adicione estas variáveis:

| Variável | Valor | Status |
|----------|-------|--------|
| `SPREADSHEET_ID` | `1EiSWfN5--3-fvHB3lc7tHG9Dls8qM5I61y_2ixx-rWI` | ⚠️ OBRIGATÓRIA |
| `ALLOWED_ORIGIN` | `https://soaf-mobile.web.app` | ⚠️ OBRIGATÓRIA |
| `GOOGLE_APPLICATION_CREDENTIALS` | `/etc/secrets/service-account.json` | ⚠️ OBRIGATÓRIA |
| `NODE_ENV` | `production` | ✅ Opcional |
| `PORT` | `4000` | ✅ Auto-configurado |
| `RESEND_API_KEY` | `re_sua_chave_aqui` | ✅ Opcional (só para emails) |

---

### 2️⃣ **SECRET FILES** (Arquivo service-account.json)

**ESTE É O MAIS IMPORTANTE!** Sem ele, o backend não consegue acessar o Google Sheets.

#### Como adicionar:

1. No Render, vá em: **Environment** → **Secret Files**
2. Clique em **Add Secret File**
3. **Filename**: `/etc/secrets/service-account.json`
4. **Contents**: Cole o conteúdo do arquivo `server/service-account.json` (JSON completo)

```json
{
  "type": "service_account",
  "project_id": "saof-462713",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "bot-telegram@saof-462713.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "...",
  "universe_domain": "googleapis.com"
}
```

5. Clique em **Save Changes**

---

### 3️⃣ **GOOGLE SHEETS - COMPARTILHAMENTO**

A planilha precisa ser compartilhada com o email do service account:

1. Abra a planilha: https://docs.google.com/spreadsheets/d/1EiSWfN5--3-fvHB3lc7tHG9Dls8qM5I61y_2ixx-rWI
2. Clique em **Compartilhar** (canto superior direito)
3. Adicione este email: **bot-telegram@saof-462713.iam.gserviceaccount.com**
4. Permissão: **Leitor** (Reader)
5. Clique em **Enviar**

---

### 4️⃣ **ESTRUTURA DA PLANILHA GOOGLE SHEETS**

Verifique se a planilha tem estas abas com as colunas corretas:

#### Aba: **DADOS** (dados de login)
- Colunas necessárias: `CNPJ`, `SENHA`, `NOME`, `EMAIL`

#### Aba: **ROTA DIA** (ordens de serviço)
- Colunas necessárias: `CNPJ PRESTADOR`, `SA`, `CLIENTE`, `ENDERECO`, `TIPO DE SERVIÇO`, `DATA`, `PRAZO MAX`, `STATUS SF`, `PLANO DO CLIENTE`, `TELEFONE`

#### Aba: **TOTAL DE SERVIÇOS** (relatório)
- Colunas necessárias: `CNPJ PRESTADOR`, (outras colunas conforme necessário)

#### Aba: **DESCONTOS**
- Colunas necessárias: `CNPJ PRESTADOR`, (outras colunas conforme necessário)

#### Aba: **Fechamento Prestadores**
- Colunas necessárias: `CNPJ`, (outras colunas conforme necessário)

---

## 🧪 TESTES DE VERIFICAÇÃO

### Teste 1: Backend está rodando?
Acesse: https://soaf-mobile.onrender.com/

**Resposta esperada:**
```json
{
  "status": "online",
  "service": "SOAF Mobile Backend API",
  "version": "1.0.0",
  "timestamp": "2025-11-29T...",
  "endpoints": {
    "prestadores": "/api/prestadores",
    "tarefas": "/api/tarefas",
    ...
  },
  "frontend": "https://soaf-mobile.web.app"
}
```

---

### Teste 2: Endpoint de prestadores (dados de login)
Acesse: https://soaf-mobile.onrender.com/api/prestadores

**Resposta esperada:**
```json
{
  "ok": true,
  "items": [
    {
      "cnpj": "12345678000199",
      "senha": "senha123",
      "nome": "Nome do Prestador",
      "email": "email@exemplo.com"
    },
    ...
  ]
}
```

**Se der erro:**
- ❌ `Credenciais do service account não encontradas` → Volte ao passo 2️⃣
- ❌ `The caller does not have permission` → Volte ao passo 3️⃣
- ❌ `ENOTFOUND` ou `timeout` → Serviço está dormindo (aguarde 30-60 segundos)

---

### Teste 3: Health Check
Acesse: https://soaf-mobile.onrender.com/api/health

**Resposta esperada:**
```json
{
  "ok": true,
  "message": "Backend rodando"
}
```

---

## 🔧 SOLUÇÃO DE PROBLEMAS COMUNS

### ❌ Erro: "Cannot reach backend"
**Causa:** Serviço no plano free dorme após 15 minutos de inatividade  
**Solução:** Aguarde 30-60 segundos e tente novamente (primeira requisição acorda o serviço)

---

### ❌ Erro: "Credenciais do service account não encontradas"
**Causa:** Arquivo service-account.json não foi carregado no Render  
**Solução:** Volte ao passo 2️⃣ e adicione o Secret File

---

### ❌ Erro: "The caller does not have permission"
**Causa:** Planilha não foi compartilhada com o service account  
**Solução:** Volte ao passo 3️⃣ e compartilhe a planilha

---

### ❌ Erro: "CORS blocked"
**Causa:** ALLOWED_ORIGIN não está configurado corretamente  
**Solução:** Verifique se a variável está com valor `https://soaf-mobile.web.app`

---

### ❌ Erro: "CNPJ não encontrado"
**Causa:** A aba DADOS da planilha está vazia ou com estrutura incorreta  
**Solução:** Verifique se:
- Aba se chama exatamente **DADOS**
- Tem as colunas: CNPJ, SENHA, NOME, EMAIL
- Tem pelo menos 1 linha de dados (além do cabeçalho)

---

## 📊 LOGS DO RENDER

Para ver o que está acontecendo:

1. Acesse o dashboard do Render
2. Clique no serviço **SOAF-Mobile**
3. Vá na aba **Logs**
4. Procure por mensagens de erro em vermelho

**Mensagens importantes:**
- `[STARTUP] Resend API Key configurada` → Backend iniciou
- `[INFO] Arquivo service-account.json encontrado` → Credenciais OK
- `[INFO] Total de linhas recebidas: X` → Planilha acessada com sucesso
- `[ERROR]` → Indica problema que precisa ser resolvido

---

## ✅ CHECKLIST RESUMIDO

Marque conforme for configurando:

- [ ] Variável `SPREADSHEET_ID` configurada
- [ ] Variável `ALLOWED_ORIGIN` configurada  
- [ ] Variável `GOOGLE_APPLICATION_CREDENTIALS` configurada
- [ ] Secret File `service-account.json` carregado
- [ ] Planilha compartilhada com `bot-telegram@saof-462713.iam.gserviceaccount.com`
- [ ] Aba **DADOS** existe e tem colunas corretas
- [ ] Aba **ROTA DIA** existe e tem dados
- [ ] Teste 1 (/) retorna status online
- [ ] Teste 2 (/api/prestadores) retorna lista de CNPJs
- [ ] Login no app funciona

---

## 🆘 AINDA NÃO FUNCIONA?

Se após seguir todos os passos o login ainda não funcionar:

1. Verifique os **Logs do Render** (aba Logs)
2. Teste os endpoints manualmente (pelo navegador)
3. Verifique se há erros no Console do navegador (F12 → Console)
4. Confirme que o CNPJ usado no login está exatamente igual na planilha (sem pontos/traços)

---

## 📞 INFORMAÇÕES TÉCNICAS

- **Frontend:** https://soaf-mobile.web.app
- **Backend:** https://soaf-mobile.onrender.com
- **Planilha:** https://docs.google.com/spreadsheets/d/1EiSWfN5--3-fvHB3lc7tHG9Dls8qM5I61y_2ixx-rWI
- **Service Account:** bot-telegram@saof-462713.iam.gserviceaccount.com
- **Repositório:** https://github.com/jeferson317/SOAF-Mobile

---

**Data da última atualização:** 29/11/2025

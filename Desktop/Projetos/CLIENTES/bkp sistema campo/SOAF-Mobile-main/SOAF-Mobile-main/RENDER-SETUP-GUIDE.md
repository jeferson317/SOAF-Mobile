# 🚀 Guia Completo: Deploy Backend SOAF Mobile no Render

## 📋 Pré-requisitos

- ✅ Conta no Render.com (gratuita)
- ✅ Repositório GitHub configurado
- ✅ Arquivo `service-account.json` do Google Cloud
- ✅ Chave API do Resend

---

## 🔧 PASSO 1: Preparar o Repositório

### 1.1 - Criar repositório separado para o backend (Recomendado)

```powershell
cd "c:\Users\Microsoft\Desktop\Projetos\SISTEMA NOVO\APP CAMPO\APP CAMPO\server"

# Inicializar Git
git init
git add .
git commit -m "🚀 Setup inicial backend SOAF Mobile"

# Criar branch main
git branch -M main

# Adicionar remote (criar repositório no GitHub primeiro)
git remote add origin https://github.com/jeferson317/soaf-mobile-backend.git
git push -u origin main
```

**OU usar o mesmo repositório** (mais simples):
- O Render pode apontar para a pasta `server/` do repositório principal

---

## 🌐 PASSO 2: Criar Web Service no Render

### 2.1 - Acessar Dashboard
1. Acesse: https://dashboard.render.com
2. Faça login ou crie conta gratuita
3. Clique em **"New +"** → **"Web Service"**

### 2.2 - Conectar Repositório
1. Se primeira vez: clique em **"Connect GitHub"** e autorize
2. Selecione o repositório: **`SOAF-Mobile`** ou **`soaf-mobile-backend`**
3. Clique em **"Connect"**

### 2.3 - Configurar Serviço

**Configurações básicas:**
- **Name**: `soaf-mobile-backend` (ou nome de sua escolha)
- **Region**: Ohio (US East) - Mais próximo do Brasil
- **Branch**: `main`
- **Root Directory**: `server` (se estiver no mesmo repo) ou deixe vazio
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

**Plano:**
- Selecione **"Free"** (0 USD/mês - suficiente para começar)
- ⚠️ Limite: 750 horas/mês, suspende após 15min inativo

Clique em **"Create Web Service"**

---

## ⚙️ PASSO 3: Configurar Variáveis de Ambiente

### 3.1 - Acessar Environment Variables

Após criar o serviço:
1. Na página do serviço, vá na aba **"Environment"** (barra lateral esquerda)
2. Ou acesse **Settings → Environment**

### 3.2 - Adicionar Variáveis

Clique em **"Add Environment Variable"** e adicione UMA POR VEZ:

#### ✅ Variável 1: SPREADSHEET_ID
```
Key:   SPREADSHEET_ID
Value: 1EiSWfN5--3-fvHB3lc7tHG9Dls8qM5I61y_2ixx-rWI
```

#### ✅ Variável 2: RESEND_API_KEY
```
Key:   RESEND_API_KEY
Value: [SUA_CHAVE_RESEND_AQUI]
```
*Obtenha em: https://resend.com/api-keys*

#### ✅ Variável 3: ALLOWED_ORIGIN
```
Key:   ALLOWED_ORIGIN
Value: https://soaf-mobile.web.app
```
*Use o domínio onde o frontend estará hospedado*

#### ✅ Variável 4: PORT (opcional - Render define automaticamente)
```
Key:   PORT
Value: 4000
```

### 3.3 - Salvar
Clique em **"Save Changes"** - O serviço reiniciará automaticamente

---

## 🔐 PASSO 4: Adicionar Credenciais Google (service-account.json)

### 4.1 - Acessar Secret Files

1. Na página do serviço, vá em **"Environment"**
2. Role até **"Secret Files"**
3. Clique em **"Add Secret File"**

### 4.2 - Configurar Secret File

```
Filename: service-account.json
Contents: [COLE TODO O CONTEÚDO DO SEU ARQUIVO JSON AQUI]
```

**Exemplo do conteúdo:**
```json
{
  "type": "service_account",
  "project_id": "seu-projeto",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "sua-conta@seu-projeto.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

### 4.3 - Adicionar Variável para o Caminho

Adicione mais uma variável de ambiente:
```
Key:   GOOGLE_APPLICATION_CREDENTIALS
Value: /etc/secrets/service-account.json
```

Clique em **"Save Changes"**

---

## ✅ PASSO 5: Verificar Deploy

### 5.1 - Acompanhar Logs

Na aba **"Logs"**, você verá:
```
==> Building...
==> Deploying...
==> Your service is live 🎉
```

### 5.2 - Testar Endpoints

Anote a URL do seu serviço (ex: `https://soaf-mobile-backend.onrender.com`)

**Teste no navegador ou Postman:**

```
✅ Health Check
https://soaf-mobile-backend.onrender.com/api/health

✅ Prestadores
https://soaf-mobile-backend.onrender.com/api/prestadores

✅ Tarefas
https://soaf-mobile-backend.onrender.com/api/tarefas

✅ Relatório
https://soaf-mobile-backend.onrender.com/api/relatorio

✅ Descontos
https://soaf-mobile-backend.onrender.com/api/descontos

✅ Fechamento
https://soaf-mobile-backend.onrender.com/api/fechamento

✅ Enviar Email Aceite
POST https://soaf-mobile-backend.onrender.com/api/enviar-email-aceite
Body: {"email": "teste@email.com", "cnpj": "12345678901234"}

✅ Enviar Email Rejeição
POST https://soaf-mobile-backend.onrender.com/api/enviar-email-rejeicao
Body: {"email": "teste@email.com", "cnpj": "12345678901234"}
```

---

## 🔗 PASSO 6: Conectar Frontend ao Backend

### 6.1 - Atualizar URL do Backend

No seu projeto frontend, edite o arquivo `.env.production`:

```env
VITE_API_URL=https://soaf-mobile-backend.onrender.com
```

### 6.2 - Rebuild e Deploy Frontend

```powershell
cd "c:\Users\Microsoft\Desktop\Projetos\SISTEMA NOVO\APP CAMPO\APP CAMPO"

# Build com variável de produção
npm run build

# Deploy no Firebase
firebase deploy --only hosting
```

---

## 🎨 PASSO 7 (OPCIONAL): Configurar via render.yaml

Se preferir automatizar, atualize o arquivo `server/render.yaml`:

```yaml
services:
  - type: web
    name: soaf-mobile-backend
    runtime: node
    repo: https://github.com/jeferson317/SOAF-Mobile.git
    branch: main
    rootDir: server
    buildCommand: npm install
    startCommand: node server.js
    plan: free
    envVars:
      - key: NODE_ENV
        value: production
      - key: SPREADSHEET_ID
        value: 1EiSWfN5--3-fvHB3lc7tHG9Dls8qM5I61y_2ixx-rWI
      - key: RESEND_API_KEY
        sync: false  # Adicionar manualmente (não commitar)
      - key: ALLOWED_ORIGIN
        value: https://soaf-mobile.web.app
      - key: GOOGLE_APPLICATION_CREDENTIALS
        value: /etc/secrets/service-account.json
```

Então:
1. Commit e push: `git add render.yaml && git commit -m "📝 Configurar Render" && git push`
2. No Render Dashboard: **"New +" → "Blueprint"**
3. Selecione repositório e confirme

---

## 🐛 Troubleshooting

### ❌ Erro: "service-account.json not found"
**Solução:** Verifique se adicionou o Secret File corretamente e a variável `GOOGLE_APPLICATION_CREDENTIALS`

### ❌ Erro: "CORS blocked"
**Solução:** Verifique se `ALLOWED_ORIGIN` está correto e corresponde ao domínio do frontend

### ❌ Erro: "Cannot read spreadsheet"
**Solução:** 
1. Verifique permissões da planilha
2. Compartilhe com o email do service account: `client_email` do JSON
3. Dê permissão de "Leitor" ou "Editor"

### ❌ Serviço fica "Suspended"
**Solução:** Plano gratuito suspende após 15min inativo. Primeira requisição "acorda" o serviço (pode demorar 30s)

### ⚡ Manter Sempre Ativo (Opcional - Plano Pago)
Upgrade para plano **Starter** ($7/mês) para manter sempre ativo

---

## 📊 Monitoramento

### Ver Logs em Tempo Real
Dashboard → Seu Serviço → **"Logs"**

### Ver Métricas
Dashboard → Seu Serviço → **"Metrics"**
- CPU, Memória, Requests

### Redeploy Manual
Se precisar forçar redeploy:
1. Dashboard → Seu Serviço
2. Clique em **"Manual Deploy"** → **"Deploy latest commit"**

---

## 🔄 Atualizações Futuras

Quando fizer alterações no código:

```powershell
# Commit e push
git add .
git commit -m "Descrição da alteração"
git push

# Render detecta automaticamente e faz redeploy
```

---

## ✅ Checklist Final

- [ ] Web Service criado no Render
- [ ] Variáveis de ambiente configuradas
- [ ] service-account.json adicionado como Secret File
- [ ] Planilha Google compartilhada com service account email
- [ ] Endpoints testados e funcionando
- [ ] Frontend conectado ao backend
- [ ] CORS configurado corretamente

---

## 📞 Suporte

**Render Docs:** https://render.com/docs
**Status Page:** https://status.render.com

---

**🎉 Pronto! Seu backend SOAF Mobile está no ar!**

# Guia de Deploy - KNM Telecom App

## Arquitetura
- **Frontend**: React + Vite → Firebase Hosting (grátis)
- **Backend**: Node.js + Express → Render/Railway (grátis com limites)
- **Dados**: Google Sheets via service account JSON

---

## 1. Deploy do Frontend (Firebase Hosting)

### Pré-requisitos
- Projeto Firebase criado (já feito: `knm-telecom`)
- Firebase CLI instalado: `npm install -g firebase-tools`

### Passos

#### 1.1. Configurar variável de ambiente
Crie `.env.production` na pasta raiz do frontend:
```
VITE_API_URL=https://seu-backend.onrender.com
```
*Substitua pela URL real após publicar o backend (passo 2)*

#### 1.2. Build do projeto
```powershell
cd "c:\Users\Microsoft\Desktop\Projetos\SISTEMA NOVO\knm-app\knm-app"
npm ci
npm run build
```
Isso gera a pasta `dist/` com os arquivos estáticos.

#### 1.3. Inicializar Firebase Hosting (apenas primeira vez)
```powershell
firebase login
firebase init hosting
```
Configurações:
- **Projeto**: Selecione `knm-telecom`
- **Pasta pública**: `dist` (não `public`!)
- **SPA (Single Page App)**: `yes`
- **GitHub Actions**: `no`
- **Sobrescrever index.html**: `no`

#### 1.4. Deploy
```powershell
firebase deploy --only hosting
```

**URL pública**: `https://knm-telecom.web.app`

---

## 2. Deploy do Backend (Render - Grátis)

### Pré-requisitos
- Conta no [Render](https://render.com) (grátis)
- Repositório Git com o código do `server/` (sem o `service-account.json`)

### Passos

#### 2.1. Preparar repositório
1. Suba o código da pasta `server/` para um repo Git (GitHub/GitLab)
2. **Importante**: adicione `service-account.json` ao `.gitignore`
3. Commit e push

#### 2.2. Criar Web Service no Render
1. Acesse [dashboard.render.com](https://dashboard.render.com/)
2. Clique em **New +** → **Web Service**
3. Conecte seu repositório Git
4. Configurações:
   - **Name**: `knm-backend` (ou outro nome)
   - **Region**: Oregon (mais próximo)
   - **Branch**: `main`
   - **Root Directory**: deixe vazio (ou `server` se for monorepo)
   - **Build Command**: `npm ci`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`

#### 2.3. Configurar variáveis de ambiente
Na seção **Environment**:
- `PORT` (Render define automaticamente, mas confirme)
- `SPREADSHEET_ID`: `16hFEaMWOagQ9rhIle9-Q4Jch08UQJXbzA4AdRV6HmJY`
- `ALLOWED_ORIGIN`: `https://knm-telecom.web.app`
- `GOOGLE_APPLICATION_CREDENTIALS`: `/etc/secrets/service-account.json`

#### 2.4. Upload do service-account.json
Na seção **Secret Files**:
- **Filename**: `/etc/secrets/service-account.json`
- **Contents**: Cole o conteúdo completo do seu arquivo JSON

#### 2.5. Deploy
Clique em **Create Web Service**. Render fará o build e deploy automaticamente.

**URL pública**: `https://knm-backend.onrender.com` (exemplo)

⚠️ **Importante**: Na conta gratuita, o serviço "dorme" após 15 min sem uso e demora ~30s para "acordar" na primeira requisição.

---

## 3. Conectar Frontend ao Backend

#### 3.1. Atualizar variável de ambiente do frontend
Edite `.env.production`:
```
VITE_API_URL=https://knm-backend.onrender.com
```

#### 3.2. Atualizar CORS no backend
Edite `server/server.js`, seção CORS:
```javascript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGIN || 'https://knm-telecom.web.app',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

#### 3.3. Re-build e re-deploy do frontend
```powershell
cd "c:\Users\Microsoft\Desktop\Projetos\SISTEMA NOVO\knm-app\knm-app"
npm run build
firebase deploy --only hosting
```

---

## 4. Alternativas Gratuitas para Backend

### Render (recomendado)
- ✅ Fácil de usar
- ✅ SSL automático
- ✅ Secret files para JSON
- ⚠️ "Sleep" após 15 min

### Railway
- ✅ Generoso free tier (500h/mês)
- ✅ Fácil configuração de volumes
- ⚠️ Pode mudar limites

### Fly.io
- ✅ Robusto e rápido
- ⚠️ Requer `fly.toml` e CLI

### Deta Space
- ✅ Gratuito ilimitado
- ⚠️ API diferente, requer adaptações

---

## 5. Verificação Final

### Checklist
- [ ] Frontend acessível em `https://knm-telecom.web.app`
- [ ] Backend respondendo em `/api/health`
- [ ] Login funciona com CNPJ da planilha
- [ ] Todas as 4 abas carregam dados corretos
- [ ] CORS configurado apenas para o domínio do frontend
- [ ] service-account.json NÃO está no repositório Git
- [ ] Testar com 2-3 operadores reais

### Comandos de teste
```powershell
# Testar backend
curl https://knm-backend.onrender.com/api/health

# Testar prestadores
curl https://knm-backend.onrender.com/api/prestadores
```

---

## 6. Custos

- **Firebase Hosting**: Gratuito (até 10 GB/mês de armazenamento e 360 MB/dia de transferência)
- **Render Free**: Gratuito (limites: 750h/mês, sleep após inatividade)
- **Google Sheets API**: Gratuito (até 100 req/100s por usuário)

**Total**: R$ 0,00/mês para uso moderado

---

## 7. Próximos Passos (Opcional)

### Domínio Personalizado
- Registrar `app.knm.com.br`
- Configurar DNS no Firebase Hosting
- SSL automático via Firebase

### Monitoramento
- Firebase Analytics (grátis)
- Render Logs (inclusos)
- Google Cloud Monitoring (grátis até 50 MB/dia)

### Melhorias Futuras
- Implementar cache no backend (Redis/Upstash)
- Webhook para atualização automática de dados
- Notificações push via Firebase Cloud Messaging

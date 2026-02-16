# ⚡ SOAF Mobile - Quick Start Render

## 🎯 Setup Rápido em 5 Minutos

### 📦 1. CRIAR WEB SERVICE
```
1. Acesse: https://dashboard.render.com
2. Clique: New + → Web Service
3. Conecte: GitHub → SOAF-Mobile
4. Configure:
   - Name: soaf-mobile-backend
   - Root Directory: server
   - Runtime: Node
   - Build: npm install
   - Start: node server.js
   - Plan: Free
5. Clique: Create Web Service
```

### ⚙️ 2. ADICIONAR VARIÁVEIS (Environment)
```
Clique na aba "Environment" e adicione:

SPREADSHEET_ID
1EiSWfN5--3-fvHB3lc7tHG9Dls8qM5I61y_2ixx-rWI

RESEND_API_KEY
[Sua chave do Resend.com]

ALLOWED_ORIGIN
https://soaf-mobile.web.app

GOOGLE_APPLICATION_CREDENTIALS
/etc/secrets/service-account.json
```

### 🔐 3. ADICIONAR SERVICE ACCOUNT
```
Na mesma página, role até "Secret Files":

1. Clique: Add Secret File
2. Filename: service-account.json
3. Contents: [Cole o JSON completo do Google Cloud]
4. Save Changes
```

### ✅ 4. TESTAR
```
Aguarde deploy (1-2 min)

Teste no navegador:
https://seu-app.onrender.com/api/health

Deve retornar: {"ok": true, "message": "..."}
```

### 🔗 5. CONECTAR FRONTEND
```
No projeto, edite .env.production:

VITE_API_URL=https://seu-app.onrender.com

Depois:
npm run build
firebase deploy --only hosting
```

---

## 📋 Checklist

- [ ] Web Service criado
- [ ] 4 variáveis de ambiente adicionadas
- [ ] service-account.json carregado
- [ ] Planilha compartilhada com service account email
- [ ] Endpoints testados
- [ ] Frontend conectado

---

## 🆘 Problemas?

**Erro CORS:** Verifique ALLOWED_ORIGIN
**Erro 500:** Verifique logs na aba "Logs"
**Erro Sheets:** Compartilhe planilha com email do service account

---

**📖 Guia Completo:** Veja `RENDER-SETUP-GUIDE.md` para instruções detalhadas

**✅ Pronto em 5 minutos!** 🚀

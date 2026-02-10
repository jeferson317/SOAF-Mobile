# Deploy Rápido - KNM Telecom

## 🚀 Comandos Essenciais

### 1. Deploy Frontend (Desenvolvimento - Backend Local)
```powershell
cd "c:\Users\Microsoft\Desktop\Projetos\SISTEMA NOVO\knm-app\knm-app"
.\deploy-frontend.ps1
```
- Usa backend em `http://localhost:4000`
- **Atenção**: Só funciona no seu computador!

### 2. Deploy Frontend (Produção - Backend Público)
```powershell
cd "c:\Users\Microsoft\Desktop\Projetos\SISTEMA NOVO\knm-app\knm-app"
.\deploy-frontend.ps1 -Production
```
- Solicita URL do backend (ex: `https://knm-backend.onrender.com`)
- Acessível para todos os operadores

### 3. Testar Localmente (Antes de Deploy)
```powershell
# Frontend
cd "c:\Users\Microsoft\Desktop\Projetos\SISTEMA NOVO\knm-app\knm-app"
npm run dev
# Acesse: http://localhost:5173

# Backend (em outro terminal)
cd "c:\Users\Microsoft\Desktop\Projetos\SISTEMA NOVO\knm-app\knm-app\server"
node server.js
# API em: http://localhost:4000
```

---

## 📦 Checklist de Deploy Completo

### Primeira vez (Setup inicial)
- [ ] Firebase CLI instalado: `npm install -g firebase-tools`
- [ ] Firebase login: `firebase login`
- [ ] Backend publicado no Render/Railway
- [ ] service-account.json configurado no backend
- [ ] Aba DADOS da planilha com operadores (CNPJ/senha)

### Toda vez que atualizar
- [ ] Backend: commit + push → Render/Railway redeploy automático
- [ ] Frontend: executar `.\deploy-frontend.ps1 -Production`
- [ ] Testar login e 4 abas no `https://knm-telecom.web.app`

---

## 🔧 Solução de Problemas

### Frontend não carrega dados
```powershell
# Verificar se backend está no ar
curl https://seu-backend.onrender.com/api/health

# Verificar logs do navegador (F12)
# Deve mostrar conexão com backend configurado
```

### CORS bloqueado
Edite `server/server.js` e adicione seu domínio:
```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'https://knm-telecom.web.app'  // ← deve estar aqui
];
```
Faça commit e redeploy do backend.

### Backend "dormindo" (Render Free)
- Primeira requisição demora ~30s
- Adicione "keep-alive" via cron job (ver README-DEPLOY.md)

---

## 📊 URLs Finais

| Serviço | URL | Observação |
|---------|-----|------------|
| Frontend | `https://knm-telecom.web.app` | Firebase Hosting |
| Backend | `https://seu-backend.onrender.com` | Render/Railway |
| API Health | `https://seu-backend.onrender.com/api/health` | Teste de status |
| Console Firebase | `https://console.firebase.google.com/project/knm-telecom` | Gerenciamento |

---

## 💡 Dicas

1. **Sempre teste localmente antes de fazer deploy**
   ```powershell
   npm run dev  # frontend
   node server.js  # backend
   ```

2. **Use -Production apenas quando backend estiver público**
   ```powershell
   .\deploy-frontend.ps1 -Production
   ```

3. **Monitore logs do backend no Render**
   - Acesse dashboard → seu serviço → aba "Logs"

4. **Cache do navegador**
   - Após deploy, teste em aba anônima (Ctrl+Shift+N)
   - Ou limpe cache: Ctrl+Shift+Delete

5. **Custo zero**
   - Firebase Hosting: grátis até 10 GB/mês
   - Render Free: 750h/mês (suficiente para 1 serviço 24/7)
   - Google Sheets API: grátis até 100 req/100s

---

## 📞 Suporte

Problemas? Verifique:
1. Logs do navegador (F12 → Console)
2. Logs do backend (Render dashboard)
3. Status da API: `curl https://seu-backend.onrender.com/api/health`
4. Documentação completa: `README-DEPLOY.md`

# ⚡ QUICKFIX - Soluções Rápidas (5 Min)

## Se o sistema NÃO ENCONTRA USUÁRIOS, tente ISSO em ordem:

---

## 🎯 SOLUÇÃO #1: Backend Não Está Rodando (60% dos casos)

Se você está em **LOCAL** e vê erro de conexão:

```PowerShell
# 1. Abra PowerShell
# 2. Navegue até a pasta do projeto
cd C:\Users\Microsoft\Desktop\Projetos\CLIENTES\bkp-sistema-campo\SOAF-Mobile-main\SOAF-Mobile-main

# 3. Entre na pasta server
cd server

# 4. Instale dependências (primeira vez apenas)
npm install

# 5. INICIE O SERVIDOR
npm start

# ✅ Você deve ver:
# [INFO] Serviço rodando na porta 4000
# [INFO] getPrestadores() iniciado
```

**AGORA teste:**
- Frontend (outro terminal): `npm run dev`
- Browser: http://localhost:5173

---

## 🎯 SOLUÇÃO #2: Nenhum Usuário Aparece (30% dos casos)

**Cenário**: Backend roda mas `/api/prestadores` retorna `items: []` vazio

### Passo 1: Verifique se arquivo existe
```PowerShell
# Tem que existir: .\server\service-account.json
ls server\service-account.json
```

❌ Se não existe:
1. Acesse: https://console.cloud.google.com/
2. Projeto: **saof-462713**
3. **Service Accounts** → **bot-telegram** → **Keys** → **Add Key** → **JSON**
4. Arquivo baixa, copie o conteúdo para: `server/service-account.json`

### Passo 2: Verifique a Planilha
1. Acesse: https://docs.google.com/spreadsheets/d/1EiSWfN5--3-fvHB3lc7tHG9Dls8qM5I61y_2ixx-rWI
2. Abra a aba **DADOS**
3. **Primeira linha** deve ter:
   ```
   CNPJ  |  SENHA  |  NOME  |  EMAIL  |  PRIMEIRO_ACESSO
   ```
4. **Segunda linha e adiante** devem ter dados como:
   ```
   12345678912345  |  123456  |  João Silva  |  joao@empresa.com  |  SIM
   ```

### Passo 3: Verifique o Compartilhamento
1. Na mesma planilha, clique **Compartilhar**
2. Procure por: `bot-telegram@saof-462713.iam.gserviceaccount.com`
3. Se não estiver lá:
   - Digite no campo de compartilhamento
   - Permissão: **Leitor**
   - Clique **Enviar**

### Passo 4: Teste Novamente
```PowerShell
# Com o servidor ainda rodando, abra outra PowerShell e execute:
curl http://localhost:4000/api/prestadores

# Deve retornar algo como:
# {"ok":true,"items":[{"cnpj":"12345678912345","senha":"123456","nome":"João Silva",...}]}
```

✅ Se tiver `items` com dados = PROBLEMA RESOLVIDO!

---

## 🎯 SOLUÇÃO #3: Login Falha mesmo com dados corretos (5% dos casos)

### Problema: Espaços ou Caracteres Especiais

**Exemplo Errado:**
```
CNPJ: " 12345678912345 "  (com espaços)
SENHA: " 123456 "  (com espaços)
```

**Correto:**
```
CNPJ: 12345678912345  (sem espaços)
SENHA: 123456  (sem espaços)
```

**Solução**: Na planilha Google Sheets, use `TRIM()`:
```
=TRIM(A2)  // Remove espaços antes e depois
=TRIM(B2)  // Remove espaços da senha
```

---

## 🎯 SOLUÇÃO #4: Em Produção (Render) Não Funciona (5% dos casos)

Se está em produção e `/api/prestadores` retorna erro:

### Passo 1: Verifique Secret File no Render
1. Acesse: https://dashboard.render.com
2. Seu serviço **SOAF-Mobile-Backend**
3. **Environment** → **Secret Files**
4. Deve ter: `/etc/secrets/service-account.json` com conteúdo JSON completo

### Passo 2: Verifique Environment Variables
No Render, vá a **Environment**:
```
SPREADSHEET_ID = 1EiSWfN5--3-fvHB3lc7tHG9Dls8qM5I61y_2ixx-rWI
ALLOWED_ORIGIN = https://soaf-mobile.web.app
GOOGLE_APPLICATION_CREDENTIALS = /etc/secrets/service-account.json
NODE_ENV = production
```

### Passo 3: Redeploy
1. Clique em **Logs** para ver erros
2. Clique em **Manual Deploy** (botão azul)
3. Aguarde compilar
4. Teste: https://soaf-mobile-backend.onrender.com/api/prestadores

---

## ❓ COMO SABER QUAL É O PROBLEMA?

Execute este script:
```PowerShell
# Na pasta raiz do projeto
.\DIAGNOSTICO.ps1
```

Ele testará tudo e mostrará exatamente qual é o problema!

---

## 📋 CHECKLIST RÁPIDO (1 minuto)

- [ ] Backend rodando? `npm start` na pasta `server`
- [ ] service-account.json existe em `server/`?
- [ ] Planilha tem aba `DADOS` com dados?
- [ ] Headers estão certos: CNPJ, SENHA, NOME, EMAIL, PRIMEIRO_ACESSO?
- [ ] Planilha compartilhada com `bot-telegram@...`?
- [ ] Teste `/api/prestadores` está retornando usuários?

✅ Se TODAS as caixas estão checkadas = DEVE FUNCIONAR!

---

## 🆘 SE AINDA NÃO FUNCIONAR

Procure pelos erros no console:

**No Server:**
```PowerShell
# Quando inicia, procure por:
[ERROR] Credenciais não encontradas  → SOLUÇÃO #2
[WARN] Nenhuma linha retornada       → Planilha vazia
[INFO] Headers: [...]                → Veja os nomes das colunas
```

**No Browser (F12 Console):**
```JavaScript
// Procure por:
"CNPJ não encontrado"                   → Usuário não está na planilha
"Resposta do backend inválida"          → Backend retornando erro
"Erro ao carregar prestadores"          → Backend offline
```

---

## 📞 RESUMO FINAL

| Erro | Causa | Solução |
|------|-------|--------|
| ERR_CONNECTION_REFUSED | Backend offline | `npm start` → `server/` |
| `items: []` vazio | Sem dados/sem acesso | SOLUÇÃO #2 (passo 1-3) |
| "CNPJ não encontrado" | Usuário não na planilha | Adicione na planilha |
| Login OK mas dados não aparecem | Abas vazias (ROTA DIA, etc) | Adicione dados nas outras abas |

---

Você conseguiu? 🎉

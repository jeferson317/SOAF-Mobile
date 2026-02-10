# Backend Node.js - KNM Telecom

API Express que acessa Google Sheets via service account para fornecer dados ao frontend.

## Desenvolvimento Local

### Pré-requisitos
- Node.js 16+
- Arquivo `service-account.json` (credenciais do Google)

### Instalação
```powershell
cd server
npm install
```

### Configuração
Crie `.env` com base no `.env.example`:
```
PORT=4000
SPREADSHEET_ID=16hFEaMWOagQ9rhIle9-Q4Jch08UQJXbzA4AdRV6HmJY
ALLOWED_ORIGIN=http://localhost:5173
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
```

### Executar
```powershell
node server.js
```

API estará em `http://localhost:4000`

## Endpoints

- `GET /api/health` - Health check
- `GET /api/prestadores` - Lista prestadores (aba DADOS)
- `GET /api/tarefas` - Ordens de serviço (aba ROTA DIA)
- `GET /api/relatorio` - Serviços executados (aba TOTAL DE SERVIÇOS)
- `GET /api/descontos` - Descontos (aba DESCONTOS)
- `GET /api/fechamento` - Fechamento (aba Fechamento Prestadores)

## Deploy

Veja instruções completas em `../README-DEPLOY.md`

### Render (recomendado)
1. Faça push do código para Git (sem `service-account.json`)
2. Crie Web Service no Render
3. Configure env vars
4. Faça upload do JSON via Secret Files

### Railway
Similar ao Render, mas usa Volumes para o JSON

## Segurança

- ⚠️ **NUNCA** commite `service-account.json` no Git
- ✅ Use `.gitignore` para excluir credenciais
- ✅ CORS restrito ao domínio do frontend
- ✅ API key do Google com escopo read-only

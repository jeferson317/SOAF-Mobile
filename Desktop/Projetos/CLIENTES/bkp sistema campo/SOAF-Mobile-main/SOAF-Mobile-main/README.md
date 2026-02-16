# 📦 SOAF Mobile - Sistema de Gestão de Prestadores

Sistema web para gerenciamento de ordens de serviço para prestadores da **SOAF Mobile**.

## 🚀 Tecnologias

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: Firebase Firestore
- **Integração**: Google Sheets API
- **Email**: Resend API

## 📋 Pré-requisitos

- Node.js 16+ instalado
- Conta Firebase configurada
- Planilha Google Sheets com permissões configuradas
- Service Account JSON do Google Cloud

## ⚙️ Configuração

### 1. Frontend

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente (copiar .env.example para .env)
# Editar .env com suas configurações

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

### 2. Backend (pasta server/)

```bash
cd server
npm install

# Adicionar arquivo service-account.json (credenciais Google Cloud)
# Configurar variáveis de ambiente no .env

npm start
```

## 🔐 Variáveis de Ambiente

### Frontend (.env)
```
VITE_API_URL=http://localhost:4000
```

### Backend (server/.env)
```
SPREADSHEET_ID=sua-planilha-id
RESEND_API_KEY=sua-chave-resend
ALLOWED_ORIGIN=https://seu-dominio.web.app
```

## 📊 Estrutura da Planilha Google Sheets

O sistema espera as seguintes abas:

- **DADOS**: Informações dos prestadores (CNPJ, senha, nome, email)
- **ROTA DIA**: Ordens de serviço do dia
- **TOTAL DE SERVIÇOS**: Relatório de serviços executados
- **DESCONTOS**: Descontos aplicados
- **Fechamento Prestadores**: Resumo financeiro

## 🎨 Personalização

Para personalizar para outro cliente:

1. Atualizar configurações Firebase em `src/App.jsx`
2. Adicionar logo em `public/soaf-logo.png`
3. Atualizar ID da planilha em `server/server.js`
4. Adicionar `service-account.json` na pasta `server/`

## 📱 Funcionalidades

- ✅ Login de prestadores via CNPJ
- ✅ Visualização de ordens de serviço do dia
- ✅ Aceite/Rejeição de agenda com envio de email
- ✅ Relatório de serviços executados
- ✅ Visualização de descontos
- ✅ Fechamento financeiro
- ✅ Integração com Google Maps
- ✅ Links para WhatsApp

## 🚀 Deploy

### Firebase Hosting (Frontend)
```bash
npm run build
firebase deploy --only hosting
```

### Render.com (Backend)
- Configure as variáveis de ambiente no painel Render
- Adicione o `service-account.json` como secret file
- Deploy automático via Git

## 📄 Licença

Desenvolvido para SOAF Mobile © 2025

## 👨‍💻 Autor

Jeferson Santos

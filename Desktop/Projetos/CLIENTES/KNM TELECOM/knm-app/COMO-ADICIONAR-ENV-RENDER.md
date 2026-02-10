# Como Adicionar Variável de Ambiente no Render

## Passo a Passo com Imagens de Referência

### 1. Acesse o Dashboard do Render
- Vá em: https://dashboard.render.com
- Faça login na sua conta

### 2. Selecione seu Serviço
- Clique no serviço **knm-backend** (ou nome que você deu)
- Você verá a página com informações do serviço

### 3. Localize a Seção "Environment"
- Na barra lateral esquerda, procure por:
  - **Environment Variables** ou
  - **Environment** ou
  - Ícone de engrenagem/settings
- Se não encontrar na lateral, olhe nas abas superiores:
  - Settings → Environment

### 4. Adicionar Nova Variável
- Clique no botão **"Add Environment Variable"** ou **"+ Add Variable"**
- Preencha:
  - **Key (Nome):** `RESEND_API_KEY`
  - **Value (Valor):** `re_RaX3TyWa_P5Wa5fVTJkfTZm5AtnAUkH8A`
- Clique em **"Save"** ou **"Save Changes"**

### 5. Deploy Automático
- O Render vai reiniciar o serviço automaticamente
- Aguarde 1-2 minutos

### 6. Testar
Acesse: https://knm-backend-ye2f.onrender.com/api/teste-email

Deve retornar:
```json
{
  "ok": true,
  "message": "Email de teste enviado com sucesso!",
  "emailId": "...",
  "destinatario": "soaf.dados@gmail.com"
}
```

---

## Alternativa: Via Arquivo render.yaml

Se preferir, pode criar o arquivo `render.yaml` na raiz do projeto:

```yaml
services:
  - type: web
    name: knm-backend
    env: node
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: RESEND_API_KEY
        value: re_RaX3TyWa_P5Wa5fVTJkfTZm5AtnAUkH8A
      - key: ALLOWED_ORIGIN
        value: https://knm-telecom.web.app
      - key: SPREADSHEET_ID
        value: 16hFEaMWOagQ9rhIle9-Q4Jch08UQJXbzA4AdRV6HmJY
```

Então faça commit e push. O Render detectará e aplicará automaticamente.

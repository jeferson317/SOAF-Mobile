# Configuração do Resend para Envio de Emails

O sistema agora usa **Resend** (https://resend.com) para envio de emails via API HTTP, pois o Render bloqueia portas SMTP.

## Passo 1: Criar conta no Resend

1. Acesse: https://resend.com
2. Clique em **"Sign Up"**
3. Crie sua conta (gratuita - 100 emails/dia)

## Passo 2: Obter API Key

1. Após login, vá em **API Keys** no menu
2. Clique em **"Create API Key"**
3. Dê um nome: `knm-backend`
4. Copie a chave que aparece (começa com `re_...`)

## Passo 3: Configurar no Render

1. Acesse: https://dashboard.render.com
2. Vá no seu serviço `knm-backend`
3. Clique na aba **"Environment"**
4. Clique em **"Add Environment Variable"**
5. Adicione:
   - **Key:** `RESEND_API_KEY`
   - **Value:** Cole a API key do Resend (ex: `re_123abc...`)
6. Clique em **"Save Changes"**

O Render vai fazer redeploy automático.

## Passo 4: Testar

Aguarde 1-2 minutos após salvar e teste:

**Endpoint de teste:**
```
https://knm-backend-ye2f.onrender.com/api/teste-email
```

Deve retornar:
```json
{
  "ok": true,
  "message": "Email de teste enviado com sucesso!",
  "emailId": "..."
}
```

## Email Remetente

Por padrão, o Resend usa `onboarding@resend.dev` como remetente (domínio verificado).

Para usar seu próprio domínio:
1. No Resend, vá em **"Domains"**
2. Adicione seu domínio
3. Configure os registros DNS conforme instruções
4. Atualize o código em `server.js` de:
   ```javascript
   from: 'KNM Telecom <onboarding@resend.dev>'
   ```
   Para:
   ```javascript
   from: 'KNM Telecom <noreply@seudominio.com>'
   ```

## Limites do Plano Gratuito

- ✅ 100 emails/dia
- ✅ 3.000 emails/mês
- ✅ API ilimitada
- ✅ Domínio verificado incluído

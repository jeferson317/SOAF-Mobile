# ✅ CHECKLIST IMPRIMÍVEL - SOAF Mobile

## DATA: _____ / _____ / _____     RESPONSÁVEL: _____________________

---

## 📋 FASE 1: PREPARAÇÃO DO SERVIDOR

### 1.1 Arquivo de Credenciais Google
- [ ] Arquivo `server/service-account.json` existe?
- [ ] Conteúdo é um JSON válido?
- [ ] Contém "type": "service_account"?
- [ ] Contém "private_key"?

**Status**: ☐ OK  ☐ ERRO   Data: ________   Responsável: ____________

---

### 1.2 Dependências Node.js
- [ ] Execute: `cd server && npm install` (une vez)
- [ ] Verifique se pasta `server/node_modules` foi criada
- [ ] Execute: `npm start` na pasta server

**Resultado esperado**: "[INFO] Serviço rodando na porta 4000"

**Status**: ☐ OK  ☐ ERRO   Data: ________   Responsável: ____________

---

### 1.3 Teste do Backend
Acesse: http://localhost:4000/

Resultado esperado:
```json
{
  "status": "online"
}
```

**Status**: ☐ OK  ☐ ERRO   Data: ________   Responsável: ____________

---

## 📊 FASE 2: GOOGLE SHEETS SETUP

### 2.1 Planilha Criada/Localizada
- [ ] Planilha ID: `1EiSWfN5--3-fvHB3lc7tHG9Dls8qM5I61y_2ixx-rWI`
- [ ] URL: https://docs.google.com/spreadsheets/d/1EiSWfN5--3-fvHB3lc7tHG9Dls8qM5I61y_2ixx-rWI
- [ ] Consegue acessar e editar?

**Status**: ☐ SIM  ☐ NÃO   Data: ________   Responsável: ____________

---

### 2.2 Compartilhamento com Service Account
- [ ] Abra Planilha → Clique "Compartilhar"
- [ ] Adicione email: `bot-telegram@saof-462713.iam.gserviceaccount.com`
- [ ] Permissão: "Leitor" (Reader)
- [ ] Email aparece na lista de compartilhados?

**Status**: ☐ COMPARTILHADO  ☐ FALTA FAZER   Data: ________   Responsável: ____________

---

### 2.3 Estrutura de Abas
Verifique que existem estas abas (veja no final inferior da planilha):

| Aba | Existe | Notas |
|-----|--------|-------|
| DADOS | ☐ | Dados de login dos prestadores |
| ROTA DIA | ☐ | Ordens de serviço |
| TOTAL DE SERVIÇOS | ☐ | Relatório de serviços |
| DESCONTOS | ☐ | Descontos por prestador |
| Fechamento Prestadores | ☐ | Fechamento financeiro |
| LOGS | ☐ | Logs de acesso do sistema |

**Status**: ☐ TUDO OK  ☐ FALTAM ABAS   Data: ________   Responsável: ____________

---

### 2.4 Colunas da Aba "DADOS" (CRÍTICO!)

**Primeira linha deve ter EXATAMENTE:**
```
CNPJ | SENHA | NOME | EMAIL | PRIMEIRO_ACESSO | CPF
```

- [ ] CNPJ (coluna A)
- [ ] SENHA (coluna B)
- [ ] NOME (coluna C)
- [ ] EMAIL (coluna D)
- [ ] PRIMEIRO_ACESSO (coluna E)
- [ ] CPF (coluna F)

**Status**: ☐ TODAS PRESENTES  ☐ FALTAM COLUNAS   Data: ________   Responsável: ____________

---

### 2.5 Dados de Usuários (Teste)

Adicione PELO MENOS 1 linha de teste:

| CNPJ | SENHA | NOME | EMAIL | PRIMEIRO_ACESSO | CPF |
|------|-------|------|-------|---|---|
| 12345678912345 | 123456 | João Silva | joao@empresa.com | SIM | 12345678901 |

- [ ] Dados adicionados na linha 2?
- [ ] Não tem espaços extras no início/fim?
- [ ] CNPJ tem 14 dígitos?
- [ ] SENHA tem um valor?

**Status**: ☐ DADOS ADICIONADOS  ☐ FALTA FAZER   Data: ________   Responsável: ____________

---

## 🔌 FASE 3: TESTES DE CONECTIVIDADE

### 3.1 Teste Backend → Google Sheets

Abra terminal e execute:

```bash
curl http://localhost:4000/api/prestadores
```

**Resultado esperado:**
```json
{
  "ok": true,
  "items": [
    {
      "cnpj": "12345678912345",
      "senha": "123456",
      "nome": "João Silva",
      ...
    }
  ]
}
```

- [ ] Retorna `ok: true`?
- [ ] Retorna `items` com dados?
- [ ] Não retorna erro?

**Status**: ☐ OK  ☐ ERRO   Erro: _________________   Data: ________

---

### 3.2 Teste Frontend

Abra outro terminal e execute:

```bash
npm run dev
```

- [ ] Frontend inicia?
- [ ] Acessa http://localhost:5173?
- [ ] Vê tela de login?

**Status**: ☐ OK  ☐ ERRO   Data: ________   Responsável: ____________

---

## 🔐 FASE 4: TESTE DE LOGIN

### 4.1 Teste Manual de Login

1. Abra: http://localhost:5173
2. CNPJ: 12345678912345
3. SENHA: 123456
4. Clique "Entrar"

- [ ] Login foi aceito?
- [ ] Redirecionou para dashboard?
- [ ] Vê as abas (Roteiros, Relatório, Descontos)?

**Status**: ☐ FUNCIONA  ☐ ERRO   Erro: _________________

---

### 4.2 Teste com Erro Proposital

1. CNPJ: 99999999999999 (não existe)
2. SENHA: qualquer coisa
3. Clique "Entrar"

- [ ] Mostra erro "CNPJ não encontrado"?

**Status**: ☐ FUNCIONA  ☐ NÃO MOSTRA ERRO

---

### 4.3 Teste com Senha Errada

1. CNPJ: 12345678912345
2. SENHA: 999999 (errada)
3. Clique "Entrar"

- [ ] Mostra erro "Senha incorreta"?
- [ ] Permite até 3 tentativas?

**Status**: ☐ FUNCIONA  ☐ ERRO

---

## 🚀 FASE 5: PRODUÇÃO (SE APLICÁVEL)

### 5.1 Deploy no Render

- [ ] GitHub repo atualizado com código?
- [ ] Render acesso configurado?
- [ ] Environment variables configuradas?

**Status**: ☐ OK  ☐ FALTA FAZER   Data: ________   Responsável: ____________

---

### 5.2 Variáveis de Ambiente no Render

Vá em: https://dashboard.render.com → Seu Serviço → Environment

- [ ] `SPREADSHEET_ID` = `1EiSWfN5--3-fvHB3lc7tHG9Dls8qM5I61y_2ixx-rWI`
- [ ] `ALLOWED_ORIGIN` = `https://soaf-mobile.web.app`
- [ ] `GOOGLE_APPLICATION_CREDENTIALS` = `/etc/secrets/service-account.json`
- [ ] `NODE_ENV` = `production`

**Status**: ☐ TODAS CONFIGURADAS  ☐ FALTAM   Data: ________

---

### 5.3 Secret File no Render

Vá em: https://dashboard.render.com → Seu Serviço → Secret Files

- [ ] Filename: `/etc/secrets/service-account.json` existe?
- [ ] Conteúdo é o JSON completo (não parcial)?

**Status**: ☐ CONFIGURADO  ☐ FALTA FAZER   Data: ________

---

### 5.4 Deploy Manual

1. Vá em: https://dashboard.render.com → Seu Serviço
2. Clique em "Deploy" (botão azul)
3. Aguarde compilar

- [ ] Deploy foi bem-sucedido?
- [ ] Sem erro 500?
- [ ] Backend respondendo?

**Status**: ☐ OK  ☐ ERRO   Data: ________   Responsável: ____________

---

## 📝 RESUMO FINAL

### Tudo Verde ✅?

| Fase | Status | Observações |
|------|--------|---|
| 1. Servidor | ☐ OK  ☐ ERRO | _________________ |
| 2. Google Sheets | ☐ OK  ☐ ERRO | _________________ |
| 3. Conectividade | ☐ OK  ☐ ERRO | _________________ |
| 4. Login | ☐ OK  ☐ ERRO | _________________ |
| 5. Produção | ☐ N/A  ☐ OK  ☐ ERRO | _________________ |

---

### Próximos Passos

- [ ] Se TUDO está OK: Sistema pronto para usar!
- [ ] Se tem ERROS: Leia `DIAGNOSTICO-USUARIOS.md` que corresponde ao erro
- [ ] Se resolver problema: Re-execute checklist para validar

---

## 📞 CONTATOS E REFERÊNCIAS

**Documentos de Ajuda:**
- `QUICKFIX.md` - Soluções rápidas (5 min)
- `DIAGNOSTICO-USUARIOS.md` - Guia completo de diagnóstico
- `COMO-FUNCIONA.md` - Explicação técnica do fluxo
- `DIAGNOSTICO.ps1` - Script automático de testes

**Planilha Google Sheets:**
https://docs.google.com/spreadsheets/d/1EiSWfN5--3-fvHB3lc7tHG9Dls8qM5I61y_2ixx-rWI

**Render Dashboard:**
https://dashboard.render.com

**Google Cloud Console:**
https://console.cloud.google.com/ (Projeto: saof-462713)

---

## 🎯 ASSINATURA DE CONCLUSÃO

Checklist completado por: _____________________________

Data: _____ / _____ / _____     Hora: _____ : _____

Situação:
- [ ] Sistema 100% operacional
- [ ] Problemas diagnosticados → Aguardando solução
- [ ] Problemas resolvidos → Validação pendente

Observações finais:
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

**Imprima este checklist e mantenha como comprovação!**

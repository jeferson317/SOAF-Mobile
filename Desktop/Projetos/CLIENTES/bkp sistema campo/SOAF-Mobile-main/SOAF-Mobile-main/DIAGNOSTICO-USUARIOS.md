# 🔍 DIAGNÓSTICO COMPLETO - Sistema Não Encontra Usuários

## ❌ PROBLEMA: O sistema não está encontrando usuários na planilha

---

## 📋 CHECKLIST DE VERIFICAÇÃO (Faça TODOS os testes)

### ✅ PASSO 1: Verificar o Backend Está Rodando

#### 1.1 Se está em LOCAL:
```PowerShell
# No terminal, na pasta principal do projeto:
cd server
npm install
npm start
```

**Resultado esperado**: Você verá algo como:
```
[INFO] Serviço rodando na porta 4000
[INFO] getPrestadores() iniciado
```

#### 1.2 Se está em PRODUÇÃO (Render):
Acesse: **https://soaf-mobile-backend.onrender.com/**

Deve retornar um JSON assim:
```json
{
  "status": "online"
}
```

❌ **Se não funcionar**: O backend não está rodando. Vá para a seção **SOLUÇÃO 1** abaixo.

---

### ✅ PASSO 2: Verificar Conexão com Google Sheets

#### 2.1 Verificar Arquivo de Credenciais

**LOCAL:**
```PowerShell
# Verifique se EXISTS o arquivo:
ls server/service-account.json
```

Deve existir um arquivo JSON com este conteúdo estruture:
```json
{
  "type": "service_account",
  "project_id": "saof-462713",
  "client_email": "bot-telegram@saof-462713.iam.gserviceaccount.com",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
}
```

❌ **Se não existe**: Vá para **SOLUÇÃO 2** abaixo.

#### 2.2 Verificar Compartilhamento da Planilha

1. Acesse: https://docs.google.com/spreadsheets/d/1EiSWfN5--3-fvHB3lc7tHG9Dls8qM5I61y_2ixx-rWI
2. Clique em **Compartilhar** (botão superior direito)
3. Procure por este email: **bot-telegram@saof-462713.iam.gserviceaccount.com**

❌ **Se não encontrar este email**: Vá para **SOLUÇÃO 3** abaixo.

---

### ✅ PASSO 3: Verificar Estrutura da Planilha

#### 3.1 Verifique as Abas Existentes

Na planilha, você deve ter essas ABAS (no final inferior):
- ✅ **DADOS** - com login dos usuários
- ✅ **ROTA DIA** - com tarefas
- ✅ **TOTAL DE SERVIÇOS** - com relatório
- ✅ **DESCONTOS** - com descontos
- ✅ **Fechamento Prestadores** - com fechamento
- ✅ **LOGS** - para salvar logs de acesso

#### 3.2 Verifique as COLUNAS da Aba "DADOS" (CRÍTICO!)

A primeira linha (header) deve ter EXATAMENTE estes nomes:

```
CNPJ | SENHA | NOME | EMAIL | PRIMEIRO_ACESSO | CPF | (outras colunas opcionais...)
```

**Variações Aceitas** (com espaços/underscore):
- `primeiro_acesso` ou `primeiro acesso` ou `PRIMEIRO ACESSO` ✅
- `cpf` ou `CPF` ✅
- `cnpj` ou `CNPJ` ✅
- `senha` ou `SENHA` ✅

❌ **PROBLEMA COMUM**: As colunas têm NOMES DIFERENTES!  
Por exemplo: `CPF PRESTADOR` ao invés de `CPF`  
ou `USUARIO CNPJ` ao invés de `CNPJ`

#### 3.3 Verifique se há DADOS nas Linhas

Exemplo correto:
```
Linha 1 (Headers):  CNPJ          SENHA    NOME         EMAIL              PRIMEIRO_ACESSO  CPF
Linha 2 (Dados):    12345678912345 123456  João Silva   joao@empresa.com   SIM              12345678901
Linha 3:            98765432109876 654321  Maria Santos maria@empresa.com  NÃO              98765432109
```

❌ **Se não houver dados**: Vá para **SOLUÇÃO 4** abaixo.

---

### ✅ PASSO 4: Teste o Endpoint Directly

#### 4.1 Abra o navegador ou Postman e acesse:

**LOCAL:**
```
http://localhost:4000/api/prestadores
```

**PRODUÇÃO:**
```
https://soaf-mobile-backend.onrender.com/api/prestadores
```

#### 4.2 Verifique a Resposta

✅ **Resposta CORRETA (com dados):**
```json
{
  "ok": true,
  "items": [
    {
      "cnpj": "12345678912345",
      "senha": "123456",
      "nome": "João Silva",
      "email": "joao@empresa.com",
      "primeiro_acesso": "SIM",
      "cpf": "12345678901"
    },
    {
      "cnpj": "98765432109876",
      "senha": "654321",
      "nome": "Maria Santos",
      "email": "maria@empresa.com",
      "primeiro_acesso": "NÃO",
      "cpf": "98765432109"
    }
  ]
}
```

❌ **Resposta VAZIA (sem dados):**
```json
{
  "ok": true,
  "items": []
}
```

❌ **Resposta COM ERRO:**
```json
{
  "ok": false,
  "error": "Credenciais do service account não encontradas"
}
```

---

## 🔧 SOLUÇÕES ESPECÍFICAS

### SOLUÇÃO 1: Backend Não Está Rodando

**Testando LOCAL:**

```PowerShell
# 1. Vá para a pasta do servidor
cd server

# 2. Instale as dependências
npm install

# 3. Defina as variáveis de ambiente (se necessário)
# Crie um arquivo .env na pasta server/ com:
PORT=4000
SPREADSHEET_ID=1EiSWfN5--3-fvHB3lc7tHG9Dls8qM5I61y_2ixx-rWI

# 4. Inicie o servidor
npm start

# 5. Teste se voltou de pé
# Acesse: http://localhost:4000/
```

**Testando em PRODUÇÃO (Render):**

1. Vá para https://dashboard.render.com
2. Selecione seu serviço **SOAF-Mobile**
3. Clique em **Logs** no topo
4. Procure por erros críticos
5. Se houver erro, tente fazer **Manual Deploy** (botão azul "Deploy commit")

---

### SOLUÇÃO 2: Arquivo service-account.json Não Existe

**Como obter:**

1. Acesse: https://console.cloud.google.com/
2. Projeto: **saof-462713**
3. Menu → **Service Accounts**
4. Clique em: **bot-telegram@saof-462713.iam.gserviceaccount.com**
5. Aba: **Keys**
6. Clique em **Add Key** → **Create new key** → **JSON**
7. Um arquivo JSON será baixado
8. Cole o conteúdo COMPLETO aqui: `server/service-account.json`

**Se em PRODUÇÃO (Render):**

1. Vá para https://dashboard.render.com
2. Seu serviço **SOAF-Mobile-Backend**
3. **Environment** → **Secret Files**
4. Clique em **Add Secret File**
5. **Filename**: `/etc/secrets/service-account.json`
6. **Contents**: Cole o JSON COMPLETO
7. Clique **Save Changes**

---

### SOLUÇÃO 3: Planilha Não Compartilhada

**A planilha precisa ser compartilhada com o service account:**

1. Acesse: https://docs.google.com/spreadsheets/d/1EiSWfN5--3-fvHB3lc7tHG9Dls8qM5I61y_2ixx-rWI
2. Clique em **Compartilhar** (canto superior direito)
3. No campo, digite: **bot-telegram@saof-462713.iam.gserviceaccount.com**
4. Permissão: **Leitor** (não precisa de editor)
5. Clique **Enviar**

**Resultado:**
O email aparecerá na lista de compartilhamento.

---

### SOLUÇÃO 4: Planilha DADOS Não Tem Usuários

**Adicione dados manualmente:**

1. Abra: https://docs.google.com/spreadsheets/d/1EiSWfN5--3-fvHB3lc7tHG9Dls8qM5I61y_2ixx-rWI
2. Vá para a aba: **DADOS**
3. Na **Linha 1**, certifique-se que tem os headers (copie se não tiver):
   ```
   CNPJ | SENHA | NOME | EMAIL | PRIMEIRO_ACESSO | CPF
   ```
4. Na **Linha 2** em diante, adicione os usuários:
   ```
   12345678912345 | 123456 | João Silva | joao@empresa.com | SIM | 12345678901
   98765432109876 | 654321 | Maria Santos | maria@empresa.com | NÃO | 98765432109
   ```

**Formatos Necessários:**
- CNPJ: 14 dígitos sem caracteres especiais
- SENHA: Qualquer string (números ou letras)
- NOME: Texto livre
- EMAIL: Formato email
- PRIMEIRO_ACESSO: `SIM`, `S`, `1` (para sim) ou qualquer outro valor (para não)
- CPF: 11 dígitos (será validado depois)

---

## 🧪 TESTE COMPLETO DO SISTEMA

Depois de fazer as soluções acima, execute este teste:

### Teste 1: Endpoint de Prestadores
```
http://localhost:4000/api/prestadores
```
Deve retornar com `items` contendo seus usuários.

### Teste 2: Validação de CPF (Opcional)
```
POST http://localhost:4000/api/validar-cpf

Body:
{
  "cnpj": "12345678912345",
  "cpf": "12345678901"
}
```

✅ Resposta esperada:
```json
{
  "ok": true,
  "valid": true
}
```

### Teste 3: Tente Fazer Login no App

1. Acesse: http://localhost:5173 (ou produção)
2. CNPJ: `12345678912345`
3. Senha: `123456`
4. Clique **Entrar**

✅ Deve entrar no dashboard!

---

## 📊 MATRIZ DE DIAGNÓSTICO RÁPIDO

| Sintoma | Causa Provável | Solução |
|---------|---|---|
| Erro: "CNPJ não encontrado" | {items: []} vazio no endpoint | SOLUÇÃO 4 |
| Erro: "Credenciais não encontradas" | service-account.json falta | SOLUÇÃO 2 |
| Erro 404 no endpoint | Backend não está rodando | SOLUÇÃO 1 |
| Erro de permissão no Google | Planilha não compartilhada | SOLUÇÃO 3 |
| Login falha mesmo com dados certos | Espaços/formatação nos dados | Remov espaços extras |
| Senha aparece como "undefined" | Coluna SENHA vazia/sem nome | Verificar header exato |

---

## 📞 PRÓXIMOS PASSOS

1. ✅ Execute cada PASSO acima
2. ✅ Siga a SOLUÇÃO correspondente ao seu erro
3. ✅ Teste o endpoint `/api/prestadores` novamente
4. ✅ Tente fazer login no app

Se continuar com problemas, **capture o erro exato** do console do navegador (F12) ou do servidor e compartilhe comigo!

---

## 🐛 CHECAGEM FINAL DE COLUNAS

Se ainda tiver dúvida sobre os nomes das colunas, execute isto no servidor:

**No console após `npm start`**, você verá:
```
[INFO] Headers (colunas): ['cnpj', 'senha', 'nome', 'email', 'primeiro_acesso', 'cpf']
```

Certifique-se que seus headers na planilha CORRESPONDEM a isso (case-insensitive, mas sempre com as mesmas palavras).

---

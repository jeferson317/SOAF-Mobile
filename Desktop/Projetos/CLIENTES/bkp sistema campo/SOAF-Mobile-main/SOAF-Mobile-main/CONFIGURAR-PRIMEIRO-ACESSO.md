# 🔐 Configuração de Primeiro Acesso

## Funcionalidade

O sistema agora possui um fluxo de **troca de senha obrigatória no primeiro acesso**. Quando um prestador faz login pela primeira vez, ele é obrigado a:

1. Validar sua identidade com o **CPF** cadastrado
2. Criar uma **nova senha** (mínimo 4 caracteres)
3. Confirmar a nova senha

Após a troca bem-sucedida, o sistema marca automaticamente que o primeiro acesso foi concluído.

---

## 📋 Como Configurar a Planilha DADOS

Para ativar o primeiro acesso, você precisa adicionar uma coluna na aba **DADOS** da planilha Google Sheets.

### Passo 1: Adicionar coluna PRIMEIRO_ACESSO

1. Abra a planilha: https://docs.google.com/spreadsheets/d/1EiSWfN5--3-fvHB3lc7tHG9Dls8qM5I61y_2ixx-rWI
2. Vá para a aba **DADOS**
3. Adicione uma nova coluna com o nome: **PRIMEIRO_ACESSO** (ou **primeiro acesso**)
4. Para cada prestador que deve trocar a senha no primeiro login, preencha com: **SIM**
5. Deixe vazio ou preencha com **NAO** para prestadores que já trocaram a senha

### Estrutura da Planilha DADOS

A planilha deve ter as seguintes colunas (nomes não são case-sensitive):

| CNPJ | CPF | SENHA | NOME | EMAIL | PRIMEIRO_ACESSO |
|------|-----|-------|------|-------|-----------------|
| 12345678000190 | 12345678901 | senhaTemporaria123 | João Silva | joao@email.com | SIM |
| 98765432000100 | 98765432109 | senha456 | Maria Santos | maria@email.com | NAO |

### Valores aceitos para PRIMEIRO_ACESSO:

- **SIM** ou **S** ou **1** → Força troca de senha no próximo login
- **NAO** ou **N** ou **0** ou vazio → Acesso normal

---

## 🔄 Como Funciona

### 1. Login Normal
- Prestador digita CNPJ e senha
- Sistema valida credenciais

### 2. Verificação de Primeiro Acesso
- Se `PRIMEIRO_ACESSO = SIM`:
  - Redireciona para tela de troca de senha
  - Solicita CPF para validação de identidade
  - Solicita nova senha (mínimo 4 caracteres)
  - Solicita confirmação da nova senha

### 3. Validação de CPF
- Sistema busca o CPF cadastrado na planilha para o CNPJ do prestador
- Compara CPF digitado com CPF cadastrado
- Se não corresponder, bloqueia a troca de senha

### 4. Atualização da Senha
- Sistema atualiza a senha na planilha
- Marca `PRIMEIRO_ACESSO = NAO` automaticamente
- Redireciona para o dashboard

---

## 🔒 Segurança

### Por que validar CPF?

A validação de CPF garante que apenas o **legítimo proprietário** da conta pode alterar a senha, mesmo que alguém tenha acesso à senha temporária.

### Benefícios:

- ✅ Impede que terceiros alterem senhas usando credenciais temporárias
- ✅ Adiciona camada extra de segurança
- ✅ Confirma identidade do prestador
- ✅ Auditável via logs de acesso

---

## 🧪 Como Testar

### 1. Preparar Prestador de Teste

Na planilha DADOS, configure um prestador:

```
CNPJ: 12345678000190
CPF: 12345678901
SENHA: teste123
PRIMEIRO_ACESSO: SIM
```

### 2. Fazer Login

- Acesse: https://soaf-mobile.web.app
- Digite CNPJ: 12345678000190
- Digite Senha: teste123

### 3. Tela de Troca de Senha

- Digite CPF: 12345678901
- Digite Nova Senha: minhasenha456
- Confirme: minhasenha456
- Clique em "Atualizar Senha"

### 4. Verificar Atualização

- Volte para a planilha DADOS
- Confirme que `SENHA` mudou para: minhasenha456
- Confirme que `PRIMEIRO_ACESSO` mudou para: NAO

---

## ⚠️ Observações Importantes

### Permissões da Planilha

O service account **bot-telegram@saof-462713.iam.gserviceaccount.com** precisa ter permissão de **Editor** (não apenas Leitor) para poder atualizar a senha e o flag de primeiro acesso.

### CPF Obrigatório

Todos os prestadores devem ter CPF cadastrado na planilha para poder trocar a senha. Se o CPF não estiver cadastrado, a troca de senha falhará.

### Normalização de Dados

- CNPJ: Sistema remove automaticamente pontos, barras e hífens
- CPF: Sistema remove automaticamente pontos e hífens
- Senhas: Case-sensitive (diferencia maiúsculas de minúsculas)

---

## 🐛 Troubleshooting

### "CPF não corresponde ao cadastrado"

- Verifique se o CPF está correto na planilha (coluna CPF)
- Certifique-se de digitar apenas números (sem pontos ou hífens)

### "Erro ao atualizar senha"

- Verifique se o service account tem permissão de **Editor** na planilha
- Confirme que a coluna PRIMEIRO_ACESSO existe na planilha
- Verifique logs do servidor: https://dashboard.render.com

### Prestador não é forçado a trocar senha

- Verifique se `PRIMEIRO_ACESSO = SIM` na planilha
- Certifique-se de que o CNPJ está correto
- Tente fazer logout e login novamente

---

## 📝 Logs

Todas as operações são registradas no backend e podem ser visualizadas em:

- **Console do Render**: https://dashboard.render.com/web/srv-YOUR-SERVICE/logs
- **Aba LOGS da planilha** (se configurada)

Busque por:
- `[VALIDAR-CPF]` - Validação de CPF
- `[ATUALIZAR-SENHA]` - Atualização de senha
- `[INFO] updatePrestadorData()` - Escrita na planilha

---

## 🚀 Deploy Realizado

- ✅ Backend atualizado com endpoints de validação
- ✅ Frontend atualizado com tela de troca de senha
- ✅ Função de escrita na planilha implementada
- ✅ Validação de CPF implementada
- ✅ Detecção automática de primeiro acesso

**Desenvolvido para SOAF Mobile** 🔧

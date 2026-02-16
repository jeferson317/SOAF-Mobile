# 🚀 Comandos para Publicar no GitHub

## Repositório já configurado:
✅ https://github.com/jeferson317/SOAF-Mobile.git

## Para fazer o primeiro push:

```powershell
cd "c:\Users\Microsoft\Desktop\Projetos\SISTEMA NOVO\APP CAMPO\APP CAMPO"

# Push para o repositório remoto
git push -u origin main
```

## ⚠️ ANTES DE FAZER O PUSH:

### 1. Adicione o logo SOAF Mobile:
- Salve a imagem como `public/soaf-logo.png`

### 2. NÃO commite arquivos sensíveis:
- ❌ `server/service-account.json` (já está no .gitignore)
- ❌ `.env` e `.env.production` (já está no .gitignore)

### 3. Depois de adicionar o logo:
```powershell
git add public/soaf-logo.png
git commit -m "🎨 Adicionar logo SOAF Mobile"
git push
```

## 📦 Estrutura de Commits Atual:

1. ✅ Configuração inicial SOAF Mobile
2. ✅ Correção da pasta server
3. ✅ README completo

## 🔄 Para atualizações futuras:

```powershell
# Ver status
git status

# Adicionar alterações
git add .

# Commitar
git commit -m "Descrição das mudanças"

# Enviar para GitHub
git push
```

## 📝 Notas Importantes:

- **Branch principal**: main
- **Remote**: origin (https://github.com/jeferson317/SOAF-Mobile.git)
- **Arquivos protegidos**: service-account.json, .env* (não serão commitados)

---

**Pronto para push!** Execute o comando quando estiver pronto. 🎉

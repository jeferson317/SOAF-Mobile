# Script de Diagnóstico Automático - SOAF Mobile
# Execute: .\DIAGNOSTICO.ps1

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🔍 DIAGNÓSTICO AUTOMÁTICO - Sistema Não Encontra Usuários    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Cores para output
$successColor = "Green"
$errorColor = "Red"
$infoColor = "Blue"
$warningColor = "Yellow"

# Resultados
$issues = @()
$passed = @()

# ============================================================================
# TESTE 1: Arquivo de Credenciais
# ============================================================================
Write-Host "📋 TESTE 1: Arquivo service-account.json" -ForegroundColor $infoColor
Write-Host "-" * 60

if (Test-Path "server/service-account.json") {
    Write-Host "✅ Arquivo ENCONTRADO" -ForegroundColor $successColor
    
    try {
        $json = Get-Content "server/service-account.json" -Raw | ConvertFrom-Json
        Write-Host "   • project_id: $($json.project_id)" -ForegroundColor $infoColor
        Write-Host "   • client_email: $($json.client_email)" -ForegroundColor $infoColor
        
        if ($json.private_key) {
            Write-Host "   ✅ private_key presente" -ForegroundColor $successColor
            $passed += "Arquivo service-account.json válido"
        } else {
            $issues += "❌ ERRO: Arquivo service-account.json não tem 'private_key'"
        }
    } catch {
        $issues += "❌ ERRO: Arquivo service-account.json não é JSON válido"
        Write-Host "        Erro: $_" -ForegroundColor $errorColor
    }
} else {
    $issues += "❌ ERRO: Arquivo 'server/service-account.json' NÃO ENCONTRADO"
    Write-Host "❌ Arquivo NÃO ENCONTRADO" -ForegroundColor $errorColor
}

Write-Host ""

# ============================================================================
# TESTE 2: Variáveis de Ambiente
# ============================================================================
Write-Host "🔧 TESTE 2: Variáveis de Ambiente" -ForegroundColor $infoColor
Write-Host "-" * 60

$spreadsheetId = $env:SPREADSHEET_ID
$allowedOrigin = $env:ALLOWED_ORIGIN
$nodeEnv = $env:NODE_ENV

if ($spreadsheetId) {
    Write-Host "✅ SPREADSHEET_ID configurada" -ForegroundColor $successColor
    Write-Host "   Valor: $spreadsheetId" -ForegroundColor $infoColor
    $passed += "SPREADSHEET_ID configurada"
} else {
    Write-Host "⚠️  SPREADSHEET_ID não configurada (usando padrão)" -ForegroundColor $warningColor
}

if ($allowedOrigin) {
    Write-Host "✅ ALLOWED_ORIGIN configurada" -ForegroundColor $successColor
    Write-Host "   Valor: $allowedOrigin" -ForegroundColor $infoColor
    $passed += "ALLOWED_ORIGIN configurada"
} else {
    Write-Host "⚠️  ALLOWED_ORIGIN não configurada (usando padrão)" -ForegroundColor $warningColor
}

Write-Host "   NODE_ENV: $($nodeEnv ?? 'não configurada')" -ForegroundColor $infoColor

Write-Host ""

# ============================================================================
# TESTE 3: Dependências Instaladas
# ============================================================================
Write-Host "📦 TESTE 3: Dependências npm" -ForegroundColor $infoColor
Write-Host "-" * 60

if (Test-Path "server/node_modules") {
    Write-Host "✅ node_modules (server) EXISTE" -ForegroundColor $successColor
    $passed += "Dependências do servidor instaladas"
} else {
    $issues += "⚠️  AVISO: node_modules (server) não existe - Execute: cd server && npm install"
    Write-Host "❌ node_modules (server) NÃO EXISTE" -ForegroundColor $warningColor
    Write-Host "   Solução: Execute na pasta 'server': npm install" -ForegroundColor $infoColor
}

if (Test-Path "node_modules") {
    Write-Host "✅ node_modules (frontend) EXISTE" -ForegroundColor $successColor
    $passed += "Dependências do frontend instaladas"
} else {
    $issues += "⚠️  AVISO: node_modules (frontend) não existe - Execute: npm install"
    Write-Host "❌ node_modules (frontend) NÃO EXISTE" -ForegroundColor $warningColor
    Write-Host "   Solução: Execute na pasta raiz: npm install" -ForegroundColor $infoColor
}

Write-Host ""

# ============================================================================
# TESTE 4: Estrutura de Pastas
# ============================================================================
Write-Host "📁 TESTE 4: Estrutura de Diretórios" -ForegroundColor $infoColor
Write-Host "-" * 60

$folders = @("src", "server", "public")
$allFoldersExist = $true

foreach ($folder in $folders) {
    if (Test-Path $folder) {
        Write-Host "✅ Pasta '$folder' existe" -ForegroundColor $successColor
    } else {
        Write-Host "❌ Pasta '$folder' NÃO EXISTE" -ForegroundColor $errorColor
        $allFoldersExist = $false
    }
}

if ($allFoldersExist) {
    $passed += "Estrutura de pastas correta"
}

Write-Host ""

# ============================================================================
# TESTE 5: Arquivo .env
# ============================================================================
Write-Host "⚙️  TESTE 5: Configurações Locais" -ForegroundColor $infoColor
Write-Host "-" * 60

if (Test-Path "server/.env") {
    Write-Host "✅ Arquivo 'server/.env' ENCONTRADO" -ForegroundColor $successColor
    $passed += "Arquivo server/.env existe"
} else {
    Write-Host "ℹ️  Arquivo 'server/.env' não encontrado (pode usar variáveis do sistema)" -ForegroundColor $warningColor
}

Write-Host ""

# ============================================================================
# TESTE 6: Status do Backend
# ============================================================================
Write-Host "🚀 TESTE 6: Status do Backend" -ForegroundColor $infoColor
Write-Host "-" * 60

$backendUrl = "http://localhost:4000/"
$prodUrl = "https://soaf-mobile-backend.onrender.com/"

try {
    $response = Invoke-WebRequest -Uri $backendUrl -TimeoutSec 3 -ErrorAction Stop
    Write-Host "✅ Backend LOCAL está RESPONDENDO" -ForegroundColor $successColor
    Write-Host "   URL: $backendUrl" -ForegroundColor $infoColor
    $passed += "Backend local respondendo"
    
    # Teste endpoint de prestadores
    try {
        $prestadores = Invoke-WebRequest -Uri "$($backendUrl)api/prestadores" -TimeoutSec 5 -ErrorAction Stop
        $json = $prestadores.Content | ConvertFrom-Json
        Write-Host "   ✅ Endpoint /api/prestadores respondendo" -ForegroundColor $successColor
        
        if ($json.items.Count -gt 0) {
            Write-Host "   ✅ USUÁRIOS ENCONTRADOS: $($json.items.Count)" -ForegroundColor $successColor
            Write-Host "   Exemplo:" -ForegroundColor $infoColor
            $json.items[0] | ForEach-Object {
                Write-Host "      • CNPJ: $($_.cnpj)" -ForegroundColor $infoColor
                Write-Host "      • NOME: $($_.nome)" -ForegroundColor $infoColor
                Write-Host "      • EMAIL: $($_.email)" -ForegroundColor $infoColor
            }
            $passed += "Prestadores carregados com sucesso"
        } else {
            $issues += "❌ ERRO: Endpoint retorna lista VAZIA (sem usuários)"
            Write-Host "   ❌ PROBLEMA: Lista de prestadores está VAZIA!" -ForegroundColor $errorColor
            Write-Host "   💡 Possíveis causas:" -ForegroundColor $infoColor
            Write-Host "      1. Planilha não tem dados na aba 'DADOS'" -ForegroundColor $infoColor
            Write-Host "      2. Planilha não está compartilhada com service account" -ForegroundColor $infoColor
            Write-Host "      3. Arquivo service-account.json inválido" -ForegroundColor $infoColor
        }
    } catch {
        $issues += "❌ ERRO ao chamar /api/prestadores: $_"
        Write-Host "   ❌ Erro ao chamar /api/prestadores" -ForegroundColor $errorColor
        Write-Host "      $_" -ForegroundColor $errorColor
    }
    
} catch {
    Write-Host "❌ Backend LOCAL NÃO está respondendo" -ForegroundColor $errorColor
    Write-Host "   URL: $backendUrl" -ForegroundColor $warningColor
    Write-Host "   Solução: Execute na pasta 'server': npm start" -ForegroundColor $infoColor
    Write-Host ""
    Write-Host "   Testando backend em PRODUÇÃO..." -ForegroundColor $warningColor
    
    try {
        $response = Invoke-WebRequest -Uri $prodUrl -TimeoutSec 5 -ErrorAction Stop
        Write-Host "   ✅ Backend em PRODUÇÃO está RESPONDENDO" -ForegroundColor $successColor
        Write-Host "   URL: $prodUrl" -ForegroundColor $infoColor
        $passed += "Backend em produção respondendo"
        
        # Teste endpoint de prestadores em produção
        try {
            $prestadores = Invoke-WebRequest -Uri "$($prodUrl)api/prestadores" -TimeoutSec 5 -ErrorAction Stop
            $json = $prestadores.Content | ConvertFrom-Json
            Write-Host "   ✅ Endpoint /api/prestadores respondendo" -ForegroundColor $successColor
            
            if ($json.items.Count -gt 0) {
                Write-Host "   ✅ USUÁRIOS ENCONTRADOS EM PRODUÇÃO: $($json.items.Count)" -ForegroundColor $successColor
                $passed += "Prestadores em produção encontrados"
            } else {
                $issues += "❌ ERRO: Endpoint em produção retorna lista VAZIA"
                Write-Host "   ❌ Lista de prestadores vazia em produção" -ForegroundColor $errorColor
            }
        } catch {
            $issues += "❌ ERRO ao chamar /api/prestadores em produção: $_"
        }
    } catch {
        $issues += "❌ Backend em PRODUÇÃO também não está respondendo"
        Write-Host "   ❌ Backend em PRODUÇÃO também não respondendo" -ForegroundColor $errorColor
    }
}

Write-Host ""

# ============================================================================
# TESTE 7: Planilha Google Sheets
# ============================================================================
Write-Host "📊 TESTE 7: Google Sheets" -ForegroundColor $infoColor
Write-Host "-" * 60

Write-Host "ℹ️  Para verificar a planilha:" -ForegroundColor $infoColor
Write-Host "   1. Acesse: https://docs.google.com/spreadsheets/d/1EiSWfN5--3-fvHB3lc7tHG9Dls8qM5I61y_2ixx-rWI" -ForegroundColor $infoColor
Write-Host "   2. Verifique se existe a aba 'DADOS'" -ForegroundColor $infoColor
Write-Host "   3. Primeira linha deve ter: CNPJ  SENHA  NOME  EMAIL  PRIMEIRO_ACESSO" -ForegroundColor $infoColor
Write-Host "   4. Verifique se tem pelo menos 1 usuário (linha 2)" -ForegroundColor $infoColor
Write-Host "   5. Confirm o compartilhamento com: bot-telegram@saof-462713.iam.gserviceaccount.com" -ForegroundColor $infoColor

Write-Host ""

# ============================================================================
# RESUMO FINAL
# ============================================================================
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  📊 RESUMO DO DIAGNÓSTICO                                      ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ TESTES PASSOU:" -ForegroundColor $successColor
foreach ($p in $passed) {
    Write-Host "   ✓ $p" -ForegroundColor $successColor
}

Write-Host ""

if ($issues.Count -eq 0) {
    Write-Host "🎉 SUCESSO! Nenhum problema encontrado!" -ForegroundColor $successColor
    Write-Host "   O sistema deve estar funcionando corretamente." -ForegroundColor $infoColor
} else {
    Write-Host "⚠️  PROBLEMAS ENCONTRADOS ($($issues.Count)):" -ForegroundColor $errorColor
    foreach ($issue in $issues) {
        Write-Host "   • $issue" -ForegroundColor $errorColor
    }
    Write-Host ""
    Write-Host "💡 Próximos Passos:" -ForegroundColor $warningColor
    Write-Host "   1. Leia o arquivo: DIAGNOSTICO-USUARIOS.md" -ForegroundColor $warningColor
    Write-Host "   2. Encontre sua situação nas 'SOLUÇÕES ESPECÍFICAS'" -ForegroundColor $warningColor
    Write-Host "   3. Siga as instruções tópico por tópico" -ForegroundColor $warningColor
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Pausa antes de fechar
Read-Host "Pressione ENTER para fechar"

# Script de Deploy do Frontend - KNM Telecom
# Automatiza build do Vite e deploy no Firebase Hosting

param(
    [string]$BackendUrl = "http://localhost:4000",
    [switch]$Production
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploy Frontend - KNM Telecom" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Define URL do backend
if ($Production) {
    Write-Host "[INFO] Modo PRODUÇÃO ativado" -ForegroundColor Yellow
    Write-Host "[INFO] Insira a URL pública do backend (ex: https://knm-backend.onrender.com):" -ForegroundColor Yellow
    $BackendUrl = Read-Host "URL do backend"
    
    if ([string]::IsNullOrWhiteSpace($BackendUrl)) {
        Write-Host "[ERRO] URL do backend é obrigatória em modo produção!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[INFO] Modo DESENVOLVIMENTO (backend local)" -ForegroundColor Green
}

Write-Host "[INFO] Backend URL: $BackendUrl" -ForegroundColor Cyan
Write-Host ""

# Cria arquivo .env.production
Write-Host "[1/5] Criando .env.production..." -ForegroundColor Green
$envContent = "VITE_API_URL=$BackendUrl"
Set-Content -Path ".env.production" -Value $envContent -Encoding UTF8
Write-Host "      ✓ .env.production criado com VITE_API_URL=$BackendUrl" -ForegroundColor Gray
Write-Host ""

# Verifica se node_modules existe, caso contrário, executa npm ci
if (-Not (Test-Path "node_modules")) {
    Write-Host "[2/5] Instalando dependências (npm ci)..." -ForegroundColor Green
    npm ci
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Falha ao instalar dependências!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[2/5] Dependências já instaladas, pulando..." -ForegroundColor Gray
}
Write-Host ""

# Build do projeto
Write-Host "[3/5] Gerando build do Vite..." -ForegroundColor Green
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha no build!" -ForegroundColor Red
    exit 1
}
Write-Host "      ✓ Build gerado na pasta 'dist'" -ForegroundColor Gray
Write-Host ""

# Verifica se Firebase CLI está instalado
Write-Host "[4/5] Verificando Firebase CLI..." -ForegroundColor Green
$firebaseInstalled = Get-Command firebase -ErrorAction SilentlyContinue
if (-Not $firebaseInstalled) {
    Write-Host "[AVISO] Firebase CLI não encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g firebase-tools
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Falha ao instalar Firebase CLI!" -ForegroundColor Red
        exit 1
    }
}
Write-Host "      ✓ Firebase CLI pronto" -ForegroundColor Gray
Write-Host ""

# Deploy no Firebase Hosting
Write-Host "[5/5] Fazendo deploy no Firebase Hosting..." -ForegroundColor Green
firebase deploy --only hosting
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha no deploy!" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✓ Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "URLs:" -ForegroundColor Cyan
Write-Host "  Frontend: https://knm-telecom.web.app" -ForegroundColor White
Write-Host "  Backend:  $BackendUrl" -ForegroundColor White
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "  1. Acesse https://knm-telecom.web.app" -ForegroundColor Gray
Write-Host "  2. Teste login com CNPJ da planilha" -ForegroundColor Gray
Write-Host "  3. Verifique todas as 4 abas" -ForegroundColor Gray
Write-Host ""

# Se modo dev, avisa sobre backend
if (-Not $Production) {
    Write-Host "[ATENÇÃO] Você está usando backend LOCAL!" -ForegroundColor Yellow
    Write-Host "          O app NÃO funcionará para outros usuários." -ForegroundColor Yellow
    Write-Host "          Para produção, execute:" -ForegroundColor Yellow
    Write-Host "          .\deploy-frontend.ps1 -Production" -ForegroundColor Cyan
    Write-Host ""
}

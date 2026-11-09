# Execute no PowerShell, dentro da pasta do projeto. Exige Git e GitHub CLI autenticados.
$ErrorActionPreference = 'Stop'
$repository = 'Edsmonteiro/digital-store-backend'

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw 'Instale o Git primeiro.' }
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) { throw 'Instale o GitHub CLI (gh) primeiro.' }
gh auth status
if ($LASTEXITCODE -ne 0) { throw 'Autorize sua conta primeiro com gh auth login.' }
if (Test-Path .git) { throw 'Esta pasta já tem histórico Git. Confirme o remoto antes de publicar.' }
gh repo view $repository *> $null
if ($LASTEXITCODE -eq 0) { throw "Repositório $repository já existe. Faça o push manualmente sem reescrever a história." }

git init
git branch -M main
git add .
git commit -m 'feat: API Digital Store Express MySQL JWT e Swagger'
if ($LASTEXITCODE -ne 0) { throw 'O commit local não foi criado.' }
gh repo create $repository --public --source . --remote origin --push
if ($LASTEXITCODE -ne 0) { throw 'Não foi possível criar ou enviar o repositório.' }
Write-Host "Publicado em https://github.com/$repository"

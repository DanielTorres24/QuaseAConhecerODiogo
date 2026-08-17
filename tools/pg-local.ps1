<#
    Postgres local portatil para testes manuais.

    Nao instala nada no sistema: usa os binarios oficiais extraidos em
    ..\.pgportable\pgsql (fora do repositorio git) e um cluster de dados
    em ..\.pgdata. Nao precisa de permissoes de administrador nem de servico
    do Windows.

    Uso:
      powershell -ExecutionPolicy Bypass -File tools\pg-local.ps1 start
      powershell -ExecutionPolicy Bypass -File tools\pg-local.ps1 stop
      powershell -ExecutionPolicy Bypass -File tools\pg-local.ps1 status
      powershell -ExecutionPolicy Bypass -File tools\pg-local.ps1 reset   # apaga o cluster
#>
param(
  [ValidateSet('start', 'stop', 'status', 'reset')]
  [string]$Action = 'start',
  [int]$Port = 5432,
  [string]$DbName = 'qui_diogo',
  [string]$DbUser = 'postgres'
)

$ErrorActionPreference = 'Stop'

$RepoRoot = Split-Path $PSScriptRoot -Parent
$Parent   = Split-Path $RepoRoot -Parent
$PgHome   = Join-Path $Parent '.pgportable\pgsql'
$PgData   = Join-Path $Parent '.pgdata'
$LogFile  = Join-Path $Parent '.pgdata\server.log'

$PgCtl    = Join-Path $PgHome 'bin\pg_ctl.exe'
$InitDb   = Join-Path $PgHome 'bin\initdb.exe'
$Psql     = Join-Path $PgHome 'bin\psql.exe'
$CreateDb = Join-Path $PgHome 'bin\createdb.exe'

function Assert-Binaries {
  if (-not (Test-Path $PgCtl)) {
    throw "Binarios do Postgres nao encontrados em $PgHome. Ve a seccao 'Base de dados local' no CLAUDE.md."
  }
}

function Test-Running {
  & $PgCtl -D $PgData status *> $null
  return ($LASTEXITCODE -eq 0)
}

switch ($Action) {

  'start' {
    Assert-Binaries

    if (-not (Test-Path (Join-Path $PgData 'PG_VERSION'))) {
      Write-Host "A criar o cluster em $PgData ..."
      # -A trust: sem password em ligacoes locais. Aceitavel porque o cluster
      # so escuta em localhost e existe apenas para testes manuais.
      & $InitDb -D $PgData -U $DbUser -A trust -E UTF8 --locale=C
      if ($LASTEXITCODE -ne 0) { throw "initdb falhou." }
    }

    if (Test-Running) {
      Write-Host "Postgres ja esta a correr."
    }
    else {
      Write-Host "A arrancar o Postgres na porta $Port ..."
      & $PgCtl -D $PgData -l $LogFile -o "-p $Port -c listen_addresses=localhost" -w start
      if ($LASTEXITCODE -ne 0) { throw "Arranque falhou. Ve o log em $LogFile" }
    }

    $exists = & $Psql -U $DbUser -p $Port -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DbName'"
    if (-not $exists) {
      Write-Host "A criar a base de dados '$DbName' ..."
      & $CreateDb -U $DbUser -p $Port $DbName
      if ($LASTEXITCODE -ne 0) { throw "createdb falhou." }
    }

    Write-Host ""
    Write-Host "Pronto: postgresql://$DbUser@localhost:$Port/$DbName"
  }

  'stop' {
    Assert-Binaries
    if (Test-Running) {
      & $PgCtl -D $PgData -m fast -w stop
      Write-Host "Postgres parado."
    }
    else {
      Write-Host "Postgres nao estava a correr."
    }
  }

  'status' {
    Assert-Binaries
    if (Test-Running) {
      & $Psql -U $DbUser -p $Port -d $DbName -c "\dt"
    }
    else {
      Write-Host "Postgres parado."
    }
  }

  'reset' {
    Assert-Binaries
    if (Test-Running) { & $PgCtl -D $PgData -m fast -w stop }
    if (Test-Path $PgData) {
      Remove-Item -Recurse -Force $PgData
      Write-Host "Cluster apagado. Corre 'start' para recriar do zero."
    }
  }
}

@echo off
cd /d "%~dp0"

echo =========================================
echo QUI-DIOGO - Teste local manual
echo =========================================

echo.
echo [1/4] Verificando dependencias...
call npm install
if errorlevel 1 (
  echo Falhou a instalacao das dependencias.
  pause
  exit /b 1
)

echo.
echo [2/4] A aplicar migracoes...
call npm run migrate
if errorlevel 1 (
  echo Falhou as migracoes.
  pause
  exit /b 1
)

echo.
echo [3/4] A popular dados iniciais...
call npm run seed
if errorlevel 1 (
  echo Falhou o seed.
  pause
  exit /b 1
)

echo.
echo [4/4] A iniciar a aplicacao...
start "" http://localhost:3000
call npm run dev

if errorlevel 1 (
  echo.
  echo A aplicacao falhou ao iniciar.
  pause
  exit /b 1
)

@echo off
cd /d "%~dp0"

echo =========================================
echo QUI-DIOGO - Teste local manual
echo =========================================

echo.
echo [1/5] Verificando dependencias...
call npm install
if errorlevel 1 (
  echo Falhou a instalacao das dependencias.
  pause
  exit /b 1
)

echo.
echo [2/5] A arrancar a base de dados local...
call npm run db:start
if errorlevel 1 (
  echo Falhou o arranque da base de dados.
  echo Ve a seccao "Base de dados local" no CLAUDE.md.
  pause
  exit /b 1
)

echo.
echo [3/5] A aplicar migracoes...
call npm run migrate
if errorlevel 1 (
  echo Falhou as migracoes.
  pause
  exit /b 1
)

echo.
echo [4/5] A popular dados iniciais...
call npm run seed
if errorlevel 1 (
  echo Falhou o seed.
  pause
  exit /b 1
)

echo.
echo [5/5] A iniciar a aplicacao...
echo.
echo   Quiz:  http://localhost:3000
echo   Admin: http://localhost:3000/admin  (admin / diogo2026)
echo.
echo   Para parar a base de dados no fim: npm run db:stop
echo.
start "" http://localhost:3000
call npm run dev

if errorlevel 1 (
  echo.
  echo A aplicacao falhou ao iniciar.
  pause
  exit /b 1
)

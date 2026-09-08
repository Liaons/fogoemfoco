@echo off
REM Sobe um servidor local e abre a plataforma no navegador.
REM A plataforma le os dados com fetch, e o navegador bloqueia fetch em file://.
REM Por isso o duplo clique direto no plataforma.html nao carrega os vetores.

setlocal
set PORTA=8000
cd /d "%~dp0"

where py >nul 2>&1 && (set PY=py -3) || (set PY=python)

echo.
echo  Fogo em Foco - servidor local
echo  ------------------------------------
echo  Abrindo http://localhost:%PORTA%/index.html
echo  Feche esta janela para parar o servidor.
echo.

start "" "http://localhost:%PORTA%/index.html"
%PY% -m http.server %PORTA%

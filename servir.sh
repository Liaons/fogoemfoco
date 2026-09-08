#!/usr/bin/env bash
# Sobe um servidor local e abre a plataforma no navegador.
# A plataforma le os dados com fetch, e o navegador bloqueia fetch em file://.
# Por isso o duplo clique direto no plataforma.html nao carrega os vetores.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
PORTA="${1:-8000}"
echo "Fogo em Foco: http://localhost:$PORTA/index.html   (Ctrl+C para parar)"
(command -v xdg-open >/dev/null && xdg-open "http://localhost:$PORTA/index.html" || \
 command -v open >/dev/null && open "http://localhost:$PORTA/index.html") 2>/dev/null &
exec python3 -m http.server "$PORTA"

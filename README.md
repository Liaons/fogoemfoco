# Fogo em Foco: site e plataforma

Diagnóstico dos incêndios da vegetação no Brasil, período de março de 2025 a fevereiro
de 2026. Rede BRASA de Pesquisa e Instituto Nacional de Pesquisas Espaciais.

Publicado em GitHub Pages. São duas páginas estáticas, sem build e sem framework:
`index.html` é a homepage e `plataforma.html` é o mapa interativo.

## Como publicar

Settings, Pages, Source: Deploy from a branch, branch `main`, pasta `/ (root)`.

O `.nojekyll` na raiz é obrigatório. Sem ele o GitHub roda Jekyll, que ignora em silêncio
qualquer arquivo ou pasta começando com `_`.

## Como rodar localmente

Não abra `plataforma.html` com duplo clique: o navegador bloqueia `fetch` sob `file://` e
o mapa aparece sem nenhum vetor em cima. Use `servir.bat` no Windows ou `servir.sh` no
Linux e no macOS.

## De onde vêm os dados

Esta pasta é a saída dos scripts numerados em `codigos/`, no projeto principal, que não
está neste repositório. A ordem é 06 (tabela de correspondência de IDs), 07 (atributos e
séries), 08 (geometrias simplificadas), 09 (validação), 12 (homepage) e 11 (carimbo de
versão). O 12 chama o 11 no fim.

Rode o 11 sempre que rodar o 07 ou o 08. Ele carimba os links de CSS e JS e também o
conteúdo de `dados/`, que é buscado com `fetch` e fica em cache no navegador como
qualquer outro arquivo.

Fontes: área queimada do MODIS MCD64A1, métricas de fogo do Global Fire Atlas,
temperatura e precipitação da reanálise ERA5. Dados sob licença Creative Commons CC BY
4.0. O depósito no Zenodo, com DOI, está em preparação.

Página criada por Henrique Leão, 2026.

# Site do Fogo em Foco

Duas páginas estáticas, sem build e sem framework. Sobem em qualquer servidor de
arquivos.

```
servir.bat          sobe um servidor local no Windows e abre o navegador
servir.sh           o mesmo, no Linux e no macOS
index.html          homepage, gerada por codigos/12_proposta_v2.py
plataforma.html     mapa interativo
assets/
  identidade.css    tokens de cor e tipografia, compartilhados pelas duas páginas
  plataforma.css    estilos do mapa
  plataforma.js     lógica do mapa e do painel
  leaflet.*         bibliotecas embutidas, sem CDN
  topojson.min.js
  chart.umd.min.js
dados/              saída do pipeline; veja dados/LEIA.md
img/                hero e logos
```

## Tipografia

**Big Shoulders Display** nos títulos, números grandes e rótulos; **Instrument Sans** no
texto corrido. As duas ficam versionadas em `assets/fontes/`, 114 KB no total, sem
depender do Google Fonts, que é bloqueado em parte das redes institucionais.

Para trocar a fonte de destaque, mexa em `--display` no `identidade.css` e substitua os
arquivos em `assets/fontes/`.

## Por que as bibliotecas estão no repositório

Leaflet, topojson-client e Chart.js somam 380 KB e ficam versionados junto com o
código. Sem CDN, a plataforma continua funcionando se o serviço externo cair, se a
rede da instituição bloquear o domínio ou se alguém abrir o site sem internet plena.
Para atualizar, baixe a nova versão pelo cdnjs e substitua o arquivo.

## Mapa de fundo

Vem do **Esri World Gray Canvas**, nas variantes clara e escura, conforme o tema.
Não exige chave de API, é gratuito com atribuição, e a atribuição já está no rodapé
do mapa.

## Identidade

A paleta foi amostrada da capa do relatório: o poente laranja no topo descendo para
o azul profundo da base.

| Token | Cor | Uso |
|---|---|---|
| `--laranja` | `#ee5911` | laranja da capa, áreas grandes e realces |
| `--selecionado` | `#1b1e5d` claro / `#33343b` escuro | item ativo nos seletores |
| `--laranja-acao` | `#c9450c` | botões e texto pequeno; contraste AA sobre claro |
| `--ambar` | `#f9a03f` | destaque sobre azul |
| `--azul` | `#1b1e5d` | superfícies escuras |
| `--azul-fundo` | `#121544` | barra do topo, faixa de números, rodapé |
| `--creme` | `#faf5f0` | fundo das páginas |

A rampa de ranque vai do vermelho escuro no pior ano até o azul nos anos mais brandos,
seguindo a lógica de cor do relatório.

No tema escuro a moldura usa cinzas neutros, e não azuis. O azul fica reservado aos
dados, na rampa de ranque: se a interface também for azul, o mapa e a moldura competem
entre si.

## Tema claro e escuro

`assets/tema.js` cuida das duas páginas. Sem escolha salva, o site segue o sistema
operacional pelo `prefers-color-scheme`. Ao clicar no botão, a escolha vai para o
`localStorage` e passa a vencer o sistema. Um script inline no `<head>` aplica o tema
antes da primeira pintura, para a página não piscar branca antes de escurecer.

As cores dos dados não mudam entre os temas. A rampa de ranque é a escala do relatório,
e trocá-la mudaria a leitura do mapa. O que muda é a moldura: fundo, texto, bordas, o
mapa base do CARTO e as duas cores de estado de dado, que precisam continuar
distinguíveis sobre fundo escuro.

O JavaScript lê as cores do CSS com `getComputedStyle`, então trocar o tema é só
redesenhar. Não há paleta duplicada no código.

## Legenda

A legenda flutua sobre o canto inferior esquerdo do mapa, e não ocupa espaço na barra
lateral. É recolhível, e lembra a escolha do leitor. A escala aparece como uma faixa
contínua com as duas pontas rotuladas, em vez de nove amostras empilhadas: ocupa quatro
linhas a menos e a leitura do mapa não depende de saber a posição exata de cada classe.

## Filtro e busca

Nas camadas grandes (municípios, UCs, TIs, assentamentos) aparece um seletor de estado
e um campo de busca. O filtro reduz o que é desenhado e recalcula a escala de cor
apenas sobre o que está visível, o que dá muito mais contraste dentro de um estado do
que a escala nacional. A busca ignora acentos e maiúsculas, prioriza quem começa com o
termo e dá zoom na feição escolhida.

## Como o mapa funciona

A geometria carrega o `rid` (region_id) em cada feição. Os atributos vêm de
`dados/atributos/<Camada>.json`, indexados pelo mesmo `rid`. Quando o usuário clica,
o painel busca as séries em `dados/series/gfa/` e `dados/series/clima/`, usando o
campo `chunk` do registro para saber qual arquivo por UF abrir. 





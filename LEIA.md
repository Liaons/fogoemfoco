# Site do Fogo em Foco

Duas páginas estáticas, sem build e sem framework. Sobem em qualquer servidor de
arquivos, inclusive GitHub Pages.

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

## Como abrir localmente

**Não abra `plataforma.html` com duplo clique.** A plataforma lê os dados com `fetch`,
e o navegador bloqueia `fetch` sob o protocolo `file://`. O resultado é o mapa de fundo
aparecendo e nenhum vetor em cima dele. A página detecta essa situação e explica o que
fazer, em vez de falhar em silêncio.

**Se você mudou um arquivo e a página continua igual, é cache do navegador.** Force
com Ctrl+Shift+R. Para não depender disso, os links de CSS e JS levam um carimbo de
versão (`?v=...`) derivado do conteúdo do arquivo: rode `codigos/11_versionar_assets.py`
depois de mexer em qualquer coisa dentro de `assets/`. O gerador da homepage já chama
esse script sozinho.

No Windows, duplo clique em `servir.bat`. Em Linux ou macOS, `bash servir.sh`. Os dois
sobem um servidor na porta 8000 e abrem o navegador. Feche a janela do terminal para
parar.

Publicado em GitHub Pages ou em qualquer servidor web, o problema não existe: ele só
aparece ao abrir os arquivos direto do disco.

## Tipografia

**Big Shoulders Display** nos títulos, números grandes e rótulos; **Instrument Sans** no
texto corrido. As duas ficam versionadas em `assets/fontes/`, 114 KB no total, sem
depender do Google Fonts, que é bloqueado em parte das redes institucionais.

Para trocar a fonte de destaque, mexa em `--display` no `identidade.css` e substitua os
arquivos em `assets/fontes/`.

## Logos

A marca do Fogo em Foco tem partes brancas: só funciona sobre fundo escuro. Por isso a
barra do topo é escura nas duas páginas. Sobre o creme, sobra um contorno laranja fino e
ilegível.

`logo_fogoemfoco_horizontal.svg` no topo e no rodapé. `logo_fogoemfoco_normal.svg` está
disponível para uso em quadrado, ainda não aplicado.

## Por que as bibliotecas estão no repositório

Leaflet, topojson-client e Chart.js somam 380 KB e ficam versionados junto com o
código. Sem CDN, a plataforma continua funcionando se o serviço externo cair, se a
rede da instituição bloquear o domínio ou se alguém abrir o site sem internet plena.
Para atualizar, baixe a nova versão pelo cdnjs e substitua o arquivo.

## Mapa de fundo

Vem do **Esri World Gray Canvas**, nas variantes clara e escura, conforme o tema.
Não exige chave de API, é gratuito com atribuição, e a atribuição já está no rodapé
do mapa.

O CARTO era a escolha anterior e deixou de servir: o endpoint gratuito
`basemaps.cartocdn.com` passou a devolver os tiles com a marca d'água
"API KEY REQUIRED". Continua respondendo 200, então nada quebra no console; a
mensagem simplesmente aparece desenhada na imagem.

Se um dia quiserem voltar ao CARTO, é preciso criar conta em carto.com, gerar uma
chave e anexá-la à URL do tile. Isso significaria expor a chave no JavaScript
público e depender de um limite de uso gratuito, o que não compensa aqui.

Trocar de provedor é mexer em `--basemap` no `identidade.css` e na função
`trocarBase()` do `plataforma.js`.

Se o mapa de fundo falhar, os polígonos aparecem mesmo assim, só sem os rios e o
relevo embaixo. Vale lembrar que, com preenchimento a 85%, o fundo praticamente só
aparece no oceano e nos vazios entre feições.

## Modelo no Figma

`https://www.figma.com/design/g0FSTqVsbbw9e8mfSAeJZb` — três páginas: Homepage,
Plataforma e Tokens e referência.

As cores das duas telas estão ligadas a variáveis com os modos Claro e Escuro,
espelhando `assets/identidade.css`. Mudar o valor da variável muda as telas junto.
Trocar cor solta dentro de um frame quebra essa ligação e se perde no ajuste seguinte.

Fluxo combinado: ajustes de design saem do Figma, viram código aqui. O caminho
inverso não é automático, então mudanças feitas direto no CSS precisam ser refletidas
no Figma à mão, ou o modelo envelhece.

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
campo `chunk` do registro para saber qual arquivo por UF abrir. Nada é carregado
antes de ser preciso: a abertura custa cerca de 160 KB.

## Três estados de dado, três cores

Isto não é detalhe de implementação, é o ponto mais fácil de errar na leitura do mapa:

- **Colorido** — a feição tem série histórica e ranque.
- **Cinza claro** — está na tabela, mas nunca queimou em vegetação florestal em nenhum
  ano da série. É um zero de verdade.
- **Branco** — não entrou no processamento, provavelmente por ser menor que o pixel de
  500 m do sensor. Não há informação. Não significa que não queimou.

## Pendências

- [ ] Confirmar o denominador de `aq_frac` com a Débora e o Matt. Os valores são razão,
      não porcentagem, apesar de a coluna se chamar "Burned Area Fraction (%)", e o
      denominador parece ser a área florestal, não a área total. A plataforma hoje
      multiplica por 100 e rotula como área florestal.
- [ ] Exportar a seleção em CSV.
- [ ] Camada de eventos de fogo, que exige tiles vetoriais pelos 420 mil polígonos.
- [ ] Focos de calor e dados dos CBMs, ainda não recebidos.

## Carimbo de versão

`codigos/11_versionar_assets.py` carimba duas coisas, e as duas importam:

Os links de CSS e JS nas páginas, com o sha1 do próprio arquivo. Mudou o arquivo, muda a
URL, o navegador busca de novo.

E o conteúdo inteiro de `dados/`, num sha1 só, escrito dentro de `plataforma.js` como
`VERSAO_DADOS`. Os atributos e as geometrias são buscados com `fetch`, e o navegador os
guarda em cache como qualquer outro arquivo. Sem esse carimbo, trocar uma camada não
chega a quem já visitou a página: foi o que aconteceu quando os assentamentos passaram de
2.429 para 8.217. Rode o script sempre que rodar 07 ou 08.

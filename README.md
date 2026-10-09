# Fogo em Foco 2025-2026: site e plataforma

Panorama do fogo no Brasil entre março de 2025 e fevereiro de 2026: área queimada,
métricas dos incêndios, focos de calor, eventos de fogo e clima, em cada estado,
município, bioma, unidade de conservação e terra indígena, comparados com a série
histórica de cada território desde 2002.

Rede BRASA de Pesquisa e Instituto Nacional de Pesquisas Espaciais (INPE).

**No ar:** <https://liaons.github.io/fogoemfoco/>

São duas páginas estáticas, sem build e sem framework, publicadas pelo GitHub Pages:

- `index.html`: a página inicial, com o vídeo de abertura, os números do período, o
  método e a rede.
- `plataforma.html`: o mapa interativo, com o painel de cada área e os downloads.

---

## A plataforma

### Recortes territoriais

| Camada | Feições |
|---|---|
| Estados | 27 |
| Municípios | 5.573 |
| Biomas | 6 |
| Unidades de conservação | 3.247 |
| Terras indígenas | 657 |

O menu flutuante no canto do mapa troca a camada. Nas camadas grandes, um filtro por
estado desenha menos feições e recalcula a escala de cor só sobre o que está visível. Um
duplo clique num estado abre os municípios dele.

### Variáveis do mapa

As variáveis ficam em grupos recolhíveis, na mesma ordem das figuras do relatório:

- **Ranques na série histórica:** área queimada, as cinco métricas do GFA e focos de
  calor. É a posição do período 2025-2026 na série do próprio território, de 1 (maior
  registro desde 2002) a 24.
- **Área queimada (MODIS):** área, fração do território, anomalia contra a média e mês
  de pico da anomalia.
- **Métricas do fogo (GFA):**
  - número de incêndios;
  - tamanho máximo e no percentil 95;
  - taxa de crescimento máxima e no percentil 95.
- **Clima:** temperatura média e precipitação acumulada do período, e a diferença de
  cada uma em relação à média de 2003-2024.
- **Focos de calor:** número de focos no período.
- **Eventos de fogo:**
  - número de eventos;
  - frentes de fogo;
  - duração média;
  - os **ranques espaciais** de eventos e de frentes, que dão a posição da área entre
    todas as da mesma camada no país em 2025.

  Os ranques espaciais não comparam com anos anteriores. Por isso ficam no grupo de
  eventos, com escala própria, e não junto dos ranques da série histórica.

### Painel direito

**Sem uma área aberta**, mostra o resumo da camada na variável do mapa:

- quantas feições têm dado;
- os cinco primeiros e os cinco últimos;
- no mês de pico, a moda da camada.

**Com uma área aberta**, mostra:

- os sete ranques da série, com o ligado à variável do mapa em destaque;
- os números de área queimada;
- a série do GFA de 2002 a 2025, que acompanha a métrica escolhida;
- os focos;
- os eventos por mês e tipo, com os ranques espaciais;
- temperatura e chuva mês a mês, com a diferença em relação à média.

**Busca:** procura em todas as camadas ao mesmo tempo, ignora acentos e mostra a que
camada cada resultado pertence.

### Baixar dados

O botão **Baixar dados**, no topo, abre uma janela com duas abas.

**Dados em tabela (CSV).** Você escolhe:

- os recortes;
- a abrangência: Brasil, um estado ou a área aberta;
- as variáveis, por bloco;
- se quer as séries temporais.

Sai um `.zip` com:

- o CSV no padrão internacional: vírgula como separador, ponto decimal, UTF-8 com BOM;
- `dicionario.csv`, com uma linha por coluna;
- `LEIA.txt`;
- as séries em formato longo, se pedidas.

Tudo é montado no navegador, a partir dos mesmos JSON da plataforma.

**Ficha da área (PDF).** Uma página A4 da área aberta ou de qualquer área achada na busca,
com a variável de mapa que você escolher. Traz:

- os ranques;
- o mapa;
- os números por bloco;
- seis gráficos;
- as fontes e como citar.

A ficha abre a janela de impressão do navegador ("Salvar como PDF") e sai sempre em fundo
claro.

---

## Fontes dos dados

| Bloco | Fonte | Janela |
|---|---|---|
| Área queimada | MODIS MCD64A1, coleção 6.1, 500 m | março a fevereiro, série desde 2002 |
| Métricas do fogo | Global Fire Atlas | março a fevereiro, série desde 2002 |
| Focos de calor | INPE | março a fevereiro, série de 24 períodos |
| Eventos de fogo | INPE, atribuídos pelo centroide | ano civil de 2025 |
| Clima | Reanálise ERA5 (ECMWF) | março a fevereiro, média 2003-2024 |

A área queimada considera só vegetação com pelo menos 30% de cobertura arbórea. Não é a
área queimada total.

O período vai de março a fevereiro, e não de janeiro a dezembro, porque a estação seca
atravessa a virada do ano na maior parte do país.

---

## Rodar localmente

Qualquer servidor de arquivos estáticos serve. Por exemplo, na raiz do repositório:

```bash
python -m http.server 8000
```

Depois abra <http://localhost:8000/>. Abrir o `index.html` direto do disco (`file://`)
não funciona, porque o navegador bloqueia a leitura dos JSON.

---

## Estrutura

```
index.html              página inicial (editada à mão)
plataforma.html         mapa interativo
assets/
  identidade.css        cores e tipografia, compartilhadas pelas duas páginas
  tema.js               tema claro e escuro
  plataforma.css/.js    mapa, legenda, painel e busca
  downloads-nucleo.js   lógica pura do download: CSV, dicionário, zip, mapa em SVG
  downloads.js/.css     janela "Baixar dados" e ficha A4
  hero_fire.mp4         vídeo de abertura da página inicial
  fontes/               Big Shoulders Display e Instrument Sans (woff2)
  leaflet.*, topojson.min.js, chart.umd.min.js
                        bibliotecas embutidas, sem CDN
img/                    logos (versões para fundo escuro e claro) e poster do vídeo
dados/                  saída do pipeline (ver abaixo)
```

Os links de CSS e JS levam um carimbo `?v=<hash>`, e os JSON levam a versão dos dados.
Isso garante que o navegador não sirva uma versão antiga depois de uma atualização. O
carimbo é gerado por `11_versionar_assets.py`, como descrito em "Atualizar os dados".

---

## Dados (`dados/`)

São gerados pelo pipeline. Não edite nada aqui à mão.

```
meta.json                        período, referência do clima, cobertura por camada
busca.json                       índice leve da busca: [region_id, nome, uf, camada]
geo/<camada>.json                geometrias (GeoJSON em UF e biomas; TopoJSON nas demais)
atributos/<Camada>.json          valores do período, por region_id
series/gfa/<Camada>[/UF].json    as cinco métricas do GFA, 2002 a 2025
series/clima/<Camada>[/UF].json  temperatura (média, mínima, máxima) e precipitação,
                                 março a fevereiro, com as médias históricas
series/eventos/<Camada>[/UF].json eventos por mês de início e tipo, janeiro a dezembro de 2025
```

Municípios e UCs têm as séries divididas por UF, para carregar só o estado aberto. O
campo `chunk` do registro diz qual arquivo abrir.

### Chave de junção

Tudo se liga pelo **`region_id`**, único nas camadas e o mesmo das tabelas de origem. O
código oficial da fonte fica no atributo `cod`.

Não use o código oficial como chave: há códigos repetidos em feições divididas em mais
de um polígono.

### Campos de `atributos/`

| Campo | Significado |
|---|---|
| `nome`, `uf`, `cod`, `chunk` | identificação; `chunk` é a UF do arquivo de séries |
| `estado_dado` | `ok` (tem série e ranque), `sem_fogo` (zero em toda a série: o 0 é real), `fora` (não está na tabela de ranque, em geral por ser menor que o pixel) |
| `aq`, `aq_frac` | área queimada em vegetação (km²) e fração do território |
| `aq_ranque` | posição na série desde 2002; 1 é o maior registro |
| `aq_media`, `aq_dp`, `aq_anom_pct`, `aq_anom_dp` | média e desvio padrão da série, anomalia em % e em desvios padrão |
| `mes_pico` | mês do pico da anomalia (só com `estado_dado = ok`) |
| `n_incendios`, `tam_max`, `taxa_max`, `tam_p95`, `taxa_p95` | as cinco métricas do GFA no período |
| `<métrica>_ranque`, `_media`, `_dp`, `_anom_pct`, `_anom_dp` | posição na série, média, desvio padrão e anomalias de cada métrica |
| `focos`, `focos_ranque` | focos no período e posição na série de 24 anos; nulos sem foco |
| `t_periodo`, `t_dif` | temperatura média do período (°C) e diferença da média 2003-2024 (°C) |
| `p_periodo`, `p_dif_pct` | precipitação acumulada (mm) e diferença da média (%) |
| `eventos` | eventos de fogo em 2025 (0 quando não houve) |
| `ev_dur_media`, `ev_dur_max` | duração média sem os eventos acima do percentil 99 do país (nula com menos de 5 eventos) e duração máxima, em dias |
| `ev_frentes` | frentes de fogo dos eventos de 2025 |
| `ev_ranque`, `ev_frentes_ranque` | ranques espaciais de 2025: posição entre todas as áreas da camada no país (1 = mais eventos ou frentes) |

### Cuidados

- **Nulo não é zero.** Feições fora da tabela de ranque (268 municípios, 1.038 UCs e
  36 TIs) têm cor e legenda próprias no mapa. Pintar de zero afirmaria que não
  queimaram.
- **Biomas não têm clima.** Os campos de clima ficam vazios nessa camada.
- **As geometrias são simplificadas.** Servem para a tela, não para medir área: os
  números de área vêm sempre das tabelas.

### Assentamentos: fora desta edição

A camada existe no pipeline, mas está oculta. A análise cobriu 2.429 das 8.217 feições
do INCRA, em doze estados, e o grupo decidiu não publicar uma camada com três quartos do
país em branco.

Para trazer a camada de volta:
- tire `Assentamentos` de `CAMADAS_OCULTAS` em `07_preparar_dados_web.py`;
- descomente a camada em `CAMADAS`, em `assets/plataforma.js`.

---

## Atualizar os dados

O processamento fica fora deste repositório, na pasta `codigos/` do projeto. Para
gravar a saída numa cópia do site, por exemplo um worktree do git, aponte a variável
`FEF_SITE` para essa cópia.

```bash
python 06_gerar_crosswalk.py      # correspondência de identificadores entre as fontes
python 07_preparar_dados_web.py   # atributos, séries, busca e meta
python 09_validar_dados_web.py    # conferência
python 11_versionar_assets.py     # carimbo de versão nos links de CSS, JS e dados
```

O `07` confere se os arquivos de clima chegam até fevereiro do período. Se um arquivo
vier cortado, a série publicada antes fica no ar, e o painel avisa que a referência é a
da versão anterior.

---

## Identidade e decisões técnicas

- **Tipografia:**
  - Big Shoulders Display nos títulos e números, Instrument Sans no texto.
  - As fontes ficam em `assets/fontes/` (114 KB), sem Google Fonts, que é bloqueado em
    parte das redes institucionais.
- **Cores:**
  - A paleta vem da capa do relatório: laranja `#ee5911`, âmbar `#f9a03f`, azul
    `#1b1e5d`, creme `#faf5f0`.
  - A rampa de ranque vai do vermelho escuro (1º) ao azul (24º), em 14 classes iguais
    às das figuras do relatório.
- **Tema claro e escuro:**
  - Sem escolha salva, o site segue o sistema operacional; depois que a pessoa escolhe,
    vale a escolha.
  - O JavaScript lê as cores do CSS. As cores dos dados não mudam entre os temas, só a
    moldura.
- **Bibliotecas embutidas:**
  - Leaflet, topojson-client e Chart.js ficam no repositório, sem CDN.
  - A plataforma continua funcionando se o serviço externo cair ou se a rede bloquear o
    domínio.
- **Mapa de fundo:** Esri World Gray Canvas, claro ou escuro conforme o tema. Não exige
  chave de API, e a atribuição fica no rodapé do mapa.
- **Vídeo de abertura:**
  - Toca mudo, em loop, e pausa fora da tela.
  - Com "reduzir movimento" ou economia de dados ligados, fica o quadro parado
    (`img/hero_fire_poster.jpg`).

---

## Licença, como citar e autoria

Dados sob licença Creative Commons CC BY 4.0. O depósito no Zenodo, com DOI, está em
preparação.

**Como citar:** Fogo em foco: diagnóstico dos incêndios no Brasil em 2025/2026. Rede
Brasa de Pesquisa. – São José dos Campos: INPE, 2026.

Site e plataforma criados por Henrique Leão, 2026.
